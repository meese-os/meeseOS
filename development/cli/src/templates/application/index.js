import "./index.scss";
import meeseOS from "meeseOS";
import { name as applicationName } from "./metadata.json";

// Our launcher
const register = (core, args, options, metadata) => {
	// Create a new Application instance
	const proc = core.make("meeseOS/application", { args, options, metadata });

	// Create a new Window instance
	const win = proc.createWindow({
		id: `${proc.metadata.name}Window`,
		title: metadata.title,
		icon: proc.resource(proc.metadata.icon),
		dimension: { width: 400, height: 400 },
		position: { left: 700, top: 200 },
	});

	win.on("destroy", () => proc.destroy());
	win.render();

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
