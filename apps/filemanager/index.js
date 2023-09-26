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
} from "@meese-os/gui";
import {
	mountViewRowsFactory,
	listViewColumnFactory,
	listViewRowFactory,
	vfsActionFactory,
	clipboardActionFactory,
	dialogFactory,
	menuFactory,
} from "./src/factories.js";
import { app, h } from "hyperapp";
import { name as applicationName } from "./metadata.json";
import "./index.scss";
import meeseOS from "meeseOS";

/**
 * Creates default settings
 * @returns {Object} The default settings
 */
const createDefaultSettings = () => ({
	showHiddenFiles: false,
	showDate: false,
});

/**
 * Creates the default window options
 * @param {Core} core MeeseOS Core instance reference
 * @param {Application} proc Application instance reference
 * @param {String} title The window title
 * @returns {Object} The window options
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
		width: 750,
		height: 450,
		...core.config("filemanager.defaultWindowSize", {}),
	},
});

/**
 * Creates the initial paths
 * @param {Core} core MeeseOS Core instance reference
 * @param {Application} proc Application instance reference
 * @returns {Object} The initial paths
 */
const createInitialPaths = (core, proc) => {
	const homePath = { path: core.config("vfs.defaultPath", "home:/") };
	const initialPath = proc.args.path
		? { ...homePath, ...proc.args.path }
		: homePath;

	return { homePath, initialPath };
};

const getDirectoryCount = (files) =>
	files.filter((file) => file.isDirectory).length;
const getFileCount = (files) =>
	files.filter((file) => !file.isDirectory).length;
const getTotalSize = (files) =>
	files.reduce((total, file) => total + (file.size ?? 0), 0);

/**
 * Formats the file selection status message
 * @param {Array} files The selected files
 * @returns {String} The file selection status message
 */
const formatStatusMessage = (files) => {
	const directoryCount = getDirectoryCount(files);
	const fileCount = getFileCount(files);
	const totalSize = getTotalSize(files);
	const directoryCountMessage = `${directoryCount} director${directoryCount === 1 ? "y" : "ies"}`;
	const fileCountMessage = `${fileCount} file${fileCount === 1 ? "" : "s"}`;

	if (directoryCount > 0 && fileCount > 0) {
		return `${directoryCountMessage}, ${fileCountMessage}, ${totalSize} bytes total`;
	} else if (directoryCount > 0) {
		return `${directoryCountMessage}, ${totalSize} bytes total`;
	} else {
		return `${fileCountMessage}, ${totalSize} bytes total`;
	}
};

/**
 * Creates a new FileManager user interface view
 * @param {Core} core MeeseOS Core instance reference
 * @param {Application} proc Application instance reference
 * @param {Window} win Window instance reference
 * @returns {Function}
 */
const createView = (core, proc, win) => {
	const { icon } = core.make("meeseOS/theme");

	const onMenuClick = (name, args) =>
		(ev) => win.emit("filemanager:menu", { ev, name }, args);
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
 * @param {Core} core MeeseOS Core instance reference
 * @param {Application} proc Application instance reference
 * @returns {Function}
 */
const createApplication = (core, proc) => {
	const createColumns = listViewColumnFactory(core, proc);
	const createRows = listViewRowFactory(core, proc);
	const createMounts = mountViewRowsFactory(core);
	const { draggable } = core.make("meeseOS/dnd");

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
			multiselect: true,
			previousSelectedIndex: 0,
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
						const newIndex = lastHistory === path
							? newList.length - 1
							: newList.push(path) - 1;

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
					let selectedIndex = [];

					if (selectFile) {
						const foundIndex = list.findIndex(
							(file) => file.filename === selectFile
						);
						if (foundIndex !== -1) {
							selectedIndex = [foundIndex];
						}
					}

					return {
						path,
						status: formatStatusMessage(list),
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
				data.forEach((item) =>
					win.emit(`filemanager:${item.isFile ? "open" : "navigate"}`, item)
				),
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
 * @param {Core} core MeeseOS Core instance reference
 * @param {Application} proc Application instance reference
 * @returns {Window}
 */
const createWindow = (core, proc) => {
	let wired;
	const state = { currentFile: [], currentPath: undefined };
	const { homePath, initialPath } = createInitialPaths(core, proc);

	const localPackage = typeof proc.metadata.title === "string";
	const title = localPackage ? proc.metadata.title : proc.metadata.title;
	const win = proc.createWindow(createWindowOptions(core, proc, title));
	const render = createApplication(core, proc);
	const dialog = dialogFactory(core, proc, win);
	// TODO: This is the parent of the above functions
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
	const onSelectItem = (files) => (state.currentFile = files);
	const onSelectStatus = (files) =>
		win.emit("filemanager:status", formatStatusMessage(files));
	const onContextMenu = ({ ev, data }) =>
		createMenu({ ev, name: "edit" }, data, true);
	const onReaddirRender = (args) => wired.setList(args);
	const onRefresh = (...args) => vfs.refresh(...args);
	const onOpen = (files) => {
		if (!Array.isArray(files)) files = [files];
		return files.forEach(
			(file) => core.open(file, { useDefault: true })
		);
	};
	const onOpenWith = (files) => {
		if (!Array.isArray(files)) files = [files];
		return files.forEach(
			(file) => core.open(file, { useDefault: true, forceDialog: true })
		);
	};
	const onHistoryPush = (file) => wired.history.push(file);
	const onHistoryClear = () => wired.history.clear();
	const onMenu = (props, args) => createMenu(props, args || state.currentFile);
	const onMenuCompress = (files) => vfs.archive(files, "compress");
	const onMenuExtract = (files) => vfs.archive(files, "extract");
	const onMenuUpload = (...args) => vfs.upload(...args);
	const onMenuMkdir = () => dialog("mkdir", vfs.action, state.currentPath);
	const onMenuQuit = () => proc.destroy();
	const onMenuRefresh = () => vfs.refresh();
	const onMenuToggleMinimalistic = () => wired.toggleMinimalistic();
	const onMenuShowDate = () => setSetting("showDate", !proc.settings.showDate);
	const onMenuShowHidden = () =>
		setSetting("showHiddenFiles", !proc.settings.showHiddenFiles);
	const onMenuRename = (files) => dialog("rename", vfs.action, files);
	const onMenuDelete = (files) => dialog("delete", vfs.action, files);
	const onMenuDownload = (files) => vfs.download(files);
	const onMenuCopy = (items) => clipboard.set(items);
	const onMenuCut = (items) => clipboard.cut(items);
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
		.on("filemanager:menu:extract", onMenuExtract)
		.on("filemanager:menu:compress", onMenuCompress)
		.render(($content, win) => (wired = render($content, win)));
};

/**
 * Launches the MeeseOS application process
 * @param {Core} core MeeseOS Core instance reference
 * @param {*} args
 * @param {Object} options
 * @param {Object} metadata
 * @returns {Application}
 */
const createProcess = (core, args, options, metadata) => {
	const proc = core.make("meeseOS/application", {
		args,
		metadata,
		options: { ...options, settings: createDefaultSettings() },
	});

	const win = createWindow(core, proc);

	const onSettingsUpdate = (settings) => {
		proc.settings = { ...proc.settings, ...settings };
		win.emit("filemanager:refresh");
	};

	const onSetting = (key, value) => {
		onSettingsUpdate({ [key]: value });

		proc
			.saveSettings()
			.then(() => core.broadcast("meeseOS:filemanager:remote", proc.settings))
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
