import * as vfs from "../../src/utils/vfs";

/**
 * Converts an ArrayBuffer to a string
 * @param {ArrayBuffer} ab The ArrayBuffer to convert
 * @returns {String}
 */
const ab2str = (ab) =>
	String.fromCharCode.apply(null, new Uint16Array(ab));

/**
 * Converts a string to an ArrayBuffer
 * @param {String} str The string to convert
 * @returns {ArrayBuffer}
 */
const str2ab = (str) => {
	const buffer = new ArrayBuffer(str.length * 2);
	const bufferView = new Uint16Array(buffer);
	for (let i = 0, strLen = str.length; i < strLen; i++) {
		bufferView[i] = str.charCodeAt(i);
	}

	return buffer;
};

/**
 * Converts a blob to a string
 * @param {Blob} blob The blob to convert
 * @returns {String}
 */
const blob2str = (blob) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = (err) => reject(err);
		reader.readAsText(blob);
	});

describe("utils.vfs#parentDirectory", () => {
	const check = (s) => vfs.parentDirectory(s);

	test("Should remove slashes", () =>
		expect(check("foo://///")).toEqual("foo:/"));
	test("Should get parent directory", () =>
		expect(check("foo:/bar")).toEqual("foo:/"));
	test("Should get nested parent directory", () =>
		expect(check("foo:/bar/baz")).toEqual("foo:/bar/"));
	test("Should get multi-level nested parent directory", () =>
		expect(check("foo:/bar/baz/jazz")).toEqual("foo:/bar/baz/"));
});

describe("utils.vfs#transformReaddir", () => {
	const root = "foo:/bar/";

	const input = [
		{
			isDirectory: false,
			isFile: true,
			path: "foo:/bar/.dotfile",
			filename: ".dotfile",
			mime: "text/plain",
			size: 123,
		},
		{
			isDirectory: true,
			isFile: false,
			path: "foo:/bar/directory",
			filename: "directory",
			mime: null,
			size: 0,
		},
		{
			isDirectory: true,
			isFile: false,
			path: "foo:/bar/xdirectory",
			filename: "xdirectory",
			mime: null,
			size: 0,
		},
		{
			isDirectory: false,
			isFile: true,
			path: "foo:/bar/file",
			filename: "file",
			mime: "text/plain",
			size: 123,
		},
		{
			isDirectory: false,
			isFile: true,
			path: "foo:/bar/xfile",
			filename: "xfile",
			mime: "text/plain",
			size: 666,
		},
	];

	const check = (options = {}) =>
		vfs.transformReaddir({ path: root }, input, options);
	const checkMap = (options = {}, key = "filename") =>
		check(options).map((iter) => iter[key]);

	test("Should add parent directory", () => {
		expect(
			check({
				showHiddenFiles: true,
			})[0]
		).toEqual({
			isDirectory: true,
			isFile: false,
			path: "foo:/",
			filename: "..",
			mime: null,
			size: 0,
			humanSize: "0 B",
			stat: {},
		});
	});

	test("Should remove dotfiles", () => {
		expect(
			checkMap({
				showHiddenFiles: false,
			})
		).toEqual(["..", "directory", "xdirectory", "file", "xfile"]);
	});

	test("Should sort by descending order", () => {
		const result = checkMap({
			showHiddenFiles: false,
			sortDir: "desc",
		});

		return expect(result).toEqual([
			"..",
			"xdirectory",
			"directory",
			"xfile",
			"file",
		]);
	});

	test("Should sort by ascending order", () => {
		const result = checkMap({
			showHiddenFiles: false,
			sortDir: "invalid-will-be-asc",
		});

		return expect(result).toEqual([
			"..",
			"directory",
			"xdirectory",
			"file",
			"xfile",
		]);
	});

	test("Should sort by specified column", () => {
		const result = checkMap(
			{
				showHiddenFiles: true,
				sortDir: "desc",
				sortBy: "size",
			},
			"size"
		);

		const every = [0, 0, 0, 123, 123, 666].every(
			(str, index) => result[index] === str
		);

		expect(every).toEqual(true);
	});
});

describe("utils.vfs#getFileIcon", () => {
	const fn = vfs.getFileIcon({
		"^text/*": { name: "text" },
		"^application": { name: "application" },
		"foo/bar": { name: "foo" },
	});

	test("Should match whildchar", () =>
		expect(fn({ mime: "text/plain" })).toEqual({ name: "text" }));

	test("Should match regexp", () =>
		expect(fn({ mime: "application/foo" })).toEqual({ name: "application" }));

	test("Should match plain", () =>
		expect(fn({ mime: "foo/bar" })).toEqual({ name: "foo" }));
});

describe("utils.vfs#createFileIter", () => {
	test("Should create a new iter", () => {
		return expect(vfs.createFileIter()).toEqual({
			isDirectory: false,
			isFile: true,
			mime: "application/octet-stream",
			icon: null,
			size: -1,
			path: null,
			filename: null,
			label: null,
			stat: {},
			id: null,
			parent_id: null,
		});
	});
});

