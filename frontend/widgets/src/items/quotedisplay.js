/**
 * MeeseOS - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2022-Present, Aaron Meese <aaronjmeese@gmail.com>
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
 * @author  Aaron Meese <aaronjmeese@gmail.com>
 * @licence Simplified BSD License
 */

import Widget from "../widget";

Array.prototype.random = function () {
  return this[Math.floor((Math.random() * this.length))];
}

/**
 * Quote Object
 * @typedef {Object} Quote
 * @property {String} quote
 * @property {String} author
 */

/**
 * Quote Display Widget Options
 * @typedef {Object} QuoteDisplayOptions
 * @property {String} [fontFamily="Monospace"] Font family
 * @property {String} [color="#ffffff"] Font color
 * @property {Quote[]} [quotes] Quotes to display
 */

export default class QuoteDisplayWidget extends Widget {
	/**
	 * Creates a new instance.
	 * @param {Core} core MeeseOS Core instance reference
	 * @param {QuoteDisplayOptions} [options] Instance options
	 */
	constructor(core, options) {
		super(
			core,
			options,
			{
				dimension: {
					width: 400,
					height: 150,
				},
				minDimension: {
					width: 200,
					height: 100,
				},
				canvas: false,
			},
			{
				fontFamily: "Monospace",
				fontColor: "#ffffff",
				quotes: core.config("quotes", [
					{
						quote: "You should override this with your own quotes in your config file.",
						author: "Aaron Meese",
					},
				]),
			}
		);

		this.quoteDisplayElem = document.createElement("div");
		this.quoteDisplayElem.classList.add("quote-display");
		this.$element.appendChild(this.quoteDisplayElem);
	}

	applySettings() {
		this.quoteDisplayElem.style.fontFamily = this.options.fontFamily;
		this.quoteDisplayElem.style.color = this.options.fontColor;
	}

	render() {
		const quote = this.options.quotes.random() || {};
		this.quoteDisplayElem.innerHTML = `
			<blockquote>${quote.quote}</blockquote>
			<div class="author">${quote.author}</div>
		`;
		this.applySettings();
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
			// IDEA: Add a way to add quotes to the list
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
					this.applySettings();
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
					this.applySettings();
					this.saveSettings();
				}
			}
		);
	}

	static metadata() {
		return {
			...super.metadata(),
			title: "Quote Display",
		};
	}
}
