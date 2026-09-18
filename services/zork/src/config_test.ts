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

import { assertEquals, assertRejects, assertThrows } from "jsr:@std/assert@1";
import { loadStory, readConfig } from "./config.ts";

const envFrom = (values: Record<string, string>) => (key: string) =>
	values[key];

Deno.test("requires a sealing key", () => {
	assertThrows(
		() => readConfig(envFrom({})),
		Error,
		"ZORK_STATE_KEY is required",
	);
});

const minimal = {
	ZORK_STATE_KEY: "secret",
	ZORK1_STORY_BASE64: "AAAA",
};

Deno.test("defaults the origin and port", () => {
	const config = readConfig(envFrom(minimal));

	assertEquals(config.origin, "*");
	assertEquals(config.port, 8080);
});

Deno.test("defaults to a single open game", () => {
	const config = readConfig(envFrom(minimal));

	assertEquals(config.games.length, 1);
	assertEquals(config.games[0].id, "zork1");
	assertEquals(config.games[0].passwordHash, null);
	assertEquals(config.defaultGame, "zork1");
});

Deno.test("reads several games, each with its own settings", () => {
	const config = readConfig(envFrom({
		...minimal,
		ZORK_GAMES: "zork1,demo,sample",
		DEMO_STORY_BASE64: "BBBB",
		DEMO_PASSWORD_HASH: "pbkdf2-sha256$1$a$b",
		DEMO_LABEL: "Demo Story",
		SAMPLE_STORY_URL: "https://example.test/sample.z3",
		SAMPLE_PASSWORD_HASH: "pbkdf2-sha256$1$c$d",
	}));

	assertEquals(config.games.map((game) => game.id), [
		"zork1",
		"demo",
		"sample",
	]);
	assertEquals(config.games[0].passwordHash, null);
	assertEquals(config.games[1].label, "Demo Story");
	assertEquals(config.games[1].passwordHash, "pbkdf2-sha256$1$a$b");
	assertEquals(config.games[2].story.url, "https://example.test/sample.z3");
	// The first listed game is what a player gets without asking
	assertEquals(config.defaultGame, "zork1");
});

Deno.test("names the game and variables when a story is missing", () => {
	assertThrows(
		() => readConfig(envFrom({ ...minimal, ZORK_GAMES: "zork1,demo" })),
		Error,
		"DEMO_STORY_BASE64",
	);
});

Deno.test("reads the origin and port when given", () => {
	const config = readConfig(envFrom({
		...minimal,
		ZORK_ALLOWED_ORIGIN: "https://aaronmeese.com",
		PORT: "3000",
	}));

	assertEquals(config.origin, "https://aaronmeese.com");
	assertEquals(config.port, 3000);
});

Deno.test("loads a story inlined as base64", async () => {
	const bytes = new Uint8Array([3, 1, 4, 1, 5]);
	const base64 = btoa(String.fromCharCode(...bytes));

	assertEquals(await loadStory({ base64 }), bytes);
});

Deno.test("explains itself when no story is configured", async () => {
	await assertRejects(
		() => loadStory({}),
		Error,
		"No story file configured",
	);
});

Deno.test("reports a failed story fetch rather than serving nothing", async () => {
	const original = globalThis.fetch;
	globalThis.fetch = () =>
		Promise.resolve(
			new Response("nope", { status: 403, statusText: "Forbidden" }),
		);

	try {
		await assertRejects(
			() => loadStory({ url: "https://example.test/story.z3" }),
			Error,
			"403 Forbidden",
		);
	} finally {
		globalThis.fetch = original;
	}
});

Deno.test("sends the auth header when fetching a private story", async () => {
	const original = globalThis.fetch;
	let seen: string | null = null;
	globalThis.fetch = (_input, init) => {
		seen = new Headers(init?.headers).get("Authorization");
		return Promise.resolve(new Response(new Uint8Array([1, 2, 3])));
	};

	try {
		await loadStory({
			url: "https://example.test/story.z3",
			auth: "Bearer xyz",
		});
		assertEquals(seen, "Bearer xyz");
	} finally {
		globalThis.fetch = original;
	}
});
