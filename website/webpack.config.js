const path = require("path");
const mode = process.env.NODE_ENV || "development";
const minimize = mode === "production";
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodemonPlugin = require("nodemon-webpack-plugin");
const plugins = [];

if (mode === "production") {
	plugins.push(
		new CssMinimizerPlugin({
			minimizerOptions: {
				preset: ["advanced"],
			},
		})
	);
}

const siteTitle = "Aaron Meese";
module.exports = {
	mode,
	devtool: "source-map",
	entry: {
		meeseOS: path.resolve(__dirname, "src/client/index.js"),
	},
	performance: {
		maxEntrypointSize: 500 * 1024,
		maxAssetSize: 500 * 1024,
	},
	watchOptions: {
		aggregateTimeout: 500,
		poll: 1000,
	},
	optimization: {
		minimize,
		splitChunks: {
			chunks: "all",
		},
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "src/client/index.ejs"),
			favicon: path.resolve(__dirname, "src/client/aaron.png"),
			title: siteTitle,
		}),
		new MiniCssExtractPlugin({
			filename: "[name].css",
		}),
		new NodemonPlugin({
			script: "src/server/index.js",
		}),
		...plugins,
	],
	module: {
		rules: [
			{
				test: /\.(svg|png|jpe?g|gif|webp|mp3)$/,
				type: "asset/resource",
			},
			{
				test: /\.(eot|svg|ttf|woff|woff2)$/,
				type: "asset/resource",
				generator: {
					filename: "fonts/[name].[ext]",
				},
			},
			{
				test: /\.(sa|sc|c)ss$/,
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
					options: { compact: false, },
				},
			},
			{
				test: /\.js$/,
				enforce: "pre",
				use: {
					loader: "source-map-loader",
				},
			},
		],
	},
};
