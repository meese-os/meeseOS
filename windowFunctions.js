// Function to allow app windows to be moved
let winmoveSelect = "";
let winmovex = 0;
let winmovey = 0;
let winmoveOrX = 0;
let winmoveOrY = 0;
let winmovecurrapp = "";

function winmove(e) {
	if (e.currentTarget !== getId("winmove")) {
		getId("winmove").style.display = "block";
		winmoveSelect = e.currentTarget.id.substring(
			0,
			e.currentTarget.id.length - 4
		);
		winmovex = e.pageX;
		winmovey = e.pageY;
		for (const app in apps) {
			if (
				apps[app].objName == winmoveSelect.substring(4, winmoveSelect.length)
			) {
				winmovecurrapp = app;
				break;
			}
		}
		winmoveOrX = apps[winmovecurrapp].appWindow.windowX;
		winmoveOrY = apps[winmovecurrapp].appWindow.windowY;
		if (document.activeElement.tagName === "IFRAME") {
			if (document.activeElement.getAttribute("data-parent-app")) {
				if (e.currentTarget.id) {
					if (
						"win_" +
							document.activeElement.getAttribute("data-parent-app") +
							"_cap" !==
						e.currentTarget.id
					) {
						document.activeElement.blur();
					}
				} else {
					if (
						"win_" +
							document.activeElement.getAttribute("data-parent-app") +
							"_cap" !==
						e.currentTarget.parentNode.id
					) {
						document.activeElement.blur();
					}
				}
			}
		}
	} else {
		getId("winmove").style.display = "none";
		if (!mobileMode) {
			apps[winmovecurrapp].appWindow.setDims(
				winmoveOrX + (e.pageX - winmovex) * (1 / screenScale),
				winmoveOrY + (e.pageY - winmovey) * (1 / screenScale),
				apps[winmovecurrapp].appWindow.windowH,
				apps[winmovecurrapp].appWindow.windowV
			);
		}
	}
}
getId("winmove").addEventListener("click", winmove);

function winmoving(e) {
	winmovelastx = e.pageX;
	winmovelasty = e.pageY;
	if (!mobileMode) {
		apps[winmovecurrapp].appWindow.setDims(
			winmoveOrX + (e.pageX - winmovex) * (1 / screenScale),
			winmoveOrY + (e.pageY - winmovey) * (1 / screenScale),
			apps[winmovecurrapp].appWindow.windowH,
			apps[winmovecurrapp].appWindow.windowV
		);
	}
}

const tempwinres = "";
const tempwinresa = "";
let tempwinresmode = [1, 1];
let winresOrX = 0;
let winresOrY = 0;

