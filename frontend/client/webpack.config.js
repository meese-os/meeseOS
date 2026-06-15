const path = require("path");
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
	devtool: mode === "production" ? "source-map" : "eval-cheap-module-source-map",
	cache: {
		type: "filesystem",
		cacheDirectory: path.resolve(__dirname, ".webpack-cache"),
		buildDependencies: {
			config: [__filename],
		},
	},
	entry: [path.resolve(__dirname, "index.js")],
	output: {
		library: "meeseOSClient",
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
					filename: "[name][ext]",
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
				test: /\.html$/i,
				loader: "html-loader",
			},
			{
				test: /\.js$/,
				exclude: /node_modules\/(?!@meese-os)/,
				use: {
					loader: "esbuild-loader",
					options: {
						target: ["chrome109", "edge147", "firefox150", "ios18.5", "opera127", "safari26.3"],
						loader: "js",
					},
				},
			},
			{
				test: /\.d\.ts$/,
				use: {
					loader: "ignore-loader",
				},
			},
		],
	},
};
