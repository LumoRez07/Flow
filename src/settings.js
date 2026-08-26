/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { CONFIGURED_REMOTE_PUBLIC_URL, CONFIGURED_CLOUD_RELAY_URL, isCloudRemoteEnabled, buildCloudApiUrl, buildCloudSenderUrl, buildCloudSenderAuthUrl, fetchCloudRemoteStatus } from "./services/network/remote.js";
import { CONFIGURED_REALTIME_RELAY_URL, buildRealtimeApiUrl, fetchRealtimeRelayProbe, isRealtimeRelayConfigured, getRealtimeRelayProbeState } from "./services/network/realtime.js";
import QRCode from "./assets/vendor/qrcode.esm.js";
import {
  updaterState,
  setUpdaterDelegate,
  getUpdaterCheckAvailable,
  getUpdaterInstallAvailable,
  resolveMicrosoftStoreBuild,
  checkForAppUpdates,
  installAvailableUpdate,
  ensureCurrentAppVersion,
  isMicrosoftStoreBuild
} from "./services/updater.js";
import {
  buildRealtimeRoomUrl,
  clearRealtimeEditingConfig,
  clearStaleRealtimeEditingConfig,
  createRealtimePasswordHash,
  getRealtimeEditingUpdatedEventName,
  loadRealtimeEditingConfig,
  saveRealtimeEditingConfig
} from "./services/network/realtime-editing.js";
import {
  applyAppearanceToDocument,
  applyTranslationsToDocument,
  clampNumber,
  defaultState,
  FONT_OPTIONS,
  getThemeTeleprompterTextColor,
  getSelectedVoiceModelId,
  initializePersistentStorage,
  initializeDesktopWindowOpacityFade,
  initializeSmoothScrollbox,
  invokeAfterDesktopFadeOut,
  loadVoiceModelRegistry,
  loadState,
  parseLocaleNumber,
  normalizeVoiceLanguage,
  normalizeCustomColor,
  resolveFontStack,
  saveState,
  saveVoiceModelRegistry,
  updateVoiceModelRegistry,
  translate,
  VOICE_LANGUAGE_OPTIONS
} from "./shared.js";
import { getProModule } from "./core/pro-loader.js";
import {
  MIN_WIDTH,
  MIN_HEIGHT,
  COLLAPSED_HEIGHT,
  SPEED_RAIL_WINDOW_GUTTER,
  REMOTE_RAIL_WINDOW_GUTTER,
  SIDE_PANEL_WINDOW_GUTTER,
  MAX_WIDTH_FALLBACK,
  MAX_HEIGHT_FALLBACK,
  TOP_CENTER_X_OFFSET
} from "./teleprompter/layout.js";

await initializePersistentStorage();

const POSITION_PADDING = 600;
const APPLY_DELAY = 120;
const REMOTE_STATUS_REFRESH_MS = 20_000;
const WINDOW_SIZE_PREVIEW_CLASS = "window-size-preview-active";
const WINDOW_SIZE_PREVIEW_RELEASE_DELAY = 140;
const WINDOW_LOCATION_PREVIEW_RELEASE_DELAY = 500;
const SOUND_INPUT_DEFAULT_DEVICE_ID = defaultState.appearance.soundInputDeviceId || "default";
const SOUND_INPUT_DEFAULT_NOISE_GATE = Number(defaultState.appearance.soundInputNoiseGate) || 0.01;
const SOUND_INPUT_DEFAULT_GAIN = Number(defaultState.appearance.soundInputGain) || 2;
const SOUND_INPUT_MAX_NOISE_GATE = 0.08;
const SOUND_INPUT_MIN_GAIN = 0.5;
const SOUND_INPUT_MAX_GAIN = 4;
const SOUND_INPUT_PREVIEW_FFT_SIZE = 1024;
const SOUND_INPUT_LEVEL_SCALE = 4;
const SOUND_INPUT_PREVIEW_INTERVAL_MS = 80;
const tauriCore = window.__TAURI__?.core;
const invoke = tauriCore?.invoke;
const tauriApp = window.__TAURI__?.app;
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
  presetPicker: document.querySelector("#presetPicker"),
  presetSelect: document.querySelector("#presetSelect"),
  presetTrigger: document.querySelector("#presetTrigger"),
  presetTriggerLabel: document.querySelector("#presetTriggerLabel"),
  presetTriggerPreview: document.querySelector("#presetTriggerPreview"),
  presetMenu: document.querySelector("#presetMenu"),
  modePicker: document.querySelector("#modePicker"),
  modeSelect: document.querySelector("#modeSelect"),
  modeTrigger: document.querySelector("#modeTrigger"),
  modeTriggerLabel: document.querySelector("#modeTriggerLabel"),
  modeTriggerPreview: document.querySelector("#modeTriggerPreview"),
  modeMenu: document.querySelector("#modeMenu"),
  speedRailEnabledInput: document.querySelector("#speedRailEnabledInput"),
  scrollStartDelayInput: document.querySelector("#scrollStartDelayInput"),
  scrollStartDelayValue: document.querySelector("#scrollStartDelayValue"),
  voiceConfidenceGroup: document.querySelector("#voiceConfidenceGroup"),
  voiceConfidenceInput: document.querySelector("#voiceConfidenceInput"),
  voiceConfidenceValue: document.querySelector("#voiceConfidenceValue"),
  voiceLanguageGroup: document.querySelector("#voiceLanguageGroup"),
  voiceLanguagePicker: document.querySelector("#voiceLanguagePicker"),
  voiceLanguageSelect: document.querySelector("#voiceLanguageSelect"),
  voiceLanguageTrigger: document.querySelector("#voiceLanguageTrigger"),
  voiceLanguageTriggerLabel: document.querySelector("#voiceLanguageTriggerLabel"),
  voiceLanguageTriggerPreview: document.querySelector("#voiceLanguageTriggerPreview"),
  voiceLanguageMenu: document.querySelector("#voiceLanguageMenu"),
  voiceModelCard: document.querySelector("#voiceModelCard"),
  voiceModelBadge: document.querySelector("#voiceModelBadge"),
  voiceModelSelectedLabel: document.querySelector("#voiceModelSelectedLabel"),
  voiceModelPicker: document.querySelector("#voiceModelPicker"),
  voiceModelSelect: document.querySelector("#voiceModelSelect"),
  voiceModelTrigger: document.querySelector("#voiceModelTrigger"),
  voiceModelTriggerLabel: document.querySelector("#voiceModelTriggerLabel"),
  voiceModelTriggerPreview: document.querySelector("#voiceModelTriggerPreview"),
  voiceModelMenu: document.querySelector("#voiceModelMenu"),
  voiceModelHint: document.querySelector("#voiceModelHint"),
  voiceModelPath: document.querySelector("#voiceModelPath"),
  voiceModelProgress: document.querySelector("#voiceModelProgress"),
  voiceModelProgressFill: document.querySelector("#voiceModelProgressFill"),
  voiceModelProgressLabel: document.querySelector("#voiceModelProgressLabel"),
  voiceModelProgressStats: document.querySelector("#voiceModelProgressStats"),
  voiceModelDownloadButton: document.querySelector("#voiceModelDownloadButton"),
  voiceStyleGroup: document.querySelector("#voiceStyleGroup"),
  voiceStylePicker: document.querySelector("#voiceStylePicker"),
  voiceStyleSelect: document.querySelector("#voiceStyleSelect"),
  voiceStyleTrigger: document.querySelector("#voiceStyleTrigger"),
  voiceStyleTriggerLabel: document.querySelector("#voiceStyleTriggerLabel"),
  voiceStyleTriggerPreview: document.querySelector("#voiceStyleTriggerPreview"),
  voiceStyleMenu: document.querySelector("#voiceStyleMenu"),
  soundInputDevicePicker: document.querySelector("#soundInputDevicePicker"),
  soundInputDeviceSelect: document.querySelector("#soundInputDeviceSelect"),
  soundInputDeviceTrigger: document.querySelector("#soundInputDeviceTrigger"),
  soundInputDeviceTriggerLabel: document.querySelector("#soundInputDeviceTriggerLabel"),
  soundInputDeviceTriggerPreview: document.querySelector("#soundInputDeviceTriggerPreview"),
  soundInputDeviceMenu: document.querySelector("#soundInputDeviceMenu"),
  soundInputLevelFill: document.querySelector("#soundInputLevelFill"),
  soundInputLevelValue: document.querySelector("#soundInputLevelValue"),
  soundInputStatus: document.querySelector("#soundInputStatus"),
  soundInputNoiseGateInput: document.querySelector("#soundInputNoiseGateInput"),
  soundInputNoiseGateValue: document.querySelector("#soundInputNoiseGateValue"),
  soundInputGainInput: document.querySelector("#soundInputGainInput"),
  soundInputGainValue: document.querySelector("#soundInputGainValue"),
  soundInputRecommendedButton: document.querySelector("#soundInputRecommendedButton"),
  fontSelect: document.querySelector("#fontSelect"),
  fontPicker: document.querySelector("#fontPicker"),
  fontTrigger: document.querySelector("#fontTrigger"),
  fontTriggerLabel: document.querySelector("#fontTriggerLabel"),
  fontTriggerPreview: document.querySelector("#fontTriggerPreview"),
  fontMenu: document.querySelector("#fontMenu"),
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
  mirrorModeInput: document.querySelector("#mirrorModeInput"),
  mirrorVerticalInput: document.querySelector("#mirrorVerticalInput"),
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
  settingsSectionPicker: document.querySelector("#settingsSectionPicker"),
  settingsSectionSelect: document.querySelector("#settingsSectionSelect"),
  settingsSectionTrigger: document.querySelector("#settingsSectionTrigger"),
  settingsSectionTriggerLabel: document.querySelector("#settingsSectionTriggerLabel"),
  settingsSectionTriggerPreview: document.querySelector("#settingsSectionTriggerPreview"),
  settingsSectionMenu: document.querySelector("#settingsSectionMenu"),
  settingsUpdatesOption: document.querySelector('#settingsSectionSelect option[value="updates"]'),
  stylePicker: document.querySelector("#stylePicker"),
  styleTrigger: document.querySelector("#styleTrigger"),
  styleTriggerLabel: document.querySelector("#styleTriggerLabel"),
  styleTriggerPreview: document.querySelector("#styleTriggerPreview"),
  styleMenu: document.querySelector("#styleMenu"),
  themePicker: document.querySelector("#themePicker"),
  themeTrigger: document.querySelector("#themeTrigger"),
  themeTriggerLabel: document.querySelector("#themeTriggerLabel"),
  themeTriggerPreview: document.querySelector("#themeTriggerPreview"),
  themeMenu: document.querySelector("#themeMenu"),
  settingsSections: document.querySelectorAll("[data-settings-section]"),
  updatesSection: document.querySelector('[data-settings-section="updates"]'),
  showScriptManagerInput: document.querySelector("#showScriptManagerInput"),
  showScriptCompletionInput: document.querySelector("#showScriptCompletionInput"),
  windowStatus: document.querySelector("#windowStatus"),
  updaterCurrentVersion: document.querySelector("#updaterCurrentVersion"),
  updaterAvailableVersion: document.querySelector("#updaterAvailableVersion"),
  updaterPublishedAt: document.querySelector("#updaterPublishedAt"),
  updaterStatusBadge: document.querySelector("#updaterStatusBadge"),
  updaterStatusText: document.querySelector("#updaterStatusText"),
  updaterProgress: document.querySelector("#updaterProgress"),
  updaterProgressFill: document.querySelector("#updaterProgressFill"),
  updaterProgressLabel: document.querySelector("#updaterProgressLabel"),
  updaterProgressStats: document.querySelector("#updaterProgressStats"),
  updaterReleaseNotes: document.querySelector("#updaterReleaseNotes"),
  updaterCheckButton: document.querySelector("#updaterCheckButton"),
  cloudRemoteFields: document.querySelector("#cloudRemoteFields"),
  remoteSessionId: document.querySelector("#remoteSessionId"),
  remoteAccessPasswordInput: document.querySelector("#remoteAccessPasswordInput"),
  remoteSenderUrl: document.querySelector("#remoteSenderUrl"),
  remoteSenderQrCard: document.querySelector("#remoteSenderQrCard"),
  remoteSenderQrImage: document.querySelector("#remoteSenderQrImage"),
  remoteSenderQrStatus: document.querySelector("#remoteSenderQrStatus"),
  remoteRealtimeCard: document.querySelector("#remoteRealtimeCard"),
  remoteRealtimeStatus: document.querySelector("#remoteRealtimeStatus"),
  remoteRealtimeBadge: document.querySelector("#remoteRealtimeBadge"),
  remoteRealtimePasswordInput: document.querySelector("#remoteRealtimePasswordInput"),
  remoteRealtimeLink: document.querySelector("#remoteRealtimeLink"),
  remoteRealtimeQrImage: document.querySelector("#remoteRealtimeQrImage"),
  remoteRealtimeQrStatus: document.querySelector("#remoteRealtimeQrStatus"),
  initializeRealtimeEditingButton: document.querySelector("#initializeRealtimeEditingButton"),
  closeRealtimeEditingButton: document.querySelector("#closeRealtimeEditingButton"),
  copyRealtimePasswordButton: document.querySelector("#copyRealtimePasswordButton"),
  copyRealtimeLinkButton: document.querySelector("#copyRealtimeLinkButton"),
  remoteLiveBadge: document.querySelector("#remoteLiveBadge"),
  remoteSessionStatus: document.querySelector("#remoteSessionStatus"),
  copySessionIdButton: document.querySelector("#copySessionIdButton"),
  copyAccessPasswordButton: document.querySelector("#copyAccessPasswordButton"),
  copySenderUrlButton: document.querySelector("#copySenderUrlButton"),
  copySenderAuthUrlButton: document.querySelector("#copySenderAuthUrlButton"),
  closeWindowButton: document.querySelector("#closeWindowButton"),
  openTextButton: document.querySelector("#openTextButton"),
  cornerRadiusInput: document.querySelector("#cornerRadiusInput"),
  cornerRadiusValue: document.querySelector("#cornerRadiusValue"),
  cardRadiusInput: document.querySelector("#cardRadiusInput"),
  cardRadiusValue: document.querySelector("#cardRadiusValue"),
  borderWidthInput: document.querySelector("#borderWidthInput"),
  borderWidthValue: document.querySelector("#borderWidthValue"),
  borderOpacityInput: document.querySelector("#borderOpacityInput"),
  borderOpacityValue: document.querySelector("#borderOpacityValue"),
  glassBlurInput: document.querySelector("#glassBlurInput"),
  glassBlurValue: document.querySelector("#glassBlurValue"),
  companionOpacityInput: document.querySelector("#companionOpacityInput"),
  companionOpacityValue: document.querySelector("#companionOpacityValue"),
  customAccentColorInput: document.querySelector("#customAccentColorInput"),
  customAccentColorHex: document.querySelector("#customAccentColorHex"),
  customHighlightColorInput: document.querySelector("#customHighlightColorInput"),
  resetStylingButton: document.querySelector("#resetStylingButton"),
  resetCornerRadiusBtn: document.querySelector("#resetCornerRadiusBtn"),
  resetCardRadiusBtn: document.querySelector("#resetCardRadiusBtn"),
  resetBorderWidthBtn: document.querySelector("#resetBorderWidthBtn"),
  resetBorderOpacityBtn: document.querySelector("#resetBorderOpacityBtn"),
  resetGlassBlurBtn: document.querySelector("#resetGlassBlurBtn"),
  resetCompanionOpacityBtn: document.querySelector("#resetCompanionOpacityBtn"),
  resetCustomAccentBtn: document.querySelector("#resetCustomAccentBtn"),
  resetCustomHighlightBtn: document.querySelector("#resetCustomHighlightBtn")
};

