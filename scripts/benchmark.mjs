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

import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const COLD_RUNS = 3;

const buildCacheDir = path.join(repoRoot, "common", "temp", "build-cache");
const commonTempDir = path.join(repoRoot, "common", "temp");

/**
	Wipes both cache layers before a cold run:
	1. Contents of common/temp/build-cache/ (Rush build output cache)
	2. Every node_modules/.cache directory under repoRoot, excluding common/temp/
	Never deletes common/temp/node_modules (pnpm virtual store) or common/temp/pnpm-store.
	Does not invoke the Rush purge command (which would wipe the pnpm store and inflate timings).
*/
const wipeCaches = () => {
	// Layer 1: Rush build cache tar archives
	if (fs.existsSync(buildCacheDir)) {
		for (const entry of fs.readdirSync(buildCacheDir)) {
			fs.rmSync(path.join(buildCacheDir, entry), { recursive: true, force: true });
		}
	}

	// Layer 2: per-package node_modules/.cache (babel-loader, future webpack FS cache)
	// Depth-bounded (-maxdepth before -path, per GNU find option ordering), excluding
	// common/temp/ to protect the pnpm virtual store. No `2>/dev/null || true`: a wipe
	// failure must abort the run, otherwise we would time a "cold" build against a dirty
	// cache and report a corrupt number as if it were valid.
	try {
		execSync(
			`find "${repoRoot}" -maxdepth 6 -path "*/node_modules/.cache" -not -path "${commonTempDir}/*" -exec rm -rf {} +`,
			{ stdio: "inherit", cwd: repoRoot }
		);
	} catch (err) {
		throw new Error(`Cache wipe failed; aborting to avoid reporting a polluted "cold" timing: ${err.message}`);
	}
};

/**
	Runs `rush build` and returns wall-clock duration in milliseconds.
	Cold vs warm is determined entirely by cache state, not by a different command:
	- Cold: called right after wipeCaches(), so with both cache layers empty `rush build`
	  performs a full webpack run on every package (the "rush rebuild" semantics we want).
	  `rush rebuild` itself is unusable here because it requires a per-package "rebuild"
	  script and none of the 36 packages define one.
	- Warm: called once after the cold runs, when the build cache is fully populated, so it
	  reflects incremental rebuild speed (D-05).
*/
const timedRushBuild = () => {
	const start = Date.now();
	execSync("rush build", { stdio: "inherit", cwd: repoRoot });
	return Date.now() - start;
};

/**
	Computes the median of an array of numbers.
	For 3 samples (odd length) returns the middle element after sorting.
	For even-length arrays returns the mean of the two middle elements.
*/
const median = (arr) => {
	const sorted = [...arr].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 !== 0
		? sorted[mid]
		: (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Formats milliseconds as a human-readable seconds string, e.g. "187.3s". */
const fmtMs = (ms) => `${(ms / 1000).toFixed(1)}s`;

/** Reads rushVersion and pnpmVersion from rush.json via regex (no JSON5 parser needed). */
const readRushVersions = () => {
	const rushConfigPath = path.join(repoRoot, "rush.json");
	const raw = fs.readFileSync(rushConfigPath, "utf8");
	const rushVersionMatch = raw.match(/"rushVersion"\s*:\s*"([^"]+)"/);
	const pnpmVersionMatch = raw.match(/"pnpmVersion"\s*:\s*"([^"]+)"/);
	return {
		rushVersion: rushVersionMatch?.[1] ?? "unknown",
		pnpmVersion: pnpmVersionMatch?.[1] ?? "unknown",
	};
};

// Main benchmark flow

// Ensure the output directory exists BEFORE spending minutes on builds. `.planning/` is
// git-ignored, so on a fresh clone or CI it may not exist; create it now so a missing dir
// fails fast here instead of throwing ENOENT after the full run and discarding all results.
const resultsPath = path.join(repoRoot, ".planning", "benchmarks", "results.md");
fs.mkdirSync(path.dirname(resultsPath), { recursive: true });

const coldDurations = [];

for (let i = 0; i < COLD_RUNS; i++) {
	console.log(`\nCold run ${i + 1}/${COLD_RUNS} -- wiping cache...`);
	wipeCaches();
	console.log(`Cold run ${i + 1}/${COLD_RUNS} -- running rush build (cold: caches wiped)...`);
	const duration = timedRushBuild();
	coldDurations.push(duration);
	console.log(`Cold run ${i + 1}/${COLD_RUNS} -- completed in ${fmtMs(duration)}`);
}

const coldMedian = median(coldDurations);

console.log("\nWarm run -- running rush build...");
const warmDuration = timedRushBuild();
console.log(`Warm run -- completed in ${fmtMs(warmDuration)}`);

// Environment capture
const cpuModel = os.cpus()[0]?.model?.trim() ?? "unknown";
const coreCount = os.cpus().length;
const ramGb = Math.round(os.totalmem() / 1024 / 1024 / 1024);
const osInfo = `${os.type()} ${os.release()}`;
const nodeVersion = process.version;
const { rushVersion, pnpmVersion } = readRushVersions();
const runDate = new Date().toISOString().split("T")[0];

// Results markdown -- format lets Phase 3 fill in the "Phase 3 After" and "Delta" columns
const resultsContent = [
	"# Build Speedup Benchmark Results",
	"",
	"## Summary",
	"",
	"| Metric | Phase 1 Baseline | Phase 3 After | Delta |",
	"|--------|-----------------|---------------|-------|",
	`| Cold build median (3 runs) | ${fmtMs(coldMedian)} | | |`,
	`| Warm build (1 run) | ${fmtMs(warmDuration)} | | |`,
	"",
	"**Verdict:** Phase 3 fills this in.",
	"",
	"## Environment",
	"",
	"Baseline and final measurements both ran on this machine. Comparison is valid.",
	"",
	"| Property | Value |",
	"|----------|-------|",
	`| CPU | ${cpuModel}, ${coreCount} cores |`,
	`| RAM | ${ramGb} GB |`,
	`| OS | ${osInfo} |`,
	`| Node | ${nodeVersion} |`,
	`| pnpm (Rush-managed) | ${pnpmVersion} |`,
	`| Rush | ${rushVersion} |`,
	"| Packages built | 36 total (29 run actual webpack builds) |",
	`| Run date (baseline) | ${runDate} |`,
	"| Run date (final) | |",
	"",
	"## Cold Build Detail (Phase 1 Baseline)",
	"",
	"| Run | Duration |",
	"|-----|----------|",
	...coldDurations.map((d, i) => `| ${i + 1} | ${fmtMs(d)} |`),
	`| **Median** | **${fmtMs(coldMedian)}** |`,
	"",
	"## Cold Build Detail (Phase 3 Final)",
	"",
	"Phase 3 fills this in.",
	"",
	"## CI Observations (Secondary)",
	"",
	"Phase 3 fills this in. CI timing is secondary per D-07 (CI runners are noisy).",
	"",
].join("\n");

fs.writeFileSync(resultsPath, resultsContent);

console.log(`\nResults written to ${resultsPath}`);
console.log(`Cold median: ${fmtMs(coldMedian)} (runs: ${coldDurations.map(fmtMs).join(", ")})`);
console.log(`Warm build: ${fmtMs(warmDuration)}`);
