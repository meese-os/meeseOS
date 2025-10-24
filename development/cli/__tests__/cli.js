const path = require("path");
const cli = require("../src/cli.js");

describe("cli", () => {
	const createInstance = (...argv) =>
		cli(["/usr/bin/node", "/tmp/node_modules/.bin/meese-cli", ...argv], {
			root: path.resolve(__dirname, ".."),
		});

	test("should initialize without error", () => {
		return expect(createInstance()).resolves.toBeUndefined();
	});

	test("should run info task", () => {
		return expect(createInstance("info")).resolves.toBeUndefined();
	});
});
