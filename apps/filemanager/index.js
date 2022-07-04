/*!
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
	Button,
	Menubar,
	MenubarItem,
	Panes,
	Statusbar,
	TextField,
	Toolbar,
	listView,
} from "@meeseOS/gui";
import { app, h } from "hyperapp";
import { name as applicationName } from "./metadata.json";
import "./index.scss";
import dateformat from "dateformat";
import meeseOS from "meeseOS";

/**
 * Creates default settings
 */
const createDefaultSettings = () => ({
	showHiddenFiles: false,
	showDate: false,
});

/**
 * Creates the default window options
 */
const createWindowOptions = (core, proc, title) => ({
	id: "FileManager",
	icon: proc.resource(proc.metadata.icon),
	title,
	attributes: {
		mediaQueries: {
			small: "screen and (max-width: 400px)",
		},
	},
	dimension: {
		width: 400,
		height: 400,
		...core.config("filemanager.defaultWindowSize", {}),
	},
});

/**
 * Diverts callback based on drop action event
 */
const divertDropAction = (browser, virtual) => (ev, data, files) => {
	if (files.length) {
		browser(files);
	} else if (data && data.path && data.filename) {
		virtual(data);
	}
};

/**
 * HoF for dialogs
 */
const usingPositiveButton = (cb) => (btn, value) => {
	if (["yes", "ok"].indexOf(btn) !== -1) {
		cb(value);
	}
};

/**
 * Triggers a browser upload
 */
const triggerBrowserUpload = (cb) => {
	const field = document.createElement("input");
	field.type = "file";
	field.onchange = () => {
		if (field.files.length > 0) {
			cb(field.files);
		}
	};
	field.click();
};

/**
 * Checks if given fielname is a dotted
 */
const isSpecialFile = (filename) => ["..", "."].indexOf(filename) !== -1;

/**
 * Creates initial paths
 */
const createInitialPaths = (core, proc) => {
	const homePath = { path: core.config("vfs.defaultPath", "home:/") };
	const initialPath = proc.args.path
		? { ...homePath, ...proc.args.path }
		: homePath;

	return { homePath, initialPath };
};

/**
 * Formats file status message
 */
const formatFileMessage = (file) => `${file.filename} (${file.size} bytes)`;

/**
 * Formats directory status message
 */
const formatStatusMessage = (core) => {
	return (path, files) => {
		const directoryCount = files.filter((f) => f.isDirectory).length;
		const fileCount = files.filter((f) => !f.isDirectory).length;
		const totalSize = files.reduce((t, f) => t + (f.size || 0), 0);

		return `${directoryCount} directories, ${fileCount} files, ${totalSize} bytes total`;
	};
};

/**
 * Mount view rows Factory
 */
const mountViewRowsFactory = (core) => {
	const fs = core.make("meeseOS/fs");
	const getMountpoints = () => fs.mountpoints(true);

	// https://github.com/os-js/OS.js/issues/796
	return () =>
		getMountpoints().map((m) => ({
			columns: [
				{
					icon: m.icon,
					label: m.label,
				},
			],
			data: m,
		}));
};

/**
 * File view columns Factory
 */
