/**
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-Present, Anders Evenrud <andersevenrud@gmail.com>
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

import { CoreBase } from "@meeseOS/common";
import { defaultConfiguration } from "./config";
import { fetch } from "./utils/fetch";
import { urlResolver } from "./utils/url";
import Application from "./application";
import logger from "./logger";
import Splash from "./splash";
import Websocket from "./websocket";
import merge from "deepmerge";
import { isPlainObject } from "is-plain-object";

/**
 * @callback SplashCallback
 * @param {Core} core
 * @returns {Splash}
 */

/**
 * User Data
 *
 * @typedef {Object} CoreUserData
 * @property {String} username
 * @property {Number} [id]
 * @property {String[]} [groups=[]]
 */

/**
 * Core Options
 *
 * @typedef {Object} CoreOptions
 * @property {Element} [root] The root DOM element for elements
 * @property {Element} [resourceRoot] The root DOM element for resources
 * @property {String[]} [classNames] List of class names to apply to root dom element
 * @property {SplashCallback|Splash} [splash] Custom callback function for creating splash screen
 */

/**
 * Core Open File Options
 *
 * @typedef {Object} CoreOpenOptions
 * @property {Boolean} [useDefault] Use saved default application preference
 * @property {Boolean} [forceDialog] Force application choice dialog on multiple choices
 */

/**
 * Main Core class for MeeseOS service providers and bootstrapping.
 */
export default class Core extends CoreBase {
	/**
	 * Create core instance
	 * @param {CoreConfig} [config={}] Configuration tree
	 * @param {CoreOptions} [options={}] Options
	 */
	constructor(config = {}, options = {}) {
		options = {
			classNames: ["meeseOS-root"],
			root: document.body,
			...(options || {}),
		};

		super(defaultConfiguration, config, options);

		const $dynamicBackground = document.createElement("canvas");
		$dynamicBackground.className = "meeseOS-dynamic-background";

		const $contents = document.createElement("div");
		$contents.className = "meeseOS-contents";
		$contents.appendChild($dynamicBackground);

		this.logger = logger;

		/**
		 * Websocket connection
		 * @type {Websocket}
		 */
		this.ws = null;

		/**
		 * Ping (stay alive) interval
		 * @type {Number}
		 */
		this.ping = null;

		/**
		 * Main DOM element (typically `<body>`)
		 * @type {Element}
		 * @readonly
		 */
		this.$root = options.root;

		/**
		 * DOM element that contains all windows, the desktop, etc.
		 * @type {Element}
		 * @readonly
		 */
		this.$contents = $contents;

		/**
		 * Resource script container DOM element
		 * @type {Element}
		 * @readonly
		 */
		this.$resourceRoot = options.resourceRoot || document.querySelector("head");

		/**
		 * Default fetch request options
		 * @type {Object}
		 */
		this.requestOptions = {};

		/**
		 * URL Resolver
		 * TODO: typedef
		 * @type {Function(): String}
		 * @readonly
		 */
		this.urlResolver = urlResolver(this.configuration);

		/**
		 * Current user data
		 * @type {CoreUserData}
		 * @readonly
		 */
		this.user = this.config("auth.defaultUserData");

		this.options.classNames.forEach((n) => this.$root.classList.add(n));

		const { uri } = this.configuration.ws;
		if (!uri.match(/^wss?:/)) {
			const { protocol, host } = window.location;

			this.configuration.ws.uri =
				protocol.replace(/^http/, "ws") +
				"//" +
				host +
				uri.replace(/^\/+/, "/");
		}

		// Only create the splash in production
		if (this.configuration.development === false) {
			/**
			 * Splash instance
			 * @type {Splash}
			 * @readonly
			 */
			this.splash = options.splash ? options.splash(this) : new Splash(this);
			this.splash.init();
		}
	}

