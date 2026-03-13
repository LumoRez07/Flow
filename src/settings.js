import { applyAppearanceToDocument, applyTranslationsToDocument, defaultState, loadState, saveState, translate } from "./shared.js";

const MIN_WIDTH = 400;
const MIN_HEIGHT = 200;
const MAX_WIDTH_FALLBACK = 2200;
const MAX_HEIGHT_FALLBACK = 1400;
const POSITION_PADDING = 600;
const APPLY_DELAY = 70;

const invoke = window.__TAURI__?.core?.invoke;
const tauriWindow = window.__TAURI__?.window;
const tauriDpi = window.__TAURI__?.dpi;

const state = loadState();
state.window = state.window || structuredClone(defaultState.window);

const ui = {
  xInput: document.querySelector("#xInput"),
  xValue: document.querySelector("#xValue"),
  yInput: document.querySelector("#yInput"),
  yValue: document.querySelector("#yValue"),
  widthInput: document.querySelector("#widthInput"),
  widthValue: document.querySelector("#widthValue"),
  heightInput: document.querySelector("#heightInput"),
  heightValue: document.querySelector("#heightValue"),
  presetSelect: document.querySelector("#presetSelect"),
  modeSelect: document.querySelector("#modeSelect"),
  fontSelect: document.querySelector("#fontSelect"),
  languageSelect: document.querySelector("#languageSelect"),
  languagePicker: document.querySelector("#languagePicker"),
  languageTrigger: document.querySelector("#languageTrigger"),
  languageTriggerFlag: document.querySelector("#languageTriggerFlag"),
  languageTriggerLabel: document.querySelector("#languageTriggerLabel"),
  languageMenu: document.querySelector("#languageMenu"),
  languageOptions: document.querySelectorAll(".language-option"),
  appOpacityInput: document.querySelector("#appOpacityInput"),
  appOpacityValue: document.querySelector("#appOpacityValue"),
  textSizeInput: document.querySelector("#textSizeInput"),
  textSizeValue: document.querySelector("#textSizeValue"),
  themeSelect: document.querySelector("#themeSelect"),
  performanceModeInput: document.querySelector("#performanceModeInput"),
  textColorInput: document.querySelector("#textColorInput"),
  textOpacityInput: document.querySelector("#textOpacityInput"),
  textOpacityValue: document.querySelector("#textOpacityValue"),
  windowStatus: document.querySelector("#windowStatus"),
  closeWindowButton: document.querySelector("#closeWindowButton"),
  openTextButton: document.querySelector("#openTextButton")
};

let applyTimer = null;
let isSyncingForm = false;
let isApplying = false;

function t(key, params = {}) {
  return translate(key, state.language, params);
}

function closeLanguageMenu() {
  ui.languageMenu.classList.add("hidden");
  ui.languageTrigger.setAttribute("aria-expanded", "false");
  ui.languagePicker.classList.remove("is-open");
}

function openLanguageMenu() {
  ui.languageMenu.classList.remove("hidden");
  ui.languageTrigger.setAttribute("aria-expanded", "true");
  ui.languagePicker.classList.add("is-open");
}

function renderLanguagePicker(selectedValue = ui.languageSelect.value, previewLanguage = state.language) {
  const activeLanguage = selectedValue || defaultState.language;
  ui.languageTriggerFlag.dataset.flag = activeLanguage;
  ui.languageTriggerLabel.textContent = translate(`language.${activeLanguage}`, previewLanguage);

  ui.languageOptions.forEach((option) => {
    const value = option.dataset.value;
    const selected = value === activeLanguage;
    option.setAttribute("aria-selected", selected ? "true" : "false");
    option.classList.toggle("is-selected", selected);
    option.querySelector("[data-language-label]").textContent = translate(`language.${value}`, previewLanguage);
  });
}

function clampToInput(input, value) {
  const min = Number(input.min || Number.NEGATIVE_INFINITY);
  const max = Number(input.max || Number.POSITIVE_INFINITY);
  return Math.min(Math.max(value, min), max);
}

function setSliderValue(input, value) {
  input.value = String(clampToInput(input, value));
}

function updateValueLabels() {
  ui.xValue.textContent = `${ui.xInput.value} px`;
  ui.yValue.textContent = `${ui.yInput.value} px`;
  ui.widthValue.textContent = `${ui.widthInput.value} px`;
  ui.heightValue.textContent = `${ui.heightInput.value} px`;
  ui.appOpacityValue.textContent = `${ui.appOpacityInput.value}%`;
  ui.textSizeValue.textContent = `${ui.textSizeInput.value}%`;
  ui.textOpacityValue.textContent = `${ui.textOpacityInput.value}%`;
}