function winres(e) {
	if (e.currentTarget !== getId("winres")) {
		getId("winres").style.display = "block";
		winmoveSelect = e.currentTarget.id.substring(
			0,
			e.currentTarget.id.length - 5
		);
		winmovex = e.pageX;
		winmovey = e.pageY;
		for (const app in apps) {
			if (
				apps[app].objName == winmoveSelect.substring(4, winmoveSelect.length)
			) {
				winmovecurrapp = app;
				break;
			}
		}

		winmoveOrX = apps[winmovecurrapp].appWindow.windowH;
		winmoveOrY = apps[winmovecurrapp].appWindow.windowV;

		tempwinresmode = [1, 1];
		if (winmovex - apps[winmovecurrapp].appWindow.windowX < winBorder * 5) {
			tempwinresmode[0] = 0;
			winresOrX = apps[winmovecurrapp].appWindow.windowX;
		} else if (
			winmovex -
				apps[winmovecurrapp].appWindow.windowX -
				apps[winmovecurrapp].appWindow.windowH >
			winBorder * -5
		) {
			tempwinresmode[0] = 2;
		}
		if (winmovey - apps[winmovecurrapp].appWindow.windowY < winBorder * 5) {
			tempwinresmode[1] = 0;
			winresOrY = apps[winmovecurrapp].appWindow.windowY;
		} else if (
			winmovey -
				apps[winmovecurrapp].appWindow.windowY -
				apps[winmovecurrapp].appWindow.windowV >
			winBorder * -5
		) {
			tempwinresmode[1] = 2;
		}

		if (document.activeElement.tagName === "IFRAME") {
			if (document.activeElement.getAttribute("data-parent-app")) {
				if (e.currentTarget.id) {
					if (
						"win_" +
							document.activeElement.getAttribute("data-parent-app") +
							"_size" !==
						e.currentTarget.id
					) {
						document.activeElement.blur();
					}
				}
			}
		}
	} else {
		getId("winres").style.display = "none";
		let newWidth = apps[winmovecurrapp].appWindow.windowH;
		let newHeight = apps[winmovecurrapp].appWindow.windowV;
		let newLeft = apps[winmovecurrapp].appWindow.windowX;
		let newTop = apps[winmovecurrapp].appWindow.windowY;
		if (tempwinresmode[0] === 2) {
			newWidth = winmoveOrX + (e.pageX - winmovex) * (1 / screenScale);
		} else if (tempwinresmode[0] === 0) {
			newWidth = winmoveOrX - (e.pageX - winmovex) * (1 / screenScale);
			newLeft = winresOrX + (e.pageX - winmovex) * (1 / screenScale);
		}

		if (tempwinresmode[1] === 2) {
			newHeight = winmoveOrY + (e.pageY - winmovey) * (1 / screenScale);
		} else if (tempwinresmode[1] === 0) {
			newHeight = winmoveOrY - (e.pageY - winmovey) * (1 / screenScale);
			newTop = winresOrY + (e.pageY - winmovey) * (1 / screenScale);
		}

		apps[winmovecurrapp].appWindow.setDims(
			newLeft,
			newTop,
			newWidth,
			newHeight
		);
	}
}
getId("winres").addEventListener("click", winres);

function winresing(e) {
	let newWidth = apps[winmovecurrapp].appWindow.windowH;
	let newHeight = apps[winmovecurrapp].appWindow.windowV;
	let newLeft = apps[winmovecurrapp].appWindow.windowX;
	let newTop = apps[winmovecurrapp].appWindow.windowY;
	if (tempwinresmode[0] === 2) {
		newWidth = winmoveOrX + (e.pageX - winmovex) * (1 / screenScale);
	} else if (tempwinresmode[0] === 0) {
		newWidth = winmoveOrX - (e.pageX - winmovex) * (1 / screenScale);
		newLeft = winresOrX + (e.pageX - winmovex) * (1 / screenScale);
	}
	if (tempwinresmode[1] === 2) {
		newHeight = winmoveOrY + (e.pageY - winmovey) * (1 / screenScale);
	} else if (tempwinresmode[1] === 0) {
		newHeight = winmoveOrY - (e.pageY - winmovey) * (1 / screenScale);
		newTop = winresOrY + (e.pageY - winmovey) * (1 / screenScale);
	}

	apps[winmovecurrapp].appWindow.setDims(newLeft, newTop, newWidth, newHeight);
}

function highlightWindow(app) {
	getId("windowFrameOverlay").style.display = "block";
	// The 32 is to compensate for the absoltely positioned top bar, which isn't factored in by default
	getId("windowFrameOverlay").style.top =
		apps[app].appWindow.windowY + 32 + "px";
	getId("windowFrameOverlay").style.left = apps[app].appWindow.windowX + "px";
	getId("windowFrameOverlay").style.width = apps[app].appWindow.windowH + "px";
	getId("windowFrameOverlay").style.height = apps[app].appWindow.windowV + "px";
}

window.bgNaturalSize = [1920, 1080];
window.bgSize = [1920, 1080];
window.bgPosition = [0, 0];

