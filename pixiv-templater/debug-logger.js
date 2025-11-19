// Debug Logger Module
// Centralized logging system with debug mode toggle

(function () {
  "use strict";

  // Logger configuration
  const LogLevel = {
    ESSENTIAL: 0, // Always shown (initialization, critical events)
    INFO: 1, // General information (storage operations, state changes)
    DEBUG: 2, // Detailed debug info (function calls, data processing)
    VERBOSE: 3, // Very detailed (loops, iterations, raw data)
  };

  class DebugLogger {
    constructor() {
      this.debugMode = false;
      this.logHistory = [];
      this.maxHistorySize = 100;
      this.loadDebugMode();
    }

    // Load debug mode from storage
    async loadDebugMode() {
      try {
        if (typeof chrome !== "undefined" && chrome.storage) {
          const result = await chrome.storage.local.get([
            "pixiv_templater_debug_mode",
          ]);
          this.debugMode = result.pixiv_templater_debug_mode || false;
        }
      } catch (err) {
        console.error("[Logger] Failed to load debug mode:", err);
      }
    }

    // Set debug mode
    async setDebugMode(enabled) {
      this.debugMode = enabled;
      try {
        if (typeof chrome !== "undefined" && chrome.storage) {
          await chrome.storage.local.set({
            pixiv_templater_debug_mode: enabled,
          });
        }
      } catch (err) {
        console.error("[Logger] Failed to save debug mode:", err);
      }
      console.log(
        `[Debug Logger] Debug mode ${enabled ? "ENABLED" : "DISABLED"}`,
      );
    }

    // Get debug mode status
    isDebugEnabled() {
      return this.debugMode;
    }

    // Add to log history
    addToHistory(level, component, message, data) {
      const entry = {
        timestamp: new Date().toISOString(),
        level,
        component,
        message,
        data,
      };

      this.logHistory.push(entry);

      // Keep history size limited
      if (this.logHistory.length > this.maxHistorySize) {
        this.logHistory.shift();
      }
    }

    // Get log history
    getHistory(filterComponent = null) {
      if (filterComponent) {
        return this.logHistory.filter((e) => e.component === filterComponent);
      }
      return this.logHistory;
    }

    // Clear log history
    clearHistory() {
      this.logHistory = [];
    }

    // Essential logs (always shown)
    essential(component, message, data = null) {
      const logMsg = `[${component}] ${message}`;
      console.log(logMsg, data !== null ? data : "");
      this.addToHistory(LogLevel.ESSENTIAL, component, message, data);
    }

    // Info logs (only in debug mode)
    info(component, message, data = null) {
      if (!this.debugMode) return;
      const logMsg = `[${component}] ${message}`;
      console.log(logMsg, data !== null ? data : "");
      this.addToHistory(LogLevel.INFO, component, message, data);
    }

    // Debug logs (only in debug mode)
    debug(component, message, data = null) {
      if (!this.debugMode) return;
      const logMsg = `[${component}] 🐛 ${message}`;
      console.log(logMsg, data !== null ? data : "");
      this.addToHistory(LogLevel.DEBUG, component, message, data);
    }

    // Verbose logs (only in debug mode)
    verbose(component, message, data = null) {
      if (!this.debugMode) return;
      const logMsg = `[${component}] 📝 ${message}`;
      console.log(logMsg, data !== null ? data : "");
      this.addToHistory(LogLevel.VERBOSE, component, message, data);
    }

    // Error logs (always shown)
    error(component, message, error = null) {
      const logMsg = `[${component}] ❌ ERROR: ${message}`;
      console.error(logMsg, error !== null ? error : "");
      this.addToHistory(LogLevel.ESSENTIAL, component, message, error);
    }

    // Warning logs (always shown)
    warn(component, message, data = null) {
      const logMsg = `[${component}] ⚠️ WARNING: ${message}`;
      console.warn(logMsg, data !== null ? data : "");
      this.addToHistory(LogLevel.ESSENTIAL, component, message, data);
    }

    // Success logs (only in debug mode)
    success(component, message, data = null) {
      if (!this.debugMode) return;
      const logMsg = `[${component}] ✓ ${message}`;
      console.log(logMsg, data !== null ? data : "");
      this.addToHistory(LogLevel.INFO, component, message, data);
    }

    // Group start (only in debug mode)
    groupStart(component, label) {
      if (!this.debugMode) return;
      console.group(`[${component}] ${label}`);
    }

    // Group end (only in debug mode)
    groupEnd() {
      if (!this.debugMode) return;
      console.groupEnd();
    }

    // Table logs (only in debug mode)
    table(component, data, label = "") {
      if (!this.debugMode) return;
      if (label) console.log(`[${component}] ${label}`);
      console.table(data);
    }

    // Performance timing
    time(component, label) {
      if (!this.debugMode) return;
      console.time(`[${component}] ${label}`);
    }

    timeEnd(component, label) {
      if (!this.debugMode) return;
      console.timeEnd(`[${component}] ${label}`);
    }

    // Export logs as JSON
    exportLogs() {
      return JSON.stringify(this.logHistory, null, 2);
    }

    // Export logs as text
    exportLogsText() {
      return this.logHistory
        .map((entry) => {
          const timestamp = new Date(entry.timestamp).toLocaleString();
          const dataStr = entry.data ? JSON.stringify(entry.data) : "";
          return `[${timestamp}] [${entry.component}] ${entry.message} ${dataStr}`;
        })
        .join("\n");
    }
  }

  // Create singleton instance
  const logger = new DebugLogger();

  // Export to window for global access
  if (typeof window !== "undefined") {
    window.PixivTemplaterLogger = logger;
  }

  // For extension pages (options, popup)
  if (typeof self !== "undefined") {
    self.PixivTemplaterLogger = logger;
  }

  // Essential startup log
  logger.essential("Debug Logger", "Logger module initialized");
})();
