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
  applyTextDirection,
  applyTranslationsToDocument,
  buildGroqRequest,
  clamp,
  defaultState,
  estimateMinutes,
  generateRemoteAccessPassword,
  generateWithGroq,
  getSelectedVoiceModelId,
  initializePersistentStorage,
  initializeDesktopWindowOpacityFade,
  invokeAfterDesktopFadeOut,
  loadState,
  normalizeVoiceLanguage,
  parseFormattedScript,
  resolveFontStack,
  saveState,
  splitWords,
  parseWaitCardText,
  translate,
  VOICE_LANGUAGE_OPTIONS
} from "./shared.js";

await initializePersistentStorage();

function setButtonIcon(element, iconClassName) {
  const icon = element?.querySelector(".ph");
  if (!icon) {
    return;
  }

  icon.className = `ph ${iconClassName}`;
  icon.setAttribute("aria-hidden", "true");
}


// Configuration constants
const MIN_WIDTH = 400;
const MIN_HEIGHT = 200;
const COLLAPSED_HEIGHT = 56;
const COLLAPSE_DURATION = 420;
const SPEED_RAIL_WINDOW_GUTTER = 74;
const MAX_WIDTH_FALLBACK = 2200;
const MAX_HEIGHT_FALLBACK = 1400;
const SPEED_RAIL_TRANSITION_MS = 220;
const PLAYBACK_COUNTDOWN_STEPS = ["3", "2", "1"];
const PLAYBACK_COUNTDOWN_STEP_MS = 1000;
const PLAYBACK_COUNTDOWN_SETTLE_MS = 0;
const PLAYBACK_ARROW_HOLD_INITIAL_DELAY_MS = 180;
const PLAYBACK_ARROW_HOLD_BASE_INTERVAL_MS = 160;
const PLAYBACK_ARROW_HOLD_MIN_INTERVAL_MS = 46;
const PLAYBACK_ARROW_HOLD_ACCELERATION_MS = 420;
const SCROLL_PLAYBACK_START_HOLD_MIN_SECONDS = 0;
const SCROLL_PLAYBACK_START_HOLD_MAX_SECONDS = 10;
const WAIT_CARD_STEP_MS = 1000;
const WAIT_CARD_NUMBER_ANIMATION_MS = 360;
const WAIT_CARD_TRIGGER_VIEWPORT_OFFSET = 0.5;
const TOP_CENTER_X_OFFSET = 32;
const WINDOW_POSITION_RETRY_DELAY_MS = 120;
const MAX_WINDOW_POSITION_RETRIES = 3;
const VOICE_WORD_VIEWPORT_OFFSET = 0.42;
const VOICE_LINE_VIEWPORT_OFFSET = 0.38;
const VOICE_SCROLL_EASING = 0.18;
const VOICE_SCROLL_MAX_STEP = 18;
const VOICE_TRACKING_PARTIAL_MIN_INTERVAL_MS = 45;
const VOICE_TRACKING_PARTIAL_REPEAT_GUARD_MS = 90;
const VOICE_TRACKING_ADVANCE_STEP_MS = 28;
const VOICE_TRACKING_MAX_ANIMATED_JUMP = 8;
const VOICE_TRACKING_MATCH_RADIUS = 2;
const VOICE_FORWARD_SKIP_CONFIRM_MS = 2500;
const VOICE_COMMAND_SOUND_URL = new URL("./assets/voice-command-recognized.mp3", import.meta.url).href;
const VOICE_COMMAND_SOUND_REPEAT_GUARD_MS = 700;
const VOICE_COMMAND_RESTART_DELAY_MS = 0;
const VOICE_COMMAND_COOLDOWN_MS = 40;
const VOICE_COMMAND_IDLE_ARM_MS = 45_000;
const VOICE_COMMAND_REPEAT_GUARD_MS = 450;
const VOICE_COMMAND_ACTION_REPEAT_GUARD_MS = 520;
const VOICE_COMMAND_MIN_CONFIDENCE = 0.35;
const VOICE_COMMAND_BUFFER_TOKEN_LIMIT = 12;
const VOICE_COMMAND_LOOKBACK_TOKENS = 10;
const VOICE_DEBUG_HISTORY_LIMIT = 160;
const VOSK_COMMAND_BUFFER_SIZE = 4096;
const VOSK_SCRIPT_PROCESSOR_FALLBACK_BUFFER_SIZE = 1024;
const AUTO_UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const VOSK_COMMAND_MODEL_URL = new URL("./assets/vosk-model-small-en-us-0.15.tar.gz", import.meta.url).href;
const VOICE_CAPTURE_WORKLET_URL = new URL("./assets/vendor/voice-capture-worklet.js", import.meta.url).href;
const NATIVE_VOICE_EVENT_NAME = "flow-native-voice-event";
const VOICE_WAKE_VISUAL_MS = 2400;
const VOICE_WAKE_COMMAND_WINDOW_MS = 3200;
const VOICE_WAKE_COOLDOWN_MS = 2000;
const VOICE_WAKE_REPEAT_GUARD_MS = 900;
const VOICE_WAKE_MIN_CONFIDENCE = 0.35;
const BASE_VOICE_COMMAND_FILLER_TOKENS = ["please", "the", "a", "an", "to", "for", "now", "okay", "ok", "hey", "just"];
const BASE_VOICE_ACTION_ALIASES = {
  "open-about": ["about", "about flow", "info"],
  "open-settings": ["settings", "setting", "preferences", "open settings"],
  "open-input": ["text editor", "text page", "input", "editor", "open text editor"],
  "use-groq": ["use groq", "groq", "ask groq", "generate with groq"],
  "next-theme": ["next theme", "change theme", "switch theme"],
  "open-receiver": ["open receiver", "receiver", "receiver inbox", "open inbox", "remote inbox"],
  "free-drag": ["free drag", "free-drag", "freedrag", "drag free"],
  "top-center": ["top center", "top centre", "top-center", "topcentre", "center top", "centre top"],
  "play": ["play", "start", "begin"],
  "hide": ["hide", "hyde", "high", "hides", "conceal", "disappear", "vanish"],
  "show": ["show", "unhide", "display", "reveal", "appear"],
  "minimize": ["minimize", "minimise", "minimized", "minimised", "mini", "minimum", "collapse", "collapsed"],
  "expand": ["expand", "restore", "open"],
  "exit": ["exit", "exist", "eggsit", "eggzit", "close", "quit"],
  "restart": ["restart", "reset", "replay"],
  "stop": ["stop", "end"],
  "pause": ["pause", "halt", "hold", "wait"],
  "continue": ["continue", "resume", "continue on"],
  "up": ["up", "previous", "back"],
  "down": ["down", "next", "forward"]
};
const VOICE_LANGUAGE_CONFIGS = createVoiceLanguageConfigs();
const ENGLISH_VOICE_LANGUAGE = "en-US";

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
const VOICE_HEALTH_IDLE_CHECK_MS = 30_000;
const VOICE_HEALTH_ACTIVE_CHECK_MS = 8_000;
const VOICE_COMMAND_STALL_RESET_MS = 20_000;
const VOICE_CAPTURE_ERROR_PERMISSION_DENIED = "voice-capture-permission-denied";
const VOICE_CAPTURE_ERROR_NO_DEVICE = "voice-capture-no-device";
const VOICE_CAPTURE_ERROR_UNAVAILABLE = "voice-capture-unavailable";

const ui = {};
let tickTimer = null;
let voiceRecognition = null;
let voiceCommandRecognition = null;
let scrollAnimationFrame = null;
let viewportScrollAnimationFrame = null;
let currentIndex = 0;
let isPlaying = false;
let isPaused = false;
let isCollapsed = false;
let collapseTransitionToken = 0;
let currentWindowHeight = null;
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
let voiceCommandAudio = null;
let voiceCommandSoundAssetAvailable = true;
let voiceCommandFallbackAudioContext = null;
let lastVoiceCommandSoundKey = "";
let lastVoiceCommandSoundAt = 0;
let lastVoiceCommandKey = "";
let lastVoiceCommandAt = 0;
let lastVoiceCommandAction = "";
let lastVoiceCommandActionAt = 0;
let playbackCountdownToken = 0;
let isPlaybackCountdownActive = false;
let isVoiceCommandRecognitionStarting = false;
let isVoiceCommandRecognitionBlocked = false;
let voiceCommandTranscript = "";
let voiceCommandCooldownUntil = 0;
let voiceCommandRestartTimer = null;
const voiceModels = new Map();
const voiceModelPromises = new Map();
let lastVoiceCommandError = "";
let voiceCommandMediaStream = null;
let voiceCommandAudioContext = null;
let voiceCommandSourceNode = null;
let voiceCommandProcessorNode = null;
let voiceCommandSilenceNode = null;
let voiceTrackingMediaStream = null;
let voiceTrackingAudioContext = null;
let voiceTrackingSourceNode = null;
let voiceTrackingProcessorNode = null;
let voiceTrackingSilenceNode = null;
let voiceTrackingStartPromise = null;
let isVoiceTrackingStarting = false;
let voiceTrackingSession = 0;
let activeVoiceTrackingLanguageTag = null;
let lastVoiceTrackingAudioProcessAt = 0;
let lastVoiceTrackingPartialHandledAt = 0;
let lastVoiceTrackingPartialKey = "";
let pendingForwardVoiceSkip = null;
let voiceTrackingAdvanceFrame = null;
let voiceTrackingAdvanceTarget = -1;
let voiceTrackingAdvanceLastStepAt = 0;
let voiceCommandListenerSession = 0;
let voiceCommandResumeListenersInstalled = false;
let voiceCommandSyncPromise = Promise.resolve();
let voiceCommandHealthTimer = null;
let lastVoiceCommandAudioProcessAt = 0;
let voiceWakeOverlayTimer = null;
let voiceWakeActiveUntil = 0;
let lastVoiceWakeAt = 0;
let voiceWakeAwaitingFollowup = false;
let voiceCommandArmedUntil = 0;
let voiceCommandSharedWithTracking = false;
let shouldAnnounceClickthroughStatus = false;
let lineMapRebuildFrame = null;
let cachedPromptViewportWidth = 0;
let cachedPromptViewportHeight = 0;
let cachedPromptScrollableHeight = 0;
let lastAppliedViewportTop = null;
let promptWaitCards = [];
let activePromptWaitCardId = "";
let promptWaitRunToken = 0;
let promptWaitAnimationCleanupTimer = null;
let lastResponsiveFontSize = 0;
let lastResponsiveViewportWidth = 0;
let lastResponsiveViewportHeight = 0;
let frozenReadingViewportWidth = 0;
let frozenReadingViewportHeight = 0;
let autoUpdateCheckTimer = null;
let isAutoUpdateChecking = false;
let isAutoUpdateInstalling = false;
let playbackArrowHoldDirection = 0;
let playbackArrowHoldMode = "";
let playbackArrowHoldFrame = null;
let playbackArrowHoldStartedAt = 0;
let playbackArrowHoldLastStepAt = 0;
const voiceModelStatusCache = new Map();
const voiceCaptureWorkletModulePromises = new WeakMap();
let promptFeedbackState = null;
let unlistenNativeVoiceEvents = null;
const voiceDebugState = {
  enabled: true,
  history: [],
  lastTrackingEvent: null,
  lastCommandEvent: null,
  lastEventAt: null
};

const VOICE_COMMAND_ACTION_DEDUPE_ACTIONS = new Set([
  "up",
  "down",
  "hide",
  "show",
  "minimize",
  "expand",
  "free-drag",
  "top-center"
]);

const VOICE_COMMAND_EXACT_SINGLE_TOKEN_ACTIONS = new Set([
  "hide",
  "show",
  "minimize",
  "expand",
  "exit"
]);

function mergeVoiceActionAliases(baseAliases, localizedAliases = {}) {
  return Object.fromEntries(
    Object.entries(baseAliases).map(([action, aliases]) => {
      const localized = Array.isArray(localizedAliases[action]) ? localizedAliases[action] : [];
      return [action, Array.from(new Set([...aliases, ...localized]))];
    })
  );
}

function createVoiceLanguageConfigs() {
  return {
    "en-US": {
      language: "en-US",
      wakeDisplay: "Hey Flow",
      greetings: ["hey", "hi"],
      wake: ["flow", "flo", "flor", "flown"],
      filler: [...BASE_VOICE_COMMAND_FILLER_TOKENS],
      actions: mergeVoiceActionAliases(BASE_VOICE_ACTION_ALIASES)
    },
    "tr-TR": {
      language: "tr-TR",
      wakeDisplay: "Selam Flow",
      greetings: ["hey", "selam", "merhaba"],
      wake: ["flow", "flo", "flov"],
      filler: [...BASE_VOICE_COMMAND_FILLER_TOKENS, "lütfen", "bir", "bu", "şimdi", "tamam"],
      actions: mergeVoiceActionAliases(BASE_VOICE_ACTION_ALIASES, {
        "open-about": ["hakkında", "flow hakkında", "bilgi"],
        "open-settings": ["ayarlar", "ayarları aç", "tercihler"],
        "open-input": ["metin editörü", "metin sayfası", "girdi", "editör"],
        "use-groq": ["groq kullan", "groq sor", "groq ile oluştur"],
        "next-theme": ["sonraki tema", "tema değiştir", "temayı değiştir"],
        "open-receiver": ["alıcıyı aç", "alıcı", "gelen kutusu", "uzak gelen kutusu"],
        "free-drag": ["serbest sürükle", "özgür sürükle", "serbest mod"],
        "top-center": ["üst orta", "üste ortala", "üst merkeze al"],
        "play": ["başlat", "oynat"],
        "hide": ["gizle", "sakla"],
        "show": ["göster", "açığa çıkar"],
        "minimize": ["küçült", "daralt"],
        "expand": ["genişlet", "geri aç", "eski boyut"],
        "exit": ["çık", "kapat"],
        "restart": ["yeniden başlat", "baştan başlat", "sıfırla"],
        "stop": ["durdur", "bitir"],
        "pause": ["duraklat", "bekle"],
        "continue": ["devam et", "sürdür"],
        "up": ["yukarı", "önceki", "geri"],
        "down": ["aşağı", "sonraki", "ileri"]
      })
    },
    "ar-SA": {
      language: "ar-SA",
      wakeDisplay: "مرحبا فلو",
      greetings: ["مرحبا", "اهلا", "يا", "هاي"],
      wake: ["فلو", "فلوو", "flow", "flo"],
      filler: [...BASE_VOICE_COMMAND_FILLER_TOKENS, "من", "إلى", "الآن", "من فضلك", "حسنا"],
      actions: mergeVoiceActionAliases(BASE_VOICE_ACTION_ALIASES, {
        "open-about": ["حول", "حول فلو", "معلومات"],
        "open-settings": ["الإعدادات", "افتح الإعدادات", "التفضيلات"],
        "open-input": ["محرر النص", "صفحة النص", "الإدخال", "المحرر"],
        "use-groq": ["استخدم groq", "اسأل groq", "أنشئ عبر groq"],
        "next-theme": ["السمة التالية", "غيّر السمة", "بدل السمة"],
        "open-receiver": ["افتح المستقبِل", "المستقبِل", "صندوق الوارد", "الوارد البعيد"],
        "free-drag": ["سحب حر", "حرّك بحرية"],
        "top-center": ["أعلى الوسط", "توسيط علوي"],
        "play": ["ابدأ", "شغّل"],
        "hide": ["أخف", "اخفاء"],
        "show": ["أظهر", "اظهر"],
        "minimize": ["صغّر", "قلّص"],
        "expand": ["وسّع", "استعد الحجم"],
        "exit": ["اخرج", "اغلق", "إنهاء"],
        "restart": ["أعد التشغيل", "ابدأ من جديد", "إعادة ضبط"],
        "stop": ["توقف", "انه"],
        "pause": ["أوقف مؤقتا", "انتظر"],
        "continue": ["تابع", "استأنف"],
        "up": ["أعلى", "السابق", "ارجع"],
        "down": ["أسفل", "التالي", "تقدم"]
      })
    },
    "de-DE": {
      language: "de-DE",
      wakeDisplay: "Hallo Flow",
      greetings: ["hey", "hallo", "hi"],
      wake: ["flow", "flo", "flou"],
      filler: [...BASE_VOICE_COMMAND_FILLER_TOKENS, "bitte", "jetzt", "okay", "mal"],
      actions: mergeVoiceActionAliases(BASE_VOICE_ACTION_ALIASES, {
        "open-about": ["über", "über flow", "info"],
        "open-settings": ["einstellungen", "einstellung", "öffne einstellungen"],
        "open-input": ["texteditor", "textseite", "eingabe", "editor"],
        "use-groq": ["nutze groq", "frage groq", "mit groq erzeugen"],
        "next-theme": ["nächstes thema", "thema wechseln", "thema ändern"],
        "open-receiver": ["empfänger öffnen", "empfänger", "posteingang", "remote posteingang"],
        "free-drag": ["frei ziehen", "freies ziehen", "freier modus"],
        "top-center": ["oben mitte", "oben zentriert"],
        "play": ["start", "abspielen"],
        "hide": ["verstecken", "ausblenden"],
        "show": ["zeigen", "einblenden"],
        "minimize": ["minimieren", "verkleinern"],
        "expand": ["erweitern", "wiederherstellen"],
        "exit": ["beenden", "schließen"],
        "restart": ["neu starten", "zurücksetzen", "von vorn"],
        "stop": ["stopp", "anhalten"],
        "pause": ["pause", "warte"],
        "continue": ["weiter", "fortsetzen"],
        "up": ["hoch", "zurück", "vorherige"],
        "down": ["runter", "weiter", "nächste"]
      })
    },
    "fr-FR": {
      language: "fr-FR",
      wakeDisplay: "Salut Flow",
      greetings: ["salut", "bonjour", "hey"],
      wake: ["flow", "flo", "flot"],
      filler: [...BASE_VOICE_COMMAND_FILLER_TOKENS, "s'il", "te", "plaît", "maintenant", "ok"],
      actions: mergeVoiceActionAliases(BASE_VOICE_ACTION_ALIASES, {
        "open-about": ["à propos", "à propos de flow", "infos"],
        "open-settings": ["paramètres", "ouvrir paramètres", "préférences"],
        "open-input": ["éditeur de texte", "page texte", "entrée", "éditeur"],
        "use-groq": ["utilise groq", "demande groq", "génère avec groq"],
        "next-theme": ["thème suivant", "changer thème", "theme suivant"],
        "open-receiver": ["ouvrir récepteur", "récepteur", "boîte de réception", "boite de réception"],
        "free-drag": ["glisser librement", "déplacement libre", "drag libre"],
        "top-center": ["haut centre", "centre en haut"],
        "play": ["lecture", "démarrer", "jouer"],
        "hide": ["masquer", "cache"],
        "show": ["afficher", "montre"],
        "minimize": ["réduire", "minimiser"],
        "expand": ["agrandir", "restaurer"],
        "exit": ["quitter", "fermer"],
        "restart": ["redémarrer", "recommencer", "réinitialiser"],
        "stop": ["arrête", "stop"],
        "pause": ["pause", "attends"],
        "continue": ["continuer", "reprendre"],
        "up": ["haut", "précédent", "retour"],
        "down": ["bas", "suivant", "avance"]
      })
    },
    "es-ES": {
      language: "es-ES",
      wakeDisplay: "Hola Flow",
      greetings: ["hola", "hey", "oye"],
      wake: ["flow", "flo", "flou"],
      filler: [...BASE_VOICE_COMMAND_FILLER_TOKENS, "por", "favor", "ahora", "vale", "ok"],
      actions: mergeVoiceActionAliases(BASE_VOICE_ACTION_ALIASES, {
        "open-about": ["acerca de", "sobre flow", "información"],
        "open-settings": ["ajustes", "configuración", "abrir ajustes"],
        "open-input": ["editor de texto", "página de texto", "entrada", "editor"],
        "use-groq": ["usar groq", "pregunta a groq", "genera con groq"],
        "next-theme": ["siguiente tema", "cambiar tema"],
        "open-receiver": ["abrir receptor", "receptor", "bandeja", "bandeja remota"],
        "free-drag": ["arrastre libre", "mover libremente"],
        "top-center": ["arriba centro", "centro superior"],
        "play": ["reproducir", "iniciar", "empezar"],
        "hide": ["ocultar", "esconder"],
        "show": ["mostrar", "enseñar"],
        "minimize": ["minimizar", "reducir"],
        "expand": ["expandir", "restaurar"],
        "exit": ["salir", "cerrar"],
        "restart": ["reiniciar", "empezar de nuevo", "restablecer"],
        "stop": ["detener", "para"],
        "pause": ["pausa", "espera"],
        "continue": ["continuar", "reanudar"],
        "up": ["arriba", "anterior", "atrás"],
        "down": ["abajo", "siguiente", "adelante"]
      })
    }
  };
}

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

function armVoiceCommandListener(durationMs = VOICE_COMMAND_IDLE_ARM_MS) {
  if (!state.appearance?.appWideVoiceCommands) {
    return;
  }

  voiceCommandArmedUntil = performance.now() + Math.max(durationMs, 0);
}

function disarmVoiceCommandListener() {
  voiceCommandArmedUntil = 0;
}

function isVoiceCommandListenerArmed() {
  return performance.now() < voiceCommandArmedUntil;
}

function clampSoundInputNumber(value, min, max, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return clamp(numericValue, min, max);
}

function normalizeSoundInputDeviceId(value) {
  const normalizedValue = String(value || "").trim();
  return normalizedValue || defaultState.appearance.soundInputDeviceId;
}

function normalizeSoundInputDeviceLabel(value) {
  return String(value || "").trim();
}

function getSoundInputSettings(appearance = state.appearance) {
  const source = appearance || defaultState.appearance;
  return {
    deviceId: normalizeSoundInputDeviceId(source.soundInputDeviceId || defaultState.appearance.soundInputDeviceId),
    deviceLabel: normalizeSoundInputDeviceLabel(source.soundInputDeviceLabel || defaultState.appearance.soundInputDeviceLabel),
    noiseGate: clampSoundInputNumber(source.soundInputNoiseGate, 0, 0.08, defaultState.appearance.soundInputNoiseGate),
    inputGain: clampSoundInputNumber(source.soundInputGain, 0.5, 4, defaultState.appearance.soundInputGain)
  };
}

function getVoiceCaptureSettingsSignature(appearance = state.appearance) {
  return JSON.stringify(getSoundInputSettings(appearance));
}

