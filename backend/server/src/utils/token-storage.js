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
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
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
 * @licence Simplified BSD License
 */

const loki = require("lokijs");

/**
 * Token Storage Options
 * @typedef {Object} TokenStorageOptions
 * @property {String} [databaseName]
 * @property {String} [collectionName]
 * @property {Object} [databaseOptions]
 */

/**
 * Token Storage
 */
class TokenStorage {
	/**
	 * Creates a new instance.
	 * @param {Core} core MeeseOS Core instance reference
	 * @param {TokenStorageOptions} [options={}] Token Storage arguments
	 */
	constructor(core, options = {}) {
		/**
		 * @type {Core}
		 */
		this.core = core;

		/**
		 * @type {TokenStorageOptions}
		 */
		this.options = {
			...this.core.configuration.session.store,
			...options,
		};
	}

	/**
	 * Initializes the instance.
	 */
	init() {
		this.db = new loki(
			this.options.databaseName,
			{
				autoloadCallback: () => {
					// Returns the collection if it exists, otherwise creates it
					let collection = this.db.getCollection(this.options.collectionName);
					if (!collection) {
						collection = this.db.addCollection(this.options.collectionName);
					}

					this.collection = collection;
				},
				...this.options.databaseOptions,
			},
		);
	}

	/**
	 * Looks for a refresh token in the database and returns it if found.
	 * @param {String} refreshToken The refresh token to look for
	 * @returns {Object|null} The token if found or `null` if not
	 */
	find(refreshToken) {
		return this.collection.findOne({ refreshToken });
	}

	/**
	 * Adds a refresh token to the database.
	 * @param {String} refreshToken The refresh token to add
	 */
	create(refreshToken) {
		// The timestamp is used to make pruning old data easier
		const timestamp = new Date().getTime();
		this.collection.insert({ refreshToken, timestamp });
	}

	/**
	 * Removes a refresh token from the database.
	 * @param {String} refreshToken The refresh token to remove
	 * @returns {Promise<Boolean>} `true` if the token was removed, otherwise `false`
	 */
	remove(refreshToken) {
		const row = this.collection.findOne({ refreshToken });
		if (row) {
			this.collection.remove(row);
			return true;
		}

		return false;
	}

	/**
	 * Destroys the instance.
	 */
	destroy() {
		this.db.close();
	}
}

module.exports = TokenStorage;
