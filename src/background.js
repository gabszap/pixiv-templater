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
    return false;
});

// action.onClicked só funciona se NÃO houver popup no manifest
browserAPI.action.onClicked.addListener(() => {
    console.log("[Pixiv Templater Background] Icon clicked, opening dashboard...");
    const dashboardURL = browserAPI.runtime.getURL("src/dashboard/dashboard.html");
    browserAPI.tabs.create({ url: dashboardURL });
});