function cloneVoiceDebugValue(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function sanitizeVoiceDebugWords(words) {
  if (!Array.isArray(words) || !words.length) {
    return [];
  }

  return words.map((word) => ({
    word: String(word?.word || "").trim(),
    start: Number.isFinite(word?.start) ? word.start : null,
    end: Number.isFinite(word?.end) ? word.end : null,
    confidence: Number.isFinite(word?.confidence) ? word.confidence : null
  }));
}

function buildVoiceDebugEntry(payload) {
  const debug = payload?.debug || null;
  return {
    at: new Date().toISOString(),
    channel: String(payload?.channel || ""),
    stage: String(payload?.stage || ""),
    language: String(payload?.language || ""),
    text: typeof payload?.text === "string" ? payload.text : null,
    rawText: typeof debug?.rawText === "string" ? debug.rawText : null,
    confidence: Number.isFinite(payload?.confidence) ? payload.confidence : null,
    wordCount: Number.isFinite(debug?.wordCount) ? debug.wordCount : sanitizeVoiceDebugWords(payload?.words).length,
    sampleCount: Number.isFinite(debug?.sampleCount) ? debug.sampleCount : null,
    words: sanitizeVoiceDebugWords(payload?.words),
    error: typeof payload?.error === "string" ? payload.error : null
  };
}

function recordVoiceDebugEvent(payload) {
  if (!voiceDebugState.enabled || !payload?.channel || !payload?.stage) {
    return;
  }

  const entry = buildVoiceDebugEntry(payload);
  voiceDebugState.history.push(entry);
  if (voiceDebugState.history.length > VOICE_DEBUG_HISTORY_LIMIT) {
    voiceDebugState.history.splice(0, voiceDebugState.history.length - VOICE_DEBUG_HISTORY_LIMIT);
  }

  voiceDebugState.lastEventAt = entry.at;
  if (entry.channel === "tracking") {
    voiceDebugState.lastTrackingEvent = entry;
  } else if (entry.channel === "commands") {
    voiceDebugState.lastCommandEvent = entry;
  }
}

function getVoiceDebugSnapshot() {
  return cloneVoiceDebugValue({
    enabled: voiceDebugState.enabled,
    lastEventAt: voiceDebugState.lastEventAt,
    listenerAttached: Boolean(unlistenNativeVoiceEvents),
    voiceRecognitionEngine: voiceRecognition?.engine || null,
    isVoiceTrackingStarting,
    activeVoiceTrackingLanguageTag,
    isPlaying,
    lastTrackingEvent: voiceDebugState.lastTrackingEvent,
    lastCommandEvent: voiceDebugState.lastCommandEvent,
    history: voiceDebugState.history
  });
}

function installVoiceDebugTools() {
  window.__flowVoiceDebug = {
    enable() {
      voiceDebugState.enabled = true;
      return getVoiceDebugSnapshot();
    },
    disable() {
      voiceDebugState.enabled = false;
      return getVoiceDebugSnapshot();
    },
    clear() {
      voiceDebugState.history = [];
      voiceDebugState.lastTrackingEvent = null;
      voiceDebugState.lastCommandEvent = null;
      voiceDebugState.lastEventAt = null;
      return getVoiceDebugSnapshot();
    },
    getState() {
      return getVoiceDebugSnapshot();
    },
    async getEngineState() {
      if (!invoke) {
        return null;
      }

      return await invoke("get_voice_engine_debug_state");
    },
    printRecent(limit = 12, channel = null) {
      const safeLimit = Math.max(1, Number(limit) || 12);
      const filtered = channel
        ? voiceDebugState.history.filter((entry) => entry.channel === channel)
        : voiceDebugState.history;
      const recent = filtered.slice(-safeLimit);
      console.table(recent.map((entry) => ({
        at: entry.at,
        channel: entry.channel,
        stage: entry.stage,
        text: entry.text,
        rawText: entry.rawText,
        wordCount: entry.wordCount,
        sampleCount: entry.sampleCount,
        confidence: entry.confidence,
        error: entry.error
      })));
      return cloneVoiceDebugValue(recent);
    }
  };
}

installVoiceDebugTools();

function buildNativeVoicePayload(languageTag = getVoiceLanguageTag(), options = {}) {
  const soundInput = getSoundInputSettings();
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

  recordVoiceDebugEvent(payload);

  if (payload.channel === "commands") {
    if (payload.stage === "partial") {
      lastVoiceCommandAudioProcessAt = performance.now();
      handleOfflineVoiceCommandTranscript(payload.text, {
        isFinal: false,
        confidence: payload.confidence ?? 1,
        wakeConfidence: payload.confidence ?? 1
      });
      return;
    }

    if (payload.stage === "final") {
      lastVoiceCommandAudioProcessAt = performance.now();
      handleOfflineVoiceCommandTranscript(payload.text, {
        isFinal: true,
        confidence: payload.confidence ?? 0,
        wakeConfidence: payload.confidence ?? 0
      });
      return;
    }

    if (payload.stage === "error") {
      lastVoiceCommandError = getVoiceCommandErrorMessage(payload.error || "Voice commands unavailable");
      isVoiceCommandRecognitionBlocked = true;
      voiceCommandRecognition = null;
      voiceCommandSharedWithTracking = Boolean(voiceRecognition);
      updateVoiceCommandIndicator();
      return;
    }

    if (payload.stage === "stopped" && !isVoiceCommandRecognitionStarting) {
      voiceCommandRecognition = null;
      voiceCommandSharedWithTracking = false;
      updateVoiceCommandIndicator();
    }

    return;
  }

  if (payload.channel === "tracking") {
    if (payload.stage === "started") {
      lastVoiceTrackingAudioProcessAt = performance.now();
      if (isPlaying && getActiveMode() === "voice" && ui.statusLabel) {
        ui.statusLabel.textContent = "🎤 Listening...";
      }
      return;
    }

    if (payload.stage === "partial") {
      lastVoiceTrackingAudioProcessAt = performance.now();
      if (applyVoiceTrackingWordHints(payload.words, { confidence: payload.confidence ?? 0 })) {
        return;
      }
      applyVoiceTrackingTranscript(payload.text, { isFinal: false, confidence: payload.confidence ?? 0 });
      return;
    }

    if (payload.stage === "final") {
      lastVoiceTrackingAudioProcessAt = performance.now();
      applyVoiceTrackingTranscript(payload.text, { isFinal: true, confidence: payload.confidence ?? 0 });
      return;
    }

    if (payload.stage === "stopped") {
      lastVoiceTrackingAudioProcessAt = 0;
      lastVoiceTrackingPartialHandledAt = 0;
      lastVoiceTrackingPartialKey = "";
      clearPendingForwardVoiceSkip();
      if (voiceRecognition?.engine === "native") {
        voiceRecognition = null;
      }
      if (!isPlaying || getActiveMode() !== "voice") {
        activeVoiceTrackingLanguageTag = null;
      }
      return;
    }

    if (payload.stage === "error") {
      console.error("Native voice tracking failed", payload.error || payload);
      if (isPlaying && getActiveMode() === "voice") {
        if (ui.statusLabel) {
          ui.statusLabel.textContent = getVoiceTrackingFailureStatus(new Error(payload.error || "Voice tracking unavailable"));
        }
        stopPlayback();
      } else if (voiceRecognition?.engine === "native") {
        voiceRecognition = null;
        activeVoiceTrackingLanguageTag = null;
        lastVoiceTrackingAudioProcessAt = 0;
        lastVoiceTrackingPartialHandledAt = 0;
        lastVoiceTrackingPartialKey = "";
        clearPendingForwardVoiceSkip();
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

function buildVoiceCaptureAudioConstraints(soundInputSettings = getSoundInputSettings()) {
  const constraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: false,
    channelCount: 1
  };

  if (soundInputSettings.deviceId !== defaultState.appearance.soundInputDeviceId) {
    constraints.deviceId = { exact: soundInputSettings.deviceId };
  }

  return constraints;
}

function createVoiceCaptureError(code, message, cause = null) {
  const error = new Error(message);
  error.name = "VoiceCaptureError";
  error.code = code;
  if (cause) {
    error.cause = cause;
  }
  return error;
}

function stopMediaStreamTracks(mediaStream) {
  mediaStream?.getTracks?.().forEach((track) => {
    track.enabled = false;
    track.stop();
  });
}

function normalizeVoiceCaptureError(error) {
  if (error?.code === VOICE_CAPTURE_ERROR_PERMISSION_DENIED
    || error?.code === VOICE_CAPTURE_ERROR_NO_DEVICE
    || error?.code === VOICE_CAPTURE_ERROR_UNAVAILABLE) {
    return error;
  }

  const message = String(error?.message || error || "").trim();
  const name = String(error?.name || "").trim();

  if (/NotAllowedError|SecurityError/i.test(name) || /permission|denied|notallowed/i.test(message)) {
    return createVoiceCaptureError(VOICE_CAPTURE_ERROR_PERMISSION_DENIED, "Microphone permission denied", error);
  }

  if (/NotFoundError|DevicesNotFoundError/i.test(name) || /no microphone|requested device not found/i.test(message)) {
    return createVoiceCaptureError(VOICE_CAPTURE_ERROR_NO_DEVICE, "No microphone detected", error);
  }

  if (/NotReadableError|TrackStartError|AbortError|OverconstrainedError/i.test(name)) {
    return createVoiceCaptureError(VOICE_CAPTURE_ERROR_UNAVAILABLE, "Microphone unavailable", error);
  }

  return createVoiceCaptureError(VOICE_CAPTURE_ERROR_UNAVAILABLE, message || "Microphone unavailable", error);
}

function processVoiceCaptureSamples(samples, soundInputSettings = getSoundInputSettings()) {
  if (!samples?.length) {
    return samples;
  }

  const inputGain = clampSoundInputNumber(soundInputSettings.inputGain, 0.5, 4, 1);
  const noiseGate = clampSoundInputNumber(soundInputSettings.noiseGate, 0, 0.08, 0);
  let sumSquares = 0;
  let peak = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index] * inputGain;
    sumSquares += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
  }

  const rmsLevel = Math.sqrt(sumSquares / samples.length);
  const limiterScale = peak > 0.985 ? 0.985 / peak : 1;
  const gateScale = noiseGate > 0 && rmsLevel < noiseGate
    ? Math.max(rmsLevel / Math.max(noiseGate, 0.0001), 0.18)
    : 1;
  const finalScale = inputGain * limiterScale * gateScale;

  if (Math.abs(finalScale - 1) < 0.001) {
    return samples;
  }

  const processedSamples = new Float32Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    processedSamples[index] = clamp(samples[index] * finalScale, -1, 1);
  }

  return processedSamples;
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

function getActiveVoiceConfig(languageTag = getVoiceLanguageTag()) {
  return VOICE_LANGUAGE_CONFIGS[normalizeVoiceLanguage(languageTag)] || VOICE_LANGUAGE_CONFIGS["en-US"];
}

function getVoiceActionEntries(languageTag = getVoiceCommandLanguageTag()) {
  return Object.entries(getActiveVoiceConfig(languageTag).actions);
}

function getVoiceWakePhrase(languageTag = getVoiceCommandLanguageTag()) {
  return getActiveVoiceConfig(languageTag).wakeDisplay;
}

function getVoiceCommandFillerTokens(languageTag = getVoiceCommandLanguageTag()) {
  return new Set(getActiveVoiceConfig(languageTag).filler);
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

function normalizeRemoteCloudUrl(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

const CONFIGURED_CLOUD_RELAY_URL = normalizeRemoteCloudUrl(CLOUD_RELAY_URL);

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

function rotateRemoteAccessPasswordForLaunch() {
  const nextAccessPassword = generateRemoteAccessPassword();
  const mergedState = saveState({
    remote: {
      ...state.remote,
      accessPassword: nextAccessPassword
    }
  });
  Object.assign(state, mergedState);
}

function t(key, params = {}) {
  return translate(key, state.language, params);
}

function getAutoUpdaterAvailable() {
  return !isMicrosoftStoreBuild && Boolean(invoke && tauriCore?.Channel);
}

async function resolveMicrosoftStoreBuild() {
  if (typeof isMicrosoftStoreBuild === "boolean") {
    return isMicrosoftStoreBuild;
  }

  if (!invoke) {
    isMicrosoftStoreBuild = false;
    return isMicrosoftStoreBuild;
  }

  if (microsoftStoreBuildPromise) {
    return microsoftStoreBuildPromise;
  }

  microsoftStoreBuildPromise = invoke("get_distribution_channel")
    .then((channel) => {
      isMicrosoftStoreBuild = String(channel || "").trim().toLowerCase() === "store";
      return isMicrosoftStoreBuild;
    })
    .catch((error) => {
      console.error("Failed to resolve distribution channel", error);
      isMicrosoftStoreBuild = false;
      return isMicrosoftStoreBuild;
    })
    .finally(() => {
      microsoftStoreBuildPromise = null;
    });

  return microsoftStoreBuildPromise;
}

function setAutoUpdaterStatus(key, params = {}) {
  if (!ui.statusLabel) {
    return;
  }

  ui.statusLabel.textContent = t(key, params);
}

function handleAutomaticUpdateDownloadEvent(version, event) {
  if (!event?.event || !ui.statusLabel) {
    return;
  }

  if (event.event === "Started") {
    handleAutomaticUpdateDownloadEvent.totalBytes = Math.max(Number(event.data?.contentLength) || 0, 0);
    handleAutomaticUpdateDownloadEvent.downloadedBytes = 0;
    setAutoUpdaterStatus("tele.updaterInstalling", { version });
    return;
  }

  if (event.event === "Progress") {
    const totalBytes = handleAutomaticUpdateDownloadEvent.totalBytes || 0;
    const chunkLength = Math.max(Number(event.data?.chunkLength) || 0, 0);
    handleAutomaticUpdateDownloadEvent.downloadedBytes = (handleAutomaticUpdateDownloadEvent.downloadedBytes || 0) + chunkLength;
    const percent = totalBytes > 0
      ? Math.min(Math.round((handleAutomaticUpdateDownloadEvent.downloadedBytes / totalBytes) * 100), 100)
      : 0;
    setAutoUpdaterStatus("tele.updaterDownloading", { version, progress: percent });
    return;
  }

  if (event.event === "Finished") {
    setAutoUpdaterStatus("tele.updaterInstalling", { version });
  }
}

async function runAutomaticUpdateCheck(options = {}) {
  const { announceNoUpdate = false, announceErrors = false } = options;

  if (!getAutoUpdaterAvailable() || isAutoUpdateChecking || isAutoUpdateInstalling) {
    return null;
  }

  isAutoUpdateChecking = true;
  handleAutomaticUpdateDownloadEvent.downloadedBytes = 0;

  try {
    const metadata = await invoke("plugin:updater|check", {
      allowDowngrades: false
    });

    if (!metadata) {
      if (announceNoUpdate) {
        setAutoUpdaterStatus("tele.updaterCurrent");
      }
      return null;
    }

    isAutoUpdateInstalling = true;
    setAutoUpdaterStatus("tele.updaterInstalling", { version: metadata.version || (await tauriApp?.getVersion?.().catch(() => "")) || "" });

    const channel = new tauriCore.Channel();
    channel.onmessage = (event) => {
      handleAutomaticUpdateDownloadEvent(metadata.version, event);
    };

    await invoke("plugin:updater|download_and_install", {
      rid: metadata.rid,
      onEvent: channel
    });

    return metadata;
  } catch (error) {
    console.error("Automatic updater failed", error);
    if (announceErrors) {
      setAutoUpdaterStatus("tele.updaterFailed", { error: error?.message || String(error) });
    }
    return null;
  } finally {
    isAutoUpdateChecking = false;
    isAutoUpdateInstalling = false;
  }
}

function startAutomaticUpdater() {
  runAutomaticUpdateCheck().catch(console.error);

  if (autoUpdateCheckTimer) {
    clearInterval(autoUpdateCheckTimer);
  }

  autoUpdateCheckTimer = window.setInterval(() => {
    runAutomaticUpdateCheck().catch(console.error);
  }, AUTO_UPDATE_CHECK_INTERVAL_MS);
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
  ui.floatingStopButton = document.querySelector("#floatingStopButton");
  ui.remoteInbox = document.querySelector("#remoteInbox");
  ui.inputButton = document.querySelector("#inputButton");
  ui.settingsButton = document.querySelector("#settingsButton");
  ui.closeAppButton = document.querySelector("#closeAppButton");
  ui.collapseButton = document.querySelector("#collapseButton");
  ui.pinButton = document.querySelector("#pinButton");
  ui.dragOverlay = document.querySelector("#dragOverlay");
  ui.voiceCommandIndicator = document.querySelector("#voiceCommandIndicator");
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


function isFreeDragMode() {
  return state.window?.preset === "drag";
}

function isWindowPinned() {
  return state.window?.isPinned !== false;
}

function updateDragControls() {
  const isFreeDrag = isFreeDragMode();
  const isPinned = isWindowPinned();
  const pinLabel = isPinned ? t("common.unpinWindow") : t("common.pinWindow");
  const shouldShowPin = isFreeDrag && !isCollapsed;

  if (ui.pinButton) {
    ui.pinButton.classList.toggle("hidden", !shouldShowPin);
    setButtonIcon(ui.pinButton, isPinned ? "ph-push-pin" : "ph-map-pin");
    ui.pinButton.title = pinLabel;
    ui.pinButton.setAttribute("aria-label", pinLabel);
  }

  if (ui.dragOverlay) {
    const shouldShowOverlay = isFreeDrag && !isPinned;
    ui.dragOverlay.classList.toggle("hidden", !shouldShowOverlay);
    ui.dragOverlay.setAttribute("aria-hidden", shouldShowOverlay ? "false" : "true");
  }
}

async function captureCurrentWindowState() {
  if (!tauriWindow?.getCurrentWindow) {
    return null;
  }

  const appWindow = tauriWindow.getCurrentWindow();
  const [position, size, scaleFactorValue] = await Promise.all([
    appWindow.outerPosition?.().catch?.(() => null) ?? null,
    appWindow.outerSize?.().catch?.(() => null) ?? null,
    appWindow.scaleFactor?.().catch?.(() => 1) ?? 1
  ]);

  const scaleFactor = normalizeScaleFactor(scaleFactorValue);
  const logicalSize = physicalSizeToLogical(size, scaleFactor);
  const gutterWidth = getSpeedRailWindowGutter();
  const gutterWidthPhysical = logicalValueToPhysical(gutterWidth, scaleFactor);
  const topCenterOffsetPhysical = logicalValueToPhysical(TOP_CENTER_X_OFFSET, scaleFactor);
  const positionOffset = state.window?.preset === "top-center"
    ? topCenterOffsetPhysical - gutterWidthPhysical
    : -gutterWidthPhysical;
  const windowIsCollapsed = Number(logicalSize?.height) > 0 && Number(logicalSize.height) <= COLLAPSED_HEIGHT + 8;

  return {
    x: position ? position.x - positionOffset : state.window?.x ?? null,
    y: position?.y ?? state.window?.y ?? null,
    width: size ? Math.max(logicalSize.width - gutterWidth, MIN_WIDTH) : state.window?.width ?? defaultState.window.width,
    height: windowIsCollapsed
      ? state.window?.height ?? defaultState.window.height
      : (logicalSize?.height ?? state.window?.height ?? defaultState.window.height)
  };
}

async function setWindowPinned(nextPinned, options = {}) {
  if (!isFreeDragMode()) {
    updateDragControls();
    return;
  }

  const { announce = true } = options;
  const currentWindowState = await captureCurrentWindowState();
  const mergedState = saveState({
    window: {
      ...state.window,
      ...(currentWindowState || {}),
      isPinned: nextPinned
    }
  });
  Object.assign(state, mergedState);
  updateDragControls();

  if (announce && ui.statusLabel) {
    ui.statusLabel.textContent = nextPinned ? t("tele.pinned") : t("tele.unpinned");
  }
}

async function toggleDragOverlay() {
  await setWindowPinned(!isWindowPinned());
}

async function setWindowPreset(preset, options = {}) {
  const currentWindowState = await captureCurrentWindowState();
  const nextPinned = options.isPinned ?? (preset === "drag" ? false : true);
  const mergedState = saveState({
    window: {
      ...state.window,
      ...(currentWindowState || {}),
      preset,
      isPinned: nextPinned
    }
  });

  Object.assign(state, mergedState);
  updateDragControls();
  await applyStoredWindowSettings().catch(console.error);
}

function words() {
  return splitWords(state.script);
}

function updateSpeedLabel() {
  ui.speedLabel.value = String(state.speed);
  ui.speedLabel.title = `${state.speed} ${t("common.wpm")}`;
  if (ui.speedRailValue) {
    ui.speedRailValue.textContent = String(state.speed);
  }
  if (ui.speedRailSlider) {
    ui.speedRailSlider.value = String(state.speed);
    syncSliderProgress(ui.speedRailSlider);
    ui.speedRailSlider.title = `${state.speed} ${t("common.wpm")}`;
  }
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

function shouldShowSpeedRail() {
  const activeMode = getActiveMode();

  return Boolean(ui.speedRail)
    && state.appearance?.speedRailEnabled !== false
    && !["voice", "arrow"].includes(activeMode)
    && isPlaying
    && !isPaused
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

function getTargetWindowWidth() {
  return getBaseWindowWidth() + getSpeedRailWindowGutter();
}

function getWindowPositionOffset(gutterWidth = getSpeedRailWindowGutter()) {
  return state.window?.preset === "top-center" ? TOP_CENTER_X_OFFSET - gutterWidth : -gutterWidth;
}

function setSpeedRailGutter(value) {
  const normalizedGutter = Math.max(0, Math.min(SPEED_RAIL_WINDOW_GUTTER, Number(value) || 0));
  document.documentElement.style.setProperty("--speed-rail-gutter-current", `${normalizedGutter}px`);
}

async function getPreferredMonitor() {
  if (!tauriWindow?.currentMonitor || !tauriWindow?.primaryMonitor) {
    return null;
  }

  return (await tauriWindow.currentMonitor()) ?? (await tauriWindow.primaryMonitor());
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

function logicalSizeToPhysical(size, scaleFactor) {
  const width = Number(size?.width || 0);
  const height = Number(size?.height || 0);

  if (tauriDpi?.LogicalSize) {
    return new tauriDpi.LogicalSize(width, height).toPhysical(scaleFactor);
  }

  return {
    width: Math.round(width * scaleFactor),
    height: Math.round(height * scaleFactor)
  };
}

function logicalValueToPhysical(value, scaleFactor) {
  return Math.round((Number(value) || 0) * scaleFactor);
}

function getMonitorLogicalSize(monitor) {
  return physicalSizeToLogical(monitor?.size, normalizeScaleFactor(monitor?.scaleFactor));
}

function clampWindowPositionToMonitor(x, y, monitor, width, height) {
  if (!monitor) {
    return { x, y };
  }

  const minX = monitor.position.x;
  const minY = monitor.position.y;
  const maxX = monitor.position.x + Math.max(monitor.size.width - width, 0);
  const maxY = monitor.position.y + Math.max(monitor.size.height - height, 0);

  return {
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, maxY)
  };
}

function usesMonitorRelativeWindowPreset() {
  return state.window?.preset === "center" || state.window?.preset === "top-center";
}

async function getSafeWindowGeometry(requestedHeight = state.window.height, requestedGutter = getSpeedRailWindowGutter()) {
  const monitor = await getPreferredMonitor();
  const logicalMonitorSize = getMonitorLogicalSize(monitor);
  const gutterWidth = Math.max(0, Math.min(SPEED_RAIL_WINDOW_GUTTER, Number(requestedGutter) || 0));
  const requestedWindowHeight = Number(requestedHeight) || defaultState.window.height;
  const minAllowedHeight = requestedWindowHeight <= COLLAPSED_HEIGHT ? COLLAPSED_HEIGHT : MIN_HEIGHT;
  const maxContentWidth = Math.max(
    Math.min((logicalMonitorSize.width || MAX_WIDTH_FALLBACK) - gutterWidth, MAX_WIDTH_FALLBACK - gutterWidth),
    MIN_WIDTH
  );
  const maxHeight = Math.max(
    Math.min(logicalMonitorSize.height || MAX_HEIGHT_FALLBACK, MAX_HEIGHT_FALLBACK),
    minAllowedHeight
  );

  return {
    monitor,
    gutterWidth,
    width: clamp(getBaseWindowWidth(), MIN_WIDTH, maxContentWidth),
    height: clamp(requestedWindowHeight, minAllowedHeight, maxHeight),
    maxHeight
  };
}

async function positionWindowForCurrentLayout(appWindow, options = {}) {
  const gutterWidth = options.gutterWidth ?? getSpeedRailWindowGutter();
  const targetWidth = Math.max(options.width ?? getBaseWindowWidth(), MIN_WIDTH) + gutterWidth;
  const targetHeight = Math.max(options.height ?? state.window.height ?? defaultState.window.height, MIN_HEIGHT);
  const monitor = options.monitor ?? await getPreferredMonitor();
  const scaleFactor = normalizeScaleFactor(await appWindow?.scaleFactor?.().catch(() => monitor?.scaleFactor ?? 1));
  const targetPhysicalSize = logicalSizeToPhysical({ width: targetWidth, height: targetHeight }, scaleFactor);
  const gutterWidthPhysical = logicalValueToPhysical(gutterWidth, scaleFactor);
  const topCenterOffsetPhysical = logicalValueToPhysical(TOP_CENTER_X_OFFSET, scaleFactor);

  if (state.window.preset === "center") {
    if (monitor) {
      const x = monitor.position.x + Math.round((monitor.size.width - targetPhysicalSize.width) / 2);
      const y = monitor.position.y + Math.round((monitor.size.height - targetPhysicalSize.height) / 2);
      await appWindow.setPosition(new tauriDpi.PhysicalPosition(x, y));
      return true;
    }

    return false;
  }

  if (state.window.preset === "top-center") {
    if (monitor) {
      const x = monitor.position.x + Math.round((monitor.size.width - targetPhysicalSize.width) / 2) + topCenterOffsetPhysical;
      await appWindow.setPosition(new tauriDpi.PhysicalPosition(x, monitor.position.y));
      return true;
    }

    return false;
  }

  if (state.window.x !== null && state.window.y !== null && tauriDpi.PhysicalPosition) {
    const clampedPosition = clampWindowPositionToMonitor(
      state.window.x + (state.window?.preset === "top-center" ? topCenterOffsetPhysical - gutterWidthPhysical : -gutterWidthPhysical),
      state.window.y,
      monitor,
      targetPhysicalSize.width,
      targetPhysicalSize.height
    );

    await appWindow.setPosition(new tauriDpi.PhysicalPosition(clampedPosition.x, clampedPosition.y));
    return true;
  }

  return false;
}

async function applyWindowGeometry(appWindow, gutterWidth = getSpeedRailWindowGutter(), height = state.window.height) {
  if (!tauriDpi?.LogicalSize) {
    return;
  }

  const geometry = await getSafeWindowGeometry(height, gutterWidth);
  await appWindow.setSize(new tauriDpi.LogicalSize(geometry.width + geometry.gutterWidth, geometry.height)).catch(console.error);
  await positionWindowForCurrentLayout(appWindow, geometry).catch(console.error);
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

async function applyDesktopPreferences() {
  if (!invoke) {
    return;
  }

  await invoke("set_capture_protection", { enabled: Boolean(state.desktop?.hideFromCapture) }).catch(console.error);
  await invoke("set_system_tray_enabled", { enabled: Boolean(state.desktop?.useSystemTray) }).catch(console.error);
  await invoke("set_prevent_sleep", { enabled: Boolean(state.desktop?.preventSleep) }).catch(console.error);
  await invoke("set_clickthrough_shortcut_enabled", { enabled: Boolean(state.desktop?.clickthroughShortcutEnabled) }).catch(console.error);
  await invoke("set_main_clickthrough", { enabled: false }).catch(console.error);
}

async function bindDesktopEventListeners() {
  if (!tauriEvent?.listen) {
    return;
  }

  unlistenClickthroughChanged = await tauriEvent.listen("flow-clickthrough-changed", (event) => {
    if (!shouldAnnounceClickthroughStatus) {
      return;
    }

    shouldAnnounceClickthroughStatus = false;
    const enabled = Boolean(event.payload);
    if (ui.statusLabel) {
      ui.statusLabel.textContent = enabled ? t("tele.clickthroughEnabled") : t("tele.clickthroughDisabled");
    }
  });
}

function restartPlaybackLoopForCurrentMode() {
  if (!isPlaying || isPaused) {
    updatePlaybackIndicators(true);
    return;
  }

  clearPlayback();
  const activeMode = getActiveMode();

  if (activeMode === "scroll") {
    playScrollMode();
  } else if (activeMode === "arrow") {
    beginArrowMode();
  } else if (activeMode === "voice") {
    playVoiceMode();
  } else {
    playTimedStep();
  }

  updatePlaybackIndicators(true);
}

function flushPendingSpeedPersist() {
  if (speedPersistTimer) {
    clearTimeout(speedPersistTimer);
    speedPersistTimer = null;
  }

  saveState({ speed: state.speed });
}

function scheduleSpeedPersist() {
  if (speedPersistTimer) {
    clearTimeout(speedPersistTimer);
  }

  speedPersistTimer = window.setTimeout(() => {
    speedPersistTimer = null;
    saveState({ speed: state.speed });
  }, 140);
}

function setSpeedValue(nextSpeed, options = {}) {
  const normalizedSpeed = clamp(Number(nextSpeed) || state.speed, 1, 500);
  if (normalizedSpeed === state.speed) {
    updateSpeedLabel();
    return;
  }

  state.speed = normalizedSpeed;
  updateSpeedLabel();

  if (options.persistImmediately) {
    flushPendingSpeedPersist();
  } else {
    scheduleSpeedPersist();
  }

  if (!isPlaying || isPaused) {
    updatePlaybackIndicators(true);
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
  const total = wordNodes.length;
  const current = total === 0 ? 0 : Math.min(currentIndex + 1, total);
  const nextProgressLabelText = t("tele.progress", { current, total });
  const nextStatusLabelText = getPlaybackLabel();

  if (ui.progressLabel.textContent !== nextProgressLabelText) {
    ui.progressLabel.textContent = nextProgressLabelText;
  }

  if (ui.statusLabel.textContent !== nextStatusLabelText) {
    ui.statusLabel.textContent = nextStatusLabelText;
  }

  updateFloatingPlaybackMeta();
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
  const controlHeight = ui.floatingControls?.offsetHeight || 0;
  const safeBottom = document.body.classList.contains("reading-mode") && controlHeight > 0
    ? controlHeight + 28
    : 0;

  document.documentElement.style.setProperty("--teleprompter-reading-safe-bottom", `${safeBottom}px`);
}

function refreshPromptViewportMetrics() {
  if (!ui.promptViewport) {
    cachedPromptViewportWidth = 0;
    cachedPromptViewportHeight = 0;
    cachedPromptScrollableHeight = 0;
    return 0;
  }

  updatePromptSafeArea();
  cachedPromptViewportWidth = ui.promptViewport.clientWidth;
  cachedPromptViewportHeight = ui.promptViewport.clientHeight;
  cachedPromptScrollableHeight = Math.max(ui.promptViewport.scrollHeight - cachedPromptViewportHeight, 0);
  return cachedPromptScrollableHeight;
}

function syncPromptLayout() {
  refreshPromptViewportMetrics();
  rebuildLineMap();
}

function getCachedPromptScrollableHeight() {
  if (!cachedPromptViewportHeight && ui.promptViewport) {
    return refreshPromptViewportMetrics();
  }

  return cachedPromptScrollableHeight;
}

function updateCollapseButton() {
  ui.collapseButton.title = isCollapsed ? t("common.expand") : t("common.collapse");
  ui.collapseButton.setAttribute("aria-label", ui.collapseButton.title);
  ui.collapseButton.classList.toggle("is-collapsed", isCollapsed);
}

function setReadingMode(enabled) {
  if (enabled) {
    refreshPromptViewportMetrics();
    frozenReadingViewportWidth = cachedPromptViewportWidth;
    frozenReadingViewportHeight = cachedPromptViewportHeight;
  } else {
    frozenReadingViewportWidth = 0;
    frozenReadingViewportHeight = 0;
  }

  document.body.classList.toggle("reading-mode", enabled);
  ui.floatingControls.classList.toggle("hidden", !enabled);
  updatePromptSafeArea();

  if (!enabled) {
    ui.floatingPlaybackMeta?.classList.add("hidden");
  }
}

function setPlaybackCountdownVisible(visible, label = "") {
  if (!ui.playbackCountdown || !ui.playbackCountdownLabel) {
    return;
  }

  document.body.classList.toggle("playback-countdown-active", visible);
  ui.playbackCountdown.dataset.visible = visible ? "true" : "false";
  ui.playbackCountdown.setAttribute("aria-hidden", visible ? "false" : "true");

  if (!visible) {
    ui.playbackCountdownLabel.textContent = "";
    ui.playbackCountdownLabel.classList.remove("is-animating");
    return;
  }

  ui.playbackCountdownLabel.textContent = label;
}

function parseWaitCardDescriptor(text) {
  return parseWaitCardText(text);
}

function createPromptWaitCardNumberSpan(value, extraClassName = "") {
  const span = document.createElement("span");
  span.className = ["prompt-card-wait-number-value", extraClassName].filter(Boolean).join(" ");
  span.textContent = String(value);
  return span;
}

function setPromptWaitCardNumber(cardElement, value, { animate = false } = {}) {
  const viewport = cardElement?.querySelector(".prompt-card-wait-number-viewport");
  if (!viewport) {
    return;
  }

  const nextValue = String(Math.max(1, Math.round(Number(value) || 0)));
  const previousValue = viewport.dataset.value || nextValue;

  if (promptWaitAnimationCleanupTimer) {
    clearTimeout(promptWaitAnimationCleanupTimer);
    promptWaitAnimationCleanupTimer = null;
  }

  if (!animate || previousValue === nextValue) {
    viewport.dataset.value = nextValue;
    cardElement.classList.remove("is-wait-number-animating");
    viewport.replaceChildren(createPromptWaitCardNumberSpan(nextValue));
    return;
  }

  viewport.dataset.value = nextValue;
  viewport.replaceChildren(
    createPromptWaitCardNumberSpan(previousValue, "is-outgoing"),
    createPromptWaitCardNumberSpan(nextValue, "is-incoming")
  );

  cardElement.classList.remove("is-wait-number-animating");
  void viewport.offsetWidth;
  cardElement.classList.add("is-wait-number-animating");

  promptWaitAnimationCleanupTimer = window.setTimeout(() => {
    if (!cardElement.isConnected || viewport.dataset.value !== nextValue) {
      return;
    }

    cardElement.classList.remove("is-wait-number-animating");
    viewport.replaceChildren(createPromptWaitCardNumberSpan(nextValue));
    promptWaitAnimationCleanupTimer = null;
  }, WAIT_CARD_NUMBER_ANIMATION_MS);
}

function clearPromptWaitCardState(card) {
  if (!card?.element) {
    return;
  }

  if (promptWaitAnimationCleanupTimer) {
    clearTimeout(promptWaitAnimationCleanupTimer);
    promptWaitAnimationCleanupTimer = null;
  }

  card.element.classList.remove("is-waiting", "is-wait-number-animating");
  setPromptWaitCardNumber(card.element, card.seconds, { animate: false });
}

function getPromptWaitCardTargetTop(card) {
  if (!card?.element || !ui.promptViewport) {
    return 0;
  }

  const viewportHeight = cachedPromptViewportHeight || ui.promptViewport.clientHeight;
  return Math.max(card.element.offsetTop + card.element.offsetHeight * 0.5 - viewportHeight * WAIT_CARD_TRIGGER_VIEWPORT_OFFSET, 0);
}

function resetPromptWaitCards(scrollTop = 0, wordIndex = 0) {
  const normalizedTop = Math.max(Number(scrollTop) || 0, 0);
  const normalizedWordIndex = Math.max(Number(wordIndex) || 0, 0);

  promptWaitRunToken += 1;

  promptWaitCards.forEach((card) => {
    clearPromptWaitCardState(card);
    card.consumed = card.triggerTop < normalizedTop - 1 || card.triggerWordIndex < normalizedWordIndex;
  });

  activePromptWaitCardId = "";
}

function updatePromptWaitCardLayout() {
  const viewportHeight = cachedPromptViewportHeight || ui.promptViewport?.clientHeight || 0;

  promptWaitCards = promptWaitCards.filter((card) => card.element?.isConnected && card.seconds > 0).map((card) => ({
    ...card,
    triggerTop: Math.max((card.element.offsetTop + card.element.offsetHeight * 0.5) - viewportHeight * WAIT_CARD_TRIGGER_VIEWPORT_OFFSET, 0)
  }));
}

function getDuePromptWaitCardForScroll(scrollTop) {
  const normalizedTop = Math.max(Number(scrollTop) || 0, 0);
  return promptWaitCards.find((card) => !card.consumed && card.id !== activePromptWaitCardId && normalizedTop >= card.triggerTop - 1) || null;
}

function getPromptWaitCardVoiceTriggerWordIndex(card) {
  if (!card) {
    return -1;
  }

  const triggerWordIndex = Math.max(Number(card.triggerWordIndex) || 0, 0);
  const previousWordIndex = Math.min(triggerWordIndex - 1, wordNodes.length - 1);
  if (previousWordIndex < 0) {
    return triggerWordIndex;
  }

  const previousLineIndex = lineIndexByWord[previousWordIndex] ?? 0;
  return lineGroups[previousLineIndex]?.lastIndex ?? previousWordIndex;
}

function getDuePromptWaitCardForVoiceIndex(wordIndex) {
  const normalizedWordIndex = Math.max(Number(wordIndex) || 0, 0);
  return promptWaitCards.find((card) => {
    if (card.consumed || card.id === activePromptWaitCardId) {
      return false;
    }

    return normalizedWordIndex >= getPromptWaitCardVoiceTriggerWordIndex(card);
  }) || null;
}

function getDuePromptWaitCardForWordIndex(wordIndex) {
  const normalizedWordIndex = Math.max(Number(wordIndex) || 0, 0);
  return promptWaitCards.find((card) => !card.consumed && card.id !== activePromptWaitCardId && normalizedWordIndex >= card.triggerWordIndex) || null;
}

function getPromptWaitCardVoiceResumeTop(card) {
  if (!card?.element || !ui.promptViewport) {
    return 0;
  }

  const viewportHeight = cachedPromptViewportHeight || ui.promptViewport.clientHeight;
  const baseTop = getPromptWaitCardTargetTop(card);
  const nudgeTop = baseTop + Math.max(card.element.offsetHeight * 0.75, viewportHeight * 0.08);
  const nextWordIndex = Math.min(Math.max(Number(card.triggerWordIndex) || 0, 0), Math.max(wordNodes.length - 1, 0));
  const nextLineIndex = lineIndexByWord[nextWordIndex] ?? -1;
  const nextLineTop = nextLineIndex >= 0 ? getLineTargetTop(nextLineIndex) : nudgeTop;
  return Math.max(Math.min(nudgeTop, nextLineTop), ui.promptViewport.scrollTop);
}

async function runPromptWaitPause(card) {
  if (!card || card.consumed || card.seconds <= 0) {
    return false;
  }

  const runToken = ++promptWaitRunToken;
  card.consumed = true;
  activePromptWaitCardId = card.id;

  const targetTop = getPromptWaitCardTargetTop(card);
  if (getActiveMode() === "scroll") {
    const totalScrollable = getCachedPromptScrollableHeight();
    scrollProgress = totalScrollable > 0 ? clamp(targetTop / totalScrollable, 0, 1) : scrollProgress;
    setViewportPosition(targetTop, "auto");
  } else if (ui.promptViewport) {
    clearPromptScrollTransform();
    ui.promptViewport.scrollTo({ top: targetTop, behavior: "auto" });
  }

  card.element.classList.add("is-waiting");
  setPromptWaitCardNumber(card.element, card.seconds, { animate: false });

  for (let remaining = card.seconds; remaining > 0; remaining -= 1) {
    if (runToken !== promptWaitRunToken || !isPlaying || isPaused) {
      clearPromptWaitCardState(card);
      if (activePromptWaitCardId === card.id) {
        activePromptWaitCardId = "";
      }
      return false;
    }

    if (remaining !== card.seconds) {
      setPromptWaitCardNumber(card.element, remaining, { animate: true });
    }

    await wait(WAIT_CARD_STEP_MS);
  }

  clearPromptWaitCardState(card);

  if (runToken === promptWaitRunToken && getActiveMode() === "voice" && ui.promptViewport) {
    animateViewportScroll(getPromptWaitCardVoiceResumeTop(card));
  }

  if (activePromptWaitCardId === card.id) {
    activePromptWaitCardId = "";
  }

  return runToken === promptWaitRunToken;
}

function getPlaybackCountdownStepMs() {
  return PLAYBACK_COUNTDOWN_STEP_MS;
}

async function runPlaybackCountdown() {
  if (!ui.playbackCountdown || !ui.playbackCountdownLabel) {
    return true;
  }

  const token = ++playbackCountdownToken;
  const countdownStepMs = getPlaybackCountdownStepMs();
  isPlaybackCountdownActive = true;
  ui.playbackCountdownLabel.style.setProperty("--playback-countdown-step-duration", `${countdownStepMs}ms`);
  setPlaybackCountdownVisible(true, PLAYBACK_COUNTDOWN_STEPS[0]);

  for (const step of PLAYBACK_COUNTDOWN_STEPS) {
    if (token !== playbackCountdownToken) {
      setPlaybackCountdownVisible(false);
      isPlaybackCountdownActive = false;
      return false;
    }

    ui.playbackCountdownLabel.textContent = step;
    ui.playbackCountdownLabel.classList.remove("is-animating");
    void ui.playbackCountdownLabel.offsetWidth;
    ui.playbackCountdownLabel.classList.add("is-animating");
    await wait(countdownStepMs);
  }

  if (token !== playbackCountdownToken) {
    setPlaybackCountdownVisible(false);
    isPlaybackCountdownActive = false;
    return false;
  }

  setPlaybackCountdownVisible(false);
  isPlaybackCountdownActive = false;
  return true;
}

async function waitForPlaybackCountdownSettle() {
  const token = playbackCountdownToken;
  await wait(PLAYBACK_COUNTDOWN_SETTLE_MS);
  return token === playbackCountdownToken;
}

function getPlaybackStartDelayMs() {
  const configuredSeconds = Number(state.appearance?.scrollStartDelaySeconds);
  const fallbackSeconds = Number(defaultState.appearance?.scrollStartDelaySeconds) || 0;
  const safeSeconds = Number.isFinite(configuredSeconds)
    ? clamp(Math.round(configuredSeconds), SCROLL_PLAYBACK_START_HOLD_MIN_SECONDS, SCROLL_PLAYBACK_START_HOLD_MAX_SECONDS)
    : fallbackSeconds;

  return safeSeconds * 1000;
}

function supportsPlaybackStartDelay(mode = getActiveMode()) {
  return ["highlight", "scroll", "line"].includes(mode);
}

async function waitForPlaybackStartDelay() {
  const token = ++playbackCountdownToken;
  isPlaybackCountdownActive = false;
  setPlaybackCountdownVisible(false);
  await wait(getPlaybackStartDelayMs());
  return token === playbackCountdownToken && isPlaying && !isPaused;
}

function formatMinutesLeft(wordCount, speed) {
  const minutes = estimateMinutes(wordCount, speed);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "0";
  }

  if (minutes >= 10) {
    return String(Math.round(minutes));
  }

  return minutes.toFixed(1).replace(/\.0$/, "");
}

function updateFloatingPlaybackMeta() {
  if (!ui.floatingPlaybackMeta) {
    return;
  }

  const shouldShow = (isPlaying || isPaused) && wordNodes.length > 0;
  ui.floatingPlaybackMeta.classList.toggle("hidden", !shouldShow);

  if (!shouldShow) {
    return;
  }

  const wordsLeft = Math.max(wordNodes.length - currentIndex - 1, 0);
  const minutesLeft = formatMinutesLeft(wordsLeft, state.speed);
  ui.floatingPlaybackMeta.textContent = t("tele.floatingStats", {
    words: wordsLeft,
    minutes: minutesLeft
  });
}

function getPlaybackViewportOffset(defaultOffset, voiceOffset) {
  if (document.body.classList.contains("reading-mode")) {
    return 0;
  }

  return getActiveMode() === "voice" ? voiceOffset : defaultOffset;
}

function updatePlayButtons() {
  const isResume = currentIndex > 0 && currentIndex < Math.max(wordNodes.length - 1, 0);
  setButtonIcon(ui.playButton, "ph-play");
  ui.playButton.title = isResume ? t("common.startFresh") : t("common.play");
  ui.playButton.setAttribute("aria-label", ui.playButton.title);

  const pauseLabel = isPaused ? t("common.continue") : t("common.pause");
  setButtonIcon(ui.floatingPauseButton, isPaused ? "ph-play-circle" : "ph-pause-circle");
  ui.floatingPauseButton.title = pauseLabel;
  ui.floatingPauseButton.setAttribute("aria-label", pauseLabel);
  ui.floatingPauseButton.disabled = !isPlaying && !isPaused;

  ui.floatingReplayButton.title = t("common.replayStart");
  ui.floatingReplayButton.setAttribute("aria-label", ui.floatingReplayButton.title);
  setButtonIcon(ui.floatingStopButton, "ph-stop-circle");
  ui.floatingStopButton.title = t("common.stopKeep");
  ui.floatingStopButton.setAttribute("aria-label", ui.floatingStopButton.title);

  const showReplay = isPaused && currentIndex > 0;
  ui.floatingReplayButton.classList.toggle("hidden", !showReplay);
  updateFloatingPlaybackMeta();
  updateSpeedRailVisibility();
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

  if (getActiveMode() !== "scroll") {
    clearPromptScrollTransform();
  }
}

async function animateWindowHeight(targetHeight) {
  const geometry = await getSafeWindowGeometry(targetHeight);

  if (state.appearance?.performanceMode) {
    currentWindowHeight = geometry.height;
    if (tauriWindow?.getCurrentWindow && tauriDpi?.LogicalSize) {
      const appWindow = tauriWindow.getCurrentWindow();
      await appWindow.setSize(new tauriDpi.LogicalSize(geometry.width + geometry.gutterWidth, geometry.height)).catch(console.error);
      await positionWindowForCurrentLayout(appWindow, geometry).catch(console.error);
    }
    return;
  }

  if (!tauriWindow?.getCurrentWindow || !tauriDpi?.LogicalSize) {
    currentWindowHeight = geometry.height;
    return;
  }

  const appWindow = tauriWindow.getCurrentWindow();
  const width = geometry.width + geometry.gutterWidth;
  const startHeight = clamp(
    currentWindowHeight ?? Math.max(state.window.height || defaultState.window.height, MIN_HEIGHT),
    MIN_HEIGHT,
    geometry.maxHeight
  );

  if (startHeight === geometry.height) {
    currentWindowHeight = geometry.height;
    return;
  }

  const token = ++resizeAnimationToken;

  const easeInOutCubic = (progress) => {
    if (progress < 0.5) {
      return 4 * progress * progress * progress;
    }

    return 1 - ((-2 * progress + 2) ** 3) / 2;
  };

  await new Promise((resolve) => {
    let lastAppliedHeight = startHeight;

    const step = (now, startedAt = now) => {
      if (token !== resizeAnimationToken) {
        resolve();
        return;
      }

      const progress = Math.min((now - startedAt) / COLLAPSE_DURATION, 1);
      const eased = easeInOutCubic(progress);
      const nextHeight = Math.round(startHeight + (geometry.height - startHeight) * eased);

      if (nextHeight !== lastAppliedHeight) {
        lastAppliedHeight = nextHeight;
        currentWindowHeight = nextHeight;
        appWindow.setSize(new tauriDpi.LogicalSize(width, nextHeight)).catch(console.error);
        positionWindowForCurrentLayout(appWindow, { ...geometry, height: nextHeight }).catch(console.error);
      }

      if (progress < 1) {
        requestAnimationFrame((timestamp) => step(timestamp, startedAt));
        return;
      }

      currentWindowHeight = geometry.height;
      appWindow.setSize(new tauriDpi.LogicalSize(width, geometry.height)).catch(console.error);
      positionWindowForCurrentLayout(appWindow, geometry).catch(console.error).finally(resolve);
    };

    requestAnimationFrame((timestamp) => step(timestamp, timestamp));
  });
}

async function setCollapsed(nextValue) {
  if (isCollapsed === nextValue) return;

  const transitionToken = ++collapseTransitionToken;

  if (nextValue && isPlaying) {
    stopPlayback(true);
  }

  const expandedHeight = Math.max(state.window.height || defaultState.window.height, MIN_HEIGHT);

  isCollapsed = nextValue;
  updateCollapseButton();
  updateDragControls();

  if (isCollapsed) {
    document.body.classList.add("teleprompter-collapsing");
    document.body.classList.remove("teleprompter-expanding");
    document.body.classList.add("teleprompter-collapsed");
    await animateWindowHeight(COLLAPSED_HEIGHT);

    if (transitionToken !== collapseTransitionToken) {
      return;
    }

    document.body.classList.remove("teleprompter-collapsing");
  } else {
    document.body.classList.add("teleprompter-expanding");
    document.body.classList.remove("teleprompter-collapsed", "teleprompter-collapsing");
    await animateWindowHeight(expandedHeight);

    if (transitionToken !== collapseTransitionToken) {
      return;
    }

    await applyStoredWindowSettings();

    if (transitionToken !== collapseTransitionToken) {
      return;
    }

    document.body.classList.remove("teleprompter-expanding");
  }

  if (!isCollapsed) {
    applyResponsiveText();
  }
}

function rebuildLineMap() {
  lineGroups = [];
  lineIndexByWord = new Array(wordNodes.length).fill(0);

  if (wordNodes.length === 0 || !ui.promptText) {
    return;
  }

  const promptRect = ui.promptText.getBoundingClientRect();
  let currentLine = null;

  wordNodes.forEach((node, index) => {
    const top = Math.round(node.getBoundingClientRect().top - promptRect.top);
    if (!currentLine || Math.abs(currentLine.top - top) > 4) {
      currentLine = {
        top,
        firstIndex: index,
        lastIndex: index
      };
      lineGroups.push(currentLine);
    } else {
      currentLine.lastIndex = index;
    }

    lineIndexByWord[index] = lineGroups.length - 1;
    node.dataset.lineIndex = String(lineGroups.length - 1);
  });

  refreshPromptViewportMetrics();
  updatePromptWaitCardLayout();
}

function scheduleLineMapRebuild() {
  if (lineMapRebuildFrame) {
    return;
  }

  lineMapRebuildFrame = requestAnimationFrame(() => {
    lineMapRebuildFrame = null;
    rebuildLineMap();
    lastRenderedLineIndex = -1;
    lastRenderedWordIndex = -1;
    lastRenderedMode = null;
    updateWordState(false);
  });
}

function applyResponsiveText() {
  refreshPromptViewportMetrics();

  const basisWidth = document.body.classList.contains("reading-mode") && frozenReadingViewportWidth
    ? frozenReadingViewportWidth
    : cachedPromptViewportWidth;
  let basisHeight = document.body.classList.contains("reading-mode") && frozenReadingViewportHeight
    ? frozenReadingViewportHeight
    : cachedPromptViewportHeight;

  if (!document.body.classList.contains("reading-mode") && state.appearance?.autoHideToolbar && ui.teleprompterApp) {
    const appHeight = ui.teleprompterApp.clientHeight || cachedPromptViewportHeight;
    const footerHeight = ui.teleprompterFooter?.offsetHeight || 0;
    const reservedToolbarHeight = Math.max(ui.teleprompterToolbar?.offsetHeight || 0, 60);
    const reservedGapHeight = 16;
    basisHeight = Math.max(appHeight - footerHeight - reservedToolbarHeight - reservedGapHeight, 0);
  }

  const widthSize = basisWidth * 0.11;
  const heightSize = basisHeight * 0.18;
  const baseSize = clamp(Math.min(widthSize, heightSize), 28, 120);
  const scale = (state.appearance?.textScale || defaultState.appearance.textScale) / 100;
  const minimumTextScale = 30;
  const minimumRenderedSize = Math.max(8, (baseSize * minimumTextScale) / 100);
  const computed = clamp(baseSize * scale, minimumRenderedSize, 180);

  const viewportChanged = basisWidth !== lastResponsiveViewportWidth
    || basisHeight !== lastResponsiveViewportHeight;

  if (!viewportChanged && computed === lastResponsiveFontSize) {
    return;
  }

  document.documentElement.style.setProperty("--teleprompter-font-size", `${computed}px`);
  lastResponsiveFontSize = computed;
  lastResponsiveViewportWidth = basisWidth;
  lastResponsiveViewportHeight = basisHeight;
  scheduleLineMapRebuild();
}

function createWordSpan(token, index, options = {}) {
  const { includeHighlight = true, includeUnderline = true } = options;
  const span = document.createElement("span");
  span.className = "prompt-word";
  span.dataset.index = String(index);
  span.textContent = token.text;

  if (token.style.bold) {
    span.classList.add("is-bold");
  }

  if (token.style.italic) {
    span.classList.add("is-italic");
  }

  if (includeUnderline && token.style.underline) {
    span.classList.add("is-underlined");
  }

  if (token.style.textTone) {
    span.classList.add(`is-tone-${token.style.textTone}`);
  }

  if (includeHighlight && token.style.highlight) {
    span.classList.add("is-marked", `is-marked-${token.style.highlight}`);
  }

  return span;
}

function createDecorationGroupSpan(style) {
  const span = document.createElement("span");
  span.className = "prompt-highlight-group";

  if (style.textTone) {
    span.classList.add(`is-tone-${style.textTone}`);
  }

  if (style.highlight) {
    span.classList.add("is-marked", `is-marked-${style.highlight}`);
  } else {
    span.classList.remove("is-marked");
  }

  if (style.underline) {
    span.classList.add("is-underlined");
  }

  return span;
}

function createPromptCard(token) {
  const element = document.createElement(token.placement === "between" ? "span" : "div");
  const waitDescriptor = parseWaitCardDescriptor(token.text);
  element.className = "prompt-card";
  element.classList.add(token.placement === "between" ? "prompt-card-between" : "prompt-card-centered");
  element.classList.add(`prompt-card-tone-${token.tone || "neutral"}`);
  applyTextDirection(element, token.text);
  if (waitDescriptor) {
    element.classList.add("prompt-card-wait");
    element.dataset.waitSeconds = String(waitDescriptor.seconds);

    const copy = document.createElement("span");
    copy.className = "prompt-card-wait-copy";
    applyTextDirection(copy, token.text);

    if (waitDescriptor.prefix) {
      const prefix = document.createElement("span");
      prefix.className = "prompt-card-wait-prefix";
      prefix.textContent = waitDescriptor.prefix;
      copy.appendChild(prefix);
    }

    const numberViewport = document.createElement("span");
    numberViewport.className = "prompt-card-wait-number-viewport";
    numberViewport.dataset.value = String(waitDescriptor.seconds);
    numberViewport.appendChild(createPromptWaitCardNumberSpan(waitDescriptor.seconds));
    copy.appendChild(numberViewport);

    if (waitDescriptor.suffix) {
      const suffix = document.createElement("span");
      suffix.className = "prompt-card-wait-suffix";
      suffix.textContent = waitDescriptor.suffix;
      copy.appendChild(suffix);
    }

    element.appendChild(copy);
    return element;
  }

  const copy = document.createElement("span");
  copy.className = "prompt-card-copy";
  applyTextDirection(copy, token.text);
  copy.textContent = token.text;
  element.appendChild(copy);
  return element;
}

function createPromptListItem(token) {
  const element = document.createElement("div");
  element.className = "prompt-list-item";
  element.dataset.listOrdered = token.ordered ? "true" : "false";

  const marker = document.createElement("span");
  marker.className = "prompt-list-marker";
  marker.dataset.markerValue = token.marker || (token.ordered ? "1." : "•");
  marker.textContent = marker.dataset.markerValue;
  if (token.ordered) {
    marker.setAttribute("dir", "ltr");
    marker.dataset.textDirection = "ltr";
  }

  const content = document.createElement("span");
  content.className = "prompt-list-content";

  element.append(marker, content);
  return { element, content };
}

function createPromptBlockquote() {
  const element = document.createElement("div");
  element.className = "prompt-blockquote";

  const content = document.createElement("span");
  content.className = "prompt-blockquote-content";

  element.append(content);
  return { element, content };
}

function syncPromptBlockDirection(content) {
  if (!content) {
    return;
  }

  const direction = applyTextDirection(content, content.textContent || "");
  const block = content.parentElement;
  if (!block) {
    return;
  }

  block.setAttribute("dir", direction);
  block.dataset.textDirection = direction;

  const marker = block.querySelector(".prompt-list-marker");
  if (!marker || block.dataset.listOrdered !== "true") {
    return;
  }

  const sourceMarker = marker.dataset.markerValue || marker.textContent || "1.";
  const numericPart = sourceMarker.replace(/[^\p{N}]+/gu, "") || "1";
  marker.textContent = direction === "rtl" ? `.${numericPart}` : `${numericPart}.`;
}

function getDecorationSignature(style = {}) {
  if (!style.highlight && !style.underline) {
    return "";
  }

  return JSON.stringify({
    highlight: style.highlight || null,
    underline: Boolean(style.underline),
    textTone: style.textTone || null
  });
}

function renderScript() {
  const tokens = parseFormattedScript(state.script);
  const allWords = tokens.filter((token) => token.type === "word");
  const fragment = document.createDocumentFragment();

  ui.promptText.innerHTML = "";
  const promptDirection = applyTextDirection(ui.promptText, state.script);
  ui.promptViewport?.setAttribute("dir", promptDirection);
  ui.promptViewport.dataset.textDirection = promptDirection;
  wordNodes = [];
  lineGroups = [];
  lineIndexByWord = [];
  promptWaitCards = [];
  activePromptWaitCardId = "";
  lastRenderedMode = null;
  lastRenderedWordIndex = -1;
  lastRenderedLineIndex = -1;

  if (allWords.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-copy";
    empty.textContent = t("tele.empty");
    ui.promptText.appendChild(empty);
    updateStatus();
    return;
  }

  rebuildNormalizedScriptTokenMap(getVoiceLanguageTag(), allWords.map((token) => token.text));

  let wordIndex = 0;
  let currentDecorationGroup = null;
  let currentDecorationSignature = "";
  let currentBlockContent = null;

  const closeDecorationGroup = () => {
    currentDecorationGroup = null;
    currentDecorationSignature = "";
  };

  const closeBlock = () => {
    closeDecorationGroup();
    currentBlockContent = null;
  };

  const getInlineTarget = () => currentBlockContent || fragment;

  tokens.forEach((token, tokenIndex) => {
    if (token.type === "blockquote-start") {
      closeBlock();
      const blockquote = createPromptBlockquote();
      fragment.appendChild(blockquote.element);
      currentBlockContent = blockquote.content;
      return;
    }

    if (token.type === "list-item-start") {
      closeBlock();
      const listItem = createPromptListItem(token);
      fragment.appendChild(listItem.element);
      currentBlockContent = listItem.content;
      return;
    }

    if (token.type === "block-end") {
      closeBlock();
      return;
    }

    if (token.type === "card") {
      closeDecorationGroup();
      const cardElement = createPromptCard(token);
      getInlineTarget().appendChild(cardElement);

      if (currentBlockContent) {
        syncPromptBlockDirection(currentBlockContent);
      }

      const waitSeconds = Number(cardElement.dataset.waitSeconds || 0);
      if (waitSeconds > 0) {
        promptWaitCards.push({
          id: `wait-${promptWaitCards.length}`,
          element: cardElement,
          seconds: waitSeconds,
          triggerTop: 0,
          triggerWordIndex: wordIndex,
          consumed: false
        });
      }

      return;
    }

    if (token.type === "word") {
      const decorationSignature = getDecorationSignature(token.style);
      const target = decorationSignature
        ? (() => {
            if (!currentDecorationGroup || currentDecorationSignature !== decorationSignature) {
              currentDecorationGroup = createDecorationGroupSpan(token.style);
              currentDecorationSignature = decorationSignature;
              getInlineTarget().appendChild(currentDecorationGroup);
            }

            return currentDecorationGroup;
          })()
        : (() => {
            closeDecorationGroup();
            return getInlineTarget();
          })();

      const span = createWordSpan(token, wordIndex, {
        includeHighlight: !token.style.highlight || !decorationSignature,
        includeUnderline: !token.style.underline || !decorationSignature
      });

      wordNodes.push(span);
      target.appendChild(span);
      if (currentBlockContent) {
        syncPromptBlockDirection(currentBlockContent);
      }
      wordIndex += 1;
      return;
    }

    if (token.type === "space") {
      const previousToken = tokens[tokenIndex - 1];
      const nextToken = tokens[tokenIndex + 1];
      const previousSignature = previousToken?.type === "word" ? getDecorationSignature(previousToken.style) : "";
      const nextSignature = nextToken?.type === "word" ? getDecorationSignature(nextToken.style) : "";
      const sharedDecoration = previousToken?.type === "word"
        && nextToken?.type === "word"
        && previousSignature
        && previousSignature === nextSignature;

      if (sharedDecoration && currentDecorationGroup) {
        currentDecorationGroup.appendChild(document.createTextNode(" "));
      } else {
        closeDecorationGroup();
        getInlineTarget().appendChild(document.createTextNode(" "));
      }

      if (currentBlockContent) {
        syncPromptBlockDirection(currentBlockContent);
      }
      return;
    }

    closeDecorationGroup();
    fragment.appendChild(document.createElement("br"));
  });

  ui.promptText.appendChild(fragment);
  refreshPromptViewportMetrics();
  scheduleLineMapRebuild();
}

function rebuildNormalizedScriptTokenMap(languageTag = getVoiceLanguageTag(), sourceWords = words()) {
  normalizedWordTokens = [];
  wordIndexByNormalizedToken = [];
  normalizedTokenRangeByWord = [];

  sourceWords.forEach((word, index) => {
    const normalizedTokens = tokenizeNormalizedText(word, languageTag);
    if (normalizedTokens.length === 0) {
      normalizedTokenRangeByWord[index] = null;
      return;
    }

    const start = normalizedWordTokens.length;
    normalizedWordTokens.push(...normalizedTokens);
    wordIndexByNormalizedToken.push(...normalizedTokens.map(() => index));
    normalizedTokenRangeByWord[index] = {
      start,
      end: normalizedWordTokens.length - 1
    };
  });
}

function findPreservedWordIndex(previousScript, nextScript, previousIndex) {
  const nextWords = splitWords(nextScript);
  if (nextWords.length === 0) {
    return 0;
  }

  const fallbackIndex = clamp(previousIndex, 0, nextWords.length - 1);
  if (!previousScript || nextScript.startsWith(previousScript)) {
    return fallbackIndex;
  }

  const previousWords = splitWords(previousScript);
  if (previousWords.length === 0) {
    return fallbackIndex;
  }

  const anchorPlans = [
    { before: 2, after: 2 },
    { before: 1, after: 1 },
    { before: 0, after: 0 }
  ];

  for (const plan of anchorPlans) {
    const start = Math.max(previousIndex - plan.before, 0);
    const end = Math.min(previousIndex + plan.after + 1, previousWords.length);
    const anchor = previousWords.slice(start, end);

    if (anchor.length === 0) {
      continue;
    }

    for (let index = 0; index <= nextWords.length - anchor.length; index += 1) {
      const matches = anchor.every((word, offset) => nextWords[index + offset] === word);
      if (matches) {
        return clamp(index + (previousIndex - start), 0, nextWords.length - 1);
      }
    }
  }

  return fallbackIndex;
}

function rerenderScriptPreservingPosition(previousScript) {
  const currentScrollable = refreshPromptViewportMetrics();
  const playbackSnapshot = {
    wasPlaying: isPlaying,
    wasPaused: isPaused,
    previousIndex: currentIndex,
    previousScrollProgress: scrollProgress,
    previousScrollTop: getActiveMode() === "scroll"
      ? currentScrollable * scrollProgress
      : (ui.promptViewport?.scrollTop || 0),
    previousScrollHeight: ui.promptViewport?.scrollHeight || 0,
    previousClientHeight: ui.promptViewport?.clientHeight || 0
  };

  clearPlayback();
  renderScript();
  applyResponsiveText();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (wordNodes.length === 0) {
        stopPlayback(true);
        return;
      }

      currentIndex = findPreservedWordIndex(previousScript, state.script, playbackSnapshot.previousIndex);

      const totalScrollable = refreshPromptViewportMetrics();
      const previousScrollable = Math.max(playbackSnapshot.previousScrollHeight - playbackSnapshot.previousClientHeight, 0);
      const previousScrollRatio = previousScrollable > 0
        ? clamp(playbackSnapshot.previousScrollTop / previousScrollable, 0, 1)
        : playbackSnapshot.previousScrollProgress;

      if (getActiveMode() === "scroll") {
        scrollProgress = clamp(playbackSnapshot.previousScrollProgress, 0, 1);
        setViewportPosition(totalScrollable * scrollProgress, "auto");
      } else {
        scrollProgress = totalScrollable > 0 ? previousScrollRatio : 0;
        setViewportPosition(totalScrollable * previousScrollRatio, "auto");
      }

      updateWordState(false);
      isPlaying = playbackSnapshot.wasPlaying;
      isPaused = playbackSnapshot.wasPaused;
      setReadingMode(playbackSnapshot.wasPlaying);

      if (playbackSnapshot.wasPlaying && !playbackSnapshot.wasPaused) {
        restartPlaybackLoopForCurrentMode();
        return;
      }

      updatePlaybackIndicators(true);
      updatePlayButtons();
    });
  });
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
    ui.statusLabel.textContent = t("tele.generated");
  } catch (error) {
    console.error(error);
    ui.statusLabel.textContent = t("tele.groqFailed", { error: error.message || error });
  } finally {
    ui.generateButton.disabled = false;
  }
}

function clearWordClasses() {
  wordNodes.forEach((node) => {
    node.classList.remove("active", "past", "next", "active-line", "past-line", "next-line", "arrow-active", "arrow-nearby");
  });
}

function clearRenderedState() {
  clearWordClasses();
  lastRenderedMode = null;
  lastRenderedWordIndex = -1;
  lastRenderedLineIndex = -1;
}

function renderPlainState() {
  if (lastRenderedMode !== "plain") {
    clearRenderedState();
    lastRenderedMode = "plain";
  }
}

function setClassesForLine(lineIndex, classNames, enabled) {
  const line = lineGroups[lineIndex];
  if (!line) return;

  for (let index = line.firstIndex; index <= line.lastIndex; index += 1) {
    const node = wordNodes[index];
    if (!node) continue;

    classNames.forEach((className) => {
      node.classList.toggle(className, enabled);
    });
  }
}

function renderHighlightState() {
  if (lastRenderedMode !== "highlight") {
    clearRenderedState();
    lastRenderedMode = "highlight";
  }

  if (lastRenderedWordIndex === currentIndex) {
    return;
  }

  const previousIndex = lastRenderedWordIndex;
  const isSequentialForward = previousIndex >= 0 && currentIndex === previousIndex + 1;

  if (!isSequentialForward) {
    clearWordClasses();

    for (let index = 0; index < currentIndex; index += 1) {
      wordNodes[index]?.classList.add("past");
    }

    wordNodes[currentIndex]?.classList.add("active");

    for (let index = currentIndex + 1; index <= Math.min(currentIndex + 3, wordNodes.length - 1); index += 1) {
      wordNodes[index]?.classList.add("next");
    }
  } else {
    wordNodes[previousIndex]?.classList.remove("active");
    wordNodes[previousIndex]?.classList.add("past");
    wordNodes[currentIndex]?.classList.remove("next");
    wordNodes[currentIndex]?.classList.add("active");
    wordNodes[currentIndex + 3]?.classList.add("next");
  }

  lastRenderedWordIndex = currentIndex;
}

function renderLineState(mode) {
  const activeLineIndex = lineIndexByWord[currentIndex] ?? 0;
  const isArrowMode = mode === "arrow";

  if (lastRenderedMode !== mode) {
    clearRenderedState();
    lastRenderedMode = mode;
  }

  if (lastRenderedLineIndex === activeLineIndex) {
    return activeLineIndex;
  }

  const previousLineIndex = lastRenderedLineIndex;
  const isSequentialForward = previousLineIndex >= 0 && activeLineIndex === previousLineIndex + 1;

  if (!isSequentialForward) {
    clearWordClasses();

    if (isArrowMode) {
      setClassesForLine(activeLineIndex - 1, ["arrow-nearby"], true);
      setClassesForLine(activeLineIndex, ["arrow-active"], true);
      setClassesForLine(activeLineIndex + 1, ["arrow-nearby"], true);
    } else {
      for (let lineIndex = 0; lineIndex < activeLineIndex; lineIndex += 1) {
        setClassesForLine(lineIndex, ["past-line"], true);
      }

      setClassesForLine(activeLineIndex, ["active-line"], true);
      setClassesForLine(activeLineIndex + 1, ["next-line"], true);
    }
  } else if (isArrowMode) {
    setClassesForLine(previousLineIndex - 1, ["arrow-nearby"], false);
    setClassesForLine(previousLineIndex, ["arrow-active"], false);
    setClassesForLine(previousLineIndex, ["arrow-nearby"], true);
    setClassesForLine(activeLineIndex, ["arrow-nearby"], false);
    setClassesForLine(activeLineIndex, ["arrow-active"], true);
    setClassesForLine(activeLineIndex + 1, ["arrow-nearby"], true);
  } else {
    setClassesForLine(previousLineIndex, ["active-line"], false);
    setClassesForLine(previousLineIndex, ["past-line"], true);
    setClassesForLine(activeLineIndex, ["next-line"], false);
    setClassesForLine(activeLineIndex, ["active-line"], true);
    setClassesForLine(activeLineIndex + 1, ["next-line"], true);
  }

  lastRenderedLineIndex = activeLineIndex;
  lastRenderedWordIndex = currentIndex;
  return activeLineIndex;
}

function scrollToNode(node) {
  if (!node) return;
  const viewportOffset = getPlaybackViewportOffset(0.32, VOICE_WORD_VIEWPORT_OFFSET);
  const top = node.offsetTop - ui.promptViewport.clientHeight * viewportOffset;
  const nextTop = Math.max(top, 0);

  if (getActiveMode() === "voice") {
    animateViewportScroll(nextTop);
    return;
  }

  ui.promptViewport.scrollTo({ top: nextTop, behavior: getScrollBehavior() });
}

function stopViewportScrollAnimation() {
  if (viewportScrollAnimationFrame) {
    cancelAnimationFrame(viewportScrollAnimationFrame);
    viewportScrollAnimationFrame = null;
  }

  viewportScrollTarget = null;
}

function animateViewportScroll(targetTop) {
  if (!ui.promptViewport) {
    return;
  }

  viewportScrollTarget = Math.max(targetTop, 0);

  if (viewportScrollAnimationFrame) {
    return;
  }

  const step = () => {
    if (!ui.promptViewport || viewportScrollTarget === null) {
      stopViewportScrollAnimation();
      return;
    }

    const currentTop = ui.promptViewport.scrollTop;
    const delta = viewportScrollTarget - currentTop;

    if (Math.abs(delta) < 0.6) {
      ui.promptViewport.scrollTop = viewportScrollTarget;
      stopViewportScrollAnimation();
      return;
    }

    const easedStep = delta * VOICE_SCROLL_EASING;
    const limitedStep = Math.sign(easedStep) * Math.min(Math.abs(easedStep), VOICE_SCROLL_MAX_STEP);
    ui.promptViewport.scrollTop = currentTop + limitedStep;
    viewportScrollAnimationFrame = requestAnimationFrame(step);
  };

  viewportScrollAnimationFrame = requestAnimationFrame(step);
}

function clearPromptScrollTransform() {
  if (ui.promptText) {
    ui.promptText.style.transform = "";
  }

  lastAppliedViewportTop = null;
}

function setViewportPosition(top, behavior = "auto") {
  const nextTop = Math.max(top, 0);

  if (getActiveMode() === "scroll") {
    if (ui.promptViewport.scrollTop !== 0) {
      ui.promptViewport.scrollTop = 0;
    }

    if (ui.promptText) {
      if (lastAppliedViewportTop === null || Math.abs(lastAppliedViewportTop - nextTop) >= 0.5) {
        ui.promptText.style.transform = `translate3d(0, ${-nextTop}px, 0)`;
        lastAppliedViewportTop = nextTop;
      }
    }
    return;
  }

  clearPromptScrollTransform();
  stopViewportScrollAnimation();
  ui.promptViewport.scrollTo({ top: nextTop, behavior });
}

function scrollToLine(lineIndex) {
  const line = lineGroups[lineIndex];
  if (!line) return;
  const viewportOffset = getPlaybackViewportOffset(0.28, VOICE_LINE_VIEWPORT_OFFSET);
  const top = line.top - ui.promptViewport.clientHeight * viewportOffset;
  const nextTop = Math.max(top, 0);

  if (getActiveMode() === "voice") {
    animateViewportScroll(nextTop);
    return;
  }

  ui.promptViewport.scrollTo({ top: nextTop, behavior: getScrollBehavior() });
}

function getLineTargetTop(lineIndex) {
  const line = lineGroups[lineIndex];
  if (!line) {
    return 0;
  }

  const viewportHeight = cachedPromptViewportHeight || ui.promptViewport.clientHeight;
  return Math.max(line.top - viewportHeight * getPlaybackViewportOffset(0.28, VOICE_LINE_VIEWPORT_OFFSET), 0);
}

function getLineIndexForScrollTop(scrollTop) {
  if (lineGroups.length === 0) {
    return 0;
  }

  const normalizedTop = Math.max(Number(scrollTop) || 0, 0);
  let low = 0;
  let high = lineGroups.length - 1;
  let bestIndex = 0;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const middleTop = getLineTargetTop(middle);

    if (middleTop <= normalizedTop + 1) {
      bestIndex = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return bestIndex;
}

function getPlaybackIndexForScrollTop(scrollTop) {
  const lineIndex = getLineIndexForScrollTop(scrollTop);
  return lineGroups[lineIndex]?.firstIndex ?? 0;
}

function updateWordState(shouldScroll = true) {
  const activeMode = getActiveMode();

  if (state.appearance?.performanceMode && activeMode === "scroll") {
    updatePlaybackIndicators(false);
    return;
  }

  if (activeMode === "voice") {
    const voiceStyle = getVoiceScrollStyle();
    const activeLineIndex = lineIndexByWord[currentIndex] ?? 0;

    if (voiceStyle === "line") {
      renderLineState("line");

      if (shouldScroll) {
        scrollToLine(activeLineIndex);
      }
    } else if (voiceStyle === "plain") {
      renderPlainState();

      if (shouldScroll) {
        scrollToLine(activeLineIndex);
      }
    } else {
      renderHighlightState();

      if (shouldScroll) {
        scrollToLine(activeLineIndex);
      }
    }
  } else if (activeMode === "highlight") {
    renderHighlightState();

    if (shouldScroll) {
      scrollToNode(wordNodes[currentIndex]);
    }
  } else if (activeMode === "line") {
    const activeLineIndex = renderLineState("line");

    if (shouldScroll) {
      scrollToLine(activeLineIndex);
    }
  } else if (activeMode === "arrow") {
    const activeLineIndex = renderLineState("arrow");

    if (shouldScroll) {
      scrollToLine(activeLineIndex);
    }
  }

  updatePlaybackIndicators(false);
}

function clearPlayback() {
  if (tickTimer) {
    clearTimeout(tickTimer);
    tickTimer = null;
  }

  if (scrollAnimationFrame) {
    cancelAnimationFrame(scrollAnimationFrame);
    scrollAnimationFrame = null;
  }

  lastScrollFrameAt = 0;
  promptWaitRunToken += 1;
  activePromptWaitCardId = "";
  promptWaitCards.forEach((card) => clearPromptWaitCardState(card));
  setPlaybackCountdownVisible(false);
  voiceTranscript = "";
  pendingForwardVoiceSkip = null;
  resetVoiceCommandTranscript();
  stopViewportScrollAnimation();

  if (voiceRecognition?.engine === "native" || voiceRecognition?.remove || voiceTrackingMediaStream || voiceTrackingAudioContext) {
    stopVoiceTracking().catch(console.error);
  }
}

function stopPlayback(reset = true) {
  playbackCountdownToken += 1;
  isPlaybackCountdownActive = false;
  setPlaybackCountdownVisible(false);
  isPlaying = false;
  isPaused = false;
  setReadingMode(false);
  clearPlayback();

  if (reset) {
    currentIndex = 0;
    scrollProgress = 0;
    setViewportPosition(0, getScrollBehavior());
    resetPromptWaitCards(0, 0);
    clearRenderedState();
  } else {
    const totalScrollable = refreshPromptViewportMetrics();
    const currentTop = getActiveMode() === "scroll"
      ? totalScrollable * scrollProgress
      : ui.promptViewport.scrollTop;
    scrollProgress = totalScrollable > 0 ? currentTop / totalScrollable : 0;
  }

  updateWordState(false);
  updatePlayButtons();
  syncVoiceCommandListener();
  scheduleVoiceHealthCheck(0);
}

function pausePlayback() {
  if (!isPlaying || isPaused) {
    return false;
  }

  const activeMode = getActiveMode();
  isPaused = true;

  if (activeMode !== "arrow" && activeMode !== "voice") {
    clearPlayback();
  }

  updatePlaybackIndicators(true);
  updatePlayButtons();
  syncVoiceCommandListener();
  return true;
}

async function resumePlayback() {
  if (!isPlaying || !isPaused) {
    return false;
  }

  const activeMode = getActiveMode();
  const countdownCompleted = await runPlaybackCountdown();
  if (!countdownCompleted) {
    return false;
  }

  const settleCompleted = await waitForPlaybackCountdownSettle();
  if (!settleCompleted) {
    return false;
  }

  isPaused = false;

  if (activeMode === "scroll") {
    playScrollMode();
  } else if (activeMode === "voice") {
    updateWordState(true);
  } else if (activeMode !== "arrow") {
    playTimedStep();
  }

  updatePlaybackIndicators(true);
  updatePlayButtons();
  syncVoiceCommandListener();
  return true;
}

function finishPlayback() {
  isPlaying = false;
  isPaused = false;
  setReadingMode(false);
  clearPlayback();
  scrollProgress = 1;
  updatePlaybackIndicators(true);
  updatePlayButtons();
  syncVoiceCommandListener();
}

function playTimedStep() {
  updateWordState(true);

  const waitCard = getDuePromptWaitCardForWordIndex(currentIndex);
  if (waitCard) {
    runPromptWaitPause(waitCard).then((completed) => {
      if (completed && isPlaying && !isPaused && getActiveMode() !== "scroll" && getActiveMode() !== "voice" && getActiveMode() !== "arrow") {
        playTimedStep();
      }
    }).catch(console.error);
    return;
  }

  if (currentIndex >= wordNodes.length - 1) {
    finishPlayback();
    return;
  }

  tickTimer = setTimeout(() => {
    currentIndex += 1;
    playTimedStep();
  }, 60000 / state.speed);
}

function playScrollMode() {
  const totalWords = Math.max(wordNodes.length, 1);
  lastScrollFrameAt = 0;
  refreshPromptViewportMetrics();
  updatePromptWaitCardLayout();

  const step = (now) => {
    if (!isPlaying || isPaused) {
      return;
    }

    if (lastScrollFrameAt === 0) {
      lastScrollFrameAt = now;
    }

    const elapsedMs = Math.max(now - lastScrollFrameAt, 0);
    lastScrollFrameAt = now;
    const progressDelta = (elapsedMs * state.speed) / (60000 * totalWords);
    scrollProgress = clamp(scrollProgress + progressDelta, 0, 1);

    const totalScrollable = getCachedPromptScrollableHeight();
    const targetTop = totalScrollable * scrollProgress;
    setViewportPosition(targetTop, "auto");
    const nextIndex = Math.min(getPlaybackIndexForScrollTop(targetTop), Math.max(wordNodes.length - 1, 0));
    if (nextIndex !== currentIndex) {
      currentIndex = nextIndex;
    }

    const waitCard = getDuePromptWaitCardForScroll(targetTop);
    if (waitCard) {
      lastScrollFrameAt = 0;

      if (state.appearance?.performanceMode) {
        updatePlaybackIndicators(false);
      } else {
        updateWordState(false);
      }

      runPromptWaitPause(waitCard).then((completed) => {
        if (completed && isPlaying && !isPaused && getActiveMode() === "scroll") {
          lastScrollFrameAt = 0;
          playScrollMode();
        }
      }).catch(console.error);
      return;
    }

    if (state.appearance?.performanceMode) {
      updatePlaybackIndicators(false);
    } else {
      updateWordState(false);
    }

    if (scrollProgress >= 1) {
      finishPlayback();
      return;
    }

    scrollAnimationFrame = requestAnimationFrame(step);
  };

  scrollAnimationFrame = requestAnimationFrame(step);
}

function movePlaybackByLine(direction, options = {}) {
  if (wordNodes.length === 0 || lineGroups.length === 0) {
    return false;
  }

  const { allowVoiceModeBackward = false } = options;
  const activeMode = getActiveMode();

  if (activeMode === "arrow" && isPlaying && !isPaused) {
    stepArrowMode(direction);
    return true;
  }

  const activeLineIndex = lineIndexByWord[currentIndex] ?? 0;
  const nextLineIndex = clamp(activeLineIndex + direction, 0, Math.max(lineGroups.length - 1, 0));
  const nextLine = lineGroups[nextLineIndex];
  if (!nextLine) {
    return false;
  }

  if (activeMode === "voice") {
    if (direction < 0 && !allowVoiceModeBackward) {
      return false;
    }

    currentIndex = nextLine.firstIndex;
    updateWordState(true);
    return true;
  }

  jumpToIndex(nextLine.firstIndex);
  return true;
}

function getPlaybackVerticalArrowMode() {
  if (wordNodes.length === 0 || lineGroups.length === 0) {
    return "";
  }

  const activeMode = getActiveMode();
  if (activeMode === "arrow") {
    return isPlaying && !isPaused ? "arrow" : "";
  }

  if ((isPlaying || isPaused) && ["voice", "line", "scroll"].includes(activeMode)) {
    return activeMode;
  }

  return "";
}

function stepPlaybackWithVerticalArrow(direction) {
  const activeMode = getPlaybackVerticalArrowMode();
  if (!activeMode) {
    return false;
  }

  if (activeMode === "voice") {
    return movePlaybackByLine(direction, { allowVoiceModeBackward: true });
  }

  if (activeMode === "line" || activeMode === "scroll") {
    stepPlaybackLine(direction);
    return true;
  }

  if (activeMode === "arrow") {
    stepArrowMode(direction);
    return true;
  }

  return false;
}

function stopPlaybackArrowHold() {
  if (playbackArrowHoldFrame) {
    cancelAnimationFrame(playbackArrowHoldFrame);
    playbackArrowHoldFrame = null;
  }

  playbackArrowHoldDirection = 0;
  playbackArrowHoldMode = "";
  playbackArrowHoldStartedAt = 0;
  playbackArrowHoldLastStepAt = 0;
}

function tickPlaybackArrowHold(now) {
  playbackArrowHoldFrame = null;

  if (!playbackArrowHoldDirection) {
    return;
  }

  const activeMode = getPlaybackVerticalArrowMode();
  if (!activeMode || activeMode !== playbackArrowHoldMode) {
    stopPlaybackArrowHold();
    return;
  }

  if (!playbackArrowHoldStartedAt) {
    playbackArrowHoldStartedAt = now;
    playbackArrowHoldLastStepAt = now;
  }

  const heldMs = now - playbackArrowHoldStartedAt;
  if (heldMs >= PLAYBACK_ARROW_HOLD_INITIAL_DELAY_MS) {
    const acceleratedMs = heldMs - PLAYBACK_ARROW_HOLD_INITIAL_DELAY_MS;
    const accelerationRatio = Math.min(acceleratedMs / PLAYBACK_ARROW_HOLD_ACCELERATION_MS, 1);
    const nextInterval = PLAYBACK_ARROW_HOLD_BASE_INTERVAL_MS
      - ((PLAYBACK_ARROW_HOLD_BASE_INTERVAL_MS - PLAYBACK_ARROW_HOLD_MIN_INTERVAL_MS) * accelerationRatio);

    if (now - playbackArrowHoldLastStepAt >= nextInterval) {
      const didStep = stepPlaybackWithVerticalArrow(playbackArrowHoldDirection);
      playbackArrowHoldLastStepAt = now;

      if (!didStep) {
        stopPlaybackArrowHold();
        return;
      }
    }
  }

  playbackArrowHoldFrame = requestAnimationFrame(tickPlaybackArrowHold);
}

function startPlaybackArrowHold(direction) {
  const activeMode = getPlaybackVerticalArrowMode();
  if (!activeMode) {
    return false;
  }

  if (playbackArrowHoldDirection !== direction || playbackArrowHoldMode !== activeMode) {
    stopPlaybackArrowHold();
    playbackArrowHoldDirection = direction;
    playbackArrowHoldMode = activeMode;
  }

  if (!playbackArrowHoldFrame) {
    playbackArrowHoldFrame = requestAnimationFrame(tickPlaybackArrowHold);
  }

  return true;
}

function handlePlaybackHotkeyRelease(event) {
  if ((event.key === "ArrowDown" && playbackArrowHoldDirection > 0)
    || (event.key === "ArrowUp" && playbackArrowHoldDirection < 0)) {
    stopPlaybackArrowHold();
  }
}

function beginArrowMode() {
  isPlaying = true;
  isPaused = false;
  setReadingMode(true);
  syncPromptLayout();
  updateWordState(true);
}

function applyLocaleVoiceNormalization(text, locale) {
  let normalized = String(text || "");

  if (/^ar\b/i.test(locale)) {
    normalized = normalized
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
      .replace(/ـ/gu, "")
      .replace(/[أإآٱ]/gu, "ا")
      .replace(/[ؤئ]/gu, (character) => (character === "ؤ" ? "و" : "ي"))
      .replace(/ى/gu, "ي")
      .replace(/ة/gu, "ه");
  }

  if (/^de\b/i.test(locale)) {
    normalized = normalized.replace(/ß/gu, "ss");
  }

  return normalized;
}

function resetVoiceCommandGuard() {
  lastVoiceCommandKey = "";
  lastVoiceCommandAt = 0;
  lastVoiceCommandAction = "";
  lastVoiceCommandActionAt = 0;
}

function resetVoiceCommandTranscript() {
  voiceCommandTranscript = "";
}

function clearVoiceWakeState(options = {}) {
  const { hideOverlay = true } = options;
  voiceWakeActiveUntil = 0;
  voiceWakeAwaitingFollowup = false;
  resetVoiceCommandTranscript();

  if (voiceWakeOverlayTimer) {
    clearTimeout(voiceWakeOverlayTimer);
    voiceWakeOverlayTimer = null;
  }

  updateVoiceCommandIndicator();
}

function hideVoiceWakeOverlay() {
  if (voiceWakeOverlayTimer) {
    clearTimeout(voiceWakeOverlayTimer);
    voiceWakeOverlayTimer = null;
  }
}

function showVoiceWakeOverlay(durationMs = VOICE_WAKE_VISUAL_MS) {
  if (voiceWakeOverlayTimer) {
    clearTimeout(voiceWakeOverlayTimer);
  }

  voiceWakeOverlayTimer = window.setTimeout(() => {
    voiceWakeOverlayTimer = null;
    if (!isVoiceWakeActive()) {
      updateVoiceCommandIndicator();
    }
  }, Math.max(durationMs, voiceWakeActiveUntil - performance.now(), 0));
}

function activateVoiceWake(options = {}) {
  const { awaitFollowup = true } = options;
  const now = performance.now();
  const nextWakeDeadline = now + VOICE_WAKE_COMMAND_WINDOW_MS;
  resetVoiceCommandTranscript();

  if (now - lastVoiceWakeAt < VOICE_WAKE_COOLDOWN_MS) {
    voiceWakeActiveUntil = nextWakeDeadline;
    voiceWakeAwaitingFollowup = awaitFollowup;
    showVoiceWakeOverlay(VOICE_WAKE_COMMAND_WINDOW_MS);
    updateVoiceCommandIndicator();
    return;
  }

  voiceWakeActiveUntil = nextWakeDeadline;
  voiceWakeAwaitingFollowup = awaitFollowup;
  lastVoiceWakeAt = now;
  showVoiceWakeOverlay(VOICE_WAKE_COMMAND_WINDOW_MS);
  updateVoiceCommandIndicator();
}

function isVoiceWakeActive() {
  const active = performance.now() < voiceWakeActiveUntil;
  if (!active) {
    voiceWakeAwaitingFollowup = false;
  }
  return active;
}

function appendVoiceCommandTranscript(text, languageTag = getVoiceCommandLanguageTag()) {
  const nextTokens = tokenizeNormalizedText(`${voiceCommandTranscript} ${text}`, languageTag);
  voiceCommandTranscript = nextTokens.slice(-VOICE_COMMAND_BUFFER_TOKEN_LIMIT).join(" ");
}

function getRecognitionResultTranscripts(result) {
  if (!result) {
    return [];
  }

  return Array.from(result)
    .map((alternative) => alternative?.transcript?.trim())
    .filter(Boolean);
}

function handleBrowserSpeechRecognitionResult(event) {
  if (!event?.results) {
    return { handled: false, consumed: false };
  }

  for (let index = event.resultIndex || 0; index < event.results.length; index += 1) {
    const result = event.results[index];
    if (!result) {
      continue;
    }

    const transcripts = getRecognitionResultTranscripts(result);
    const primaryConfidence = Number(result[0]?.confidence);
    const confidence = Number.isFinite(primaryConfidence) && primaryConfidence > 0 ? primaryConfidence : 1;

    for (const transcript of transcripts) {
      const outcome = handleOfflineVoiceCommandTranscript(transcript, {
        isFinal: Boolean(result.isFinal),
        confidence,
        wakeConfidence: confidence
      });

      if (outcome.handled || outcome.consumed) {
        return outcome;
      }
    }
  }

  return { handled: false, consumed: false };
}

function findVoiceCommandInTranscripts(transcripts, transcriptPrefix = "") {
  for (const transcript of transcripts) {
    const directMatch = extractVoiceCommand(transcript);
    if (directMatch) {
      return directMatch;
    }

    if (transcriptPrefix) {
      const bufferedMatch = extractVoiceCommand(`${transcriptPrefix} ${transcript}`.trim());
      if (bufferedMatch) {
        return bufferedMatch;
      }
    }
  }

  return null;
}

function findVoiceCommandInResultWindow(results, resultStart = 0, transcriptPrefix = "") {
  const mergedTranscripts = [];

  for (let i = resultStart; i < results.length; i += 1) {
    const transcripts = getRecognitionResultTranscripts(results[i]);
    const directMatch = findVoiceCommandInTranscripts(transcripts, transcriptPrefix);
    if (directMatch) {
      return directMatch;
    }

    if (transcripts[0]) {
      mergedTranscripts.push(transcripts[0]);
    }
  }

  if (mergedTranscripts.length === 0) {
    return null;
  }

  const mergedTranscript = mergedTranscripts.join(" ").trim();
  if (!mergedTranscript) {
    return null;
  }

  return extractVoiceCommand(mergedTranscript)
    || (transcriptPrefix ? extractVoiceCommand(`${transcriptPrefix} ${mergedTranscript}`.trim()) : null);
}

function getVoiceCommandAction(phrase, languageTag = getVoiceCommandLanguageTag()) {
  for (const [action, aliases] of getVoiceActionEntries(languageTag)) {
    if (aliases.includes(phrase)) {
      return action;
    }
  }

  return null;
}

function isVoiceGreetingToken(token, languageTag = getVoiceCommandLanguageTag()) {
  if (!token) {
    return false;
  }

  const config = getActiveVoiceConfig(languageTag);
  return config.greetings.some((greeting) => isVoiceAliasTokenFuzzyMatch(token, greeting));
}

function isVoiceWakeToken(token, languageTag = getVoiceCommandLanguageTag()) {
  if (!token) {
    return false;
  }

  const config = getActiveVoiceConfig(languageTag);

  if (config.wake.includes(token)) {
    return true;
  }

  return token.startsWith("flo");
}

function isVoiceWakeSequence(tokens, index, languageTag = getVoiceCommandLanguageTag()) {
  return isVoiceGreetingToken(tokens[index], languageTag) && isVoiceWakeToken(tokens[index + 1], languageTag);
}

function findVoiceWakeMatch(tokens, languageTag = getVoiceCommandLanguageTag()) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return null;
  }

  const startIndex = Math.max(tokens.length - VOICE_COMMAND_LOOKBACK_TOKENS, 0);
  for (let index = startIndex; index < tokens.length - 1; index += 1) {
    if (isVoiceWakeSequence(tokens, index, languageTag)) {
      return {
        index,
        length: 2
      };
    }
  }

  for (let index = startIndex; index < tokens.length; index += 1) {
    if (isVoiceWakeToken(tokens[index], languageTag)) {
      return {
        index,
        length: 1
      };
    }
  }

  return null;
}

function findVoiceWakeIndex(tokens, languageTag = getVoiceCommandLanguageTag()) {
  return findVoiceWakeMatch(tokens, languageTag)?.index ?? -1;
}

function hasVoiceWakePhrase(text, languageTag = getVoiceCommandLanguageTag()) {
  const tokens = tokenizeNormalizedText(text, languageTag);
  return Boolean(findVoiceWakeMatch(tokens, languageTag));
}

function getVoiceCommandActionFuzzy(phrase, languageTag = getVoiceCommandLanguageTag()) {
  for (const [action, aliases] of getVoiceActionEntries(languageTag)) {
    if (aliases.some((alias) => phrase === alias || phrase.startsWith(alias) || alias.startsWith(phrase))) {
      return action;
    }
  }

  return null;
}

function isVoiceAliasTokenMatch(spokenToken, aliasToken) {
  if (!spokenToken || !aliasToken) {
    return false;
  }

  if (spokenToken === aliasToken) {
    return true;
  }

  if (spokenToken.length >= 3 && aliasToken.length >= 3) {
    return spokenToken.startsWith(aliasToken) || aliasToken.startsWith(spokenToken);
  }

  return false;
}

function getVoiceTokenEditDistance(left, right) {
  const a = String(left || "");
  const b = String(right || "");

  if (!a) {
    return b.length;
  }

  if (!b) {
    return a.length;
  }

  const rows = Array.from({ length: a.length + 1 }, (_, index) => index);

  for (let column = 1; column <= b.length; column += 1) {
    let diagonal = rows[0];
    rows[0] = column;

    for (let row = 1; row <= a.length; row += 1) {
      const previous = rows[row];
      const substitutionCost = a[row - 1] === b[column - 1] ? 0 : 1;
      rows[row] = Math.min(
        rows[row] + 1,
        rows[row - 1] + 1,
        diagonal + substitutionCost
      );
      diagonal = previous;
    }
  }

  return rows[a.length];
}

function isVoiceAliasTokenFuzzyMatch(spokenToken, aliasToken) {
  if (isVoiceAliasTokenMatch(spokenToken, aliasToken)) {
    return true;
  }

  if (!spokenToken || !aliasToken) {
    return false;
  }

  const maxLength = Math.max(spokenToken.length, aliasToken.length);
  if (maxLength < 4) {
    return false;
  }

  const distance = getVoiceTokenEditDistance(spokenToken, aliasToken);
  return distance <= (maxLength >= 8 ? 2 : 1);
}

function getVoiceCommandActionFromTokens(candidateTokens, languageTag = getVoiceCommandLanguageTag()) {
  for (const [action, aliases] of getVoiceActionEntries(languageTag)) {
    for (const alias of aliases) {
      const aliasTokens = alias.split(" ");
      if (aliasTokens.length > candidateTokens.length) {
        continue;
      }

      const requiresExactSingleTokenMatch = (
        aliasTokens.length === 1
        && VOICE_COMMAND_EXACT_SINGLE_TOKEN_ACTIONS.has(action)
      );
      const matches = aliasTokens.every((aliasToken, index) => {
        const candidateToken = candidateTokens[index];
        return requiresExactSingleTokenMatch
          ? candidateToken === aliasToken
          : isVoiceAliasTokenFuzzyMatch(candidateToken, aliasToken);
      });
      if (!matches) {
        continue;
      }

      return {
        action,
        matchedPhrase: candidateTokens.slice(0, aliasTokens.length).join(" ")
      };
    }
  }

  const exactSingleTokenAction = getVoiceCommandAction(candidateTokens[0], languageTag);
  if (exactSingleTokenAction) {
    return {
      action: exactSingleTokenAction,
      matchedPhrase: candidateTokens[0]
    };
  }

  const fuzzySingleTokenAction = getVoiceCommandActionFuzzy(candidateTokens[0], languageTag);
  if (fuzzySingleTokenAction && !VOICE_COMMAND_EXACT_SINGLE_TOKEN_ACTIONS.has(fuzzySingleTokenAction)) {
    return {
      action: fuzzySingleTokenAction,
      matchedPhrase: candidateTokens[0]
    };
  }

  return null;
}

function collectVoiceCommandCandidateTokens(tokens, startIndex, languageTag = getVoiceCommandLanguageTag(), options = {}) {
  const collected = [];
  const fillerTokens = getVoiceCommandFillerTokens(languageTag);
  const { ignoreWakeTokens = false } = options;

  for (let index = startIndex; index < tokens.length && collected.length < 4; index += 1) {
    const token = tokens[index];
    if (!token || fillerTokens.has(token)) {
      continue;
    }

    if (ignoreWakeTokens && (isVoiceGreetingToken(token, languageTag) || isVoiceWakeToken(token, languageTag))) {
      continue;
    }

    collected.push(token);
  }

  return collected;
}

function extractVoiceCommandWithoutWake(text, languageTag = getVoiceCommandLanguageTag()) {
  const tokens = tokenizeNormalizedText(text, languageTag);
  if (tokens.length === 0) {
    return null;
  }

  const candidateTokens = collectVoiceCommandCandidateTokens(tokens, 0, languageTag, {
    ignoreWakeTokens: true
  });
  const match = getVoiceCommandActionFromTokens(candidateTokens, languageTag);
  if (!match) {
    return null;
  }

  return {
    action: match.action,
    phrase: `${getVoiceWakePhrase(languageTag)} ${match.matchedPhrase}`
  };
}

function hasSpeechRecognitionSupport() {
  return false;
}

function getVoskResultText(message) {
  return String(message?.result?.text || "").trim();
}

function getVoskResultWords(message) {
  return Array.isArray(message?.result?.result) ? message.result.result : [];
}

function getAverageVoskWordConfidence(words = []) {
  const validConfidences = words
    .map((word) => Number(word?.conf))
    .filter((confidence) => Number.isFinite(confidence) && confidence >= 0);

  if (validConfidences.length === 0) {
    return 0;
  }

  return validConfidences.reduce((sum, confidence) => sum + confidence, 0) / validConfidences.length;
}

function getWakePhraseConfidence(message, languageTag = getVoiceCommandLanguageTag()) {
  const words = getVoskResultWords(message);
  if (words.length < 2) {
    return 0;
  }

  const normalizedWords = words.map((word) => ({
    token: tokenizeNormalizedText(word?.word || "", languageTag)[0] || "",
    conf: Number(word?.conf)
  }));

  for (let index = 0; index < normalizedWords.length; index += 1) {
    if (isVoiceWakeToken(normalizedWords[index]?.token, languageTag)) {
      const previousWord = normalizedWords[index - 1];
      if (previousWord && isVoiceGreetingToken(previousWord.token, languageTag)) {
        const relevantWords = [previousWord, normalizedWords[index]];
        return getAverageVoskWordConfidence(relevantWords);
      }
    }
  }

  return 0;
}

function hasOfflineVoiceCommandSupport() {
  return Boolean(invoke);
}

function getOfflineVoiceCommandGrammar(languageTag = getVoiceCommandLanguageTag()) {
  const wakePhrase = getVoiceWakePhrase(languageTag);
  const wakeTokens = getActiveVoiceConfig(languageTag).wake || [];
  const commandAliases = getVoiceActionEntries(languageTag).flatMap(([, aliases]) => aliases);
  const grammarPhrases = Array.from(new Set([
    wakePhrase,
    ...wakeTokens,
    ...commandAliases,
    ...commandAliases.map((alias) => `${wakePhrase} ${alias}`),
    ...commandAliases.flatMap((alias) => wakeTokens.map((wakeToken) => `${wakeToken} ${alias}`))
  ]));

  return JSON.stringify([...grammarPhrases, "[unk]"]);
}

function shouldBlockVoiceCommandRecognition(error) {
  const message = String(error?.message || error || "").trim();
  return /permission|denied|notallowederror|missing vosk model|failed to fetch|networkerror|asset|no microphone|microphone unavailable|failed to start microphone capture|failed to activate microphone capture/i.test(message);
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

async function ensureOfflineVoiceCommandModel(languageTag = getVoiceLanguageTag()) {
  const normalizedLanguage = normalizeVoiceLanguage(languageTag);
  const modelId = getSelectedVoiceModelId(normalizedLanguage);
  const cacheKey = getVoiceModelStatusCacheKey(normalizedLanguage, modelId);

  if (voiceModels.has(cacheKey)) {
    return voiceModels.get(cacheKey);
  }

  if (voiceModelPromises.has(cacheKey)) {
    return voiceModelPromises.get(cacheKey);
  }

  if (!hasOfflineVoiceCommandSupport()) {
    return null;
  }

  const modelUrl = await getVoiceModelSourceUrl(normalizedLanguage, {
    modelId,
    preferBundledEnglish: normalizedLanguage === ENGLISH_VOICE_LANGUAGE
  });
  if (!modelUrl) {
    return null;
  }

  const modelPromise = window.Vosk.createModel(modelUrl, -1)
    .then((model) => {
      voiceModels.set(cacheKey, model);
      voiceModelPromises.delete(cacheKey);
      isVoiceCommandRecognitionBlocked = false;
      return model;
    })
    .catch((error) => {
      console.error("Offline voice command model failed to load", error);
      isVoiceCommandRecognitionBlocked = true;
      voiceModels.delete(cacheKey);
      voiceModelPromises.delete(cacheKey);
      throw error;
    });

  voiceModelPromises.set(cacheKey, modelPromise);
  return modelPromise;
}

function releaseOfflineVoiceModel(languageTag = getVoiceLanguageTag()) {
  const normalizedLanguage = normalizeVoiceLanguage(languageTag);
  const model = voiceModels.get(normalizedLanguage);

  if (model?.terminate) {
    try {
      model.terminate();
    } catch (error) {
      console.error("Offline voice model termination failed", error);
    }
  }

  voiceModels.delete(normalizedLanguage);
  voiceModelPromises.delete(normalizedLanguage);
}

function releaseUnusedVoiceModels(keepLanguages = []) {
  const keepSet = new Set(Array.from(keepLanguages, (language) => normalizeVoiceLanguage(language)).filter(Boolean));

  for (const language of voiceModels.keys()) {
    if (!keepSet.has(language)) {
      releaseOfflineVoiceModel(language);
    }
  }
}

async function resumeOfflineVoiceCommandAudioContext() {
  if (!voiceCommandAudioContext || voiceCommandAudioContext.state !== "suspended") {
    return;
  }

  try {
    await voiceCommandAudioContext.resume();
  } catch (error) {
    // Resume may require a user gesture in some webviews.
  }
}

async function ensureVoiceCaptureWorklet(audioContext) {
  if (!audioContext?.audioWorklet?.addModule) {
    return false;
  }

  if (!voiceCaptureWorkletModulePromises.has(audioContext)) {
    const modulePromise = audioContext.audioWorklet.addModule(VOICE_CAPTURE_WORKLET_URL)
      .then(() => true)
      .catch((error) => {
        console.error("Voice capture worklet failed to load", error);
        voiceCaptureWorkletModulePromises.delete(audioContext);
        return false;
      });

    voiceCaptureWorkletModulePromises.set(audioContext, modulePromise);
  }

  return voiceCaptureWorkletModulePromises.get(audioContext);
}

async function createVoiceCaptureNode(audioContext, mediaStream, onSamples, options = {}) {
  const {
    soundInputSettings = getSoundInputSettings(),
    preferScriptProcessor = false
  } = options;
  const sourceNode = audioContext.createMediaStreamSource(mediaStream);
  const silenceNode = audioContext.createGain();
  silenceNode.gain.value = 0;

  const workletReady = !preferScriptProcessor && await ensureVoiceCaptureWorklet(audioContext);
  if (workletReady && typeof AudioWorkletNode !== "undefined") {
    const processorNode = new AudioWorkletNode(audioContext, "flow-voice-capture", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      channelCount: 1,
      channelCountMode: "explicit",
      channelInterpretation: "speakers"
    });

    processorNode.port.onmessage = (event) => {
      const samples = event.data;
      if (!samples || !onSamples) {
        return;
      }

      onSamples(processVoiceCaptureSamples(samples, soundInputSettings), audioContext.sampleRate);
    };

    sourceNode.connect(processorNode);
    processorNode.connect(silenceNode);
    silenceNode.connect(audioContext.destination);

    return {
      sourceNode,
      processorNode,
      silenceNode,
      usingWorklet: true
    };
  }

  const processorNode = audioContext.createScriptProcessor(VOSK_SCRIPT_PROCESSOR_FALLBACK_BUFFER_SIZE, 1, 1);
  processorNode.onaudioprocess = (event) => {
    const samples = event.inputBuffer?.getChannelData?.(0);
    if (!samples || !onSamples) {
      return;
    }

    const copy = new Float32Array(samples.length);
    copy.set(samples);
    onSamples(processVoiceCaptureSamples(copy, soundInputSettings), event.inputBuffer.sampleRate);
  };

  sourceNode.connect(processorNode);
  processorNode.connect(silenceNode);
  silenceNode.connect(audioContext.destination);

  return {
    sourceNode,
    processorNode,
    silenceNode,
    usingWorklet: false
  };
}

function isVoiceCommandRecognizerActive() {
  return Boolean(
    voiceCommandRecognition
      && (
        voiceCommandRecognition.engine === "native"
        || voiceCommandRecognition.engine === "pending"
        || voiceCommandRecognition.engine === "web-speech"
        || voiceCommandSharedWithTracking
        || (voiceCommandMediaStream && voiceCommandAudioContext)
      )
  );
}

function createVoiceCommandRecognizer(model, sampleRate, languageTag = getVoiceCommandLanguageTag()) {
  const recognizer = new model.KaldiRecognizer(sampleRate);
  recognizer.setWords(true);
  recognizer.on("partialresult", (message) => {
    handleOfflineVoiceCommandTranscript(message?.result?.partial, {
      isFinal: false,
      confidence: 1,
      wakeConfidence: 1,
    });
  });
  recognizer.on("result", (message) => {
    handleOfflineVoiceCommandTranscript(getVoskResultText(message), {
      isFinal: true,
      confidence: getAverageVoskWordConfidence(getVoskResultWords(message)),
      wakeConfidence: getWakePhraseConfidence(message, languageTag)
    });
  });

  return recognizer;
}

function acceptVoiceCommandSamples(samples, sampleRate) {
  if (!voiceCommandRecognition?.acceptWaveformFloat || !samples?.length) {
    return;
  }

  lastVoiceCommandAudioProcessAt = performance.now();

  try {
    voiceCommandRecognition.acceptWaveformFloat(samples, sampleRate);
  } catch (error) {
    console.error("Offline voice command audio processing failed", error);
  }
}

async function attachVoiceCommandRecognizerToTracking(sampleRate) {
  const shouldAttachDuringTracking = shouldEnableVoiceCommandListener() || (isPlaying && getActiveMode() === "voice");
  if (!shouldAttachDuringTracking) {
    return;
  }

  if (voiceCommandSharedWithTracking && voiceCommandRecognition?.acceptWaveformFloat) {
    return;
  }

  const languageTag = getVoiceCommandLanguageTag();
  const model = await ensureOfflineVoiceCommandModel(languageTag);
  if (!model || !(shouldEnableVoiceCommandListener() || (isPlaying && getActiveMode() === "voice"))) {
    return;
  }

  if (voiceCommandRecognition && !voiceCommandSharedWithTracking) {
    await stopVoiceCommandListener({ preserveModel: true });
  }

  voiceCommandRecognition = createVoiceCommandRecognizer(model, sampleRate, languageTag);
  voiceCommandSharedWithTracking = true;
  lastVoiceCommandAudioProcessAt = performance.now();
  isVoiceCommandRecognitionBlocked = false;
  updateVoiceCommandIndicator();
}

function installOfflineVoiceCommandResumeListeners() {
  if (voiceCommandResumeListenersInstalled) {
    return;
  }

  voiceCommandResumeListenersInstalled = true;
  const tryResume = async () => {
    await resumeOfflineVoiceCommandAudioContext();

    if (!voiceCommandAudioContext || voiceCommandAudioContext.state === "running") {
      window.removeEventListener("pointerdown", tryResume, true);
      window.removeEventListener("keydown", tryResume, true);
      window.removeEventListener("touchstart", tryResume, true);
      voiceCommandResumeListenersInstalled = false;
    }
  };

  window.addEventListener("pointerdown", tryResume, true);
  window.addEventListener("keydown", tryResume, true);
  window.addEventListener("touchstart", tryResume, true);
}

function handleOfflineVoiceCommandTranscript(text, options = {}) {
  const transcript = String(text || "").trim();
  if (!transcript) {
    return { handled: false, consumed: false };
  }

  const languageTag = getVoiceCommandLanguageTag();

  const {
    isFinal = false,
    confidence = 0,
    wakeConfidence = 0
  } = options;
  const wakePhraseDetected = hasVoiceWakePhrase(transcript, languageTag);
  const wakeInTranscript = wakePhraseDetected && (!isFinal || wakeConfidence >= VOICE_WAKE_MIN_CONFIDENCE || wakePhraseDetected);
  const wakeActive = isVoiceWakeActive();
  const command = extractVoiceCommand(transcript, languageTag);
  const bufferedFollowupTranscript = wakeActive && voiceWakeAwaitingFollowup
    ? `${voiceCommandTranscript} ${transcript}`.trim()
    : "";
  const followupCommand = wakeActive && voiceWakeAwaitingFollowup
    ? extractVoiceCommandWithoutWake(bufferedFollowupTranscript || transcript, languageTag)
    : null;

  if (!isFinal) {
    if (wakeInTranscript && !command) {
      activateVoiceWake({ awaitFollowup: true });
      return { handled: false, consumed: true };
    }

    if (wakeInTranscript && command && processVoiceCommand(command)) {
      clearVoiceWakeState();
      return { handled: true, consumed: true };
    }

    if (followupCommand && processVoiceCommand(followupCommand)) {
      clearVoiceWakeState();
      return { handled: true, consumed: true };
    }

    return { handled: false, consumed: false };
  }

  if (wakeInTranscript && !command) {
    activateVoiceWake({ awaitFollowup: true });
    return { handled: false, consumed: true };
  }

  if (command && wakeInTranscript && processVoiceCommand(command)) {
    clearVoiceWakeState();
    return { handled: true, consumed: true };
  }

  if (followupCommand && processVoiceCommand(followupCommand)) {
    clearVoiceWakeState();
    return { handled: true, consumed: true };
  }

  if (isFinal && wakeActive && voiceWakeAwaitingFollowup) {
    appendVoiceCommandTranscript(transcript, languageTag);
    return { handled: false, consumed: true };
  }

  return { handled: false, consumed: false };
}

function disconnectOfflineVoiceCommandAudioGraph() {
  if (voiceCommandSourceNode) {
    try {
      voiceCommandSourceNode.disconnect();
    } catch (error) {
      // Node already disconnected.
    }
    voiceCommandSourceNode = null;
  }

  if (voiceCommandProcessorNode) {
    try {
      voiceCommandProcessorNode.disconnect();
    } catch (error) {
      // Node already disconnected.
    }
    if (voiceCommandProcessorNode.port) {
      voiceCommandProcessorNode.port.onmessage = null;
    }
    voiceCommandProcessorNode.onaudioprocess = null;
    voiceCommandProcessorNode = null;
  }

  if (voiceCommandSilenceNode) {
    try {
      voiceCommandSilenceNode.disconnect();
    } catch (error) {
      // Node already disconnected.
    }
    voiceCommandSilenceNode = null;
  }
}

async function disposeOfflineVoiceCommandAudioContext() {
  if (!voiceCommandAudioContext) {
    return;
  }

  const currentAudioContext = voiceCommandAudioContext;
  voiceCommandAudioContext = null;
  try {
    await currentAudioContext.close();
  } catch (error) {
    // Audio context is already closed.
  }

  voiceCommandResumeListenersInstalled = false;
}

function shouldEnableVoiceCommandListener() {
  return Boolean(state.appearance?.appWideVoiceCommands);
}

function getVoiceCommandErrorMessage(error) {
  const message = String(error?.message || error || "").trim();
  if (!message) {
    return "Voice commands unavailable";
  }

  if (error?.code === VOICE_CAPTURE_ERROR_NO_DEVICE) {
    return "Voice commands unavailable: no microphone detected";
  }

  if (error?.code === VOICE_CAPTURE_ERROR_UNAVAILABLE) {
    return "Voice commands unavailable: microphone unavailable";
  }

  if (/permission|denied|notallowederror/i.test(message)) {
    return "Voice commands blocked: microphone permission denied";
  }

  if (/missing vosk model/i.test(message)) {
    return message;
  }

  if (/offline voice command model failed to load|failed to fetch|networkerror|asset/i.test(message)) {
    return "Voice commands blocked: English model failed to load";
  }

  return `Voice commands blocked: ${message}`;
}

function updateVoiceCommandStatusLabel() {
  if (!ui.statusLabel || isPlaying) {
    return;
  }

  if (!shouldEnableVoiceCommandListener()) {
    return;
  }

  if (isVoiceCommandRecognitionBlocked && lastVoiceCommandError) {
    ui.statusLabel.textContent = lastVoiceCommandError;
  }
}

function updateVoiceCommandIndicator() {
  if (!ui.voiceCommandIndicator) {
    return;
  }

  const enabled = (
    shouldEnableVoiceCommandListener()
    || isVoiceCommandRecognizerActive()
    || isVoiceCommandRecognitionStarting
    || isVoiceWakeActive()
    || voiceCommandSharedWithTracking
    || (isPlaying && getActiveMode() === "voice")
  );
  const active = isVoiceCommandRecognizerActive();
  const wakeActive = isVoiceWakeActive();
  const stateLabel = !enabled
    ? "off"
    : isVoiceCommandRecognitionBlocked
      ? "blocked"
      : wakeActive
        ? "wake"
        : active
          ? "listening"
          : "starting";

  ui.voiceCommandIndicator.classList.toggle("hidden", !enabled);
  ui.voiceCommandIndicator.dataset.state = stateLabel;
  const description = stateLabel === "blocked" && lastVoiceCommandError
    ? lastVoiceCommandError
    : `Voice commands: ${stateLabel}`;
  ui.voiceCommandIndicator.title = description;
  ui.voiceCommandIndicator.setAttribute("aria-label", description);
  updateVoiceCommandStatusLabel();
}

function extractVoiceCommand(text, languageTag = getVoiceCommandLanguageTag()) {
  const tokens = tokenizeNormalizedText(text, languageTag);
  if (tokens.length < 2) {
    return null;
  }

  const wakeMatch = findVoiceWakeMatch(tokens, languageTag);
  if (!wakeMatch) {
    return null;
  }

  const candidateTokens = collectVoiceCommandCandidateTokens(tokens, wakeMatch.index + wakeMatch.length, languageTag, {
    ignoreWakeTokens: true
  });
  const match = getVoiceCommandActionFromTokens(candidateTokens, languageTag);
  if (match) {
    return {
      action: match.action,
      phrase: `${getVoiceWakePhrase(languageTag)} ${match.matchedPhrase}`
    };
  }

  return null;
}

function shouldHandleVoiceCommand(command) {
  if (!command) {
    return false;
  }

  const now = performance.now();
  if (now < voiceCommandCooldownUntil) {
    return false;
  }

  const key = `${command.action}:${command.phrase}`;
  if (key === lastVoiceCommandKey && now - lastVoiceCommandAt < VOICE_COMMAND_REPEAT_GUARD_MS) {
    return false;
  }

  if (
    VOICE_COMMAND_ACTION_DEDUPE_ACTIONS.has(command.action)
    && command.action === lastVoiceCommandAction
    && now - lastVoiceCommandActionAt < VOICE_COMMAND_ACTION_REPEAT_GUARD_MS
  ) {
    return false;
  }

  lastVoiceCommandKey = key;
  lastVoiceCommandAt = now;
  lastVoiceCommandAction = command.action;
  lastVoiceCommandActionAt = now;
  return true;
}

function playVoiceCommandFallbackTone() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  if (!voiceCommandFallbackAudioContext) {
    voiceCommandFallbackAudioContext = new AudioContextClass();
  }

  const context = voiceCommandFallbackAudioContext;
  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = context.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, startAt);
  oscillator.frequency.exponentialRampToValueAtTime(1320, startAt + 0.12);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.18);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + 0.18);
}

