// Browser API Polyfill for Firefox compatibility
// This script provides a chrome API wrapper for Firefox's browser API

(function() {
    'use strict';

    // Firefox uses 'browser' API, Chrome uses 'chrome' API
    // This polyfill makes Firefox's 'browser' available as 'chrome'
    if (typeof chrome === 'undefined' && typeof browser !== 'undefined') {
        window.chrome = {
            runtime: {
                getURL: function(path) {
                    return browser.runtime.getURL(path);
                }
            }
        };
        console.log('[Browser Polyfill] Firefox compatibility layer loaded');
    }
})();
