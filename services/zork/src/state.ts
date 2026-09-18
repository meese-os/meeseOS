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
 * Format marker. Bumping this invalidates every token in circulation, which is
 * the intended way to roll out an incompatible change to the envelope.
 */
const VERSION = 1;

/** AES-GCM nonce length, in bytes, as recommended for the mode. */
const NONCE_BYTES = 12;

/** Required key length for AES-256. */
const KEY_BYTES = 32;

/**
 * How long a token stays valid. Long enough that nobody loses a session to a
 * lunch break, short enough that a leaked token is not useful forever.
 */
const DEFAULT_LIFETIME_SECONDS = 12 * 60 * 60;

/**
 * Compresses bytes with gzip.
 *
 * Quetzal saves compress by roughly 45% at the start of a game and 65% once it
 * is underway, which is the difference between a token that outgrows a cookie
 * within twenty moves and one that stays near 2 KiB indefinitely.
 *
 * @param bytes The bytes to compress
 * @returns The compressed bytes
 */
const compress = async (
	bytes: Uint8Array,
): Promise<Uint8Array<ArrayBuffer>> => {
	const stream = new Blob([bytes as BufferSource]).stream()
		.pipeThrough(new CompressionStream("gzip"));

	return new Uint8Array(await new Response(stream).arrayBuffer());
};

/**
 * Reverses {@link compress}.
 *
 * @param bytes The compressed bytes
 * @returns The original bytes
 */
const decompress = async (
	bytes: Uint8Array,
): Promise<Uint8Array<ArrayBuffer>> => {
	const stream = new Blob([bytes as BufferSource]).stream()
		.pipeThrough(new DecompressionStream("gzip"));

	return new Uint8Array(await new Response(stream).arrayBuffer());
};

/**
 * Decodes a base64url string, tolerating absent padding.
 *
 * @param value The encoded text
 * @returns The decoded bytes
 */
const fromBase64Url = (value: string): Uint8Array<ArrayBuffer> => {
	const padded = value.replaceAll("-", "+").replaceAll("_", "/")
		.padEnd(Math.ceil(value.length / 4) * 4, "=");

	return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

/**
 * Encodes bytes as base64url, which survives URLs, headers and cookies.
 *
 * @param bytes The bytes to encode
 * @returns The encoded text
 */
const toBase64Url = (bytes: Uint8Array): string => {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);

	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll(
		"=",
		"",
	);
};

/**
 * Turns a base64 secret into a key usable for sealing tokens.
 *
 * @param secret A base64-encoded 32-byte secret
 * @returns The imported key
 */
export const importKey = async (secret: string): Promise<CryptoKey> => {
	const raw = fromBase64Url(secret);
	if (raw.length !== KEY_BYTES) {
		throw new Error(
			`The state key must be ${KEY_BYTES} bytes, got ${raw.length}`,
		);
	}

	return await crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
		"encrypt",
		"decrypt",
	]);
};

/** Generates a fresh key, for provisioning a deployment. */
export const generateKey = (): string =>
	toBase64Url(crypto.getRandomValues(new Uint8Array(KEY_BYTES)));

/** Longest game identifier a token can carry. */
const MAX_GAME_LENGTH = 32;

/** What a session token carries. */
export interface SessionState {
	/** Which game the snapshot belongs to. */
	game: string;
	/** Interpreter state from `ZorkSession.snapshot()`. */
	snapshot: Uint8Array;
}

/**
 * Seals interpreter state into a token the player can hold.
 *
 * The player carries their own session between turns, so the service needs no
 * store at all. AES-GCM is authenticated, so one operation covers both halves
 * of what that requires: the save data stays unreadable, and any edit to the
 * token is rejected rather than silently honoured. Reading it would leak the
 * game's internals, and forging it would let a player put the session into a
 * state they had not played their way to.
 *
 * @param key The sealing key
 * @param state The game and interpreter state to seal
 * @param lifetimeSeconds How long the token remains acceptable
 * @returns An opaque token
 */
export const seal = async (
	key: CryptoKey,
	state: SessionState,
	lifetimeSeconds = DEFAULT_LIFETIME_SECONDS,
): Promise<string> => {
	const game = new TextEncoder().encode(state.game);
	if (game.length === 0 || game.length > MAX_GAME_LENGTH) {
		throw new Error("A session token needs a game identifier");
	}

	// The game travels inside the sealed body rather than the header, so it
	// can be neither read nor edited from outside the service.
	const plain = new Uint8Array(1 + game.length + state.snapshot.length);
	plain[0] = game.length;
	plain.set(game, 1);
	plain.set(state.snapshot, 1 + game.length);

	const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
	const expiry = Math.floor(Date.now() / 1000) + lifetimeSeconds;

	// The header travels in the clear but is authenticated, so neither the
	// version nor the expiry can be edited without invalidating the token
	const header = new Uint8Array(9);
	header[0] = VERSION;
	new DataView(header.buffer).setBigUint64(1, BigInt(expiry));

	// Compressed before sealing, not after: ciphertext does not compress.
	// Token length therefore tracks how far the game has progressed, which the
	// player already knows, so it reveals nothing they do not have.
	const body = await compress(plain);

	const sealed = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv: nonce, additionalData: header },
		key,
		body as BufferSource,
	);

	const token = new Uint8Array(
		header.length + nonce.length + sealed.byteLength,
	);
	token.set(header, 0);
	token.set(nonce, header.length);
	token.set(new Uint8Array(sealed), header.length + nonce.length);

	return toBase64Url(token);
};

/**
 * Opens a token produced by {@link seal}.
 *
 * @param key The sealing key
 * @param token The token to open
 * @returns The game and interpreter state it carries
 * @throws If the token is malformed, tampered with, expired, or sealed with a
 *   different key
 */
export const open = async (
	key: CryptoKey,
	token: string,
): Promise<SessionState> => {
	const raw = fromBase64Url(token);
	if (raw.length <= 9 + NONCE_BYTES) {
		throw new Error("Malformed session token");
	}

	const header = raw.slice(0, 9);
	if (header[0] !== VERSION) {
		throw new Error(`Unsupported session token version: ${header[0]}`);
	}

	const expiry = Number(
		new DataView(header.buffer, header.byteOffset, header.byteLength)
			.getBigUint64(1),
	);
	if (expiry < Math.floor(Date.now() / 1000)) {
		throw new Error("This session token has expired");
	}

	const nonce = raw.slice(9, 9 + NONCE_BYTES);
	const sealed = raw.slice(9 + NONCE_BYTES);

	try {
		const opened = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: nonce, additionalData: header },
			key,
			sealed as BufferSource,
		);

		const plain = await decompress(new Uint8Array(opened));
		const length = plain[0];
		if (length === 0 || length > MAX_GAME_LENGTH || plain.length < 1 + length) {
			throw new Error("malformed body");
		}

		return {
			game: new TextDecoder().decode(plain.slice(1, 1 + length)),
			snapshot: plain.slice(1 + length),
		};
	} catch {
		// Deliberately vague: distinguishing "wrong key" from "edited token"
		// tells an attacker which half of their guess was right
		throw new Error("This session token could not be opened");
	}
};
