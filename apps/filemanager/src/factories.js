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

import {
	divertDropAction,
	usingPositiveButton,
	triggerBrowserUpload,
	isSpecialFile,
} from "./utils.js";
import dateformat from "dateformat";

/**
 * Mount view rows factory
 * @param {Core} core MeeseOS Core instance reference
 * @returns {Function} The mount view rows factory
 */
export const mountViewRowsFactory = (core) => {
	const fs = core.make("meeseOS/fs");
	const getMountpoints = () => fs.mountpoints(true);

	return () =>
		getMountpoints().map((mountpoint) => ({
			columns: [
				{
					icon: mountpoint.icon,
					label: mountpoint.label,
				},
			],
			data: mountpoint,
		}));
};

/**
 * File view columns factory
 *
 * @param {Core} core MeeseOS Core instance reference
 * @param {Application} proc Application instance reference
 * @returns {Function} The file view columns factory
 */
export const listViewColumnFactory = (core, proc) => {
	return () => {
		const columns = [
			{
				label: "Name",
				style: {
					minWidth: "20em",
				},
			},
		];

		if (proc.settings.showDate) {
			columns.push({
				label: "Date",
			});
		}

		return [
			...columns,
			{
				label: "Type",
				style: {
					maxWidth: "150px",
				},
			},
			{
				label: "Size",
				style: {
					flex: "0 0 7em",
					textAlign: "right",
				},
			},
		];
	};
};

/**
 * File view rows factory
 *
 * @param {Core} core MeeseOS Core instance reference
 * @param {Application} proc Application instance reference
 * @returns {Function} The file view rows factory
 */
export const listViewRowFactory = (core, proc) => {
	const fs = core.make("meeseOS/fs");
	const getFileIcon = (file) => file.icon || fs.icon(file);

	const formattedDate = (file) => {
		if (!file.stat) return "";

		const rawDate = file.stat.mtime || file.stat.ctime;
		if (rawDate) {
			try {
				const d = new Date(rawDate);
				return `${dateformat(d, "yyyy-mm-dd")} ${dateformat(d, "HH:MM")}`;
			} catch (e) {
				return rawDate;
			}
		}
	};

	return (list) =>
		list.map((file) => {
			const columns = [
				{
					label: file.filename,
					icon: getFileIcon(file),
				},
			];

			if (proc.settings.showDate) {
				columns.push(formattedDate(file));
			}

			return {
				key: file.path,
				data: file,
				columns: [...columns, file.mime, file.humanSize],
			};
		});
};

/**
 * VFS action factory
 *
 * @param {Core} core MeeseOS Core instance reference
 * @param {Application} proc Application instance reference
 * @param {Window} win Window reference
 * @param {Dialog} dialog
 * @param {Object} state
 * @returns {Object}
 */
export const vfsActionFactory = (core, proc, win, dialog, state) => {
	const vfs = core.make("meeseOS/vfs");
	const { pathJoin } = core.make("meeseOS/fs");

	const refresh = (fileOrWatch) => {
		// FIXME This should be implemented a bit better
		/*
		if (fileOrWatch === true && core.config("vfs.watch")) {
			return;
		}
		*/

		win.emit("filemanager:navigate", state.currentPath, undefined, fileOrWatch);
	};

	const action = async (promiseCallback, refreshValue, defaultError) => {
		try {
			win.setState("loading", true);

			const result = await promiseCallback();
			refresh(refreshValue);
			return result;
		} catch (error) {
			dialog("error", error, defaultError || "An error occurred");
		} finally {
			win.setState("loading", false);
		}

		return [];
	};

	const writeRelative = (file) => {
		const d = dialog("progress", file);

		return vfs
			.writefile(
				{
					path: pathJoin(state.currentPath.path, file.name),
				},
				file,
				{
					pid: proc.pid,
					onProgress: (ev, p) => d.setProgress(p),
				}
			)
			.then((result) => {
				d.destroy();
				return result;
			})
			.catch((error) => {
				d.destroy();
				throw error;
			});
	};

	const uploadBrowserFiles = (files) => {
		Promise.all(files.map(writeRelative))
			.then(() => refresh(files[0].name)) // FIXME: Select all ?
			.catch((error) => dialog("error", error, "Failed to upload file(s)"));
	};

	const uploadVirtualFile = (data) => {
		const dest = { path: pathJoin(state.currentPath.path, data.filename) };
		if (dest.path !== data.path) {
			action(
				() => vfs.copy(data, dest, { pid: proc.pid }),
				true,
				"Failed to upload file(s)"
			);
		}
	};

	const drop = divertDropAction(uploadBrowserFiles, uploadVirtualFile);

	const readdir = async (dir, history, selectFile) => {
		if (win.getState("loading")) return;
		if (Array.isArray(dir)) dir = dir[0];

		try {
			const message = `Loading ${dir.path}`;
			const options = {
				showHiddenFiles: proc.settings.showHiddenFiles,
			};

			win.setState("loading", true);
			win.emit("filemanager:status", message);

			const list = await vfs.readdir(dir, options);

			// NOTE: This sets a restore argument in the application session
			proc.args.path = dir;

			state.currentPath = dir;

			if (typeof history === "undefined" || history === false) {
				win.emit("filemanager:historyPush", dir);
			} else if (history === "clear") {
				win.emit("filemanager:historyClear");
			}

			win.emit("filemanager:readdir", { list, path: dir.path, selectFile });
			win.emit("filemanager:title", dir.path);
		} catch (error) {
			dialog(
				"error",
				error,
				`An error occurred while reading directory: ${dir.path}`
			);
		} finally {
			state.currentFile = [];
			win.setState("loading", false);
		}
	};

	const upload = () =>
		triggerBrowserUpload((files) => {
			writeRelative(files[0])
				.then(() => refresh(files[0].name))
				.catch((error) => dialog("error", error, "Failed to upload file(s)"));
		});

	// TODO: Trigger this via keyboard shortcut
	const paste = (move, currentPath) =>
		({ items, callback }) => {
			const promises = items.map((item) => {
				const dest = {
					path: pathJoin(currentPath.path, item.filename)
				};

				return move
					? vfs.move(item, dest, { pid: proc.pid })
					: vfs.copy(item, dest, { pid: proc.pid });
			});

			return Promise
				.all(promises)
				.then((results) => {
					refresh(true);

					if (typeof callback === "function") {
						callback();
					}

					return results;
				})
				.catch((error) => dialog("error", error, "Failed to paste file(s)"));
		};

	return {
		download: (files) => files.forEach((file) => vfs.download(file)),
		action,
		upload,
		refresh,
		drop,
		readdir,
		paste,
	};
};

