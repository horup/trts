var HtmlWebpackPlugin = require('html-webpack-plugin');
var webpack = require('webpack');
module.exports = {
    entry: __dirname + "/src/index.tsx",
    output: {
        path: __dirname + "/dist/",
        filename: "bundle.js"
    },

    devtool: "source-map",

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    module: {
        rules: [
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" },
            { test: /\.css$/, loader: "style-loader!css-loader" },
            { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' }
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            hash: true,
            filename: './index.html'
        }),

        new webpack.ProvidePlugin({
            $: 'jquery',
            Popper: 'popper.js'
          })
        
    ]
};