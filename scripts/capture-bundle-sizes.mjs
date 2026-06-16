#!/usr/bin/env node
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
 * @licence Simplified BSD License
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

/**
	Recursively sums the byte size of all .js and .css files under a directory.
	Descends into real subdirectories only (e.g. chunks/), skipping symlinked directories.
	Skipping symlinks prevents double-counting: website/dist/ contains symlinked app bundle dirs
	that point back to each app package's own dist/, which is already counted separately.
*/
const sumJsCssBytes = (dir) => {
	let total = 0;
	if (!fs.existsSync(dir)) {
		return total;
	}
	for (const entry of fs.readdirSync(dir)) {
		const fullPath = path.join(dir, entry);
		// Use lstat to detect symlinks without following them.
		const lstat = fs.lstatSync(fullPath);
		if (lstat.isSymbolicLink()) {
			// Skip symlinks -- website/dist/ uses symlinks to serve other packages' outputs.
			// Those packages are counted via their own dist/ directories.
			continue;
		}
		if (lstat.isDirectory()) {
			total += sumJsCssBytes(fullPath);
		} else if (entry.endsWith(".js") || entry.endsWith(".css")) {
			total += lstat.size;
		}
	}
	return total;
};

/**
	Reads the project list from rush.json via regex (no JSON5 parser needed, avoids
	adding a dependency, mirrors the approach in benchmark.mjs for rush versions).
	Extracts all { packageName, projectFolder } pairs using named-capture regexes.
	Returns an array of { packageName, projectFolder } objects.
*/
const readRushProjects = () => {
	const rushConfigPath = path.join(repoRoot, "rush.json");
	const raw = fs.readFileSync(rushConfigPath, "utf8");

	const projects = [];
	// Match each project entry: find "packageName" and "projectFolder" in sequence within
	// a project block. We use a regex that grabs both fields from the same entry.
	// Pattern: "packageName": "...", followed (anywhere in the same block) by "projectFolder": "..."
	const projectBlockRe = /"packageName"\s*:\s*"([^"]+)"[\s\S]*?"projectFolder"\s*:\s*"([^"]+)"/g;
	let match;
	while ((match = projectBlockRe.exec(raw)) !== null) {
		projects.push({
			packageName: match[1],
			projectFolder: match[2],
		});
	}
	return projects;
};

/**
	Walks each project's dist/ directory, sums .js + .css file sizes (recursing into
	subdirs like chunks/), and returns a { packageName: totalBytes } map.
	Also writes the map to .planning/benchmarks/bundle-sizes-<label>.json.

	@param {string} label - snapshot label, e.g. "baseline" or "after"
	@returns {{ [packageName: string]: number }} per-package byte totals
*/
const captureOutputSizes = (label) => {
	const projects = readRushProjects();
	const sizes = {};

	for (const { packageName, projectFolder } of projects) {
		const distDir = path.join(repoRoot, projectFolder, "dist");
		const bytes = sumJsCssBytes(distDir);
		if (bytes > 0) {
			sizes[packageName] = bytes;
		}
	}

	const outDir = path.join(repoRoot, ".planning", "benchmarks");
	fs.mkdirSync(outDir, { recursive: true });

	const outPath = path.join(outDir, `bundle-sizes-${label}.json`);
	fs.writeFileSync(outPath, JSON.stringify(sizes, null, "\t") + "\n");

	console.log(`\nBundle sizes (${label}) written to ${outPath}`);
	console.log(`Packages with dist/ output: ${Object.keys(sizes).length}`);
	for (const [pkg, bytes] of Object.entries(sizes)) {
		console.log(`  ${pkg}: ${(bytes / 1024).toFixed(1)} KB`);
	}

	return sizes;
};

// CLI entry point: node scripts/capture-bundle-sizes.mjs [label]
const label = process.argv[2] ?? "snapshot";
captureOutputSizes(label);