const listViewColumnFactory = (core, proc) => {
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
 * File view rows Factory
 */
const listViewRowFactory = (core, proc) => {
	const fs = core.make("meeseOS/fs");
	const getFileIcon = (file) => file.icon || fs.icon(file);

	const formattedDate = (f) => {
		if (f.stat) {
			const rawDate = f.stat.mtime || f.stat.ctime;
			if (rawDate) {
				try {
					const d = new Date(rawDate);
					return `${dateformat(d, "yyyy-mm-dd")} ${dateformat(d, "HH:MM")}`;
				} catch (e) {
					return rawDate;
				}
			}
		}

		return "";
	};

	return (list) =>
		list.map((f) => {
			const columns = [
				{
					label: f.filename,
					icon: getFileIcon(f),
				},
			];

			if (proc.settings.showDate) {
				columns.push(formattedDate(f));
			}

			return {
				key: f.path,
				data: f,
				columns: [...columns, f.mime, f.humanSize],
			};
		});
};

/**
 * VFS action Factory
 */
const vfsActionFactory = (core, proc, win, dialog, state) => {
	const vfs = core.make("meeseOS/vfs");
	const { pathJoin } = core.make("meeseOS/fs");

	const refresh = (fileOrWatch) => {
		// FIXME This should be implemented a bit better
		/*
    if (fileOrWatch === true && core.config('vfs.watch')) {
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

	const writeRelative = (f) => {
		const d = dialog("progress", f);

		return vfs
			.writefile(
				{
					path: pathJoin(state.currentPath.path, f.name),
				},
				f,
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
		if (win.getState("loading")) {
			return;
		}

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
			state.currentFile = undefined;
			win.setState("loading", false);
		}
	};

	const upload = () =>
		triggerBrowserUpload((files) => {
			writeRelative(files[0])
				.then(() => refresh(files[0].name))
				.catch((error) => dialog("error", error, "Failed to upload file(s)"));
		});

	const paste =
		(move, currentPath) =>
			({ item, callback }) => {
				const dest = { path: pathJoin(currentPath.path, item.filename) };

				const fn = move
					? vfs.move(item, dest, { pid: proc.pid })
					: vfs.copy(item, dest, { pid: proc.pid });

				return fn
					.then(() => {
						refresh(true);

						if (typeof callback === "function") {
							callback();
						}
					})
					.catch((error) => dialog("error", error, "Failed to paste file(s)"));
			};

	return {
		download: (file) => vfs.download(file),
		upload,
		refresh,
		action,
		drop,
		readdir,
		paste,
	};
};

/**
 * Clipboard action Factory
 */
const clipboardActionFactory = (core, state, vfs) => {
	const clipboard = core.make("meeseOS/clipboard");

	const set = (item) => clipboard.set({ item }, "filemanager:copy");

	const cut = (item) =>
		clipboard.set(
			{
				item,
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
 * Dialog Factory
 */
const dialogFactory = (core, proc, win) => {
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

	const renameDialog = (action, file) =>
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
		);

	const deleteDialog = (action, file) =>
		dialog(
			"confirm",
			{
				message: `Delete ${file.filename}?`,
			},
			usingPositiveButton(() => {
				action(
					() => vfs.unlink(file, { pid: proc.pid }),
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
 * Creates Menus
 */
const menuFactory = (core, proc, win) => {
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
		const result = resolved.filter((items) => items instanceof Array);

		return [].concat(...result);
	};

	const createFileMenu = () => [
		{ label: "Upload", onclick: () => win.emit("filemanager:menu:upload") },
		{
			label: "Create new directory",
			onclick: () => win.emit("filemanager:menu:mkdir"),
		},
		{ label: "Quit", onclick: () => win.emit("filemanager:menu:quit") },
	];

	const createEditMenu = async (item, isContextMenu) => {
		const emitter = (name) => win.emit(name, item);

		if (item && isSpecialFile(item.filename)) {
			return [
				{
					label: "Go",
					onclick: () => emitter("filemanager:navigate"),
				},
			];
		}

		const isValidFile = item && !isSpecialFile(item.filename);
		const isDirectory = item && item.isDirectory;

		const openMenu = isDirectory
			? [
				{
					label: "Go",
					disabled: !item,
					onclick: () => emitter("filemanager:navigate"),
				},
			  ]
			: [
				{
					label: "Open",
					disabled: !item,
					onclick: () => emitter("filemanager:open"),
				},
				{
					label: "Open with...",
					disabled: !item,
					onclick: () => emitter("filemanager:openWith"),
				},
			  ];

		const clipboardMenu = [
			{
				label: "Copy",
				disabled: !isValidFile,
				onclick: () => emitter("filemanager:menu:copy"),
			},
			{
				label: "Cut",
				disabled: !isValidFile,
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
				disabled: !item || isDirectory || !isValidFile,
				onclick: () => emitter("filemanager:menu:download"),
			});
		}

		return [
			...openMenu,
			{
				label: "Rename",
				disabled: !isValidFile,
				onclick: () => emitter("filemanager:menu:rename"),
			},
			{
				label: "Delete",
				disabled: !isValidFile,
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

/**
 * Creates a new FileManager user interface view
 */
const createView = (core, proc, win) => {
	const { icon } = core.make("meeseOS/theme");

	const onMenuClick = (name, args) => (ev) =>
		win.emit("filemanager:menu", { ev, name }, args);
	const onInputEnter = (ev, value) =>
		win.emit("filemanager:navigate", { path: value });

	const canGoBack = ({ list, index }) => !list.length || index <= 0;
	const canGoForward = ({ list, index }) =>
		!list.length || index === list.length - 1;

	return (state, actions) => {
		const FileView = listView.component(state.fileview, actions.fileview);
		const MountView = listView.component(state.mountview, actions.mountview);

		return h(
			Box,
			{
				class: state.minimalistic ? "meeseOS-filemanager-minimalistic" : "",
			},
			[
				h(Menubar, {}, [
					h(MenubarItem, { onclick: onMenuClick("file") }, "File"),
					h(MenubarItem, { onclick: onMenuClick("edit") }, "Edit"),
					h(MenubarItem, { onclick: onMenuClick("view", state) }, "View"),
					h(MenubarItem, { onclick: onMenuClick("go") }, "Go"),
				]),
				h(Toolbar, {}, [
					h(Button, {
						title: "Back",
						icon: icon("go-previous"),
						disabled: canGoBack(state.history),
						onclick: () => actions.history.back(),
					}),
					h(Button, {
						title: "Forward",
						icon: icon("go-next"),
						disabled: canGoForward(state.history),
						onclick: () => actions.history.forward(),
					}),
					h(Button, {
						title: "Home",
						icon: icon("go-home"),
						onclick: () => win.emit("filemanager:home"),
					}),
					h(TextField, {
						value: state.path,
						box: { grow: 1, shrink: 1 },
						onenter: onInputEnter,
					}),
				]),
				h(Panes, { style: { flex: "1 1" } }, [h(MountView), h(FileView)]),
				h(Statusbar, {}, h("span", {}, state.status)),
			]
		);
	};
};

/**
 * Creates a new FileManager user interface
 */
const createApplication = (core, proc) => {
	const createColumns = listViewColumnFactory(core, proc);
	const createRows = listViewRowFactory(core, proc);
	const createMounts = mountViewRowsFactory(core);
	const { draggable } = core.make("meeseOS/dnd");
	const statusMessage = formatStatusMessage(core);

	const initialState = {
		path: "",
		status: "",
		minimalistic: false,

		history: {
			index: -1,
			list: [],
		},

		mountview: listView.state({
			class: "meeseOS-gui-fill",
			columns: ["Name"],
			hideColumns: true,
			rows: createMounts(),
		}),

		fileview: listView.state({
			columns: [],
		}),
	};

	const createActions = (win) => ({
		history: {
			clear: () => ({ index: -1, list: [] }),

			push:
				(path) =>
					({ index, list }) => {
						const newList = index === -1 ? [] : list;
						const lastHistory = newList[newList.length - 1];
						const newIndex =
						lastHistory === path ? newList.length - 1 : newList.push(path) - 1;

						return { list: newList, index: newIndex };
					},

			back:
				() =>
					({ index, list }) => {
						const newIndex = Math.max(0, index - 1);
						win.emit("filemanager:navigate", list[newIndex], true);
						return { index: newIndex };
					},

			forward:
				() =>
					({ index, list }) => {
						const newIndex = Math.min(list.length - 1, index + 1);
						win.emit("filemanager:navigate", list[newIndex], true);
						return { index: newIndex };
					},
		},

		toggleMinimalistic:
			() =>
				({ minimalistic }) => ({ minimalistic: !minimalistic }),

		setPath: (path) => ({ path }),
		setStatus: (status) => ({ status }),
		setMinimalistic: (minimalistic) => ({ minimalistic }),
		setList:
			({ list, path, selectFile }) =>
				({ fileview, mountview }) => {
					let selectedIndex = 0;

					if (selectFile) {
						const foundIndex = list.findIndex(
							(file) => file.filename === selectFile
						);
						if (foundIndex !== -1) {
							selectedIndex = foundIndex;
						}
					}

					return {
						path,
						status: statusMessage(path, list),
						mountview: { ...mountview, rows: createMounts() },
						fileview: {
							...fileview,
							selectedIndex,
							columns: createColumns(),
							rows: createRows(list),
						},
					};
				},

		mountview: listView.actions({
			select: ({ data }) =>
				win.emit("filemanager:navigate", { path: data.root }),
		}),

		fileview: listView.actions({
			select: ({ data }) => win.emit("filemanager:select", data),
			activate: ({ data }) =>
				win.emit(`filemanager:${data.isFile ? "open" : "navigate"}`, data),
			contextmenu: (args) => win.emit("filemanager:contextmenu", args),
			created: ({ el, data }) => {
				if (data.isFile) {
					draggable(el, { data });
				}
			},
		}),
	});

	return ($content, win) => {
		const actions = createActions(win);
		const view = createView(core, proc, win);
		return app(initialState, actions, view, $content);
	};
};

/**
 * Creates a new FileManager window
 */
const createWindow = (core, proc) => {
	let wired;
	const state = { currentFile: undefined, currentPath: undefined };
	const { homePath, initialPath } = createInitialPaths(core, proc);

	const localPackage = typeof proc.metadata.title === "string";
	const title = localPackage ? proc.metadata.title : proc.metadata.title;
	const win = proc.createWindow(createWindowOptions(core, proc, title));
	const render = createApplication(core, proc);
	const dialog = dialogFactory(core, proc, win);
	const createMenu = menuFactory(core, proc, win);
	const vfs = vfsActionFactory(core, proc, win, dialog, state);
	const clipboard = clipboardActionFactory(core, state, vfs);

	const setSetting = (key, value) =>
		proc.emit("filemanager:setting", key, value);
	const onTitle = (append) => win.setTitle(`${title} - ${append}`);
	const onStatus = (message) => wired.setStatus(message);
	const onRender = () => vfs.readdir(initialPath);
	const onDestroy = () => proc.destroy();
	const onDrop = (...args) => vfs.drop(...args);
	const onHome = () => vfs.readdir(homePath, "clear");
	const onNavigate = (...args) => vfs.readdir(...args);
	const onSelectItem = (file) => (state.currentFile = file);
	const onSelectStatus = (file) =>
		win.emit("filemanager:status", formatFileMessage(file));
	const onContextMenu = ({ ev, data }) =>
		createMenu({ ev, name: "edit" }, data, true);
	const onReaddirRender = (args) => wired.setList(args);
	const onRefresh = (...args) => vfs.refresh(...args);
	const onOpen = (file) => core.open(file, { useDefault: true });
	const onOpenWith = (file) =>
		core.open(file, { useDefault: true, forceDialog: true });
	const onHistoryPush = (file) => wired.history.push(file);
	const onHistoryClear = () => wired.history.clear();
	const onMenu = (props, args) => createMenu(props, args || state.currentFile);
	const onMenuUpload = (...args) => vfs.upload(...args);
	const onMenuMkdir = () => dialog("mkdir", vfs.action, state.currentPath);
	const onMenuQuit = () => proc.destroy();
	const onMenuRefresh = () => vfs.refresh();
	const onMenuToggleMinimalistic = () => wired.toggleMinimalistic();
	const onMenuShowDate = () => setSetting("showDate", !proc.settings.showDate);
	const onMenuShowHidden = () =>
		setSetting("showHiddenFiles", !proc.settings.showHiddenFiles);
	const onMenuRename = (file) => dialog("rename", vfs.action, file);
	const onMenuDelete = (file) => dialog("delete", vfs.action, file);
	const onMenuDownload = (...args) => vfs.download(...args);
	const onMenuCopy = (item) => clipboard.set(item);
	const onMenuCut = (item) => clipboard.cut(item);
	const onMenuPaste = () => clipboard.paste();

	return win
		.once("render", () => win.focus())
		.once("destroy", () => (wired = undefined))
		.once("render", onRender)
		.once("destroy", onDestroy)
		.on("drop", onDrop)
		.on("filemanager:title", onTitle)
		.on("filemanager:status", onStatus)
		.on("filemanager:menu", onMenu)
		.on("filemanager:home", onHome)
		.on("filemanager:navigate", onNavigate)
		.on("filemanager:select", onSelectItem)
		.on("filemanager:select", onSelectStatus)
		.on("filemanager:contextmenu", onContextMenu)
		.on("filemanager:readdir", onReaddirRender)
		.on("filemanager:refresh", onRefresh)
		.on("filemanager:open", onOpen)
		.on("filemanager:openWith", onOpenWith)
		.on("filemanager:historyPush", onHistoryPush)
		.on("filemanager:historyClear", onHistoryClear)
		.on("filemanager:menu:upload", onMenuUpload)
		.on("filemanager:menu:mkdir", onMenuMkdir)
		.on("filemanager:menu:quit", onMenuQuit)
		.on("filemanager:menu:refresh", onMenuRefresh)
		.on("filemanager:menu:toggleMinimalistic", onMenuToggleMinimalistic)
		.on("filemanager:menu:showDate", onMenuShowDate)
		.on("filemanager:menu:showHidden", onMenuShowHidden)
		.on("filemanager:menu:copy", onMenuCopy)
		.on("filemanager:menu:cut", onMenuCut)
		.on("filemanager:menu:paste", onMenuPaste)
		.on("filemanager:menu:rename", onMenuRename)
		.on("filemanager:menu:delete", onMenuDelete)
		.on("filemanager:menu:download", onMenuDownload)
		.render(($content, win) => (wired = render($content, win)));
};

/**
 * Launches the MeeseOS application process
 */
const createProcess = (core, args, options, metadata) => {
	const proc = core.make("meeseOS/application", {
		args,
		metadata,
		options: { ...options, settings: createDefaultSettings() },
	});

	const emitter = core.broadcast();
	const win = createWindow(core, proc);

	const onSettingsUpdate = (settings) => {
		proc.settings = { ...proc.settings, ...settings };
		win.emit("filemanager:refresh");
	};

	const onSetting = (key, value) => {
		onSettingsUpdate({ [key]: value });

		proc
			.saveSettings()
			.then(() => emitter("meeseOS:filemanager:remote", proc.settings))
			.catch((error) => console.warn(error));
	};

	proc.on("meeseOS:filemanager:remote", onSettingsUpdate);
	proc.on("filemanager:setting", onSetting);

	const listener = (args) => {
		if (args.pid === proc.pid) {
			return;
		}

		const currentPath = String(proc.args.path.path).replace(/\/$/, "");
		const watchPath = String(args.path).replace(/\/$/, "");
		if (currentPath === watchPath) {
			win.emit("filemanager:refresh");
		}
	};

	core.on("meeseOS/vfs:directoryChanged", listener);
	proc.on("destroy", () => core.off("meeseOS/vfs:directoryChanged", listener));

	return proc;
};

meeseOS.register(applicationName, createProcess);
