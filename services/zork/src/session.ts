/**
 * MeeseOS - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2022-Present, Aaron Meese <aaron@meese.dev>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 * 	 and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 * 	 without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Aaron Meese <aaron@meese.dev>
 * @licence Modified BSD License
 */

import { MemoryDialog, SAVE_PATH, STORY_PATH } from "./dialog.ts";

/** Size of a Z-machine header, and so the smallest possible story file. */
const HEADER_BYTES = 64;

/** Z-machine revisions the interpreter understands. */
const MIN_VERSION = 1;
const MAX_VERSION = 8;

/** How long a single turn may take before we give up on the interpreter. */
const TURN_TIMEOUT_MS = 15_000;

/**
 * On restore, bocfel replays the whole transcript into the output window. The
 * player has already seen all of it, so everything between these markers is
 * dropped.
 */
const PLAYBACK_START = "[Starting history playback]";
const PLAYBACK_END = "[End of history playback]";

interface LineInput {
	id: number;
	type: string;
}

interface SpecialInput {
	type: string;
	filemode?: string;
	filetype?: string;
}

/**
 * One line of interpreter output, as GlkOte delivers it.
 *
 * emglken emits `{style, text}` objects. Older GlkOte hosts emit a flat array
 * alternating style name and text. Both shapes appear in the wild.
 */
type ContentRun = string | { text?: string };

interface GlkOteLine {
	content?: ContentRun[];
	append?: boolean;
}

/** Buffer windows carry prose in `text`; grid windows carry the status line. */
interface GlkOteWindow {
	text?: GlkOteLine[];
	lines?: GlkOteLine[];
}

interface GlkOteUpdate {
	gen?: number;
	content?: GlkOteWindow[];
	input?: LineInput[];
	specialinput?: SpecialInput;
}

/**
 * A single Z-machine session.
 *
 * The interpreter is a WebAssembly instance with its own linear memory, so
 * sessions are isolated from one another even inside a single isolate. That is
 * the property the pure-JavaScript interpreters could not offer, and it is what
 * makes one session per request safe here.
 *
 * Turn completion is driven by the GlkOte protocol rather than by polling: an
 * update either asks for a file reference, which is answered immediately and
 * leaves the turn open, or advertises line input, which ends the turn. Polling
 * for quiescence looked simpler but was timing-dependent, and silently
 * abandoned saves and restores under load.
 */
export class ZorkSession {
	private iface: { accept(event: unknown): void } | null = null;
	private dialog: MemoryDialog | null = null;
	private pending: string[] = [];
	private waiting: LineInput | null = null;
	private generation = 0;
	private onPrompt: (() => void) | null = null;

	/** The status line, as the interpreter last drew it. */
	status = "";

	private constructor() {}

	/**
	 * Boots an interpreter from story bytes and runs it up to the first prompt.
	 *
	 * @param story The raw story file
	 * @returns A session parked on the opening prompt
	 */
	static async boot(story: Uint8Array): Promise<ZorkSession> {
		ZorkSession.assertPlayable(story);

		const session = new ZorkSession();

		// emglken calls exactly two methods on a GlkOte, so implement them
		// rather than subclassing the bundled RemGlk. That class also wires up
		// stdin, readline and a process-wide stdio singleton, none of which a
		// server wants, and none of which is scoped per session.
		const glkote = {
			init: async (options: { accept(event: unknown): Promise<void> }) => {
				session.iface = options;
				await options.accept({
					type: "init",
					gen: 0,
					metrics: { width: 80, height: 25 },
					// Without fileref_prompt the interpreter silently declines
					// to save: it asks for a filename through special input,
					// not through Dialog.prompt().
					support: ["fileref_prompt", "timer"],
				});
			},
			update: (data: GlkOteUpdate) => session.absorb(data),
		};

		const dialog = new MemoryDialog(story);
		session.dialog = dialog;
		await dialog.init({ GlkOte: glkote });

		const reachedPrompt = session.nextPrompt();

		const engine = (await import("npm:emglken@0.7.2/build/bocfel.js")).default;
		const vm = await engine();
		vm.start({ arguments: [STORY_PATH], Dialog: dialog, GlkOte: glkote });

		await reachedPrompt;

		return session;
	}

	/**
	 * Rejects input that is obviously not a story file.
	 *
	 * Without this the interpreter aborts somewhere inside WebAssembly and
	 * never reaches a prompt, so the only symptom is a turn timeout many
	 * seconds later.
	 *
	 * @param story The bytes to check
	 */
	private static assertPlayable(story: Uint8Array) {
		if (story.length < HEADER_BYTES) {
			throw new Error(
				`Not a story file: ${story.length} bytes is shorter than a header`,
			);
		}

		// The first byte of a Z-machine file is its version number
		const version = story[0];
		if (version < MIN_VERSION || version > MAX_VERSION) {
			throw new Error(`Unsupported Z-machine version: ${version}`);
		}
	}

