import { CLOUD_RELAY_URL } from "./remote-config.js";
import {
  applyAppearanceToDocument,
  applyTranslationsToDocument,
  defaultState,
  getThemeTeleprompterTextColor,
  loadVoiceModelRegistry,
  loadState,
  normalizeVoiceLanguage,
  saveState,
  saveVoiceModelRegistry,
  translate,
  VOICE_LANGUAGE_OPTIONS
} from "./shared.js";

const MIN_WIDTH = 400;
const MIN_HEIGHT = 200;
const COLLAPSED_HEIGHT = 56;
const MAX_WIDTH_FALLBACK = 2200;
const MAX_HEIGHT_FALLBACK = 1400;
const POSITION_PADDING = 600;
const APPLY_DELAY = 70;
const TOP_CENTER_X_OFFSET = 32;
const REMOTE_STATUS_REFRESH_MS = 20_000;

const tauriCore = window.__TAURI__?.core;
const invoke = tauriCore?.invoke;
const tauriWindow = window.__TAURI__?.window;
const tauriDpi = window.__TAURI__?.dpi;
const tauriEvent = window.__TAURI__?.event;

const state = loadState();
state.window = state.window || structuredClone(defaultState.window);
state.desktop = state.desktop || structuredClone(defaultState.desktop);
state.remote = state.remote || structuredClone(defaultState.remote);

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
  voiceLanguageGroup: document.querySelector("#voiceLanguageGroup"),
  voiceLanguageSelect: document.querySelector("#voiceLanguageSelect"),
  voiceModelCard: document.querySelector("#voiceModelCard"),
  voiceModelBadge: document.querySelector("#voiceModelBadge"),
  voiceModelSelectedLabel: document.querySelector("#voiceModelSelectedLabel"),
  voiceModelHint: document.querySelector("#voiceModelHint"),
  voiceModelPath: document.querySelector("#voiceModelPath"),
  voiceModelProgress: document.querySelector("#voiceModelProgress"),
  voiceModelProgressFill: document.querySelector("#voiceModelProgressFill"),
  voiceModelProgressLabel: document.querySelector("#voiceModelProgressLabel"),
  voiceModelProgressStats: document.querySelector("#voiceModelProgressStats"),
  voiceModelDownloadButton: document.querySelector("#voiceModelDownloadButton"),
  voiceStyleGroup: document.querySelector("#voiceStyleGroup"),
  voiceStyleSelect: document.querySelector("#voiceStyleSelect"),
  fontSelect: document.querySelector("#fontSelect"),
  appWideVoiceCommandsInput: document.querySelector("#appWideVoiceCommandsInput"),
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
  autoHideToolbarInput: document.querySelector("#autoHideToolbarInput"),
  styleSelect: document.querySelector("#styleSelect"),
  themeSelect: document.querySelector("#themeSelect"),
  performanceModeInput: document.querySelector("#performanceModeInput"),
  hideFromCaptureInput: document.querySelector("#hideFromCaptureInput"),
  useSystemTrayInput: document.querySelector("#useSystemTrayInput"),
  preventSleepInput: document.querySelector("#preventSleepInput"),
  clickthroughShortcutInput: document.querySelector("#clickthroughShortcutInput"),
  textColorInput: document.querySelector("#textColorInput"),
  textOpacityInput: document.querySelector("#textOpacityInput"),
  textOpacityValue: document.querySelector("#textOpacityValue"),
  settingsSectionSelect: document.querySelector("#settingsSectionSelect"),
  settingsSections: document.querySelectorAll("[data-settings-section]"),
  windowStatus: document.querySelector("#windowStatus"),
  cloudRemoteFields: document.querySelector("#cloudRemoteFields"),
  remoteSessionId: document.querySelector("#remoteSessionId"),
  remoteAccessPasswordInput: document.querySelector("#remoteAccessPasswordInput"),
  remoteSenderUrl: document.querySelector("#remoteSenderUrl"),
  remoteLiveBadge: document.querySelector("#remoteLiveBadge"),
  remoteSessionStatus: document.querySelector("#remoteSessionStatus"),
  copySessionIdButton: document.querySelector("#copySessionIdButton"),
  copyAccessPasswordButton: document.querySelector("#copyAccessPasswordButton"),
  copySenderUrlButton: document.querySelector("#copySenderUrlButton"),
  closeWindowButton: document.querySelector("#closeWindowButton"),
  openTextButton: document.querySelector("#openTextButton")
};

