const path = require("path");
const { makeEsbuildRule, NODE_TARGET } = require("@meese-os/webpack-config");
const mode = process.env.NODE_ENV ?? "development";

module.exports = {
	mode,
	devtool: mode === "production" ? "source-map" : "eval-cheap-module-source-map",
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
