const AppPrompt = () => {
	apps.prompt = new Application({
		title: "Application Prompt",
		abbreviation: "PMT",
		codeName: "prompt",
		image: "smarticons/prompt/fg.png",
		hideApp: 2,
		launchTypes: 1,
		main: function (launchtype) {
			if (launchtype === "dsktp") {
				if (!this.appWindow.appIcon) {
					this.appWindow.setDims("auto", "auto", 500, 300);
				}
				this.appWindow.setCaption("Modal Dialogue");
				getId("win_prompt_big").style.display = "none";
				getId("win_prompt_exit").style.display = "none";
				this.appWindow.alwaysOnTop(1);
				this.vars.checkNotifs();
			}
		},
		vars: {
			appInfo:
				"This is a prompt or alert box used for applications to create simple messages or get simple input from the user.",
			prompts: [],
			currprompt: [],
			totalNotifs: 0,
			notifs: {},
			alert: function (aText, aButton, aCallback, aCaption) {
				if (typeof aText === "object") {
					this.notifs["notif_" + this.totalNotifs] = {
						notifType: "alert",
						notifDate: formDate("D/M/y h:m"),
						caption: aText.caption,
						content: aText.content,
						button: aText.button,
						callback: aText.callback,
					};
				} else {
					this.notifs["notif_" + this.totalNotifs] = {
						notifType: "alert",
						notifDate: formDate("D/M/y h:m"),
						caption: aCaption,
						content: aText,
						button: aButton,
						callback: aCallback,
					};
				}
				this.totalNotifs++;
				this.checkNotifs();
			},
			confirm: function (cText, cButtons, cCallback, cCaption) {
				if (typeof cText === "object") {
					this.notifs["notif_" + this.totalNotifs] = {
						notifType: "confirm",
						notifDate: formDate("D/M/y h:m"),
						caption: cText.caption,
						content: cText.content,
						buttons: cText.buttons,
						callback: cText.callback,
					};
				} else {
					this.notifs["notif_" + this.totalNotifs] = {
						notifType: "confirm",
						notifDate: formDate("D/M/y h:m"),
						caption: cCaption,
						content: cText,
						buttons: cButtons,
						callback: cCallback,
					};
				}
				this.totalNotifs++;
				this.checkNotifs();
			},
			prompt: function (pText, pButton, pCallback, pCaption, isPassword) {
				if (typeof pText === "object") {
					this.notifs["notif_" + this.totalNotifs] = {
						notifType: "prompt",
						notifDate: formDate("D/M/y h:m"),
						caption: pText.caption,
						content: pText.content,
						button: pText.button,
						callback: pText.callback,
						isPassword: pText.isPassword,
					};
				} else {
					this.notifs["notif_" + this.totalNotifs] = {
						notifType: "prompt",
						notifDate: formDate("D/M/y h:m"),
						caption: pCaption,
						content: pText,
						button: pButton,
						callback: pCallback,
						isPassword: isPassword,
					};
				}

				this.totalNotifs++;
				this.checkNotifs();
			},
			notify: function (nText, nButtons, nCallback, nCaption, nImage) {
				if (typeof nText === "object") {
					this.notifs["notif_" + this.totalNotifs] = {
						notifType: "notify",
						notifDate: formDate("D/M/y h:m"),
						caption: nText.caption,
						content: nText.content,
						image: nText.image,
						buttons: nText.buttons,
						callback: nText.callback,
					};
				} else {
					this.notifs["notif_" + this.totalNotifs] = {
						notifType: "notify",
						notifDate: formDate("D/M/y h:m"),
						caption: nCaption,
						content: nText,
						image: nImage,
						buttons: nButtons,
						callback: nCallback,
					};
				}

				this.totalNotifs++;
				this.checkNotifs();
			},
			lastModalsFound: [],
			lastNotifsFound: [],
			checkNotifs: function () {
				const modalsFound = [];
				const notifsFound = [];
				for (var i in this.notifs) {
					if (this.notifs[i].notifType === "notify") {
						notifsFound.push(i);
					} else if (
						this.notifs[i].notifType === "alert" ||
						this.notifs[i].notifType === "prompt" ||
						this.notifs[i].notifType === "confirm"
					) {
						modalsFound.push(i);
					}
				}
				if (modalsFound.length > 0) {
					apps.prompt.vars.showModals();
					if (modalsFound !== this.lastModalsFound) {
						let modalText = "";
						for (var i of modalsFound) {
							modalText +=
								'<div style="position:relative" data-modal="' + i + '">';
							switch (this.notifs[i].notifType) {
								case "alert":
									modalText +=
										"<p><b>" +
										cleanStr(this.notifs[i].caption) +
										" has a message:</b></p>" +
										"<p>" +
										this.notifs[i].content +
										"</p>" +
										'<button onclick="apps.prompt.vars.modalSubmit(this.parentNode, 0)">' +
										(this.notifs[i].button || "Okay") +
										"</button>";
									break;
								case "confirm":
									modalText +=
										"<p><b>" +
										cleanStr(this.notifs[i].caption) +
										" wants you to choose:</b></p>" +
										"<p>" +
										this.notifs[i].content +
										"</p>";
									for (var j in this.notifs[i].buttons) {
										modalText +=
											'<button onclick="apps.prompt.vars.modalSubmit(this.parentNode, ' +
											j +
											')">' +
											(this.notifs[i].buttons[j] || "Option" + j) +
											"</button> ";
									}
									break;
								case "prompt":
									modalText +=
										"<p><b>" +
										cleanStr(this.notifs[i].caption) +
										" wants some info:</b></p>" +
										"<p>" +
										this.notifs[i].content +
										"</p>" +
										'<input style="width:60%" class="modalDialogueInput" onkeypress="if(event.keyCode === 13){apps.prompt.vars.modalSubmit(this.parentNode, 0)}"> ' +
										'<button onclick="apps.prompt.vars.modalSubmit(this.parentNode, 0)">' +
										(this.notifs[i].button || "Sumbit") +
										"</button>";
									break;
								default:
								// Nothing, this notification is weird
							}
							modalText += "</div>";
							apps.prompt.appWindow.setContent(modalText);
						}
					}
				} else {
					apps.prompt.vars.hideModals();
				}
				/*  this is the html of a notification
					<div id="notifWindow" class="darkResponsive" style="opacity:0;pointer-events:none;right:-350px">
							<div id="notifTitle">Notification</div>
							<div id="notifContent">Content</div>
							<div id="notifButtons"><button>Button 1</button> <button>Button 2</button></div>
							<img id="notifImage" src="appicons/aOS.png">
							<div class="winExit cursorPointer" onClick="getId('notifWindow').style.opacity='0';getId('notifWindow').style.pointerEvents='none';getId('notifWindow').style.right = '-350px';window.setTimeout(function(){apps.prompt.vars.checkPrompts();}, 300);apps.prompt.vars.currprompt[3](-1);">x</div>
					</div>
			*/
				if (notifsFound.length > 0) {
					apps.prompt.vars.showNotifs();
					if (notifsFound !== this.lastNotifsFound) {
						let notifText = "";
						for (var i of notifsFound) {
							notifText +=
								'<div class="notifWindow noselect darkResponsive" data-notif="' +
								i +
								'">' +
								'<div class="notifTitle">' +
								cleanStr(this.notifs[i].caption) +
								"</div>" +
								'<div class="notifContent canselect">' +
								cleanStr(this.notifs[i].content)
									.split("&lt;br&gt;")
									.join("<br>") +
								"</div>" +
								'<div class="notifButtons">';
							for (var j in this.notifs[i].buttons) {
								notifText +=
									'<button onclick="apps.prompt.vars.notifClick(this.parentNode.parentNode, ' +
									j +
									')">' +
									this.notifs[i].buttons[j] +
									"</button>";
							}
							notifText += "</div>";
							if (typeof this.notifs[i].image === "string") {
								notifText +=
									'<img class="notifImage" src="' +
									this.notifs[i].image +
									'" onerror="this.src=\'\'">';
							} else if (typeof this.notifs[i].image === "object") {
								notifText += buildSmartIcon(
									50,
									this.notifs[i].image,
									"display:block;position:absolute;right:2px;top:calc(50% - 25px);"
								);
							}
							notifText +=
								'<div class="winExit cursorPointer" onclick="apps.prompt.vars.notifClick(this.parentNode, -1)">x</div>' +
								"</div><br>";
						}
						getId("notifications").innerHTML = notifText;
					}
				} else {
					apps.prompt.vars.hideNotifs();
				}
				this.lastModalsFound = modalsFound;
				this.lastNotifsFound = notifsFound;
			},
			modalSubmit: function (modalElem, choice) {
				if (typeof modalElem === "object") {
					if (modalElem.getAttribute("data-modal")) {
						const modalID = modalElem.getAttribute("data-modal");
						const modalType = this.notifs[modalID].notifType;
						switch (modalType) {
							case "alert":
								this.notifs[modalID].callback();
								break;
							case "confirm":
								this.notifs[modalID].callback(choice);
								break;
							case "prompt":
								this.notifs[modalID].callback(
									modalElem.getElementsByClassName("modalDialogueInput")[0]
										.value
								);
								break;
							default:
								// Something is odd with this notification
								doLog("Modal " + modalID + " has no type.");
						}
						delete this.notifs[modalID];
						requestAnimationFrame(function () {
							apps.prompt.vars.checkNotifs();
						});
					}
				}
			},
			notifClick: function (notifID, choice) {
				if (typeof notifID === "string") {
					this.notifs[notifID].callback(choice);
					delete this.notifs[notifID];
				} else if (typeof notifID === "number") {
					this.notifs["notif_" + notifID].callback(choice);
					delete this.notifs["notif_" + notifID];
				} else if (typeof notifID === "object") {
					if (notifID.getAttribute("data-notif")) {
						this.notifs[notifID.getAttribute("data-notif")].callback(choice);
						delete this.notifs[notifID.getAttribute("data-notif")];
					} else {
						doLog("Strange notification, doesn't identify itself?");
						doLog(notifID);
					}
				}
				this.checkNotifs();
			},
			showModals: function () {
				if (!apps.prompt.appWindow.appIcon) {
					apps.prompt.appWindow.paddingMode(1);
					apps.prompt.appWindow.setDims("auto", "auto", 600, 400);
					apps.prompt.appWindow.setCaption("Modal Dialogue");
					getId("win_prompt_html").style.overflowY = "auto";
				}
				apps.prompt.appWindow.openWindow();
				requestAnimationFrame(function () {
					getId("win_prompt_html").scrollTop = 0;
				});
			},
			hideModals: function () {
				if (apps.prompt.appWindow.appIcon) {
					apps.prompt.signalHandler("close");
				}
			},
			notifsVisible: 0,
			showNotifs: function () {
				if (!this.notifsVisible) {
					getId("notifContainer").style.opacity = "1";
					getId("notifContainer").style.pointerEvents = "";
					getId("notifContainer").style.right = "16px";
					this.notifsVisible = 1;
				}
			},
			hideNotifs: function () {
				if (this.notifsVisible) {
					getId("notifContainer").style.opacity = "0";
					getId("notifContainer").style.pointerEvents = "none";
					getId("notifContainer").style.right = "-350px";
					this.notifsVisible = 0;
				}
			},
			flashNotification: function (nTimes) {
				this.showNotifs();
				if (nTimes) {
					// If number of flashes defined
					getId("notifContainer").style.opacity = "0.2";
					setTimeout(function () {
						getId("notifContainer").style.opacity = "";
					}, 300);
					for (let i = 1; i < nTimes; i++) {
						setTimeout(function () {
							getId("notifContainer").style.opacity = "0.2";
						}, i * 600);
						setTimeout(function () {
							getId("notifContainer").style.opacity = "";
						}, i * 600 + 300);
					}
				} else {
					// Otherwise just 3 flashes
					apps.prompt.vars.flashNotification(3);
				}
			},
			checkPrompts: function () {
				this.checkNotifs();
			},
		},
		signalHander: function (signal) {
			switch (signal) {
				case "forceclose":
					this.appWindow.closeWindow();
					this.appWindow.closeIcon();
					break;
				case "close":
					this.appWindow.closeWindow();
					window.setTimeout(function () {
						apps.prompt.vars.checkPrompts();
					}, 0);
					setTimeout(
						function () {
							if (getId("win_" + this.objName + "_top").style.opacity === "0") {
								this.appWindow.setContent("");
							}
						}.bind(this),
						300
					);
					break;
				case "checkrunning":
					if (this.appWindow.appIcon) {
						return 1;
					} else {
						return 0;
					}
				case "shrink":
					this.appWindow.closeKeepTask();
					break;
				case "USERFILES_DONE":
					this.appWindow.alwaysOnTop(1);
					this.appWindow.paddingMode(1);
					break;
				default:
					doLog(
						"No case found for '" +
							signal +
							"' signal in app '" +
							this.dsktpIcon +
							"'"
					);
			}
		},
	});
	openapp(apps.prompt, "dsktp");
	requestAnimationFrame(function () {
		apps.prompt.signalHandler("close");
	});
}; // End initial variable declaration
