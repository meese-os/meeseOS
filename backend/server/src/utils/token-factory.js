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

/* eslint-disable no-unused-vars */
const jwt = require("jsonwebtoken");
const TokenStorage = require("../utils/token-storage");
/* eslint-enable no-unused-vars */

/**
 * Token Factory Options
 * @typedef {Object} TokenFactoryOptions
 * @property {String} [accessTokenSecret]
 * @property {String} [refreshTokenSecret]
 * @property {String} [accessTokenDuration]
 */

/**
 * JWT Token Factory
 */
class TokenFactory {
	/**
	 * Creates a new instance.
	 * @param {Core} core MeeseOS Core instance reference
	 * @param {TokenFactoryOptions} [options={}] Token Factory arguments
	 */
	constructor(core, options = {}) {
		const {
			accessTokenSecret,
			refreshTokenSecret,
			accessTokenDuration
		} = core.configuration.session.jwt;

		/**
		 * @type {Core}
		 */
		this.core = core;

		/**
		 * @type {TokenFactoryOptions}
		 */
		this.options = {
			accessTokenSecret,
			refreshTokenSecret,
			accessTokenDuration,
			...options,
		};
	}

	/**
	 * Initializes adapter.
	 * @returns {Promise<Boolean>}
	 */
	async init() {
		/**
		 * @type {TokenStorage}
		 */
		this.storage = this.core.make("meeseOS/token-storage");

		await this.storage.init();

		return true;
	}

	/**
	 * Creates an access token for a user.
	 * @param {String} username The user's username
	 * @param {Array} groups The user's groups
	 * @returns {String} The access token
	 */
	createAccessToken(username, groups) {
		return jwt.sign(
			{ username, groups: JSON.stringify(groups) },
			this.options.accessTokenSecret,
			{ expiresIn: this.options.accessTokenDuration }
		);
	}

	/**
	 * Validates an access token.
	 * @param {String} accessToken The access token to validate
	 * @returns {Promise<Boolean|Object>} The user if valid, otherwise `false`
	 */
	validateAccessToken(accessToken) {
		return new Promise((resolve, reject) => {
			jwt.verify(accessToken, this.options.accessTokenSecret, (err, user) => {
				if (err) {
					reject(err);
				} else {
					resolve(user);
				}
			});
		}).catch((error) => {
			this.core.logger.warn("Access token validation error:", error);
			return false;
		});
	}

	/**
	 * Creates a refresh token for a user.
	 * @param {String} username The user's username
	 * @param {Array} groups The user's groups
	 * @returns {String} The refresh token
	 */
	createRefreshToken(username, groups) {
		return jwt.sign(
			{ username, groups: JSON.stringify(groups) },
			this.options.refreshTokenSecret
		);
	}

	/**
	 * Validates a refresh token.
	 * @param {String} refreshToken The refresh token to validate
	 * @returns {Promise<Boolean|Object>} The user if valid, otherwise `false`
	 */
	validateRefreshToken(refreshToken) {
		return new Promise((resolve, reject) => {
			jwt.verify(refreshToken, this.options.refreshTokenSecret, (err, user) => {
				if (err) {
					reject(err);
				} else {
					resolve(user);
				}
			});
		}).catch((error) => {
			this.core.logger.warn("Refresh token validation error:", error);
			return false;
		});
	}

	/**
	 * Uses a refresh token to create a new access token, then returns the
	 * associated user profile along with the new access token.
	 * @param {String} refreshToken Refresh token
	 * @returns {Promise<*>}
	 */
	refreshToAccessToken(refreshToken) {
		// Need to ensure that the refreshToken hasn't been revoked
		if (!refreshToken || !this.storage.find(refreshToken)) {
			return false;
		}

		/* eslint-disable no-async-promise-executor */
		return new Promise(async (resolve, reject) => {
			const tokenInStorage = this.storage.find(refreshToken);
			if (!tokenInStorage) {
				return reject(new Error("Token not found"));
			}

			const user = await this.validateRefreshToken(refreshToken);
			if (!user) {
				this.storage.remove(refreshToken);
				return reject(new Error("Token not valid"));
			}

			const accessToken = this.createAccessToken(
				user.username,
				user.groups
			);

			resolve({ ...user, accessToken });
		}).catch((error) => {
			this.core.logger.error(error);
			return false;
		});
		/* eslint-enable no-async-promise-executor */
	}
}

module.exports = TokenFactory;
