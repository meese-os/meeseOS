/**
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-Present, Anders Evenrud <andersevenrud@gmail.com>
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
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @license Simplified BSD License
 */

import logger from "../logger";
import { supportedMedia } from "./dom";
import cursorEffects from "@meeseOS/cursor-effects";
import dynamicWallpapers from "@meeseOS/dynamic-wallpapers";
import Core from "../core";

const imageDropMimes = [
	"image/png",
	"image/jpe?g",
	"image/webp",
	"image/gif",
	"image/svg(\\+xml)?",
];

/**
 * Check if droppable data is a VFS type
 * @param {Object} data
 * @returns {Boolean}
 */
export const validVfsDrop = (data) => data && data.path;

/**
 * Check if droppable data contains image
 * @param {Object} data
 * @returns {Boolean}
 */
export const isDroppingImage = (data) =>
	validVfsDrop(data) &&
	imageDropMimes.some((re) => Boolean(data.mime.match(re)));

/** Array of common screen resolutions to match against and query Unsplash for. */
const standardResolutions = [
	// Desktops
	{ width: 3840, height: 2160 },
	{ width: 2560, height: 1440 },
	{ width: 1920, height: 1080 },
	{ width: 1600, height: 900 },
	{ width: 1440, height: 900 },
	{ width: 1366, height: 768 },
	{ width: 1280, height: 1024 },
	{ width: 1280, height: 800 },
	{ width: 1280, height: 720 },
	{ width: 1024, height: 768 },
	{ width: 800, height: 600 },
	// Mobile devices
	{ width: 720, height: 1280 },
	{ width: 750, height: 1334 },
	{ width: 1080, height: 1920 },
	{ width: 1125, height: 2436 },
	{ width: 1440, height: 2960 },
];

/**
 * Calculates the size difference between the real size and a standard screen size.
 * @param {Object} realSize The real size of the screen
 * @param {Object} standard The point to check for distance
 * @returns {Number} The distance between the real resolution and the standard resolution
 * @link https://stackoverflow.com/a/56306192/6456163
 */
const getResolutionDistance = (realSize, standard) =>
	Math.sqrt(
		Math.pow(realSize.width - standard.width, 2) +
		Math.pow(realSize.height - standard.height, 2)
	);

/**
 * Uses the screen resolution to find an Unsplash wallpaper that matches the screen resolution.
 * @returns {String}
 * @link https://stackoverflow.com/a/56306192/6456163
 */
const getRandomWallpaper = () => {
	const realWidth = window.screen.width * window.devicePixelRatio;
	const realHeight = window.screen.height * window.devicePixelRatio;
	const realSize = { width: realWidth, height: realHeight };
	const closestResolution = standardResolutions.reduce((prev, curr) =>
		getResolutionDistance(prev, realSize) < getResolutionDistance(curr, realSize)
			? prev
			: curr
	);

	const resolution = `${closestResolution.width}x${closestResolution.height}`;
	const orientation = window.innerHeight > window.innerWidth ? "portrait" : "landscape";
	const orientationParam = `orientation=${orientation}`;
	const sigParam = `sig=${Math.random()}`;
	return `https://source.unsplash.com/random/${resolution}?${orientationParam}&${sigParam}`;
};

/**
 * Creates a static background with an image and a color, if applicable
 * @param {Core} core MeeseOS Core instance reference
 * @param {Object} background
 */
const createStaticBackground = (core, background) => {
	const { $root } = core;

	const styles = {
		backgroundRepeat: "no-repeat",
		backgroundPosition: "50% 50%",
		backgroundSize: "auto",
		backgroundColor: background.color,
		backgroundImage: "none",
	};

	if (background.style === "cover" || background.style === "contain") {
		styles.backgroundSize = background.style;
	} else if (background.style === "repeat") {
		styles.backgroundRepeat = "repeat";
	}

	if (background.style !== "color") {
		if (background.random) {
			styles.backgroundImage = `url(${getRandomWallpaper()})`;
		} else if (background.src === undefined) {
			styles.backgroundImage = undefined;
		} else if (background.src.match(/^meeseOS:/)) {
			core
				.make("meeseOS/vfs")
				.url(background.src)
				.then((src) => {
					setTimeout(() => ($root.style.backgroundImage = `url(${src})`), 1);
				})
				.catch((error) =>
					logger.warn("Error while setting wallpaper from VFS", error)
				);
		} else if (typeof background.src === "string") {
			styles.backgroundImage = `url(${background.src})`;
		}
	}

	Object.keys(styles).forEach((k) => ($root.style[k] = styles[k]));
};

/**
 * Creates a dynamic background based on the specified settings
 * @param {Object} background
 */
