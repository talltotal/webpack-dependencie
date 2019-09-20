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
            // 
            // source map ? 能找到源文件和源码，但是对应的行找不到
            // 根据 userRequest 文本匹配
            // userRequest
            // type|1: ["single entry","harmony side effect evaluation"]
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
                                    const sameLine = loc.start.line === loc.end.line
                                    const txt = (
                                        oneModule._source._value.match(new RegExp(`(.*\n){${loc.start.line - 1}}.{${loc.start.column}}(` + (sameLine ? `.{${loc.end.column - loc.start.column}}` : `(.*\n){${loc.end.line - loc.start.line}}.{${loc.end.column}}`) + `)`))[2]
                                    ).replace(/;$/, '')
                                    const sourceMatch = oneModule._source._sourceMap.sourcesContent[0].match(new RegExp(`((.*\n)*)${txt}`))
                                    const start = sourceMatch[1]
                                    const end = sourceMatch[0]
                                    loc = {
                                        start: {
                                            line: start.match(/\n/g).length + 1,
                                            column: start.match(/[^\n]*$/)[0].length
                                        },
                                        end: {
                                            line: end.match(/\n/g).length + 1,
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
