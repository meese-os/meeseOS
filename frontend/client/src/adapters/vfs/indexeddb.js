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

import { unzip, zip } from "fflate";
import {
	createSearchMatcher,
	filenameOf,
	isDescendantOf,
	mimeFromFilename,
	normalize,
	parentOf,
	rootOf,
} from "./utils";

const DATABASE_NAME = "meeseOS-vfs";
const DATABASE_VERSION = 1;
const STORE_NAME = "files";
const PARENT_INDEX = "parent";

/**
 * Builds a stored record.
 *
 * Contents are held as an `ArrayBuffer` rather than a `Blob`: it is the value
 * type every IndexedDB implementation clones reliably, and it keeps `readfile`
 * free of an extra async hop. Like the server adapter, the MIME type comes from
 * the filename rather than from whatever the caller happened to tag the data
 * with.
 *
 * @param {String} path A normalized path
 * @param {Boolean} isDirectory Whether the record is a directory
 * @param {ArrayBuffer} [buffer] The file contents
 * @returns {Object} The record
 */
const createRecord = (path, isDirectory, buffer = null) => {
	const now = new Date();
	const filename = filenameOf(path);

	return {
		path,
		parent: parentOf(path),
		filename,
		isDirectory,
		isFile: !isDirectory,
		mime: isDirectory ? null : mimeFromFilename(filename),
		size: isDirectory ? 0 : (buffer?.byteLength ?? 0),
		buffer,
		mtime: now,
		ctime: now,
		atime: now,
	};
};

/**
 * Coerces whatever the VFS handed us into an `ArrayBuffer`.
 * @param {ArrayBuffer|Blob|String} data The file contents
 * @returns {Promise<ArrayBuffer>} The contents as a buffer
 */
const toArrayBuffer = (data) => {
	if (data instanceof ArrayBuffer) return Promise.resolve(data);
	if (data instanceof Blob) return data.arrayBuffer();

	return new Blob([data]).arrayBuffer();
};

/**
 * Converts a stored record into the file object shape the VFS expects.
 * Mirrors `createFileIter` in the server's system adapter.
 *
 * @param {Object} record A stored record
 * @returns {Object} A VFS file object
 */
const toFileIter = (record) => ({
	isDirectory: record.isDirectory,
	isFile: record.isFile,
	mime: record.mime,
	size: record.size,
	path: record.path,
	filename: record.filename,
	stat: {
		size: record.size,
		mtime: record.mtime,
		ctime: record.ctime,
		atime: record.atime,
	},
});

/**
 * Promisified `fflate.zip`.
 * @param {Object} entries A map of archive entry name to bytes
 * @returns {Promise<Uint8Array>} The archive bytes
 */
const zipAsync = (entries) =>
	new Promise((resolve, reject) => {
		zip(entries, (error, result) =>
			error ? reject(error) : resolve(result)
		);
	});

/**
 * Promisified `fflate.unzip`.
 * @param {Uint8Array} bytes The archive bytes
 * @returns {Promise<Object>} A map of archive entry name to bytes
 */
const unzipAsync = (bytes) =>
	new Promise((resolve, reject) => {
		unzip(bytes, (error, result) =>
			error ? reject(error) : resolve(result)
		);
	});

/**
 * Promisifies an IndexedDB request.
 * @param {IDBRequest} request The request
 * @returns {Promise<*>} The request result
 */
const promisifyRequest = (request) =>
	new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});

/**
 * Resolves once a transaction has fully committed.
 * @param {IDBTransaction} transaction The transaction
 * @returns {Promise<undefined>}
 */
const promisifyTransaction = (transaction) =>
	new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error);
		transaction.onabort = () => reject(transaction.error);
	});

/**
 * Opens (and if needed creates) the backing database.
 * @returns {Promise<IDBDatabase>} The database
 */
const openDatabase = () =>
	new Promise((resolve, reject) => {
		const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;

			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, { keyPath: "path" });
				store.createIndex(PARENT_INDEX, PARENT_INDEX, { unique: false });
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		request.onblocked = () =>
			reject(new Error("The VFS database is blocked by another tab"));
	});

