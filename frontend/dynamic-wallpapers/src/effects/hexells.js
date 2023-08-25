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
 * @author  Aaron Meese <aaron@meese.dev>
 * @licence Simplified BSD License
 */

const Hexells = require("hexells");

/**
 * A mapping of the variable names to their relevant information.
 */
const hexellsOptions = {
	powerPreference: {
		label: "Power Preference",
		type: "select",
		defaultValue: "default",
		choices: () => ({
			default: "Default",
			"low-power": "Low Power",
			"high-performance": "High Performance",
		}),
	},
	brushRadius: {
		label: "Brush Radius",
		type: "number",
		defaultValue: 16,
	},
	stepPerFrame: {
		label: "Steps Per Frame",
		type: "number",
		defaultValue: 1,
	},
	timePerModel: {
		label: "Time Per Model",
		type: "number",
		defaultValue: 20 * 1000,
	},
	responsive: {
		label: "Responsive",
		type: "boolean",
		defaultValue: false,
	},
	fps: {
		label: "FPS",
		type: "number",
		defaultValue: 10,
	},
};

/**
 * Stores the Hexells effect so it can be destroyed.
 */
let effect = {};

/**
 * Creates a Hexells effect.
 * @param {HTMLDivElement} background The background element to add the canvas to
 * @param {Object} options The options to use for the effect
 * @link https://znah.net/hexells/
 */
const hexells = (background, options) => {
	const defaults = Object.keys(hexellsOptions).map((key) => ({
		[key]: hexellsOptions[key].defaultValue,
	}));

	// Override the defaults with any user-provided options
	const settings = Object.assign({}, ...defaults, options);

	// Initialize the Hexells effect
	console.debug("Initializing Hexells effect");
	const canvas = document.createElement("canvas");
	background.appendChild(canvas);
	effect = new Hexells(canvas, settings);

	// Set the canvas width and height to the screen width and height
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	/**
	 * Ensures that the canvas will always be the smallest possible
	 * size that covers the screen.
	 */
	function windowResize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}

	// Add the window resize event listener
	window.addEventListener("resize", windowResize);
};

/**
 * Destroys the Hexells effect.
 */
const destroy = () => {
	if (effect.destroy) {
		console.debug("Destroying Hexells effect");
		effect.destroy();
	}
};

export default {
	label: "Hexells",
	effect: hexells,
	options: hexellsOptions,
	destroy,
};
