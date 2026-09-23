import { encodeQueryData, fetch as fetchRequest } from "../../src/utils/fetch.js";

const createResponse = () => ({
	status: 200,
	statusText: "OK",
	ok: true,
	headers: {
		get: () => "",
	},
	text: () => Promise.resolve(""),
	json: () => Promise.resolve({}),
	arrayBuffer: () => Promise.resolve(new ArrayBuffer()),
});

class MockEventTarget {
	constructor() {
		this.listeners = {};
	}

	addEventListener(name, callback) {
		this.listeners[name] = this.listeners[name] || [];
		this.listeners[name].push(callback);
	}

	removeEventListener(name, callback) {
		this.listeners[name] = (this.listeners[name] || []).filter(
			(listener) => listener !== callback
		);
	}
}

const createXhrMock = (overrides = {}) => {
	const instances = [];

	class MockXMLHttpRequest {
		constructor() {
			this.listeners = {};
			this.upload = new MockEventTarget();
			this.status = 200;
			this.statusText = "OK";
			this.response = new ArrayBuffer();
			this.responseText = "";
			this.abort = jest.fn(overrides.abort || (() => this.emit("abort")));
			this.open = jest.fn(overrides.open);
			this.send = jest.fn(overrides.send);
			this.setRequestHeader = jest.fn(overrides.setRequestHeader);
			instances.push(this);
		}

		addEventListener(name, callback) {
			this.listeners[name] = this.listeners[name] || [];
			this.listeners[name].push(callback);
		}

		removeEventListener(name, callback) {
			this.listeners[name] = (this.listeners[name] || []).filter(
				(listener) => listener !== callback
			);
		}

		emit(name, event = {}) {
			(this.listeners[name] || []).forEach((callback) => callback(event));
		}

		getResponseHeader() {
			return "";
		}
	}

	return { instances, MockXMLHttpRequest };
};

