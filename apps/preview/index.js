/**
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-Present, Anders Evenrud <andersevenrud@gmail.com>
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

import {
	Box,
	BoxContainer,
	Image,
	Menubar,
	MenubarItem,
	RangeField,
	Video,
} from "@meese-os/gui";
import { app, h } from "hyperapp";
import { name as applicationName } from "./metadata.json";
import meeseOS from "meeseOS";

/** Smallest and largest zoom the slider allows, as a percentage. */
const MIN_ZOOM = 10;
const MAX_ZOOM = 400;

/**
 * Computes the zoom percentage that fits the image within its container,
 * never upscaling past natural size.
 * @param {{width: Number, height: Number}} naturalSize Image natural size
 * @param {Element} container The scroll container element
 * @returns {Number} Zoom percentage
 */
const computeFitZoom = (naturalSize, container) => {
	if (!naturalSize || !container) return 100;

	const fit = Math.min(
		container.clientWidth / naturalSize.width,
		container.clientHeight / naturalSize.height,
		1
	);

	return Math.max(MIN_ZOOM, Math.round(fit * 100));
};

/** The displayed image width in pixels for the current zoom, or undefined pre-load. */
const imageWidth = (state) =>
	state.naturalSize
		? Math.round((state.naturalSize.width * state.zoom) / 100)
		: undefined;

/** Toolbar with a Fit button, a zoom slider, and the current percentage. */
const zoomBar = (state, actions) =>
	h(
		"div",
		{
			class: "meeseOS-gui",
			style: {
				display: "flex",
				alignItems: "center",
				gap: "0.5em",
				padding: "0.25em 0.5em",
			},
		},
		[
			h("button", { type: "button", onclick: () => actions.fitImage() }, "Fit"),
			h(RangeField, {
				min: String(MIN_ZOOM),
				max: String(MAX_ZOOM),
				value: String(state.zoom),
				style: { width: "100%" },
				box: { grow: 1, shrink: 1 },
				oninput: (_ev, value) => actions.setZoom(Number(value)),
			}),
			h(
				"span",
				{ style: { minWidth: "3em", textAlign: "right" } },
				`${state.zoom}%`
			),
		]
	);

const view = (core, proc, win, refs) => (state, actions) =>
	h(
		Box,
		{},
		[
			h(Menubar, {}, [
				h(
					MenubarItem,
					{
						onclick: (ev) => actions.menu(ev),
					},
					"File"
				),
			]),
			state.image ? zoomBar(state, actions) : null,
			h(
				BoxContainer,
				{
					grow: 1,
					shrink: 1,
					style: { overflow: state.image || state.video ? "auto" : "hidden" },
				},
				[
					state.image
						? h(Image, {
							src: state.image.url,
							width: imageWidth(state),
							oncreate: (el) => {
								refs.container = el.parentNode?.parentNode;
							},
							onload: (ev) => actions.imageLoaded(ev.target),
						  })
						: null,
					state.video
						? h(Video, {
							src: state.video.url,
							onload: (ev) => actions.resizeFit(ev.target),
						  })
						: null,
				].filter((i) => Boolean(i))
			),
		].filter((i) => Boolean(i))
	);

const openFile = async (core, proc, win, a, file, restore) => {
	const url = await core.make("meeseOS/vfs").url(file);
	const ref = { ...file, url };

	if (/^image/.test(file.mime)) {
		a.setImage({ image: ref, restore });
	} else if (/^video/.test(file.mime)) {
		a.setVideo({ video: ref, restore });
	}

	win.setTitle(`${proc.metadata.title} - ${file.filename}`);
	proc.args.file = file;
};

meeseOS.register(applicationName, (core, args, options, metadata) => {
	const proc = core.make("meeseOS/application", {
		args,
		options,
		metadata,
	});

	const win = proc.createWindow({
		id: "PreviewWindow",
		title: metadata.title,
		icon: proc.resource(metadata.icon),
		dimension: { width: 400, height: 400 },
	});

	win.on("destroy", () => proc.destroy());
	win.on("render", (win) => win.focus());
	win.on("drop", (ev, data) => {
		if (data.isFile && data.mime) {
			const found = metadata.mimes.find((m) => new RegExp(m).test(data.mime));
			if (found) {
				proc.emit("readFile", data, false);
			}
		}
	});

	// TODO: Decompose this
	win.render(($content, win) => {
		const refs = { container: null };
		const a = app(
			{
				image: null,
				video: null,
				restore: false,
				zoom: 100,
				naturalSize: null,
			},
			{
				resizeFit: (target) => (state) => {
					if (!state.restore) {
						try {
							win.resizeFit(target);
						} catch (e) {
							console.warn(e);
						}
					}
				},

				imageLoaded: (target) => (state) => {
					const naturalSize = {
						width: target.naturalWidth,
						height: target.naturalHeight,
					};

					// Default to fitting the image in the window; honor a restored zoom.
					if (state.restore) return { naturalSize };

					return {
						naturalSize,
						zoom: computeFitZoom(naturalSize, target.parentNode?.parentNode),
					};
				},

				setZoom: (zoom) => () => ({
					zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom))),
				}),

				fitImage: () => (state) => ({
					zoom: computeFitZoom(state.naturalSize, refs.container),
				}),

				setVideo: ({ video, restore }) => ({ video, image: null, restore }),
				setImage: ({ image, restore }) => ({
					image,
					video: null,
					restore,
					zoom: 100,
					naturalSize: null,
				}),
				menu: (ev) => {
					core.make("meeseOS/contextmenu").show({
						menu: [
							{
								label: "Open",
								onclick: () => {
									core.make(
										"meeseOS/dialog",
										"file",
										{ type: "open", mime: metadata.mimes },
										(btn, item) => {
											if (btn === "ok") {
												proc.emit("readFile", item, false);
											}
										}
									);
								},
							},
							{ label: "Quit", onclick: () => proc.destroy() },
						],
						position: ev.target,
					});
				},
			},
			view(core, proc, win, refs),
			$content
		);

		proc.on("readFile", (file, restore) =>
			openFile(core, proc, win, a, file, restore)
		);

		if (args.file) {
			proc.emit("readFile", args.file, Boolean(proc.options.restore));
		}
	});

	return proc;
});
