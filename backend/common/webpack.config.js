const path = require("path");
const { makeEsbuildRule, NODE_TARGET, INFRASTRUCTURE_LOGGING } = require("@meese-os/webpack-config");
const mode = process.env.NODE_ENV ?? "development";
const minimize = mode === "production";
const plugins = [];

module.exports = {
	mode,
	target: "node",
	devtool: mode === "production" ? "source-map" : "eval-cheap-module-source-map",
	infrastructureLogging: INFRASTRUCTURE_LOGGING,
	cache: {
		type: "filesystem",
		cacheDirectory: path.resolve(__dirname, ".webpack-cache"),
		buildDependencies: {
			config: [__filename],
		},
	},
	entry: [path.resolve(__dirname, "index.js")],
	output: {
		libraryTarget: "commonjs",
		sourceMapFilename: "[file].map",
		filename: "[name].js",
		pathinfo: false,
	},
	optimization: {
		minimize,
	},
	plugins: [...plugins],
	module: {
		rules: [
			makeEsbuildRule({ target: NODE_TARGET }),
		],
	},
};
