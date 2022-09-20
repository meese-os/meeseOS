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

import DigitalClock from "./items/digitalclock";
import AnalogClock from "./items/analogclock";

/**
 * Widget Service Provider
 *
 * @desc Provides methods to handle widgets on a desktop in MeeseOS
 */
export default class WidgetServiceProvider {
	constructor(core, args = {}) {
		this.core = core;
		this.widgets = [];
		this.inited = false;
		this.registry = {
			digitalclock: DigitalClock,
			analogclock: AnalogClock,
			...(args.registry || {}),
		};
	}

	destroy() {
		this.widgets.forEach(({ widget }) => widget.destroy());
		this.widgets = [];
	}

	init() {
		const iface = {
			register: (name, classRef) => {
				if (this.registry[name]) {
					console.warn("Overwriting previously registered widget item", name);
				}

				this.registry[name] = classRef;
			},

			removeAll: () => {
				this.widgets.forEach(({ widget }) => widget.destroy());
				this.widgets = [];
			},

			remove: (widget) => {
				const index = typeof widget === "number"
					? widget
					: this.widgets.findIndex((w) => w.widget === widget);

				if (index >= 0) {
					this.widgets[index].widget.destroy();
					this.widgets.splice(index, 1);
				}
			},

			create: (item) => {
				const ClassRef = this.registry[item.name];
				const widget = new ClassRef(this.core, item.options);
				this.widgets.push({ name: item.name, widget });

				if (this.inited) {
					widget.init();
				}

				return widget;
			},

			get: (name) => this.registry[name],

			list: () => Object.keys(this.registry),

			save: () => {
				const settings = this.core.make("meeseOS/settings");
				const widgets = this.widgets.map(({ name, widget }) => ({
					name,
					options: widget.options,
				}));

				return Promise.resolve(
					settings.set("meeseOS/desktop", "widgets", widgets)
				).then(() => settings.save());
			},
		};

		this.core.singleton("meeseOS/widgets", () => iface);

		this.core.on("meeseOS/desktop:transform", () => {
			this.widgets.forEach(({ widget }) => widget.updatePosition(true));
		});
	}

	start() {
		this.inited = true;
		this.widgets.forEach(({ widget }) => widget.init());
		const desktop = this.core.make("meeseOS/desktop");

		let resizeDebounce;
		window.addEventListener("resize", () => {
			clearTimeout(resizeDebounce);
			resizeDebounce = setTimeout(() => this._clampWidgets(), 200);
		});

		if (typeof desktop.addContextMenuEntries === "function") {
			desktop.addContextMenuEntries(() => {
				const widgets = this.core.make("meeseOS/widgets");

				// TODO: In the parent, implement the "Add Shortcut" menu item
				return [
					{
						label: "Add Widget",
						items: widgets.list().map((t) => {
							const classRef = this.registry[t];
							const metadata = classRef.metadata(this.core);

							return {
								label: metadata.title ? metadata.title : t,
								onclick: () => {
									widgets.create({ name: t });
									widgets.save();
								},
							};
						}),
					},
				];
			});
		}

		this._clampWidgets();
	}

	_clampWidgets(resize) {
		if (resize && !this.core.config("windows.clampToViewport")) {
			return;
		}

		this.widgets.forEach((w) => w.widget.clampToViewport());
	}
}
