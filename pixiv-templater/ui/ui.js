// Pixiv Templater UI Logic
// This file handles all UI interactions, event handlers, and DOM manipulation

(function () {
  "use strict";

  // Export UI functions to window for access from templater.js
  window.PixivTemplaterUI = {
    initialize: initializeUI,
    renderTemplateList: renderTemplateList,
    updateShortcutHint: updateShortcutHint,
  };

  // UI State
  let currentTags = [];
  let editingTemplateName = null;
  let deleteMode = false;
  let selectedTemplates = [];
  let currentShortcuts = {};
  let recordingInput = null;

  // Drag & drop state
  let isDragging = false;
  let currentX, currentY, initialX, initialY;
  let xOffset = 0;
  let yOffset = 0;

  /**
   * Initialize the UI
   */
  function initializeUI() {
    console.log("[Pixiv Templater UI] Initializing UI...");

    // Setup all event handlers
    setupEventHandlers();

    // Initialize drag & drop
    setupDragAndDrop();

    // Load saved position
    loadSavedPosition();

    // Render initial template list
    renderTemplateList();

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();

    // Update shortcut hint
    updateShortcutHint();

    console.log("[Pixiv Templater UI] UI initialized successfully");
  }

  /**
   * Setup all event handlers
   */
  function setupEventHandlers() {
    // Toggle collapse
    $(document).on("click", "#pixiv-templater-toggle", handleToggleCollapse);

    // Settings menu
    $(document).on("click", "#settings-toggle", handleSettingsToggle);
    $(document).on("click", function (e) {
      if (!$(e.target).closest(".settings-dropdown").length) {
        $("#settings-menu").removeClass("active");
      }
    });

    // Menu items
    $(document).on("click", "#stats-menu-btn", handleStatsClick);
    $(document).on("click", "#export-templates", handleExportClick);
    $(document).on("click", "#import-templates", handleImportClick);
    $(document).on("click", "#shortcuts-config", handleShortcutsConfig);
    $(document).on("click", "#delete-mode-toggle", handleDeleteModeToggle);
    $(document).on("click", "#reset-stats-btn", handleResetStats);

    // Template actions
    $(document).on("click", "#new-template", handleNewTemplate);
    $(document).on("click", "#reset-position", handleResetPosition);
    $(document).on("change", "#import-input", handleImportFile);

    // Modal close
    $(document).on("click", ".modal-close, #modal-cancel", closeModal);
    $(document).on("click", "#template-modal", function (e) {
      if (e.target === this) closeModal();
    });

    // Form submit
    $(document).on("submit", "#template-form", handleFormSubmit);

    // Tag input
    $(document).on("keydown", "#tag-input", handleTagInput);
    $(document).on("click", ".tag-chip-remove", handleTagRemove);

    // Age rating change
    $(document).on("change", "#template-age-rating", handleAgeRatingChange);

    // Template item clicks
    $(document).on("click", ".template-item .preview", handlePreviewClick);
    $(document).on("click", ".template-item .edit", handleEditClick);
    $(document).on("click", ".template-item", handleTemplateItemClick);

    // Preview modal
    $(document).on("click", ".preview-close", closePreviewModal);
    $(document).on("click", "#template-preview-modal", function (e) {
      if (e.target === this) closePreviewModal();
    });
    $(document).on("click", "#preview-apply", handlePreviewApply);

    // Stats modal
    $(document).on("click", ".stats-close", closeStatsModal);
    $(document).on("click", "#stats-modal", function (e) {
      if (e.target === this) closeStatsModal();
    });

    // Shortcuts modal
    $(document).on(
      "click",
      ".shortcuts-modal-close, #shortcuts-cancel",
      closeShortcutsModal,
    );
    $(document).on("click", "#shortcuts-modal", function (e) {
      if (e.target === this) closeShortcutsModal();
    });
    $(document).on("click", "#shortcuts-save", handleShortcutsSave);
    $(document).on("click", "#shortcuts-reset", handleShortcutsReset);
    $(document).on("focus", ".shortcut-input", handleShortcutInputFocus);
    $(document).on("blur", ".shortcut-input", handleShortcutInputBlur);

    // Window resize
    $(window).on("resize", handleWindowResize);
  }

  /**
   * Setup drag and drop
   */
  function setupDragAndDrop() {
    const $header = $("#pixiv-templater-header");
    const $panel = $("#pixiv-templater");

    $header.on("mousedown", function (e) {
      if ($(e.target).is("#pixiv-templater-toggle")) return;

      const rect = $panel[0].getBoundingClientRect();
      initialX = e.clientX - rect.left;
      initialY = e.clientY - rect.top;

      if (
        e.target === this ||
        $(e.target).closest("#pixiv-templater-header").length
      ) {
        isDragging = true;
        $panel.css({ cursor: "grabbing", transition: "none" });
        $header.css("cursor", "grabbing");
      }
    });

    $(document).on("mousemove", function (e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        const $panel = $("#pixiv-templater");
        const panelWidth = $panel.outerWidth();
        const panelHeight = $panel.outerHeight();
        const maxX = window.innerWidth - panelWidth;
        const maxY = window.innerHeight - panelHeight;

        xOffset = Math.max(0, Math.min(currentX, maxX));
        yOffset = Math.max(0, Math.min(currentY, maxY));

        $panel.css({
          top: yOffset + "px",
          right: "auto",
          left: xOffset + "px",
          transform: "none",
        });

        checkPosition();
      }
    });

    $(document).on("mouseup", function () {
      if (isDragging) {
        isDragging = false;
        const $panel = $("#pixiv-templater");
        $panel.css({
          cursor: "default",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        });
        $("#pixiv-templater-header").css("cursor", "grab");

        // Save position
        window.PixivTemplater.Storage.set(
          "templater_position",
          JSON.stringify({
            top: yOffset,
            left: xOffset,
          }),
        );
      }
    });
  }

  /**
   * Load saved position
   */
  function loadSavedPosition() {
    const savedPos = window.PixivTemplater.Storage.get(
      "templater_position",
      null,
    );
    const savedCollapsed =
      window.PixivTemplater.Storage.get("templater_collapsed", "false") ===
      "true";
    const $panel = $("#pixiv-templater");

    if (savedPos) {
      const pos = JSON.parse(savedPos);
      const panelWidth = $panel.outerWidth();
      const panelHeight = $panel.outerHeight();
      const maxX = window.innerWidth - panelWidth;
      const maxY = window.innerHeight - panelHeight;

      const validLeft = Math.max(0, Math.min(pos.left, maxX));
      let validTop = Math.max(0, Math.min(pos.top, maxY));

      if (savedCollapsed) {
        $panel.addClass("collapsed");
        $("#pixiv-templater-toggle").text("+");
      }

      if (!savedCollapsed && validTop + panelHeight > window.innerHeight) {
        $panel.addClass("collapsed");
        $("#pixiv-templater-toggle").text("+");
        window.PixivTemplater.Storage.set("templater_collapsed", "true");

        setTimeout(() => {
          const collapsedHeight = $panel.outerHeight();
          validTop = Math.min(validTop, window.innerHeight - collapsedHeight);
          $panel.css({ top: validTop + "px" });
          yOffset = validTop;
        }, 50);
      }

      $panel.css({
        top: validTop + "px",
        right: "auto",
        left: validLeft + "px",
      });
      xOffset = validLeft;
      yOffset = validTop;
    }

    checkPosition();
  }

  /**
   * Check position and adjust direction
   */
  function checkPosition() {
    const $panel = $("#pixiv-templater");
    const panelHeight = $panel.outerHeight();
    const windowHeight = window.innerHeight;

    if (yOffset > windowHeight / 2) {
      $panel.addClass("bottom-position");
    } else {
      $panel.removeClass("bottom-position");
    }
  }

  // ============================
  // EVENT HANDLERS
  // ============================

  function handleToggleCollapse() {
    const $panel = $("#pixiv-templater");
    const willCollapse = !$panel.hasClass("collapsed");

    $panel.toggleClass("collapsed");
    $("#pixiv-templater-toggle").text(willCollapse ? "+" : "−");

    window.PixivTemplater.Storage.set(
      "templater_collapsed",
      willCollapse.toString(),
    );

    if (!willCollapse) {
      setTimeout(() => {
        const panelHeight = $panel.outerHeight();
        const maxY = window.innerHeight - panelHeight;

        if (yOffset > maxY) {
          yOffset = Math.max(0, maxY);
          $panel.css({ top: yOffset + "px" });
          window.PixivTemplater.Storage.set(
            "templater_position",
            JSON.stringify({
              top: yOffset,
              left: xOffset,
            }),
          );
        }
        checkPosition();
      }, 50);
    }
  }

  function handleSettingsToggle(e) {
    e.preventDefault();
    e.stopPropagation();
    $("#settings-menu").toggleClass("active");
  }

  function handleStatsClick(e) {
    e.preventDefault();
    e.stopPropagation();
    showStats();
    $("#settings-menu").removeClass("active");
  }

  function handleExportClick() {
    window.PixivTemplater.exportTemplates();
    $("#settings-menu").removeClass("active");
  }

  function handleImportClick() {
    $("#import-input").click();
    $("#settings-menu").removeClass("active");
  }

  function handleShortcutsConfig() {
    openShortcutsModal();
    $("#settings-menu").removeClass("active");
  }

  function handleDeleteModeToggle(e) {
    e.preventDefault();
    e.stopPropagation();

    if (deleteMode) {
      if (selectedTemplates.length > 0) {
        const templateNames = selectedTemplates.join("\n• ");
        if (
          confirm(
            `Tem certeza que deseja deletar ${selectedTemplates.length} template(s)?\n\n• ${templateNames}`,
          )
        ) {
          const templates = window.PixivTemplater.loadTemplates();
          selectedTemplates.forEach((name) => delete templates[name]);
          window.PixivTemplater.saveTemplates(templates);
          alert(
            `✓ ${selectedTemplates.length} template(s) deletado(s) com sucesso!`,
          );
        }
      } else {
        alert("ℹ️ Nenhum template foi selecionado.");
      }

      deleteMode = false;
      selectedTemplates = [];
      $(this).removeClass("active");
      $("#settings-menu").removeClass("active");
      renderTemplateList();
    } else {
      deleteMode = true;
      selectedTemplates = [];
      $(this).addClass("active");
      $("#settings-menu").removeClass("active");
      alert(
        "🗑 Modo de Deleção Ativado\n\nClique nos templates que deseja deletar.\nClique novamente neste botão quando terminar.",
      );
      renderTemplateList();
    }
  }

  function handleResetStats(e) {
    e.preventDefault();
    e.stopPropagation();
    if (window.PixivTemplater.resetStats()) {
      showStats();
    }
    $("#settings-menu").removeClass("active");
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

  function handleResetPosition() {
    const $panel = $("#pixiv-templater");
    $panel.css({
      top: "80px",
      right: "20px",
      left: "auto",
    });
    xOffset = window.innerWidth - 20 - $panel.outerWidth();
    yOffset = 80;

    window.PixivTemplater.Storage.set(
      "templater_position",
      JSON.stringify({
        top: yOffset,
        left: xOffset,
      }),
    );
    checkPosition();
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (file) {
      window.PixivTemplater.importTemplates(file);
      e.target.value = "";
    }
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

    const templates = window.PixivTemplater.loadTemplates();

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

    window.PixivTemplater.saveTemplates(templates);
    renderTemplateList();
    closeModal();

    console.log("[Templater UI] Template saved:", name);
  }

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

  function handlePreviewClick(e) {
    e.stopPropagation();
    const name = $(this).closest(".template-item").data("template-name");
    const templates = window.PixivTemplater.loadTemplates();
    if (templates[name]) {
      showPreview(name, templates[name]);
    }
  }

  function handleEditClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const name = $(this).closest(".template-item").data("template-name");
    const templates = window.PixivTemplater.loadTemplates();
    if (templates[name]) {
      editTemplate(name, templates[name]);
    }
  }

  function handleTemplateItemClick(e) {
    if ($(e.target).closest(".preview, .edit").length) return;

    const name = $(this).data("template-name");

    if (deleteMode) {
      toggleTemplateSelection(name);
    } else {
      const $item = $(this);
      $item.css("animation", "pulse 0.5s");
      setTimeout(() => $item.css("animation", ""), 500);

      const templates = window.PixivTemplater.loadTemplates();
      if (templates[name]) {
        window.PixivTemplater.applyTemplate(templates[name]);
        window.PixivTemplater.trackTemplateUsage(name);
        renderTemplateList();
      }
    }
  }

  function handlePreviewApply() {
    const template = $(this).data("template");
    closePreviewModal();
    window.PixivTemplater.applyTemplate(template);
  }

  function handleShortcutsSave() {
    window.PixivTemplater.saveShortcuts(currentShortcuts);
    updateShortcutHint();
    closeShortcutsModal();
    setupKeyboardShortcuts();
    console.log("[Templater UI] Shortcuts saved:", currentShortcuts);
    alert("✓ Atalhos salvos com sucesso!");
  }

  function handleShortcutsReset() {
    if (confirm("Restaurar todos os atalhos para o padrão?")) {
      currentShortcuts = { ...window.PixivTemplater.DEFAULT_SHORTCUTS };
      $(".shortcut-input").each(function () {
        const action = $(this).data("action");
        $(this).val(currentShortcuts[action].toUpperCase().replace(/\+/g, "+"));
      });
    }
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

  function handleWindowResize() {
    const $panel = $("#pixiv-templater");
    const panelWidth = $panel.outerWidth();
    const panelHeight = $panel.outerHeight();
    const maxX = window.innerWidth - panelWidth;
    const maxY = window.innerHeight - panelHeight;

    if (xOffset > maxX) xOffset = Math.max(0, maxX);
    if (yOffset > maxY) yOffset = Math.max(0, maxY);

    $panel.css({
      top: yOffset + "px",
      left: xOffset + "px",
    });

    checkPosition();
  }

  // ============================
  // UI RENDERING FUNCTIONS
  // ============================

  function renderTemplateList() {
    const templates = window.PixivTemplater.loadTemplates();
    const stats = window.PixivTemplater.loadStats();
    const $list = $("#template-list");
    $list.empty();

    Object.keys(templates).forEach((name) => {
      const template = templates[name];
      const stat = stats[name];
      const useCount = stat ? stat.count : 0;

      let icon = "📝";
      if (name.includes("R-18")) icon = "🔞";
      else if (name.includes("Genshin")) icon = "⚔️";
      else if (name.includes("Honkai")) icon = "🚂";
      else if (name.includes("Star Rail")) icon = "🌟";

      const useBadge =
        useCount > 0
          ? ` <span style="background:#0096fa;color:white;padding:2px 6px;border-radius:8px;font-size:10px;font-weight:600;margin-left:4px;">${useCount}×</span>`
          : "";

      const $container = $(`
                <div class="template-item" data-template-name="${name}">
                    <span class="template-item-name">${icon} ${name}${useBadge}</span>
                    <div class="template-item-actions">
                        <button class="btn-icon preview" title="Preview">👁</button>
                        <button class="btn-icon edit" title="Editar">✎</button>
                    </div>
                </div>
            `);

      $container.removeClass("delete-mode selected");

      if (deleteMode) {
        $container.addClass("delete-mode");
      }
      if (selectedTemplates.includes(name)) {
        $container.addClass("selected");
      }

      $list.append($container);
    });
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

  function toggleTemplateSelection(name) {
    const index = selectedTemplates.indexOf(name);
    if (index > -1) {
      selectedTemplates.splice(index, 1);
    } else {
      selectedTemplates.push(name);
    }
    renderTemplateList();
  }

  function showPreview(name, template) {
    $("#preview-title").text(`Preview: ${name}`);
    $("#preview-title-value").text(template.title || "");
    $("#preview-caption-value").text(template.caption || "");

    const $tagsContainer = $("#preview-tags-value");
    $tagsContainer.empty();
    if (template.tags && template.tags.length > 0) {
      template.tags.forEach((tag) => {
        $tagsContainer.append(`<span class="tag-chip">${tag}</span>`);
      });
    }

    const ageRatingLabels = { general: "All ages", r18: "R-18", r18g: "R-18G" };
    $("#preview-age-rating").text(
      ageRatingLabels[template.ageRating] || "All ages",
    );

    if (template.ageRating === "general") {
      $("#preview-adult-content-setting").show();
      $("#preview-mature-content-setting").hide();
      $("#preview-adult-content").text(
        template.adultContent ? "✓ Included (Slightly sexual)" : "✗ No",
      );
    } else {
      $("#preview-adult-content-setting").hide();
      $("#preview-mature-content-setting").show();

      if (template.matureContent && template.matureContent.length > 0) {
        const labels = { lo: "Minors", furry: "Furry", bl: "BL", yuri: "GL" };
        const matureLabels = template.matureContent
          .map((c) => labels[c])
          .join(", ");
        $("#preview-mature-content").text(matureLabels);
      } else {
        $("#preview-mature-content").text("(nenhuma categoria selecionada)");
      }
    }

    $("#preview-ai-generated").text(
      template.aiGenerated === "aiGenerated" ? "✓ Yes" : "✗ No",
    );
    $("#preview-apply").data("template", template);

    openPreviewModal();
  }

  function showStats() {
    const stats = window.PixivTemplater.loadStats();
    const templates = window.PixivTemplater.loadTemplates();
    const templateNames = Object.keys(templates);

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

    statsArray.sort((a, b) => b.count - a.count);

    const $body = $("#stats-body");

    if (statsArray.length === 0) {
      $body.html(`
                <div class="stats-empty">
                    <div class="stats-empty-icon">📊</div>
                    <p><strong>Nenhuma estatística ainda</strong></p>
                    <p style="font-size: 14px; margin-top: 8px;">Use alguns templates para começar a coletar dados!</p>
                </div>
            `);
    } else {
      let summaryHTML = `
                <div class="stats-summary">
                    <div class="stat-card">
                        <div class="stat-value">${totalUses}</div>
                        <div class="stat-label">Total de Usos</div>
                    </div>
                    <div class="stat-card secondary">
                        <div class="stat-value">${templatesUsed}</div>
                        <div class="stat-label">Templates Usados</div>
                    </div>
                    <div class="stat-card tertiary">
                        <div class="stat-value">${templateNames.length}</div>
                        <div class="stat-label">Templates Totais</div>
                    </div>
                </div>
                <div class="stats-list">
                    <h3>🏆 Ranking de Uso</h3>
            `;

      statsArray.forEach((stat, index) => {
        const icon =
          index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "📄";
        const lastUsed = stat.lastUsed
          ? new Date(stat.lastUsed).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Nunca";

        summaryHTML += `
                    <div class="stat-item">
                        <div class="stat-item-name">
                            <span class="stat-item-icon">${icon}</span>
                            <div class="stat-item-info">
                                <div class="stat-item-title">${stat.name}</div>
                                <div class="stat-item-date">Último uso: ${lastUsed}</div>
                            </div>
                        </div>
                        <div class="stat-item-count">${stat.count}×</div>
                    </div>
                `;
      });

      summaryHTML += "</div>";
      $body.html(summaryHTML);
    }

    openStatsModal();
  }

  // ============================
  // MODAL FUNCTIONS
  // ============================

  function openModal() {
    const $modal = $("#template-modal");
    const modalElement = $modal[0];
    modalElement.style.display = "flex";
    modalElement.style.visibility = "visible";
    modalElement.style.opacity = "1";
    modalElement.style.zIndex = "999999";
    $modal.addClass("active");
  }

  function closeModal() {
    const $modal = $("#template-modal");
    $modal.removeClass("active");
    const modalElement = $modal[0];
    modalElement.style.display = "";
    modalElement.style.visibility = "";
    modalElement.style.opacity = "";
    currentTags = [];
  }

  function openPreviewModal() {
    $("#template-preview-modal").addClass("active");
  }

  function closePreviewModal() {
    $("#template-preview-modal").removeClass("active");
  }

  function openStatsModal() {
    $("#stats-modal").addClass("active");
  }

  function closeStatsModal() {
    $("#stats-modal").removeClass("active");
  }

  function openShortcutsModal() {
    currentShortcuts = window.PixivTemplater.loadShortcuts();

    $(".shortcut-input").each(function () {
      const action = $(this).data("action");
      $(this).val(currentShortcuts[action].toUpperCase().replace(/\+/g, "+"));
    });

    $("#shortcuts-modal").addClass("active");
  }

  function closeShortcutsModal() {
    $("#shortcuts-modal").removeClass("active");
    recordingInput = null;
    $(".shortcut-input").removeClass("recording");
  }

  // ============================
  // KEYBOARD SHORTCUTS
  // ============================

  function setupKeyboardShortcuts() {
    console.log("[Pixiv Templater UI] Setting up keyboard shortcuts...");

    $(document).off("keydown.templater");

    $(document).on("keydown.templater", function (e) {
      if ($(e.target).is("input, textarea") && !$(e.target).is("#tag-input"))
        return;
      if ($("#shortcuts-modal").hasClass("active")) {
        handleShortcutRecording(e);
        return;
      }

      const shortcuts = window.PixivTemplater.loadShortcuts();

      if (matchesShortcut(e, shortcuts.togglePanel)) {
        e.preventDefault();
        $("#pixiv-templater-toggle").click();
        return;
      }

      if (matchesShortcut(e, shortcuts.newTemplate)) {
        e.preventDefault();
        $("#new-template").click();
        return;
      }

      if (matchesShortcut(e, shortcuts.exportTemplates)) {
        e.preventDefault();
        window.PixivTemplater.exportTemplates();
        return;
      }

      if (matchesShortcut(e, shortcuts.importTemplates)) {
        e.preventDefault();
        $("#import-templates").click();
        return;
      }

      if (matchesShortcut(e, shortcuts.showHelp)) {
        e.preventDefault();
        showKeyboardShortcutsHelp();
        return;
      }

      if (e.key === "Escape") {
        if ($("#template-modal").hasClass("active")) {
          e.preventDefault();
          closeModal();
          return;
        }
        if ($("#template-preview-modal").hasClass("active")) {
          e.preventDefault();
          closePreviewModal();
          return;
        }
        if ($("#stats-modal").hasClass("active")) {
          e.preventDefault();
          closeStatsModal();
          return;
        }
      }

      for (let i = 1; i <= 9; i++) {
        if (matchesShortcut(e, shortcuts[`applyTemplate${i}`])) {
          e.preventDefault();
          const $templates = $(".template-item");
          if ($templates.length >= i) {
            $templates.eq(i - 1).click();
          }
          return;
        }
      }
    });
  }

  function handleShortcutRecording(e) {
    if (recordingInput) {
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

      recordingInput.blur();
      recordingInput = null;
    }
  }

  function matchesShortcut(e, shortcut) {
    const parts = shortcut.toLowerCase().split("+");
    const key = parts[parts.length - 1];
    const hasCtrl = parts.includes("ctrl");
    const hasShift = parts.includes("shift");
    const hasAlt = parts.includes("alt");

    return (
      e.key.toLowerCase() === key &&
      (hasCtrl ? e.ctrlKey || e.metaKey : !(e.ctrlKey || e.metaKey)) &&
      (hasShift ? e.shiftKey : !e.shiftKey) &&
      (hasAlt ? e.altKey : !e.altKey)
    );
  }

  function showKeyboardShortcutsHelp() {
    const shortcuts = window.PixivTemplater.loadShortcuts();
    const formatShortcut = (s) => s.toUpperCase().replace(/\+/g, " + ");

    const helpText = `⌨️ ATALHOS DE TECLADO - PIXIV TEMPLATER

📋 PAINEL
• ${formatShortcut(shortcuts.togglePanel)} → Expandir/Colapsar painel

📝 TEMPLATES
• ${formatShortcut(shortcuts.applyTemplate1)} a ${formatShortcut(shortcuts.applyTemplate9)} → Aplicar templates 1-9
• ${formatShortcut(shortcuts.newTemplate)} → Criar novo template
• ${formatShortcut(shortcuts.exportTemplates)} → Exportar templates
• ${formatShortcut(shortcuts.importTemplates)} → Importar templates

🪟 MODAIS
• ESC → Fechar modal aberto

❓ AJUDA
• ${formatShortcut(shortcuts.showHelp)} → Mostrar esta ajuda

⚙️ CONFIGURAÇÃO
Clique no botão "⌨️ Atalhos" no painel para personalizar os atalhos!

💡 DICA: Os atalhos funcionam em qualquer lugar da página de upload!`;

    alert(helpText);
  }

  function updateShortcutHint() {
    const shortcuts = window.PixivTemplater.loadShortcuts();
    $("#shortcuts-hint").text(
      shortcuts.showHelp.toUpperCase().replace(/\+/g, "+"),
    );
  }
})();
