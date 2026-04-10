/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

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
const SPEED_RAIL_WINDOW_GUTTER = 74;
const MAX_WIDTH_FALLBACK = 2200;
const MAX_HEIGHT_FALLBACK = 1400;
const POSITION_PADDING = 600;
const APPLY_DELAY = 70;
const TOP_CENTER_X_OFFSET = 32;
const REMOTE_STATUS_REFRESH_MS = 20_000;
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
  speedRailEnabledInput: document.querySelector("#speedRailEnabledInput"),
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
  soundInputDeviceSelect: document.querySelector("#soundInputDeviceSelect"),
  soundInputLevelFill: document.querySelector("#soundInputLevelFill"),
  soundInputLevelValue: document.querySelector("#soundInputLevelValue"),
  soundInputStatus: document.querySelector("#soundInputStatus"),
  soundInputNoiseGateInput: document.querySelector("#soundInputNoiseGateInput"),
  soundInputNoiseGateValue: document.querySelector("#soundInputNoiseGateValue"),
  soundInputGainInput: document.querySelector("#soundInputGainInput"),
  soundInputGainValue: document.querySelector("#soundInputGainValue"),
  soundInputRecommendedButton: document.querySelector("#soundInputRecommendedButton"),
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
  remoteSenderQrCard: document.querySelector("#remoteSenderQrCard"),
  remoteSenderQrCanvas: document.querySelector("#remoteSenderQrCanvas"),
  remoteSenderQrStatus: document.querySelector("#remoteSenderQrStatus"),
  remoteLiveBadge: document.querySelector("#remoteLiveBadge"),
  remoteSessionStatus: document.querySelector("#remoteSessionStatus"),
  copySessionIdButton: document.querySelector("#copySessionIdButton"),
  copyAccessPasswordButton: document.querySelector("#copyAccessPasswordButton"),
  copySenderUrlButton: document.querySelector("#copySenderUrlButton"),
  copySenderAuthUrlButton: document.querySelector("#copySenderAuthUrlButton"),
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
let soundInputPreviewStream = null;
let soundInputPreviewAudioContext = null;
let soundInputPreviewSourceNode = null;
let soundInputPreviewAnalyserNode = null;
let soundInputPreviewTimer = 0;
let soundInputPreviewBuffer = null;
let soundInputPreviewSession = 0;
let soundInputPreviewDeviceId = null;
let soundInputStatusKey = ui.soundInputStatus?.dataset.i18n || "settings.soundInputPreviewIdle";
let remoteSenderQr = null;

function clampNumber(value, min, max, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(numericValue, min), max);
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