let applyTimer = null;
let isSyncingForm = false;
let isApplying = false;
let remoteStatusTimer = null;
let unlistenVoiceModelDownloads = null;
let voiceModelStatuses = new Map();
let activeVoiceModelDownload = null;

function t(key, params = {}) {
  return translate(key, state.language, params);
}

function getVoiceLanguageLabel(language) {
  return VOICE_LANGUAGE_OPTIONS.find((option) => option.value === normalizeVoiceLanguage(language))?.label
    || VOICE_LANGUAGE_OPTIONS[0].label;
}

function formatMegabytes(bytes) {
  return `${(Math.max(Number(bytes) || 0, 0) / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDownloadSpeed(bytesPerSecond) {
  return `${(Math.max(Number(bytesPerSecond) || 0, 0) / (1024 * 1024)).toFixed(1)} MB/s`;
}

function setVoiceModelProgress(progress = null) {
  if (!progress) {
    ui.voiceModelProgress.classList.add("hidden");
    ui.voiceModelProgressFill.style.width = "0%";
    ui.voiceModelProgressLabel.textContent = "0%";
    ui.voiceModelProgressStats.textContent = t("settings.voiceModelProgressIdle");
    return;
  }

  const totalBytes = Number(progress.totalBytes) || 0;
  const downloadedBytes = Math.max(Number(progress.downloadedBytes) || 0, 0);
  const ratio = totalBytes > 0 ? Math.min(downloadedBytes / totalBytes, 1) : 0;
  const percent = Math.round(ratio * 100);
  const remainingBytes = Number.isFinite(progress.remainingBytes)
    ? Math.max(Number(progress.remainingBytes), 0)
    : Math.max(totalBytes - downloadedBytes, 0);
  const speed = Number(progress.speedBytesPerSecond) || 0;

  ui.voiceModelProgress.classList.remove("hidden");
  ui.voiceModelProgressFill.style.width = `${percent}%`;
  ui.voiceModelProgressLabel.textContent = totalBytes > 0
    ? `${percent}%`
    : formatMegabytes(downloadedBytes);
  ui.voiceModelProgressStats.textContent = t("settings.voiceModelProgressStats", {
    remaining: formatMegabytes(remainingBytes),
    speed: formatDownloadSpeed(speed)
  });
}

function syncVoiceModelRegistry() {
  const previousRegistry = loadVoiceModelRegistry();
  const nextRegistry = { ...previousRegistry };

  voiceModelStatuses.forEach((status, language) => {
    nextRegistry[language] = {
      ...(previousRegistry[language] || {}),
      language,
      label: status.label,
      installed: Boolean(status.installed),
      path: status.path || "",
      sizeBytes: Number(status.sizeBytes) || 0,
      updatedAt: Date.now()
    };
  });

  saveVoiceModelRegistry(nextRegistry);
}

function renderVoiceLanguageOptions() {
  Array.from(ui.voiceLanguageSelect.options).forEach((option) => {
    const language = normalizeVoiceLanguage(option.value);
    const status = voiceModelStatuses.get(language);
    const baseLabel = option.dataset.baseLabel || option.textContent.trim();
    option.dataset.baseLabel = baseLabel;
    option.textContent = status?.installed ? `✓ ${baseLabel}` : baseLabel;
  });
}

function renderVoiceModelStatus(language = ui.voiceLanguageSelect.value) {
  const normalizedLanguage = normalizeVoiceLanguage(language);
  const status = voiceModelStatuses.get(normalizedLanguage);
  const downloadState = activeVoiceModelDownload?.language === normalizedLanguage ? activeVoiceModelDownload : null;
  const isDownloading = downloadState?.stage === "started" || downloadState?.stage === "progress";
  const isInstalled = Boolean(status?.installed);

  ui.voiceModelSelectedLabel.textContent = getVoiceLanguageLabel(normalizedLanguage);
  ui.voiceModelBadge.dataset.state = isDownloading ? "downloading" : (isInstalled ? "installed" : "missing");
  ui.voiceModelBadge.textContent = isDownloading
    ? t("settings.voiceModelDownloading")
    : (isInstalled ? t("settings.voiceModelInstalled") : t("settings.voiceModelMissing"));
  ui.voiceModelHint.textContent = isDownloading
    ? t("settings.voiceModelDownloadingHelp")
    : (isInstalled ? t("settings.voiceModelInstalledHelp") : t("settings.voiceModelMissingHelp"));
  ui.voiceModelPath.textContent = status?.path
    ? t("settings.voiceModelPathValue", { path: status.path })
    : t("settings.voiceModelPathMissing");
  ui.voiceModelDownloadButton.disabled = isDownloading || isInstalled || !invoke;
  ui.voiceModelDownloadButton.textContent = isInstalled
    ? t("settings.voiceModelInstalledAction")
    : (isDownloading ? t("settings.voiceModelDownloadingAction") : t("settings.voiceModelDownloadAction"));

  if (downloadState) {
    setVoiceModelProgress(downloadState);
  } else {
    setVoiceModelProgress(null);
  }
}

async function refreshVoiceModelStatuses() {
  if (!invoke) {
    renderVoiceModelStatus(ui.voiceLanguageSelect.value);
    return;
  }

  const statuses = await invoke("list_voice_models").catch((error) => {
    console.error(error);
    return [];
  });

  voiceModelStatuses = new Map(
    (Array.isArray(statuses) ? statuses : []).map((status) => [normalizeVoiceLanguage(status.language), {
      ...status,
      language: normalizeVoiceLanguage(status.language)
    }])
  );
  syncVoiceModelRegistry();
  renderVoiceLanguageOptions();
  renderVoiceModelStatus(ui.voiceLanguageSelect.value);
}

function handleVoiceModelDownloadEvent(payload) {
  if (!payload?.language) {
    return;
  }

  activeVoiceModelDownload = {
    ...payload,
    language: normalizeVoiceLanguage(payload.language)
  };

  if (payload.stage === "completed") {
    voiceModelStatuses.set(activeVoiceModelDownload.language, {
      ...(voiceModelStatuses.get(activeVoiceModelDownload.language) || {}),
      language: activeVoiceModelDownload.language,
      label: payload.label || getVoiceLanguageLabel(activeVoiceModelDownload.language),
      installed: true,
      path: payload.path || "",
      sizeBytes: Number(payload.totalBytes || payload.downloadedBytes) || 0
    });
    syncVoiceModelRegistry();
    renderVoiceLanguageOptions();
  }

  if (payload.stage === "error") {
    ui.windowStatus.textContent = payload.message || t("settings.voiceModelDownloadFailed");
  }

  renderVoiceModelStatus(activeVoiceModelDownload.language);
}

async function downloadSelectedVoiceModel() {
  const language = normalizeVoiceLanguage(ui.voiceLanguageSelect.value);
  activeVoiceModelDownload = {
    language,
    stage: "started",
    downloadedBytes: 0,
    totalBytes: 0,
    remainingBytes: 0,
    speedBytesPerSecond: 0
  };
  renderVoiceModelStatus(language);

  try {
    const status = await invoke("download_voice_model", { language });
    voiceModelStatuses.set(language, {
      ...status,
      language
    });
    syncVoiceModelRegistry();
    renderVoiceLanguageOptions();
    ui.windowStatus.textContent = t("settings.voiceModelDownloadComplete", {
      language: getVoiceLanguageLabel(language)
    });
  } catch (error) {
    console.error(error);
    activeVoiceModelDownload = {
      language,
      stage: "error",
      message: error?.message || String(error)
    };
    ui.windowStatus.textContent = t("settings.voiceModelDownloadFailed");
  }

  renderVoiceModelStatus(language);
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
  ui.modeSelect.disabled = false;
  const isVoiceMode = ui.modeSelect.value === "voice";
  ui.voiceLanguageGroup.classList.toggle("hidden", !isVoiceMode);
  ui.voiceLanguageSelect.disabled = !isVoiceMode;
  ui.voiceStyleGroup.classList.toggle("hidden", !isVoiceMode);
  ui.voiceStyleSelect.disabled = !isVoiceMode;
  ui.textColorInput.disabled = false;

  if (isVoiceMode) {
    renderVoiceModelStatus(ui.voiceLanguageSelect.value);
  }
}

function updateRemoteModeUi() {
  ui.cloudRemoteFields.classList.remove("hidden");
}

function setActiveSettingsSection(section = ui.settingsSectionSelect?.value || "remote") {
  const activeSection = String(section || "remote");

  if (ui.settingsSectionSelect) {
    ui.settingsSectionSelect.value = activeSection;
  }

  ui.settingsSections.forEach((element) => {
    const selected = element.dataset.settingsSection === activeSection;
    element.classList.toggle("hidden", !selected);
    element.setAttribute("aria-hidden", selected ? "false" : "true");
  });

  document.querySelector(".page-shell")?.scrollTo({ top: 0, behavior: "smooth" });
}

function normalizeRemoteCloudUrl(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

const CONFIGURED_CLOUD_RELAY_URL = normalizeRemoteCloudUrl(CLOUD_RELAY_URL);

function isCloudRemoteSelected() {
  return true;
}

function isCloudRemoteEnabled() {
  return Boolean(CONFIGURED_CLOUD_RELAY_URL);
}

function buildCloudApiUrl(path) {
  const base = CONFIGURED_CLOUD_RELAY_URL;
  if (!base) {
    return "";
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildCloudSenderUrl(receiverId = state.remote?.receiverId || "") {
  const base = CONFIGURED_CLOUD_RELAY_URL;
  if (!base || !receiverId) {
    return "";
  }

  return `${base}/?id=${encodeURIComponent(receiverId)}`;
}

async function getMainWindow() {
  if (!tauriWindow?.getAllWindows) return null;
  const windows = await tauriWindow.getAllWindows();
  return windows.find((windowRef) => windowRef.label === "main") || windows[0] || null;
}

async function isMainWindowCollapsed(appWindow) {
  if (!appWindow?.outerSize) {
    return false;
  }

  try {
    const size = await appWindow.outerSize();
    return Number(size?.height) > 0 && Number(size.height) <= COLLAPSED_HEIGHT + 8;
  } catch (error) {
    console.error(error);
    return false;
  }
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
  ui.remoteAccessPasswordInput.value = state.remote?.accessPassword || "";
  setSliderValue(ui.appOpacityInput, state.appearance?.appOpacity ?? defaultState.appearance.appOpacity);
  ui.textSizeInput.value = String(state.appearance?.textScale || defaultState.appearance.textScale);
  ui.styleSelect.value = state.appearance?.style || defaultState.appearance.style;
  ui.themeSelect.value = state.appearance?.theme || defaultState.appearance.theme;
  ui.autoHideToolbarInput.checked = Boolean(state.appearance?.autoHideToolbar);
  
  ui.voiceLanguageSelect.value = normalizeVoiceLanguage(state.appearance?.voiceLanguage || "en-US");
  ui.voiceStyleSelect.value = state.appearance?.voiceScrollStyle || defaultState.appearance.voiceScrollStyle;
  ui.appWideVoiceCommandsInput.checked = Boolean(state.appearance?.appWideVoiceCommands);
  
  ui.performanceModeInput.checked = Boolean(state.appearance?.performanceMode);
  ui.hideFromCaptureInput.checked = Boolean(state.desktop?.hideFromCapture);
  ui.useSystemTrayInput.checked = Boolean(state.desktop?.useSystemTray);
  ui.preventSleepInput.checked = Boolean(state.desktop?.preventSleep);
  ui.clickthroughShortcutInput.checked = Boolean(state.desktop?.clickthroughShortcutEnabled);
  ui.textColorInput.value = state.appearance?.textColor || getThemeTeleprompterTextColor(ui.themeSelect.value);
  ui.textOpacityInput.value = String(state.appearance?.textOpacity || defaultState.appearance.textOpacity);
  updatePositioningAvailability();
  updateAppearanceAvailability();
  updateRemoteModeUi();
  updateValueLabels();
  applyAppearanceToDocument({
    theme: ui.themeSelect.value,
    style: ui.styleSelect.value,
    autoHideToolbar: ui.autoHideToolbarInput.checked,
    performanceMode: ui.performanceModeInput.checked,
    appOpacity: Number(ui.appOpacityInput.value)
  });
  applyTranslationsToDocument(ui.languageSelect.value);
  renderLanguagePicker(ui.languageSelect.value, ui.languageSelect.value);
  renderVoiceLanguageOptions();
  if (ui.modeSelect.value === "voice") {
    renderVoiceModelStatus(ui.voiceLanguageSelect.value);
  }
  isSyncingForm = false;
}

async function readCurrentWindow() {
  const appWindow = await getMainWindow();
  if (!appWindow) return;

  await configureSliderRanges();

  const size = await appWindow.outerSize();
  const pos = await appWindow.outerPosition();
  const windowIsCollapsed = Number(size?.height) > 0 && Number(size.height) <= COLLAPSED_HEIGHT + 8;

  state.window.width = size.width;
  if (!windowIsCollapsed) {
    state.window.height = size.height;
  }
  state.window.x = pos.x;
  state.window.y = pos.y;
  saveState({
    window: {
      width: state.window.width,
      height: state.window.height,
      x: state.window.x,
      y: state.window.y,
      preset: state.window.preset
    },
    remote: state.remote
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
  state.desktop = {
    hideFromCapture: ui.hideFromCaptureInput.checked,
    useSystemTray: ui.useSystemTrayInput.checked,
    preventSleep: ui.preventSleepInput.checked,
    clickthroughShortcutEnabled: ui.clickthroughShortcutInput.checked
  };
  state.remote = {
    provider: "cloud",
    receiverId: state.remote?.receiverId || defaultState.remote.receiverId,
    receiverSecret: state.remote?.receiverSecret || defaultState.remote.receiverSecret,
    accessPassword: state.remote?.accessPassword || defaultState.remote.accessPassword,
    publicHost: "",
  };
  state.appearance = {
    ...defaultState.appearance,
    ...(state.appearance || {}),
    mode: ui.modeSelect.value,
    voiceLanguage: ui.voiceLanguageSelect.value,
    voiceScrollStyle: ui.voiceStyleSelect.value,
    appWideVoiceCommands: ui.appWideVoiceCommandsInput.checked,
    fontFamily: ui.fontSelect.value,
    appOpacity: Number(ui.appOpacityInput.value),
    textScale: Number(ui.textSizeInput.value),
    theme: ui.themeSelect.value,
    style: ui.styleSelect.value,
    autoHideToolbar: ui.autoHideToolbarInput.checked,
    performanceMode: ui.performanceModeInput.checked,
    textColor: ui.textColorInput.value || state.appearance?.textColor || getThemeTeleprompterTextColor(ui.themeSelect.value),
    textOpacity: Number(ui.textOpacityInput.value)
  };
}

async function applyDesktopSettings() {
  if (!invoke) {
    return;
  }

  await invoke("set_capture_protection", { enabled: Boolean(state.desktop?.hideFromCapture) });
  await invoke("set_system_tray_enabled", { enabled: Boolean(state.desktop?.useSystemTray) });
  await invoke("set_prevent_sleep", { enabled: Boolean(state.desktop?.preventSleep) });
  await invoke("set_clickthrough_shortcut_enabled", { enabled: Boolean(state.desktop?.clickthroughShortcutEnabled) });

  if (!state.desktop?.clickthroughShortcutEnabled) {
    await invoke("set_main_clickthrough", { enabled: false }).catch(console.error);
  }
}

async function applyWindowSettings() {
  if (isApplying) return;

  const appWindow = await getMainWindow();
  if (!appWindow || !tauriDpi) return;

  isApplying = true;

  try {
    collectFormState();
    const windowIsCollapsed = await isMainWindowCollapsed(appWindow);

    if (!windowIsCollapsed) {
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
          const x = monitor.position.x + Math.round((monitor.size.width - outer.width) / 2) + TOP_CENTER_X_OFFSET;
          const y = monitor.position.y;
          await appWindow.setPosition(new tauriDpi.PhysicalPosition(x, y));
          state.window.x = x;
          state.window.y = y;
        }
      } else {
        await appWindow.setPosition(new tauriDpi.LogicalPosition(state.window.x, state.window.y));
      }
    }

    saveState({
      window: {
        width: state.window.width,
        height: state.window.height,
        x: state.window.x,
        y: state.window.y,
        preset: state.window.preset
      },
      desktop: state.desktop,
      remote: state.remote,
      language: state.language,
      appearance: state.appearance
    });
    await applyDesktopSettings();
    fillForm();
    ui.windowStatus.textContent = t("settings.applied");
    refreshRemoteStatus().catch(console.error);
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

async function copyText(value, successMessage) {
  if (!value) {
    ui.remoteSessionStatus.textContent = t("settings.copyNothing");
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    ui.remoteSessionStatus.textContent = successMessage;
  } catch (error) {
    console.error(error);
    ui.remoteSessionStatus.textContent = t("settings.copyFailed");
  }
}

function renderCloudRemoteStatus(status) {
  const cloudSenderUrl = buildCloudSenderUrl(state.remote?.receiverId || "");

  ui.remoteSessionId.textContent = state.remote?.receiverId || t("common.unavailable");
  ui.remoteAccessPasswordInput.value = state.remote?.accessPassword || "";
  ui.remoteSenderUrl.textContent = cloudSenderUrl || t("settings.remoteSenderUnavailable");
  ui.remoteSenderUrl.href = cloudSenderUrl || "#";
  ui.remoteSenderUrl.dataset.copyValue = cloudSenderUrl;

  if (!CONFIGURED_CLOUD_RELAY_URL) {
    ui.remoteLiveBadge.textContent = t("common.setup");
    ui.remoteLiveBadge.classList.add("is-offline");
    ui.remoteSessionStatus.textContent = t("settings.remoteStatusCloudNeedsBuild");
    return;
  }

  const active = Boolean(status?.active);
  const exists = Boolean(status?.exists);
  ui.remoteLiveBadge.textContent = active ? t("common.live") : t("common.offline");
  ui.remoteLiveBadge.classList.toggle("is-offline", !active);

  if (!exists) {
    ui.remoteSessionStatus.textContent = t("settings.remoteStatusCloudRegister");
    return;
  }

  ui.remoteSessionStatus.textContent = active
    ? t("settings.remoteStatusCloudActive")
    : t("settings.remoteStatusCloudOffline");
}

async function fetchCloudRemoteStatus() {
  const url = buildCloudApiUrl(`/api/receiver/${encodeURIComponent(state.remote?.receiverId || "")}/status`);
  if (!url) {
    renderCloudRemoteStatus(null);
    return;
  }

  try {
    const response = await fetch(url, { cache: "no-store" });
    const status = await response.json().catch(() => null);
    renderCloudRemoteStatus(response.ok ? status : null);
  } catch (error) {
    console.error(error);
    renderCloudRemoteStatus(null);
  }
}

async function refreshRemoteStatus() {
  await fetchCloudRemoteStatus();
}

window.addEventListener("DOMContentLoaded", async () => {
  await configureSliderRanges();
  fillForm();
  await applyDesktopSettings().catch(console.error);
  await refreshRemoteStatus();
  await refreshVoiceModelStatuses();

  if (tauriEvent?.listen) {
    unlistenVoiceModelDownloads = await tauriEvent.listen("flow-voice-model-download", (event) => {
      handleVoiceModelDownloadEvent(event.payload);
    });
  }

  [ui.xInput, ui.yInput, ui.widthInput, ui.heightInput, ui.appOpacityInput, ui.textSizeInput, ui.textOpacityInput].forEach((input) => {
    input.addEventListener("input", scheduleApply);
  });

  [ui.presetSelect, ui.modeSelect, ui.voiceLanguageSelect, ui.voiceStyleSelect, ui.fontSelect, ui.languageSelect, ui.themeSelect, ui.styleSelect, ui.textColorInput].forEach((input) => {
    input.addEventListener("input", scheduleApply);
    input.addEventListener("change", scheduleApply);
  });

  ui.settingsSectionSelect?.addEventListener("input", () => {
    setActiveSettingsSection(ui.settingsSectionSelect.value);
  });
  ui.settingsSectionSelect?.addEventListener("change", () => {
    setActiveSettingsSection(ui.settingsSectionSelect.value);
  });

  ui.voiceLanguageSelect.addEventListener("change", () => {
    renderVoiceModelStatus(ui.voiceLanguageSelect.value);
  });
  ui.voiceModelDownloadButton.addEventListener("click", () => {
    downloadSelectedVoiceModel().catch(console.error);
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
  [ui.autoHideToolbarInput, ui.performanceModeInput, ui.hideFromCaptureInput, ui.useSystemTrayInput, ui.preventSleepInput, ui.clickthroughShortcutInput, ui.appWideVoiceCommandsInput].forEach((input) => {
    input.addEventListener("input", scheduleApply);
    input.addEventListener("change", scheduleApply);
  });

  ui.closeWindowButton.addEventListener("click", () => {
    invoke?.("hide_aux_window", { kind: "settings" }).catch(console.error);
  });
  ui.openTextButton.addEventListener("click", () => {
    invoke?.("open_aux_window", { kind: "input" }).catch(console.error);
  });
  ui.copySessionIdButton.addEventListener("click", () => {
    copyText(ui.remoteSessionId.textContent, t("settings.copiedUuid"));
  });
  ui.copyAccessPasswordButton.addEventListener("click", () => {
    copyText(ui.remoteAccessPasswordInput.value, t("settings.copiedAccessPassword"));
  });
  ui.copySenderUrlButton.addEventListener("click", () => {
    copyText(ui.remoteSenderUrl.dataset.copyValue || "", t("settings.copiedSenderLink"));
  });

  await readCurrentWindow().catch(console.error);
  setActiveSettingsSection(ui.settingsSectionSelect?.value || "remote");

  remoteStatusTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      refreshRemoteStatus().catch(console.error);
    }
  }, REMOTE_STATUS_REFRESH_MS);

  window.addEventListener("focus", async () => {
    Object.assign(state, loadState());
    state.desktop = state.desktop || structuredClone(defaultState.desktop);
    await configureSliderRanges();
    await applyDesktopSettings().catch(console.error);
    await readCurrentWindow().catch(console.error);
    fillForm();
    await refreshVoiceModelStatuses();
    await refreshRemoteStatus().catch(console.error);
  });
  window.addEventListener("storage", () => {
    Object.assign(state, loadState());
    state.desktop = state.desktop || structuredClone(defaultState.desktop);
    fillForm();
    refreshVoiceModelStatuses().catch(console.error);
    applyDesktopSettings().catch(console.error);
  });
  window.addEventListener("flow-state-updated", () => {
    Object.assign(state, loadState());
    state.desktop = state.desktop || structuredClone(defaultState.desktop);
    fillForm();
    refreshVoiceModelStatuses().catch(console.error);
    applyDesktopSettings().catch(console.error);
  });
  window.addEventListener("beforeunload", () => {
    if (remoteStatusTimer) {
      clearInterval(remoteStatusTimer);
    }
    unlistenVoiceModelDownloads?.();
  });
});
