import { createInstance } from "meeseOS";
import Splash from "../src/splash.js";

describe("Splash", () => {
	let core;
	let splash;

	beforeAll(async () => {
		core = await createInstance();
		splash = new Splash(core);
	});

	afterAll(() => core.destroy());

	test("#init", () => {
		splash.init();
		expect(splash).toBeDefined();
	});

	test("#show - splash is shown on boot", () => {
		const showSpy = jest.spyOn(splash, "show");
		core.emit("meeseOS/core:boot");
		expect(showSpy).toHaveBeenCalled();
		showSpy.mockClear();
	});

	test("#show - splash is not shown on logout", () => {
		const showSpy = jest.spyOn(splash, "show");
		core.emit("meeseOS/core:destroy");
		expect(showSpy).not.toHaveBeenCalled();
	});

	test("#destroy - removes splash element from DOM", () => {
		splash.show();
		splash.destroy();

		const splashElement = document.querySelector(".meeseOS-boot-splash");
		expect(splashElement).toBeNull();
	});
});
