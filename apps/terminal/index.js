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

import "./index.scss";
import * as clipboard from "clipboard-polyfill";
import { AttachAddon } from "./attach.js";
import { FitAddon } from "xterm-addon-fit";
import meeseOS from "meeseOS";
import { name as applicationName } from "./metadata.json";
import { Terminal } from "xterm";

/**
 * Creates a new Terminal connection.
 * @param {Core} core MeeseOS Core instance reference
 * @param {Application} proc MeeseOS Application instance reference
 * @param {Window} win MeeseOS Window instance reference
 * @param {Terminal} term Xterm instance reference
 * @param {Function} fit Fit function
 */
const createConnection = async (core, proc, win, term, fit) => {
	const params = {
		connection: {},
		size: {
			cols: term.cols,
			rows: term.rows,
		},
	};

	term.clear();
	term.writeln("Requesting connection....");

	/**
	 * The randomly-generated UUID of the connection.
	 * @type {String}
	 */
	const { uuid } = await proc.request("/create", {
		method: "post",
		body: params,
	});

	const pingInterval = core.config("xterm.ping", 30 * 1000);
	const ws = proc.socket("/socket", {
		socket: {
			reconnect: false,
		},
	});

	const attachAddon = new AttachAddon(ws.connection);
	term.loadAddon(attachAddon);

	let pinger;
	let closed = false;
	let pinged = false;
	let pid = -1;

	ws.on("open", () => {
		ws.send(uuid);
		term.clear();

		pinger = setInterval(() => {
			ws.send(JSON.stringify({ action: "ping" }));
		}, pingInterval);
	});

	ws.on("message", (ev) => {
		if (pinged) {
			const message = JSON.parse(ev.data);
			if (message.action === "exit" && message.event.exitCode === 0) {
				win.close();
			}
		} else {
			pinged = true;
			pid = parseInt(ev.data, 10);

			proc.request("/resize", {
				method: "post",
				body: { size: params.size, pid, uuid },
			});
			fit();
		}
	});

	ws.on("close", () => {
		term.writeln("... Disconnected. Press any key to close terminal ...");
		closed = true;
		clearInterval(pinger);
	});

	term.onKey(() => {
		if (closed) {
			win.destroy();
		}
	});

	term.onResize((size) => {
		const { cols, rows } = size;
		proc.request("/resize", {
			method: "post",
			body: { size: { cols, rows }, pid, uuid },
		});
	});

	win.on("destroy", () => {
		ws.destroy();
		term.dispose();
	});

	fit();
};

/**
 * Creates a new Terminal and Window.
 * @param {Core} core MeeseOS Core instance reference
 * @param {Application} proc MeeseOS Application instance reference
 * @param {Number} index The index of the terminal
 */
const createTerminal = (core, proc, index) => {
	const term = new Terminal({
		cols: 40,
		rows: 30,
	});

	const fitAddon = new FitAddon();
	term.loadAddon(fitAddon);

	/**
	 * Fits the terminal to the window size, puts it into focus, and scrolls
	 * to the bottom.
	 */
	const fit = () => {
		setTimeout(() => {
			fitAddon.fit();
			term.focus();
			term.scrollToBottom();
		}, 100);
	};

	/**
	 * Renders the terminal.
	 * @param {HTMLElement} $content The element to render the terminal in
	 */
	const render = ($content) => {
		term.open($content);
		fitAddon.fit();
		term.focus();

		$content.addEventListener("contextmenu", (ev) => {
			ev.preventDefault();

			core.make("meeseOS/contextmenu", {
				position: ev,
				menu: [
					{
						label: "Copy text selection",
						onclick: () => clipboard.writeText(term.getSelection()),
					},
					{
						label: "Paste from clipboard",
						onclick: () =>
							clipboard.readText().then((data) => term.write(data)),
					},
				],
			});
		});
	};

	const win = proc.createWindow({
		id: "Xterm_" + String(index),
		title: proc.metadata.title,
		icon: proc.resource(proc.metadata.icon),
		dimension: { width: 625, height: 360 },
		attributes: {
			classNames: ["Window_Xterm"],
		},
	});

	win.on("resized", fit);
	win.on("maximize", fit);
	win.on("restore", fit);
	win.on("moved", () => term.focus());
	win.on("focus", () => term.focus());
	win.on("blur", () => term.blur());
	win.on("render", (win) => createConnection(core, proc, win, term, fit));

	win.render(render);
};

/**
 * Callback for launching application.
 * @param {Core} core MeeseOS Core instance reference
 * @param {*} args
 * @param {Object} options
 * @param {Object} metadata
 * @returns {Application}
 */
meeseOS.register(applicationName, (core, args, options, metadata) => {
	const proc = core.make("meeseOS/application", {
		args,
		options,
		metadata,
	});

	proc.on("destroy-window", () => {
		if (!proc.windows.length) {
			proc.destroy();
		}
	});

	/**
	 * Creates a new terminal window.
	 * @returns {void}
	 */
	const createWindow = () => createTerminal(core, proc, proc.windows.length);

	if (core.has("meeseOS/tray")) {
		const tray = core.make("meeseOS/tray").create(
			{
				icon: proc.resource(metadata.icon),
			},
			(ev) => {
				core.make("meeseOS/contextmenu").show({
					position: ev,
					menu: [{ label: "New terminal", onclick: () => createWindow() }],
				});
			}
		);

		proc.on("destroy", () => tray.destroy());
	}

	createWindow();
	proc.on("attention", () => createWindow());

	return proc;
});
