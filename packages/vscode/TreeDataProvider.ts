import * as vscode from 'vscode'
const path = require('path')

export class TreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    locs: Array<vscode.Location | object> = []

    getTreeItem (element: vscode.TreeItem): vscode.TreeItem {
        return element
    }

    getChildren (): vscode.TreeItem[] {
        const len = this.locs.length
        // TODO 信息的展示方式
        return [
            len
                ? new vscode.TreeItem(`find ${len} file${len === 1 ? '' : 's'}`)
                : new vscode.TreeItem(`No results found.`),
            ...this.locs.map(item => {
                if (item.constructor === vscode.Location) {
                    const tt = <vscode.Location>item
                    const viewItem = new vscode.TreeItem(tt.uri)
                    if (vscode.workspace.workspaceFolders) {
                        const ff = vscode.workspace.workspaceFolders.find(
                            folder => tt.uri.path.indexOf(folder.uri.path) === 0
                        )
                        if (ff) {
                            viewItem.description = path.parse(
                                path.relative(
                                    ff.uri.path,
                                    tt.uri.path,
                                )
                            ).dir
                        }
                    }
                    viewItem.command = {
                        title: '',
                        command: 'WebpackDependencie.openFile',
                        arguments: [tt]
                    }
                    return viewItem
                } else {
                    const tt = <any>item
                    const viewItem = new vscode.TreeItem(tt.title)
                    viewItem.description = tt.des

                    return viewItem
                }
            })
        ]
    }

    show (locs: any) {
        this.locs = locs
    }
}