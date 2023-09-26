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
	use: [
		{
			loader: "babel-loader",
			options: {
				presets: [
					"@babel/preset-env",
					["@babel/preset-react", { runtime: "automatic" }],
				],
				cacheDirectory: true,
			},
		},
	],
};

module.exports = {
	mode,
	devtool: "source-map",
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
