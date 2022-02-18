const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const mode = process.env.NODE_ENV || "development";
const minimize = mode === "production";
const plugins = [];

if (mode === "production") {
	plugins.push(new CssMinimizerPlugin({
		minimizerOptions: {
			preset: [ "advanced" ],
		},
	}));
}

module.exports = {
	mode,
	devtool: "source-map",
	entry: [
		path.resolve(__dirname, "src/umd.js")
	],
	output: {
		library: "meeseOSGui",
		libraryTarget: "umd",
		umdNamedDefine: true,
		sourceMapFilename: "[file].map",
		filename: "[name].js"
	},
	optimization: {
		minimize,
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css"
		}),
		...plugins
	],
	module: {
		rules: [
			{
				test: /\.(sa|sc|c)ss$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: "css-loader",
						options: {
							sourceMap: true
						}
					},
					{
						loader: "sass-loader",
						options: {
							sourceMap: true
						}
					}
				]
			},
			{
				test: /\.js$/,
				use: {
					loader: "babel-loader"
				}
			}
		]
	}
};
