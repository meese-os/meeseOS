const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
	devtool: "source-map",
	mode: "production",
	entry: path.resolve(__dirname, "index.js"),
	output: {
		path: path.resolve(__dirname, "dist"),
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [{ from: path.resolve("./src") }],
		}),
	],
};
