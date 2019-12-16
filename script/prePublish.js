/**
 * 1. 同步package.json中的字段
 * 2. copy README.md 文件
 */
const fs = require('fs')
const path = require('path')
const basePack = require('../package.json')
const packs = ['../packages/vscode/', '../packages/webpack/']
const syncKey = ['version', 'keywords']

packs.forEach(item => {
    const packPath = path.resolve(__dirname, item, 'package.json')
    const readmePath = path.resolve(__dirname, item, 'README.md')
    const preInfo = require(packPath)
    syncKey.forEach(key => {
        preInfo[key] = basePack[key]
    })

    fs.writeFileSync(packPath, JSON.stringify(preInfo, undefined, 4))
    fs.copyFileSync(path.resolve(__dirname, '../README.md'), readmePath)
})

