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
 * @licence Simplified BSD License
 */

import { Box, Button, Toolbar } from "@meeseOS/gui";
import { h } from "hyperapp";
import merge from "deepmerge";
import plain from "is-plain-object";

let dialogCount = 0;

/**
 * Default button attributes
 */
const defaultButtons = () => ({
	ok: { label: "OK", positive: true },
	close: { label: "Close" },
	cancel: { label: "Cancel" },
	yes: { label: "Yes", positive: true },
	no: { label: "No" },
});

/**
 * Creates a button from a name
 * @param {String} name button name
 * @returns {Object} button
 */
const defaultButton = (name) => {
	const defs = defaultButtons();
	if (defs[name]) {
		return {

			name: name,
			...defs[name]
		};
	}

	return { label: name, name: name };
};

/**
 * Creates options
 */
const createOptions = (options, args) =>
	merge(
		{
			id: null,
			className: "unknown",
			defaultValue: null,
			buttons: [],
			sound: null,
			window: {
				id: options.id || "Dialog_" + String(dialogCount),
				title: "Dialog",
				attributes: {
					gravity: "center",
					resizable: false,
					maximizable: false,
					minimizable: false,
					sessionable: false,
					classNames: [
						"meeseOS-dialog",
						`meeseOS-${options.className || "unknown"}-dialog`,
					],
					minDimension: {
						width: 300,
						height: 100,
					},
				},
			},
		},
		options,
		{ isMergeableObject: plain }
	);

/**
 * MeeseOS default Dialog implementation
 *
 * Creates a Window with predefined content and actions(s)
 */
export default class Dialog {
	/**
	 * Constructor
	 * @param {Core} core MeeseOS Core instance reference
	 * @param {Object} args Arguments given from service creation
	 * @param {Object} options Dialog options (including Window)
	 * @param {Object} [options.defaultValue] Default callback value
	 * @param {Function} callback The callback function
	 */
	constructor(core, args, options, callback) {
		this.core = core;
		this.args = args;
		this.callback = callback || function() {};
		this.options = createOptions(options, args);
		this.win = null;
		this.value = undefined;
		this.calledBack = false;

		this.buttons = this.options.buttons.map((n) =>
			typeof n === "string"
				? defaultButton(n)
				: {
					label: n.label || "button",
					name: n.name || "unknown",
				  }
		);

		dialogCount++;
	}

	/**
	 * Destroys the dialog
	 */
	destroy() {
		if (this.win) {
			this.win.destroy();
		}

		this.win = null;
		this.callback = null;
	}

	/**
	 * Renders the dialog
	 * @param {Function} cb Callback from window
	 */
	render(options, cb) {
		const opts = merge(this.options.window || {}, options, {
			isMergeableObject: plain,
		});

		this.win = this.core.make("meeseOS/window", opts);

		this.win.on("keydown", (ev, win) => {
			if (ev.keyCode === 27) {
				this.emitCallback(this.getNegativeButton(), null, true);
			}
		});

		this.win.on("dialog:button", (name, ev) => {
			this.emitCallback(name, ev, true);
		});

		this.win.on("destroy", () => {
			this.emitCallback("destroy");
		});

		this.win.on("close", () => {
			this.emitCallback("cancel", undefined, true);
		});

		this.win.on("render", () => {
			// TODO
			// this.win.resizeFit();
			this.win.focus();

			const focusButton = this.getNegativeButton();
			const btn = focusButton
				? this.win.$content.querySelector(`button[name=${focusButton}]`)
				: null;
			if (btn) {
				btn.focus();
			}

			this.playSound();
		});

		this.win.init();
		this.win.render(cb);
		this.win.focus();

		return this;
	}

	/**
	 * Creates the default view
	 * @param {Object[]} children Child nodes
	 * @param {Object} [state] Pass on application state (mainly used for buttons)
	 * @returns {Object} Virtual dom node
	 */
	createView(children, state = {}) {
		return h(Box, { grow: 1, shrink: 1 }, [
			...children,
			h(Toolbar, { class: "meeseOS-dialog-buttons" }, [
				...this.createButtons(state.buttons || {}),
			]),
		]);
	}

	/**
	 * Gets the button (virtual) DOM elements
	 * @param {Object} [states] Button states
	 * @returns {Object[]} Virtual dom node children list
	 */
	createButtons(states = {}) {
		const onclick = (name, event) => {
			this.win.emit("dialog:button", name, event);
		};

		return this.buttons.map((button) =>
			h(
				Button,
				{

					disabled: states[button.name] === false,
					onclick: (event) => onclick(button.name, event),
					...button
				}
			)
		);
	}

	/**
	 * Emits the callback
	 * @param {String} name Button or action name
	 * @param {Event} [event] Browser event reference
	 * @param {Boolean} [close=false] Close dialog
	 */
	emitCallback(name, event, close = false) {
		if (this.calledBack) return;
		this.calledBack = true;

		console.debug("Callback in dialog", name, event, close);

		this.callback(name, this.getValue(), event);

		if (close) {
			this.destroy();
		}
	}

	/**
	 * Plays a sound
	 * @returns {boolean} whether the sound was played
	 */
	playSound() {
		if (this.core.has("meeseOS/sounds")) {
			const snd = this.options.sound;
			if (snd) {
				this.core.make("meeseOS/sounds").play(snd);

				return true;
			}
		}

		return false;
	}

	/**
	 * Gets the first positive button
	 * @returns {String|undefined}
	 */
	getPositiveButton() {
		const found = this.buttons.find((button) => button.positive === true);
		return found ? found.name : null;
	}

	/**
	 * Gets the first negative button
	 * @returns {String|undefined}
	 */
	getNegativeButton() {
		const found = this.buttons.find((button) => !button.positive);
		return found ? found.name : null;
	}

	/**
	 * Gets the dialog result value
	 * @returns {*}
	 */
	getValue() {
		// TODO: Customize this so it can take other values
		return typeof this.value === "undefined"
			? this.options.defaultValue
			: this.value;
	}
}
