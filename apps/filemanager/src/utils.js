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
		if (files.length) {
			browser(files);
		} else if ( data?.path && data.filename) {
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
* Checks if the given filename is a single or double dot
* @param {String} filename The filename to check
* @returns {Boolean} Whether or not the file is special
*/
export const isSpecialFile = (filename) =>
	["..", "."].indexOf(filename) !== -1;
