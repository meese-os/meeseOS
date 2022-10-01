/**
 * MeeseOS - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2022-Present, Aaron Meese <aaronjmeese@gmail.com>
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
 * @author  Aaron Meese <aaronjmeese@gmail.com>
 * @licence Simplified BSD License
 */

import WAVES from "vanta/dist/vanta.waves.min";
import * as THREE from "three";

/**
 * A mapping of the variable names to their relevant information.
 */
const vantaWavesOptions = {};

/**
 * Stores the Vanta waves effect so it can be destroyed.
 */
let effect = {};

/**
 * Creates a Vanta waves effect.
 * @param {HTMLDivElement} background The background element to add the canvas to
 * @param {Object} [options={}] The options to pass to the Vanta waves effect
 * @link https://www.vantajs.com/?effect=waves
 */
const vantaWaves = (background, options = {}) => {
	const defaults = Object.keys(vantaWavesOptions).map((key) => ({
		[key]: vantaWavesOptions[key].defaultValue,
	}));

	// Override the defaults with any user-provided options
	const settings = {
		...defaults,
		...options,
	};

	// Initialize the Vanta waves effect
	console.debug("Initializing Vanta waves effect");

	effect = WAVES({
		el: background,
		THREE: THREE,
		minHeight: 200.00,
		minWidth: 200.00,
		scale: 1.0,
		scaleMobile: 1.0,
		gyroControls: false,
		mouseControls: false,
		mouseEase: false,
		touchControls: false,
		camera: {
			far: 400,
			fov: 30,
			near: 0.1,
		},
		color: "hsl(225, 40%, 20%)",
		colorCycleSpeed: 10,
		forceAnimate: true,
		hh: 50,
		hue: 225,
		lightness: 20,
		material: {
			options: {
				fog: false,
				wireframe: false,
			},
		},
		saturation: 40,
		shininess: 35,
		waveHeight: 20,
		waveSpeed: 0.25,
		ww: 50,
		...settings,
	});

	// Set the canvas width and height to the screen width and height
	const canvas = background.querySelector("canvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	effect.renderer.setSize(canvas.width, canvas.height);
	effect.resize();

	/**
	 * Ensures that the canvas will always be the smallest possible
	 * size that covers the screen.
	 */
	function windowResize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		effect.renderer.setSize(canvas.width, canvas.height);
		effect.resize();
	}

	// Add the window resize event listener
	window.addEventListener("resize", windowResize);
};

/**
 * Destroys the Vanta waves effect.
 */
const destroy = () => {
	if (effect.destroy) {
		console.debug("Destroying Vanta waves effect");
		effect.destroy();
	}
};

export default {
	label: "Vanta Waves",
	effect: vantaWaves,
	options: vantaWavesOptions,
	destroy,
};
