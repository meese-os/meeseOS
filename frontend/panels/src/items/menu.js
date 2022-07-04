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

import { h } from "hyperapp";
import PanelItem from "../panel-item";
import defaultIcon from "../icon.png";

const sortBy = (fn) => (a, b) => -(fn(a) < fn(b)) || Number(fn(a) > fn(b));
const sortByLabel = (iter) => String(iter.label).toLowerCase();

const makeTree = (core, icon) => {
	const configuredCategories = core.config("application.categories");

	const getIcon = (m, fallbackIcon) =>
		m.icon
			? m.icon.match(/^(https?:)\//)
				? m.icon
				: core.url(m.icon, {}, m)
			: fallbackIcon;

	const createCategory = (category) => ({
		icon: category.icon ? { name: category.icon } : icon,
		label: category.label,
		items: [],
	});

	const createItem = (item) => ({
		icon: getIcon(item, icon),
		label: item.title,
		data: {
			name: item.name,
		},
	});

	const createCategoryTree = (metadata) => {
		const categories = {};

		metadata
			.filter((m) => m.hidden !== true)
			.forEach((m) => {
				const cat =
					Object.keys(configuredCategories).find((c) => c === m.category) ||
					"other";
				const found = configuredCategories[cat];

				if (!categories[cat]) {
					categories[cat] = createCategory(found);
				}

				categories[cat].items.push(createItem(m));
			});

		Object.keys(categories).forEach((k) => {
			categories[k].items.sort(sortBy(sortByLabel));
		});

		const result = Object.values(categories);
		result.sort(sortBy(sortByLabel));

		return result;
	};

	const createFlatMenu = (metadata) => {
		const pinned = [
			...core.config("application.pinned", []),
			// TODO: User configurable pinned items
		];

		const items = metadata
			.filter((m) => pinned.indexOf(m.name) !== -1)
			.map(createItem);

		if (items.length) {
			items.sort(sortBy(sortByLabel));
			return [{ type: "separator" }, ...items];
		}

		return [];
	};

	const createSystemMenu = () => [
		{
			type: "separator",
		},
		{
			icon,
			label: "Save Session & Log Out",
			data: {
				action: "saveAndLogOut",
			},
		},
		{
			icon,
			label: "Log Out",
			data: {
				action: "logOut",
			},
		},
	];

	return (metadata) => {
		const categories = createCategoryTree(metadata);
		const flat = createFlatMenu(metadata);
		const system = createSystemMenu();

		return [...categories, ...flat, ...system];
	};
};

/**
 * Menu
 * @desc Menu Panel Item
 */
export default class MenuPanelItem extends PanelItem {
	render(state, actions) {
		const icon = this.options.icon || defaultIcon;

		const logout = async (save) => {
			if (save) {
				await this.core.make("meeseOS/session").save();
			}

			this.core.make("meeseOS/auth").logout();
		};

		const makeMenu = makeTree(this.core, icon);

		const onclick = (ev) => {
			const packages = this.core
				.make("meeseOS/packages")
				.getPackages((m) => !m.type || m.type === "application");

			this.core.make("meeseOS/contextmenu").show({
				menu: makeMenu([].concat(packages)),
				position: ev.target,
				callback: (item) => {
					const { name, action } = item.data || {};

					if (name) {
						this.core.run(name);
					} else if (action === "saveAndLogOut") {
						logout(true);
					} else if (action === "logOut") {
						logout(false);
					}
				},
				toggle: true,
			});
		};

		const onmenuopen = () => {
			const els = Array.from(
				this.panel.$element.querySelectorAll(
					".meeseOS-panel-item[data-name=\"menu\"]"
				)
			);
			els.forEach((el) =>
				el.querySelector(".meeseOS-panel-item--icon").click()
			);
		};

		this.core.on(
			"meeseOS/desktop:keybinding:open-application-menu",
			onmenuopen
		);
		this.on("destroy", () =>
			this.core.off(
				"meeseOS/desktop:keybinding:open-application-menu",
				onmenuopen
			)
		);

		return super.render("menu", [
			h(
				"div",
				{
					onclick,
					className: "meeseOS-panel-item--clickable meeseOS-panel-item--icon",
				},
				[
					h("img", {
						// TODO: Change icon here as opposed to log in/out
						src: icon,
						alt: "Menu",
					}),
					h("span", {}, "Menu"),
				]
			),
		]);
	}
}
