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

import { resolveSetting } from "./utils";

/**
 * An array of settings for static backgrounds in MeeseOS
 * @returns {Object[]}
 */
export const staticBackgroundOptions = (state, actions) => [
	{
		// IDEA: Add tooltips, i.e. "This will only work with internet connectivity"
		label: "Random Wallpaper",
		path: "desktop.background.random",
		type: "boolean",
		defaultValue: false,
	},
	...(!resolveSetting(state.settings, state.defaults)("desktop.background.random") ? [{
		label: "Image",
		path: "desktop.background.src",
		type: "dialog",
		transformValue: (value) =>
			typeof value === "string" ? value : value.path,
		dialog: (props, state, actions, currentValue) => [
			"file",
			{
				type: "open",
				title: "Select background",
				mime: [/^image/],
				path: "meeseOS:/",
			},
			(btn, value) => {
				if (btn === "ok") {
					actions.update({ path: props.path, value });
				}
			},
		],
		defaultValue: "meeseOS:/wallpapers/Wallpapers/plain.png",
	}] : []),
	{
		label: "Style",
		path: "desktop.background.style",
		type: "select",
		choices: () => ({
			color: "Color",
			cover: "Cover",
			contain: "Contain",
			repeat: "Repeat",
		}),
	},
	{
		label: "Color",
		path: "desktop.background.color",
		type: "color",
	},
];
