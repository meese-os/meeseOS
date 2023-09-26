const path = require("path");
const mode = process.env.NODE_ENV ?? "development";
const minimize = mode === "production";
const plugins = [];

module.exports = {
	mode,
	target: "node",
	devtool: "source-map",
	entry: [path.resolve(__dirname, "index.js")],
	output: {
		libraryTarget: "commonjs",
		sourceMapFilename: "[file].map",
		filename: "[name].js",
	},
	optimization: {
		minimize,
	},
	plugins: [...plugins],
	module: {
		rules: [
			{
				test: /\.js$/,
				use: {
					loader: "babel-loader",
				},
			},
		],
	},
};
