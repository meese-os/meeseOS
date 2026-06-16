const path = require("path");
const mode = process.env.NODE_ENV ?? "development";
const production = mode === "production";
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { makeEsbuildRule } = require("@meese-os/webpack-config");

module.exports = {
	mode,
	devtool: production ? "source-map" : "eval-cheap-module-source-map",
	cache: {
		type: "filesystem",
		cacheDirectory: path.resolve(__dirname, ".webpack-cache"),
		buildDependencies: {
			config: [__filename],
		},
	},
	entry: [path.resolve(__dirname, "index.js")],
	optimization: {
		minimize: production,
	},
	externals: {
		meeseOS: "MeeseOS",
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [{ from: "data", to: "data" }, "icon.png"],
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
