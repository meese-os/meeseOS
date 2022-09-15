/**
 * MeeseOS - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2022-Present, Aaron Meese <aaronjmeese@gmail.com>
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
 * @author  Aaron Meese <aaronjmeese@gmail.com>
 * @licence Simplified BSD License
 */

const path = require("path");

class IconThemePlugin {
	apply(compiler) {
		const pluginName = IconThemePlugin.name;
		const { webpack } = compiler;
		const { RawSource } = webpack.sources;

		compiler.hooks.emit.tap(pluginName, (compilation) => {
			const icons = compilation.getAssets().map(
				(asset) => asset.name.split("/").pop()
			);

			const metadataFile = `${compiler.context}/metadata.json`;
			const metadata = require(metadataFile);

			// Create an object with the property name as the asset name
			// and the value as the file extension
			const iconEntries = icons.map((file) => [
				file.substr(0, file.lastIndexOf(".")),
				file.substr(file.lastIndexOf(".") + 1, file.length)
			]);

			// Sort the icons by name
			const sortedIcons = Object.fromEntries(
				iconEntries.sort((a, b) => a[0].localeCompare(b[0]))
			);

			// Remove "icons" that aren't actually icons
			const badFileTypes = ["map", "js"];
			metadata.icons = Object.fromEntries(
				Object.entries(sortedIcons).filter(
					([key, value]) => !badFileTypes.includes(value)
				)
			);

			// Write the new metadata to the file
			const json = JSON.stringify(metadata, null, 2);
			const relativePath = path.relative(compiler.outputPath, metadataFile);
			compilation.emitAsset(relativePath, new RawSource(json));
		});
	}
}

module.exports = IconThemePlugin;