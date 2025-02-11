const path = require("path");
const utils = require("../src/utils.js");

describe("utils", () => {
	beforeAll(() => {
		jest.spyOn(console, "warn").mockImplementation(() => { /* noop */ });
	});

	describe("createOptions", () => {
		test("should create structured object", () => {
			const options = utils.createOptions({
				root: "/tmp",
			});

			expect(options.dist()).toEqual({
				root: "/tmp/dist",
				icons: "/tmp/dist/icons",
				metadata: "/tmp/dist/metadata.json",
				packages: "/tmp/dist/apps",
				sounds: "/tmp/dist/sounds",
				themes: "/tmp/dist/themes",
				wallpapers: "/tmp/dist/wallpapers",
			});

			expect(options).toMatchObject({
				cli: "/tmp/src/cli",
				config: {
					disabled: [],
					discover: [],
					tasks: [],
				},
				npm: "/tmp/package.json",
				packages: "/tmp/packages.json",
				production: false,
				root: "/tmp",
			});
		});
	});

	describe("resolveOptions", () => {
		test("should create new object", () => {
			const task = jest.fn();

			const defaults = utils.createOptions({
				root: "/tmp",
			});

			const options = utils.resolveOptions(defaults, {
				tasks: [task],
				discover: ["/foo"],
				disabled: ["foo"],
				packages: {
					metadata: {
						Foo: {
							bar: "baz",
						},
					},
				},
			});

			expect(options).toMatchObject({
				cli: "/tmp/src/cli",
				config: {
					disabled: ["foo"],
					packages: {
						metadata: {
							Foo: {
								bar: "baz",
							},
						},
					},
					discover: ["/tmp/node_modules", "/foo"],
					tasks: [task],
				},
				npm: "/tmp/package.json",
				packages: "/tmp/packages.json",
				production: false,
				root: "/tmp",
			});
		});
	});

	describe("loadTasks", () => {
		test("should load a list of tasks", () => {
			const promise = utils.loadTasks(
				{
					foo: {
						description: "foo",
					},
				},
				[
					() => ({
						bar: {
							description: "bar",
						},
					}),
				],
				{}
			);

			return expect(promise).resolves.toEqual({
				foo: {
					description: "foo",
				},
				bar: {
					description: "bar",
				},
			});
		});
	});

	describe("spawnAsync", () => {
		test("should exit with correct code", () => {
			// If you get the error message `spawn sh ENOENT` on Windows,
			// add `C:\Program Files\Git\bin` to your PATH environment variable.
			// You'll then need to restart your editor/terminal to apply the changes.
			return expect(utils.spawnAsync("sh", ["-c", "exit 123"])).rejects.toBe(
				123
			);
		});
	});

	describe("npmPackages", () => {
		test("should get filtered list of metadata", () => {
			const root = path.resolve(__dirname, "../__mocks__", "packages");
			return expect(utils.npmPackages(root)).resolves.toMatchObject([
				{
					json: {
						meeseOS: { type: "package" },
					},
					meta: {
						name: "Application",
					},
				},
				{
					json: {
						meeseOS: { type: "package" },
					},
					meta: {
						name: "Theme",
					},
				},
			]);
		});
	});
});
