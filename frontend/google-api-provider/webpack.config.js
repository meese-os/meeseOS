const path = require("path");
const mode = process.env.NODE_ENV ?? "development";

module.exports = {
	mode,
	devtool: "source-map",
	entry: [path.resolve(__dirname, "index.js")],
	output: {
		library: "meeseOSGisProvider",
		libraryTarget: "umd",
		umdNamedDefine: true,
		sourceMapFilename: "[file].map",
		filename: "[name].js",
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
				use: {
					loader: "babel-loader",
				},
			},
		],
	},
};
