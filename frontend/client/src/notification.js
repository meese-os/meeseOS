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

import { app, h } from "hyperapp";
import { createNativeNotification } from "./utils/dom";
import logger from "./logger";

/**
 * Notification Options
 *
 * @typedef {Object} NotificationOptions
 * @property {string} title Title
 * @property {string} message Message
 * @property {string} [sound=message] Sound to play
 * @property {string} [icon] Icon source
 * @property {number} [timeout=5000] Timeout value (0=infinite)
 * @property {string} [className] Adds a DOM class name to notification
 */

/**
 * Notification Implementation
 */
export default class Notification {
	/**
	 * Create notification
	 *
	 * @param {Core} core MeeseOS Core instance reference
	 * @param {Element} root Root DOM element
	 * @param {NotificationOptions} options Options
	 */
	constructor(core, root, options = {}) {
		const defaultLabel = "Notification";

		/**
		 * Core instance reference
		 * @type {Core}
		 * @readonly
		 */
		this.core = core;

		/**
		 * Root node reference
		 * @type {Element}
		 * @readonly
		 */
		this.$root = root;

		/**
		 * Notification DOM node
		 * @type {Element}
		 * @readonly
		 */
		this.$element = document.createElement("div");

		/**
		 * The notification destruction state
		 * @type {Boolean}
		 * @readonly
		 */
		this.destroyed = false;

		/**
		 * Options
		 * @type {NotificationOptions}
		 * @readonly
		 */
		this.options = {
			icon: null,
			title: defaultLabel,
			message: defaultLabel,
			timeout: 5000,
			native: core.config("notifications.native", false),
			sound: "message",
			className: "",
			...options,
		};

		this.core.emit("meeseOS/notification:create", this);
	}

	/**
	 * Destroy notification
	 */
	destroy() {
		if (this.destroyed) {
			return;
		}

		this.destroyed = true;
		this.core.emit("meeseOS/notification:destroy", this);

		this.$element.remove();
		this.$element = null;
		this.$root = null;
	}

	/**
	 * Render notification
	 * @returns {Promise<boolean>}
	 */
	render() {
		const onclick = () => this.destroy();

		const renderCustom = () => {
			const view = (state) =>
				h(
					"div",
					{
						class: "meeseOS-notification-wrapper",
						"data-has-icon": Boolean(state.icon),
						style: {
							backgroundImage: state.icon ? `url(${state.icon})` : undefined,
						},
					},
					[
						h("div", { class: "meeseOS-notification-title" }, state.title),
						h("div", { class: "meeseOS-notification-message" }, state.message),
					]
				);

			this.$element.classList.add("meeseOS-notification");
			if (this.options.className) {
				this.$element.classList.add(this.options.className);
			}

			if (this.options.timeout) {
				setTimeout(() => this.destroy(), this.options.timeout);
			}

			this.$element.addEventListener("click", onclick);

			this.$root.appendChild(this.$element);

			app(this.options, {}, view, this.$element);

			return Promise.resolve(true);
		};

		if (this.options.native) {
			return createNativeNotification(this.options, onclick).catch((err) => {
				logger.warn("Error on native notification", err);
				return renderCustom();
			});
		}

		if (this.options.sound) {
			this.core.make("meeseOS/sounds").play(this.options.sound);
		}

		return renderCustom();
	}
}
