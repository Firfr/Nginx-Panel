# 网页端

## 编辑预览

采用框架 prism-code-editor

这个框架只有英文，要改复制按钮的提示只能改源码

- 文件 `node_modules/prism-code-editor/dist/extensions/copyButton/index.js`
  - `label = "Copy", copiedLabel = "Copied!"`
  - `label = "复制", copiedLabel = "已复制!"`
- 修改后不生效，删除 vite 缓存 `node_modules/.vite`
