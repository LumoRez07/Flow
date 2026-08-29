/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { createRealtimeHostController } from "./services/network/realtime-host.js";
import { clearRealtimeEditingConfig, clearStaleRealtimeEditingConfig, getRealtimeEditingUpdatedEventName } from "./services/network/realtime-editing.js";
import { isCloudRemoteEnabled, rotateRemoteAccessPasswordForLaunch } from "./services/network/remote.js";
import { buildRealtimeApiUrl } from "./services/network/realtime.js";
import { setRemoteInboxDelegate, startRemoteReceiverLoop, stopRemoteReceiverLoop } from "./services/network/remote-inbox-service.js";
import { buildGroqRequest, generateWithGroq } from "./services/groq.js";
import {
  applyAppearanceToDocument,
  applyTranslationsToDocument,
  clamp,
  defaultState,
  estimateMinutes,
  generateRemoteAccessPassword,
  getSelectedVoiceModelId,
  initializePersistentStorage,
  initializeDesktopWindowOpacityFade,
  invokeAfterDesktopFadeOut,
  loadState,
  normalizeVoiceLanguage,
  resolveFontStack,
  saveState,
  splitWords,
  translate,
  wait,
  VOICE_LANGUAGE_OPTIONS
} from "./shared.js";
import { getProModule } from "./core/pro-loader.js";
import { createAutoUpdater } from "./teleprompter/auto-updater.js";
import { createWindowManager } from "./teleprompter/window-manager.js";
import { createViewStateController } from "./teleprompter/view-state.js";
import { createHotkeyManager } from "./teleprompter/hotkeys.js";
import { createPromptRenderer } from "./teleprompter/prompt-renderer.js";
import { createPlaybackController } from "./teleprompter/playback-controller.js";
import {
  createVoiceCommandListener,
  getOfflineVoiceCommandGrammar
} from "./teleprompter/voice-command-listener.js";
import {
  getSoundInputSettings,
  getVoiceCaptureSettingsSignature
} from "./teleprompter/voice-capture.js";
import { createSpeechTracker } from "./teleprompter/speech-tracker.js";
import { createScriptManager } from "./teleprompter/script-manager.js";
import { createCompletionTracker } from "./teleprompter/completion-tracker.js";
import { setButtonIcon } from "./teleprompter/toolbar.js";
import {
  NATIVE_VOICE_EVENT_NAME,
  ENGLISH_VOICE_LANGUAGE,
  VOICE_HEALTH_IDLE_CHECK_MS,
  VOICE_HEALTH_ACTIVE_CHECK_MS,
  VOICE_COMMAND_STALL_RESET_MS,
  VOICE_CAPTURE_ERROR_PERMISSION_DENIED,
  VOICE_CAPTURE_ERROR_NO_DEVICE,
  VOICE_CAPTURE_ERROR_UNAVAILABLE
} from "./teleprompter/voice-constants.js";
import {
  MIN_WIDTH,
  MIN_HEIGHT,
  COLLAPSED_HEIGHT,
  COLLAPSE_DURATION,
  SPEED_RAIL_WINDOW_GUTTER,
  REMOTE_RAIL_WINDOW_GUTTER,
  BOTTOM_DOCK_WINDOW_GUTTER,
  BOTTOM_DOCK_COLLAPSED_GUTTER,
  SIDE_PANEL_WINDOW_GUTTER,
  SIDE_PANEL_COLLAPSED_GUTTER,
  MAX_WIDTH_FALLBACK,
  MAX_HEIGHT_FALLBACK,
  SPEED_RAIL_TRANSITION_MS,
  TOP_CENTER_X_OFFSET,
  WINDOW_POSITION_RETRY_DELAY_MS,
  MAX_WINDOW_POSITION_RETRIES,
  normalizeScaleFactor,
  physicalSizeToLogical,
  logicalSizeToPhysical,
  logicalValueToPhysical,
  getMonitorLogicalSize,
  isPositionInMonitor,
  findMonitorForPosition,
  clampWindowPositionToMonitor
} from "./teleprompter/layout.js";
import {
  PLAYBACK_COUNTDOWN_STEPS,
  PLAYBACK_COUNTDOWN_STEP_MS,
  PLAYBACK_COUNTDOWN_SETTLE_MS,
  PLAYBACK_ARROW_HOLD_INITIAL_DELAY_MS,
  PLAYBACK_ARROW_HOLD_BASE_INTERVAL_MS,
  PLAYBACK_ARROW_HOLD_MIN_INTERVAL_MS,
  PLAYBACK_ARROW_HOLD_ACCELERATION_MS,
  SCROLL_PLAYBACK_START_HOLD_MIN_SECONDS,
  SCROLL_PLAYBACK_START_HOLD_MAX_SECONDS,
  WAIT_CARD_STEP_MS,
  WAIT_CARD_NUMBER_ANIMATION_MS,
  WAIT_CARD_TRIGGER_VIEWPORT_OFFSET,
  AUTO_UPDATE_CHECK_INTERVAL_MS
} from "./teleprompter/playback-constants.js";

await initializePersistentStorage();

// Assets and URLs
const VOICE_COMMAND_SOUND_URL = new URL("./assets/voice-command-recognized.mp3", import.meta.url).href;
const VOSK_COMMAND_MODEL_URL = new URL("./assets/vosk-model-small-en-us-0.15.tar.gz", import.meta.url).href;


const tauriCore = window.__TAURI__?.core;
const invoke = tauriCore?.invoke;
const convertFileSrc = tauriCore?.convertFileSrc;
const tauriApp = window.__TAURI__?.app;
const tauriWindow = window.__TAURI__?.window;
const tauriDpi = window.__TAURI__?.dpi;
const tauriEvent = window.__TAURI__?.event;
let isMicrosoftStoreBuild = null;
let microsoftStoreBuildPromise = null;

const state = loadState();
state.desktop = state.desktop || structuredClone(defaultState.desktop);
state.remote = state.remote || structuredClone(defaultState.remote);
const COMPACT_SPEED_WIDTH = 450;
const CLOUD_HEARTBEAT_INTERVAL_MS = 25_000;
const CLOUD_POLL_MIN_INTERVAL_MS = 6_000;
const CLOUD_POLL_MAX_INTERVAL_MS = 30_000;
const CLOUD_POLL_BACKOFF_STEP_MS = 4_000;

const ui = {};
let tickTimer = null;
let scrollAnimationFrame = null;
let viewportScrollAnimationFrame = null;
let currentIndex = 0;
let isPlaying = false;
let isPaused = false;
let isCollapsed = false;
let collapseTransitionToken = 0;
let resizeAnimationToken = 0;
let isSpeedRailVisible = false;
let speedRailTransitionToken = 0;
let wordNodes = [];
let lineGroups = [];
let lineIndexByWord = [];
let resizeObserver = null;
let scrollProgress = 0;
let lastScrollFrameAt = 0;
let lastRenderedMode = null;
let lastRenderedWordIndex = -1;
let lastRenderedLineIndex = -1;
let lastStatusUpdateAt = 0;
let speedPersistTimer = null;
let remoteHeartbeatTimer = null;
let remoteInboxTimer = null;
let realtimeHostController = null;
let isApplyingRemoteScript = false;
let remoteMessages = [];
const remotePendingActions = new Set();
let remoteCloudPollDelayMs = CLOUD_POLL_MIN_INTERVAL_MS;
const remoteCardCollapseTimers = new Map();
let pendingWindowPositionRetryTimer = 0;
let windowPositionRetryCount = 0;
let unlistenClickthroughChanged = null;
let normalizedWordTokens = [];
let wordIndexByNormalizedToken = [];
let normalizedTokenRangeByWord = [];
let voiceTranscript = "";
let viewportScrollTarget = null;
let playbackCountdownToken = 0;
let isPlaybackCountdownActive = false;
let scriptManager = null;
let completionTracker = null;
let shouldAnnounceClickthroughStatus = false;
let cachedPromptViewportWidth = 0;
let cachedPromptViewportHeight = 0;
let cachedPromptScrollableHeight = 0;
let lastAppliedViewportTop = null;
let lastRenderedScriptSnapshot = "";
let frozenReadingViewportWidth = 0;
let frozenReadingViewportHeight = 0;
const voiceModelStatusCache = new Map();
let promptFeedbackState = null;
let unlistenNativeVoiceEvents = null;
function getVoiceLanguageTag() {
  return normalizeVoiceLanguage(
    state.appearance?.voiceLanguage
      || ({ ar: "ar-SA", tr: "tr-TR", de: "de-DE", fr: "fr-FR", es: "es-ES", en: "en-US" }[state.language] || state.language || ENGLISH_VOICE_LANGUAGE),
    ENGLISH_VOICE_LANGUAGE
  );
}

function getVoiceCommandLanguageTag() {
  return getVoiceLanguageTag();
}

function buildNativeVoicePayload(languageTag = getVoiceLanguageTag(), options = {}) {
  const soundInput = getSoundInputSettings(state.appearance);
  const modelId = getSelectedVoiceModelId(languageTag);
  return {
    language: normalizeVoiceLanguage(languageTag),
    modelId,
    confidenceThreshold: getVoiceTrackingConfidenceThreshold(),
    soundInput: {
      deviceId: soundInput.deviceId,
      deviceLabel: soundInput.deviceLabel,
      noiseGate: soundInput.noiseGate,
      inputGain: soundInput.inputGain
    },
    ...options
  };
}

function getVoiceModelStatusCacheKey(languageTag = getVoiceLanguageTag(), modelId = getSelectedVoiceModelId(languageTag)) {
  const normalizedLanguage = normalizeVoiceLanguage(languageTag);
  const normalizedModelId = String(modelId || "").trim();
  return normalizedModelId ? `${normalizedLanguage}::${normalizedModelId}` : normalizedLanguage;
}

