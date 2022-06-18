/*!
 * DomAnimator.js
 *
 * MIT licensed
 * Copyright (C) 2015 Tim Holman, http://tholman.com
 */

// eslint-disable-next-line spaced-comment
/*********************************************
 * DomAnimator
 *********************************************/

export const DomAnimator = function() {
	"use strict";

	let currentFrame = 0;
	let frames = [];
	let nodes = [];

	// Chrome console shows new lines, others don't...
	// so multiple comments are used on others, to look good.
	let multiNode = !window.chrome;

	let interval = null;
	let defaultTime = 500; // ms
	let attached = false;
	let whiteSpaceString = "\u00A0";

	// Soft object augmentation
	function extend(target, source) {
		for (let key in source) {
			if (!(key in target)) {
				target[key] = source[key];
			}
		}
		return target;
	}

	// Frame passed through as a list []
	function parseMultilineFrame(frame) {
		return multiNode ? swapWhitespace(frame) : padString(frame.join("\n"));
	}

	// Frame passed through as a string.
	function parseSingleLineFrame(frame) {
		return multiNode ? swapWhitespace(frame.split("\n")) : padString(frame);
	}

	function swapWhitespace(array) {
		let i = 0;

		for (i; i < array.length; i++) {
			array[i] = array[i].replace(/ /g, whiteSpaceString);
		}
		return array;
	}

	function animate(time) {
		// No time set, just use default!
		if (!time) time = defaultTime;

		// No frames
		if (frames.length === 0) {
			return console.log(
				"I need frames to animate. You can add them with .addFrame( string )"
			);
		}

		if (attached === false) {
			attachToDocument();
		}

		interval = setInterval(() => {
			renderFrame();
		}, time);
	}

	function renderFrame() {
		let frameData = frames[currentFrame];

		if (multiNode) {
			for (let i = 0; i < nodes.length; i++) {
				nodes[i].nodeValue = frameData[i];
			}
		} else {
			nodes[0].nodeValue = frameData;
		}

		currentFrame = currentFrame + 1;
		if (currentFrame === frames.length) {
			currentFrame = 0;
		}
	}

	function attachToDocument() {
		let head = document.head;
		let parent = head.parentNode;

		// This assumes you have the same amount of frames in each section.
		if (multiNode) {
			let totalNodes = frames[0].length;
			for (let i = 0; i < totalNodes; i++) {
				let node = document.createComment("");
				nodes.push(node);
				parent.insertBefore(node, head);
			}
		} else {
			let node = document.createComment("");
			nodes.push(node);
			parent.insertBefore(node, head);
		}
	}

	function stop() {
		clearInterval(interval);
	}

	function addFrame(frameData) {
		if (!frameData) frameData = "no frame data";

		let frameType = typeof frameData;

		// Multi line data.
		if (frameType === "object") {
			frames.push(parseMultilineFrame(frameData));

			// String data
		} else if (frameType === "string") {
			frames.push(parseSingleLineFrame(frameData));
		}
	}

	function padString(string) {
		return "\n" + string + "\n";
	}

	function main() {}

	return extend(main, {
		addFrame: addFrame,
		animate: animate,
		stop: stop,
	});
};
