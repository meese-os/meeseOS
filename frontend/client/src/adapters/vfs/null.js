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

/**
 * Null VFS adapter
 * @param {Core} core MeeseOS Core instance reference
 * @param {Object} [options] Adapter options
 */
const nullAdapter = {
	capabilities: (_path, _options) => Promise.resolve({}),
	readdir: (_path, _options) => Promise.resolve([]),
	readfile: (_path, _type, _options) =>
		Promise.resolve({
			body: new ArrayBuffer(),
			mime: "application/octet-stream",
		}),
	writefile: (_path, _data, _options) => Promise.resolve(-1),
	copy: (_from, _to, _options) => Promise.resolve(false),
	rename: (_from, _to, _options) => Promise.resolve(false),
	mkdir: (_path, _options) => Promise.resolve(false),
	unlink: (_path, _options) => Promise.resolve(false),
	exists: (_path, _options) => Promise.resolve(false),
	stat: (_path, _options) => Promise.resolve({}),
	url: (_path, _options) => Promise.resolve(null),
	mount: (_options) => Promise.resolve(true),
	unmount: (_options) => Promise.resolve(true),
	search: (_root, _pattern, _options) => Promise.resolve([]),
	touch: (_path, _options) => Promise.resolve(false),
	archive: (_selection, _options) => Promise.resolve(false),
};

export default nullAdapter;
