// Page Logger - Helper for scripts injected into page context
// Uses window.PIXIV_TEMPLATER_DEBUG_MODE to determine log visibility

(function () {
  "use strict";

  // Log colors
  const COLORS = {
    essential: "color: #0096fa; font-weight: bold",
    info: "color: #888",
    debug: "color: #ff9800",
    verbose: "color: #9c27b0",
    error: "color: #f44336; font-weight: bold",
    warn: "color: #ff9800; font-weight: bold",
    success: "color: #4caf50; font-weight: bold",
    user: "color: #00bcd4",
  };

  // Check if debug mode is enabled (read from data attribute, CSP-safe)
  function isDebugEnabled() {
    // Try data attribute first, then global variable as fallback
    const fromDataAttr = document.body?.dataset?.pixivTemplaterDebug;
    if (fromDataAttr !== undefined) {
      return fromDataAttr === 'true';
    }
    return window.PIXIV_TEMPLATER_DEBUG_MODE === true;
  }

  // Logger object with different log levels
  const PageLogger = {
    // Essential logs (always shown)
    essential: function (component, message, data) {
      console.log(
        `%c[${component}] ${message}`,
        COLORS.essential,
        data !== undefined ? data : "",
      );
    },

    // Info logs (only in debug mode)
    info: function (component, message, data) {
      if (!isDebugEnabled()) return;
      console.log(
        `%c[${component}] ${message}`,
        COLORS.info,
        data !== undefined ? data : "",
      );
    },

    // Debug logs (only in debug mode)
    debug: function (component, message, data) {
      if (!isDebugEnabled()) return;
      console.log(
        `%c[${component}] [DEBUG] ${message}`,
        COLORS.debug,
        data !== undefined ? data : "",
      );
    },

    // Verbose logs (only in debug mode)
    verbose: function (component, message, data) {
      if (!isDebugEnabled()) return;
      console.log(
        `%c[${component}] ${message}`,
        COLORS.verbose,
        data !== undefined ? data : "",
      );
    },

    // Error logs (always shown)
    error: function (component, message, error) {
      console.error(
        `%c[${component}] ERROR: ${message}`,
        COLORS.error,
        error !== undefined ? error : "",
      );
    },

    // Warning logs (always shown)
    warn: function (component, message, data) {
      console.warn(
        `%c[${component}] WARNING: ${message}`,
        COLORS.warn,
        data !== undefined ? data : "",
      );
    },

    // Success logs (only in debug mode)
    success: function (component, message, data) {
      if (!isDebugEnabled()) return;
      console.log(
        `%c[${component}] ${message}`,
        COLORS.success,
        data !== undefined ? data : "",
      );
    },

    // User logs (always shown - for important user actions)
    user: function (component, message, data) {
      console.log(
        `%c[${component}] ${message}`,
        COLORS.user,
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
})();