	/** Collects the text of a content run, tolerating both GlkOte shapes. */
	private static runText(content: ContentRun[] = []): string {
		return content
			.map((run, index) =>
				typeof run === "string"
					? (index % 2 === 1 ? run : "")
					: (run.text ?? "")
			)
			.join("");
	}

	/**
	 * Handles one GlkOte update: buffer windows carry the prose, grid windows
	 * carry the status line.
	 */
	private absorb(data: GlkOteUpdate) {
		this.generation = data.gen ?? this.generation;

		for (const window of data.content ?? []) {
			if (window.lines) {
				this.status = window.lines
					.map((line) => ZorkSession.runText(line.content).trim())
					.join(" ");
				continue;
			}

			for (const line of window.text ?? []) {
				const text = ZorkSession.runText(line.content);
				this.pending.push(line.append ? text : `\n${text}`);
			}
		}

		// A file request means the turn is mid-flight. There is only one save
		// slot per session, so answer it rather than asking anyone, and keep
		// waiting for the prompt that follows.
		if (data.specialinput) {
			const usage = data.specialinput.type;

			// Deferred rather than answered inline: this runs inside the
			// interpreter's own update callback, and re-entering it there makes
			// the save or restore silently do nothing.
			queueMicrotask(() =>
				this.iface?.accept({
					type: "specialresponse",
					gen: this.generation,
					response: "fileref_prompt",
					// The interpreter echoes the request kind back here, not
					// the file type; `filetype` leaves it wedged forever.
					value: { filename: SAVE_PATH, usage },
				})
			);
			return;
		}

		const line = (data.input ?? []).find((input) => input.type === "line");
		if (!line) return;

		this.waiting = line;
		const resolve = this.onPrompt;
		this.onPrompt = null;
		resolve?.();
	}

	/**
	 * Resolves when the interpreter next asks for a line of input.
	 *
	 * @returns A promise for the next prompt
	 */
	private nextPrompt(): Promise<void> {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.onPrompt = null;
				reject(new Error("The interpreter never returned to a prompt"));
			}, TURN_TIMEOUT_MS);

			this.onPrompt = () => {
				clearTimeout(timer);
				resolve();
			};
		});
	}

	/**
	 * Strips the parts of the transcript the player should not see again: the
	 * echo of their own command, the bare prompt, and any replayed history.
	 */
	private static clean(raw: string, command?: string): string {
		let text = raw;

		const start = text.indexOf(PLAYBACK_START);
		const end = text.indexOf(PLAYBACK_END);
		if (start !== -1 && end !== -1) {
			text = text.slice(0, start) + text.slice(end + PLAYBACK_END.length);
		}

		return text
			.split("\n")
			.filter((line) => {
				const trimmed = line.trim();
				if (trimmed === ">") return false;
				if (command && trimmed === command.trim()) return false;
				return true;
			})
			.join("\n")
			.replace(/\n{3,}/g, "\n\n")
			.trim();
	}

	/** Takes everything the interpreter has printed since the last call. */
	drain(): string {
		const raw = this.pending.join("");
		this.pending = [];

		return ZorkSession.clean(raw);
	}

	/**
	 * Sends one command and returns everything printed in response.
	 *
	 * @param command The player's input
	 * @returns The interpreter's output
	 */
	async send(command: string): Promise<string> {
		if (!this.iface || !this.waiting) {
			throw new Error("The interpreter is not waiting for input");
		}

		this.pending = [];
		const window = this.waiting.id;
		this.waiting = null;

		const reachedPrompt = this.nextPrompt();
		this.iface.accept({
			type: "line",
			gen: this.generation,
			window,
			value: command,
		});
		await reachedPrompt;

		const raw = this.pending.join("");
		this.pending = [];

		return ZorkSession.clean(raw, command);
	}

	/**
	 * Captures the interpreter's state as a Quetzal save file.
	 *
	 * emglken exposes no autosave hook, so this drives the Z-machine's own SAVE
	 * opcode and collects what it writes through the dialog.
	 *
	 * @returns The save data
	 */
	async snapshot(): Promise<Uint8Array> {
		await this.send("save");

		const saved = await this.dialog?.read(SAVE_PATH);
		if (!saved) {
			throw new Error("The interpreter did not produce a save file");
		}

		return saved;
	}

	/**
	 * Boots a session and winds it forward to a previously captured state.
	 *
	 * @param story The raw story file
	 * @param snapshot Save data from {@link ZorkSession.snapshot}
	 * @returns A session parked where the snapshot left off
	 */
	static async resume(
		story: Uint8Array,
		snapshot: Uint8Array,
	): Promise<ZorkSession> {
		const session = await ZorkSession.boot(story);
		await session.dialog?.write({ [SAVE_PATH]: snapshot });
		await session.send("restore");
		session.drain();

		return session;
	}
}
