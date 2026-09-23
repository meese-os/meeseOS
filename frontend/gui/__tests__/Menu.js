import { Menu } from "../src/components/Menu.js";

const getLabel = (menu, index = 0) =>
	menu.children[0].children[index].children[0].children[0];

describe("Menu", () => {
	test("renders an optional shortcut label alongside menu text", () => {
		const menu = Menu({
			menu: [{ label: "Open", shortcut: "Ctrl+O" }],
		});
		const label = getLabel(menu);

		expect(label.children).toHaveLength(2);
		expect(label.children[0]).toMatchObject({
			nodeName: "span",
			attributes: { class: "meeseOS-gui-menu-label-text" },
			children: ["Open"],
		});
		expect(label.children[1]).toMatchObject({
			nodeName: "span",
			attributes: { class: "meeseOS-gui-menu-shortcut" },
			children: ["Ctrl+O"],
		});
	});

	test("does not add an empty shortcut element", () => {
		const menu = Menu({
			menu: [
				{ label: "Open" },
				{ label: "Save", shortcut: "" },
				{ label: "Close", shortcut: null },
			],
		});

		[0, 1, 2].forEach((index) => {
			const label = getLabel(menu, index);

			expect(label.children).toHaveLength(1);
			expect(label.children[0].children).toEqual([
				["Open", "Save", "Close"][index],
			]);
		});
	});

	test("preserves submenu and item click behavior with shortcuts", () => {
		const onclick = jest.fn();
		const onshow = jest.fn();
		const menu = Menu({
			onclick,
			onshow,
			menu: [{ label: "More", shortcut: "Alt+M", items: [] }],
		});
		const container = menu.children[0].children[0].children[0];

		expect(container.attributes.onmouseover).toBe(onshow);
		expect(container.attributes.onclick).toEqual(expect.any(Function));
		expect(getLabel(menu).children[1].children).toEqual(["Alt+M"]);
	});

	test("invokes leaf item and menu click handlers", () => {
		const itemClick = jest.fn();
		const menuClick = jest.fn();
		const item = {
			label: "Open",
			shortcut: "Ctrl+O",
			onclick: itemClick,
		};
		const menu = Menu({ onclick: menuClick, menu: [item] });
		const event = {};

		menu.children[0].children[0].children[0].attributes.onclick(event);

		expect(itemClick).toHaveBeenCalledWith(item, event);
		expect(menuClick).toHaveBeenCalledWith(item, event, item);
	});
});
