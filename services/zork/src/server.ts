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

import { ZorkSession } from "./session.ts";
import { open, seal } from "./state.ts";
import { verifyPassword } from "./password.ts";

/** Longest command accepted, to bound how much work one request can ask for. */
const MAX_COMMAND_LENGTH = 256;

/** Longest token accepted, generously above a realistic save. */
const MAX_TOKEN_LENGTH = 64 * 1024;

export interface TurnRequest {
	/** Absent on the first request of a session. */
	token?: string | null;
	/** Absent when the player is only asking for the opening text. */
	command?: string | null;
	/** Which game to start. Ignored when a token is supplied. */
	game?: string | null;
	/** Required only when the requested game is configured with one. */
	password?: string | null;
}

export interface TurnResponse {
	/** Which game is being played. */
	game: string;
	/** The state to send back with the next command. */
	token: string;
	/** What the interpreter printed. */
	output: string;
	/** The status line, as the interpreter last drew it. */
	status: string;
}

/** A game the service can run. */
export interface Game {
	/** Stable identifier, sealed into tokens. */
	id: string;
	/** The story file to run. */
	story: Uint8Array;
	/** Hash of the password it requires, or null if it needs none. */
	passwordHash?: string | null;
}

export interface HandlerOptions {
	/** Every game the service can run. */
	games: Game[];
	/** The game a player gets when they do not ask for one. */
	defaultGame: string;
	/** The key used to seal session tokens. */
	key: CryptoKey;
	/** Origin allowed to call this service, or `*` to allow any. */
	origin?: string;
}

/**
 * Builds the CORS headers. The service is called from the desktop, which is
 * served from a different origin, so preflight has to be answered.
 */
const corsHeaders = (origin: string): HeadersInit => ({
	"Access-Control-Allow-Origin": origin,
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Max-Age": "86400",
});

/**
 * Builds a JSON response with the CORS headers attached.
 */
const json = (
	body: unknown,
	status: number,
	origin: string,
): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
	});

/**
 * Validates the request body without trusting any of it.
 *
 * @param body The parsed body
 * @returns The command and token to act on
 * @throws If anything is the wrong shape or implausibly large
 */
const parseTurn = (body: unknown): TurnRequest => {
	if (typeof body !== "object" || body === null) {
		throw new Error("Expected a JSON object");
	}

	const { token, command, game, password } = body as TurnRequest;

	for (const [name, value] of [["game", game], ["password", password]]) {
		if (value !== undefined && value !== null && typeof value !== "string") {
			throw new Error(`${name} must be a string`);
		}
	}

	if (token !== undefined && token !== null) {
		if (typeof token !== "string") throw new Error("token must be a string");
		if (token.length > MAX_TOKEN_LENGTH) throw new Error("token is too long");
	}

	if (command !== undefined && command !== null) {
		if (typeof command !== "string") {
			throw new Error("command must be a string");
		}
		if (command.length > MAX_COMMAND_LENGTH) {
			throw new Error("command is too long");
		}
		if (command.includes("\n")) {
			throw new Error("command must be a single line");
		}
	}

	return {
		token: token ?? null,
		command: command ?? null,
		game: game ?? null,
		password: password ?? null,
	};
};

/**
 * Plays one turn.
 *
 * A request carries the whole session, so nothing is kept between calls: the
 * token is opened into interpreter state, the command is played, and the
 * resulting state is sealed back into a new token for the player to hold.
 *
 * @param options Story, key and allowed origin
 * @returns A request handler
 */
export const createHandler = (
	options: HandlerOptions,
): (request: Request) => Promise<Response> => {
	const { key } = options;
	const origin = options.origin ?? "*";
	const games = new Map(options.games.map((game) => [game.id, game]));

	return async (request: Request): Promise<Response> => {
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders(origin) });
		}

		if (request.method !== "POST") {
			return json({ error: "Use POST" }, 405, origin);
		}

		let turn: TurnRequest;
		try {
			turn = parseTurn(await request.json());
		} catch (error) {
			return json({ error: (error as Error).message }, 400, origin);
		}

		let session: ZorkSession;
		let game: Game;

		if (turn.token) {
			// A valid token already identifies its game, so nothing further
			// is asked for
			let state;
			try {
				state = await open(key, turn.token);
			} catch (error) {
				// The token is the player's whole session, so a bad one is an
				// authentication failure rather than a malformed request
				return json({ error: (error as Error).message }, 401, origin);
			}

			const known = games.get(state.game);
			if (!known) {
				return json({ error: `Unknown game: ${state.game}` }, 400, origin);
			}

			game = known;
			session = await ZorkSession.resume(game.story, state.snapshot);
		} else {
			const requested = turn.game ?? options.defaultGame;
			const known = games.get(requested);
			if (!known) {
				return json({ error: `Unknown game: ${requested}` }, 400, origin);
			}

			game = known;

			if (game.passwordHash) {
				if (!turn.password) {
					return json(
						{ error: "This game needs a password", needsPassword: true },
						401,
						origin,
					);
				}

				if (!await verifyPassword(turn.password, game.passwordHash)) {
					return json({ error: "Wrong password" }, 401, origin);
				}
			}

			session = await ZorkSession.boot(game.story);
		}

		const output = turn.command
			? await session.send(turn.command)
			: session.drain();

		const response: TurnResponse = {
			game: game.id,
			token: await seal(key, {
				game: game.id,
				snapshot: await session.snapshot(),
			}),
			output,
			status: session.status,
		};

		return json(response, 200, origin);
	};
};