function playVoiceCommandRecognitionSound(command = null) {
  const now = performance.now();
  const soundKey = command?.action || command?.phrase || "voice-command";
  if (soundKey === lastVoiceCommandSoundKey && now - lastVoiceCommandSoundAt < VOICE_COMMAND_SOUND_REPEAT_GUARD_MS) {
    return;
  }

  lastVoiceCommandSoundKey = soundKey;
  lastVoiceCommandSoundAt = now;

  if (!voiceCommandSoundAssetAvailable) {
    playVoiceCommandFallbackTone();
    return;
  }

  if (!voiceCommandAudio) {
    voiceCommandAudio = new Audio(VOICE_COMMAND_SOUND_URL);
    voiceCommandAudio.preload = "auto";
    voiceCommandAudio.volume = 0.65;
    voiceCommandAudio.loop = false;
    voiceCommandAudio.addEventListener("error", () => {
      voiceCommandSoundAssetAvailable = false;
      voiceCommandAudio = null;
      playVoiceCommandFallbackTone();
    });
  }

  try {
    voiceCommandAudio.pause();
    voiceCommandAudio.currentTime = 0;
  } catch (error) {
    // Ignore audio reset issues and try to play anyway.
  }

  voiceCommandAudio.play().catch(() => {
    voiceCommandSoundAssetAvailable = false;
    voiceCommandAudio = null;
    playVoiceCommandFallbackTone();
  });
}

