const path = require("path");
const webpack = require("webpack");
const mode = process.env.NODE_ENV || "development";
const minimize = mode === "production";

// Plugins
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

// Environment variables
const dotenv = require("dotenv");
const client_env_vars = dotenv.config({
	path: path.resolve(__dirname, "src/client/.env"),
}).parsed;

const plugins = [];
if (mode === "production") {
	plugins.push(new CssMinimizerPlugin());
	plugins.push(new UglifyJsPlugin({
		sourceMap: true
	}));
	plugins.push(new CleanWebpackPlugin());
}

module.exports = {
	mode,
	devtool: "source-map",
	entry: {
		meeseOS: path.resolve(__dirname, "src/client/index.js"),
	},
	output: {
		// https://medium.com/walkme-engineering/how-and-when-not-to-use-webpack-for-lazy-loading-bef9d37c42c1
		chunkFilename: "chunks/[name].[chunkhash].bundle.js",
		filename: "[name].[chunkhash].bundle.js",
		path: path.resolve(__dirname, "dist")
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
		new CopyWebpackPlugin({
			patterns: ["src/client/social.png"],
			patterns: ["src/client/icon.png"],
		}),
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "src/client/index.ejs"),
			favicon: path.resolve(__dirname, "src/client/favicon.png"),
			title: "Aaron Meese",
		}),
		new MiniCssExtractPlugin({
			filename: "[name].css",
		}),
		new webpack.DefinePlugin({
			"process.env": {
				"GOOGLE_API_KEY": JSON.stringify(
					process.env.GOOGLE_API_KEY || client_env_vars.GOOGLE_API_KEY
				),
				"GOOGLE_CLIENT_ID": JSON.stringify(
					process.env.GOOGLE_CLIENT_ID || client_env_vars.GOOGLE_CLIENT_ID
				),
			},
		}),
		...plugins,
	],
	module: {
		rules: [
			{
				test: /\.(svg|png|jpe?g|gif|webp|mp3)$/,
				type: "asset/resource",
				generator: {
					filename: "[name][ext]",
				},
			},
			{
				test: /\.(eot|ttf|woff|woff2)$/,
				type: "asset/resource",
				generator: {
					filename: "fonts/[name][ext]",
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
					options: { compact: false },
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
