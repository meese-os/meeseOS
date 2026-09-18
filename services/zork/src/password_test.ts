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
import { hashPassword, verifyPassword } from "./password.ts";

Deno.test("accepts the correct password", async () => {
	const hash = await hashPassword("correct-horse");

	assertEquals(await verifyPassword("correct-horse", hash), true);
});

Deno.test("rejects the wrong password", async () => {
	const hash = await hashPassword("correct-horse");

	assertEquals(await verifyPassword("wrong-horse", hash), false);
});

Deno.test("rejects a near miss", async () => {
	const hash = await hashPassword("correct-horse");

	assertEquals(await verifyPassword("Correct-Horse", hash), false);
	assertEquals(await verifyPassword("xyzz", hash), false);
	assertEquals(await verifyPassword("", hash), false);
});

Deno.test("salts every hash, so the same password hashes differently", async () => {
	assertNotEquals(
		await hashPassword("correct-horse"),
		await hashPassword("correct-horse"),
	);
});

Deno.test("does not store the password anywhere in the hash", async () => {
	const hash = await hashPassword("correct-horse");

	assertEquals(hash.includes("correct-horse"), false);
});

Deno.test("honours the iteration count stored with the hash", async () => {
	// Raising the constant later must not invalidate hashes already deployed
	const hash = await hashPassword("correct-horse");
	const [prefix, iterations, salt, digest] = hash.split("$");

	assertEquals(prefix, "pbkdf2-sha256");
	assertEquals(Number(iterations) > 0, true);
	assertEquals(
		await verifyPassword(
			"correct-horse",
			[prefix, iterations, salt, digest].join("$"),
		),
		true,
	);
});

Deno.test("refuses a hash in an unknown format", async () => {
	await assertRejects(
		() => verifyPassword("correct-horse", "md5$whatever"),
		Error,
		"Unrecognised password hash format",
	);

	await assertRejects(
		() => verifyPassword("correct-horse", "pbkdf2-sha256$notanumber$a$b"),
		Error,
		"Unrecognised password hash format",
	);
});

Deno.test("handles passwords outside ASCII", async () => {
	const hash = await hashPassword("zork-ünïcode-🗝");

	assertEquals(await verifyPassword("zork-ünïcode-🗝", hash), true);
	assertEquals(await verifyPassword("zork-unicode-", hash), false);
});
