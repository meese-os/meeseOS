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

import { BasicApplication } from "../basic-application.js";
import { ServiceProvider } from "@meeseOS/common";
import { EventEmitter } from "@meeseOS/event-emitter";
import { playSound, script, style } from "../utils/dom";
import { resourceResolver } from "../utils/desktop";
import * as dnd from "../utils/dnd";
import Application from "../application";
import Clipboard from "../clipboard";
import Middleware from "../middleware";
import Packages from "../packages";
import Session from "../session";
import Tray from "../tray";
import Websocket from "../websocket";
import Window from "../window";
import WindowBehavior from "../window-behavior";
import logger from "../logger";

/**
 * Core Provider Window Contract
 * TODO: typedef
 * @typedef {Object} CoreProviderWindowContract
 * @property {Function} create
 * @property {Function} list
 * @property {Function} last
 */

/**
 * Core Provider DnD Contract
 * TODO: typedef
 * @typedef {Object} CoreProviderDnDContract
 * @property {Function} draggable
 * @property {Function} droppable
 */

/**
 * Core Provider Theme Contract
 * TODO: typedef
 * @typedef {Object} CoreProviderDOMContract
 * @property {Function} script
 * @property {Function} style
 */

/**
 * Core Provider Theme Contract
 * TODO: typedef
 * @typedef {Object} CoreProviderThemeContract
 * @property {Function} resource
 * @property {Function} icon
 */

/**
 * Core Provider Sound Contract
 * TODO: typedef
 * @typedef {Object} CoreProviderSoundContract
 * @property {Function} resource
 * @property {Function} play
 */

/**
 * Core Provider Session Contract
 * TODO: typedef
 * @typedef {Object} CoreProviderSessionContract
 * @property {Function} save
 * @property {Function} load
 */

/**
 * Core Provider Packages Contract
 * TODO: typedef
 * @typedef {Object} CoreProviderPackagesContract
 * @property {Function} [launch]
 * @property {Function} [register]
 * @property {Function} [addPackages]
 * @property {Function} [getPackages]
 * @property {Function} [getCompatiblePackages]
 * @property {Function} [running]
 */

/**
 * Core Provider Clipboard Contract
 * TODO: typedef
 * @typedef {Object} CoreProviderClipboardContract
 * @property {Function} [clear]
 * @property {Function} [set]
 * @property {Function} [has]
 * @property {Function} [get]
 */

/**
 * Core Provider Middleware Contract
 * TODO: typedef
 * @typedef {Object} CoreProviderMiddlewareContract
 * @property {Function} [add]
 * @property {Function} [get]
 */

/**
 * Core Provider Tray Contract
 * TODO: typedef
 * @typedef {Object} CoreProviderTrayContract
 * @property {Function} [create]
 * @property {Function} [remove]
 * @property {Function} [list]
 * @property {Function} [has]
 */

/**
 * Core Provider Options
 * @typedef {Object} CoreProviderOptions
 * @property {Function} [windowBehavior] Custom Window Behavior
 */

/**
 * MeeseOS Core Service Provider
 */
export default class CoreServiceProvider extends ServiceProvider {
	/**
	 * Create new instance.
	 * @param {Core} core MeeseOS Core instance reference
	 * @param {CoreProviderOptions} [options={}] Arguments
	 */
	constructor(core, options = {}) {
		super(core, options);

		/**
		 * @type {Session}
		 * @readonly
		 */
		this.session = new Session(core);

		/**
		 * @type {Tray}
		 * @readonly
		 */
		this.tray = new Tray(core);

		/**
		 * @type {Packages}
		 * @readonly
		 */
		this.pm = new Packages(core);

		/**
		 * @type {Clipboard}
		 * @readonly
		 */
		this.clipboard = new Clipboard();

		/**
		 * @type {Middleware}
		 * @readonly
		 */
		this.middleware = new Middleware();

		window.MeeseOS = this.createGlobalApi();
	}

	/**
	 * Get a list of services this provider registers.
	 * @returns {String[]}
	 */
	provides() {
		return [
			"meeseOS/application",
			"meeseOS/basic-application",
			"meeseOS/window",
			"meeseOS/windows",
			"meeseOS/event-handler",
			"meeseOS/window-behaviour",
			"meeseOS/dnd",
			"meeseOS/dom",
			"meeseOS/clipboard",
			"meeseOS/middleware",
			"meeseOS/tray",
			"meeseOS/packages",
			"meeseOS/websocket",
			"meeseOS/session",
			"meeseOS/theme",
			"meeseOS/sounds",
		];
	}

