const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

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
	resolve: {
		fallback: {
			url: require.resolve("url"),
			fs: require.resolve("graceful-fs"),
			buffer: require.resolve("buffer/"),
			stream: require.resolve("stream-browserify"),
			events: require.resolve("events/"),
		},
	},
	externals: {
		meeseOS: "MeeseOS",
	},
	optimization: {
		minimize,
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: ["icon.png"],
		}),
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css",
		}),
		// https://stackoverflow.com/a/71129826/6456163
		new webpack.ProvidePlugin({
			Buffer: ["buffer", "Buffer"],
			process: "process/browser",
		}),
		new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
			const mod = resource.request.replace(/^node:/, "");
			switch (mod) {
				case "buffer":
					resource.request = "buffer";
					break;
				case "stream":
					resource.request = "readable-stream";
					break;
				default:
					throw new Error(`Not found ${mod}`);
			}
		}),
		...plugins,
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
				exclude: /node_modules\/(?!@meese-os)/,
				resolve: {
					fullySpecified: false,
				},
				use: {
					loader: "babel-loader",
				},
			},
		],
	},
};
