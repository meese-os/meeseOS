/** Configure whether to have a contiguous vis line or use definitive stops. */
const useGradient = true;

const barbie = "#fe00c0";
const cotton_candy = "#fa87f4";
const barney = "#9701ff";
const bsod = "#4900ff";
const blue_razz = "#01b9ff";
const carribbean = "#01fff8";
const VaporwaveColors = [
	cotton_candy,
	barbie,
	barney,
	bsod,
	blue_razz,
	carribbean,
];

// Generate a gradient from the stops in VaporwaveColors
const maxIntermediaryColors = Math.floor(255 / VaporwaveColors.length);
const gradient = [];
const gradientColors = [...VaporwaveColors];
for (let i = 0; i < gradientColors.length; i++) {
	for (let j = 0; j < maxIntermediaryColors; j++) {
		gradient.push(
			getColour(
				gradientColors[i],
				gradientColors[i + 1],
				0,
				maxIntermediaryColors,
				j
			)
		);
	}
	gradientColors.shift();
	i--;
}

// Pad the array to 255 in length if it's not already
while (gradient.length < 255) gradient.push(gradient[gradient.length - 1]);

const varToUse = useGradient ? gradient : VaporwaveColors;
export const getColor = (amount, position) => {
	if (typeof position === "number") {
		const numOfCols = varToUse.length;
		let selCol = Math.floor((position / 255) * numOfCols);
		if (selCol < 0) selCol = 0;
		if (selCol > numOfCols - 1) selCol = numOfCols;
		return varToUse[selCol];
	} else {
		const numOfCols = varToUse.length;
		let selCol = Math.floor((amount / 255) * numOfCols);
		if (selCol < 0) selCol = 0;
		if (selCol > numOfCols - 1) selCol = numOfCols;
		return varToUse[selCol];
	}
};

// https://stackoverflow.com/a/46543292/6456163
function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
		  }
		: null;
}

function map(value, fromSource, toSource, fromTarget, toTarget) {
	return (
		((value - fromSource) / (toSource - fromSource)) * (toTarget - fromTarget) +
		fromTarget
	);
}

function getColour(startColour, endColour, min, max, value) {
	if (!endColour) endColour = startColour;
	const startRGB = hexToRgb(startColour);
	const endRGB = hexToRgb(endColour);
	const percentFade = map(value, min, max, 0, 1);

	let diffRed = endRGB.r - startRGB.r;
	let diffGreen = endRGB.g - startRGB.g;
	let diffBlue = endRGB.b - startRGB.b;

	diffRed = diffRed * percentFade + startRGB.r;
	diffGreen = diffGreen * percentFade + startRGB.g;
	diffBlue = diffBlue * percentFade + startRGB.b;

	const result =
		"rgb(" +
		Math.round(diffRed) +
		", " +
		Math.round(diffGreen) +
		", " +
		Math.round(diffBlue) +
		")";
	return result;
}