const bgFit = "cover";
function updateBgSize(noWinblur) {
	bgNaturalSize = [
		getId("bgSizeElement").naturalWidth,
		getId("bgSizeElement").naturalHeight,
	];
	switch (bgFit) {
		case "corner":
			bgSize = [bgNaturalSize[0], bgNaturalSize[1]];
			bgPosition = [0, 0];
			break;
		case "stretch":
			bgSize = [
				parseInt(getId("monitor").style.width),
				parseInt(getId("monitor").style.height),
			];
			bgPosition = [0, 0];
			break;
		case "center":
			var monsize = [
				parseInt(getId("monitor").style.width),
				parseInt(getId("monitor").style.height),
			];
			bgSize = [bgNaturalSize[0], bgNaturalSize[1]];
			bgPosition = [
				monsize[0] / 2 - bgSize[0] / 2,
				monsize[1] / 2 - bgSize[1] / 2,
			];
			break;
		case "fit":
			var monsize = [
				parseInt(getId("monitor").style.width),
				parseInt(getId("monitor").style.height),
			];
			var sizeratio = [
				monsize[0] / bgNaturalSize[0],
				monsize[1] / bgNaturalSize[1],
			];
			if (sizeratio[0] <= sizeratio[1]) {
				bgSize = [
					monsize[0],
					Math.round(bgNaturalSize[1] * (monsize[0] / bgNaturalSize[0])),
				];
				bgPosition = [0, Math.round((monsize[1] - bgSize[1]) / 2)];
			} else {
				bgSize = [
					Math.round(bgNaturalSize[0] * (monsize[1] / bgNaturalSize[1])),
					monsize[1],
				];
				bgPosition = [Math.round((monsize[0] - bgSize[0]) / 2), 0];
			}
			break;
		case "cover":
			var monsize = [
				parseInt(getId("monitor").style.width),
				parseInt(getId("monitor").style.height),
			];
			var sizeratio = [
				monsize[0] / bgNaturalSize[0],
				monsize[1] / bgNaturalSize[1],
			];
			if (sizeratio[0] >= sizeratio[1]) {
				bgSize = [
					monsize[0],
					Math.round(bgNaturalSize[1] * (monsize[0] / bgNaturalSize[0])),
				];
				bgPosition = [0, Math.round((monsize[1] - bgSize[1]) / 2)];
			} else {
				bgSize = [
					Math.round(bgNaturalSize[0] * (monsize[1] / bgNaturalSize[1])),
					monsize[1],
				];
				bgPosition = [Math.round((monsize[0] - bgSize[0]) / 2), 0];
			}
			break;
		default:
			bgSize = [bgNaturalSize[0], bgNaturalSize[1]];
			bgPosition = [0, 0];
	}
	getId("monitor").style.backgroundSize = bgSize[0] + "px " + bgSize[1] + "px";
	getId("monitor").style.backgroundPosition =
		bgPosition[0] + "px " + bgPosition[1] + "px";
	if (!noWinblur) calcWindowblur(null, 1);
}

function calcWindowblur(win, noBgSize) {
	if (!noBgSize) updateBgSize(1);
	const aeroOffset = [0, -32];
	if (screenScale === 1 || screenScale < 0.25) {
		getId("monitor").style.transform = "";
		var numberOfScreenScale = 1;
	} else {
		getId("monitor").style.transform = "scale(" + screenScale + ")";
		var numberOfScreenScale = screenScale;
	}
	if (win === "taskbar") {
		getId("tskbrAero").style.backgroundSize =
			bgSize[0] + "px " + bgSize[1] + "px";
		getId("tskbrAero").style.backgroundPosition =
			20 + bgPosition[0] + "px " + (20 + bgPosition[1]) + "px";
	} else if (win) {
		getId("win_" + win + "_aero").style.backgroundPosition =
			-1 * apps[win].appWindow.windowX +
			40 +
			aeroOffset[0] +
			bgPosition[0] +
			"px " +
			(-1 * (apps[win].appWindow.windowY * (apps[win].appWindow.windowY > -1)) +
				40 +
				aeroOffset[1] +
				bgPosition[1]) +
			"px";
	} else {
		for (const i in apps) {
			getId("win_" + i + "_aero").style.backgroundSize =
				bgSize[0] + "px " + bgSize[1] + "px";
			getId("win_" + i + "_aero").style.backgroundPosition =
				-1 * apps[i].appWindow.windowX +
				40 +
				aeroOffset[0] +
				bgPosition[0] +
				"px " +
				(-1 * (apps[i].appWindow.windowY * (apps[i].appWindow.windowY > -1)) +
					40 +
					aeroOffset[1] +
					bgPosition[1]) +
				"px";
		}
		getId("tskbrAero").style.backgroundSize =
			bgSize[0] + "px " + bgSize[1] + "px";
		getId("tskbrAero").style.backgroundPosition =
			20 + bgPosition[0] + "px " + (20 + bgPosition[1]) + "px";
	}
}

