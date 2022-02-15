const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
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
		path.resolve(__dirname, "index.js"),
	],
	externals: {
		osjs: "OSjs"
	},
	optimization: {
		minimize,
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				"icon.png"
			]
		}),
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
				exclude: /node_modules/,
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
				exclude: /node_modules\/(?!@osjs)/,
				use: {
					loader: "babel-loader"
				}
			}
		]
	}
};