function handleNativeVoiceEvent(payload) {
  if (!payload?.channel || !payload?.stage) {
    return;
  }

  if (payload.channel === "commands") {
    voiceCommandListener.handleNativeVoiceCommandEvent(payload);
    return;
  }

  if (payload.channel === "tracking") {
    if (payload.stage === "started") {
      if (isPlaying && getActiveMode() === "voice" && ui.statusLabel) {
        ui.statusLabel.textContent = "🎤 Listening...";
      }
      return;
    }

    const isReadingInVoiceMode = isPlaying && !isPaused && getActiveMode() === "voice";

    if (payload.stage === "partial") {
      console.log(`🎤 [ASR Partial] text: "${payload.text || ""}"`, payload.words ? `| words: ${payload.words.map(w => w.word).join(" ")}` : "");
      if (!isReadingInVoiceMode) {
        const commandResult = handleOfflineVoiceCommandTranscript(payload.text, {
          isFinal: false,
          confidence: payload.confidence ?? 1,
          wakeConfidence: payload.confidence ?? 1
        });
        if (commandResult.handled || commandResult.consumed) {
          return;
        }
      }
      if (applyVoiceTrackingWordHints(payload.words, { isFinal: false, confidence: payload.confidence ?? 0 })) {
        return;
      }
      applyVoiceTrackingTranscript(payload.text, { isFinal: false, confidence: payload.confidence ?? 0 });
      return;
    }

    if (payload.stage === "final") {
      console.log(`📢 [ASR Final] text: "${payload.text || ""}"`, payload.words ? `| words: ${payload.words.map(w => w.word).join(" ")}` : "");
      if (!isReadingInVoiceMode) {
        const commandResult = handleOfflineVoiceCommandTranscript(payload.text, {
          isFinal: true,
          confidence: payload.confidence ?? 0,
          wakeConfidence: payload.confidence ?? 0
        });
        if (commandResult.handled || commandResult.consumed) {
          return;
        }
      }
      applyVoiceTrackingTranscript(payload.text, { isFinal: true, confidence: payload.confidence ?? 0 });
      return;
    }

    if (payload.stage === "stopped") {
      speechTracker.stopVoiceTracking();
      return;
    }

    if (payload.stage === "error") {
      console.error("Native voice tracking failed", payload.error || payload);
      if (isPlaying && getActiveMode() === "voice") {
        const trackingError = new Error(payload.error || "Voice tracking unavailable");
        const feedbackKey = getVoiceTrackingFeedbackKey(trackingError);
        if (feedbackKey) {
          setPromptFeedback(feedbackKey);
        }
        if (ui.statusLabel) {
          ui.statusLabel.textContent = getVoiceTrackingFailureStatus(trackingError);
        }
        stopPlayback();
      } else {
        speechTracker.stopVoiceTracking();
      }
    }
  }
}

async function ensureNativeVoiceEventListener() {
  if (!tauriEvent?.listen || unlistenNativeVoiceEvents) {
    return;
  }

  unlistenNativeVoiceEvents = await tauriEvent.listen(NATIVE_VOICE_EVENT_NAME, (event) => {
    handleNativeVoiceEvent(event.payload);
  });
}





function getVoiceTrackingFailureStatus(error) {
  const message = String(error?.message || error || "").trim();

  if (/Missing Vosk model/i.test(message)) {
    return `🎤 Download ${getVoiceLanguageLabel()} model first`;
  }

  if (/No microphone detected/i.test(message)) {
    return t("tele.status.noMic");
  }

  if (/Microphone unavailable|Failed to read microphone config|Failed to enumerate microphone formats/i.test(message)) {
    return t("tele.status.micUnavailable");
  }

  if (/Failed to start microphone capture|Failed to activate microphone capture|Microphone stream error/i.test(message)) {
    return `🎤 ${message}`;
  }

  switch (error?.code) {
    case VOICE_CAPTURE_ERROR_PERMISSION_DENIED:
      return t("tele.status.micBlocked");
    case VOICE_CAPTURE_ERROR_NO_DEVICE:
      return t("tele.status.noMic");
    case VOICE_CAPTURE_ERROR_UNAVAILABLE:
      return t("tele.status.micUnavailable");
    default:
      return message ? `🎤 ${message}` : "🎤 Mic Request Failed";
  }
}

function getVoiceTrackingFeedbackKey(error) {
  const message = String(error?.message || error || "").trim();

  if (/No microphone detected/i.test(message)) {
    return "tele.voiceFeedback.noMic";
  }

  if (/Microphone unavailable|Failed to read microphone config|Failed to enumerate microphone formats/i.test(message)) {
    return "tele.voiceFeedback.micUnavailable";
  }

  switch (error?.code) {
    case VOICE_CAPTURE_ERROR_PERMISSION_DENIED:
      return "tele.voiceFeedback.micBlocked";
    case VOICE_CAPTURE_ERROR_NO_DEVICE:
      return "tele.voiceFeedback.noMic";
    case VOICE_CAPTURE_ERROR_UNAVAILABLE:
      return "tele.voiceFeedback.micUnavailable";
    default:
      return "";
  }
}

function getVoiceLanguageLabel(languageTag = getVoiceLanguageTag()) {
  return VOICE_LANGUAGE_OPTIONS.find((option) => option.value === normalizeVoiceLanguage(languageTag))?.label
    || VOICE_LANGUAGE_OPTIONS[0].label;
}



function syncStateFromStorage() {
  const latest = loadState();
  Object.assign(state, latest);
}

function getVoiceTrackingConfidenceThreshold() {
  const threshold = Number(state.voiceTracking?.confidenceThreshold);
  return Number.isFinite(threshold)
    ? clamp(threshold, 0.1, 0.9)
    : (defaultState.voiceTracking?.confidenceThreshold || 0.35);
}



function t(key, params = {}) {
  return translate(key, state.language, params);
}

const autoUpdater = createAutoUpdater({
  invoke,
  tauriCore,
  tauriApp,
  onStatusUpdate: (key, params) => {
    if (ui.statusLabel) {
      ui.statusLabel.textContent = t(key, params);
    }
  }
});

function getAutoUpdaterAvailable() {
  return autoUpdater.getAutoUpdaterAvailable();
}

function resolveMicrosoftStoreBuild() {
  return autoUpdater.resolveMicrosoftStoreBuild();
}

function runAutomaticUpdateCheck(options = {}) {
  return autoUpdater.runAutomaticUpdateCheck(options);
}

function startAutomaticUpdater() {
  autoUpdater.startAutomaticUpdater();
}

function cacheUi() {
  ui.speedRail = document.querySelector("#speedRail");
  ui.speedRailValue = document.querySelector("#speedRailValue");
  ui.speedRailSlider = document.querySelector("#speedRailSlider");
  ui.speedRail?.classList.remove("hidden");
  ui.speedRail?.setAttribute("aria-hidden", "true");
  ui.teleprompterApp = document.querySelector(".teleprompter-app");
  ui.teleprompterToolbar = document.querySelector(".teleprompter-toolbar");
  ui.teleprompterFooter = document.querySelector("#teleprompterFooter");
  ui.promptViewport = document.querySelector("#promptViewport");
  ui.promptText = document.querySelector("#promptText");
  ui.playbackCountdown = document.querySelector("#playbackCountdown");
  ui.playbackCountdownLabel = document.querySelector("#playbackCountdownLabel");
  ui.progressLabel = document.querySelector("#progressLabel");
  ui.statusLabel = document.querySelector("#statusLabel");
  ui.footerMeta = document.querySelector("#footerMeta");
  ui.speedLabel = document.querySelector("#speedLabel");
  ui.speedDownButton = document.querySelector("#speedDownButton");
  ui.speedUpButton = document.querySelector("#speedUpButton");
  ui.generateButton = document.querySelector("#generateButton");
  ui.playButton = document.querySelector("#playButton");
  ui.floatingControls = document.querySelector("#floatingControls");
  ui.floatingReplayButton = document.querySelector("#floatingReplayButton");
  ui.floatingPauseButton = document.querySelector("#floatingPauseButton");
  ui.floatingPlaybackMeta = document.querySelector("#floatingPlaybackMeta");
  ui.floatingPlaybackMetaText = document.querySelector("#floatingPlaybackMetaText");
  ui.floatingStopButton = document.querySelector("#floatingStopButton");
  ui.remoteInbox = document.querySelector("#remoteInbox");
  ui.inputButton = document.querySelector("#inputButton");
  ui.settingsButton = document.querySelector("#settingsButton");
  ui.closeAppButton = document.querySelector("#closeAppButton");
  ui.collapseButton = document.querySelector("#collapseButton");
  ui.pinButton = document.querySelector("#pinButton");
  ui.dragOverlay = document.querySelector("#dragOverlay");
  ui.voiceCommandIndicator = document.querySelector("#voiceCommandIndicator");
  ui.collapsedVoiceIndicator = document.querySelector("#collapsedVoiceIndicator");
  ui.teleprompterSidePanel = document.querySelector("#teleprompterSidePanel");
  ui.teleprompterRightDock = document.querySelector("#teleprompterRightDock");
  ui.teleprompterBottomDock = document.querySelector("#teleprompterBottomDock");
  ui.scriptManagerCardSlot = document.querySelector("#scriptManagerCardSlot");
  ui.scriptCompletionCardSlot = document.querySelector("#scriptCompletionCardSlot");
  ui.promptFeedback = null;
  ensurePromptFeedbackElement();
}

function ensurePromptFeedbackElement() {
  if (ui.promptFeedback || !ui.promptViewport) {
    return;
  }

  const feedback = document.createElement("div");
  feedback.id = "promptFeedback";
  feedback.className = "teleprompter-feedback hidden";
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  feedback.setAttribute("aria-hidden", "true");
  ui.promptViewport.appendChild(feedback);
  ui.promptFeedback = feedback;
}

function updatePromptFeedbackOverlay() {
  ensurePromptFeedbackElement();

  if (!ui.promptFeedback || !ui.promptViewport) {
    return;
  }

  const message = promptFeedbackState
    ? t(promptFeedbackState.key, promptFeedbackState.params)
    : "";
  const visible = Boolean(message);

  ui.promptFeedback.textContent = message;
  ui.promptFeedback.classList.toggle("hidden", !visible);
  ui.promptFeedback.setAttribute("aria-hidden", visible ? "false" : "true");
  ui.promptViewport.dataset.feedbackVisible = visible ? "true" : "false";
}

