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

const DEFAULT_MIME = "application/octet-stream";

/**
 * Extension to MIME type map. Deliberately small: it only needs to cover the
 * types the desktop keys behavior off of (icon selection in `config.js` and
 * the `mimes` field of application manifests), not every type in existence.
 */
const MIME_TYPES = {
	aac: "audio/aac",
	bmp: "image/bmp",
	css: "text/css",
	csv: "text/csv",
	flac: "audio/flac",
	gif: "image/gif",
	gz: "application/gzip",
	htm: "text/html",
	html: "text/html",
	ico: "image/x-icon",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	js: "application/javascript",
	json: "application/json",
	m4a: "audio/mp4",
	md: "text/markdown",
	mjs: "application/javascript",
	mp3: "audio/mpeg",
	mp4: "video/mp4",
	oga: "audio/ogg",
	ogv: "video/ogg",
	pdf: "application/pdf",
	png: "image/png",
	py: "application/x-python",
	rtf: "application/rtf",
	svg: "image/svg+xml",
	tar: "application/x-tar",
	txt: "text/plain",
	wav: "audio/wav",
	webm: "video/webm",
	webp: "image/webp",
	xml: "application/xml",
	zip: "application/zip",
};

/**
 * Resolves the MIME type of a file from its extension.
 * @param {String} filename The filename
 * @returns {String} The MIME type
 */
export const mimeFromFilename = (filename) => {
	const extension = filename.includes(".")
		? filename.split(".").pop().toLowerCase()
		: "";

	return MIME_TYPES[extension] ?? DEFAULT_MIME;
};

/**
 * Normalizes a VFS path into its canonical stored form.
 *
 * The mountpoint root normalizes to `<prefix>:/` and every other entry to
 * `<prefix>:/a/b` with no trailing slash, so a path always has exactly one
 * representation as an IndexedDB key.
 *
 * @param {String} path The path to normalize
 * @returns {String} The normalized path
 */
export const normalize = (path) => {
	const [, prefix = "", rest = ""] =
		String(path).match(/^([\w-]+):+(.*)$/) ?? [];

	const resolved = rest
		.split("/")
		.filter((segment) => segment.length > 0 && segment !== ".")
		.reduce((segments, segment) => {
			if (segment === "..") {
				segments.pop();
			} else {
				segments.push(segment);
			}

			return segments;
		}, []);

	return `${prefix}:/${resolved.join("/")}`;
};

/**
 * Gets the parent of a normalized path.
 * @param {String} path A normalized path
 * @returns {String|null} The parent path, or null for a mountpoint root
 */
export const parentOf = (path) => {
	const [, prefix, rest] = path.match(/^([\w-]+):\/(.*)$/);
	if (rest === "") return null;

	const segments = rest.split("/");
	segments.pop();

	return `${prefix}:/${segments.join("/")}`;
};

/**
 * Gets the filename portion of a normalized path.
 * @param {String} path A normalized path
 * @returns {String} The filename
 */
export const filenameOf = (path) => path.split("/").pop();

/**
 * Gets the mountpoint root of a normalized path.
 * @param {String} path A normalized path
 * @returns {String} The mountpoint root path
 */
export const rootOf = (path) => `${path.match(/^([\w-]+):\//)[1]}:/`;

/**
 * Checks whether one path lies underneath another.
 * @param {String} candidate The path to test
 * @param {String} ancestor The potential ancestor path
 * @returns {Boolean}
 */
export const isDescendantOf = (candidate, ancestor) => {
	const prefix = ancestor.endsWith("/") ? ancestor : `${ancestor}/`;
	return candidate !== ancestor && candidate.startsWith(prefix);
};


/**
 * Builds a filename matcher from a search pattern, supporting `*` and `?`
 * wildcards and matching case-insensitively anywhere in the name.
 *
 * @param {String} pattern The search pattern
 * @returns {Function} The matcher
 */
export const createSearchMatcher = (pattern) => {
	const expression = String(pattern)
		.replace(/[.+^${}()|[\]\\]/g, "\\$&")
		.replace(/\*/g, ".*")
		.replace(/\?/g, ".");

	const regex = new RegExp(expression, "i");

	return (filename) => regex.test(filename);
};
