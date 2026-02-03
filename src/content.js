// Content script that injects all necessary scripts into the page context
// Robust injection with timeouts and error recovery
// Supports SPA navigation detection

(function () {
  "use strict";

  const UPLOAD_PAGE_PATTERN = /\/illustration\/create/;

  // Track if we've already initialized on this page
  let initialized = false;
  let lastUrl = location.href;

  /**
   * Check if current URL is the upload page
   */
  function isUploadPage() {
    return UPLOAD_PAGE_PATTERN.test(location.pathname);
  }

  // Prevent double content script injection
  if (window.__pixivTemplaterContentScriptLoaded) {
    console.log("[Pixiv Templater] Content script already loaded");
    return;
  }
  window.__pixivTemplaterContentScriptLoaded = true;

  let debugMode = false;

  // Check debug mode from storage
  async function loadDebugMode() {
    try {
      const result = await chrome.storage.local.get([
        "pixiv_templater_debug_mode",
      ]);
      debugMode = result.pixiv_templater_debug_mode || false;
    } catch (err) {
      console.error("[Pixiv Templater] Failed to load debug mode:", err);
    }
  }

  // Logging helpers
  const log = {
    essential: (msg, data) => {
      console.log(`[Pixiv Templater] ${msg}`, data !== undefined ? data : "");
    },
    debug: (msg, data) => {
      if (!debugMode) return;
      console.log(`[Pixiv Templater] ${msg}`, data !== undefined ? data : "");
    },
    error: (msg, error) => {
      console.error(
        `[Pixiv Templater] ${msg}`,
        error !== undefined ? error : "",
      );
    },
    warn: (msg, data) => {
      console.warn(`[Pixiv Templater] ${msg}`, data !== undefined ? data : "");
    },
  };

  // Function to inject a script into the page context with timeout
  function injectScript(src, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL(src);

      const timeoutId = setTimeout(() => {
        log.warn(`Timeout loading ${src}, continuing anyway...`);
        resolve(); // Continue even on timeout
      }, timeout);

      script.onload = function () {
        clearTimeout(timeoutId);
        log.debug(`✓ Injected: ${src}`);
        this.remove();
        resolve();
      };

      script.onerror = function () {
        clearTimeout(timeoutId);
        log.error(`✗ Failed to inject: ${src}`);
        reject(new Error(`Failed to load ${src}`));
      };

      (document.head || document.documentElement).appendChild(script);
    });
  }

  // Function to load and inject UI resources (HTML and CSS)
  async function loadUIResources() {
    try {
      // Load CSS
      const cssResponse = await fetch(chrome.runtime.getURL("src/floating-panel/ui.css"));
      const css = await cssResponse.text();
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
      log.debug("✓ CSS injected");

      // Load HTML
      const htmlResponse = await fetch(chrome.runtime.getURL("src/floating-panel/ui.html"));
      const html = await htmlResponse.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const container = document.createElement("div");
      container.append(...doc.body.childNodes);
      document.body.appendChild(container);
      log.debug("✓ HTML injected");
    } catch (err) {
      log.error("Failed to load UI resources:", err);
      throw err;
    }
  }

  // Inject extension URL, version, debug mode and other settings into page context
  // Uses data attributes instead of inline script to avoid CSP issues
  async function injectExtensionConfig() {
    const extensionUrl = chrome.runtime.getURL("");
    const manifest = chrome.runtime.getManifest();
    const version = manifest.version;

    // Load auto-translate setting (default is enabled)
    let autoTranslateTags = true;
    try {
      const result = await chrome.storage.local.get(["pixiv_templater_auto_translate_tags"]);
      const value = result.pixiv_templater_auto_translate_tags;
      // Explicitly check for false (could be boolean or string "false")
      if (value === false || value === "false") {
        autoTranslateTags = false;
      }
    } catch (err) {
      log.warn("Could not load auto_translate_tags setting, using default (enabled)");
    }

    // Use data attributes on body instead of inline script (CSP-safe)
    document.body.dataset.pixivTemplaterUrl = extensionUrl;
    document.body.dataset.pixivTemplaterVersion = version;
    document.body.dataset.pixivTemplaterDebug = debugMode;
    document.body.dataset.pixivTemplaterAutoTranslate = autoTranslateTags;

    // Also dispatch a custom event for scripts that need to listen
    window.dispatchEvent(new CustomEvent('pixivTemplaterConfigReady', {
      detail: {
        extensionUrl,
        version,
        debugMode,
        autoTranslateTags
      }
    }));
  }

  // Storage bridge and API bridge - runs as content script
  // Listens for messages from page context and responds with storage data or API responses
  // The content script context has access to chrome.storage AND can make cross-origin requests
  window.addEventListener("message", async function (event) {
    // Only accept messages from same window
    if (event.source !== window) return;

    const message = event.data;

    // Handle fetch requests from page context - route through background script
    if (message.type === "PIXIV_TEMPLATER_FETCH") {
      log.debug("Fetch request from page, routing to background:", message.url);

      // Send to background script which can make CORS-free requests
      chrome.runtime.sendMessage(
        {
          type: "FETCH_REQUEST",
          url: message.url,
          options: message.options || {}
        },
        (response) => {
          if (chrome.runtime.lastError) {
            log.error("Background fetch error:", chrome.runtime.lastError);
            window.postMessage({
              type: "PIXIV_TEMPLATER_FETCH_RESPONSE",
              id: message.id,
              success: false,
              error: chrome.runtime.lastError.message
            }, "*");
            return;
          }

          window.postMessage({
            type: "PIXIV_TEMPLATER_FETCH_RESPONSE",
            id: message.id,
            success: response.success,
            status: response.status,
            statusText: response.statusText,
            data: response.data,
            error: response.error
          }, "*");
        }
      );
      return;
    }

    // Handle dashboard open request
    if (message.type === "PIXIV_TEMPLATER_OPEN_DASHBOARD") {
      log.essential("Received OPEN_DASHBOARD request from page");

      // Send message to background script to open dashboard
      chrome.runtime.sendMessage({ type: "OPEN_DASHBOARD" }, (response) => {
        if (response && response.success) {
          log.essential(
            "Dashboard opened successfully in tab:",
            response.tabId,
          );
        } else {
          log.error("Failed to open dashboard");
        }
      });

      return;
    }

    if (!message.type || !message.type.startsWith("PIXIV_TEMPLATER_STORAGE_"))
      return;

    try {
      switch (message.type) {
        case "PIXIV_TEMPLATER_STORAGE_GET":
          const fullKey = `pixiv_templater_${message.key}`;
          const result = await chrome.storage.local.get([fullKey]);
          const value =
            result[fullKey] !== undefined
              ? result[fullKey]
              : message.defaultValue;

          log.debug(`Storage GET: ${message.key}`, value !== undefined);

          // Special handling for debug_mode - also update page context
          if (message.key === "debug_mode") {
            debugMode = value || false;
            injectExtensionConfig();
          }

          window.postMessage(
            {
              type: "PIXIV_TEMPLATER_STORAGE_GET_RESPONSE",
              id: message.id,
              value: value,
            },
            "*",
          );
          break;

        case "PIXIV_TEMPLATER_STORAGE_SET":
          const setKey = `pixiv_templater_${message.key}`;
          await chrome.storage.local.set({ [setKey]: message.value });

          log.debug(`Storage SET: ${message.key}`);

          // Special handling for debug_mode - also update page context
          if (message.key === "debug_mode") {
            debugMode = message.value || false;
            injectExtensionConfig();
          }

          window.postMessage(
            {
              type: "PIXIV_TEMPLATER_STORAGE_SET_RESPONSE",
              id: message.id,
              success: true,
            },
            "*",
          );
          break;

        case "PIXIV_TEMPLATER_STORAGE_REMOVE":
          const removeKey = `pixiv_templater_${message.key}`;
          await chrome.storage.local.remove([removeKey]);

          log.debug(`Storage REMOVE: ${message.key}`);

          window.postMessage(
            {
              type: "PIXIV_TEMPLATER_STORAGE_REMOVE_RESPONSE",
              id: message.id,
              success: true,
            },
            "*",
          );
          break;
      }
    } catch (error) {
      log.error("Storage Bridge Error:", error);
      window.postMessage(
        {
          type: message.type + "_RESPONSE",
          id: message.id,
          error: error.message,
        },
        "*",
      );
    }
  });

  log.debug("Storage Bridge ready");

  // Main injection sequence with error recovery
  async function initializeExtension() {
    try {
      // Silently inject - only log on debug mode
      if (debugMode) log.essential("Starting injection sequence...");

      // Inject extension config (URL + debug mode + settings) first
      await injectExtensionConfig();

      // 0. Browser polyfill for Firefox compatibility
      await injectScript("src/utils/browser-polyfill.js", 5000);

      // 1. Page logger for debug mode support
      await injectScript("src/utils/page-logger.js", 5000);

      // 2. Lucide icons library - REMOVED (file doesn't exist)
      // await injectScript("libs/lucide.min.js", 5000);

      // 3. Lucide bridge - REMOVED (not needed without lucide)
      // await injectScript("page-lucide-bridge.js", 5000);

      // 4. jQuery
      await injectScript("libs/jquery.js", 5000);

      // 5. i18n module (must load before UI)
      await injectScript("src/core/i18n.js", 5000);

      // 6. UI resources (HTML and CSS)
      await loadUIResources();

      // 7. UI script
      await injectScript("src/floating-panel/ui.js", 5000);

      // 8. Tag translator module
      await injectScript("src/core/tag-translator.js", 5000);

      // 9. Main templater script
      await injectScript("src/core/templater.js", 5000);

      // 10. Upload page tag translator (translates recommended tags)
      await injectScript("src/core/upload-translator.js", 5000);

      // Show single success message
      log.essential("Pixiv Templater loaded");
    } catch (error) {
      log.error("Critical error during initialization:", error);
      log.debug("Attempting retry in 2 seconds...");

      // Retry once after 2 seconds
      setTimeout(async () => {
        try {
          log.debug("Retry attempt...");
          await loadUIResources();
          await injectScript("src/floating-panel/ui.js", 5000);
          await injectScript("src/core/templater.js", 5000);
          log.debug("Retry successful");
        } catch (retryError) {
          log.error("Retry failed:", retryError);
        }
      }, 2000);
    }
  }

  // Wait for DOM to be ready and load debug mode first
  async function init() {
    await loadDebugMode();
    log.debug("Debug mode loaded:", debugMode);

    // Only initialize if on upload page
    if (isUploadPage() && !initialized) {
      initialized = true;
      initializeExtension();
    }
  }

  /**
   * Check for URL changes (SPA navigation)
   */
  function checkUrlChange() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      log.essential("URL changed to:", location.href);

      // If navigated to upload page, initialize
      if (isUploadPage() && !initialized) {
        log.essential("Navigated to upload page, initializing...");
        initialized = true;
        initializeExtension();
      }
    }
  }

  // Start URL monitoring for SPA navigation
  // Use multiple detection methods for reliability

  // 1. Interval-based checking (fallback)
  setInterval(checkUrlChange, 500);

  // 2. Listen for popstate (back/forward navigation)
  window.addEventListener("popstate", checkUrlChange);

  // 3. Intercept pushState and replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    checkUrlChange();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    checkUrlChange();
  };

  // Start initialization
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // DOM already loaded
    init();
  }
})();
