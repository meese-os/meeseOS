import { ServiceProvider } from "@meeseOS/common";
import { createInstance } from "meeseOS";
import Search from "../src/search.js";

const files = [{
	path: "jest:/test.txt",
	filename: "test.txt"
}, {
	path: "jest:/foo/bar.baz",
	filename: "bar.baz"
}, {
	path: "jest:/hello.world",
	filename: "hello.world"
}];

class MockVFSServiceProvider extends ServiceProvider {
	init() {
		this.core.singleton("meeseOS/vfs", () => ({
			search: async (root, pattern) => {
				return files.filter((f) => f.filename.includes(pattern));
			}
		}));

		this.core.singleton("meeseOS/fs", () => ({
			mountpoints: () => [{
				name: "jest"
			}]
		}));
	}

	provides() {
		return [
			"meeseOS/vfs",
			"meeseOS/fs"
		];
	}
}

class MySearchAdapter {
	constructor(core) {
		this.core = core;
	}

	async init() { }

	destroy() { }

	async search() {
		return [{
			path: "jest:/test.jpg",
			filename: "test.jpg"
		}];
	}
}

describe("Search", () => {
	let core;
	let search;

	beforeAll(() => createInstance((c) => {
		c.register(MockVFSServiceProvider);
	}).then(c => core = c));

	afterAll(() => core.destroy());

	test("#constructor", () => {
		search = new Search(core, {
			adapters: [MySearchAdapter],
		});
	});

	test("#search", () => {
		return search.search("hello")
			.then((results) => {
				expect(results).toMatchObject([
					{
						path: "jest:/hello.world",
						filename: "hello.world",
					},
					{
						path: "jest:/test.jpg",
						filename: "test.jpg",
					},
				]);
			});
	});
});
