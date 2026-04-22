# Zotero Random Read

`Zotero Random Read` 是一个面向 `Zotero 9.x` 的随机阅读插件。它会在 Zotero 主窗口上边栏放置一个骰子按钮，点击后从你指定的 Zotero 文件夹中按“久未打开、打开次数少、未读优先”的策略随机打开一个附件。

## 版本

- 当前版本：`0.2.0`
- 本地构建产物：`.scaffold/build/zotero-random-read.xpi`

## 功能

- 在主窗口工具栏注入一个彩色骰子按钮
- 只从用户白名单中的 Zotero 文件夹里抽取候选条目
- 文件夹选择界面支持：
  - 树状缩进显示父子关系
  - 复选框多选
  - 勾选父文件夹时自动包含全部子文件夹
  - `全选 / 全不选`
- 随机策略会优先照顾：
  - 从未被随机打开过的条目
  - 很久没有被随机打开过的条目
  - 打开次数较少的条目
- 直接复用 Zotero 的默认双击行为打开附件
- 提供 PDF 默认页面大小设置：
  - `实际大小`
  - `适合页面`
  - `适合宽度`
  - `自定义百分比`
- PDF 页面大小设置仅对首次在 Zotero 内置 PDF 阅读器中打开的文档生效
- 设置页与文件夹选择弹窗统一为暖色调卡片风格
- 本地记录阅读历史，并支持在设置中一键清除阅读数据

## 使用方法

1. 打开 Zotero 设置中的 `随机阅读` 页面。
2. 点击 `添加文件夹`，在树状列表里勾选要纳入随机池的文件夹。
3. 关闭设置页后，在 Zotero 顶部工具栏点击骰子图标。
4. 如果希望首次打开 PDF 时自动使用特定页面大小，可在设置页的 `PDF 默认页面大小` 卡片中配置。
5. 如果想让所有文档重新回到“初始随机状态”，可在设置页点击 `清除阅读数据`。

更详细的中文说明见 [doc/README-zhCN.md](./doc/README-zhCN.md)。

## 开发

```bash
npm install
npm run test:unit
npx tsc --noEmit
npm run build
```

说明：

- `npm run build` 会重新生成 `.scaffold/build/zotero-random-read.xpi`
- `npm run test:zotero` 需要本机存在可用的 Zotero 可执行文件

## 仓库说明

- GitHub: [heimi98/zotero-random-read](https://github.com/heimi98/zotero-random-read)
- Issue Tracker: [Issues](https://github.com/heimi98/zotero-random-read/issues)

## 文档

- 中文使用说明：[doc/README-zhCN.md](./doc/README-zhCN.md)
- 开发与发布说明：[doc/DEVELOPMENT.md](./doc/DEVELOPMENT.md)
- 变更记录：[CHANGELOG.md](./CHANGELOG.md)
