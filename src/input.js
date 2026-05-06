/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { applyAppearanceToDocument, applyTextDirection, applyTranslationsToDocument, buildGroqRequest, defaultState, estimateMinutes, generateWithGroq, initializeDesktopWindowOpacityFade, initializePersistentStorage, initializeSmoothScrollbox, invokeAfterDesktopFadeOut, loadState, parseWaitCardText, saveState, splitWords, translate } from "./shared.js";

await initializePersistentStorage();

const invoke = window.__TAURI__?.core?.invoke;
const tauriWindow = window.__TAURI__?.window;

const state = loadState();

const ui = {
  inputSectionPicker: document.querySelector("#inputSectionPicker"),
  inputSectionSelect: document.querySelector("#inputSectionSelect"),
  inputSectionTrigger: document.querySelector("#inputSectionTrigger"),
  inputSectionTriggerLabel: document.querySelector("#inputSectionTriggerLabel"),
  inputSectionTriggerPreview: document.querySelector("#inputSectionTriggerPreview"),
  inputSectionMenu: document.querySelector("#inputSectionMenu"),
  inputSections: document.querySelectorAll("[data-input-section]"),
  scriptEditorCard: document.querySelector("#scriptEditorCard"),
  scriptInput: document.querySelector("#scriptInput"),
  scriptMeta: document.querySelector("#scriptMeta"),
  scriptCardTemplatePicker: document.querySelector("#scriptCardTemplatePicker"),
  scriptCardTemplateSelect: document.querySelector("#scriptCardTemplateSelect"),
  scriptCardTemplateTrigger: document.querySelector("#scriptCardTemplateTrigger"),
  scriptCardTemplateTriggerLabel: document.querySelector("#scriptCardTemplateTriggerLabel"),
  scriptCardTemplateTriggerPreview: document.querySelector("#scriptCardTemplateTriggerPreview"),
  scriptCardTemplateMenu: document.querySelector("#scriptCardTemplateMenu"),
  scriptCardTemplateMeta: document.querySelector("#scriptCardTemplateMeta"),
  deleteScriptCardTemplateButton: document.querySelector("#deleteScriptCardTemplateButton"),
  scriptCardPlacementPicker: document.querySelector("#scriptCardPlacementPicker"),
  scriptCardPlacementSelect: document.querySelector("#scriptCardPlacementSelect"),
  scriptCardPlacementTrigger: document.querySelector("#scriptCardPlacementTrigger"),
  scriptCardPlacementTriggerLabel: document.querySelector("#scriptCardPlacementTriggerLabel"),
  scriptCardPlacementTriggerPreview: document.querySelector("#scriptCardPlacementTriggerPreview"),
  scriptCardPlacementMenu: document.querySelector("#scriptCardPlacementMenu"),
  scriptCardTextInput: document.querySelector("#scriptCardTextInput"),
  scriptCardWaitSecondsField: document.querySelector("#scriptCardWaitSecondsField"),
  scriptCardWaitSecondsInput: document.querySelector("#scriptCardWaitSecondsInput"),
  scriptCardWaitIncrementButton: document.querySelector("#scriptCardWaitIncrementButton"),
  scriptCardWaitDecrementButton: document.querySelector("#scriptCardWaitDecrementButton"),
  scriptCardCustomNameInput: document.querySelector("#scriptCardCustomNameInput"),
  addScriptCardButton: document.querySelector("#addScriptCardButton"),
  saveScriptCardTemplateButton: document.querySelector("#saveScriptCardTemplateButton"),
  scriptCardPreview: document.querySelector("#scriptCardPreview"),
  scriptCardStatus: document.querySelector("#scriptCardStatus"),
  scriptCardBuilder: document.querySelector("#scriptCardBuilder"),
  scriptCardBuilderBody: document.querySelector("#scriptCardBuilderBody"),
  toggleScriptCardBuilderButton: document.querySelector("#toggleScriptCardBuilderButton"),
  formatButtons: document.querySelectorAll("[data-wrap-before]"),
  uploadFileButton: document.querySelector("#uploadFileButton"),
  uploadFileInput: document.querySelector("#uploadFileInput"),
  importStatus: document.querySelector("#importStatus"),
  groqKeyInput: document.querySelector("#groqKeyInput"),
  groqPromptInput: document.querySelector("#groqPromptInput"),
  groqImportButton: document.querySelector("#groqImportButton"),
  groqImportInput: document.querySelector("#groqImportInput"),
  groqImportClearButton: document.querySelector("#groqImportClearButton"),
  groqImportStatus: document.querySelector("#groqImportStatus"),
  groqPersonalityPicker: document.querySelector("#groqPersonalityPicker"),
  groqPersonalitySelect: document.querySelector("#groqPersonalitySelect"),
  groqPersonalityTrigger: document.querySelector("#groqPersonalityTrigger"),
  groqPersonalityTriggerLabel: document.querySelector("#groqPersonalityTriggerLabel"),
  groqPersonalityTriggerPreview: document.querySelector("#groqPersonalityTriggerPreview"),
  groqPersonalityMenu: document.querySelector("#groqPersonalityMenu"),
  groqGrammarLevelPicker: document.querySelector("#groqGrammarLevelPicker"),
  groqGrammarLevelSelect: document.querySelector("#groqGrammarLevelSelect"),
  groqGrammarLevelTrigger: document.querySelector("#groqGrammarLevelTrigger"),
  groqGrammarLevelTriggerLabel: document.querySelector("#groqGrammarLevelTriggerLabel"),
  groqGrammarLevelTriggerPreview: document.querySelector("#groqGrammarLevelTriggerPreview"),
  groqGrammarLevelMenu: document.querySelector("#groqGrammarLevelMenu"),
  groqEmojiUsagePicker: document.querySelector("#groqEmojiUsagePicker"),
  groqEmojiUsageSelect: document.querySelector("#groqEmojiUsageSelect"),
  groqEmojiUsageTrigger: document.querySelector("#groqEmojiUsageTrigger"),
  groqEmojiUsageTriggerLabel: document.querySelector("#groqEmojiUsageTriggerLabel"),
  groqEmojiUsageTriggerPreview: document.querySelector("#groqEmojiUsageTriggerPreview"),
  groqEmojiUsageMenu: document.querySelector("#groqEmojiUsageMenu"),
  groqAcademicWordUsagePicker: document.querySelector("#groqAcademicWordUsagePicker"),
  groqAcademicWordUsageSelect: document.querySelector("#groqAcademicWordUsageSelect"),
  groqAcademicWordUsageTrigger: document.querySelector("#groqAcademicWordUsageTrigger"),
  groqAcademicWordUsageTriggerLabel: document.querySelector("#groqAcademicWordUsageTriggerLabel"),
  groqAcademicWordUsageTriggerPreview: document.querySelector("#groqAcademicWordUsageTriggerPreview"),
  groqAcademicWordUsageMenu: document.querySelector("#groqAcademicWordUsageMenu"),
  groqPointOfViewPicker: document.querySelector("#groqPointOfViewPicker"),
  groqPointOfViewSelect: document.querySelector("#groqPointOfViewSelect"),
  groqPointOfViewTrigger: document.querySelector("#groqPointOfViewTrigger"),
  groqPointOfViewTriggerLabel: document.querySelector("#groqPointOfViewTriggerLabel"),
  groqPointOfViewTriggerPreview: document.querySelector("#groqPointOfViewTriggerPreview"),
  groqPointOfViewMenu: document.querySelector("#groqPointOfViewMenu"),
  groqOutputLanguagePicker: document.querySelector("#groqOutputLanguagePicker"),
  groqOutputLanguageSelect: document.querySelector("#groqOutputLanguageSelect"),
  groqOutputLanguageTrigger: document.querySelector("#groqOutputLanguageTrigger"),
  groqOutputLanguageTriggerLabel: document.querySelector("#groqOutputLanguageTriggerLabel"),
  groqOutputLanguageTriggerPreview: document.querySelector("#groqOutputLanguageTriggerPreview"),
  groqOutputLanguageMenu: document.querySelector("#groqOutputLanguageMenu"),
  groqUserContextInput: document.querySelector("#groqUserContextInput"),
  groqButton: document.querySelector("#groqButton"),
  saveScriptButton: document.querySelector("#saveScriptButton"),
  groqStatus: document.querySelector("#groqStatus"),
  closeWindowButton: document.querySelector("#closeWindowButton"),
  openSettingsButton: document.querySelector("#openSettingsButton")
};

