const path = require("path");
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
	resolve: {
		symlinks: false,
	},
	optimization: {
		minimize: mode === "production",
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				loader: "esbuild-loader",
				options: {
					target: "node22",
					loader: "js",
				},
			},
		],
	},
};
