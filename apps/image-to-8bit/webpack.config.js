const path = require("path");
const { makeEsbuildRule } = require("@meese-os/webpack-config");
const mode = process.env.NODE_ENV ?? "development";
const minimize = mode === "production";
const CopyWebpackPlugin = require("copy-webpack-plugin");

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
	plugins: [
		new CopyWebpackPlugin({
			patterns: ["game_controller.png"],
		}),
	],
	module: {
		rules: [
			{
				...makeEsbuildRule(),
				exclude: /node_modules/,
			},
		],
	},
};