/**
 * Reads a single record.
 * @param {IDBDatabase} db The database
 * @param {String} path A normalized path
 * @returns {Promise<Object|undefined>} The record
 */
const getRecord = (db, path) =>
	promisifyRequest(
		db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(path)
	);

/**
 * Reads the direct children of a directory.
 * @param {IDBDatabase} db The database
 * @param {String} path A normalized directory path
 * @returns {Promise<Object[]>} The child records
 */
const getChildRecords = (db, path) =>
	promisifyRequest(
		db
			.transaction(STORE_NAME, "readonly")
			.objectStore(STORE_NAME)
			.index(PARENT_INDEX)
			.getAll(path)
	);

/**
 * Reads every record in the store.
 *
 * Recursive operations (copy, rename, unlink, search) read the whole store and
 * walk it in memory rather than paging through the parent index. That keeps
 * them off the IndexedDB transaction-lifetime footgun, and a per-browser
 * desktop filesystem never holds enough entries for the difference to matter.
 *
 * @param {IDBDatabase} db The database
 * @returns {Promise<Object[]>} Every record
 */
const getAllRecords = (db) =>
	promisifyRequest(
		db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll()
	);

/**
 * Applies a batch of writes and deletes in a single transaction.
 *
 * @param {IDBDatabase} db The database
 * @param {Object[]} [put=[]] Records to write
 * @param {String[]} [remove=[]] Paths to delete
 * @returns {Promise<undefined>}
 */
const applyChanges = (db, put = [], remove = []) => {
	const transaction = db.transaction(STORE_NAME, "readwrite");
	const store = transaction.objectStore(STORE_NAME);

	// Requests are issued synchronously so the transaction stays active and the
	// whole batch commits or aborts together
	remove.forEach((path) => store.delete(path));
	put.forEach((record) => store.put(record));

	return promisifyTransaction(transaction);
};

/**
 * Builds the records for any missing ancestors of a path.
 * @param {Object[]} records Every existing record
 * @param {String} path A normalized path whose ancestors should exist
 * @returns {Object[]} The directory records to create
 */
const createMissingAncestors = (records, path) => {
	const existing = new Set(records.map((record) => record.path));
	const created = [];

	let current = parentOf(path);
	while (current !== null && !existing.has(current)) {
		created.push(createRecord(current, true));
		existing.add(current);
		current = parentOf(current);
	}

	return created;
};

/**
 * Browser-local VFS adapter backed by IndexedDB.
 *
 * Implements the same contract as the `system` adapter, but stores everything
 * in the visitor's own browser instead of on a server. Scope follows browser
 * origin storage: files do not travel between browsers or devices, and are
 * removed if the visitor clears site data or the browser evicts the origin.
 *
 * @param {Core} _core MeeseOS Core instance reference
 * @param {Object} [_options] Adapter options
 * @returns {Object} The adapter methods
 */
