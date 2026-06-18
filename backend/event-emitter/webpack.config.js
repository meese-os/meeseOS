const path = require("path");
const { makeEsbuildRule, NODE_TARGET, INFRASTRUCTURE_LOGGING } = require("@meese-os/webpack-config");
const mode = process.env.NODE_ENV ?? "development";

module.exports = {
	mode,
	devtool: mode === "production" ? "source-map" : "eval-cheap-module-source-map",
	infrastructureLogging: INFRASTRUCTURE_LOGGING,
	cache: {
		type: "filesystem",
		cacheDirectory: path.resolve(__dirname, ".webpack-cache"),
		buildDependencies: {
			config: [__filename],
		},
	},
	target: "node",
	entry: [path.resolve(__dirname, "index.js")],
	output: {
		library: "meeseOSEventEmitter",
		libraryTarget: "umd",
		// This package is isomorphic: the browser client bundles it too. For
		// target:"node", webpack defaults the UMD root object to `global`, which
		// is undefined in browsers and throws "global is not defined" the moment
		// the wrapper is evaluated. Use an expression that is safe to evaluate in
		// browsers, web workers, and Node.
		globalObject: "typeof self !== 'undefined' ? self : this",
		pathinfo: false,
	},
	optimization: {
		minimize: mode === "production",
	},
	module: {
		rules: [
			makeEsbuildRule({ target: NODE_TARGET }),
		],
	},
};
