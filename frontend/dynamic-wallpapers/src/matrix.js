/**
 * A mapping of the variable names to their relevant information
 */
const MatrixOptions = {
	rainColor: {
		label: "Rain Color",
		type: "color",
		defaultValue: "rgb(0, 255, 0)",
	},
	backgroundColor: {
		label: "Background Color",
		type: "color",
		defaultValue: "#000000",
	},
	rainbowMode: {
		label: "Rainbow Mode",
		type: "boolean",
		defaultValue: false,
	},
	speed: {
		label: "Speed",
		type: "number",
		defaultValue: 40,
	},
};

/**
 * Creates a Matrix falling rain effect with Russian characters
 * @param {HTMLCanvasElement} canvas
 * @param {Object} options
 * @link https://github.com/ajmeese7/matrix-wallpaper
 */
const MatrixEffect = (canvas, options) => {
	const defaults = Object.keys(MatrixOptions)
		.map((key) => ({
			[key]: MatrixOptions[key].defaultValue
		}));

	// Override the defaults with any user-provided options
	const settings = Object.assign({}, ...defaults, options);

	// Set the canvas width and height to the screen width and height
	const ctx = canvas.getContext("2d");
	canvas.width = screen.width;
	canvas.height = screen.height;
	// TODO: Make this responsive

	// Unicode Russian characters
	const russianCharacters =
		"\u0402\u0403\u040A\u040B\u0411\u0414\u0416\u0419\u041B\u0423\u0424\u0426" +
		"\u0429\u042A\u042E\u042F\u0434\u0436\u0444\u0452\u0457\u045C\u0461\u0463" +
		"\u0464\u0466\u0468\u046A\u046E\u0471\u0472\u047A\u0481\u0482\u0483\u0494" +
		"\u0498\u049C\u04A0\u04A8\u04B0\u04B4\u04FC\u04FD\u04FE\u04C7\u04C3\u04C1"
		.split("");

	const fontSizeValue = window
		.getComputedStyle(canvas, null)
		.getPropertyValue("font-size");
	const fontSize = parseFloat(fontSizeValue);
	canvas.style.fontSize = fontSize + 1 + "px";

	// Populate the drops array with 1's
	const num_columns = Math.round(canvas.width / fontSize);
	const drops = new Array(num_columns).fill(1);

	// Useful helper functions for the rain effect
	const getRandomComponent = () => Math.floor(Math.random() * 256);
	const getRainbowColor = () =>
		`rgb(${getRandomComponent()}, ${getRandomComponent()}, ${getRandomComponent()})`;
	const getRussianCharacter = () =>
		russianCharacters[Math.floor(Math.random() * russianCharacters.length)];

	function draw() {
		// Makes the previous letters dim
		ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Prepare to draw the raindrops
		const color = settings.rainbowMode ? getRainbowColor() : settings.rainColor;
		ctx.fillStyle = color;
		ctx.font = fontSize + "px arial";

		// Draw the raindrops
		for (let xCoord = 0; xCoord < drops.length; xCoord++) {
			ctx.fillStyle = settings.backgroundColor;
			ctx.fillRect(
				xCoord * fontSize,
				drops[xCoord] * fontSize,
				fontSize,
				fontSize
			);
			ctx.fillStyle = color;

			const character = getRussianCharacter();
			ctx.fillText(character, xCoord * fontSize, drops[xCoord] * fontSize);

			// If the drop has gone below the canvas, reset it
			if (drops[xCoord] * fontSize > canvas.height && Math.random() > 0.975) {
				drops[xCoord] = 0;
			}

			drops[xCoord]++;
		}

		// Call the draw function again
		if (fastSpeedOver) setTimeout(draw, settings.speed);
	}

	// Makes it start off fast (to cover the whole screen) then slow down
	let fastSpeedOver = false;
	const fastSpeed = 10;
	const interval = setInterval(draw, fastSpeed);
	const timeForWholeScreen = (fastSpeed * screen.height) / fontSize;

	setTimeout(function () {
		clearInterval(interval);
		fastSpeedOver = true;
		draw();
	}, timeForWholeScreen);
};

export default {
	effect: MatrixEffect,
	options: MatrixOptions,
}
