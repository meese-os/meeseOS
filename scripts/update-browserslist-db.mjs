#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const lockDir = path.join(repoRoot, "common", "config", "rush");
const lockfilePath = path.join(lockDir, "pnpm-lock.yaml");

if (!fs.existsSync(lockfilePath)) {
	console.error("Could not find pnpm-lock.yaml in common/config/rush.");
	process.exit(1);
}

const rushConfigPath = path.join(repoRoot, "rush.json");
const rushConfigRaw = fs.readFileSync(rushConfigPath, "utf8");
const pnpmVersionMatch = rushConfigRaw.match(/"pnpmVersion"\s*:\s*"([^"]+)"/);
const expectedPnpmVersion = pnpmVersionMatch?.[1];

if (!expectedPnpmVersion) {
	console.error("Could not read pnpmVersion from rush.json.");
	process.exit(1);
}

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const pnpmCheck = spawnSync(pnpmCommand, ["--version"], { stdio: "pipe", encoding: "utf8" });
if (pnpmCheck.error || pnpmCheck.status !== 0) {
	console.error("pnpm must be available on your PATH before updating Browserslist data.");
	process.exit(1);
}

const actualVersion = pnpmCheck.stdout.trim();
const [expMajor, expMinor] = expectedPnpmVersion.split(".").map(Number);
const [actMajor, actMinor] = actualVersion.split(".").map(Number);

if (expMajor !== actMajor || expMinor !== actMinor) {
	console.error(
		`pnpm version mismatch: rush.json pins ${expectedPnpmVersion} but found ${actualVersion}.\n` +
		`Install the correct version to avoid lockfile format issues.`
	);
	process.exit(1);
}

console.log("Updating Browserslist data using pnpm-lock.yaml...");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "meeseos-browserslist-"));
const tempLockfilePath = path.join(tempDir, "pnpm-lock.yaml");
const packageJsonPath = path.join(tempDir, "package.json");
const pnpmfilePath = path.join(tempDir, ".pnpmfile.cjs");

fs.copyFileSync(lockfilePath, tempLockfilePath);

const runPnpm = (args, options = {}) => {
	const result = spawnSync(pnpmCommand, args, {
		cwd: tempDir,
		stdio: "inherit",
		...options
	});
	if (result.error) {
		throw result.error;
	}
	return result.status ?? 1;
};

const placeholder = {
	name: "meeseos-browserslist-updater",
	private: true,
	version: "0.0.0",
	dependencies: {
		"caniuse-lite": "*"
	}
};
const placeholderJson = `${JSON.stringify(placeholder, null, 2)}\n`;
fs.writeFileSync(packageJsonPath, placeholderJson);

const pnpmfileStub = [
	"module.exports = {",
	"\thooks: {",
	"\t\treadPackage(pkg) {",
	"\t\t\treturn pkg;",
	"\t\t}",
	"\t}",
	"};",
	""
].join("\n");
fs.writeFileSync(pnpmfilePath, pnpmfileStub);

let status = 1;

try {
	status = runPnpm(["dlx", "update-browserslist-db@1.1.3"]);

	if (status === 0) {
		status = runPnpm([
			"up",
			"--recursive",
			"--lockfile-only",
			"caniuse-lite@^1"
		]);
	}

	if (status === 0) {
		status = runPnpm(["dedupe", "caniuse-lite", "--lockfile-only"]);
	}
} catch (error) {
	console.error(error);
	status = 1;
} finally {
	if (status === 0 && fs.existsSync(tempLockfilePath)) {
		try {
			fs.copyFileSync(tempLockfilePath, lockfilePath);
		} catch (error) {
			console.error(`Failed to copy updated lockfile back: ${error.message}`);
			status = 1;
		}
	}

	try {
		fs.rmSync(tempDir, { recursive: true, force: true });
	} catch (error) {
		console.warn(`Failed to clean up temporary directory: ${error.message}`);
	}
}

if (status === 0) {
	console.log(
		"Browserslist data refreshed and caniuse-lite entries deduplicated. Run \"rush update --purge\" to reinstall dependencies if cached installs keep older caniuse-lite versions."
	);
}

process.exit(status);
