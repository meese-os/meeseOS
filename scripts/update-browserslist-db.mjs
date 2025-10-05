#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
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

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const pnpmCheck = spawnSync(pnpmCommand, ["--version"], { stdio: "ignore" });
if (pnpmCheck.error || pnpmCheck.status !== 0) {
	console.error("pnpm must be available on your PATH before updating Browserslist data.");
	process.exit(1);
}

console.log("Updating Browserslist data using pnpm-lock.yaml...");

const packageJsonPath = path.join(lockDir, "package.json");
const pnpmfilePath = path.join(lockDir, ".pnpmfile.cjs");
const nodeModulesPath = path.join(lockDir, "node_modules");

const hadPackageJson = fs.existsSync(packageJsonPath);
const hadPnpmfile = fs.existsSync(pnpmfilePath);
const hadNodeModules = fs.existsSync(nodeModulesPath);

const runPnpm = (args, options = {}) => {
	const result = spawnSync(pnpmCommand, args, {
		cwd: lockDir,
		stdio: "inherit",
		...options
	});
	if (result.error) {
		throw result.error;
	}
	return result.status ?? 1;
};

if (!hadPackageJson) {
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
}

if (!hadPnpmfile) {
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
}

let status = 1;

try {
	status = runPnpm(["dlx", "update-browserslist-db@latest"]);

	if (status === 0) {
		status = runPnpm([
			"up",
			"--recursive",
			"--lockfile-only",
			"caniuse-lite@latest"
		]);
	}

	if (status === 0) {
		status = runPnpm(["dedupe", "caniuse-lite", "--lockfile-only"]);
	}
} catch (error) {
	console.error(error);
	status = 1;
} finally {
	if (!hadPackageJson && fs.existsSync(packageJsonPath)) {
		try {
			fs.unlinkSync(packageJsonPath);
		} catch (error) {
			console.warn(`Failed to clean up temporary package.json: ${error.message}`);
		}
	}

	if (!hadPnpmfile && fs.existsSync(pnpmfilePath)) {
		try {
			fs.unlinkSync(pnpmfilePath);
		} catch (error) {
			console.warn(`Failed to clean up temporary .pnpmfile.cjs: ${error.message}`);
		}
	}

	if (!hadNodeModules && fs.existsSync(nodeModulesPath)) {
		fs.rmSync(nodeModulesPath, { recursive: true, force: true });
	}
}

if (status === 0) {
	console.log(
		"Browserslist data refreshed and caniuse-lite entries deduplicated. Run \"rush update --purge\" to reinstall dependencies if cached installs keep older caniuse-lite versions."
	);
}

process.exit(status);