let applyTimer = null;
let isSyncingForm = false;
let isApplying = false;
let remoteStatusTimer = null;
let unlistenVoiceModelDownloads = null;
let voiceModelStatuses = new Map();
let activeVoiceModelDownload = null;
let soundInputPreviewStream = null;
let soundInputPreviewAudioContext = null;
let soundInputPreviewSourceNode = null;
let soundInputPreviewAnalyserNode = null;
let soundInputPreviewTimer = 0;
let soundInputPreviewBuffer = null;
let soundInputPreviewSession = 0;
let soundInputPreviewDeviceId = null;
let soundInputStatusKey = ui.soundInputStatus?.dataset.i18n || "settings.soundInputPreviewIdle";
let remoteSenderQrDataUrl = "";
let remoteSenderQrSource = "";
let remoteRealtimeQrDataUrl = "";
let remoteRealtimeQrSource = "";
let realtimeEditingInitBusy = false;
let windowSizePreviewReleaseTimer = 0;
const customSettingsSelectControllers = [];
const RTL_TEXT_PATTERN = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
const SETTINGS_SECTION_CHOICE_METADATA = {
  appearance: { icon: "ph-palette", accent: "appearance" },
  "advanced-styling": { icon: "ph-paint-brush-broad", accent: "advanced-styling" },
  scrolling: { icon: "ph-arrows-vertical", accent: "scrolling" },
  positioning: { icon: "ph-app-window", accent: "positioning" },
  "sound-input": { icon: "ph-microphone", accent: "sound-input" },
  remote: { icon: "ph-broadcast", accent: "remote" },
  usability: { icon: "ph-keyboard", accent: "usability" },
  privacy: { icon: "ph-shield-check", accent: "privacy" },
  updates: { icon: "ph-cloud-arrow-down", accent: "updates" }
};
const MODE_CHOICE_METADATA = {
  highlight: { icon: "ph-highlighter", accent: "mode" },
  scroll: { icon: "ph-arrows-down-up", accent: "mode" },
  line: { icon: "ph-text-align-left", accent: "mode" },
  arrow: { icon: "ph-arrow-elbow-down-right", accent: "mode" },
  voice: { icon: "ph-waveform", accent: "voice" }
};
const WINDOW_PRESET_CHOICE_METADATA = {
  "top-center": { icon: "ph-arrow-line-up", accent: "window" },
  center: { icon: "ph-frame-corners", accent: "window" },
  custom: { icon: "ph-sliders-horizontal", accent: "window" },
  drag: { icon: "ph-arrows-out-cardinal", accent: "window" }
};
const VOICE_STYLE_CHOICE_METADATA = {
  highlight: { icon: "ph-highlighter", accent: "voice-style" },
  line: { icon: "ph-text-align-left", accent: "voice-style" },
  plain: { icon: "ph-text-aa", accent: "voice-style" }
};




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

  if (leading.kind === "flag") {
    const flag = document.createElement("span");
    flag.className = "language-flag choice-leading";
    flag.dataset.flag = leading.flag;
    flag.setAttribute("aria-hidden", "true");
    flag.dataset.choiceLeading = "true";
    return flag;
  }

  const shell = document.createElement("span");
  shell.className = "choice-leading";
  shell.setAttribute("aria-hidden", "true");
  shell.dataset.choiceLeading = "true";

  if (leading.kind === "icon") {
    shell.classList.add("choice-leading-icon");
    shell.dataset.accent = leading.accent || "default";
    const icon = document.createElement("i");
    icon.className = `ph ${leading.icon || "ph-circle"}`;
    shell.append(icon);
    return shell;
  }

  if (leading.kind === "theme") {
    shell.classList.add("choice-swatch");
    shell.dataset.themeValue = leading.theme || "main";
    return shell;
  }

  if (leading.kind === "status") {
    shell.classList.add("choice-status-dot");
    shell.dataset.state = leading.state || "idle";
    const icon = document.createElement("i");
    icon.className = `ph ${leading.icon || "ph-waveform"}`;
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

function getVoiceLanguageFlag(language) {
  return String(language || "en").slice(0, 2).toLowerCase();
}

function getVoiceModelPreviewText(status) {
  if (!status) {
    return "";
  }

  const parts = [];
  if (status.recommended) {
    parts.push("Recommended");
  }
  parts.push(`${status.downloadSizeMb} MB`);
  parts.push(status.modelId);
  return parts.join(" · ");
}

function normalizeSoundInputDeviceId(value) {
  const normalizedValue = String(value || "").trim();
  return normalizedValue || SOUND_INPUT_DEFAULT_DEVICE_ID;
}

function normalizeSoundInputNoiseGate(value) {
  return clampNumber(value, 0, SOUND_INPUT_MAX_NOISE_GATE, SOUND_INPUT_DEFAULT_NOISE_GATE);
}

function normalizeSoundInputGain(value) {
  return clampNumber(value, SOUND_INPUT_MIN_GAIN, SOUND_INPUT_MAX_GAIN, SOUND_INPUT_DEFAULT_GAIN);
}

function formatSoundInputNoiseGate(value) {
  const normalizedValue = normalizeSoundInputNoiseGate(value);
  return normalizedValue.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function formatSoundInputGain(value) {
  return `${normalizeSoundInputGain(value).toFixed(2)}x`;
}

function normalizeVoiceConfidenceThreshold(value) {
  const fallback = parseLocaleNumber(defaultState.voiceTracking?.confidenceThreshold) || 0.35;
  const numericValue = parseLocaleNumber(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return clampNumber(numericValue, 0.1, 0.9, fallback);
}

function formatVoiceConfidenceThreshold(value) {
  return `${Math.round(normalizeVoiceConfidenceThreshold(value) * 100)}%`;
}

function setSoundInputLevel(level = 0) {
  const normalizedLevel = Math.min(Math.max(Number(level) || 0, 0), 1);
  const percent = Math.round(normalizedLevel * 100);
  ui.soundInputLevelFill.style.width = `${percent}%`;
  ui.soundInputLevelValue.textContent = `${percent}%`;
}

function setSoundInputStatus(key) {
  if (!ui.soundInputStatus) {
    return;
  }

  soundInputStatusKey = key || "settings.soundInputPreviewIdle";
  ui.soundInputStatus.dataset.i18n = soundInputStatusKey;
  ui.soundInputStatus.textContent = t(soundInputStatusKey);
}

function getSelectedSoundInputDeviceId() {
  return normalizeSoundInputDeviceId(ui.soundInputDeviceSelect?.value || state.appearance?.soundInputDeviceId);
}

function getSelectedSoundInputDeviceLabel() {
  if (!ui.soundInputDeviceSelect) {
    return "";
  }

  const selectedOption = ui.soundInputDeviceSelect.selectedOptions?.[0];
  const deviceId = getSelectedSoundInputDeviceId();
  if (!selectedOption || deviceId === SOUND_INPUT_DEFAULT_DEVICE_ID) {
    return "";
  }

  return String(selectedOption.textContent || "").trim();
}

function describeSoundInputDevice(device, index) {
  const label = String(device?.label || "").trim();
  if (label) {
    return label;
  }

  return `${t("settings.soundInputDeviceUnnamed")} ${index + 1}`;
}

async function listNativeSoundInputDevices() {
  if (!invoke) {
    return [];
  }

  return invoke("list_input_devices").catch((error) => {
    console.error(error);
    return [];
  });
}

async function refreshSoundInputDevices(options = {}) {
  const { preserveSelection = true } = options;

  if (!ui.soundInputDeviceSelect || !navigator.mediaDevices?.enumerateDevices) {
    ui.soundInputDeviceSelect.disabled = true;
    return;
  }

  const selectedValue = preserveSelection
    ? getSelectedSoundInputDeviceId()
    : SOUND_INPUT_DEFAULT_DEVICE_ID;

  const devices = await navigator.mediaDevices.enumerateDevices().catch((error) => {
    console.error(error);
    return [];
  });
  const audioInputs = devices.filter((device) => device.kind === "audioinput");
  const shouldUseNativeLabels = audioInputs.some((device) => !String(device?.label || "").trim());
  const nativeAudioInputs = shouldUseNativeLabels
    ? await listNativeSoundInputDevices()
    : [];
  const optionDescriptors = [
    {
      value: SOUND_INPUT_DEFAULT_DEVICE_ID,
      label: t("settings.soundInputDeviceDefault")
    }
  ];

  audioInputs.forEach((device, index) => {
    if (device.deviceId === SOUND_INPUT_DEFAULT_DEVICE_ID) {
      return;
    }

    const nativeLabel = String(nativeAudioInputs[index]?.label || "").trim();

    optionDescriptors.push({
      value: device.deviceId,
      label: describeSoundInputDevice({ ...device, label: nativeLabel || device.label }, index)
    });
  });

  if (selectedValue !== SOUND_INPUT_DEFAULT_DEVICE_ID && !optionDescriptors.some((option) => option.value === selectedValue)) {
    optionDescriptors.push({
      value: selectedValue,
      label: t("settings.soundInputDeviceUnavailable")
    });
  }

  ui.soundInputDeviceSelect.textContent = "";
  optionDescriptors.forEach((option) => {
    const element = document.createElement("option");
    element.value = option.value;
    element.textContent = option.label;
    ui.soundInputDeviceSelect.append(element);
  });

  ui.soundInputDeviceSelect.value = optionDescriptors.some((option) => option.value === selectedValue)
    ? selectedValue
    : SOUND_INPUT_DEFAULT_DEVICE_ID;
  ui.soundInputDeviceSelect.disabled = optionDescriptors.length <= 1 && !audioInputs.length;
  syncCustomSettingsSelects();

  if (!audioInputs.length && !nativeAudioInputs.length && ui.settingsSectionSelect?.value === "sound-input") {
    setSoundInputStatus("settings.soundInputNoDevices");
  }
}

function stopSoundInputPreview(options = {}) {
  const { resetStatus = false } = options;

  soundInputPreviewSession += 1;

  if (soundInputPreviewTimer) {
    clearTimeout(soundInputPreviewTimer);
    soundInputPreviewTimer = 0;
  }

  if (soundInputPreviewSourceNode) {
    try {
      soundInputPreviewSourceNode.disconnect();
    } catch (error) {
      // Node already disconnected.
    }
    soundInputPreviewSourceNode = null;
  }

  soundInputPreviewAnalyserNode = null;
  soundInputPreviewBuffer = null;
  soundInputPreviewDeviceId = null;

  if (soundInputPreviewStream) {
    soundInputPreviewStream.getTracks().forEach((track) => {
      track.enabled = false;
      track.stop();
    });
    soundInputPreviewStream = null;
  }

  if (soundInputPreviewAudioContext) {
    soundInputPreviewAudioContext.close().catch(() => {});
    soundInputPreviewAudioContext = null;
  }

  setSoundInputLevel(0);

  if (resetStatus) {
    setSoundInputStatus("settings.soundInputPreviewIdle");
  }
}

function renderSoundInputPreviewLevel() {
  if (!soundInputPreviewAnalyserNode || !soundInputPreviewBuffer) {
    return;
  }

  soundInputPreviewAnalyserNode.getFloatTimeDomainData(soundInputPreviewBuffer);

  let sumSquares = 0;
  for (let index = 0; index < soundInputPreviewBuffer.length; index += 1) {
    const sample = soundInputPreviewBuffer[index];
    sumSquares += sample * sample;
  }

  const rawLevel = Math.sqrt(sumSquares / Math.max(soundInputPreviewBuffer.length, 1));
  const noiseGate = normalizeSoundInputNoiseGate(ui.soundInputNoiseGateInput.value);
  const gain = normalizeSoundInputGain(ui.soundInputGainInput.value);
  const level = rawLevel < noiseGate
    ? 0
    : Math.min(rawLevel * gain * SOUND_INPUT_LEVEL_SCALE, 1);

  setSoundInputLevel(level);
  soundInputPreviewTimer = window.setTimeout(renderSoundInputPreviewLevel, SOUND_INPUT_PREVIEW_INTERVAL_MS);
}

async function startSoundInputPreview(options = {}) {
  const { forceRestart = false } = options;

  if (!navigator.mediaDevices?.getUserMedia) {
    setSoundInputStatus("settings.soundInputPreviewUnavailable");
    setSoundInputLevel(0);
    return;
  }

  await refreshSoundInputDevices();

  const selectedDeviceId = getSelectedSoundInputDeviceId();
  const shouldReusePreview = !forceRestart
    && soundInputPreviewStream
    && soundInputPreviewAudioContext
    && soundInputPreviewAnalyserNode
    && soundInputPreviewDeviceId === selectedDeviceId;

  if (shouldReusePreview) {
    setSoundInputStatus("settings.soundInputPreviewReady");
    return;
  }

  stopSoundInputPreview();
  const previewSession = soundInputPreviewSession;
  const audioConstraints = {
    channelCount: 1,
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false
  };

  if (selectedDeviceId !== SOUND_INPUT_DEFAULT_DEVICE_ID) {
    audioConstraints.deviceId = { exact: selectedDeviceId };
  }

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: audioConstraints
    });

    if (previewSession !== soundInputPreviewSession) {
      mediaStream.getTracks().forEach((track) => {
        track.enabled = false;
        track.stop();
      });
      return;
    }

    soundInputPreviewStream = mediaStream;
    soundInputPreviewDeviceId = selectedDeviceId;
    soundInputPreviewAudioContext = new AudioContextClass();
    soundInputPreviewSourceNode = soundInputPreviewAudioContext.createMediaStreamSource(mediaStream);
    soundInputPreviewAnalyserNode = soundInputPreviewAudioContext.createAnalyser();
    soundInputPreviewAnalyserNode.fftSize = SOUND_INPUT_PREVIEW_FFT_SIZE;
    soundInputPreviewBuffer = new Float32Array(soundInputPreviewAnalyserNode.fftSize);
    soundInputPreviewSourceNode.connect(soundInputPreviewAnalyserNode);

    if (soundInputPreviewAudioContext.state === "suspended") {
      await soundInputPreviewAudioContext.resume().catch(() => {});
    }

    await refreshSoundInputDevices();
    setSoundInputStatus("settings.soundInputPreviewReady");
    renderSoundInputPreviewLevel();
  } catch (error) {
    console.error(error);
    setSoundInputLevel(0);
    setSoundInputStatus(
      /notallowed|permission|denied/i.test(String(error?.name || error?.message || error))
        ? "settings.soundInputPermissionDenied"
        : "settings.soundInputPreviewUnavailable"
    );
  }
}

