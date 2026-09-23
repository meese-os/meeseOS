jest.mock("dateformat", () => () => "");
jest.mock("file-type", () => ({ fileTypeFromBuffer: () => Promise.resolve(null) }), { virtual: true });

import { vfsActionFactory } from "../src/factories.js";

const createHarness = ({ writefile } = {}) => {
	const calls = [];
	const progress = {
		setProgress: jest.fn(),
		setStatus: jest.fn(),
		destroy: jest.fn(),
	};
	const dialogs = [];
	const vfs = {
		mkdir: jest.fn((...args) => {
			calls.push(["mkdir", ...args]);
			return true;
		}),
		writefile: writefile || jest.fn((...args) => {
			calls.push(["writefile", ...args]);
			return true;
		}),
	};
	const win = {
		emit: jest.fn(),
		setState: jest.fn(),
	};
	const dialog = jest.fn((name, args, callback) => {
		dialogs.push({ name, args, callback });
		if (name === "progress") return progress;
		return undefined;
	});
	const core = {
		make: jest.fn((name) => {
			if (name === "meeseOS/vfs") return vfs;
			if (name === "meeseOS/fs") {
				return { pathJoin: (...parts) => parts.join("/").replace(/\/+/g, "/") };
			}
			throw new Error(`Unexpected core service: ${name}`);
		}),
	};
	const proc = { pid: 42 };
	const state = { currentPath: { path: "home:/uploads" } };
	const actions = vfsActionFactory(core, proc, win, dialog, state);

	return { actions, calls, dialogs, dialog, progress, state, vfs, win };
};

const selectFiles = (files) => {
	let field = null;
	global.document = {
		createElement: () => {
			field = {
				files,
				click: jest.fn(),
			};
			return field;
		},
	};
	return () => field;
};

const waitFor = async (predicate) => {
	for (let attempt = 0; attempt < 20; attempt++) {
		if (predicate()) return;
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
	throw new Error("Timed out waiting for upload operation");
};

describe("vfsActionFactory browser uploads", () => {
	test("creates parent directories before sequential writes and forwards one signal", async () => {
		const getField = selectFiles([
			{ name: "one.txt", size: 3, webkitRelativePath: "root/one.txt" },
			{ name: "two.txt", size: 5, webkitRelativePath: "root/nested/two.txt" },
		]);
		const harness = createHarness();

		harness.actions.upload();
		getField().onchange();
		await waitFor(() => harness.vfs.writefile.mock.calls.length === 2);

		expect(harness.calls.map(([name]) => name)).toEqual([
			"mkdir",
			"mkdir",
			"writefile",
			"writefile",
		]);
		expect(harness.vfs.mkdir.mock.calls.map(([file]) => file.path)).toEqual([
			"home:/uploads/root",
			"home:/uploads/root/nested",
		]);
		expect(harness.vfs.writefile.mock.calls.map(([file]) => file.path)).toEqual([
			"home:/uploads/root/one.txt",
			"home:/uploads/root/nested/two.txt",
		]);
		expect(harness.vfs.writefile.mock.calls[0][2].signal).toBe(
			harness.vfs.writefile.mock.calls[1][2].signal
		);
		expect(harness.vfs.writefile.mock.calls[0][2].signal).toBeDefined();
	});

	test("cancellation during a later write preserves completed files", async () => {
		const getField = selectFiles([
			{ name: "one.txt", size: 3 },
			{ name: "two.txt", size: 5 },
		]);
		let rejectSecond = null;
		const writefile = jest.fn((file) => {
			if (file.path.endsWith("one.txt")) return Promise.resolve(true);
			return new Promise((resolve, reject) => {
				rejectSecond = reject;
			});
		});
		const harness = createHarness({ writefile });

		harness.actions.upload();
		getField().onchange();
		await waitFor(() => harness.vfs.writefile.mock.calls.length === 2);
		const signal = harness.vfs.writefile.mock.calls[1][2].signal;
		const progressDialog = harness.dialogs.find(({ name }) => name === "progress");

		progressDialog.callback("progress");
		expect(signal.aborted).toBe(false);
		progressDialog.callback({ name: "DESTROY" });
		expect(signal.aborted).toBe(true);
		rejectSecond(new DOMException("The operation was aborted.", "AbortError"));
		await waitFor(() => harness.progress.destroy.mock.calls.length === 1);

		expect(harness.win.emit).toHaveBeenCalledWith(
			"filemanager:navigate",
			{ path: "home:/uploads" },
			undefined,
			"one.txt"
		);
		expect(harness.dialog).not.toHaveBeenCalledWith(
			"error",
			expect.anything(),
			expect.anything()
		);
	});

	test("keeps the upload destination stable if navigation changes mid-upload", async () => {
		const getField = selectFiles([
			{ name: "one.txt", size: 1 },
			{ name: "two.txt", size: 1 },
		]);
		const harness = createHarness();
		harness.vfs.writefile.mockImplementation((...args) => {
			harness.calls.push(["writefile", ...args]);
			if (harness.vfs.writefile.mock.calls.length === 1) {
				harness.state.currentPath = { path: "home:/elsewhere" };
			}
			return true;
		});

		harness.actions.upload();
		getField().onchange();
		await waitFor(() => harness.vfs.writefile.mock.calls.length === 2);

		expect(harness.vfs.writefile.mock.calls.map(([file]) => file.path)).toEqual([
			"home:/uploads/one.txt",
			"home:/uploads/two.txt",
		]);
	});

	test("reports monotonic aggregate progress without double counting", async () => {
		const getField = selectFiles([
			{ name: "one.txt", size: 10 },
			{ name: "two.txt", size: 10 },
		]);
		const harness = createHarness();
		harness.vfs.writefile.mockImplementation((_file, _data, options) => {
			options.onProgress(undefined, 50);
			return true;
		});

		harness.actions.upload();
		getField().onchange();
		await waitFor(() => harness.progress.destroy.mock.calls.length === 1);

		expect(harness.progress.setProgress.mock.calls.map(([value]) => value)).toEqual([
			0,
			25,
			50,
			75,
			100,
		]);
	});

	test("uploads an empty directory tree without requiring files", async () => {
		const harness = createHarness();
		const createEmptyDirectoryItem = (name) => ({
			kind: "file",
			webkitGetAsEntry: () => ({
				isDirectory: true,
				name,
				createReader: () => ({ readEntries: (resolve) => resolve([]) }),
			}),
		});

		harness.actions.drop(
			{
				dataTransfer: {
					items: [
						createEmptyDirectoryItem("empty-one"),
						createEmptyDirectoryItem("empty-two"),
					],
				},
			},
			undefined,
			[]
		);
		await waitFor(() => harness.vfs.mkdir.mock.calls.length === 2);

		expect(harness.vfs.mkdir.mock.calls.map(([file]) => file.path)).toEqual([
			"home:/uploads/empty-one",
			"home:/uploads/empty-two",
		]);
		expect(harness.progress.setProgress.mock.calls.map(([value]) => value)).toEqual([
			50,
			100,
		]);
		expect(harness.vfs.writefile).not.toHaveBeenCalled();
	});
});
