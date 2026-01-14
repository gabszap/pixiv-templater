// Pixiv Templater Dashboard Script

(function () {
  "use strict";

  // Storage wrapper with chrome/browser compatibility
  const Storage = {
    get: async function (key, defaultValue) {
      const fullKey = `pixiv_templater_${key}`;
      const result = await chrome.storage.local.get([fullKey]);
      const value = result[fullKey];
      console.log(
        `[Dashboard Storage] GET ${key}:`,
        value !== undefined ? "found" : "not found",
      );
      return value !== undefined ? value : defaultValue;
    },
    set: async function (key, value) {
      const fullKey = `pixiv_templater_${key}`;
      await chrome.storage.local.set({ [fullKey]: value });
      console.log(`[Dashboard Storage] SET ${key}`);
    },
    remove: async function (key) {
      const fullKey = `pixiv_templater_${key}`;
      await chrome.storage.local.remove([fullKey]);
      console.log(`[Dashboard Storage] REMOVE ${key}`);
    },
  };

  // State
  let currentTags = [];
  let editingTemplateName = null;
  let recordingInput = null;
  let currentShortcuts = {};

  // Default shortcuts
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

  /**
   * Translation helper - shorthand for i18n.t()
   */
  function t(key, params) {
    if (window.PixivTemplaterI18n) {
      return window.PixivTemplaterI18n.t(key, params);
    }
    return key; // Fallback to key if i18n not loaded
  }

  // Translate about steps preserving code tags
  function translateAboutSteps() {
    const step1 = document.getElementById("about-step1");
    const step4 = document.getElementById("about-step4");

    if (step1) {
      const text = t("about.step1");
      const parts = text.split("pixiv.net/illustration/create");
      step1.textContent = parts[0];
      if (parts.length > 1) {
        const code = document.createElement("code");
        code.textContent = "pixiv.net/illustration/create";
        step1.appendChild(code);
        step1.appendChild(document.createTextNode(parts[1]));
      }
    }

    if (step4) {
      const text = t("about.step4");
      const parts = text.split("ALT+Shift+T");
      step4.textContent = parts[0];
      if (parts.length > 1) {
        const code = document.createElement("code");
        code.textContent = "ALT+Shift+T";
        step4.appendChild(code);
        step4.appendChild(document.createTextNode(parts[1]));
      }
    }
  }

  // Load version from manifest
  async function loadVersion() {
    try {
      const manifest = chrome.runtime.getManifest();
      document.getElementById("header-version").textContent =
        "v" + manifest.version;
      document.getElementById("about-version").textContent =
        t("common.version") + " " + manifest.version;
    } catch (err) {
      console.error("Failed to load version:", err);
    }
  }

  // Migrate data from localStorage to chrome.storage (one-time migration)
  async function migrateFromLocalStorage() {
    // Verificar especificamente se já existem templates
    const templates = await Storage.get("templates", null);

    if (templates !== null) {
      console.log(
        "[Dashboard] Templates already exist in chrome.storage (even if empty), skipping initialization",
      );
      return;
    }

    console.log("[Dashboard] No templates found, initializing with defaults");

    // Initialize with default templates if empty
    const defaultTemplates = {
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
    await Storage.set("templates", JSON.stringify(defaultTemplates));
    console.log("[Dashboard] Default templates initialized");
  }

  // Initialize on page load
  $(document).ready(async function () {
    console.log("[Pixiv Templater Dashboard] Initializing...");

    // Initialize i18n system
    if (window.PixivTemplaterI18n) {
      await window.PixivTemplaterI18n.init();
      populateLanguageSelect();
      window.PixivTemplaterI18n.translatePage();
      translateAboutSteps();
      console.log("[Pixiv Templater Dashboard] i18n initialized: " + window.PixivTemplaterI18n.getCurrentLanguage());
    }

    // Load version
    await loadVersion();

    // Migrate from localStorage if needed
    await migrateFromLocalStorage();

    // Debug: Show what's in chrome.storage
    const allData = await chrome.storage.local.get(null);
    console.log(
      "[Dashboard] Storage keys:",
      Object.keys(allData).filter((k) => k.startsWith("pixiv_templater_")),
    );
    console.log("[Dashboard] Templates:", await Storage.get("templates", "{}"));
    console.log("[Dashboard] Stats:", await Storage.get("template_stats", "{}"));

    initializeTabs();
    setupEventHandlers();
    await loadTemplates();
    await loadShortcuts();
    await loadStats();
    await loadAdvancedSettings();

    // Check for AI translation warning
    checkAITranslationWarning();

    console.log("[Pixiv Templater Dashboard] Initialized successfully");
  });

  // ============================
  // AI TRANSLATION WARNING
  // ============================

  function checkAITranslationWarning() {
    if (!window.PixivTemplaterI18n) return;

    const currentLang = window.PixivTemplaterI18n.getCurrentLanguage();
    const aiLanguages = ["jp", "zh-cn"];

    if (aiLanguages.includes(currentLang)) {
      $("#warning-modal-message").text(t("messages.aiTranslationWarning"));
      $("#warning-modal").addClass("active");
    }
  }

  // ============================
  // TAB MANAGEMENT
  // ============================

  function initializeTabs() {
    $(".tab").on("click", function () {
      const tabName = $(this).data("tab");
      switchTab(tabName);
    });
  }

  function switchTab(tabName) {
    $(".tab").removeClass("active");
    $(`.tab[data-tab="${tabName}"]`).addClass("active");

    $(".tab-content").removeClass("active");
    $(`#${tabName}-tab`).addClass("active");

    // Reload data when switching to specific tabs
    if (tabName === "stats") {
      loadStats().catch((err) =>
        console.error("[Options] Error loading stats:", err),
      );
    } else if (tabName === "advanced") {
      loadAdvancedSettings().catch((err) =>
        console.error("[Options] Error loading advanced settings:", err),
      );
    }
  }

  // ============================
  // EVENT HANDLERS
  // ============================

  function setupEventHandlers() {
    // Header actions
    $("#export-all").on("click", () =>
      exportTemplates().catch((err) => console.error(err)),
    );
    $("#import-templates").on("click", () => $("#import-input").click());
    $("#import-input").on("change", (e) =>
      handleImportFile(e).catch((err) => console.error(err)),
    );

    // Template actions
    $("#new-template").on("click", handleNewTemplate);
    $("#empty-create-btn").on("click", handleNewTemplate);

    // Modal close
    $(".modal-close").on("click", closeModal);
    $("#modal-cancel").on("click", closeModal);
    $(".modal").on("click", function (e) {
      if (e.target === this) closeModal();
    });

    // Form submit
    $("#template-form").on("submit", (e) =>
      handleFormSubmit(e).catch((err) => console.error(err)),
    );

    // Tag input
    $("#tag-input").on("keydown", handleTagInput);
    $(document).on("click", ".tag-chip-remove", handleTagRemove);

    // Age rating change
    $("#template-age-rating").on("change", handleAgeRatingChange);

    // Emoji picker
    initEmojiPicker();

    // Emoji toggle
    $("#emoji-toggle-btn").on("click", handleEmojiToggle);

    // Shortcuts
    $("#reset-shortcuts").on("click", () =>
      handleResetShortcuts().catch((err) => console.error(err)),
    );
    $(document).on("focus", ".shortcut-input", handleShortcutInputFocus);
    $(document).on("blur", ".shortcut-input", handleShortcutInputBlur);
    $(document).on("keydown", ".shortcut-input", (e) =>
      handleShortcutRecording(e).catch((err) => console.error(err)),
    );

    // Stats
    $("#refresh-stats").on("click", () =>
      loadStats().catch((err) => console.error(err)),
    );
    $("#reset-stats").on("click", () =>
      handleResetStats().catch((err) => console.error(err)),
    );

    // Advanced settings
    $("#debug-mode-toggle").on("change", (e) =>
      handleDebugToggle(e).catch((err) => console.error(err)),
    );
    $("#auto-translate-toggle").on("change", (e) =>
      handleAutoTranslateToggle(e).catch((err) => console.error(err)),
    );
    $("#clear-all-data-btn").on("click", () =>
      handleClearAllData().catch((err) => console.error(err)),
    );

    // Settings (new)
    $("#language-select").on("change", handleLanguageChange);
    $("#advanced-settings-toggle").on("click", handleAdvancedToggle);

    // Warning Modal handlers
    $("#warning-modal-ok").on("click", closeWarningModal);
    $("#warning-modal-readme").on("click", () => {
      window.open("https://github.com/gabszap/pixiv-templater#contributing", "_blank");
    });
  }

  // ============================
  // EMOJI PICKER
  // ============================

  let emojiPicker = null;

  async function initEmojiPicker() {
    if (emojiPicker) return;

    try {
      const response = await fetch("../../libs/emoji-data.json");
      const data = await response.json();

      const currentLang = window.PixivTemplaterI18n?.getCurrentLanguage();
      const emojiLocaleMap = {
        "pt-br": "pt",
        "jp": "ja",
        "zh-cn": "zh",
        "en": "en"
      };

      const pickerOptions = {
        data: data,
        onEmojiSelect: (emoji) => {
          selectEmoji(emoji.native);
        },
        locale: emojiLocaleMap[currentLang] || "en",
        theme: "auto",
        previewPosition: "none",
        skinTonePosition: "none",
        searchPosition: "top",
        emojiSize: 24,
      };

      emojiPicker = new EmojiMart.Picker(pickerOptions);
      const container = document.getElementById("emoji-picker-container");
      if (container) {
        container.textContent = "";
        container.appendChild(emojiPicker);
      }
    } catch (error) {
      console.error("Failed to load emoji picker:", error);
      const container = document.getElementById("emoji-picker-container");
      if (container) {
        container.textContent = "";
        const span = document.createElement("span");
        span.style.color = "#ef4444";
        span.textContent = t("messages.errorLoadingEmojis");
        container.appendChild(span);
      }
    }
  }

  function selectEmoji(emoji) {
    $("#template-emoji").val(emoji);
    $("#emoji-preview").text(emoji);
  }

  function handleEmojiToggle() {
    const $container = $("#emoji-selector-container");
    const $button = $("#emoji-toggle-btn");

    $container.toggleClass("collapsed");
    $button.toggleClass("collapsed");
  }

  // ============================
  // TEMPLATES MANAGEMENT
  // ============================

  async function loadTemplates() {
    const templatesJson = await Storage.get("templates", "{}");
    console.log("[Options] Loading templates, raw JSON:", templatesJson);

    let templates;
    try {
      templates = JSON.parse(templatesJson);
    } catch (e) {
      console.error("[Options] Failed to parse templates:", e);
      templates = {};
    }

    const stats = await loadStatsData();
    const $list = $("#templates-list");

    $list.empty();

    console.log(
      "[Options] Parsed templates:",
      Object.keys(templates).length,
      "templates",
    );

    if (Object.keys(templates).length === 0) {
      $("#empty-state").show();
      return;
    }

    $("#empty-state").hide();

    Object.keys(templates).forEach((name) => {
      const template = templates[name];
      const stat = stats[name];
      const useCount = stat ? stat.count : 0;
      let icon = template.emoji || "📝";

      const ageRatingLabels = {
        general: t("form.ageRatingGeneral"),
        r18: t("form.ageRatingR18"),
        r18g: t("form.ageRatingR18G"),
      };

      // Get locale for date formatting
      const currentLang = window.PixivTemplaterI18n?.getCurrentLanguage();
      const dateLocaleMap = {
        "pt-br": "pt-BR",
        "jp": "ja-JP",
        "zh-cn": "zh-CN",
        "en": "en-US"
      };
      const dateLocale = dateLocaleMap[currentLang] || "en-US";

      const dateOptions = {
        day: "2-digit",
        month: "2-digit",
        year: (currentLang === "jp" || currentLang === "zh-cn") ? "numeric" : "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: currentLang === "en"
      };

      const $card = $(`
        <div class="template-card" data-template-name="${name}">
          <div class="template-card-header">
            <div class="template-card-title">${icon} ${name}</div>
            <div class="template-card-actions">
              <button class="template-action preview" title="${t("preview.title")}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="template-action edit" title="${t("modal.editTemplate")}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
              </button>
              <button class="template-action delete" title="${t("dashboard.deleteSelected")}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-icon lucide-trash"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          <div class="template-card-info">
            <div>${ageRatingLabels[template.ageRating] || t("modal.ageRatingGeneral")}</div>
            <div>${t("common.tagsCount", { count: template.tags.length })}</div>
          </div>
          <div class="template-card-tags">
            ${template.tags
          .slice(0, 5)
          .map((tag) => `<span class="template-tag">${tag}</span>`)
          .join("")}
            ${template.tags.length > 5 ? `<span class="template-tag">+${template.tags.length - 5}</span>` : ""}
          </div>
          <div class="template-meta">
            <div class="meta-row" title="${t("preview.createdAt")}">
              <span class="meta-label">${t("preview.createdAt")}</span>
              <span class="meta-value">${template.createdAt
          ? new Date(template.createdAt).toLocaleString(dateLocale, dateOptions)
          : t("preview.createdAtNone")
        }</span>
            </div>
            <div class="meta-row" title="${t("preview.updatedAt")}">
              <span class="meta-label">${t("preview.updatedAt")}</span>
              <span class="meta-value">${template.updatedAt
          ? new Date(template.updatedAt).toLocaleString(dateLocale, dateOptions)
          : t("preview.updatedAtNone")
        }</span>
            </div>
            ${useCount > 0 ? `<div class="use-count">${useCount}× ${t("preview.usedCount")}</div>` : ""}
          </div>
        </div>
      `);

      // Event handlers
      $card.find(".preview").on("click", (e) => {
        e.stopPropagation();
        showPreview(name, template);
      });

      $card.find(".edit").on("click", (e) => {
        e.stopPropagation();
        editTemplate(name, template);
      });

      $card.find(".delete").on("click", async (e) => {
        e.stopPropagation();
        await deleteTemplate(name);
      });

      $list.append($card);
    });
  }

  function handleNewTemplate() {
    editingTemplateName = null;
    currentTags = [];
    $("#modal-title").text(t("modal.newTemplate"));
    $("#template-form")[0].reset();
    renderTags();
    $("#template-emoji").val("📝");
    $("#emoji-preview").text("📝");
    $("#template-age-rating").trigger("change");
    openModal();
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    const name = $("#template-name").val().trim();
    if (!name) {
      alert(t("validation.templateNameRequired"));
      return;
    }

    if (currentTags.length === 0) {
      alert(t("validation.atLeastOneTag"));
      $("#tag-input").focus();
      return;
    }

    const templatesJson = await Storage.get("templates", "{}");
    const templates = JSON.parse(templatesJson);

    if (!editingTemplateName && templates[name]) {
      if (
        !confirm(t("validation.templateExists", { name: name }))
      ) {
        return;
      }
    }

    if (editingTemplateName && editingTemplateName !== name) {
      delete templates[editingTemplateName];
    }

    const ageRating = $("#template-age-rating").val();
    const matureContent = [];

    if (ageRating === "r18" || ageRating === "r18g") {
      $("#mature-content-group input:checked").each(function () {
        matureContent.push($(this).val());
      });
    }

    const now = new Date().toISOString();
    templates[name] = {
      title: $("#template-title").val().trim(),
      caption: $("#template-caption").val().trim(),
      tags: currentTags,
      ageRating: ageRating,
      adultContent: $("#template-adult-content").is(":checked"),
      matureContent: matureContent,
      aiGenerated: $("#template-ai-generated").val(),
      emoji: $("#template-emoji").val() || "📝",
      allowTagEditing: true,
      createdAt:
        editingTemplateName && templates[editingTemplateName]?.createdAt
          ? templates[editingTemplateName].createdAt
          : now,
      updatedAt: now,
    };

    await Storage.set("templates", JSON.stringify(templates));
    await loadTemplates();
    closeModal();

    console.log("[Options] Template saved:", name);
  }

  function editTemplate(name, template) {
    editingTemplateName = name;
    currentTags = [...template.tags];

    $("#modal-title").text(t("modal.editTemplate"));
    $("#template-name").val(name);
    $("#template-title").val(template.title || "");
    $("#template-caption").val(template.caption || "");
    $("#template-age-rating").val(template.ageRating || "general");
    $("#template-adult-content").prop(
      "checked",
      template.adultContent || false,
    );
    $("#template-ai-generated").val(template.aiGenerated || "notAiGenerated");

    const emoji = template.emoji || "📝";
    $("#template-emoji").val(emoji);
    $("#emoji-preview").text(emoji);

    $("#mature-content-group input").prop("checked", false);
    if (template.matureContent) {
      template.matureContent.forEach((content) => {
        $(`#mature-content-group input[value="${content}"]`).prop(
          "checked",
          true,
        );
      });
    }

    renderTags();
    $("#template-age-rating").trigger("change");
    openModal();
  }

  async function deleteTemplate(name) {
    if (!confirm(t("messages.confirmDeleteTemplate", { name: name }))) {
      return;
    }

    const templatesJson = await Storage.get("templates", "{}");
    const templates = JSON.parse(templatesJson);
    delete templates[name];
    await Storage.set("templates", JSON.stringify(templates));

    await loadTemplates();
    console.log("[Options] Template deleted:", name);
  }

  function showPreview(name, template) {
    $("#preview-title").text(t("preview.title", { name: name }));
    const $container = $("#preview-body-content");
    $container.empty();

    function createSection(title, content) {
      const $section = $('<div class="preview-section"></div>');
      const $h3 = $("<h3></h3>").text(title);
      const $content = $('<div class="preview-content"></div>');

      if (content) {
        $content.text(content);
      } else {
        $content.append($('<span class="preview-empty"></span>').text(`(${t("common.empty")})`));
      }

      $section.append($h3).append($content);
      return $section;
    }

    // Title Section
    $container.append(createSection(`📄 ${t("common.title")}`, template.title));

    // Description Section
    $container.append(createSection(`📝 ${t("common.description")}`, template.caption));

    // Tags Section
    const $tagsContainer = $('<div class="preview-tags"></div>');
    if (template.tags && template.tags.length > 0) {
      template.tags.forEach((tag) => {
        $tagsContainer.append($('<span class="preview-tag"></span>').text(tag));
      });
    } else {
      $tagsContainer.append($('<span class="preview-empty"></span>').text(`(${t("preview.noTags")})`));
    }
    const $tagsSection = $('<div class="preview-section"></div>');
    $tagsSection.append($("<h3></h3>").text(`🏷️ ${t("common.tags")}`));
    $tagsSection.append($tagsContainer);
    $container.append($tagsSection);

    // Settings Section
    const ageRatingLabels = {
      general: t("form.ageRatingGeneral"),
      r18: t("form.ageRatingR18"),
      r18g: t("form.ageRatingR18G"),
    };

    const $config = $('<div class="preview-config"></div>');

    function addConfigItem(label, value) {
      const $item = $('<div class="preview-config-item"></div>');
      $item.append($('<span class="preview-config-label"></span>').text(`${label}:`));
      $item.append($('<span class="preview-config-value"></span>').text(value));
      $config.append($item);
    }

    addConfigItem(t("common.rating"), ageRatingLabels[template.ageRating] || t("modal.ageRatingGeneral"));

    if (template.ageRating === "general") {
      addConfigItem(t("common.adultContent"), template.adultContent ? t("preview.adultContentYes") : t("preview.adultContentNo"));
    }

    if (template.ageRating === "r18" && template.matureContent && template.matureContent.length > 0) {
      const labels = {
        lo: t("form.minors"),
        furry: t("form.furry"),
        bl: t("form.bl"),
        yuri: t("form.gl"),
      };
      const items = template.matureContent.map((c) => labels[c] || c).join(", ");
      addConfigItem(t("common.sensitiveContent"), items);
    }

    const aiGeneratedText = template.aiGenerated === "aiGenerated" ? t("preview.yes") : t("preview.no");
    addConfigItem(t("common.aiGenerated"), aiGeneratedText);

    const $settingsSection = $('<div class="preview-section"></div>');
    $settingsSection.append($("<h3></h3>").text(`⚙️ ${t("common.settings")}`));
    $settingsSection.append($config);
    $container.append($settingsSection);

    openPreviewModal();
  }

  // ============================
  // TAG MANAGEMENT
  // ============================

  function handleTagInput(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = $(this).val().trim();
      if (tag && !currentTags.includes(tag)) {
        currentTags.push(tag);
        renderTags();
        $(this).val("");
      }
    }
  }

  function handleTagRemove() {
    const index = $(this).data("index");
    currentTags.splice(index, 1);
    renderTags();
  }

  function renderTags() {
    const $container = $("#tag-container");
    const $input = $("#tag-input");

    // Ensure wrapper exists
    let $wrapper = $container.find(".tag-chips-wrapper");
    if ($wrapper.length === 0) {
      $wrapper = $('<div class="tag-chips-wrapper"></div>');
      $container.prepend($wrapper);
    }

    // Clear existing chips
    $wrapper.empty();

    currentTags.forEach((tag, index) => {
      const $chip = $(`
      <span class="tag-chip">
        ${tag}
        <span class="tag-chip-remove" data-index="${index}">×</span>
      </span>
    `);
      $wrapper.append($chip);
    });
  }

  function handleAgeRatingChange() {
    const value = $(this).val();
    if (value === "general") {
      $("#adult-content-group").show();
      $("#mature-content-group").hide();
    } else if (value === "r18" || value === "r18g") {
      $("#adult-content-group").hide();
      $("#mature-content-group").show();
    }
  }

  // ============================
  // IMPORT/EXPORT
  // ============================

  async function exportTemplates() {
    const templatesJson = await Storage.get("templates", "{}");
    const templates = JSON.parse(templatesJson);

    if (Object.keys(templates).length === 0) {
      alert(t("messages.noTemplatesToExport"));
      return;
    }

    const dataStr = JSON.stringify(templates, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pixiv_templates_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    console.log("[Options] Templates exported");
  }

  async function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        const templatesJson = await Storage.get("templates", "{}");
        const existing = JSON.parse(templatesJson);

        let newCount = 0;
        let updatedCount = 0;

        Object.keys(imported).forEach((name) => {
          if (existing[name]) {
            updatedCount++;
          } else {
            newCount++;
          }
          existing[name] = imported[name];
        });

        await Storage.set("templates", JSON.stringify(existing));
        await loadTemplates();

        alert(
          t("messages.importComplete") + "\n\n" +
          t("messages.importSuccessDetail", { newCount, updatedCount: updatedCount })
        );

        console.log("[Options] Templates imported:", {
          newCount,
          updatedCount,
        });
      } catch (error) {
        alert(t("messages.importErrorInvalid"));
        console.error("[Options] Import error:", error);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ============================
  // SHORTCUTS MANAGEMENT
  // ============================

  async function loadShortcuts() {
    const shortcutsJson = await Storage.get("shortcuts", "{}");
    currentShortcuts = JSON.parse(shortcutsJson);

    // Merge with defaults
    Object.keys(DEFAULT_SHORTCUTS).forEach((key) => {
      if (!currentShortcuts[key]) {
        currentShortcuts[key] = DEFAULT_SHORTCUTS[key];
      }
    });

    // Update UI
    $(".shortcut-input").each(function () {
      const action = $(this).data("action");
      if (currentShortcuts[action]) {
        $(this).val(currentShortcuts[action].toUpperCase().replace(/\+/g, "+"));
      }
    });
  }

  function handleShortcutInputFocus() {
    recordingInput = $(this);
    $(this).addClass("recording");
    $(this).val(t("shortcuts.pressKeys"));
  }

  function handleShortcutInputBlur() {
    $(this).removeClass("recording");
    if ($(this).val() === t("shortcuts.pressKeys")) {
      const action = $(this).data("action");
      $(this).val(currentShortcuts[action].toUpperCase().replace(/\+/g, "+"));
    }
  }

  async function handleShortcutRecording(e) {
    if (!recordingInput || !recordingInput.hasClass("recording")) return;

    e.preventDefault();

    if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;

    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
    if (e.shiftKey) parts.push("Shift");
    if (e.altKey) parts.push("Alt");
    parts.push(e.key.toUpperCase());

    const shortcut = parts.join("+");
    recordingInput.val(shortcut);

    const action = recordingInput.data("action");
    currentShortcuts[action] = shortcut.toLowerCase();

    await Storage.set("shortcuts", JSON.stringify(currentShortcuts));

    recordingInput.blur();
    recordingInput = null;

    console.log("[Options] Shortcut updated:", action, "=>", shortcut);
  }

  async function handleResetShortcuts() {
    if (!confirm(t("messages.confirmResetShortcuts"))) return;

    currentShortcuts = { ...DEFAULT_SHORTCUTS };
    await Storage.set("shortcuts", JSON.stringify(currentShortcuts));

    $(".shortcut-input").each(function () {
      const action = $(this).data("action");
      $(this).val(currentShortcuts[action].toUpperCase().replace(/\+/g, "+"));
    });

    alert(t("messages.shortcutsReset"));
    console.log("[Options] Shortcuts reset to default");
  }

  // ============================
  // STATS MANAGEMENT
  // ============================

  async function loadStatsData() {
    const statsJson = await Storage.get("template_stats", "{}");
    try {
      return JSON.parse(statsJson);
    } catch (e) {
      console.error("[Options] Failed to parse stats:", e);
      return {};
    }
  }

  async function loadStats() {
    console.log("[Options] Loading stats...");
    const stats = await loadStatsData();
    const templatesJson = await Storage.get("templates", "{}");
    let templates;
    try {
      templates = JSON.parse(templatesJson);
    } catch (e) {
      console.error("[Options] Failed to parse templates for stats:", e);
      templates = {};
    }
    const templateNames = Object.keys(templates);

    console.log("[Options] Stats data:", stats);
    console.log("[Options] Templates:", Object.keys(templates));

    let totalUses = 0;
    let templatesUsed = 0;
    const statsArray = [];

    templateNames.forEach((name) => {
      const stat = stats[name];
      if (stat && stat.count > 0) {
        totalUses += stat.count;
        templatesUsed++;
        statsArray.push({ name, ...stat });
      }
    });

    if (statsArray.length === 0) {
      $("#stats-summary").hide();
      $("#stats-list").hide();
      $("#stats-empty").show();
      return;
    }

    $("#stats-empty").hide();
    $("#stats-summary").show();
    $("#stats-list").show();

    // Summary
    const avgUses =
      templatesUsed > 0 ? (totalUses / templatesUsed).toFixed(1) : 0;
    $("#stats-summary").html(`
      <div class="stat-card" style="background: linear-gradient(135deg, #0096fa 0%, #00d4ff 100%);">
        <div class="stat-number">${totalUses}</div>
        <div class="stat-label">${t("stats.totalUses")}</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);">
        <div class="stat-number">${templatesUsed}</div>
        <div class="stat-label">${t("stats.templatesUsed")}</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);">
        <div class="stat-number">${avgUses}</div>
        <div class="stat-label">${t("stats.averageUses")}</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%);">
        <div class="stat-number">${templateNames.length}</div>
        <div class="stat-label">${t("stats.totalTemplates")}</div>
      </div>
    `);

    // Sort by usage
    statsArray.sort((a, b) => b.count - a.count);

    // List
    const $list = $("#stats-list");
    $list.empty();

    const maxCount = statsArray.length > 0 ? statsArray[0].count : 1;

    statsArray.forEach((stat, index) => {
      const rank =
        index === 0
          ? "🥇"
          : index === 1
            ? "🥈"
            : index === 2
              ? "🥉"
              : `#${index + 1}`;

      const localeCode = window.PixivTemplaterI18n?.getCurrentLanguage() === "pt-br" ? "pt-BR" : "en-US";
      const lastUsed = stat.lastUsed
        ? new Date(stat.lastUsed).toLocaleString(localeCode, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        : t("stats.never");

      const percentage = Math.min(
        100,
        Math.max(5, (stat.count / maxCount) * 100),
      );

      $list.append(`
        <div class="stat-item">
          <div class="stat-progress-bar" style="width: ${percentage}%"></div>
          <div class="stat-item-left">
            <div class="stat-rank">${rank}</div>
            <div>
              <div class="stat-name">${stat.name}</div>
              <div class="stat-details">${t("common.lastUsed")}: ${lastUsed}</div>
            </div>
          </div>
          <div class="stat-count">${stat.count}</div>
        </div>
      `);
    });
  }

  async function handleResetStats() {
    if (
      !confirm(t("messages.confirmClearStatsWarning"))
    ) {
      return;
    }

    await Storage.set("template_stats", "{}");
    await loadStats();
    alert(t("messages.statsCleared"));
    console.log("[Options] Stats reset");
  }

  // ============================
  // MODAL MANAGEMENT
  // ============================

  function openModal() {
    $("#template-modal").addClass("active");
  }

  function openPreviewModal() {
    $("#preview-modal").addClass("active");
  }

  function closeModal() {
    $(".modal").removeClass("active");
    currentTags = [];
    editingTemplateName = null;
  }

  function closeWarningModal() {
    $("#warning-modal").removeClass("active");
  }

  // ============================
  // ADVANCED TAB MANAGEMENT
  // ============================

  async function loadAdvancedSettings() {
    // Load debug mode status
    const debugMode = await Storage.get("debug_mode", false);
    $("#debug-mode-toggle").prop("checked", debugMode);
    updateDebugStatus(debugMode);

    // Load auto-translate tags status
    const autoTranslate = await Storage.get("auto_translate_tags", true);
    $("#auto-translate-toggle").prop("checked", autoTranslate);
    updateAutoTranslateStatus(autoTranslate);

    // Load language status
    if (window.PixivTemplaterI18n) {
      const langSetting = await window.PixivTemplaterI18n.getLanguageSetting();
      $("#language-select").val(langSetting);
    }

    // Load storage info
    await updateStorageInfo();
  }

  function populateLanguageSelect() {
    if (!window.PixivTemplaterI18n) return;

    const $select = $("#language-select");
    const languages = window.PixivTemplaterI18n.getLanguageNames();

    // Keep "auto" option
    const $autoOption = $select.find('option[value="auto"]');
    $select.empty().append($autoOption);

    Object.keys(languages).forEach(code => {
      const name = languages[code];
      const $option = $("<option></option>")
        .val(code)
        .text(name)
        .attr("data-i18n", `advanced.${code}`); // Optional: in case we want to translate the language name itself
      $select.append($option);
    });
  }

  async function handleLanguageChange() {
    const lang = $("#language-select").val();
    if (window.PixivTemplaterI18n) {
      await window.PixivTemplaterI18n.setLanguage(lang);

      // Re-translate page elements
      window.PixivTemplaterI18n.translatePage();

      // Refresh dynamic content
      translateAboutSteps();
      loadVersion();
      loadTemplates();
      loadStats();
      loadShortcuts();
      updateDebugStatus($("#debug-mode-toggle").is(":checked"));

      console.log(`[Dashboard] Language changed to: ${lang}`);

      // Check for AI translation warning after change
      checkAITranslationWarning();
    }
  }

  function handleAdvancedToggle() {
    const $container = $("#advanced-content-body");
    const $button = $("#advanced-toggle-btn");

    $container.toggleClass("collapsed");
    $button.toggleClass("collapsed");
  }

  function updateDebugStatus(enabled) {
    const statusText = enabled ? t("advanced.enabled") : t("advanced.disabled");
    const statusColor = enabled
      ? "var(--success-color)"
      : "var(--text-secondary)";
    $("#debug-status").text(statusText).css("color", statusColor);
  }

  async function handleDebugToggle(e) {
    const enabled = $(e.target).is(":checked");
    await Storage.set("debug_mode", enabled);
    updateDebugStatus(enabled);

    // Notify the logger if available
    if (window.PixivTemplaterLogger) {
      await window.PixivTemplaterLogger.setDebugMode(enabled);
    }

    console.log(`[Options] Debug mode ${enabled ? "ENABLED" : "DISABLED"}`);

    // Show notification
    alert(
      enabled
        ? t("messages.debugEnabled")
        : t("messages.debugDisabled"),
    );
  }

  function updateAutoTranslateStatus(enabled) {
    const statusText = enabled ? t("advanced.enabled") : t("advanced.disabled");
    const statusColor = enabled
      ? "var(--success-color)"
      : "var(--text-secondary)";
    $("#auto-translate-status").text(statusText).css("color", statusColor);
  }

  async function handleAutoTranslateToggle(e) {
    const enabled = $(e.target).is(":checked");
    await Storage.set("auto_translate_tags", enabled);
    updateAutoTranslateStatus(enabled);
    console.log(`[Options] Auto-translate tags ${enabled ? "ENABLED" : "DISABLED"}`);
  }

  async function handleClearAllData() {
    const confirmation = prompt(t("messages.confirmClearAllDataFull"));

    const expectedConfirmation = t("common.deleteConfirm");
    if (confirmation !== expectedConfirmation && confirmation !== "DELETE") {
      if (confirmation !== null) {
        alert(t("messages.actionCancelled"));
      }
      return;
    }

    try {
      // Get all keys
      const allData = await chrome.storage.local.get(null);
      const keysToRemove = Object.keys(allData).filter((k) =>
        k.startsWith("pixiv_templater_"),
      );

      // Remove all data
      await chrome.storage.local.remove(keysToRemove);

      // Explicitly set templates to empty object string so it stays empty on next load
      // rather than being null and triggering default initialization
      await chrome.storage.local.set({ pixiv_templater_templates: "{}" });

      console.log(
        "[Options] All data cleared:",
        keysToRemove.length,
        "keys removed",
      );

      alert(t("messages.allDataCleared"));

      // Reload page
      location.reload();
    } catch (err) {
      console.error("[Options] Error clearing data:", err);
      alert("❌ " + t("messages.errorClearingData") + err.message);
    }
  }

  async function updateStorageInfo() {
    try {
      const templates = await Storage.get("templates", "{}");
      const stats = await Storage.get("template_stats", "{}");
      const shortcuts = await Storage.get("shortcuts", "{}");

      const templatesSize = new Blob([templates]).size;
      const statsSize = new Blob([stats]).size;
      const totalSize = templatesSize + statsSize + new Blob([shortcuts]).size;

      const formatBytes = (bytes) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
          Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
        );
      };

      $("#storage-templates").text(formatBytes(templatesSize));
      $("#storage-stats").text(formatBytes(statsSize));
      $("#storage-total").text(formatBytes(totalSize));
    } catch (err) {
      console.error("[Options] Error loading storage info:", err);
      $("#storage-templates").text(t("messages.importError"));
      $("#storage-stats").text(t("messages.importError"));
      $("#storage-total").text(t("messages.importError"));
    }
  }
})();
