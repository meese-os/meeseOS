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

import {
	divertDropAction,
	usingPositiveButton,
	triggerBrowserUpload,
	triggerBrowserDirectoryUpload,
	supportsDirectoryUpload,
	collectDroppedFiles,
	normalizeRelativePath,
	isSpecialFile,
} from "./utils.js";
import dateformat from "dateformat";
import { fileTypeFromBuffer } from "file-type";

/**
 * The file types supported by "file-type" and "yazul" that are
 * considered to be archives.
 * @todo Update based on the response to https://github.com/thejoshwolfe/yauzl/issues/142
 */
const archiveTypes = [
	"7z",
	"ar",
	"bz2",
	"gz",
	"lz",
	"lzh",
	"rar",
	"tar",
	"zip",
	"zst",
];

/**
 * Mount view rows factory.
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
 * File view columns factory.
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
 * File view rows factory.
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
			} catch (_e) {
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
 * VFS action factory.
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
			dialog("error", error, defaultError ?? "An error occurred");
		} finally {
			win.setState("loading", false);
		}

		return [];
	};

	async function uploadBrowserFiles(files, ev) {
		try {
			let entries = [];
			if (ev?.dataTransfer?.items?.length) {
				entries = await collectDroppedFiles(ev.dataTransfer.items);
			} else {
				entries = Array.from(files || []).map((file) => {
					const path = normalizeRelativePath(file.webkitRelativePath || file.name);
					if (!path) {
						throw new Error("Refusing to upload a file with an unsafe relative path");
					}
					return { file, path };
				});
			}

			return uploadFiles(entries);
		} catch (error) {
			dialog("error", error, "Failed to upload file(s)");
			return [];
		}
	}

	async function uploadFiles(entries) {
		const destinationRoot = state.currentPath.path;
		const files = entries.filter((entry) => entry.file && entry.path);
		const directories = new Set();
		entries
			.filter((entry) => entry.directory)
			.forEach(({ directory }) => directories.add(directory));
		files.forEach(({ path }) => {
			const parts = path.split("/");
			parts.pop();
			for (let index = 1; index <= parts.length; index++) {
				directories.add(parts.slice(0, index).join("/"));
			}
		});
		const orderedDirectories = [...directories].sort((left, right) => {
			const depth = (value) => value.split("/").length;
			return depth(left) - depth(right) || left.localeCompare(right);
		});
		if (!files.length && !orderedDirectories.length) return [];

		const controller = typeof AbortController === "function"
			? new AbortController()
			: null;
		const totalBytes = files.reduce(
			(total, entry) => total + (entry.file.size || 0),
			0
		);
		let completedBytes = 0;
		let completedItems = 0;
		let lastProgress = -1;
		const totalItems = files.length + orderedDirectories.length;
		const popup = dialog(
			"progress",
			{
				message: `Uploading ${totalItems} item${totalItems === 1 ? "" : "s"}...`,
				buttons: ["cancel"],
			},
			(button) => {
				const name = typeof button === "string" ? button : button?.name;
				if (["cancel", "destroy"].includes(String(name).toLowerCase())) {
					controller?.abort();
				}
			},
		);

		const setProgress = (progress, status) => {
			if (typeof popup.setStatus === "function") popup.setStatus(status);
			if (typeof popup.setProgress !== "function") return;
			const current = totalBytes
				? completedBytes + ((files[progress.index].file.size || 0) * progress.value / 100)
				: completedItems + (progress.value / 100);
			const total = totalBytes || totalItems;
			const value = Math.min(100, (current / total) * 100);
			if (value > lastProgress) {
				lastProgress = value;
				popup.setProgress(value);
			}
		};

		try {
			for (const directory of orderedDirectories) {
				if (controller?.signal.aborted) break;
				await vfs.mkdir(
					{ path: pathJoin(destinationRoot, directory) },
					{ pid: proc.pid, ensure: true, signal: controller?.signal }
				);
				if (!totalBytes) setProgress({ index: 0, value: 100 }, directory);
				completedItems++;
			}

			const results = [];
			for (let index = 0; index < files.length; index++) {
				const { file, path } = files[index];
				if (controller?.signal.aborted) break;
				setProgress({ index, value: 0 }, path);
				const result = await vfs.writefile(
					{ path: pathJoin(destinationRoot, path) },
					file,
					{
						pid: proc.pid,
						signal: controller?.signal,
						onProgress: (_ev, value) => setProgress({ index, value }, path),
					}
				);
				setProgress({ index, value: 100 }, path);
				completedBytes += file.size || 0;
				completedItems++;
				results.push(result);
				refresh(path);
			}
			return results;
		} catch (error) {
			if (!controller?.signal.aborted) {
				dialog("error", error, "Failed to upload file(s)");
			}
			return [];
		} finally {
			popup.destroy();
		}
	}

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

	const archive = (selection, archiveAction) =>
		vfs.archive(selection, { action: archiveAction });

	const upload = () => triggerBrowserUpload(uploadBrowserFiles);
	const uploadDirectory = () =>
		triggerBrowserDirectoryUpload(uploadBrowserFiles);

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
		archive,
		upload,
		refresh,
		drop,
		readdir,
		paste,
		uploadDirectory,
		supportsDirectoryUpload,
	};
};

/**
 * Clipboard action factory.
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
 * Dialog factory.
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
				message: `Delete ${files.length} file${files.length !== 1 ? "s" : ""}?`,
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

	const progressDialog = (args, onAction = () => undefined) =>
		dialog(
			"progress",
			args,
			onAction,
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
 * Creates menus.
 *
 * @param {Core} core MeeseOS Core instance reference
 * @param {Application} proc Application instance reference
 * @param {Window} win Window reference
 * @returns {Function}
 */
