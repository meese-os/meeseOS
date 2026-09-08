import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import adapter from "../../../src/adapters/vfs/indexeddb.js";

const file = (path) => ({ path });
const names = (list) => list.map((item) => item.filename).sort();
const text = async (result) =>
	Buffer.from(await result.body).toString();

let vfs;

describe("VFS indexeddb adapter", () => {
	beforeEach(async () => {
		// NOTE: A fresh factory per test isolates the backing database
		globalThis.indexedDB = new IDBFactory();
		vfs = adapter({}, {});
		await vfs.mount();
	});

	describe("readdir", () => {
		test("returns an empty list for an unwritten mount root", async () => {
			expect(await vfs.readdir(file("home:/"))).toEqual([]);
		});

		test("lists the direct children of a directory", async () => {
			await vfs.writefile(file("home:/a.txt"), new Blob(["a"]));
			await vfs.writefile(file("home:/nested/b.txt"), new Blob(["b"]));

			expect(names(await vfs.readdir(file("home:/")))).toEqual([
				"a.txt",
				"nested",
			]);
		});

		test("rejects when the path is a file", async () => {
			await vfs.writefile(file("home:/a.txt"), new Blob(["a"]));

			await expect(vfs.readdir(file("home:/a.txt"))).rejects.toThrow(
				"Not a directory"
			);
		});

		test("rejects when the directory does not exist", async () => {
			await expect(vfs.readdir(file("home:/missing"))).rejects.toThrow(
				"No such file or directory"
			);
		});
	});

	describe("writefile and readfile", () => {
		test("round-trips content and returns the byte size", async () => {
			const size = await vfs.writefile(
				file("home:/notes.txt"),
				new Blob(["hello world"])
			);

			expect(size).toBe(11);
			expect(await text(await vfs.readfile(file("home:/notes.txt")))).toBe(
				"hello world"
			);
		});

		test("resolves the MIME type from the extension", async () => {
			await vfs.writefile(file("home:/notes.txt"), new Blob(["a"]));

			expect((await vfs.readfile(file("home:/notes.txt"))).mime).toBe(
				"text/plain"
			);
		});

		test("creates missing parent directories", async () => {
			await vfs.writefile(
				file("home:/.desktop/.shortcuts.json"),
				new Blob(["[]"])
			);

			expect((await vfs.stat(file("home:/.desktop"))).isDirectory).toBe(true);
		});

		test("preserves the original ctime when overwriting", async () => {
			await vfs.writefile(file("home:/notes.txt"), new Blob(["one"]));
			const created = (await vfs.stat(file("home:/notes.txt"))).stat.ctime;

			await vfs.writefile(file("home:/notes.txt"), new Blob(["two"]));

			expect((await vfs.stat(file("home:/notes.txt"))).stat.ctime).toEqual(
				created
			);
		});

		test("rejects when the target is a directory", async () => {
			await vfs.mkdir(file("home:/docs"));

			await expect(
				vfs.writefile(file("home:/docs"), new Blob(["a"]))
			).rejects.toThrow("Is a directory");
		});

		test("rejects reading a directory", async () => {
			await vfs.mkdir(file("home:/docs"));

			await expect(vfs.readfile(file("home:/docs"))).rejects.toThrow(
				"Is a directory"
			);
		});
	});

	describe("path normalization", () => {
		test("collapses redundant separators and parent segments", async () => {
			await vfs.writefile(file("home://a//b/../c.txt"), new Blob(["x"]));

			expect(await vfs.exists(file("home:/a/c.txt"))).toBe(true);
			expect(await vfs.exists(file("home:/a/./c.txt"))).toBe(true);
		});

		test("keeps mountpoints isolated from one another", async () => {
			await vfs.writefile(file("home:/a.txt"), new Blob(["a"]));
			await vfs.writefile(file("meeseOS:/b.txt"), new Blob(["b"]));

			expect(names(await vfs.readdir(file("home:/")))).toEqual(["a.txt"]);
			expect(names(await vfs.readdir(file("meeseOS:/")))).toEqual(["b.txt"]);
		});
	});

	describe("mkdir", () => {
		test("creates a directory", async () => {
			await vfs.mkdir(file("home:/docs"));

			expect((await vfs.stat(file("home:/docs"))).isDirectory).toBe(true);
		});

		test("rejects when the path already exists", async () => {
			await vfs.mkdir(file("home:/docs"));

			await expect(vfs.mkdir(file("home:/docs"))).rejects.toThrow("File exists");
		});
	});

	describe("touch", () => {
		test("creates an empty file when absent", async () => {
			await vfs.touch(file("home:/empty.txt"));

			expect((await vfs.stat(file("home:/empty.txt"))).size).toBe(0);
		});

		test("bumps mtime on an existing file", async () => {
			await vfs.writefile(file("home:/notes.txt"), new Blob(["a"]));
			const before = (await vfs.stat(file("home:/notes.txt"))).stat.mtime;

			await new Promise((resolve) => setTimeout(resolve, 5));
			await vfs.touch(file("home:/notes.txt"));

			expect(
				(await vfs.stat(file("home:/notes.txt"))).stat.mtime.getTime()
			).toBeGreaterThan(before.getTime());
		});
	});

	describe("copy", () => {
		test("duplicates a subtree and leaves the source in place", async () => {
			await vfs.writefile(file("home:/docs/deep/one.txt"), new Blob(["1"]));

			await vfs.copy(file("home:/docs"), file("home:/backup"));

			expect(
				await text(await vfs.readfile(file("home:/backup/deep/one.txt")))
			).toBe("1");
			expect(await vfs.exists(file("home:/docs/deep/one.txt"))).toBe(true);
		});
	});

	describe("rename", () => {
		test("moves a subtree and removes the source", async () => {
			await vfs.writefile(file("home:/docs/deep/one.txt"), new Blob(["1"]));

			await vfs.rename(file("home:/docs"), file("home:/renamed"));

			expect(await vfs.exists(file("home:/renamed/deep/one.txt"))).toBe(true);
			expect(await vfs.exists(file("home:/docs"))).toBe(false);
			expect(await vfs.exists(file("home:/docs/deep/one.txt"))).toBe(false);
		});

		test("rejects moving a directory into itself", async () => {
			await vfs.mkdir(file("home:/docs"));

			await expect(
				vfs.rename(file("home:/docs"), file("home:/docs/inner"))
			).rejects.toThrow("Cannot move a directory into itself");
		});
	});

	describe("unlink", () => {
		test("removes a directory and its descendants", async () => {
			await vfs.writefile(file("home:/docs/deep/one.txt"), new Blob(["1"]));

			await vfs.unlink(file("home:/docs"));

			expect(await vfs.exists(file("home:/docs"))).toBe(false);
			expect(await vfs.exists(file("home:/docs/deep/one.txt"))).toBe(false);
		});

		test("rejects when the path does not exist", async () => {
			await expect(vfs.unlink(file("home:/missing"))).rejects.toThrow(
				"No such file or directory"
			);
		});

		test("rejects removing a mountpoint root", async () => {
			await expect(vfs.unlink(file("home:/"))).rejects.toThrow(
				"Cannot remove a mountpoint root"
			);
		});
	});

	describe("stat", () => {
		test("rejects when the path does not exist", async () => {
			await expect(vfs.stat(file("home:/missing.txt"))).rejects.toThrow(
				"No such file or directory"
			);
		});
	});

	describe("search", () => {
		beforeEach(async () => {
			await vfs.writefile(file("home:/notes.txt"), new Blob(["a"]));
			await vfs.writefile(file("home:/docs/one.txt"), new Blob(["b"]));
			await vfs.writefile(file("home:/docs/image.png"), new Blob(["c"]));
		});

		test("matches a glob across the whole tree", async () => {
			expect(names(await vfs.search(file("home:/"), "*.txt"))).toEqual([
				"notes.txt",
				"one.txt",
			]);
		});

		test("matches case-insensitively", async () => {
			expect(names(await vfs.search(file("home:/"), "NOTES"))).toEqual([
				"notes.txt",
			]);
		});

		test("is scoped to the given root", async () => {
			expect(names(await vfs.search(file("home:/docs"), "*.txt"))).toEqual([
				"one.txt",
			]);
		});
	});

	describe("archive", () => {
		test("compresses a selection and removes the originals", async () => {
			await vfs.writefile(file("home:/docs/one.txt"), new Blob(["one"]));
			await vfs.writefile(file("home:/docs/deep/two.txt"), new Blob(["two"]));

			await vfs.archive([file("home:/docs")], { action: "compress" });

			expect(await vfs.exists(file("home:/docs.zip"))).toBe(true);
			expect(await vfs.exists(file("home:/docs"))).toBe(false);
			expect(await vfs.exists(file("home:/docs/one.txt"))).toBe(false);
		});

		// NOTE: Entry names are relative to the directory holding the archive, so
		// extracting `docs.zip` into `docs/` nests the tree one level deeper than
		// it started. The server adapter behaves identically and this asserts
		// parity with it, not that the nesting is desirable.
		test("extracts entries relative to the archive directory", async () => {
			await vfs.writefile(file("home:/docs/one.txt"), new Blob(["one"]));
			await vfs.writefile(file("home:/docs/deep/two.txt"), new Blob(["two"]));

			await vfs.archive([file("home:/docs")], { action: "compress" });
			await vfs.archive([file("home:/docs.zip")], { action: "extract" });

			expect(
				await text(await vfs.readfile(file("home:/docs/docs/one.txt")))
			).toBe("one");
			expect(
				await text(await vfs.readfile(file("home:/docs/docs/deep/two.txt")))
			).toBe("two");
		});

		test("accepts the action as a bare string", async () => {
			await vfs.writefile(file("home:/one.txt"), new Blob(["one"]));

			await vfs.archive([file("home:/one.txt")], "compress");

			expect(await vfs.exists(file("home:/one.txt.zip"))).toBe(true);
		});

		test("defaults to compressing when no action is given", async () => {
			await vfs.writefile(file("home:/one.txt"), new Blob(["one"]));

			await vfs.archive([file("home:/one.txt")]);

			expect(await vfs.exists(file("home:/one.txt.zip"))).toBe(true);
		});

		test("rejects an unknown action", async () => {
			await vfs.writefile(file("home:/one.txt"), new Blob(["one"]));

			await expect(
				vfs.archive([file("home:/one.txt")], { action: "explode" })
			).rejects.toThrow("Unknown archive action");
		});

		test("rejects an empty selection", async () => {
			await expect(vfs.archive([], { action: "compress" })).rejects.toThrow(
				"Nothing selected to archive"
			);
		});

		test("rejects extracting a directory", async () => {
			await vfs.mkdir(file("home:/docs"));

			await expect(
				vfs.archive([file("home:/docs")], { action: "extract" })
			).rejects.toThrow("Is a directory");
		});
	});
});
