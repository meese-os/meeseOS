import "./index.scss";
import { name as applicationName } from "./metadata.json";
import App from "./src/app";
import React from "react";
import { createRoot } from "react-dom/client";
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
		id: "Games_" + String(proc.pid),
		title: metadata.title,
		icon: proc.resource(proc.metadata.icon),
		dimension: { width: 725, height: 525 },
		position: { left: 600, top: 300 },
	});

	const app = React.createElement(App, { pid: proc.pid });
	let root = null;
	win.render(($content) => {
		root = createRoot($content);
		root.render(app);
	});

	win.on("destroy", () => {
		if (root) {
			root.unmount();
			root = null;
		}
		proc.destroy();
	});

	return proc;
};

// Creates the internal callback function when MeeseOS launches an application
meeseOS.register(applicationName, register);
