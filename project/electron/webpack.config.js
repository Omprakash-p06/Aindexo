const path = require('path');

module.exports = {
    mode: 'development',
    entry: './renderer/app.js',
    output: {
        path: path.resolve(__dirname, 'renderer'),
        filename: 'bundle.js'
    },
    target: 'electron-renderer',
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-react']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader', 'postcss-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx']
    }
};