const PDF_TEXT_TYPES = new Set(["application/pdf"]);
const DOCX_TEXT_TYPES = new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const DIRECT_TEXT_EXTENSIONS = new Set(["txt", "text", "md", "markdown", "csv", "tsv", "json", "xml", "html", "htm"]);

let pdfModulePromise = null;
let mammothModulePromise = null;
let nativeDropUnlisten = null;
let groqImportedFile = null;
const customInputSelectControllers = [];
const RTL_TEXT_PATTERN = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
const INPUT_SECTION_CHOICE_METADATA = {
  editor: { icon: "ph-note-pencil", accent: "default" },
  assistant: { icon: "ph-sparkle", accent: "voice" }
};

const SCRIPT_CARD_TEMPLATE_STORAGE_KEY = "flow.script-card-templates.v1";
const SCRIPT_CARD_PANEL_COLLAPSED_STORAGE_KEY = "flow.script-card-panel-collapsed.v1";
const SCRIPT_CARD_TONES = new Set(["warning", "pause", "delivery", "cue", "identity", "bookend", "neutral"]);
const BUILT_IN_SCRIPT_CARD_TEMPLATES = [
  { id: "warning-alert", nameKey: "input.cardPreset.warningAlert", textKey: "input.cardPreset.warningAlert", placement: "centered", tone: "warning" },
  { id: "speak-louder", nameKey: "input.cardPreset.speakLouder", textKey: "input.cardPreset.speakLouder", placement: "centered", tone: "delivery" },
  { id: "short-pause", nameKey: "input.cardPreset.shortPause", textKey: "input.cardPreset.shortPause", placement: "between", tone: "pause" },
  { id: "long-pause", nameKey: "input.cardPreset.longPause", textKey: "input.cardPreset.longPause", placement: "centered", tone: "pause" },
  { id: "pause", nameKey: "input.cardPreset.pause", textKey: "input.cardPreset.pause", placement: "between", tone: "pause" },
  { id: "wait-seconds", nameKey: "input.cardPreset.waitSecondsName", textKey: "input.cardPreset.waitSecondsText", waitSeconds: 3, placement: "centered", tone: "pause" },
  { id: "continue", nameKey: "input.cardPreset.continue", textKey: "input.cardPreset.continue", placement: "between", tone: "cue" },
  { id: "slow-down", nameKey: "input.cardPreset.slowDown", textKey: "input.cardPreset.slowDown", placement: "between", tone: "delivery" },
  { id: "punch", nameKey: "input.cardPreset.punch", textKey: "input.cardPreset.punch", placement: "between", tone: "delivery" },
  { id: "smile", nameKey: "input.cardPreset.smile", textKey: "input.cardPreset.smile", placement: "between", tone: "cue" },
  { id: "gesture", nameKey: "input.cardPreset.gesture", textKey: "input.cardPreset.gesture", placement: "between", tone: "cue" },
  { id: "name-title", nameKey: "input.cardPreset.nameTitle", textKey: "input.cardPreset.nameTitle", placement: "centered", tone: "identity" },
  { id: "start-end", nameKey: "input.cardPreset.startEnd", textKey: "input.cardPreset.startEnd", placement: "centered", tone: "bookend" }
];

let scriptCardTemplates = [];
let scriptCardPanelCollapsed = false;

function detectTextEncoding(bytes) {
  if (!bytes?.length) {
    return "utf-8";
  }

  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return "utf-8-bom";
  }

  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return "utf-16le-bom";
  }

  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return "utf-16be-bom";
  }

  const sampleSize = Math.min(bytes.length, 512);
  let evenNulls = 0;
  let oddNulls = 0;

  for (let index = 0; index < sampleSize; index += 1) {
    if (bytes[index] !== 0x00) {
      continue;
    }

    if (index % 2 === 0) {
      evenNulls += 1;
    } else {
      oddNulls += 1;
    }
  }

  if (oddNulls >= 8 && oddNulls > evenNulls * 3) {
    return "utf-16le";
  }

  if (evenNulls >= 8 && evenNulls > oddNulls * 3) {
    return "utf-16be";
  }

  return "utf-8";
}

function decodeTextBytes(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input || []);
  const encoding = detectTextEncoding(bytes);

  if (encoding === "utf-8-bom") {
    return new TextDecoder("utf-8").decode(bytes.subarray(3));
  }

  if (encoding === "utf-16le-bom") {
    return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  }

  if (encoding === "utf-16be-bom") {
    return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  }

  const decoded = new TextDecoder(encoding).decode(bytes).replace(/^\uFEFF/, "");
  const replacementCount = (decoded.match(/\uFFFD/g) || []).length;

  if (encoding === "utf-8" && replacementCount > Math.max(2, Math.floor(decoded.length * 0.02))) {
    try {
      return new TextDecoder("windows-1252").decode(bytes).replace(/^\uFEFF/, "");
    } catch {
      return decoded;
    }
  }

  return decoded;
}

function t(key, params = {}) {
  return translate(key, state.language, params);
}

function getChoiceTextDirection(text, fallback = document.body?.dataset.uiDirection || "ltr") {
  const normalizedText = String(text || "").trim();
  if (!normalizedText) {
    return fallback;
  }

  return fallback;
}

function setChoiceTextContent(element, text, dir = getChoiceTextDirection(text)) {
  if (!element) {
    return;
  }

  const normalizedText = String(text || "").trim();
  element.textContent = "";
  element.dir = dir;

  if (!normalizedText) {
    return;
  }

  const ticker = document.createElement("span");
  ticker.className = "choice-ticker";
  ticker.dir = dir;

  const tickerText = document.createElement("span");
  tickerText.className = "choice-ticker-text";
  tickerText.textContent = normalizedText;

  ticker.append(tickerText);
  element.append(ticker);
}

