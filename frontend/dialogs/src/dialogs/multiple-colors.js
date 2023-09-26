/**
 * MeeseOS - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2023-Present, Aaron Meese <aaron@meese.dev>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 * 	 and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 * 	 without specific prior written permission.
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
 * @author  Aaron Meese <aaron@meese.dev>
 * @licence Modified BSD License
 */

import { Box, BoxContainer, SelectField, TextField } from "@meese-os/gui";
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
 * Default MeeseOS multiple colors dialog.
 */
export default class MultipleColorsDialog extends Dialog {
	/**
	 * Constructor.
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
					title: args.title ?? "Select Colors",
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

		// Format: { colorOne: "#000000", colorTwo: "#000000", ... }
		this.value = structuredClone(args.colors) ?? { default: "#000000" };

		// IDEA: Show a preview of the new widget
		// TODO: Close dialog if the widget is deleted
	}

	render(options) {
		super.render(options, ($content) => {
			const canvas = createPalette(98, 98);
			const initialState = { ...this };

			// Initially set the selected color to the first in the list
			const [firstKey] = Object.keys(initialState.value);
			initialState.selectedColor = firstKey;

			const initialActions = {
				setColor: (newHex) => (state) =>
					(state.value[state.selectedColor] = newHex),
				setSelectedColor: (color) => (state) => (state.selectedColor = color),
				// color -> r, g, or b; newValue -> 0-255
				setComponent:
					({ color, newValue }) =>
						(state) => {
							const previousHex = state.value[state.selectedColor];
							const previousComponent = hexToComponent(previousHex);
							const newComponent = {
								...previousComponent,
								[color]: newValue,
							};

							const newHex = componentToHex(newComponent);
							state.value[state.selectedColor] = newHex;
							this.value[state.selectedColor] = newHex;
							return { [color]: newValue };
						},
			};

			const a = app(
				initialState,
				initialActions,
				// actions -> the functions listed above the class
				// state -> `this` from the class
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
									value: state.value[state.selectedColor],
									style: {
										width: "100px",
										color: state.value[state.selectedColor],
									},
								}),
							]),
							h(Box, { padding: false, grow: 1, shrink: 1 }, [
								// Creates a rangeContainer element for each color component
								["r", "g", "b"].map((color) =>
									rangeContainer(
										color,
										hexToComponent(state.value[state.selectedColor])[color],
										actions
									)
								),
								h(SelectField, {
									choices: Object.keys(state.value),
									value: state.selectedColor,
									oncreate: (el) => (el.value = state.selectedColor),
									onchange: (event, newColor) => {
										actions.setSelectedColor(newColor);
									},
								}),
							]),
						]),
					]),
				$content
			);

			canvas.addEventListener("click", (ev) => {
				const newColor = colorFromClick(ev, canvas);
				const newHex = newColor.hex;
				a.setColor(newHex);
			});
		});
	}
}
