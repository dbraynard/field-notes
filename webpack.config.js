const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: {
        fieldNotes: {
            import: './src/DemoInc/FieldNotes.ts'
        },
        fieldNotesDialog: {
            import: './src/DemoInc/FieldNotesDialog.ts'
        }
    }
    ,
    devServer: {
        contentBase: './dist',
        hot: false,
        inline: false,
    },
    devtool: 'inline-source-map',
    output: {
        filename: 'DemoInc/[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
        ],
    },
    resolve: {
        extensions: ['*', '.tsx', '.ts', '.js'],
        modules: [__dirname, 'node_modules']
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'DemoInc/FieldNotes.html',
            template: './src/DemoInc/FieldNotes.html',
            chunks: ['fieldNotes'],
            scriptLoading: "defer"
        }),
        new HtmlWebpackPlugin({
            filename: 'DemoInc/FieldNotesDialog.html',
            template: './src/DemoInc/FieldNotesDialog.html',
            chunks: ['fieldNotesDialog']
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: 'src/DemoInc/images',
                    to: 'DemoInc/images'
                },
                {
                    from: 'lib',
                    to: 'DemoInc/lib'
                },
                {
                    from: '*.trex',
                    to: 'DemoInc',
                    context: 'src/DemoInc'
                },
            ]
        })
    ]
};