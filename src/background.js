// Background script for Pixiv Templater
// Handles messages from content scripts to perform privileged operations

(function () {
    "use strict";

    console.log("[Pixiv Templater Background] Service worker initialized");

    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("[Pixiv Templater Background] Received message:", message);

        if (message.type === "OPEN_DASHBOARD") {
            console.log("[Pixiv Templater Background] Opening dashboard...");

            // Get the dashboard URL
            const dashboardURL = chrome.runtime.getURL("src/dashboard/dashboard.html");

            // Create a new tab with the dashboard
            chrome.tabs.create({ url: dashboardURL }, (tab) => {
                console.log("[Pixiv Templater Background] Dashboard opened in tab:", tab.id);
                sendResponse({ success: true, tabId: tab.id });
            });

            // Return true to indicate we'll send response asynchronously
            return true;
        }

        return false;
    });

    // Open dashboard when the extension icon is clicked
    chrome.action.onClicked.addListener(() => {
        const dashboardURL = chrome.runtime.getURL("src/dashboard/dashboard.html");
        chrome.tabs.create({ url: dashboardURL });
    });
})();
