import meeseOS from "meeseOS";
import { name as applicationName } from "./metadata.json";

// Creates the internal callback function when MeeseOS launches an application
// Note the first argument is the "name" taken from your metadata.json file
const register = (core, args, options, metadata) => {
	const url = "https://meese-enterprises.github.io/uptime-monitor/";

	// Create a new Application instance
	const proc = core.make("meeseOS/application", {
		args,
		options,
		metadata,
	});

	// Create a new Window instance
	proc
		.createWindow({
			id: "UptimeMonitorWindow",
			title: metadata.title,
			dimension: { width: 650, height: 450 },
			position: { left: 600, top: 200 },
		})
		.on("destroy", () => proc.destroy())
		.render(($content) => {
			const iframe = document.createElement("iframe");
			iframe.style.width = "100%";
			iframe.style.height = "100%";
			iframe.style.backgroundColor = "white";
			iframe.src = url;
			iframe.setAttribute("border", "0");
			$content.appendChild(iframe);
		});

	return proc;
};

// Creates the internal callback function when MeeseOS launches an application
meeseOS.register(applicationName, register);
