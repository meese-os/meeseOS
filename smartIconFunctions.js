// Smart Icon Builder
const smartIconOptions = {
	radiusTopLeft: 100,
	radiusTopRight: 100,
	radiusBottomLeft: 100,
	radiusBottomRight: 100,
	backgroundOpacity: 1,
	bgColor: "",
};

function updateSmartIconStyle() {
	getId("smartIconStyle").innerHTML =
		".smarticon_bg{border-top-left-radius:" +
		smartIconOptions.radiusTopLeft +
		"%;border-top-right-radius:" +
		smartIconOptions.radiusTopRight +
		"%;border-bottom-left-radius:" +
		smartIconOptions.radiusBottomLeft +
		"%;border-bottom-right-radius:" +
		smartIconOptions.radiusBottomRight +
		"%;display:" +
		(function () {
			if (smartIconOptions.backgroundOpacity) {
				return "block";
			} else {
				return "none";
			}
		})() +
		";" +
		(function () {
			if (smartIconOptions.bgColor) {
				return (
					"background-color:" +
					smartIconOptions.bgColor.split(";")[0] +
					" !important;"
				);
			} else {
				return "";
			}
		})() +
		"}.smarticon_nobg{display:" +
		(function () {
			if (smartIconOptions.backgroundOpacity) {
				return "none";
			} else {
				return "block";
			}
		})() +
		";}";
	const allSmartIconsBG = document.getElementsByClassName("smarticon_bg");
	for (var i = 0; i < allSmartIconsBG.length; i++) {
		var currSize = parseFloat(
			allSmartIconsBG[i].getAttribute("data-smarticon-size")
		);
		allSmartIconsBG[i].style.borderTopLeftRadius =
			Math.round((currSize / 2) * (smartIconOptions.radiusTopLeft / 100)) +
			"px";
		allSmartIconsBG[i].style.borderTopRightRadius =
			Math.round((currSize / 2) * (smartIconOptions.radiusTopRight / 100)) +
			"px";
		allSmartIconsBG[i].style.borderBottomLeftRadius =
			Math.round((currSize / 2) * (smartIconOptions.radiusBottomLeft / 100)) +
			"px";
		allSmartIconsBG[i].style.borderBottomRightRadius =
			Math.round((currSize / 2) * (smartIconOptions.radiusBottomRight / 100)) +
			"px";
	}
	const allSmartIconsBorder =
		document.getElementsByClassName("smarticon_border");
	for (var i = 0; i < allSmartIconsBorder.length; i++) {
		var currSize = parseFloat(
			allSmartIconsBorder[i].getAttribute("data-smarticon-size")
		);
		allSmartIconsBorder[i].style.borderTopLeftRadius =
			Math.round((currSize / 2) * (smartIconOptions.radiusTopLeft / 100)) +
			"px";
		allSmartIconsBorder[i].style.borderTopRightRadius =
			Math.round((currSize / 2) * (smartIconOptions.radiusTopRight / 100)) +
			"px";
		allSmartIconsBorder[i].style.borderBottomLeftRadius =
			Math.round((currSize / 2) * (smartIconOptions.radiusBottomLeft / 100)) +
			"px";
		allSmartIconsBorder[i].style.borderBottomRightRadius =
			Math.round((currSize / 2) * (smartIconOptions.radiusBottomRight / 100)) +
			"px";
	}
}

function saveSmartIconStyle() {
	ufsave("system/smarticon_settings", JSON.stringify(smartIconOptions));
}
function buildSmartIcon(size, options, optionalcss) {
	if (typeof options === "string") {
		options = {
			foreground: options,
		};
	}
	if (!options) {
		options = {};
	}
	let icoTemp =
		'<div class="smarticon" style="width:' + size + "px;height:" + size + "px;";
	if (optionalcss) {
		icoTemp += optionalcss;
	}
	icoTemp += '">';
	if (options.foreground) {
		icoTemp +=
			'<div class="smarticon_nobg" style="background:url(' +
			cleanStr(options.foreground.split(";")[0]) +
			');"></div>';
	}
	icoTemp +=
		'<div class="smarticon_bg" data-smarticon-size="' +
		size +
		'" style="' +
		"border-top-left-radius:" +
		Math.round((size / 2) * (smartIconOptions.radiusTopLeft / 100)) +
		"px;" +
		"border-top-right-radius:" +
		Math.round((size / 2) * (smartIconOptions.radiusTopRight / 100)) +
		"px;" +
		"border-bottom-left-radius:" +
		Math.round((size / 2) * (smartIconOptions.radiusBottomLeft / 100)) +
		"px;" +
		"border-bottom-right-radius:" +
		Math.round((size / 2) * (smartIconOptions.radiusBottomRight / 100)) +
		"px;";
	if (options.background) {
		icoTemp +=
			"background:url(" + cleanStr(options.background.split(";")[0]) + ");";
	}
	if (options.backgroundColor) {
		icoTemp +=
			"background-color:" +
			cleanStr(options.backgroundColor.split(";")[0]) +
			";";
	}
	icoTemp += '">';
	if (options.foreground) {
		icoTemp +=
			'<div class="smarticon_fg" style="background:url(' +
			cleanStr(options.foreground.split(";")[0]) +
			');"></div>';
	}
	if (options.backgroundBorder) {
		icoTemp +=
			'<div class="smarticon_border" data-smarticon-size="' +
			size +
			'" style="box-shadow:inset 0 0 0 ' +
			(size / 32) * (options.backgroundBorder.thickness || 1) +
			"px " +
			cleanStr(options.backgroundBorder.color.split(";")[0]) +
			";" +
			"border-top-left-radius:" +
			Math.round((size / 2) * (smartIconOptions.radiusTopLeft / 100)) +
			"px;" +
			"border-top-right-radius:" +
			Math.round((size / 2) * (smartIconOptions.radiusTopRight / 100)) +
			"px;" +
			"border-bottom-left-radius:" +
			Math.round((size / 2) * (smartIconOptions.radiusBottomLeft / 100)) +
			"px;" +
			"border-bottom-right-radius:" +
			Math.round((size / 2) * (smartIconOptions.radiusBottomRight / 100)) +
			'px;"></div>';
	}
	icoTemp += "</div></div>";
	return icoTemp;
}

function buildMarquee(text, style) {
	return (
		'<div class="marquee" style="' +
		(style || "") +
		'"><div class="marqueetext1">' +
		text +
		'</div><div class="marqueetext2">' +
		text +
		"</div></div>"
	);
}
