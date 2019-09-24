import * as vscode from 'vscode'
import * as path from 'path'

export class TreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    locs: Array<vscode.Location | object> = []

    getInfoItem (info: string): vscode.TreeItem {
        const item = new vscode.TreeItem('')
        item.description = info
        return item
    }

    getTreeItem (element: vscode.TreeItem): vscode.TreeItem {
        return element
    }

    getChildren (): vscode.TreeItem[] {
        const len = this.locs.length
        return [
            len
                ? this.getInfoItem(`find ${len} file${len === 1 ? '' : 's'}`)
                : this.getInfoItem(`No results found.`),
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
                    viewItem.tooltip = tt.des

                    return viewItem
                }
            })
        ]
    }

    show (locs: any) {
        this.locs = locs
    }
}