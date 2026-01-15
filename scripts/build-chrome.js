/**
 * Build script for Chrome extension
 * Swaps manifest.chrome.json → manifest.json, runs web-ext build, then restores
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'manifest.json');
const MANIFEST_FIREFOX = path.join(ROOT, 'manifest.firefox.backup.json');
const MANIFEST_CHROME = path.join(ROOT, 'manifest.chrome.json');

console.log('[Chrome Build] Starting...');

try {
    // 1. Backup Firefox manifest
    console.log('[Chrome Build] Backing up Firefox manifest...');
    fs.copyFileSync(MANIFEST, MANIFEST_FIREFOX);

    // 2. Copy Chrome manifest as manifest.json
    console.log('[Chrome Build] Using Chrome manifest...');
    fs.copyFileSync(MANIFEST_CHROME, MANIFEST);

    // 3. Run web-ext build
    console.log('[Chrome Build] Running web-ext build...');
    execSync('npx web-ext build --source-dir . --artifacts-dir ./artifacts --filename pixiv-templater-chrome.zip --overwrite-dest --ignore-files manifest.chrome.json manifest.firefox.backup.json', {
        cwd: ROOT,
        stdio: 'inherit'
    });

    console.log('[Chrome Build] ✅ Build complete!');
} catch (error) {
    console.error('[Chrome Build] ❌ Build failed:', error.message);
    process.exitCode = 1;
} finally {
    // 4. Restore Firefox manifest
    console.log('[Chrome Build] Restoring Firefox manifest...');
    if (fs.existsSync(MANIFEST_FIREFOX)) {
        fs.copyFileSync(MANIFEST_FIREFOX, MANIFEST);
        fs.unlinkSync(MANIFEST_FIREFOX);
    }
}
