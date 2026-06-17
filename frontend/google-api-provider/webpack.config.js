const path = require("path");
const { makeEsbuildRule, INFRASTRUCTURE_LOGGING } = require("@meese-os/webpack-config");
const mode = process.env.NODE_ENV ?? "development";

module.exports = {
	mode,
	devtool: mode === "production" ? "source-map" : "eval-cheap-module-source-map",
	infrastructureLogging: INFRASTRUCTURE_LOGGING,
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
			makeEsbuildRule(),
		],
	},
};
