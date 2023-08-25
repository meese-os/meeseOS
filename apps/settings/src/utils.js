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

import merge from "deepmerge";

/** Resolves an object tree by dot notation. */
const resolve = (tree, key, defaultValue) => {
	try {
		const value = key
			.split(/\./g)
			.reduce((result, key) => result[key], { ...tree });

		return typeof value === "undefined" ? defaultValue : value;
	} catch (e) {
		return defaultValue;
	}
};

/** Resolves settings by dot notation and gets default values. */
export const resolveSetting = (settings, defaults) => (key) =>
	resolve(settings, key, resolve(defaults, key));

	const resolveValue = (key, value) =>
	key === "desktop.iconview.enabled" // FIXME
		? value === "true"
		: value;

/** Resolves a new value in our tree. */
export const resolveNewSetting = (state) => (key, value) => {
	// FIXME: There must be a better way
	if (!key) return;
	const object = {};
	const keys = key.split(/\./g);

	let previous = object;
	for (let i = 0; i < keys.length; i++) {
		const j = keys[i];
		const last = i >= keys.length - 1;

		previous[j] = last ? resolveValue(key, value) : {};
		previous = previous[j];
	}

	const settings = merge(state.settings, object);
	return { settings };
};
