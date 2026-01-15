// Pixiv Templater - Extension Version
// Converted from userscript to browser extension
// Core logic and template application

(function () {
  "use strict";

  // Wait for PageLogger to be available
  const log = window.PTLogger || {
    essential: (c, m, d) => console.log(`[${c}] ${m}`, d || ""),
    info: () => { },
    debug: () => { },
    user: (c, m, d) => console.log(`[${c}] 👤 ${m}`, d || ""),
    error: (c, m, e) => console.error(`[${c}] ❌ ${m}`, e || ""),
  };

  // ESSENTIAL LOG - Always shown (read version from data attribute, CSP-safe)
  const version = document.body?.dataset?.pixivTemplaterVersion || "?";
  log.essential("Pixiv Templater", `Initializing v${version}...`);

  // ============================
  // STORAGE WRAPPER (uses chrome.storage via message bridge)
  // ============================

  const Storage = {
    get: async function (key, defaultValue) {
      // DEBUG: Removed verbose logs
      return new Promise((resolve) => {
        const id = Math.random().toString(36);

        const handler = (event) => {
          if (
            event.data.type === "PIXIV_TEMPLATER_STORAGE_GET_RESPONSE" &&
            event.data.id === id
          ) {
            window.removeEventListener("message", handler);
            // DEBUG: Removed verbose logs
            resolve(event.data.value);
          }
        };

        window.addEventListener("message", handler);

        // DEBUG: Removed verbose logs
        window.postMessage(
          {
            type: "PIXIV_TEMPLATER_STORAGE_GET",
            id: id,
            key: key,
            defaultValue: defaultValue,
          },
          "*",
        );

        // Timeout increased for slow connections
        setTimeout(() => {
          window.removeEventListener("message", handler);
          // Silent fallback - use localStorage without warning (expected behavior)
          try {
            const value = localStorage.getItem("pixiv_templater_" + key);
            resolve(value !== null ? value : defaultValue);
          } catch (e) {
            resolve(defaultValue);
          }
        }, 3000);
      });
    },
    set: async function (key, value) {
      // DEBUG: Removed verbose logs
      return new Promise((resolve) => {
        const id = Math.random().toString(36);

        const handler = (event) => {
          if (
            event.data.type === "PIXIV_TEMPLATER_STORAGE_SET_RESPONSE" &&
            event.data.id === id
          ) {
            window.removeEventListener("message", handler);
            // DEBUG: Removed verbose logs
            resolve(true);
          }
        };

        window.addEventListener("message", handler);

        // DEBUG: Removed verbose logs
        window.postMessage(
          {
            type: "PIXIV_TEMPLATER_STORAGE_SET",
            id: id,
            key: key,
            value: value,
          },
          "*",
        );

        // Timeout increased for slow connections
        setTimeout(() => {
          window.removeEventListener("message", handler);
          // Silent fallback - use localStorage without warning (expected behavior)
          try {
            localStorage.setItem("pixiv_templater_" + key, value);
          } catch (e) {
            console.error("[Templater] Storage set error:", e);
          }
          resolve(false);
        }, 3000);
      });
    },
  };

  // ============================
  // DEFAULT TEMPLATES
  // ============================

  const DEFAULT_TEMPLATES = {
    Demo: {
      title: "Example Title",
      caption: "This is an example caption.",
      tags: ["Example", "Pixiv", "Art"],
      ageRating: "general",
      adultContent: false,
      matureContent: [],
      aiGenerated: "notAiGenerated",
      allowTagEditing: true,
    },
    "Demo R-18": {
      title: "R-18 Example",
      caption: "Caption for adult content.",
      tags: ["R-18", "Ecchi"],
      ageRating: "r18",
      adultContent: false,
      matureContent: [],
      aiGenerated: "notAiGenerated",
      allowTagEditing: true,
    },
  };

  // ============================
  // DEFAULT SHORTCUTS
  // ============================

  const DEFAULT_SHORTCUTS = {
    togglePanel: "alt+shift+t",
    minimizePanel: "alt+shift+m",
    newTemplate: "alt+shift+n",
    exportTemplates: "alt+shift+e",
    importTemplates: "alt+shift+i",
    showHelp: "alt+shift+h",
    applyTemplate1: "alt+1",
    applyTemplate2: "alt+2",
    applyTemplate3: "alt+3",
    applyTemplate4: "alt+4",
    applyTemplate5: "alt+5",
    applyTemplate6: "alt+6",
    applyTemplate7: "alt+7",
    applyTemplate8: "alt+8",
    applyTemplate9: "alt+9",
  };

  // ============================
  // STORAGE HELPERS
  // ============================

  async function loadTemplates() {
    // DEBUG: Removed verbose logs
    const saved = await Storage.get("templates", null);
    const templates = saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
    return templates;
  }

  async function saveTemplates(templates) {
    await Storage.set("templates", JSON.stringify(templates));
  }

  // ============================
  // STATISTICS SYSTEM
  // STATS
  // ============================

  async function loadStats() {
    // DEBUG: Removed verbose logs
    const saved = await Storage.get("template_stats", null);
    const stats = saved ? JSON.parse(saved) : {};
    return stats;
  }

  async function saveStats(stats) {
    await Storage.set("template_stats", JSON.stringify(stats));
  }

  async function trackTemplateUsage(templateName) {
    // DEBUG: Removed verbose logs
    const stats = await loadStats();

    if (!stats[templateName]) {
      stats[templateName] = {
        count: 0,
        lastUsed: null,
      };
      // DEBUG: Removed verbose logs
    }

    stats[templateName].count++;
    stats[templateName].lastUsed = Date.now();

    // DEBUG: Removed verbose logs

    await saveStats(stats);
    // DEBUG: Removed verbose logs
  }

  function getTemplateStats(templateName) {
    const stats = loadStats();
    return stats[templateName] || { count: 0, firstUsed: null, lastUsed: null };
  }

  async function resetStats() {
    if (
      confirm(
        t("messages.confirmClearStatsWarning"),
      )
    ) {
      await Storage.set("template_stats", "{}");
      // DEBUG: Removed verbose logs
      alert(t("messages.statsCleared"));
      return true;
    }
    return false;
  }

  // ============================
  // SHORTCUTS CONFIGURATION
  // SHORTCUTS
  // ============================

  async function loadShortcuts() {
    // DEBUG: Removed verbose logs
    const saved = await Storage.get("shortcuts", null);
    const shortcuts = saved ? JSON.parse(saved) : { ...DEFAULT_SHORTCUTS };
    return shortcuts;
  }

  async function saveShortcuts(shortcuts) {
    await Storage.set("shortcuts", JSON.stringify(shortcuts));
  }

  // ============================
  // REACT HELPER FUNCTIONS
  // ============================

  function setReactInputValue(element, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    ).set;
    nativeInputValueSetter.call(element, value);

    const event = new Event("input", { bubbles: true });
    element.dispatchEvent(event);

    const changeEvent = new Event("change", { bubbles: true });
    element.dispatchEvent(changeEvent);
  }

  function setReactTextareaValue(element, value) {
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    ).set;
    nativeTextAreaValueSetter.call(element, value);

    const event = new Event("input", { bubbles: true });
    element.dispatchEvent(event);

    const changeEvent = new Event("change", { bubbles: true });
    element.dispatchEvent(changeEvent);
  }

  function clickReactRadio(element) {
    const label = element.closest("label");
    if (label) {
      label.click();
    } else {
      element.click();
    }
  }

  function clickReactCheckbox(element, shouldCheck) {
    if (element.checked === shouldCheck) {
      return;
    }

    const label = element.closest("label");
    if (label) {
      label.click();
    } else {
      element.click();
    }
  }

  // ============================
  // APPLY TEMPLATE
  // ============================

  async function applyTemplate(template) {
    // User action log - always shown
    log.user("Templater", "Applying template:", template);

    // 1. Title
    if (template.title !== undefined) {
      const titleInput = document.querySelector('input[name="title"]');
      if (titleInput) {
        setReactInputValue(titleInput, template.title);
        log.info("Templater", "✓ Title filled");
      }
    }

    // 2. Caption/Description
    if (template.caption !== undefined) {
      const captionTextarea = document.querySelector(
        'textarea[name="comment"]',
      );
      if (captionTextarea) {
        setReactTextareaValue(captionTextarea, template.caption);
        log.info("Templater", "✓ Caption filled");
      }
    }

    // 3. Age Rating (All ages / R-18 / R-18G)
    if (template.ageRating) {
      setTimeout(() => {
        const ageRatingRadio = document.querySelector(
          `input[name="x_restrict"][value="${template.ageRating}"]`,
        );
        if (ageRatingRadio) {
          clickReactRadio(ageRatingRadio);
          log.info("Templater", "✓ Age rating selected:", template.ageRating);

          setTimeout(() => {
            if (template.ageRating === "general") {
              const adultContentValue = template.adultContent
                ? "true"
                : "false";
              const adultContentRadio = document.querySelector(
                `input[name="sexual"][value="${adultContentValue}"]`,
              );
              if (adultContentRadio) {
                clickReactRadio(adultContentRadio);
                log.info(
                  "Templater",
                  "✓ Adult content set: " + adultContentValue,
                );
              }
            } else if (template.ageRating === "r18") {
              const matureContentTypes = ["lo", "furry", "bl", "yuri"];
              matureContentTypes.forEach((type) => {
                const checkbox = document.querySelector(
                  `input[name="${type}"]`,
                );
                if (checkbox) {
                  const shouldCheck = template.matureContent.includes(type);
                  clickReactCheckbox(checkbox, shouldCheck);
                }
              });
              log.info(
                "Templater",
                "✓ Mature content set:",
                template.matureContent,
              );
            }
          }, 300);
        }
      }, 200);
    }

    // 4. AI Generated
    if (template.aiGenerated) {
      setTimeout(() => {
        const aiRadio = document.querySelector(
          `input[name="ai_type"][value="${template.aiGenerated}"]`,
        );
        if (aiRadio) {
          clickReactRadio(aiRadio);
          log.info("Templater", "✓ AI-generated set:", template.aiGenerated);
        }
      }, 400);
    }

    // 5. Tags
    if (template.tags && template.tags.length > 0) {
      setTimeout(() => {
        log.info("Templater", "Adding tags:", template.tags);
        addTagsSequentially(template.tags, 0);
      }, 600);
    }
    log.user("Templater", "✓ Template applied successfully!");
  }

  function addTagsSequentially(tags, index) {
    if (index >= tags.length) {
      log.info("Templater", "✓ All tags added");
      return;
    }

    const tagName = tags[index];
    addTag(tagName);

    setTimeout(() => {
      addTagsSequentially(tags, index + 1);
    }, 400);
  }

  function addTag(tagName) {
    log.debug("Templater", "Looking for tag:", tagName);

    const tagButtons = document.querySelectorAll(
      'button[class*="gtm-"][class*="tag"]',
    );

    let found = false;
    tagButtons.forEach((button) => {
      if (button.dataset.templaterClicked === "true") {
        return;
      }

      if (button.offsetParent === null) {
        return;
      }

      const buttonText = button.textContent.trim();

      if (
        !found &&
        (buttonText === tagName ||
          buttonText.replace(/\s/g, "") === tagName.replace(/\s/g, "") ||
          buttonText.toLowerCase() === tagName.toLowerCase())
      ) {
        log.debug("Templater", "✓ Tag found, clicking:", buttonText);
        button.dataset.templaterClicked = "true";
        button.click();
        found = true;
      }
    });

    if (!found) {
      console.warn(
        "[Templater] ⚠ Tag not found in recommended buttons:",
        tagName,
      );
    }
  }

  // ============================
  // EXPORT/IMPORT TEMPLATES
  // IMPORT/EXPORT
  // ============================

  async function exportTemplates() {
    const templates = await loadTemplates();
    const json = JSON.stringify(templates, null, 2);

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pixiv-templates.json";
    a.click();
    URL.revokeObjectURL(url);

  }

  function importTemplates(file) {
    const reader = new FileReader();
    reader.onload = async function (event) {
      try {
        const imported = JSON.parse(event.target.result);

        if (typeof imported !== "object" || imported === null) {
          throw new Error("Invalid format");
        }

        const currentTemplates = await loadTemplates();
        let newCount = 0;
        let overwriteCount = 0;

        Object.keys(imported).forEach((name) => {
          if (currentTemplates[name]) {
            overwriteCount++;
          } else {
            newCount++;
          }
          currentTemplates[name] = imported[name];
        });

        await saveTemplates(currentTemplates);

        // Notify UI to re-render
        if (
          window.PixivTemplaterUI &&
          window.PixivTemplaterUI.renderTemplateList
        ) {
          window.PixivTemplaterUI.renderTemplateList();
        }

        alert(
          t("messages.importComplete") + "\n\n" +
          t("messages.importSuccessDetail", { newCount, updatedCount: overwriteCount })
        );

      } catch (error) {
        alert(t("messages.importErrorInvalid"));
        console.error("[Templater] Import error:", error);
      }
    };
    reader.readAsText(file);
  }

  // ============================
  // TAG TRANSLATION
  // ============================

  /**
   * Translate template tags using Danbooru API
   * @param {object} template - Template with tags array
   * @returns {Promise<object>} Template with translatedTags map added
   */
  async function translateTemplateTags(template) {
    if (!template.tags || template.tags.length === 0) {
      return { ...template, translatedTags: new Map() };
    }

    if (!window.PixivTagTranslator) {
      console.warn("[Templater] Tag translator not available");
      return { ...template, translatedTags: new Map() };
    }

    try {
      const translations = await window.PixivTagTranslator.translateTags(template.tags);
      return { ...template, translatedTags: translations };
    } catch (error) {
      console.error("[Templater] Failed to translate tags:", error);
      return { ...template, translatedTags: new Map() };
    }
  }

  /**
   * Get translations for an array of tags
   * @param {string[]} tags - Tags to translate
   * @returns {Promise<Map<string, Array<{name: string, prettyName: string, category: number}>>>}
   */
  async function getTagTranslations(tags) {
    if (!window.PixivTagTranslator) {
      console.warn("[Templater] Tag translator not available");
      return new Map();
    }

    try {
      return await window.PixivTagTranslator.translateTags(tags);
    } catch (error) {
      console.error("[Templater] Failed to translate tags:", error);
      return new Map();
    }
  }

  // ============================
  // EXPOSE PUBLIC API
  // ============================

  window.PixivTemplater = {
    // Storage
    Storage: Storage,

    // Templates
    DEFAULT_TEMPLATES: DEFAULT_TEMPLATES,
    loadTemplates: loadTemplates,
    saveTemplates: saveTemplates,
    applyTemplate: applyTemplate,
    exportTemplates: exportTemplates,
    importTemplates: importTemplates,

    // Statistics
    loadStats: loadStats,
    saveStats: saveStats,
    trackTemplateUsage: trackTemplateUsage,
    getTemplateStats: getTemplateStats,
    resetStats: resetStats,

    // Shortcuts
    DEFAULT_SHORTCUTS: DEFAULT_SHORTCUTS,
    loadShortcuts: loadShortcuts,
    saveShortcuts: saveShortcuts,

    // Tag Translation
    translateTemplateTags: translateTemplateTags,
    getTagTranslations: getTagTranslations,
  };

  // ============================
  // INITIALIZATION
  // ============================

  async function initialize() {
    // Silent - version already logged at module load

    // Wait for page to be ready
    const checkReady = setInterval(async () => {
      if ($('input[name="title"]').length > 0) {
        clearInterval(checkReady);

        // Initialize UI
        if (window.PixivTemplaterUI && window.PixivTemplaterUI.initialize) {
          await window.PixivTemplaterUI.initialize();
          // ESSENTIAL LOG - Always shown
          log.essential("Pixiv Templater", "UI initialized");
        } else {
          log.error("Pixiv Templater", "UI module not loaded!");
        }
        // DEBUG: Removed verbose log
      }
    }, 500);

    // Timeout after 30 seconds
    setTimeout(() => clearInterval(checkReady), 30000);
  }

  // Wait for jQuery and PageLogger to be available
  function waitForDependencies() {
    if (
      typeof $ !== "undefined" &&
      typeof window.PixivTemplaterUI !== "undefined" &&
      typeof window.PTLogger !== "undefined"
    ) {
      // Update log reference with the actual PageLogger
      Object.assign(log, window.PTLogger);
      $(document).ready(initialize);
    } else {
      setTimeout(waitForDependencies, 100);
    }
  }

  waitForDependencies();
})();