export const menuFactory = (core, proc, win) => {
	const fs = core.make("meeseOS/fs");
	const vfs = core.make("meeseOS/vfs");
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

	const createUploadItems = () => {
		const items = [
			{ label: "Upload", onclick: () => win.emit("filemanager:menu:upload") },
		];
		if (supportsDirectoryUpload()) {
			items.push({
				label: "Upload directory",
				onclick: () => win.emit("filemanager:menu:uploaddir"),
			});
		}
		return items;
	};

	const createFileMenu = () => [
		...createUploadItems(),
		{
			label: "Create new directory",
			onclick: () => win.emit("filemanager:menu:mkdir"),
		},
		{ label: "Quit", onclick: () => win.emit("filemanager:menu:quit") },
	];

	// Shown when right-clicking empty whitespace in the file listing.
	const createDirectoryMenu = () => {
		const menu = [
			...createUploadItems(),
			{
				label: "Create new directory",
				onclick: () => win.emit("filemanager:menu:mkdir"),
			},
		];

		if (clipboard.has(/^filemanager:/)) {
			menu.push({
				label: "Paste",
				onclick: () => win.emit("filemanager:menu:paste"),
			});
		}

		menu.push({
			label: "Refresh",
			onclick: () => win.emit("filemanager:menu:refresh"),
		});

		return menu;
	};

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

		const buffer = await vfs.readfile(item.path, "arraybuffer");
		const fileType = singleFile && !isDirectory
			? await fileTypeFromBuffer(buffer)
			: null;
		const isArchive = fileType && archiveTypes.includes(fileType.ext);

		const openMenu = isArchive ?
			[
				{
					label: "Extract archive",
					disabled: !items.length,
					onclick: () => {
						if (items.length) {
							emitter("filemanager:menu:extract");
						}
					}
				},
			] :
			isDirectory ?
				[
					{
						label: "Go",
						disabled: !items.length,
						onclick: () => {
							if (items.length) {
								emitter("filemanager:navigate");
							}
						}
					},
					{
						label: "Compress",
						disabled: !items.length,
						onclick: () => {
							if (items.length) {
								emitter("filemanager:menu:compress");
							}
						}
					},
				] : [
					{
						label: "Open",
						disabled: !items.length,
						onclick: () => {
							if (items.length) {
								emitter("filemanager:open");
							}
						}
					},
					{
						label: "Open with...",
						disabled: !items.length,
						onclick: () => {
							if (items.length) {
								emitter("filemanager:openWith");
							}
						}
					},
					{
						label: "Compress",
						disabled: !items.length,
						onclick: () => {
							if (items.length) {
								emitter("filemanager:menu:compress");
							}
						}
					},
				];

		const clipboardMenu = [
			{
				label: "Copy",
				disabled: !hasValidFile,
				onclick: () => {
					if (hasValidFile) {
						emitter("filemanager:menu:copy");
					}
				}
			},
			{
				label: "Cut",
				disabled: !hasValidFile,
				onclick: () => {
					if (hasValidFile) {
						emitter("filemanager:menu:cut");
					}
				}
			},
		];

		if (!isContextMenu) {
			const canPaste = clipboard.has(/^filemanager:/);
			clipboardMenu.push({
				label: "Paste",
				disabled: !canPaste,
				onclick: () => {
					if (canPaste) {
						emitter("filemanager:menu:paste");
					}
				},
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
				onclick: () => {
					if (canDownload) {
						emitter("filemanager:menu:download");
					}
				},
			});
		}

		return [
			...openMenu,
			{
				label: "Rename",
				disabled: !hasValidFile,
				onclick: () => {
					if (hasValidFile) {
						emitter("filemanager:menu:rename");
					}
				}
			},
			{
				label: "Delete",
				disabled: !hasValidFile,
				onclick: () => {
					if (hasValidFile) {
						emitter("filemanager:menu:delete");
					}
				}
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
		directory: createDirectoryMenu,
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