const createDynamicBackground = (background) => {
	const canvas = document.querySelector(".meeseOS-dynamic-background");
	canvas.style.display = "inherit";

	// TODO: Destroy and re-create canvas as opposed to just hiding it
	// when transitioning between static and dynamic backgrounds

	// Calls the background effect function by name
	const effectName = background.effect || "default";
	const options = background.options || {};
	dynamicWallpapers[effectName].effect(canvas, options);
};

/**
 * Hides the dynamic background canvas
 */
const hideDynamicBackground = () => {
	const canvas = document.querySelector(".meeseOS-dynamic-background");
	canvas.style.display = "none";
};

/**
 * Applies a set of styles based on background settings
 * @param {Core} core MeeseOS Core instance reference
 * @param {Object} background
 */
export const applyBackgroundStyles = (core, background) => {
	if (background.type === "static") {
		hideDynamicBackground();
		createStaticBackground(core, background);
	} else if (background.type === "dynamic") {
		createDynamicBackground(background);
	}
};

/**
 * Applies a cursor effect based on the specified settings
 * @param {Object} cursor
 */
export const applyCursorEffect = (cursor) => {
	// Get the second to last element of the body and remove it if it is a canvas,
	// which removes any previous cursor effects
	const body = document.querySelector("body");
	const secondToLastChild = body.children[body.children.length - 2];
	if (secondToLastChild && secondToLastChild.tagName === "CANVAS") {
		body.removeChild(secondToLastChild);
	}

	// Calls the cursor effect function by name
	const effectName = cursor.effect || "none";
	const options = cursor.options || {};
	cursorEffects[effectName].effect(options);
};

/**
 * Creates a rectangle with the realestate panels takes up
 */
export const createPanelSubtraction = (panel, panels) => {
	const subtraction = { top: 0, left: 0, right: 0, bottom: 0 };
	const set = (p) =>
		(subtraction[p.options.position] = p.$element.offsetHeight);

	if (panels.length > 0) {
		panels.forEach(set);
	} else {
		// Backward compability
		set(panel);
	}

	return subtraction;
};

export const isVisible = (w) =>
	w && !w.getState("minimized") && w.getState("focused");

/**
 * Allows for requesting whether a file exists without `async`.
 * @todo Move to MeeseOS VFS, so the 404 error doesn't log to console
 * @param {String} urlToFile
 * @returns {Boolean}
 */
const syncRequest = (urlToFile) => {
	const xhr = new XMLHttpRequest();
	xhr.open("HEAD", urlToFile, false);
	xhr.send();

	return xhr.status > 199 && xhr.status < 300;
};

/*
 * Resolves various resources
 * TODO: Move all of this (and related) stuff to a Theme class
 */
export const resourceResolver = (core) => {
	const media = supportedMedia();

	const getThemeName = (type) => {
		const defaultTheme = core.config("desktop.settings." + type);
		return core
			.make("meeseOS/settings")
			.get("meeseOS/desktop", type, defaultTheme);
	};

	const themeResource = (path) => {
		const theme = getThemeName("theme");

		return core.url(`themes/${theme}/${path}`); // FIXME: Use metadata ?
	};

	const getSoundThemeName = () => getThemeName("sounds");

	const soundResource = (path) => {
		if (!path.match(/\.([a-z]+)$/)) {
			const defaultExtension = "mp3";
			const checkExtensions = ["oga", "mp3"];
			const found = checkExtensions.find((str) => media.audio[str] === true);
			const use = found || defaultExtension;

			path += "." + use;
		}

		const theme = getSoundThemeName();

		return theme ? core.url(`sounds/${theme}/${path}`) : null; // FIXME: Use metadata ?
	};

	const soundsEnabled = () => Boolean(getSoundThemeName());

	const icon = (path) => {
		const theme = getThemeName("icons");
		const urlBase = `icons/${theme}/icons`;

		if (!path.match(/\.([a-z]+)$/)) {
			const defaultExtension = "png";
			const defaultImage = core.url(`${urlBase}/${path}.${defaultExtension}`);
			const defaultImageExists = syncRequest(defaultImage);
			if (defaultImageExists) {
				path += "." + defaultExtension;
			} else {
				const checkExtensions = ["svg", "gif"];
				for (const ext of checkExtensions) {
					const url = core.url(`${urlBase}/${path}.${ext}`);
					const urlExists = syncRequest(url);
					if (urlExists) {
						path += "." + ext;
						break;
					}
				}

				if (!path.match(/\.([a-z]+)$/)) {
					path += "." + defaultExtension;
				}
			}
		}

		return core.url(`${urlBase}/${path}`);
	};

	return { themeResource, soundResource, soundsEnabled, icon };
};