async function syncSoundInputPreview(options = {}) {
  if (ui.settingsSectionSelect?.value !== "sound-input") {
    stopSoundInputPreview({ resetStatus: true });
    return;
  }

  await startSoundInputPreview(options);
}

function applyRecommendedSoundInputSettings() {
  ui.soundInputNoiseGateInput.value = String(SOUND_INPUT_DEFAULT_NOISE_GATE);
  ui.soundInputGainInput.value = String(SOUND_INPUT_DEFAULT_GAIN);
  updateValueLabels();
  setSoundInputStatus("settings.soundInputRecommendedApplied");
  scheduleApply();
}

function t(key, params = {}) {
  return translate(key, state.language, params);
}

function getSpeedRailWindowGutter() {
  return state.appearance?.speedRailEnabled === false || ["voice", "arrow"].includes(state.appearance?.mode)
    ? 0
    : SPEED_RAIL_WINDOW_GUTTER;
}

function getSidePanelWindowGutter() {
  return 0;
}

function getBottomDockWindowGutter() {
  return state.modules?.scriptManager !== false ? 40 : 0;
}

function getWindowPositionOffset(gutterWidth = getSpeedRailWindowGutter()) {
  return -gutterWidth;
}

function getVoiceLanguageLabel(language) {
  const normalizedLanguage = normalizeVoiceLanguage(language);
  const option = VOICE_LANGUAGE_OPTIONS.find((entry) => entry.value === normalizedLanguage) || VOICE_LANGUAGE_OPTIONS[0];
  const languageCode = option.value.slice(0, 2).toLowerCase();
  return translate(`language.${languageCode}`, state.language);
}

