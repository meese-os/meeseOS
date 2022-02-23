const path = require("path");
const mode = process.env.NODE_ENV || "development";
const minimize = mode === "production";
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
	mode,
	devtool: "source-map",
	entry: [
		path.resolve(__dirname, "index.js"),
	],
	optimization: {
		minimize,
	},
	externals: {
		meeseOS: "MeeseOS",
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [ "icon.png" ],
		})
	],
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader"
				}
			}
		]
	}
};
