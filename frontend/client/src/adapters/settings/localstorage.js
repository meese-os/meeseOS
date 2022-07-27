/**
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2020, Anders Evenrud <andersevenrud@gmail.com>
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
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @license Simplified BSD License
 */

import logger from "../../logger";

/**
 * LocalStorage Settings adapter
 * @param {Core} core MeeseOS Core instance reference
 * @param {Object} [options] Adapter options
 */
const localStorageSettings = (core) => {
	// Prevents collisions with other localStorage keys not
	// directly related to MeeseOS
	const prefix = core.config("settings.prefix", "");

	return {
		/**
		 * Clears the localStorage for the specified namespace
		 * @param {String} [ns] The namespace
		 * @returns {Promise<boolean>}
		 */
		clear(ns) {
			if (ns) {
				localStorage.removeItem(prefix + ns);
			} else {
				localStorage.clear();
			}

			return Promise.resolve(true);
		},

		/**
		 * Saves settings to localStorage
		 * @param {Object} settings The settings to save
		 * @returns {Promise<boolean>}
		 */
		save(settings) {
			Object.keys(settings).forEach((key) => {
				localStorage.setItem(prefix + key, JSON.stringify(settings[key]));
			});

			return Promise.resolve(true);
		},

		/**
		 * Loads settings from localStorage
		 * @returns {Promise<boolean>}
		 */
		load() {
			const entries = Object
				.keys(localStorage)
				.filter((key) => prefix ? key.startsWith(prefix) : true)
				.map((key) => {
					const value = localStorage.getItem(key);
					const prefixedKey = prefix ? key.substring(prefix.length) : key;

					try {
						return [prefixedKey, JSON.parse(value)];
					} catch (err) {
						logger.warn(`localStorageAdapter parse failed for '${key}':`, err);
					}

					return [prefixedKey, value];
				});

			return Promise.resolve(Object.fromEntries(entries));
		}
	};
};

export default localStorageSettings;