function updatePositioningAvailability() {
  const disabled = ui.presetSelect.value !== "custom";
  ui.xInput.disabled = disabled;
  ui.yInput.disabled = disabled;
}

function updateAppearanceAvailability() {
  ui.modeSelect.disabled = ui.performanceModeInput.checked;
}

async function getMainWindow() {
  if (!tauriWindow?.getAllWindows) return null;
  const windows = await tauriWindow.getAllWindows();
  return windows.find((windowRef) => windowRef.label === "main") || windows[0] || null;
}

async function getRelevantMonitor() {
  if (!tauriWindow?.currentMonitor && !tauriWindow?.primaryMonitor) {
    return null;
  }

  return (await tauriWindow.currentMonitor?.()) ?? (await tauriWindow.primaryMonitor?.()) ?? null;
}

async function configureSliderRanges() {
  const monitor = await getRelevantMonitor();
  const monitorWidth = monitor?.size?.width ?? 1920;
  const monitorHeight = monitor?.size?.height ?? 1080;
  const originX = monitor?.position?.x ?? 0;
  const originY = monitor?.position?.y ?? 0;

  ui.xInput.min = String(originX - monitorWidth - POSITION_PADDING);
  ui.xInput.max = String(originX + monitorWidth + POSITION_PADDING);
  ui.yInput.min = String(originY - monitorHeight - POSITION_PADDING);
  ui.yInput.max = String(originY + monitorHeight + POSITION_PADDING);
  ui.widthInput.max = String(Math.max(monitorWidth, MAX_WIDTH_FALLBACK));
  ui.heightInput.max = String(Math.max(monitorHeight, MAX_HEIGHT_FALLBACK));
}

function fillForm() {
  isSyncingForm = true;
  setSliderValue(ui.xInput, state.window.x ?? 0);
  setSliderValue(ui.yInput, state.window.y ?? 0);
  setSliderValue(ui.widthInput, state.window.width);
  setSliderValue(ui.heightInput, state.window.height);
  ui.presetSelect.value = state.window.preset || "top-center";
  ui.modeSelect.value = state.appearance?.mode || defaultState.appearance.mode;
  ui.fontSelect.value = state.appearance?.fontFamily || defaultState.appearance.fontFamily;
  ui.languageSelect.value = state.language || defaultState.language;
  setSliderValue(ui.appOpacityInput, state.appearance?.appOpacity ?? defaultState.appearance.appOpacity);
  ui.textSizeInput.value = String(state.appearance?.textScale || defaultState.appearance.textScale);
  ui.themeSelect.value = state.appearance?.theme || defaultState.appearance.theme;
  ui.performanceModeInput.checked = Boolean(state.appearance?.performanceMode);
  ui.textColorInput.value = state.appearance?.textColor || defaultState.appearance.textColor;
  ui.textOpacityInput.value = String(state.appearance?.textOpacity || defaultState.appearance.textOpacity);
  updatePositioningAvailability();
  updateAppearanceAvailability();
  updateValueLabels();
  applyAppearanceToDocument({
    theme: ui.themeSelect.value,
    performanceMode: ui.performanceModeInput.checked,
    appOpacity: Number(ui.appOpacityInput.value)
  });
  applyTranslationsToDocument(ui.languageSelect.value);
  renderLanguagePicker(ui.languageSelect.value, ui.languageSelect.value);
  isSyncingForm = false;
}

async function readCurrentWindow() {
  const appWindow = await getMainWindow();
  if (!appWindow) return;

  await configureSliderRanges();

  const size = await appWindow.outerSize();
  const pos = await appWindow.outerPosition();

  state.window.width = size.width;
  state.window.height = size.height;
  state.window.x = pos.x;
  state.window.y = pos.y;
  saveState({
    window: {
      width: state.window.width,
      height: state.window.height,
      x: state.window.x,
      y: state.window.y,
      preset: state.window.preset
    }
  });
  fillForm();
  ui.windowStatus.textContent = t("settings.synced");
}

