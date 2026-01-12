/**
 * Pixiv Templater - Internationalization Module
 * Provides translation support for multiple languages
 */

(function () {
    "use strict";

    // Supported languages
    const SUPPORTED_LANGUAGES = ["en", "pt-br"];
    const DEFAULT_LANGUAGE = "en";

    // Cache for loaded translations
    let translations = {};
    let currentLanguage = DEFAULT_LANGUAGE;

    /**
     * Detect the user's preferred language
     * Priority: storage > browser > fallback
     */
    async function detectLanguage() {
        // Try to get from storage first
        const stored = await getStoredLanguage();
        if (stored && stored !== "auto" && SUPPORTED_LANGUAGES.includes(stored)) {
            return stored;
        }

        return detectBrowserLanguage();
    }

    /**
     * Internal browser language detection logic
     */
    function detectBrowserLanguage() {
        // Check browser language
        const browserLang = navigator.language.toLowerCase();

        // Direct match
        if (SUPPORTED_LANGUAGES.includes(browserLang)) {
            return browserLang;
        }

        // Partial match (e.g., "pt" matches "pt-br")
        const langPrefix = browserLang.split("-")[0];
        const match = SUPPORTED_LANGUAGES.find(
            (lang) => lang.startsWith(langPrefix) || lang === langPrefix
        );
        if (match) {
            return match;
        }

        // Fallback
        return DEFAULT_LANGUAGE;
    }

    /**
     * Get stored language preference
     */
    async function getStoredLanguage() {
        return new Promise((resolve) => {
            if (typeof chrome !== "undefined" && chrome.storage) {
                chrome.storage.local.get(["pixiv_templater_language"], (result) => {
                    resolve(result.pixiv_templater_language || null);
                });
            } else {
                // Fallback for page context (use message bridge)
                resolve(null);
            }
        });
    }

    /**
     * Save language preference to storage
     */
    async function setLanguage(lang) {
        if (lang !== "auto" && !SUPPORTED_LANGUAGES.includes(lang)) {
            console.warn(`[i18n] Unsupported language: ${lang}`);
            return false;
        }

        let effectiveLang = lang;
        if (lang === "auto") {
            effectiveLang = detectBrowserLanguage();
        }

        currentLanguage = effectiveLang;

        if (typeof chrome !== "undefined" && chrome.storage) {
            await chrome.storage.local.set({ pixiv_templater_language: lang });
        }

        // Reload translations
        await loadLocale(effectiveLang);
        translatePage();

        return true;
    }

    /**
     * Load translations for a specific language
     */
    async function loadLocale(lang) {
        if (!SUPPORTED_LANGUAGES.includes(lang)) {
            lang = DEFAULT_LANGUAGE;
        }

        try {
            // Get the extension URL base
            let url;

            // Check if we have the base URL injected by content script
            if (window.__PIXIV_TEMPLATER_EXTENSION_URL__) {
                url = window.__PIXIV_TEMPLATER_EXTENSION_URL__ + `locales/${lang}.json`;
            } else if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
                // Direct access to chrome.runtime (extension context)
                url = chrome.runtime.getURL(`locales/${lang}.json`);
            } else {
                // Last resort - this won't work in page context but prevents crash
                console.warn("[i18n] No extension URL available, translations may not load");
                translations = {};
                return false;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load locale: ${lang}`);
            }

            translations = await response.json();
            currentLanguage = lang;
            return true;
        } catch (error) {
            console.error(`[i18n] Error loading locale ${lang}:`, error);

            // Fallback to English if not already
            if (lang !== DEFAULT_LANGUAGE) {
                return loadLocale(DEFAULT_LANGUAGE);
            }

            translations = {};
            return false;
        }
    }

    /**
     * Get translation for a key
     * Supports dot notation: t("menu.settings")
     * @param {string} key - Translation key
     * @param {object} params - Optional parameters for interpolation
     * @returns {string} Translated string or key if not found
     */
    function t(key, params = {}) {
        const keys = key.split(".");
        let value = translations;

        for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
                value = value[k];
            } else {
                // Key not found, return key itself (silently)
                return key;
            }
        }

        if (typeof value !== "string") {
            return key;
        }

        // Interpolate parameters: {{param}}
        return value.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
            return params[paramName] !== undefined ? params[paramName] : match;
        });
    }

    /**
     * Translate a single DOM element
     * @param {HTMLElement} element - Element with data-i18n attribute
     */
    function translateElement(element) {
        const key = element.getAttribute("data-i18n");
        if (!key) return;

        const translation = t(key);
        if (translation === key) return; // No translation found

        // Check for specific attribute to translate
        const attr = element.getAttribute("data-i18n-attr");
        if (attr) {
            element.setAttribute(attr, translation);
        } else {
            // Translate text content, preserving child elements
            const children = Array.from(element.childNodes).filter(
                (node) => node.nodeType === Node.ELEMENT_NODE
            );

            if (children.length === 0) {
                element.textContent = translation;
            } else {
                // Find and replace text nodes only
                for (const node of element.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                        node.textContent = translation;
                        break;
                    }
                }
            }
        }
    }

    /**
     * Translate placeholder attribute
     * @param {HTMLElement} element - Element with data-i18n-placeholder attribute
     */
    function translatePlaceholder(element) {
        const key = element.getAttribute("data-i18n-placeholder");
        if (!key) return;

        const translation = t(key);
        if (translation !== key) {
            element.placeholder = translation;
        }
    }

    /**
     * Translate all elements on the page with data-i18n attributes
     */
    function translatePage(root = document) {
        // Translate elements with data-i18n
        const elements = root.querySelectorAll("[data-i18n]");
        elements.forEach(translateElement);

        // Translate placeholders
        const placeholderElements = root.querySelectorAll("[data-i18n-placeholder]");
        placeholderElements.forEach(translatePlaceholder);

        // Translate title attributes
        const titleElements = root.querySelectorAll("[data-i18n-title]");
        titleElements.forEach((el) => {
            const key = el.getAttribute("data-i18n-title");
            const translation = t(key);
            if (translation !== key) {
                el.title = translation;
            }
        });
    }

    /**
     * Initialize i18n system
     */
    async function init() {
        const lang = await detectLanguage();
        await loadLocale(lang);
        return currentLanguage;
    }

    /**
     * Get current language
     */
    function getCurrentLanguage() {
        return currentLanguage;
    }

    /**
     * Get the actual language setting (could be "auto")
     */
    async function getLanguageSetting() {
        return await getStoredLanguage() || "auto";
    }

    /**
     * Get list of supported languages
     */
    function getSupportedLanguages() {
        return [...SUPPORTED_LANGUAGES];
    }

    // Export to window for use in other scripts
    window.PixivTemplaterI18n = {
        init,
        t,
        translatePage,
        translateElement,
        setLanguage,
        getCurrentLanguage,
        getLanguageSetting,
        getSupportedLanguages,
        loadLocale,
    };
})();