function refreshChoiceTickerOverflow(root) {
  if (!root) {
    return;
  }

  root.querySelectorAll(".choice-ticker").forEach((ticker) => {
    const tickerText = ticker.querySelector(".choice-ticker-text");
    if (!tickerText) {
      return;
    }

    const overflowDistance = Math.max(Math.ceil(tickerText.scrollWidth - ticker.clientWidth), 0);
    const hasOverflow = overflowDistance > 10;
    ticker.classList.toggle("is-overflowing", hasOverflow);

    if (!hasOverflow) {
      ticker.style.removeProperty("--choice-overflow-distance");
      ticker.style.removeProperty("--choice-overflow-duration");
      return;
    }

    ticker.style.setProperty("--choice-overflow-distance", `${overflowDistance}px`);
    ticker.style.setProperty("--choice-overflow-duration", `${Math.min(Math.max(overflowDistance / 28 + 4.2, 5.2), 11)}s`);
  });
}

function queueChoiceTickerOverflowRefresh(...roots) {
  requestAnimationFrame(() => {
    roots.forEach((root) => refreshChoiceTickerOverflow(root));
  });
}

function createChoiceLeadingElement(leading) {
  if (!leading?.kind) {
    return null;
  }

  if (leading.kind === "icon") {
    const shell = document.createElement("span");
    shell.className = "choice-leading choice-leading-icon";
    shell.dataset.accent = leading.accent || "default";
    shell.dataset.choiceLeading = "true";
    shell.setAttribute("aria-hidden", "true");

    const icon = document.createElement("i");
    icon.className = `ph ${leading.icon || "ph-circle"}`;
    shell.append(icon);
    return shell;
  }

  return null;
}

function replaceChoiceLeading(host, leading) {
  if (!host) {
    return;
  }

  host.querySelectorAll('[data-choice-leading="true"]').forEach((node) => node.remove());
  const leadingElement = createChoiceLeadingElement(leading);
  if (leadingElement) {
    host.prepend(leadingElement);
  }
}

function getCustomSelectEntries(select) {
  const entries = [];

  Array.from(select.children).forEach((child) => {
    if (child instanceof HTMLOptGroupElement) {
      entries.push({ type: "group", label: child.label });
      Array.from(child.children).forEach((option) => {
        if (option instanceof HTMLOptionElement) {
          entries.push({ type: "option", option, groupLabel: child.label });
        }
      });
      return;
    }

    if (child instanceof HTMLOptionElement) {
      entries.push({ type: "option", option: child, groupLabel: "" });
    }
  });

  return entries;
}

const MENU_CLOSE_ANIMATION_MS = 170;

function resetAnimatedMenuState(menu) {
  if (menu?._closeTimer) {
    window.clearTimeout(menu._closeTimer);
    menu._closeTimer = 0;
  }

  menu?.classList.remove("is-closing");
  menu?.querySelectorAll(".is-selection-fading").forEach((element) => {
    element.classList.remove("is-selection-fading");
  });
}

function openAnimatedMenu(menu, trigger, picker) {
  resetAnimatedMenuState(menu);
  menu.classList.remove("hidden");
  trigger.setAttribute("aria-expanded", "true");
  picker.classList.add("is-open");
}

function closeAnimatedMenu(menu, trigger, picker, selectedOption = null, onAfterClose = null) {
  if (menu.classList.contains("hidden") && !menu.classList.contains("is-closing")) {
    onAfterClose?.();
    return;
  }

  resetAnimatedMenuState(menu);
  menu.classList.remove("hidden");
  menu.classList.add("is-closing");
  trigger.setAttribute("aria-expanded", "false");
  picker.classList.remove("is-open");

  if (selectedOption) {
    selectedOption.classList.add("is-selection-fading");
  }

  menu._closeTimer = window.setTimeout(() => {
    menu.classList.add("hidden");
    resetAnimatedMenuState(menu);
    onAfterClose?.();
  }, MENU_CLOSE_ANIMATION_MS);
}

function closeCustomInputSelect(controller, selectedOption = null, onAfterClose = null) {
  closeAnimatedMenu(controller.menu, controller.trigger, controller.picker, selectedOption, onAfterClose);
}

function openCustomInputSelect(controller) {
  openAnimatedMenu(controller.menu, controller.trigger, controller.picker);
  queueChoiceTickerOverflowRefresh(controller.trigger, controller.menu);
}

function renderCustomInputSelect(controller) {
  const selectedOption = controller.select.selectedOptions?.[0] || controller.select.options?.[0] || null;
  const previewText = controller.getPreview ? controller.getPreview(selectedOption) : "";
  const triggerLeading = controller.getLeading ? controller.getLeading(selectedOption, { context: "trigger" }) : null;

  replaceChoiceLeading(controller.trigger, triggerLeading);
  setChoiceTextContent(controller.label, selectedOption?.textContent?.trim() || "");
  if (controller.preview) {
    setChoiceTextContent(controller.preview, previewText);
    controller.preview.classList.toggle("hidden", !previewText);
  }

  controller.menu.textContent = "";
  getCustomSelectEntries(controller.select).forEach((entry) => {
    if (entry.type === "group") {
      const groupLabel = document.createElement("div");
      groupLabel.className = "choice-group-label";
      groupLabel.textContent = entry.label;
      controller.menu.append(groupLabel);
      return;
    }

    const option = entry.option;
    const button = document.createElement("button");
    const selected = option.value === controller.select.value;
  const optionLeading = controller.getLeading ? controller.getLeading(option, { context: "option", groupLabel: entry.groupLabel }) : null;
    button.type = "button";
    button.className = "choice-option";
    button.dataset.value = option.value;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", selected ? "true" : "false");
    button.classList.toggle("is-selected", selected);

    const copy = document.createElement("span");
    copy.className = "choice-option-copy";

    const title = document.createElement("span");
    title.className = "choice-option-title";
    setChoiceTextContent(title, option.textContent?.trim() || option.value);
    copy.append(title);

    const descriptionText = controller.getOptionDescription ? controller.getOptionDescription(option, entry.groupLabel) : "";
    if (descriptionText) {
      const description = document.createElement("span");
      description.className = "choice-option-sample";
      setChoiceTextContent(description, descriptionText);
      copy.append(description);
    }

    replaceChoiceLeading(button, optionLeading);
    button.append(copy);
    button.addEventListener("click", () => {
      controller.select.value = option.value;
      closeCustomInputSelect(controller, button, () => {
        renderCustomInputSelect(controller);
        controller.select.dispatchEvent(new Event("change", { bubbles: true }));
        controller.onSelect?.(option.value);
      });
    });
    controller.menu.append(button);
  });

  queueChoiceTickerOverflowRefresh(controller.trigger, controller.menu);
}

