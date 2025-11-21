// Pixiv Templater Options Page Script

(function () {
  "use strict";

  // Storage wrapper with chrome/browser compatibility
  const Storage = {
    get: async function (key, defaultValue) {
      const fullKey = `pixiv_templater_${key}`;
      const result = await chrome.storage.local.get([fullKey]);
      const value = result[fullKey];
      console.log(
        `[Options Storage] GET ${key}:`,
        value !== undefined ? "found" : "not found",
      );
      return value !== undefined ? value : defaultValue;
    },
    set: async function (key, value) {
      const fullKey = `pixiv_templater_${key}`;
      await chrome.storage.local.set({ [fullKey]: value });
      console.log(`[Options Storage] SET ${key}`);
    },
    remove: async function (key) {
      const fullKey = `pixiv_templater_${key}`;
      await chrome.storage.local.remove([fullKey]);
      console.log(`[Options Storage] REMOVE ${key}`);
    },
  };

  // State
  let currentTags = [];
  let editingTemplateName = null;
  let recordingInput = null;
  let currentShortcuts = {};

  // Default shortcuts
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

  // Load version from manifest
  async function loadVersion() {
    try {
      const manifest = chrome.runtime.getManifest();
      document.getElementById("header-version").textContent =
        "v" + manifest.version;
      document.getElementById("about-version").textContent =
        "Versão " + manifest.version;
    } catch (err) {
      console.error("Failed to load version:", err);
    }
  }

  // Migrate data from localStorage to chrome.storage (one-time migration)
  async function migrateFromLocalStorage() {
    const allData = await chrome.storage.local.get(null);
    const hasData = Object.keys(allData).some((k) =>
      k.startsWith("pixiv_templater_"),
    );

    if (hasData) {
      console.log(
        "[Options] Data already in chrome.storage, skipping migration",
      );
      return;
    }

    console.log("[Options] Attempting to migrate from localStorage...");

    // Check if we can inject a script to read localStorage from pixiv.net
    // Since we can't directly access localStorage from another domain,
    // we'll just ensure chrome.storage is the source of truth

    // Initialize with default templates if empty
    const templates = await Storage.get("templates", "{}");
    if (templates === "{}") {
      console.log("[Options] No templates found, initializing with defaults");
      const defaultTemplates = {
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
          caption:
            "Fan art | Feel free to use with credit\n\nCommissions open!",
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
      await Storage.set("templates", JSON.stringify(defaultTemplates));
      console.log("[Options] Default templates initialized");
    }
  }

  // Initialize on page load
  $(document).ready(async function () {
    console.log("[Pixiv Templater Options] Initializing...");

    // Load version
    await loadVersion();

    // Migrate from localStorage if needed
    await migrateFromLocalStorage();

    // Debug: Show what's in chrome.storage
    const allData = await chrome.storage.local.get(null);
    console.log(
      "[Options] Storage keys:",
      Object.keys(allData).filter((k) => k.startsWith("pixiv_templater_")),
    );
    console.log("[Options] Templates:", await Storage.get("templates", "{}"));
    console.log("[Options] Stats:", await Storage.get("template_stats", "{}"));

    initializeTabs();
    setupEventHandlers();
    await loadTemplates();
    await loadShortcuts();
    await loadStats();
    await loadAdvancedSettings();
    console.log("[Pixiv Templater Options] Initialized successfully");
  });

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
    $("#clear-all-data-btn").on("click", () =>
      handleClearAllData().catch((err) => console.error(err)),
    );
  }

  // ============================
  // EMOJI PICKER
  // ============================

  let emojiPicker = null;

  async function initEmojiPicker() {
    if (emojiPicker) return;

    try {
      const response = await fetch("../libs/emoji-data.json");
      const data = await response.json();

      const pickerOptions = {
        data: data,
        onEmojiSelect: (emoji) => {
          selectEmoji(emoji.native);
        },
        locale: "pt",
        theme: "auto",
        previewPosition: "none",
        skinTonePosition: "none",
        searchPosition: "top",
        emojiSize: 24,
      };

      emojiPicker = new EmojiMart.Picker(pickerOptions);
      const container = document.getElementById("emoji-picker-container");
      if (container) {
        container.innerHTML = "";
        container.appendChild(emojiPicker);
      }
    } catch (error) {
      console.error("Failed to load emoji picker:", error);
      const container = document.getElementById("emoji-picker-container");
      if (container) {
        container.innerHTML =
          '<span style="color: #ef4444;">Erro ao carregar emojis</span>';
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
      if (!template.emoji) {
        if (name.includes("R-18")) icon = "🔞";
        else if (name.includes("Genshin")) icon = "⚔️";
        else if (name.includes("Honkai")) icon = "🚂";
        else if (name.includes("Star Rail")) icon = "🌟";
      }

      const ageRatingLabels = {
        general: "All ages",
        r18: "R-18",
        r18g: "R-18G",
      };

      const $card = $(`
        <div class="template-card" data-template-name="${name}">
          <div class="template-card-header">
            <div class="template-card-title">${icon} ${name}</div>
            <div class="template-card-actions">
              <button class="template-action preview" title="Visualizar">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="template-action edit" title="Editar">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
              </button>
              <button class="template-action delete" title="Excluir">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-icon lucide-trash"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          <div class="template-card-info">
            <div>${ageRatingLabels[template.ageRating] || "All ages"}</div>
            <div>${template.tags.length} tag(s)</div>
          </div>
          <div class="template-card-tags">
            ${template.tags
          .slice(0, 5)
          .map((tag) => `<span class="template-tag">${tag}</span>`)
          .join("")}
            ${template.tags.length > 5 ? `<span class="template-tag">+${template.tags.length - 5}</span>` : ""}
          </div>
          <div class="template-meta">
            <span title="Data de criação">${template.createdAt
          ? "Data de criação: " +
          new Date(template.createdAt).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
          : "Data de criação: None"
        }</span>
            ${useCount > 0 ? `<span class="use-count">${useCount}× usado</span>` : ""}
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
    $("#modal-title").text("Novo Template");
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
      alert("Nome do template é obrigatório!");
      return;
    }

    if (currentTags.length === 0) {
      alert("Adicione pelo menos 1 tag ao template!");
      $("#tag-input").focus();
      return;
    }

    const templatesJson = await Storage.get("templates", "{}");
    const templates = JSON.parse(templatesJson);

    if (!editingTemplateName && templates[name]) {
      if (
        !confirm(`Já existe um template chamado "${name}". Deseja substituir?`)
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
          : new Date().toISOString(),
    };

    await Storage.set("templates", JSON.stringify(templates));
    await loadTemplates();
    closeModal();

    console.log("[Options] Template saved:", name);
  }

  function editTemplate(name, template) {
    editingTemplateName = name;
    currentTags = [...template.tags];

    $("#modal-title").text("Editar Template");
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
    if (!confirm(`Tem certeza que deseja deletar o template "${name}"?`)) {
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
    $("#preview-title").text(`Preview: ${name}`);

    // Build tags HTML
    let tagsHtml = "";
    if (template.tags && template.tags.length > 0) {
      template.tags.forEach((tag) => {
        tagsHtml += `<span class="preview-tag">${tag}</span>`;
      });
    } else {
      tagsHtml = '<span class="preview-empty">(sem tags)</span>';
    }

    // Age rating labels
    const ageRatingLabels = {
      general: "All ages",
      r18: "R-18",
      r18g: "R-18G",
    };

    // Adult content info
    let adultContentHtml = "";
    if (template.ageRating === "general") {
      adultContentHtml = template.adultContent
        ? "✓ Sim (conteúdo levemente sexual)"
        : "✗ Não";
    }

    // Mature content info
    let matureContentHtml = "";
    if (template.ageRating === "r18" && template.matureContent) {
      if (template.matureContent.length > 0) {
        const labels = {
          lo: "Menores",
          furry: "Furry",
          bl: "BL (Boys Love)",
          yuri: "GL (Girls Love)",
        };
        const items = template.matureContent
          .map((c) => `✓ ${labels[c] || c}`)
          .join("<br>");
        matureContentHtml = items;
      } else {
        matureContentHtml = '<span class="preview-empty">(nenhuma)</span>';
      }
    }

    // AI generated
    const aiGeneratedText =
      template.aiGenerated === "aiGenerated" ? "✓ Sim" : "✗ Não";

    // Build complete preview HTML
    const previewHtml = `
      <div class="preview-section">
        <h3>📄 Título</h3>
        <div class="preview-content">${template.title || '<span class="preview-empty">(vazio)</span>'}</div>
      </div>

      <div class="preview-section">
        <h3>📝 Descrição</h3>
        <div class="preview-content">${template.caption || '<span class="preview-empty">(vazio)</span>'}</div>
      </div>

      <div class="preview-section">
        <h3>🏷️ Tags</h3>
        <div class="preview-tags">${tagsHtml}</div>
      </div>

      <div class="preview-section">
        <h3>⚙️ Configurações</h3>
        <div class="preview-config">
          <div class="preview-config-item">
            <span class="preview-config-label">Classificação:</span>
            <span class="preview-config-value">${ageRatingLabels[template.ageRating] || "All ages"}</span>
          </div>
          ${template.ageRating === "general"
        ? `
          <div class="preview-config-item">
            <span class="preview-config-label">Conteúdo adulto:</span>
            <span class="preview-config-value">${adultContentHtml}</span>
          </div>
          `
        : ""
      }
          ${template.ageRating === "r18" && matureContentHtml
        ? `
          <div class="preview-config-item">
            <span class="preview-config-label">Conteúdo sensível:</span>
            <span class="preview-config-value">${matureContentHtml}</span>
          </div>
          `
        : ""
      }
          <div class="preview-config-item">
            <span class="preview-config-label">Gerado por IA:</span>
            <span class="preview-config-value">${aiGeneratedText}</span>
          </div>
        </div>
      </div>
    `;

    $("#preview-body-content").html(previewHtml);
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

    $container.find(".tag-chip").remove();

    currentTags.forEach((tag, index) => {
      const $chip = $(`
        <span class="tag-chip">
          ${tag}
          <span class="tag-chip-remove" data-index="${index}">×</span>
        </span>
      `);
      $input.before($chip);
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
      alert("Nenhum template para exportar!");
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
          `✓ Importação concluída!\n\n` +
          `Novos templates: ${newCount}\n` +
          `Templates atualizados: ${updatedCount}`,
        );

        console.log("[Options] Templates imported:", {
          newCount,
          updatedCount,
        });
      } catch (error) {
        alert(
          "❌ Erro ao importar templates!\n\nArquivo inválido ou corrompido.",
        );
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
    $(this).val("Pressione as teclas...");
  }

  function handleShortcutInputBlur() {
    $(this).removeClass("recording");
    if ($(this).val() === "Pressione as teclas...") {
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
    if (!confirm("Restaurar todos os atalhos para o padrão?")) return;

    currentShortcuts = { ...DEFAULT_SHORTCUTS };
    await Storage.set("shortcuts", JSON.stringify(currentShortcuts));

    $(".shortcut-input").each(function () {
      const action = $(this).data("action");
      $(this).val(currentShortcuts[action].toUpperCase().replace(/\+/g, "+"));
    });

    alert("✓ Atalhos restaurados para o padrão!");
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
        <div class="stat-label">Total de Usos</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);">
        <div class="stat-number">${templatesUsed}</div>
        <div class="stat-label">Templates Usados</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);">
        <div class="stat-number">${avgUses}</div>
        <div class="stat-label">Média de Usos</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%);">
        <div class="stat-number">${templateNames.length}</div>
        <div class="stat-label">Total de Templates</div>
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

      const lastUsed = stat.lastUsed
        ? new Date(stat.lastUsed).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        : "Nunca";

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
              <div class="stat-details">Último uso: ${lastUsed}</div>
            </div>
          </div>
          <div class="stat-count">${stat.count}</div>
        </div>
      `);
    });
  }

  async function handleResetStats() {
    if (
      !confirm(
        "Tem certeza que deseja limpar todas as estatísticas?\n\nEsta ação não pode ser desfeita!",
      )
    ) {
      return;
    }

    await Storage.set("template_stats", "{}");
    await loadStats();
    alert("✓ Estatísticas limpas com sucesso!");
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

  // ============================
  // ADVANCED TAB MANAGEMENT
  // ============================

  async function loadAdvancedSettings() {
    // Load debug mode status
    const debugMode = await Storage.get("debug_mode", false);
    $("#debug-mode-toggle").prop("checked", debugMode);
    updateDebugStatus(debugMode);

    // Load storage info
    await updateStorageInfo();
  }

  function updateDebugStatus(enabled) {
    const statusText = enabled ? "Ativado" : "Desativado";
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
        ? "✓ Modo Debug ativado!\n\nOs logs detalhados agora aparecerão no console."
        : "✓ Modo Debug desativado!\n\nApenas logs essenciais serão exibidos.",
    );
  }

  async function handleClearAllData() {
    const confirmation = prompt(
      "⚠️ ATENÇÃO: Esta ação irá deletar TODOS os dados da extensão!\n\n" +
      "Isso inclui:\n" +
      "• Todos os templates\n" +
      "• Todas as estatísticas\n" +
      "• Todas as configurações\n" +
      "• Todos os atalhos personalizados\n\n" +
      "Esta ação NÃO PODE ser desfeita!\n\n" +
      'Digite "DELETAR" (em maiúsculas) para confirmar:',
    );

    if (confirmation !== "DELETAR") {
      if (confirmation !== null) {
        alert("Ação cancelada. Nenhum dado foi removido.");
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

      console.log(
        "[Options] All data cleared:",
        keysToRemove.length,
        "keys removed",
      );

      alert(
        "✓ Todos os dados foram removidos com sucesso!\n\n" +
        "A página será recarregada.",
      );

      // Reload page
      location.reload();
    } catch (err) {
      console.error("[Options] Error clearing data:", err);
      alert("❌ Erro ao limpar dados: " + err.message);
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
      $("#storage-templates").text("Erro");
      $("#storage-stats").text("Erro");
      $("#storage-total").text("Erro");
    }
  }
})();
