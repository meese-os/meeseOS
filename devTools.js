window.devTools = {
	light: 0,
	connected: -1,
	fallbackMessageListener: window.devTools_fallbackMessageListener || null,
	connectListener: window.devTools_connectListener || null,
	connectFailListener: window.devTools_connectFailListener || null,

	pageID: "",
	connectionAlreadyTested: 0,
	testConnection: function () {
		if (!devTools.connectionAlreadyTested) {
			console.log("Initializing devTools...");
			if (document.currentScript) {
				if (document.currentScript.getAttribute("data-light") === "true") {
					devTools.light = 1;
				}
			}
		}
		if (window.devTools_fallbackMessageListener) {
			devTools.fallbackMessageListener = devTools_fallbackMessageListener;
		}
		if (window.devTools_connectListener) {
			devTools.connectListener = devTools_connectListener;
		}
		if (window.devTools_connectFailListener) {
			devTools.connectFailListener = devTools_connectFailListener;
		}

		if (!devTools.connectionAlreadyTested) {
			const randomIDChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
			let tempStr = "";
			for (let i = 0; i < 16; i++) {
				tempStr +=
					randomIDChars[Math.floor(Math.random() * randomIDChars.length)];
			}
			devTools.pageID = tempStr;

			if (window.self !== window.top) {
				devTools.sendRequest(
					{
						action: "page_id:create",
						conversation: "devTools_verify_page_id",
					},
					devTools.testConnected
				);
			} else {
				devTools.connected = 0;
				console.log(
					"Warning - page is not loaded in a frame and the server is not connected."
				);
				if (devTools.connectFailListener) {
					devTools.connectFailListener();
				}
			}
		} else {
			console.log(
				"devTools already started initializing. Skipping some initialization work."
			);
			if (devTools.connected === 1) {
				devTools.connectListener();
			} else if (devTools.connected === 0) {
				devTools.connectFailListener();
			}
		}
		devTools.connectionAlreadyTested = 1;
	},
	testConnected: function (data) {
		if (data.content === "pending" || data.content === "ignore") {
			return;
		}
		if (typeof data.content === "boolean") {
			devTools.connected = 1;
			if (data.content === true) {
				if (devTools.light) {
					console.log(
						"Application is connected. Light mode, not updating stylesheet."
					);
				} else {
					console.log("Application is connected. Updating stylesheet.");
				}
			} else {
				if (devTools.light) {
					console.log(
						"Application is connected, but no parent app found! App-Window-related requests may not work. Light mode, not updating stylesheet."
					);
				} else {
					console.log(
						"Application is connected, but no parent app found! App-Window-related requests may not work. Updating stylesheet."
					);
				}
			}
			if (devTools.connectListener) {
				devTools.connectListener();
			}
		} else {
			devTools.connected = 0;
			console.log(
				"Warning - Requests will not reach! The parent frame does not seem to be this website."
			);
			if (devTools.connectFailListener) {
				devTools.connectFailListener();
			}
		}
	},

	totalRequests: 0,
	sendRequest: function (requestData, callback) {
		if (this.connected !== 0) {
			if (!requestData.messageType) {
				requestData.messageType = "request";
			}
			if (!requestData.conversation) {
				this.totalRequests++;
				requestData.conversation = "" + this.totalRequests;
			}
			requestData.devToolsFrameID = devTools.pageID;
			this.callbacks[this.totalRequests] = callback || function () {};
			window.parent.postMessage(requestData, "*");
		} else {
			console.log("Warning - request will not reach the server.");
		}
		if (this.connected === -1 && requestData.action.indexOf("page_id:") !== 0) {
			console.log(
				"Warning - requests may not reach server; connection test not complete."
			);
		}
	},
	recieveRequest: function (event) {
		if (typeof event.data === "object") {
			if (event.data.conversation) {
				if (event.data.conversation === "devTools_get_page_id") {
					devTools.sendRequest(
						{
							action: "page_id:respond",
							content: event.data.content,
						},
						function () {}
					);
				} else if (event.data.conversation === "devTools_verify_page_id") {
					devTools.testConnected(event.data);
				} else {
					if (
						typeof devTools.callbacks[event.data.conversation] === "function"
					) {
						devTools.callbacks[event.data.conversation](event.data);
						devTools.callbacks[event.data.conversation] = null;
					} else {
						if (devTools.fallbackMessageListener) {
							devTools.fallbackMessageListener(event);
						}
					}
				}
			} else if (devTools.fallbackMessageListener) {
				devTools.fallbackMessageListener(event);
			}
		} else if (devTools.fallbackMessageListener) {
			devTools.fallbackMessageListener(event);
		}
	},
	callbacks: {},

	requestPermission: function (permission, callback) {
		devTools.sendRequest(
			{
				action: "permission:" + permission,
			},
			callback
		);
	},

	exec: function (codeStr, callback) {
		devTools.sendRequest(
			{
				action: "js:exec",
				content: codeStr,
			},
			callback
		);
	},

	openWindow: function (callback) {
		devTools.sendRequest(
			{
				action: "appwindow:open_window",
			},
			callback
		);
	},
	closeWindow: function (callback) {
		devTools.sendRequest(
			{
				action: "appwindow:close_window",
			},
			callback
		);
	},
	setCaption: function (newCaption, callback) {
		devTools.sendRequest(
			{
				action: "appwindow:set_caption",
				content: newCaption,
			},
			callback
		);
	},
	enablePadding: function (callback) {
		devTools.sendRequest(
			{
				action: "appwindow:enable_padding",
			},
			callback
		);
	},
	disablePadding: function (callback) {
		devTools.sendRequest(
			{
				action: "appwindow:disable_padding",
			},
			callback
		);
	},
	maximize: function (callback) {
		devTools.sendRequest(
			{
				action: "appwindow:maximize",
			},
			callback
		);
	},
	unmaximize: function (callback) {
		devTools.sendRequest(
			{
				action: "appwindow:unmaximize",
			},
			callback
		);
	},
	minimize: function (callback) {
		devTools.sendRequest(
			{
				action: "appwindow:minimize",
			},
			callback
		);
	},
	getMaximized: function (callback) {
		devTools.sendRequest(
			{
				action: "appwindow:get_maximized",
			},
			callback
		);
	},
	setDims: function (newDims, callback) {
		devTools.sendRequest(
			{
				action: "appwindow:set_dims",
				x: newDims.x || null,
				y: newDims.y || null,
				width: newDims.width || null,
				height: newDims.height || null,
			},
			callback
		);
	},
	getBorders: function (callback) {
		devTools.sendRequest(
			{
				action: "appwindow:get_borders",
			},
			callback
		);
	},
	getScreenDims: function (callback) {
		devTools.sendRequest(
			{
				action: "appwindow:get_screen_dims",
			},
			callback
		);
	},
	takeFocus: function (callback) {
		devTools.sendRequest(
			{
				action: "appwindow:take_focus",
			},
			callback
		);
	},

	useDefaultContextMenu: true,
	windowWasClicked: function (event) {
		devTools.takeFocus(function () {});
	},
	windowWasRightClicked: function (event) {
		if (devTools.useDefaultContextMenu) {
			devTools.editMenu(event, true);
		}
	},

	alert: function (paramObj, callback) {
		devTools.sendRequest(
			{
				action: "prompt:alert",
				content: paramObj.content,
				button: paramObj.button,
			},
			callback
		);
	},
	prompt: function (paramObj, callback) {
		devTools.sendRequest(
			{
				action: "prompt:prompt",
				content: paramObj.content,
				button: paramObj.button,
			},
			callback
		);
	},
	confirm: function (paramObj, callback) {
		if (!paramObj.buttons && paramObj.button) {
			devTools.sendRequest(
				{
					action: "prompt:confirm",
					content: paramObj.content,
					buttons: [paramObj.button],
				},
				callback
			);
		} else {
			devTools.sendRequest(
				{
					action: "prompt:confirm",
					content: paramObj.content,
					buttons: paramObj.buttons,
				},
				callback
			);
		}
	},
	notify: function (paramObj, callback) {
		if (!paramObj.buttons && paramObj.button) {
			devTools.sendRequest(
				{
					action: "prompt:notify",
					content: paramObj.content,
					buttons: [paramObj.button],
					image: paramObj.image,
				},
				callback
			);
		} else {
			devTools.sendRequest(
				{
					action: "prompt:notify",
					content: paramObj.content,
					buttons: paramObj.buttons,
					image: paramObj.image,
				},
				callback
			);
		}
	},

	waitingPasteTarget: null,
	waitingPasteRange: null,
	recievePasteCommand: function (data) {
		if (data.content === "pasted") {
			if (devTools.waitingPasteTarget) {
				if (typeof devTools.waitingPasteTarget.value === "string") {
					if (devTools.waitingPasteRange) {
						devTools.waitingPasteTarget.value =
							devTools.waitingPasteTarget.value.substring(
								0,
								devTools.waitingPasteRange[0]
							) +
							data.pastedText +
							devTools.waitingPasteTarget.value.substring(
								devTools.waitingPasteRange[1],
								devTools.waitingPasteTarget.value.length
							);
					} else {
						devTools.waitingPasteTarget.value =
							data.pastedText + devTools.waitingPasteTarget.value;
					}
				}
			}
		}
		devTools.waitingPasteTarget = null;
		devTools.waitingPasteRange = null;
	},
	contextMenu: function (event, options, callback, positionOverride) {
		devTools.sendRequest(
			{
				action: "context:menu",
				position:
					positionOverride || event ? [event.pageX, event.pageY] : [0, 0],
				options: options,
			},
			callback
		);
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
	},
	editMenu: function (event, enablePaste, textOverride, positionOverride) {
		devTools.waitingPasteTarget = event ? event.target : null;
		devTools.waitingPasteRange = event
			? event.target.selectionStart
				? [event.target.selectionStart, event.target.selectionEnd]
				: null
			: null;
		devTools.sendRequest(
			{
				action: "context:text_menu",
				position:
					positionOverride || event ? [event.pageX, event.pageY] : [0, 0],
				selectedText: textOverride || document.getSelection().toString(),
				enablePaste: (event ? typeof event.target.value === "string" : false)
					? enablePaste
					: 0,
			},
			devTools.recievePasteCommand
		);
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
	},
	enableDefaultMenu: function () {
		devTools.useDefaultContextMenu = true;
	},
	disableDefaultMenu: function () {
		devTools.useDefaultContextMenu = false;
	},

	bgService: {
		set: function (newURL, callback) {
			devTools.sendRequest(
				{
					action: "bgservice:set_service",
					serviceURL: newURL,
				},
				callback
			);
		},
		exit: function (callback) {
			devTools.sendRequest(
				{
					action: "bgservice:exit_service",
				},
				callback
			);
		},
		check: function (callback) {
			devTools.sendRequest(
				{
					action: "bgservice:check_service",
				},
				callback
			);
		},
	},

	recieveStylesheets: function (data) {
		if (document.getElementById("devTools_helpingStyle") === null) {
			const helpingStyleElement = document.createElement("style");
			helpingStyleElement.id = "devTools_helpingStyle";
			helpingStyleElement.innerHTML =
				"body{width:100%;height:100%;overflow:hidden;}.winHTML{overflow:auto;width:100%;height:100%;left:0;top:0;bottom:0;right:0;border:none;background:none;box-shadow:none;padding:0;}";
			document.head.prepend(helpingStyleElement);
		}

		const existingStyleElements =
			document.getElementsByClassName("devTools_hubStyle");
		for (var i = 0; i < existingStyleElements.length; i++) {
			existingStyleElements[i].remove();
		}
		for (var i = data.content.styleLinks.length - 1; i >= 0; i--) {
			if (data.content.styleLinks[i][1] === "link") {
				var customElement = document.createElement("link");
				customElement.className = "devTools_hubStyle";
				customElement.rel = "stylesheet";
				customElement.href = data.content.styleLinks[i][0];
				document.head.prepend(customElement);
			} else if (data.content.styleLinks[i][1] === "literal") {
				var customElement = document.createElement("style");
				customElement.className = "devTools_hubStyle";
				customElement.innerHTML = data.content.styleLinks[i][0];
				document.head.prepend(customElement);
			}
		}

		if (document.getElementById("devTools_officialStyle") !== null) {
			document.getElementById("devTools_officialStyle").remove();
		}
		document.body.classList.add("cursorDefault");
	},
};

devTools.testConnection();

window.addEventListener("message", devTools.recieveRequest);
window.addEventListener("click", devTools.windowWasClicked);
window.addEventListener("contextmenu", devTools.windowWasRightClicked);
