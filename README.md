# 🧪 Pixiv Templater - Beta Version

> **⚠️ WARNING**: This is the **beta/development version**. It contains the latest features but may be unstable, have bugs, or incomplete functionality. For a stable experience, use the [**main**](https://github.com/gabszap/pixiv-templater/tree/main) branch.

---

## 📥 Installation (Beta Version)

### Chrome / Edge / Brave / Chromium-based browsers

**Method 1: Direct ZIP (Easiest)**

1. Download the `Pre-release` ZIP from the [Releases](https://github.com/gabszap/pixiv-templater/releases)
2. Extract the ZIP file to a folder
3. Open your browser and go to `chrome://extensions/`
4. Enable **"Developer mode"** (toggle in top right)
5. Click **"Load unpacked"**
6. Select the extracted folder
7. The extension icon should appear in your toolbar

> 💡 **Note**: You'll need to manually update by re-downloading when new changes are pushed to this branch. Recommended making a backup of your settings before updating.

---

### Firefox / Firefox-based browsers

#### ⚠️ Important: Extension Signing

Firefox only allows **signed extensions** by default. For beta testing we need to disable this verification:

This is the easiest way to test beta versions:

1. Open Firefox and type `about:config` in the address bar
2. Search for `xpinstall.signatures.required`
3. Double-click to set it to `false`
4. Restart Firefox
5. Download the `Pre-release` xpi file from the [Releases](https://github.com/gabszap/pixiv-templater/releases)
6. Go to `about:addons`
7. Click the gear icon ⚙️ → **"Install Add-on From File..."**
8. Select the downloaded xpi file

## 🔄 Updating the Beta Version

### Chrome / Chromium browsers

The beta version **does not auto-update**. To get the latest beta:

1. Re-download the ZIP from this branch
2. Remove the old extension: Go to `chrome://extensions/` → click "Remove"
3. Follow the installation steps above again

### Firefox

**✅ Firefox supports auto-update for beta versions!** When a new Pre-release is published, Firefox will automatically update the extension. You'll see a notification in `about:addons` when an update is available.

If you prefer to manually update:
1. Go to `about:addons`
2. Find Pixiv Templater and click "Remove"
3. Download the latest `Pre-release` xpi from [Releases](https://github.com/gabszap/pixiv-templater/releases)
4. Install the new version following the steps above

---

## 🐛 Reporting Bugs

Found an issue in the beta? Please help us improve!

1. Check if the bug exists in the [Issues](https://github.com/gabszap/pixiv-templater/issues) tab
2. If not reported yet, create a new issue with:
   - **Title**: Start with `[BETA]` 
   - **Browser**: Which browser and version?
   - **Steps to reproduce**: What did you do?
   - **Expected vs Actual**: What should happen vs what happened?
   - **Screenshots**: If applicable

---

## 📋 What's New in Beta?

Check the commit history in this branch to see recent changes. The beta includes:
- Latest features being tested
- Bug fixes not yet in stable
- Experimental functionality

---

## 🚀 Want to Contribute?

Interested in helping develop this extension? See our [Contributing Guide](#contributing) below.

---

## 📁 Project Structure (For Developers)

```
pixiv-templater/
├── src/
│   ├── background/           # Service worker scripts
│   ├── content/              # Content scripts (injected into Pixiv pages)
│   ├── popup/                # Extension popup UI
│   ├── panel/                # Floating panel components
│   ├── dashboard/            # Options/dashboard page
│   ├── utils/                # Shared utilities
│   └── locales/              # i18n translation files
├── assets/                   # Static assets (icons, images)
├── docs/                     # Documentation in multiple languages
├── manifest-firefox.json     # Firefox manifest
├── manifest-chrome.json      # Chrome manifest
└── package.json
```

---

## 🤝 Contributing

### Prerequisites
- [Node.js](https://nodejs.org/) v22+
- [Git](https://git-scm.com/)

### Setup for Development

```bash
# Clone the repository
git clone https://github.com/gabszap/pixiv-templater.git
cd pixiv-templater

# Switch to dev branch
git checkout dev

# Install dependencies
npm install

# Build extension
npm run build-firefox # or npm run build-chrome
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build-firefox` | Build production `.xpi` |
| `npm run build-chrome` | Build production `.zip` |
| `npm run build` | Build both firefox and chrome |
| `npm run lint` | Run code linter |

---

### Branch Strategy

- **`main`**: Stable production releases
- **`dev`**: Beta/development branch (you are here)
- **`feature/*`**: Individual feature branches

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new template feature
fix: resolve tag translation bug
docs: update README
```

---

## 📚 Documentation

- **User Guide**: Available in multiple languages in `/docs/` folder
- **Adding Translations**: 
  1. Create `locales/[code].json` (use `en.json` as template)
  2. Add to `locales/languages.json`

---

## 📄 License

MIT License - see [LICENSE](LICENSE)
