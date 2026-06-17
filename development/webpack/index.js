// Shared esbuild-loader configuration for meeseOS webpack builds.
//
// Single source of truth for the browser target so a caniuse-lite refresh
// updates one place instead of every package's webpack.config.js. The browser
// array is derived from the repo-root .browserslistrc via browserslist-to-esbuild
// (see .planning/benchmarks/esbuild-targets.md). Keep this in sync if that derivation changes.

// CommonJS: consumed by per-package webpack.config.js files, which use require().

const BROWSER_TARGET = ["chrome109", "edge147", "firefox150", "ios18.5", "opera127", "safari26.3"];
const NODE_TARGET = "node22";

// Quiet webpack's filesystem-cache chatter. PackFileCacheStrategy logs a
// "Restoring/Caching failed for pack" warning whenever it meets a corrupt or
// truncated .pack file (left behind by an interrupted or OOM-killed build).
// webpack recovers on its own by rebuilding the entry, so the build is always
// correct; the warnings are advisory noise, not actionable errors. Rush caches
// each operation's terminal output, so a single corrupt-pack build gets its
// warning log replayed on every later cache restore, which makes the noise look
// permanent. Demoting infrastructure logging to "error" drops the advisory
// cache warnings while leaving real compile errors and warnings (which come
// through `stats`, not the infrastructure logger) fully visible.
const INFRASTRUCTURE_LOGGING = { level: "error" };

/**
 * Build the esbuild-loader `module.rules` entry used across meeseOS webpack configs.
 *
 * @param {object} [opts]
 * @param {"js"|"jsx"} [opts.loader="js"] esbuild loader; "jsx" enables the React automatic runtime.
 * @param {string|string[]} [opts.target=BROWSER_TARGET] esbuild target(s); pass NODE_TARGET for node libraries.
 * @returns {object} a webpack `module.rules` entry.
 */
const makeEsbuildRule = (opts = {}) => {
	const { loader = "js", target = BROWSER_TARGET } = opts;
	const options = { target, loader };
	if (loader === "jsx") {
		options.jsx = "automatic";
		options.jsxImportSource = "react";
	}

	return {
		test: loader === "jsx" ? /\.jsx?$/ : /\.js$/,
		loader: "esbuild-loader",
		options,
	};
};

module.exports = { makeEsbuildRule, BROWSER_TARGET, NODE_TARGET, INFRASTRUCTURE_LOGGING };
