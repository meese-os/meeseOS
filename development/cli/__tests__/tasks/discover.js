const logger = require("consola");
const temp = require("temp");
const fs = require("fs-extra");
const utils = require("../../src/utils.js");
const task = require("../../src/tasks/discover.js");
const { createPath } = require("../../src/createPath.js");

// FIXME: Memory fs
describe("task > package:discover", () => {
	const root = temp.mkdirSync("meese-cli-jest");
	const fname = (str) => createPath(root, str);

	beforeAll(() => {
		jest.spyOn(console, "warn").mockImplementation(() => { /* noop */ });
	});

	afterAll(() => fs.removeSync(root));

	test("should discover packages", async () => {
		const defaults = utils.createOptions({ root });

		const options = utils.resolveOptions(defaults, {
			discover: [
				createPath(__dirname, "../../__mocks__/packages"),
				createPath(__dirname, "../../__mocks__/packages"),
			],
		});

		await task["package:discover"].action({
			logger,
			options,
			args: {},
			commander: null,
		});

		expect(fs.existsSync(fname("dist/metadata.json"))).toBe(true);

		expect(require(fname("dist/metadata.json"))).toMatchObject([
			{
				name: "Application",
			},
			{
				name: "Theme",
				type: "theme",
			},
		]);

		expect(fs.existsSync(fname("dist/apps/Application/main.js"))).toBe(true);

		expect(fs.existsSync(fname("dist/themes/Theme/main.js"))).toBe(true);

		expect(fs.existsSync(fname("dist/apps/Failed"))).toBe(false);
	});
});