function setPromptFeedback(key, params = {}) {
  promptFeedbackState = key ? { key, params } : null;
  updatePromptFeedbackOverlay();
}

function clearPromptFeedback() {
  if (!promptFeedbackState) {
    return;
  }

  promptFeedbackState = null;
  updatePromptFeedbackOverlay();
}


const windowManager = createWindowManager({
  state,
  ui,
  saveState,
  t,
  getSpeedRailWindowGutter: () => getSpeedRailWindowGutter(),
  getSidePanelWindowGutter: () => viewStateController?.getSidePanelWindowGutter ? viewStateController.getSidePanelWindowGutter() : 0,
  getBottomDockWindowGutter: () => viewStateController?.getBottomDockWindowGutter ? viewStateController.getBottomDockWindowGutter() : 0,
  setSpeedRailGutter: (value) => setSpeedRailGutter(value),
  getIsCollapsed: () => isCollapsed,
  setIsCollapsed: (value) => { isCollapsed = value; },
  getIsPlaying: () => isPlaying,
  stopPlayback: (keep) => stopPlayback(keep),
  applyResponsiveText: () => applyResponsiveText(),
  onCollapse: () => { scriptManager?.collapse?.({ notify: false }); },
  tauriWindow,
  tauriDpi,
  tauriEvent,
  invoke
});

const promptRenderer = createPromptRenderer({
  state,
  ui,
  t,
  getVoiceLanguageTag: () => getVoiceLanguageTag(),
  updateWordState: (scroll) => updateWordState(scroll),
  updateStatus: () => updateStatus(),
  getPlaybackViewportOffset: (arrowOffset, waitOffset) => playbackController.getPlaybackViewportOffset(arrowOffset, waitOffset),
  getLineTargetTop: (lineIndex) => playbackController.getLineTargetTop(lineIndex),
  getLineIndexForScrollTop: (top) => playbackController.getLineIndexForScrollTop(top),
  getActiveMode: () => getActiveMode(),
  getIsPlaying: () => playbackController.getIsPlaying(),
  getIsPaused: () => playbackController.getIsPaused(),
  getCurrentIndex: () => playbackController.getCurrentIndex(),
  setCurrentIndex: (idx) => {
    playbackController.setCurrentIndex(idx);
    currentIndex = idx;
  },
  getScrollProgress: () => playbackController.getScrollProgress(),
  setScrollProgress: (prog) => {
    playbackController.setScrollProgress(prog);
    scrollProgress = prog;
  },
  clearPlayback: (opts) => playbackController.clearPlayback(opts),
  stopPlayback: (reset) => stopPlayback(reset),
  setViewportPosition: (top, behavior) => playbackController.setViewportPosition(top, behavior),
  clearRenderedState: () => playbackController.clearRenderedState?.(),
  setReadingMode: (enabled) => setReadingMode(enabled),
  restartPlaybackLoopForCurrentMode: () => restartPlaybackLoopForCurrentMode(),
  updatePlaybackIndicators: (force) => updatePlaybackIndicators(force),
  updatePlayButtons: () => updatePlayButtons(),
  syncVoiceCommandListener: () => syncVoiceCommandListener(),
  scheduleVoiceHealthCheck: (delay) => scheduleVoiceHealthCheck(delay),
  getFrozenReadingViewportWidth: () => playbackController.getFrozenReadingViewportWidth(),
  getFrozenReadingViewportHeight: () => playbackController.getFrozenReadingViewportHeight()
});

function syncPromptRendererState() {
  wordNodes = promptRenderer.getWordNodes();
  lineGroups = promptRenderer.getLineGroups();
  lineIndexByWord = promptRenderer.getLineIndexByWord();
  normalizedWordTokens = promptRenderer.getNormalizedWordTokens();
  wordIndexByNormalizedToken = promptRenderer.getWordIndexByNormalizedToken();
  normalizedTokenRangeByWord = promptRenderer.getNormalizedTokenRangeByWord();
  lastRenderedScriptSnapshot = promptRenderer.getLastRenderedScriptSnapshot();
}

function words() {
  return splitWords(state.script);
}

const playbackController = createPlaybackController({
  state,
  ui,
  t,
  saveState,
  getActiveMode: () => getActiveMode(),
  getVoiceScrollStyle: () => getVoiceScrollStyle(),
  getScrollBehavior: () => getScrollBehavior(),
  getWordNodes: () => promptRenderer.getWordNodes(),
  getLineGroups: () => promptRenderer.getLineGroups(),
  getLineIndexByWord: () => promptRenderer.getLineIndexByWord(),
  getPromptWaitCards: () => promptRenderer.getPromptWaitCards(),
  getCachedPromptViewportWidth: () => cachedPromptViewportWidth,
  getCachedPromptViewportHeight: () => cachedPromptViewportHeight,
  getCachedPromptScrollableHeight: () => getCachedPromptScrollableHeight(),
  refreshPromptViewportMetrics: () => refreshPromptViewportMetrics(),
  updatePromptSafeArea: () => updatePromptSafeArea(),
  updateSpeedRailVisibility: () => updateSpeedRailVisibility(),
  syncVoiceCommandListener: () => syncVoiceCommandListener(),
  scheduleVoiceHealthCheck: (delay) => scheduleVoiceHealthCheck(delay),
  stopVoiceTracking: async () => stopVoiceTracking(),
  playVoiceMode: () => playVoiceMode(),
  getRealtimeHostController: () => realtimeHostController,
  updateStatus: () => updateStatus(),
  onPlaybackStateChange: (options) => syncPlaybackControllerState(options)
});

function syncPlaybackControllerState(options = {}) {
  const wasPlaying = isPlaying;
  const wasPaused = isPaused;
  isPlaying = playbackController.getIsPlaying();
  isPaused = playbackController.getIsPaused();
  isPlaybackCountdownActive = playbackController.getIsPlaybackCountdownActive?.() ?? false;
  currentIndex = playbackController.getCurrentIndex();
  scrollProgress = playbackController.getScrollProgress();
  frozenReadingViewportWidth = playbackController.getFrozenReadingViewportWidth();
  frozenReadingViewportHeight = playbackController.getFrozenReadingViewportHeight();
  completionTracker?.updateWordProgress(currentIndex, wordNodes.length);

  if (wasPlaying !== isPlaying || wasPaused !== isPaused || options.force) {
    viewStateController?.syncModulesVisibility?.({ immediate: true, ...options });
  }
}

const viewStateController = createViewStateController({
  state,
  ui,
  getIsPlaying: () => playbackController.getIsPlaying(),
  getIsPaused: () => playbackController.getIsPaused(),
  getIsCollapsed: () => isCollapsed,
  setIsCollapsed: (val) => { isCollapsed = val; },
  setCollapsed: (nextValue, force) => setCollapsed(nextValue, force),
  getScriptManager: () => scriptManager,
  getCompletionTracker: () => completionTracker,
  getWindowManager: () => windowManager,
  getPromptRenderer: () => promptRenderer,
  tauriWindow
});

const hotkeyManager = createHotkeyManager({
  state,
  getState: () => state,
  getIsPlaying: () => playbackController.getIsPlaying(),
  getIsPaused: () => playbackController.getIsPaused(),
  getActiveMode: () => getActiveMode(),
  getLineGroups: () => promptRenderer.getLineGroups(),
  jumpToIndex: (idx) => jumpToIndex(idx),
  hasNativeInvoke: () => Boolean(invoke),
  toggleClickthroughMode: () => toggleClickthroughMode(),
  stopPlayback: (reset) => stopPlayback(reset),
  play: () => play(),
  scrollBackward: () => scrollBackward(),
  togglePause: () => togglePause(),
  adjustSpeed: (delta) => adjustSpeed(delta),
  stepPlaybackArrow: (dir) => {
    playbackController.stepPlaybackArrow(dir);
    syncPlaybackControllerState();
  },
  startPlaybackArrowHold: (dir) => {
    playbackController.startPlaybackArrowHold(dir);
    syncPlaybackControllerState();
  },
  stopPlaybackArrowHold: () => playbackController.stopPlaybackArrowHold()
});

const voiceCommandListener = createVoiceCommandListener({
  state,
  ui,
  t,
  getVoiceCommandLanguageTag: () => getVoiceCommandLanguageTag(),
  getActiveMode: () => getActiveMode(),
  getIsPlaying: () => playbackController.getIsPlaying(),
  getIsPaused: () => playbackController.getIsPaused(),
  handleVoiceCommandAction: (action) => handleVoiceCommandAction(action),
  ensureNativeVoiceEventListener: async () => ensureNativeVoiceEventListener(),
  buildNativeVoicePayload: (lang, opts) => buildNativeVoicePayload(lang, opts),
  getIsVoiceTrackingActive: () => speechTracker.getIsVoiceTrackingActive?.() ?? false,
  getIsVoiceTrackingStarting: () => speechTracker.getIsVoiceTrackingStarting?.() ?? false,
  playVoiceMode: () => playVoiceMode(),
  invoke
});

