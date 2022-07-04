/*
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
const path = require("path");
const inquirer = require("inquirer");
const utils = require("../utils.js");
const templates = path.resolve(__dirname, "../templates");

const isWindows = /^win/.test(process.platform);
const npmBinary = isWindows ? "npm.cmd" : "npm";

const filterInput = (input) =>
	String(input)
		.replace(/[^A-z0-9_]/g, "")
		.trim();

const scaffolds = {
	auth: {
		dirname: "auth",
		title: "Authentication Adapter",
		info: `
For more information about authentication adapters, visit:
- https://manual.os-js.org/v3/tutorial/auth/
- https://manual.os-js.org/v3/guide/auth/
- https://manual.os-js.org/v3/development/
`,
	},
	settings: {
		dirname: "settings",
		title: "Settings Adapter",
		info: `
For more information about settings adapters, visit:
- https://manual.os-js.org/v3/tutorial/settings/
- https://manual.os-js.org/v3/guide/settings/
- https://manual.os-js.org/v3/development/
`,
	},
	vfs: {
		dirname: "vfs",
		title: "VFS Adapter",
		info: `
For more information about vfs adapters, visit:
- https://manual.os-js.org/v3/tutorial/vfs/
- https://manual.os-js.org/v3/guide/filesystem/
- https://manual.os-js.org/v3/development/
`,
	},
	providers: {
		dirname: "provider",
		title: "Service Provider",
		info: `
For more information about service providers, visit:
- https://manual.os-js.org/v3/tutorial/provider/
- https://manual.os-js.org/v3/guide/provider/
- https://manual.os-js.org/v3/development/
`,
	},
};

const basicScaffoldDefaults = {
	options: {
		"--force": "Force overwrite of existing target",
		"--type": "Script type: client, server",
		"--filename": "Specify name instead of using interactive wizard",
	},
};

const forceBasicScaffold = (args) =>
	args.type && args.filename
		? {
			...args,
			target: path.join("src", args.type, args.filename),
			confirm: true,
		}
		: false;

const forcePackageScaffold = (args) =>
	args.name
		? {
			...args,
			target: path.join("src", "packages", args.name),
			confirm: true,
		}
		: false;

const ask = (type, s) =>
	inquirer.prompt([
		{
			name: "type",
			message: `Select ${s.title} type`,
			type: "list",
			choices: [
				{
					name: "Client-side (ES6+)",
					value: "client",
				},
				{
					name: "Server-side (nodejs)",
					value: "server",
				},
			],
		},
		{
			name: "filename",
			message: "Name of file",
			default: `my-${s.dirname}.js`,
		},
		{
			name: "target",
			message: "Destination",
			default: (answers) => {
				return `src/${answers.type}/${type}/${answers.filename}`;
			},
		},
		{
			name: "confirm",
			type: "confirm",
			message: (answers) =>
				`Are you sure you want to write to '${answers.target}'?`,
		},
	]);

const scaffoldPackage =
	(type) =>
		async ({ logger, options, args }) => {
			const defaultName =
			type === "iframe-application" ? "MyIframeApplication" : "MyApplication";

			const additions =
			type === "iframe-application"
				? ["data/index.html"]
				: ["server.js", "index.scss"];

			const files = [
				"icon.png",
				"index.js",
				"webpack.config.js",
				"package.json",
				"metadata.json",
				...additions,
			];

			const packages = await utils.npmPackages(
				path.resolve(options.root, "node_modules")
			);

			const promises = (name, dirname, replace) =>
				files.map((filename) => {
					const source = path.resolve(templates, type, filename);
					const destination = path.resolve(dirname, filename);

					return fs.exists(destination).then((exists) => {
						if (exists && !replace) {
							logger.info("Skipping", filename);
							return true;
						}

						const binary = filename.match(/\.png$/);

						return fs
							.ensureDir(path.dirname(destination))
							.then(() => fs.readFile(source, binary ? null : "utf8"))
							.then((raw) => (binary ? raw : raw.replace(/___NAME___/g, name)))
							.then((contents) => fs.writeFile(destination, contents))
							.then(() => {
								logger.success("Wrote", destination.replace(options.root, ""));
							});
					});
				});

			const force = forcePackageScaffold(args);

			const choices =
			force ||
			(await inquirer.prompt([
				{
					name: "name",
					message: "Enter name of package ([A-z0-9_])",
					default: defaultName,
					filter: filterInput,
					validate: (input) => {
						if (input.length < 1) {
							return Promise.reject("Invalid package name");
						}

						const found = packages.find(({ meta }) => meta.name === input);
						if (found) {
							return Promise.reject(
								"A package with this name already exists..."
							);
						}

						return Promise.resolve(true);
					},
				},
				{
					name: "target",
					message: "Destination",
					default: (answers) => {
						return `src/packages/${answers.name}`;
					},
				},
				{
					name: "confirm",
					type: "confirm",
					message: (answers) =>
						`Are you sure you want to write to '${answers.target}'`,
				},
			]));

			if (!choices.confirm) {
				logger.warn("Scaffolding aborted...");
				return Promise.resolve(true);
			}

			const destination = path.resolve(options.root, choices.target);
			const exists = await fs.exists(destination);
			let replace = true;

			if (exists && !args.force) {
				logger.warn("Target directory already exists");

				const { overwrite } = await inquirer.prompt([
					{
						type: "confirm",
						name: "overwrite",
						message: "Do you want to overwrite existing directory?",
						default: false,
					},
				]);

				if (!overwrite) {
					throw new Error("Aborted by user!");
				}

				const a = await inquirer.prompt([
					{
						type: "confirm",
						name: "replace",
						message: "Do you want to overwrite existing files?",
						default: false,
					},
				]);

				replace = a.replace;
			}

			await fs.ensureDir(destination);

			return Promise.all(promises(choices.name, destination, replace))
				.then(() => logger.info("Running \"npm install\""))
				.then(() =>
					args.dry
						? false
						: utils.spawnAsync(npmBinary, ["install"], { cwd: destination })
				)
				.then(() => logger.success("...dependencies installed"))
				.then(() => logger.info("Running \"npm run build\""))
				.then(() =>
					args.dry
						? false
						: utils.spawnAsync(npmBinary, ["run", "build"], { cwd: destination })
				)
				.then(() => logger.success("...build complete"))
				.then(() => {
					logger.info("Package was generated and built.");
					logger.info("Run \"npm run package:discover\" to make it available.");

					console.log(`
For more information about packages, visit:

- https://manual.os-js.org/v3/resource/overview/
- https://manual.os-js.org/v3/tutorial/theme/
- https://manual.os-js.org/v3/development/
- https://manual.os-js.org/v3/tutorial/iframe/
      `);
				});
		};

const scaffoldBasic =
	(type) =>
		async ({ logger, options, args }) => {
			logger.info("Scaffolding", type);

			const s = scaffolds[type];
			const forced = forceBasicScaffold(args);
			const choices = forced || (await ask(type, s));

			if (!choices.confirm) {
				return logger.info("Scaffolding aborted...");
			}

			const source = path.resolve(templates, s.dirname, choices.type + ".js");
			const destination = path.resolve(options.root, choices.target);

			const exists = await fs.exists(destination);
			if (exists && !args.force) {
				throw new Error("Destination already exists!");
			}

			await fs.ensureDir(path.dirname(destination));
			const raw = await fs.readFile(source, "utf8");
			const contents = `/*${s.info}*/\n` + raw;
			await fs.writeFile(destination, contents);

			logger.success("Wrote", path.basename(destination));

			console.log(s.info);
		};

module.exports = {
	"make:auth": {
		description: "Create Authentication adapter script",
		action: scaffoldBasic("auth"),
		...basicScaffoldDefaults,
	},
	"make:settings": {
		description: "Create Settings adapter script",
		action: scaffoldBasic("settings"),
		...basicScaffoldDefaults,
	},
	"make:provider": {
		description: "Create Service provider script",
		action: scaffoldBasic("providers"),
		...basicScaffoldDefaults,
	},
	"make:vfs": {
		description: "Create VFS adapter script",
		action: scaffoldBasic("vfs"),
		...basicScaffoldDefaults,
	},
	"make:application": {
		description: "Create Application package",
		options: {
			"--force": "Force overwrite of existing package",
			"--dry": "Skip npm scripts",
			"--name": "Specify name instead of using wizard",
		},
		action: scaffoldPackage("application"),
	},
	"make:iframe-application": {
		description: "Create IFrame Application package",
		options: {
			"--force": "Force overwrite of existing package",
			"--dry": "Skip npm scripts",
			"--name": "Specify name instead of using interactive wizard",
		},
		action: scaffoldPackage("iframe-application"),
	},
};