function beginVoiceCommandCooldown() {
  voiceCommandCooldownUntil = performance.now() + VOICE_COMMAND_COOLDOWN_MS;
}

function clearVoiceCommandRestartTimer() {
  if (voiceCommandRestartTimer) {
    clearTimeout(voiceCommandRestartTimer);
    voiceCommandRestartTimer = null;
  }
}

function scheduleVoiceCommandListenerRestart(delayMs = VOICE_COMMAND_RESTART_DELAY_MS) {
  clearVoiceCommandRestartTimer();

  if (!shouldEnableVoiceCommandListener() || isVoiceCommandRecognitionBlocked) {
    return;
  }

  const delay = Math.max(delayMs, Math.ceil(voiceCommandCooldownUntil - performance.now()), 0);
  voiceCommandRestartTimer = window.setTimeout(() => {
    voiceCommandRestartTimer = null;

    if (!shouldEnableVoiceCommandListener() || isVoiceCommandRecognitionBlocked) {
      return;
    }

    isVoiceCommandRecognitionStarting = false;
    startVoiceCommandListener();
  }, delay);
}

function processVoiceCommand(command, options = {}) {
  if (!command || !shouldHandleVoiceCommand(command)) {
    return false;
  }

  const { playSound = true } = options;
  armVoiceCommandListener();
  resetVoiceCommandTranscript();
  beginVoiceCommandCooldown();
  const handled = handleVoiceCommandAction(command.action);

  if (handled && playSound) {
    playVoiceCommandRecognitionSound(command);
  }

  return handled;
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
      setWindowPreset("drag", { isPinned: false }).catch(console.error);
      return true;
    case "top-center":
      setWindowPreset("top-center", { isPinned: true }).catch(console.error);
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
      setCollapsed(true).catch(console.error);
      return true;
    case "expand":
      setCollapsed(false).catch(console.error);
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

function ensureVoiceCommandRecognition() {
  if (!hasOfflineVoiceCommandSupport() && !hasSpeechRecognitionSupport()) {
    return null;
  }

  if (voiceCommandRecognition) {
    return voiceCommandRecognition;
  }

  voiceCommandRecognition = {
    engine: "pending"
  };

  return voiceCommandRecognition;
}

async function stopVoiceCommandListener(options = {}) {
  const { preserveError = false } = options;
  voiceCommandListenerSession += 1;
  isVoiceCommandRecognitionStarting = false;
  resetVoiceCommandTranscript();
  clearVoiceCommandRestartTimer();
  lastVoiceCommandAudioProcessAt = 0;
  clearVoiceWakeState();
  if (!preserveError) {
    lastVoiceCommandError = "";
  }

  disconnectOfflineVoiceCommandAudioGraph();

  if (voiceCommandRecognition?.engine === "native" && invoke) {
    try {
      await invoke("stop_voice_command_listener");
    } catch (error) {
      console.error("Native voice command listener failed to stop", error);
    }
  } else if (voiceCommandRecognition?.engine === "web-speech") {
    voiceCommandRecognition.onresult = null;
    voiceCommandRecognition.onerror = null;
    voiceCommandRecognition.onend = null;
    voiceCommandRecognition.onaudiostart = null;
    voiceCommandRecognition.onaudioend = null;
    try {
      voiceCommandRecognition.abort?.();
    } catch (error) {
      // Recognition is already stopped.
    }
  } else if (voiceCommandRecognition?.remove) {
    try {
      voiceCommandRecognition.remove();
    } catch (error) {
      // Recognizer already removed.
    }
  }

  voiceCommandRecognition = null;
  voiceCommandSharedWithTracking = false;
  updateVoiceCommandIndicator();

  if (voiceCommandMediaStream) {
    voiceCommandMediaStream.getTracks().forEach((track) => {
      track.enabled = false;
      track.stop();
    });
    voiceCommandMediaStream = null;
  }

  await disposeOfflineVoiceCommandAudioContext();

  updateVoiceCommandIndicator();
}

async function startVoiceCommandListener() {
  if (!shouldEnableVoiceCommandListener() || isVoiceCommandRecognitionStarting || isVoiceCommandRecognitionBlocked || performance.now() < voiceCommandCooldownUntil) {
    return;
  }

  lastVoiceCommandError = "";
  updateVoiceCommandIndicator();

  clearVoiceCommandRestartTimer();

  if (isVoiceCommandRecognizerActive()) {
    return;
  }

  const marker = ensureVoiceCommandRecognition();
  if (!marker) {
    return;
  }

  const listenerSession = ++voiceCommandListenerSession;
  isVoiceCommandRecognitionStarting = true;

  try {
    await ensureNativeVoiceEventListener();
    const languageTag = getVoiceCommandLanguageTag();
    const grammar = JSON.parse(getOfflineVoiceCommandGrammar(languageTag));
    await invoke("start_voice_command_listener", buildNativeVoicePayload(languageTag, { grammar }));
    if (!shouldEnableVoiceCommandListener() || listenerSession !== voiceCommandListenerSession) {
      await invoke("stop_voice_command_listener").catch(() => {});
      return;
    }

    voiceCommandRecognition = { engine: "native" };
    voiceCommandSharedWithTracking = Boolean(voiceRecognition);
    lastVoiceCommandAudioProcessAt = performance.now();
    isVoiceCommandRecognitionBlocked = false;
    updateVoiceCommandIndicator();
  } catch (error) {
    console.error("Native voice command listener failed to start", error);
    lastVoiceCommandError = getVoiceCommandErrorMessage(error);
    isVoiceCommandRecognitionBlocked = shouldBlockVoiceCommandRecognition(error);
    voiceCommandRecognition = null;
    voiceCommandSharedWithTracking = false;
    await stopVoiceCommandListener({ preserveError: true });
    if (!isVoiceCommandRecognitionBlocked) {
      scheduleVoiceCommandListenerRestart(VOICE_COMMAND_RESTART_DELAY_MS + 120);
    }
  } finally {
    isVoiceCommandRecognitionStarting = false;
    updateVoiceCommandIndicator();
  }
}

function syncVoiceCommandListener(options = {}) {
  const { forceReset = false } = options;

  scheduleVoiceHealthCheck(0);

  voiceCommandSyncPromise = voiceCommandSyncPromise
    .catch(() => {})
    .then(async () => {
      if (forceReset) {
        await stopVoiceCommandListener();
      }

      if (shouldEnableVoiceCommandListener()) {
        await startVoiceCommandListener();
        return;
      }

      await stopVoiceCommandListener();
    });

  return voiceCommandSyncPromise;
}

function refreshVoiceCommandListener(forceReset = false) {
  window.setTimeout(() => {
    syncVoiceCommandListener({ forceReset });
  }, 0);
}

function shouldMonitorVoiceHealth() {
  return shouldEnableVoiceCommandListener() || (isPlaying && getActiveMode() === "voice");
}

function scheduleVoiceHealthCheck(delayMs = VOICE_HEALTH_IDLE_CHECK_MS) {
  if (voiceCommandHealthTimer) {
    clearTimeout(voiceCommandHealthTimer);
  }

  voiceCommandHealthTimer = window.setTimeout(() => {
    voiceCommandHealthTimer = null;
    startVoiceCommandHealthMonitor();
  }, Math.max(delayMs, 0));
}

function startVoiceCommandHealthMonitor() {
  if (!shouldMonitorVoiceHealth()) {
    if (voiceCommandRecognition) {
      stopVoiceCommandListener().catch(console.error);
    }
    scheduleVoiceHealthCheck(VOICE_HEALTH_IDLE_CHECK_MS);
    return;
  }

  if (isPlaying && getActiveMode() === "voice" && !voiceRecognition && !isVoiceTrackingStarting) {
    playVoiceMode();
    scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
    return;
  }

  if (shouldEnableVoiceCommandListener() && !isVoiceCommandRecognitionStarting) {
    if (!isVoiceCommandRecognizerActive()) {
      syncVoiceCommandListener({ forceReset: true });
      scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
      return;
    }
  }

  scheduleVoiceHealthCheck(shouldMonitorVoiceHealth() ? VOICE_HEALTH_ACTIVE_CHECK_MS : VOICE_HEALTH_IDLE_CHECK_MS);
}

function installVoiceCommandDebugHelpers() {
  const existingDebugTools = window.__flowVoiceDebug || {};
  window.__flowVoiceDebug = {
    ...existingDebugTools,
    extractCommand(text) {
      return extractVoiceCommand(text);
    },
    simulateCommand(text, options = {}) {
      const command = extractVoiceCommand(text);
      if (!command) {
        return { ok: false, reason: "no-command" };
      }

      const handled = processVoiceCommand(command, {
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
        voiceCommandSharedWithTracking,
        voiceCommandStarting: isVoiceCommandRecognitionStarting,
        voiceCommandBlocked: isVoiceCommandRecognitionBlocked,
        lastVoiceCommandError,
        voiceCommandCooldownUntil,
        lastVoiceCommandKey,
        lastVoiceCommandAt,
        lastVoiceCommandSoundKey,
        lastVoiceCommandSoundAt
      };
    },
    resetCommands() {
      voiceCommandCooldownUntil = 0;
      lastVoiceCommandKey = "";
      lastVoiceCommandAt = 0;
      lastVoiceCommandAction = "";
      lastVoiceCommandActionAt = 0;
      lastVoiceCommandSoundKey = "";
      lastVoiceCommandSoundAt = 0;
      resetVoiceCommandTranscript();
    }
  };
}


function normalizeText(text, locale = getVoiceLanguageTag()) {
  return applyLocaleVoiceNormalization(text, locale)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase(locale)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeNormalizedText(text, locale = getVoiceLanguageTag()) {
  const normalized = normalizeText(text, locale);
  return normalized ? normalized.split(" ") : [];
}

function getNormalizedTokenIndexForWord(wordIndex, edge = "end") {
  const range = normalizedTokenRangeByWord[wordIndex];
  if (range) {
    return edge === "start" ? range.start : range.end;
  }

  const fallbackWordIndex = clamp(wordIndex, 0, Math.max(wordNodes.length - 1, 0));
  const fallbackTokenIndex = wordIndexByNormalizedToken.findIndex((index) => index >= fallbackWordIndex);
  if (fallbackTokenIndex >= 0) {
    return fallbackTokenIndex;
  }

  return Math.max(normalizedWordTokens.length - 1, 0);
}

function getWordIndexForNormalizedToken(tokenIndex) {
  if (!normalizedWordTokens.length) {
    return -1;
  }

  const safeTokenIndex = clamp(tokenIndex, 0, normalizedWordTokens.length - 1);
  return wordIndexByNormalizedToken[safeTokenIndex] ?? -1;
}

function getNormalizedTokenRangeForLine(lineIndex) {
  const line = lineGroups[lineIndex];
  if (!line) {
    return null;
  }

  let start = -1;
  let end = -1;

  for (let wordIndex = line.firstIndex; wordIndex <= line.lastIndex; wordIndex += 1) {
    const range = normalizedTokenRangeByWord[wordIndex];
    if (!range) {
      continue;
    }

    if (start < 0) {
      start = range.start;
    }

    end = range.end;
  }

  return start >= 0 && end >= start ? { start, end } : null;
}

function isStrongPartialVoiceMatch(spokenToken, scriptToken) {
  if (!spokenToken || !scriptToken) {
    return false;
  }

  if (spokenToken === scriptToken) {
    return true;
  }

  const sharedPrefixLength = (() => {
    const maxLength = Math.min(spokenToken.length, scriptToken.length);
    let length = 0;
    while (length < maxLength && spokenToken[length] === scriptToken[length]) {
      length += 1;
    }
    return length;
  })();

  if (sharedPrefixLength < 2) {
    return false;
  }

  return sharedPrefixLength / scriptToken.length >= 0.55 || sharedPrefixLength >= Math.min(4, scriptToken.length);
}

function findVoicePartialMatchIndex(spokenTokens, options = {}) {
  if (spokenTokens.length === 0 || normalizedWordTokens.length === 0) {
    return -1;
  }

  const latestToken = spokenTokens[spokenTokens.length - 1];
  if (!latestToken || latestToken.length < 2) {
    return -1;
  }

  const currentToken = normalizedWordTokens[getNormalizedTokenIndexForWord(currentIndex, "start")];
  if (isStrongPartialVoiceMatch(latestToken, currentToken)) {
    return getNormalizedTokenIndexForWord(currentIndex, "start");
  }

  const maxIndex = normalizedWordTokens.length - 1;
  const defaultStart = Math.max(getNormalizedTokenIndexForWord(currentIndex, "start"), 0);
  const searchStart = clamp(options.startIndex ?? defaultStart, 0, maxIndex);
  const defaultEnd = Math.min(searchStart + 11, maxIndex);
  const searchEnd = clamp(options.endIndex ?? defaultEnd, searchStart, maxIndex);

  for (let index = searchStart; index <= searchEnd; index += 1) {
    const candidate = normalizedWordTokens[index];
    if (!candidate || candidate.length < 2) {
      continue;
    }

    if (isStrongPartialVoiceMatch(latestToken, candidate)) {
      return index;
    }
  }

  return -1;
}

function findVoiceExactMatchIndex(spokenTokens, options = {}) {
  if (spokenTokens.length === 0 || normalizedWordTokens.length === 0) {
    return -1;
  }

  const recentSpoken = spokenTokens.slice(-8);
  const maxIndex = normalizedWordTokens.length - 1;
  const defaultStart = Math.max(getNormalizedTokenIndexForWord(Math.max(currentIndex - 1, 0), "start"), 0);
  const searchStart = clamp(options.startIndex ?? defaultStart, 0, maxIndex);
  const defaultEnd = Math.min(searchStart + 35, maxIndex);
  const searchEnd = clamp(options.endIndex ?? defaultEnd, searchStart, maxIndex);

  for (let phraseLength = Math.min(5, recentSpoken.length); phraseLength >= 1; phraseLength -= 1) {
    const spokenPhrase = recentSpoken.slice(-phraseLength).join(" ");
    if (!spokenPhrase) {
      continue;
    }

    const allowSingleWord = phraseLength === 1;
    if (allowSingleWord && spokenPhrase.length < 3) {
      continue;
    }

    for (let index = searchStart; index <= searchEnd - phraseLength + 1; index += 1) {
      const candidate = normalizedWordTokens.slice(index, index + phraseLength);
      if (candidate.some((token) => !token)) {
        continue;
      }

      if (candidate.join(" ") === spokenPhrase) {
        return index + phraseLength - 1;
      }
    }
  }

  return -1;
}

function findVoiceMatchIndex(spokenTokens, options = {}) {
  const exactMatchIndex = findVoiceExactMatchIndex(spokenTokens, options);
  if (exactMatchIndex >= 0) {
    return exactMatchIndex;
  }

  if (normalizedWordTokens.length === 0) {
    return -1;
  }

  const maxIndex = normalizedWordTokens.length - 1;
  const defaultStart = Math.max(getNormalizedTokenIndexForWord(Math.max(currentIndex - 1, 0), "start"), 0);
  const searchStart = clamp(options.startIndex ?? defaultStart, 0, maxIndex);
  const defaultEnd = Math.min(searchStart + 35, maxIndex);
  const searchEnd = clamp(options.endIndex ?? defaultEnd, searchStart, maxIndex);

  return findVoicePartialMatchIndex(spokenTokens, { startIndex: searchStart, endIndex: searchEnd });
}

function getVoiceLineWindow(radius = 3) {
  if (lineGroups.length === 0) {
    return null;
  }

  const activeLineIndex = clamp(lineIndexByWord[currentIndex] ?? 0, 0, Math.max(lineGroups.length - 1, 0));
  return {
    activeLineIndex,
    startLineIndex: Math.max(activeLineIndex - radius, 0),
    endLineIndex: Math.min(activeLineIndex + radius, lineGroups.length - 1)
  };
}

function clampVoiceTrackingMatchToAdjacentLine(match) {
  if (!match || lineGroups.length === 0) {
    return match;
  }

  const activeLineIndex = clamp(lineIndexByWord[currentIndex] ?? 0, 0, Math.max(lineGroups.length - 1, 0));
  const matchedLineIndex = clamp(match.lineIndex ?? activeLineIndex, 0, Math.max(lineGroups.length - 1, 0));
  const lineDelta = matchedLineIndex - activeLineIndex;

  if (Math.abs(lineDelta) <= 1) {
    return match;
  }

  const clampedLineIndex = clamp(activeLineIndex + Math.sign(lineDelta), 0, Math.max(lineGroups.length - 1, 0));
  const clampedLine = lineGroups[clampedLineIndex];
  if (!clampedLine) {
    return match;
  }

  return {
    ...match,
    lineIndex: clampedLineIndex,
    matchedWordIndex: clampedLine.firstIndex
  };
}

function selectBestVoiceMatch(matches, activeLineIndex) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return null;
  }

  return matches.reduce((bestMatch, candidate) => {
    if (!bestMatch) {
      return candidate;
    }

    if ((candidate.phraseLength || 0) !== (bestMatch.phraseLength || 0)) {
      return (candidate.phraseLength || 0) > (bestMatch.phraseLength || 0) ? candidate : bestMatch;
    }

    const candidateLineDistance = Math.abs((candidate.lineIndex ?? activeLineIndex) - activeLineIndex);
    const bestLineDistance = Math.abs((bestMatch.lineIndex ?? activeLineIndex) - activeLineIndex);
    if (candidateLineDistance !== bestLineDistance) {
      return candidateLineDistance < bestLineDistance ? candidate : bestMatch;
    }

    const candidateWordDistance = Math.abs((candidate.matchedWordIndex ?? currentIndex) - currentIndex);
    const bestWordDistance = Math.abs((bestMatch.matchedWordIndex ?? currentIndex) - currentIndex);
    if (candidateWordDistance !== bestWordDistance) {
      return candidateWordDistance < bestWordDistance ? candidate : bestMatch;
    }

    return (candidate.matchedWordIndex ?? -1) >= (bestMatch.matchedWordIndex ?? -1) ? candidate : bestMatch;
  }, null);
}

function findVoiceExactPhraseMatch(spokenTokens, options = {}) {
  if (spokenTokens.length === 0 || normalizedWordTokens.length === 0) {
    return null;
  }

  const recentSpoken = spokenTokens.slice(-8);
  const maxIndex = normalizedWordTokens.length - 1;
  const searchStart = clamp(options.startIndex ?? 0, 0, maxIndex);
  const searchEnd = clamp(options.endIndex ?? maxIndex, searchStart, maxIndex);
  const maxPhraseLength = Math.min(options.maxPhraseLength ?? 5, recentSpoken.length);
  const minPhraseLength = Math.max(options.minPhraseLength ?? 1, 1);
  const activeLineIndex = options.activeLineIndex ?? (lineIndexByWord[currentIndex] ?? 0);
  const lineFilter = typeof options.lineFilter === "function" ? options.lineFilter : null;

  for (let phraseLength = maxPhraseLength; phraseLength >= minPhraseLength; phraseLength -= 1) {
    const spokenPhraseTokens = recentSpoken.slice(-phraseLength);
    if (spokenPhraseTokens.length !== phraseLength) {
      continue;
    }

    const spokenPhrase = spokenPhraseTokens.join(" ");
    if (!spokenPhrase) {
      continue;
    }

    if (phraseLength === 1 && spokenPhrase.length < 3) {
      continue;
    }

    const matches = [];

    for (let index = searchStart; index <= searchEnd - phraseLength + 1; index += 1) {
      const candidateTokens = normalizedWordTokens.slice(index, index + phraseLength);
      if (candidateTokens.some((token) => !token) || candidateTokens.join(" ") !== spokenPhrase) {
        continue;
      }

      const matchedIndex = index + phraseLength - 1;
      const matchedWordIndex = getWordIndexForNormalizedToken(matchedIndex);
      if (matchedWordIndex < 0) {
        continue;
      }

      const lineIndex = lineIndexByWord[matchedWordIndex] ?? 0;
      const candidate = {
        matchedIndex,
        matchedWordIndex,
        lineIndex,
        phraseLength
      };

      if (lineFilter && !lineFilter(candidate)) {
        continue;
      }

      matches.push(candidate);
    }

    if (matches.length > 0) {
      if (phraseLength === 1 && matches.length > 1) {
        const sameLineMatches = matches.filter(({ lineIndex }) => lineIndex === activeLineIndex);
        if (sameLineMatches.length === 1) {
          return sameLineMatches[0];
        }

        continue;
      }

      return selectBestVoiceMatch(matches, activeLineIndex);
    }
  }

  return null;
}

function findVoiceDistantPhraseMatch(spokenTokens) {
  const lineWindow = getVoiceLineWindow(3);
  if (!lineWindow) {
    return null;
  }

  return findVoiceExactPhraseMatch(spokenTokens, {
    minPhraseLength: 3,
    maxPhraseLength: 5,
    activeLineIndex: lineWindow.activeLineIndex,
    lineFilter: ({ lineIndex }) => lineIndex < lineWindow.startLineIndex || lineIndex > lineWindow.endLineIndex
  });
}

function findVoiceLineMatch(spokenTokens, options = {}) {
  if (spokenTokens.length === 0 || normalizedWordTokens.length === 0 || lineGroups.length === 0) {
    return null;
  }

  const radius = Math.max(Number(options.radius) || 0, 0);
  const allowExact = options.allowExact !== false;
  const lineWindow = getVoiceLineWindow(radius);
  if (!lineWindow) {
    return null;
  }

  const candidateLineIndices = [];
  for (let lineIndex = lineWindow.startLineIndex; lineIndex <= lineWindow.endLineIndex; lineIndex += 1) {
    candidateLineIndices.push(lineIndex);
  }

  if (allowExact) {
    const exactMatch = findVoiceExactPhraseMatch(spokenTokens, {
      minPhraseLength: 1,
      maxPhraseLength: 5,
      activeLineIndex: lineWindow.activeLineIndex,
      lineFilter: ({ lineIndex }) => lineIndex >= lineWindow.startLineIndex && lineIndex <= lineWindow.endLineIndex
    });

    if (exactMatch) {
      return exactMatch;
    }
  }

  const partialMatches = [];

  for (const lineIndex of candidateLineIndices) {
    const tokenRange = getNormalizedTokenRangeForLine(lineIndex);
    if (!tokenRange) {
      continue;
    }

    const partialMatchIndex = findVoicePartialMatchIndex(spokenTokens, {
      startIndex: tokenRange.start,
      endIndex: tokenRange.end
    });

    if (partialMatchIndex < 0) {
      continue;
    }

    const matchedWordIndex = getWordIndexForNormalizedToken(partialMatchIndex);
    if (matchedWordIndex < 0) {
      continue;
    }

    partialMatches.push({
      matchedIndex: partialMatchIndex,
      matchedWordIndex,
      lineIndex,
      phraseLength: 1
    });
  }

  return selectBestVoiceMatch(partialMatches, lineWindow.activeLineIndex);
}

function getVoiceNextIndex(matchedIndex) {
  if (matchedIndex < 0 || wordNodes.length === 0) {
    return -1;
  }

  return Math.min(matchedIndex + 1, wordNodes.length - 1);
}

function getVoiceTrackingPartialTokenWindow() {
  if (normalizedWordTokens.length === 0 || lineGroups.length === 0) {
    return null;
  }

  const activeLineIndex = clamp(lineIndexByWord[currentIndex] ?? 0, 0, Math.max(lineGroups.length - 1, 0));
  const endLineIndex = Math.min(activeLineIndex + 1, Math.max(lineGroups.length - 1, 0));
  const maxIndex = normalizedWordTokens.length - 1;
  const startIndex = clamp(getNormalizedTokenIndexForWord(Math.max(currentIndex - 1, 0), "start"), 0, maxIndex);
  const endRange = getNormalizedTokenRangeForLine(endLineIndex);

  return {
    activeLineIndex,
    endLineIndex,
    startIndex,
    endIndex: clamp(Math.max(endRange?.end ?? startIndex, startIndex + 8), startIndex, maxIndex)
  };
}

function stopVoiceTrackingAdvance() {
  if (voiceTrackingAdvanceFrame) {
    cancelAnimationFrame(voiceTrackingAdvanceFrame);
    voiceTrackingAdvanceFrame = null;
  }

  voiceTrackingAdvanceTarget = -1;
  voiceTrackingAdvanceLastStepAt = 0;
}

function commitVoiceTrackingIndex(targetIndex) {
  const nextIndex = clamp(Number(targetIndex) || 0, 0, Math.max(wordNodes.length - 1, 0));
  if (nextIndex === currentIndex) {
    return;
  }

  const previousLineIndex = lineIndexByWord[currentIndex] ?? 0;
  const nextLineIndex = lineIndexByWord[nextIndex] ?? previousLineIndex;
  currentIndex = nextIndex;
  updateWordState(nextLineIndex !== previousLineIndex);

  if (currentIndex >= wordNodes.length - 1) {
    finishPlayback();
    stopVoiceTracking().catch(console.error);
  }
}

function scheduleVoiceTrackingAdvance(targetIndex, options = {}) {
  if (!wordNodes.length) {
    return;
  }

  const boundedTarget = clamp(Number(targetIndex) || 0, 0, Math.max(wordNodes.length - 1, 0));
  if (boundedTarget <= currentIndex) {
    return;
  }

  const delta = boundedTarget - currentIndex;
  if (options.immediate || delta > VOICE_TRACKING_MAX_ANIMATED_JUMP) {
    stopVoiceTrackingAdvance();
    commitVoiceTrackingIndex(boundedTarget);
    return;
  }

  voiceTrackingAdvanceTarget = Math.max(voiceTrackingAdvanceTarget, boundedTarget);
  if (voiceTrackingAdvanceFrame) {
    return;
  }

  const step = (now) => {
    voiceTrackingAdvanceFrame = null;

    if (!isPlaying || isPaused || getActiveMode() !== "voice") {
      stopVoiceTrackingAdvance();
      return;
    }

    if (voiceTrackingAdvanceTarget <= currentIndex) {
      stopVoiceTrackingAdvance();
      return;
    }

    if (!voiceTrackingAdvanceLastStepAt || now - voiceTrackingAdvanceLastStepAt >= VOICE_TRACKING_ADVANCE_STEP_MS) {
      voiceTrackingAdvanceLastStepAt = now;
      commitVoiceTrackingIndex(Math.min(currentIndex + 1, voiceTrackingAdvanceTarget));
    }

    if (voiceTrackingAdvanceTarget > currentIndex) {
      voiceTrackingAdvanceFrame = requestAnimationFrame(step);
      return;
    }

    stopVoiceTrackingAdvance();
  };

  voiceTrackingAdvanceFrame = requestAnimationFrame(step);
}

function applyVoiceTrackingMatch(match, options = {}) {
  const bestMatchIndex = match?.matchedWordIndex ?? -1;
  if (bestMatchIndex < 0 || bestMatchIndex === currentIndex) {
    return false;
  }

  if (bestMatchIndex < currentIndex) {
    return true;
  }

  const waitCard = getDuePromptWaitCardForVoiceIndex(bestMatchIndex);
  if (waitCard) {
    const waitTriggerWordIndex = getPromptWaitCardVoiceTriggerWordIndex(waitCard);
    if (waitTriggerWordIndex >= 0 && waitTriggerWordIndex !== currentIndex) {
      stopVoiceTrackingAdvance();
      currentIndex = waitTriggerWordIndex;
      updateWordState(true);
    }

    runPromptWaitPause(waitCard).then((completed) => {
      if (completed && isPlaying && !isPaused && getActiveMode() === "voice") {
        updateWordState(false);
      }
    }).catch(console.error);
    return true;
  }

  scheduleVoiceTrackingAdvance(bestMatchIndex, { immediate: Boolean(options.immediate) });
  return true;
}

function applyVoiceTrackingWordHints(words, options = {}) {
  const { confidence = 0 } = options;
  if (!Array.isArray(words) || !words.length || Number(confidence) < getVoiceTrackingConfidenceThreshold()) {
    return false;
  }

  const spokenTokens = words
    .flatMap((word) => tokenizeNormalizedText(word?.word || ""))
    .filter(Boolean);
  if (spokenTokens.length === 0) {
    return false;
  }

  const tokenWindow = getVoiceTrackingPartialTokenWindow();
  if (!tokenWindow) {
    return false;
  }

  const match = clampVoiceTrackingMatchToAdjacentLine(findVoiceExactPhraseMatch(spokenTokens, {
    minPhraseLength: 1,
    maxPhraseLength: Math.min(3, spokenTokens.length),
    startIndex: tokenWindow.startIndex,
    endIndex: tokenWindow.endIndex,
    activeLineIndex: tokenWindow.activeLineIndex,
    lineFilter: ({ lineIndex }) => lineIndex >= tokenWindow.activeLineIndex && lineIndex <= tokenWindow.endLineIndex
  }));

  return applyVoiceTrackingMatch(match, { immediate: false });
}

function clearPendingForwardVoiceSkip() {
  pendingForwardVoiceSkip = null;
}

function buildPendingForwardVoiceSkip(match) {
  if (!match || (match.phraseLength || 0) !== 1) {
    return null;
  }

  const activeLineIndex = clamp(lineIndexByWord[currentIndex] ?? 0, 0, Math.max(lineGroups.length - 1, 0));
  const matchedWordIndex = match.matchedWordIndex ?? -1;
  const matchedLineIndex = clamp(match.lineIndex ?? activeLineIndex, 0, Math.max(lineGroups.length - 1, 0));
  if (matchedWordIndex <= currentIndex || matchedLineIndex <= activeLineIndex) {
    return null;
  }

  const matchedTokenIndex = getNormalizedTokenIndexForWord(matchedWordIndex, "end");
  const firstToken = normalizedWordTokens[matchedTokenIndex] || "";
  const nextTokenIndex = matchedTokenIndex + 1;
  const nextToken = normalizedWordTokens[nextTokenIndex] || "";
  const nextWordIndex = getWordIndexForNormalizedToken(nextTokenIndex);
  if (!firstToken || !nextToken || nextWordIndex < 0 || nextWordIndex <= matchedWordIndex) {
    return null;
  }

  return {
    firstWordIndex: matchedWordIndex,
    firstToken,
    nextToken,
    nextTokenIndex,
    nextWordIndex,
    lineIndex: lineIndexByWord[nextWordIndex] ?? matchedLineIndex,
    phrase: `${firstToken} ${nextToken}`,
    expiresAt: performance.now() + VOICE_FORWARD_SKIP_CONFIRM_MS
  };
}

function resolveForwardVoiceSkipMatch(spokenTokens, match) {
  const latestToken = spokenTokens[spokenTokens.length - 1] || "";
  const latestPhrase = spokenTokens.slice(-2).join(" ");

  if (pendingForwardVoiceSkip) {
    const pending = pendingForwardVoiceSkip;
    const expired = performance.now() > pending.expiresAt;
    const invalidatedByProgress = currentIndex > pending.firstWordIndex;

    if (expired || invalidatedByProgress) {
      clearPendingForwardVoiceSkip();
    } else if (latestToken === pending.nextToken || latestPhrase === pending.phrase) {
      clearPendingForwardVoiceSkip();
      return {
        matchedIndex: pending.nextTokenIndex,
        matchedWordIndex: pending.nextWordIndex,
        lineIndex: pending.lineIndex,
        phraseLength: 2
      };
    }
  }

  const pendingMatch = buildPendingForwardVoiceSkip(match);
  if (pendingMatch) {
    pendingForwardVoiceSkip = pendingMatch;
    return null;
  }

  if (match && (match.phraseLength || 0) > 1) {
    clearPendingForwardVoiceSkip();
  }

  return match;
}

function disconnectVoiceTrackingAudioGraph() {
  if (voiceTrackingSourceNode) {
    try {
      voiceTrackingSourceNode.disconnect();
    } catch (error) {
      // Node already disconnected.
    }
    voiceTrackingSourceNode = null;
  }

  if (voiceTrackingProcessorNode) {
    try {
      voiceTrackingProcessorNode.disconnect();
    } catch (error) {
      // Node already disconnected.
    }
    if (voiceTrackingProcessorNode.port) {
      voiceTrackingProcessorNode.port.onmessage = null;
    }
    voiceTrackingProcessorNode.onaudioprocess = null;
    voiceTrackingProcessorNode = null;
  }

  if (voiceTrackingSilenceNode) {
    try {
      voiceTrackingSilenceNode.disconnect();
    } catch (error) {
      // Node already disconnected.
    }
    voiceTrackingSilenceNode = null;
  }
}

async function disposeVoiceTrackingAudioContext() {
  if (!voiceTrackingAudioContext) {
    return;
  }

  const currentAudioContext = voiceTrackingAudioContext;
  voiceTrackingAudioContext = null;
  try {
    await currentAudioContext.close();
  } catch (error) {
    // Audio context is already closed.
  }
}

async function stopVoiceTracking() {
  voiceTrackingSession += 1;
  isVoiceTrackingStarting = false;
  voiceTrackingStartPromise = null;
  activeVoiceTrackingLanguageTag = null;
  lastVoiceTrackingAudioProcessAt = 0;
  lastVoiceTrackingPartialHandledAt = 0;
  lastVoiceTrackingPartialKey = "";
  stopVoiceTrackingAdvance();
  clearPendingForwardVoiceSkip();

  disconnectVoiceTrackingAudioGraph();

  if (voiceRecognition?.engine === "native" && invoke) {
    try {
      await invoke("stop_voice_tracking");
    } catch (error) {
      console.error("Native voice tracking failed to stop", error);
    }
  } else if (voiceRecognition?.remove) {
    try {
      voiceRecognition.remove();
    } catch (error) {
      // Recognizer already removed.
    }
  }

  voiceRecognition = null;

  if (voiceCommandSharedWithTracking) {
    voiceCommandSharedWithTracking = false;
    lastVoiceCommandAudioProcessAt = 0;
    updateVoiceCommandIndicator();
  }

  if (shouldEnableVoiceCommandListener()) {
    syncVoiceCommandListener({ forceReset: true });
  }

  if (voiceTrackingMediaStream) {
    voiceTrackingMediaStream.getTracks().forEach((track) => {
      track.enabled = false;
      track.stop();
    });
    voiceTrackingMediaStream = null;
  }

  await disposeVoiceTrackingAudioContext();
}

function applyVoiceTrackingTranscript(transcript, options = {}) {
  const text = String(transcript || "").trim();
  if (!text || !isPlaying || getActiveMode() !== "voice") {
    return;
  }

  const {
    isFinal = false,
    confidence = 0
  } = options;
  if (isPaused) {
    return;
  }

  if (activePromptWaitCardId) {
    return;
  }

  if (Number(confidence) < getVoiceTrackingConfidenceThreshold()) {
    return;
  }

  if (!isFinal) {
    const now = performance.now();
    const partialTokens = tokenizeNormalizedText(text);
    const partialKey = partialTokens.slice(-3).join(" ");

    if (!partialKey) {
      return;
    }

    if (partialKey === lastVoiceTrackingPartialKey && now - lastVoiceTrackingPartialHandledAt < VOICE_TRACKING_PARTIAL_REPEAT_GUARD_MS) {
      return;
    }

    if (now - lastVoiceTrackingPartialHandledAt < VOICE_TRACKING_PARTIAL_MIN_INTERVAL_MS) {
      return;
    }

    lastVoiceTrackingPartialHandledAt = now;
    lastVoiceTrackingPartialKey = partialKey;
  } else {
    lastVoiceTrackingPartialHandledAt = performance.now();
    lastVoiceTrackingPartialKey = "";
  }

  const combinedTranscript = isFinal
    ? `${voiceTranscript} ${text}`.trim()
    : `${voiceTranscript} ${text}`.trim();

  if (isFinal) {
    voiceTranscript = combinedTranscript;
  }

  const spokenTokens = tokenizeNormalizedText(isFinal ? combinedTranscript : text);
  const bestLineMatch = clampVoiceTrackingMatchToAdjacentLine(resolveForwardVoiceSkipMatch(
    spokenTokens,
    (isFinal ? findVoiceDistantPhraseMatch(spokenTokens) : null)
      || findVoiceLineMatch(spokenTokens, { radius: VOICE_TRACKING_MATCH_RADIUS, allowExact: true })
  ));
  applyVoiceTrackingMatch(bestLineMatch, { immediate: isFinal });
}

async function startVoiceTracking() {
  if (!hasOfflineVoiceCommandSupport()) {
    throw new Error("Vosk voice recognition is not supported");
  }

  if (voiceRecognition?.engine === "native") {
    return;
  }

  if (voiceTrackingStartPromise) {
    return voiceTrackingStartPromise;
  }

  const session = ++voiceTrackingSession;
  isVoiceTrackingStarting = true;
  const startPromise = (async () => {
    syncStateFromStorage();
    const languageTag = getVoiceLanguageTag();
    rebuildNormalizedScriptTokenMap(languageTag);
    await ensureNativeVoiceEventListener();
    await invoke("start_voice_tracking", buildNativeVoicePayload(languageTag));
    if (session !== voiceTrackingSession) {
      await invoke("stop_voice_tracking").catch(() => {});
      return;
    }

    voiceRecognition = { engine: "native" };
    activeVoiceTrackingLanguageTag = languageTag;
    lastVoiceTrackingAudioProcessAt = performance.now();

    if (isVoiceCommandRecognizerActive() || isVoiceCommandRecognitionStarting) {
      await stopVoiceCommandListener();
    }

    voiceCommandSharedWithTracking = false;
    updateVoiceCommandIndicator();
  })();

  voiceTrackingStartPromise = startPromise;

  try {
    await startPromise;
  } finally {
    if (voiceTrackingStartPromise === startPromise) {
      voiceTrackingStartPromise = null;
    }
    if (session === voiceTrackingSession) {
      isVoiceTrackingStarting = false;
    }
  }
}

function playVoiceMode() {
  clearPromptFeedback();
  scheduleVoiceHealthCheck(0);
  voiceTranscript = "";
  resetVoiceCommandTranscript();
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

async function play() {
  if (wordNodes.length === 0) return;
  const activeMode = getActiveMode();
  clearPromptFeedback();

  if (currentIndex >= wordNodes.length - 1) {
    currentIndex = 0;
    scrollProgress = 0;
    setViewportPosition(0, "auto");
  }

  clearPlayback();
  isPlaying = true;
  isPaused = false;
  setReadingMode(true);
  syncPromptLayout();
  resetPromptWaitCards(activeMode === "scroll" ? getCachedPromptScrollableHeight() * scrollProgress : 0, currentIndex);
  lastStatusUpdateAt = 0;
  updatePlayButtons();

  const countdownCompleted = await runPlaybackCountdown();
  if (!countdownCompleted) {
    return;
  }

  const settleCompleted = await waitForPlaybackCountdownSettle();
  if (!settleCompleted) {
    return;
  }

  if (supportsPlaybackStartDelay(activeMode)) {
    const holdCompleted = await waitForPlaybackStartDelay();
    if (!holdCompleted) {
      return;
    }
  }

  if (activeMode === "arrow") {
    beginArrowMode();
    syncVoiceCommandListener();
    return;
  }

  if (activeMode === "voice") {
    playVoiceMode();
    syncVoiceCommandListener();
    return;
  }

  if (activeMode === "scroll") {
    playScrollMode();
    syncVoiceCommandListener();
    return;
  }

  playTimedStep();
  syncVoiceCommandListener();
}

async function openAuxWindow(kind) {
  if (invoke) {
    await invoke("open_aux_window", { kind });
    const kindLabel = getAuxWindowLabel(kind);
    ui.statusLabel.textContent = t("tele.opened", { kind: kindLabel });
  }
}

function buildRemoteScriptAppend(content) {
  const existing = (state.script || "").trimEnd();
  const addition = String(content || "").trim();

  if (!addition) {
    return existing;
  }

  return existing ? `${existing}\n\n${addition}` : addition;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function clearRemoteCardCollapseTimer(messageId) {
  const timer = remoteCardCollapseTimers.get(messageId);
  if (timer) {
    clearTimeout(timer);
    remoteCardCollapseTimers.delete(messageId);
  }
}

function expandRemoteCard(card, messageId) {
  clearRemoteCardCollapseTimer(messageId);
  card.classList.add("is-expanded");
}

function scheduleRemoteCardCollapse(card, messageId, delayMs = 140) {
  clearRemoteCardCollapseTimer(messageId);
  const timer = window.setTimeout(() => {
    remoteCardCollapseTimers.delete(messageId);
    if (!card.matches(":hover") && !card.matches(":focus-within")) {
      card.classList.remove("is-expanded");
    }
  }, delayMs);
  remoteCardCollapseTimers.set(messageId, timer);
}

function renderRemoteInbox() {
  if (!ui.remoteInbox) {
    return;
  }

  const visibleMessages = remoteMessages.filter((message) => !remotePendingActions.has(message.id));
  remoteCardCollapseTimers.forEach((timer) => clearTimeout(timer));
  remoteCardCollapseTimers.clear();
  ui.remoteInbox.replaceChildren();
  ui.remoteInbox.classList.toggle("hidden", visibleMessages.length === 0);

  visibleMessages.forEach((message) => {
    const card = document.createElement("article");
    card.className = "remote-card";
    card.dataset.messageId = message.id;
    card.dataset.importance = message.importance || "normal";

    if (message.importance === "important") {
      card.classList.add("is-important");
    }

    card.title = "Double-click to append this message to the end of the teleprompter text.";
    card.innerHTML = `
      <div class="remote-card-preview">
        <div class="remote-card-badge">✉</div>
        <div class="remote-card-body">
          <div class="remote-card-header">
            <strong class="remote-card-title"></strong>
            <span class="remote-importance ${message.importance === "important" ? "is-important" : ""}">${message.importance === "important" ? t("remote.importance.important") : t("remote.importance.normal")}</span>
          </div>
          <p class="remote-card-excerpt"></p>
          <span class="remote-card-hint">${t("remote.cardHint")}</span>
        </div>
        <button class="remote-reject" type="button" aria-label="${t("remote.rejectAria")}">×</button>
      </div>
    `;

    card.querySelector(".remote-card-title").textContent = message.title;
    card.querySelector(".remote-card-excerpt").textContent = message.preview || message.content || "";

    card.addEventListener("mouseenter", () => {
      expandRemoteCard(card, message.id);
    });

    card.addEventListener("mouseleave", () => {
      scheduleRemoteCardCollapse(card, message.id);
    });

    card.addEventListener("focusin", () => {
      expandRemoteCard(card, message.id);
    });

    card.addEventListener("focusout", () => {
      scheduleRemoteCardCollapse(card, message.id);
    });

    card.addEventListener("dblclick", () => {
      acceptRemoteMessage(message.id).catch(console.error);
    });

    card.querySelector(".remote-reject").addEventListener("click", (event) => {
      event.stopPropagation();
      denyRemoteMessage(message.id).catch(console.error);
    });

    ui.remoteInbox.appendChild(card);
  });
}

async function syncRemoteMessages() {
  if (remotePendingActions.size > 0) {
    return { ok: true, messageCount: remoteMessages.length };
  }

  const url = buildCloudApiUrl("/api/receiver/messages/list");
  if (!url) {
    remoteMessages = [];
    renderRemoteInbox();
    return { ok: false, messageCount: 0 };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        receiverId: state.remote?.receiverId,
        receiverSecret: state.remote?.receiverSecret,
        accessPassword: state.remote?.accessPassword
      })
    });
    const payload = await response.json().catch(() => ({}));
    const serverMessage = String(payload.message || "").trim();
    if (!response.ok) {
      if (response.status === 401 && /receiver not found/i.test(serverMessage)) {
        remoteMessages = [];
        renderRemoteInbox();
        return { ok: true, messageCount: 0 };
      }

      throw new Error(payload.message || t("remote.fetchFailed"));
    }

    remoteMessages = Array.isArray(payload.messages) ? payload.messages : [];
    renderRemoteInbox();
    return { ok: true, messageCount: remoteMessages.length };
  } catch (error) {
    console.error(error);
    return { ok: false, messageCount: 0 };
  }
}

