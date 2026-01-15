<p align="center">
  <img src="https://socialify.git.ci/gabszap/pixiv-templater/image?custom_description=%E4%B8%80%E4%B8%AA%E8%83%BD%E5%A4%9F%E9%80%9A%E8%BF%87%E4%B8%80%E9%94%AE%E5%BA%94%E7%94%A8%E6%A0%87%E9%A2%98%E3%80%81%E6%A0%87%E7%AD%BE%E5%92%8C%E8%AE%BE%E7%BD%AE%E6%A8%A1%E6%9D%BF%E6%9D%A5%E8%87%AA%E5%8A%A8%E5%8C%96+Pixiv+%E6%8A%95%E7%A8%BF%E6%B5%81%E7%A8%8B%E7%9A%84%E6%B5%81%E8%A7%88%E5%99%A8%E6%89%A9%E5%B1%95%E3%80%82&description=1&font=Inter&logo=https%3A%2F%2Fgithub.com%2Fgabszap%2Fpixiv-templater%2Fraw%2Frefs%2Fheads%2Fmain%2Fassets%2Ficons%2Ficon.svg&name=1&pattern=Solid&theme=Dark" alt="pixiv-templater">
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/gabszap/pixiv-templater?style=for-the-badge" alt="Releases">
  <img src="https://img.shields.io/github/license/gabszap/pixiv-templater?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Built_With-Claude-orange?style=for-the-badge&logo=anthropic" alt="Built with Claude">
  <img src="https://img.shields.io/github/last-commit/gabszap/pixiv-templater?style=for-the-badge&logo=github&logoColor=white&labelColor=black" alt="Last Commit">
  <img src="https://img.shields.io/github/stars/gabszap/pixiv-templater?style=for-the-badge&logo=github&color=yellow" alt="Stars">
</p>

<p align="center">
  <a href="../README.md">English</a> | 
  <a href="README_PT.md">Português</a> | 
  <a href="README_JP.md">日本語</a> | 
  <a href="README_ZH-CN.md">中文</a>
</p>

> [!WARNING]
> 该文档由人工智能翻译，可能包含不准确的表达。
> (This document was translated by AI and may contain inaccuracies.)
---

这是一款用于自动化 Pixiv 插画上传流程的浏览器扩展。您可以将标题、描述、标签和设置保存为模板，并实现一键应用。此外，它还能自动将日文标签翻译为 Danbooru 标签。