/**
 * Clipboard action factory
 *
 * @param {Core} core MeeseOS Core instance reference
 * @param {Object} state
 * @param {Object} vfs
 * @returns {Object}
 */
export const clipboardActionFactory = (core, state, vfs) => {
	const clipboard = core.make("meeseOS/clipboard");

	const set = (items) => clipboard.set({ items }, "filemanager:copy");

	const cut = (items) =>
		clipboard.set(
			{
				items,
				callback: () =>
					core.config("vfs.watch") ? undefined : vfs.refresh(true),
			},
			"filemanager:move"
		);

	const paste = () => {
		if (clipboard.has(/^filemanager:/)) {
			const move = clipboard.has("filemanager:move");
			clipboard.get(move).then(vfs.paste(move, state.currentPath));
		}
	};

	return { set, cut, paste };
};

/**
 * Dialog factory
 *
 * @param {Core} core MeeseOS Core instance reference
 * @param {Application} proc Application instance reference
 * @param {Window} win Window reference
 * @returns {Function}
 */
export const dialogFactory = (core, proc, win) => {
	const vfs = core.make("meeseOS/vfs");
	const { pathJoin } = core.make("meeseOS/fs");

	const dialog = (name, args, cb, modal = true) =>
		core.make(
			"meeseOS/dialog",
			name,
			args,
			{
				parent: win,
				attributes: { modal },
			},
			cb
		);

	const mkdirDialog = (action, currentPath) =>
		dialog(
			"prompt",
			{
				message: "Create new directory",
				value: "New directory",
			},
			usingPositiveButton((value) => {
				const newPath = pathJoin(currentPath.path, value);
				action(
					() => vfs.mkdir({ path: newPath }, { pid: proc.pid }),
					value,
					"Failed to create directory"
				);
			})
		);

	const renameDialog = (action, files) =>
		files.forEach((file) =>
			dialog(
				"prompt",
				{
					message: `Rename ${file.filename}?`,
					value: file.filename,
				},
				usingPositiveButton((value) => {
					const idx = file.path.lastIndexOf(file.filename);
					const newPath = file.path.substr(0, idx) + value;

					action(
						() => vfs.rename(file, { path: newPath }),
						value,
						"Failed to rename"
					);
				})
			)
		);

	const deleteDialog = (action, files) =>
		dialog(
			"confirm",
			{
				message: `Delete ${files.length} file(s)?`,
			},
			usingPositiveButton(() => {
				action(
					() => Promise.all(
						files.map((file) => vfs.unlink(file, { pid: proc.pid }))
					),
					true,
					"Failed to delete"
				);
			})
		);

	const progressDialog = (file) =>
		dialog(
			"progress",
			{
				message: `Uploading ${file.name}...`,
				buttons: [],
			},
			() => {},
			false
		);

	const errorDialog = (error, message) =>
		dialog(
			"alert",
			{
				type: "error",
				error,
				message,
			},
			() => {}
		);

	const dialogs = {
		mkdir: mkdirDialog,
		rename: renameDialog,
		delete: deleteDialog,
		progress: progressDialog,
		error: errorDialog,
	};

	return (name, ...args) => {
		if (dialogs[name]) {
			return dialogs[name](...args);
		} else {
			throw new Error(`Invalid dialog: ${name}`);
		}
	};
};