const speechTracker = createSpeechTracker({
  state,
  ui,
  t,
  getWordNodes: () => promptRenderer.getWordNodes(),
  getLineGroups: () => promptRenderer.getLineGroups(),
  getLineIndexByWord: () => promptRenderer.getLineIndexByWord(),
  getNormalizedWordTokens: () => promptRenderer.getNormalizedWordTokens(),
  getNormalizedTokenIndexForWord: (idx, position) => promptRenderer.getNormalizedTokenIndexForWord(idx, position),
  getNormalizedTokenRangeForLine: (lineIdx) => promptRenderer.getNormalizedTokenRangeForLine(lineIdx),
  getWordIndexForNormalizedToken: (tokenIdx) => promptRenderer.getWordIndexForNormalizedToken(tokenIdx),
  getCurrentIndex: () => playbackController.getCurrentIndex(),
  setCurrentIndex: (val) => {
    playbackController.setCurrentIndex(val);
    currentIndex = val;
  },
  getIsPlaying: () => playbackController.getIsPlaying(),
  getIsPaused: () => playbackController.getIsPaused(),
  getActiveMode: () => getActiveMode(),
  updateWordState: (shouldScroll) => updateWordState(shouldScroll),
  finishPlayback: () => finishPlayback(),
  getVoiceTrackingConfidenceThreshold: () => getVoiceTrackingConfidenceThreshold(),
  getActivePromptWaitCardId: () => playbackController.getActivePromptWaitCardId(),
  getDuePromptWaitCardForVoiceIndex: (idx) => playbackController.getDuePromptWaitCardForVoiceIndex(idx),
  getPromptWaitCardVoiceTriggerWordIndex: (card) => playbackController.getPromptWaitCardVoiceTriggerWordIndex(card),
  runPromptWaitPause: async (card) => playbackController.runPromptWaitPause(card),
  syncVoiceCommandListener: () => syncVoiceCommandListener(),
  updateVoiceCommandIndicator: () => voiceCommandListener.updateVoiceCommandIndicator(),
  getVoiceLanguageTag: () => getVoiceLanguageTag(),
  rebuildNormalizedScriptTokenMap: (lang) => rebuildNormalizedScriptTokenMap(lang),
  ensureNativeVoiceEventListener: async () => ensureNativeVoiceEventListener(),
  getTrackingAndCommandGrammar: (lang) => getTrackingAndCommandGrammar(lang),
  buildNativeVoicePayload: (lang, opts) => buildNativeVoicePayload(lang, opts),
  isVoiceCommandRecognizerActive: () => voiceCommandListener.isVoiceCommandRecognizerActive(),
  isVoiceCommandRecognitionStarting: () => voiceCommandListener.getIsVoiceCommandRecognitionStarting?.() ?? false,
  stopVoiceCommandListener: async () => stopVoiceCommandListener(),
  syncStateFromStorage: () => syncStateFromStorage(),
  invoke
});

function updateSpeedLabel() {
  playbackController.updateSpeedLabel();
}

function syncSliderProgress(input) {
  playbackController.syncSliderProgress(input);
}

function shouldShowSpeedRail() {
  const activeMode = getActiveMode();

  return Boolean(ui.speedRail)
    && state.appearance?.speedRailEnabled !== false
    && !["voice", "arrow"].includes(activeMode)
    && (isPlaying || isPaused)
    && wordNodes.length > 0
    && !isCollapsed;
}

function getBaseWindowWidth() {
  return Math.max(state.window.width || defaultState.window.width, MIN_WIDTH);
}

function getSpeedRailWindowGutter() {
  return state.appearance?.speedRailEnabled === false || ["voice", "arrow"].includes(getActiveMode())
    ? 0
    : SPEED_RAIL_WINDOW_GUTTER;
}

function getWindowPositionOffset(gutterWidth = getSpeedRailWindowGutter()) {
  return -gutterWidth;
}

function setSpeedRailGutter(value) {
  const normalizedGutter = Math.max(0, Math.min(SPEED_RAIL_WINDOW_GUTTER, Number(value) || 0));
  document.documentElement.style.setProperty("--speed-rail-gutter-current", `${normalizedGutter}px`);
  const baseWidth = Math.max(state.window?.width || defaultState.window.width, MIN_WIDTH);
  const contentWidth = Math.max(baseWidth - REMOTE_RAIL_WINDOW_GUTTER, MIN_WIDTH);
  document.documentElement.style.setProperty("--teleprompter-base-width", `${baseWidth}px`);
  document.documentElement.style.setProperty("--teleprompter-content-width", `${contentWidth}px`);
  document.body?.style?.setProperty("--teleprompter-base-width", `${baseWidth}px`);
  document.body?.style?.setProperty("--teleprompter-content-width", `${contentWidth}px`);
}

function updateSpeedRailVisibility() {
  const shouldShowRail = shouldShowSpeedRail();
  if (shouldShowRail === isSpeedRailVisible) {
    return;
  }

  isSpeedRailVisible = shouldShowRail;
  const token = ++speedRailTransitionToken;

  const finalizeShow = async () => {
    if (token !== speedRailTransitionToken) {
      return;
    }

    if (ui.speedRail) {
      ui.speedRail.setAttribute("aria-hidden", "false");
    }

    requestAnimationFrame(() => {
      if (token !== speedRailTransitionToken) {
        return;
      }

      document.body.classList.add("speed-rail-visible");
    });
  };

  const finalizeHide = async () => {
    document.body.classList.remove("speed-rail-visible");

    if (ui.speedRail) {
      ui.speedRail.setAttribute("aria-hidden", "true");
    }

    await wait(SPEED_RAIL_TRANSITION_MS);
    if (token !== speedRailTransitionToken) {
      return;
    }
  };

  if (shouldShowRail) {
    finalizeShow().catch(console.error);
    return;
  }

  finalizeHide().catch(console.error);
}

function setSpeedValue(nextSpeed, options = {}) {
  playbackController.setPlaybackSpeed(nextSpeed, { persist: !options.persistImmediately });
  if (options.persistImmediately) {
    playbackController.flushPendingSpeedPersist();
  }
}

function adjustSpeed(delta) {
  setSpeedValue(state.speed + delta);
}

function commitTypedSpeed() {
  setSpeedValue(ui.speedLabel.value, { persistImmediately: true });
}

function updateSpeedInputMode() {
  const compactMode = window.innerWidth < COMPACT_SPEED_WIDTH;
  ui.speedDownButton.classList.toggle("hidden", compactMode);
  ui.speedUpButton.classList.toggle("hidden", compactMode);
  ui.speedLabel.readOnly = !compactMode;
  ui.speedLabel.classList.toggle("speed-pill-editable", compactMode);
}

function focusPlaybackSurface() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  if (ui.promptViewport instanceof HTMLElement) {
    if (!ui.promptViewport.hasAttribute("tabindex")) {
      ui.promptViewport.setAttribute("tabindex", "-1");
    }

    ui.promptViewport.focus({ preventScroll: true });
  }
}

function getActiveMode() {
  const preferredMode = state.appearance?.mode || defaultState.appearance.mode;
  if (preferredMode === "voice") {
    return "voice";
  }

  return state.appearance?.performanceMode ? "scroll" : preferredMode;
}

function getScrollBehavior() {
  return state.appearance?.performanceMode ? "auto" : "smooth";
}

function getVoiceScrollStyle() {
  const voiceStyle = state.appearance?.voiceScrollStyle || defaultState.appearance.voiceScrollStyle;
  return ["highlight", "line", "plain"].includes(voiceStyle)
    ? voiceStyle
    : defaultState.appearance.voiceScrollStyle;
}

function getAnimationStyle() {
  const activeMode = getActiveMode();
  if (activeMode !== "voice") {
    return activeMode;
  }

  const voiceStyle = getVoiceScrollStyle();
  if (voiceStyle === "line") {
    return "line";
  }

  if (voiceStyle === "plain") {
    return "scroll";
  }

  return "highlight";
}

function getPlaybackLabel() {
  if (!isPlaying) return currentIndex > 0 ? t("tele.status.stopped") : t("tele.status.ready");
  const activeMode = getActiveMode();
  if (isPaused) return activeMode === "arrow" ? t("tele.status.arrowPaused") : t("tele.status.paused");
  if (activeMode === "voice") return "🎤 Listening...";
  if (state.appearance?.performanceMode) return t("tele.status.performance");
  if (activeMode === "scroll") return t("tele.status.scrolling");
  if (activeMode === "line") return t("tele.status.line");
  if (activeMode === "arrow") return t("tele.status.arrow");
  return t("tele.status.highlight");
}

function updateStatus() {
  syncPlaybackControllerState();
  const allNodes = promptRenderer?.getWordNodes ? promptRenderer.getWordNodes() : wordNodes;
  const total = allNodes.length;
  const activeIdx = playbackController?.getCurrentIndex ? playbackController.getCurrentIndex() : currentIndex;
  const current = total === 0 ? 0 : Math.min(activeIdx + 1, total);
  const nextProgressLabelText = t("tele.progress", { current, total });
  const nextStatusLabelText = getPlaybackLabel();

  if (ui.progressLabel && ui.progressLabel.textContent !== nextProgressLabelText) {
    ui.progressLabel.dir = "auto";
    ui.progressLabel.textContent = nextProgressLabelText;
  }

  if (ui.statusLabel && ui.statusLabel.textContent !== nextStatusLabelText) {
    ui.statusLabel.textContent = nextStatusLabelText;
  }

  playbackController.updateFloatingPlaybackMeta();
}

function updatePlaybackIndicators(force = false) {
  const activeMode = getActiveMode();
  const now = performance.now();
  const shouldThrottle = activeMode === "scroll";
  const throttleWindow = state.appearance?.performanceMode ? 220 : 120;

  if (force || !shouldThrottle || now - lastStatusUpdateAt >= throttleWindow || !isPlaying || isPaused) {
    lastStatusUpdateAt = now;
    updateStatus();
  }
}

function updatePromptSafeArea() {
  promptRenderer.updatePromptSafeArea();
}

function refreshPromptViewportMetrics() {
  const scrollable = promptRenderer.refreshPromptViewportMetrics();
  cachedPromptViewportWidth = promptRenderer.getCachedPromptViewportWidth();
  cachedPromptViewportHeight = promptRenderer.getCachedPromptViewportHeight();
  cachedPromptScrollableHeight = promptRenderer.getCachedPromptScrollableHeight();
  return scrollable;
}

function clearPendingScriptRerender() {
  promptRenderer.clearPendingScriptRerender();
}

function scheduleScriptRerender() {
  promptRenderer.scheduleScriptRerender();
}

function syncPromptLayout() {
  promptRenderer.syncPromptLayout();
}

function getCachedPromptScrollableHeight() {
  return promptRenderer.getCachedPromptScrollableHeight();
}

function setRealtimeRerenderActive(enabled) {
  promptRenderer.setRealtimeRerenderActive(enabled);
}

function setReadingMode(enabled) {
  playbackController.setReadingMode(enabled);
  syncPlaybackControllerState();
}

