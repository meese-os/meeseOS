import "./index.scss";
import { name as applicationName } from "./metadata.json";
import App from "./src/app";
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
		id: "Games_" + String(proc.pid),
		title: metadata.title,
		icon: proc.resource(proc.metadata.icon),
		dimension: { width: 725, height: 525 },
		position: { left: 600, top: 300 },
	});

	const app = React.createElement(App, { pid: proc.pid });
	win.render(($content) => ReactDOM.render(app, $content));

	win.on("destroy", () => {
		ReactDOM.unmountComponentAtNode(
			document.getElementById(`pid_${proc.pid}_game`)
		);
		proc.destroy();
	});

	return proc;
};

// Creates the internal callback function when MeeseOS launches an application
meeseOS.register(applicationName, register);
