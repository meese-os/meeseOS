// Customized from https://github.com/ajmeese7/lettercrap
(function () {
	const charWidth = 6;
	const charHeight = 10;
	const updateInterval = 150;
	const likelihoodOfReplacingWord = 0.05;
	const likelihoodOfChangingExistingText = 0.1;
	const randomChoice = (x) => x[Math.floor(Math.random() * x.length)];

	function createImageURL(text) {
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		const fontsize = measureTextBinaryMethod(
			text,
			"monospace",
			0,
			10,
			canvas.width
		);
		canvas.height = fontsize + 1;
		canvas.width = context.measureText(text).width + 2;
		context.fillText(text, 1, fontsize);
		return canvas.toDataURL();

		// https://jsfiddle.net/be6ppdre/29/
		function measureTextBinaryMethod(text, fontface, min, max, desiredWidth) {
			if (max - min < 1) return min;
			const test = min + (max - min) / 2; // Find half interval
			context.font = `${test}px ${fontface}`;
			const measureTest = context.measureText(text).width;

			const condition = measureTest > desiredWidth;
			return measureTextBinaryMethod(
				text,
				fontface,
				condition ? min : test,
				condition ? test : max,
				desiredWidth
			);
		}
	}

	function initElement(element) {
		const img = new Image();
		img.onload = () => render(element, img, null);
		img.src = element.getAttribute("data-letter-crap");
		img.crossOrigin = "anonymous";
	}

	function getTextContentWithImageAtSize(
		image,
		width,
		height,
		existingText,
		words,
		letters
	) {
		existingText = existingText ? existingText.replace(/\r?\n|\r/g, "") : null;
		const shouldReplaceExisting = () =>
			!existingText || Math.random() < likelihoodOfChangingExistingText;

		const canvas = document.createElement("canvas");
		canvas.width = parseInt(width / charWidth);
		canvas.height = parseInt(height / charHeight);
		canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
		if (canvas.getContext("2d").canvas.width === 0) return;
		const data = canvas
			.getContext("2d")
			.getImageData(0, 0, canvas.width, canvas.height);
		let chars = "";
		let startOfFilledInSequence = 0;
		let i = 0;

		for (let y = 0; y < data.height; y++) {
			for (let x = 0; x < data.width; x++) {
				const black = data.data[i * 4] < 120;
				const transparent = data.data[i * 4 + 3] < 50;
				if (black && !transparent) {
					if (startOfFilledInSequence === null) startOfFilledInSequence = i;
					chars += shouldReplaceExisting()
						? randomChoice(letters)
						: existingText[i];

					if (
						words.length > 0 &&
						Math.random() < likelihoodOfReplacingWord &&
						shouldReplaceExisting()
					) {
						const word = randomChoice(words);
						if (i + 1 - startOfFilledInSequence >= word.length) {
							chars = chars.substring(0, chars.length - word.length) + word;
						}
					}
				} else {
					chars += " ";
					startOfFilledInSequence = null;
				}
				i++;
			}
			chars += "\n";
			startOfFilledInSequence = null;
		}
		return chars;
	}

	function render(element, image, prev) {
		if (element.hasAttribute("data-lettercrap-aspect-ratio")) {
			const aspect = parseFloat(
				element.getAttribute("data-lettercrap-aspect-ratio")
			);
			element.style.height = element.clientWidth * aspect + "px";
		}

		const words = element.hasAttribute("data-lettercrap-words")
			? element.getAttribute("data-lettercrap-words").split(" ")
			: [];
		const letters = element.hasAttribute("data-lettercrap-letters")
			? element.getAttribute("data-lettercrap-letters")
			: "0101010101_";
		const textCondition =
			prev &&
			prev.width === element.clientWidth &&
			prev.height === element.clientHeight;
		const text = getTextContentWithImageAtSize(
			image,
			element.clientWidth,
			element.clientHeight,
			textCondition ? prev.text : null,
			words,
			letters
		);

		element.textContent = text;
		const data = {
			width: element.clientWidth,
			height: element.clientHeight,
			text: text,
		};
		setTimeout(() => render(element, image, data), updateInterval);
	}

	document.addEventListener("DOMContentLoaded", function () {
		const textElements = document.querySelectorAll("[data-lettercrap-text]");
		for (let i = 0; i < textElements.length; i++) {
			const text = textElements[i].getAttribute("data-lettercrap-text");
			const imageURL = createImageURL(text);
			textElements[i].setAttribute("data-letter-crap", imageURL);
		}

		const elements = document.querySelectorAll("[data-letter-crap]");
		for (let i = 0; i < elements.length; i++) initElement(elements[i]);
	});
})();
