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

import { resolveSetting } from "./utils";
import cursorEffects from "@meese-os/cursor-effects";

/**
 * Returns all of the settings for a given cursor effect.
 * @returns {Object[]}
 */
export const cursorItems = (state) => {
	const selectedEffectKey = resolveSetting(
		state.settings,
		state.defaults
	)("desktop.cursor.effect");

	const selectedEffect = cursorEffects[selectedEffectKey];
	const options = selectedEffect.options || {};

	const items = Object.keys(options).map((key) => {
		const properties = options[key];
		return {
			label: properties.label,
			path: `desktop.cursor.options.${key}`,
			type: properties.type,
			defaultValue: properties.defaultValue,
		};
	});

	return items;
};

/**
 * Loads all of the available cursor effects.
 * @returns {Object[]}
 */
const getCursorChoices = () =>
	Object.keys(cursorEffects).map((key) => {
		const properties = cursorEffects[key];

		return {
			label: properties.label || "Mystery",
			value: properties.effect.name,
		};
	});

/**
 * Creates a `select` field for cursor effects.
 * @returns {Object[]}
 */
export const cursorEffectSelect = (state, actions) => [
	{
		label: "Effect",
		path: "desktop.cursor.effect",
		type: "select",
		choices: () => getCursorChoices(),
		oncreate: (ev) =>
			(ev.value = state.cursorEffect || getCursorChoices()[0].value),
		onchange: (ev) => actions.setCursorEffect(ev),
	},
];
