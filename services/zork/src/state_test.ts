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
	assertNotEquals,
	assertRejects,
} from "jsr:@std/assert@1";
import { generateKey, importKey, open, seal } from "./state.ts";

const payload = () => new TextEncoder().encode("interpreter state goes here");

const stateOf = (snapshot: Uint8Array, game = "zork1") => ({ game, snapshot });

const freshKey = () => importKey(generateKey());

Deno.test("round-trips state through a token", async () => {
	const key = await freshKey();
	const original = payload();

	const opened = await open(key, await seal(key, stateOf(original)));

	assertEquals(opened.snapshot, original);
	assertEquals(opened.game, "zork1");
});

Deno.test("produces a different token every time", async () => {
	const key = await freshKey();
	const state = payload();

	// A fresh nonce per seal, so identical state is not recognisable as such
	assertNotEquals(
		await seal(key, stateOf(state)),
		await seal(key, stateOf(state)),
	);
});

Deno.test("does not leak the state into the token", async () => {
	const key = await freshKey();
	const secret = new TextEncoder().encode("SENTINEL-VALUE-HERE");

	const token = await seal(key, stateOf(secret));

	assertEquals(token.includes("SENTINEL"), false);
	assertEquals(
		atob(token.replaceAll("-", "+").replaceAll("_", "/")).includes("SENTINEL"),
		false,
	);
});

Deno.test("refuses a token sealed with a different key", async () => {
	const token = await seal(await freshKey(), stateOf(payload()));
	const otherKey = await freshKey();

	await assertRejects(
		() => open(otherKey, token),
		Error,
		"could not be opened",
	);
});

Deno.test("refuses a token whose ciphertext was edited", async () => {
	const key = await freshKey();
	const token = await seal(key, stateOf(payload()));

	// Flip a character in the sealed body, past the header and nonce
	const index = token.length - 5;
	const swapped = token[index] === "A" ? "B" : "A";
	const tampered = token.slice(0, index) + swapped + token.slice(index + 1);

	await assertRejects(() => open(key, tampered), Error, "could not be opened");
});

Deno.test("refuses a token whose expiry was edited", async () => {
	const key = await freshKey();
	const token = await seal(key, stateOf(payload()));

	// The header is authenticated even though it travels in the clear
	const index = 3;
	const swapped = token[index] === "A" ? "B" : "A";
	const tampered = token.slice(0, index) + swapped + token.slice(index + 1);

	await assertRejects(() => open(key, tampered), Error);
});

Deno.test("refuses a token that has expired", async () => {
	const key = await freshKey();
	const token = await seal(key, stateOf(payload()), -1);

	await assertRejects(() => open(key, token), Error, "has expired");
});

Deno.test("refuses a truncated token", async () => {
	const key = await freshKey();

	await assertRejects(() => open(key, "AAAA"), Error, "Malformed");
});

Deno.test("refuses a key of the wrong length", async () => {
	await assertRejects(
		() => importKey("AAAA"),
		Error,
		"must be 32 bytes",
	);
});

Deno.test("generates keys of the required length", async () => {
	// Throws if the length is wrong, so importing is the assertion
	await importKey(generateKey());
	assertNotEquals(generateKey(), generateKey());
});

Deno.test("compresses the state it seals", async () => {
	const key = await freshKey();
	// Highly repetitive, so a compressed token must come out far smaller than
	// the base64 of the raw bytes would be
	const repetitive = new Uint8Array(4096).fill(7);

	const token = await seal(key, stateOf(repetitive));

	assertEquals(token.length < 200, true);
	assertEquals((await open(key, token)).snapshot, repetitive);
});

Deno.test("round-trips state that does not compress", async () => {
	const key = await freshKey();
	const random = crypto.getRandomValues(new Uint8Array(2048));

	assertEquals(
		(await open(key, await seal(key, stateOf(random)))).snapshot,
		random,
	);
});

Deno.test("round-trips empty state", async () => {
	const key = await freshKey();
	const empty = new Uint8Array(0);

	assertEquals(
		(await open(key, await seal(key, stateOf(empty)))).snapshot,
		empty,
	);
});

Deno.test("carries the game identifier through the token", async () => {
	const key = await freshKey();

	const opened = await open(key, await seal(key, stateOf(payload(), "sample")));

	assertEquals(opened.game, "sample");
});

Deno.test("does not reveal which game a token is for", async () => {
	const key = await freshKey();

	const token = await seal(key, stateOf(payload(), "sample"));

	// The game identifier is sealed, not carried in the clear
	assertEquals(token.includes("sample"), false);
});

Deno.test("refuses to seal without a game identifier", async () => {
	const key = await freshKey();

	await assertRejects(
		() => seal(key, stateOf(payload(), "")),
		Error,
		"needs a game identifier",
	);
});
