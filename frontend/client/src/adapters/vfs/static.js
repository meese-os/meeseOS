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

import {
	createSearchMatcher,
	filenameOf,
	isDescendantOf,
	mimeFromFilename,
	normalize,
	parentOf,
	rootOf,
} from "./utils";

const DEFAULT_MANIFEST = "/vfs-manifest.json";

/**
 * Rejects an operation that this adapter cannot service.
 * @param {String} operation The attempted operation
 * @returns {Promise<never>}
 */
const readOnly = (operation) =>
	Promise.reject(new Error(`Read-only filesystem: cannot ${operation}`));

/**
 * Builds the in-memory tree from a manifest.
 *
 * The manifest only lists files. Directories are inferred from the paths, so
 * generating one is a matter of walking the built output and recording sizes.
 *
 * @param {String} root The mountpoint root path
 * @param {Object[]} entries The manifest entries
 * @returns {Map<String, Object>} Records keyed by normalized path
 */
const buildTree = (root, entries) => {
	const now = new Date();
	const records = new Map();

	const ensureDirectory = (path) => {
		if (records.has(path)) return;

		records.set(path, {
			isDirectory: true,
			isFile: false,
			mime: null,
			size: 0,
			path,
			filename: filenameOf(path),
			stat: { size: 0, mtime: now, ctime: now, atime: now },
		});

		const parent = parentOf(path);
		if (parent !== null) ensureDirectory(parent);
	};

	ensureDirectory(root);

	entries.forEach((entry) => {
		const path = normalize(`${root}${String(entry.path).replace(/^\/+/, "")}`);
		const mtime = entry.mtime ? new Date(entry.mtime) : now;
		const size = entry.size ?? 0;

		ensureDirectory(parentOf(path));

		records.set(path, {
			isDirectory: false,
			isFile: true,
			mime: entry.mime ?? mimeFromFilename(filenameOf(path)),
			size,
			path,
			filename: filenameOf(path),
			stat: { size, mtime, ctime: mtime, atime: mtime },
		});
	});

	return records;
};

/**
 * Read-only VFS adapter over the statically hosted build output.
 *
 * HTTP has no directory listing, so the tree comes from a build-time manifest
 * while file contents are fetched from the origin on demand. This is the
 * counterpart to the `indexeddb` adapter: that one backs a writable per-browser
 * home, this one exposes shipped assets such as wallpapers and themes.
 *
 * @param {Core} core MeeseOS Core instance reference
 * @returns {Object} The adapter methods
 */
const adapter = (core) => {
	let records = null;

	/**
	 * Resolves the origin URL a mounted path is served from.
	 * @param {String} path A normalized path
	 * @returns {String} The resolved URL
	 */
	const resolveUrl = (path) => core.url(path.slice(rootOf(path).length - 1));

	/**
	 * Reads a record from the manifest tree.
	 * @param {String} path A normalized path
	 * @returns {Object} The record
	 */
	const requireRecord = (path) => {
		const record = records?.get(path);
		if (!record) {
			throw new Error(`No such file or directory: ${path}`);
		}

		return record;
	};

	return {
		capabilities: () =>
			Promise.resolve({
				sort: false,
				pagination: false,
			}),

		mount: async (_options, mount) => {
			const manifest =
				mount?.attributes?.manifest ??
				core.config("vfs.staticManifest", DEFAULT_MANIFEST);

			const response = await fetch(core.url(manifest));
			if (!response.ok) {
				throw new Error(
					`Failed to load the VFS manifest at ${manifest}: ${response.status}`
				);
			}

			const entries = await response.json();
			records = buildTree(`${mount.name}:/`, entries);

			return true;
		},

		unmount: () => {
			records = null;
			return Promise.resolve(true);
		},

		readdir: async ({ path }) => {
			const directory = normalize(path);
			const record = requireRecord(directory);

			if (!record.isDirectory) {
				throw new Error(`Not a directory: ${directory}`);
			}

			return Array.from(records.values()).filter(
				(entry) => parentOf(entry.path) === directory
			);
		},

		readfile: async ({ path }) => {
			const record = requireRecord(normalize(path));

			if (record.isDirectory) {
				throw new Error(`Is a directory: ${record.path}`);
			}

			const response = await fetch(resolveUrl(record.path));
			if (!response.ok) {
				throw new Error(
					`Failed to read ${record.path}: ${response.status} ${response.statusText}`
				);
			}

			const body = await response.arrayBuffer();

			return {
				mime: response.headers.get("content-type") || record.mime,
				body,
			};
		},

		exists: ({ path }) => Promise.resolve(records.has(normalize(path))),

		stat: async ({ path }) => requireRecord(normalize(path)),

		// Served straight from the origin, so there is no blob URL to revoke
		url: async ({ path }) => resolveUrl(requireRecord(normalize(path)).path),

		search: async ({ path }, pattern) => {
			const root = normalize(path);
			const matches = createSearchMatcher(pattern);

			return Array.from(records.values()).filter(
				(entry) => isDescendantOf(entry.path, root) && matches(entry.filename)
			);
		},

		writefile: () => readOnly("write a file"),
		copy: () => readOnly("copy"),
		rename: () => readOnly("rename"),
		mkdir: () => readOnly("create a directory"),
		unlink: () => readOnly("remove"),
		touch: () => readOnly("touch"),
		archive: () => readOnly("archive"),
	};
};

export default adapter;
