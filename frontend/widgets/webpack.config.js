const path = require("path");
const { makeEsbuildRule } = require("@meese-os/webpack-config");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const mode = process.env.NODE_ENV ?? "development";
const minimize = mode === "production";
const plugins = [];

if (minimize) {
	plugins.push(new CssMinimizerPlugin());
}

module.exports = {
	mode,
	devtool: mode === "production" ? "source-map" : "eval-cheap-module-source-map",
	cache: {
		type: "filesystem",
		cacheDirectory: path.resolve(__dirname, ".webpack-cache"),
		buildDependencies: {
			config: [__filename],
		},
	},
	entry: path.resolve(__dirname, "index.js"),
	output: {
		library: "meeseOSWidgets",
		libraryTarget: "umd",
		umdNamedDefine: true,
		sourceMapFilename: "[file].map",
		filename: "[name].js",
		pathinfo: false,
	},
	optimization: {
		minimize,
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css",
		}),
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
				...makeEsbuildRule(),
				exclude: /node_modules/,
			},
		],
	},
};