function scheduleNextRemoteMessageSync(delayMs = remoteCloudPollDelayMs) {
  if (remoteInboxTimer) {
    clearTimeout(remoteInboxTimer);
  }

  remoteInboxTimer = window.setTimeout(() => {
    runRemoteMessageSyncLoop().catch(console.error);
  }, delayMs);
}

async function runRemoteMessageSyncLoop() {
  const result = await syncRemoteMessages();

  if (!isCloudRemoteEnabled()) {
    return;
  }

  if (!result?.ok) {
    remoteCloudPollDelayMs = CLOUD_POLL_MAX_INTERVAL_MS;
  } else if ((result.messageCount || 0) > 0) {
    remoteCloudPollDelayMs = CLOUD_POLL_MIN_INTERVAL_MS;
  } else {
    remoteCloudPollDelayMs = Math.min(remoteCloudPollDelayMs + CLOUD_POLL_BACKOFF_STEP_MS, CLOUD_POLL_MAX_INTERVAL_MS);
  }

  scheduleNextRemoteMessageSync(remoteCloudPollDelayMs);
}

async function resolveRemoteMessageAction(messageId, action) {
  const url = buildCloudApiUrl("/api/receiver/messages/resolve");
  if (!url) {
    return false;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      receiverId: state.remote?.receiverId,
      receiverSecret: state.remote?.receiverSecret,
      messageId,
      action
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || t("remote.resolveFailed"));
  }

  return Boolean(payload.ok);
}

