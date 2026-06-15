const path = require("path");
const mode = process.env.NODE_ENV ?? "development";
const minimize = mode === "production";
const plugins = [];

module.exports = {
	mode,
	target: "node",
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
