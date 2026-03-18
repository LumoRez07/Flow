import { applyAppearanceToDocument, applyTextDirection, applyTranslationsToDocument, estimateMinutes, generateWithGroq, loadState, saveState, splitWords, translate } from "./shared.js";

const invoke = window.__TAURI__?.core?.invoke;
const tauriWindow = window.__TAURI__?.window;

const state = loadState();

const ui = {
  scriptEditorCard: document.querySelector("#scriptEditorCard"),
  scriptInput: document.querySelector("#scriptInput"),
  scriptMeta: document.querySelector("#scriptMeta"),
  formatButtons: document.querySelectorAll("[data-wrap-before]"),
  uploadFileButton: document.querySelector("#uploadFileButton"),
  uploadFileInput: document.querySelector("#uploadFileInput"),
  importStatus: document.querySelector("#importStatus"),
  groqKeyInput: document.querySelector("#groqKeyInput"),
  groqPromptInput: document.querySelector("#groqPromptInput"),
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
  setImportStatus("input.importHelp");
}

function refreshMeta() {
  const count = splitWords(ui.scriptInput.value).length;
  const minutes = estimateMinutes(count, state.speed || 120);
  ui.scriptMeta.textContent = t("input.meta", { count, minutes: minutes.toFixed(minutes < 1 ? 1 : 0) });
}

function setImportStatus(key, params = {}) {
  ui.importStatus.textContent = t(key, params);
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

  return file.text();
}

async function importFile(file) {
  if (!file) {
    return;
  }

  setImportStatus("input.importing", { name: file.name });

  try {
    const text = (await extractImportedText(file)).trim();
    if (!text) {
      throw new Error("empty");
    }

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
  registerNativeFileDrop().catch(console.error);

  ui.formatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      wrapSelection(button.dataset.wrapBefore || "", button.dataset.wrapAfter || "", button.dataset.placeholder || "text");
    });
  });

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

window.addEventListener("beforeunload", () => {
  nativeDropUnlisten?.();
  nativeDropUnlisten = null;
});
