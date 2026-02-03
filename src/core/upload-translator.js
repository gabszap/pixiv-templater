// Pixiv Upload Page Tag Translator
// Translates recommended tags on Pixiv upload page (/illustration/create*)
// Based on the initializePixivUpload() function from translate-pixiv-tags userscript

(function () {
    "use strict";

    // Wait for PixivTagTranslator to be available
    const MAX_WAIT_TIME = 10000;
    const CHECK_INTERVAL = 100;
    const SCAN_INTERVAL = 2000;

    /**
     * Wait for the tag translator module to load
     * @returns {Promise<void>}
     */
    function waitForTranslator() {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const check = () => {
                if (window.PixivTagTranslator) {
                    resolve();
                    return;
                }

                if (Date.now() - startTime > MAX_WAIT_TIME) {
                    reject(new Error("PixivTagTranslator not available"));
                    return;
                }

                setTimeout(check, CHECK_INTERVAL);
            };

            check();
        });
    }

    // ============================
    // CSS STYLES
    // ============================

    const CSS = `
    .ptpt-translated-tags {
      display: inline-block;
      margin-left: 0.5em;
      font-size: 12px;
    }

    .ptpt-translated-tag {
      text-decoration: none;
      white-space: nowrap;
    }

    .ptpt-translated-tag:hover {
      text-decoration: underline;
    }

    /* Loading indicator */
    .ptpt-loading {
      display: inline-block;
      margin-left: 0.5em;
      font-size: 11px;
      color: #888;
    }

    .ptpt-loading::after {
      content: '';
      display: inline-block;
      width: 10px;
      height: 10px;
      margin-left: 4px;
      border: 2px solid #ddd;
      border-top-color: #0096fa;
      border-radius: 50%;
      animation: ptpt-spin 0.8s linear infinite;
      vertical-align: middle;
    }

    @keyframes ptpt-spin {
      to { transform: rotate(360deg); }
    }

    /* Category colors (Danbooru standard) */
    .ptpt-tag-category-0 { color: #0075f8 !important; } /* General */
    .ptpt-tag-category-1 { color: #c00004 !important; } /* Artist */
    .ptpt-tag-category-3 { color: #a800aa !important; } /* Copyright */
    .ptpt-tag-category-4 { color: #00ab2c !important; } /* Character */
    .ptpt-tag-category-5 { color: #fd9200 !important; } /* Meta */

    /* Dark mode support - Pixiv uses data-theme="dark" */
    [data-theme="dark"] .ptpt-loading { color: #aaa; }
    [data-theme="dark"] .ptpt-loading::after { border-color: #555; border-top-color: #0096fa; }
    [data-theme="dark"] .ptpt-tag-category-0 { color: #009be6 !important; }
    [data-theme="dark"] .ptpt-tag-category-1 { color: #ff8a8b !important; }
    [data-theme="dark"] .ptpt-tag-category-3 { color: #c797ff !important; }
    [data-theme="dark"] .ptpt-tag-category-4 { color: #35c64a !important; }
    [data-theme="dark"] .ptpt-tag-category-5 { color: #ead084 !important; }

    /* Fallback media query dark mode */
    @media (prefers-color-scheme: dark) {
      .ptpt-loading { color: #aaa; }
      .ptpt-loading::after { border-color: #555; border-top-color: #0096fa; }
      .ptpt-tag-category-0 { color: #009be6 !important; }
      .ptpt-tag-category-1 { color: #ff8a8b !important; }
      .ptpt-tag-category-3 { color: #c797ff !important; }
      .ptpt-tag-category-4 { color: #35c64a !important; }
      .ptpt-tag-category-5 { color: #ead084 !important; }
    }
  `;

    /**
     * Inject CSS styles into the page
     */
    function injectStyles() {
        if (document.getElementById("ptpt-upload-styles")) return;

        const style = document.createElement("style");
        style.id = "ptpt-upload-styles";
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    // ============================
    // TAG DETECTION
    // ============================

    /**
     * Check if text contains non-ASCII characters (Japanese, etc.)
     * @param {string} text
     * @returns {boolean}
     */
    function hasNonLatinChars(text) {
        return /[^\x00-\x7F]/.test(text);
    }

    /**
     * Create a translation element to insert after a tag button
     * @param {import('./tag-translator').TranslatedTag[]} translations
     * @returns {HTMLElement}
     */
    function createTranslationElement(translations) {
        const container = document.createElement("span");
        container.className = "ptpt-translated-tags";

        const links = translations.map((tag) => {
            const link = document.createElement("a");
            link.href = `https://danbooru.donmai.us/posts?tags=${encodeURIComponent(tag.name)}`;
            link.className = `ptpt-translated-tag ptpt-tag-category-${tag.category}`;
            link.textContent = `(${tag.prettyName})`;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            return link;
        });

        // Join with space
        links.forEach((link, index) => {
            container.appendChild(link);
            if (index < links.length - 1) {
                container.appendChild(document.createTextNode(" "));
            }
        });

        return container;
    }

    /**
     * Translate a single tag button (silent)
     * @param {HTMLElement} button - The tag button element
     */
    async function translateTagButton(button) {
        const tagText = button.textContent?.trim();
        if (!tagText) return;

        // Skip if doesn't have non-Latin characters (no need to translate "fan art")
        if (!hasNonLatinChars(tagText)) return;

        // Skip if already translated or has loading indicator
        if (button.dataset.ptptTranslated === "true") return;
        if (button.nextElementSibling?.classList.contains("ptpt-translated-tags")) return;
        if (button.nextElementSibling?.classList.contains("ptpt-loading")) return;

        // Mark as being translated
        button.dataset.ptptTranslated = "true";

        // Show loading indicator
        const loadingEl = document.createElement("span");
        loadingEl.className = "ptpt-loading";
        button.insertAdjacentElement("afterend", loadingEl);

        try {
            const translations =
                await window.PixivTagTranslator.translateTag(tagText);

            // Remove loading indicator
            loadingEl.remove();

            if (translations && translations.length > 0) {
                const translationEl = createTranslationElement(translations);
                button.insertAdjacentElement("afterend", translationEl);
            }
        } catch (error) {
            console.warn(`[Translator] Failed to translate: ${tagText}`, error.message);
            // Remove loading indicator on error
            loadingEl.remove();
            // Reset flag to allow retry
            button.dataset.ptptTranslated = "false";
        }
    }

    // Track if we've already logged
    let hasLoggedTranslation = false;

    // Flag to control if translation is active
    let isTranslationEnabled = false;

    /**
     * Scan and translate all recommended tag buttons on the page
     */
    function scanAndTranslate() {
        // Skip if translation is disabled
        if (!isTranslationEnabled) {
            return;
        }

        // Look for buttons with gtm-* and *tag* classes (Pixiv's recommended tag buttons)
        const tagButtons = document.querySelectorAll(
            "button[class*='gtm-'][class*='tag']",
        );

        // Count untranslated buttons with non-Latin chars
        const untranslatedCount = Array.from(tagButtons).filter(
            btn => !btn.dataset.ptptTranslated &&
                !btn.nextElementSibling?.classList.contains("ptpt-translated-tags") &&
                hasNonLatinChars(btn.textContent?.trim() || "")
        ).length;

        // Log once when there are tags to translate
        if (untranslatedCount > 0 && !hasLoggedTranslation) {
            console.log(`[Translator] Translating ${untranslatedCount} tags...`);
            hasLoggedTranslation = true;
        }

        for (const button of tagButtons) {
            translateTagButton(button);
        }
    }

    // ============================
    // INITIALIZATION
    // ============================

    /** @type {MutationObserver | null} */
    let observer = null;

    /** @type {number | null} */
    let scanIntervalId = null;

    /** @type {number | null} */
    let debounceTimer = null;

    /**
     * Debounced scan
     */
    function debouncedScan() {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            scanAndTranslate();
        }, 300);
    }

    /**
     * Start observing DOM changes
     */
    function startObserver() {
        if (observer) return;

        observer = new MutationObserver((mutations) => {
            // Check if any mutations added new elements that might be tag buttons
            let hasRelevantChanges = false;

            for (const mutation of mutations) {
                if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const el = /** @type {HTMLElement} */ (node);
                            // Check if this element or its children contain tag buttons
                            if (
                                el.matches?.("button[class*='gtm-'][class*='tag']") ||
                                el.querySelector?.("button[class*='gtm-'][class*='tag']")
                            ) {
                                hasRelevantChanges = true;
                                break;
                            }
                        }
                    }
                }

                if (hasRelevantChanges) break;
            }

            if (hasRelevantChanges) {
                debouncedScan();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        // DOM observer started (silent)
    }

    /**
     * Check if we're on the upload page
     * @returns {boolean}
     */
    function isUploadPage() {
        return /\/illustration\/create/.test(window.location.pathname);
    }

    /**
     * Initialize the upload page translator
     */
    async function initialize() {
        // Only run on upload pages
        if (!isUploadPage()) {
            // Not an upload page, skip silently
            return;
        }

        // Check if auto-translate is enabled via data attribute (CSP-safe)
        const dataValue = document.body?.dataset?.pixivTemplaterAutoTranslate;
        if (dataValue === 'false' || dataValue === false) {
            console.log("[Translator] Auto-translate tags is disabled in settings");
            isTranslationEnabled = false;
            return;
        }

        try {
            await waitForTranslator();

            // Enable translation flag
            isTranslationEnabled = true;

            injectStyles();

            // Initial scan
            scanAndTranslate();

            // Start observer for DOM changes
            startObserver();

            // Periodic scan as backup (like the userscript)
            scanIntervalId = setInterval(scanAndTranslate, SCAN_INTERVAL);

            // Initialized (silent)
        } catch (error) {
            console.error("[Translator] Initialization failed:", error);
        }
    }

    // Start when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        // Delay to ensure page components are loaded
        setTimeout(initialize, 1000);
    }

    // Expose for debugging
    window.PixivUploadTranslator = {
        scanAndTranslate,
        isUploadPage,
    };
})();
