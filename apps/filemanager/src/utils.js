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

/**
 * Diverts callback based on drop action event
 * @param {Function} browser
 * @param {Function} virtual
 */
export const divertDropAction = (browser, virtual) =>
	(ev, data, files) => {
		const browserItems = Array.from(ev?.dataTransfer?.items || [])
			.some((item) => item.kind === "file");
		if (files.length || browserItems) {
			browser(files, ev);
		} else if (data?.path && data.filename) {
			virtual(data);
		}
	};

/**
* Higher-Order Function (HoF) for dialogs
* @param {Function} cb The callback function
*/
export const usingPositiveButton = (cb) =>
	(btn, value) => {
		if (["yes", "ok"].indexOf(btn) !== -1) {
			cb(value);
		}
	};

/**
* Triggers a browser upload
* @param {Function} cb The callback function
*/
export const triggerBrowserUpload = (cb) => {
	const field = document.createElement("input");
	field.type = "file";
	field.multiple = true;
	field.onchange = () => {
		if (field.files.length > 0) {
			cb(field.files);
		}
	};
	field.click();
};

/**
 * Whether the browser can open a directory picker. Chromium/WebKit expose
 * this as a non-standard input property; browsers without it keep the normal
 * file picker available.
 * @returns {Boolean} Whether directory picking is supported
 */
export const supportsDirectoryUpload = () => {
	if (typeof document === "undefined") return false;

	const field = document.createElement("input");
	return "webkitdirectory" in field || "directory" in field;
};

/**
 * Triggers a browser directory upload.
 * @param {Function} cb The callback function
 * @returns {Boolean} Whether a picker was opened
 */
export const triggerBrowserDirectoryUpload = (cb) => {
	if (!supportsDirectoryUpload()) return false;

	const field = document.createElement("input");
	field.type = "file";
	field.multiple = true;
	field.webkitdirectory = true;
	field.directory = true;
	field.onchange = () => {
		if (field.files.length > 0) cb(field.files);
	};
	field.click();
	return true;
};

/**
 * Normalizes a browser-provided relative path and rejects unsafe paths.
 * @param {String} value The path to normalize
 * @returns {String|null} A safe slash-separated relative path
 */
export const normalizeRelativePath = (value) => {
	if (typeof value !== "string" || value.length === 0) return null;

	const normalized = value.replace(/\\/g, "/");
	if (
		normalized.startsWith("/") ||
		/^[a-z]:\//i.test(normalized) ||
		[...normalized].some((character) => {
			const code = character.charCodeAt(0);
			return code < 32 || code === 127;
		})
	) {
		return null;
	}

	const parts = normalized.split("/");
	if (parts.some((part) => !part || part === "." || part === "..")) {
		return null;
	}

	return parts.join("/");
};

const entryFile = (entry) => new Promise((resolve, reject) => {
	entry.file(resolve, reject);
});

const readEntryBatch = (reader) => new Promise((resolve, reject) => {
	reader.readEntries(resolve, reject);
});

const readDirectoryEntries = async (entry) => {
	const reader = entry.createReader();
	const entries = [];

	while (true) {
		const batch = await readEntryBatch(reader);
		if (!batch.length) return entries;
		entries.push(...batch);
	}
};

const readEntry = async (entry, parentPath = "") => {
	if (entry.isFile) {
		const file = await entryFile(entry);
		const path = normalizeRelativePath(
			parentPath ? `${parentPath}/${file.name}` : file.name
		);
		if (!path) {
			throw new Error("Refusing to upload a file with an unsafe relative path");
		}
		return [{ file, path }];
	}

	if (!entry.isDirectory) return [];

	const path = normalizeRelativePath(
		parentPath ? `${parentPath}/${entry.name}` : entry.name
	);
	if (!path) {
		throw new Error("Refusing to upload a directory with an unsafe relative path");
	}

	const children = await readDirectoryEntries(entry);
	const files = [{ directory: path }];
	for (const child of children) {
		files.push(...await readEntry(child, path));
	}
	return files;
};

/**
 * Expands DataTransfer entries into files with safe relative paths.
 * @param {DataTransferItemList|Array} items Data transfer items
 * @returns {Promise<Array>} Files and their relative paths
 */
export const collectDroppedFiles = async (items) => {
	const result = [];
	for (const item of Array.from(items || [])) {
		if (item.kind && item.kind !== "file") continue;
		const getEntry = item.webkitGetAsEntry || item.getAsEntry;
		const entry = typeof getEntry === "function" ? getEntry.call(item) : null;

		if (entry) {
			result.push(...await readEntry(entry));
		} else if (typeof item.getAsFile === "function") {
			const file = item.getAsFile();
			const path = normalizeRelativePath(file?.webkitRelativePath || file?.name);
			if (file && !path) {
				throw new Error("Refusing to upload a file with an unsafe relative path");
			}
			if (file) result.push({ file, path });
		}
	}
	return result;
};

/**
* Checks if the given filename is a single or double dot
* @param {String} filename The filename to check
* @returns {Boolean} Whether or not the file is special
*/
export const isSpecialFile = (filename) =>
	["..", "."].indexOf(filename) !== -1;
