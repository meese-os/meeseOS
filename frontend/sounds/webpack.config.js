const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
	devtool: "source-map",
	mode: "production",
	cache: {
		type: "filesystem",
		cacheDirectory: path.resolve(__dirname, ".webpack-cache"),
		buildDependencies: {
			config: [__filename],
		},
	},
	entry: path.resolve(__dirname, "index.js"),
	output: {
		path: path.resolve(__dirname, "dist"),
		pathinfo: false,
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [{ from: path.resolve("./src") }],
		}),
	],
};
