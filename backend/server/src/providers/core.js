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
 * @licence Simplified BSD License
 */

const path = require("path");
const express = require("express");
const chokidar = require("chokidar");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const proxy = require("express-http-proxy");
const nocache = require("nocache");
const { ServiceProvider } = require("@meese-os/common");
const {
	useWebTokens,
	isAuthenticated,
	closeWatches
} = require("../utils/core.js");

/**
 * MeeseOS Core Service Provider
 */
class CoreServiceProvider extends ServiceProvider {
	/**
	 * Create new instance.
	 * @param {Core} core MeeseOS Core instance reference
	 * @param {Object} [options] Arguments
	 */
	constructor(core, options) {
		super(core, options);

		/**
		 * @type {Array}
		 */
		this.watches = [];
	}

	/**
	 * Initializes provider.
	 */
	init() {
		this.initService();
		this.initExtensions();
		this.initResourceRoutes();
		this.initSocketRoutes();
		this.initProxies();
	}

	/**
	 * Starts provider.
	 */
	start() {
		if (this.core.configuration.development) {
			this.initDeveloperTools();
		}
	}

	/**
	 * Get a list of services this provider registers.
	 * @returns {String[]}
	 */
	static provides() {
		return ["meeseOS/express"];
	}

	/**
	 * Destroys provider.
	 */
	async destroy() {
		await closeWatches(this.watches);
		super.destroy();
	}

	/**
	 * Initializes the service APIs.
	 */
	initService() {
		const { app } = this.core;
		const { requireAllGroups } = this.core.configuration.auth;

		const middleware = {
			route: [],
			routeAuthenticated: [],
		};

		this.core.singleton("meeseOS/express", () => ({
			useWebTokens,
			isAuthenticated,

			call: (method, ...args) => app[method](...args),
			use: (arg) => app.use(arg),

			websocket: (p, cb) => app.ws(p, cb),

			middleware: (authentication, cb) => {
				middleware[authentication ? "routeAuthenticated" : "route"].push(cb);
			},

			route: (method, uri, cb) =>
				app[method.toLowerCase()](uri, [...middleware.route], cb),

			routeAuthenticated: (
				method,
				uri,
				cb,
				groups = [],
				strict = requireAllGroups
			) =>
				app[method.toLowerCase()](
					uri,
					[
						...middleware.routeAuthenticated,
						useWebTokens(app),
						isAuthenticated(groups, strict)
					],
					cb
				),

			router: () => {
				const router = express.Router();
				router.use(...middleware.route);
				return router;
			},

			routerAuthenticated: (groups = [], strict = requireAllGroups) => {
				const router = express.Router();
				router.use(...middleware.routeAuthenticated);
				router.use(useWebTokens(app));
				router.use(isAuthenticated(groups, strict));
				return router;
			},
		}));
	}

	/**
	 * Initializes Express extensions.
	 */
	initExtensions() {
		const { app, session, configuration } = this.core;
		const limit = configuration.express.maxBodySize;

		const helmetConfig = {
			contentSecurityPolicy: {
				useDefaults: true,
				directives: {
					"default-src": ["'self'"],
					// Allow the Google Identity Services loader while keeping inline/eval allowances
					// used elsewhere in the app. Consider moving to nonces/hashes later.
					"script-src": [
						"'self'",
						"'unsafe-inline'",
						"'unsafe-eval'",
						"https://accounts.google.com",
						"https://apis.google.com",
						"https://*.gstatic.com",
					],
					"style-src": ["'self'", "'unsafe-inline'"],
					// Permit remote images (e.g., Unsplash wallpapers) in addition to local/data/blob
					"img-src": [
						"'self'",
						"data:",
						"blob:",
						"https:",
					],
					// Allow required outbound connections for GIS and similar SDKs
					"connect-src": [
						"'self'",
						"https://accounts.google.com",
						"https://*.googleapis.com",
						"https://*.gstatic.com",
						"https://apis.google.com",
					],
					// Allow embedding external applications without enumerating domains.
					// Keep clickjacking protection via frame-ancestors from Helmet defaults.
					"frame-src": [
						"'self'",
						"https:",
						"blob:",
						"data:",
						// Allow http: only in development for local testing
						...(configuration.development ? ["http:"] : []),
					],
				}
			},
			referrerPolicy: { policy: "no-referrer" },
			crossOriginEmbedderPolicy: false,
			// Some OAuth/GIS popup flows require COOP to be disabled
			crossOriginOpenerPolicy: { policy: "unsafe-none" },
			hsts: configuration.development
				? false
				: {
					maxAge: 63072000,
					includeSubDomains: true,
					preload: true,
				},
		};

		app.use(helmet(helmetConfig));

		if (configuration.development) {
			app.use(nocache());
		} else {
			app.disable("x-powered-by");
		}

		// Handle sessions
		app.use(session);

		// Handle bodies
		app.use(
			bodyParser.urlencoded({
				extended: false,
				limit,
			})
		);

		app.use(
			bodyParser.json({
				limit,
			})
		);

		app.use(
			bodyParser.raw({
				limit,
			})
		);
	}

