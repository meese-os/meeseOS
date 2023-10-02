const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const mode = process.env.NODE_ENV ?? "development";
const production = mode === "production";
const plugins = [];
if (production) {
	plugins.push(new CssMinimizerPlugin());
}

// Loaders
const cssLoader = {
	loader: "css-loader",
	options: { sourceMap: production },
};
const postcssLoader = {
	// Required for Bootstrap as per the following:
	// https://getbootstrap.com/docs/4.1/getting-started/webpack/#importing-styles
	loader: "postcss-loader",
	options: {
		postcssOptions: {
			plugins: ["postcss-preset-env"],
		},
	},
};
const sassLoader = {
	loader: "sass-loader",
	options: { sourceMap: production },
};
const styleLoader = {
	test: /\.css$/,
	use: ["style-loader", cssLoader],
};
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
const pdfLoader = {
	test: /\.pdf$/,
	type: "asset/resource",
	generator: {
		filename: "[name][ext]",
	},
};
const fontAwesomeLoader = {
	test: /\.(ttf|eot|svg|woff(2)?)$/,
	include: path.resolve(__dirname, "node_modules/font-awesome/fonts"),
	type: "asset/resource",
	generator: {
		filename: "fonts/[name][ext]",
	},
};

module.exports = {
	mode,
	devtool: "source-map",
	entry: path.resolve(__dirname, "index.js"),
	target: "web",
	resolve: {
		fallback: {
			fs: false,
			os: false,
			path: false,
		},
	},
	externals: {
		meeseOS: "MeeseOS",
	},
	optimization: {
		minimize: production,
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
			fontAwesomeLoader,
			pdfLoader,
			styleLoader,
			jsxLoader,
			{
				test: /\.scss$/,
				exclude: /node_modules/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							esModule: false,
						},
					},
					cssLoader,
					postcssLoader,
					sassLoader,
				],
			},
		],
	},
};
