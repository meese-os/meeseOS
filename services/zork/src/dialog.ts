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

/**
 * The story file the interpreter is told to open. Nothing ever reads this path
 * from a disk; it is only the key the in-memory dialog answers to.
 */
export const STORY_PATH = "/story.z3";

/**
 * Where the interpreter is told to put its save data. Also only a map key.
 */
export const SAVE_PATH = "/session.qzl";

/**
 * A Glk Dialog backed entirely by memory.
 *
 * emglken does not expose the Emscripten filesystem, so the only seam for
 * handing it a story file is `Dialog.read()`. The stock `CheapAsyncDialog`
 * resolves that against the real filesystem and calls `process.cwd()` and
 * `os.tmpdir()`, none of which exist on Deno Deploy. This replacement keeps
 * every byte in a Map, so the service needs no filesystem at all and the story
 * never touches disk.
 */
export class MemoryDialog {
	/**
	 * emglken refuses any Dialog that does not declare itself async; it awaits
	 * every call rather than expecting synchronous returns.
	 */
	readonly async = true;

	private files = new Map<string, Uint8Array>();

	constructor(story: Uint8Array) {
		this.files.set(STORY_PATH, story);
	}

	init(_options: unknown): Promise<void> {
		return Promise.resolve();
	}

	get_dirs() {
		// Purely nominal: every path resolves inside the in-memory map
		return {
			storyfile: "/",
			system_cwd: "/",
			temp: "/tmp",
			working: "/",
		};
	}

	/**
	 * The native side deserializes this into a struct, so it must return the
	 * shape below rather than null.
	 */
	set_storyfile_dir(path: string) {
		return {
			storyfile: path,
			working: path,
		};
	}

	read(path: string): Promise<Uint8Array | null> {
		return Promise.resolve(this.files.get(path) ?? null);
	}

	/**
	 * Takes a map of path to contents, matching the reference dialog: the
	 * interpreter batches its writes rather than issuing them one at a time.
	 */
	write(files: Record<string, Uint8Array>): Promise<void> {
		for (const [path, data] of Object.entries(files)) {
			// Copied, not referenced: the interpreter hands over a view into
			// its own WebAssembly heap, which it goes on reusing. Keeping the
			// reference yields a save file that quietly rots into "corrupted
			// save file or not a save file at all" by the time it is read back.
			this.files.set(path, new Uint8Array(data));
		}

		return Promise.resolve();
	}

	exists(path: string): Promise<boolean> {
		return Promise.resolve(this.files.has(path));
	}

	delete(path: string): Promise<void> {
		this.files.delete(path);

		return Promise.resolve();
	}

	/**
	 * The interpreter asks for a filename when the player types SAVE or RESTORE.
	 * Session state is handled out of band, so refuse rather than inventing one.
	 */
	prompt(_extension: string, _save: boolean): Promise<null> {
		return Promise.resolve(null);
	}
}
