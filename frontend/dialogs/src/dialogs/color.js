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

import { Box, BoxContainer, TextField } from "@meeseOS/gui";
import {
	componentToHex,
	colorFromClick,
	createPalette,
	hexToComponent,
	rangeContainer,
} from "../color-utils";
import { app, h } from "hyperapp";
import Dialog from "../dialog";

/**
 * Default MeeseOS Color Dialog
 */
export default class ColorDialog extends Dialog {
	/**
	 * Constructor
	 * @param {Core} core MeeseOS Core instance reference
	 * @param {Object} args Arguments given from service creation
	 * @param {String} [args.title] Dialog title
	 * @param {Function} callback The callback function
	 */
	constructor(core, args, callback) {
		super(
			core,
			args,
			{
				className: "color",
				buttons: ["ok", "cancel"],
				window: {
					title: args.title || "Select Color",
					attributes: {
						minDimension: {
							width: 500,
							height: 260,
						},
					},
				},
			},
			callback
		);

		this.value = { r: 0, g: 0, b: 0, hex: "#000000" };

		let color = args.color;
		if (color) {
			if (typeof color === "string") {
				if (color.startsWith("rgb")) {
					const colorComponents = color
						.replace(/^rgb\(/, "")
						.replace(/\)$/, "")
						.split(",")
						.map((v) => parseInt(v, 10));

					color = componentToHex({
						r: colorComponents[0],
						g: colorComponents[1],
						b: colorComponents[2],
					});
				} else if (color.charAt(0) !== "#") {
					color = "#" + color;
				}

				this.value = { ...this.value, ...hexToComponent(color) };
				this.value.hex = color;
			} else {
				this.value = { ...this.value, ...color };
				this.value.hex = componentToHex(this.value);
			}
		}
	}

	render(options) {
		super.render(options, ($content) => {
			const canvas = createPalette(98, 98);
			const initialState = { ...this.value };
			const initialActions = {
				setColor: (color) => (state) => color,
				setComponent:
					({ color, newValue }) =>
						(state) => {
							this.value[color] = newValue;

							// Updates the hex as well, since that logic has since been
							// abstracted to color-utils
							const hex = componentToHex(state);
							this.value.hex = hex;

							return { [color]: newValue, hex };
						},
				updateHex: () => (state) => {
					const hex = componentToHex(state);
					this.value.hex = hex;
					return { hex };
				},
			};

			const a = app(
				initialState,
				initialActions,
				(state, actions) =>
					this.createView([
						h(Box, { orientation: "vertical", grow: 1, shrink: 1 }, [
							h(BoxContainer, { orientation: "horizontal" }, [
								h("div", {
									class: "meeseOS-gui-border",
									style: { display: "inline-block" },
									oncreate: (el) => el.appendChild(canvas),
								}),
								h(TextField, {
									value: state.hex,
									style: { width: "100px", color: state.hex },
								}),
							]),
							h(Box, { padding: false, grow: 1, shrink: 1 }, [
								rangeContainer("r", state.r, actions),
								rangeContainer("g", state.g, actions),
								rangeContainer("b", state.b, actions),
							]),
						]),
					]),
				$content
			);

			canvas.addEventListener("click", (ev) => {
				const color = colorFromClick(ev, canvas);
				if (color) {
					a.setColor(color);
					a.updateHex();
				}
			});
		});
	}
}
