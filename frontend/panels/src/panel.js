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

import { EventEmitter } from "@meeseOS/event-emitter";
import PanelItem from "./panel-item";

/**
 * Panel
 *
 * @desc Base Panel Class
 */
export default class Panel extends EventEmitter {
	/**
	 * Create panel
	 *
	 * @param {Core} core MeeseOS Core instance reference
	 * @param {Object} options Options
	 */
	constructor(core, options = {}) {
		super("Panel");

		this.core = core;
		this.options = {

			ontop: true,
			position: "top",
			contextmenu: true,
			items: [],
			...options
		};

		this.items = [];
		this.inited = false;
		this.destroyed = false;
		this.$element = null;

		this.options.items.forEach(({ name, options }) => {
			const c = core.make("meeseOS/panels").get(name);
			this.addItem(new c(this.core, this, options || {}));
		});
	}

	/**
	 * Destroys the panel
	 */
	destroy() {
		if (this.destroyed) {
			return;
		}

		this.items = this.items.filter((item) => {
			try {
				item.destroy();
			} catch (e) {
				console.warn(e);
			}
			return false;
		});

		this.destroyed = true;
		this.inited = false;
		this.emit("destroy");
		this.core.emit("meeseOS/panel:destroy", this);

		this.$element.remove();
		this.$element = null;
	}

	/**
	 * Initializes the panel
	 */
	init() {
		if (this.inited) {
			return;
		}
		this.destroyed = false;
		this.inited = true;

		this.$element = document.createElement("div");
		this.$element.classList.add("meeseOS-panel");
		this.$element.classList.add("meeseOS__contextmenu");
		this.$element.addEventListener("contextmenu", (ev) => {
			ev.preventDefault();

			const disabled =
				this.core.config("desktop.lock") ||
				this.core.config("desktop.disablePanelContextMenu");

			if (disabled) {
				return;
			}

			this.core.make("meeseOS/contextmenu").show({
				position: ev,
				menu: [
					{
						label: "Panel Position",
						items: [
							{
								label: "Top",
								onclick: () => this.setPosition("top"),
							},
							{
								label: "Bottom",
								onclick: () => this.setPosition("bottom"),
							},
						],
					},
				],
			});
		});
		this.$element.setAttribute("data-position", this.options.position);
		this.$element.setAttribute("data-ontop", String(this.options.ontop));

		this.core.$root.appendChild(this.$element);

		this.items.forEach((item) => item.init());

		this.emit("create");
	}

	/**
	 * Add an item to the panel
	 * @param {PanelItem} item The panel item instance
	 */
	addItem(item) {
		if (!(item instanceof PanelItem)) {
			throw new TypeError("Invalid panel item specified");
		}

		this.items.push(item);

		if (this.inited) {
			item.init();
		}
	}

	setPosition(position) {
		this.options.position = position;

		return this.core
			.make("meeseOS/panels")
			.save()
			.then(() => {
				const desktop = this.core.make("meeseOS/desktop");
				return desktop.applySettings();
			});
	}
}
