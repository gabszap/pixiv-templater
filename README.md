# Pixiv Templater

![License](https://img.shields.io/github/license/gabszap/pixiv-templater)
![Releases](https://img.shields.io/github/v/release/gabszap/pixiv-templater)
![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Firefox%20%7C%20Brave-lightgrey)

<p align="left">
  <a href="README.md"><img src="https://img.shields.io/badge/Language-English-blue?style=flat-square" alt="English"></a>
  <a href="pixiv-templater/docs/README_PT.md"><img src="https://img.shields.io/badge/Idioma-Português-green?style=flat-square" alt="Português"></a>
  <a href="pixiv-templater/docs/README_JP.md"><img src="https://img.shields.io/badge/言語-日本語-red?style=flat-square" alt="日本語"></a>
  <a href="pixiv-templater/docs/README_ZH-CN.md"><img src="https://img.shields.io/badge/语言-简体中文-orange?style=flat-square" alt="简体中文"></a>
</p>

A browser extension to automate the illustration upload process on Pixiv. Save templates with titles, captions, tags, and settings, and apply them with a single click. It also automatically translates Japanese tags to Danbooru tags.

## 📌 Table of Contents
- [About the Project](#about-the-project)
- [Why I Created This?](#why-i-created-this)
- [Showcase](#showcase)
- [Features](#features)
- [Installation](#installation)
- [Keyboard Shortcuts](#keyboard-shortcuts)

## About the Project

Pixiv Templater was designed for artists who post frequently on Pixiv and find themselves filling in the same information repeatedly. Instead of manual typing or copy-pasting from external notes, you can save templates and apply them instantly.

The tag translation feature was integrated from the [translate-pixiv-tags](https://github.com/evazion/translate-pixiv-tags) userscript, allowing you to see Japanese tags translated to their Danbooru equivalents.

## Why I Created This?

The idea came from my own frustration with the Pixiv upload process. Since the site doesn't offer templates, I had to keep my descriptions pinned to my Windows clipboard and manually paste them for every post. Additionally, wasting time researching the meaning of every suggested Japanese tag made the process exhausting. I decided to build this extension to turn this manual labor into a one-click task, letting artists focus on what really matters: posting their art and moving on.

## Showcase

| Dashboard | Panel | Tag Translation |
| :---: | :---: | :---: |
| <img src="pixiv-templater/assets/dashboard.png" width="400"/> | <img src="pixiv-templater/assets/painel.png" width="300"/> | <img src="pixiv-templater/assets/translated-tags.png" width="400"/> |
| Manage your templates and settings. | Floating panel on the upload page. | Automated colored translations. |

## Features

### Templates
- 📝 Save templates with title, caption, tags, age rating, and AI-generated status.
- 🔄 Apply templates with one click or via keyboard shortcuts.
- 📂 Export and import templates (JSON) for backup or sharing.

### Tag Translation
- 🏷️ Automatically translates Japanese tags on the upload page to Danbooru tags.
- 🎨 Color-coded by category (artist, character, copyright, general, meta).

### Ease of Use
- ⚡ Floating panel that can be minimized.
- ⌨️ Fully customizable keyboard shortcuts.
- 🌙 Native Dark Mode support.

## Installation

### Firefox (Manual)
1. Download the latest `.xpi` file from the [Releases](https://github.com/gabszap/pixiv-templater/releases) page.
2. Open Firefox and type `about:addons` in the address bar.
3. Click the gear icon and select **"Install Add-on From File..."**.
4. Select the downloaded `.xpi` file.

### Chrome / Brave / Edge (Developer Mode)
1. Download the source code and unzip it.
2. Go to `chrome://extensions/`.
3. Enable **"Developer mode"** in the top right corner.
4. Click **"Load unpacked"** and select the extension folder.

## Keyboard Shortcuts

| Action | Default Shortcut |
|------|---------------|
| Open/Close Panel | `Ctrl+Shift+T` |
| Minimize Panel | `Ctrl+Shift+M` |
| New Template | `Ctrl+Shift+N` |
| Apply Template 1-9 | `Ctrl+1` to `Ctrl+9` |

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. **Fork** the project
2. Create a **Branch** for your Feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the Branch (`git push origin feature/AmazingFeature`)
5. Open a **Pull Request**

If you find a bug or have a suggestion, feel free to open an [Issue](https://github.com/gabszap/pixiv-templater/issues).

Want to add translations for another language? Feel free to submit a Pull Request.

## Credits

- Tag translation based on [translate-pixiv-tags](https://github.com/evazion/translate-pixiv-tags) by evazion.
- Tag API: [Danbooru](https://danbooru.donmai.us).

## License

MIT License - see [LICENSE](LICENSE)