function setPlaybackCountdownVisible(visible, label = "") {
  playbackController.setPlaybackCountdownVisible(visible, label);
}

function updatePlayButtons() {
  playbackController.updatePlayButtons();
}

function hexToRgbTriplet(hexColor) {
  const normalized = hexColor.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((value) => value + value).join("")
    : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
}

function applyAppearanceSettings() {
  const appearance = state.appearance || defaultState.appearance;
  applyAppearanceToDocument(appearance);
  document.body.dataset.animationStyle = getAnimationStyle();
  document.documentElement.style.setProperty("--teleprompter-font-family", resolveFontStack(appearance.fontFamily, state.language));
  document.documentElement.style.setProperty("--teleprompter-text-rgb", hexToRgbTriplet(appearance.textColor));
  document.documentElement.style.setProperty("--teleprompter-active-text", appearance.textColor);
  document.documentElement.style.setProperty("--teleprompter-text-opacity", String(clamp(appearance.textOpacity / 100, 0.1, 1)));
  const baseWidth = Math.max(state.window?.width || defaultState.window.width, MIN_WIDTH);
  const contentWidth = Math.max(baseWidth - REMOTE_RAIL_WINDOW_GUTTER, MIN_WIDTH);
  document.documentElement.style.setProperty("--teleprompter-base-width", `${baseWidth}px`);
  document.documentElement.style.setProperty("--teleprompter-content-width", `${contentWidth}px`);
  document.body?.style?.setProperty("--teleprompter-base-width", `${baseWidth}px`);
  document.body?.style?.setProperty("--teleprompter-content-width", `${contentWidth}px`);

  if (getActiveMode() !== "scroll") {
    playbackController.clearPromptScrollTransform();
  }
}

function setCollapsed(nextValue, force = false) {
  if (!nextValue) {
    scriptManager?.setCollapsed(true, { notify: false });
  }
  return windowManager.setCollapsed(nextValue, force);
}

function rebuildLineMap() {
  promptRenderer.rebuildLineMap();
  lineGroups = promptRenderer.getLineGroups();
  lineIndexByWord = promptRenderer.getLineIndexByWord();
}

function scheduleLineMapRebuild() {
  promptRenderer.scheduleLineMapRebuild();
}

function applyResponsiveText(options = {}) {
  promptRenderer.applyResponsiveText({
    isReadingMode: document.body.classList.contains("reading-mode"),
    frozenWidth: frozenReadingViewportWidth,
    frozenHeight: frozenReadingViewportHeight,
    ...options
  });
  cachedPromptViewportWidth = promptRenderer.getCachedPromptViewportWidth();
  cachedPromptViewportHeight = promptRenderer.getCachedPromptViewportHeight();
  cachedPromptScrollableHeight = promptRenderer.getCachedPromptScrollableHeight();
}

function renderScript() {
  promptRenderer.renderScript();
  syncPromptRendererState();
  playbackController?.clearRenderedState?.();
  updateWordState(false);
}

function rebuildNormalizedScriptTokenMap(languageTag = getVoiceLanguageTag(), sourceWords = words()) {
  promptRenderer.rebuildNormalizedScriptTokenMap(languageTag, sourceWords);
  normalizedWordTokens = promptRenderer.getNormalizedWordTokens();
  wordIndexByNormalizedToken = promptRenderer.getWordIndexByNormalizedToken();
  normalizedTokenRangeByWord = promptRenderer.getNormalizedTokenRangeByWord();
}

function rerenderScriptPreservingPosition(previousScript, options = {}) {
  promptRenderer.rerenderScriptPreservingPosition(previousScript, options);
  syncPromptRendererState();
  playbackController?.clearRenderedState?.();
  updateWordState(false);
}

async function generatePromptScript() {
  syncStateFromStorage();
  const apiKey = state.groqKey?.trim();
  let promptDescription = state.groqPrompt?.trim();
  const existingScript = state.script?.trim() || "";

  if (!apiKey) {
    ui.statusLabel.textContent = t("tele.addGroqKey");
    return;
  }

  if (!promptDescription) {
    promptDescription = window.prompt(
      existingScript
        ? t("tele.promptExisting")
        : t("tele.promptNew"),
      existingScript
        ? t("tele.promptExistingDefault")
        : t("tele.promptNewDefault")
    )?.trim() || "";
    if (!promptDescription) {
      ui.statusLabel.textContent = t("tele.cancelled");
      return;
    }
    state.groqPrompt = promptDescription;
    saveState({ groqPrompt: promptDescription });
  }

  const request = buildGroqRequest({
    instruction: promptDescription,
    script: existingScript,
    groqSettings: state.groq,
    appLanguage: state.language
  });

  ui.statusLabel.textContent = t("tele.generating");
  ui.generateButton.disabled = true;

  try {
    const text = await generateWithGroq(apiKey, request);

    state.script = text;
    saveState({ script: text, groqPrompt: promptDescription });
    stopPlayback(true);
    renderScript();
    applyResponsiveText();
    realtimeHostController?.syncLocalScript(text);
    ui.statusLabel.textContent = t("tele.generated");
  } catch (error) {
    console.error(error);
    ui.statusLabel.textContent = t("tele.groqFailed", { error: error.message || error });
  } finally {
    ui.generateButton.disabled = false;
  }
}

function updateWordState(shouldScroll = true) {
  playbackController.updateWordState(shouldScroll);
  syncPlaybackControllerState();
}

function clearPlayback(options = {}) {
  playbackController.clearPlayback(options);
  syncPlaybackControllerState();
}

function stopPlayback(reset = true) {
  playbackController.stopPlayback(reset);
  syncPlaybackControllerState();
}

function finishPlayback() {
  stopPlayback(true);
}

function movePlaybackByLine(direction) {
  playbackController.stepPlaybackArrow(direction);
  syncPlaybackControllerState();
  return true;
}

function pausePlayback() {
  const result = playbackController.pausePlayback();
  syncPlaybackControllerState();
  return result;
}

async function resumePlayback() {
  const result = await playbackController.resumePlayback();
  syncPlaybackControllerState();
  return result;
}

async function startPlayback(options = {}) {
  await playbackController.startPlayback(options);
  syncPlaybackControllerState();
}

function togglePlayback() {
  playbackController.togglePlayback();
  syncPlaybackControllerState();
}

function restartPlaybackLoopForCurrentMode() {
  playbackController.restartPlaybackLoopForCurrentMode();
  syncPlaybackControllerState();
}

function getTrackingAndCommandGrammar(languageTag = getVoiceLanguageTag()) {
  let commandPhrases = [];
  try {
    commandPhrases = JSON.parse(getOfflineVoiceCommandGrammar(languageTag));
  } catch (error) {
    commandPhrases = [];
  }

  const scriptTokens = Array.isArray(normalizedWordTokens) ? normalizedWordTokens : [];
  const uniqueScriptWords = Array.from(new Set(scriptTokens.filter((token) => Boolean(token) && token.trim().length > 0)));

  return Array.from(new Set([
    ...uniqueScriptWords,
    ...commandPhrases.filter((phrase) => phrase !== "[unk]"),
    "[unk]"
  ]));
}

async function resolveVoiceModelStatus(languageTag = getVoiceLanguageTag(), options = {}) {
  const normalizedLanguage = normalizeVoiceLanguage(languageTag);
  const modelId = options.modelId ?? getSelectedVoiceModelId(normalizedLanguage);
  const cacheKey = getVoiceModelStatusCacheKey(normalizedLanguage, modelId);
  if (!options.force && voiceModelStatusCache.has(cacheKey)) {
    return voiceModelStatusCache.get(cacheKey);
  }

  if (!invoke) {
    return null;
  }

  try {
    const status = await invoke("get_voice_model_status", { language: normalizedLanguage, modelId });
    const normalizedStatus = status ? {
      ...status,
      language: normalizeVoiceLanguage(status.language || normalizedLanguage)
    } : null;
    voiceModelStatusCache.set(cacheKey, normalizedStatus);
    return normalizedStatus;
  } catch (error) {
    console.error("Voice model status lookup failed", error);
    return null;
  }
}

async function getVoiceModelSourceUrl(languageTag = getVoiceLanguageTag(), options = {}) {
  const normalizedLanguage = normalizeVoiceLanguage(languageTag);
  const { preferBundledEnglish = false } = options;
  const modelId = options.modelId ?? getSelectedVoiceModelId(normalizedLanguage);

  if (preferBundledEnglish && normalizedLanguage === ENGLISH_VOICE_LANGUAGE) {
    return VOSK_COMMAND_MODEL_URL;
  }

  if (invoke && convertFileSrc) {
    const status = await resolveVoiceModelStatus(normalizedLanguage, { force: true, modelId });
    if (status?.installed && status.path) {
      return convertFileSrc(status.path);
    }

    if (normalizedLanguage === ENGLISH_VOICE_LANGUAGE) {
      return VOSK_COMMAND_MODEL_URL;
    }

    return null;
  }

  return normalizedLanguage === "en-US" ? VOSK_COMMAND_MODEL_URL : null;
}





function isVoiceCommandRecognizerActive() {
  return voiceCommandListener.isVoiceCommandRecognizerActive();
}

function handleOfflineVoiceCommandTranscript(text, options = {}) {
  return voiceCommandListener.handleOfflineVoiceCommandTranscript(text, options);
}

function shouldEnableVoiceCommandListener() {
  return Boolean(state.appearance?.appWideVoiceCommands);
}

function getAuxWindowLabel(kind) {
  switch (kind) {
    case "input":
      return t("common.text");
    case "settings":
      return t("common.settings");
    case "about":
      return t("about.kicker");
    case "remote-inbox":
      return "Receiver";
    default:
      return kind;
  }
}

function openAuxWindowFromVoiceCommand(kind, failureMessageKey = "tele.opened") {
  openAuxWindow(kind).catch((error) => {
    console.error(error);
    ui.statusLabel.textContent = t(failureMessageKey, { error: error.message || error });
  });
}

