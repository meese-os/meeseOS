import meeseOS from "meeseOS";
import { name as applicationName } from "./metadata.json";

// Creates the internal callback function when MeeseOS launches an application
// Note the first argument is the "name" taken from your metadata.json file
const register = (core, args, options, metadata) => {
	/**
	 * The endpoint that you want your iFrame application to display.
	 * @example https://example.com/ for remote sites
	 * @example /data/index.html for local files
	 */
	const url = "/data/index.html";

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
	win.render(($content) => {
		const iframe = document.createElement("iframe");
		iframe.style.width = "100%";
		iframe.style.height = "100%";
		iframe.style.backgroundColor = "white";
		iframe.src = proc.resource(url);
		iframe.setAttribute("border", "0");
		$content.appendChild(iframe);
	});

	return proc;
};

// Creates the internal callback function when OS.js launches an application
meeseOS.register(applicationName, register);