describe("utils.vfs#humanFileSize", () => {
	const check = (s, i, si) => vfs.humanFileSize(Math.pow(s, i), si);

	test("Should return in B-s", () => expect(check(1, 1, true)).toBe("1 B"));
	test("Should return in B-s for 0 bytes", () => expect(check(1)).toBe("0 B"));

	test("Should return in KiB-s", () => expect(check(1024, 1)).toBe("1.0 KiB"));
	test("Should return in MiB-s", () => expect(check(1024, 2)).toBe("1.0 MiB"));
	test("Should return in GiB-s", () => expect(check(1024, 3)).toBe("1.0 GiB"));
	test("Should return in TiB-s", () => expect(check(1024, 4)).toBe("1.0 TiB"));
	test("Should return in PiB-s", () => expect(check(1024, 5)).toBe("1.0 PiB"));
	test("Should return in EiB-s", () => expect(check(1024, 6)).toBe("1.0 EiB"));
	test("Should return in ZiB-s", () => expect(check(1024, 7)).toBe("1.0 ZiB"));
	test("Should return in YiB-s", () => expect(check(1024, 8)).toBe("1.0 YiB"));

	test("Should return in K-s", () =>
		expect(check(1024, 1, true)).toBe("1.0 kB"));
	test("Should return in M-s", () =>
		expect(check(1024, 2, true)).toBe("1.0 MB"));
	test("Should return in G-s", () =>
		expect(check(1024, 3, true)).toBe("1.1 GB"));
	test("Should return in T-s", () =>
		expect(check(1024, 4, true)).toBe("1.1 TB"));
	test("Should return in P-s", () =>
		expect(check(1024, 5, true)).toBe("1.1 PB"));
	test("Should return in E-s", () =>
		expect(check(1024, 6, true)).toBe("1.2 EB"));
	test("Should return in Z-s", () =>
		expect(check(1024, 7, true)).toBe("1.2 ZB"));
	test("Should return in Y-s", () =>
		expect(check(1024, 8, true)).toBe("1.2 YB"));
});

describe("utils.vfs#transformArrayBuffer", () => {
	const testText = "foo";
	const testAb = str2ab(testText);
	const testAbString = ab2str(testAb);
	const create = (type) => vfs.transformArrayBuffer(testAb, "text/plain", type);

	test("Should create string", () =>
		create("string")
			.then((result) => result.replace(/\0/g, ""))
			.then((result) => expect(result).toBe(testText)));

	test("Should create data url", async () => {
		const result = await create("uri");
		const index = [
			"data:text/plain;charset=undefined,f%00o%00o%00",
			"data:text/plain;base64,ZgBvAG8A",
		].indexOf(result);

		expect(index).not.toBe(-1);
	});

	test("Should create blob", () =>
		create("blob")
			.then(blob2str)
			.then((result) => result.replace(/\0/g, ""))
			.then((result) => expect(result).toBe(testText)));

	test("Should create arraybuffer (default)", () =>
		create("arraybuffer")
			.then(ab2str)
			.then((result) => expect(result).toBe(testAbString)));
});

describe("utils.vfs#basename", () => {
	test("Should resolve", () => {
		expect(vfs.basename("home:/foo/bar")).toBe("bar");
	});
});

describe("utils.vfs#pathname", () => {
	test("Should resolve", () => {
		expect(vfs.pathname("home:/foo/bar")).toBe("home:/foo");
		expect(vfs.pathname("home:/foo")).toBe("home:/");
		expect(vfs.pathname("home:/")).toBe("home:/");
	});
});

describe("utils.vfs#pathJoin", () => {
	test("Should join paths", () => {
		expect(vfs.pathJoin("/foo", "bar")).toBe("/foo/bar");
		expect(vfs.pathJoin("foo", "bar")).toBe("foo/bar");
		expect(vfs.pathJoin("foo/", "bar")).toBe("foo/bar");
		expect(vfs.pathJoin("foo", "/bar")).toBe("foo/bar");
		expect(vfs.pathJoin("foo", "bar/")).toBe("foo/bar");
		expect(vfs.pathJoin("home:/", "foo", "bar")).toBe("home:/foo/bar");
	});
});

describe("utils.vfs#parseMountpointPrefix", () => {
	test("Should match on valid", () => {
		expect(vfs.parseMountpointPrefix("home:/")).toBe("home");
		expect(vfs.parseMountpointPrefix("home://")).toBe("home");
		expect(vfs.parseMountpointPrefix("home:://")).toBe("home");
		expect(vfs.parseMountpointPrefix("home:dir:/")).toBe("home");
		expect(vfs.parseMountpointPrefix("home-dir:/")).toBe("home-dir");
		expect(vfs.parseMountpointPrefix("home-dir:/")).toBe("home-dir");
		expect(vfs.parseMountpointPrefix("home-dir_long:/")).toBe("home-dir_long");
		expect(vfs.parseMountpointPrefix("999:/")).toBe("999");
	});

	test("Should fail on valid", () => {
		expect(vfs.parseMountpointPrefix(":dir:/")).toBeUndefined();
		expect(vfs.parseMountpointPrefix("invalid.:/")).toBeUndefined();
		expect(vfs.parseMountpointPrefix("invalid@:/")).toBeUndefined();
		expect(vfs.parseMountpointPrefix("invalid/:/")).toBeUndefined();
	});
});

describe("utils.vfs#filterMountByGroups", () => {
	test("Should be true", () => {
		expect(vfs.filterMountByGroups([])([])).toBe(true);
		expect(vfs.filterMountByGroups([])(null)).toBe(true);
		expect(vfs.filterMountByGroups(["a"])(["a"])).toBe(true);
		expect(vfs.filterMountByGroups(["a", "b"])(["a"])).toBe(true);

		expect(vfs.filterMountByGroups(["a"])(["a"], false)).toBe(true);
		expect(vfs.filterMountByGroups(["a", "b"])(["a"], false)).toBe(true);
		expect(vfs.filterMountByGroups(["a"])(["a", "b"], false)).toBe(true);
	});

	test("Should be false", () => {
		expect(vfs.filterMountByGroups([])(["a"])).toBe(false);
		expect(vfs.filterMountByGroups(["a"])(["a", "b"])).toBe(false);
		expect(vfs.filterMountByGroups(["b"])(["a"], false)).toBe(false);
	});
});
