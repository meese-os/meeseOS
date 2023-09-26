const path = require("path");
const mode = process.env.NODE_ENV ?? "development";
const minimize = mode === "production";

module.exports = {
	mode,
	devtool: "source-map",
	entry: [path.resolve(__dirname, "src/client.js")],
	output: {
		library: "meeseOSWirelessToolsProvider",
		libraryTarget: "umd",
		umdNamedDefine: true,
		sourceMapFilename: "[file].map",
		filename: "[name].js",
		path: path.resolve(__dirname, "dist"),
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
				use: {
					loader: "babel-loader",
				},
			},
		],
	},
};
