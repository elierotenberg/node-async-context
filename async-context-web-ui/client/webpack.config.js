const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const UglifyJSWebpackPlugin = require('uglifyjs-webpack-plugin');

const plugins = [
  new HtmlWebpackPlugin({
    title: 'Async Context Web UI',
    filename: 'client.dist.html',
    inlineSource: /\.(js|css)$/,
  }),
  new HtmlWebpackInlineSourcePlugin(),
];

const rules = [
  {
    test: /\.js$/,
    exclude: /(node_modules|bower_components)/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: [
          [
            'env',
            {
              targets: '>2%',
            },
          ],
          'react',
        ],
        plugins: ['transform-object-rest-spread'],
      },
    },
  },
  {
    test: /\.css$/,
    use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
  },
];

const config = {
  target: 'web',
  entry: path.join(__dirname, 'client.js'),
  output: {
    path: __dirname,
    filename: 'client.dist.js',
  },
  plugins,
  module: { rules },
};

if (process.NODE_ENV === 'production') {
  plugins.push(new UglifyJSWebpackPlugin());
} else {
  config.devtool = 'inline-source-map';
}

module.exports = config;