## 📌 目录
- [关于项目](#关于项目)
- [开发动机](#开发动机)
- [项目展示](#项目展示)
- [功能特性](#功能特性)
- [安装指南](#安装指南)
- [快捷键说明](#快捷键说明)
- [开发指南](#开发指南)

## 关于项目

**Pixiv Templater** 是一款专为经常在 Pixiv 投稿的画师设计的浏览器扩展。它旨在简化繁琐的数据填写流程，避免重复性劳动或依赖外部笔记进行复制粘贴。通过该工具，您可以保存完整的模板并瞬间应用，确保每次投稿的高效与一致性。

## 开发动机

这个想法源于我对 Pixiv 上传流程的挫败感。由于网站不提供模板功能，我不得不将描述固定在 Windows 剪贴板上，并在每次发布时手动粘贴。此外，花时间研究每个日文标签的含义非常令人疲惫。我决定开发这个扩展，将这些繁琐的手动操作变为一键完成，让画师能专注于真正重要的事情：创作并发布作品。

## 项目展示

<details>
  <summary>点击查看截图</summary>

  ### 视频演示
  查看扩展程序的运行效果。

  ![Demo](../assets/demo.mp4)

  ### 控制面板
  管理您的模板和设置。
  ![Dashboard](../assets/dashboard.png)

  ### 悬浮窗
  上传页面的悬浮快捷面板。

  ![Panel](../assets/painel.png)

  ### 标签翻译
  自动化翻译功能。

  ![Tag Translation](../assets/translated-tags.png)

</details>

## 功能特性

### 模板系统
- 📝 保存包含标题、描述、标签、年龄限制和 AI 生成状态的模板。
- 🔄 通过点击或快捷键一键应用模板。
- 📂 支持导出/导入模板（JSON 格式），方便备份或分享。

### 标签翻译
- 🏷️ 自动将上传页面的日文标签翻译为 Danbooru 标签。
- 🎨 按类别（画师、角色、版权、通用、元数据）进行色彩区分。

### 易用性
- ⚡ 可缩小的悬浮式操作面板。
- ⌨️ 完全可自定义的快捷键。
- 🌙 原生支持深色模式。

## 安装指南

### Firefox & 基于 Firefox 的浏览器
1. 从 [Releases](https://github.com/gabszap/pixiv-templater/releases) 页面下载最新的 `.xpi` 文件。
2. 打开 Firefox，在地址栏输入 `about:addons`。
3. 点击齿轮图标，选择 **“从文件安装附加组件...”**。
4. 选择下载好的 `.xpi` 文件。

### Chrome & 基于 Chrome 的浏览器
1. 从 [Releases](https://github.com/gabszap/pixiv-templater/releases) 页面下载 `.zip` 文件。
2. 将 `.zip` 文件的内容解压到一个文件夹中。
3. 访问 `chrome://extensions/`。
4. 开启右上角的 **“开发者模式”**。
4. 点击 **“加载解压的扩展程序”** 并选择下载并解压后的 `.zip` 文件夹。

> [!IMPORTANT]
> **注意：** 目前仅 Firefox 支持自动更新。对于基于 Chromium 的浏览器，手动安装尚不支持自动更新。请定期查看 [Releases](https://github.com/gabszap/pixiv-templater/releases) 页面以确保您使用的是最新版本。

## 快捷键说明

| 动作 | 默认快捷键 |
|------|---------------|
| 打开/关闭面板 | `Alt+Shift+T` |
| 最小化面板 | `Alt+Shift+M` |
| 新建模板 | `Alt+Shift+N` |
| 应用模板 1-9 | `Alt+1` 至 `Alt+9` |

## 开发指南

### 前置条件
- [Node.js](https://nodejs.org/) (v18+)
- [web-ext](https://github.com/mozilla/web-ext) (通过 npm 安装)

### 设置
```bash
# 克隆仓库
git clone https://github.com/gabszap/pixiv-templater.git
cd pixiv-templater

# 安装依赖
npm install
```

### 构建命令
```bash
# Lint 检查
npm run lint

# 构建 Firefox 版本
npm run build-firefox

# 构建 Chrome 版本
npm run build-chrome

# 构建所有版本
npm run build
```

### 加载扩展

**Firefox:**
1. 访问 `about:debugging#/runtime/this-firefox`
2. 点击"临时加载附加组件"
3. 选择项目文件夹中的任意文件

**Chrome:**
1. 访问 `chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载解压的扩展程序"
4. 选择项目文件夹（或构建后选择 `artifacts/pixiv-templater-chrome/`）

## 🤝 参与贡献

我们非常欢迎各种形式的贡献！

1. **Fork** 本项目
2. 创建您的特性分支 **Branch** (`git checkout -b feature/AmazingFeature`)
3. 提交更改 **Commit** (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 **Push** (`git push origin feature/AmazingFeature`)
5. 开启 **Pull Request**

如果您发现错误或有改进建议，请随时开启 [Issue](https://github.com/gabszap/pixiv-templater/issues)。

想为其他语言贡献翻译？欢迎提交 Pull Request。

<details>
  <summary>如何添加新语言</summary>
如果您想通过添加新语言来贡献力量，请按照以下简单步骤操作：

1. **创建语言文件**：前往 `locales/` 并根据[语言代码](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales)创建一个新的 JSON 文件（例如，法语为 `fr.json`）。您可以使用 `en.json` 作为模板。
2. **注册语言**：打开 `locales/languages.json` 并将您的语言代码和显示名称添加到列表中：
   ```json
   "fr": "Français"
   ```
3. **翻译**：在新的 JSON 文件中填入翻译后的字符串。

就这样！扩展程序将自动检测新语言并显示在设置菜单中。欢迎提交您的翻译 Pull Request！

</details>

## 致谢

- 标签翻译基于 evazion 的 [translate-pixiv-tags](https://github.com/evazion/translate-pixiv-tags)。
- 标签数据接口: [Danbooru](https://danbooru.donmai.us)。

## 许可证

MIT 许可证 - 请参阅 [LICENSE](./LICENSE)

