// Browser API Polyfill - simples e seguro
// Cross-browser compatibility for Chrome and Firefox
// This script is injected into page context - APIs may not be available

(function () {
    'use strict';

    // Check if we're in an extension context (content script, background, popup)
    // In page context, browser/chrome APIs are NOT available
    const isExtensionContext = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    const isFirefoxExtension = typeof browser !== 'undefined' && browser.runtime && browser.runtime.id;

    if (!isExtensionContext && !isFirefoxExtension) {
        // We're in page context - no extension APIs available
        // Just create empty placeholders to prevent errors
        if (typeof window !== 'undefined') {
            window.browserAPI = null;
            window.sendMessage = function () {
                console.warn('[Browser Polyfill] Not in extension context');
                return Promise.resolve(null);
            };
        }
        return;
    }

    // Extension context - APIs are available
    const browserAPI = isFirefoxExtension ? browser : chrome;

    // Helper para padronizar messaging (Promise/callback)
    function sendMessage(msg) {
        return new Promise((resolve) => {
            browserAPI.runtime.sendMessage(msg, resolve);
        });
    }

    // Expor globalmente
    if (typeof window !== 'undefined') {
        window.browserAPI = browserAPI;
        window.sendMessage = sendMessage;
    }

    // Para contextos sem window (service worker)
    if (typeof self !== 'undefined' && typeof window === 'undefined') {
        self.browserAPI = browserAPI;
        self.sendMessage = sendMessage;
    }
})();
