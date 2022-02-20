import "./index.scss";
import meeseOS from "meeseOS";
import { name as applicationName } from "./metadata.json";
import React from "react";
import ReactDOM from "react-dom";
import App from "./src/App";

// Our launcher
const register = (core, args, options, metadata) => {
	// Create a new Application instance
	const proc = core.make("meeseOS/application", { args, options, metadata });

	// Create a new Window instance
	const win = proc.createWindow({
		// TODO: Show title instead of name in app list, like the Music Player
		id: proc.metadata.name,
		title: metadata.title,
		dimension: { width: 700, height: 450 },
		position: { left: 300, top: 200 },
	});

	win.maximize();
	win.on("destroy", () => proc.destroy());
	win.render(($content) => ReactDOM.render(React.createElement(App), $content));

	// Creates a new WebSocket connection (see server.js)
	// const sock = proc.socket("/socket");
	// sock.on("message", (...args) => console.log(args))
	// sock.on("open", () => sock.send("Ping"));

	// Use the internally core bound websocket
	// proc.on("ws:message", (...args) => console.log(args))
	// proc.send("Ping")

	// Creates a HTTP call (see server.js)
	// proc.request("/test", {method: "post"})
	// .then(response => console.log(response));

	return proc;
};

// Creates the internal callback function when MeeseOS launches an application
meeseOS.register(applicationName, register);
