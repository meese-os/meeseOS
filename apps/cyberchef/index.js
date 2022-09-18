import meeseOS from "meeseOS";
import { name as applicationName } from "./metadata.json";

// Creates the internal callback function when MeeseOS launches an application
// Note the first argument is the "name" taken from your metadata.json file
const register = (core, args, options, metadata) => {
	const url = "https://gchq.github.io/CyberChef/";

	// Create a new Application instance
	const proc = core.make("meeseOS/application", {
		args,
		options,
		metadata,
	});

	// Create a new Window instance
	const win = proc.createWindow({
		id: `${proc.metadata.name}Window`,
		title: metadata.title,
		icon: proc.resource(proc.metadata.icon),
		dimension: { width: 1075, height: 620 },
		position: { left: 600, top: 200 },
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
