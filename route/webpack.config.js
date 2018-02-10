const path = require('path');
const webpack = require('webpack');

const config = {
	context: __dirname,
	entry: ['./js/app.js'],
	devtool: 'cheap-eval-source-map',
	output: {
		path: path.join(__dirname, 'public'),
		filename: 'bundle.js',
		publicPath: '/public/'
	},
	resolve: {
		extensions: ['.js']
	},
	stats: {
		colors: true,
		reasons: true,
		chunks: true
	},
	module: {
		rules: [
			{
				test: /\.jsx?$/, // enything that ends with JS or JSX runs through babel
				include: [path.resolve('js')]
			}
		]
	}
};

if (process.env.NODE_ENV === 'production') {
	config.entry = './js/app.js';
	config.devtool = false; // no source maps
	config.plugins = [];
}

module.exports = config;