/**
 * Creates menus
 *
 * @param {Core} core MeeseOS Core instance reference
 * @param {Application} proc Application instance reference
 * @param {Window} win Window reference
 * @returns {Function}
 */
export const menuFactory = (core, proc, win) => {
	const fs = core.make("meeseOS/fs");
	const clipboard = core.make("meeseOS/clipboard");
	const contextmenu = core.make("meeseOS/contextmenu");

	const getMountpoints = () => fs.mountpoints(true);

	const menuItemsFromMiddleware = async (type, middlewareArgs) => {
		if (!core.has("meeseOS/middleware")) {
			return [];
		}

		const items = core
			.make("meeseOS/middleware")
			.get(`meeseOS/filemanager:menu:${type}`);

		const promises = items.map((fn) => fn(middlewareArgs));
		const resolved = await Promise.all(promises);
		const result = resolved.filter((item) => item instanceof Array);

		return [].concat(...result);
	};

	// TODO: Add "Upload" item to right click, not exclusively in the top bar menu
	const createFileMenu = () => [
		{ label: "Upload", onclick: () => win.emit("filemanager:menu:upload") },
		{
			label: "Create new directory",
			onclick: () => win.emit("filemanager:menu:mkdir"),
		},
		{ label: "Quit", onclick: () => win.emit("filemanager:menu:quit") },
	];

	const createEditMenu = async (items, isContextMenu) => {
		const emitter = (name) => win.emit(name, items);
		const item = items[items.length - 1];
		const singleFile = items.length === 1;

		if (singleFile && item && isSpecialFile(item.filename)) {
			return [
				{
					label: "Go",
					onclick: () => emitter("filemanager:navigate"),
				},
			];
		}

		const canDownload = items.some(
			(file) => !file.isDirectory && !isSpecialFile(file.filename)
		);
		const hasValidFile = items.some((file) => !isSpecialFile(file.filename));
		const isDirectory = singleFile && item.isDirectory;

		const openMenu = isDirectory ?
			[
				{
					label: "Go",
					disabled: !items.length,
					onclick: () => emitter("filemanager:navigate"),
				},
			] : [
				{
					label: "Open",
					disabled: !items.length,
					onclick: () => emitter("filemanager:open"),
				},
				{
					label: "Open with...",
					disabled: !items.length,
					onclick: () => emitter("filemanager:openWith"),
				},
			];

		const clipboardMenu = [
			{
				label: "Copy",
				disabled: !hasValidFile,
				onclick: () => emitter("filemanager:menu:copy"),
			},
			{
				label: "Cut",
				disabled: !hasValidFile,
				onclick: () => emitter("filemanager:menu:cut"),
			},
		];

		if (!isContextMenu) {
			clipboardMenu.push({
				label: "Paste",
				disabled: !clipboard.has(/^filemanager:/),
				onclick: () => emitter("filemanager:menu:paste"),
			});
		}

		const appendItems = await menuItemsFromMiddleware("edit", {
			file: item,
			isContextMenu,
		});

		const configuredItems = [];
		if (core.config("filemanager.disableDownload", false) !== true) {
			configuredItems.push({
				label: "Download",
				disabled: !canDownload,
				onclick: () => emitter("filemanager:menu:download"),
			});
		}

		return [
			...openMenu,
			{
				label: "Rename",
				disabled: !hasValidFile,
				onclick: () => emitter("filemanager:menu:rename"),
			},
			{
				label: "Delete",
				disabled: !hasValidFile,
				onclick: () => emitter("filemanager:menu:delete"),
			},
			...clipboardMenu,
			...configuredItems,
			...appendItems,
		];
	};

	const createViewMenu = (state) => [
		{ label: "Refresh", onclick: () => win.emit("filemanager:menu:refresh") },
		{
			label: "Minimalistic",
			checked: state.minimalistic,
			onclick: () => win.emit("filemanager:menu:toggleMinimalistic"),
		},
		{
			label: "Show date column",
			checked: proc.settings.showDate,
			onclick: () => win.emit("filemanager:menu:showDate"),
		},
		{
			label: "Show hidden files",
			checked: proc.settings.showHiddenFiles,
			onclick: () => win.emit("filemanager:menu:showHidden"),
		},
	];

	const createGoMenu = () =>
		getMountpoints().map((m) => ({
			label: m.label,
			icon: m.icon,
			onclick: () => win.emit("filemanager:navigate", { path: m.root }),
		}));

	const menuItems = {
		file: createFileMenu,
		edit: createEditMenu,
		view: createViewMenu,
		go: createGoMenu,
	};

	return async ({ name, ev }, args, isContextMenu = false) => {
		if (menuItems[name]) {
			contextmenu.show({
				menu: await menuItems[name](args, isContextMenu),
				position: isContextMenu ? ev : ev.target,
			});
		} else {
			throw new Error(`Invalid menu: ${name}`);
		}
	};
};
