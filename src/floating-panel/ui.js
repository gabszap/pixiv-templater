// Pixiv Templater UI Logic
// This file handles all UI interactions, event handlers, and DOM manipulation

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

  // Export UI functions to window for access from templater.js
  window.PixivTemplaterUI = {
    initialize: initializeUI,
    renderTemplateList: renderTemplateList,
    updateShortcutHint: updateShortcutHint,
  };

  // UI State
  let deleteMode = false;
  let selectedTemplates = [];

  // Drag & drop state
  let isDragging = false;
  let currentX, currentY, initialX, initialY;
  let xOffset = 0;
  let yOffset = 0;

  /**
   * Initialize the UI
   */
  async function initializeUI() {
    // Initialize i18n system (silent)
    if (window.PixivTemplaterI18n) {
      await window.PixivTemplaterI18n.init();
      window.PixivTemplaterI18n.translatePage();
    }

    // Setup all event handlers
    setupEventHandlers();

    // Initialize drag & drop
    setupDragAndDrop();

    // Load saved position
    await loadSavedPosition();

    // Render initial template list
    await renderTemplateList();

    // Setup keyboard shortcuts
    await setupKeyboardShortcuts();

    // Update shortcut hint
    await updateShortcutHint();

    // Silent initialization complete

    // Show visual indicator that extension loaded
    showLoadIndicator();
  }

  /**
   * Translation helper - shorthand for i18n.t()
   */
  function t(key, params) {
    if (window.PixivTemplaterI18n) {
      return window.PixivTemplaterI18n.t(key, params);
    }
    return key;
  }

  /**
   * Show temporary visual indicator that extension loaded
   */
  async function showLoadIndicator() {
    // Add CSS animation if not already added
    if (!document.getElementById("pt-toast-styles")) {
      $("<style>")
        .attr("id", "pt-toast-styles")
        .text(
          `
          @keyframes slideInRight {
            from {
              transform: translateX(100px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `,
        )
        .appendTo("head");
    }

    const indicator = $("<div>")
      .css({
        position: "fixed",
        top: "20px",
        right: "20px",
        background: "#0096fa",
        color: "white",
        padding: "12px 20px",
        borderRadius: "8px",
        fontWeight: "bold",
        fontSize: "14px",
        zIndex: 999999,
        boxShadow: "0 4px 12px rgba(0, 150, 250, 0.4)",
        animation: "slideInRight 0.3s ease-out",
      })
      .text(t("messages.extensionLoaded"))
      .appendTo("body");

    // Remove after 2.5 seconds, then show translation status
    setTimeout(() => {
      indicator.fadeOut(300, function () {
        $(this).remove();

        // Show translation status toast
        showTranslationStatusToast();
      });
    }, 2500);
  }

  /**
   * Show toast indicating translation auto-translate status
   */
  function showTranslationStatusToast() {
    try {
      // Read from data attribute (CSP-safe)
      const dataValue = document.body?.dataset?.pixivTemplaterAutoTranslate;
      const isEnabled = dataValue !== 'false' && dataValue !== false;

      const message = isEnabled
        ? t("messages.translationEnabled")
        : t("messages.translationDisabled");
      const bgColor = isEnabled ? "#10b981" : "#6b7280"; // green or gray
      const icon = isEnabled ? "🌐" : "🚫";

      const toast = $("<div>")
        .css({
          position: "fixed",
          top: "20px",
          right: "20px",
          background: bgColor,
          color: "white",
          padding: "12px 20px",
          borderRadius: "8px",
          fontWeight: "bold",
          fontSize: "14px",
          zIndex: 999999,
          boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
          animation: "slideInRight 0.3s ease-out",
        })
        .text(`${icon} ${message}`)
        .appendTo("body");

      // Remove after 2 seconds
      setTimeout(() => {
        toast.fadeOut(300, function () {
          $(this).remove();
        });
      }, 2000);
    } catch (error) {
      console.warn("[UI] Could not show translation status toast:", error);
    }
  }

  /**
   * Setup all event handlers
   */
  function setupEventHandlers() {
    // Toggle collapse
    $(document).on("click", "#pixiv-templater-toggle", handleToggleCollapse);

    // Minimizar com duplo clique no header
    $(document).on("dblclick", "#pixiv-templater-header", handleMinimize);

    // Expandir ao clicar no ícone minimizado
    $(document).on("click", "#pixiv-templater-minimized", handleExpand);

    // Settings menu
    $(document).on("click", "#settings-toggle", handleSettingsToggle);
    $(document).on("click", function (e) {
      if (!$(e.target).closest(".settings-dropdown").length) {
        $("#settings-menu").removeClass("active");
      }
    });

    // Menu items
    $(document).on(
      "click",
      "#reset-position",
      async () => await handleResetPosition(),
    );
    $(document).on(
      "click",
      "#refresh-data",
      async () => await handleRefreshData(),
    );
    $(document).on("click", "#open-dashboard", handleOpenDashboard);

    // Help icon
    $(document)
      .on(
        "click",
        "#shortcuts-hint",
        async () => await showKeyboardShortcutsHelp(),
      );

    // Template actions (removed - managed via dashboard)
    $(document).on("change", "#import-input", handleImportFile);



    // Template item clicks
    $(document).on("click", ".template-item .preview", async (e) => {
      await handlePreviewClick(e);
    });
    // Edit button removed - templates managed via dashboard
    $(document).on("click", ".template-item", async (e) => {
      await handleTemplateItemClick(e);
    });

    // Preview modal
    $(document).on("click", ".preview-close", closePreviewModal);
    $(document).on("click", "#template-preview-modal", function (e) {
      if (e.target === this) closePreviewModal();
    });
    $(document).on(
      "click",
      "#preview-apply",
      async () => await handlePreviewApply(),
    );

    // Help modal
    $(document).on("click", ".help-close", closeHelpModal);
    $(document).on("click", "#keyboard-help-modal", function (e) {
      if (e.target === this) closeHelpModal();
    });

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

    $(document).on("mouseup", async function () {
      if (isDragging) {
        isDragging = false;
        const $panel = $("#pixiv-templater");
        $panel.css({
          cursor: "default",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        });
        $("#pixiv-templater-header").css("cursor", "grab");

        // Save position
        await window.PixivTemplater.Storage.set(
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
  async function loadSavedPosition() {
    const savedPos = await window.PixivTemplater.Storage.get(
      "templater_position",
      null,
    );
    const savedCollapsed =
      (await window.PixivTemplater.Storage.get(
        "templater_collapsed",
        "false",
      )) === "true";
    const savedMinimized =
      (await window.PixivTemplater.Storage.get(
        "templater_minimized",
        "false",
      )) === "true";
    const $panel = $("#pixiv-templater");
    const $minimizedIcon = $("#pixiv-templater-minimized");

    // Restaurar estado minimizado
    if (savedMinimized) {
      $panel.addClass("minimized");
      $minimizedIcon.addClass("active");
    }

    if (savedPos) {
      let pos;
      try {
        pos = JSON.parse(savedPos);
      } catch (e) {
        console.error("[UI] Failed to parse saved position:", e);
        return;
      }
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
        await window.PixivTemplater.Storage.set("templater_collapsed", "true");

        setTimeout(async () => {
          const collapsedHeight = $panel.outerHeight();
          validTop = Math.min(validTop, window.innerHeight - collapsedHeight);
          $panel.css({ top: validTop + "px" });
          yOffset = validTop;
          await window.PixivTemplater.Storage.set(
            "templater_position",
            JSON.stringify({
              top: validTop,
              left: xOffset,
            }),
          );
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

  async function handleToggleCollapse() {
    const $panel = $("#pixiv-templater");
    const willCollapse = !$panel.hasClass("collapsed");

    $panel.toggleClass("collapsed");
    $("#pixiv-templater-toggle").text(willCollapse ? "+" : "−");

    await window.PixivTemplater.Storage.set(
      "templater_collapsed",
      willCollapse.toString(),
    );

    if (!willCollapse) {
      setTimeout(async () => {
        const panelHeight = $panel.outerHeight();
        const maxY = window.innerHeight - panelHeight;

        if (yOffset > maxY) {
          yOffset = Math.max(0, maxY);
          $panel.css({ top: yOffset + "px" });
          await window.PixivTemplater.Storage.set(
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

  async function handleMinimize(e) {
    // Prevenir que o duplo clique selecione texto
    e.preventDefault();

    const $panel = $("#pixiv-templater");
    const $minimizedIcon = $("#pixiv-templater-minimized");

    // Adicionar classe minimized ao painel
    $panel.addClass("minimized");

    // Mostrar ícone minimizado
    $minimizedIcon.addClass("active");

    // Salvar estado minimizado
    await window.PixivTemplater.Storage.set("templater_minimized", "true");

    log.user("Pixiv Templater UI", t("messages.panelMinimized"));
  }

  async function handleExpand() {
    const $panel = $("#pixiv-templater");
    const $minimizedIcon = $("#pixiv-templater-minimized");

    // Remover classe minimized do painel
    $panel.removeClass("minimized");

    // Ocultar ícone minimizado
    $minimizedIcon.removeClass("active");

    // Salvar estado expandido
    await window.PixivTemplater.Storage.set("templater_minimized", "false");

    log.user("Pixiv Templater UI", t("messages.panelExpanded"));
  }

  function handleSettingsToggle(e) {
    e.preventDefault();
    e.stopPropagation();
    $("#settings-menu").toggleClass("active");
  }

  // Funções antigas removidas - gerenciamento via dashboard
  // handleStatsClick, handleExportClick, handleImportClick, handleShortcutsConfig,
  // handleDeleteModeToggle, handleResetStats, handleNewTemplate

  async function handleResetPosition() {
    const $panel = $("#pixiv-templater");
    $panel.css({
      top: "80px",
      right: "20px",
      left: "auto",
    });
    xOffset = window.innerWidth - 20 - $panel.outerWidth();
    yOffset = 80;

    await window.PixivTemplater.Storage.set(
      "templater_position",
      JSON.stringify({
        top: yOffset,
        left: xOffset,
      }),
    );
    checkPosition();
    $("#settings-menu").removeClass("active");
    log.user("Pixiv Templater UI", t("messages.positionReset"));
  }

  async function handleRefreshData() {
    $("#settings-menu").removeClass("active");
    log.user("Pixiv Templater UI", t("messages.refreshingData"));

    // Recarregar templates
    await renderTemplateList();

    // Mostrar feedback visual
    const $indicator = $("<div>")
      .css({
        position: "fixed",
        top: "20px",
        right: "20px",
        background: "#28a745",
        color: "white",
        padding: "12px 20px",
        borderRadius: "8px",
        fontWeight: "bold",
        fontSize: "14px",
        zIndex: 999999,
        boxShadow: "0 4px 12px rgba(40, 167, 69, 0.4)",
      })
      .text(t("messages.dataRefreshed"))
      .appendTo("body");

    setTimeout(() => {
      $indicator.fadeOut(300, function () {
        $(this).remove();
      });
    }, 2000);

    log.user("Pixiv Templater UI", t("messages.dataRefreshed"));
  }

  function handleOpenDashboard() {
    $("#settings-menu").removeClass("active");

    // Enviar mensagem para o content script abrir o dashboard
    // (ui.js roda no contexto da página, não tem acesso direto ao chrome.runtime)
    window.postMessage(
      {
        type: "PIXIV_TEMPLATER_OPEN_DASHBOARD",
      },
      "*",
    );

    log.user("Pixiv Templater UI", t("messages.openingDashboard"));
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (file) {
      window.PixivTemplater.importTemplates(file);
      e.target.value = "";
    }
  }


  async function handlePreviewClick(e) {
    e.stopPropagation();
    const name = $(e.target).closest(".template-item").data("template-name");
    const templates = await window.PixivTemplater.loadTemplates();
    if (templates[name]) {
      showPreview(name, templates[name]);
    }
  }



  async function handleTemplateItemClick(e) {
    if ($(e.target).closest(".preview, .edit").length) {
      return;
    }

    const name = $(e.currentTarget).data("template-name");

    if (deleteMode) {
      toggleTemplateSelection(name);
    } else {
      const $item = $(e.currentTarget);
      $item.css("animation", "pulse 0.5s");
      setTimeout(() => $item.css("animation", ""), 500);

      const templates = await window.PixivTemplater.loadTemplates();
      if (templates[name]) {
        await window.PixivTemplater.applyTemplate(templates[name]);
        await window.PixivTemplater.trackTemplateUsage(name);
        await renderTemplateList();
      }
    }
  }

  async function handlePreviewApply() {
    const template = $(this).data("template");
    closePreviewModal();
    await window.PixivTemplater.applyTemplate(template);
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

  async function renderTemplateList() {
    const templates = await window.PixivTemplater.loadTemplates();
    const stats = await window.PixivTemplater.loadStats();
    const $list = $("#template-list");
    $list.empty();

    Object.keys(templates).forEach((name) => {
      const template = templates[name];
      const stat = stats[name];
      const useCount = stat ? stat.count : 0;
      let icon = template.emoji || "📝";

      const useBadge =
        useCount > 0
          ? ` <span style="background:#0096fa;color:white;padding:2px 6px;border-radius:8px;font-size:10px;font-weight:600;margin-left:4px;">${useCount}×</span>`
          : "";

      const $container = $(`
                <div class="template-item" data-template-name="${name}">
                    <span class="template-item-name">${icon} ${name}${useBadge}</span>
                    <div class="template-item-actions">
                        <button class="btn-icon preview" title="Preview">👁</button>
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

    // Build tags HTML
    let tagsHtml = "";
    if (template.tags && template.tags.length > 0) {
      template.tags.forEach((tag) => {
        tagsHtml += `<span class="preview-tag">${tag}</span>`;
      });
    } else {
      tagsHtml = `<span class="preview-empty">(${t("preview.noTags")})</span>`;
    }

    // Age rating labels
    const ageRatingLabels = {
      general: t("form.ageRatingGeneral"),
      r18: t("form.ageRatingR18"),
      r18g: t("form.ageRatingR18G"),
    };

    // Adult content info
    let adultContentHtml = "";
    if (template.ageRating === "general") {
      adultContentHtml = template.adultContent
        ? t("preview.adultContentYes")
        : t("preview.adultContentNo");
    }

    // Mature content info
    let matureContentHtml = "";
    if (template.ageRating === "r18" && template.matureContent) {
      if (template.matureContent.length > 0) {
        const labels = {
          lo: t("form.minors"),
          furry: t("form.furry"),
          bl: t("form.bl"),
          yuri: t("form.gl"),
        };
        const items = template.matureContent
          .map((c) => `${labels[c] || c}`)
          .join("<br>");
        matureContentHtml = items;
      } else {
        matureContentHtml = `<span class="preview-empty">(${t("common.none")})</span>`;
      }
    }

    const aiGeneratedText =
      template.aiGenerated === "aiGenerated" ? t("preview.yes") : t("preview.no");

    // Build complete preview HTML
    const previewHtml = `
      <div class="preview-section">
        <h3>📄 ${t("common.title")}</h3>
        <div class="preview-content">${template.title || `<span class="preview-empty">(${t("common.empty")})</span>`}</div>
      </div>

      <div class="preview-section">
        <h3>📝 ${t("common.description")}</h3>
        <div class="preview-content">${template.caption || `<span class="preview-empty">(${t("common.empty")})</span>`}</div>
      </div>

      <div class="preview-section">
        <h3>🏷️ ${t("common.tags")}</h3>
        <div class="preview-tags">${tagsHtml}</div>
      </div>

      <div class="preview-section">
        <h3>⚙️ ${t("common.settings")}</h3>
        <div class="preview-config">
          <div class="preview-config-item">
            <span class="preview-config-label">${t("common.rating")}:</span>
            <span class="preview-config-value">${ageRatingLabels[template.ageRating] || t("form.ageRatingGeneral")}</span>
          </div>
          ${template.ageRating === "general"
        ? `
          <div class="preview-config-item">
            <span class="preview-config-label">${t("common.adultContent")}:</span>
            <span class="preview-config-value">${adultContentHtml}</span>
          </div>
          `
        : ""
      }
          ${template.ageRating === "r18" && matureContentHtml
        ? `
          <div class="preview-config-item">
            <span class="preview-config-label">${t("common.sensitiveContent")}:</span>
            <span class="preview-config-value">${matureContentHtml}</span>
          </div>
          `
        : ""
      }
          <div class="preview-config-item">
            <span class="preview-config-label">${t("common.aiGenerated")}:</span>
            <span class="preview-config-value">${aiGeneratedText}</span>
          </div>
        </div>
      </div>
    `;

    $("#preview-body-content").html(previewHtml);
    $("#preview-apply").data("template", template);

    openPreviewModal();
  }



  // ============================
  // MODAL FUNCTIONS
  // ============================



  function openPreviewModal() {
    $("#template-preview-modal").addClass("active");
  }

  function closePreviewModal() {
    $("#template-preview-modal").removeClass("active");
  }





  // ============================
  // KEYBOARD SHORTCUTS
  // ============================

  async function setupKeyboardShortcuts() {
    $(document).off("keydown.templater");

    // Use capture phase to intercept before browser handles it
    document.addEventListener("keydown", async function (e) {
      if ($(e.target).is("input, textarea") && !$(e.target).is("#tag-input"))
        return;

      const shortcuts = await window.PixivTemplater.loadShortcuts();

      if (matchesShortcut(e, shortcuts.togglePanel)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $("#pixiv-templater-toggle").click();
        return;
      }

      if (matchesShortcut(e, shortcuts.minimizePanel)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const $panel = $("#pixiv-templater");
        if ($panel.hasClass("minimized")) {
          handleExpand();
        } else {
          handleMinimize(e);
        }
        return;
      }

      if (matchesShortcut(e, shortcuts.newTemplate)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $("#new-template").click();
        return;
      }

      if (matchesShortcut(e, shortcuts.exportTemplates)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        await window.PixivTemplater.exportTemplates();
        return;
      }

      if (matchesShortcut(e, shortcuts.importTemplates)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $("#import-templates").click();
        return;
      }

      if (matchesShortcut(e, shortcuts.showHelp)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        showKeyboardShortcutsHelp();
        return;
      }

      if (e.key === "Escape") {

        if ($("#keyboard-help-modal").hasClass("active")) {
          e.preventDefault();
          e.stopImmediatePropagation();
          closeHelpModal();
          return;
        }

        if ($("#template-preview-modal").hasClass("active")) {
          e.preventDefault();
          e.stopImmediatePropagation();
          closePreviewModal();
          return;
        }

      }

      for (let i = 1; i <= 9; i++) {
        if (matchesShortcut(e, shortcuts[`applyTemplate${i}`])) {
          e.preventDefault();
          e.stopImmediatePropagation();
          const $templates = $(".template-item");
          if ($templates.length >= i) {
            $templates.eq(i - 1).click();
          }
          return;
        }
      }
    }, true); // true = capture phase
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

  async function showKeyboardShortcutsHelp() {
    const shortcuts = await window.PixivTemplater.loadShortcuts();
    const formatShortcut = (s) => s.toUpperCase().replace(/\+/g, " + ");

    const helpHtml = `
      <div class="help-section">
        <h3 class="help-section-title">${t("shortcuts.help.panelSection")}</h3>
        <div class="help-shortcut-list">
          <div class="help-shortcut-item">
            <span class="help-shortcut-key">${formatShortcut(shortcuts.togglePanel)}</span>
            <span class="help-shortcut-desc">${t("shortcuts.help.expandCollapse")}</span>
          </div>
          <div class="help-shortcut-item">
            <span class="help-shortcut-key">${formatShortcut(shortcuts.minimizePanel)}</span>
            <span class="help-shortcut-desc">${t("shortcuts.help.minimizeMaximize")}</span>
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="help-section-title">${t("shortcuts.help.templatesSection")}</h3>
        <div class="help-shortcut-list">
          <div class="help-shortcut-item">
            <span class="help-shortcut-key">${formatShortcut(shortcuts.applyTemplate1)} a ${formatShortcut(shortcuts.applyTemplate9)}</span>
            <span class="help-shortcut-desc">${t("shortcuts.help.applyTemplates19")}</span>
          </div>
          <div class="help-shortcut-item">
            <span class="help-shortcut-key">${formatShortcut(shortcuts.newTemplate)}</span>
            <span class="help-shortcut-desc">${t("shortcuts.help.createNew")}</span>
          </div>
          <div class="help-shortcut-item">
            <span class="help-shortcut-key">${formatShortcut(shortcuts.exportTemplates)}</span>
            <span class="help-shortcut-desc">${t("shortcuts.help.export")}</span>
          </div>
          <div class="help-shortcut-item">
            <span class="help-shortcut-key">${formatShortcut(shortcuts.importTemplates)}</span>
            <span class="help-shortcut-desc">${t("shortcuts.help.import")}</span>
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="help-section-title">${t("shortcuts.help.modalsSection")}</h3>
        <div class="help-shortcut-list">
          <div class="help-shortcut-item">
            <span class="help-shortcut-key">ESC</span>
            <span class="help-shortcut-desc">${t("shortcuts.help.closeModal")}</span>
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="help-section-title">${t("shortcuts.help.helpSection")}</h3>
        <div class="help-shortcut-list">
          <div class="help-shortcut-item">
            <span class="help-shortcut-key">${formatShortcut(shortcuts.showHelp)}</span>
            <span class="help-shortcut-desc">${t("shortcuts.help.showThisHelp")}</span>
          </div>
        </div>
      </div>

      <div class="help-tip">
        <span>${t("shortcuts.help.tip")}</span>
      </div>
    `;

    $("#help-body-content").html(helpHtml);
    openHelpModal();
  }

  function openHelpModal() {
    $("#keyboard-help-modal").addClass("active");
  }

  function closeHelpModal() {
    $("#keyboard-help-modal").removeClass("active");
  }

  async function updateShortcutHint() {
    // Não atualiza mais o texto, mantém apenas o ícone SVG
  }
})();
