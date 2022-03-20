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
 * @licence Simplified BSD License
 */

import merge from "deepmerge";

const MIN_WIDTH = 200;
const MIN_HEIGHT = 200;
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const DEFAULT_MARGIN = 15;
const EMIT_TIMEOUT = 44;
const isNull = (val) => typeof val === "undefined" || val === null;

const getPosition = (core, position, nullValue = null) => {
	const rect = core.destroyed ? {} : core.make("meeseOS/desktop").getRect();

	let { top, left, right, bottom } = position;

	if (isNull(left) && isNull(right)) {
		left = rect.left + DEFAULT_MARGIN;
	} else if (!isNull(left)) {
		right = nullValue;
	} else {
		left = nullValue;
	}

	if (isNull(top) && isNull(bottom)) {
		top = rect.top + DEFAULT_MARGIN;
	} else if (!isNull(top)) {
		bottom = nullValue;
	} else {
		top = nullValue;
	}

	return { top, left, right, bottom };
};

const animator = (fps, stopFn) => {
	const interval = 1000 / fps;
	let last = performance.now();

	const animate = (cb) => {
		const now = performance.now();
		const elapsed = now - last;

		if (elapsed > interval) {
			last = now - (elapsed % interval);

			cb();
		}

		if (!stopFn()) {
			requestAnimationFrame(() => animate(cb));
		}
	};

	return animate;
};

const onmousedown = (ev, $root, widget) => {
	let debounce;
	const startX = ev.clientX;
	const startY = ev.clientY;
	const startPosition = {
		left: widget.$element.offsetLeft,
		top: widget.$element.offsetTop,
	};
	const startDimension = { ...widget.options.dimension };
	const resize = ev.target.classList.contains("meeseOS-widget-resize");
	const { minDimension, maxDimension } = widget.attributes;

	const mousemove = (ev) => {
		const diffX = ev.clientX - startX;
		const diffY = ev.clientY - startY;

		// TODO: Aspect Ratio!

		clearTimeout(debounce);

		if (resize) {
			let newWidth = startDimension.width + diffX;
			let newHeight = startDimension.height + diffY;
			newWidth = Math.min(
				maxDimension.width,
				Math.max(minDimension.width, newWidth)
			);
			newHeight = Math.min(
				maxDimension.height,
				Math.max(minDimension.height, newHeight)
			);

			widget.options.dimension.width = newWidth;
			widget.options.dimension.height = newHeight;
			widget.updateDimension();
			debounce = setTimeout(() => widget.onResize(), EMIT_TIMEOUT);
		} else {
			widget.options.position.top = startPosition.top + diffY;
			widget.options.position.left = startPosition.left + diffX;
			widget.updatePosition();
			debounce = setTimeout(() => widget.onMove(), EMIT_TIMEOUT);
		}
	};

	const mouseup = (ev) => {
		window.removeEventListener("mousemove", mousemove);
		window.removeEventListener("mouseup", mouseup);

		widget.$element.classList.remove("active");
		$root.setAttribute("data-window-action", String(false));

		widget.saveSettings();
	};

	window.addEventListener("mousemove", mousemove);
	window.addEventListener("mouseup", mouseup);

	widget.$element.classList.add("active");
	$root.setAttribute("data-window-action", String(true));
};

export const clampPosition = (rect, { dimension, position }) => {
	const maxLeft = rect.width - dimension.width;
	const maxTop = rect.height - dimension.height;

	return {
		left: Math.max(0, Math.min(maxLeft, position.left)),
		top: Math.max(0, Math.max(rect.top, Math.min(maxTop, position.top))),
	};
};

export default class Widget {
	/**
	 * @param {Object} options The options from the provider create function (usually settings storage result)
	 * @param {Object} [attrs] Widget attributes
	 * @param {Object} [settings] A set of defaults for the settings storage
	 */
	constructor(core, options, attrs = {}, settings = {}) {
		this.core = core;
		this.dialog = null;
		this.$element = document.createElement("div");
		this.$canvas = document.createElement("canvas");
		this.context = this.$canvas.getContext("2d");
		this.destroyed = false;
		this.saveDebounce = null;
		this.attributes = {
			aspect: false,
			canvas: true,
			fps: 1,
			position: {
				top: null,
				left: null,
				right: null,
				bottom: null,
			},
			dimension: {
				width: MIN_WIDTH,
				height: MIN_HEIGHT,
			},
			minDimension: null,
			maxDimension: {
				width: MAX_WIDTH,
				height: MAX_HEIGHT,
			},
			...attrs,
		};

		if (this.attributes.minDimension === null) {
			this.attributes.minDimension = {
				width: MIN_WIDTH,
				height: MIN_HEIGHT,
				...this.attributes.dimension,
			};
		}

		if (this.attributes.aspect === true) {
			const { width, height } = this.attributes.dimension;
			const { maxDimension } = this.attributes;
			const aspect = width / height;

			this.attributes.aspect = aspect;
			this.attributes.minDimension.height = width / aspect;
			this.attributes.maxDimension.height = maxDimension.width * aspect;
		}

		this.options = {
			position: { ...this.attributes.position },
			dimension: { ...this.attributes.dimension },
			...settings,
			...options,
		};
	}

