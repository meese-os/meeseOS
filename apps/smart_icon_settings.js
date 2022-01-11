const SmartIconSettings = () => {

apps.smartIconSettings = new Application({
	title: "Smart Icon Settings",
	abbreviation: "SIS",
	codeName: "smartIconSettings",
	image: "smarticons/aOS/fg.png",
	hideApp: 2,
	launchTypes: 1,
	main: function (launchtype) {
		this.appWindow.setCaption("Smart Icon Settings");
		this.appWindow.setDims("auto", "auto", 800, 600);
		this.appWindow.setContent(
			'<div style="position:relative;width:100%;height:256px;padding-top:10px;padding-bottom:10px;background:#000;box-shadow:0 0 5px #000;text-align:center;">' +
			buildSmartIcon(256, this.vars.aOSicon) + '&nbsp;' + buildSmartIcon(128, this.vars.aOSicon) + '&nbsp;' + buildSmartIcon(64, this.vars.aOSicon) + '&nbsp;' + buildSmartIcon(32, this.vars.aOSicon) +
			'</div>' +
			'<br><br>&nbsp;Border Radius:<br>' +
			'&nbsp;<input id="smartIconSettings_tl" value="' + smartIconOptions.radiusTopLeft + '" size="3" placeholder="100"> ' + '<div style="width:64px;position:relative;display:inline-block"></div> ' +
			'<input id="smartIconSettings_tr" value="' + smartIconOptions.radiusTopRight + '" size="3" placeholder="100">' + '<br>' +
			'&nbsp;<input id="smartIconSettings_bl" value="' + smartIconOptions.radiusBottomLeft + '" size="3" placeholder="100"> ' + buildSmartIcon(64, this.vars.aOSicon, 'margin-top:-1em') + ' ' +
			'<input id="smartIconSettings_br" value="' + smartIconOptions.radiusBottomRight + '" size="3" placeholder="100">' + '<br><br>' +
			'&nbsp;<button onclick="apps.smartIconSettings.vars.saveRadiuses()">Save</button> ' +
			'<button onclick="apps.smartIconSettings.vars.toggleBG()">Toggle Background</button><br><br>' +
			'<input id="smartIconSettings_bgcolor" value="' + smartIconOptions.bgColor + '" placeholder="color"> <button onclick="apps.smartIconSettings.vars.setColor()">Override Background Color</button><br><br>' +
			'Test an image: <input type="file" accept="image/*" onchange="apps.smartIconSettings.vars.changeImage(this)">'
		);
		this.appWindow.paddingMode(0);
		this.appWindow.openWindow();
	},
	vars: {
		appInfo: 'This app is used to configure Smart Icons.',
		testSmartIcon: {
			backgroundColor: "#303947",
			foreground: "smarticons/aOS/fg.png",
			backgroundBorder: {
				thickness: 2,
				color: "#252F3A"
			}
		},
		aOSicon: {
			backgroundColor: "#303947",
			foreground: "smarticons/aOS/fg.png",
			backgroundBorder: {
				thickness: 2,
				color: "#252F3A"
			}
		},
		changeImage: function (elem) {
			if (elem.files.length > 0) {
				let tempImageSrc = URL.createObjectURL(elem.files[0]);
				let smartIconsInWindow = getId("win_smartIconSettings_html").querySelectorAll(".smarticon_fg,.smarticon_nobg");
				for (let i = 0; i < smartIconsInWindow.length; i++) {
					smartIconsInWindow[i].style.background = `url(${tempImageSrc})`;
				}
			}
		},
		saveRadiuses: function (radiuses, nosave) {
			if (radiuses) {
				let tempR = radiuses;
				smartIconOptions.radiusTopLeft = tempR[0];
				smartIconOptions.radiusTopRight = tempR[1];
				smartIconOptions.radiusBottomLeft = tempR[2];
				smartIconOptions.radiusBottomRight = tempR[3];
				updateSmartIconStyle();
			} else {
				let tempR = [
					getId("smartIconSettings_tl").value, getId("smartIconSettings_tr").value,
					getId("smartIconSettings_bl").value, getId("smartIconSettings_br").value
				];
				smartIconOptions.radiusTopLeft = tempR[0];
				smartIconOptions.radiusTopRight = tempR[1];
				smartIconOptions.radiusBottomLeft = tempR[2];
				smartIconOptions.radiusBottomRight = tempR[3];
				updateSmartIconStyle();
			}

			if (!nosave) saveSmartIconStyle();
		},
		toggleBG: function (nosave) {
			smartIconOptions.backgroundOpacity = Math.abs(smartIconOptions.backgroundOpacity - 1);
			updateSmartIconStyle();
			if (!nosave) saveSmartIconStyle();
		},
		setColor: function (color, nosave) {
			if (color) {
				smartIconOptions.bgColor = color;
				updateSmartIconStyle();
			} else {
				smartIconOptions.bgColor = getId("smartIconSettings_bgcolor").value;
				updateSmartIconStyle();
			}

			if (!nosave) saveSmartIconStyle();
		}
	},
	signalHandler: function (signal) {
		switch (signal) {
			case "forceclose":
				this.appWindow.closeWindow();
				this.appWindow.closeIcon();
				break;
			case "close":
				this.appWindow.closeWindow();
				setTimeout(function() {
					if (getId("win_" + this.objName + "_top").style.opacity === "0") {
						this.appWindow.setContent("");
					}
				}.bind(this), 300);
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
					if (ufload("system/smarticon_settings")) {
						smartIconOptions = JSON.parse(ufload("system/smarticon_settings"));
						updateSmartIconStyle();
					}
					break;
				default:
					doLog("No case found for '" + signal + "' signal in app '" + this.dsktpIcon + "'");
		}
	}
});

} // End initial variable declaration