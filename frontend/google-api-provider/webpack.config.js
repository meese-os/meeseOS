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
	entry: [path.resolve(__dirname, "index.js")],
	output: {
		library: "meeseOSGisProvider",
		libraryTarget: "umd",
		umdNamedDefine: true,
		sourceMapFilename: "[file].map",
		filename: "[name].js",
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
				test: /\.(svg|png|jpe?g|gif|webp)$/,
				type: "asset/resource",
				exclude: /node_modules/,
				generator: {
					filename: "icons/[name][ext]",
				},
			},
			{
				test: /\.js$/,
				loader: "esbuild-loader",
				options: {
					target: ["chrome109", "edge147", "firefox150", "ios18.5", "opera127", "safari26.3"],
					loader: "js",
				},
			},
		],
	},
};