async function acceptRemoteMessage(messageId) {
  const message = remoteMessages.find((entry) => entry.id === messageId);
  const card = ui.remoteInbox?.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);

  if (!message || remotePendingActions.has(messageId)) {
    return;
  }

  remotePendingActions.add(messageId);
  card?.classList.add("is-accepting");
  ui.statusLabel.textContent = t("remote.acceptedAppending");

  await wait(2000);
  card?.classList.remove("is-accepting");
  card?.classList.add("is-accepted");

  await wait(260);

  const previousScript = state.script;
  const nextScript = buildRemoteScriptAppend(message.content);
  state.script = nextScript;
  saveState({ script: nextScript });
  rerenderScriptPreservingPosition(previousScript);
  await resolveRemoteMessageAction(messageId, "accept").catch(console.error);

  remoteMessages = remoteMessages.filter((entry) => entry.id !== messageId);
  remotePendingActions.delete(messageId);
  renderRemoteInbox();
}

async function denyRemoteMessage(messageId) {
  const card = ui.remoteInbox?.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);

  if (remotePendingActions.has(messageId)) {
    return;
  }

  remotePendingActions.add(messageId);
  card?.classList.add("is-denying");
  ui.statusLabel.textContent = t("remote.denied");

  await wait(420);
  await resolveRemoteMessageAction(messageId, "deny").catch(console.error);

  remoteMessages = remoteMessages.filter((entry) => entry.id !== messageId);
  remotePendingActions.delete(messageId);
  renderRemoteInbox();
}

