// Local imports
import "./index.scss";
import { name as applicationName } from "./metadata.json";
import App from "./src/App";

// External imports
import React from "react";
import { createRoot } from "react-dom/client";
import meeseOS from "meeseOS";

/**
 * Create the old site application.
 * @param {Core} core MeeseOS Core instance reference
 * @param {*} args
 * @param {Object} options
 * @param {Object} metadata
 * @returns {Application}
 */
const register = (core, args, options, metadata) => {
	/**
	 * A new Application instance.
	 * @type {Application}
	 */
	const proc = core.make("meeseOS/application", {
		args,
		options,
		metadata,
	});

	/**
	 * A new Window instance.
	 * @type {Window}
	 */
	const win = proc.createWindow({
		id: proc.metadata.name,
		title: metadata.title,
		dimension: { width: 700, height: 450 },
		position: { left: 300, top: 200 },
	});
	win.maximize();

	win.render(($content) => createRoot($content).render(<App proc={proc} />));
	win.on("destroy", () => proc.destroy());

	return proc;
};

// Creates the internal callback function when MeeseOS launches an application
meeseOS.register(applicationName, register);