function collectFormState() {
  state.window.width = Math.max(Number(ui.widthInput.value) || defaultState.window.width, MIN_WIDTH);
  state.window.height = Math.max(Number(ui.heightInput.value) || defaultState.window.height, MIN_HEIGHT);
  state.window.x = Number(ui.xInput.value || 0);
  state.window.y = Number(ui.yInput.value || 0);
  state.window.preset = ui.presetSelect.value;
  state.language = ui.languageSelect.value;
  state.appearance = {
    ...defaultState.appearance,
    ...(state.appearance || {}),
    mode: ui.modeSelect.value,
    fontFamily: ui.fontSelect.value,
    appOpacity: Number(ui.appOpacityInput.value),
    textScale: Number(ui.textSizeInput.value),
    theme: ui.themeSelect.value,
    performanceMode: ui.performanceModeInput.checked,
    textColor: ui.textColorInput.value,
    textOpacity: Number(ui.textOpacityInput.value)
  };
}

async function applyWindowSettings() {
  if (isApplying) return;

  const appWindow = await getMainWindow();
  if (!appWindow || !tauriDpi) return;

  isApplying = true;

  try {
    collectFormState();
    await appWindow.setSize(new tauriDpi.LogicalSize(state.window.width, state.window.height));

    if (state.window.preset === "center") {
      await appWindow.center();
      const pos = await appWindow.outerPosition();
      state.window.x = pos.x;
      state.window.y = pos.y;
    } else if (state.window.preset === "top-center" && tauriWindow.currentMonitor && tauriWindow.primaryMonitor) {
      const monitor = (await tauriWindow.currentMonitor()) ?? (await tauriWindow.primaryMonitor());
      if (monitor) {
        const outer = await appWindow.outerSize();
        const x = monitor.position.x + Math.round((monitor.size.width - outer.width) / 2);
        const y = monitor.position.y;
        await appWindow.setPosition(new tauriDpi.PhysicalPosition(x, y));
        state.window.x = x;
        state.window.y = y;
      }
    } else {
      await appWindow.setPosition(new tauriDpi.LogicalPosition(state.window.x, state.window.y));
    }

    saveState({
      window: {
        width: state.window.width,
        height: state.window.height,
        x: state.window.x,
        y: state.window.y,
        preset: state.window.preset
      },
      language: state.language,
      appearance: state.appearance
    });
    fillForm();
    ui.windowStatus.textContent = t("settings.applied");
  } finally {
    isApplying = false;
  }
}

function scheduleApply() {
  updatePositioningAvailability();
  updateAppearanceAvailability();
  updateValueLabels();

  if (isSyncingForm) {
    return;
  }

  clearTimeout(applyTimer);
  applyTimer = window.setTimeout(() => {
    applyWindowSettings().catch(console.error);
  }, APPLY_DELAY);
}

window.addEventListener("DOMContentLoaded", async () => {
  await configureSliderRanges();
  fillForm();

  [ui.xInput, ui.yInput, ui.widthInput, ui.heightInput, ui.appOpacityInput, ui.textSizeInput, ui.textOpacityInput].forEach((input) => {
    input.addEventListener("input", scheduleApply);
  });

  [ui.presetSelect, ui.modeSelect, ui.fontSelect, ui.languageSelect, ui.themeSelect, ui.textColorInput].forEach((input) => {
    input.addEventListener("input", scheduleApply);
    input.addEventListener("change", scheduleApply);
  });

  ui.languageTrigger.addEventListener("click", () => {
    if (ui.languageMenu.classList.contains("hidden")) {
      openLanguageMenu();
      return;
    }

    closeLanguageMenu();
  });

  ui.languageOptions.forEach((option) => {
    option.addEventListener("click", () => {
      ui.languageSelect.value = option.dataset.value;
      state.language = option.dataset.value;
      applyTranslationsToDocument(state.language);
      renderLanguagePicker(option.dataset.value, option.dataset.value);
      closeLanguageMenu();
      scheduleApply();
    });
  });

  document.addEventListener("click", (event) => {
    if (!ui.languagePicker.contains(event.target)) {
      closeLanguageMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLanguageMenu();
    }
  });
  ui.performanceModeInput.addEventListener("input", scheduleApply);
  ui.performanceModeInput.addEventListener("change", scheduleApply);

  ui.closeWindowButton.addEventListener("click", () => {
    invoke?.("hide_aux_window", { kind: "settings" }).catch(console.error);
  });
  ui.openTextButton.addEventListener("click", () => {
    invoke?.("open_aux_window", { kind: "input" }).catch(console.error);
  });

  await readCurrentWindow().catch(console.error);

  window.addEventListener("focus", async () => {
    Object.assign(state, loadState());
    await configureSliderRanges();
    await readCurrentWindow().catch(console.error);
    fillForm();
  });
  window.addEventListener("storage", () => {
    Object.assign(state, loadState());
    fillForm();
  });
  window.addEventListener("flow-state-updated", () => {
    Object.assign(state, loadState());
    fillForm();
  });
});
