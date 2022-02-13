const path = require('path');
const mode = process.env.NODE_ENV || 'development';

module.exports = {
  mode,
  devtool: 'source-map',
  target: 'node',
  entry: [
    path.resolve(__dirname, 'index.js'),
  ],
  output: {
    library: 'osjsEventEmitter',
    libraryTarget: 'umd'
  },
  optimization: {
    minimize: mode === 'production'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};
