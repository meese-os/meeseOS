const path = require("path");
const { makeEsbuildRule } = require("@meese-os/webpack-config");
const mode = process.env.NODE_ENV ?? "development";
const minimize = mode === "production";

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
	entry: [path.resolve(__dirname, "index.js")],
	output: {
		pathinfo: false,
	},
	optimization: {
		minimize,
	},
	externals: {
		meeseOS: "MeeseOS",
	},
	module: {
		rules: [
			{
				...makeEsbuildRule(),
				exclude: /node_modules/,
			},
		],
	},
};
