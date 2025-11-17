// Content script that injects all necessary scripts into the page context

(function () {
  "use strict";

  console.log("[Pixiv Templater Extension] Content script loaded");

  // Function to inject a script into the page context
  function injectScript(src, callback) {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(src);
    script.onload = function () {
      console.log(`[Pixiv Templater] Injected: ${src}`);
      this.remove();
      if (callback) callback();
    };
    script.onerror = function () {
      console.error(`[Pixiv Templater] Failed to inject: ${src}`);
    };
    (document.head || document.documentElement).appendChild(script);
  }

  // Function to load and inject UI resources (HTML and CSS)
  function loadUIResources(callback) {
    // Load CSS
    fetch(chrome.runtime.getURL("ui/ui.css"))
      .then((response) => response.text())
      .then((css) => {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
        console.log("[Pixiv Templater] CSS injected");

        // Load HTML
        return fetch(chrome.runtime.getURL("ui/ui.html"));
      })
      .then((response) => response.text())
      .then((html) => {
        const container = document.createElement("div");
        container.innerHTML = html;
        document.body.appendChild(container);
        console.log("[Pixiv Templater] HTML injected");

        if (callback) callback();
      })
      .catch((err) => {
        console.error("[Pixiv Templater] Failed to load UI resources:", err);
      });
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

  console.log("[Storage Bridge] Ready");

  // Inject scripts in sequence
  // 0. First inject browser polyfill for Firefox compatibility
  injectScript("browser-polyfill.js", function () {
    // 1. Then inject Lucide icons library
    injectScript("libs/lucide.min.js", function () {
      // 2. Then inject the Lucide bridge
      injectScript("page-lucide-bridge.js", function () {
        // 3. Then inject jQuery
        injectScript("libs/jquery.min.js", function () {
          // 4. Load UI resources (HTML and CSS)
          loadUIResources(function () {
            // 5. Then inject the UI script
            injectScript("ui/ui.js", function () {
              // 6. Finally inject the main templater script
              injectScript("templater.js", function () {
                console.log(
                  "[Pixiv Templater] All scripts loaded successfully",
                );
              });
            });
          });
        });
      });
    });
  });
})();
