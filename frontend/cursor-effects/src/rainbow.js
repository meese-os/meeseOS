/*!
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

import { rainbowCursor } from "cursor-effects";

/**
 * A mapping of the variable names to their relevant information.
 */
const rainbowOptions = {
	length: {
		label: "Rainbow Length",
		type: "number",
		defaultValue: 20,
	},
	/*
	colors: {
		label: "Rainbow Colors",
		// TODO: Generate a type that works for color arrays,
		// or a way to add more/less stops to the rainbow
		type: "color",
		defaultValue: [
			"#FE0000",
			"#FD8C00",
			"#FFE500",
			"#119F0B",
			"#0644B3",
			"#C22EDC",
		],
	},
	*/
	size: {
		label: "Rainbow Size",
		type: "number",
		defaultValue: 3,
	},
};

/**
 * Creates a rainbow cursor effect on the page body.
 * @param {Object} options
 * @link https://github.com/tholman/cursor-effects/blob/master/src/rainbowCursor.js
 */
const rainbow = (options) => {
	const defaults = Object.keys(rainbowOptions).map((key) => ({
		[key]: rainbowOptions[key].defaultValue,
	}));

	// Override the defaults with any user-provided options
	const settings = Object.assign({}, ...defaults, options);

	// Create the cursor
	return new rainbowCursor(settings);
};

export default {
	label: "Rainbow",
	effect: rainbow,
	options: rainbowOptions,
};