async function heartbeatRemoteReceiver() {
  const url = buildCloudApiUrl("/api/receiver/heartbeat");
  if (!url) {
    return;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        receiverId: state.remote?.receiverId,
        receiverSecret: state.remote?.receiverSecret,
        accessPassword: state.remote?.accessPassword
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message || t("remote.heartbeatFailed", { status: response.status }));
    }
  } catch (error) {
    console.error(error);
  }
}

function startRemoteReceiverLoop() {
  if (!isCloudRemoteEnabled()) {
    ui.remoteInbox?.classList.add("hidden");
    return;
  }

  heartbeatRemoteReceiver().catch(console.error);
  remoteCloudPollDelayMs = CLOUD_POLL_MIN_INTERVAL_MS;
  runRemoteMessageSyncLoop().catch(console.error);

  remoteHeartbeatTimer = window.setInterval(() => {
    heartbeatRemoteReceiver().catch(console.error);
  }, CLOUD_HEARTBEAT_INTERVAL_MS);
}

function togglePause() {
  if (!isPlaying && !isPaused) {
    return;
  }

  if (isPlaybackCountdownActive) {
    return;
  }

  if (isPaused) {
    resumePlayback().catch(console.error);
  } else {
    pausePlayback();
  }
}

function replayFromStart() {
  stopPlayback(true);
  play();
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
  const targetTop = getLineTargetTop(nextLineIndex);
  scrollToLine(nextLineIndex);
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
  const targetTop = getLineTargetTop(activeLineIndex);
  scrollProgress = totalScrollable > 0 ? clamp(targetTop / totalScrollable, 0, 1) : 0;

  if (getActiveMode() === "scroll") {
    setViewportPosition(targetTop, getScrollBehavior());

    if (isPlaying && !isPaused) {
      resetPromptWaitCards(targetTop, currentIndex);
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

function handlePromptClick(event) {
  const word = event.target.closest(".prompt-word");
  if (!word) {
    return;
  }

  const activeMode = getActiveMode();
  if (activeMode !== "highlight" && activeMode !== "line") {
    return;
  }

  const wordIndex = Number(word.dataset.index);
  if (!Number.isFinite(wordIndex)) {
    return;
  }

  if (activeMode === "highlight") {
    jumpToIndex(wordIndex);
    return;
  }

  const lineIndex = Number(word.dataset.lineIndex);
  const line = Number.isFinite(lineIndex) ? lineGroups[lineIndex] : null;
  jumpToIndex(line?.firstIndex ?? wordIndex);
}

function handlePlaybackHotkeys(event) {
  const target = event.target;
  if (target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)) {
    return;
  }

  if (!invoke && event.ctrlKey && event.shiftKey && event.code === "KeyX" && state.desktop?.clickthroughShortcutEnabled) {
    event.preventDefault();
    toggleClickthroughMode().catch(console.error);
    return;
  }

  if (!event.ctrlKey && !event.metaKey && !event.altKey && event.code === "KeyP") {
    event.preventDefault();
    if (isPlaying || isPaused) {
      stopPlayback(false);
    } else {
      play();
    }
    return;
  }

  if (!event.ctrlKey && !event.metaKey && !event.altKey && event.code === "KeyR") {
    event.preventDefault();
    stopPlayback(true);
    return;
  }

  if (!event.ctrlKey && !event.metaKey && !event.altKey && event.code === "PageUp") {
    event.preventDefault();
    scrollBackward();
    return;
  }

  if (event.code === "Space" && (isPlaying || isPaused)) {
    event.preventDefault();
    togglePause();
    return;
  }

  if (!event.ctrlKey && !event.metaKey && !event.altKey && (isPlaying || isPaused)) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      adjustSpeed(event.repeat ? 4 : 2);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      adjustSpeed(event.repeat ? -4 : -2);
      return;
    }
  }

  if (!event.ctrlKey && !event.metaKey && !event.altKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
    const direction = event.key === "ArrowDown" ? 1 : -1;

    if (event.repeat) {
      if (getPlaybackVerticalArrowMode()) {
        event.preventDefault();
      }
      return;
    }

    const handled = stepPlaybackWithVerticalArrow(direction);
    if (handled) {
      event.preventDefault();
      startPlaybackArrowHold(direction);
      return;
    }
  }

  if (!event.ctrlKey && !event.metaKey && !event.altKey && (isPlaying || isPaused) && getActiveMode() === "voice") {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      movePlaybackByLine(1, { allowVoiceModeBackward: true });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      movePlaybackByLine(-1, { allowVoiceModeBackward: true });
      return;
    }
  }

  if (!event.ctrlKey && !event.metaKey && !event.altKey && (isPlaying || isPaused) && ["line", "scroll"].includes(getActiveMode())) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      stepPlaybackLine(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      stepPlaybackLine(-1);
    }
  }

  if (getActiveMode() !== "arrow" || !isPlaying) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    stepArrowMode(1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    stepArrowMode(-1);
  }
}