function cycleToNextTheme() {
  const themes = ["main", "dark", "bright", "meadow"];
  const currentTheme = state.appearance?.theme || defaultState.appearance.theme;
  const currentIndex = Math.max(themes.indexOf(currentTheme), 0);
  const nextTheme = themes[(currentIndex + 1) % themes.length];

  const mergedState = saveState({
    appearance: {
      ...state.appearance,
      theme: nextTheme
    }
  });

  Object.assign(state, mergedState);
  applyAppearanceSettings();
  rerenderScriptPreservingPosition(state.script);
  ui.statusLabel.textContent = t("tele.opened", { kind: t(`settings.theme.${nextTheme}`) });
}

async function hideMainWindowToTray() {
  if (invoke) {
    await invokeAfterDesktopFadeOut("hide_main_window");
    return;
  }

  const appWindow = tauriWindow?.getCurrentWindow?.();
  await appWindow?.hide?.().catch?.(console.error);
}

async function showMainWindowFromTray() {
  if (invoke) {
    await invoke("show_main_window_command");
    return;
  }

  const appWindow = tauriWindow?.getCurrentWindow?.();
  if (!appWindow) {
    return;
  }

  await appWindow.unminimize?.().catch?.(() => {});
  await appWindow.show?.().catch?.(console.error);
  await appWindow.setAlwaysOnTop?.(true).catch?.(() => {});
  await appWindow.setFocus?.().catch?.(() => {});
}

function handleVoiceCommandAction(action) {
  switch (action) {
    case "open-about":
      openAuxWindowFromVoiceCommand("about", "tele.failedOpenSettings");
      return true;
    case "open-settings":
      openAuxWindowFromVoiceCommand("settings", "tele.failedOpenSettings");
      return true;
    case "open-input":
      openAuxWindowFromVoiceCommand("input", "tele.failedOpenInput");
      return true;
    case "use-groq":
      generatePromptScript().catch(console.error);
      return true;
    case "next-theme":
      cycleToNextTheme();
      return true;
    case "open-receiver":
      openAuxWindowFromVoiceCommand("remote-inbox", "tele.failedOpenSettings");
      return true;
    case "free-drag":
      windowManager.setWindowPreset("drag", { isPinned: false }).catch(console.error);
      return true;
    case "top-center":
      windowManager.setWindowPreset("top-center", { isPinned: true }).catch(console.error);
      return true;
    case "play":
      if (!isPlaying && !isPaused) {
        play();
        return true;
      }

      return resumePlayback();
    case "hide":
      hideMainWindowToTray().catch(console.error);
      return true;
    case "show":
      showMainWindowFromTray().catch(console.error);
      return true;
    case "minimize":
      viewStateController.setViewState("BOTH_MINIMIZED").catch(console.error);
      return true;
    case "expand":
      viewStateController.setViewState("PROMPTER_EXPANDED").catch(console.error);
      return true;
    case "exit":
      invoke?.("close_app").catch(console.error);
      return true;
    case "restart":
      replayFromStart();
      return true;
    case "stop":
      stopPlayback(false);
      return true;
    case "pause":
      return pausePlayback();
    case "continue":
      return resumePlayback();
    case "up":
      return movePlaybackByLine(-1);
    case "down":
      return movePlaybackByLine(1);
    default:
      return false;
  }
}

async function stopVoiceCommandListener(options = {}) {
  return voiceCommandListener.stopVoiceCommandListener(options);
}

async function startVoiceCommandListener(options = {}) {
  return voiceCommandListener.startVoiceCommandListener(options);
}

function syncVoiceCommandListener(options = {}) {
  return voiceCommandListener.syncVoiceCommandListener(options);
}

function refreshVoiceCommandListener(forceReset = false) {
  window.setTimeout(() => {
    syncVoiceCommandListener({ forceReset });
  }, 0);
}

function shouldMonitorVoiceHealth() {
  return voiceCommandListener.shouldMonitorVoiceHealth();
}

function scheduleVoiceHealthCheck(delayMs = VOICE_HEALTH_IDLE_CHECK_MS) {
  return voiceCommandListener.scheduleVoiceHealthCheck(delayMs);
}

function startVoiceCommandHealthMonitor() {
  return voiceCommandListener.startVoiceCommandHealthMonitor();
}

function installVoiceCommandDebugHelpers() {
  const existingDebugTools = window.__flowVoiceDebug || {};
  window.__flowVoiceDebug = {
    ...existingDebugTools,
    extractCommand(text) {
      return voiceCommandListener.extractVoiceCommand(text);
    },
    simulateCommand(text, options = {}) {
      const command = voiceCommandListener.extractVoiceCommand(text);
      if (!command) {
        return { ok: false, reason: "no-command" };
      }

      const handled = voiceCommandListener.processVoiceCommand(command, {
        playSound: options.playSound !== false
      });

      return {
        ok: handled,
        command
      };
    },
    getCommandState() {
      return {
        appWideVoiceCommands: shouldEnableVoiceCommandListener(),
        voiceCommandListening: isVoiceCommandRecognizerActive(),
        voiceCommandSharedWithTracking: voiceCommandListener.getVoiceCommandSharedWithTracking?.() ?? false,
        voiceCommandStarting: voiceCommandListener.getIsVoiceCommandRecognitionStarting?.() ?? false,
        voiceCommandBlocked: voiceCommandListener.getIsVoiceCommandRecognitionBlocked?.() ?? false,
        lastVoiceCommandError: voiceCommandListener.getLastVoiceCommandError?.() ?? "",
        lastVoiceCommandAudioProcessAt: voiceCommandListener.getLastVoiceCommandAudioProcessAt?.() ?? 0
      };
    },
    resetCommands() {
      voiceCommandListener.resetVoiceCommandGuard();
      voiceCommandListener.resetVoiceCommandTranscript();
    }
  };
}



function findVoicePartialMatchIndex(spokenTokens, options = {}) {
  return speechTracker.findVoicePartialMatchIndex(spokenTokens, options);
}

function findVoiceExactPhraseMatch(spokenTokens, options = {}) {
  return speechTracker.findVoiceExactPhraseMatch(spokenTokens, options);
}

function findVoiceLineMatch(spokenTokens, options = {}) {
  return speechTracker.findVoiceLineMatch(spokenTokens, options);
}

function stopVoiceTrackingAdvance() {
  speechTracker.stopVoiceTrackingAdvance();
}





function applyVoiceTrackingWordHints(words, options = {}) {
  return speechTracker.applyVoiceTrackingWordHints(words, options);
}





async function stopVoiceTracking() {
  await speechTracker.stopVoiceTracking();

  if (shouldEnableVoiceCommandListener()) {
    syncVoiceCommandListener({ forceReset: true });
  }
}

function applyVoiceTrackingTranscript(transcript, options = {}) {
  speechTracker.applyVoiceTrackingTranscript(transcript, options);
}

async function startVoiceTracking() {
  await speechTracker.startVoiceTracking();
}

function playVoiceMode() {
  clearPromptFeedback();
  scheduleVoiceHealthCheck(0);
  voiceTranscript = "";
  voiceCommandListener.resetVoiceCommandTranscript();
  syncPromptLayout();
  updateWordState(true);
  if (ui.statusLabel) ui.statusLabel.textContent = "\u{1F3A4} Listening...";

  startVoiceTracking().catch((error) => {
    console.error("Vosk voice tracking failed to start", error);
    const feedbackKey = getVoiceTrackingFeedbackKey(error);
    if (feedbackKey) {
      setPromptFeedback(feedbackKey);
    }
    if (ui.statusLabel) {
      ui.statusLabel.textContent = getVoiceTrackingFailureStatus(error);
    }
    stopPlayback();
  });
}

async function play(options = {}) {
  await playbackController.startPlayback(options);
  syncPlaybackControllerState();
}

async function openAuxWindow(kind) {
  if (invoke) {
    await invoke("open_aux_window", { kind });
    const kindLabel = getAuxWindowLabel(kind);
    ui.statusLabel.textContent = t("tele.opened", { kind: kindLabel });
  }
}



function togglePause() {
  if (!isPlaying && !isPaused) {
    return;
  }

  if (playbackController.getIsPlaybackCountdownActive?.()) {
    pausePlayback();
    return;
  }

  if (isPaused) {
    resumePlayback().catch(console.error);
  } else {
    pausePlayback();
  }
}

function replayFromStart() {
  play({ fromBeginning: true }).catch(console.error);
}

function scrollBackward() {
  if (wordNodes.length === 0) {
    return;
  }

  if (getActiveMode() === "arrow" && isPlaying) {
    stepArrowMode(-1);
    return;
  }

  const rewindWords = Math.max(Math.round(state.speed / 12), 8);
  jumpToIndex(currentIndex - rewindWords);
}

async function toggleClickthroughMode() {
  if (!invoke) {
    return;
  }

  try {
    shouldAnnounceClickthroughStatus = true;
    const enabled = await invoke("toggle_main_clickthrough");
    if (!unlistenClickthroughChanged && ui.statusLabel) {
      shouldAnnounceClickthroughStatus = false;
      ui.statusLabel.textContent = enabled ? t("tele.clickthroughEnabled") : t("tele.clickthroughDisabled");
    }
  } catch (error) {
    shouldAnnounceClickthroughStatus = false;
    console.error(error);
  }
}

function stepArrowMode(direction) {
  if (getActiveMode() !== "arrow" || !isPlaying || isPaused) {
    return;
  }

  const activeLineIndex = lineIndexByWord[currentIndex] ?? 0;
  const nextLineIndex = clamp(activeLineIndex + direction, 0, Math.max(lineGroups.length - 1, 0));
  const nextLine = lineGroups[nextLineIndex];

  if (!nextLine) {
    return;
  }

  currentIndex = nextLine.firstIndex;
  const totalScrollable = refreshPromptViewportMetrics();
  const targetTop = playbackController.getLineTargetTop(nextLineIndex);
  playbackController.scrollToLine(nextLineIndex);
  scrollProgress = totalScrollable > 0 ? clamp(targetTop / totalScrollable, 0, 1) : scrollProgress;
  updateWordState(false);
}

