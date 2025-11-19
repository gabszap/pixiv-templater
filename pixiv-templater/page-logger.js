// Page Logger - Helper for scripts injected into page context
// Uses window.PIXIV_TEMPLATER_DEBUG_MODE to determine log visibility

(function () {
  "use strict";

  // Check if debug mode is enabled
  function isDebugEnabled() {
    return window.PIXIV_TEMPLATER_DEBUG_MODE === true;
  }

  // Logger object with different log levels
  const PageLogger = {
    // Essential logs (always shown)
    essential: function (component, message, data) {
      console.log(
        `[${component}] ${message}`,
        data !== undefined ? data : "",
      );
    },

    // Info logs (only in debug mode)
    info: function (component, message, data) {
      if (!isDebugEnabled()) return;
      console.log(
        `[${component}] ${message}`,
        data !== undefined ? data : "",
      );
    },

    // Debug logs (only in debug mode)
    debug: function (component, message, data) {
      if (!isDebugEnabled()) return;
      console.log(
        `[${component}] 🐛 ${message}`,
        data !== undefined ? data : "",
      );
    },

    // Verbose logs (only in debug mode)
    verbose: function (component, message, data) {
      if (!isDebugEnabled()) return;
      console.log(
        `[${component}] 📝 ${message}`,
        data !== undefined ? data : "",
      );
    },

    // Error logs (always shown)
    error: function (component, message, error) {
      console.error(
        `[${component}] ❌ ERROR: ${message}`,
        error !== undefined ? error : "",
      );
    },

    // Warning logs (always shown)
    warn: function (component, message, data) {
      console.warn(
        `[${component}] ⚠️ WARNING: ${message}`,
        data !== undefined ? data : "",
      );
    },

    // Success logs (only in debug mode)
    success: function (component, message, data) {
      if (!isDebugEnabled()) return;
      console.log(
        `[${component}] ✓ ${message}`,
        data !== undefined ? data : "",
      );
    },

    // User logs (always shown - for important user actions)
    user: function (component, message, data) {
      console.log(
        `[${component}] 👤 ${message}`,
        data !== undefined ? data : "",
      );
    },

    // Group start (only in debug mode)
    groupStart: function (component, label) {
      if (!isDebugEnabled()) return;
      console.group(`[${component}] ${label}`);
    },

    // Group end (only in debug mode)
    groupEnd: function () {
      if (!isDebugEnabled()) return;
      console.groupEnd();
    },

    // Table logs (only in debug mode)
    table: function (component, data, label) {
      if (!isDebugEnabled()) return;
      if (label) console.log(`[${component}] ${label}`);
      console.table(data);
    },

    // Check if debug is enabled
    isDebugEnabled: isDebugEnabled,
  };

  // Export to window for global access
  window.PixivTemplaterPageLogger = PageLogger;

  // Shorthand alias
  window.PTLogger = PageLogger;

  // Essential startup log
  PageLogger.essential(
    "Page Logger",
    "Logger ready (Debug mode: " + isDebugEnabled() + ")",
  );
})();