	/**
	 * Destroy core instance
	 * @returns {Boolean}
	 */
	destroy() {
		if (this.destroyed) {
			return Promise.resolve();
		}

		this.emit("meeseOS/core:destroy");

		this.ping = clearInterval(this.ping);

		Application.destroyAll();

		if (this.ws) {
			this.ws.close();
		}

		if (this.$contents) {
			this.$contents.remove();
			this.$contents = undefined;
		}

		this.user = this.config("auth.defaultUserData");
		this.ws = null;
		this.ping = null;

		return super.destroy();
	}

	/**
	 * Boots up MeeseOS
	 * @returns {Promise<boolean>}
	 */
	boot() {
		const done = (e) => {
			if (e) {
				logger.error("Error while booting", e);
			}

			console.groupEnd();

			return this.start();
		};

		if (this.booted) {
			return Promise.resolve(false);
		}

		console.group("Core::boot()");

		this.$root.appendChild(this.$contents);
		this._attachEvents();
		this.emit("meeseOS/core:boot");

		// TODO: Prevent flash of login UI if the local cookie is set

		return super
			.boot()
			.then(() => {
				this.emit("meeseOS/core:booted");

				if (this.has("meeseOS/auth")) {
					return this.make("meeseOS/auth").show((user) => {
						const defaultData = this.config("auth.defaultUserData");
						this.user = {
							...defaultData,
							...user,
						};

						if (this.has("meeseOS/settings")) {
							this.make("meeseOS/settings")
								.load()
								.then(() => done())
								.catch(() => done());
						} else {
							done();
						}
					});
				}

				logger.debug("MeeseOS STARTED WITHOUT ANY AUTHENTICATION");
				return done();
			})
			.catch(done);
	}

	/**
	 * Starts all core services
	 * @returns {Promise<boolean>}
	 */
	start() {
		const connect = () =>
			new Promise((resolve, reject) => {
				try {
					const valid = this._createConnection((error) =>
						error ? reject(error) : resolve()
					);
					if (valid === false) {
						// We can skip the connection
						resolve();
					}
				} catch (e) {
					reject(e);
				}
			});

		const done = (err) => {
			this.emit("meeseOS/core:started");

			if (err) {
				logger.warn("Error while starting", err);
			}

			console.groupEnd();
			return !err;
		};

		if (this.started) {
			return Promise.resolve(false);
		}

		console.group("Core::start()");
		this.emit("meeseOS/core:start");
		this._createListeners();

		return super
			.start()
			.then((result) => {
				console.groupEnd();

				if (result) {
					return connect()
						.then(() => done())
						.catch((err) => done(err));
				}

				return false;
			})
			.catch(done);
	}

	/**
	 * Attaches some internal events
	 * @private
	 */
	_attachEvents() {
		// Attaches sounds for certain events
		this.on("meeseOS/core:started", () => {
			if (this.has("meeseOS/sounds")) {
				// TODO: Don't attempt to run this on autologin via cookie; DOMException
				this.make("meeseOS/sounds").play("service-login");
			}
		});

		this.on("meeseOS/core:destroy", () => {
			if (this.has("meeseOS/sounds")) {
				this.make("meeseOS/sounds").play("service-logout");
			}
		});

		// Forwards messages to an application from internal websocket
		this.on("meeseOS/application:socket:message", ({ pid, args }) => {
			const found = Application.getApplications().find(
				(proc) => proc && proc.pid === pid
			);

			if (found) {
				found.emit("ws:message", ...args);
			}
		});

		// Sets up a server ping
		this.on("meeseOS/core:connected", (config) => {
			const enabled = this.config("http.ping");

			if (enabled) {
				// Defaults to every 30 minutes if not specified otherwise
				const pingTime = typeof enabled === "number" ? enabled : 30 * 60 * 1000;

				this.ping = setInterval(() => {
					if (this.ws) {
						if (this.ws.connected && !this.ws.reconnecting) {
							this.request("/ping").catch((e) =>
								logger.warn("Error on ping", e)
							);
						}
					}
				}, pingTime);
			}
		});
	}

