import { createInstance } from "meeseOS";
import Notification from "../src/notification.js";

describe("Notification", () => {
	let core;
	let notification;
	const root = document.createElement("div");

	beforeAll(() => {
		return createInstance().then((c) => (core = c));
	});

	afterAll(() => core.destroy());

	test("#constructor", () => {
		const ev = jest.fn(() => {});
		core.on("meeseOS/notification:create", ev);

		notification = new Notification(core, root, {
			title: "Jest",
			message: "Jest",
		});

		expect(ev).toHaveBeenCalled();
	});

	test("#render", () => {
		notification.render();

		expect(root.children.length).toBe(1);
		setTimeout(() => {
			expect(root.querySelector("meeseOS-notification-title").textContent).toBe(
				"Jest"
			);
			expect(
				root.querySelector("meeseOS-notification-message").textContent
			).toBe("Jest");
		}, 10);
	});

	test("#destroy", () => {
		const ev = jest.fn(() => {});
		core.on("meeseOS/notification:destroy", ev);
		notification.destroy();

		expect(ev).toHaveBeenCalled();
	});

	test("Native notification", () => {
		const n = new Notification(core, root, {
			native: true,
		});

		expect(n.render()).resolves.toBe(true);
	});
});
