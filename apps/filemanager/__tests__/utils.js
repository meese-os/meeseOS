import {
	collectDroppedFiles,
	divertDropAction,
	normalizeRelativePath,
	supportsDirectoryUpload,
	triggerBrowserDirectoryUpload,
} from "../src/utils.js";

describe("file manager upload utilities", () => {
	test("keeps internal VFS drops on the virtual path", () => {
		const browser = jest.fn();
		const virtual = jest.fn();
		const data = { path: "home:/source.txt", filename: "source.txt" };

		divertDropAction(browser, virtual)(
			{ dataTransfer: { items: [{ kind: "string" }] } },
			data,
			[]
		);

		expect(virtual).toHaveBeenCalledWith(data);
		expect(browser).not.toHaveBeenCalled();
	});

	test("normalizes safe relative paths and rejects traversal", () => {
		expect(normalizeRelativePath("folder\\nested/file.txt")).toBe(
			"folder/nested/file.txt"
		);
		expect(normalizeRelativePath("../file.txt")).toBeNull();
		expect(normalizeRelativePath("/absolute/file.txt")).toBeNull();
		expect(normalizeRelativePath("C:/absolute/file.txt")).toBeNull();
		expect(normalizeRelativePath("folder//file.txt")).toBeNull();
	});

	test("reads every directory entry batch", async () => {
		const file = { name: "file.txt", size: 3 };
		let readCount = 0;
		const entry = {
			isDirectory: true,
			name: "root",
			createReader: () => ({
				readEntries: (resolve) => {
					readCount++;
					resolve(readCount === 1
						? [{
							isFile: true,
							name: file.name,
							file: (resolveFile) => resolveFile(file),
						}]
						: []);
				},
			}),
		};
		const item = { kind: "file", webkitGetAsEntry: () => entry };

		expect(await collectDroppedFiles([item])).toEqual([
			{ directory: "root" },
			{ file, path: "root/file.txt" },
		]);
		expect(readCount).toBe(2);
	});

	test("does not expose directory picker when unsupported", () => {
		global.document = {
			createElement: () => ({})
		};
		expect(supportsDirectoryUpload()).toBe(false);
		expect(triggerBrowserDirectoryUpload(jest.fn())).toBe(false);
	});

	test("configures a directory picker when supported", () => {
		const field = {
			files: [{ name: "file.txt", webkitRelativePath: "folder/file.txt" }],
			click: jest.fn(),
			webkitdirectory: false,
		};
		global.document = {
			createElement: () => field,
		};
		const callback = jest.fn();

		expect(triggerBrowserDirectoryUpload(callback)).toBe(true);
		expect(field.webkitdirectory).toBe(true);
		expect(field.multiple).toBe(true);
		field.onchange();
		expect(callback).toHaveBeenCalledWith(field.files);
	});
});