function initializeCustomInputSelects() {
  if (customInputSelectControllers.length > 0) {
    return;
  }

  [
    {
      picker: ui.inputSectionPicker,
      select: ui.inputSectionSelect,
      trigger: ui.inputSectionTrigger,
      label: ui.inputSectionTriggerLabel,
      preview: ui.inputSectionTriggerPreview,
      menu: ui.inputSectionMenu,
      getLeading: (option) => {
        const metadata = INPUT_SECTION_CHOICE_METADATA[option?.value] || INPUT_SECTION_CHOICE_METADATA.editor;
        return {
          kind: "icon",
          icon: metadata.icon,
          accent: metadata.accent
        };
      },
      getOptionDescription: (option) => option?.value === "assistant" ? t("input.draftHelper") : t("input.title"),
      onSelect: (value) => setActiveInputSection(value)
    },
    {
      picker: ui.scriptCardTemplatePicker,
      select: ui.scriptCardTemplateSelect,
      trigger: ui.scriptCardTemplateTrigger,
      label: ui.scriptCardTemplateTriggerLabel,
      preview: ui.scriptCardTemplateTriggerPreview,
      menu: ui.scriptCardTemplateMenu,
      getOptionDescription: (_option, groupLabel) => groupLabel,
      getPreview: (option) => getScriptCardTemplate(option?.value)?.source === "custom"
        ? t("input.cardTemplateCustom")
        : t("input.cardTemplateBuiltin"),
      onSelect: (value) => applySelectedScriptCardTemplate(value)
    },
    {
      picker: ui.scriptCardPlacementPicker,
      select: ui.scriptCardPlacementSelect,
      trigger: ui.scriptCardPlacementTrigger,
      label: ui.scriptCardPlacementTriggerLabel,
      preview: ui.scriptCardPlacementTriggerPreview,
      menu: ui.scriptCardPlacementMenu,
      onSelect: () => renderScriptCardPreview()
    },
    {
      picker: ui.groqPersonalityPicker,
      select: ui.groqPersonalitySelect,
      trigger: ui.groqPersonalityTrigger,
      label: ui.groqPersonalityTriggerLabel,
      preview: ui.groqPersonalityTriggerPreview,
      menu: ui.groqPersonalityMenu
    },
    {
      picker: ui.groqGrammarLevelPicker,
      select: ui.groqGrammarLevelSelect,
      trigger: ui.groqGrammarLevelTrigger,
      label: ui.groqGrammarLevelTriggerLabel,
      preview: ui.groqGrammarLevelTriggerPreview,
      menu: ui.groqGrammarLevelMenu
    },
    {
      picker: ui.groqEmojiUsagePicker,
      select: ui.groqEmojiUsageSelect,
      trigger: ui.groqEmojiUsageTrigger,
      label: ui.groqEmojiUsageTriggerLabel,
      preview: ui.groqEmojiUsageTriggerPreview,
      menu: ui.groqEmojiUsageMenu
    },
    {
      picker: ui.groqAcademicWordUsagePicker,
      select: ui.groqAcademicWordUsageSelect,
      trigger: ui.groqAcademicWordUsageTrigger,
      label: ui.groqAcademicWordUsageTriggerLabel,
      preview: ui.groqAcademicWordUsageTriggerPreview,
      menu: ui.groqAcademicWordUsageMenu
    },
    {
      picker: ui.groqPointOfViewPicker,
      select: ui.groqPointOfViewSelect,
      trigger: ui.groqPointOfViewTrigger,
      label: ui.groqPointOfViewTriggerLabel,
      preview: ui.groqPointOfViewTriggerPreview,
      menu: ui.groqPointOfViewMenu
    },
    {
      picker: ui.groqOutputLanguagePicker,
      select: ui.groqOutputLanguageSelect,
      trigger: ui.groqOutputLanguageTrigger,
      label: ui.groqOutputLanguageTriggerLabel,
      preview: ui.groqOutputLanguageTriggerPreview,
      menu: ui.groqOutputLanguageMenu
    }
  ].forEach((controller) => {
    if (!controller.picker || !controller.select || !controller.trigger || !controller.label || !controller.menu) {
      return;
    }

    customInputSelectControllers.push(controller);
    controller.trigger.addEventListener("click", () => {
      if (controller.menu.classList.contains("hidden")) {
        customInputSelectControllers.forEach((entry) => {
          if (entry !== controller) {
            closeCustomInputSelect(entry);
          }
        });
        openCustomInputSelect(controller);
        return;
      }

      closeCustomInputSelect(controller);
    });
  });
}

function syncCustomInputSelects() {
  customInputSelectControllers.forEach((controller) => renderCustomInputSelect(controller));
}

function setScriptCardStatus(key = "", params = {}) {
  if (!ui.scriptCardStatus) {
    return;
  }

  if (!key) {
    delete ui.scriptCardStatus.dataset.i18n;
    ui.scriptCardStatus.textContent = "";
    return;
  }

  ui.scriptCardStatus.dataset.i18n = key;
  ui.scriptCardStatus.textContent = t(key, params);
}

function syncScriptCardBuilderState() {
  const collapsed = Boolean(scriptCardPanelCollapsed);
  const labelKey = collapsed ? "input.cardPanelExpand" : "input.cardPanelCollapse";
  const label = t(labelKey);

  ui.scriptCardBuilder?.classList.toggle("is-collapsed", collapsed);
  ui.scriptCardBuilder?.setAttribute("data-collapsed", collapsed ? "true" : "false");
  ui.scriptCardBuilderBody?.classList.toggle("hidden", collapsed);

  if (!ui.toggleScriptCardBuilderButton) {
    return;
  }

  ui.toggleScriptCardBuilderButton.dataset.i18nTitle = labelKey;
  ui.toggleScriptCardBuilderButton.dataset.i18nAriaLabel = labelKey;
  ui.toggleScriptCardBuilderButton.setAttribute("title", label);
  ui.toggleScriptCardBuilderButton.setAttribute("aria-label", label);
  ui.toggleScriptCardBuilderButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function setScriptCardBuilderCollapsed(collapsed) {
  scriptCardPanelCollapsed = Boolean(collapsed);
  writeLocalJson(SCRIPT_CARD_PANEL_COLLAPSED_STORAGE_KEY, scriptCardPanelCollapsed);
  syncScriptCardBuilderState();
}

function readLocalJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore browser storage failures and keep the editor usable.
  }
}

