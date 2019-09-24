const fs = require('fs')
const path = require('path')

/**
 * 列出文件被依赖列表;
 * 1. 只存非 node_modules 下的文件
 */
class Plugin {
    constructor () {
        this.cacheFilePath = path.resolve(__dirname, '.dep.json')
    }

    apply (compiler, preFiles = {}) {
        let files = {
            ...preFiles
        }
        compiler.plugin('compilation', compilation => {
            // loc行数错误问题：
            // 1. babel pollyfix 增加了行
            // 2. vue 等spilt chunk
            // 3. require() / import()
            compilation.plugin('finish-modules', modules => {
                files = {
                    ...preFiles
                }
                modules.forEach((oneModule) => {
                    const { resource: rr, dependencies } = oneModule
                    const resource = rr && rr.replace(/\?.*/, '')
                    dependencies.forEach((dependencie) => {
                        // 被依赖的文件
                        let depResource = dependencie.module && dependencie.module.resource
                        depResource = depResource && depResource.replace(/\?.*/, '')
                        if (dependencie.userRequest &&
                            depResource &&
                            depResource !== resource &&
                            depResource.indexOf('node_modules') === -1
                        ) {
                            if (files[depResource] === undefined) {
                                files[depResource] = {}
                            }
                            if (files[depResource][resource]) {
                                
                            } else if (resource) {
                                let loc = dependencie.loc
                                try {
                                    // 从 sourceMap 中找到准确的 loc
                                    // vue-template 还是处理不了...
                                    const sameLine = loc.start.line === loc.end.line
                                    const txt = (
                                        oneModule._source._value.match(new RegExp(`(.*\n){${loc.start.line - 1}}.{${loc.start.column}}(` + (sameLine ? `.{${loc.end.column - loc.start.column}}` : `(.*\n){${loc.end.line - loc.start.line}}.{${loc.end.column}}`) + `)`))[2]
                                    ).replace(/;$/, '')
                                    const sourcesContent = oneModule._source._sourceMap.sourcesContent[0]
                                    // try {
                                    //     sourcesContent = 
                                    // } catch (e) {
                                    //     sourcesContent = fs.readFileSync(resource, {
                                    //         encoding: 'utf-8'
                                    //     })
                                    // }
                                    let offset = sourcesContent.indexOf(txt)
                                    let _txt = txt
                                    if (offset === -1) {
                                        offset = sourcesContent.indexOf(txt.replace(/"/g, "'"))
                                        _txt = txt.replace(/"/g, "'")
                                    }
                                    if (offset === -1) {
                                        throw new Error()
                                    }
                                    const start = sourcesContent.substr(0, offset)
                                    const end = start + _txt
                                    loc = {
                                        start: {
                                            line: start.match(/\n/g) ? start.match(/\n/g).length : 0,
                                            column: start.match(/[^\n]*$/)[0].length
                                        },
                                        end: {
                                            line: end.match(/\n/g) ? end.match(/\n/g).length : 0,
                                            column: end.match(/[^\n]*$/)[0].length
                                        }
                                    }
                                } catch (_) {}
                                files[depResource][resource] = loc
                            } else {
                                files[depResource][dependencie.type] = dependencie.loc.name
                            }
                        }
                    })
                })
            })

            compilation.plugin('child-compiler', (childCompiler) => {
                (new Plugin()).apply(childCompiler, files)
            })
        })
        compiler.plugin('after-compile', (_, next) => {
            if (Object.keys(files).length) {
                fs.writeFile(this.cacheFilePath, JSON.stringify(files, undefined, 4), () => {})
            }
            if (next) {
                next()
            }
        })
    }
}

module.exports = Plugin
