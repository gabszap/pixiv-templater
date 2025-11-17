// Pixiv Templater - Extension Version
// Converted from userscript to browser extension
// Core logic and template application

(function () {
  "use strict";

  console.log("[Pixiv Templater] Initializing extension version...");

  // ============================
  // STORAGE WRAPPER (replaces GM_getValue/GM_setValue)
  // ============================

  const Storage = {
    get: function (key, defaultValue) {
      try {
        const value = localStorage.getItem("pixiv_templater_" + key);
        return value !== null ? value : defaultValue;
      } catch (e) {
        console.error("[Templater] Storage get error:", e);
        return defaultValue;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem("pixiv_templater_" + key, value);
      } catch (e) {
        console.error("[Templater] Storage set error:", e);
      }
    },
  };

  // ============================
  // DEFAULT TEMPLATES
  // ============================

  const DEFAULT_TEMPLATES = {
    "Genshin Impact": {
      title: "",
      caption: "Original character fan art\n#genshinimpact #fanart",
      tags: ["原神", "Genshin Impact", "fan art"],
      ageRating: "general",
      adultContent: true,
      matureContent: [],
      aiGenerated: "aiGenerated",
      allowTagEditing: true,
    },
    "Honkai Star Rail": {
      title: "",
      caption: "Fan art | Feel free to use with credit\n\nCommissions open!",
      tags: ["崩壊スターレイル", "Honkai Star Rail", "commission"],
      ageRating: "general",
      adultContent: false,
      matureContent: [],
      aiGenerated: "notAiGenerated",
      allowTagEditing: true,
    },
    "R-18 Default": {
      title: "",
      caption: "",
      tags: ["R-18"],
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
    togglePanel: "ctrl+shift+t",
    newTemplate: "ctrl+shift+n",
    exportTemplates: "ctrl+shift+e",
    importTemplates: "ctrl+shift+i",
    showHelp: "ctrl+shift+h",
    applyTemplate1: "ctrl+1",
    applyTemplate2: "ctrl+2",
    applyTemplate3: "ctrl+3",
    applyTemplate4: "ctrl+4",
    applyTemplate5: "ctrl+5",
    applyTemplate6: "ctrl+6",
    applyTemplate7: "ctrl+7",
    applyTemplate8: "ctrl+8",
    applyTemplate9: "ctrl+9",
  };

  // ============================
  // TEMPLATE MANAGEMENT
  // ============================

  function loadTemplates() {
    const saved = Storage.get("pixiv_templates", null);
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  }

  function saveTemplates(templates) {
    Storage.set("pixiv_templates", JSON.stringify(templates));
  }

  // ============================
  // STATISTICS SYSTEM
  // ============================

  function loadStats() {
    const saved = Storage.get("pixiv_template_stats", null);
    return saved ? JSON.parse(saved) : {};
  }

  function saveStats(stats) {
    Storage.set("pixiv_template_stats", JSON.stringify(stats));
  }

  function trackTemplateUsage(templateName) {
    const stats = loadStats();

    if (!stats[templateName]) {
      stats[templateName] = {
        count: 0,
        firstUsed: new Date().toISOString(),
        lastUsed: null,
      };
    }

    stats[templateName].count++;
    stats[templateName].lastUsed = new Date().toISOString();

    saveStats(stats);
    console.log(
      "[Templater] 📊 Template used:",
      templateName,
      "- Total:",
      stats[templateName].count,
    );
  }

  function getTemplateStats(templateName) {
    const stats = loadStats();
    return stats[templateName] || { count: 0, firstUsed: null, lastUsed: null };
  }

  function resetStats() {
    if (
      confirm(
        "⚠️ Tem certeza que deseja resetar todas as estatísticas?\n\nEsta ação não pode ser desfeita.",
      )
    ) {
      Storage.set("pixiv_template_stats", JSON.stringify({}));
      console.log("[Templater] 📊 Statistics reset");
      alert("✓ Estatísticas resetadas com sucesso!");
      return true;
    }
    return false;
  }

  // ============================
  // SHORTCUTS CONFIGURATION
  // ============================

  function loadShortcuts() {
    const saved = Storage.get("pixiv_shortcuts", null);
    return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
  }

  function saveShortcuts(shortcuts) {
    Storage.set("pixiv_shortcuts", JSON.stringify(shortcuts));
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

  function applyTemplate(template) {
    console.log("[Templater] Applying template:", template);

    // 1. Title
    if (template.title !== undefined) {
      const titleInput = document.querySelector('input[name="title"]');
      if (titleInput) {
        setReactInputValue(titleInput, template.title);
        console.log("[Templater] ✓ Title filled");
      }
    }

    // 2. Caption/Description
    if (template.caption !== undefined) {
      const captionTextarea = document.querySelector(
        'textarea[name="comment"]',
      );
      if (captionTextarea) {
        setReactTextareaValue(captionTextarea, template.caption);
        console.log("[Templater] ✓ Caption filled");
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
          console.log("[Templater] ✓ Age rating selected:", template.ageRating);

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
                console.log(
                  "[Templater] ✓ Adult content set:",
                  adultContentValue,
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
              console.log(
                "[Templater] ✓ Mature content set:",
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
          console.log("[Templater] ✓ AI-generated set:", template.aiGenerated);
        }
      }, 400);
    }

    // 5. Tags
    if (template.tags && template.tags.length > 0) {
      setTimeout(() => {
        console.log("[Templater] Adding tags:", template.tags);
        addTagsSequentially(template.tags, 0);
      }, 600);
    }

    console.log("[Templater] ✓ Template applied successfully!");
  }

  function addTagsSequentially(tags, index) {
    if (index >= tags.length) {
      console.log("[Templater] ✓ All tags added");
      return;
    }

    const tagName = tags[index];
    addTag(tagName);

    setTimeout(() => {
      addTagsSequentially(tags, index + 1);
    }, 400);
  }

  function addTag(tagName) {
    console.log("[Templater] Looking for tag:", tagName);

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
        console.log("[Templater] ✓ Tag found, clicking:", buttonText);
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
  // ============================

  function exportTemplates() {
    const templates = loadTemplates();
    const json = JSON.stringify(templates, null, 2);

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pixiv-templates.json";
    a.click();
    URL.revokeObjectURL(url);

    console.log("[Templater] Templates exported");
  }

  function importTemplates(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const importedTemplates = JSON.parse(event.target.result);

        if (
          typeof importedTemplates !== "object" ||
          importedTemplates === null
        ) {
          throw new Error("Invalid format");
        }

        const currentTemplates = loadTemplates();
        let newCount = 0;
        let overwriteCount = 0;

        Object.keys(importedTemplates).forEach((name) => {
          if (currentTemplates[name]) {
            overwriteCount++;
          } else {
            newCount++;
          }
          currentTemplates[name] = importedTemplates[name];
        });

        saveTemplates(currentTemplates);

        // Notify UI to re-render
        if (
          window.PixivTemplaterUI &&
          window.PixivTemplaterUI.renderTemplateList
        ) {
          window.PixivTemplaterUI.renderTemplateList();
        }

        alert(
          `✓ Importação concluída!\n\nNovos: ${newCount}\nSubstituídos: ${overwriteCount}`,
        );

        console.log("[Templater] Templates imported");
      } catch (error) {
        alert(
          "❌ Erro ao importar templates!\n\nVerifique se o arquivo JSON está correto.",
        );
        console.error("[Templater] Import error:", error);
      }
    };
    reader.readAsText(file);
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
  };

  // ============================
  // INITIALIZATION
  // ============================

  function initialize() {
    console.log("[Pixiv Templater] Initializing...");

    // Wait for page to be ready
    const checkReady = setInterval(() => {
      if ($('input[name="title"]').length > 0) {
        clearInterval(checkReady);

        // Initialize UI
        if (window.PixivTemplaterUI && window.PixivTemplaterUI.initialize) {
          window.PixivTemplaterUI.initialize();
          console.log("[Pixiv Templater] UI initialized");
        } else {
          console.error("[Pixiv Templater] UI module not loaded!");
        }

        console.log("[Pixiv Templater] Ready!");
      }
    }, 500);

    // Timeout after 30 seconds
    setTimeout(() => clearInterval(checkReady), 30000);
  }

  // Wait for jQuery to be available
  function waitForJQuery() {
    if (
      typeof $ !== "undefined" &&
      typeof window.PixivTemplaterUI !== "undefined"
    ) {
      $(document).ready(initialize);
    } else {
      setTimeout(waitForJQuery, 100);
    }
  }

  waitForJQuery();

  console.log("[Pixiv Templater] Extension loaded and ready!");
})();
