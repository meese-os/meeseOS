/**
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-Present, Anders Evenrud <andersevenrud@gmail.com>
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
 * @license Simplified BSD License
 */

const getters = ["capabilities", "exists", "stat", "readdir", "readfile"];

/**
 * Middleware for the VFS system adapter.
 *
 * @param {String} fn The function to call
 * @param {*} body The body to pass to the function
 * @param {String} type The content type
 * @param {Object} [options] Adapter options
 * @returns {Object}
 */
const requester = (core) =>
	(fn, body, type, options = {}) =>
		core.request(`/vfs/${fn}`,
			{
				// FIXME: The `options` here is being stringified to `[object Object]`
				body,
				method: getters.indexOf(fn) !== -1 ? "get" : "post",
				...options,
			},
			type
		).then((response) => {
			if (type === "json") {
				return { mime: "application/json", body: response };
			} else if (fn === "writefile") {
				return response.json();
			}

			const contentType = response.headers.get("content-type")
				|| "application/octet-stream";

			return response.arrayBuffer().then((result) => ({
				mime: contentType,
				body: result,
			}));
		});

/**
 * Provides the methods for VFS system adapter.
 * @param {Core} core MeeseOS Core instance reference
 * @param {Function} request VFS abstraction function
 * @returns {Object}
 */
const methods = (core, request) => {
	const passthrough = (name) =>
		({ path }, options) =>
			request(name, { path, options }, "json").then(({ body }) => body);

	return {
		capabilities: passthrough("capabilities"),
		readdir: passthrough("readdir"),

		readfile: ({ path }, type, options) =>
			request("readfile", { path, options }),

		writefile: ({ path }, data, options = {}) => {
			const formData = new FormData();
			formData.append("upload", data);
			formData.append("path", path);
			formData.append("options", options);

			return request("writefile", formData, undefined, {
				onProgress: options.onProgress,
				xhr: Boolean(options.onProgress),
			});
		},

		copy: (from, to, options) =>
			request("copy", { from: from.path, to: to.path, options }, "json").then(
				({ body }) => body
			),

		rename: (from, to, options) =>
			request("rename", { from: from.path, to: to.path, options }, "json").then(
				({ body }) => body
			),

		mkdir: passthrough("mkdir"),
		unlink: passthrough("unlink"),
		exists: passthrough("exists"),
		stat: passthrough("stat"),

		url: ({ path }, _options) =>
			Promise.resolve(
				core.url(`/vfs/readfile?path=${encodeURIComponent(path)}`)
			),

		search: ({ path }, pattern, options) =>
			request("search", { root: path, pattern, options }, "json").then(
				({ body }) => body
			),

		touch: ({ path }, options) =>
			request("touch", { path, options }, "json").then(({ body }) => body),

		download: ({ path }, options = {}) => {
			const json = encodeURIComponent(JSON.stringify({ download: true }));

			return Promise.resolve(
				`/vfs/readfile?options=${json}&path=` + encodeURIComponent(path)
			).then((url) => {
				return (options.target || window).open(url);
			});
		},

		archive: (selection, options = {}) => {
			const paths = selection.map((item) => item.path);
			return request("archive", { selection: paths, options }, "json").then(
				({ body }) => body
			);
		},
	};
};

/**
 * System VFS adapter.
 * @param {Core} core MeeseOS Core instance reference
 * @param {Object} [options] Adapter options
 * @returns {Object}
 */
const adapter = (core) => {
	const request = requester(core);

	return methods(core, request);
};

export default adapter;
