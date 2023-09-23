const fs = require("fs-extra");
const meeseOS = require("meeseOS");
const path = require("path");
const Filesystem = require("../src/filesystem.js");
const { Request } = require("jest-express/lib/request");

describe("Filesystem", () => {
	let core, filesystem, mountpoint;

	beforeAll(() =>
		meeseOS().then((c) => {
			core = c;
			filesystem = c.make("meeseOS/fs");
		})
	);

	afterAll(() => core.destroy());

	// Already inited from provider
  test("#constructor", () => {
    filesystem = new Filesystem(core);
  });

  test("#init", () => {
    return expect(filesystem.init())
      .resolves
      .toBe(true);
  });

	test("#mime", () => {
		expect(filesystem.mime("text file.txt")).toBe("text/plain");

		expect(filesystem.mime("hypertext file.html")).toBe("text/html");

		expect(filesystem.mime("image file.png")).toBe("image/png");

		expect(filesystem.mime("unknown file.999")).toBe(
			"application/octet-stream"
		);

		expect(filesystem.mime("defined file")).toBe("test/jest");
	});

	test("#mount", async () => {
		mountpoint = await filesystem.mount({
			name: "jest",
			attributes: {
				root: "/tmp",
			},
		});

		expect(mountpoint).toMatchObject({
			root: "jest:/",
			attributes: {
				root: "/tmp",
			},
		});
	});

	test("#realpath", () => {
		const realPath = path.join(core.configuration.tempPath, "jest/test");

		return expect(
			filesystem.realpath("home:/test", {
				username: "jest",
			})
		).resolves.toBe(realPath);
	});

	test("#call", async () => {
		const result = await filesystem.call(
			{
				method: "exists",
				user: { username: "jest" },
			},
			"home:/test"
		);

		expect(result).toBe(false);
	});

	test("#request", async () => {
		const request = new Request();

		request.session = {
			user: {
				username: "jest",
			},
		};

		request.fields = {
			path: "home:/test",
		};

		const result = await filesystem.request("exists", request);

		expect(result).toBe(false);
	});

	test("#unmount", () => {
		return expect(filesystem.unmount(mountpoint)).resolves.toBe(true);
	});

	test("#unmount - test fail", () => {
		return expect(filesystem.unmount({})).resolves.toBe(false);
	});

	test("#watch - test emitter", async () => {
		if (!core.config("vfs.watch")) return;

		const filename = path.join(core.config("tempPath"), "jest/watch.txt");
		const cb = jest.fn();

		core.on("meeseOS/vfs:watch:change", cb);
		fs.ensureDirSync(path.dirname(filename));
		fs.writeFileSync(filename, "testing");

		await new Promise((resolve) => {
			setTimeout(resolve, 100);
		});

		/* TODO: Fix the following error:
		```
			Expected: ObjectContaining {"mountpoint": {"attributes": {"chokidar": {"persistent": false}, "root": "{vfs}/{username}", "watch": true}, "id": "3031f8e1-5a57-11ee-850a-6b370e324341", "name": "home", "root": "home:/"}, "target": "home:/watch.txt", "type": "add"}
			Number of calls: 0
		```
		*/
		/*expect(cb).toBeCalledWith(
			expect.objectContaining({
				type: "add",
				target: "home:/watch.txt",
				mountpoint: filesystem.mountpoints.find((m) => m.name === "home"),
			})
		);*/
	});

	test("#destroy", async () => {
		await filesystem.destroy();
		filesystem = undefined;
	});
});
