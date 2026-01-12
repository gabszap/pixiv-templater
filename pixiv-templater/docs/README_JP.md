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
> このドキュメントはAIによって翻訳されており、不正確な表現が含まれている可能性があります。
> (This document was translated by AI and may contain inaccuracies.)

Pixivでのイラスト投稿プロセスを自動化するためのブラウザ拡張機能です。タイトル、キャプション、タグ、設定をテンプレートとして保存し、ワンクリックで適用できます。また、日本語のタグをDanbooruのタグに自動的に翻訳します。

## 📌 目次
- [プロジェクトについて](#プロジェクトについて)
- [開発の動機](#開発の動機)
- [ショーケース](#ショーケース)
- [機能](#機能)
- [インストール](#インストール)
- [キーボードショートカット](#キーボードショートカット)

## プロジェクトについて

Pixiv Templaterは、Pixivに頻繁に投稿し、同じ情報を繰り返し入力する必要がある絵師のために設計されました。手動で入力したり、外部のメモからコピー＆ペーストしたりする代わりに、テンプレートを保存して即座に適用できます。

タグ翻訳機能は、[translate-pixiv-tags](https://github.com/evazion/translate-pixiv-tags)ユーザースクリプトを統合しており、Pixivが推奨する日本語タグを対応するDanbooruタグで確認できます。

## 開発の動機

このアイデアは、私自身のPixivへの投稿プロセスに対する不満から生まれました。サイトにテンプレート機能がないため、説明文をWindowsのクリップボードに固定し、投稿のたびに手動で貼り付ける必要がありました。さらに、推奨される日本語タグの意味を一つずつ調べるのに時間を費やすのは非常に疲れる作業でした。この手作業をワンクリックで済むようにし、絵師が本当に重要なこと（絵を描いて公開すること）に集中できるようにするために、この拡張機能を開発しました。

## ショーケース

| ダッシュボード | パネル | タグ翻訳 |
| :---: | :---: | :---: |
| <img src="../assets/dashboard.png" width="400"/> | <img src="../assets/painel.png" width="300"/> | <img src="../assets/translated-tags.png" width="400"/> |
| テンプレートと設定の管理。 | 投稿ページのフローティングパネル。 | 自動色分け翻訳。 |

## 機能

### テンプレート
- 📝 タイトル、キャプション、タグ、年齢制限、AI生成設定を保存。
- 🔄 ワンクリックまたはショートカットキーでテンプレートを適用。
- 📂 バックアップや共有のためのテンプレート出力・入力（JSON）。

### タグ翻訳
- 🏷️ 投稿ページの日本語タグをDanbooruタグに自動翻訳。
- 🎨 カテゴリ（絵師、キャラ、版権、一般、メタ）ごとに色分け。

## インストール

### Firefox (手動)
1. [Releases](https://github.com/gabszap/pixiv-templater/releases) ページから最新の `.xpi` ファイルをダウンロードします。
2. Firefoxを開き、アドレスバーに `about:addons` と入力します。
3. 歯車アイコンをクリックし、「ファイルからアドオンをインストール...」を選択します。
4. ダウンロードした `.xpi` ファイルを選択します。

### Chrome / Brave / Edge (デベロッパーモード)
1. ソースコードをダウンロードして解凍します。
2. `chrome://extensions/` を開きます。
3. 右上の「デベロッパーモード」を有効にします。
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、拡張機能のフォルダを選択します。

## キーボードショートカット

| アクション | デフォルト設定 |
|------|---------------|
| パネルを開く/閉じる | `Ctrl+Shift+T` |
| パネルを最小化 | `Ctrl+Shift+M` |
| 新規テンプレート | `Ctrl+Shift+N` |
| テンプレート1-9を適用 | `Ctrl+1` ～ `Ctrl+9` |

## 🤝 貢献 (Contributing)

オープンソースコミュニティを素晴らしい場所にしましょう！
1. プロジェクトを **Fork** する
2. 機能追加用 **Branch** を作成 (`git checkout -b feature/AmazingFeature`)
3. 変更を **Commit** する (`git commit -m 'Add some AmazingFeature'`)
4. Branchへ **Push** する (`git push origin feature/AmazingFeature`)
5. **Pull Request** を作成

## クレジット

- タグ翻訳: [translate-pixiv-tags](https://github.com/evazion/translate-pixiv-tags) (by evazion)
- タグAPI: [Danbooru](https://danbooru.donmai.us)