import adapter from "../../../src/adapters/vfs/static.js";

const MANIFEST = [
	{ path: "/wallpapers/Wallpapers/plain.png", size: 100, mtime: "2026-01-01T00:00:00Z" },
	{ path: "wallpapers/Wallpapers/matrix.png", size: 200 },
	{ path: "/themes/StandardTheme/main.css", size: 50 },
];

const CONTENTS = { "/base/wallpapers/Wallpapers/plain.png": "PNGDATA" };

const file = (path) => ({ path });
const names = (list) => list.map((item) => item.filename).sort();

const core = {
	url: (endpoint) => "/base" + String(endpoint).replace(/^\/?/, "/"),
	config: (_key, fallback) => fallback,
};

const mountpoint = { name: "meeseOS", attributes: {} };

let vfs;

describe("VFS static adapter", () => {
	beforeEach(async () => {
		global.fetch = (url) => {
			if (url === "/base/vfs-manifest.json") {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () => Promise.resolve(MANIFEST),
				});
			}

			if (CONTENTS[url] !== undefined) {
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: { get: () => "image/png" },
					arrayBuffer: () =>
						Promise.resolve(Uint8Array.from(Buffer.from(CONTENTS[url])).buffer),
				});
			}

			return Promise.resolve({ ok: false, status: 404, statusText: "Not Found" });
		};

		vfs = adapter(core);
		await vfs.mount({}, mountpoint);
	});

	describe("mount", () => {
		test("rejects when the manifest cannot be loaded", async () => {
			global.fetch = () => Promise.resolve({ ok: false, status: 404 });

			await expect(adapter(core).mount({}, mountpoint)).rejects.toThrow(
				"Failed to load the VFS manifest"
			);
		});
	});

	describe("readdir", () => {
		test("infers top-level directories from the manifest", async () => {
			expect(names(await vfs.readdir(file("meeseOS:/")))).toEqual([
				"themes",
				"wallpapers",
			]);
		});

		test("infers nested directories from the manifest", async () => {
			expect(names(await vfs.readdir(file("meeseOS:/wallpapers")))).toEqual([
				"Wallpapers",
			]);
		});

		test("treats a leading slash in manifest paths as optional", async () => {
			expect(
				names(await vfs.readdir(file("meeseOS:/wallpapers/Wallpapers")))
			).toEqual(["matrix.png", "plain.png"]);
		});

		test("rejects when the path is a file", async () => {
			await expect(
				vfs.readdir(file("meeseOS:/themes/StandardTheme/main.css"))
			).rejects.toThrow("Not a directory");
		});
	});

	describe("stat", () => {
		test("reports the size recorded in the manifest", async () => {
			const stat = await vfs.stat(file("meeseOS:/wallpapers/Wallpapers/plain.png"));

			expect(stat.size).toBe(100);
			expect(stat.isFile).toBe(true);
			expect(stat.mime).toBe("image/png");
		});

		test("marks inferred parents as directories", async () => {
			expect((await vfs.stat(file("meeseOS:/wallpapers"))).isDirectory).toBe(
				true
			);
		});

		test("rejects for an unlisted path", async () => {
			await expect(vfs.stat(file("meeseOS:/nope.png"))).rejects.toThrow(
				"No such file or directory"
			);
		});
	});

	describe("exists", () => {
		test("is true for a manifest entry", async () => {
			expect(
				await vfs.exists(file("meeseOS:/themes/StandardTheme/main.css"))
			).toBe(true);
		});

		test("is false for an unlisted path", async () => {
			expect(await vfs.exists(file("meeseOS:/nope.png"))).toBe(false);
		});
	});

	describe("url", () => {
		test("resolves to the origin rather than a blob URL", async () => {
			expect(
				await vfs.url(file("meeseOS:/wallpapers/Wallpapers/plain.png"))
			).toBe("/base/wallpapers/Wallpapers/plain.png");
		});
	});

	describe("readfile", () => {
		test("fetches the contents from the origin", async () => {
			const result = await vfs.readfile(
				file("meeseOS:/wallpapers/Wallpapers/plain.png")
			);

			expect(Buffer.from(result.body).toString()).toBe("PNGDATA");
			expect(result.mime).toBe("image/png");
		});

		test("rejects when the origin returns an error", async () => {
			await expect(
				vfs.readfile(file("meeseOS:/wallpapers/Wallpapers/matrix.png"))
			).rejects.toThrow("Failed to read");
		});

		test("rejects for a directory", async () => {
			await expect(vfs.readfile(file("meeseOS:/themes"))).rejects.toThrow(
				"Is a directory"
			);
		});
	});

	describe("search", () => {
		test("matches a glob across the tree", async () => {
			expect(names(await vfs.search(file("meeseOS:/"), "*.png"))).toEqual([
				"matrix.png",
				"plain.png",
			]);
		});

		test("is scoped to the given root", async () => {
			expect(names(await vfs.search(file("meeseOS:/themes"), "*"))).toEqual([
				"StandardTheme",
				"main.css",
			]);
		});
	});

	describe("mutating operations", () => {
		test.each([
			["writefile", () => vfs.writefile(file("meeseOS:/a.txt"), new Blob(["a"]))],
			["mkdir", () => vfs.mkdir(file("meeseOS:/a"))],
			["unlink", () => vfs.unlink(file("meeseOS:/themes"))],
			["rename", () => vfs.rename(file("meeseOS:/a"), file("meeseOS:/b"))],
			["copy", () => vfs.copy(file("meeseOS:/a"), file("meeseOS:/b"))],
			["touch", () => vfs.touch(file("meeseOS:/a.txt"))],
			["archive", () => vfs.archive([], {})],
		])("rejects %s as read-only", async (_name, operation) => {
			await expect(operation()).rejects.toThrow("Read-only filesystem");
		});
	});
});
