# Webpack Dependencie
> webpack插件 + vscode插件组合，显示文件被依赖关系

> Count & Show the number of times the file is dependent.

==> WIP <==

## use


### webpack plugin

```js
import WebpackDependenciePlugin from '@talltotal/webpack-dependencie'
import webpack from 'webpack'

webpack({
    plugins: [
        new WebpackDependenciePlugin()
    ]
})
```

### vscode extension

在 `EXPLORER` 面板
- 文件右键 => `File References` 列出此文件被哪些文件依赖
- 文件夹右键 => `No References` 列出此文件夹下哪些文件没有被依赖

在 `EDITOR` 面板
- 右键 => `File References` 列出当前文件被哪些文件依赖

#### Settings

* `WebpackDependencie.open`: true 
    > Whether to turn on Definition Resolve.<br/>
    > 是否开启

