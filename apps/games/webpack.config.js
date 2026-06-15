const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const mode = process.env.NODE_ENV ?? "development";
const minimize = mode === "production";
const plugins = [];

if (mode === "production") {
	plugins.push(new CssMinimizerPlugin());
}

const jsxLoader = {
	test: /\.jsx?$/,
	exclude: /node_modules/,
	resolve: {
		extensions: [".js", ".jsx"],
	},
	loader: "esbuild-loader",
	options: {
		target: ["chrome109", "edge147", "firefox150", "ios18.5", "opera127", "safari26.3"],
		loader: "jsx",
		jsx: "automatic",
		jsxImportSource: "react",
	},
};

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
	target: "web",
	resolve: {
		fallback: {
			url: false,
		},
	},
	externals: {
		meeseOS: "MeeseOS",
	},
	optimization: {
		minimize,
	},
	output: {
		pathinfo: false,
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				"icon.png",
				{ from: "node_modules/js-dos/dist", to: "js-dos" },
				{ from: "dos-files/*" },
				{ from: "images/*" },
			],
		}),
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css",
		}),
		...plugins,
	],
	module: {
		rules: [
			jsxLoader,
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
		],
	},
};
