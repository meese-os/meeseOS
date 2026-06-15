const path = require("path");
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
			patterns: [{ from: "icon.png" }],
		}),
	],
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules\/(?!@meese-os)/,
				loader: "esbuild-loader",
				options: {
					target: ["chrome109", "edge147", "firefox150", "ios18.5", "opera127", "safari26.3"],
					loader: "js",
				},
			},
		],
	},
};