function describeSoundInputDevice(device, index) {
  const label = String(device?.label || "").trim();
  if (label) {
    return label;
  }

  return `${t("settings.soundInputDeviceUnnamed")} ${index + 1}`;
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

    optionDescriptors.push({
      value: device.deviceId,
      label: describeSoundInputDevice(device, index)
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

  if (!audioInputs.length && ui.settingsSectionSelect?.value === "sound-input") {
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
    const baseLabel = getVoiceLanguageLabel(language);
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
  ui.soundInputNoiseGateValue.textContent = formatSoundInputNoiseGate(ui.soundInputNoiseGateInput.value);
  ui.soundInputGainValue.textContent = formatSoundInputGain(ui.soundInputGainInput.value);
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

  syncSoundInputPreview().catch(console.error);

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

function buildCloudSenderAuthUrl(receiverId = state.remote?.receiverId || "", accessPassword = state.remote?.accessPassword || "") {
  const base = CONFIGURED_CLOUD_RELAY_URL;
  if (!base || !receiverId || !accessPassword) {
    return "";
  }

  const url = new URL(`${base}/`);
  url.searchParams.set("id", receiverId);
  url.searchParams.set("accessPassword", accessPassword);
  return url.toString();
}

function getRemoteSenderQrStatusKey(authUrl) {
  if (!CONFIGURED_CLOUD_RELAY_URL) {
    return "settings.remoteSenderQrUnavailable";
  }

  if (!authUrl) {
    return "settings.remoteSenderQrPending";
  }

  return "settings.remoteSenderQrHelp";
}

function getRemoteSenderQrInstance() {
  if (!ui.remoteSenderQrCanvas || typeof window.QRious !== "function") {
    return null;
  }

  if (!remoteSenderQr) {
    remoteSenderQr = new window.QRious({
      element: ui.remoteSenderQrCanvas,
      size: 220,
      level: "M",
      padding: 12,
      background: "#ffffff",
      foreground: "#0f172a",
      value: "about:blank"
    });
  }

  return remoteSenderQr;
}

function renderRemoteSenderQr() {
  const authUrl = buildCloudSenderAuthUrl();
  const statusKey = getRemoteSenderQrStatusKey(authUrl);
  const qrious = getRemoteSenderQrInstance();
  const canRender = Boolean(authUrl && qrious);

  if (ui.remoteSenderQrStatus) {
    ui.remoteSenderQrStatus.dataset.i18n = statusKey;
    ui.remoteSenderQrStatus.textContent = t(statusKey);
  }

  if (ui.remoteSenderQrCanvas) {
    ui.remoteSenderQrCanvas.classList.toggle("hidden", !canRender);
    ui.remoteSenderQrCanvas.setAttribute("aria-label", t("settings.remoteSenderQrHelp"));
  }

  if (ui.copySenderAuthUrlButton) {
    ui.copySenderAuthUrlButton.disabled = !authUrl;
  }

  if (ui.remoteSenderQrCard) {
    ui.remoteSenderQrCard.dataset.copyValue = authUrl;
  }

  if (!qrious) {
    return;
  }

  qrious.set({ value: canRender ? authUrl : "about:blank" });
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
  const gutterWidth = getSpeedRailWindowGutter();
  ui.widthInput.max = String(Math.max(monitorWidth - gutterWidth, MAX_WIDTH_FALLBACK - gutterWidth));
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
  setSoundInputStatus(soundInputStatusKey);
  renderLanguagePicker(ui.languageSelect.value, ui.languageSelect.value);
  renderRemoteSenderQr();
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

  const gutterWidth = getSpeedRailWindowGutter();
  state.window.width = Math.max(size.width - gutterWidth, MIN_WIDTH);
  if (!windowIsCollapsed) {
    state.window.height = size.height;
  }
  state.window.x = pos.x + gutterWidth;
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
    soundInputDeviceId: normalizeSoundInputDeviceId(ui.soundInputDeviceSelect.value),
    soundInputNoiseGate: normalizeSoundInputNoiseGate(ui.soundInputNoiseGateInput.value),
    soundInputGain: normalizeSoundInputGain(ui.soundInputGainInput.value),
    fontFamily: ui.fontSelect.value,
    appOpacity: Number(ui.appOpacityInput.value),
    textScale: Number(ui.textSizeInput.value),
    theme: ui.themeSelect.value,
    style: ui.styleSelect.value,
    autoHideToolbar: ui.autoHideToolbarInput.checked,
    speedRailEnabled: ui.speedRailEnabledInput.checked,
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
    await configureSliderRanges();
    const windowIsCollapsed = await isMainWindowCollapsed(appWindow);
    const gutterWidth = getSpeedRailWindowGutter();

    if (!windowIsCollapsed) {
      await appWindow.setSize(new tauriDpi.LogicalSize(state.window.width + gutterWidth, state.window.height));

      if (state.window.preset === "center" && tauriWindow.currentMonitor && tauriWindow.primaryMonitor) {
        const monitor = (await tauriWindow.currentMonitor()) ?? (await tauriWindow.primaryMonitor());
        if (monitor) {
          const x = monitor.position.x + Math.round((monitor.size.width - state.window.width) / 2) - gutterWidth;
          const y = monitor.position.y + Math.round((monitor.size.height - state.window.height) / 2);
          await appWindow.setPosition(new tauriDpi.PhysicalPosition(x, y));
          state.window.x = x + gutterWidth;
          state.window.y = y;
        }
      } else if (state.window.preset === "top-center" && tauriWindow.currentMonitor && tauriWindow.primaryMonitor) {
        const monitor = (await tauriWindow.currentMonitor()) ?? (await tauriWindow.primaryMonitor());
        if (monitor) {
          const x = monitor.position.x + Math.round((monitor.size.width - state.window.width) / 2) + TOP_CENTER_X_OFFSET - gutterWidth;
          const y = monitor.position.y;
          await appWindow.setPosition(new tauriDpi.PhysicalPosition(x, y));
          state.window.x = x + gutterWidth;
          state.window.y = y;
        }
      } else {
        await appWindow.setPosition(new tauriDpi.LogicalPosition(state.window.x - gutterWidth, state.window.y));
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
    renderRemoteSenderQr();
    return;
  }

  const active = Boolean(status?.active);
  const exists = Boolean(status?.exists);
  ui.remoteLiveBadge.textContent = active ? t("common.live") : t("common.offline");
  ui.remoteLiveBadge.classList.toggle("is-offline", !active);

  if (!exists) {
    ui.remoteSessionStatus.textContent = t("settings.remoteStatusCloudRegister");
    renderRemoteSenderQr();
    return;
  }

  ui.remoteSessionStatus.textContent = active
    ? t("settings.remoteStatusCloudActive")
    : t("settings.remoteStatusCloudOffline");
  renderRemoteSenderQr();
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
  await refreshSoundInputDevices().catch(console.error);

  if (navigator.mediaDevices?.addEventListener) {
    navigator.mediaDevices.addEventListener("devicechange", () => {
      refreshSoundInputDevices().catch(console.error);
    });
  }

  if (tauriEvent?.listen) {
    unlistenVoiceModelDownloads = await tauriEvent.listen("flow-voice-model-download", (event) => {
      handleVoiceModelDownloadEvent(event.payload);
    });
  }

  [ui.xInput, ui.yInput, ui.widthInput, ui.heightInput, ui.appOpacityInput, ui.textSizeInput, ui.textOpacityInput, ui.soundInputNoiseGateInput, ui.soundInputGainInput].forEach((input) => {
    input.addEventListener("input", scheduleApply);
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
  ui.voiceModelDownloadButton.addEventListener("click", () => {
    downloadSelectedVoiceModel().catch(console.error);
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

  ui.languageOptions.forEach((option) => {
    option.addEventListener("click", () => {
      ui.languageSelect.value = option.dataset.value;
      state.language = option.dataset.value;
      applyTranslationsToDocument(state.language);
      renderVoiceLanguageOptions();
      renderVoiceModelStatus(ui.voiceLanguageSelect.value);
      renderLanguagePicker(option.dataset.value, option.dataset.value);
      closeLanguageMenu();
      refreshSoundInputDevices().catch(console.error);
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
  [ui.autoHideToolbarInput, ui.speedRailEnabledInput, ui.performanceModeInput, ui.hideFromCaptureInput, ui.useSystemTrayInput, ui.preventSleepInput, ui.clickthroughShortcutInput, ui.appWideVoiceCommandsInput].forEach((input) => {
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
  ui.copySenderAuthUrlButton?.addEventListener("click", () => {
    copyText(ui.remoteSenderQrCard?.dataset.copyValue || "", t("settings.copiedSenderLink"));
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
    await refreshSoundInputDevices().catch(console.error);
    await refreshRemoteStatus().catch(console.error);
  });
  window.addEventListener("storage", () => {
    const previousSoundInputDeviceId = normalizeSoundInputDeviceId(state.appearance?.soundInputDeviceId);
    Object.assign(state, loadState());
    state.desktop = state.desktop || structuredClone(defaultState.desktop);
    fillForm();
    refreshVoiceModelStatuses().catch(console.error);
    if (previousSoundInputDeviceId !== normalizeSoundInputDeviceId(state.appearance?.soundInputDeviceId)) {
      refreshSoundInputDevices().catch(console.error);
      syncSoundInputPreview({ forceRestart: true }).catch(console.error);
    }
    applyDesktopSettings().catch(console.error);
  });
  window.addEventListener("flow-state-updated", () => {
    const previousSoundInputDeviceId = normalizeSoundInputDeviceId(state.appearance?.soundInputDeviceId);
    Object.assign(state, loadState());
    state.desktop = state.desktop || structuredClone(defaultState.desktop);
    fillForm();
    refreshVoiceModelStatuses().catch(console.error);
    if (previousSoundInputDeviceId !== normalizeSoundInputDeviceId(state.appearance?.soundInputDeviceId)) {
      refreshSoundInputDevices().catch(console.error);
      syncSoundInputPreview({ forceRestart: true }).catch(console.error);
    }
    applyDesktopSettings().catch(console.error);
  });
  window.addEventListener("beforeunload", () => {
    if (remoteStatusTimer) {
      clearInterval(remoteStatusTimer);
    }
    stopSoundInputPreview();
    unlistenVoiceModelDownloads?.();
  });
});