function slugifyTemplateName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function sanitizeScriptCardText(value) {
  return String(value || "")
    .replace(/\[card[^\]]*\]|\[\/card\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseWaitSecondsCardText(value) {
  const descriptor = parseWaitCardText(value);
  return descriptor ? { seconds: descriptor.seconds } : null;
}

function normalizeWaitSecondsValue(value, fallback = 3) {
  const numericValue = Number(String(value ?? "").replace(/[^0-9]/g, ""));
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return Math.max(1, Math.round(Number(fallback) || 3));
  }

  return Math.max(1, Math.round(numericValue));
}

function buildWaitSecondsCardText(value) {
  return t("input.cardPreset.waitSecondsText", { seconds: normalizeWaitSecondsValue(value) });
}

function resolveScriptCardTemplateText(template, keyName, fallbackValue = "", params = {}) {
  if (template?.[keyName]) {
    return sanitizeScriptCardText(t(template[keyName], params));
  }

  return sanitizeScriptCardText(fallbackValue);
}

function hydrateBuiltInScriptCardTemplate(template) {
  const seconds = normalizeWaitSecondsValue(template?.waitSeconds, 3);

  return {
    ...template,
    name: resolveScriptCardTemplateText(template, "nameKey", template?.name || template?.text || "", { seconds }),
    text: resolveScriptCardTemplateText(template, "textKey", template?.text || template?.name || "", { seconds }),
    source: "builtin"
  };
}

function applyScriptCardWaitSecondsValue(value) {
  const normalizedValue = normalizeWaitSecondsValue(value, 3);

  if (ui.scriptCardWaitSecondsInput) {
    ui.scriptCardWaitSecondsInput.value = String(normalizedValue);
  }

  syncScriptCardWaitSecondsField(getScriptCardTemplate(ui.scriptCardTemplateSelect?.value));
  renderScriptCardPreview();
}

function shouldUseWaitSecondsField(template) {
  return Boolean(parseWaitSecondsCardText(template?.text)) || template?.id === "wait-seconds";
}

function syncScriptCardWaitSecondsField(template = getScriptCardTemplate(ui.scriptCardTemplateSelect?.value)) {
  const shouldShow = shouldUseWaitSecondsField(template);
  const parsedWait = parseWaitSecondsCardText(ui.scriptCardTextInput?.value || template?.text || "");
  const seconds = normalizeWaitSecondsValue(ui.scriptCardWaitSecondsInput?.value || parsedWait?.seconds || 3);

  ui.scriptCardWaitSecondsField?.classList.toggle("hidden", !shouldShow);
  ui.scriptCardTextInput?.closest("label")?.classList.toggle("hidden", shouldShow);

  if (ui.scriptCardTextInput) {
    ui.scriptCardTextInput.readOnly = false;
    ui.scriptCardTextInput.classList.remove("is-readonly");
  }

  if (!shouldShow) {
    return;
  }

  if (ui.scriptCardWaitSecondsInput) {
    ui.scriptCardWaitSecondsInput.value = String(seconds);
  }

  if (ui.scriptCardTextInput) {
    ui.scriptCardTextInput.value = buildWaitSecondsCardText(seconds);
  }
}

function normalizeScriptCardTemplate(template, fallbackIndex = 0) {
  const name = sanitizeScriptCardText(template?.name || template?.text || `Template ${fallbackIndex + 1}`);
  const text = sanitizeScriptCardText(template?.text || name);
  const placement = template?.placement === "between" ? "between" : "centered";
  const tone = SCRIPT_CARD_TONES.has(template?.tone) ? template.tone : "neutral";
  const source = template?.source === "custom" ? "custom" : "builtin";

  return {
    id: String(template?.id || `${source}-${slugifyTemplateName(name) || `template-${fallbackIndex + 1}`}`),
    name,
    text,
    placement,
    tone,
    source
  };
}

function loadScriptCardTemplates() {
  const savedTemplates = Array.isArray(readLocalJson(SCRIPT_CARD_TEMPLATE_STORAGE_KEY, []))
    ? readLocalJson(SCRIPT_CARD_TEMPLATE_STORAGE_KEY, [])
    : [];

  scriptCardTemplates = BUILT_IN_SCRIPT_CARD_TEMPLATES
    .map((template) => hydrateBuiltInScriptCardTemplate(template))
    .map((template, index) => normalizeScriptCardTemplate(template, index))
    .concat(savedTemplates.map((template, index) => normalizeScriptCardTemplate({ ...template, source: "custom" }, index)));
}

function saveCustomScriptCardTemplates() {
  const customTemplates = scriptCardTemplates.filter((template) => template.source === "custom");
  writeLocalJson(SCRIPT_CARD_TEMPLATE_STORAGE_KEY, customTemplates);
}

function getScriptCardTemplate(templateId) {
  return scriptCardTemplates.find((template) => template.id === templateId) || scriptCardTemplates[0] || null;
}

function syncScriptCardTemplateDeletionUi(template = getScriptCardTemplate(ui.scriptCardTemplateSelect?.value)) {
  const isCustomTemplate = template?.source === "custom";

  if (ui.scriptCardTemplateMeta) {
    ui.scriptCardTemplateMeta.textContent = template
      ? t(isCustomTemplate ? "input.cardTemplateCustom" : "input.cardTemplateBuiltin")
      : "";
  }

  if (ui.deleteScriptCardTemplateButton) {
    ui.deleteScriptCardTemplateButton.classList.toggle("hidden", !isCustomTemplate);
    ui.deleteScriptCardTemplateButton.disabled = !isCustomTemplate;
  }
}

function createScriptCardPreviewElement(template) {
  const element = document.createElement(template.placement === "between" ? "span" : "div");
  element.className = "prompt-card";
  element.classList.add(template.placement === "between" ? "prompt-card-between" : "prompt-card-centered");
  element.classList.add(`prompt-card-tone-${template.tone || "neutral"}`);
  applyTextDirection(element, template.text);
  element.textContent = template.text;
  return element;
}

function renderScriptCardPreview() {
  if (!ui.scriptCardPreview) {
    return;
  }

  const template = getCurrentScriptCardTemplate();
  ui.scriptCardPreview.textContent = "";

  if (!template || !template.text) {
    return;
  }

  ui.scriptCardPreview.appendChild(createScriptCardPreviewElement(template));
}

function renderScriptCardTemplateSelect(selectedId = ui.scriptCardTemplateSelect?.value) {
  if (!ui.scriptCardTemplateSelect) {
    return;
  }

  const currentSelection = selectedId || scriptCardTemplates[0]?.id || "";
  ui.scriptCardTemplateSelect.textContent = "";

  const groups = [
    [t("input.cardTemplateBuiltin"), scriptCardTemplates.filter((template) => template.source === "builtin")],
    [t("input.cardTemplateCustom"), scriptCardTemplates.filter((template) => template.source === "custom")]
  ];

  groups.forEach(([label, templates]) => {
    if (templates.length === 0) {
      return;
    }

    const group = document.createElement("optgroup");
    group.label = label;

    templates.forEach((template) => {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = template.name;
      group.append(option);
    });

    ui.scriptCardTemplateSelect.append(group);
  });

  ui.scriptCardTemplateSelect.value = getScriptCardTemplate(currentSelection)?.id || scriptCardTemplates[0]?.id || "";
  syncCustomInputSelects();
}

function deleteCustomScriptCardTemplate(templateId = ui.scriptCardTemplateSelect?.value) {
  const template = getScriptCardTemplate(templateId);
  if (!template || template.source !== "custom") {
    return false;
  }

  scriptCardTemplates = scriptCardTemplates.filter((entry) => entry.id !== template.id || entry.source !== "custom");
  saveCustomScriptCardTemplates();
  renderScriptCardTemplateSelect();
  applySelectedScriptCardTemplate(ui.scriptCardTemplateSelect?.value);
  setScriptCardStatus("input.cardTemplateDeleted");
  return true;
}

function getCurrentScriptCardTemplate() {
  const template = getScriptCardTemplate(ui.scriptCardTemplateSelect?.value);
  if (!template) {
    return null;
  }

  const usesWaitSecondsField = shouldUseWaitSecondsField(template);
  const waitSeconds = normalizeWaitSecondsValue(ui.scriptCardWaitSecondsInput?.value, parseWaitSecondsCardText(template.text)?.seconds || 3);

  return {
    ...template,
    placement: ui.scriptCardPlacementSelect?.value === "between" ? "between" : "centered",
    text: usesWaitSecondsField
      ? buildWaitSecondsCardText(waitSeconds)
      : sanitizeScriptCardText(ui.scriptCardTextInput?.value || template.text)
  };
}

function applySelectedScriptCardTemplate(templateId) {
  const template = getScriptCardTemplate(templateId);
  if (!template) {
    return;
  }

  if (ui.scriptCardTemplateSelect) {
    ui.scriptCardTemplateSelect.value = template.id;
  }
  if (ui.scriptCardPlacementSelect) {
    ui.scriptCardPlacementSelect.value = template.placement;
  }
  if (ui.scriptCardTextInput) {
    ui.scriptCardTextInput.value = template.text;
  }
  if (ui.scriptCardCustomNameInput) {
    ui.scriptCardCustomNameInput.value = template.name;
  }

  syncScriptCardWaitSecondsField(template);
  syncScriptCardTemplateDeletionUi(template);
  syncCustomInputSelects();
  renderScriptCardPreview();
}

function buildScriptCardMarkup(template) {
  return `[card ${template.placement} ${template.tone}]${template.text}[/card]`;
}

function insertScriptCardMarkup(template) {
  const markup = buildScriptCardMarkup(template);
  const start = ui.scriptInput.selectionStart ?? 0;
  const end = ui.scriptInput.selectionEnd ?? start;
  const source = ui.scriptInput.value;
  const before = source.slice(0, start);
  const after = source.slice(end);

  let prefix = "";
  let suffix = "";

  if (template.placement === "between") {
    prefix = before && /\S$/.test(before) ? " " : "";
    suffix = after && /^\S/.test(after) ? " " : "";
  } else {
    prefix = before && !before.endsWith("\n") ? "\n" : "";
    suffix = after && !after.startsWith("\n") ? "\n" : "";
  }

  ui.scriptInput.focus();
  ui.scriptInput.setRangeText(`${prefix}${markup}${suffix}`, start, end, "end");
  persist();
}

function saveCurrentScriptCardTemplate() {
  const template = getCurrentScriptCardTemplate();
  const name = sanitizeScriptCardText(ui.scriptCardCustomNameInput?.value || template?.name || "");

  if (!name) {
    setScriptCardStatus("input.cardTemplateNeedName");
    return;
  }

  if (!template?.text) {
    setScriptCardStatus("input.cardTemplateNeedText");
    return;
  }

  const duplicate = scriptCardTemplates.some((entry) => entry.source === "custom" && entry.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    setScriptCardStatus("input.cardTemplateDuplicate");
    return;
  }

  const savedTemplate = normalizeScriptCardTemplate({
    id: `custom-${slugifyTemplateName(name) || Date.now()}`,
    name,
    text: template.text,
    placement: template.placement,
    tone: template.tone,
    source: "custom"
  }, scriptCardTemplates.length);

  scriptCardTemplates = scriptCardTemplates.concat(savedTemplate);
  saveCustomScriptCardTemplates();
  renderScriptCardTemplateSelect(savedTemplate.id);
  applySelectedScriptCardTemplate(savedTemplate.id);
  setScriptCardStatus("input.cardTemplateSaved");
}

function syncTextDirections() {
  applyTextDirection(ui.scriptInput, ui.scriptInput.value);
  applyTextDirection(ui.groqPromptInput, ui.groqPromptInput.value);
  applyTextDirection(ui.groqUserContextInput, ui.groqUserContextInput.value);
}

function isEditableElement(element) {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }

  return element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName);
}

