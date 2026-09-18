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
 * Where a story file comes from.
 *
 * Deno Deploy has no filesystem, so the story cannot simply be read from disk
 * in production. It is either inlined as base64 or fetched once at startup.
 * The local path exists for development only.
 */
export interface StorySource {
	/** Base64 of the story file. */
	base64?: string | null;
	/** URL to fetch the story from at startup. */
	url?: string | null;
	/** Value for the Authorization header when fetching, if the URL is private. */
	auth?: string | null;
	/** Path on disk. Development only; unavailable on Deploy. */
	path?: string | null;
}

/** One playable game. */
export interface GameConfig {
	/** Stable identifier, used in requests and sealed into tokens. */
	id: string;
	/** Name shown to the player. */
	label: string;
	/** Where to load the story from. */
	story: StorySource;
	/**
	 * Hash of the password required to start this game, or null if it needs
	 * none.
	 */
	passwordHash: string | null;
}

/**
 * Reads the story file from whichever source is configured.
 *
 * @param source Where to look
 * @returns The story bytes
 * @throws If nothing is configured or the fetch fails
 */
export const loadStory = async (source: StorySource): Promise<Uint8Array> => {
	if (source.base64) {
		return Uint8Array.from(
			atob(source.base64),
			(character) => character.charCodeAt(0),
		);
	}

	if (source.url) {
		const response = await fetch(source.url, {
			headers: source.auth ? { Authorization: source.auth } : undefined,
		});

		if (!response.ok) {
			throw new Error(
				`Could not fetch the story file: ${response.status} ${response.statusText}`,
			);
		}

		return new Uint8Array(await response.arrayBuffer());
	}

	if (source.path) {
		return await Deno.readFile(source.path);
	}

	throw new Error("No story file configured");
};

/**
 * Turns a game identifier into its environment variable prefix.
 *
 * @param id The game identifier
 * @returns The prefix, for example `ZORK1`
 */
const prefixOf = (id: string): string =>
	id.toUpperCase().replaceAll(/[^A-Z0-9]/g, "_");

/**
 * Reads configuration from the environment.
 *
 * Games are declared by `ZORK_GAMES`, and each draws its own settings from
 * variables named after it, so adding a game is configuration rather than code.
 *
 * @param env A reader for environment variables
 * @returns The service configuration
 * @throws If required settings are missing
 */
export const readConfig = (env: (key: string) => string | undefined) => {
	const secret = env("ZORK_STATE_KEY");
	if (!secret) {
		throw new Error(
			"ZORK_STATE_KEY is required. Generate one with `deno task keygen`.",
		);
	}

	const ids = (env("ZORK_GAMES") ?? "zork1")
		.split(",")
		.map((id) => id.trim())
		.filter(Boolean);

	if (ids.length === 0) {
		throw new Error("ZORK_GAMES lists no games");
	}

	const games: GameConfig[] = ids.map((id) => {
		const prefix = prefixOf(id);

		return {
			id,
			label: env(`${prefix}_LABEL`) ?? id,
			passwordHash: env(`${prefix}_PASSWORD_HASH`) ?? null,
			story: {
				base64: env(`${prefix}_STORY_BASE64`),
				url: env(`${prefix}_STORY_URL`),
				auth: env(`${prefix}_STORY_AUTH`),
				path: env(`${prefix}_STORY`),
			},
		};
	});

	const unconfigured = games.find(
		({ story }) => !story.base64 && !story.url && !story.path,
	);
	if (unconfigured) {
		const prefix = prefixOf(unconfigured.id);
		throw new Error(
			`No story configured for '${unconfigured.id}'. Set ${prefix}_STORY_BASE64, ${prefix}_STORY_URL, or ${prefix}_STORY.`,
		);
	}

	return {
		secret,
		games,
		/** The game a player gets when they do not ask for one. */
		defaultGame: games[0].id,
		origin: env("ZORK_ALLOWED_ORIGIN") ?? "*",
		port: Number(env("PORT") ?? 8080),
	};
};