const adapter = (_core, _options = {}) => {
	let connection = null;

	/**
	 * Opens the database once and reuses the connection.
	 * @returns {Promise<IDBDatabase>} The database
	 */
	const database = () => {
		if (!connection) {
			connection = openDatabase().catch((error) => {
				// Do not cache a failed connection, so a later call can retry
				connection = null;
				throw error;
			});
		}

		return connection;
	};

	/**
	 * Reads a record, throwing if it is absent.
	 * @param {IDBDatabase} db The database
	 * @param {String} path A normalized path
	 * @returns {Promise<Object>} The record
	 */
	const requireRecord = async (db, path) => {
		const record = await getRecord(db, path);
		if (!record) {
			throw new Error(`No such file or directory: ${path}`);
		}

		return record;
	};

	/**
	 * Copies or moves a subtree.
	 *
	 * @param {String} from The source path
	 * @param {String} to The destination path
	 * @param {Boolean} move Whether to remove the source afterwards
	 * @returns {Promise<Boolean>}
	 */
	const transfer = async (from, to, move) => {
		const db = await database();
		const source = normalize(from);
		const destination = normalize(to);

		if (source === destination) return true;
		if (isDescendantOf(destination, source)) {
			throw new Error("Cannot move a directory into itself");
		}

		const records = await getAllRecords(db);
		const sourceRecord = records.find((record) => record.path === source);
		if (!sourceRecord) {
			throw new Error(`No such file or directory: ${source}`);
		}

		const remap = (record) => ({
			...record,
			path: destination + record.path.slice(source.length),
			parent: parentOf(destination + record.path.slice(source.length)),
			filename: filenameOf(destination + record.path.slice(source.length)),
			mtime: new Date(),
		});

		const subtree = records.filter((record) =>
			isDescendantOf(record.path, source)
		);

		const written = [
			...createMissingAncestors(records, destination),
			remap(sourceRecord),
			...subtree.map(remap),
		];

		const removed = move
			? [source, ...subtree.map((record) => record.path)]
			: [];

		await applyChanges(db, written, removed);

		return true;
	};

	return {
		capabilities: () =>
			Promise.resolve({
				sort: false,
				pagination: false,
			}),

		mount: async () => {
			// Nothing to do beyond proving the database is reachable; roots are
			// created lazily by `readdir` so an empty mount still lists cleanly
			await database();
			return true;
		},

		unmount: () => Promise.resolve(true),

		readdir: async ({ path }) => {
			const db = await database();
			const directory = normalize(path);
			const record = await getRecord(db, directory);

			// A mountpoint root is allowed to be absent, and simply reads as empty
			if (!record && directory !== rootOf(directory)) {
				throw new Error(`No such file or directory: ${directory}`);
			}

			if (record && !record.isDirectory) {
				throw new Error(`Not a directory: ${directory}`);
			}

			const children = await getChildRecords(db, directory);

			return children.map(toFileIter);
		},

		readfile: async ({ path }) => {
			const db = await database();
			const record = await requireRecord(db, normalize(path));

			if (record.isDirectory) {
				throw new Error(`Is a directory: ${record.path}`);
			}

			return { mime: record.mime, body: record.buffer };
		},

		writefile: async ({ path }, data) => {
			const db = await database();
			const target = normalize(path);
			const records = await getAllRecords(db);
			const existing = records.find((record) => record.path === target);

			if (existing?.isDirectory) {
				throw new Error(`Is a directory: ${target}`);
			}

			const record = createRecord(target, false, await toArrayBuffer(data));

			// Unlike the server adapter, missing parents are created rather than
			// erroring. A browser-local filesystem starts completely empty, so
			// strict semantics would break the first write to (for example)
			// `home:/.desktop` before anything has had a chance to create it.
			await applyChanges(db, [
				...createMissingAncestors(records, target),
				{ ...record, ctime: existing?.ctime ?? record.ctime },
			]);

			return record.size;
		},

		copy: (from, to) => transfer(from.path, to.path, false),

		rename: (from, to) => transfer(from.path, to.path, true),

		mkdir: async ({ path }) => {
			const db = await database();
			const target = normalize(path);

			if (await getRecord(db, target)) {
				throw new Error(`File exists: ${target}`);
			}

			const records = await getAllRecords(db);

			await applyChanges(db, [
				...createMissingAncestors(records, target),
				createRecord(target, true),
			]);

			return true;
		},

		unlink: async ({ path }) => {
			const db = await database();
			const target = normalize(path);

			if (target === rootOf(target)) {
				throw new Error("Cannot remove a mountpoint root");
			}

			const records = await getAllRecords(db);
			if (!records.some((record) => record.path === target)) {
				throw new Error(`No such file or directory: ${target}`);
			}

			const removed = records
				.filter((record) => isDescendantOf(record.path, target))
				.map((record) => record.path);

			await applyChanges(db, [], [target, ...removed]);

			return true;
		},

		exists: async ({ path }) => {
			const db = await database();
			return Boolean(await getRecord(db, normalize(path)));
		},

		stat: async ({ path }) => {
			const db = await database();
			return toFileIter(await requireRecord(db, normalize(path)));
		},

		url: async ({ path }) => {
			const db = await database();
			const record = await requireRecord(db, normalize(path));

			if (record.isDirectory) {
				throw new Error(`Is a directory: ${record.path}`);
			}

			// The caller owns the returned URL and should revoke it once the
			// consuming element is torn down
			return URL.createObjectURL(
				new Blob([record.buffer], { type: record.mime })
			);
		},

		search: async ({ path }, pattern) => {
			const db = await database();
			const root = normalize(path);
			const matches = createSearchMatcher(pattern);
			const records = await getAllRecords(db);

			return records
				.filter(
					(record) =>
						isDescendantOf(record.path, root) && matches(record.filename)
				)
				.map(toFileIter);
		},

		touch: async ({ path }) => {
			const db = await database();
			const target = normalize(path);
			const existing = await getRecord(db, target);

			if (existing) {
				await applyChanges(db, [{ ...existing, mtime: new Date() }]);
				return true;
			}

			const records = await getAllRecords(db);

			await applyChanges(db, [
				...createMissingAncestors(records, target),
				createRecord(target, false, new ArrayBuffer(0)),
			]);

			return true;
		},

		archive: async (selection, options = {}) => {
			// The filemanager passes the action as a bare string, so accept both
			// that and the documented `{ action }` object
			const action =
				(typeof options === "string" ? options : options.action) ?? "compress";

			if (selection.length === 0) {
				throw new Error("Nothing selected to archive");
			}

			const db = await database();
			const records = await getAllRecords(db);
			const paths = selection.map((file) => normalize(file.path));

			const byPath = new Map(records.map((record) => [record.path, record]));
			paths.forEach((path) => {
				if (!byPath.has(path)) {
					throw new Error(`No such file or directory: ${path}`);
				}
			});

			if (action === "compress") {
				// Entry names are relative to the directory holding the archive,
				// matching the server adapter
				const archiveRoot = parentOf(paths[0]);
				const prefixLength = archiveRoot.endsWith("/")
					? archiveRoot.length
					: archiveRoot.length + 1;

				const selected = paths.flatMap((path) => [
					byPath.get(path),
					...records.filter((record) => isDescendantOf(record.path, path)),
				]);

				const entries = selected
					.filter((record) => record.isFile)
					.reduce(
						(result, record) => ({
							...result,
							[record.path.slice(prefixLength)]: new Uint8Array(record.buffer),
						}),
						{}
					);

				const bytes = await zipAsync(entries);
				const target = `${paths[0]}.zip`;

				await applyChanges(
					db,
					[
						...createMissingAncestors(records, target),
						createRecord(target, false, bytes.buffer),
					],
					// The server removes the originals once they are in the archive
					selected.map((record) => record.path)
				);

				return true;
			}

			if (action === "extract") {
				const written = [];

				for (const path of paths) {
					const record = byPath.get(path);
					if (record.isDirectory) {
						throw new Error(`Is a directory: ${path}`);
					}

					const entries = await unzipAsync(new Uint8Array(record.buffer));

					// Archives are usually built around a single top-level folder,
					// so unpacking `docs.zip` into `docs/` would leave the tree
					// sitting at `docs/docs`. Unpack in place when there is one
					// top-level entry, and give the contents a directory named
					// after the archive when there is more than one, so they do
					// not spill across the parent. Matches the server adapter.
					const roots = new Set(
						Object.keys(entries)
							.map((name) => name.split("/")[0])
							.filter((root) => root.length > 0)
					);

					const nested = roots.size !== 1;
					const base = nested
						? path.split(".").slice(0, -1).join(".")
						: parentOf(path);

					if (nested) {
						written.push(createRecord(base, true));
					}

					Object.entries(entries).forEach(([name, content]) => {
						// Directory entries carry no content and are implied by
						// the ancestors created for each file
						if (name.endsWith("/")) return;

						const destination = normalize(`${base}/${name}`);
						written.push(
							...createMissingAncestors([...records, ...written], destination),
							createRecord(destination, false, content.slice().buffer)
						);
					});
				}

				await applyChanges(db, written);

				return true;
			}

			throw new Error(`Unknown archive action: '${action}'`);
		},
	};
};

export default adapter;
