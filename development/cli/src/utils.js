/**
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2020, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

const fs = require("fs-extra");
const globby = require("globby");
const path = require("path");
const { spawn } = require("child_process");
const commander = require("commander");
const { createPath } = require("../src/createPath.js");

const npmPackages = async (root) => {
	const globs = await globby(root.replace(/\\/g, "/") + "/**/package.json", {
		deep: 3,
	});
	const metafilename = (dir) => path.resolve(dir, "metadata.json");

	const promises = globs.map((filename) =>
		fs
			.readJson(filename)
			.then((json) => ({ filename: path.dirname(filename), json }))
	);

	const results = await Promise.all(promises);

	const packages = results.filter(
		({ json }) => Boolean(json.meeseOS) && json.meeseOS.type === "package"
	);

	const list = await Promise.all(
		packages.map(({ filename, json }) =>
			fs
				.readJson(metafilename(filename))
				.then((meta) => ({ meta, filename, json }))
				.catch((error) => console.warn(error))
		)
	);

	return list.filter((res) => Boolean(res));
};

const spawnAsync = (cmd, args, options) =>
	new Promise((resolve, reject) => {
		const child = spawn(
			cmd,
			args,
			{

				stdio: ["pipe", process.stdout, process.stderr],
				...options || {}
			}
		);
		child.on("close", (code) => (code ? reject(code) : resolve(true)));
	});

const loadTasks = async (defaults, includes, options) => {
	const tasks = { ...defaults };
	const promises = includes.map((fn) => fn(options));
	const results = await Promise.all(promises);

	return results.reduce((list, iter) => {
		return { ...list, ...iter };
	}, tasks);
};

const createOptions = (options) => ({
	production: Boolean((process.env.NODE_ENV || "development").match(/^prod/)),
	cli: createPath(options.root, "src/cli"),
	npm: createPath(options.root, "package.json"),
	packages: createPath(options.root, "packages.json"),
	config: {
		tasks: [],
		discover: [],
		disabled: [],
	},
	dist: () => {
		const root = commander.dist
			? createPath(commander.dist)
			: createPath(options.root, "dist");

		return {
			root,
			themes: createPath(root, "themes"),
			icons: createPath(root, "icons"),
			// TODO: Make these two output to a single directory, not nested and capitalized;
			// Is it maybe the metadata title that creates the additional file?
			sounds: createPath(root, "sounds"),
			wallpapers: createPath(root, "wallpapers"),
			packages: createPath(root, "apps"),
			metadata: createPath(root, "metadata.json"),
		};
	},
	...options,
});

const resolveOptions = (options, include) => {
	const newOptions = { ...options };

	const config = {
		discover: [createPath(newOptions.root, "node_modules")],
		...newOptions.config,
		...include,
	};

	newOptions.config = config;
	newOptions.config.discover = [
		createPath(newOptions.root, "node_modules"),
		...newOptions.config.discover,
	].map((d) => createPath(d));

	return newOptions;
};

module.exports = {
	resolveOptions,
	createOptions,
	npmPackages,
	spawnAsync,
	loadTasks,
};
