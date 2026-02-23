/**
 * Build script for Firefox extension beta/dev testing
 * Injects a dev/beta version into "version_name" to test the UI locally.
 * Also cleans artifacts folder and extracts the zip automatically
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'manifest.json');
const MANIFEST_BACKUP = path.join(ROOT, 'manifest.firefox.backup.json');
const ARTIFACTS_DIR = path.join(ROOT, 'artifacts');
const ZIP_NAME = 'pixiv-templater-firefox-dev.zip';
const EXTRACT_FOLDER = 'pixiv-templater-firefox-dev';

// Gets the current manifest version and creates a beta version name
const manifestData = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const baseVersion = manifestData.version;
const betaVersionName = `${baseVersion}-dev.1`;

console.log(`[Firefox Dev Build] Base Version: ${baseVersion} | Dev Version: ${betaVersionName}`);

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

console.log('[Firefox Dev Build] Starting...');

try {
    // 1. Backup original manifest
    console.log('[Firefox Dev Build] Backing up original manifest...');
    fs.copyFileSync(MANIFEST, MANIFEST_BACKUP);

    // 2. Inject version_name
    console.log('[Firefox Dev Build] Injecting version_name...');
    manifestData.version_name = betaVersionName;
    fs.writeFileSync(MANIFEST, JSON.stringify(manifestData, null, 2));

    // 3. Run web-ext build
    console.log('[Firefox Dev Build] Running web-ext build...');
    execSync(`npx web-ext build --source-dir . --artifacts-dir ./artifacts --filename ${ZIP_NAME} --overwrite-dest --ignore-files manifest.chrome.json manifest.firefox.backup.json`, {
        cwd: ROOT,
        stdio: 'inherit'
    });

    // 4. Extract the zip
    const zipPath = path.join(ARTIFACTS_DIR, ZIP_NAME);
    const extractPath = path.join(ARTIFACTS_DIR, EXTRACT_FOLDER);

    if (fs.existsSync(zipPath)) {
        console.log('[Firefox Dev Build] Extracting zip for easy debugging...');
        extractZip(zipPath, extractPath);
        console.log(`[Firefox Dev Build] Extracted to: ${EXTRACT_FOLDER}/`);
    }

    console.log('[Firefox Dev Build] ✅ Build complete!');
} catch (error) {
    console.error('[Firefox Dev Build] ❌ Build failed:', error.message);
    process.exitCode = 1;
} finally {
    // 5. Restore original manifest
    console.log('[Firefox Dev Build] Restoring original manifest...');
    if (fs.existsSync(MANIFEST_BACKUP)) {
        fs.copyFileSync(MANIFEST_BACKUP, MANIFEST);
        fs.unlinkSync(MANIFEST_BACKUP);
    }
}
