const path = require("path");
const webpack = require("webpack");
const mode = process.env.NODE_ENV ?? "development";
const production = mode === "production";

// Plugins
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { EsbuildPlugin } = require("esbuild-loader");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// Environment variables
const dotenv = require("dotenv");
const client_env_vars = dotenv.config({
	path: path.resolve(__dirname, "src/client/.env"),
}).parsed;

const plugins = [];
if (production) {
	// NOTE: CssMinimizerPlugin lives in optimization.minimizer (the correct slot);
	// pushing it here too minified the CSS twice.
	plugins.push(new CleanWebpackPlugin());
}

module.exports = {
	mode,
	devtool: production ? "source-map" : "eval-cheap-module-source-map",
	cache: {
		type: "filesystem",
		cacheDirectory: path.resolve(__dirname, ".webpack-cache"),
		buildDependencies: {
			config: [__filename],
		},
	},
	entry: {
		meeseOS: path.resolve(__dirname, "src/client/index.js"),
	},
	output: {
		// https://medium.com/walkme-engineering/how-and-when-not-to-use-webpack-for-lazy-loading-bef9d37c42c1
		chunkFilename: "chunks/[name].[chunkhash].bundle.js",
		filename: "[name].[chunkhash].bundle.js",
		path: path.resolve(__dirname, "dist"),
		pathinfo: false,
	},
	performance: {
		maxEntrypointSize: 500 * 1024,
		maxAssetSize: 500 * 1024,
	},
	optimization: {
		minimize: production,
		minimizer: [
			new EsbuildPlugin({
				target: ["chrome109", "edge147", "firefox150", "ios18.5", "opera127", "safari26.3"],
			}),
			new CssMinimizerPlugin(),
		],
		splitChunks: {
			chunks: "all",
		},
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: ["src/client/social.png", "src/client/icon.png"],
		}),
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "src/client/index.ejs"),
			favicon: path.resolve(__dirname, "src/client/favicon.png"),
			title: "Aaron Meese",
		}),
		new MiniCssExtractPlugin({
			filename: "[name].css",
		}),
		new webpack.EnvironmentPlugin({
			"GOOGLE_API_KEY":
				process.env.GOOGLE_API_KEY ?? client_env_vars.GOOGLE_API_KEY,
			"GOOGLE_CLIENT_ID":
				process.env.GOOGLE_CLIENT_ID ?? client_env_vars.GOOGLE_CLIENT_ID,
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
				test: /\.html$/i,
				loader: "html-loader",
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "esbuild-loader",
					options: {
						target: ["chrome109", "edge147", "firefox150", "ios18.5", "opera127", "safari26.3"],
						loader: "js",
					},
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
