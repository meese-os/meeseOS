// Shared esbuild-loader configuration for meeseOS webpack builds.
//
// Single source of truth for the browser target so a caniuse-lite refresh
// updates one place instead of every package's webpack.config.js. The browser
// array is derived from the repo-root .browserslistrc via browserslist-to-esbuild
// (see .planning/benchmarks/esbuild-targets.md). Keep this in sync if that derivation changes.

// CommonJS: consumed by per-package webpack.config.js files, which use require().

const BROWSER_TARGET = ["chrome109", "edge147", "firefox150", "ios18.5", "opera127", "safari26.3"];
const NODE_TARGET = "node22";

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

module.exports = { makeEsbuildRule, BROWSER_TARGET, NODE_TARGET };
