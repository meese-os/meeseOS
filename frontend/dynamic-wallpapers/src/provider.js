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

import { ServiceProvider } from "@meeseOS/common";
import matrix from "./effects/matrix";
import hexells from "./effects/hexells";

/**
 * Background Canvas Service Provider
 */
export default class BackgroundCanvasServiceProvider extends ServiceProvider {
	/**
	 * Create new instance.
	 * @param {Core} core MeeseOS Core instance reference
	 */
	constructor(core) {
		super(core);

		/**
		 * @type {Core}
		 */
		this.core = core;

		this.effects = {
			matrix,
			hexells,
		};
	}

	/**
	 * A list of services this provider depends on.
	 * @returns {String[]}
	 */
	static depends() {
		return ["meeseOS/core"];
	}

	/**
	 * Get a list of services this provider registers.
	 * @returns {String[]}
	 */
	static provides() {
		return ["meeseOS/background-canvas"];
	}

	/**
	 * Initializes the service provider.
	 */
	init() {
		this.core.instance("meeseOS/background-canvas", () => this);
	}

	/**
	 * Destroys the service provider.
	 */
	destroy() {
		super.destroy();
	}

	/**
	 * Starts the dynamic background effect.
	 * @param {String} effectName The effect to apply to the background.
	 * @param {Object} [options={}] The options to pass to the effect.
	 */
	start(effectName, options = {}) {
		if (!effectName) return;

		if (!this.effects[effectName]) {
			throw new Error(`Invalid effect: ${effectName}`);
		}

		this.destroyAll();
		const background = this.createBackground();
		const effectFn = this.effects[effectName].effect;
		effectFn(background, options);
	}

	/**
	 * Creates and returns a new background div element.
	 * @returns {HTMLDivElement} The created background element.
	 */
	createBackground() {
		const div = document.createElement("div");
		div.className = "meeseOS-dynamic-background";
		this.core.$root.appendChild(div);
		return div;
	}

	/**
	 * Removes all dynamic background canvases from the DOM
	 * and stops all effects.
	 */
	destroyAll() {
		// TODO: Something here isn't working, the whole site still slows down after
		// using the Hexells effect.
		const backgrounds = document.querySelectorAll(".meeseOS-dynamic-background");
		backgrounds.forEach((background) => background.remove());

		Object.values(this.effects).forEach((effect) => {
			if (effect.destroy) effect.destroy();
		});
	}
}
