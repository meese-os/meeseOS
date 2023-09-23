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
 * @author  Aaron Meese <aaron@meese.dev>
 * @licence Simplified BSD License
 */

const path = require("path");

class IconThemePlugin {
	constructor(options = {}) {
		this.metadataPath = options.metadataPath;
	}

	apply(compiler) {
		const pluginName = IconThemePlugin.name;
		const { webpack: { sources: { RawSource } } } = compiler;

		compiler.hooks.compilation.tap(pluginName, (compilation) => {
			compilation.hooks.processAssets.tap({
				name: pluginName,
				stage: compilation.constructor.PROCESS_ASSETS_STAGE_ADDITIONAL,
			}, (assets) => {
				const icons = Object.keys(assets).map((pathname) => {
					const filename = path.basename(pathname);
					return filename;
				});

				const metadataFile = `${this.metadataPath || compiler.context}/metadata.json`;
				const metadata = require(metadataFile);

				// Create an object with the property name as the asset name
				// and the value as the file extension
				const iconEntries = icons.map((file) => [
					file.slice(0, file.lastIndexOf(".")),
					file.slice(file.lastIndexOf(".") + 1)
				]);
				iconEntries.sort(([a], [b]) => a.localeCompare(b));

				// Filter `icons` to only image file types
				const imageTypes = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
				metadata.icons = Object.fromEntries(
					iconEntries.filter(
						([name, ext]) => imageTypes.includes(ext)
					)
				);

				// Write the new metadata to the file
				const json = JSON.stringify(metadata, null, 2);
				const relativePath = path.relative(compiler.outputPath, metadataFile);
				compilation.emitAsset(relativePath, new RawSource(json));
			});
		});
	}
}

module.exports = IconThemePlugin;