function stepPlaybackLine(direction) {
  if (wordNodes.length === 0) {
    return;
  }

  const activeMode = getActiveMode();

  if (activeMode !== "line" && activeMode !== "scroll") {
    return;
  }

  const activeLineIndex = lineIndexByWord[currentIndex] ?? 0;
  const nextLineIndex = clamp(activeLineIndex + direction, 0, Math.max(lineGroups.length - 1, 0));
  const nextLine = lineGroups[nextLineIndex];

  if (!nextLine) {
    return;
  }

  jumpToIndex(nextLine.firstIndex);
}

function jumpToIndex(targetIndex) {
  if (wordNodes.length === 0) {
    return;
  }

  const nextIndex = clamp(targetIndex, 0, wordNodes.length - 1);
  currentIndex = nextIndex;

  const totalScrollable = refreshPromptViewportMetrics();
  const activeLineIndex = lineIndexByWord[currentIndex] ?? 0;
  const targetTop = playbackController.getLineTargetTop(activeLineIndex);
  scrollProgress = totalScrollable > 0 ? clamp(targetTop / totalScrollable, 0, 1) : 0;

  if (getActiveMode() === "scroll") {
    playbackController.setViewportPosition(targetTop, getScrollBehavior());

    if (isPlaying && !isPaused) {
      playbackController.resetPromptWaitCards(targetTop, currentIndex);
      updateWordState(false);
      return;
    }
  }

  if (isPlaying && !isPaused) {
    restartPlaybackLoopForCurrentMode();
    return;
  }

  updateWordState(true);
}

function refreshFromStorage() {
  const previousVoiceLanguage = getVoiceLanguageTag();
  const previousVoiceModelId = getSelectedVoiceModelId(previousVoiceLanguage);
  const previousAppWideVoiceCommands = Boolean(state.appearance?.appWideVoiceCommands);
  const previousVoiceCaptureSettings = getVoiceCaptureSettingsSignature(state.appearance);
  const previousState = {
    script: state.script,
    speed: state.speed,
    language: state.language,
    desktop: JSON.stringify(state.desktop),
    remote: JSON.stringify(state.remote),
    voiceTracking: JSON.stringify(state.voiceTracking),
    appearance: JSON.stringify(state.appearance),
    window: JSON.stringify(state.window)
  };

  syncStateFromStorage();
  state.desktop = state.desktop || structuredClone(defaultState.desktop);
  realtimeHostController?.refreshConfig().catch(console.error);
  if (!isApplyingRemoteScript) {
    realtimeHostController?.syncLocalScript(state.script);
  }
  const nextVoiceLanguage = getVoiceLanguageTag();
  const nextVoiceModelId = getSelectedVoiceModelId(nextVoiceLanguage);
  const voiceLanguageChanged = previousVoiceLanguage !== nextVoiceLanguage;
  const voiceModelChanged = previousVoiceModelId !== nextVoiceModelId;
  const appWideVoiceCommandsChanged = previousAppWideVoiceCommands !== Boolean(state.appearance?.appWideVoiceCommands);
  const voiceCaptureSettingsChanged = previousVoiceCaptureSettings !== getVoiceCaptureSettingsSignature(state.appearance);
  if (voiceModelChanged) {
    voiceModelStatusCache.clear();
  }
  syncVoiceCommandListener({ forceReset: voiceLanguageChanged || voiceModelChanged || appWideVoiceCommandsChanged || voiceCaptureSettingsChanged });

  const speedChanged = previousState.speed !== state.speed;
  const scriptChanged = previousState.script !== state.script;
  const languageChanged = previousState.language !== state.language;
  const appearanceChanged = previousState.appearance !== JSON.stringify(state.appearance);
  const desktopChanged = previousState.desktop !== JSON.stringify(state.desktop);
  const windowChanged = previousState.window !== JSON.stringify(state.window);
  const remoteChanged = previousState.remote !== JSON.stringify(state.remote);
  const voiceTrackingChanged = previousState.voiceTracking !== JSON.stringify(state.voiceTracking);

  if (speedChanged) {
    playbackController.setPlaybackSpeed(state.speed, { persist: false });
  }

  if (!scriptChanged && !languageChanged && !appearanceChanged && !desktopChanged && !windowChanged && !remoteChanged && !voiceTrackingChanged) {
    return;
  }

  if (languageChanged) {
    applyTranslationsToDocument(state.language);
    updatePromptFeedbackOverlay();
    updateSpeedLabel();
    windowManager.updateCollapseButton();
    updatePlayButtons();
    scriptManager?.render?.();
    completionTracker?.refreshSections?.();
    promptRenderer.renderScript();
    syncPromptRendererState();
    playbackController?.clearRenderedState?.();
    updateWordState(false);
  }

  windowManager.updateDragControls();
  viewStateController.syncModulesVisibility();

  if (previousState.script !== state.script) {
    completionTracker?.refreshSections?.();
  }

  if (previousState.appearance !== JSON.stringify(state.appearance)) {
    applyAppearanceSettings();
    updatePlayButtons();
    applyStoredWindowSettings().catch(console.error);

    if ((voiceLanguageChanged || voiceModelChanged || voiceCaptureSettingsChanged) && isPlaying && getActiveMode() === "voice") {
      stopVoiceTracking()
        .catch(console.error)
        .finally(() => {
          if (isPlaying && getActiveMode() === "voice") {
            playVoiceMode();
          }
        });
    }
  }

  if (previousState.desktop !== JSON.stringify(state.desktop)) {
    windowManager.applyDesktopPreferences().catch(console.error);
  }

  if (previousState.script !== state.script || previousState.appearance !== JSON.stringify(state.appearance)) {
    if (previousState.appearance !== JSON.stringify(state.appearance)) {
      clearPendingScriptRerender();
      rerenderScriptPreservingPosition(lastRenderedScriptSnapshot);
      return;
    }

    scheduleScriptRerender();
    return;
  }

  if (previousState.window !== JSON.stringify(state.window)) {
    setSpeedRailGutter(getSpeedRailWindowGutter());
    applyStoredWindowSettings().catch(console.error);
  }
}

function wireEvents() {
  ui.speedDownButton.addEventListener("click", () => {
    console.log(`[Flow Action] Click Speed Down Button -> newSpeed=${state.speed - 10}`);
    adjustSpeed(-10);
  });

  ui.speedUpButton.addEventListener("click", () => {
    console.log(`[Flow Action] Click Speed Up Button -> newSpeed=${state.speed + 10}`);
    adjustSpeed(10);
  });

  ui.speedLabel.addEventListener("input", () => {
    if (ui.speedLabel.readOnly) {
      updateSpeedLabel();
      return;
    }

    ui.speedLabel.value = ui.speedLabel.value.replace(/[^\d]/g, "");
  });

  ui.speedLabel.addEventListener("change", commitTypedSpeed);
  ui.speedLabel.addEventListener("blur", commitTypedSpeed);
  ui.speedLabel.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      ui.speedLabel.blur();
    }
  });
  ui.speedRailSlider.addEventListener("input", () => {
    syncSliderProgress(ui.speedRailSlider);
    setSpeedValue(ui.speedRailSlider.value);
  });
  ui.speedRailSlider.addEventListener("change", () => {
    console.log(`[Flow Action] Change Speed Rail Slider -> ${ui.speedRailSlider.value} WPM`);
    syncSliderProgress(ui.speedRailSlider);
    setSpeedValue(ui.speedRailSlider.value, { persistImmediately: true });
  });
  ui.speedRailSlider.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      adjustSpeed(event.repeat ? 4 : 2);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      adjustSpeed(event.repeat ? -4 : -2);
    }
  });

  syncSliderProgress(ui.speedRailSlider);

  ui.generateButton.addEventListener("click", () => {
    console.log("[Flow Action] Click Generate Script Button");
    generatePromptScript().catch(console.error);
  });

  ui.playButton.addEventListener("click", () => {
    console.log("[Flow Action] Click Play Button");
    if (isPlaying) return;
    play();
    focusPlaybackSurface();
  });

  ui.floatingStopButton.addEventListener("click", () => {
    console.log("[Flow Action] Click Floating Stop Button");
    stopPlayback(false);
    focusPlaybackSurface();
  });

  ui.floatingReplayButton.addEventListener("click", () => {
    console.log("[Flow Action] Click Floating Replay Button");
    replayFromStart();
    focusPlaybackSurface();
  });

  ui.floatingPauseButton.addEventListener("click", () => {
    console.log(`[Flow Action] Click Floating Pause/Resume Button (currently isPaused=${isPaused})`);
    togglePause();
    focusPlaybackSurface();
  });

  ui.inputButton.addEventListener("click", () => {
    console.log("[Flow Action] Click Edit Script (Input) Button");
    openAuxWindow("input").catch((error) => {
      console.error(error);
      ui.statusLabel.textContent = t("tele.failedOpenInput", { error });
    });
  });

  ui.settingsButton.addEventListener("click", () => {
    console.log("[Flow Action] Click Settings Button");
    openAuxWindow("settings").catch((error) => {
      console.error(error);
      ui.statusLabel.textContent = t("tele.failedOpenSettings", { error });
    });
  });

  ui.closeAppButton.addEventListener("click", () => {
    console.log("[Flow Action] Click Close App Button");
    if (!invoke) {
      return;
    }

    invokeAfterDesktopFadeOut("close_app").catch((error) => {
      console.error(error);
      ui.statusLabel.textContent = t("tele.failedCloseApp", { error });
    });
  });

  if (ui.pinButton) {
    ui.pinButton.addEventListener("click", () => {
      console.log("[Flow Action] Click Pin / Drag Overlay Button");
      windowManager.toggleDragOverlay().catch(console.error);
    });
  }
  ui.collapseButton.addEventListener("click", () => {
    const viewState = viewStateController.getCurrentViewState();
    if (viewState === "SCRIPT_MANAGER_EXPANDED" || document.body.classList.contains("script-manager-open")) {
      console.log("[Flow Action] Click Notch while Script Manager open -> Restoring Teleprompter & Collapsing Script Manager");
      viewStateController.setViewState("PROMPTER_EXPANDED").catch(console.error);
      return;
    }
    const targetState = viewState === "BOTH_MINIMIZED" ? "PROMPTER_EXPANDED" : "BOTH_MINIMIZED";
    console.log(`[Flow Action] Click Collapse / Expand Toggle Button -> targetState=${targetState}`);
    viewStateController.setViewState(targetState).catch(console.error);
  });

  ui.promptText.addEventListener("click", (event) => hotkeyManager.handlePromptClick(event));

  let windowResizeRaf = null;
  window.addEventListener("resize", () => {
    if (
      document.body.classList.contains("teleprompter-collapsing") ||
      document.body.classList.contains("teleprompter-expanding") ||
      document.body.classList.contains("teleprompter-collapsed") ||
      document.body.classList.contains("transition-to-script-manager") ||
      document.body.classList.contains("transition-to-prompter") ||
      document.body.classList.contains("transition-to-notch") ||
      document.body.classList.contains("script-manager-open")
    ) {
      return;
    }
    if (windowResizeRaf) return;
    windowResizeRaf = requestAnimationFrame(() => {
      windowResizeRaf = null;
      applyResponsiveText();
      updateSpeedInputMode();
    });
  });
  window.addEventListener("focus", () => {
    if (shouldEnableVoiceCommandListener() && !isVoiceCommandRecognizerActive()) {
      refreshVoiceCommandListener();
    }
  });
  window.addEventListener("blur", () => {
    scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (shouldEnableVoiceCommandListener() && !isVoiceCommandRecognizerActive()) {
        refreshVoiceCommandListener();
      }
      return;
    }

    scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
  });
  window.addEventListener("pointerdown", () => {
    if (!state.appearance?.appWideVoiceCommands) {
      return;
    }

    if (!isVoiceCommandRecognizerActive()) {
      refreshVoiceCommandListener();
    }
  }, true);
  window.addEventListener("keydown", (event) => {
    if (!state.appearance?.appWideVoiceCommands || event.repeat) {
      return;
    }

    if (!isVoiceCommandRecognizerActive()) {
      refreshVoiceCommandListener();
    }
  }, true);
  let refreshStorageTimer = 0;
  function scheduleRefreshFromStorage() {
    if (refreshStorageTimer) {
      clearTimeout(refreshStorageTimer);
    }
    refreshStorageTimer = window.setTimeout(() => {
      refreshStorageTimer = 0;
      refreshFromStorage();
    }, 60);
  }
  window.addEventListener("storage", scheduleRefreshFromStorage);
  window.addEventListener("flow-state-updated", scheduleRefreshFromStorage);
  window.addEventListener("flow-voice-models-updated", scheduleRefreshFromStorage);
  window.addEventListener("keydown", (event) => hotkeyManager.handleKeyDown(event));
  window.addEventListener("keyup", (event) => hotkeyManager.handleKeyUp(event));
  window.addEventListener("blur", () => playbackController.stopPlaybackArrowHold());
  window.addEventListener("beforeunload", () => {
    playbackController.stopPlaybackArrowHold();
    playbackController.flushPendingSpeedPersist();
    stopVoiceCommandListener();
    stopVoiceTracking();
    unlistenNativeVoiceEvents?.();
    unlistenNativeVoiceEvents = null;
    windowManager.unbindDesktopEventListeners();
    stopRemoteReceiverLoop();

    autoUpdater.stopAutomaticUpdater();

    realtimeHostController?.dispose();
    realtimeHostController = null;
  });

  let promptViewportResizeRaf = null;
  resizeObserver = new ResizeObserver(() => {
    if (
      document.body.classList.contains("teleprompter-collapsing") ||
      document.body.classList.contains("teleprompter-expanding") ||
      document.body.classList.contains("teleprompter-collapsed") ||
      document.body.classList.contains("transition-to-script-manager") ||
      document.body.classList.contains("transition-to-prompter") ||
      document.body.classList.contains("transition-to-notch") ||
      document.body.classList.contains("script-manager-open")
    ) {
      return;
    }
    if (promptViewportResizeRaf) return;
    promptViewportResizeRaf = requestAnimationFrame(() => {
      promptViewportResizeRaf = null;
      applyResponsiveText();
    });
  });
  resizeObserver.observe(ui.promptViewport);
}

