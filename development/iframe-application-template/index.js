/*
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2020, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

import { name as applicationName } from "./metadata.json";
import meeseOS from "meeseOS";

// Creates the internal callback function when OS.js launches an application
// Note the first argument is the "name" taken from your metadata.json file
const register = (core, args, options, metadata) => {
	/**
	 * The endpoint that you want your iFrame application to display.
	 * @example https://example.com/ for remote sites
	 * @example /data/index.html for local files
	 */
	const url = "/data/index.html";

	// Create a new Application instance
	const proc = core.make("meeseOS/application", {
		args,
		options,
		metadata,
	});

	// Create  a new Window instance
	proc
		.createWindow({
			id: "MyiFrameApplicationWindow",
			title: metadata.title,
			icon: proc.resource(proc.metadata.icon),
			dimension: { width: 400, height: 400 },
			position: { left: 700, top: 200 },
		})
		.on("destroy", () => proc.destroy())
		.render(($content) => {
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

meeseOS.register(applicationName, register);
