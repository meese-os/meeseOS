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

import { Box, TextareaField } from "@meese-os/gui";
import { app, h } from "hyperapp";
import Dialog from "../dialog";

/**
 * Default MeeseOS Alert Dialog
 */
export default class AlertDialog extends Dialog {
	/**
	 * Constructor
	 * @param {Core} core MeeseOS Core instance reference
	 * @param {Object} args Arguments given from service creation
	 * @param {String} [args.title='Alert'] Dialog title
	 * @param {String} [args.message=''] Dialog message
	 * @param {String} [args.type='info'] Alert type (info/warning/error)
	 * @param {String} [args.sound='bell'] Sound
	 * @param {Error|*} [args.error] When 'alert' type is set this error stack or message will appear in a textbox
	 * @param {Function} callback The callback function
	 */
	constructor(core, args, callback) {
		args = {

			title: "Alert",
			type: "info",
			message: "",
			...args
		};

		if (typeof args.sound === "undefined") {
			args.sound = args.type === "error" ? "bell" : "message";
		}

		super(
			core,
			args,
			{
				className: "alert",
				sound: args.sound,
				window: {
					title: args.title,
					attributes: {
						ontop: args.type === "error",
						minDimension: {
							width: 400,
							height: 220,
						},
					},
				},
				buttons: ["close"],
			},
			callback
		);
	}

	render(options) {
		super.render(options, ($content) => {
			const children = [
				h(
					"div",
					{ class: "meeseOS-dialog-message" },
					String(this.args.message)
				),
			];

			if (this.args.type === "error") {
				const { error } = this.args;
				const msg = error instanceof Error ? `${error.message}\n\n${error.stack || "No stack"}` : error;

				children.push(
					h(TextareaField, {
						value: msg,
						readonly: true,
						placeholder: this.args.message,
					})
				);
			}

			app(
				{},
				{},
				(_state, _actions) => this.createView([h(Box, { grow: 1 }, children)]),
				$content
			);
		});
	}
}
