/*
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2020, Anders Evenrud <andersevenrud@gmail.com>
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
 * @licence Simplified BSD License
 */

import {
	Box,
	BoxContainer,
	Button,
	SelectField,
	Tabs,
	TextField,
	ToggleField,
	Toolbar,
} from "@aaronmeese.com/gui";
import { app, h } from "hyperapp";
import { name as applicationName } from "./metadata.json";
import merge from "deepmerge";
import meeseOS from "meeseOS";
import dynamicWallpapers from "@aaronmeese.com/dynamic-wallpapers";

/** Resolves an object tree by dot notation */
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

/** Resolves settings by dot notation and gets default values */
const resolveSetting = (settings, defaults) => (key) =>
	resolve(settings, key, resolve(defaults, key));

/** An array of settings for static backgrounds in MeeseOS. */
const staticBackgroundItems = [
	// TODO: `Random` option to pull from Unsplash
	{
		label: "Image",
		path: "desktop.background.src",
		type: "dialog",
		transformValue: (value) =>
			value ? (typeof value === "string" ? value : value.path) : value,
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
	},
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

/**
 * Returns all of the settings for a given dynamic background effect.
 * @returns {Object[]}
 */
const dynamicBackgroundItems = (state) => {
	if (state.static) return [];

	const selectedEffectKey = resolveSetting(
		state.settings,
		state.defaults
	)("desktop.background.effect");

	const selectedEffect = dynamicWallpapers[selectedEffectKey];
	const options = selectedEffect.options || {};

	const items = Object.keys(options).map((key) => {
		const properties = options[key];
		return {
			label: properties.label,
			path: `desktop.background.options.${key}`,
			type: properties.type,
			defaultValue: properties.defaultValue,
		};
	});

	return items;
};

/**
 * Loads all of the available dynamic wallpaper effects.
 * @return {Object[]}
 */
const getDynamicWallpaperChoices = () =>
	Object.keys(dynamicWallpapers).map((key) => {
		const properties = dynamicWallpapers[key];

		return {
			label: properties.label || "Mystery",
			value: properties.effect.name,
		};
	});

/**
 * Creates a `select` field for dynamic wallpaper effects.
 * @returns {Object[]}
 */
const dynamicBackgroundSelect = (state, actions) => [
	{
		label: "Effect",
		path: "desktop.background.effect",
		type: "select",
		choices: () => getDynamicWallpaperChoices(),
		oncreate: (ev) =>
			(ev.value =
				state.wallpaperEffect || getDynamicWallpaperChoices()[0].value),
		onchange: (ev) => actions.setWallpaperEffect(ev),
	},
];

/** Maps our section items to a field */
const fieldMap = () => {
	const getValue = (props) =>
		props.transformValue ? props.transformValue(props.value) : props.value;

	const render = (state, actions, items) =>
		items.map((item) => renderItem(state, actions)(item));

	return {
		select: (props) => (state, actions) =>
			h(SelectField, {
				value: getValue(props),
				choices: props.choices(state),
				oninput: (ev, value) => actions.update({ path: props.path, value }),
			}),

		dialog: (props) => (state, actions) =>
			h(BoxContainer, {}, [
				h(TextField, {
					box: { grow: 1 },
					readonly: true,
					value: getValue(props),
					oninput: (ev, value) => actions.update({ path: props.path, value }),
				}),

				h(
					Button,
					{
						onclick: () =>
							actions.dialog(
								props.dialog(props, state, actions, getValue(props))
							),
					},
					"..."
				),
			]),

		color: (props) => (state, actions) =>
			h(BoxContainer, {}, [
				h(TextField, {
					box: { grow: 1 },
					readonly: true,
					value: getValue(props),
					oninput: (ev, value) => actions.update({ path: props.path, value }),
				}),

				h(
					Button,
					{
						onclick: () =>
							actions.dialog([
								"color",
								{ color: getValue(props) },
								(btn, value) => {
									if (btn === "ok") {
										actions.update({ path: props.path, value: value.hex });
									}
								},
							]),
					},
					"..."
				),
			]),

		boolean: (props) => (state, actions) =>
			h(ToggleField, {
				oncreate: (ev) => (ev.checked = getValue(props)),
				checked: getValue(props),
				oninput: (ev, checked) =>
					actions.update({ path: props.path, value: checked }),
			}),

		number: (props) => (state, actions) =>
			h(TextField, {
				box: {
					shrink: 1,
					basis: "2em",
					style: {
						minHeight: "25px",
					},
				},
				type: "number",
				oncreate: (el) => (el.value = Number(getValue(props))),
				oninput: (ev, value) => {
					value = Number(value);
					actions.update({ path: props.path, value });
				},
			}),

		wallpaper: (props) => (state, actions) =>
			h(Box, { grow: 1, shrink: 1 }, [
				h(SelectField, {
					choices: [
						{
							label: "Static",
							value: "static",
						},
						{
							label: "Dynamic",
							value: "dynamic",
						},
					],
					oncreate: (ev) =>
						(ev.value = resolveSetting(
							state.settings,
							state.defaults
						)("desktop.background.type")),
					onchange: (ev) => actions.updateWallpaperType(ev),
				}),
				state.static
					? render(state, actions, staticBackgroundItems)
					: render(state, actions, dynamicBackgroundSelect(state, actions)),
				// Will return an empty array if the wallpaper type is not dynamic
				render(state, actions, dynamicBackgroundItems(state)),
			]),

		fallback: (props) => (state, actions) =>
			h(TextField, {
				value: getValue(props),
				oninput: (ev, value) => actions.update({ path: props.path, value }),
			}),
	};
};

const resolveValue = (key, value) =>
	key === "desktop.iconview.enabled" // FIXME
		? value === "true"
		: value;

/** Resolves a new value in our tree */
const resolveNewSetting = (state) => (key, value) => {
	// FIXME: There must be a better way
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

// https://github.com/os-js/osjs-settings-application/issues/11#issuecomment-1067199781

/** MeeseOS tab sections */
const tabSections = [
	{
		title: "Background",
		items: [
			{
				label: "Type",
				path: "desktop.background.type",
				type: "wallpaper",
				defaultValue: "static",
			},
		],
	},
	{
		title: "Themes",
		items: [
			{
				label: "Style",
				path: "desktop.theme",
				type: "select",
				choices: (state) => state.themes.styles,
			},
			{
				label: "Icons",
				path: "desktop.icons",
				type: "select",
				choices: (state) => state.themes.icons,
			},
			{
				label: "Sounds",
				path: "desktop.sounds",
				type: "select",
				choices: (state) => state.themes.sounds,
			},
		],
	},
	{
		title: "Desktop",
		items: [
			{
				label: "Enable desktop icons",
				path: "desktop.iconview.enabled",
				type: "select",
				choices: () => [
					{
						label: "Yes",
						value: "true",
					},
					{
						label: "No",
						value: "false",
					},
				],
			},
			{
				label: "Font color style",
				path: "desktop.iconview.fontColorStyle",
				type: "select",
				defaultValue: "system",
				choices: () => ({
					system: "System",
					invert: "Inverted background color",
					custom: "Custom color",
				}),
			},
			{
				label: "Custom font color",
				path: "desktop.iconview.fontColor",
				type: "color",
			},
		],
	},
];

// Returns an array of elements for a single item parameter
const renderItem = (state, actions) => (item) => {
	const resolver = resolveSetting(state.settings, state.defaults);
	const getSetting = (path) => resolver(path);
	const fields = fieldMap();
	const element = (props) =>
		(fields[props.type] || fields.fallback)(props)(state, actions);

	let value = getSetting(item.path);
	if (typeof value === "undefined") {
		value = item.defaultValue;
	}

	return [
		h(BoxContainer, { style: { marginBottom: 0 } }, item.label),
		h(
			element,
			{
				type: item.type,
				value,
				...item
			}
		),
	];
};

/** Renders tab sections into the settings app */
const renderSections = (core, state, actions) =>
	tabSections.map((section) => {
		const items = section.items.map((item) => renderItem(state, actions)(item));

		return h(
			Box,
			{
				grow: 1,
				shrink: 1,
				style: {
					overflow: "auto",
				},
			},
			...items
		);
	});

/** Renders our settings window */
const renderWindow = (core, proc) => ($content, win) => {
	const settingsService = core.make("meeseOS/settings");
	const packageService = core.make("meeseOS/packages");
	const desktopService = core.make("meeseOS/desktop");

	const getThemes = () => {
		const filter = (type) => (pkg) => pkg.type === type;
		const get = (type) =>
			packageService
				.getPackages(filter(type))
				.map((pkg) => ({ value: pkg.name, label: pkg.title }));

		return {
			styles: get("theme"),
			icons: get("icons"),
			sounds: [{ value: "", label: "None" }, ...get("sounds")],
		};
	};

	const getDefaults = () => ({
		desktop: core.config("desktop.settings", {}),
	});

	const getSettings = () => ({
		desktop: settingsService.get("meeseOS/desktop", undefined, {}),
	});

	const setSettings = (settings) =>
		settingsService.set("meeseOS/desktop", null, settings.desktop).save();

	const createDialog = (...args) => core.make("meeseOS/dialog", ...args);

	const view = (state, actions) =>
		h(Box, {}, [
			h(
				Tabs,
				{
					grow: 1,
					shrink: 1,
					labels: tabSections.map((section) => section.title),
				},
				[...renderSections(core, state, actions)]
			),

			h(BoxContainer, {}, [
				h(Toolbar, { grow: 1, shrink: 1, justify: "flex-end" }, [
					h(
						Button,
						{
							onclick: () => actions.save(),
						},
						"Save"
					),
				]),
			]),
		]);

	const initialState = {
		loading: false,
		themes: getThemes(),
		defaults: getDefaults(),
		settings: getSettings(),
	};

	initialState.static =
		resolveSetting(
			initialState.settings,
			initialState.defaults
		)("desktop.background.type") === "static";

	const actions = {
		save: () => (state, actions) => {
			if (state.loading) return;
			actions.setLoading(true);

			setSettings(state.settings)
				.then(() => {
					actions.setLoading(false);
					desktopService.applySettings();
				})
				.catch((error) => {
					actions.setLoading(false);
					console.error(error); // FIXME
				});
		},

		dialog: (options) => () => {
			const [name, args, callback] = options;

			createDialog(
				name,
				args,
				{
					attributes: { modal: true },
					parent: win,
				},
				callback
			);
		},

		updateWallpaperType: (ev) => (state, actions) => {
			if (state.settings.desktop.background) {
				state.settings.desktop.background.type = ev.target.value;
			} else {
				// Initialize the background object if it doesn't exist yet
				state.settings.desktop.background = {
					type: ev.target.value,
				};
			}

			return { static: ev.target.value === "static" };
		},

		setWallpaperEffect: (ev) => ({
			wallpaperEffect: ev.target.value,
		}),

		update:
			({ path, value }) =>
				(state) =>
					resolveNewSetting(state)(path, value),
		refresh: () => () => ({ settings: getSettings() }),
		setLoading: (loading) => ({ loading }),
	};

	const instance = app(initialState, actions, view, $content);
	const refresh = () => instance.refresh();

	win.on("settings/refresh", refresh);
};

/** Create our application */
const register = (core, args, options, metadata) => {
	const proc = core.make("meeseOS/application", { args, options, metadata });

	const win = proc.createWindow({
		id: "SettingsMainWindow",
		title: metadata.title,
		dimension: { width: 450, height: 405 },
		gravity: "center",
	});

	const onSettingsSave = () => win.emit("settings/refresh");

	core.on("meeseOS/settings:save", onSettingsSave);

	win.on("destroy", () => {
		core.off("meeseOS/settings:save", onSettingsSave);
		proc.destroy();
	});

	win.render(renderWindow(core, proc));

	return proc;
};

// Register package in OS.js
meeseOS.register(applicationName, register);