function applyStoredWindowSettings() {
  return windowManager.applyStoredWindowSettings();
}

async function bootFlowApp() {
  try {
    syncStateFromStorage();
    state.desktop = state.desktop || structuredClone(defaultState.desktop);
    clearStaleRealtimeEditingConfig();

    ensureNativeVoiceEventListener().catch(console.error);

    Object.assign(state, rotateRemoteAccessPasswordForLaunch(state));

    windowManager.applyDesktopPreferences().catch(console.error);

    applyTranslationsToDocument(state.language);

    cacheUi();

    setSpeedRailGutter(SPEED_RAIL_WINDOW_GUTTER);

    installVoiceCommandDebugHelpers();

    applyAppearanceSettings();

    windowManager.updateCollapseButton();

    windowManager.updateDragControls();

    updateSpeedLabel();

    updateSpeedInputMode();

    renderScript();

    realtimeHostController = createRealtimeHostController({
      buildCloudApiUrl: buildRealtimeApiUrl,
      getCurrentRoomId: () => state.remote?.receiverId || "",
      getCurrentScript: () => state.script || "",
      getCurrentPlaybackState: () => ({
        active: isPlaying,
        paused: isPaused,
        wordIndex: currentIndex,
        totalWords: wordNodes.length,
        wordText: wordNodes[currentIndex]?.textContent || ""
      }),
      applyRemoteScript: async (nextText) => {
        isApplyingRemoteScript = true;
        try {
          const mergedState = saveState({ script: nextText });
          Object.assign(state, mergedState);
          scheduleRenderScript();
        } finally {
          isApplyingRemoteScript = false;
        }
      },
      closeRealtimeRoom: async () => {
        clearRealtimeEditingConfig();
      },
      isHostEditingActive: () => false
    });
    let renderScriptTimer = 0;
    function scheduleRenderScript() {
      if (renderScriptTimer) {
        cancelAnimationFrame(renderScriptTimer);
      }
      renderScriptTimer = requestAnimationFrame(() => {
        renderScriptTimer = 0;
        renderScript();
      });
    }
    let realtimeRefreshTimer = 0;
    function scheduleRealtimeRefresh() {
      if (realtimeRefreshTimer) {
        clearTimeout(realtimeRefreshTimer);
      }
      realtimeRefreshTimer = window.setTimeout(() => {
        realtimeRefreshTimer = 0;
        realtimeHostController?.refreshConfig().catch(console.error);
      }, 150);
    }

    realtimeHostController.refreshConfig().catch(console.error);
    window.addEventListener(getRealtimeEditingUpdatedEventName(), scheduleRealtimeRefresh);
    window.addEventListener("storage", (event) => {
      if (!event.key || event.key === "flow.realtime.editing.v1") {
        scheduleRealtimeRefresh();
      }
    });
    window.addEventListener("focus", scheduleRealtimeRefresh);

    applyResponsiveText();

    windowManager.bindDesktopEventListeners().catch(console.error);

    wireEvents();

    startVoiceCommandHealthMonitor();

    setRemoteInboxDelegate({
      getRemoteInbox: () => ui.remoteInbox,
      setStatusLabel: (text) => {
        if (ui.statusLabel) ui.statusLabel.textContent = text;
      },
      onScriptAppend: (addition) => {
        const previousScript = state.script;
        const nextScript = (state.script || "").trimEnd();
        const additionTrimmed = String(addition || "").trim();
        const newScript = nextScript ? `${nextScript}\n\n${additionTrimmed}` : additionTrimmed;
        state.script = newScript;
        saveState({ script: newScript });
        rerenderScriptPreservingPosition(previousScript);
        realtimeHostController?.syncLocalScript(newScript);
      },
      wait: (ms) => new Promise((resolve) => window.setTimeout(resolve, ms))
    });

    startRemoteReceiverLoop();

    updatePlayButtons();

    syncVoiceCommandListener();

    applyStoredWindowSettings().catch(console.error);

    if (!(await resolveMicrosoftStoreBuild()) && (await autoUpdater.resolveInAppUpdaterAvailability())) {
      startAutomaticUpdater();
    }

    scriptManager = createScriptManager({
      state,
      t,
      onLoadScript: (content) => {
        state.script = content;
        saveState({ script: content });
        promptRenderer.renderScript();
        syncPromptRendererState();
        playbackController.stopPlayback(true);
        syncPlaybackControllerState();
        completionTracker?.refreshSections();
        viewStateController.setViewState("PROMPTER_EXPANDED").catch(console.error);
        realtimeHostController?.syncLocalScript(content);
      },
      onToggleCollapse: (dockIsCollapsed) => {
        if (!dockIsCollapsed) {
          viewStateController.setViewState("SCRIPT_MANAGER_EXPANDED").catch(console.error);
        } else {
          const targetState = viewStateController.getPreviousViewStateBeforeScriptManager() === "BOTH_MINIMIZED" ? "BOTH_MINIMIZED" : "PROMPTER_EXPANDED";
          viewStateController.setViewState(targetState).catch(console.error);
        }
      },
      onSaveCurrentScript: () => {
        // notification or feedback
      }
    });
    if (ui.scriptManagerCardSlot) {
      scriptManager.mount(ui.scriptManagerCardSlot);
    }

    completionTracker = createCompletionTracker({
      state,
      t,
      onJumpToSection: (section) => {
        if (section && typeof section.wordOffset === "number") {
          playbackController.jumpToWordIndex(section.wordOffset);
          syncPlaybackControllerState();
        }
      }
    });
    if (ui.scriptCompletionCardSlot) {
      completionTracker.mount(ui.scriptCompletionCardSlot);
    }

    viewStateController.syncModulesVisibility();

    const pro = await getProModule().catch((error) => console.warn("Pro loader initialization warning", error));
    pro?.initializePro?.({ state, saveState, ui });

    initializeDesktopWindowOpacityFade(document, false);
  } catch (error) {
    console.error("Flow boot failed", error);
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", bootFlowApp, { once: true });
} else {
  bootFlowApp();
}