	/**
	 * Destroys provider.
	 */
	destroy() {
		this.tray.destroy();
		this.pm.destroy();
		this.clipboard.destroy();
		this.middleware.destroy();
		this.session.destroy();

		super.destroy();
	}

	/**
	 * Initializes provider.
	 * @returns {Promise<undefined>}
	 */
	init() {
		this.registerContracts();

		this.core.on("meeseOS/core:started", () => {
			this.session.load();
		});

		return this.pm.init();
	}

	/**
	 * Starts provider.
	 * @returns {Promise<undefined>}
	 */
	start() {
		if (this.core.config("development")) {
			this.core.on("meeseOS/dist:changed", (filename) => {
				this._onDistChanged(filename);
			});

			this.core.on("meeseOS/packages:package:changed", (name) => {
				this._onPackageChanged(name);
			});
		}

		this.core.on("meeseOS/packages:metadata:changed", () => {
			this.pm.init();
		});
	}

	/**
	 * Registers contracts.
	 */
	registerContracts() {
		this.core.instance(
			"meeseOS/window",
			(options = {}) => new Window(this.core, options)
		);
		this.core.instance(
			"meeseOS/application",
			(data = {}) => new Application(this.core, data)
		);
		this.core.instance(
			"meeseOS/basic-application",
			(proc, win, options = {}) =>
				new BasicApplication(this.core, proc, win, options)
		);
		this.core.instance(
			"meeseOS/websocket",
			(name, uri, options = {}) => new Websocket(name, uri, options)
		);
		this.core.instance(
			"meeseOS/event-emitter",
			(name) => new EventEmitter(name)
		);

		this.core.singleton("meeseOS/windows", () => this.createWindowContract());
		this.core.singleton("meeseOS/dnd", () => this.createDnDContract());
		this.core.singleton("meeseOS/dom", () => this.createDOMContract());
		this.core.singleton("meeseOS/theme", () => this.createThemeContract());
		this.core.singleton("meeseOS/sounds", () => this.createSoundsContract());
		this.core.singleton("meeseOS/session", () => this.createSessionContract());
		this.core.singleton("meeseOS/packages", () =>
			this.createPackagesContract()
		);
		this.core.singleton("meeseOS/clipboard", () =>
			this.createClipboardContract()
		);
		this.core.singleton("meeseOS/middleware", () =>
			this.createMiddlewareContract()
		);

		this.core.instance("meeseOS/tray", (options, handler) => {
			if (typeof options !== "undefined") {
				// FIXME: Use contract instead
				logger.warn("meeseOS/tray usage without .create() is deprecated");
				return this.tray.create(options, handler);
			}

			return this.createTrayContract();
		});

		// FIXME: Remove this from public usage
		this.core.singleton("meeseOS/window-behavior", () =>
			typeof this.options.windowBehavior === "function"
				? this.options.windowBehavior(this.core)
				: new WindowBehavior(this.core)
		);

		this.core.instance("meeseOS/event-handler", (...args) => {
			logger.warn(
				"meeseOS/event-handler is deprecated, use meeseOS/event-emitter"
			);
			return new EventEmitter(...args);
		});
	}

	/**
	 * Expose some internals to global.
	 */
	createGlobalApi() {
		const globalBlacklist = this.core.config("providers.globalBlacklist", []);
		const globalWhitelist = this.core.config("providers.globalWhitelist", []);

		const make = (name, ...args) => {
			if (this.core.has(name)) {
				const blacklisted =
					globalBlacklist.length > 0 && globalBlacklist.indexOf(name) !== -1;
				const notWhitelisted =
					globalWhitelist.length > 0 && globalWhitelist.indexOf(name) === -1;

				if (blacklisted || notWhitelisted) {
					throw new Error(
						`The provider '${name}' cannot be used via global scope`
					);
				}
			}

			return this.core.make(name, ...args);
		};

		return Object.freeze({
			make,
			register: (name, callback) => this.pm.register(name, callback),
			url: (endpoint, options, metadata) =>
				this.core.url(endpoint, options, metadata),
			run: (name, args = {}, options = {}) =>
				this.core.run(name, args, options),
			open: (file, options = {}) => this.core.open(file, options),
			request: (url, options, type) => this.core.request(url, options, type),
			middleware: (group, callback) => this.middleware.add(group, callback),
		});
	}

