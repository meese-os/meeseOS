import { createInstance } from "meeseOS";
import Settings from "../src/settings.js";

describe("Settings", () => {
	let core;
	let settings;

	beforeAll(() => {
		return createInstance().then((c) => {
			core = c;
			settings = new Settings(core, {});
		});
	});

	afterAll(() => core.destroy());

	test("#init", () => {
		return expect(settings.init()).resolves.toBe(true);
	});

	test("#load", () => {
		return expect(settings.load()).resolves.toBe(true);
	});

	test("#set", () => {
		expect(() =>
			settings.set("meeseOS/locked", "foo", "Hello World")
		).not.toThrow();

		expect(() =>
			settings.set("meeseOS/jest", "foo", "Hello World")
		).not.toThrow();
	});

	test("#get", () => {
		expect(settings.get("meeseOS/jest", "foo")).toBe("Hello World");
		expect(settings.get("meeseOS/jest", "bar")).toBe(undefined);
		expect(settings.get("meeseOS/jest", "baz", "default")).toBe("default");
		expect(settings.get("meeseOS/jest")).toEqual({
			foo: "Hello World",
		});
		expect(settings.get()).toEqual({
			"meeseOS/default-application": {},
			"meeseOS/desktop": {},
			"meeseOS/session": [],
			"meeseOS/jest": {
				foo: "Hello World",
			},
		});
	});

	test("#save", () => {
		return expect(settings.save()).resolves.toBe(true);
	});

	test("#clear", () => {
		return settings.clear("meeseOS/jest").then((result) => {
			expect(result).toBe(true);
			expect(settings.get("meeseOS/jest", "foo")).toBe(undefined);
		});
	});
});
