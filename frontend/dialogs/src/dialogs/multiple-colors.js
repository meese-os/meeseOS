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

import {
	Box,
	BoxContainer,
	RangeField,
	SelectField,
	TextField,
} from "@aaronmeese.com/gui";
import { app, h } from "hyperapp";
import Dialog from "../dialog";

/**
 * Creates a palette canvas at the specified dimensions
 * @param {Number} width
 * @param {Number} height
 */
const createPalette = (width = 98, height = 98) => {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext("2d");

	let gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
	gradient.addColorStop(0, "rgb(255,   0,   0)");
	gradient.addColorStop(0.15, "rgb(255,   0, 255)");
	gradient.addColorStop(0.33, "rgb(0,     0, 255)");
	gradient.addColorStop(0.49, "rgb(0,   255, 255)");
	gradient.addColorStop(0.67, "rgb(0,   255,   0)");
	gradient.addColorStop(0.84, "rgb(255, 255,   0)");
	gradient.addColorStop(1, "rgb(255,   0,   0)");

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
	gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
	gradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
	gradient.addColorStop(0.5, "rgba(0,     0,   0, 0)");
	gradient.addColorStop(1, "rgba(0,     0,   0, 1)");

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	return canvas;
};

/**
 * Converts hex to its component values
 */
const hexToComponent = (hex = "#000000") => {
	if (typeof hex === "object") hex = hex.hex;
	const rgb = parseInt(hex.replace("#", ""), 16);
	const val = {};
	val.r = (rgb & (255 << 16)) >> 16;
	val.g = (rgb & (255 << 8)) >> 8;
	val.b = rgb & 255;
	return val;
};

/**
 * Convert component values into hex
 */
const componentToHex = ({ r, g, b }) => {
	const hex = [
		parseInt(r, 10).toString(16),
		parseInt(g, 10).toString(16),
		parseInt(b, 10).toString(16),
	].map((i) => (String(i).length === 1 ? "0" + String(i) : i));

	return "#" + hex.join("").toUpperCase();
};

/**
 * Gets the color of a clicked palette area
 */
const colorFromClick = (ev, canvas) => {
	const { clientX, clientY } = ev;
	const box = canvas.getBoundingClientRect();
	const cx = clientX - box.x;
	const cy = clientY - box.y;
	const ctx = canvas.getContext("2d");
	const { data } = ctx.getImageData(cx, cy, 1, 1);
	const [r, g, b] = data;
	const hex = componentToHex({ r, g, b });
	return { r, g, b, hex };
};

/**
 * Default MeeseOS Multiple Colors Dialog
 */
export default class MultipleColorsDialog extends Dialog {
	/**
	 * Constructor
	 * @param {Core} core MeeseOS Core reference
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
					title: args.title || "Select Colors",
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
		this.value = args.colors || { default: "#000000" };

		// Initially set the selected color to the first in the list
		const [firstKey] = Object.keys(this.value);
		this.selectedColor = firstKey;

		// TODO: Store copy of original colors, so we can revert if user cancels
		// TODO: Close dialog if the widget is deleted
	}

	render(options) {
		super.render(options, ($content) => {
			const canvas = createPalette(98, 98);
			const initialState = Object.assign({}, this);
			const initialActions = {
				setColor: (newHex) => (state) =>
					(this.value[this.selectedColor] = state.value[state.selectedColor] =
						newHex),
				setColors: (colors) => (state) => (this.value = state.value = colors),
				setSelectedColor: (color) => (state) =>
					(this.selectedColor = state.selectedColor = color),
				// color -> r, g, or b; newValue -> 0-255
				setComponent:
					({ color, newValue }) =>
					(state) => {
						const previousHex = this.value[this.selectedColor];
						const previousComponent = hexToComponent(previousHex);
						const newComponent = {
							...previousComponent,
							[color]: newValue,
						};

						const newHex = componentToHex(newComponent);
						this.value[this.selectedColor] = state.value[
							state.selectedColor
						] = newHex;

						return { [color]: newValue };
					},
			};

			const rangeContainer = (color, value, actions) =>
				h(Box, { orientation: "vertical", align: "center", padding: false }, [
					h(Box, { shrink: 1 }, h("div", {}, color.toUpperCase())),
					h(RangeField, {
						box: { grow: 1 },
						min: 0,
						max: 255,
						value: value,
						oncreate: (el) => (el.value = value),
						oninput: (ev, newValue) => {
							newValue = Number(newValue);
							actions.setComponent({ color: color, newValue });
						},
						onchange: (ev, newValue) => {
							newValue = Number(newValue);
							actions.setComponent({ color: color, newValue });
						},
					}),
					h(TextField, {
						box: { shrink: 1, basis: "5em" },
						type: "number",
						value: Number(value),
						oncreate: (el) => (el.value = Number(value)),
						oninput: (ev, newValue) => {
							newValue = Number(newValue);
							actions.setComponent({ color: color, newValue });
						},
					}),
				]);

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
								// TODO: Add mapped labels
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