function refreshFromStorage() {
  const previousVoiceLanguage = getVoiceLanguageTag();
  const previousVoiceModelId = getSelectedVoiceModelId(previousVoiceLanguage);
  const previousAppWideVoiceCommands = Boolean(state.appearance?.appWideVoiceCommands);
  const previousVoiceCaptureSettings = getVoiceCaptureSettingsSignature();
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
  const nextVoiceLanguage = getVoiceLanguageTag();
  const nextVoiceModelId = getSelectedVoiceModelId(nextVoiceLanguage);
  const voiceLanguageChanged = previousVoiceLanguage !== nextVoiceLanguage;
  const voiceModelChanged = previousVoiceModelId !== nextVoiceModelId;
  const appWideVoiceCommandsChanged = previousAppWideVoiceCommands !== Boolean(state.appearance?.appWideVoiceCommands);
  const voiceCaptureSettingsChanged = previousVoiceCaptureSettings !== getVoiceCaptureSettingsSignature();
  if (voiceModelChanged) {
    voiceModelStatusCache.clear();
  }
  syncVoiceCommandListener({ forceReset: voiceLanguageChanged || voiceModelChanged || appWideVoiceCommandsChanged || voiceCaptureSettingsChanged });

  if (previousState.speed !== state.speed) {
    updateSpeedLabel();
  }

  if (previousState.language !== state.language) {
    applyTranslationsToDocument(state.language);
    updatePromptFeedbackOverlay();
    updateSpeedLabel();
    updateCollapseButton();
    updatePlayButtons();
  }

  updateDragControls();

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
    applyDesktopPreferences().catch(console.error);
  }

  if (!isCollapsed) {
    currentWindowHeight = Math.max(state.window.height || defaultState.window.height, MIN_HEIGHT);
  }

  if (previousState.script !== state.script || previousState.appearance !== JSON.stringify(state.appearance)) {
    rerenderScriptPreservingPosition(previousState.script);
    return;
  }

  if (previousState.window !== JSON.stringify(state.window)) {
    applyStoredWindowSettings().catch(console.error);
  }
}

function wireEvents() {
  ui.speedDownButton.addEventListener("click", () => {
    adjustSpeed(-10);
  });

  ui.speedUpButton.addEventListener("click", () => {
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
    generatePromptScript().catch(console.error);
  });

  ui.playButton.addEventListener("click", () => {
    if (isPlaying) return;
    play();
    focusPlaybackSurface();
  });

  ui.floatingStopButton.addEventListener("click", () => {
    stopPlayback(false);
    focusPlaybackSurface();
  });

  ui.floatingReplayButton.addEventListener("click", () => {
    replayFromStart();
    focusPlaybackSurface();
  });

  ui.floatingPauseButton.addEventListener("click", () => {
    togglePause();
    focusPlaybackSurface();
  });

  ui.inputButton.addEventListener("click", () => {
    openAuxWindow("input").catch((error) => {
      console.error(error);
      ui.statusLabel.textContent = t("tele.failedOpenInput", { error });
    });
  });

  ui.settingsButton.addEventListener("click", () => {
    openAuxWindow("settings").catch((error) => {
      console.error(error);
      ui.statusLabel.textContent = t("tele.failedOpenSettings", { error });
    });
  });

  ui.closeAppButton.addEventListener("click", () => {
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
      toggleDragOverlay().catch(console.error);
    });
  }
  ui.collapseButton.addEventListener("click", () => {
    setCollapsed(!isCollapsed).catch(console.error);
  });

  ui.promptText.addEventListener("click", handlePromptClick);

  window.addEventListener("resize", () => {
    applyResponsiveText();
    updateSpeedInputMode();
  });
  window.addEventListener("focus", () => {
    refreshFromStorage();
    if (shouldEnableVoiceCommandListener() && !isVoiceCommandRecognizerActive() && !isVoiceCommandRecognitionStarting) {
      refreshVoiceCommandListener();
    }
    resumeOfflineVoiceCommandAudioContext().catch(() => {});
  });
  window.addEventListener("blur", () => {
    scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (shouldEnableVoiceCommandListener() && !isVoiceCommandRecognizerActive() && !isVoiceCommandRecognitionStarting) {
        refreshVoiceCommandListener();
      }
      resumeOfflineVoiceCommandAudioContext().catch(() => {});
      return;
    }

    scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
  });
  window.addEventListener("pointerdown", () => {
    if (!state.appearance?.appWideVoiceCommands) {
      return;
    }

    if (!isVoiceCommandRecognizerActive() && !isVoiceCommandRecognitionStarting) {
      refreshVoiceCommandListener();
    }
    resumeOfflineVoiceCommandAudioContext().catch(() => {});
  }, true);
  window.addEventListener("keydown", (event) => {
    if (!state.appearance?.appWideVoiceCommands || event.repeat) {
      return;
    }

    if (!isVoiceCommandRecognizerActive() && !isVoiceCommandRecognitionStarting) {
      refreshVoiceCommandListener();
    }
    resumeOfflineVoiceCommandAudioContext().catch(() => {});
  }, true);
  window.addEventListener("storage", refreshFromStorage);
  window.addEventListener("flow-state-updated", refreshFromStorage);
  window.addEventListener("flow-voice-models-updated", refreshFromStorage);
  window.addEventListener("keydown", handlePlaybackHotkeys);
  window.addEventListener("keyup", handlePlaybackHotkeyRelease);
  window.addEventListener("blur", stopPlaybackArrowHold);
  window.addEventListener("beforeunload", () => {
    stopPlaybackArrowHold();
    if (speedPersistTimer) {
      flushPendingSpeedPersist();
    }
    stopVoiceCommandListener();
    stopVoiceTracking();
    disarmVoiceCommandListener();
    unlistenNativeVoiceEvents?.();
    unlistenNativeVoiceEvents = null;
    unlistenClickthroughChanged?.();
    unlistenClickthroughChanged = null;
    if (voiceCommandHealthTimer) {
      clearTimeout(voiceCommandHealthTimer);
      voiceCommandHealthTimer = null;
    }
    remoteCardCollapseTimers.forEach((timer) => clearTimeout(timer));
    if (remoteHeartbeatTimer) {
      clearInterval(remoteHeartbeatTimer);
    }

    if (remoteInboxTimer) {
      clearInterval(remoteInboxTimer);
    }

    if (autoUpdateCheckTimer) {
      clearInterval(autoUpdateCheckTimer);
      autoUpdateCheckTimer = null;
    }
  });

  resizeObserver = new ResizeObserver(() => {
    applyResponsiveText();
  });
  resizeObserver.observe(ui.promptViewport);
}

async function applyStoredWindowSettings() {
  if (!tauriWindow?.getCurrentWindow || !tauriDpi?.LogicalSize) return;

  const appWindow = tauriWindow.getCurrentWindow();
  const geometry = await getSafeWindowGeometry();
  state.window.width = geometry.width;
  state.window.height = geometry.height;

  setSpeedRailGutter(geometry.gutterWidth);

  if (isCollapsed) {
    return;
  }

  await appWindow.setSize(new tauriDpi.LogicalSize(geometry.width + geometry.gutterWidth, geometry.height));
  currentWindowHeight = state.window.height;

  const positioned = await positionWindowForCurrentLayout(appWindow, geometry);
  if (positioned) {
    windowPositionRetryCount = 0;
    if (pendingWindowPositionRetryTimer) {
      window.clearTimeout(pendingWindowPositionRetryTimer);
      pendingWindowPositionRetryTimer = 0;
    }
    return;
  }

  if (!usesMonitorRelativeWindowPreset() || windowPositionRetryCount >= MAX_WINDOW_POSITION_RETRIES) {
    return;
  }

  windowPositionRetryCount += 1;
  if (pendingWindowPositionRetryTimer) {
    window.clearTimeout(pendingWindowPositionRetryTimer);
  }
  pendingWindowPositionRetryTimer = window.setTimeout(() => {
    pendingWindowPositionRetryTimer = 0;
    applyStoredWindowSettings().catch(console.error);
  }, WINDOW_POSITION_RETRY_DELAY_MS);
}

async function bootFlowApp() {
  try {
    syncStateFromStorage();
    state.desktop = state.desktop || structuredClone(defaultState.desktop);

    ensureNativeVoiceEventListener().catch(console.error);

    rotateRemoteAccessPasswordForLaunch();

    applyDesktopPreferences().catch(console.error);

    applyTranslationsToDocument(state.language);

    cacheUi();

    setSpeedRailGutter(SPEED_RAIL_WINDOW_GUTTER);

    installVoiceCommandDebugHelpers();

    applyAppearanceSettings();

    updateCollapseButton();

    updateDragControls();

    updateSpeedLabel();

    updateSpeedInputMode();

    renderScript();

    applyResponsiveText();

    bindDesktopEventListeners().catch(console.error);

    wireEvents();

    startVoiceCommandHealthMonitor();

    startRemoteReceiverLoop();

    updatePlayButtons();

    syncVoiceCommandListener();

    applyStoredWindowSettings().catch(console.error);

    if (!(await resolveMicrosoftStoreBuild())) {
      startAutomaticUpdater();
    }

    initializeDesktopWindowOpacityFade();
  } catch (error) {
    console.error("Flow boot failed", error);
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", bootFlowApp, { once: true });
} else {
  bootFlowApp();
}



