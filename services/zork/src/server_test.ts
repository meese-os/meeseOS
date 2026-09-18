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

import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { createHandler, type TurnResponse } from "./server.ts";
import { generateKey, importKey } from "./state.ts";
import { hashPassword } from "./password.ts";

const storyPath = Deno.env.get("ZORK_STORY");
const ignore = !storyPath;

const handler = async (
	extra: { id: string; passwordHash?: string | null }[] = [],
) => {
	const story = Deno.readFileSync(storyPath!);

	return createHandler({
		games: [
			{ id: "zork1", story },
			...extra.map((game) => ({ ...game, story })),
		],
		defaultGame: "zork1",
		key: await importKey(generateKey()),
		origin: "https://example.test",
	});
};

const post = (body: unknown) =>
	new Request("https://zork.test/turn", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

const turn = async (
	handle: (r: Request) => Promise<Response>,
	body: unknown,
): Promise<TurnResponse> => await (await handle(post(body))).json();

Deno.test({
	name: "starts a session when no token is supplied",
	ignore,
	fn: async () => {
		const result = await turn(await handler(), {});

		assertStringIncludes(result.output, "West of House");
		assertStringIncludes(result.status, "West of House");
		assertEquals(typeof result.token, "string");
	},
});

Deno.test({
	name: "plays a command and carries the session forward",
	ignore,
	fn: async () => {
		const handle = await handler();
		const start = await turn(handle, {});
		const moved = await turn(handle, { token: start.token, command: "north" });
		const looked = await turn(handle, { token: moved.token, command: "look" });

		assertStringIncludes(moved.output, "North of House");
		assertStringIncludes(looked.output, "North of House");
	},
});

Deno.test({
	name: "keeps two players from seeing each other's session",
	ignore,
	fn: async () => {
		const handle = await handler();
		const a = await turn(handle, {});
		const b = await turn(handle, {});

		const aMoved = await turn(handle, { token: a.token, command: "north" });
		const bLooked = await turn(handle, { token: b.token, command: "look" });

		assertStringIncludes(aMoved.output, "North of House");
		assertStringIncludes(bLooked.output, "West of House");
	},
});

Deno.test({
	name: "rejects a token it did not issue",
	ignore,
	fn: async () => {
		const response = await (await handler())(
			post({ token: "not-a-real-token-at-all" }),
		);

		assertEquals(response.status, 401);
	},
});

Deno.test({
	name: "rejects an oversized command",
	ignore,
	fn: async () => {
		const response = await (await handler())(
			post({ command: "x".repeat(1000) }),
		);

		assertEquals(response.status, 400);
		assertStringIncludes((await response.json()).error, "too long");
	},
});

Deno.test({
	name: "rejects a multi-line command",
	ignore,
	fn: async () => {
		const response = await (await handler())(post({ command: "north\nsouth" }));

		assertEquals(response.status, 400);
		assertStringIncludes((await response.json()).error, "single line");
	},
});

Deno.test({
	name: "rejects a command of the wrong type",
	ignore,
	fn: async () => {
		const response = await (await handler())(post({ command: 42 }));

		assertEquals(response.status, 400);
	},
});

Deno.test({
	name: "rejects anything that is not a POST",
	ignore,
	fn: async () => {
		const response = await (await handler())(
			new Request("https://zork.test/turn", { method: "GET" }),
		);

		assertEquals(response.status, 405);
	},
});

Deno.test({
	name: "answers a CORS preflight",
	ignore,
	fn: async () => {
		const response = await (await handler())(
			new Request("https://zork.test/turn", { method: "OPTIONS" }),
		);

		assertEquals(response.status, 204);
		assertEquals(
			response.headers.get("Access-Control-Allow-Origin"),
			"https://example.test",
		);
	},
});

Deno.test({
	name: "never puts interpreter state in the clear on the wire",
	ignore,
	fn: async () => {
		const handle = await handler();
		const body = await (await handle(post({}))).text();

		// Quetzal saves are IFF, so an unsealed one would be spottable
		assertEquals(body.includes("FORM"), false);
		assertEquals(body.includes("IFZS"), false);
	},
});

Deno.test({
	name: "refuses to start a locked game without a password",
	ignore,
	fn: async () => {
		const handle = await handler([
			{ id: "demo", passwordHash: await hashPassword("open-sesame") },
		]);

		const response = await handle(post({ game: "demo" }));
		const body = await response.json();

		assertEquals(response.status, 401);
		assertEquals(body.needsPassword, true);
	},
});

Deno.test({
	name: "refuses a locked game when the password is wrong",
	ignore,
	fn: async () => {
		const handle = await handler([
			{ id: "demo", passwordHash: await hashPassword("open-sesame") },
		]);

		const response = await handle(
			post({ game: "demo", password: "wrong-one" }),
		);

		assertEquals(response.status, 401);
		assertStringIncludes((await response.json()).error, "Wrong password");
	},
});

Deno.test({
	name: "starts a locked game when the password is right",
	ignore,
	fn: async () => {
		const handle = await handler([
			{ id: "demo", passwordHash: await hashPassword("open-sesame") },
		]);

		const result = await turn(handle, {
			game: "demo",
			password: "open-sesame",
		});

		assertEquals(result.game, "demo");
		assertStringIncludes(result.output, "West of House");
	},
});

Deno.test({
	name: "does not ask for the password again on later turns",
	ignore,
	fn: async () => {
		const handle = await handler([
			{ id: "demo", passwordHash: await hashPassword("open-sesame") },
		]);

		const start = await turn(handle, { game: "demo", password: "open-sesame" });
		// The token already identifies its game
		const next = await turn(handle, { token: start.token, command: "north" });

		assertEquals(next.game, "demo");
		assertStringIncludes(next.output, "North of House");
	},
});

Deno.test({
	name: "will not let a token for one game be played as another",
	ignore,
	fn: async () => {
		const handle = await handler([
			{ id: "demo", passwordHash: await hashPassword("open-sesame") },
		]);

		const start = await turn(handle, {});
		// The game is sealed inside the token, so asking for another is ignored
		const next = await turn(handle, {
			token: start.token,
			game: "demo",
			command: "look",
		});

		assertEquals(next.game, "zork1");
	},
});

Deno.test({
	name: "rejects a game it does not know",
	ignore,
	fn: async () => {
		const response = await (await handler())(post({ game: "zork9" }));

		assertEquals(response.status, 400);
		assertStringIncludes((await response.json()).error, "Unknown game");
	},
});

Deno.test({
	name: "rejects a game identifier of the wrong type",
	ignore,
	fn: async () => {
		const response = await (await handler())(post({ game: 2 }));

		assertEquals(response.status, 400);
	},
});