function getGroqSettingsFromForm() {
  return {
    personality: ui.groqPersonalitySelect.value,
    grammarLevel: ui.groqGrammarLevelSelect.value,
    userContext: ui.groqUserContextInput.value,
    emojiUsage: ui.groqEmojiUsageSelect.value,
    academicWordUsage: ui.groqAcademicWordUsageSelect.value,
    pointOfView: ui.groqPointOfViewSelect.value,
    outputLanguage: ui.groqOutputLanguageSelect.value
  };
}

function syncFromStorage() {
  const latest = loadState();
  state.script = latest.script ?? "";
  state.speed = latest.speed ?? state.speed;
  state.groqKey = latest.groqKey ?? "";
  state.groqPrompt = latest.groqPrompt ?? "";
  state.groq = latest.groq ?? structuredClone(defaultState.groq);
  state.appearance = latest.appearance ?? state.appearance;
  state.language = latest.language ?? state.language;

  ui.scriptInput.value = state.script;
  ui.groqKeyInput.value = state.groqKey;
  ui.groqPromptInput.value = state.groqPrompt;
  ui.groqPersonalitySelect.value = state.groq.personality;
  ui.groqGrammarLevelSelect.value = state.groq.grammarLevel;
  ui.groqEmojiUsageSelect.value = state.groq.emojiUsage;
  ui.groqAcademicWordUsageSelect.value = state.groq.academicWordUsage;
  ui.groqPointOfViewSelect.value = state.groq.pointOfView;
  ui.groqOutputLanguageSelect.value = state.groq.outputLanguage;
  ui.groqUserContextInput.value = state.groq.userContext;
  syncTextDirections();
  applyAppearanceToDocument(state.appearance);
  applyTranslationsToDocument(state.language);
  scriptCardPanelCollapsed = Boolean(readLocalJson(SCRIPT_CARD_PANEL_COLLAPSED_STORAGE_KEY, false));
  loadScriptCardTemplates();
  renderScriptCardTemplateSelect();
  applySelectedScriptCardTemplate(ui.scriptCardTemplateSelect?.value || scriptCardTemplates[0]?.id);
  setScriptCardStatus();
  syncScriptCardBuilderState();
  syncCustomInputSelects();
  refreshMeta();
  setImportStatus("input.importHelp");
  syncGroqImportUi();
}

function refreshMeta() {
  const count = splitWords(ui.scriptInput.value).length;
  const minutes = estimateMinutes(count, state.speed || 120);
  ui.scriptMeta.textContent = t("input.meta", { count, minutes: minutes.toFixed(minutes < 1 ? 1 : 0) });
}

function setImportStatus(key, params = {}) {
  ui.importStatus.textContent = t(key, params);
}

function setGroqImportStatus(key, params = {}) {
  ui.groqImportStatus.textContent = t(key, params);
}

function syncGroqImportUi() {
  const fileName = String(groqImportedFile?.name || "").trim();
  ui.groqImportClearButton?.classList.toggle("hidden", !fileName);

  if (fileName) {
    setGroqImportStatus("input.groqImportAttached", { name: fileName });
    return;
  }

  setGroqImportStatus("input.groqImportHelp");
}

function setActiveInputSection(section = ui.inputSectionSelect?.value || "editor") {
  const activeSection = String(section || "editor");

  if (ui.inputSectionSelect) {
    ui.inputSectionSelect.value = activeSection;
  }

  ui.inputSections.forEach((element) => {
    const selected = element.dataset.inputSection === activeSection;
    element.classList.toggle("hidden", !selected);
    element.setAttribute("aria-hidden", selected ? "false" : "true");
  });

  document.querySelector(".page-shell")?.scrollTo({ top: 0, behavior: "smooth" });
}

function persist() {
  state.script = ui.scriptInput.value;
  state.groqKey = ui.groqKeyInput.value;
  state.groqPrompt = ui.groqPromptInput.value;
  state.groq = getGroqSettingsFromForm();
  syncTextDirections();
  saveState({
    script: state.script,
    groqKey: state.groqKey,
    groqPrompt: state.groqPrompt,
    groq: state.groq
  });
  refreshMeta();
}