	/**
	 * Creates the main connection to server
	 *
	 * @private
	 * @param {Function} cb Callback function
	 * @returns {Boolean}
	 */
	_createConnection(cb) {
		if (this.configuration.standalone || this.configuration.ws.disabled) {
			return false;
		}

		const { uri } = this.config("ws");
		let wasConnected = false;

		logger.debug("Creating websocket connection on", uri);
		this.ws = new Websocket("CoreSocket", uri, {
			interval: this.config("ws.connectInterval", 1000),
		});

		this.ws.once("connected", () => {
			// Allow for some grace-time in case we close prematurely
			setTimeout(() => {
				wasConnected = true;
				cb();
			}, 100);
		});

		this.ws.on("connected", (ev, reconnected) => {
			this.emit("meeseOS/core:connect", ev, reconnected);
		});

		this.ws.once("failed", (ev) => {
			if (!wasConnected) {
				cb(new Error("Connection closed"));
				this.emit("meeseOS/core:connection-failed", ev);
			}
		});

		this.ws.on("disconnected", (ev) => {
			this.emit("meeseOS/core:disconnect", ev);
		});

		this.ws.on("message", (ev) => {
			try {
				const data = JSON.parse(ev.data);
				const params = data.params || [];
				this.emit(data.name, ...params);
			} catch (e) {
				logger.warn("Exception on websocket message", e);
			}
		});

		return true;
	}

	/**
	 * Creates event listeners*
	 * @private
	 */
	_createListeners() {
		const handle = (data) => {
			const { pid, wid, args } = data;
			const proc = Application.getApplications().find(
				(proc) => proc.pid === pid
			);
			const win = proc ? proc.windows.find((w) => w.wid === wid) : null;

			if (win) {
				win.emit("iframe:get", ...(args || []));
			}
		};

		window.addEventListener("message", (ev) => {
			const message = ev.data || {};
			if (message && message.name === "meeseOS/iframe:message") {
				handle(...(message.params || []));
			}
		});
	}

	/**
	 * Creates an URL based on configured public path
	 *
	 * If you give a options.type, the URL will be resolved
	 * to the correct resource.
	 *
	 * @param {String} [endpoint=/] Endpoint
	 * @param {Object} [options] Additional options for resolving url
	 * @param {Boolean} [options.prefix=false] Returns a full URL complete with scheme, etc. (will always be true on websocket)
	 * @param {String} [options.type] Optional URL type (websocket)
	 * @param {PackageMetadata} [metadata] A package metadata
	 * @returns {String}
	 */
	url(endpoint = "/", options = {}, metadata = {}) {
		return this.urlResolver(endpoint, options, metadata);
	}

	/**
	 * Make an HTTP request
	 *
	 * This is a wrapper for making a 'fetch' request with some helpers
	 * and integration with MeeseOS
	 *
	 * @param {String} url The endpoint
	 * @param {Options} [options] fetch options
	 * @param {String} [type] Request / Response type
	 * @param {Boolean} [force=false] Force request even when in standalone mode
	 * @returns {*}
	 */
	request(url, options = {}, type = null, force = false) {
		if (this.config("standalone") && !force) {
			return Promise.reject(
				new Error("Cannot make requests in standalone mode.")
			);
		}

		if (!url.match(/^((http|ws|ftp)s?:)/i)) {
			url = this.url(url);

			options = merge(
				options,
				this.requestOptions,
				{ isMergeableObject: isPlainObject }
			);
		}

		return fetch(url, options, type).catch((error) => {
			logger.warn(error);

			throw new Error(`An error occured while performing a request: ${error}`);
		});
	}

	/**
	 * Create an application from a package
	 *
	 * @param {String} name Package name
	 * @param {{foo: *}} [args] Launch arguments
	 * @param {PackageLaunchOptions} [options] Launch options
	 * @see {Packages}
	 * @returns {Promise<Application>}
	 */
	run(name, args = {}, options = {}) {
		logger.debug("Core::run()", name, args, options);

		return this.make("meeseOS/packages").launch(name, args, options);
	}

