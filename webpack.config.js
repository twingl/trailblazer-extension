var argv = require('yargs').argv
  , webpack = require('webpack')
  , ExtractTextPlugin = require('extract-text-webpack-plugin');

var cssExtractor = new ExtractTextPlugin('css', '[name].css');
var htmlExtractor = new ExtractTextPlugin('html', '[name].html');

module.exports = {
  context: __dirname + '/src',
  entry: {
    'background': './scripts/background.js',
    'main-ui':    './scripts/main-ui.jsx',
    'popup':      './scripts/popup.jsx',
    'public-map': './scripts/public-map.jsx',
    'tour':       './scripts/tour.jsx',
    'page-title': './content-scripts/page-title.js'
  },

  output: {
    path: __dirname + '/build',
    filename: '[name].js'
  },

  module: {
    loaders: [
      {
        test: /\.html$/,
        exclude: /(node_modules)/,
        loader: htmlExtractor.extract('html-loader')
      },
      {
        test: /\.scss$/,
        exclude: /(node_modules)/,
        loader: cssExtractor.extract('style-loader', 'css-loader!sass-loader')
      },
      {
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        loader: 'babel',
        query: {
          cacheDirectory: true
        }
      },
      {
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        loader: 'transform/cacheable?envify',
        cacheable: true
      }
    ]
  },

  plugins: (argv.production || argv.staging)
    // Staging/Production plugins
    ? [
      new webpack.optimize.UglifyJsPlugin({ minimize: true }),
      cssExtractor,
      htmlExtractor
    ]

    // Development plugins
    : [
      cssExtractor,
      htmlExtractor
    ],

  devtool: 'source-map'
}
