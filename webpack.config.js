const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Base configuration for all targets
const baseConfig = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',

    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
        alias: {
            '@core': path.resolve(__dirname, 'src/core'),
            '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
            '@application': path.resolve(__dirname, 'src/application'),
            '@ui': path.resolve(__dirname, 'src/ui'),
        },
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ],
    },

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
    },
};

// Main process config (Node.js environment)
const mainConfig = {
    ...baseConfig,
    target: 'electron-main',
    entry: {
        main: './src/main.ts',
    },
    // Node.js polyfills are not needed for the main process
    node: {
        __dirname: false,
        __filename: false,
    },
    // Don't bundle native Node.js modules
    externals: {
        electron: 'commonjs electron',
    },
};

// Preload script config
const preloadConfig = {
    ...baseConfig,
    target: 'electron-preload',
    entry: {
        preload: './src/preload.ts',
    },
    // Don't bundle native Node.js modules
    externals: {
        electron: 'commonjs electron',
    },
};

// Renderer process config (Browser environment)
const rendererConfig = {
    ...baseConfig,
    target: 'electron-renderer',
    entry: {
        renderer: './src/ui/index.tsx',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'public/index.html'),
            filename: 'index.html',
            chunks: ['renderer'],
        }),
    ],
};

module.exports = [mainConfig, preloadConfig, rendererConfig];