	/**
	 * Event when dist changes from a build or deployment.
	 * @private
	 * @param {String} filename The resource filename
	 */
	_onDistChanged(filename) {
		const url = this.core.url(filename).replace(/^\//, "");
		const found = this.core.$resourceRoot.querySelectorAll(
			"link[rel=stylesheet]"
		);
		const map = Array.from(found).reduce((result, item) => {
			const src = item.getAttribute("href").split("?")[0].replace(/^\//, "");
			return {
				[src]: item,
				...result,
			};
		}, {});

		if (map[url]) {
			logger.debug("Hot-reloading", url);

			setTimeout(() => {
				map[url].setAttribute("href", url);
			}, 100);
		}
	}

	/**
	 * Event when package dist changes from a build or deployment.
	 * @private
	 * @param {String} name The package name
	 */
	_onPackageChanged(name) {
		// TODO: Reload themes as well
		Application.getApplications()
			.filter((proc) => proc.metadata.name === name)
			.forEach((proc) => proc.relaunch());
	}

	/**
	 * Provides window contract.
	 * @returns {CoreProviderWindowContract}
	 */
	createWindowContract() {
		return {
			create: (options = {}) => new Window(this.core, options),
			list: () => Window.getWindows(),
			last: () => Window.lastWindow(),
		};
	}

	/**
	 * Provides DnD contract.
	 * @returns {CoreProviderDnDContract}
	 */
	createDnDContract() {
		return dnd;
	}

	/**
	 * Provides DOM contract.
	 * @returns {CoreProviderDOMContract}
	 */
	createDOMContract() {
		return {
			script,
			style,
		};
	}

	/**
	 * Provides Theme contract.
	 * @returns {CoreProviderThemeContract}
	 */
	createThemeContract() {
		const { themeResource, icon } = resourceResolver(this.core);

		return {
			resource: themeResource,
			icon
		};
	}

	/**
	 * Provides Sounds contract.
	 * @returns {CoreProviderSoundContract}
	 */
	createSoundsContract() {
		const { soundResource, soundsEnabled } = resourceResolver(this.core);

		return {
			resource: soundResource,
			play: (src, options = {}) => {
				if (soundsEnabled()) {
					const absoluteSrc = src.match(/^(\/|https?:)/)
						? src
						: soundResource(src);

					if (absoluteSrc) {
						return playSound(absoluteSrc, options);
					}
				}

				return false;
			},
		};
	}

	/**
	 * Provides Session contract.
	 * @returns {CoreProviderSessionContract}
	 */
	createSessionContract() {
		return {
			save: () => this.session.save(),
			load: (fresh = false) => this.session.load(fresh),
		};
	}

	/**
	 * Provides Packages contract.
	 * @returns {CoreProviderPackagesContract}
	 */
	createPackagesContract() {
		return {
			launch: (name, args = {}, options = {}) =>
				this.pm.launch(name, args, options),
			register: (name, callback) => this.pm.register(name, callback),
			addPackages: (list) => this.pm.addPackages(list),
			getPackages: (filter) => this.pm.getPackages(filter),
			getCompatiblePackages: (mimeType) =>
				this.pm.getCompatiblePackages(mimeType),
			running: () => this.pm.running(),
			getMetadataFromName: (name) => this.pm.getMetadataFromName(name),
		};
	}

	/**
	 * Provides Clipboard contract.
	 * @returns {CoreProviderClipboardContract}
	 */
	createClipboardContract() {
		return {
			clear: () => this.clipboard.clear(),
			set: (data, type) => this.clipboard.set(data, type),
			has: (type) => this.clipboard.has(type),
			get: (clear = false) => this.clipboard.get(clear),
		};
	}

	/**
	 * Provides Middleware contract.
	 * @returns {CoreProviderMiddlewareContract}
	 */
	createMiddlewareContract() {
		return {
			add: (group, callback) => this.middleware.add(group, callback),
			get: (group) => this.middleware.get(group),
		};
	}

	/**
	 * Provides Tray contract.
	 * @returns {CoreProviderTrayContract}
	 */
	createTrayContract() {
		return {
			create: (options, handler) => this.tray.create(options, handler),
			remove: (entry) => this.tray.remove(entry),
			list: () => this.tray.list(),
			has: (key) => this.tray.has(key),
		};
	}
}