function getFileExtension(fileName = "") {
  const parts = String(fileName).toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function getFileNameFromPath(filePath = "") {
  const normalizedPath = String(filePath || "").replace(/\\+/g, "/");
  return normalizedPath.split("/").pop() || "import.txt";
}

function mimeTypeFromFileName(fileName = "") {
  const extension = getFileExtension(fileName);

  if (extension === "pdf") {
    return "application/pdf";
  }

  if (extension === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (extension === "md" || extension === "markdown") {
    return "text/markdown";
  }

  if (extension === "csv") {
    return "text/csv";
  }

  if (extension === "tsv") {
    return "text/tab-separated-values";
  }

  if (extension === "json") {
    return "application/json";
  }

  if (extension === "xml") {
    return "application/xml";
  }

  if (extension === "html" || extension === "htm") {
    return "text/html";
  }

  return "text/plain";
}

function classifyImportFile(file) {
  const extension = getFileExtension(file?.name);
  const mimeType = String(file?.type || "").toLowerCase();

  if (PDF_TEXT_TYPES.has(mimeType) || extension === "pdf") {
    return "pdf";
  }

  if (DOCX_TEXT_TYPES.has(mimeType) || extension === "docx") {
    return "docx";
  }

  if (mimeType.startsWith("text/") || DIRECT_TEXT_EXTENSIONS.has(extension)) {
    return "text";
  }

  return "unsupported";
}

async function loadPdfModule() {
  if (!pdfModulePromise) {
    pdfModulePromise = import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs").then((module) => {
      module.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
      return module;
    });
  }

  return pdfModulePromise;
}

async function loadMammothModule() {
  if (!mammothModulePromise) {
    mammothModulePromise = import("https://cdn.jsdelivr.net/npm/mammoth@1.9.1/+esm");
  }

  return mammothModulePromise;
}

async function extractPdfText(file) {
  const pdfjs = await loadPdfModule();
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = [];
    let currentLine = [];
    let lastY = null;

    content.items.forEach((item) => {
      const text = item?.str || "";
      const currentY = item?.transform?.[5] ?? null;

      if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 4) {
        lines.push(currentLine.join(" ").trim());
        currentLine = [];
      }

      if (text.trim()) {
        currentLine.push(text.trim());
      }

      lastY = currentY;
    });

    if (currentLine.length > 0) {
      lines.push(currentLine.join(" ").trim());
    }

    pages.push(lines.filter(Boolean).join("\n"));
  }

  return pages.filter(Boolean).join("\n\n");
}

async function extractDocxText(file) {
  const mammoth = await loadMammothModule();
  const bytes = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: bytes });
  return result.value || "";
}

async function extractImportedText(file) {
  const fileKind = classifyImportFile(file);

  if (fileKind === "unsupported") {
    throw new Error("unsupported");
  }

  if (fileKind === "pdf") {
    return extractPdfText(file);
  }

  if (fileKind === "docx") {
    return extractDocxText(file);
  }

  return decodeTextBytes(await file.arrayBuffer());
}

async function readImportedText(file) {
  const text = (await extractImportedText(file)).trim();

  if (!text) {
    throw new Error("empty");
  }

  return text;
}

async function importFile(file) {
  if (!file) {
    return;
  }

  setImportStatus("input.importing", { name: file.name });

  try {
    const text = await readImportedText(file);
    ui.scriptInput.value = text;
    persist();
    ui.scriptInput.focus();
    setImportStatus("input.imported", { name: file.name });
  } catch (error) {
    console.error(error);
    setImportStatus(error?.message === "unsupported" ? "input.importUnsupported" : "input.importFailed");
  }
}

async function createImportedFileFromPath(filePath) {
  if (!invoke) {
    throw new Error("unsupported");
  }

  const payload = await invoke("read_import_file", { path: filePath });
  const name = payload?.name || getFileNameFromPath(filePath);
  const bytes = Array.isArray(payload?.bytes) ? new Uint8Array(payload.bytes) : new Uint8Array();

  if (bytes.length === 0) {
    throw new Error("empty");
  }

  return new File([bytes], name, { type: mimeTypeFromFileName(name) });
}

async function importDroppedPath(filePath) {
  const file = await createImportedFileFromPath(filePath);
  await importFile(file);
}

async function importFileToGroq(file) {
  if (!file) {
    return;
  }

  setGroqImportStatus("input.groqImporting", { name: file.name });

  try {
    const text = await readImportedText(file);
    groqImportedFile = {
      name: file.name,
      text
    };
    syncGroqImportUi();
    ui.groqPromptInput.focus();
  } catch (error) {
    console.error(error);
    setGroqImportStatus(error?.message === "unsupported" ? "input.importUnsupported" : "input.groqImportFailed");
  }
}

function clearGroqImportedFile() {
  groqImportedFile = null;
  if (ui.groqImportInput) {
    ui.groqImportInput.value = "";
  }
  syncGroqImportUi();
}

function handleDroppedFiles(event) {
  const files = Array.from(event.dataTransfer?.files || []);
  ui.scriptInput.classList.remove("is-dragover");
  ui.scriptEditorCard?.classList.remove("is-dragover");

  if (files.length > 0) {
    importFile(files[0]).catch(console.error);
  }
}

function eventHasFiles(event) {
  const dataTransfer = event?.dataTransfer;
  if (!dataTransfer) {
    return false;
  }

  if ((dataTransfer.files?.length || 0) > 0) {
    return true;
  }

  if (Array.from(dataTransfer.items || []).some((item) => item.kind === "file")) {
    return true;
  }

  return Array.from(dataTransfer.types || []).includes("Files");
}

function showDropTarget() {
  ui.scriptInput.classList.add("is-dragover");
  ui.scriptEditorCard?.classList.add("is-dragover");
  setImportStatus("input.importHelp");
}

function hideDropTarget() {
  ui.scriptInput.classList.remove("is-dragover");
  ui.scriptEditorCard?.classList.remove("is-dragover");
}

async function registerNativeFileDrop() {
  if (!tauriWindow?.getCurrentWindow) {
    return;
  }

  const appWindow = tauriWindow.getCurrentWindow();

  if (typeof appWindow?.onDragDropEvent !== "function") {
    return;
  }

  nativeDropUnlisten = await appWindow.onDragDropEvent(async (event) => {
    const payload = event?.payload;

    if (!payload?.type) {
      return;
    }

    if (payload.type === "enter" || payload.type === "over") {
      showDropTarget();
      return;
    }

    if (payload.type === "leave") {
      hideDropTarget();
      return;
    }

    if (payload.type === "drop") {
      hideDropTarget();

      const [filePath] = payload.paths || [];
      if (!filePath) {
        return;
      }

      try {
        await importDroppedPath(filePath);
      } catch (error) {
        console.error(error);
        setImportStatus(error?.message === "unsupported" ? "input.importUnsupported" : "input.importFailed");
      }
    }
  });
}

function wrapSelection(before, after = before, fallbackText = "text") {
  const start = ui.scriptInput.selectionStart ?? 0;
  const end = ui.scriptInput.selectionEnd ?? start;
  const selectedText = ui.scriptInput.value.slice(start, end) || fallbackText;
  const wrappedText = `${before}${selectedText}${after}`;

  ui.scriptInput.focus();
  ui.scriptInput.setRangeText(wrappedText, start, end, "select");
  ui.scriptInput.setSelectionRange(start + before.length, start + before.length + selectedText.length);
  persist();
}

