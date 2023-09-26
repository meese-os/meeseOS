const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const IconThemePlugin = require("../../development/iconThemePlugin");

const mode = process.env.NODE_ENV ?? "development";
const minimize = mode === "production";
const plugins = [];

if (mode === "production") {
	plugins.push(new CssMinimizerPlugin());
}

module.exports = {
	mode,
	devtool: "source-map",
	entry: [path.resolve(__dirname, "index.js")],
	optimization: {
		minimize,
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css",
		}),
		new IconThemePlugin(),
		...plugins,
	],
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
				test: /\.(sa|sc|c)ss$/,
				exclude: /node_modules/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: "css-loader",
						options: {
							sourceMap: true,
						},
					},
					{
						loader: "sass-loader",
						options: {
							sourceMap: true,
						},
					},
				],
			},
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
