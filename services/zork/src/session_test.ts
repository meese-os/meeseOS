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

import {
	assertEquals,
	assertMatch,
	assertStringIncludes,
} from "jsr:@std/assert@1";
import { ZorkSession } from "./session.ts";
import { generateKey, importKey, open, seal } from "./state.ts";

/**
 * The story files are not redistributable, so they are supplied at test time
 * rather than committed. Point ZORK_STORY at a Z-machine file to run these.
 */
const storyPath = Deno.env.get("ZORK_STORY");
const ignore = !storyPath;

const loadStory = () => Deno.readFileSync(storyPath!);

Deno.test({
	name: "boots from story bytes with no filesystem path",
	ignore,
	fn: async () => {
		const session = await ZorkSession.boot(loadStory());
		const intro = session.drain();

		assertStringIncludes(intro, "ZORK I");
		assertStringIncludes(intro, "West of House");
	},
});

Deno.test({
	name: "draws the status line from the grid window",
	ignore,
	fn: async () => {
		const session = await ZorkSession.boot(loadStory());
		session.drain();

		assertStringIncludes(session.status, "West of House");
	},
});

Deno.test({
	name: "plays a command and returns the response",
	ignore,
	fn: async () => {
		const session = await ZorkSession.boot(loadStory());
		session.drain();

		const output = await session.send("open mailbox");

		assertStringIncludes(output, "leaflet");
	},
});

Deno.test({
	name: "carries state across commands within a session",
	ignore,
	fn: async () => {
		const session = await ZorkSession.boot(loadStory());
		session.drain();

		await session.send("open mailbox");
		await session.send("take leaflet");
		const inventory = await session.send("inventory");

		assertStringIncludes(inventory, "leaflet");
	},
});

Deno.test({
	name: "keeps concurrent sessions isolated from one another",
	ignore,
	fn: async () => {
		const story = loadStory();
		const [a, b] = [
			await ZorkSession.boot(story),
			await ZorkSession.boot(story),
		];
		a.drain();
		b.drain();

		await b.send("north");
		const aLook = await a.send("look");
		const bLook = await b.send("look");

		assertStringIncludes(aLook, "West of House");
		assertStringIncludes(bLook, "North of House");
	},
});

Deno.test({
	name: "rejects an unparseable story file",
	ignore,
	fn: async () => {
		// All-zero bytes carry version 0, which no interpreter supports
		await assertRejects(
			() => ZorkSession.boot(new Uint8Array(512)),
			Error,
			"Unsupported Z-machine version",
		);

		await assertRejects(
			() => ZorkSession.boot(new Uint8Array(8)),
			Error,
			"shorter than a header",
		);
	},
});

// Imported late so the assert import above stays grouped with its siblings
import { assertRejects } from "jsr:@std/assert@1";

Deno.test("drain returns an empty string when nothing was printed", () => {
	// Exercises the pure formatting path without booting an interpreter
	const session = Object.create(ZorkSession.prototype) as ZorkSession;
	// deno-lint-ignore no-explicit-any
	(session as any).pending = [];
	assertEquals(session.drain(), "");
});

Deno.test("drain collapses runs of blank lines", () => {
	const session = Object.create(ZorkSession.prototype) as ZorkSession;
	// deno-lint-ignore no-explicit-any
	(session as any).pending = ["\nOne", "\n", "\n", "\n", "Two"];
	assertMatch(session.drain(), /^One\n\nTwo$/);
});

Deno.test({
	name: "captures a snapshot as Quetzal save data",
	ignore,
	fn: async () => {
		const session = await ZorkSession.boot(loadStory());
		session.drain();

		const snapshot = await session.snapshot();

		// Quetzal files are IFF FORM chunks tagged IFZS
		const magic = new TextDecoder().decode(snapshot.slice(0, 4));
		const kind = new TextDecoder().decode(snapshot.slice(8, 12));
		assertEquals(magic, "FORM");
		assertEquals(kind, "IFZS");
	},
});

Deno.test({
	name: "resumes a snapshot into a fresh session at the saved location",
	ignore,
	fn: async () => {
		const story = loadStory();
		const first = await ZorkSession.boot(story);
		first.drain();
		await first.send("north");
		await first.send("north");
		const snapshot = await first.snapshot();

		const resumed = await ZorkSession.resume(story, snapshot);
		const where = await resumed.send("look");

		assertStringIncludes(where, "Forest Path");
	},
});

Deno.test({
	name: "hides the transcript replay that restoring emits",
	ignore,
	fn: async () => {
		const story = loadStory();
		const first = await ZorkSession.boot(story);
		first.drain();
		await first.send("north");
		const snapshot = await first.snapshot();

		const resumed = await ZorkSession.resume(story, snapshot);
		const where = await resumed.send("look");

		// The player has already seen all of this once
		assertEquals(where.includes("history playback"), false);
		assertEquals(where.includes("ZORK I: The Great Underground Empire"), false);
	},
});

Deno.test({
	name: "does not echo the command back to the player",
	ignore,
	fn: async () => {
		const session = await ZorkSession.boot(loadStory());
		session.drain();

		const output = await session.send("open mailbox");

		assertEquals(
			output.split("\n")[0].trim(),
			"Opening the small mailbox reveals a leaflet.",
		);
	},
});

Deno.test({
	name: "snapshots taken at different points resume independently",
	ignore,
	fn: async () => {
		const story = loadStory();
		const session = await ZorkSession.boot(story);
		session.drain();

		const atStart = await session.snapshot();
		await session.send("north");
		const atNorth = await session.snapshot();

		const a = await ZorkSession.resume(story, atStart);
		const b = await ZorkSession.resume(story, atNorth);

		assertStringIncludes(await a.send("look"), "West of House");
		assertStringIncludes(await b.send("look"), "North of House");
	},
});

Deno.test({
	name: "carries a real session through a sealed token and back",
	ignore,
	fn: async () => {
		const story = loadStory();
		const key = await importKey(generateKey());

		const played = await ZorkSession.boot(story);
		played.drain();
		await played.send("north");
		await played.send("north");

		// The whole point: state goes out to the player and comes back, with
		// nothing kept on the server between turns
		const token = await seal(key, {
			game: "zork1",
			snapshot: await played.snapshot(),
		});
		const { snapshot } = await open(key, token);
		const resumed = await ZorkSession.resume(story, snapshot);

		assertStringIncludes(await resumed.send("look"), "Forest Path");
	},
});

Deno.test({
	name: "keeps interpreter state unreadable inside the token",
	ignore,
	fn: async () => {
		const key = await importKey(generateKey());
		const session = await ZorkSession.boot(loadStory());
		session.drain();

		const token = await seal(key, {
			game: "zork1",
			snapshot: await session.snapshot(),
		});

		// Quetzal files are IFF, so an unencrypted one is spottable by its magic
		assertEquals(token.includes("FORM"), false);
		assertEquals(token.includes("IFZS"), false);
	},
});

Deno.test({
	name: "refuses a session token edited by the player",
	ignore,
	fn: async () => {
		const story = loadStory();
		const key = await importKey(generateKey());
		const session = await ZorkSession.boot(story);
		session.drain();

		const token = await seal(key, {
			game: "zork1",
			snapshot: await session.snapshot(),
		});
		const index = token.length - 6;
		const swapped = token[index] === "A" ? "B" : "A";

		await assertRejects(
			() => open(key, token.slice(0, index) + swapped + token.slice(index + 1)),
			Error,
		);
	},
});
