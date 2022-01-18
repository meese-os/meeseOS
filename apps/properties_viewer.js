const PropertiesViewer = () => {
	apps.properties = new Application({
		title: "Properties Viewer",
		abbreviation: "PPT",
		codeName: "properties",
		image: "appicons/PPT.png",
		hideApp: 2,
		launchTypes: 1,
		main: function (launchtype, fileToOpen) {
			getId("win_properties_html").style.overflow = "auto";
			if (!this.appWindow.appIcon) {
				this.appWindow.setDims("auto", "auto", 400, 500, 1);
			}
			this.appWindow.setCaption("Properties Viewer");
			if (launchtype !== "openFile" && launchtype !== "tskbr") {
				this.appWindow.setContent(
					'This app is intended for use with the Files app. Please right-click a file in that app, and select "Properties".'
				);
			} else if (launchtype !== "tskbr") {
				const filePath = fileToOpen.split("/");
				if (filePath[filePath.length - 1] === "") {
					filePath.pop();
				}
				if (filePath[0] === "") {
					filePath.shift();
				}

				const fileName = filePath[filePath.length - 1];
				this.appWindow.setCaption(fileName + " Properties");

				let fileDescription = "";
				if (filePath[0] === "USERFILES") {
				} else if (filePath[0] === "apps" && filePath.length > 1) {
					fileDescription =
						"This item belongs to the app " + apps[filePath[1]].appName + ".";
				}

				this.appWindow.setContent(
					'<div style="font-family:W95FA, monospace;font-size:12px; width:calc(100% - 3px); overflow:visible">' +
						'<span style="font-size:36px;">' +
						fileName +
						"</span><br>" +
						'<span style="font-size:24px;">' +
						apps.files.vars.filetype(
							typeof apps.bash.vars.getRealDir(fileToOpen)
						) +
						" / " +
						typeof apps.bash.vars.getRealDir(fileToOpen) +
						"</span><br><br><br>" +
						fileDescription +
						"<br><br>" +
						"File Location: " +
						fileToOpen +
						"<br><br>&nbsp;- " +
						filePath.join("<br>&nbsp;- ") +
						"<br><br>" +
						"</div>"
				);
			}
			this.appWindow.openWindow();
		},
		vars: {
			appInfo: "This app is used to view file properties in the File Manager.",
		},
	});
}; // End initial variable declaration
