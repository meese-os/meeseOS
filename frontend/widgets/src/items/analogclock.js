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
		// TODO: If this works, make it better
		const size = 250;

		super(
			core,
			options,
			{
				dimension: {
					width: size,
					height: size,
				},
				aspect: true
			},
			{
				fontFamily: "Monospace",
				fontColor: "#ffffff",
			}
		);

		this.$tmpCanvas = document.createElement("canvas");
		this.$tmpCanvas.width = size;
		this.$tmpCanvas.height = size;
		this.tmpContext = this.$tmpCanvas.getContext("2d");
		this.firstRender = true;
	}

	compute() {
		const { width, height } = this.$canvas;
		const { $tmpCanvas } = this;
		this.firstRender = true;

		$tmpCanvas.width = width;
		$tmpCanvas.height = height;
	}

	onResize() {
		this.compute();
	}

	render({ context, width, height }) {
		const size = Math.min(width, height);

		if (this.firstRender) {
			context.translate(width / 2, height / 2);
			this.firstRender = false;
		}

		const radius = size / 2 * 0.9;
		this.drawClock(context, radius);
	}

	getContextMenu() {
		return [
			{
				label: "Set Color",
				onclick: () => this.createColorDialog(),
			},
			{
				label: "Set Font",
				onclick: () => this.createFontDialog(),
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

	createColorDialog() {
		this.core.make(
			"meeseOS/dialog",
			"color",
			{
				color: this.options.fontColor,
			},
			(btn, value) => {
				if (btn === "ok") {
					this.options.fontColor = value.hex;
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
		var grad;
		ctx.beginPath();
		ctx.arc(0, 0, radius, 0, 2 * Math.PI);
		ctx.fillStyle = 'white';
		ctx.fill();
		grad = ctx.createRadialGradient(0,0,radius*0.95, 0,0,radius*1.05);
		grad.addColorStop(0, '#333');
		grad.addColorStop(0.5, 'white');
		grad.addColorStop(1, '#333');
		ctx.strokeStyle = grad;
		ctx.lineWidth = radius * 0.1;
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(0, 0, radius*0.1, 0, 2*Math.PI);
		ctx.fillStyle = '#333';
		ctx.fill();
	}

	/**
	 * Draws the numbers to the canvas.
	 * @param {CanvasRenderingContext2D} context the canvas context
	 * @param {Number} radius the radius of the clock
	 * @private
	 */
	drawNumbers(ctx, radius) {
		var ang;
		ctx.font = radius*0.15 + "px arial";
		ctx.textBaseline="middle";
		ctx.textAlign="center";
		for (let num = 1; num < 13; num++){
			ang = num * Math.PI / 6;
			ctx.rotate(ang);
			ctx.translate(0, -radius*0.85);
			ctx.rotate(-ang);
			ctx.fillText(num.toString(), 0, 0);
			ctx.rotate(ang);
			ctx.translate(0, radius*0.85);
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
		var now = new Date();
		var hour = now.getHours();
		var minute = now.getMinutes();
		var second = now.getSeconds();
		//hour
		hour=hour%12;
		hour=(hour*Math.PI/6)+
		(minute*Math.PI/(6*60))+
		(second*Math.PI/(360*60));
		this.drawHand(ctx, hour, radius*0.5, radius*0.07);
		//minute
		minute=(minute*Math.PI/30)+(second*Math.PI/(30*60));
		this.drawHand(ctx, minute, radius*0.8, radius*0.07);
		// second
		second=(second*Math.PI/30);
		this.drawHand(ctx, second, radius*0.9, radius*0.02);
	}

	/**
	 * Draws a single specified hand to the canvas.
	 * @param {CanvasRenderingContext2D} context the canvas context
	 * @param {Number} radius the radius of the clock
	 * @private
	 */
	drawHand(ctx, pos, length, width) {
		ctx.beginPath();
		ctx.lineWidth = width;
		ctx.lineCap = "round";
		ctx.moveTo(0,0);
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
