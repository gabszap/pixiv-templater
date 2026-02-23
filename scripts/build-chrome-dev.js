/**
 * Build script for Chrome extension
 * Swaps manifest.chrome.json → manifest.json, runs web-ext build, then restores
 * Also cleans artifacts folder and extracts the zip automatically
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'manifest.json');
const MANIFEST_FIREFOX = path.join(ROOT, 'manifest.firefox.backup.json');
const MANIFEST_CHROME = path.join(ROOT, 'manifest.chrome.json');
const ARTIFACTS_DIR = path.join(ROOT, 'artifacts');
const ZIP_NAME = 'pixiv-templater-chrome.zip';
const EXTRACT_FOLDER = 'pixiv-templater-chrome';

/**
 * Recursively delete a directory (rm -rf equivalent)
 */
function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}

/**
 * Clean artifacts folder (delete zips and extracted folders)
 */
function cleanArtifacts() {
    if (!fs.existsSync(ARTIFACTS_DIR)) {
        fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
        return;
    }

    const items = fs.readdirSync(ARTIFACTS_DIR);
    for (const item of items) {
        const itemPath = path.join(ARTIFACTS_DIR, item);
        const stat = fs.lstatSync(itemPath);

        if (stat.isDirectory()) {
            console.log(`[Chrome Build] Deleting folder: ${item}`);
            deleteFolderRecursive(itemPath);
        } else if (item.endsWith('.zip')) {
            console.log(`[Chrome Build] Deleting zip: ${item}`);
            fs.unlinkSync(itemPath);
        }
    }
}

/**
 * Extract zip using 7-Zip
 */
function extractZip(zipPath, destPath) {
    // Delete destination folder if exists
    if (fs.existsSync(destPath)) {
        deleteFolderRecursive(destPath);
    }

    // Use 7-Zip to extract
    const command = `7z x "${zipPath}" -o"${destPath}" -y`;
    execSync(command, { stdio: 'inherit' });
}

console.log('[Chrome Build] Starting...');

try {
    // 1. Clean artifacts folder
    console.log('[Chrome Build] Cleaning artifacts folder...');
    cleanArtifacts();

    // 2. Backup Firefox manifest
    console.log('[Chrome Build] Backing up Firefox manifest...');
    fs.copyFileSync(MANIFEST, MANIFEST_FIREFOX);

    // 3. Copy Chrome manifest as manifest.json
    console.log('[Chrome Build] Using Chrome manifest...');
    fs.copyFileSync(MANIFEST_CHROME, MANIFEST);

    // 4. Run web-ext build
    console.log('[Chrome Build] Running web-ext build...');
    execSync('npx web-ext build --source-dir . --artifacts-dir ./artifacts --filename pixiv-templater-chrome.zip --overwrite-dest --ignore-files manifest.chrome.json manifest.firefox.backup.json', {
        cwd: ROOT,
        stdio: 'inherit'
    });

    // 5. Extract the zip
    const zipPath = path.join(ARTIFACTS_DIR, ZIP_NAME);
    const extractPath = path.join(ARTIFACTS_DIR, EXTRACT_FOLDER);

    if (fs.existsSync(zipPath)) {
        console.log('[Chrome Build] Extracting zip...');
        extractZip(zipPath, extractPath);
        console.log(`[Chrome Build] Extracted to: ${EXTRACT_FOLDER}/`);
    }

    console.log('[Chrome Build] ✅ Build complete!');
} catch (error) {
    console.error('[Chrome Build] ❌ Build failed:', error.message);
    process.exitCode = 1;
} finally {
    // 6. Restore Firefox manifest
    console.log('[Chrome Build] Restoring Firefox manifest...');
    if (fs.existsSync(MANIFEST_FIREFOX)) {
        fs.copyFileSync(MANIFEST_FIREFOX, MANIFEST);
        fs.unlinkSync(MANIFEST_FIREFOX);
    }
}
