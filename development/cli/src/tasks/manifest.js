/**
 * MeeseOS - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2022-Present, Aaron Meese <aaron@meese.dev>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 * 	 and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 * 	 without specific prior written permission.
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
 * @author  Aaron Meese <aaron@meese.dev>
 * @licence Modified BSD License
 */
const fs = require("fs-extra");
const path = require("path");

/**
 * Files that describe the build rather than being part of it, and which the
 * desktop should not surface as browsable content.
 */
const DEFAULT_EXCLUDES = [
	/\.map$/,
	/^vfs-manifest\.json$/,
	/^metadata\.json$/,
	/^index\.html$/,
];

/**
 * Walks a directory, following symlinks.
 *
 * `package:discover` symlinks each installed package into `dist` rather than
 * copying it, so a plain walk would stop at the link and miss every app, icon,
 * theme, and wallpaper.
 *
 * @param {String} root The directory to walk
 * @param {Object} logger The CLI logger
 * @param {String} [prefix=""] The path prefix accumulated so far
 * @param {Set<String>} [seen] Real paths already visited
 * @returns {Promise<Object[]>} The manifest entries
 */
const walk = async (root, logger, prefix = "", seen = new Set()) => {
	// Symlinked packages can point back into a directory already walked, so
	// track real paths to keep a cycle from recursing forever
	const real = await fs.realpath(root);
	if (seen.has(real)) {
		logger.warn("Skipping already-visited path", root);
		return [];
	}

	seen.add(real);

	const entries = await fs.readdir(root);
	const results = await Promise.all(
		entries.map(async (entry) => {
			const absolute = path.join(root, entry);
			const relative = `${prefix}/${entry}`;

			// `stat` rather than `lstat`, so a symlink reports its target
			const stat = await fs.stat(absolute).catch((error) => {
				logger.warn("Skipping unreadable path", absolute, error.message);
				return null;
			});

			if (!stat) return [];

			if (stat.isDirectory()) {
				return walk(absolute, logger, relative, seen);
			}

			return [
				{
					path: relative,
					size: stat.size,
					mtime: stat.mtime.toISOString(),
				},
			];
		})
	);

	return results.flat();
};

const action = async ({ logger, options, args }) => {
	const dist = options.dist();
	const destination = path.resolve(args.output || path.join(dist.root, "vfs-manifest.json"));

	const excludes = args.all === true ? [] : DEFAULT_EXCLUDES;
	const isExcluded = (entry) =>
		excludes.some((pattern) => pattern.test(path.basename(entry.path)));

	logger.info("Building the VFS manifest...");
	logger.info("Source path", dist.root);
	logger.info("Destination manifest", destination);

	if (!(await fs.pathExists(dist.root))) {
		throw new Error(`Cannot build a manifest, '${dist.root}' does not exist`);
	}

	const entries = (await walk(dist.root, logger)).filter(
		(entry) => !isExcluded(entry)
	);

	// Sorted so the manifest is stable across builds and diffs stay readable
	entries.sort((a, b) => a.path.localeCompare(b.path));

	await fs.writeJson(destination, entries);

	logger.success(entries.length + " file(s) added to the VFS manifest.");
};

module.exports = {
	"package:manifest": {
		description:
			"Builds the VFS manifest of statically served files in the dist directory",
		options: {
			"--output [output]":
				"Manifest output file ('dist/vfs-manifest.json' by default)",
			"--all": "Include source maps and build metadata files",
		},
		action,
	},
};