async function useGroq() {
  const key = ui.groqKeyInput.value.trim();
  const instruction = ui.groqPromptInput.value.trim();
  const script = ui.scriptInput.value.trim();
  const sourceText = String(groqImportedFile?.text || "").trim() || script;

  if (!key) {
    ui.groqStatus.textContent = t("input.needKey");
    return;
  }

  if (!instruction && !sourceText) {
    ui.groqStatus.textContent = t("input.needInstructionOrScript");
    return;
  }

  const request = buildGroqRequest({
    instruction,
    script: sourceText,
    groqSettings: getGroqSettingsFromForm(),
    appLanguage: state.language
  });

  ui.groqStatus.textContent = t("input.thinking");
  ui.groqButton.disabled = true;

  try {
    const text = await generateWithGroq(key, request);

    ui.scriptInput.value = text;
    persist();
    ui.groqStatus.textContent = t("input.groqUpdated");
  } catch (error) {
    ui.groqStatus.textContent = error.message || t("input.groqFailed");
  } finally {
    ui.groqButton.disabled = false;
  }
}

function bootInputPage() {
  initializeCustomInputSelects();
  syncFromStorage();
  setActiveInputSection(ui.inputSectionSelect?.value || "editor");
  registerNativeFileDrop().catch(console.error);

  ui.inputSectionSelect?.addEventListener("input", () => {
    setActiveInputSection(ui.inputSectionSelect.value);
  });
  ui.inputSectionSelect?.addEventListener("change", () => {
    setActiveInputSection(ui.inputSectionSelect.value);
  });

  ui.formatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      wrapSelection(button.dataset.wrapBefore || "", button.dataset.wrapAfter || "", button.dataset.placeholder || "text");
    });
  });

  ui.scriptCardTemplateSelect?.addEventListener("change", () => {
    applySelectedScriptCardTemplate(ui.scriptCardTemplateSelect.value);
  });
  ui.deleteScriptCardTemplateButton?.addEventListener("click", () => {
    deleteCustomScriptCardTemplate();
  });
  ui.scriptCardPlacementSelect?.addEventListener("change", renderScriptCardPreview);
  ui.scriptCardTextInput?.addEventListener("input", renderScriptCardPreview);
  ui.scriptCardWaitSecondsInput?.addEventListener("input", () => {
    if (ui.scriptCardWaitSecondsInput) {
      ui.scriptCardWaitSecondsInput.value = ui.scriptCardWaitSecondsInput.value.replace(/[^0-9]/g, "");
    }

    applyScriptCardWaitSecondsValue(ui.scriptCardWaitSecondsInput?.value);
  });
  ui.scriptCardWaitSecondsInput?.addEventListener("blur", () => {
    if (!ui.scriptCardWaitSecondsInput) {
      return;
    }

    applyScriptCardWaitSecondsValue(ui.scriptCardWaitSecondsInput.value);
  });
  ui.scriptCardWaitIncrementButton?.addEventListener("click", () => {
    applyScriptCardWaitSecondsValue((Number(ui.scriptCardWaitSecondsInput?.value) || 0) + 1);
    ui.scriptCardWaitSecondsInput?.focus();
  });
  ui.scriptCardWaitDecrementButton?.addEventListener("click", () => {
    applyScriptCardWaitSecondsValue(Math.max((Number(ui.scriptCardWaitSecondsInput?.value) || 1) - 1, 1));
    ui.scriptCardWaitSecondsInput?.focus();
  });
  ui.toggleScriptCardBuilderButton?.addEventListener("click", () => {
    setScriptCardBuilderCollapsed(!scriptCardPanelCollapsed);
  });
  ui.addScriptCardButton?.addEventListener("click", () => {
    const template = getCurrentScriptCardTemplate();
    if (!template?.text) {
      setScriptCardStatus("input.cardTemplateNeedText");
      return;
    }

    insertScriptCardMarkup(template);
    setScriptCardStatus("input.saved");
  });
  ui.saveScriptCardTemplateButton?.addEventListener("click", saveCurrentScriptCardTemplate);

  ui.scriptInput.addEventListener("input", persist);
  ui.uploadFileButton.addEventListener("click", () => {
    ui.uploadFileInput.click();
  });
  ui.uploadFileInput.addEventListener("change", () => {
    const [file] = ui.uploadFileInput.files || [];
    importFile(file).catch(console.error).finally(() => {
      ui.uploadFileInput.value = "";
    });
  });
  ui.groqImportButton?.addEventListener("click", () => {
    ui.groqImportInput?.click();
  });
  ui.groqImportInput?.addEventListener("change", () => {
    const [file] = ui.groqImportInput.files || [];
    importFileToGroq(file).catch(console.error).finally(() => {
      if (ui.groqImportInput) {
        ui.groqImportInput.value = "";
      }
    });
  });
  ui.groqImportClearButton?.addEventListener("click", clearGroqImportedFile);
  ["dragenter", "dragover"].forEach((eventName) => {
    window.addEventListener(eventName, (event) => {
      if (!eventHasFiles(event)) {
        return;
      }

      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }

      showDropTarget();
    });
  });
  ["dragleave", "dragend"].forEach((eventName) => {
    window.addEventListener(eventName, (event) => {
      if (!eventHasFiles(event)) {
        return;
      }

      const relatedTarget = event.relatedTarget;
      if (relatedTarget && document.body.contains(relatedTarget)) {
        return;
      }

      hideDropTarget();
    });
  });
  window.addEventListener("drop", (event) => {
    if (!eventHasFiles(event)) {
      return;
    }

    event.preventDefault();
    handleDroppedFiles(event);
  });
  ["dragover", "drop"].forEach((eventName) => {
    window.addEventListener(eventName, (event) => {
      if (eventHasFiles(event)) {
        event.preventDefault();
      }
    });
  });
  ui.groqKeyInput.addEventListener("input", persist);
  ui.groqPromptInput.addEventListener("input", persist);
  [
    ui.groqPersonalitySelect,
    ui.groqGrammarLevelSelect,
    ui.groqEmojiUsageSelect,
    ui.groqAcademicWordUsageSelect,
    ui.groqPointOfViewSelect,
    ui.groqOutputLanguageSelect
  ].forEach((input) => {
    input.addEventListener("input", persist);
    input.addEventListener("change", persist);
  });
  ui.groqUserContextInput.addEventListener("input", persist);
  ui.saveScriptButton.addEventListener("click", () => {
    persist();
    ui.groqStatus.textContent = t("input.preferencesSaved");
  });
  ui.groqButton.addEventListener("click", useGroq);
  ui.closeWindowButton.addEventListener("click", () => {
    if (!invoke) {
      return;
    }

    invokeAfterDesktopFadeOut("hide_aux_window", { kind: "input" }).catch(console.error);
  });
  ui.openSettingsButton.addEventListener("click", () => {
    invoke?.("open_aux_window", { kind: "settings" }).catch(console.error);
  });
  document.addEventListener("click", (event) => {
    customInputSelectControllers.forEach((controller) => {
      if (!controller.picker.contains(event.target)) {
        closeCustomInputSelect(controller);
      }
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      customInputSelectControllers.forEach((controller) => closeCustomInputSelect(controller));
    }
  });
  window.addEventListener("focus", syncFromStorage);
  window.addEventListener("storage", syncFromStorage);
  window.addEventListener("flow-state-updated", () => {
    if (isEditableElement(document.activeElement)) {
      return;
    }

    syncFromStorage();
  });

  initializeDesktopWindowOpacityFade();
  initializeSmoothScrollbox();
}

window.addEventListener("beforeunload", () => {
  nativeDropUnlisten?.();
  nativeDropUnlisten = null;
});

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", bootInputPage, { once: true });
} else {
  bootInputPage();
}
