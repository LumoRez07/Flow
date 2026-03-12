import { estimateMinutes, generateWithGroq, loadState, saveState, splitWords } from "./shared.js";

const invoke = window.__TAURI__?.core?.invoke;

const state = loadState();

const ui = {
  scriptInput: document.querySelector("#scriptInput"),
  scriptMeta: document.querySelector("#scriptMeta"),
  groqKeyInput: document.querySelector("#groqKeyInput"),
  groqPromptInput: document.querySelector("#groqPromptInput"),
  groqButton: document.querySelector("#groqButton"),
  saveScriptButton: document.querySelector("#saveScriptButton"),
  groqStatus: document.querySelector("#groqStatus"),
  closeWindowButton: document.querySelector("#closeWindowButton"),
  openSettingsButton: document.querySelector("#openSettingsButton")
};

function syncFromStorage() {
  const latest = loadState();
  state.script = latest.script || "";
  state.speed = latest.speed || state.speed;
  state.groqKey = latest.groqKey || latest.geminiKey || "";
  state.groqPrompt = latest.groqPrompt || latest.geminiPrompt || "";

  ui.scriptInput.value = state.script;
  ui.groqKeyInput.value = state.groqKey;
  ui.groqPromptInput.value = state.groqPrompt;
  refreshMeta();
}

function refreshMeta() {
  const count = splitWords(ui.scriptInput.value).length;
  const minutes = estimateMinutes(count, state.speed || 120);
  ui.scriptMeta.textContent = `${count} words · ${minutes.toFixed(minutes < 1 ? 1 : 0)} min read`;
}

function persist() {
  state.script = ui.scriptInput.value;
  state.groqKey = ui.groqKeyInput.value.trim();
  state.groqPrompt = ui.groqPromptInput.value.trim();
  saveState(state);
  refreshMeta();
}

async function useGroq() {
  const key = ui.groqKeyInput.value.trim();
  const instruction = ui.groqPromptInput.value.trim();
  const script = ui.scriptInput.value.trim();

  if (!key) {
    ui.groqStatus.textContent = "Add your Groq API key first.";
    return;
  }

  if (!script) {
    ui.groqStatus.textContent = "Add some script text first.";
    return;
  }

  ui.groqStatus.textContent = "Thinking...";
  ui.groqButton.disabled = true;

  try {
    const text = await generateWithGroq(
      key,
      instruction || "Rewrite this into a clean teleprompter script that is easy to read aloud.",
      script
    );

    ui.scriptInput.value = text;
    persist();
    ui.groqStatus.textContent = "Groq updated your script.";
  } catch (error) {
    ui.groqStatus.textContent = error.message || "Groq request failed.";
  } finally {
    ui.groqButton.disabled = false;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  syncFromStorage();

  ui.scriptInput.addEventListener("input", persist);
  ui.groqKeyInput.addEventListener("input", persist);
  ui.groqPromptInput.addEventListener("input", persist);
  ui.saveScriptButton.addEventListener("click", () => {
    persist();
    ui.groqStatus.textContent = "Saved locally.";
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
});
