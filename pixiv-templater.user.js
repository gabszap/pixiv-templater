// ==UserScript==
// @name         Pixiv Upload Templater
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  Auto-fill Pixiv upload page with predefined templates (com atalhos personalizáveis!)
// @author       You
// @match        *://www.pixiv.net/illustration/create*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @run-at       document-end
// ==/UserScript==

/* globals $ */

"use strict";

// ============================
// CONFIGURAÇÃO DOS TEMPLATES
// ============================

const DEFAULT_TEMPLATES = {
  "Genshin Impact": {
    title: "",
    caption: "Original character fan art\n#genshinimpact #fanart",
    tags: ["原神", "Genshin Impact", "fan art"],
    ageRating: "general", // general, r18, r18g
    adultContent: true, // true = "Included", false = "No"
    matureContent: [], // ["lo", "furry", "bl", "yuri"] para R-18
    aiGenerated: "aiGenerated", // aiGenerated, notAiGenerated
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
    matureContent: [], // Exemplo: ["yuri"] para GL
    aiGenerated: "notAiGenerated",
    allowTagEditing: true,
  },
};

// ============================
// GERENCIAMENTO DE TEMPLATES
// ============================

function loadTemplates() {
  const saved = GM_getValue("pixiv_templates", null);
  return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
}

function saveTemplates(templates) {
  GM_setValue("pixiv_templates", JSON.stringify(templates));
}

// ============================
// CONFIGURAÇÃO DE ATALHOS
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

function loadShortcuts() {
  const saved = GM_getValue("pixiv_shortcuts", null);
  return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
}

function saveShortcuts(shortcuts) {
  GM_setValue("pixiv_shortcuts", JSON.stringify(shortcuts));
}

function matchesShortcut(event, shortcut) {
  if (!shortcut) return false;

  const parts = shortcut.toLowerCase().split("+");
  const needsCtrl = parts.includes("ctrl");
  const needsShift = parts.includes("shift");
  const needsAlt = parts.includes("alt");
  const key = parts[parts.length - 1];

  const hasCtrl = event.ctrlKey || event.metaKey;
  const hasShift = event.shiftKey;
  const hasAlt = event.altKey;
  const pressedKey = event.key.toLowerCase();

  return (
    hasCtrl === needsCtrl &&
    hasShift === needsShift &&
    hasAlt === needsAlt &&
    pressedKey === key
  );
}

// ============================
// FUNÇÕES AUXILIARES REACT
// ============================

// Dispara eventos React para inputs
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

// Dispara eventos React para textareas
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

// Clica em um radio button de forma que o React detecte
function clickReactRadio(element) {
  // Simula um clique real do usuário
  const label = element.closest("label");

  if (label) {
    // Clica no label primeiro
    label.click();
  } else {
    // Se não tiver label, clica no input
    element.click();
  }
}

// Clica em um checkbox de forma que o React detecte
function clickReactCheckbox(element, shouldCheck) {
  // Se já está no estado correto, não faz nada
  if (element.checked === shouldCheck) {
    return;
  }

  // Simula clique real
  const label = element.closest("label");
  if (label) {
    label.click();
  } else {
    element.click();
  }
}

// ============================
// APLICAR TEMPLATE
// ============================

