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

import Widget from "../widget";
import clippy from "@meese-os/clippy";

/**
 * Clippyts Widget Options
 * @typedef {Object} ClippyOptions
 * // Define any specific options for your Clippy widget here
 */

export default class ClippyWidget extends Widget {
	/**
	 * Creates a new instance.
	 * @param {Core} core MeeseOS Core instance reference
	 * @param {ClippyOptions} [options] Instance options
	 */
	constructor(core, options) {
		super(
			core,
			options,
			{
				dimension: {
					width: 300,
					height: 300
				},
				minDimension: {
					width: 100,
					height: 100
				},
				canvas: false
			},
			{
				// Default options
			}
		);

		this.clippyElem = document.createElement("div");
		this.clippyElem.className = "clippy-container";
		this.$element.appendChild(this.clippyElem);

		console.log("Clippy:", clippy);

		// Initialize Clippy
		clippy.load({
			name: "Clippy",
			selector: this.clippyElem,
			successCb: agent => {
				this.clippyAgent = agent;
				agent.show();
			}
		});
	}

	applySettings() {
		// Apply any settings that may have changed
	}

	render() {
		// Additional rendering logic if needed
	}

	static metadata() {
		return {
			...super.metadata(),
			title: "Clippy"
		};
	}
}
