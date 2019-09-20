const path = require('path')
const WebpackDependenciePlugin = require('../packages/webpack/index')

module.exports = {
    mode: 'development',
    entry: {
        main: path.resolve(__dirname, './index.js')
    },
    plugins: [
        new WebpackDependenciePlugin({
            cacheFileDir: __dirname
        })
    ]
}