describe("fetch utilities", () => {
	const originalFetch = window.fetch;
	const originalXmlHttpRequest = window.XMLHttpRequest;

	afterEach(() => {
		window.fetch = originalFetch;
		window.XMLHttpRequest = originalXmlHttpRequest;
	});

	test("#encodeQueryData serializes non-scalar values and ignores top-level undefined", () => {
		const getter = jest.fn(() => "once");
		const data = {
			string: "hello world",
			boolean: true,
			number: 42,
			array: ["value", undefined, false],
			object: {
				present: "value",
				missing: undefined,
			},
			null: null,
			undefined: undefined,
		};
		Object.defineProperty(data, "getter", {
			enumerable: true,
			get: getter,
		});

		expect(encodeQueryData(data)).toBe(
			"string=hello%20world&boolean=true&number=42&array=%5B%22value%22%2Cnull%2Cfalse%5D&object=%7B%22present%22%3A%22value%22%2C%22missing%22%3Anull%7D&null=null&getter=once"
		);
		expect(getter).toHaveBeenCalledTimes(1);
	});

	test("#fetch omits empty GET query strings and transport-only options", async () => {
		const nativeFetch = jest.fn(() => Promise.resolve(createResponse()));
		const signal = new AbortController().signal;

		window.fetch = nativeFetch;
		await fetchRequest("/request", {
			body: { omitted: undefined },
			onProgress: jest.fn(),
			signal,
			xhr: false,
		});

		expect(nativeFetch).toHaveBeenCalledWith(
			"/request",
			expect.objectContaining({ signal })
		);
		expect(nativeFetch.mock.calls[0][1]).not.toHaveProperty("onProgress");
		expect(nativeFetch.mock.calls[0][1]).not.toHaveProperty("xhr");
	});

	test("#fetch appends GET query data before URL fragments", async () => {
		const nativeFetch = jest.fn(() => Promise.resolve(createResponse()));

		window.fetch = nativeFetch;
		await fetchRequest("/request?existing=true#fragment", {
			body: { value: "new" },
		});

		expect(nativeFetch).toHaveBeenCalledWith(
			"/request?existing=true&value=new#fragment",
			expect.any(Object)
		);
	});

	test("#fetch XHR rejects an already-aborted signal without sending", async () => {
		const { instances, MockXMLHttpRequest } = createXhrMock();
		const controller = new AbortController();

		controller.abort();
		window.XMLHttpRequest = MockXMLHttpRequest;
		const result = fetchRequest("/request", {
			signal: controller.signal,
			xhr: true,
		});

		await expect(result).rejects.toMatchObject({ name: "AbortError" });
		expect(instances).toHaveLength(0);
	});

	test("#fetch XHR aborts an active request and cleans up listeners", async () => {
		const { instances, MockXMLHttpRequest } = createXhrMock();
		const controller = new AbortController();
		const removeEventListener = jest.spyOn(
			controller.signal,
			"removeEventListener"
		);

		window.XMLHttpRequest = MockXMLHttpRequest;
		const result = fetchRequest("/request", {
			signal: controller.signal,
			xhr: true,
		});
		const request = instances[0];
		controller.abort();

		expect(request.abort).toHaveBeenCalledTimes(1);
		request.emit("load");
		await expect(result).rejects.toMatchObject({ name: "AbortError" });
		expect(removeEventListener).toHaveBeenCalledWith(
			"abort",
			expect.any(Function)
		);
		expect(request.listeners.load).toEqual([]);
		expect(request.listeners.error).toEqual([]);
		expect(request.listeners.abort).toEqual([]);
	});

	test("#fetch XHR removes its signal listener after an error", async () => {
		const { instances, MockXMLHttpRequest } = createXhrMock();
		const controller = new AbortController();
		const removeEventListener = jest.spyOn(
			controller.signal,
			"removeEventListener"
		);
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

		window.XMLHttpRequest = MockXMLHttpRequest;
		const result = fetchRequest("/request", {
			signal: controller.signal,
			xhr: true,
		});
		instances[0].emit("error");

		await expect(result).rejects.toThrow(
			"An error occured while performing XHR request"
		);
		expect(removeEventListener).toHaveBeenCalledWith(
			"abort",
			expect.any(Function)
		);
		warn.mockRestore();
	});

	test("#fetch XHR cleans up after synchronous setup errors", async () => {
		const error = new Error("Simulated send failure");
		const { instances, MockXMLHttpRequest } = createXhrMock({
			send: () => {
				throw error;
			},
		});
		const controller = new AbortController();
		const removeEventListener = jest.spyOn(
			controller.signal,
			"removeEventListener"
		);

		window.XMLHttpRequest = MockXMLHttpRequest;
		const result = fetchRequest("/request", {
			signal: controller.signal,
			xhr: true,
		});

		await expect(result).rejects.toBe(error);
		expect(removeEventListener).toHaveBeenCalledWith(
			"abort",
			expect.any(Function)
		);
		expect(instances[0].listeners.load).toEqual([]);
		expect(instances[0].listeners.error).toEqual([]);
		expect(instances[0].listeners.abort).toEqual([]);
	});

	test("#fetch XHR cleans up after timing out", async () => {
		const { instances, MockXMLHttpRequest } = createXhrMock();
		const controller = new AbortController();
		const removeEventListener = jest.spyOn(
			controller.signal,
			"removeEventListener"
		);
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

		window.XMLHttpRequest = MockXMLHttpRequest;
		const result = fetchRequest("/request", {
			signal: controller.signal,
			timeout: 1500,
			xhr: true,
		});
		expect(instances[0].timeout).toBe(1500);
		instances[0].emit("timeout");

		await expect(result).rejects.toThrow("XHR request timed out");
		expect(removeEventListener).toHaveBeenCalledWith(
			"abort",
			expect.any(Function)
		);
		expect(instances[0].listeners.timeout).toEqual([]);
		warn.mockRestore();
	});

	test("#fetch XHR cleans up upload progress listeners after loading", async () => {
		const { instances, MockXMLHttpRequest } = createXhrMock();

		window.XMLHttpRequest = MockXMLHttpRequest;
		const result = fetchRequest("/request", {
			method: "post",
			onProgress: jest.fn(),
			xhr: true,
		});
		instances[0].emit("load");

		await expect(result).resolves.toMatchObject({ ok: true });
		expect(instances[0].upload.listeners.progress).toEqual([]);
	});

	test("#fetch XHR removes its signal listener after loading", async () => {
		const { instances, MockXMLHttpRequest } = createXhrMock();
		const controller = new AbortController();
		const removeEventListener = jest.spyOn(
			controller.signal,
			"removeEventListener"
		);

		window.XMLHttpRequest = MockXMLHttpRequest;
		const result = fetchRequest("/request", {
			signal: controller.signal,
			xhr: true,
		});
		instances[0].emit("load");

		await expect(result).resolves.toMatchObject({ ok: true });
		expect(removeEventListener).toHaveBeenCalledWith(
			"abort",
			expect.any(Function)
		);
	});
});
