const path = require("path");
const mode = process.env.NODE_ENV ?? "development";
const minimize = mode === "production";
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
	mode,
	devtool: "source-map",
	entry: [path.resolve(__dirname, "index.js")],
	optimization: {
		minimize,
	},
	externals: {
		meeseOS: "MeeseOS",
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: ["icon.svg"],
		}),
	],
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: "esbuild-loader",
				options: {
					target: ["chrome109", "edge147", "firefox150", "ios18.5", "opera127", "safari26.3"],
					loader: "js",
				},
			},
		],
	},
};
