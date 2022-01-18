const SaveMaster = () => {
	apps.savemaster = new Application({
		title: "SaveMaster",
		abbreviation: "SAV",
		codeName: "savemaster",
		image: "appicons/SAV.png",
		hideApp: 2,
		main: function () {
			this.appWindow.setCaption("SaveMaster");
			if (!this.appWindow.appIcon) {
				this.appWindow.setDims("auto", "auto", 600, 500);
			}
			this.appWindow.openWindow();
		},
		vars: {
			appInfo:
				"This application handles all file saving over the Cloud to the server. It is only accessible via API to internal applications.",
			sp: "",
			sc: "",
			saving: 0,
			xf: {},
			savePerf: 0,
			save: function (filepath, filecontent, newformat, errorreport, pass) {
				m("Saving File");
				d(1, "Saving File " + filepath);
				if (filepath.indexOf("..") > -1) {
					apps.prompt.vars.alert(
						'Error saving file:<br><br>Not allowed to use ".." keyword.',
						"Okay",
						function () {},
						"SaveMaster"
					);
					return false;
				}

				this.savePerf = Math.floor(performance.now());
				if (errorreport === "SET_PASSWORD") {
					eval(
						apps.bash.vars.translateDir("/USERFILES/" + filepath) + '="*****"'
					);
				} else {
					sh(
						"mkdir /USERFILES/" +
							filepath.substring(0, filepath.lastIndexOf("/"))
					);
					apps.savemaster.vars.temporarySaveContent = "" + filecontent;
					eval(
						apps.bash.vars.translateDir("/USERFILES/" + filepath) +
							"=apps.savemaster.vars.temporarySaveContent"
					);
					delete apps.savemaster.vars.temporarySaveContent;
				}
				m(modulelast);
			},
			mkdir: function (filepath) {
				if (filepath.indexOf("..") > -1) {
					apps.prompt.vars.alert(
						'Error saving directory:<br><br>Not allowed to use ".." keyword.',
						"Okay",
						function () {},
						"SaveMaster"
					);
					return false;
				}
				sh("mkdir /USERFILES/" + filepath);
			},
			latestDel: "",
			del: function (filepath) {
				this.savePerf = Math.floor(performance.now());
				eval("delete " + apps.bash.vars.translateDir("/USERFILES/" + filepath));
			},
		},
	});

	window.ufsave = function (filename, filecontent) {
		return apps.savemaster.vars.save(filename, filecontent, 1);
	};
	window.ufdel = function (filename) {
		return apps.savemaster.vars.del(filename);
	};
	window.ufload = function (filename, debug) {
		try {
			if (debug) {
				doLog("ufload " + filename + ":", "#ABCDEF");
				doLog(apps.bash.vars.getRealDir("/USERFILES/" + filename), "#ABCDEF");
			}
			return apps.bash.vars.getRealDir("/USERFILES/" + filename);
		} catch (err) {
			if (debug) {
				doLog(err, "#FFCDEF");
			}
			return null;
		}
	};
}; // End initial variable declaration
