/*
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

import defaultIcon from "./styles/icon.png";

/**
 * TODO: typedef
 * @typedef {Object} CoreConfig
 */

const createUri = (str) =>
	str.replace(/(index\.(html?|php))$/, "").replace(/\/?$/, "/");

const pathname = createUri(window.location.pathname);
const href = createUri(window.location.href);
const development = !(process.env.NODE_ENV || "").match(/^prod/i);

export const defaultConfiguration = {
	development: development,
	standalone: false,

	http: {
		ping: true,
		public: pathname,
		uri: href,
	},

	ws: {
		connectInterval: 5000,
		uri: href.replace(/^http/, "ws"),
		disabled: false,
	},

	packages: {
		manifest: "/metadata.json",
		metadata: [],
		hidden: [],
		permissions: {},
		overrideMetadata: {},
	},

	application: {
		pinned: [],
		autostart: [],
		categories: {
			development: {
				label: "Development",
				icon: "applications-development",
			},
			science: {
				label: "Science",
				icon: "applications-science",
			},
			games: {
				label: "Games",
				icon: "applications-games",
			},
			graphics: {
				label: "Graphics",
				icon: "applications-graphics",
			},
			network: {
				label: "Network",
				icon: "applications-internet",
			},
			multimedia: {
				label: "Multimedia",
				icon: "applications-multimedia",
			},
			office: {
				label: "Office",
				icon: "applications-office",
			},
			system: {
				label: "System",
				icon: "applications-system",
			},
			utilities: {
				label: "Utilities",
				icon: "applications-utilities",
			},
			other: {
				label: "Other",
				icon: "applications-other",
			},
		},
		windows: [
			/*
      {
        application: string | RegExp | undefined,
        window: string | RegExp | undefined,
        options: {
          dimension: object | undefined,
          position: object | undefined,
          attributes: object | undefined
        }
      }
      */
		],
	},

	auth: {
		ui: {},

		cookie: {
			name: "meeseOS.auth",
			expires: 7,
			enabled: true,
			// Only supports HTTPS in production, but allows insecure cookies in development
			secure: !development,
		},

		// The default credentials to use when logging in
		login: {
			username: "guest",
			password: "guest",
		},

		// The default values for newly registered users
		defaultUserData: {
			username: "user",
			groups: ["user"],
		},

		allowGuest: true,
	},

	settings: {
		lock: [],

		defaults: {
			"meeseOS/default-application": {},
			"meeseOS/session": [],
			"meeseOS/desktop": {},
		},
	},

	search: {
		enabled: true,
	},

	notifications: {
		native: false,
	},

	desktop: {
		lock: false,
		contextmenu: {
			enabled: true,
			defaults: true,
		},

		settings: {
			font: "Roboto",
			theme: "StandardTheme",
			sounds: "Sounds",
			icons: "GnomeIcons",
			animations: false,
			panels: [
				{
					position: "top",
					items: [
						{ name: "menu" },
						{ name: "windows" },
						{ name: "tray" },
						{ name: "clock" },
					],
				},
			],
			widgets: [],
			keybindings: {
				"open-application-menu": "shift+alt+a",
				"close-window": "shift+alt+w",
			},
			notifications: {
				position: "top-right",
			},
			background: {
				type: "static",
				random: true,
				src: "meeseOS:/wallpapers/Wallpapers/plain.png",
				color: "#572a79",
				style: "cover",
			},
			iconview: {
				enabled: true,
				path: "home:/.desktop",
				fontColorStyle: "system",
				fontColor: "#ffffff",
			},
		},
	},

	windows: {
		lofi: false,
		mobile: false, // Trigger for setting mobile UI
		template: null, // A string. See 'window.js' for example
		clampToViewport: true, // Clamp windows to viewport on resize
		moveKeybinding: "ctrl",
	},

	vfs: {
		watch: true,
		defaultPath: "home:/",
		defaultAdapter: "system",
		adapters: {},
		mountpoints: [
			{
				name: "apps",
				label: "Applications",
				adapter: "apps",
				icon: defaultIcon,
				attributes: {
					visibility: "restricted",
					readOnly: true,
				},
			},
			{
				name: "meeseOS",
				label: "MeeseOS",
				adapter: "system",
				icon: { name: "folder-publicshare" },
			},
			{
				name: "home",
				label: "Home",
				adapter: "system",
				icon: { name: "user-home" },
			},
		],
		icons: {
			"^application/zip": { name: "package-x-generic" },
			"^application/javascript": { name: "text-x-script" },
			"^application/json": { name: "text-x-script" },
			"^application/x-python": { name: "text-x-script" },
			"^application/php": { name: "text-x-script" },
			"^application/pdf": { name: "x-office-document" },
			"^application/rtf": { name: "x-office-document" },
			"^application/msword": { name: "x-office-document" },
			"^application/(xz|tar|gzip)": { name: "package-x-generic" },
			"^text/css": { name: "text-x-script" },
			"^text/html": { name: "text-html" },
			"^(application|text)/xml": { name: "text-html" },
			"^application": { name: "application-x-executable" },
			"^text": { name: "text-x-generic" },
			"^audio": { name: "audio-x-generic" },
			"^video": { name: "video-x-generic" },
			"^image": { name: "image-x-generic" },
		},
	},

	providers: {
		globalBlacklist: ["meeseOS/websocket", "meeseOS/clipboard", "meeseOS/gapi"],
		globalWhitelist: [],
	},
};
