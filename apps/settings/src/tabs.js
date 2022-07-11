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

/** MeeseOS tab sections */
export const tabSections = [
	{
		title: "Background",
		items: [
			{
				label: "Type",
				path: "desktop.background.type",
				type: "wallpaper",
				defaultValue: "static",
			},
		],
	},
	{
		title: "Themes",
		items: [
			{
				label: "Style",
				path: "desktop.theme",
				type: "select",
				choices: (state) => state.themes.styles,
			},
			{
				label: "Icons",
				path: "desktop.icons",
				type: "select",
				choices: (state) => state.themes.icons,
			},
			{
				label: "Sounds",
				path: "desktop.sounds",
				type: "select",
				choices: (state) => state.themes.sounds,
			},
		],
	},
	{
		title: "Desktop",
		items: [
			{
				label: "Cursor effects",
				path: "desktop.cursor.effect",
				type: "cursor",
				defaultValue: "none",
			},
			{
				label: "Enable desktop icons",
				path: "desktop.iconview.enabled",
				type: "select",
				choices: () => [
					{
						label: "Yes",
						value: "true",
					},
					{
						label: "No",
						value: "false",
					},
				],
			},
			{
				label: "Font color style",
				path: "desktop.iconview.fontColorStyle",
				type: "select",
				defaultValue: "system",
				choices: () => ({
					system: "System",
					invert: "Inverted background color",
					custom: "Custom color",
				}),
			},
			{
				label: "Custom font color",
				path: "desktop.iconview.fontColor",
				type: "color",
			},
		],
	},
];
