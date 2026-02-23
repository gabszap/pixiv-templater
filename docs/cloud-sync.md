# ☁️ Cloud Sync — Backup via GitHub Gist

Pixiv Templater supports backing up your templates, statistics, and shortcuts to a **private GitHub Gist**, allowing you to sync your data across browsers and computers.

## Setup

### 1. Generate a GitHub Personal Access Token (PAT)

1. Go to [GitHub Developer Settings](https://github.com/settings/tokens).
2. Click **"Generate new token"** (**Fine-grained token** is recommended).
3. Set a name for the token (e.g., "Pixiv Templater").
4. Check the **`gist`** scope checkbox.
5. Scroll to the bottom and click **"Generate token"**.
6. **Copy the token** and save it in a safe place; it will not be shown again.

> **Note:** Classic tokens (`ghp_...`) and Fine-grained tokens both work — just make sure the `gist` scope is enabled.

> Access the [GitHub PAT Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) for more information

### 2. Configure the Extension

1. Open the Pixiv Templater **Dashboard** (Settings page)
2. Go to the **Settings** tab
3. Find the **"Cloud Backup (GitHub)"** section
4. Paste your token in the input field
5. The sync buttons will become active

## Usage

| Button | Action |
|---|---|
| **Push to Cloud** | Uploads your current templates, stats, and shortcuts to a private Gist |
| **Pull from Cloud** | Downloads and merges data from your Gist into the local extension |
| **Delete Backup** | Permanently deletes the Gist from your GitHub account |

### Push (Upload)

- If no backup exists yet, a **new private Gist** is created automatically
- If a backup already exists, it is **updated** (not duplicated)
- The Gist is named `pixiv-templater-backup.json`

### Pull (Download)

- Templates from the cloud **overwrite** matching local templates (by name)
- Templates that **only exist locally** are **kept** (merge, not replace)
- Statistics and shortcuts from the cloud **fully replace** local data

### Delete

- The Gist is permanently deleted from your GitHub account
- Your local data is **not affected**

## FAQ

**Q: Is my token safe?**  
A: The token is stored in `chrome.storage.local` (never synced to the cloud by the browser). It is only used to authenticate with the GitHub Gist API.

**Q: Can I use the same token on multiple browsers?**  
A: Yes! Use the same token on all browsers. After pushing from one browser, pull from the other to sync.

**Q: What happens if I delete the Gist on GitHub directly?**  
A: The extension handles this gracefully — on the next push, it will create a new Gist automatically.

**Q: What data is included in the backup?**  
A: The backup contains:
- All templates (name, tags, category, settings, etc.)
- Usage statistics
- Custom keyboard shortcuts
- Extension version and export timestamp

**Q: Can other people see my backup?**  
A: No. The Gist is created as **private** (secret). Only you can see it when logged into your GitHub account.
