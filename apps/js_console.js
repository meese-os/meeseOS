const JSConsole = () => {
	apps.jsConsole = new Application({
		title: "JavaScript Console",
		abbreviation: "jsC",
		codeName: "jsConsole",
		image: "smarticons/jsConsole/fg.png",
		hideApp: 2,
		launchTypes: 1,
		main: function (launchType) {
			if (!this.appWindow.appIcon) {
				this.appWindow.paddingMode(1);
				this.appWindow.setDims("auto", "auto", 1000, 500);
				this.appWindow.openWindow();
				this.appWindow.setCaption("JavaScript Console");
				this.appWindow.setContent(
					'<div id="cnsTrgt" style="width:100%; height:auto; position:relative; font-family:W95FA,Courier,monospace; font-size:12px;"></div>' +
						'<input id="cnsIn" autocomplete="off" spellcheck="false" onKeydown="if(event.keyCode === 13){apps.jsConsole.vars.runInput()}" placeholder="Input" style="position:relative; font-family:W95FA,Courier,monospace;display:block; padding:0; font-size:12px; width:calc(100% - 8px); padding-left:3px; margin-top:3px; height:16px;">'
				);

				let tempLogs =
					'<span style="color:' +
					this.vars.cnsPosts[0][1] +
					';">' +
					this.vars.cnsPosts[0][0] +
					"</span>";
				for (let j = 1; j < this.vars.cnsPosts.length; j += 1) {
					tempLogs +=
						'<br><span style="color:' +
						this.vars.cnsPosts[j][1] +
						';">' +
						this.vars.cnsPosts[j][0] +
						"</span>";
				}
				getId("cnsTrgt").innerHTML = tempLogs;
				getId("win_jsConsole_html").style.overflow = "auto";
				getId("win_jsConsole_html").scrollTop =
					getId("win_jsConsole_html").scrollHeight;
				requestAnimationFrame(function () {
					getId("win_jsConsole_html").scrollTop =
						getId("win_jsConsole_html").scrollHeight;
				});
			} else {
				this.appWindow.openWindow();
			}
		},
		vars: {
			appInfo:
				"This is a JavaScript console for quick debugging without having to open DevTools. It also has extra features like colored text and HTML formatting support.",
			cnsPosts: [
				["", "#7F7F7F"],
				["Took " + timeToPageLoad + "ms to fetch primary script.", ""],
			],
			lastInputUsed: "jsConsoleHasNotBeenUsed",
			makeLog: function (logStr, logClr) {
				this.cnsPosts.push([logStr, logClr]);
				if (getId("cnsTrgt")) {
					getId("cnsTrgt").innerHTML +=
						'<br><span style="color:' + logClr + ';">' + logStr + "</span>";
					getId("win_jsConsole_html").scrollTop =
						getId("win_jsConsole_html").scrollHeight;
				}
			},
			runInput: function () {
				m("Running jsC Input");
				d(1, "Running jsC input");
				this.lastInputUsed = getId("cnsIn").value;
				doLog("-> " + cleanStr(getId("cnsIn").value), "#070");
				try {
					this.tempOutput = eval(getId("cnsIn").value);
					doLog("=> " + this.tempOutput, "#077");
					doLog("?> " + typeof this.tempOutput, "#077");
				} catch (err) {
					doLog("=> " + err, "#F00");
					doLog("?> Module: " + module, "#F00");
				}
				getId("cnsIn").value = "";
			},
		},
	});
	apps.jsConsole.main();
	requestAnimationFrame(function () {
		apps.jsConsole.signalHandler("close");
	});
	doLog = function (msg, clr) {
		console.log("%c" + msg, "color:" + clr);
		apps.jsConsole.vars.makeLog(msg, clr);
	};
	debugArray = function (arrayPath, recursive, layer) {
		let debugArraySize = 0;
		for (const i in eval(arrayPath)) {
			doLog(
				"<br>[" +
					(layer || 0) +
					"]" +
					arrayPath +
					"." +
					i +
					": " +
					sanitize(eval(arrayPath)[i]),
				"#55F"
			);
			if (typeof eval(arrayPath)[i] === "object" && recursive) {
				debugArray(eval(arrayPath)[i], 0, (layer || 0) + 1);
			}
			debugArraySize++;
		}
		return "Length: " + debugArraySize;
	};
	sanitize = function (text) {
		return String(text).split("<").join("&lt;").split(">").join("&gt;");
	};
}; // End initial variable declaration
