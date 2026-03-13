import { applyAppearanceToDocument, applyTextDirection, applyTranslationsToDocument, estimateMinutes, generateWithGroq, loadState, saveState, splitWords, translate } from "./shared.js";

const invoke = window.__TAURI__?.core?.invoke;

const state = loadState();

const ui = {
  scriptInput: document.querySelector("#scriptInput"),
  scriptMeta: document.querySelector("#scriptMeta"),
  formatButtons: document.querySelectorAll("[data-wrap-before]"),
  groqKeyInput: document.querySelector("#groqKeyInput"),
  groqPromptInput: document.querySelector("#groqPromptInput"),
  groqButton: document.querySelector("#groqButton"),
  saveScriptButton: document.querySelector("#saveScriptButton"),
  groqStatus: document.querySelector("#groqStatus"),
  closeWindowButton: document.querySelector("#closeWindowButton"),
  openSettingsButton: document.querySelector("#openSettingsButton")
};

function t(key, params = {}) {
  return translate(key, state.language, params);
}

function syncTextDirections() {
  applyTextDirection(ui.scriptInput, ui.scriptInput.value);
  applyTextDirection(ui.groqPromptInput, ui.groqPromptInput.value);
}

function syncFromStorage() {
  const latest = loadState();
  state.script = latest.script ?? "";
  state.speed = latest.speed ?? state.speed;
  state.groqKey = latest.groqKey ?? latest.geminiKey ?? "";
  state.groqPrompt = latest.groqPrompt ?? latest.geminiPrompt ?? "";
  state.appearance = latest.appearance ?? state.appearance;
  state.language = latest.language ?? state.language;

  ui.scriptInput.value = state.script;
  ui.groqKeyInput.value = state.groqKey;
  ui.groqPromptInput.value = state.groqPrompt;
  syncTextDirections();
  applyAppearanceToDocument(state.appearance);
  applyTranslationsToDocument(state.language);
  refreshMeta();
}

function refreshMeta() {
  const count = splitWords(ui.scriptInput.value).length;
  const minutes = estimateMinutes(count, state.speed || 120);
  ui.scriptMeta.textContent = t("input.meta", { count, minutes: minutes.toFixed(minutes < 1 ? 1 : 0) });
}

function persist() {
  state.script = ui.scriptInput.value;
  state.groqKey = ui.groqKeyInput.value;
  state.groqPrompt = ui.groqPromptInput.value;
  syncTextDirections();
  saveState({
    script: state.script,
    groqKey: state.groqKey,
    groqPrompt: state.groqPrompt
  });
  refreshMeta();
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

  if (!key) {
    ui.groqStatus.textContent = t("input.needKey");
    return;
  }

  if (!instruction && !script) {
    ui.groqStatus.textContent = t("input.needInstructionOrScript");
    return;
  }

  const request = [
    "You are editing or generating teleprompter text.",
    "Always follow the user's instruction exactly.",
    "If existing teleprompter text is provided, use it as the source text and rewrite or transform it according to the user's instruction.",
    "If no existing teleprompter text is provided, generate new teleprompter text from the user's instruction only.",
    "Match the language requested by the user. If the user asks for Arabic, write fully in Arabic.",
    "Do not invent a random topic unless the user explicitly asks for one.",
    "Return only the final teleprompter text.",
    "Do not include any intro, label, explanation, notes, or quotation marks.",
    `USER INSTRUCTION:\n${instruction || "Use the existing teleprompter text and improve it for teleprompter delivery."}`,
    script ? `\nEXISTING TELEPROMPTER TEXT:\n${script}` : ""
  ].filter(Boolean).join("\n\n");

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

window.addEventListener("DOMContentLoaded", () => {
  syncFromStorage();

  ui.formatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      wrapSelection(button.dataset.wrapBefore || "", button.dataset.wrapAfter || "", button.dataset.placeholder || "text");
    });
  });

  ui.scriptInput.addEventListener("input", persist);
  ui.groqKeyInput.addEventListener("input", persist);
  ui.groqPromptInput.addEventListener("input", persist);
  ui.saveScriptButton.addEventListener("click", () => {
    persist();
    ui.groqStatus.textContent = t("input.saved");
  });
  ui.groqButton.addEventListener("click", useGroq);
  ui.closeWindowButton.addEventListener("click", () => {
    invoke?.("hide_aux_window", { kind: "input" }).catch(console.error);
  });
  ui.openSettingsButton.addEventListener("click", () => {
    invoke?.("open_aux_window", { kind: "settings" }).catch(console.error);
  });
  window.addEventListener("focus", syncFromStorage);
  window.addEventListener("storage", syncFromStorage);
  window.addEventListener("flow-state-updated", syncFromStorage);
});
