const jwt = require("jsonwebtoken");

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
			// this.core.logger.warn("Access token validation error:", error);
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
			// this.core.logger.warn("Refresh token validation error:", error);
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
	}
}

module.exports = TokenFactory;
