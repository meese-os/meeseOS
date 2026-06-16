const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { makeEsbuildRule } = require("@meese-os/webpack-config");

const mode = process.env.NODE_ENV ?? "development";
const production = mode === "production";
const plugins = [];

if (production) {
	plugins.push(new CssMinimizerPlugin());
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
	entry: path.resolve(__dirname, "index.js"),
	externals: {
		meeseOS: "MeeseOS",
	},
	optimization: {
		minimize: production,
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: ["icon.png"],
		}),
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css",
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
				...makeEsbuildRule(),
				exclude: /node_modules/,
			},
		],
	},
};
