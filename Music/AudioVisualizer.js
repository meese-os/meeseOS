import { getId } from "./HelperFunctions.js";
import { getColor } from "./Color.js";
const canvasElement = getId("visCanvas");
const canvas = canvasElement.getContext("2d");
const clearVis = () => canvas.clearRect(0, 0, window.size[0], window.size[1]);

export const AudioVisualizer = {
	monstercat: {
		name: "Monstercat",
		image: "visualizers/monstercat.png",
		start: function () {},
		frame: function () {
			clearVis();
			const left = window.size[0] * 0.1;
			const maxWidth = window.size[0] * 0.8;
			const barWidth = maxWidth / 96;
			const barSpacing = maxWidth / 64;
			const maxHeight = window.size[1] * 0.5 - window.size[1] * 0.2;

			const monstercatGradient = canvas.createLinearGradient(
				0,
				Math.round(window.size[1] / 2) + 4,
				0,
				window.size[1]
			);
			monstercatGradient.addColorStop(0, "rgba(0, 0, 0, 0.8)"); // 0.8
			monstercatGradient.addColorStop(0.025, "rgba(0, 0, 0, 0.9)"); // 0.9
			monstercatGradient.addColorStop(0.1, "rgba(0, 0, 0, 1)"); // 1

			for (let i = 0; i < 64; i++) {
				const strength = window.visData[i];

				const fillColor = getColor(strength, i * 4);
				canvas.fillStyle = fillColor;
				canvas.fillRect(
					Math.round(left + i * barSpacing),
					Math.floor(window.size[1] / 2) -
						Math.round((strength / 255) * maxHeight),
					Math.round(barWidth),
					Math.round((strength / 255) * maxHeight + 5)
				);

				if (strength > 10) {
					canvas.fillRect(
						Math.round(left + i * barSpacing),
						Math.floor(window.size[1] / 2) + 4,
						Math.round(barWidth),
						Math.round((10 / 255) * maxHeight + 4)
					);
					canvas.fillRect(
						Math.round(left + i * barSpacing - 1),
						Math.floor(window.size[1] / 2) + 4 + (10 / 255) * maxHeight + 4,
						Math.round(barWidth + 2),
						Math.round(((strength - 10) / 255) * maxHeight)
					);
				} else {
					canvas.fillRect(
						Math.round(left + i * barSpacing),
						Math.floor(window.size[1] / 2) + 4,
						Math.round(barWidth),
						Math.round((strength / 255) * maxHeight + 4)
					);
				}
			}

			canvas.fillStyle = monstercatGradient;
			canvas.fillRect(
				0,
				Math.round(window.size[1] / 2) + 4,
				window.size[0],
				Math.round(window.size[1] / 2) - 4
			);

			canvas.fillStyle = "#FFF";
			canvas.font = window.size[1] * 0.25 + "px W95FA, sans-serif";
			canvas.fillText(
				(fileNames[currentSong] || ["No Song"])[0].toUpperCase(),
				Math.round(left) + 0.5,
				window.size[1] * 0.75,
				Math.floor(maxWidth)
			);
		},
		stop: function () {},
		sqrt255: Math.sqrt(255),
	},
	central: {
		name: "Central",
		image: "visualizers/central.png",
		start: function () {},
		frame: function () {
			clearVis();
			const left = window.size[0] * 0.1;
			const maxWidth = window.size[0] * 0.8;
			const barWidth = maxWidth / 96;
			const barSpacing = maxWidth / 64;
			const maxHeight = window.size[1] * 0.5 - window.size[1] * 0.25;

			for (let i = 0; i < 64; i++) {
				const strength = window.visData[i];

				const fillColor = getColor(strength, i * 4);
				canvas.fillStyle = fillColor;
				canvas.fillRect(
					Math.round(left + i * barSpacing),
					Math.floor(window.size[1] / 2) -
						Math.round((strength / 255) * maxHeight) -
						5,
					Math.round(barWidth),
					Math.round((strength / 255) * maxHeight * 2 + 10)
				);
			}
		},
		stop: function () {},
		sqrt255: Math.sqrt(255),
	},
	curvedAudioVision: {
		name: "Curved Lines",
		image: "visualizers/curvedLines_av.png",
		start: function () {},
		frame: function () {
			clearVis();
			canvas.lineCap = "round";
			canvas.lineWidth = this.lineWidth - 0.5 * this.lineWidth;
			let xdist = window.size[0] / (this.lineCount + 2) / 2;
			const ydist = window.size[1] / (this.lineCount + 2) / 2;
			xdist = Math.min(xdist, ydist);
			const colorstep = 255 / this.lineCount;
			const ringPools = [0, 0, 0, 0, 0, 0, 0, 0, 0];
			for (let i = 0; i < 64; i++) {
				const currPool = Math.floor(i / (64 / 9));
				ringPools[currPool] = Math.max(window.visData[i], ringPools[currPool]);
			}
			for (let i = 0; i < this.lineCount; i++) {
				const strength = ringPools[i] * 0.85;
				canvas.strokeStyle = getColor(strength, i * colorstep);

				const circlePoints = [
					{
						x: xdist * this.lineCount,
						y: 0,
					},
					{
						x: xdist * this.lineCount,
						y: 2 * xdist * this.lineCount,
					},
					{
						x: xdist * this.lineCount + xdist * (i + 1),
						y: xdist * this.lineCount,
					},
				];
				let currCircle = this.circleFromThreePoints(...circlePoints);
				const tri = [
					Math.sqrt(
						Math.pow(circlePoints[2].x - circlePoints[0].x, 2) +
							Math.pow(circlePoints[2].y - circlePoints[0].y, 2)
					),
					currCircle.r,
					currCircle.r,
				];
				// (b2 + c2 − a2) / 2bc
				const angle = Math.acos(
					this.deg2rad(
						(tri[1] * tri[1] + tri[2] * tri[2] - tri[0] * tri[0]) /
							(2 * tri[1] * tri[2])
					)
				);
				canvas.beginPath();
				canvas.arc(
					currCircle.x + (window.size[0] - xdist * this.lineCount * 2) / 2,
					currCircle.y + (window.size[1] / 2 - xdist * this.lineCount),
					currCircle.r,
					(angle -
						this.deg2rad(Math.pow((this.lineCount - i - 1) * 1.83, 1.61))) *
						-1 *
						(strength / 255),
					(angle -
						this.deg2rad(Math.pow((this.lineCount - i - 1) * 1.83, 1.61))) *
						(strength / 255)
				);
				canvas.stroke();

				circlePoints[0].x *= -1;
				circlePoints[1].x *= -1;
				circlePoints[2].x *= -1;
				currCircle = this.circleFromThreePoints(...circlePoints);
				canvas.beginPath();
				canvas.arc(
					currCircle.x + (window.size[0] / 2 + xdist * this.lineCount),
					currCircle.y + (window.size[1] / 2 - xdist * this.lineCount),
					currCircle.r,
					(angle -
						this.deg2rad(Math.pow((this.lineCount - i - 1) * 1.83, 1.61))) *
						-1 *
						(strength / 255) +
						this.deg2rad(180),
					(angle -
						this.deg2rad(Math.pow((this.lineCount - i - 1) * 1.83, 1.61))) *
						(strength / 255) +
						this.deg2rad(180)
				);
				canvas.stroke();
			}
		},
		stop: function () {
			canvas.lineCap = "square";
			canvas.lineWidth = 1;
		},
		lineWidth: 6,
		lineCount: 9,
		sqrt255: Math.sqrt(255),
		deg2rad: function (degrees) {
			return degrees * this.piBy180;
		},
		piBy180: Math.PI / 180,
		circleFromThreePoints: function (p1, p2, p3) {
			// from Circle.js
			const x1 = p1.x;
			const y1 = p1.y;
			const x2 = p2.x;
			const y2 = p2.y;
			const x3 = p3.x;
			const y3 = p3.y;

			const a = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2;
			const b =
				(x1 * x1 + y1 * y1) * (y3 - y2) +
				(x2 * x2 + y2 * y2) * (y1 - y3) +
				(x3 * x3 + y3 * y3) * (y2 - y1);

			const c =
				(x1 * x1 + y1 * y1) * (x2 - x3) +
				(x2 * x2 + y2 * y2) * (x3 - x1) +
				(x3 * x3 + y3 * y3) * (x1 - x2);

			const x = -b / (2 * a);
			const y = -c / (2 * a);

			return {
				x: x,
				y: y,
				r: Math.hypot(x - x1, y - y1),
			};
		},
	},
	waveform: {
		name: "Waveform",
		image: "visualizers/waveform.png",
		start: function () {
			this.waveArray = new Uint8Array(window.analyser.fftSize);
			this.arrsize = window.analyser.fftSize;
		},
		frame: function () {
			window.analyser.getByteTimeDomainData(this.waveArray);
			clearVis();
			const avg =
				window.visData.reduce((sum, num) => sum + num) / window.visData.length;
			const multiplier = window.size[1] / 255;
			const step = this.arrsize / window.size[0];
			canvas.lineWidth = 2;

			for (let i = 0; i < window.size[0]; i++) {
				canvas.strokeStyle = getColor(avg, 255 - (i / window.size[0]) * 255);
				canvas.beginPath();
				canvas.moveTo(
					window.size[0] - i - 1.5,
					window.size[1] -
						(this.waveArray[Math.round(i * step)] / 2) * multiplier -
						window.size[1] / 4
				);
				canvas.lineTo(
					window.size[0] - i - 0.5,
					window.size[1] -
						(typeof this.waveArray[Math.round((i - 1) * step)] === "number"
							? this.waveArray[Math.round((i - 1) * step)] / 2
							: this.waveArray[Math.round(i * step)] / 2) *
							multiplier -
						window.size[1] / 4
				);
				canvas.stroke();
			}
		},
		stop: function () {},
		waveArray: new Uint8Array(),
	},
};
