// Content script that injects all necessary scripts into the page context
// Robust injection with timeouts and error recovery

(function () {
  "use strict";

  console.log("[Pixiv Templater Extension] Content script loaded");

  // Function to inject a script into the page context with timeout
  function injectScript(src, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL(src);

      const timeoutId = setTimeout(() => {
        console.warn(
          `[Pixiv Templater] Timeout loading ${src}, continuing anyway...`,
        );
        resolve(); // Continue even on timeout
      }, timeout);

      script.onload = function () {
        clearTimeout(timeoutId);
        console.log(`[Pixiv Templater] ✓ Injected: ${src}`);
        this.remove();
        resolve();
      };

      script.onerror = function () {
        clearTimeout(timeoutId);
        console.error(`[Pixiv Templater] ✗ Failed to inject: ${src}`);
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
      console.log("[Pixiv Templater] ✓ CSS injected");

      // Load HTML
      const htmlResponse = await fetch(chrome.runtime.getURL("ui/ui.html"));
      const html = await htmlResponse.text();
      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);
      console.log("[Pixiv Templater] ✓ HTML injected");
    } catch (err) {
      console.error("[Pixiv Templater] Failed to load UI resources:", err);
      throw err;
    }
  }

  // Storage bridge - runs as content script (has access to chrome.storage)
  // Listens for messages from page context and responds with storage data
  window.addEventListener("message", async function (event) {
    // Only accept messages from same window
    if (event.source !== window) return;

    const message = event.data;
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
      console.error("[Storage Bridge] Error:", error);
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

  console.log("[Storage Bridge] ✓ Ready");

  // Main injection sequence with error recovery
  async function initializeExtension() {
    try {
      console.log("[Pixiv Templater] Starting injection sequence...");

      // 0. Browser polyfill for Firefox compatibility
      await injectScript("browser-polyfill.js", 5000);

      // 1. Lucide icons library
      await injectScript("libs/lucide.min.js", 5000);

      // 2. Lucide bridge
      await injectScript("page-lucide-bridge.js", 5000);

      // 3. jQuery
      await injectScript("libs/jquery.min.js", 5000);

      // 4. UI resources (HTML and CSS)
      await loadUIResources();

      // 5. UI script
      await injectScript("ui/ui.js", 5000);

      // 6. Main templater script
      await injectScript("templater.js", 5000);

      console.log("[Pixiv Templater] ✓✓✓ All scripts loaded successfully ✓✓✓");
    } catch (error) {
      console.error(
        "[Pixiv Templater] Critical error during initialization:",
        error,
      );
      console.log("[Pixiv Templater] Attempting retry in 2 seconds...");

      // Retry once after 2 seconds
      setTimeout(async () => {
        try {
          console.log("[Pixiv Templater] Retry attempt...");
          await loadUIResources();
          await injectScript("ui/ui.js", 5000);
          await injectScript("templater.js", 5000);
          console.log("[Pixiv Templater] ✓ Retry successful");
        } catch (retryError) {
          console.error("[Pixiv Templater] Retry failed:", retryError);
        }
      }, 2000);
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeExtension);
  } else {
    // DOM already loaded
    initializeExtension();
  }
})();