function fitWindowIfPermitted() {
	fitWindow();
}

function fitWindow() {
	perfStart("fitWindow");
	if (screenScale === 1 || screenScale < 0.25) {
		getId("monitor").style.transform = "";
		var numberOfScreenScale = 1;
	} else {
		getId("monitor").style.transform = "scale(" + screenScale + ")";
		var numberOfScreenScale = screenScale;
	}
	getId("monitor").style.width =
		window.innerWidth * (1 / numberOfScreenScale) + "px";
	getId("monitor").style.height =
		window.innerHeight * (1 / numberOfScreenScale) + "px";
	getId("desktop").style.width =
		window.innerWidth * (1 / numberOfScreenScale) + "px";
	getId("desktop").style.height =
		window.innerHeight * (1 / numberOfScreenScale) - 32 + "px";
	getId("taskbar").style.width =
		window.innerWidth * (1 / numberOfScreenScale) + "px";
	getId("tskbrAero").style.backgroundPosition =
		"20px " +
		(-1 * (window.innerHeight * (1 / numberOfScreenScale)) + 52) +
		"px";
	getId("tskbrAero").style.width =
		window.innerWidth * (1 / numberOfScreenScale) + 40 + "px";
	getId("tskbrAero").style.height = "";
	getId("tskbrAero").style.transform = "";
	getId("tskbrAero").style.transformOrigin = "";

	getId("desktop").style.left = "";
	getId("desktop").style.top = "32px";
	getId("desktop").style.width = getId("monitor").style.width;
	getId("desktop").style.height =
		parseInt(getId("monitor").style.height, 10) - 32 + "px";
	getId("taskbar").style.top = "0";
	getId("taskbar").style.left = "";
	getId("taskbar").style.right = "";
	getId("taskbar").style.bottom = "auto";
	getId("taskbar").style.transform = "";
	getId("taskbar").style.width = getId("monitor").style.width;
	getId("tskbrAero").style.backgroundPosition = "20px 20px";

	checkMobileSize();
	arrangeDesktopIcons();
	try {
		updateBgSize();
	} catch (err) {}
}

function fitWindowRes(newmonX, newmonY) {
	perfStart("fitWindow");
	if (screenScale === 1 || screenScale < 0.25) {
		getId("monitor").style.transform = "";
		var numberOfScreenScale = 1;
	} else {
		getId("monitor").style.transform = "scale(" + screenScale + ")";
		var numberOfScreenScale = screenScale;
	}
	getId("monitor").style.width = newmonX * (1 / numberOfScreenScale) + "px";
	getId("monitor").style.height = newmonY * (1 / numberOfScreenScale) + "px";
	getId("desktop").style.width = newmonX * (1 / numberOfScreenScale) + "px";
	getId("desktop").style.height =
		newmonY * (1 / numberOfScreenScale) - 32 + "px";
	getId("taskbar").style.width = newmonX * (1 / numberOfScreenScale) + "px";
	getId("tskbrAero").style.backgroundPosition =
		"20px " + (-1 * (newmonY * (1 / numberOfScreenScale)) + 52) + "px";
	getId("tskbrAero").style.width =
		newmonX * (1 / numberOfScreenScale) + 40 + "px";
	getId("tskbrAero").style.height = "";
	getId("tskbrAero").style.transform = "";
	getId("tskbrAero").style.transformOrigin = "";

	getId("desktop").style.left = "";
	getId("desktop").style.top = "32px";
	getId("desktop").style.width = getId("monitor").style.width;
	getId("desktop").style.height =
		parseInt(getId("monitor").style.height, 10) - 32 + "px";
	getId("taskbar").style.top = "0";
	getId("taskbar").style.left = "";
	getId("taskbar").style.right = "";
	getId("taskbar").style.bottom = "auto";
	getId("taskbar").style.transform = "";
	getId("taskbar").style.width = getId("monitor").style.width;

	checkMobileSize();
	arrangeDesktopIcons();
	try {
		updateBgSize();
	} catch (err) {}
}