	/**
	 * Spawns an application based on the file given
	 *
	 * @param {VFSFile} file A file object
	 * @param {CoreOpenOptions} [options] Options
	 * @returns {Boolean|Application}
	 */
	open(file, options = {}) {
		if (file.mime === "meeseOS/application") {
			return this.run(file.path.split("/").pop());
		}

		const run = (app) => this.run(app, { file }, options);
		const compatible = this.make("meeseOS/packages").getCompatiblePackages(
			file.mime
		);

		if (compatible.length > 0) {
			if (compatible.length > 1) {
				try {
					this._openApplicationDialog(options, compatible, file, run);

					return true;
				} catch (e) {
					logger.warn("Exception on compability check", e);
				}
			}

			run(compatible[0].name);

			return Promise.resolve(true);
		}

		return Promise.resolve(false);
	}

	/**
	 * Wrapper method to create an application choice dialog
	 * @private
	 */
	_openApplicationDialog(options, compatible, file, run) {
		const useDefault = options.useDefault && this.has("meeseOS/settings");
		const setDefault = (name) =>
			this.make("meeseOS/settings")
				.set("meeseOS/default-application", file.mime, name)
				.save();

		const value = useDefault
			? this.make("meeseOS/settings").get(
				"meeseOS/default-application",
				file.mime
			)
			: null;

		const type = useDefault ? "defaultApplication" : "choice";

		const args = {
			title: "Select application",
			message: `Select application for '${file.path}'`,
			choices: compatible.reduce((o, i) => ({ ...o, [i.name]: i.name }), {}),
			value,
		};

		if (value && !options.forceDialog) {
			run(value);
		} else {
			this.make("meeseOS/dialog", type, args, (btn, choice) => {
				if (btn === "ok") {
					if (type === "defaultApplication") {
						if (useDefault) {
							setDefault(choice.checked ? choice.value : null);
						}

						run(choice.value);
					} else if (choice) {
						run(choice);
					}
				}
			});
		}
	}

	/**
	 * Removes an event handler
	 *
	 * @param {String} name
	 * @param {Function} [callback=null]
	 * @param {Boolean} [force=false]
	 * @returns {Core} this
	 */
	off(name, callback = null, force = false) {
		if (name.match(/^meeseOS\//) && typeof callback !== "function") {
			throw new TypeError("The callback must be a function");
		}

		return super.off(name, callback, force);
	}

	/**
	 * Sends a 'broadcast' event with given arguments
	 * to all applications matching given filter
	 *
	 * @param {String|Function} pkg The filter
	 * @param {String} name The event name
	 * @param {*} ...args Arguments to pass to emit
	 * @returns {String[]} List of application names emitted to
	 */
	broadcast(pkg, name, ...args) {
		const filter =
			typeof pkg === "function" ? pkg : (p) => p.metadata.name === pkg;

		const apps = Application.getApplications().filter(filter);

		return apps.map((proc) => {
			proc.emit(name, ...args);

			return proc.name;
		});
	}

	/**
	 * Sends a signal to the server over websocket.
	 * This will be interpreted as an event in the server core.
	 * @param {String} name Event name
	 * @param {*} ...params Event callback parameters
	 */
	send(name, ...params) {
		return this.ws.send(
			JSON.stringify({
				name,
				params,
			})
		);
	}

	/**
	 * Set the internal fetch/request options
	 * @param {Object} options Request options
	 */
	setRequestOptions(options) {
		this.requestOptions = { ...options };
	}

	/**
	 * Gets the current user
	 * @returns {CoreUserData} User object
	 */
	getUser() {
		return { ...this.user };
	}

	/**
	 * Add middleware function to a group
	 * @param {String} group Middleware group
	 * @param {Function} callback Middleware function to add
	 */
	middleware(group, callback) {
		return this.make("meeseOS/middleware").add(group, callback);
	}

	/**
	 * Kills the specified application
	 * @param {String|Number} match Application name or PID
	 */
	kill(match) {
		const apps = Application.getApplications();
		const matcher = typeof match === "number"
			? app => app.pid === match
			: app => app.metadata.name === match;

		const found = apps.filter(matcher);
		found.forEach(app => app.destroy());
	}
}