function applyTemplate(template) {
  console.log("[Templater] Aplicando template:", template);

  // 1. Título
  if (template.title !== undefined) {
    const titleInput = document.querySelector('input[name="title"]');
    if (titleInput) {
      setReactInputValue(titleInput, template.title);
      console.log("[Templater] ✓ Título preenchido");
    }
  }

  // 2. Descrição (Caption)
  if (template.caption !== undefined) {
    const captionTextarea = document.querySelector('textarea[name="comment"]');
    if (captionTextarea) {
      setReactTextareaValue(captionTextarea, template.caption);
      console.log("[Templater] ✓ Descrição preenchida");
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
        console.log(
          "[Templater] ✓ Age rating selecionado:",
          template.ageRating,
        );

        // Aguarda um pouco e então configura os campos específicos
        setTimeout(() => {
          if (template.ageRating === "general") {
            // Para "All ages", configura Adult Content
            const adultContentValue = template.adultContent ? "true" : "false";
            const adultContentRadio = document.querySelector(
              `input[name="sexual"][value="${adultContentValue}"]`,
            );
            if (adultContentRadio) {
              clickReactRadio(adultContentRadio);
              console.log(
                "[Templater] ✓ Adult content configurado:",
                adultContentValue,
              );
            }
          } else if (template.ageRating === "r18") {
            // Para R-18, configura Mature Content checkboxes
            const matureContentTypes = ["lo", "furry", "bl", "yuri"];
            matureContentTypes.forEach((type) => {
              const checkbox = document.querySelector(`input[name="${type}"]`);
              if (checkbox) {
                const shouldCheck = template.matureContent.includes(type);
                clickReactCheckbox(checkbox, shouldCheck);
              }
            });
            console.log(
              "[Templater] ✓ Mature content configurado:",
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
        console.log(
          "[Templater] ✓ AI-generated configurado:",
          template.aiGenerated,
        );
      }
    }, 400);
  }

  // 5. Tags - Clica nos botões de tags recomendadas
  if (template.tags && template.tags.length > 0) {
    setTimeout(() => {
      console.log("[Templater] Adicionando tags:", template.tags);
      addTagsSequentially(template.tags, 0);
    }, 600);
  }

  console.log("[Templater] ✓ Template aplicado com sucesso!");
}

// Adiciona tags de forma sequencial com delay
function addTagsSequentially(tags, index) {
  if (index >= tags.length) {
    console.log("[Templater] ✓ Todas as tags adicionadas");
    return;
  }

  const tagName = tags[index];
  addTag(tagName);

  // Aguarda antes de adicionar a próxima tag
  setTimeout(() => {
    addTagsSequentially(tags, index + 1);
  }, 400);
}

// Função auxiliar para adicionar uma tag clicando no botão recomendado
function addTag(tagName) {
  console.log("[Templater] Procurando tag:", tagName);

  // Procura apenas por botões de tags recomendadas (mais específico)
  const tagButtons = document.querySelectorAll(
    'button[class*="gtm-"][class*="tag"]',
  );

  let found = false;
  tagButtons.forEach((button) => {
    // Se já foi clicado por este script, pula
    if (button.dataset.templaterClicked === "true") {
      return;
    }

    // Verifica se o botão está visível (evita clicar em tags já adicionadas)
    if (button.offsetParent === null) {
      return; // Botão não visível, pula
    }

    const buttonText = button.textContent.trim();

    // Verifica se o texto do botão corresponde à tag (com ou sem espaços/variações)
    if (
      !found &&
      (buttonText === tagName ||
        buttonText.replace(/\s/g, "") === tagName.replace(/\s/g, "") ||
        buttonText.toLowerCase() === tagName.toLowerCase())
    ) {
      console.log("[Templater] ✓ Tag encontrada, clicando:", buttonText);

      // Marca o botão como clicado
      button.dataset.templaterClicked = "true";

      button.click();
      found = true;
    }
  });

  if (!found) {
    console.warn(
      "[Templater] ⚠ Tag não encontrada nos botões recomendados:",
      tagName,
    );
  }
}

// ============================
// INTERFACE DO USUÁRIO
// ============================

function createUI() {
  GM_addStyle(`
        #pixiv-templater {
            position: fixed;
            top: 80px;
            right: 20px;
            background: white;
            border: none;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            min-width: 280px;
            max-width: 320px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            display: flex;
            flex-direction: column;
        }

        #pixiv-templater.collapsed {
            width: auto;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        /* Quando está na parte inferior da tela */
        #pixiv-templater.bottom-position {
            flex-direction: column-reverse;
        }

        #pixiv-templater.bottom-position #pixiv-templater-header {
            border-radius: 0 0 12px 12px;
        }

        #pixiv-templater.bottom-position #pixiv-templater-content {
            border-radius: 12px 12px 0 0;
        }

        #pixiv-templater:not(.bottom-position) #pixiv-templater-header {
            border-radius: 12px 12px 0 0;
        }

        #pixiv-templater:not(.bottom-position) #pixiv-templater-content {
            border-radius: 0 0 12px 12px;
        }

        #pixiv-templater-header {
            padding: 16px 20px;
            background: linear-gradient(135deg, #0096fa 0%, #0077cc 100%);
            color: white;
            cursor: grab;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
            font-size: 15px;
            border-radius: 12px 12px 0 0;
            user-select: none;
            transition: all 0.2s;
            position: relative;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        }

        .keyboard-hint {
            font-size: 11px;
            opacity: 0.8;
            font-weight: 400;
            letter-spacing: 0.5px;
            margin-left: auto;
        }

        .header-settings-btn {
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            padding: 6px 10px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 16px;
            display: flex;
            align-items: center;
            color: white;
        }

        .header-settings-btn:hover {
            background: rgba(255, 255, 255, 0.25);
            border-color: rgba(255, 255, 255, 0.5);
            transform: scale(1.05);
        }

        .header-settings-btn:active {
            transform: scale(0.95);
        }

        #pixiv-templater-header:hover {
            background: linear-gradient(135deg, #0077cc 0%, #005fa3 100%);
            padding: 16px 22px;
        }

        #pixiv-templater-header:active {
            cursor: grabbing;
        }

        #pixiv-templater-toggle {
            cursor: pointer;
            z-index: 1;
        }

        #pixiv-templater-toggle {
            font-size: 20px;
            line-height: 1;
            transition: transform 0.3s;
        }

        #pixiv-templater.collapsed #pixiv-templater-toggle {
            transform: rotate(45deg);
        }

        #pixiv-templater-content {
            padding: 16px;
            max-height: 500px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #0096fa #f0f0f0;
        }

        #pixiv-templater-content::-webkit-scrollbar {
            width: 6px;
        }

        #pixiv-templater-content::-webkit-scrollbar-track {
            background: #f0f0f0;
            border-radius: 3px;
        }

        #pixiv-templater-content::-webkit-scrollbar-thumb {
            background: #0096fa;
            border-radius: 3px;
        }

        #pixiv-templater-content::-webkit-scrollbar-thumb:hover {
            background: #0077cc;
        }

        #pixiv-templater.collapsed #pixiv-templater-content {
            display: none;
        }

        .template-btn {
            width: 100%;
            padding: 14px 16px;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border: 2px solid #e1e4e8;
            border-radius: 8px;
            cursor: pointer;
            text-align: left;
            font-size: 14px;
            font-weight: 500;
            color: #24292e;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .template-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0,150,250,0.1), transparent);
            transition: left 0.5s;
        }

        .template-btn:hover::before {
            left: 100%;
        }

        .template-btn:hover {
            background: linear-gradient(135deg, #e8f5ff 0%, #d4ebff 100%);
            border-color: #0096fa;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,150,250,0.2);
        }

        .template-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(0,150,250,0.2);
        }

        .template-btn.applied {
            background: linear-gradient(135deg, #d4f4dd 0%, #c2f0cc 100%);
            border-color: #28a745;
            animation: pulse 0.5s;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }

        .template-actions {
            display: flex;
            gap: 10px;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 2px solid #f0f0f0;
            flex-wrap: wrap;
            position: relative;
        }

        .action-btn {
            flex: 1;
            min-width: 140px;
            padding: 12px 16px;
            background: white;
            border: 2px solid #ddd;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #24292e;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        #import-input {
            display: none;
        }

        .action-btn:hover {
            background: #e8f5ff;
            border-color: #0096fa;
            color: #0096fa;
            transform: translateY(-1px);
        }

        .action-btn:active {
            transform: translateY(0);
        }

        .settings-dropdown {
            position: relative;
        }

        .settings-menu {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 8px;
            background: white;
            border: 2px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 200px;
            display: none;
            z-index: 1000;
            overflow: hidden;
        }

        .settings-menu.active {
            display: block;
            animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .settings-menu-item {
            padding: 12px 16px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            color: #24292e;
            border-bottom: 1px solid #f0f0f0;
        }

        .settings-menu-item:last-child {
            border-bottom: none;
        }

        .settings-menu-item:hover {
            background: #e8f5ff;
            color: #0096fa;
        }

        .settings-menu-item:active {
            background: #d4ebff;
        }

        /* Modal de gerenciamento */
        #template-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            z-index: 10001;
            display: none;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s;
        }

        #template-modal.active {
            display: flex;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .modal-content {
            background: white;
            border-radius: 16px;
            padding: 24px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 2px solid #f0f0f0;
        }

        .modal-header h2 {
            margin: 0;
            font-size: 20px;
            color: #24292e;
        }

        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .modal-close:hover {
            background: #f0f0f0;
            color: #000;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-group label {
            display: block;
            margin-bottom: 6px;
            font-weight: 600;
            font-size: 14px;
            color: #24292e;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 10px 12px;
            border: 2px solid #e1e4e8;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            transition: all 0.2s;
            box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: #0096fa;
            box-shadow: 0 0 0 3px rgba(0,150,250,0.1);
        }

        .form-group textarea {
            min-height: 80px;
            resize: vertical;
        }

        .form-group-inline {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .form-group-inline input[type="checkbox"] {
            width: auto;
            margin: 0;
        }

        .checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 8px;
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            cursor: pointer;
        }

        .modal-actions {
            display: flex;
            gap: 12px;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 2px solid #f0f0f0;
        }

        .btn-primary {
            flex: 1;
            padding: 12px;
            background: linear-gradient(135deg, #0096fa 0%, #0077cc 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary:hover {
            background: linear-gradient(135deg, #0077cc 0%, #005fa3 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,150,250,0.3);
        }

        .btn-primary:active {
            transform: translateY(0);
        }

        .btn-secondary {
            flex: 1;
            padding: 12px;
            background: #f6f8fa;
            color: #24292e;
            border: 2px solid #e1e4e8;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-secondary:hover {
            background: #e8e8e8;
            border-color: #d0d0d0;
        }

        .template-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            margin-bottom: 8px;
            background: #f6f8fa;
            border-radius: 8px;
            border: 2px solid transparent;
            transition: all 0.2s;
        }

        .template-item:hover {
            border-color: #0096fa;
            background: #e8f5ff;
        }

        .template-item-name {
            font-weight: 500;
            flex: 1;
        }

        .template-item-actions {
            display: flex;
            gap: 8px;
        }

        .btn-icon {
            padding: 6px 10px;
            background: white;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }

        .btn-icon:hover {
            background: #0096fa;
            color: white;
            border-color: #0096fa;
        }

        .btn-icon.delete:hover {
            background: #dc3545;
            border-color: #dc3545;
        }

        .tag-input-container {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 8px;
            border: 2px solid #e1e4e8;
            border-radius: 8px;
            min-height: 42px;
            background: white;
        }

        .tag-input-container:focus-within {
            border-color: #0096fa;
            box-shadow: 0 0 0 3px rgba(0,150,250,0.1);
        }

        .tag-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            background: #e8f5ff;
            border: 1px solid #0096fa;
            border-radius: 6px;
            font-size: 13px;
            color: #0077cc;
        }

        .tag-chip-remove {
            cursor: pointer;
            font-weight: bold;
            color: #0096fa;
            transition: color 0.2s;
        }

        .tag-chip-remove:hover {
            color: #dc3545;
        }

        .tag-input-field {
            flex: 1;
            min-width: 120px;
            border: none;
            outline: none;
            padding: 4px;
            font-size: 14px;
        }

        /* Dark mode support */
        /* Estilos do modal de configuração de atalhos */
        #shortcuts-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10001;
            display: none;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s;
        }

        #shortcuts-modal.active {
            display: flex;
        }

        .shortcuts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
        }

        .shortcut-item {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .shortcut-item label {
            font-size: 13px;
            color: #666;
            font-weight: 500;
        }

        .shortcut-input {
            padding: 10px 12px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            font-family: 'Courier New', monospace;
            text-align: center;
            background: #f8f8f8;
            cursor: pointer;
            transition: all 0.2s;
        }

        .shortcut-input:focus {
            outline: none;
            border-color: #0096fa;
            box-shadow: 0 0 0 3px rgba(0,150,250,0.1);
            background: white;
        }

        .shortcut-input.recording {
            border-color: #28a745;
            background: #e8f5e9;
            animation: pulse 1s infinite;
        }

        .shortcuts-note {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 13px;
            color: #856404;
        }

        .shortcuts-actions {
            display: flex;
            gap: 12px;
            margin-top: 16px;
        }

        .shortcuts-actions button {
            flex: 1;
        }

        .btn-reset {
            flex: 1;
            padding: 12px;
            background: #ffc107;
            border: 2px solid #ffc107;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            color: #000;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-reset:hover {
            background: #ffb300;
            border-color: #ffb300;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
        }

        .btn-reset:active {
            transform: translateY(0);
        }

        @media (prefers-color-scheme: dark) {
            #pixiv-templater {
                background: #1e1e1e;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3);
            }

            #pixiv-templater-content::-webkit-scrollbar-track {
                background: #2c2c2c;
            }

            .template-btn {
                background: linear-gradient(135deg, #2c2c2c 0%, #242424 100%);
                border-color: #444;
                color: #e1e4e8;
            }

            .template-btn:hover {
                background: linear-gradient(135deg, #1a3a4a 0%, #0d2433 100%);
                border-color: #0096fa;
            }

            .template-btn.applied {
                background: linear-gradient(135deg, #1a3d2a 0%, #0f2819 100%);
                border-color: #28a745;
            }

            .action-btn {
                background: #2c2c2c;
                border-color: #444;
                color: #e1e4e8;
            }

            .action-btn:hover {
                background: #1a3a4a;
                border-color: #0096fa;
                color: #58a6ff;
            }

            .template-actions {
                border-top-color: #444;
            }

            .settings-menu {
                background: #1e1e1e;
                border-color: #444;
            }

            .settings-menu-item {
                color: #e1e4e8;
                border-bottom-color: #444;
            }

            .settings-menu-item:hover {
                background: #1a3a4a;
                color: #58a6ff;
            }

            .settings-menu-item:active {
                background: #0d2433;
            }

            .modal-content {
                background: #1e1e1e;
                color: #e1e4e8;
            }

            .modal-header {
                border-bottom-color: #444;
            }

            .modal-header h2 {
                color: #e1e4e8;
            }

            .modal-close {
                color: #aaa;
            }

            .modal-close:hover {
                background: #2c2c2c;
                color: #fff;
            }

            .form-group label {
                color: #e1e4e8;
            }

            .form-group input,
            .form-group textarea,
            .form-group select {
                background: #2c2c2c;
                border-color: #444;
                color: #e1e4e8;
            }

            .form-group input:focus,
            .form-group textarea:focus,
            .form-group select:focus {
                border-color: #0096fa;
                background: #242424;
            }

            .modal-actions {
                border-top-color: #444;
            }

            .btn-secondary {
                background: #2c2c2c;
                border-color: #444;
                color: #e1e4e8;
            }

            .btn-secondary:hover {
                background: #3c3c3c;
                border-color: #555;
            }

            .template-item {
                background: #2c2c2c;
            }

            .template-item:hover {
                background: #1a3a4a;
            }

            .btn-icon {
                background: #2c2c2c;
                border-color: #444;
                color: #e1e4e8;
            }

            .tag-input-container {
                background: #2c2c2c;
                border-color: #444;
            }

            .tag-chip {
                background: #1a3a4a;
                border-color: #0096fa;
                color: #58a6ff;
            }

            .tag-input-field {
                background: transparent;
                color: #e1e4e8;
            }

            .preview-section {
                background: #2c2c2c;
                border-color: #444;
            }

            .preview-section h3 {
                color: #e1e4e8;
            }

            .preview-value {
                color: #aaa;
            }

            .preview-tags .tag-chip {
                background: #1a3a4a;
            }

            .preview-setting {
                color: #e1e4e8;
            }
        }

        /* Preview Modal Styles */
        #template-preview-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            z-index: 10002;
            display: none;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s;
        }

        #template-preview-modal.active {
            display: flex;
        }

        #template-preview-modal .modal-content {
            background: #1e1e1e;
            color: #e1e4e8;
        }

        .preview-section {
            background: #2c2c2c;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            border: 2px solid #444;
        }

        .preview-section h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
            color: #e1e4e8;
            font-weight: 600;
        }

        .preview-value {
            color: #aaa;
            font-size: 14px;
            word-wrap: break-word;
        }

        .preview-value:empty::before {
            content: "(vazio)";
            color: #666;
            font-style: italic;
        }

        .preview-multiline {
            white-space: pre-wrap;
            line-height: 1.6;
        }

        .preview-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .preview-tags:empty::before {
            content: "(nenhuma tag)";
            color: #666;
            font-style: italic;
        }

        .preview-tags .tag-chip {
            background: #1a3a4a;
            border-color: #0096fa;
            color: #58a6ff;
        }

        .preview-settings {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .preview-setting {
            font-size: 14px;
            color: #e1e4e8;
        }

        .preview-setting strong {
            color: #58a6ff;
            margin-right: 8px;
        }

        .shortcut-item label {
            color: #aaa;
        }

        .shortcut-input {
            background: #2c2c2c;
            border-color: #444;
            color: #e1e4e8;
        }

        .shortcut-input:focus {
            background: #1e1e1e;
        }

        .shortcut-input.recording {
            border-color: #28a745;
            background: #1a3d2a;
            color: #4ade80;
        }

        .shortcuts-note {
            background: #3d3416;
            border-color: #ffc107;
            color: #ffd54f;
        }
    }
    `);

  const $templater = $(`
        <div id="pixiv-templater">
            <div id="pixiv-templater-header">
                <div class="header-left">
                    <span>📋 Templates</span>
                    <div class="settings-dropdown">
                        <button class="header-settings-btn" id="settings-toggle">⚙️</button>
                        <div class="settings-menu" id="settings-menu">
                            <div class="settings-menu-item" id="export-templates">
                                📤 Exportar Templates
                            </div>
                            <div class="settings-menu-item" id="import-templates">
                                📥 Importar Templates
                            </div>
                            <div class="settings-menu-item" id="shortcuts-config">
                                ⌨️ Configurar Atalhos
                            </div>
                        </div>
                    </div>
                    <span class="keyboard-hint" id="shortcuts-hint">Ctrl+Shift+H</span>
                </div>
                <span id="pixiv-templater-toggle">−</span>
            </div>
            <div id="pixiv-templater-content">
                <div id="template-list"></div>
                <div class="template-actions">
                    <button class="action-btn" id="new-template">➕ Novo</button>
                    <button class="action-btn" id="reset-position">🔄 Reset</button>
                    <input type="file" id="import-input" accept=".json" style="display: none;">
                </div>
            </div>
        </div>
    `);

  $("body").append($templater);

  // Adiciona modal
  const $modal = $(`
        <div id="template-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="modal-title">Novo Template</h2>
                    <button class="modal-close">×</button>
                </div>
                <form id="template-form">
                    <div class="form-group">
                        <label>Nome do Template *</label>
                        <input type="text" id="template-name" required placeholder="Ex: Genshin Impact">
                    </div>

                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" id="template-title" placeholder="Deixe vazio para preencher manualmente">
                    </div>

                    <div class="form-group">
                        <label>Descrição/Caption</label>
                        <textarea id="template-caption" placeholder="Descrição do post..."></textarea>
                    </div>

                    <div class="form-group">
                        <label>Tags (pressione Enter para adicionar) *</label>
                        <div class="tag-input-container" id="tag-container">
                            <input type="text" class="tag-input-field" id="tag-input" placeholder="Digite uma tag...">
                        </div>
                        <small style="color: #666; font-size: 12px;">Pelo menos 1 tag é obrigatória</small>
                    </div>

                    <div class="form-group">
                        <label>Age Rating *</label>
                        <select id="template-age-rating" required>
                            <option value="general">All ages</option>
                            <option value="r18">R-18</option>
                            <option value="r18g">R-18G</option>
                        </select>
                    </div>

                    <div class="form-group" id="adult-content-group">
                        <label>Adult Content (para All ages) *</label>
                        <div class="form-group-inline">
                            <input type="checkbox" id="template-adult-content">
                            <label for="template-adult-content">Included (Slightly sexual or suggestive content)</label>
                        </div>
                        <small style="color: #666; font-size: 12px;">⚠️ Se não houver nada adulto/sugestivo, deixe desmarcado</small>
                    </div>

                    <div class="form-group" id="mature-content-group" style="display: none;">
                        <label>Mature Content (para R-18)</label>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" value="lo"> Minors
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="furry"> Furry
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="bl"> BL
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="yuri"> GL
                            </label>
                        </div>
                        <small style="color: #666; font-size: 12px;">Opcional - selecione categorias específicas se aplicável</small>
                    </div>

                    <div class="form-group">
                        <label>AI-generated *</label>
                        <select id="template-ai-generated" required>
                            <option value="aiGenerated">Yes</option>
                            <option value="notAiGenerated">No</option>
                        </select>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" id="modal-cancel">Cancelar</button>
                        <button type="submit" class="btn-primary">Salvar Template</button>
                    </div>
                </form>
            </div>
        </div>
    `);

  $("body").append($modal);

  // Modal de preview
  const $previewModal = $(`
        <div id="template-preview-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="preview-title">Preview do Template</h2>
                    <button class="modal-close preview-close">×</button>
                </div>
                <div id="preview-content">
                    <div class="preview-section">
                        <h3>📝 Título</h3>
                        <div class="preview-value" id="preview-title-value"></div>
                    </div>
                    <div class="preview-section">
                        <h3>📄 Descrição</h3>
                        <div class="preview-value preview-multiline" id="preview-caption-value"></div>
                    </div>
                    <div class="preview-section">
                        <h3>🏷️ Tags</h3>
                        <div class="preview-tags" id="preview-tags-value"></div>
                    </div>
                    <div class="preview-section">
                        <h3>⚙️ Configurações</h3>
                        <div class="preview-settings">
                            <div class="preview-setting">
                                <strong>Age Rating:</strong> <span id="preview-age-rating"></span>
                            </div>
                            <div class="preview-setting" id="preview-adult-content-setting">
                                <strong>Adult Content:</strong> <span id="preview-adult-content"></span>
                            </div>
                            <div class="preview-setting" id="preview-mature-content-setting" style="display: none;">
                                <strong>Mature Content:</strong> <span id="preview-mature-content"></span>
                            </div>
                            <div class="preview-setting">
                                <strong>AI-generated:</strong> <span id="preview-ai-generated"></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary preview-close">Fechar</button>
                    <button class="btn-primary" id="preview-apply">Aplicar Template</button>
                </div>
            </div>
        </div>
    `);

  $("body").append($previewModal);

  // Modal de configuração de atalhos
  const $shortcutsModal = $(`
        <div id="shortcuts-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>⌨️ Configurar Atalhos de Teclado</h2>
                    <button class="modal-close shortcuts-modal-close">×</button>
                </div>
                <div class="shortcuts-note">
                    💡 Clique em um campo e pressione a combinação de teclas desejada.<br>
                    Use Ctrl/Cmd, Shift, Alt + uma tecla.
                </div>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <label>Expandir/Colapsar Painel</label>
                        <input type="text" class="shortcut-input" data-action="togglePanel" readonly>
                    </div>
                    <div class="shortcut-item">
                        <label>Novo Template</label>
                        <input type="text" class="shortcut-input" data-action="newTemplate" readonly>
                    </div>
                    <div class="shortcut-item">
                        <label>Exportar Templates</label>
                        <input type="text" class="shortcut-input" data-action="exportTemplates" readonly>
                    </div>
                    <div class="shortcut-item">
                        <label>Importar Templates</label>
                        <input type="text" class="shortcut-input" data-action="importTemplates" readonly>
                    </div>
                    <div class="shortcut-item">
                        <label>Mostrar Ajuda</label>
                        <input type="text" class="shortcut-input" data-action="showHelp" readonly>
                    </div>
                    <div class="shortcut-item">
                        <label>Aplicar Template 1</label>
                        <input type="text" class="shortcut-input" data-action="applyTemplate1" readonly>
                    </div>
                    <div class="shortcut-item">
                        <label>Aplicar Template 2</label>
                        <input type="text" class="shortcut-input" data-action="applyTemplate2" readonly>
                    </div>
                    <div class="shortcut-item">
                        <label>Aplicar Template 3</label>
                        <input type="text" class="shortcut-input" data-action="applyTemplate3" readonly>
                    </div>
                    <div class="shortcut-item">
                        <label>Aplicar Template 4</label>
                        <input type="text" class="shortcut-input" data-action="applyTemplate4" readonly>
                    </div>
                    <div class="shortcut-item">
                        <label>Aplicar Template 5</label>
                        <input type="text" class="shortcut-input" data-action="applyTemplate5" readonly>
                    </div>
                    <div class="shortcut-item">
                        <label>Aplicar Template 6</label>
                        <input type="text" class="shortcut-input" data-action="applyTemplate6" readonly>
                    </div>
                    <div class="shortcut-item">
                        <label>Aplicar Template 7</label>
                        <input type="text" class="shortcut-input" data-action="applyTemplate7" readonly>
                    </div>
                    <div class="shortcut-item">
                        <label>Aplicar Template 8</label>
                        <input type="text" class="shortcut-input" data-action="applyTemplate8" readonly>
                    </div>
                    <div class="shortcut-item">
                        <label>Aplicar Template 9</label>
                        <input type="text" class="shortcut-input" data-action="applyTemplate9" readonly>
                    </div>
                </div>
                <div class="shortcuts-actions">
                    <button class="btn-reset" id="shortcuts-reset">🔄 Restaurar Padrão</button>
                    <button class="btn-secondary" id="shortcuts-cancel">Cancelar</button>
                    <button class="btn-primary" id="shortcuts-save">Salvar Atalhos</button>
                </div>
            </div>
        </div>
    `);

  $("body").append($shortcutsModal);

  // Sistema de drag & drop
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  const $header = $("#pixiv-templater-header");
  const $panel = $("#pixiv-templater");

  // Carrega posição salva
  const savedPos = GM_getValue("templater_position", null);
  const savedCollapsed = GM_getValue("templater_collapsed", false);

  if (savedPos) {
    const pos = JSON.parse(savedPos);

    // Primeiro, colapsa se estava colapsado
    if (savedCollapsed) {
      $panel.addClass("collapsed");
      $("#pixiv-templater-toggle").text("+");
    }

    // Valida que a posição está dentro da tela
    const panelWidth = $panel.outerWidth();
    const panelHeight = $panel.outerHeight();
    const maxX = window.innerWidth - panelWidth;
    const maxY = window.innerHeight - panelHeight;

    const validLeft = Math.max(0, Math.min(pos.left, maxX));
    let validTop = Math.max(0, Math.min(pos.top, maxY));

    // Se expandido ficaria fora da tela na parte de baixo, colapsa automaticamente
    if (!savedCollapsed && validTop + panelHeight > window.innerHeight) {
      $panel.addClass("collapsed");
      $("#pixiv-templater-toggle").text("+");
      GM_setValue("templater_collapsed", true);

      // Recalcula altura com painel colapsado
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

  $header.on("mousedown", function (e) {
    // Só arrasta se não clicar no botão de toggle
    if ($(e.target).is("#pixiv-templater-toggle")) {
      return;
    }

    const rect = $panel[0].getBoundingClientRect();
    initialX = e.clientX - rect.left;
    initialY = e.clientY - rect.top;

    if (
      e.target === this ||
      $(e.target).closest("#pixiv-templater-header").length
    ) {
      isDragging = true;
      $panel.css({
        cursor: "grabbing",
        transition: "none", // Remove transição durante o drag
      });
      $header.css("cursor", "grabbing");
    }
  });

  $(document).on("mousemove", function (e) {
    if (isDragging) {
      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      // Limita aos bounds da janela (painel inteiro deve estar visível)
      const panelWidth = $panel.outerWidth();
      const panelHeight = $panel.outerHeight();

      const maxX = window.innerWidth - panelWidth;
      const minX = 0;
      const maxY = window.innerHeight - panelHeight;
      const minY = 0;

      xOffset = Math.max(minX, Math.min(currentX, maxX));
      yOffset = Math.max(minY, Math.min(currentY, maxY));

      $panel.css({
        top: yOffset + "px",
        right: "auto",
        left: xOffset + "px",
        transform: "none",
      });

      // Verifica se está na metade inferior da tela
      checkPosition();
    }
  });

  $(document).on("mouseup", function () {
    if (isDragging) {
      isDragging = false;
      $panel.css({
        cursor: "default",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", // Restaura transição
      });
      $header.css("cursor", "grab");

      // Salva a posição
      GM_setValue(
        "templater_position",
        JSON.stringify({
          top: yOffset,
          left: xOffset,
        }),
      );
    }
  });

  // Função para verificar posição e ajustar direção do menu
  function checkPosition() {
    const panelHeight = $panel.outerHeight();
    const windowHeight = window.innerHeight;

    // Se está na metade inferior da tela
    if (yOffset > windowHeight / 2) {
      $panel.addClass("bottom-position");
    } else {
      $panel.removeClass("bottom-position");
    }
  }

  // Toggle collapse
  $("#pixiv-templater-toggle").click(() => {
    const willCollapse = !$panel.hasClass("collapsed");

    $panel.toggleClass("collapsed");
    $("#pixiv-templater-toggle").text(willCollapse ? "+" : "−");

    // Salva estado colapsado
    GM_setValue("templater_collapsed", willCollapse);

    // Após expandir, verifica se precisa ajustar posição
    if (!willCollapse) {
      setTimeout(() => {
        const panelHeight = $panel.outerHeight();
        const maxY = window.innerHeight - panelHeight;

        // Se expandir faria o painel sair da tela, ajusta
        if (yOffset > maxY) {
          yOffset = Math.max(0, maxY);
          $panel.css({
            top: yOffset + "px",
          });

          GM_setValue(
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
  });

  // Verifica posição inicial
  checkPosition();

  // Revalida posição ao redimensionar janela
  $(window).on("resize", () => {
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
  });

  // Renderizar lista de templates
  renderTemplateList();

  // Sistema de tags no modal
  let currentTags = [];
  let editingTemplateName = null;

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

    // Mature content checkboxes
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
    $("#template-modal").addClass("active");
  }

  // Event delegation para botões de editar e deletar (depois de declarar editTemplate)
  $(document).on("click", ".btn-icon.edit", function (e) {
    e.stopPropagation();
    const name = $(this).attr("data-template-name");
    const templates = loadTemplates();
    if (templates[name]) {
      console.log("[Templater] Editando template:", name);
      editTemplate(name, templates[name]);
    }
  });

  $(document).on("click", ".btn-icon.delete", function (e) {
    e.stopPropagation();
    const name = $(this).attr("data-template-name");
    console.log("[Templater] Deletando template:", name);
    deleteTemplate(name);
  });

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

  $("#tag-input").on("keydown", function (e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = $(this).val().trim();
      if (tag && !currentTags.includes(tag)) {
        currentTags.push(tag);
        renderTags();
        $(this).val("");
      }
    }
  });

  $(document).on("click", ".tag-chip-remove", function () {
    const index = $(this).data("index");
    currentTags.splice(index, 1);
    renderTags();
  });

  // Alterna entre Adult Content e Mature Content baseado no Age Rating
  $("#template-age-rating").on("change", function () {
    const value = $(this).val();
    if (value === "general") {
      $("#adult-content-group").show();
      $("#mature-content-group").hide();
    } else if (value === "r18" || value === "r18g") {
      $("#adult-content-group").hide();
      $("#mature-content-group").show();
    }
  });

  // Abre modal para novo template
  $("#new-template").click(() => {
    editingTemplateName = null;
    currentTags = [];
    $("#modal-title").text("Novo Template");
    $("#template-form")[0].reset();
    renderTags();
    $("#template-age-rating").trigger("change");
    $("#template-modal").addClass("active");
  });

  // Fecha modal
  function closeModal() {
    $("#template-modal").removeClass("active");
    currentTags = [];
  }

  $(".modal-close, #modal-cancel").click(closeModal);

  $("#template-modal").click(function (e) {
    if (e.target === this) {
      closeModal();
    }
  });

  // Salva template
  $("#template-form").on("submit", function (e) {
    e.preventDefault();

    const name = $("#template-name").val().trim();
    if (!name) {
      alert("Nome do template é obrigatório!");
      return;
    }

    // Valida que pelo menos 1 tag foi adicionada
    if (currentTags.length === 0) {
      alert("Adicione pelo menos 1 tag ao template!");
      $("#tag-input").focus();
      return;
    }

    const templates = loadTemplates();

    // Verifica se já existe (exceto se estiver editando)
    if (!editingTemplateName && templates[name]) {
      if (
        !confirm(`Já existe um template chamado "${name}". Deseja substituir?`)
      ) {
        return;
      }
    }

    // Remove o template antigo se estiver renomeando
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

    saveTemplates(templates);
    renderTemplateList();
    closeModal();

    console.log("[Templater] Template salvo:", name);
  });

  // Botões de ação
  $("#export-templates").click(exportTemplates);

  $("#import-templates").click(function () {
    $("#import-input").click();
  });

  $("#import-input").on("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      importTemplates(file);
      e.target.value = ""; // Limpa o input
    }
  });

  // Botão de reset de posição
  $("#reset-position").click(() => {
    $panel.css({
      top: "80px",
      right: "20px",
      left: "auto",
    });
    xOffset = window.innerWidth - 20 - $panel.outerWidth();
    yOffset = 80;

    GM_setValue(
      "templater_position",
      JSON.stringify({
        top: yOffset,
        left: xOffset,
      }),
    );

    checkPosition();
  });

  // ============================
  // MENU DE CONFIGURAÇÕES
  // ============================

  // Toggle do menu de configurações
  $("#settings-toggle").click(function (e) {
    e.preventDefault();
    e.stopPropagation();
    $("#settings-menu").toggleClass("active");
  });

  // Fecha o menu ao clicar fora
  $(document).on("click", function (e) {
    if (!$(e.target).closest(".settings-dropdown").length) {
      $("#settings-menu").removeClass("active");
    }
  });

  // Fecha o menu ao clicar em um item
  $(".settings-menu-item").click(function () {
    $("#settings-menu").removeClass("active");
  });

  // ============================
  // CONFIGURAÇÃO DE ATALHOS
  // ============================

  let currentShortcuts = loadShortcuts();
  let recordingInput = null;

  // Atualiza hint no header
  function updateShortcutHint() {
    const shortcuts = loadShortcuts();
    $("#shortcuts-hint").text(
      shortcuts.showHelp.toUpperCase().replace(/\+/g, "+"),
    );
  }

  updateShortcutHint();

  // Abre modal de configuração
  $("#shortcuts-config").click(() => {
    currentShortcuts = loadShortcuts();

    // Preenche os campos com os atalhos atuais
    $(".shortcut-input").each(function () {
      const action = $(this).data("action");
      $(this).val(currentShortcuts[action].toUpperCase().replace(/\+/g, "+"));
    });

    $("#shortcuts-modal").addClass("active");
  });

  // Fecha modal de atalhos
  $(".shortcuts-modal-close, #shortcuts-cancel").click(() => {
    $("#shortcuts-modal").removeClass("active");
    recordingInput = null;
    $(".shortcut-input").removeClass("recording");
  });

  $("#shortcuts-modal").click(function (e) {
    if (e.target === this) {
      $(this).removeClass("active");
      recordingInput = null;
      $(".shortcut-input").removeClass("recording");
    }
  });

  // Captura de atalho
  $(".shortcut-input").on("focus", function () {
    recordingInput = $(this);
    $(this).addClass("recording");
    $(this).val("Pressione as teclas...");
  });

  $(".shortcut-input").on("blur", function () {
    $(this).removeClass("recording");
    if ($(this).val() === "Pressione as teclas...") {
      const action = $(this).data("action");
      $(this).val(currentShortcuts[action].toUpperCase().replace(/\+/g, "+"));
    }
  });

  $(document).on("keydown", function (e) {
    if (recordingInput && $("#shortcuts-modal").hasClass("active")) {
      e.preventDefault();

      // Ignora apenas modificadores sozinhos
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
        return;
      }

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
  });

  // Restaurar atalhos padrão
  $("#shortcuts-reset").click(() => {
    if (confirm("Restaurar todos os atalhos para o padrão?")) {
      currentShortcuts = { ...DEFAULT_SHORTCUTS };

      $(".shortcut-input").each(function () {
        const action = $(this).data("action");
        $(this).val(currentShortcuts[action].toUpperCase().replace(/\+/g, "+"));
      });
    }
  });

  // Salvar atalhos
  $("#shortcuts-save").click(() => {
    saveShortcuts(currentShortcuts);
    updateShortcutHint();
    $("#shortcuts-modal").removeClass("active");

    // Recarrega os atalhos
    setupKeyboardShortcuts();

    console.log("[Templater] Atalhos salvos:", currentShortcuts);
    alert("✓ Atalhos salvos com sucesso!");
  });
}

function renderTemplateList() {
  const templates = loadTemplates();
  const $list = $("#template-list");
  $list.empty();

  Object.keys(templates).forEach((name) => {
    const template = templates[name];

    // Cria ícone baseado no tipo de template
    let icon = "📝";
    if (name.includes("R-18")) icon = "🔞";
    else if (name.includes("Genshin")) icon = "⚔️";
    else if (name.includes("Honkai")) icon = "🚂";
    else if (name.includes("Star Rail")) icon = "🌟";

    const $container = $(`
            <div class="template-item">
                <span class="template-item-name">${icon} ${name}</span>
                <div class="template-item-actions">
                    <button class="btn-icon preview" data-template-name="${name}" title="Preview">👁</button>
                    <button class="btn-icon apply" data-template-name="${name}" title="Aplicar">✓</button>
                    <button class="btn-icon edit" data-template-name="${name}" title="Editar">✎</button>
                    <button class="btn-icon delete" data-template-name="${name}" title="Deletar">🗑</button>
                </div>
            </div>
        `);

    // Botão preview
    $container.find(".preview").click(function (e) {
      e.stopPropagation();
      showPreview(name, template);
    });

    // Botão aplicar
    $container.find(".apply").click(function () {
      const $item = $(this).closest(".template-item");
      $item.css("animation", "pulse 0.5s");
      setTimeout(() => $item.css("animation", ""), 500);

      applyTemplate(template);
    });

    $list.append($container);
  });
}

function deleteTemplate(name) {
  if (!confirm(`Tem certeza que deseja deletar o template "${name}"?`)) {
    return;
  }

  const templates = loadTemplates();
  delete templates[name];
  saveTemplates(templates);
  renderTemplateList();

  console.log("[Templater] Template deletado:", name);
}

function showPreview(name, template) {
  $("#preview-title").text(`Preview: ${name}`);

  // Título
  $("#preview-title-value").text(template.title || "");

  // Descrição
  $("#preview-caption-value").text(template.caption || "");

  // Tags
  const $tagsContainer = $("#preview-tags-value");
  $tagsContainer.empty();
  if (template.tags && template.tags.length > 0) {
    template.tags.forEach((tag) => {
      $tagsContainer.append(`<span class="tag-chip">${tag}</span>`);
    });
  }

  // Age Rating
  const ageRatingLabels = {
    general: "All ages",
    r18: "R-18",
    r18g: "R-18G",
  };
  $("#preview-age-rating").text(
    ageRatingLabels[template.ageRating] || "All ages",
  );

  // Adult Content (só para All ages)
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
      const labels = {
        lo: "Minors",
        furry: "Furry",
        bl: "BL",
        yuri: "GL",
      };
      const matureLabels = template.matureContent
        .map((c) => labels[c])
        .join(", ");
      $("#preview-mature-content").text(matureLabels);
    } else {
      $("#preview-mature-content").text("(nenhuma categoria selecionada)");
    }
  }

  // AI-generated
  $("#preview-ai-generated").text(
    template.aiGenerated === "aiGenerated" ? "✓ Yes" : "✗ No",
  );

  // Armazena template para aplicar depois
  $("#preview-apply").data("template", template);

  $("#template-preview-modal").addClass("active");
}

// Fecha preview modal
$(document).on("click", ".preview-close", function () {
  $("#template-preview-modal").removeClass("active");
});

$("#template-preview-modal").click(function (e) {
  if (e.target === this) {
    $(this).removeClass("active");
  }
});

// Aplica template do preview
$(document).on("click", "#preview-apply", function () {
  const template = $(this).data("template");
  $("#template-preview-modal").removeClass("active");
  applyTemplate(template);
});

// ============================
// EXPORTAR TEMPLATES
// ============================

function exportTemplates() {
  const templates = loadTemplates();
  const json = JSON.stringify(templates, null, 2);

  // Cria um blob e faz download
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pixiv-templates.json";
  a.click();
  URL.revokeObjectURL(url);

  console.log("[Templater] Templates exportados!");
}

function importTemplates(file) {
  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const importedTemplates = JSON.parse(event.target.result);

      if (typeof importedTemplates !== "object" || importedTemplates === null) {
        throw new Error("Formato inválido");
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
      renderTemplateList();

      alert(
        `✓ Importação concluída!\n\nNovos: ${newCount}\nSubstituídos: ${overwriteCount}`,
      );
      console.log("[Templater] Templates importados:", importedTemplates);
    } catch (error) {
      alert(
        "❌ Erro ao importar templates!\n\nVerifique se o arquivo JSON está correto.",
      );
      console.error("[Templater] Erro na importação:", error);
    }
  };
  reader.readAsText(file);
}

// ============================
// ATALHOS DE TECLADO
// ============================

function setupKeyboardShortcuts() {
  console.log("[Pixiv Templater] Configurando atalhos de teclado...");

  // Remove listeners antigos
  $(document).off("keydown.templater");

  $(document).on("keydown.templater", function (e) {
    // Ignora se estiver digitando em algum input/textarea (exceto tag-input)
    if ($(e.target).is("input, textarea") && !$(e.target).is("#tag-input")) {
      return;
    }

    // Ignora se estiver no modal de configuração de atalhos
    if ($("#shortcuts-modal").hasClass("active")) {
      return;
    }

    const shortcuts = loadShortcuts();

    // Toggle painel (expandir/colapsar)
    if (matchesShortcut(e, shortcuts.togglePanel)) {
      e.preventDefault();
      $("#pixiv-templater-toggle").click();
      console.log("[Templater] Atalho: Toggle painel");
      return;
    }

    // Novo template
    if (matchesShortcut(e, shortcuts.newTemplate)) {
      e.preventDefault();
      $("#new-template").click();
      console.log("[Templater] Atalho: Novo template");
      return;
    }

    // Exportar templates
    if (matchesShortcut(e, shortcuts.exportTemplates)) {
      e.preventDefault();
      exportTemplates();
      console.log("[Templater] Atalho: Exportar templates");
      return;
    }

    // Importar templates
    if (matchesShortcut(e, shortcuts.importTemplates)) {
      e.preventDefault();
      $("#import-templates").click();
      console.log("[Templater] Atalho: Importar templates");
      return;
    }

    // Mostra ajuda de atalhos
    if (matchesShortcut(e, shortcuts.showHelp)) {
      e.preventDefault();
      showKeyboardShortcutsHelp();
      console.log("[Templater] Atalho: Mostrar ajuda");
      return;
    }

    // ESC - Fecha modal aberto
    if (e.key === "Escape") {
      if ($("#template-modal").hasClass("active")) {
        e.preventDefault();
        $("#modal-cancel").click();
        console.log("[Templater] Atalho: Fechar modal de edição");
        return;
      }
      if ($("#template-preview-modal").hasClass("active")) {
        e.preventDefault();
        $(".preview-close").click();
        console.log("[Templater] Atalho: Fechar preview");
        return;
      }
    }

    // Aplica templates 1-9
    for (let i = 1; i <= 9; i++) {
      if (matchesShortcut(e, shortcuts[`applyTemplate${i}`])) {
        e.preventDefault();
        const index = i - 1;
        const $templates = $(".template-item .apply");
        if ($templates.length > index) {
          $templates.eq(index).click();
          console.log(`[Templater] Atalho: Aplicar template #${i}`);
        }
        return;
      }
    }
  });
}

function showKeyboardShortcutsHelp() {
  const shortcuts = loadShortcuts();

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

// ============================
// INICIALIZAÇÃO
// ============================

function initialize() {
  console.log("[Pixiv Templater] Inicializando...");

  // Aguarda a página carregar completamente
  const checkReady = setInterval(() => {
    if ($('input[name="title"]').length > 0) {
      clearInterval(checkReady);
      createUI();
      setupKeyboardShortcuts();
      console.log("[Pixiv Templater] Pronto!");
    }
  }, 500);

  // Timeout de segurança (10 segundos)
  setTimeout(() => clearInterval(checkReady), 10000);
}

// Registra comandos no menu do Tampermonkey
GM_registerMenuCommand("📤 Exportar Templates", exportTemplates);
GM_registerMenuCommand("⌨️ Ver Atalhos", showKeyboardShortcutsHelp);
GM_registerMenuCommand("⚙️ Configurar Atalhos", () => {
  $("#shortcuts-config").click();
});

// Inicia quando a página carregar
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