	destroy() {
		if (this.destroyed) return;
		this.destroyed = true;
		this.onDestroy();

		this.saveDebounce = clearTimeout(this.saveDebounce);

		if (this.dialog) {
			this.dialog.destroy();
		}

		if (this.$element && this.$element.parentNode) {
			this.$element.remove();
		}

		this.$canvas = null;
		this.$element = null;
		this.context = null;
		this.dialog = null;
		this.options = {};
		this.attributes = {};
	}

	/**
	 * @param {Object} options
	 * @param {number} options.width
	 * @param {number} options.height
	 * @param {HTMLCanvasElement} options.canvas
	 * @param {CanvasRenderingContext2D} options.context
	 */
	render(viewport) {}

	start() {
		const render = () =>
			this.render({
				// Occasionally throws "Uncaught TypeError: Cannot read properties of undefined (reading 'width')"
				width: this.options.dimension.width,
				height: this.options.dimension.height,
				canvas: this.$canvas,
				context: this.context,
			});

		this.updateDimension();
		this.updatePosition();
		this.onResize();
		this.onMove();

		render();

		if (this.attributes.canvas) {
			animator(this.attributes.fps, () => this.destroyed)(() => render());
		}

		setTimeout(() => this.clampToViewport(), 100);
	}

	init() {
		const $root = this.core.$contents;
		const resizer = document.createElement("div");
		resizer.classList.add("meeseOS-widget-resize");

		this.$element.appendChild(resizer);
		this.$element.addEventListener("mousedown", (ev) =>
			onmousedown(ev, $root, this)
		);
		this.$element.addEventListener("contextmenu", (ev) =>
			this.onContextMenu(ev)
		);
		this.$element.classList.add("meeseOS-widget");
		$root.appendChild(this.$element);

		if (this.attributes.canvas) {
			this.$element.appendChild(this.$canvas);
		}

		this.start();
	}

	updateDimension() {
		if (this.destroyed) return;

		const { width, height } = this.options.dimension;
		this.$element.style.width = String(width) + "px";
		this.$element.style.height = String(height) + "px";
		this.$canvas.width = width;
		this.$canvas.height = height;
	}

	updatePosition() {
		if (this.destroyed) return;

		const { left, right, top, bottom } = getPosition(
			this.core,
			this.options.position,
			"auto"
		);
		const getValue = (val) => (typeof val === "string" ? val : `${val}px`);

		this.$element.style.left = getValue(left);
		this.$element.style.right = getValue(right);
		this.$element.style.top = getValue(top);
		this.$element.style.bottom = getValue(bottom);
	}

	saveSettings() {
		this.saveDebounce = clearTimeout(this.saveDebounce);
		this.saveDebounce = setTimeout(
			() => this.core.make("meeseOS/widgets").save(),
			100
		);
	}

	getContextMenu() {
		return [];
	}

	onDestroy() {}

	onResize() {}

	onMove() {}

	onContextMenu(ev) {
		const menu = [
			...this.getContextMenu(),
			{
				label: "Remove Widget",
				onclick: () => {
					this.core.make("meeseOS/widgets").remove(this);
					this.core.make("meeseOS/widgets").save();
				},
			},
		];

		this.core.make("meeseOS/contextmenu").show({
			position: ev,
			menu,
		});
	}

	_createDialog(options, callbackRender, callbackValue) {
		if (this.dialog) {
			return false;
		}

		const callbackButton = (btn, options) => {
			if (btn === "ok") {
				this.options = merge(this.options, options);
				this.saveSettings();
			}
		};

		const dialogOptions = {
			buttons: ["ok", "cancel"],
			window: options || {},
		};

		this.dialog = this.core
			.make("meeseOS/dialogs")
			.create(dialogOptions, callbackValue, callbackButton)
			.render(callbackRender);

		this.dialog.win.on("destroy", () => (this.dialog = null));

		return this.dialog;
	}

	clampToViewport() {
		// TODO: Uncaught TypeError: Cannot read properties of undefined (reading 'top'
			// after changing the wallpaper type
		const { top, left } = this.options.position;
		const rect = this.core.make("meeseOS/desktop").getRect();
		const pos = clampPosition(rect, this.options);

		if (pos.left !== left || pos.top !== top) {
			this.options.position = { ...pos };
			this.updatePosition();
		}
	}

	static metadata() {
		return {
			title: undefined,
		};
	}
}