function formatMegabytes(bytes) {
  return `${(Math.max(Number(bytes) || 0, 0) / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDownloadSpeed(bytesPerSecond) {
  return `${(Math.max(Number(bytesPerSecond) || 0, 0) / (1024 * 1024)).toFixed(1)} MB/s`;
}

function formatPublishedDate(value) {
  if (!value) {
    return t("settings.updaterNoDate");
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  try {
    return new Intl.DateTimeFormat(state.language, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  } catch (_error) {
    return date.toLocaleString();
  }
}


async function syncUpdatesSettingsVisibility() {
  const isMicrosoftStoreBuild = await resolveMicrosoftStoreBuild();
  const hideUpdates = Boolean(isMicrosoftStoreBuild);

  if (ui.settingsUpdatesOption) {
    ui.settingsUpdatesOption.hidden = hideUpdates;
    ui.settingsUpdatesOption.disabled = hideUpdates;
  }

  if (hideUpdates && ui.settingsSectionSelect?.value === "updates") {
    ui.settingsSectionSelect.value = "appearance";
  }
}

function setUpdaterProgress(progress = null) {
  if (!ui.updaterProgress) {
    return;
  }

  if (!progress) {
    ui.updaterProgress.classList.add("hidden");
    ui.updaterProgressFill.style.width = "0%";
    ui.updaterProgressLabel.textContent = "0%";
    ui.updaterProgressStats.textContent = t("settings.updaterProgressIdle");
    return;
  }

  const totalBytes = Math.max(Number(progress.totalBytes) || 0, 0);
  const downloadedBytes = Math.max(Number(progress.downloadedBytes) || 0, 0);
  const ratio = totalBytes > 0 ? Math.min(downloadedBytes / totalBytes, 1) : 0;
  const percent = totalBytes > 0 ? Math.round(ratio * 100) : 0;

  ui.updaterProgress.classList.remove("hidden");
  ui.updaterProgressFill.style.width = `${percent}%`;
  ui.updaterProgressLabel.textContent = totalBytes > 0 ? `${percent}%` : formatMegabytes(downloadedBytes);
  ui.updaterProgressStats.textContent = t("settings.updaterProgressStats", {
    downloaded: formatMegabytes(downloadedBytes),
    total: totalBytes > 0 ? formatMegabytes(totalBytes) : t("common.unavailable")
  });
}

function renderUpdaterCard() {
  if (!ui.updaterCurrentVersion) {
    return;
  }

  const update = updaterState.update;
  const publishedVersion = String(update?.version || updaterState.publishedVersion || "").trim();
  const publishedAt = String(update?.date || update?.pub_date || updaterState.publishedAt || "").trim();
  const publishedNotes = String(update?.body || updaterState.publishedNotes || "").trim();
  const hasUpdate = Boolean(update?.version);
  const hasPublishedVersion = Boolean(publishedVersion);
  const canCheckUpdater = getUpdaterCheckAvailable();
  const canInstallUpdater = getUpdaterInstallAvailable();

  ui.updaterCurrentVersion.textContent = updaterState.currentVersion || t("common.unavailable");
  ui.updaterAvailableVersion.textContent = hasPublishedVersion
    ? publishedVersion
    : (updaterState.checking ? t("common.loading") : t("settings.updaterNotChecked"));
  ui.updaterPublishedAt.textContent = publishedAt
    ? formatPublishedDate(publishedAt)
    : t("settings.updaterNoDate");
  ui.updaterStatusBadge.dataset.i18n = updaterState.badgeKey;
  ui.updaterStatusBadge.textContent = t(updaterState.badgeKey);
  ui.updaterStatusBadge.classList.toggle("is-offline", [
    "settings.updaterStatusError",
    "settings.updaterStatusCurrent",
    "settings.updaterStatusUnavailable"
  ].includes(updaterState.badgeKey));
  ui.updaterStatusText.dataset.i18n = updaterState.messageKey;
  ui.updaterStatusText.textContent = t(updaterState.messageKey, updaterState.messageParams);
  ui.updaterReleaseNotes.textContent = publishedNotes || t("settings.updaterNoNotes");
  ui.updaterCheckButton.disabled = updaterState.checking || updaterState.installing || !canCheckUpdater || (hasUpdate && !canInstallUpdater);
  ui.updaterCheckButton.textContent = updaterState.installing
    ? t("settings.updaterInstallingAction")
    : (updaterState.checking
      ? t("settings.updaterCheckingAction")
      : (hasUpdate ? t("settings.updaterInstallAction") : t("settings.updaterCheckAction")));

  setUpdaterProgress(updaterState.progress);
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

function getVoiceModelStatusKey(language, modelId) {
  return `${normalizeVoiceLanguage(language)}::${String(modelId || "").trim()}`;
}

function getVoiceModelStatusesForLanguage(language) {
  const normalizedLanguage = normalizeVoiceLanguage(language);
  return [...voiceModelStatuses.values()]
    .filter((status) => normalizeVoiceLanguage(status.language) === normalizedLanguage);
}

function getRecommendedVoiceModelStatus(language) {
  const statuses = getVoiceModelStatusesForLanguage(language);
  return statuses.find((status) => status.recommended) || statuses[0] || null;
}

function resolveSelectedVoiceModelId(language) {
  const normalizedLanguage = normalizeVoiceLanguage(language);
  const statuses = getVoiceModelStatusesForLanguage(normalizedLanguage);
  if (statuses.length === 0) {
    return null;
  }

  const selectedModelId = getSelectedVoiceModelId(normalizedLanguage);
  if (selectedModelId && statuses.some((status) => status.modelId === selectedModelId)) {
    return selectedModelId;
  }

  const fallbackModelId = getRecommendedVoiceModelStatus(normalizedLanguage)?.modelId || statuses[0]?.modelId || null;
  if (fallbackModelId && fallbackModelId !== selectedModelId) {
    updateVoiceModelRegistry(normalizedLanguage, {
      selectedModelId: fallbackModelId,
      updatedAt: Date.now()
    });
  }

  return fallbackModelId;
}

function getSelectedVoiceModelStatus(language = ui.voiceLanguageSelect.value) {
  const normalizedLanguage = normalizeVoiceLanguage(language);
  const selectedModelId = resolveSelectedVoiceModelId(normalizedLanguage);
  if (!selectedModelId) {
    return null;
  }

  return voiceModelStatuses.get(getVoiceModelStatusKey(normalizedLanguage, selectedModelId)) || null;
}

function syncVoiceModelRegistry() {
  const previousRegistry = loadVoiceModelRegistry();
  const nextRegistry = { ...previousRegistry };
  const languages = new Set(
    [...voiceModelStatuses.values()].map((status) => normalizeVoiceLanguage(status.language))
  );

  languages.forEach((language) => {
    const previousEntry = previousRegistry[language] || {};
    const previousModels = previousEntry.models && typeof previousEntry.models === "object"
      ? previousEntry.models
      : {};
    const nextModels = { ...previousModels };

    getVoiceModelStatusesForLanguage(language).forEach((status) => {
      nextModels[status.modelId] = {
        ...(previousModels[status.modelId] || {}),
        modelId: status.modelId,
        label: status.label,
        family: status.family,
        installed: Boolean(status.installed),
        path: status.path || "",
        sizeBytes: Number(status.sizeBytes) || 0,
        downloadSizeMb: Number(status.downloadSizeMb) || 0,
        runtimeMemoryMb: Number(status.runtimeMemoryMb) || 0,
        license: status.license || "",
        description: status.description || "",
        bundled: Boolean(status.bundled),
        recommended: Boolean(status.recommended),
        updatedAt: Date.now()
      };
    });

    nextRegistry[language] = {
      ...previousEntry,
      language,
      selectedModelId: previousEntry.selectedModelId || getRecommendedVoiceModelStatus(language)?.modelId || "",
      models: nextModels,
      updatedAt: Date.now()
    };
  });

  saveVoiceModelRegistry(nextRegistry);
}

function renderVoiceLanguageOptions() {
  Array.from(ui.voiceLanguageSelect.options).forEach((option) => {
    const language = normalizeVoiceLanguage(option.value);
    const status = getSelectedVoiceModelStatus(language);
    const baseLabel = getVoiceLanguageLabel(language);
    option.textContent = status?.installed ? `✓ ${baseLabel}` : baseLabel;
  });

  syncCustomSettingsSelects();
}

function renderVoiceModelOptions(language = ui.voiceLanguageSelect.value) {
  const normalizedLanguage = normalizeVoiceLanguage(language);
  const statuses = getVoiceModelStatusesForLanguage(normalizedLanguage);
  const selectedModelId = resolveSelectedVoiceModelId(normalizedLanguage);

  ui.voiceModelSelect.innerHTML = "";
  ui.voiceModelSelect.disabled = statuses.length === 0;

  if (statuses.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("settings.voiceModelNoOptions");
    option.dataset.choiceLabel = option.textContent;
    ui.voiceModelSelect.append(option);
    syncCustomSettingsSelects();
    return;
  }

  statuses.forEach((status) => {
    const option = document.createElement("option");
    option.value = status.modelId;
    option.selected = status.modelId === selectedModelId;
    option.dataset.choiceLabel = status.family;
    option.dataset.choicePreview = getVoiceModelPreviewText(status);
    option.dataset.installed = status.installed ? "true" : "false";
    option.textContent = `${status.recommended ? "Recommended · " : ""}${status.family} · ${status.downloadSizeMb} MB · ${status.modelId}${status.installed ? " ✓" : ""}`;
    option.title = status.description || status.modelId;
    ui.voiceModelSelect.append(option);
  });

  syncCustomSettingsSelects();
}

function renderVoiceModelStatus(language = ui.voiceLanguageSelect.value, { rebuildOptions = true } = {}) {
  const normalizedLanguage = normalizeVoiceLanguage(language);
  if (rebuildOptions) {
    renderVoiceModelOptions(normalizedLanguage);
  }
  const status = getSelectedVoiceModelStatus(normalizedLanguage);
  const downloadState = activeVoiceModelDownload?.language === normalizedLanguage
    && activeVoiceModelDownload?.modelId === status?.modelId
      ? activeVoiceModelDownload
      : null;
  const isDownloading = downloadState?.stage === "started" || downloadState?.stage === "progress";
  const isInstalled = Boolean(status?.installed);

  ui.voiceModelSelectedLabel.textContent = status
    ? `${getVoiceLanguageLabel(normalizedLanguage)} · ${status.family}`
    : getVoiceLanguageLabel(normalizedLanguage);
  ui.voiceModelBadge.dataset.state = isDownloading ? "downloading" : (isInstalled ? "installed" : "missing");
  ui.voiceModelBadge.textContent = isDownloading
    ? t("settings.voiceModelDownloading")
    : (isInstalled ? t("settings.voiceModelInstalled") : t("settings.voiceModelMissing"));
  ui.voiceModelHint.textContent = isDownloading
    ? t("settings.voiceModelDownloadingHelp")
    : status
      ? `${status.description} ${status.downloadSizeMb} MB download · ~${status.runtimeMemoryMb} MB RAM · ${status.license}`
      : t("settings.voiceModelCheckingHelp");
  ui.voiceModelPath.textContent = status?.path
    ? t("settings.voiceModelPathValue", { path: status.path })
    : t("settings.voiceModelPathMissing");
  ui.voiceModelDownloadButton.disabled = isDownloading || isInstalled || !invoke || !status;
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
    (Array.isArray(statuses) ? statuses : []).map((status) => [getVoiceModelStatusKey(status.language, status.modelId), {
      ...status,
      language: normalizeVoiceLanguage(status.language)
    }])
  );
  syncVoiceModelRegistry();
  renderVoiceLanguageOptions();
  renderVoiceModelStatus(ui.voiceLanguageSelect.value);
}

function handleVoiceModelDownloadEvent(payload) {
  if (!payload?.language || !payload?.modelId) {
    return;
  }

  activeVoiceModelDownload = {
    ...payload,
    language: normalizeVoiceLanguage(payload.language)
  };

  if (payload.stage === "completed") {
    const statusKey = getVoiceModelStatusKey(activeVoiceModelDownload.language, payload.modelId);
    voiceModelStatuses.set(statusKey, {
      ...(voiceModelStatuses.get(statusKey) || {}),
      modelId: payload.modelId,
      language: activeVoiceModelDownload.language,
      label: payload.label || getVoiceLanguageLabel(activeVoiceModelDownload.language),
      installed: true,
      path: payload.path || "",
      sizeBytes: Number(payload.totalBytes || payload.downloadedBytes) || 0
    });
    syncVoiceModelRegistry();
    renderVoiceLanguageOptions();
    renderVoiceModelStatus(activeVoiceModelDownload.language, { rebuildOptions: true });
    return;
  }

  if (payload.stage === "error") {
    ui.windowStatus.textContent = payload.message || t("settings.voiceModelDownloadFailed");
    renderVoiceModelStatus(activeVoiceModelDownload.language, { rebuildOptions: true });
    return;
  }

  renderVoiceModelStatus(activeVoiceModelDownload.language, { rebuildOptions: false });
}

async function downloadSelectedVoiceModel() {
  const language = normalizeVoiceLanguage(ui.voiceLanguageSelect.value);
  const modelId = ui.voiceModelSelect.value || resolveSelectedVoiceModelId(language);
  if (!modelId) {
    return;
  }

  activeVoiceModelDownload = {
    language,
    modelId,
    stage: "started",
    downloadedBytes: 0,
    totalBytes: 0,
    remainingBytes: 0,
    speedBytesPerSecond: 0
  };
  renderVoiceModelStatus(language);

  try {
    const status = await invoke("download_voice_model", { language, modelId });
    voiceModelStatuses.set(getVoiceModelStatusKey(language, status.modelId), {
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
      modelId,
      stage: "error",
      message: error?.message || String(error)
    };
    ui.windowStatus.textContent = t("settings.voiceModelDownloadFailed");
  }

  renderVoiceModelStatus(language);
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

function closeLanguageMenu(selectedOption = null, onAfterClose = null) {
  closeAnimatedMenu(ui.languageMenu, ui.languageTrigger, ui.languagePicker, selectedOption, onAfterClose);
}

function openLanguageMenu() {
  openAnimatedMenu(ui.languageMenu, ui.languageTrigger, ui.languagePicker);
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

const FONT_PICKER_METADATA = {
  inter: {
    label: "Language UI",
    sample: (previewLanguage) => translate(`language.${previewLanguage}`, previewLanguage)
  },
  "space-grotesk": {
    sample: () => "Display sans"
  },
  outfit: {
    sample: () => "Modern geometric"
  },
  "noto-sans": {
    sample: () => "Wide language support"
  },
  "english-pro": {
    sample: () => "English"
  },
  "dutch-pro": {
    sample: () => "Nederlands"
  },
  "arabic-pro": {
    sample: () => "العربية",
    dir: "rtl"
  },
  "arabic-naskh": {
    sample: () => "العربية",
    dir: "rtl"
  },
  amiri: {
    sample: () => "العربية",
    dir: "rtl"
  },
  "turkish-pro": {
    sample: () => "Türkçe"
  },
  "german-pro": {
    sample: () => "Deutsch"
  },
  "spanish-pro": {
    sample: () => "Español"
  },
  "french-pro": {
    sample: () => "Français"
  },
  "portuguese-pro": {
    sample: () => "Português"
  },
  "finnish-pro": {
    sample: () => "Suomi"
  },
  montserrat: {
    sample: () => "Geometric modern"
  },
  poppins: {
    sample: () => "Clean display"
  },
  roboto: {
    sample: () => "Crisp standard"
  },
  "fira-sans": {
    sample: () => "High legibility"
  },
  system: {
    sample: (previewLanguage) => translate(`language.${previewLanguage}`, previewLanguage)
  },
  "ibm-plex-serif": {
    sample: () => "Editorial serif"
  },
  lora: {
    sample: () => "Readable serif"
  },
  merriweather: {
    sample: () => "Editorial serif"
  },
  "source-serif": {
    sample: () => "Readable serif"
  },
  georgia: {
    sample: () => "Classic serif"
  },
  garamond: {
    sample: () => "Book typography"
  },
  verdana: {
    sample: () => "Screen clarity"
  },
  "jetbrains-mono": {
    sample: () => "Code preview"
  },
  mono: {
    sample: () => "Monospace"
  }
};

function closeFontMenu(selectedOption = null, onAfterClose = null) {
  closeAnimatedMenu(ui.fontMenu, ui.fontTrigger, ui.fontPicker, selectedOption, onAfterClose);
}

function openFontMenu() {
  openAnimatedMenu(ui.fontMenu, ui.fontTrigger, ui.fontPicker);
}

function getFontPickerOptionData(value, previewLanguage = state.language) {
  const option = FONT_OPTIONS.find((entry) => entry.value === value) || FONT_OPTIONS[0];
  const metadata = FONT_PICKER_METADATA[option.value] || {};

  return {
    value: option.value,
    label: metadata.label || option.label,
    sample: typeof metadata.sample === "function" ? metadata.sample(previewLanguage) : metadata.sample || option.label,
    dir: metadata.dir || "ltr",
    fontFamily: resolveFontStack(option.value, previewLanguage)
  };
}

function renderFontPicker(selectedValue = ui.fontSelect.value, previewLanguage = state.language) {
  if (ui.fontSelect && ui.fontSelect.options.length !== FONT_OPTIONS.length) {
    const currentValue = selectedValue || ui.fontSelect.value;
    ui.fontSelect.innerHTML = "";
    FONT_OPTIONS.forEach((entry) => {
      const opt = document.createElement("option");
      opt.value = entry.value;
      opt.textContent = entry.label;
      ui.fontSelect.appendChild(opt);
    });
    ui.fontSelect.value = currentValue;
  }

  const activeValue = selectedValue || defaultState.appearance.fontFamily;
  const activeOption = getFontPickerOptionData(activeValue, previewLanguage);

  ui.fontTriggerLabel.textContent = activeOption.label;
  ui.fontTriggerLabel.style.fontFamily = activeOption.fontFamily;
  ui.fontTriggerPreview.textContent = activeOption.sample;
  ui.fontTriggerPreview.style.fontFamily = activeOption.fontFamily;
  ui.fontTriggerPreview.dir = activeOption.dir;
  ui.fontTriggerLabel.dir = activeOption.dir;

  ui.fontMenu.textContent = "";

  FONT_OPTIONS.forEach((entry) => {
    const optionData = getFontPickerOptionData(entry.value, previewLanguage);
    const selected = optionData.value === activeValue;
    const option = document.createElement("button");
    option.type = "button";
    option.className = "font-option";
    option.dataset.value = optionData.value;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", selected ? "true" : "false");
    option.classList.toggle("is-selected", selected);

    const copy = document.createElement("span");
    copy.className = "font-option-copy";

    const title = document.createElement("span");
    title.className = "font-option-title";
    title.textContent = optionData.label;
    title.style.fontFamily = optionData.fontFamily;
    title.dir = optionData.dir;

    const sample = document.createElement("span");
    sample.className = "font-option-sample";
    sample.textContent = optionData.sample;
    sample.style.fontFamily = optionData.fontFamily;
    sample.dir = optionData.dir;

    copy.append(title, sample);
    option.append(copy);
    option.addEventListener("click", () => {
      ui.fontSelect.value = optionData.value;
      closeFontMenu(option, () => {
        renderFontPicker(optionData.value, state.language);
        scheduleApply();
      });
    });
    ui.fontMenu.append(option);
  });
}

function getCustomSelectEntries(select) {
  const entries = [];

  Array.from(select.children).forEach((child) => {
    if (child instanceof HTMLOptGroupElement) {
      entries.push({ type: "group", label: child.label });
      Array.from(child.children).forEach((option) => {
        if (option instanceof HTMLOptionElement && !option.hidden) {
          entries.push({ type: "option", option, groupLabel: child.label });
        }
      });
      return;
    }

    if (child instanceof HTMLOptionElement && !child.hidden) {
      entries.push({ type: "option", option: child, groupLabel: "" });
    }
  });

  return entries;
}

function closeCustomSettingsSelect(controller, selectedOption = null, onAfterClose = null) {
  closeAnimatedMenu(controller.menu, controller.trigger, controller.picker, selectedOption, onAfterClose);
}

function openCustomSettingsSelect(controller) {
  if (controller.select.disabled) {
    return;
  }

  openAnimatedMenu(controller.menu, controller.trigger, controller.picker);
  queueChoiceTickerOverflowRefresh(controller.trigger, controller.menu);
}

function getCustomSettingsSelectDisplay(controller, option, { context = "option", groupLabel = "" } = {}) {
  const fallbackLabel = option?.textContent?.trim() || option?.value || "";
  const label = controller.getLabel
    ? controller.getLabel(option, { context, groupLabel })
    : fallbackLabel;
  const preview = context === "trigger"
    ? (controller.getPreview ? controller.getPreview(option) : "")
    : (controller.getOptionDescription ? controller.getOptionDescription(option, groupLabel) : "");

  return {
    label,
    preview,
    leading: controller.getLeading ? controller.getLeading(option, { context, groupLabel }) : null,
    labelDir: controller.getLabelDirection
      ? controller.getLabelDirection(option, { context, groupLabel, label })
      : getChoiceTextDirection(label),
    previewDir: controller.getPreviewDirection
      ? controller.getPreviewDirection(option, { context, groupLabel, preview })
      : getChoiceTextDirection(preview, getChoiceTextDirection(label))
  };
}

function renderCustomSettingsSelect(controller) {
  const selectedOption = controller.select.selectedOptions?.[0] || controller.select.options?.[0] || null;
  const triggerDisplay = getCustomSettingsSelectDisplay(controller, selectedOption, { context: "trigger" });

  replaceChoiceLeading(controller.trigger, triggerDisplay.leading);
  setChoiceTextContent(controller.label, triggerDisplay.label, triggerDisplay.labelDir);
  controller.trigger.title = triggerDisplay.label;
  controller.trigger.disabled = controller.select.disabled;
  controller.picker.classList.toggle("is-disabled", controller.select.disabled);
  if (controller.preview) {
    setChoiceTextContent(controller.preview, triggerDisplay.preview, triggerDisplay.previewDir);
    controller.preview.classList.toggle("hidden", !triggerDisplay.preview);
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
    const optionDisplay = getCustomSettingsSelectDisplay(controller, option, {
      context: "option",
      groupLabel: entry.groupLabel
    });
    button.type = "button";
    button.className = "choice-option";
    button.dataset.value = option.value;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", selected ? "true" : "false");
    button.classList.toggle("is-selected", selected);
    button.disabled = controller.select.disabled || option.disabled;
    button.title = optionDisplay.label;

    const copy = document.createElement("span");
    copy.className = "choice-option-copy";

    const title = document.createElement("span");
    title.className = "choice-option-title";
    setChoiceTextContent(title, optionDisplay.label, optionDisplay.labelDir);
    copy.append(title);

    if (optionDisplay.preview) {
      const description = document.createElement("span");
      description.className = "choice-option-sample";
      setChoiceTextContent(description, optionDisplay.preview, optionDisplay.previewDir);
      copy.append(description);
    }

    replaceChoiceLeading(button, optionDisplay.leading);
    button.append(copy);
    button.addEventListener("click", () => {
      controller.select.value = option.value;
      closeCustomSettingsSelect(controller, button, () => {
        renderCustomSettingsSelect(controller);
        controller.select.dispatchEvent(new Event("change", { bubbles: true }));
        controller.onSelect?.(option.value);
      });
    });
    controller.menu.append(button);
  });

  queueChoiceTickerOverflowRefresh(controller.trigger);
}

function initializeCustomSettingsSelects() {
  if (customSettingsSelectControllers.length > 0) {
    return;
  }

  [
    {
      picker: ui.settingsSectionPicker,
      select: ui.settingsSectionSelect,
      trigger: ui.settingsSectionTrigger,
      label: ui.settingsSectionTriggerLabel,
      preview: ui.settingsSectionTriggerPreview,
      menu: ui.settingsSectionMenu,
      getLeading: (option) => {
        const metadata = SETTINGS_SECTION_CHOICE_METADATA[option?.value] || SETTINGS_SECTION_CHOICE_METADATA.appearance;
        return {
          kind: "icon",
          icon: metadata.icon,
          accent: metadata.accent
        };
      }
    },
    {
      picker: ui.presetPicker,
      select: ui.presetSelect,
      trigger: ui.presetTrigger,
      label: ui.presetTriggerLabel,
      preview: ui.presetTriggerPreview,
      menu: ui.presetMenu,
      getLeading: (option) => {
        const metadata = WINDOW_PRESET_CHOICE_METADATA[option?.value] || WINDOW_PRESET_CHOICE_METADATA["top-center"];
        return {
          kind: "icon",
          icon: metadata.icon,
          accent: metadata.accent
        };
      }
    },
    {
      picker: ui.modePicker,
      select: ui.modeSelect,
      trigger: ui.modeTrigger,
      label: ui.modeTriggerLabel,
      preview: ui.modeTriggerPreview,
      menu: ui.modeMenu,
      getLeading: (option) => {
        const metadata = MODE_CHOICE_METADATA[option?.value] || MODE_CHOICE_METADATA.highlight;
        return {
          kind: "icon",
          icon: metadata.icon,
          accent: metadata.accent
        };
      }
    },
    {
      picker: ui.stylePicker,
      select: ui.styleSelect,
      trigger: ui.styleTrigger,
      label: ui.styleTriggerLabel,
      preview: ui.styleTriggerPreview,
      menu: ui.styleMenu
    },
    {
      picker: ui.themePicker,
      select: ui.themeSelect,
      trigger: ui.themeTrigger,
      label: ui.themeTriggerLabel,
      preview: ui.themeTriggerPreview,
      menu: ui.themeMenu,
      getLeading: (option) => ({
        kind: "theme",
        theme: option?.value || "main"
      })
    },
    {
      picker: ui.voiceLanguagePicker,
      select: ui.voiceLanguageSelect,
      trigger: ui.voiceLanguageTrigger,
      label: ui.voiceLanguageTriggerLabel,
      preview: ui.voiceLanguageTriggerPreview,
      menu: ui.voiceLanguageMenu,
      getLeading: (option) => ({
        kind: "flag",
        flag: getVoiceLanguageFlag(option?.value)
      }),
      getPreview: (option) => {
        const status = getSelectedVoiceModelStatus(option?.value);
        return status?.family || "";
      }
    },
    {
      picker: ui.voiceModelPicker,
      select: ui.voiceModelSelect,
      trigger: ui.voiceModelTrigger,
      label: ui.voiceModelTriggerLabel,
      preview: ui.voiceModelTriggerPreview,
      menu: ui.voiceModelMenu,
      getLeading: (option) => ({
        kind: "status",
        state: option?.dataset.installed === "true" ? "installed" : "missing",
        icon: option?.dataset.installed === "true" ? "ph-check-circle" : "ph-waveform"
      }),
      getLabel: (option) => option?.dataset.choiceLabel || option?.textContent?.trim() || option?.value || "",
      getPreview: (option) => option?.dataset.choicePreview || "",
      getOptionDescription: (option) => option?.title || option?.dataset.choicePreview || ""
    },
    {
      picker: ui.voiceStylePicker,
      select: ui.voiceStyleSelect,
      trigger: ui.voiceStyleTrigger,
      label: ui.voiceStyleTriggerLabel,
      preview: ui.voiceStyleTriggerPreview,
      menu: ui.voiceStyleMenu,
      getLeading: (option) => {
        const metadata = VOICE_STYLE_CHOICE_METADATA[option?.value] || VOICE_STYLE_CHOICE_METADATA.highlight;
        return {
          kind: "icon",
          icon: metadata.icon,
          accent: metadata.accent
        };
      }
    },
    {
      picker: ui.soundInputDevicePicker,
      select: ui.soundInputDeviceSelect,
      trigger: ui.soundInputDeviceTrigger,
      label: ui.soundInputDeviceTriggerLabel,
      preview: ui.soundInputDeviceTriggerPreview,
      menu: ui.soundInputDeviceMenu,
      getLeading: () => ({
        kind: "icon",
        icon: "ph-microphone",
        accent: "sound-input"
      })
    }
  ].forEach((controller) => {
    if (!controller.picker || !controller.select || !controller.trigger || !controller.label || !controller.menu) {
      return;
    }

    customSettingsSelectControllers.push(controller);
    controller.trigger.addEventListener("click", () => {
      if (controller.menu.classList.contains("hidden")) {
        customSettingsSelectControllers.forEach((entry) => {
          if (entry !== controller) {
            closeCustomSettingsSelect(entry);
          }
        });
        openCustomSettingsSelect(controller);
        return;
      }

      closeCustomSettingsSelect(controller);
    });
  });
}

function syncCustomSettingsSelects() {
  customSettingsSelectControllers.forEach((controller) => renderCustomSettingsSelect(controller));
}

function clampToInput(input, value) {
  const min = Number(input.min || Number.NEGATIVE_INFINITY);
  const max = Number(input.max || Number.POSITIVE_INFINITY);
  return Math.min(Math.max(value, min), max);
}

function syncSliderProgress(input) {
  if (!input) {
    return;
  }

  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value || min);
  const range = max - min;
  const progress = range > 0 ? ((value - min) / range) * 100 : 0;
  input.style.setProperty("--slider-progress", `${Math.max(0, Math.min(progress, 100))}%`);
}

function setSliderValue(input, value) {
  input.value = String(clampToInput(input, value));
  syncSliderProgress(input);
}

function setWindowSizePreviewActive(active) {
  if (windowSizePreviewReleaseTimer) {
    window.clearTimeout(windowSizePreviewReleaseTimer);
    windowSizePreviewReleaseTimer = 0;
  }

  document.body?.classList.toggle(WINDOW_SIZE_PREVIEW_CLASS, Boolean(active));
}

function scheduleWindowSizePreviewClear(delay = WINDOW_SIZE_PREVIEW_RELEASE_DELAY) {
  if (windowSizePreviewReleaseTimer) {
    window.clearTimeout(windowSizePreviewReleaseTimer);
  }

  windowSizePreviewReleaseTimer = window.setTimeout(() => {
    windowSizePreviewReleaseTimer = 0;
    setWindowSizePreviewActive(false);
  }, delay);
}

function initializeWindowSizePreview(inputs) {
  const sliderInputs = inputs.filter(Boolean);
  if (!sliderInputs.length) {
    return;
  }

  const armPreview = () => {
    setWindowSizePreviewActive(true);
  };

  const clearPreview = () => {
    setWindowSizePreviewActive(false);
  };

  const scheduleClearPreview = () => {
    scheduleWindowSizePreviewClear();
  };

  sliderInputs.forEach((input) => {
    input.addEventListener("pointerdown", armPreview);
    input.addEventListener("focus", armPreview);
    input.addEventListener("input", armPreview);
    input.addEventListener("pointerup", scheduleClearPreview);
    input.addEventListener("pointercancel", scheduleClearPreview);
    input.addEventListener("change", scheduleClearPreview);
    input.addEventListener("blur", scheduleClearPreview);
  });

  window.addEventListener("pointerup", scheduleClearPreview);
  window.addEventListener("pointercancel", scheduleClearPreview);
  window.addEventListener("blur", clearPreview);
}

function initializeWindowLocationPreview(input) {
  if (!input) {
    return;
  }

  const previewLocationChange = () => {
    setWindowSizePreviewActive(true);
    scheduleWindowSizePreviewClear(WINDOW_LOCATION_PREVIEW_RELEASE_DELAY);
  };

  input.addEventListener("input", previewLocationChange);
  input.addEventListener("change", previewLocationChange);
}

function updateValueLabels() {
  ui.xValue.textContent = `${ui.xInput.value} px`;
  ui.yValue.textContent = `${ui.yInput.value} px`;
  ui.widthValue.textContent = `${ui.widthInput.value} px`;
  ui.heightValue.textContent = `${ui.heightInput.value} px`;
  ui.scrollStartDelayValue.textContent = `${ui.scrollStartDelayInput.value} s`;
  ui.voiceConfidenceValue.textContent = formatVoiceConfidenceThreshold(parseLocaleNumber(ui.voiceConfidenceInput.value) / 100);
  ui.appOpacityValue.textContent = `${ui.appOpacityInput.value}%`;
  ui.textSizeValue.textContent = `${ui.textSizeInput.value}%`;
  ui.textOpacityValue.textContent = `${ui.textOpacityInput.value}%`;
  ui.soundInputNoiseGateValue.textContent = formatSoundInputNoiseGate(ui.soundInputNoiseGateInput.value);
  ui.soundInputGainValue.textContent = formatSoundInputGain(ui.soundInputGainInput.value);

  if (ui.cornerRadiusValue && ui.cornerRadiusInput) {
    ui.cornerRadiusValue.textContent = `${ui.cornerRadiusInput.value} px`;
  }
  if (ui.cardRadiusValue && ui.cardRadiusInput) {
    ui.cardRadiusValue.textContent = `${ui.cardRadiusInput.value} px`;
  }
  if (ui.borderWidthValue && ui.borderWidthInput) {
    ui.borderWidthValue.textContent = `${ui.borderWidthInput.value} px`;
  }
  if (ui.borderOpacityValue && ui.borderOpacityInput) {
    ui.borderOpacityValue.textContent = `${ui.borderOpacityInput.value}%`;
  }
  if (ui.glassBlurValue && ui.glassBlurInput) {
    ui.glassBlurValue.textContent = `${ui.glassBlurInput.value} px`;
  }
  if (ui.companionOpacityValue && ui.companionOpacityInput) {
    ui.companionOpacityValue.textContent = `${ui.companionOpacityInput.value}%`;
  }
}

function updatePositioningAvailability() {
  const disabled = ui.presetSelect.value !== "custom";
  ui.xInput.disabled = disabled;
  ui.yInput.disabled = disabled;
}

function updateAppearanceAvailability() {
  ui.modeSelect.disabled = false;
  ui.speedRailEnabledInput.disabled = false;
  const isVoiceMode = ui.modeSelect.value === "voice";
  const supportsStartDelay = ["highlight", "scroll", "line"].includes(ui.modeSelect.value);
  ui.scrollStartDelayInput.disabled = !supportsStartDelay;
  ui.voiceLanguageGroup.classList.toggle("hidden", !isVoiceMode);
  ui.voiceLanguageSelect.disabled = !isVoiceMode;
  ui.voiceStyleGroup.classList.toggle("hidden", !isVoiceMode);
  ui.voiceStyleSelect.disabled = !isVoiceMode;
  ui.voiceConfidenceGroup.classList.toggle("hidden", !isVoiceMode);
  ui.voiceConfidenceInput.disabled = !isVoiceMode;
  ui.textColorInput.disabled = false;

  if (isVoiceMode) {
    renderVoiceModelStatus(ui.voiceLanguageSelect.value);
  }
}

function updateRemoteModeUi() {
  ui.cloudRemoteFields.classList.remove("hidden");
}

function setActiveSettingsSection(section = ui.settingsSectionSelect?.value || "appearance") {
  try {
    const requestedSection = String(section || "appearance");
    const activeSection = isMicrosoftStoreBuild && requestedSection === "updates"
      ? "appearance"
      : requestedSection;

    if (ui.settingsSectionSelect) {
      ui.settingsSectionSelect.value = activeSection;
    }

    syncCustomSettingsSelects();

    ui.settingsSections.forEach((element) => {
      const selected = element.dataset.settingsSection === activeSection
        && !(isMicrosoftStoreBuild && element.dataset.settingsSection === "updates");
      element.classList.toggle("hidden", !selected);
      element.setAttribute("aria-hidden", selected ? "false" : "true");
    });

    syncSoundInputPreview().catch((error) => console.warn("Sound input preview sync skipped", error));

    if (activeSection === "updates") {
      checkForAppUpdates({ silentNoUpdate: true }).catch((error) => console.warn("App update check skipped", error));
    }

    document.querySelector(".page-shell")?.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Failed to switch settings section", error);
  }
}



function getRemoteSenderQrStatusKey(authUrl) {
  if (!CONFIGURED_REMOTE_PUBLIC_URL) {
    return "settings.remoteSenderQrUnavailable";
  }

  if (!authUrl) {
    return "settings.remoteSenderQrPending";
  }

  return "settings.remoteSenderQrHelp";
}

function getRealtimeEditingView(config = loadRealtimeEditingConfig()) {
  const hasRelayUrl = Boolean(CONFIGURED_REALTIME_RELAY_URL);
  const hasReceiverIdentity = Boolean(state.remote?.receiverId && state.remote?.accessPassword);
  const hasRoomLink = config.enabled && config.roomId === (state.remote?.receiverId || "") && Boolean(config.roomUrl);
  const shouldProbeRelay = realtimeEditingInitBusy || hasRoomLink;

  if (!hasRelayUrl) {
    return {
      hasRoomLink,
      cardState: "error",
      badgeKey: "settings.remoteRealtimeBadgeUnavailable",
      statusKey: "settings.remoteRealtimeUnavailable"
    };
  }

  if (shouldProbeRelay && getRealtimeRelayProbeState() === "error") {
    return {
      hasRoomLink,
      cardState: "error",
      badgeKey: "settings.remoteRealtimeBadgeUnavailable",
      statusKey: "settings.remoteRealtimeRelayUnavailable"
    };
  }

  if (!hasReceiverIdentity) {
    return {
      hasRoomLink: false,
      cardState: "idle",
      badgeKey: "settings.remoteRealtimeBadgeIdle",
      statusKey: "settings.remoteRealtimePending"
    };
  }

  if (realtimeEditingInitBusy) {
    return {
      hasRoomLink,
      cardState: "waiting",
      badgeKey: "settings.remoteRealtimeBadgeWaiting",
      statusKey: "settings.remoteRealtimeInitializing"
    };
  }

  if (hasRoomLink && config.lastReadyAtMs >= config.initializedAtMs && config.initializedAtMs > 0) {
    return {
      hasRoomLink,
      cardState: "online",
      badgeKey: "settings.remoteRealtimeBadgeOnline",
      statusKey: "settings.remoteRealtimeOnline"
    };
  }

  if (hasRoomLink && config.lastPublishedAtMs >= config.initializedAtMs && config.initializedAtMs > 0) {
    return {
      hasRoomLink,
      cardState: "idle",
      badgeKey: "settings.remoteRealtimeBadgeAvailable",
      statusKey: "settings.remoteRealtimeReady"
    };
  }

  if (hasRoomLink) {
    return {
      hasRoomLink,
      cardState: "waiting",
      badgeKey: "settings.remoteRealtimeBadgeWaiting",
      statusKey: "settings.remoteRealtimePublishing"
    };
  }

  return {
    hasRoomLink: false,
    cardState: "idle",
    badgeKey: "settings.remoteRealtimeBadgeIdle",
    statusKey: "settings.remoteRealtimeHelp"
  };
}

function getRealtimeEditingStatusKey(config = loadRealtimeEditingConfig()) {
  return getRealtimeEditingView(config).statusKey;
}

function getRealtimeQrStatusKey(hasRoomLink) {
  if (!CONFIGURED_REALTIME_RELAY_URL) {
    return "settings.remoteRealtimeUnavailable";
  }

  if (hasRoomLink && getRealtimeRelayProbeState() === "error") {
    return "settings.remoteRealtimeRelayUnavailable";
  }

  if (!hasRoomLink) {
    return "settings.remoteRealtimeQrPending";
  }

  return "settings.remoteRealtimeQrHelp";
}

async function probeRealtimeRelayAvailability(options = {}) {
  const { force = false } = options;
  const config = loadRealtimeEditingConfig();
  const hasRoomLink = config.enabled && config.roomId === (state.remote?.receiverId || "") && Boolean(config.roomUrl);

  if (!force && !hasRoomLink) {
    return false;
  }

  const result = await fetchRealtimeRelayProbe(force);
  renderRealtimeEditingState();
  return result;
}

function renderRealtimeEditingState() {
  renderRealtimeEditingStateAsync().catch(console.error);
}

function resetRealtimeRelayProbe() {
  // Probe state is now managed internally by realtime.js. 
  // It automatically handles retries without a reset.
}

function updateRealtimeActionButtons(hasRoomLink) {
  if (ui.initializeRealtimeEditingButton) {
    ui.initializeRealtimeEditingButton.disabled = realtimeEditingInitBusy || !CONFIGURED_REALTIME_RELAY_URL || !state.remote?.receiverId || !state.remote?.accessPassword;
    const label = realtimeEditingInitBusy ? t("settings.remoteRealtimeInitializing") : t("settings.remoteRealtimeInit");
    const labelNode = ui.initializeRealtimeEditingButton.querySelector("[data-i18n]");
    if (labelNode) {
      labelNode.textContent = label;
    }
  }

  if (ui.closeRealtimeEditingButton) {
    ui.closeRealtimeEditingButton.disabled = realtimeEditingInitBusy || !hasRoomLink;
  }
}

async function renderRealtimeEditingStateAsync() {
  let config = loadRealtimeEditingConfig();
  if (config.enabled && CONFIGURED_REALTIME_RELAY_URL && config.roomId === (state.remote?.receiverId || "") && config.passwordHash) {
    const syncedRoomUrl = buildRealtimeRoomUrl(CONFIGURED_REMOTE_PUBLIC_URL, config.roomId, config.passwordHash);
    if (syncedRoomUrl && syncedRoomUrl !== config.roomUrl) {
      config = {
        ...config,
        roomUrl: syncedRoomUrl
      };
      saveRealtimeEditingConfig(config);
    }
  }

  const view = getRealtimeEditingView(config);
  const hasRoomLink = view.hasRoomLink;
  const statusKey = view.statusKey;
  const qrStatusKey = getRealtimeQrStatusKey(hasRoomLink);
  const nextRoomUrl = hasRoomLink ? config.roomUrl : "";
  if (nextRoomUrl !== remoteRealtimeQrSource || (nextRoomUrl && !remoteRealtimeQrDataUrl)) {
    remoteRealtimeQrSource = nextRoomUrl;
    remoteRealtimeQrDataUrl = nextRoomUrl ? await getRemoteQrDataUrl(nextRoomUrl, "realtime room") : "";
  }
  const canRenderQr = Boolean(hasRoomLink && remoteRealtimeQrDataUrl);

  if (ui.remoteRealtimeStatus) {
    ui.remoteRealtimeStatus.dataset.i18n = statusKey;
    ui.remoteRealtimeStatus.textContent = t(statusKey);
  }

  if (ui.remoteRealtimeBadge) {
    ui.remoteRealtimeBadge.dataset.i18n = view.badgeKey;
    ui.remoteRealtimeBadge.textContent = t(view.badgeKey);
    ui.remoteRealtimeBadge.classList.toggle("is-offline", view.cardState === "error");
    ui.remoteRealtimeBadge.classList.toggle("is-waiting", view.cardState === "waiting");
    ui.remoteRealtimeBadge.classList.toggle("is-neutral", false);
  }

  if (ui.remoteRealtimeCard) {
    ui.remoteRealtimeCard.dataset.state = view.cardState;
    ui.remoteRealtimeCard.dataset.hasRoom = hasRoomLink ? "true" : "false";
  }

  if (ui.remoteRealtimePasswordInput) {
    ui.remoteRealtimePasswordInput.value = hasRoomLink ? config.passwordHash : "";
  }

  if (ui.remoteRealtimeLink) {
    ui.remoteRealtimeLink.href = hasRoomLink ? config.roomUrl : "#";
    ui.remoteRealtimeLink.textContent = hasRoomLink ? config.roomUrl : t("common.unavailable");
  }

  if (ui.remoteRealtimeQrStatus) {
    ui.remoteRealtimeQrStatus.dataset.i18n = qrStatusKey;
    ui.remoteRealtimeQrStatus.textContent = t(qrStatusKey);
  }

  if (ui.remoteRealtimeQrImage) {
    ui.remoteRealtimeQrImage.classList.toggle("hidden", !canRenderQr);
    ui.remoteRealtimeQrImage.setAttribute("aria-label", t("settings.remoteRealtimeQrHelp"));
    ui.remoteRealtimeQrImage.alt = t("settings.remoteRealtimeQrHelp");
    if (canRenderQr) {
      ui.remoteRealtimeQrImage.src = remoteRealtimeQrDataUrl;
    } else {
      ui.remoteRealtimeQrImage.removeAttribute("src");
    }
  }

  if (ui.copyRealtimePasswordButton) {
    ui.copyRealtimePasswordButton.disabled = !hasRoomLink;
  }

  if (ui.copyRealtimeLinkButton) {
    ui.copyRealtimeLinkButton.disabled = !hasRoomLink;
  }

  updateRealtimeActionButtons(hasRoomLink);
}

async function initializeRealtimeEditing() {
  if (realtimeEditingInitBusy) {
    return;
  }

  if (!CONFIGURED_REALTIME_RELAY_URL || !state.remote?.receiverId || !state.remote?.accessPassword) {
    renderRealtimeEditingState();
    return;
  }

  realtimeEditingInitBusy = true;
  renderRealtimeEditingState();

  try {
    resetRealtimeRelayProbe();
    const passwordHash = await createRealtimePasswordHash(state.remote.receiverId, state.remote.accessPassword);
    const roomUrl = buildRealtimeRoomUrl(CONFIGURED_REMOTE_PUBLIC_URL, state.remote.receiverId, passwordHash);
    saveRealtimeEditingConfig({
      enabled: true,
      roomId: state.remote.receiverId,
      passwordHash,
      roomUrl,
      initializedAtMs: Date.now(),
      lastPublishedAtMs: Date.now(),
      lastReadyAtMs: 0
    });
    probeRealtimeRelayAvailability({ force: true }).catch(console.error);
  } catch (error) {
    console.error("Failed to initialize realtime editing", error);
  } finally {
    realtimeEditingInitBusy = false;
    renderRealtimeEditingState();
  }
}

function closeRealtimeEditing() {
  resetRealtimeRelayProbe();
  clearRealtimeEditingConfig();
  renderRealtimeEditingState();
}

async function getRemoteQrDataUrl(value, label = "QR code") {
  if (!value) {
    return "";
  }

  const qrLib = QRCode || window.QRCode;

  // 1. Vector SVG data URI: high-definition, reliable, no canvas dependencies
  if (typeof qrLib?.toString === "function") {
    try {
      const svg = await qrLib.toString(value, {
        type: "svg",
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        }
      });
      if (svg && typeof svg === "string" && svg.includes("<svg")) {
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      }
    } catch (svgError) {
      console.warn(`SVG QR generation fallback for ${label}`, svgError);
    }
  }

  // 2. Fallback to canvas toDataURL (PNG)
  if (typeof qrLib?.toDataURL === "function") {
    try {
      return await qrLib.toDataURL(value, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 220,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        }
      });
    } catch (error) {
      console.error(`Failed to render ${label} via canvas`, error);
    }
  }

  // 3. Dynamic script loader fallback
  if (typeof window.QRCode?.toDataURL !== "function" && typeof window.QRCode?.toString !== "function") {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "./assets/vendor/qrcode.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    } catch (error) {
      console.warn("Failed to load QRCode library dynamically", error);
    }

    if (typeof window.QRCode?.toString === "function") {
      try {
        const svg = await window.QRCode.toString(value, {
          type: "svg",
          margin: 1,
          color: {
            dark: "#0f172a",
            light: "#ffffff"
          }
        });
        if (svg && typeof svg === "string" && svg.includes("<svg")) {
          return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        }
      } catch (e) {}
    }

    if (typeof window.QRCode?.toDataURL === "function") {
      try {
        return await window.QRCode.toDataURL(value, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 220,
          color: {
            dark: "#0f172a",
            light: "#ffffff"
          }
        });
      } catch (e) {}
    }
  }

  console.error(`QRCode library unavailable for ${label}`);
  return "";
}

async function renderRemoteSenderQr() {
  const receiverId = state.remote?.receiverId || loadState().remote?.receiverId || "";
  const accessPassword = state.remote?.accessPassword || loadState().remote?.accessPassword || "";
  const authUrl = buildCloudSenderAuthUrl(receiverId, accessPassword);
  const statusKey = getRemoteSenderQrStatusKey(authUrl);
  if (authUrl !== remoteSenderQrSource || (authUrl && !remoteSenderQrDataUrl)) {
    remoteSenderQrSource = authUrl;
    remoteSenderQrDataUrl = authUrl ? await getRemoteQrDataUrl(authUrl, "remote sender QR code") : "";
  }
  const canRender = Boolean(authUrl && remoteSenderQrDataUrl);

  if (ui.remoteSenderQrStatus) {
    ui.remoteSenderQrStatus.dataset.i18n = statusKey;
    ui.remoteSenderQrStatus.textContent = t(statusKey);
  }

  if (ui.remoteSenderQrImage) {
    ui.remoteSenderQrImage.classList.toggle("hidden", !canRender);
    ui.remoteSenderQrImage.setAttribute("aria-label", t("settings.remoteSenderQrHelp"));
    ui.remoteSenderQrImage.alt = t("settings.remoteSenderQrHelp");
    if (canRender) {
      ui.remoteSenderQrImage.src = remoteSenderQrDataUrl;
    } else {
      ui.remoteSenderQrImage.removeAttribute("src");
    }
  }

  if (ui.copySenderAuthUrlButton) {
    ui.copySenderAuthUrlButton.disabled = !authUrl;
  }

  if (ui.remoteSenderQrCard) {
    ui.remoteSenderQrCard.dataset.copyValue = authUrl;
  }
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
    const scaleFactor = normalizeScaleFactor(await appWindow.scaleFactor?.().catch(() => 1));
    const size = physicalSizeToLogical(await appWindow.outerSize(), scaleFactor);
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

function normalizeScaleFactor(scaleFactor) {
  const numericScaleFactor = Number(scaleFactor);
  return Number.isFinite(numericScaleFactor) && numericScaleFactor > 0 ? numericScaleFactor : 1;
}

function physicalSizeToLogical(size, scaleFactor) {
  if (!size) {
    return { width: 0, height: 0 };
  }

  if (typeof size.toLogical === "function") {
    return size.toLogical(scaleFactor);
  }

  return {
    width: Number(size.width || 0) / scaleFactor,
    height: Number(size.height || 0) / scaleFactor
  };
}

function logicalValueToPhysical(value, scaleFactor) {
  return Math.round((Number(value) || 0) * scaleFactor);
}

function getMonitorLogicalSize(monitor) {
  return physicalSizeToLogical(monitor?.size, normalizeScaleFactor(monitor?.scaleFactor));
}

async function configureSliderRanges() {
  const allMonitors = await tauriWindow?.availableMonitors?.().catch(() => []) || [];
  const monitor = await getRelevantMonitor();
  const scaleFactor = normalizeScaleFactor(monitor?.scaleFactor ?? 1);
  const baseWidth = Math.max(state.window?.width || defaultState.window.width, MIN_WIDTH);
  const baseHeight = Math.max(state.window?.height || defaultState.window.height, MIN_HEIGHT);
  const baseWidthPhysical = logicalValueToPhysical(baseWidth, scaleFactor);
  const baseHeightPhysical = logicalValueToPhysical(baseHeight, scaleFactor);

  let minX = 0;
  let maxX = 1920 - baseWidthPhysical;
  let minY = 0;
  let maxY = 1080 - baseHeightPhysical;

  if (allMonitors.length > 0) {
    minX = Math.min(...allMonitors.map((m) => m.position?.x ?? 0));
    maxX = Math.max(...allMonitors.map((m) => (m.position?.x ?? 0) + Math.max((m.size?.width ?? 1920) - baseWidthPhysical, 0)));
    minY = Math.min(...allMonitors.map((m) => m.position?.y ?? 0));
    maxY = Math.max(...allMonitors.map((m) => (m.position?.y ?? 0) + Math.max((m.size?.height ?? 1080) - baseHeightPhysical, 0)));
  } else if (monitor) {
    const originX = monitor.position?.x ?? 0;
    const originY = monitor.position?.y ?? 0;
    const monitorWidth = monitor.size?.width ?? 1920;
    const monitorHeight = monitor.size?.height ?? 1080;
    minX = originX;
    maxX = originX + Math.max(monitorWidth - baseWidthPhysical, 0);
    minY = originY;
    maxY = originY + Math.max(monitorHeight - baseHeightPhysical, 0);
  }

  ui.xInput.min = String(minX);
  ui.xInput.max = String(Math.max(maxX, minX));
  ui.yInput.min = String(minY);
  ui.yInput.max = String(Math.max(maxY, minY));

  const logicalMonitorSize = getMonitorLogicalSize(monitor);
  const gutterWidth = getSpeedRailWindowGutter();
  const sideGutter = getSidePanelWindowGutter();
  const totalGutters = gutterWidth + sideGutter;
  ui.widthInput.max = String(Math.max(Math.min((logicalMonitorSize.width || 1920) - totalGutters, MAX_WIDTH_FALLBACK - totalGutters), MIN_WIDTH));
  ui.heightInput.max = String(Math.max(logicalMonitorSize.height || 1080, MAX_HEIGHT_FALLBACK));
}

function fillForm() {
  isSyncingForm = true;
  setSliderValue(ui.xInput, state.window.x ?? 0);
  setSliderValue(ui.yInput, state.window.y ?? 0);
  setSliderValue(ui.widthInput, state.window.width);
  setSliderValue(ui.heightInput, state.window.height);
  ui.presetSelect.value = state.window.preset || "top-center";
  ui.modeSelect.value = state.appearance?.mode || defaultState.appearance.mode;
  setSliderValue(ui.scrollStartDelayInput, state.appearance?.scrollStartDelaySeconds ?? defaultState.appearance.scrollStartDelaySeconds);
  setSliderValue(ui.voiceConfidenceInput, normalizeVoiceConfidenceThreshold(state.voiceTracking?.confidenceThreshold) * 100);
  ui.fontSelect.value = state.appearance?.fontFamily || defaultState.appearance.fontFamily;
  ui.languageSelect.value = state.language || defaultState.language;
  syncRemoteSessionFields();
  setSliderValue(ui.appOpacityInput, state.appearance?.appOpacity ?? defaultState.appearance.appOpacity);
  ui.textSizeInput.value = String(state.appearance?.textScale || defaultState.appearance.textScale);
  ui.styleSelect.value = state.appearance?.style || defaultState.appearance.style;
  ui.themeSelect.value = state.appearance?.theme || defaultState.appearance.theme;
  ui.mirrorModeInput.checked = Boolean(state.appearance?.mirrorMode);
  ui.mirrorVerticalInput.checked = Boolean(state.appearance?.mirrorVertical);
  ui.autoHideToolbarInput.checked = Boolean(state.appearance?.autoHideToolbar);
  ui.speedRailEnabledInput.checked = state.appearance?.speedRailEnabled !== false;
  ui.soundInputDeviceSelect.value = normalizeSoundInputDeviceId(state.appearance?.soundInputDeviceId || SOUND_INPUT_DEFAULT_DEVICE_ID);
  setSliderValue(ui.soundInputNoiseGateInput, normalizeSoundInputNoiseGate(state.appearance?.soundInputNoiseGate));
  setSliderValue(ui.soundInputGainInput, normalizeSoundInputGain(state.appearance?.soundInputGain));
  
  ui.voiceLanguageSelect.value = normalizeVoiceLanguage(state.appearance?.voiceLanguage || "en-US");
  ui.voiceStyleSelect.value = state.appearance?.voiceScrollStyle || defaultState.appearance.voiceScrollStyle;
  ui.appWideVoiceCommandsInput.checked = Boolean(state.appearance?.appWideVoiceCommands);
  
  ui.performanceModeInput.checked = Boolean(state.appearance?.performanceMode);
  ui.hideFromCaptureInput.checked = Boolean(state.desktop?.hideFromCapture);
  ui.useSystemTrayInput.checked = Boolean(state.desktop?.useSystemTray);
  ui.preventSleepInput.checked = Boolean(state.desktop?.preventSleep);
  ui.clickthroughShortcutInput.checked = Boolean(state.desktop?.clickthroughShortcutEnabled);
  if (ui.showScriptManagerInput) ui.showScriptManagerInput.checked = Boolean(state.modules?.scriptManager);
  if (ui.showScriptCompletionInput) ui.showScriptCompletionInput.checked = Boolean(state.modules?.scriptCompletion);
  ui.textColorInput.value = state.appearance?.textColor || getThemeTeleprompterTextColor(ui.themeSelect.value);
  ui.textOpacityInput.value = String(state.appearance?.textOpacity || defaultState.appearance.textOpacity);

  if (ui.cornerRadiusInput) setSliderValue(ui.cornerRadiusInput, state.appearance?.cornerRadius ?? defaultState.appearance.cornerRadius);
  if (ui.cardRadiusInput) setSliderValue(ui.cardRadiusInput, state.appearance?.cardRadius ?? defaultState.appearance.cardRadius);
  if (ui.borderWidthInput) setSliderValue(ui.borderWidthInput, state.appearance?.borderWidth ?? defaultState.appearance.borderWidth);
  if (ui.borderOpacityInput) setSliderValue(ui.borderOpacityInput, state.appearance?.borderOpacity ?? defaultState.appearance.borderOpacity);
  if (ui.glassBlurInput) setSliderValue(ui.glassBlurInput, state.appearance?.glassBlur ?? defaultState.appearance.glassBlur);
  if (ui.companionOpacityInput) setSliderValue(ui.companionOpacityInput, state.appearance?.companionOpacity ?? defaultState.appearance.companionOpacity);

  if (ui.customAccentColorInput) {
    ui.customAccentColorInput.value = state.appearance?.customAccentColor || "#818cf8";
  }
  if (ui.customAccentColorHex) {
    ui.customAccentColorHex.value = state.appearance?.customAccentColor || "";
  }
  if (ui.customHighlightColorInput) {
    ui.customHighlightColorInput.value = state.appearance?.customHighlightColor || "#facc15";
  }
  if (ui.customHighlightColorHex) {
    ui.customHighlightColorHex.value = state.appearance?.customHighlightColor || "";
  }

  updatePositioningAvailability();
  updateAppearanceAvailability();
  updateRemoteModeUi();
  updateValueLabels();
  applyAppearanceToDocument(state.appearance || {
    theme: ui.themeSelect.value,
    style: ui.styleSelect.value,
    mirrorMode: ui.mirrorModeInput.checked,
    mirrorVertical: ui.mirrorVerticalInput.checked,
    autoHideToolbar: ui.autoHideToolbarInput.checked,
    performanceMode: ui.performanceModeInput.checked,
    appOpacity: parseLocaleNumber(ui.appOpacityInput.value)
  });
  applyTranslationsToDocument(ui.languageSelect.value);
  setSoundInputStatus(soundInputStatusKey);
  renderFontPicker(ui.fontSelect.value, ui.languageSelect.value);
  renderLanguagePicker(ui.languageSelect.value, ui.languageSelect.value);
  syncCustomSettingsSelects();
  renderRemoteSenderQr();
  renderVoiceLanguageOptions();
  if (ui.modeSelect.value === "voice") {
    renderVoiceModelStatus(ui.voiceLanguageSelect.value);
  }
  renderUpdaterCard();
  isSyncingForm = false;
}

function syncRemoteSessionFields() {
  const receiverId = state.remote?.receiverId || "";
  const cloudSenderUrl = buildCloudSenderUrl(receiverId);
  const accessPassword = state.remote?.accessPassword || "";

  if (ui.remoteSessionId) {
    ui.remoteSessionId.textContent = receiverId || t("common.unavailable");
  }

  if (ui.remoteAccessPasswordInput) {
    ui.remoteAccessPasswordInput.value = accessPassword;
  }

  if (ui.remoteSenderUrl) {
    ui.remoteSenderUrl.textContent = cloudSenderUrl || t("settings.remoteSenderUnavailable");
    ui.remoteSenderUrl.href = cloudSenderUrl || "#";
    ui.remoteSenderUrl.dataset.copyValue = cloudSenderUrl;
  }
}

async function readCurrentWindow() {
  const appWindow = await getMainWindow();
  if (!appWindow) return;

  const scaleFactor = normalizeScaleFactor(await appWindow.scaleFactor?.().catch(() => 1));
  const pos = await appWindow.outerPosition?.().catch?.(() => null);

  if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
    const gutterWidth = getSpeedRailWindowGutter();
    const gutterWidthPhysical = logicalValueToPhysical(gutterWidth, scaleFactor);
    const topCenterOffsetPhysical = logicalValueToPhysical(TOP_CENTER_X_OFFSET, scaleFactor);
    const positionOffset = state.window?.preset === "top-center"
      ? topCenterOffsetPhysical - gutterWidthPhysical
      : -gutterWidthPhysical;
    state.window.x = pos.x - positionOffset;
    state.window.y = pos.y;
  }

  await configureSliderRanges();
  fillForm();
  ui.windowStatus.textContent = t("settings.synced");
}

function collectFormState() {
  state.window.width = Math.max(parseLocaleNumber(ui.widthInput.value) || defaultState.window.width, MIN_WIDTH);
  state.window.height = Math.max(parseLocaleNumber(ui.heightInput.value) || defaultState.window.height, MIN_HEIGHT);
  state.window.x = parseLocaleNumber(ui.xInput.value || 0);
  state.window.y = parseLocaleNumber(ui.yInput.value || 0);
  state.window.preset = ui.presetSelect.value;
  state.language = ui.languageSelect.value;
  state.desktop = {
    hideFromCapture: ui.hideFromCaptureInput.checked,
    useSystemTray: ui.useSystemTrayInput.checked,
    preventSleep: ui.preventSleepInput.checked,
    clickthroughShortcutEnabled: ui.clickthroughShortcutInput.checked
  };
  state.modules = {
    scriptManager: Boolean(ui.showScriptManagerInput?.checked),
    scriptCompletion: Boolean(ui.showScriptCompletionInput?.checked)
  };
  state.remote = {
    provider: "cloud",
    receiverId: state.remote?.receiverId || defaultState.remote.receiverId,
    receiverSecret: state.remote?.receiverSecret || defaultState.remote.receiverSecret,
    accessPassword: state.remote?.accessPassword || defaultState.remote.accessPassword,
    publicHost: "",
  };
  state.voiceTracking = {
    ...(defaultState.voiceTracking || {}),
    ...(state.voiceTracking || {}),
    confidenceThreshold: normalizeVoiceConfidenceThreshold(parseLocaleNumber(ui.voiceConfidenceInput.value) / 100)
  };
  state.appearance = {
    ...defaultState.appearance,
    ...(state.appearance || {}),
    mode: ui.modeSelect.value,
    voiceLanguage: ui.voiceLanguageSelect.value,
    voiceScrollStyle: ui.voiceStyleSelect.value,
    appWideVoiceCommands: ui.appWideVoiceCommandsInput.checked,
    soundInputDeviceId: normalizeSoundInputDeviceId(ui.soundInputDeviceSelect.value),
    soundInputDeviceLabel: getSelectedSoundInputDeviceLabel(),
    soundInputNoiseGate: normalizeSoundInputNoiseGate(ui.soundInputNoiseGateInput.value),
    soundInputGain: normalizeSoundInputGain(ui.soundInputGainInput.value),
    fontFamily: ui.fontSelect.value,
    appOpacity: parseLocaleNumber(ui.appOpacityInput.value),
    textScale: parseLocaleNumber(ui.textSizeInput.value),
    theme: ui.themeSelect.value,
    style: ui.styleSelect.value,
    mirrorMode: ui.mirrorModeInput.checked,
    mirrorVertical: ui.mirrorVerticalInput.checked,
    autoHideToolbar: ui.autoHideToolbarInput.checked,
    speedRailEnabled: ui.speedRailEnabledInput.checked,
    performanceMode: ui.performanceModeInput.checked,
    scrollStartDelaySeconds: parseLocaleNumber(ui.scrollStartDelayInput.value),
    textColor: ui.textColorInput.value || state.appearance?.textColor || getThemeTeleprompterTextColor(ui.themeSelect.value),
    textOpacity: parseLocaleNumber(ui.textOpacityInput.value),
    cornerRadius: parseLocaleNumber(ui.cornerRadiusInput?.value ?? defaultState.appearance.cornerRadius),
    cardRadius: parseLocaleNumber(ui.cardRadiusInput?.value ?? defaultState.appearance.cardRadius),
    borderWidth: parseLocaleNumber(ui.borderWidthInput?.value ?? defaultState.appearance.borderWidth),
    borderOpacity: parseLocaleNumber(ui.borderOpacityInput?.value ?? defaultState.appearance.borderOpacity),
    glassBlur: parseLocaleNumber(ui.glassBlurInput?.value ?? defaultState.appearance.glassBlur),
    companionOpacity: parseLocaleNumber(ui.companionOpacityInput?.value ?? defaultState.appearance.companionOpacity),
    customAccentColor: normalizeCustomColor(ui.customAccentColorHex?.value || ui.customAccentColorInput?.value || ""),
    customHighlightColor: normalizeCustomColor(ui.customHighlightColorHex?.value || ui.customHighlightColorInput?.value || "")
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
    await configureSliderRanges();
    const windowIsCollapsed = await isMainWindowCollapsed(appWindow);
    const gutterWidth = getSpeedRailWindowGutter();
    const sideGutter = getSidePanelWindowGutter();
    const totalGutters = gutterWidth + sideGutter;
    const monitor = await getRelevantMonitor();
    const scaleFactor = normalizeScaleFactor(await appWindow.scaleFactor?.().catch(() => monitor?.scaleFactor ?? 1));
    const gutterWidthPhysical = logicalValueToPhysical(gutterWidth, scaleFactor);
    const positionOffset = -gutterWidthPhysical;
    const baseWidth = Math.max(state.window.width, MIN_WIDTH);
    const baseWidthPhysical = logicalValueToPhysical(baseWidth, scaleFactor);
    const logicalMonitorSize = getMonitorLogicalSize(monitor);
    const maxContentWidth = Math.max(Math.min((logicalMonitorSize.width || (state.window.width + totalGutters)) - totalGutters, MAX_WIDTH_FALLBACK - totalGutters), MIN_WIDTH);
    state.window.width = Math.max(Math.min(state.window.width, maxContentWidth), MIN_WIDTH);
    state.window.height = Math.max(Math.min(state.window.height, logicalMonitorSize.height || MAX_HEIGHT_FALLBACK), MIN_HEIGHT);

    const bottomGutter = getBottomDockWindowGutter();
    const targetHeight = state.window.height + bottomGutter;

    if (!windowIsCollapsed) {
      const targetLogicalSize = new tauriDpi.LogicalSize(state.window.width + totalGutters, targetHeight);
      const targetPhysicalSize = targetLogicalSize.toPhysical(scaleFactor);
      await appWindow.setSize(targetLogicalSize);

      if (state.window.preset === "center" && tauriWindow.currentMonitor && tauriWindow.primaryMonitor) {
        const monitor = (await tauriWindow.currentMonitor()) ?? (await tauriWindow.primaryMonitor());
        if (monitor) {
          const x = monitor.position.x + Math.round((monitor.size.width - baseWidthPhysical) / 2) - gutterWidthPhysical;
          const y = monitor.position.y + Math.round((monitor.size.height - targetPhysicalSize.height) / 2);
          await appWindow.setPosition(new tauriDpi.PhysicalPosition(x, y));
          state.window.x = x - positionOffset;
          state.window.y = y;
        }
      } else if (state.window.preset === "top-center" && tauriWindow.currentMonitor && tauriWindow.primaryMonitor) {
        const monitor = (await tauriWindow.currentMonitor()) ?? (await tauriWindow.primaryMonitor());
        if (monitor) {
          const x = monitor.position.x + Math.round((monitor.size.width - baseWidthPhysical) / 2) - gutterWidthPhysical;
          const y = monitor.position.y;
          await appWindow.setPosition(new tauriDpi.PhysicalPosition(x, y));
          state.window.x = x - positionOffset;
          state.window.y = y;
        }
      } else {
        await appWindow.setPosition(new tauriDpi.PhysicalPosition(state.window.x + positionOffset, state.window.y));
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
      voiceTracking: state.voiceTracking,
      language: state.language,
      appearance: state.appearance,
      modules: state.modules
    });
    await applyDesktopSettings();
    fillForm();
    ui.windowStatus.dataset.i18n = "settings.autoApply";
    ui.windowStatus.textContent = t("settings.autoApply");
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

async function copyText(value, successMessage, targetElement = ui.remoteSessionStatus) {
  if (!value) {
    if (targetElement) {
      targetElement.textContent = t("settings.copyNothing");
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    if (targetElement) {
      targetElement.textContent = successMessage;
    }
  } catch (error) {
    console.error(error);
    if (targetElement) {
      targetElement.textContent = t("settings.copyFailed");
    }
  }
}

function renderCloudRemoteStatus(status) {
  syncRemoteSessionFields();

  if (!CONFIGURED_CLOUD_RELAY_URL) {
    ui.remoteLiveBadge.textContent = t("common.setup");
    ui.remoteLiveBadge.classList.add("is-neutral");
    ui.remoteLiveBadge.classList.remove("is-offline", "is-waiting");
    ui.remoteSessionStatus.textContent = t("settings.remoteStatusCloudNeedsBuild");
    return;
  }

  const active = Boolean(status?.active);
  const exists = Boolean(status?.exists);
  ui.remoteLiveBadge.textContent = active ? t("settings.remoteRealtimeBadgeAvailable") : t("common.offline");
  ui.remoteLiveBadge.classList.toggle("is-offline", !active);
  ui.remoteLiveBadge.classList.toggle("is-neutral", false);
  ui.remoteLiveBadge.classList.toggle("is-waiting", exists && !active);

  if (!exists) {
    ui.remoteSessionStatus.textContent = t("settings.remoteStatusCloudRegister");
    return;
  }

  ui.remoteSessionStatus.textContent = active
    ? t("settings.remoteStatusCloudActive")
    : t("settings.remoteStatusCloudOffline");
}

async function updateCloudRemoteStatus() {
  const status = await fetchCloudRemoteStatus();
  renderCloudRemoteStatus(status);
}

async function refreshRemoteStatus() {
  await updateCloudRemoteStatus();
}

function resetAdvancedStyling() {
  if (ui.cornerRadiusInput) setSliderValue(ui.cornerRadiusInput, defaultState.appearance.cornerRadius);
  if (ui.cardRadiusInput) setSliderValue(ui.cardRadiusInput, defaultState.appearance.cardRadius);
  if (ui.borderWidthInput) setSliderValue(ui.borderWidthInput, defaultState.appearance.borderWidth);
  if (ui.borderOpacityInput) setSliderValue(ui.borderOpacityInput, defaultState.appearance.borderOpacity);
  if (ui.glassBlurInput) setSliderValue(ui.glassBlurInput, defaultState.appearance.glassBlur);
  if (ui.companionOpacityInput) setSliderValue(ui.companionOpacityInput, defaultState.appearance.companionOpacity);
  if (ui.customAccentColorInput) ui.customAccentColorInput.value = "#818cf8";
  if (ui.customAccentColorHex) ui.customAccentColorHex.value = "";
  if (ui.customHighlightColorInput) ui.customHighlightColorInput.value = "#facc15";
  if (ui.customHighlightColorHex) ui.customHighlightColorHex.value = "";

  [ui.cornerRadiusInput, ui.cardRadiusInput, ui.borderWidthInput, ui.borderOpacityInput, ui.glassBlurInput, ui.companionOpacityInput].forEach((input) => {
    if (input) syncSliderProgress(input);
  });
  updateValueLabels();
  scheduleApply();
}

async function bootSettingsPage() {
  setUpdaterDelegate({
    onStateChange: () => renderUpdaterCard(),
    translate: t,
    onWindowStatusChange: (text) => {
      if (ui.windowStatus) {
        ui.windowStatus.textContent = text;
      }
    }
  });

  clearStaleRealtimeEditingConfig();
  initializeCustomSettingsSelects();
  fillForm();
  initializeDesktopWindowOpacityFade();
  initializeSmoothScrollbox();
  initializeWindowSizePreview([ui.xInput, ui.yInput, ui.widthInput, ui.heightInput]);
  initializeWindowLocationPreview(ui.presetSelect);
  renderRealtimeEditingState();

  if (navigator.mediaDevices?.addEventListener) {
    navigator.mediaDevices.addEventListener("devicechange", () => {
      refreshSoundInputDevices().catch(console.error);
    });
  }

  if (tauriEvent?.listen) {
    tauriEvent.listen("flow-voice-model-download", (event) => {
      handleVoiceModelDownloadEvent(event.payload);
    }).then((unlisten) => {
      unlistenVoiceModelDownloads = unlisten;
    }).catch(console.error);
  }

  [
    ui.xInput, ui.yInput, ui.widthInput, ui.heightInput, ui.scrollStartDelayInput,
    ui.voiceConfidenceInput, ui.appOpacityInput, ui.textSizeInput, ui.textOpacityInput,
    ui.soundInputNoiseGateInput, ui.soundInputGainInput,
    ui.cornerRadiusInput, ui.cardRadiusInput, ui.borderWidthInput, ui.borderOpacityInput, ui.glassBlurInput, ui.companionOpacityInput
  ].forEach((input) => {
    if (!input) return;
    syncSliderProgress(input);
    input.addEventListener("input", () => {
      syncSliderProgress(input);
      updateValueLabels();
      scheduleApply();
    });
  });

  ui.customAccentColorInput?.addEventListener("input", () => {
    if (ui.customAccentColorHex) {
      ui.customAccentColorHex.value = ui.customAccentColorInput.value;
    }
    scheduleApply();
  });
  ui.customAccentColorHex?.addEventListener("input", () => {
    const val = normalizeCustomColor(ui.customAccentColorHex.value, "");
    if (val && ui.customAccentColorInput) {
      ui.customAccentColorInput.value = val;
    }
    scheduleApply();
  });

  ui.customHighlightColorInput?.addEventListener("input", () => {
    if (ui.customHighlightColorHex) {
      ui.customHighlightColorHex.value = ui.customHighlightColorInput.value;
    }
    scheduleApply();
  });
  ui.customHighlightColorHex?.addEventListener("input", () => {
    const val = normalizeCustomColor(ui.customHighlightColorHex.value, "");
    if (val && ui.customHighlightColorInput) {
      ui.customHighlightColorInput.value = val;
    }
    scheduleApply();
  });

  ui.resetStylingButton?.addEventListener("click", () => {
    resetAdvancedStyling();
  });

  ui.resetCornerRadiusBtn?.addEventListener("click", () => {
    if (ui.cornerRadiusInput) {
      setSliderValue(ui.cornerRadiusInput, defaultState.appearance.cornerRadius);
      updateValueLabels();
      scheduleApply();
    }
  });

  ui.resetCardRadiusBtn?.addEventListener("click", () => {
    if (ui.cardRadiusInput) {
      setSliderValue(ui.cardRadiusInput, defaultState.appearance.cardRadius);
      updateValueLabels();
      scheduleApply();
    }
  });

  ui.resetBorderWidthBtn?.addEventListener("click", () => {
    if (ui.borderWidthInput) {
      setSliderValue(ui.borderWidthInput, defaultState.appearance.borderWidth);
      updateValueLabels();
      scheduleApply();
    }
  });

  ui.resetBorderOpacityBtn?.addEventListener("click", () => {
    if (ui.borderOpacityInput) {
      setSliderValue(ui.borderOpacityInput, defaultState.appearance.borderOpacity);
      updateValueLabels();
      scheduleApply();
    }
  });

  ui.resetGlassBlurBtn?.addEventListener("click", () => {
    if (ui.glassBlurInput) {
      setSliderValue(ui.glassBlurInput, defaultState.appearance.glassBlur);
      updateValueLabels();
      scheduleApply();
    }
  });

  ui.resetCompanionOpacityBtn?.addEventListener("click", () => {
    if (ui.companionOpacityInput) {
      setSliderValue(ui.companionOpacityInput, defaultState.appearance.companionOpacity);
      updateValueLabels();
      scheduleApply();
    }
  });

  ui.resetCustomAccentBtn?.addEventListener("click", () => {
    if (ui.customAccentColorInput) ui.customAccentColorInput.value = "#818cf8";
    if (ui.customAccentColorHex) ui.customAccentColorHex.value = "";
    scheduleApply();
  });

  ui.resetCustomHighlightBtn?.addEventListener("click", () => {
    if (ui.customHighlightColorInput) ui.customHighlightColorInput.value = "#facc15";
    if (ui.customHighlightColorHex) ui.customHighlightColorHex.value = "";
    scheduleApply();
  });

  [ui.presetSelect, ui.modeSelect, ui.voiceLanguageSelect, ui.voiceStyleSelect, ui.soundInputDeviceSelect, ui.fontSelect, ui.languageSelect, ui.themeSelect, ui.styleSelect, ui.textColorInput].forEach((input) => {
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
  ui.voiceModelSelect.addEventListener("change", () => {
    const language = normalizeVoiceLanguage(ui.voiceLanguageSelect.value);
    const modelId = String(ui.voiceModelSelect.value || "").trim();
    if (!modelId) {
      return;
    }

    updateVoiceModelRegistry(language, {
      selectedModelId: modelId,
      updatedAt: Date.now()
    });
    renderVoiceLanguageOptions();
    renderVoiceModelStatus(language);
  });
  ui.voiceModelDownloadButton.addEventListener("click", () => {
    downloadSelectedVoiceModel().catch(console.error);
  });
  ui.updaterCheckButton?.addEventListener("click", () => {
    if (updaterState.update?.rid) {
      installAvailableUpdate().catch(console.error);
      return;
    }

    checkForAppUpdates({ installIfAvailable: true }).catch(console.error);
  });
  ui.soundInputDeviceSelect.addEventListener("change", () => {
    syncSoundInputPreview({ forceRestart: true }).catch(console.error);
  });
  ui.soundInputRecommendedButton.addEventListener("click", () => {
    applyRecommendedSoundInputSettings();
  });

  ui.languageTrigger.addEventListener("click", () => {
    if (ui.languageMenu.classList.contains("hidden")) {
      openLanguageMenu();
      return;
    }

    closeLanguageMenu();
  });

  ui.fontTrigger.addEventListener("click", () => {
    if (ui.fontMenu.classList.contains("hidden")) {
      openFontMenu();
      return;
    }

    closeFontMenu();
  });

  ui.languageOptions.forEach((option) => {
    option.addEventListener("click", () => {
      ui.languageSelect.value = option.dataset.value;
      state.language = option.dataset.value;
      applyTranslationsToDocument(state.language);
      renderFontPicker(ui.fontSelect.value, state.language);
      syncCustomSettingsSelects();
      renderVoiceLanguageOptions();
      renderVoiceModelStatus(ui.voiceLanguageSelect.value);
      renderUpdaterCard();
      renderLanguagePicker(option.dataset.value, option.dataset.value);
      closeLanguageMenu(option, () => {
        refreshSoundInputDevices().catch(console.error);
        scheduleApply();
      });
    });
  });

  document.addEventListener("click", (event) => {
    if (!ui.languagePicker.contains(event.target)) {
      closeLanguageMenu();
    }

    if (!ui.fontPicker.contains(event.target)) {
      closeFontMenu();
    }

    customSettingsSelectControllers.forEach((controller) => {
      if (!controller.picker.contains(event.target)) {
        closeCustomSettingsSelect(controller);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLanguageMenu();
      closeFontMenu();
      customSettingsSelectControllers.forEach((controller) => closeCustomSettingsSelect(controller));
    }
  });
  [ui.mirrorModeInput, ui.mirrorVerticalInput, ui.autoHideToolbarInput, ui.speedRailEnabledInput, ui.performanceModeInput, ui.hideFromCaptureInput, ui.useSystemTrayInput, ui.preventSleepInput, ui.clickthroughShortcutInput, ui.appWideVoiceCommandsInput, ui.showScriptManagerInput, ui.showScriptCompletionInput].filter(Boolean).forEach((input) => {
    input.addEventListener("input", scheduleApply);
    input.addEventListener("change", scheduleApply);
  });

  ui.closeWindowButton.addEventListener("click", () => {
    if (!invoke) {
      return;
    }

    invokeAfterDesktopFadeOut("hide_aux_window", { kind: "settings" }).catch(console.error);
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
  ui.copySenderAuthUrlButton?.addEventListener("click", () => {
    copyText(ui.remoteSenderQrCard?.dataset.copyValue || "", t("settings.copiedSenderLink"));
  });
  ui.initializeRealtimeEditingButton?.addEventListener("click", () => {
    initializeRealtimeEditing().catch(console.error);
  });
  ui.closeRealtimeEditingButton?.addEventListener("click", () => {
    closeRealtimeEditing();
  });
  ui.copyRealtimePasswordButton?.addEventListener("click", () => {
    copyText(ui.remoteRealtimePasswordInput?.value || "", t("settings.copiedRealtimePassword"), ui.remoteRealtimeStatus);
  });
  ui.copyRealtimeLinkButton?.addEventListener("click", () => {
    copyText(ui.remoteRealtimeLink?.href || "", t("settings.copiedRealtimeLink"), ui.remoteRealtimeStatus);
  });

  setActiveSettingsSection(ui.settingsSectionSelect?.value || "appearance");

  remoteStatusTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      refreshRemoteStatus().catch(console.error);
    }
  }, REMOTE_STATUS_REFRESH_MS);

  window.addEventListener("focus", async () => {
    Object.assign(state, loadState());
    state.desktop = state.desktop || structuredClone(defaultState.desktop);
    await configureSliderRanges().catch(() => {});
    await applyDesktopSettings().catch(console.error);
    await readCurrentWindow().catch(console.error);
    fillForm();
    renderRealtimeEditingState();
    await refreshVoiceModelStatuses().catch(() => {});
    await refreshSoundInputDevices().catch(console.error);
    await refreshRemoteStatus().catch(console.error);
  });
  function isEditableElement(element) {
    if (!element || !(element instanceof HTMLElement)) {
      return false;
    }
    return element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName);
  }

  let syncSettingsTimer = 0;
  function handleSettingsExternalSync() {
    if (isEditableElement(document.activeElement)) {
      return;
    }
    if (syncSettingsTimer) {
      clearTimeout(syncSettingsTimer);
    }
    syncSettingsTimer = window.setTimeout(() => {
      syncSettingsTimer = 0;
      const previousSoundInputDeviceId = normalizeSoundInputDeviceId(state.appearance?.soundInputDeviceId);
      Object.assign(state, loadState());
      state.desktop = state.desktop || structuredClone(defaultState.desktop);
      fillForm();
      renderRealtimeEditingState();
      refreshVoiceModelStatuses().catch(console.error);
      if (previousSoundInputDeviceId !== normalizeSoundInputDeviceId(state.appearance?.soundInputDeviceId)) {
        refreshSoundInputDevices().catch(console.error);
        syncSoundInputPreview({ forceRestart: true }).catch(console.error);
      }
      applyDesktopSettings().catch(console.error);
    }, 80);
  }

  window.addEventListener("storage", handleSettingsExternalSync);
  window.addEventListener("flow-state-updated", handleSettingsExternalSync);
  window.addEventListener(getRealtimeEditingUpdatedEventName(), renderRealtimeEditingState);
  window.addEventListener("beforeunload", () => {
    if (remoteStatusTimer) {
      clearInterval(remoteStatusTimer);
    }
    stopSoundInputPreview();
    unlistenVoiceModelDownloads?.();
  });

  // Background non-blocking tasks (never stalls or freezes UI responsiveness)
  (async () => {
    await resolveMicrosoftStoreBuild().catch(() => false);
    await syncUpdatesSettingsVisibility().catch(() => {});
    await configureSliderRanges().catch(() => {});
    await readCurrentWindow().catch(() => {});

    try {
      const pro = await getProModule().catch(() => null);
      pro?.mountProSettings?.(document.querySelector(".page-shell") || document.body, { state, saveState, ui });
    } catch (e) {
      console.warn("Pro settings mount skipped", e);
    }

    applyDesktopSettings().catch(() => {});
    refreshRemoteStatus().catch(() => {});
    refreshVoiceModelStatuses().catch(() => {});
    refreshSoundInputDevices().catch(() => {});
    ensureCurrentAppVersion().catch(() => {});
    checkForAppUpdates({ silentNoUpdate: true }).catch(() => {});
  })();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", () => {
    bootSettingsPage().catch(console.error);
  }, { once: true });
} else {
  bootSettingsPage().catch(console.error);
}
