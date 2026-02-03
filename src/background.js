// Background script for Pixiv Templater
// Compatible with Chrome MV3 (service worker) and Firefox

// Polyfill - browserAPI é global (injetado pelo polyfill ou definido aqui)
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Lifecycle - apenas onInstalled (onStartup não é confiável no Chrome MV3)
browserAPI.runtime.onInstalled.addListener(() => {
    console.log("[Pixiv Templater] Extension installed/updated");
});

console.log("[Pixiv Templater Background] Service worker initialized");

// Listen for messages from content scripts
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[Pixiv Templater Background] Received message:", message);

    if (message.type === "OPEN_DASHBOARD") {
        const dashboardURL = browserAPI.runtime.getURL("src/dashboard/dashboard.html");
        browserAPI.tabs.create({ url: dashboardURL }, (tab) => {
            console.log("[Pixiv Templater Background] Dashboard opened in tab:", tab?.id);
            sendResponse({ success: true, tabId: tab?.id });
        });
        return true; // CRÍTICO pro Chrome MV3
    }

    // Handle fetch requests from content scripts (CORS-free in background)
    if (message.type === "FETCH_REQUEST") {
        console.log("[Pixiv Templater Background] Fetch request:", message.url);

        // Headers mínimos para evitar problemas
        const options = {
            method: message.options?.method || "GET",
            headers: {
                "Accept": "application/json",
                ...(message.options?.headers || {})
            },
            mode: "cors"
        };

        console.log("[Pixiv Templater Background] Fetch options:", options);

        fetch(message.url, options)
            .then(async (response) => {
                console.log("[Pixiv Templater Background] Response status:", response.status, response.statusText);
                console.log("[Pixiv Templater Background] Response headers:", [...response.headers.entries()]);
                
                const contentType = response.headers.get("content-type") || "";
                let data;

                try {
                    if (contentType.includes("application/json")) {
                        data = await response.json();
                    } else {
                        data = await response.text();
                        console.log("[Pixiv Templater Background] Response text (first 500 chars):", data.substring(0, 500));
                    }
                } catch (parseError) {
                    console.error("[Pixiv Templater Background] Parse error:", parseError);
                    data = null;
                }

                sendResponse({
                    success: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                });
            })
            .catch((error) => {
                console.error("[Pixiv Templater Background] Fetch error:", error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            });

        return true; // CRÍTICO - indica resposta assíncrona
    }

    return false;
});

// action.onClicked só funciona se NÃO houver popup no manifest
browserAPI.action.onClicked.addListener(() => {
    console.log("[Pixiv Templater Background] Icon clicked, opening dashboard...");
    const dashboardURL = browserAPI.runtime.getURL("src/dashboard/dashboard.html");
    browserAPI.tabs.create({ url: dashboardURL });
});
