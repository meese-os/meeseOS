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
 * PBKDF2 iterations. High because the only thing standing between a guesser
 * and the next game is this check, and because Deno Deploy bills CPU against a
 * monthly budget rather than capping it per request.
 */
const ITERATIONS = 600_000;

/** Salt length, in bytes. */
const SALT_BYTES = 16;

/** Derived key length, in bits. */
const DERIVED_BITS = 256;

const PREFIX = "pbkdf2-sha256";

const encoder = new TextEncoder();

/** Encodes bytes as base64, which survives an environment variable. */
const encode = (bytes: Uint8Array): string =>
	btoa(String.fromCharCode(...bytes));

/** Reverses {@link encode}. */
const decode = (value: string): Uint8Array =>
	Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

/**
 * Derives key material from a password and salt.
 *
 * @param password The password to stretch
 * @param salt The salt to stretch it with
 * @param iterations How many rounds to apply
 * @returns The derived bytes
 */
const derive = async (
	password: string,
	salt: Uint8Array,
	iterations: number,
): Promise<Uint8Array> => {
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password) as BufferSource,
		"PBKDF2",
		false,
		["deriveBits"],
	);

	const bits = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
		key,
		DERIVED_BITS,
	);

	return new Uint8Array(bits);
};

/**
 * Compares two byte strings without leaking where they first differ.
 *
 * @param a The first value
 * @param b The second value
 * @returns Whether they match
 */
const equals = (a: Uint8Array, b: Uint8Array): boolean => {
	if (a.length !== b.length) return false;

	let difference = 0;
	for (let index = 0; index < a.length; index++) {
		difference |= a[index] ^ b[index];
	}

	return difference === 0;
};

/**
 * Hashes a password for storage alongside a game.
 *
 * @param password The password a player must find
 * @returns An encoded hash, safe to put in configuration
 */
export const hashPassword = async (password: string): Promise<string> => {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const derived = await derive(password, salt, ITERATIONS);

	return [PREFIX, ITERATIONS, encode(salt), encode(derived)].join("$");
};

/**
 * Checks a password against an encoded hash.
 *
 * @param password The password the player supplied
 * @param encoded A hash from {@link hashPassword}
 * @returns Whether the password matches
 * @throws If the stored hash is not in a recognised format
 */
export const verifyPassword = async (
	password: string,
	encoded: string,
): Promise<boolean> => {
	const [prefix, iterations, salt, expected] = encoded.split("$");

	if (prefix !== PREFIX || !iterations || !salt || !expected) {
		throw new Error("Unrecognised password hash format");
	}

	const rounds = Number(iterations);
	if (!Number.isInteger(rounds) || rounds < 1) {
		throw new Error("Unrecognised password hash format");
	}

	// The stored iteration count is used rather than the current constant, so
	// raising ITERATIONS later does not invalidate hashes already in place
	const derived = await derive(password, decode(salt), rounds);

	return equals(derived, decode(expected));
};