	/**
	 * Initializes Express base routes, etc.
	 */
	initResourceRoutes() {
		const { app, configuration } = this.core;
		const indexFile = path.join(configuration.public, configuration.index);

		app.get("/", (req, res) => res.sendFile(indexFile));
		app.use("/", express.static(configuration.public));

		// Internal ping
		app.get("/ping", (req, res) => {
			this.core.emit("meeseOS/core:ping", req);

			try {
				req.session.touch();
			} catch (e) {
				this.core.logger.warn(e);
			}

			res.status(200).send("ok");
		});
	}

	/**
	 * Initializes Socket routes.
	 */
	initSocketRoutes() {
		const { app } = this.core;

		app.ws("/", (ws, req) => {
			ws.upgradeReq = ws.upgradeReq || req;
			ws._meeseOS_client = { ...req.session.user };

			const interval = this.core.config("ws.ping", 0);

			const pingInterval = interval
				? setInterval(() => {
					ws.send(
						JSON.stringify({
							name: "meeseOS/core:ping",
						})
					);
				}, interval)
				: undefined;

			ws.on("close", () => {
				clearInterval(pingInterval);
			});

			ws.on("message", (msg) => {
				try {
					const { name, params } = JSON.parse(msg);

					if (typeof name === "string" && params instanceof Array) {
						// We don't wanna allow any internal signals from the outside!
						if (
							name.match(/^meeseOS/) &&
							name !== "meeseOS/application:socket:message"
						) {
							return;
						}

						this.core.emit(name, ws, ...params);
					}
				} catch (e) {
					this.core.logger.warn(e);
				}
			});

			ws.send(
				JSON.stringify({
					name: "meeseOS/core:connected",
					params: [
						{
							cookie: {
								maxAge: this.core.config("session.options.cookie.maxAge"),
							},
						},
					],
				})
			);
		});
	}

	/**
	 * Initializes Express proxies.
	 */
	initProxies() {
		const { app, configuration } = this.core;
		const proxies = (configuration.proxy || [])
			.map((item) => ({
				source: null,
				destination: null,
				options: {},
				...item,
			}))
			.filter((item) => item.source && item.destination);

		proxies.forEach((item) => {
			this.core.logger.info(`Proxying ${item.source} -> ${item.destination}`);
			app.use(item.source, proxy(item.destination, item.options));
		});
	}

	/**
	 * Initializes some developer features.
	 */
	initDeveloperTools() {
		try {
			const watchdir = path.resolve(this.core.configuration.public);
			const watcher = chokidar.watch(watchdir);

			watcher.on("change", (filename) => {
				// NOTE: 'ignored' does not work as expected with callback
				// ignored: str => str.match(/\.(js|css)$/) === null
				// for unknown reasons
				if (!/\.(js|css)$/i.test(filename)) return;

				const relative = filename.replace(watchdir, "");
				this.core.broadcast("meeseOS/dist:changed", [relative]);
			});

			this.watches.push(watcher);
		} catch (e) {
			this.core.logger.warn(e);
		}
	}
}

module.exports = CoreServiceProvider;
