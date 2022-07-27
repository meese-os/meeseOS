import "./index.scss";
import { name as applicationName } from "./metadata.json";
import App from "./src/App";
import React from "react";
import ReactDOM from "react-dom";
import meeseOS from "meeseOS";

// Our launcher
const register = (core, args, options, metadata) => {
	// Create a new Application instance
	const proc = core.make("meeseOS/application", {
		args,
		options,
		metadata,
	});

	// Create a new Window instance
	const win = proc.createWindow({
		id: proc.metadata.name,
		title: metadata.title,
		dimension: { width: 700, height: 450 },
		position: { left: 300, top: 200 },
	});

	win.maximize();
	win.on("destroy", () => proc.destroy());
	win.render(($content) => ReactDOM.render(React.createElement(App), $content));

	return proc;
};

// Creates the internal callback function when MeeseOS launches an application
meeseOS.register(applicationName, register);
