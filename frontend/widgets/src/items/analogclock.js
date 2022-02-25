/*
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2020, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

import Widget from "../widget";

export default class AnalogClockWidget extends Widget {
	constructor(core, options) {
		/** The default starting size for this widget. */
		const startingSize = 250;

		/** The minimum dimension for this widget. */
		const minDimension = 150;

		super(
			core,
			options,
			{
				minDimension: {
					width: minDimension,
					height: minDimension,
				},
				dimension: {
					width: startingSize,
					height: startingSize,
				},
			},
			{
				fontFamily: "Monospace",
				numberColor: "#000000",
				hourHandColor: "#000000",
				minuteHandColor: "#000000",
				secondHandColor: "#000000",
			}
		);

		this.$tmpCanvas = document.createElement("canvas");
		this.$tmpCanvas.width = startingSize;
		this.$tmpCanvas.height = startingSize;
		this.tmpContext = this.$tmpCanvas.getContext("2d");

		/**
		 * Indicates whether the clock has already been rendered at
		 * the specified size.
		 * @type {Boolean}
		 */
		this.firstRender = true;
	}

	compute() {
		const { width, height } = this.$canvas;
		const { $tmpCanvas } = this;

		$tmpCanvas.width = width;
		$tmpCanvas.height = height;
	}

	onResize() {
		this.compute();
		this.firstRender = true;
	}

	render({ context, width, height }) {
		// Translate to center of canvas initially
		if (this.firstRender) {
			context.translate(width / 2, height / 2);
			this.firstRender = false;
		}

		const size = Math.min(width, height);
		const radius = (size / 2) * 0.9;
		this.drawClock(context, radius);
	}

	getContextMenu() {
		return [
			{
				label: "Set Font",
				onclick: () => this.createFontDialog(),
			},
			{
				label: "Set Number Color",
				onclick: () =>
					this.createColorDialog("Set Number Color", "numberColor"),
			},
			{
				label: "Set Hour Hand Color",
				onclick: () =>
					this.createColorDialog("Set Hour Hand Color", "hourHandColor"),
			},
			{
				label: "Set Minute Hand Color",
				onclick: () =>
					this.createColorDialog("Set Minute Color", "minuteHandColor"),
			},
			{
				label: "Set Seconds Hand Color",
				onclick: () =>
					this.createColorDialog("Set Seconds Color", "secondsHandColor"),
			},
		];
	}

	createFontDialog() {
		this.core.make(
			"meeseOS/dialog",
			"font",
			{
				name: this.options.fontFamily,
				controls: ["name"],
			},
			(btn, value) => {
				if (btn === "ok") {
					this.options.fontFamily = value.name;
					this.compute();
					this.saveSettings();
				}
			}
		);
	}

	/**
	 * Creates a color dialog for the specified property.
	 * @param {string} title the title of the dialog
	 * @param {string} variable the name of the variable to set
	 */
	createColorDialog(title, variable) {
		this.core.make(
			"meeseOS/dialog",
			"color",
			{
				color: this.options.fontColor,
				title: title,
			},
			(btn, value) => {
				if (btn === "ok") {
					this.options[variable] = value.hex;
					this.compute();
					this.saveSettings();
				}
			}
		);
	}

	/**
	 * Draws the clock widget to the canvas.
	 * @param {CanvasRenderingContext2D} context the canvas context
	 * @param {Number} radius the radius of the clock
	 * @private
	 */
	drawClock(ctx, radius) {
		this.drawFace(ctx, radius);
		this.drawNumbers(ctx, radius);
		this.drawTime(ctx, radius);
	}

	/**
	 * Draws the clock face to the canvas.
	 * @param {CanvasRenderingContext2D} context the canvas context
	 * @param {Number} radius the radius of the clock
	 * @private
	 */
	drawFace(ctx, radius) {
		// The background of the clock
		ctx.beginPath();
		ctx.arc(0, 0, radius, 0, 2 * Math.PI);
		ctx.fillStyle = "transparent";
		ctx.fill();

		// Styling for the border of the clock
		const circleRadius = radius * 0.95;
		const circleEnding = radius * 1.05;
		const gradient = ctx.createRadialGradient(
			0,
			0,
			circleRadius,
			0,
			0,
			circleEnding
		);
		gradient.addColorStop(0, "#333");
		gradient.addColorStop(0.5, "white");
		gradient.addColorStop(1, "#333");

		// Draw the border of the clock
		ctx.strokeStyle = gradient;
		ctx.lineWidth = radius * 0.1;
		ctx.stroke();

		// The center of the clock
		ctx.beginPath();
		ctx.arc(0, 0, radius * 0.1, 0, 2 * Math.PI);
		ctx.fillStyle = "black";
		ctx.fill();
	}

	/**
	 * Draws the numbers to the canvas.
	 * @param {CanvasRenderingContext2D} context the canvas context
	 * @param {Number} radius the radius of the clock
	 * @private
	 */
	drawNumbers(ctx, radius) {
		const fontSize = radius * 0.15;
		ctx.fillStyle = this.options.numberColor;
		ctx.font = `${fontSize}px ${this.options.fontFamily}`;
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";

		for (let num = 1; num < 13; num++) {
			const ang = (num * Math.PI) / 6;
			ctx.rotate(ang);
			ctx.translate(0, -radius * 0.85);
			ctx.rotate(-ang);
			ctx.fillText(num.toString(), 0, 0);
			ctx.rotate(ang);
			ctx.translate(0, radius * 0.85);
			ctx.rotate(-ang);
		}
	}

	/**
	 * Draws the time hands to the canvas.
	 * @param {CanvasRenderingContext2D} context the canvas context
	 * @param {Number} radius the radius of the clock
	 * @private
	 */
	drawTime(ctx, radius) {
		const now = new Date();
		let hour = now.getHours() % 12;
		let minute = now.getMinutes();
		let second = now.getSeconds();

		// Hour hand
		ctx.strokeStyle = this.options.hourHandColor;
		hour =
			(hour * Math.PI) / 6 +
			(minute * Math.PI) / (6 * 60) +
			(second * Math.PI) / (360 * 60);
		this.drawHand(ctx, hour, radius * 0.5, radius * 0.07);

		// Minutes hand
		ctx.strokeStyle = this.options.minuteHandColor;
		minute = (minute * Math.PI) / 30 + (second * Math.PI) / (30 * 60);
		this.drawHand(ctx, minute, radius * 0.8, radius * 0.07);

		// Seconds hand
		ctx.strokeStyle = this.options.secondsHandColor;
		second = (second * Math.PI) / 30;
		this.drawHand(ctx, second, radius * 0.9, radius * 0.02);
	}

	/**
	 * Draws a single specified hand to the canvas.
	 * @param {CanvasRenderingContext2D} context the canvas context
	 * @param {Number} radius the radius of the clock
	 * @private
	 */
	drawHand(ctx, pos, length, width) {
		// IDEA: Try to override the default widget behavior and get a
		// smooth animation like https://codepen.io/rkosak/pen/mwyRLK
		ctx.beginPath();
		ctx.lineWidth = width;
		ctx.lineCap = "round";
		ctx.moveTo(0, 0);
		ctx.rotate(pos);
		ctx.lineTo(0, -length);
		ctx.stroke();
		ctx.rotate(-pos);
	}

	static metadata() {
		return {
			...super.metadata(),
			title: "Analog Clock",
		};
	}
}
