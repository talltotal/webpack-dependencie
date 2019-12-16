import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { TreeDataProvider } from './TreeDataProvider'
let depFilePath: string = ''
let isOpen: boolean = getOpenConfig()

function findDepFilePath (relativePath: string) {
    const cache: any = {}
    const find: (filePath: string) => string = (filePath: string) => {
        if (cache[filePath]) {
            return cache[filePath]
        }
        const { dir } = path.parse(filePath)

        const file = fs.readdirSync(dir, {
            withFileTypes: true
        }).find(item => {
            return item.isDirectory() && item.name === 'node_modules'
        })

        if (file) {
            const result = path.resolve(dir, file.name, relativePath)
            cache[filePath] = result
            return result
        } else {
            return find(dir)
        }
    }
    
    return find
}

function viewTreeCommendFactory (context: vscode.ExtensionContext): (
    commandName: string,
    viewId: string,
    visibleKey: string,
    getViewList: (fsPath: string) => any[]
) => void {
    const findDepFilePathf = findDepFilePath('./@talltotal/webpack-dependencie/.dep.json')
    const treeDataProvider = new TreeDataProvider()
    vscode.window.registerTreeDataProvider('file-reference__list', treeDataProvider)
    let viewTree: vscode.TreeView<any>
    let preVisibleKey: string

    return function (
        commandName: string,
        viewId: string,
        visibleKey: string,
        getViewList: (fsPath: string) => any[]
    ) : void {
        context.subscriptions.push(
            vscode.commands.registerCommand(
                commandName,
                ({ fsPath }) => {
                    if (!isOpen) {
                        return
                    }
                    if (fsPath.indexOf('node_modules') !== -1) {
                        return
                    }
                    depFilePath = findDepFilePathf(fsPath)
                    if (!depFilePath || !fs.existsSync(depFilePath)) {
                        return
                    }
                    const listData = getViewList(fsPath)
                    treeDataProvider.show(listData || [])
                    if (viewTree) {
                        viewTree.dispose()
                        vscode.commands.executeCommand(
                            'setContext',
                            preVisibleKey,
                            false
                        )
                    }
                    viewTree = vscode.window.createTreeView(viewId, {
                        treeDataProvider: treeDataProvider,
                        showCollapseAll: false
                    })
                    preVisibleKey = visibleKey
                    viewTree.onDidChangeVisibility(({ visible }) => {
                        if (!visible) {
                            viewTree.dispose()
                            vscode.commands.executeCommand(
                                'setContext',
                                visibleKey,
                                false
                            )
                        }
                    })
                    vscode.commands.executeCommand(
                        'setContext',
                        visibleKey,
                        true
                    )
                }
            )
        )
    }
}

export function activate(context: vscode.ExtensionContext) {
    /**
     * 1. 监听工作区的变化
     * 2. 获取data文件路径
     * 3. 监听data变化
     * 4. data && data.status === 0 时，开始监听 cacheFile
     * 5. 展示 cacheFile 数据
     *  - 直接在所有文件上体现被依赖次数
     *  - 打开某个文件
     *      - View Container 被依赖文件列表，点击打开文件
     *      - 在文件名右键,展开 View Container
     *      - 在文件内右键,展开 View Container
     * 6. data && data.status === 1 时，不再监听 cacheFile
     */    
    const createView = viewTreeCommendFactory(context)
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'WebpackDependencie.openFile',
            (loc) => {
                vscode.window.showTextDocument(loc.uri, {
                    selection: loc.range
                })
            }
        )
    )
    createView(
        'WebpackDependencie.listDep',
        'file-reference__list',
        'fileReferencesEnabled',
        (fsPath: string): any[] => {
            const files: any = require(depFilePath)
            const refs = files[fsPath] || {}

            return Object.keys(refs).map((item: string) => {
                const loc = refs[item]
                if (typeof loc === 'string') {
                    return {
                        title: item,
                        des: loc
                    }
                } else {
                    const { start, end } = loc
                    return new vscode.Location(
                        vscode.Uri.file(item),
                        new vscode.Range(start.line, start.column, end.line, end.column)
                    )
                }
            })
        }
    )
    createView(
        'WebpackDependencie.listNoDep',
        'no-reference__list',
        'noReferencesEnabled',
        (fsPath: string): any[] => {
            function getAllFileFromDir (dirPath: string, arr: string[] = []): string[] {
                fs.readdirSync(dirPath, {
                    withFileTypes: true
                }).forEach((item: fs.Dirent) => {
                    const resolvePath = path.resolve(dirPath, item.name)
                    if (item.isFile() && item.name !== '.DS_Store') {
                        arr.push(resolvePath)
                    } else if (item.isDirectory()) {
                        getAllFileFromDir(resolvePath, arr)
                    }
                })

                return arr
            }
            const depFiles: any = require(depFilePath)
            const realFileList: string[] = getAllFileFromDir(fsPath)

            return realFileList.filter(item => {
                return !depFiles[item]
            }).map(item => {
                return new vscode.Location(
                    vscode.Uri.file(item),
                    new vscode.Range(0, 0, 0, 0)
                )
            })
        }
    )
    vscode.workspace.onDidChangeConfiguration(() => {
        isOpen = getOpenConfig()
	})
}

export function deactivate() {
}


function getOpenConfig (): boolean {
	const isOpen = !!vscode.workspace.getConfiguration('WebpackDependencie')
	.get('open')
    vscode.commands.executeCommand(
        'setContext',
        'fileReferencesOpen',
        isOpen
    )

    return isOpen
}