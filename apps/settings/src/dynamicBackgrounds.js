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
 * Returns all of the settings for a given dynamic background effect.
 * @param {Object} state
 * @returns {Object[]}
 */
export const dynamicBackgroundItems = (state) => {
	if (state.static) return [];

	const selectedEffectKey = resolveSetting(
		state.settings,
		state.defaults
	)("desktop.background.effect");

	const selectedEffect = state.core.make("meeseOS/background-canvas").effects[selectedEffectKey];
	const options = selectedEffect.options || {};

	const items = Object.keys(options).map((key) => {
		const properties = options[key];
		return {
			label: properties.label,
			path: `desktop.background.options.${key}`,
			type: properties.type,
			defaultValue: properties.defaultValue,
			choices: properties.choices || [],
		};
	});

	return items;
};

/**
 * Loads all of the available dynamic wallpaper effects.
 * @param {Core} core
 * @returns {Object[]}
 */
const getDynamicWallpaperChoices = (core) => {
	const effects = core.make("meeseOS/background-canvas").effects;
	return Object.keys(effects).map((key) => {
		const properties = effects[key];

		return {
			label: properties.label || "Mystery",
			value: properties.effect.name,
		};
	});
}

/**
 * Creates a `select` field for dynamic wallpaper effects.
 * @param {Object} state
 * @param {Object} actions
 * @returns {Object[]}
 */
export const dynamicBackgroundSelect = (state, actions) => [
	{
		label: "Effect",
		path: "desktop.background.effect",
		type: "select",
		choices: () => getDynamicWallpaperChoices(state.core),
		oncreate: (ev) =>
			(ev.value = state.wallpaperEffect || getDynamicWallpaperChoices(state.core)[0].value),
		onchange: (ev) => actions.setWallpaperEffect(ev),
	},
];
