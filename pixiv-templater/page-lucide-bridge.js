// Lucide Icons Bridge - Handles icon creation in page context
// This script runs in the page context and listens for events to refresh icons

(function() {
  'use strict';

  console.log('[Pixiv Templater] Lucide bridge initialized');

  // Function to create/update Lucide icons
  function refreshLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try {
        window.lucide.createIcons();
        console.log('[Pixiv Templater] Lucide icons refreshed');
      } catch (e) {
        console.error('[Pixiv Templater] Error creating Lucide icons:', e);
      }
    } else {
      console.warn('[Pixiv Templater] Lucide not available yet');
    }
  }

  // Listen for custom event from templater
  window.addEventListener('pixiv_templater_icons_added', function() {
    console.log('[Pixiv Templater] Icons added event received');
    refreshLucideIcons();
  });

  // Fallback: MutationObserver to detect when new icons are added to the DOM
  const observer = new MutationObserver(function(mutations) {
    let hasIconElements = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) { // Element node
            // Check if the added node or its children contain data-lucide attributes
            if (node.hasAttribute && node.hasAttribute('data-lucide')) {
              hasIconElements = true;
              break;
            }
            if (node.querySelectorAll && node.querySelectorAll('[data-lucide]').length > 0) {
              hasIconElements = true;
              break;
            }
          }
        }
      }
      if (hasIconElements) break;
    }

    if (hasIconElements) {
      // Debounce: wait a bit before refreshing to batch multiple changes
      clearTimeout(observer.timer);
      observer.timer = setTimeout(refreshLucideIcons, 50);
    }
  });

  // Start observing when DOM is ready
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log('[Pixiv Templater] MutationObserver started');
  } else {
    // If body not ready, wait for it
    document.addEventListener('DOMContentLoaded', function() {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      console.log('[Pixiv Templater] MutationObserver started (after DOMContentLoaded)');
    });
  }

  // Initial refresh after a short delay to ensure Lucide is loaded
  setTimeout(refreshLucideIcons, 100);

  // Expose refresh function globally in case manual refresh is needed
  window.pixivTemplaterRefreshIcons = refreshLucideIcons;
})();
