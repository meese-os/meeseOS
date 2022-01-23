const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const mode = process.env.NODE_ENV || 'development';
const minimize = mode === 'production';
const plugins = [];

if (mode === 'production') {
  plugins.push(new OptimizeCSSAssetsPlugin({
    cssProcessorOptions: {
      discardComments: true
    },
  }));
}

// Loaders
const sassLoader = {
  loader: 'sass-loader',
  options: {
    sourceMap: true
  }
};
const cssLoader = {
  loader: 'css-loader',
  options: {
    sourceMap: true
  }
};
const styleLoader = {
  test: /\.css$/,
  use: ['style-loader', cssLoader]
};
const binaryLoader = {
  test: /\.(ico|jpg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|pdf)(\?.*)?$/,
  loader: 'file-loader',
};

module.exports = {
  mode,
  devtool: 'source-map',
  entry: path.resolve(__dirname, 'index.js'),
  target: 'web',
  node: {
    fs: 'empty',
  },
  externals: {
    osjs: 'OSjs'
  },
  optimization: {
    minimize,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    }),
    ...plugins
  ],
  module: {
    rules: [
      binaryLoader,
      {
        test: /\.(sa|sc)ss$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          MiniCssExtractPlugin.loader,
          cssLoader,
          {
            // Required for Bootstrap as per the following:
            // https://getbootstrap.com/docs/4.0/getting-started/webpack/#importing-styles
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  "postcss-preset-env",
                ],
              },
            },
          },
          sassLoader
        ]
      },
      styleLoader,
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        resolve: {
          extensions: ['.js', '.jsx'],
        },
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                [
                  '@babel/preset-react',
                  { runtime: 'automatic', },
                ],
              ],
              cacheDirectory: true
            }
          },
        ]
      },
    ]
  }
};
