// Content script that injects all necessary scripts into the page context
// Robust injection with timeouts and error recovery

(function () {
  "use strict";

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
      const cssResponse = await fetch(chrome.runtime.getURL("ui/ui.css"));
      const css = await cssResponse.text();
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
      log.debug("✓ CSS injected");

      // Load HTML
      const htmlResponse = await fetch(chrome.runtime.getURL("ui/ui.html"));
      const html = await htmlResponse.text();
      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);
      log.debug("✓ HTML injected");
    } catch (err) {
      log.error("Failed to load UI resources:", err);
      throw err;
    }
  }

  // Inject debug mode flag into page context
  function injectDebugMode() {
    const script = document.createElement("script");
    script.textContent = `
      // Debug mode flag accessible by page scripts
      window.PIXIV_TEMPLATER_DEBUG_MODE = ${debugMode};
      console.log("[Pixiv Templater] Debug mode in page context:", ${debugMode});
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  // Storage bridge - runs as content script (has access to chrome.storage)
  // Listens for messages from page context and responds with storage data
  window.addEventListener("message", async function (event) {
    // Only accept messages from same window
    if (event.source !== window) return;

    const message = event.data;

    // Handle dashboard open request
    if (message.type === "PIXIV_TEMPLATER_OPEN_DASHBOARD") {
      log.essential("Received OPEN_DASHBOARD request from page");

      // Send message to background script to open dashboard
      chrome.runtime.sendMessage(
        { type: "OPEN_DASHBOARD" },
        (response) => {
          if (response && response.success) {
            log.essential("Dashboard opened successfully in tab:", response.tabId);
          } else {
            log.error("Failed to open dashboard");
          }
        }
      );

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
            injectDebugMode();
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
            injectDebugMode();
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
      // ESSENTIAL LOG - Always shown
      log.essential("Starting injection sequence...");

      // Inject debug mode flag first
      injectDebugMode();

      // 0. Browser polyfill for Firefox compatibility
      await injectScript("browser-polyfill.js", 5000);

      // 1. Page logger for debug mode support
      await injectScript("page-logger.js", 5000);

      // 2. Lucide icons library - REMOVED (file doesn't exist)
      // await injectScript("libs/lucide.min.js", 5000);

      // 3. Lucide bridge - REMOVED (not needed without lucide)
      // await injectScript("page-lucide-bridge.js", 5000);

      // 4. jQuery
      await injectScript("libs/jquery.min.js", 5000);

      // 5. UI resources (HTML and CSS)
      await loadUIResources();

      // 6. UI script
      await injectScript("ui/ui.js", 5000);

      // 7. Main templater script
      await injectScript("templater.js", 5000);

      // ESSENTIAL LOG - Always shown
      log.essential("✓✓✓ All scripts loaded successfully ✓✓✓");
    } catch (error) {
      log.error("Critical error during initialization:", error);
      log.debug("Attempting retry in 2 seconds...");

      // Retry once after 2 seconds
      setTimeout(async () => {
        try {
          log.debug("Retry attempt...");
          await loadUIResources();
          await injectScript("ui/ui.js", 5000);
          await injectScript("templater.js", 5000);
          log.debug("✓ Retry successful");
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
    initializeExtension();
  }

  // Start initialization
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // DOM already loaded
    init();
  }
})();
