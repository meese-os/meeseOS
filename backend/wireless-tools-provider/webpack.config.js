const path = require("path");
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
	entry: [path.resolve(__dirname, "src/client.js")],
	output: {
		library: "meeseOSWirelessToolsProvider",
		libraryTarget: "umd",
		umdNamedDefine: true,
		sourceMapFilename: "[file].map",
		filename: "[name].js",
		path: path.resolve(__dirname, "dist"),
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
