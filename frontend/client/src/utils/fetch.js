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
 * Creates URL request path.
 * @param {Object} data
 * @returns {String}
 */
export const encodeQueryData = (data) =>
	Object.entries(data ?? {})
		.filter(([, value]) => typeof value !== "undefined")
		.map(([key, value]) => {
			if (typeof value === "object") {
				value = JSON.stringify(value, (_key, nestedValue) =>
					typeof nestedValue === "undefined" ? null : nestedValue
				);
			}

			return encodeURIComponent(key) + "=" + encodeURIComponent(value);
		})
		.join("&");

const bodyTypes = [
	window.ArrayBuffer,
	window.ArrayBufferView,
	window.Blob,
	window.File,
	window.URLSearchParams,
	window.FormData,
].filter((type) => Boolean(type));

/**
 * Creates fetch() options.
 *
 * @param {String} url
 * @param {Object} options
 * @param {String} type
 * @returns {Array}
 */
const createFetchOptions = (url, options, type) => {
	const fetchOptions = {
		credentials: "same-origin",
		method: "get",
		headers: {},
		...options,
	};

	if (type === "json") {
		fetchOptions.headers = {
			...fetchOptions.headers,
			Accept: "application/json, text/plain, */*",
			"Content-Type": "application/json",
		};
	}

	if (
		typeof fetchOptions.body !== "undefined" &&
		fetchOptions.method.toLowerCase() === "get"
	) {
		const query = encodeQueryData(fetchOptions.body);
		if (query) {
			const fragmentIndex = url.indexOf("#");
			const target = fragmentIndex === -1
				? url
				: url.substring(0, fragmentIndex);
			const fragment = fragmentIndex === -1 ? "" : url.substring(fragmentIndex);
			const separator = target.indexOf("?") === -1 ? "?" : "&";

			url = target + separator + query + fragment;
		}
		delete fetchOptions.body;
	}

	const hasBody = typeof fetchOptions.body !== "undefined";
	const stringBody = typeof fetchOptions.body === "string";

	if (type === "json" && hasBody && !stringBody) {
		if (!(fetchOptions.body instanceof FormData)) {
			const found = bodyTypes.find((type) => fetchOptions.body instanceof type);
			if (!found) {
				fetchOptions.body = JSON.stringify(fetchOptions.body);
			}
		}
	}

	return [url, fetchOptions];
};

/**
 * This is a fetch polyfill for XMLHttpRequest.
 * Mainly used to get upload progress indicator.
 * @param {String} target The target URL
 * @param {Object} fetchOptions The request options
 * @returns {Promise}
 */
const fetchXhr = (target, { signal, ...fetchOptions }, onProgress) => {
	if (signal?.aborted) {
		return Promise.reject(
			new DOMException("The operation was aborted.", "AbortError")
		);
	}

	return new Promise((resolve, reject) => {
		const req = new XMLHttpRequest();
		let settled = false;
		let progressTarget;

		const cleanup = () => {
			req.removeEventListener("load", onLoad);
			req.removeEventListener("error", onError);
			req.removeEventListener("abort", onAbort);
			req.removeEventListener("timeout", onTimeout);
			progressTarget?.removeEventListener("progress", onProgressEvent);
			signal?.removeEventListener("abort", onSignalAbort);
		};

		const settle = (callback, value) => {
			if (!settled) {
				settled = true;
				cleanup();
				callback(value);
			}
		};

		const onError = (ev) => {
			console.warn("An error occured while performing XHR request", ev);
			settle(reject, new Error("An error occured while performing XHR request"));
		};

		const onLoad = () => {
			settle(resolve, {
				status: req.status,
				statusText: req.statusText,
				ok: req.status >= 200 && req.status <= 299,
				headers: {
					get: (k) => req.getResponseHeader(k),
				},
				text: () => Promise.resolve(JSON.responseText),
				json: () => Promise.resolve(JSON.parse(req.responseText)),
				arrayBuffer: () => Promise.resolve(req.response),
			});
		};

		const onAbort = (ev) => {
			console.warn("XHR request was aborted", ev);
			settle(reject, new Error("XHR request was aborted"));
		};

		const onTimeout = (ev) => {
			console.warn("XHR request timed out", ev);
			settle(reject, new Error("XHR request timed out"));
		};

		const onSignalAbort = () => {
			if (!settled) {
				settle(
					reject,
					new DOMException("The operation was aborted.", "AbortError")
				);
				req.abort();
			}
		};

		const onProgressEvent = (ev) => {
			if (ev.lengthComputable) {
				const percentComplete = Math.round((ev.loaded / ev.total) * 100);
				onProgress(ev, percentComplete);
			}
		};

		if (typeof onProgress === "function") {
			progressTarget = fetchOptions.method.toUpperCase() === "GET"
				? req
				: req.upload;
			progressTarget.addEventListener("progress", onProgressEvent);
		}

		req.addEventListener("load", onLoad);
		req.addEventListener("error", onError);
		req.addEventListener("abort", onAbort);
		req.addEventListener("timeout", onTimeout);

		try {
			req.open(fetchOptions.method, target);
			Object.entries(fetchOptions.headers).forEach(([key, val]) =>
				req.setRequestHeader(key, val)
			);
			req.responseType = fetchOptions.responseType ?? "";
			if (typeof fetchOptions.timeout !== "undefined") {
				req.timeout = fetchOptions.timeout;
			}
			signal?.addEventListener("abort", onSignalAbort);
			if (signal?.aborted) {
				onSignalAbort();
				return;
			}
			req.send(fetchOptions.body);
		} catch (error) {
			settle(reject, error);
		}
	});
};

/**
 * Make an HTTP request.
 *
 * @param {String} url The endpoint
 * @param {Options} [options] fetch options
 * @param {String} [type] Request / Response type
 * @returns {Promise<*>}
 */
export const fetch = (url, options = {}, type = null) => {
	const { onProgress, xhr, ...requestOptions } = options;
	const [target, fetchOptions] = createFetchOptions(url, requestOptions, type);

	const createErrorRejection = (response, error) =>
		Promise.reject(
			new Error(error || `${response.status} (${response.statusText})`)
		);

	const op = xhr
		? fetchXhr(target, fetchOptions, onProgress)
		: window.fetch(target, fetchOptions);

	return op.then(async (response) => {
		if (!response.ok) {
			const contentType = response.headers.get("content-type");
			const method =
				contentType && contentType.indexOf("application/json") !== -1
					? "json"
					: "text";

			return response[method]().then((data) =>
				createErrorRejection(response, data.error)
			);
		}

		// Prevents an error from being thrown when resizing the terminal
		try {
			if (type === "json") response = await response.json();
			return response;
		} catch (e) {
			return response;
		}
	});
};
