/**
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) Anders Evenrud <andersevenrud@gmail.com>
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
 * @licence Simplified BSD License
 */

import GoogleLogo from "./logo.svg";

/**
 * @typedef {Object} GisConfig
 * @property {String} [api_key] Google Client API Key
 * @property {String} [client_id] Google Client ID
 * @property {String[]} [scope] Google API Scopes
 */

/**
 * @typedef {Object} GisAccessToken
 * @property {String} access_token
 * @property {String} authuser
 * @property {Number} expires_in Time until expiration (seconds)
 * @property {String} prompt
 * @property {String} scope
 * @property {String} token_type
 */

/**
 * Google Identity Service (GIS) Service Provider.
 * @see https://developers.google.com/identity/oauth2/web/guides/overview
 */
export class GisServiceProvider {
	/**
	 * Creates a new instance.
	 * @param {Core} core MeeseOS Core instance reference
	 * @param {GisConfig} [options={}] Service Provider arguments
	 */
	constructor(core, options = {}) {
		const defaultSettings = core.config("gis.client", {});

		/**
		 * @type {GisConfig}
		 */
		this.options = {
			...defaultSettings,
			...options,
		};

		if (!this.options.api_key || !this.options.client_id) {
			throw new Error("gis client requires api_key and client_id");
		} else if (!this.options.scope.length) {
			throw new Error("gis client requires scope");
		}

		/**
		 * @type {Core}
		 */
		this.core = core;

		/**
		 * @type {Boolean}
		 */
		this.signedIn = false;

		/**
		 * @type {Boolean}
		 */
		this.loaded = false;

		/**
		 * @type {EventEmitter[]}
		 */
		this.clients = [];

		this.bus = null;

		this.gisClient = null;

		/**
		 * @type {GisAccessToken}
		 */
		this.accessToken = null;
	}

	/**
	 * A list of services this provider depends on.
	 * @returns {String[]}
	 */
	static depends() {
		return ["meeseOS/dom", "meeseOS/event-emitter"];
	}

	/**
	 * Get a list of provided services.
	 * @returns {String[]}
	 */
	static provides() {
		return ["google/api", "meeseOS/gis"];
	}

	/**
	 * Initializes the service provider.
	 * @desc Exposes and binds API stuff
	 */
	init() {
		this.core.singleton("google/api", () => {
			if (!("google" in window)) {
				throw new Error("The GIS API was not loaded");
			}

			return window.google;
		});

		this.core.singleton("meeseOS/gis", () => ({
			login: () => this.login(),
			logout: () => this.logout(),
			create: () => this.createInstance(),
		}));
	}

	/**
	 * Destroys the service provider.
	 */
	destroy() {
		this.emitAll("destroy");

		this.clients = this.client.filter((c) => c.destroy());
		this.tray = this.tray.destroy();
		this.bus = this.bus.destroy();
	}

	/**
	 * Start the service provider.
	 * @see GisServiceProvider#createApi
	 */
	start() {
		this.createTray();

		return this.createApi();
	}

	/**
	 * Creates tray icon.
	 */
	createTray() {
		this.tray = this.core.make("meeseOS/tray").create({
			title: "Google API",
			icon: GoogleLogo,
		}, ev => {
			this.core.make("meeseOS/contextmenu").show({
				position: ev.target,
				menu: [{
					label: "Scopes",
					items: this.options.scope.map((label) => ({
						label,
					}))
				}, {
					label: "Sign In",
					disabled: this.signedIn,
					onclick: () => this.login(),
				}, {
					label: "Sign Out",
					disabled: !this.signedIn,
					onclick: () => this.logout(),
				}]
			});
		});

		this.bus = this.core.make("meeseOS/event-emitter", "gis");

		this.bus.on("signed-in", () => {
			this.core.make("meeseOS/notification", {
				icon: GoogleLogo,
				title: "Google API",
				message: "You have signed on to Google"
			});

			this.emitAll("signed-in");
		});

		this.bus.on("signed-out", () => {
			this.loaded = false;

			this.emitAll("signed-out");
		});
	}

	/**
	 * Creates Google Identity Service (GIS) instance.
	 * @link https://developers.google.com/identity/oauth2/web/guides/migration-to-gis#gis-only
	 * @returns {Promise}
	 */
	createApi() {
		const { client_id, scope } = this.options;
		const { script } = this.core.make("meeseOS/dom");
		const { $resourceRoot } = this.core;

		return script($resourceRoot, "https://accounts.google.com/gsi/client")
			.then(() => {
				this.gisClient = window.google.accounts.oauth2.initTokenClient({
					client_id,
					// Full list: https://developers.google.com/identity/protocols/googlescopes
					scope: scope.join(" "),
					// This is called on the success of `requestAccessToken`
					callback: (accessToken) => {
						this.accessToken = accessToken;
						this.signedIn = true;
						this.bus.emit("signed-in");
					}
				});
			});
	}

	/**
	 * Creates a new instance that we return from service.
	 * @desc It's just a small wrapper with a bus attached
	 * @returns {Object}
	 */
	createInstance() {
		const bus = this.core.make("meeseOS/event-emitter", "gis-client");

		this.clients.push(bus);

		return {
			login: () => this.login(),
			logout: () => this.logout(),
			on: (...args) => bus.on(...args),
			off: (...args) => bus.off(...args),
			destroy: () => {
				const foundIndex = this.clients.find((b) => b === bus);
				if (foundIndex !== -1) {
					this.clients.splice(foundIndex, 1);
				}

				bus.destroy();
			}
		};
	}

	/**
	 * Emits events across all created instances.
	 * @see EventHandler#emit
	 */
	emitAll(name, ...args) {
		args.push(window.google);

		this.clients.forEach(bus => bus.emit(name, ...args));
	}

	/**
	 * Perform login.
	 * @returns {Promise}
	 */
	login() {
		if (!this.signedIn) {
			this.gisClient.requestAccessToken();
		}

		return Promise.resolve(window.google);
	}

	/**
	 * Perform logout.
	 * @returns {Promise}
	 */
	logout() {
		if (this.signedIn) {
			try {
				window.google.accounts.oauth2.revoke(
					this.accessToken.access_token,
					() => {}
				);
			} catch (err) {
				console.warn("Failed to revoke GIS access token:", err);
			}

			this.signedIn = false;
			this.bus.emit("signed-out");
		}

		return Promise.resolve(window.google);
	}
}
