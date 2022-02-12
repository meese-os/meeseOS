const path = require('path');
const mode = process.env.NODE_ENV || 'development';
const minimize = mode === 'production';
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {DefinePlugin} = webpack;
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const NodemonPlugin = require('nodemon-webpack-plugin');
const npm = require('./package.json');
const plugins = [];

if (mode === 'production') {
  plugins.push(new OptimizeCSSAssetsPlugin({
    cssProcessorOptions: {
      discardComments: true,
      map: {
        inline: false
      }
    },
  }));
}

const siteTitle = 'Aaron Meese';
module.exports = {
  mode,
  devtool: 'source-map',
  entry: {
    osjs: path.resolve(__dirname, 'src/client/index.js')
  },
  performance: {
    maxEntrypointSize: 500 * 1024,
    maxAssetSize: 500 * 1024
  },
  watchOptions: {
    aggregateTimeout: 500,
    poll: 1000,
  },
  optimization: {
    minimize,
    splitChunks: {
      chunks: 'all'
    }
  },
  plugins: [
    new DefinePlugin({
      OSJS_VERSION: npm.version
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/client/index.ejs'),
      favicon: path.resolve(__dirname, 'src/client/favicon.png'),
      title: siteTitle
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new NodemonPlugin({
      script: 'src/server/index.js',
    }),
    new CopyWebpackPlugin([
      {
        from: path.resolve('src/client/dial-up-modem.mp3'),
        to: path.resolve('dist/dial-up-modem.mp3')
      },
    ]),
    ...plugins
  ],
  module: {
    rules: [
      {
        test: /\.(svg|png|jpe?g|gif|webp|mp3)$/,
        use: [
          {
            loader: 'file-loader'
          }
        ]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: 'fonts/[name].[ext]'
          }
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: {
          loader: 'source-map-loader'
        }
      }
    ]
  }
};
