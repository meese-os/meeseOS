/**
 * MeeseOS - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2022-Present, Aaron Meese <aaron@meese.dev>
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

import { Box, RangeField, TextField } from "@meese-os/gui";
import { h } from "hyperapp";

/**
 * Creates a palette canvas at the specified dimensions
 * @param {Number} width
 * @param {Number} height
 */
export const createPalette = (width = 98, height = 98) => {
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
 * Convert component values into hex
 */
export const componentToHex = ({ r, g, b }) => {
	const hex = [
		parseInt(r, 10).toString(16),
		parseInt(g, 10).toString(16),
		parseInt(b, 10).toString(16),
	].map((i) => (String(i).length === 1 ? "0" + String(i) : i));

	return "#" + hex.join("").toUpperCase();
};

/**
 * Converts hex to its component values
 */
export const hexToComponent = (hex = "#000000") => {
	if (typeof hex === "object") hex = hex.hex;
	const rgb = parseInt(hex.replace("#", ""), 16);
	const val = {};
	val.r = (rgb & (255 << 16)) >> 16;
	val.g = (rgb & (255 << 8)) >> 8;
	val.b = rgb & 255;
	return val;
};

/**
 * Gets the color of a clicked palette area
 */
export const colorFromClick = (ev, canvas) => {
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
 * Creates and returns a range slider element
 * @param {String} color hexadecimal color
 * @param {Object} value TODO: typedef
 * @param {Object} actions TODO: typedef
 */
export const rangeContainer = (color, value, actions) =>
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
