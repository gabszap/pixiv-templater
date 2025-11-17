// Pixiv Templater Options Page Script

(function () {
  "use strict";

  // Storage wrapper with chrome/browser compatibility
  const Storage = {
    get: function (key, defaultValue) {
      const value = localStorage.getItem(`pixiv_templater_${key}`);
      return value !== null ? value : defaultValue;
    },
    set: function (key, value) {
      localStorage.setItem(`pixiv_templater_${key}`, value);
    },
    remove: function (key) {
      localStorage.removeItem(`pixiv_templater_${key}`);
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

  // Initialize on page load
  $(document).ready(function () {
    console.log("[Pixiv Templater Options] Initializing...");

    // Debug: Show what's in localStorage
    console.log(
      "[Options] LocalStorage keys:",
      Object.keys(localStorage).filter((k) => k.startsWith("pixiv_templater_")),
    );
    console.log("[Options] Templates:", Storage.get("templates", "{}"));
    console.log("[Options] Stats:", Storage.get("template_stats", "{}"));

    initializeTabs();
    setupEventHandlers();
    loadTemplates();
    loadShortcuts();
    loadStats();
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
      loadStats();
    }
  }

  // ============================
  // EVENT HANDLERS
  // ============================

  function setupEventHandlers() {
    // Header actions
    $("#export-all").on("click", exportTemplates);
    $("#import-templates").on("click", () => $("#import-input").click());
    $("#import-input").on("change", handleImportFile);

    // Template actions
    $("#new-template").on("click", handleNewTemplate);

    // Modal close
    $(".modal-close").on("click", closeModal);
    $("#modal-cancel").on("click", closeModal);
    $(".modal").on("click", function (e) {
      if (e.target === this) closeModal();
    });

    // Form submit
    $("#template-form").on("submit", handleFormSubmit);

    // Tag input
    $("#tag-input").on("keydown", handleTagInput);
    $(document).on("click", ".tag-chip-remove", handleTagRemove);

    // Age rating change
    $("#template-age-rating").on("change", handleAgeRatingChange);

    // Shortcuts
    $("#reset-shortcuts").on("click", handleResetShortcuts);
    $(document).on("focus", ".shortcut-input", handleShortcutInputFocus);
    $(document).on("blur", ".shortcut-input", handleShortcutInputBlur);
    $(document).on("keydown", ".shortcut-input", handleShortcutRecording);

    // Stats
    $("#reset-stats").on("click", handleResetStats);
  }

  // ============================
  // TEMPLATES MANAGEMENT
  // ============================

  function loadTemplates() {
    const templatesJson = Storage.get("templates", "{}");
    console.log("[Options] Loading templates, raw JSON:", templatesJson);

    let templates;
    try {
      templates = JSON.parse(templatesJson);
    } catch (e) {
      console.error("[Options] Failed to parse templates:", e);
      templates = {};
    }

    const stats = loadStatsData();
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

      let icon = "📝";
      if (name.includes("R-18")) icon = "🔞";
      else if (name.includes("Genshin")) icon = "⚔️";
      else if (name.includes("Honkai")) icon = "🚂";
      else if (name.includes("Star Rail")) icon = "🌟";

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
                👁️
              </button>
              <button class="template-action edit" title="Editar">
                ✏️
              </button>
              <button class="template-action delete" title="Excluir">
                🗑️
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
            <span>Criado</span>
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

      $card.find(".delete").on("click", (e) => {
        e.stopPropagation();
        deleteTemplate(name);
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
    $("#template-age-rating").trigger("change");
    openModal();
  }

  function handleFormSubmit(e) {
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

    const templatesJson = Storage.get("templates", "{}");
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
      allowTagEditing: true,
    };

    Storage.set("templates", JSON.stringify(templates));
    loadTemplates();
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

  function deleteTemplate(name) {
    if (!confirm(`Tem certeza que deseja deletar o template "${name}"?`)) {
      return;
    }

    const templatesJson = Storage.get("templates", "{}");
    const templates = JSON.parse(templatesJson);
    delete templates[name];
    Storage.set("templates", JSON.stringify(templates));

    loadTemplates();
    console.log("[Options] Template deleted:", name);
  }

  function showPreview(name, template) {
    $("#preview-title").text(`Preview: ${name}`);
    $("#preview-title-value").text(template.title || "(sem título)");
    $("#preview-caption-value").text(template.caption || "(sem descrição)");

    const $tagsContainer = $("#preview-tags-value");
    $tagsContainer.empty();
    if (template.tags && template.tags.length > 0) {
      template.tags.forEach((tag) => {
        $tagsContainer.append(`<span class="tag-chip">${tag}</span>`);
      });
    } else {
      $tagsContainer.text("(sem tags)");
    }

    const ageRatingLabels = {
      general: "All ages",
      r18: "R-18",
      r18g: "R-18G",
    };
    $("#preview-age-rating-value").text(
      ageRatingLabels[template.ageRating] || "All ages",
    );

    if (template.ageRating === "general") {
      $("#preview-adult-content-field").show();
      $("#preview-mature-content-field").hide();
      $("#preview-adult-content-value").text(
        template.adultContent ? "✓ Sim (conteúdo levemente sexual)" : "✗ Não",
      );
    } else {
      $("#preview-adult-content-field").hide();
      $("#preview-mature-content-field").show();

      if (template.matureContent && template.matureContent.length > 0) {
        const labels = {
          lo: "Menores",
          furry: "Furry",
          bl: "BL (Boys Love)",
          yuri: "GL (Girls Love)",
        };
        const matureLabels = template.matureContent
          .map((c) => labels[c])
          .join(", ");
        $("#preview-mature-content-value").text(matureLabels);
      } else {
        $("#preview-mature-content-value").text(
          "(nenhuma categoria selecionada)",
        );
      }
    }

    $("#preview-ai-generated-value").text(
      template.aiGenerated === "aiGenerated" ? "✓ Sim" : "✗ Não",
    );

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

  function exportTemplates() {
    const templatesJson = Storage.get("templates", "{}");
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

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        const templatesJson = Storage.get("templates", "{}");
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

        Storage.set("templates", JSON.stringify(existing));
        loadTemplates();

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

  function loadShortcuts() {
    const shortcutsJson = Storage.get("shortcuts", "{}");
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

  function handleShortcutRecording(e) {
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

    Storage.set("shortcuts", JSON.stringify(currentShortcuts));

    recordingInput.blur();
    recordingInput = null;

    console.log("[Options] Shortcut updated:", action, "=>", shortcut);
  }

  function handleResetShortcuts() {
    if (!confirm("Restaurar todos os atalhos para o padrão?")) return;

    currentShortcuts = { ...DEFAULT_SHORTCUTS };
    Storage.set("shortcuts", JSON.stringify(currentShortcuts));

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

  function loadStatsData() {
    const statsJson = Storage.get("template_stats", "{}");
    try {
      return JSON.parse(statsJson);
    } catch (e) {
      console.error("[Options] Failed to parse stats:", e);
      return {};
    }
  }

  function loadStats() {
    const stats = loadStatsData();
    const templatesJson = Storage.get("templates", "{}");
    let templates;
    try {
      templates = JSON.parse(templatesJson);
    } catch (e) {
      console.error("[Options] Failed to parse templates for stats:", e);
      templates = {};
    }
    const templateNames = Object.keys(templates);

    console.log(
      "[Options] Loading stats:",
      Object.keys(stats).length,
      "entries",
    );

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
      <div class="stat-card">
        <div class="stat-value">${totalUses}</div>
        <div class="stat-label">Total de Usos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${templatesUsed}</div>
        <div class="stat-label">Templates Usados</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgUses}</div>
        <div class="stat-label">Média de Usos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${templateNames.length}</div>
        <div class="stat-label">Total de Templates</div>
      </div>
    `);

    // Sort by usage
    statsArray.sort((a, b) => b.count - a.count);

    // List
    const $list = $("#stats-list");
    $list.empty();

    statsArray.forEach((stat, index) => {
      const rank =
        index === 0
          ? "🥇"
          : index === 1
            ? "🥈"
            : index === 2
              ? "🥉"
              : `${index + 1}.`;
      const lastUsed = stat.lastUsed
        ? new Date(stat.lastUsed).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Nunca";

      $list.append(`
        <div class="stat-item">
          <div class="stat-item-left">
            <div class="stat-rank">${rank}</div>
            <div>
              <div class="stat-name">${stat.name}</div>
              <div class="stat-details">Último uso: ${lastUsed}</div>
            </div>
          </div>
          <div class="stat-count">${stat.count}×</div>
        </div>
      `);
    });
  }

  function handleResetStats() {
    if (
      !confirm(
        "Tem certeza que deseja limpar todas as estatísticas?\n\nEsta ação não pode ser desfeita!",
      )
    ) {
      return;
    }

    Storage.set("template_stats", "{}");
    loadStats();
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
})();
