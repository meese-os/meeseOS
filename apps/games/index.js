import "./index.scss";
import { name as applicationName } from "./metadata.json";
import App from "./src/app";
import React from "react";
import ReactDOM from "react-dom";
import meeseOS from "meeseOS";

// Our launcher
const register = (core, args, options, metadata) => {
	// Create a new Application instance
	const proc = core.make("meeseOS/application", { args, options, metadata });

	// Create a new Window instance
	const win = proc.createWindow({
		id: "GamesWindow",
		title: metadata.title,
		icon: proc.resource(proc.metadata.icon),
		dimension: { width: 650, height: 525 },
		position: { left: 600, top: 200 },
	});

	win.on("destroy", () => proc.destroy());
	win.render(($content) => ReactDOM.render(React.createElement(App), $content));

	return proc;
};

// Creates the internal callback function when MeeseOS launches an application
meeseOS.register(applicationName, register);
