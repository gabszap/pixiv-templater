# Pixiv Templater

![License](https://img.shields.io/github/license/gabszap/pixiv-templater)
![Releases](https://img.shields.io/github/v/release/gabszap/pixiv-templater)
![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Firefox%20%7C%20Brave-lightgrey)

<p align="left">
  <a href="../../README.md"><img src="https://img.shields.io/badge/Language-English-blue?style=flat-square" alt="English"></a>
  <a href="README_PT.md"><img src="https://img.shields.io/badge/Idioma-Português-green?style=flat-square" alt="Português"></a>
  <a href="README_JP.md"><img src="https://img.shields.io/badge/言語-日本語-red?style=flat-square" alt="日本語"></a>
  <a href="README_ZH-CN.md"><img src="https://img.shields.io/badge/语言-简体中文-orange?style=flat-square" alt="简体中文"></a>
</p>

> [!WARNING]
> 该文档由人工智能翻译，可能包含不准确的表达。
> (This document was translated by AI and may contain inaccuracies.)

这是一款用于自动化 Pixiv 插画上传流程的浏览器扩展。您可以将标题、描述、标签和设置保存为模板，并实现一键应用。此外，它还能自动将日文标签翻译为 Danbooru 标签。

## 📌 目录
- [关于项目](#关于项目)
- [开发动机](#开发动机)
- [项目展示](#项目展示)
- [功能特性](#功能特性)
- [安装指南](#安装指南)
- [快捷键说明](#快捷键说明)

## 关于项目

Pixiv Templater 专为经常在 Pixiv 投稿且厌倦重复填写信息的画师设计。您无需手动输入或从外部笔记复制粘贴，只需保存模板即可瞬间完成填充。

标签翻译功能集成了 [translate-pixiv-tags](https://github.com/evazion/translate-pixiv-tags) 脚本，让您可以直接查看日文推荐标签对应的 Danbooru 翻译。

## 开发动机

这个想法源于我对 Pixiv 上传流程的挫败感。由于网站不提供模板功能，我不得不将描述固定在 Windows 剪贴板上，并在每次发布时手动粘贴。此外，花时间研究每个日文标签的含义非常令人疲惫。我决定开发这个扩展，将这些繁琐的手动操作变为一键完成，让画师能专注于真正重要的事情：创作并发布作品。

## 项目展示

| 控制面板 | 悬浮窗 | 标签翻译 |
| :---: | :---: | :---: |
| <img src="../assets/dashboard.png" width="400"/> | <img src="../assets/painel.png" width="300"/> | <img src="../assets/translated-tags.png" width="400"/> |
| 管理您的模板和设置。 | 上传页面的快捷控制面板。 | 自动颜色分类翻译。 |

## 功能特性

### 模板系统
- 📝 保存包含标题、描述、标签、年龄限制和 AI 生成状态的模板。
- 🔄 通过点击或快捷键一键应用模板。
- 📂 支持导出/导入模板（JSON 格式），方便备份或分享。

### 标签翻译
- 🏷️ 自动将上传页面的日文标签翻译为 Danbooru 标签。
- 🎨 按类别（画师、角色、版权、通用、元数据）进行色彩区分。

## 安装指南

### Firefox (手动安装)
1. 从 [Releases](https://github.com/gabszap/pixiv-templater/releases) 页面下载最新的 `.xpi` 文件。
2. 打开 Firefox，在地址栏输入 `about:addons`。
3. 点击齿轮图标，选择 **“从文件安装附加组件...”**。
4. 选择下载好的 `.xpi` 文件。

### Chrome / Brave / Edge (开发者模式)
1. 下载源代码并解压。
2. 访问 `chrome://extensions/`。
3. 开启右上角的 **“开发者模式”**。
4. 点击 **“加载解压的扩展程序”** 并选择项目文件夹。

## 快捷键说明

| 动作 | 默认快捷键 |
|------|---------------|
| 打开/关闭面板 | `Ctrl+Shift+T` |
| 最小化面板 | `Ctrl+Shift+M` |
| 新建模板 | `Ctrl+Shift+N` |
| 应用模板 1-9 | `Ctrl+1` 至 `Ctrl+9` |

## 🤝 参与贡献

我们非常欢迎各种形式的贡献！
1. **Fork** 本项目
2. 创建您的特性分支 **Branch** (`git checkout -b feature/AmazingFeature`)
3. 提交更改 **Commit** (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 **Push** (`git push origin feature/AmazingFeature`)
5. 开启 **Pull Request**

如果您发现错误或有改进建议，请随时开启 [Issue](https://github.com/gabszap/pixiv-templater/issues)。

## 致谢

- 标签翻译基于 evazion 的 [translate-pixiv-tags](https://github.com/evazion/translate-pixiv-tags)。
- 标签数据接口: [Danbooru](https://danbooru.donmai.us)。