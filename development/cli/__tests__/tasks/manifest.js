const { consola: logger } = require("consola");
const temp = require("temp");
const fs = require("fs-extra");
const path = require("path");
const utils = require("../../src/utils.js");
const task = require("../../src/tasks/manifest.js");
const { createPath } = require("../../src/createPath.js");

describe("task > package:manifest", () => {
	let root = null;
	let options = null;

	const fname = (str) => createPath(root, str);
	const run = (args = {}) =>
		task["package:manifest"].action({
			logger,
			options,
			args,
			commander: null,
		});

	const manifest = () => fs.readJsonSync(fname("dist/vfs-manifest.json"));
	const paths = () => manifest().map((entry) => entry.path);

	beforeEach(() => {
		root = temp.mkdirSync("meese-cli-jest");
		options = utils.resolveOptions(utils.createOptions({ root }), {});

		fs.ensureDirSync(fname("dist/wallpapers/Wallpapers"));
		fs.writeFileSync(fname("dist/wallpapers/Wallpapers/plain.png"), "image");
		fs.writeFileSync(fname("dist/meeseOS.css"), "body{}");
		fs.writeFileSync(fname("dist/meeseOS.css.map"), "{}");
		fs.writeJsonSync(fname("dist/metadata.json"), []);
		fs.writeFileSync(fname("dist/index.html"), "<html></html>");
	});

	afterEach(() => fs.removeSync(root));

	test("lists files with their size and modification time", async () => {
		await run();

		expect(manifest()).toContainEqual(
			expect.objectContaining({
				path: "/wallpapers/Wallpapers/plain.png",
				size: 5,
				mtime: expect.any(String),
			})
		);
	});

	test("follows symlinked package directories", async () => {
		const external = temp.mkdirSync("meese-cli-jest-pkg");
		fs.writeFileSync(path.join(external, "main.js"), "console.log(1);");
		fs.ensureDirSync(fname("dist/apps"));
		fs.symlinkSync(external, fname("dist/apps/Linked"));

		await run();

		expect(paths()).toContain("/apps/Linked/main.js");

		fs.removeSync(external);
	});

	test("excludes source maps and build metadata by default", async () => {
		await run();

		expect(paths()).not.toContain("/meeseOS.css.map");
		expect(paths()).not.toContain("/metadata.json");
		expect(paths()).not.toContain("/index.html");
		expect(paths()).toContain("/meeseOS.css");
	});

	test("includes excluded files when --all is passed", async () => {
		await run({ all: true });

		expect(paths()).toContain("/meeseOS.css.map");
		expect(paths()).toContain("/metadata.json");
	});

	test("never lists the manifest it just wrote", async () => {
		await run();
		await run();

		expect(paths()).not.toContain("/vfs-manifest.json");
	});

	test("sorts entries so the output is stable across builds", async () => {
		await run();

		const listed = paths();
		expect(listed).toEqual([...listed].sort((a, b) => a.localeCompare(b)));
	});

	test("writes to the path given by --output", async () => {
		await run({ output: fname("custom-manifest.json") });

		expect(fs.existsSync(fname("custom-manifest.json"))).toBe(true);
	});

	test("rejects when the dist directory is missing", async () => {
		fs.removeSync(fname("dist"));

		await expect(run()).rejects.toThrow("does not exist");
	});
});
