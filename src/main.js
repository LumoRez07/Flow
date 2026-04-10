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
  loadState,
  normalizeVoiceLanguage,
  parseFormattedScript,
  resolveFontStack,
  saveState,
  splitWords,
  translate,
  VOICE_LANGUAGE_OPTIONS
} from "./shared.js";

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
const SPEED_RAIL_TRANSITION_MS = 220;
const PLAYBACK_COUNTDOWN_STEPS = ["3", "2", "1"];
const PLAYBACK_COUNTDOWN_BASE_STEP_MS = 860;
const PLAYBACK_COUNTDOWN_FASTEST_STEP_MS = 620;
const PLAYBACK_COUNTDOWN_SPEED_MIN = 60;
const PLAYBACK_COUNTDOWN_SPEED_MAX = 360;
const PLAYBACK_COUNTDOWN_SETTLE_MS = 500;
const TOP_CENTER_X_OFFSET = 32;
const VOICE_WORD_VIEWPORT_OFFSET = 0.42;
const VOICE_LINE_VIEWPORT_OFFSET = 0.38;
const VOICE_SCROLL_EASING = 0.1;
const VOICE_SCROLL_MAX_STEP = 10;
const VOICE_TRACKING_PARTIAL_MIN_INTERVAL_MS = 180;
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
const VOSK_COMMAND_BUFFER_SIZE = 4096;
const VOSK_SCRIPT_PROCESSOR_FALLBACK_BUFFER_SIZE = 1024;
const VOSK_COMMAND_MODEL_URL = new URL("./assets/vosk-model-small-en-us-0.15.tar.gz", import.meta.url).href;
const VOICE_CAPTURE_WORKLET_URL = new URL("./assets/vendor/voice-capture-worklet.js", import.meta.url).href;
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
const tauriWindow = window.__TAURI__?.window;
const tauriDpi = window.__TAURI__?.dpi;
const tauriEvent = window.__TAURI__?.event;

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
let voiceTrackingSession = 0;
let activeVoiceTrackingLanguageTag = null;
let lastVoiceTrackingAudioProcessAt = 0;
let lastVoiceTrackingPartialHandledAt = 0;
let lastVoiceTrackingPartialKey = "";
let pendingForwardVoiceSkip = null;
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
let lastResponsiveFontSize = 0;
let lastResponsiveViewportWidth = 0;
let lastResponsiveViewportHeight = 0;
let frozenReadingViewportWidth = 0;
let frozenReadingViewportHeight = 0;
const voiceModelStatusCache = new Map();
const voiceCaptureWorkletModulePromises = new WeakMap();
let promptFeedbackState = null;

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
  return ENGLISH_VOICE_LANGUAGE;
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

function getSoundInputSettings(appearance = state.appearance) {
  const source = appearance || defaultState.appearance;
  return {
    deviceId: normalizeSoundInputDeviceId(source.soundInputDeviceId || defaultState.appearance.soundInputDeviceId),
    noiseGate: clampSoundInputNumber(source.soundInputNoiseGate, 0, 0.08, defaultState.appearance.soundInputNoiseGate),
    inputGain: clampSoundInputNumber(source.soundInputGain, 0.5, 4, defaultState.appearance.soundInputGain)
  };
}

function getVoiceCaptureSettingsSignature(appearance = state.appearance) {
  return JSON.stringify(getSoundInputSettings(appearance));
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

async function getAudioInputDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return null;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "audioinput");
  } catch (error) {
    return null;
  }
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

async function requestVoiceCaptureMediaStream(soundInputSettings = getSoundInputSettings()) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw createVoiceCaptureError(VOICE_CAPTURE_ERROR_UNAVAILABLE, "Microphone capture is unavailable");
  }

  const audioInputDevices = await getAudioInputDevices();
  if (Array.isArray(audioInputDevices) && audioInputDevices.length === 0) {
    throw createVoiceCaptureError(VOICE_CAPTURE_ERROR_NO_DEVICE, "No microphone detected");
  }

  const primaryConstraints = buildVoiceCaptureAudioConstraints(soundInputSettings);
  let mediaStream = null;

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: primaryConstraints
    });
  } catch (error) {
    const errorName = String(error?.name || error?.message || error);
    const canFallbackToDefault = soundInputSettings.deviceId !== defaultState.appearance.soundInputDeviceId
      && /NotFoundError|OverconstrainedError/i.test(errorName);

    if (!canFallbackToDefault) {
      throw normalizeVoiceCaptureError(error);
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: buildVoiceCaptureAudioConstraints({
          ...soundInputSettings,
          deviceId: defaultState.appearance.soundInputDeviceId
        })
      });
    } catch (fallbackError) {
      throw normalizeVoiceCaptureError(fallbackError);
    }
  }

  const audioTracks = mediaStream.getAudioTracks();
  if (audioTracks.length === 0) {
    stopMediaStreamTracks(mediaStream);
    throw createVoiceCaptureError(VOICE_CAPTURE_ERROR_NO_DEVICE, "No microphone detected");
  }

  if (audioTracks.every((track) => track.readyState === "ended")) {
    stopMediaStreamTracks(mediaStream);
    throw createVoiceCaptureError(VOICE_CAPTURE_ERROR_UNAVAILABLE, "Microphone unavailable");
  }

  return mediaStream;
}

function getVoiceTrackingFailureStatus(error) {
  if (/Missing Vosk model/i.test(String(error?.message || error || ""))) {
    return `🎤 Download ${getVoiceLanguageLabel()} model first`;
  }

  switch (error?.code) {
    case VOICE_CAPTURE_ERROR_PERMISSION_DENIED:
      return t("tele.status.micBlocked");
    case VOICE_CAPTURE_ERROR_NO_DEVICE:
      return t("tele.status.noMic");
    case VOICE_CAPTURE_ERROR_UNAVAILABLE:
      return t("tele.status.micUnavailable");
    default:
      return "🎤 Mic Request Failed";
  }
}

function getVoiceTrackingFeedbackKey(error) {
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

function getVoiceActionEntries(languageTag = getVoiceLanguageTag()) {
  return Object.entries(getActiveVoiceConfig(languageTag).actions);
}

function getVoiceWakePhrase(languageTag = getVoiceLanguageTag()) {
  return getActiveVoiceConfig(languageTag).wakeDisplay;
}

function getVoiceCommandFillerTokens(languageTag = getVoiceLanguageTag()) {
  return new Set(getActiveVoiceConfig(languageTag).filler);
}

function syncStateFromStorage() {
  const latest = loadState();
  Object.assign(state, latest);
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

  if (ui.pinButton) {
    ui.pinButton.classList.toggle("hidden", !isFreeDrag);
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
  const [position, size] = await Promise.all([
    appWindow.outerPosition?.().catch?.(() => null) ?? null,
    appWindow.outerSize?.().catch?.(() => null) ?? null
  ]);

  const gutterWidth = getSpeedRailWindowGutter();

  return {
    x: position ? position.x + gutterWidth : state.window?.x ?? null,
    y: position?.y ?? state.window?.y ?? null,
    width: size ? Math.max(size.width - gutterWidth, MIN_WIDTH) : state.window?.width ?? defaultState.window.width,
    height: size?.height ?? state.window?.height ?? defaultState.window.height
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
    ui.speedRailSlider.title = `${state.speed} ${t("common.wpm")}`;
  }
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

function setSpeedRailGutter(value) {
  const normalizedGutter = Math.max(0, Math.min(SPEED_RAIL_WINDOW_GUTTER, Number(value) || 0));
  document.documentElement.style.setProperty("--speed-rail-gutter-current", `${normalizedGutter}px`);
}

async function positionWindowForCurrentLayout(appWindow, gutterWidth = getSpeedRailWindowGutter()) {

  if (state.window.preset === "center" && tauriWindow.currentMonitor && tauriWindow.primaryMonitor) {
    const monitor = (await tauriWindow.currentMonitor()) ?? (await tauriWindow.primaryMonitor());
    if (monitor) {
      const x = monitor.position.x + Math.round((monitor.size.width - getBaseWindowWidth()) / 2) - gutterWidth;
      const y = monitor.position.y + Math.round((monitor.size.height - state.window.height) / 2);
      await appWindow.setPosition(new tauriDpi.PhysicalPosition(x, y));
      return;
    }
  }

  if (state.window.preset === "top-center" && tauriWindow.currentMonitor && tauriWindow.primaryMonitor) {
    const monitor = (await tauriWindow.currentMonitor()) ?? (await tauriWindow.primaryMonitor());
    if (monitor) {
      const x = monitor.position.x + Math.round((monitor.size.width - getBaseWindowWidth()) / 2) + TOP_CENTER_X_OFFSET - gutterWidth;
      await appWindow.setPosition(new tauriDpi.PhysicalPosition(x, monitor.position.y));
      return;
    }
  }

  if (state.window.x !== null && state.window.y !== null && tauriDpi.LogicalPosition) {
    await appWindow.setPosition(new tauriDpi.LogicalPosition(state.window.x - gutterWidth, state.window.y));
  }
}

async function applyWindowGeometry(appWindow, gutterWidth = getSpeedRailWindowGutter(), height = state.window.height) {
  if (!tauriDpi?.LogicalSize) {
    return;
  }

  const width = getBaseWindowWidth() + gutterWidth;
  await appWindow.setSize(new tauriDpi.LogicalSize(width, height)).catch(console.error);
  await positionWindowForCurrentLayout(appWindow, gutterWidth).catch(console.error);
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
  const normalizedSpeed = clamp(Number(nextSpeed) || state.speed, 60, 360);
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

function refreshPromptViewportMetrics() {
  if (!ui.promptViewport) {
    cachedPromptViewportWidth = 0;
    cachedPromptViewportHeight = 0;
    cachedPromptScrollableHeight = 0;
    return 0;
  }

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

function getPlaybackCountdownStepMs() {
  const currentSpeed = clamp(
    Number(state.speed) || defaultState.speed,
    PLAYBACK_COUNTDOWN_SPEED_MIN,
    PLAYBACK_COUNTDOWN_SPEED_MAX
  );
  const speedProgress =
    (currentSpeed - PLAYBACK_COUNTDOWN_SPEED_MIN) /
    (PLAYBACK_COUNTDOWN_SPEED_MAX - PLAYBACK_COUNTDOWN_SPEED_MIN);

  return Math.round(
    PLAYBACK_COUNTDOWN_BASE_STEP_MS -
      speedProgress * (PLAYBACK_COUNTDOWN_BASE_STEP_MS - PLAYBACK_COUNTDOWN_FASTEST_STEP_MS)
  );
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
  ui.playButton.title = isResume ? t("common.continue") : t("common.play");
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
  document.documentElement.style.setProperty("--teleprompter-font-family", resolveFontStack(appearance.fontFamily));
  document.documentElement.style.setProperty("--teleprompter-text-rgb", hexToRgbTriplet(appearance.textColor));
  document.documentElement.style.setProperty("--teleprompter-active-text", appearance.textColor);
  document.documentElement.style.setProperty("--teleprompter-text-opacity", String(clamp(appearance.textOpacity / 100, 0.1, 1)));

  if (getActiveMode() !== "scroll") {
    clearPromptScrollTransform();
  }
}

async function animateWindowHeight(targetHeight) {
  if (state.appearance?.performanceMode) {
    currentWindowHeight = targetHeight;
    if (tauriWindow?.getCurrentWindow && tauriDpi?.LogicalSize) {
      const appWindow = tauriWindow.getCurrentWindow();
      const width = getTargetWindowWidth();
      await appWindow.setSize(new tauriDpi.LogicalSize(width, targetHeight)).catch(console.error);
      await positionWindowForCurrentLayout(appWindow).catch(console.error);
    }
    return;
  }

  if (!tauriWindow?.getCurrentWindow || !tauriDpi?.LogicalSize) {
    currentWindowHeight = targetHeight;
    return;
  }

  const appWindow = tauriWindow.getCurrentWindow();
  const width = getTargetWindowWidth();
  const startHeight = currentWindowHeight ?? Math.max(state.window.height || defaultState.window.height, MIN_HEIGHT);

  if (startHeight === targetHeight) {
    currentWindowHeight = targetHeight;
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
      const nextHeight = Math.round(startHeight + (targetHeight - startHeight) * eased);

      if (nextHeight !== lastAppliedHeight) {
        lastAppliedHeight = nextHeight;
        currentWindowHeight = nextHeight;
        appWindow.setSize(new tauriDpi.LogicalSize(width, nextHeight)).catch(console.error);
        positionWindowForCurrentLayout(appWindow).catch(console.error);
      }

      if (progress < 1) {
        requestAnimationFrame((timestamp) => step(timestamp, startedAt));
        return;
      }

      currentWindowHeight = targetHeight;
      appWindow.setSize(new tauriDpi.LogicalSize(width, targetHeight)).catch(console.error);
      positionWindowForCurrentLayout(appWindow).catch(console.error).finally(resolve);
    };

    requestAnimationFrame((timestamp) => step(timestamp, timestamp));
  });
}

async function setCollapsed(nextValue) {
  if (isCollapsed === nextValue) return;

  if (nextValue && isPlaying) {
    stopPlayback(true);
  }

  const expandedHeight = Math.max(state.window.height || defaultState.window.height, MIN_HEIGHT);

  isCollapsed = nextValue;
  updateCollapseButton();

  if (isCollapsed) {
    document.body.classList.add("teleprompter-collapsing");
    document.body.classList.remove("teleprompter-expanding");
    document.body.classList.add("teleprompter-collapsed");
    await animateWindowHeight(COLLAPSED_HEIGHT);
    document.body.classList.remove("teleprompter-collapsing");
  } else {
    document.body.classList.add("teleprompter-expanding");
    document.body.classList.remove("teleprompter-collapsed", "teleprompter-collapsing");
    await animateWindowHeight(expandedHeight);
    await applyStoredWindowSettings();
    document.body.classList.remove("teleprompter-expanding");
  }

  if (!isCollapsed) {
    applyResponsiveText();
  }
}

function rebuildLineMap() {
  lineGroups = [];
  lineIndexByWord = new Array(wordNodes.length).fill(0);

  if (wordNodes.length === 0) {
    return;
  }

  let currentLine = null;

  wordNodes.forEach((node, index) => {
    const top = Math.round(node.offsetTop);
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

  if (includeHighlight && token.style.highlight) {
    span.classList.add("is-marked", `is-marked-${token.style.highlight}`);
  }

  return span;
}

function createDecorationGroupSpan(style) {
  const span = document.createElement("span");
  span.className = "prompt-highlight-group";

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

function getDecorationSignature(style = {}) {
  if (!style.highlight && !style.underline) {
    return "";
  }

  return JSON.stringify({
    highlight: style.highlight || null,
    underline: Boolean(style.underline)
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

  const closeDecorationGroup = () => {
    currentDecorationGroup = null;
    currentDecorationSignature = "";
  };

  tokens.forEach((token, tokenIndex) => {
    if (token.type === "word") {
      const decorationSignature = getDecorationSignature(token.style);
      const target = decorationSignature
        ? (() => {
            if (!currentDecorationGroup || currentDecorationSignature !== decorationSignature) {
              currentDecorationGroup = createDecorationGroupSpan(token.style);
              currentDecorationSignature = decorationSignature;
              fragment.appendChild(currentDecorationGroup);
            }

            return currentDecorationGroup;
          })()
        : (() => {
            closeDecorationGroup();
            return fragment;
          })();

      const span = createWordSpan(token, wordIndex, {
        includeHighlight: !token.style.highlight || !decorationSignature,
        includeUnderline: !token.style.underline || !decorationSignature
      });

      wordNodes.push(span);
      target.appendChild(span);
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
        fragment.appendChild(document.createTextNode(" "));
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
  voiceTranscript = "";
  pendingForwardVoiceSkip = null;
  resetVoiceCommandTranscript();
  stopViewportScrollAnimation();

  if (voiceRecognition?.remove || voiceTrackingMediaStream || voiceTrackingAudioContext) {
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
    setViewportPosition(totalScrollable * scrollProgress, "auto");
    const nextIndex = Math.min(Math.floor(scrollProgress * totalWords), Math.max(wordNodes.length - 1, 0));
    if (nextIndex !== currentIndex) {
      currentIndex = nextIndex;
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

      const matches = aliasTokens.every((aliasToken, index) => isVoiceAliasTokenFuzzyMatch(candidateTokens[index], aliasToken));
      if (!matches) {
        continue;
      }

      return {
        action,
        matchedPhrase: candidateTokens.slice(0, aliasTokens.length).join(" ")
      };
    }
  }

  const singleTokenAction = getVoiceCommandAction(candidateTokens[0], languageTag) || getVoiceCommandActionFuzzy(candidateTokens[0], languageTag);
  if (singleTokenAction) {
    return {
      action: singleTokenAction,
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
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
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
  return Boolean(
    window.Vosk?.createModel
    && navigator.mediaDevices?.getUserMedia
    && (window.AudioContext || window.webkitAudioContext)
  );
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
  return /permission|denied|notallowederror|missing vosk model|offline voice command model failed to load|failed to fetch|networkerror|asset/i.test(message);
}

async function resolveVoiceModelStatus(languageTag = getVoiceLanguageTag(), options = {}) {
  const normalizedLanguage = normalizeVoiceLanguage(languageTag);
  if (!options.force && voiceModelStatusCache.has(normalizedLanguage)) {
    return voiceModelStatusCache.get(normalizedLanguage);
  }

  if (!invoke) {
    return null;
  }

  try {
    const status = await invoke("get_voice_model_status", { language: normalizedLanguage });
    const normalizedStatus = status ? {
      ...status,
      language: normalizeVoiceLanguage(status.language || normalizedLanguage)
    } : null;
    voiceModelStatusCache.set(normalizedLanguage, normalizedStatus);
    return normalizedStatus;
  } catch (error) {
    console.error("Voice model status lookup failed", error);
    return null;
  }
}

async function getVoiceModelSourceUrl(languageTag = getVoiceLanguageTag(), options = {}) {
  const normalizedLanguage = normalizeVoiceLanguage(languageTag);
  const { preferBundledEnglish = false } = options;

  if (preferBundledEnglish && normalizedLanguage === ENGLISH_VOICE_LANGUAGE) {
    return VOSK_COMMAND_MODEL_URL;
  }

  if (invoke && convertFileSrc) {
    const status = await resolveVoiceModelStatus(normalizedLanguage, { force: true });
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

  if (voiceModels.has(normalizedLanguage)) {
    return voiceModels.get(normalizedLanguage);
  }

  if (voiceModelPromises.has(normalizedLanguage)) {
    return voiceModelPromises.get(normalizedLanguage);
  }

  if (!hasOfflineVoiceCommandSupport()) {
    return null;
  }

  const modelUrl = await getVoiceModelSourceUrl(normalizedLanguage, {
    preferBundledEnglish: normalizedLanguage === ENGLISH_VOICE_LANGUAGE
  });
  if (!modelUrl) {
    return null;
  }

  const modelPromise = window.Vosk.createModel(modelUrl, -1)
    .then((model) => {
      voiceModels.set(normalizedLanguage, model);
      voiceModelPromises.delete(normalizedLanguage);
      isVoiceCommandRecognitionBlocked = false;
      return model;
    })
    .catch((error) => {
      console.error("Offline voice command model failed to load", error);
      isVoiceCommandRecognitionBlocked = true;
      voiceModels.delete(normalizedLanguage);
      voiceModelPromises.delete(normalizedLanguage);
      throw error;
    });

  voiceModelPromises.set(normalizedLanguage, modelPromise);
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
        voiceCommandRecognition.engine === "web-speech"
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
    await invoke("hide_main_window");
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
  const { preserveError = false, preserveModel = false } = options;
  const usingWebSpeech = voiceCommandRecognition?.engine === "web-speech";
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

  if (voiceCommandRecognition?.engine === "web-speech") {
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

  const voiceTrackingUsesCommandLanguage = Boolean(voiceRecognition)
    && normalizeVoiceLanguage(getVoiceLanguageTag()) === normalizeVoiceLanguage(getVoiceCommandLanguageTag());
  if (!preserveModel && !voiceTrackingUsesCommandLanguage) {
    releaseOfflineVoiceModel(getVoiceCommandLanguageTag());
  }

  releaseUnusedVoiceModels([
    voiceRecognition ? getVoiceLanguageTag() : null,
    (!usingWebSpeech && (preserveModel || isVoiceCommandRecognizerActive() || shouldEnableVoiceCommandListener()))
      ? getVoiceCommandLanguageTag()
      : null
  ]);

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
    if (hasSpeechRecognitionSupport()) {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognizer = new SpeechRecognitionClass();
      recognizer.engine = "web-speech";
      recognizer.lang = getVoiceCommandLanguageTag();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.maxAlternatives = 3;
      recognizer.onaudiostart = () => {
        lastVoiceCommandAudioProcessAt = performance.now();
      };
      recognizer.onaudioend = () => {
        lastVoiceCommandAudioProcessAt = performance.now();
      };
      recognizer.onresult = (event) => {
        lastVoiceCommandAudioProcessAt = performance.now();
        handleBrowserSpeechRecognitionResult(event);
      };
      recognizer.onerror = (event) => {
        if (listenerSession !== voiceCommandListenerSession) {
          return;
        }

        const error = event?.error || event;
        lastVoiceCommandError = getVoiceCommandErrorMessage(error);
        isVoiceCommandRecognitionBlocked = shouldBlockVoiceCommandRecognition(error);
        updateVoiceCommandIndicator();
      };
      recognizer.onend = () => {
        if (listenerSession !== voiceCommandListenerSession || voiceCommandRecognition !== recognizer) {
          return;
        }

        voiceCommandRecognition = null;
        updateVoiceCommandIndicator();

        if (shouldEnableVoiceCommandListener() && !isVoiceCommandRecognitionBlocked) {
          scheduleVoiceCommandListenerRestart(180);
        }
      };

      voiceCommandRecognition = recognizer;
      lastVoiceCommandAudioProcessAt = performance.now();
      releaseUnusedVoiceModels([
        voiceRecognition ? getVoiceLanguageTag() : null
      ]);
      recognizer.start();
      isVoiceCommandRecognitionBlocked = false;
      updateVoiceCommandIndicator();
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const soundInputSettings = getSoundInputSettings();
    const mediaStream = await requestVoiceCaptureMediaStream(soundInputSettings);
    if (!shouldEnableVoiceCommandListener() || listenerSession !== voiceCommandListenerSession) {
      stopMediaStreamTracks(mediaStream);
      return;
    }

    const languageTag = getVoiceCommandLanguageTag();
    let model = null;
    try {
      model = await ensureOfflineVoiceCommandModel(languageTag);
    } catch (error) {
      stopMediaStreamTracks(mediaStream);
      throw error;
    }

    if (!model || !shouldEnableVoiceCommandListener() || listenerSession !== voiceCommandListenerSession) {
      stopMediaStreamTracks(mediaStream);
      return;
    }

    voiceCommandMediaStream = mediaStream;
    voiceCommandSharedWithTracking = false;
    voiceCommandAudioContext = new AudioContextClass({ sampleRate: 16000 });
    if (listenerSession !== voiceCommandListenerSession) {
      stopMediaStreamTracks(mediaStream);
      await voiceCommandAudioContext.close().catch(() => {});
      voiceCommandAudioContext = null;
      return;
    }

    await resumeOfflineVoiceCommandAudioContext();
    installOfflineVoiceCommandResumeListeners();

    voiceCommandRecognition = createVoiceCommandRecognizer(model, voiceCommandAudioContext.sampleRate, languageTag);
    lastVoiceCommandAudioProcessAt = performance.now();

    const captureNodes = await createVoiceCaptureNode(voiceCommandAudioContext, mediaStream, (samples, sampleRate) => {
      acceptVoiceCommandSamples(samples, sampleRate);
    }, {
      soundInputSettings,
      preferScriptProcessor: true
    });

    voiceCommandSourceNode = captureNodes.sourceNode;
    voiceCommandProcessorNode = captureNodes.processorNode;
    voiceCommandSilenceNode = captureNodes.silenceNode;

    if (listenerSession !== voiceCommandListenerSession || !shouldEnableVoiceCommandListener()) {
      await stopVoiceCommandListener();
      return;
    }

    isVoiceCommandRecognitionBlocked = false;
    updateVoiceCommandIndicator();
  } catch (error) {
    console.error("Offline voice command listener failed to start", error);
    lastVoiceCommandError = getVoiceCommandErrorMessage(error);
    isVoiceCommandRecognitionBlocked = shouldBlockVoiceCommandRecognition(error);
    await stopVoiceCommandListener({ preserveError: true });
    isVoiceCommandRecognitionBlocked = shouldBlockVoiceCommandRecognition(error);
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
        await stopVoiceCommandListener({ preserveModel: shouldEnableVoiceCommandListener() });
      }

      if (shouldEnableVoiceCommandListener()) {
        if (isPlaying && getActiveMode() === "voice") {
          if (voiceTrackingAudioContext && voiceTrackingMediaStream && voiceRecognition?.acceptWaveformFloat) {
            await attachVoiceCommandRecognizerToTracking(voiceTrackingAudioContext.sampleRate);
            return;
          }

          if (!forceReset && voiceCommandSharedWithTracking) {
            return;
          }

          await stopVoiceCommandListener({ preserveModel: true });
          return;
        }

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
    if (voiceCommandRecognition || voiceCommandMediaStream || voiceCommandAudioContext) {
      stopVoiceCommandListener().catch(console.error);
    }
    scheduleVoiceHealthCheck(VOICE_HEALTH_IDLE_CHECK_MS);
    return;
  }

  if (isPlaying && getActiveMode() === "voice") {
    if (!voiceRecognition || !voiceTrackingAudioContext || !voiceTrackingMediaStream) {
      playVoiceMode();
      scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
      return;
    }

    const trackingTracks = voiceTrackingMediaStream.getAudioTracks();
    if (trackingTracks.length === 0 || trackingTracks.some((track) => track.readyState === "ended")) {
      stopVoiceTracking()
        .catch(console.error)
        .finally(() => {
          if (isPlaying && getActiveMode() === "voice") {
            playVoiceMode();
          }
        });
      scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
      return;
    }

    if (lastVoiceTrackingAudioProcessAt > 0 && performance.now() - lastVoiceTrackingAudioProcessAt > 3000) {
      stopVoiceTracking()
        .catch(console.error)
        .finally(() => {
          if (isPlaying && getActiveMode() === "voice") {
            playVoiceMode();
          }
        });
      scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
      return;
    }
  }

  if (shouldEnableVoiceCommandListener() && !isVoiceCommandRecognitionStarting) {
    const usingWebSpeech = voiceCommandRecognition?.engine === "web-speech";

    if (isPlaying && getActiveMode() === "voice" && voiceTrackingAudioContext && voiceTrackingMediaStream && voiceRecognition?.acceptWaveformFloat) {
      if (!isVoiceCommandRecognizerActive()) {
        attachVoiceCommandRecognizerToTracking(voiceTrackingAudioContext.sampleRate)
          .catch(console.error)
          .finally(() => {
            scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
          });
        return;
      }
    } else if (!isVoiceCommandRecognizerActive()) {
      syncVoiceCommandListener({ forceReset: true });
      scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
      return;
    }

    if (usingWebSpeech) {
      scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
      return;
    }

    if (!voiceCommandSharedWithTracking) {
      const tracks = voiceCommandMediaStream?.getAudioTracks() || [];
      if (tracks.length === 0 || tracks.some((track) => track.readyState === "ended")) {
        syncVoiceCommandListener({ forceReset: true });
        scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
        return;
      }

      if (voiceCommandAudioContext?.state === "suspended") {
        resumeOfflineVoiceCommandAudioContext().catch(() => {});
        scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
        return;
      }

      if (voiceCommandAudioContext && voiceCommandAudioContext.state === "closed") {
        syncVoiceCommandListener({ forceReset: true });
        scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
        return;
      }
    }

    if (
      !voiceCommandSharedWithTracking
      && voiceCommandAudioContext?.state === "running"
      && lastVoiceCommandAudioProcessAt > 0
      && performance.now() - lastVoiceCommandAudioProcessAt > VOICE_COMMAND_STALL_RESET_MS
    ) {
      syncVoiceCommandListener({ forceReset: true });
      scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
      return;
    }
  }

  scheduleVoiceHealthCheck(shouldMonitorVoiceHealth() ? VOICE_HEALTH_ACTIVE_CHECK_MS : VOICE_HEALTH_IDLE_CHECK_MS);
}

function installVoiceCommandDebugHelpers() {
  window.__flowVoiceDebug = {
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
    getState() {
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
    reset() {
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
  const trackingLanguageTag = activeVoiceTrackingLanguageTag || getVoiceLanguageTag();
  voiceTrackingSession += 1;
  activeVoiceTrackingLanguageTag = null;
  lastVoiceTrackingAudioProcessAt = 0;
  lastVoiceTrackingPartialHandledAt = 0;
  lastVoiceTrackingPartialKey = "";
  clearPendingForwardVoiceSkip();

  disconnectVoiceTrackingAudioGraph();

  if (voiceRecognition?.remove) {
    try {
      voiceRecognition.remove();
    } catch (error) {
      // Recognizer already removed.
    }
  }

  voiceRecognition = null;

  if (voiceCommandSharedWithTracking && voiceCommandRecognition?.remove) {
    try {
      voiceCommandRecognition.remove();
    } catch (error) {
      // Recognizer already removed.
    }
  }

  if (voiceCommandSharedWithTracking) {
    voiceCommandRecognition = null;
    voiceCommandSharedWithTracking = false;
    lastVoiceCommandAudioProcessAt = 0;
    updateVoiceCommandIndicator();
  }

  if (voiceTrackingMediaStream) {
    voiceTrackingMediaStream.getTracks().forEach((track) => {
      track.enabled = false;
      track.stop();
    });
    voiceTrackingMediaStream = null;
  }

  await disposeVoiceTrackingAudioContext();

  const trackingModelNeededForCommands = isVoiceCommandRecognizerActive()
    && normalizeVoiceLanguage(trackingLanguageTag) === normalizeVoiceLanguage(getVoiceCommandLanguageTag());
  if (!trackingModelNeededForCommands) {
    releaseOfflineVoiceModel(trackingLanguageTag);
  }

  releaseUnusedVoiceModels([
    voiceCommandRecognition?.engine && voiceCommandRecognition.engine !== "web-speech"
      ? getVoiceCommandLanguageTag()
      : null,
    voiceRecognition ? getVoiceLanguageTag() : null
  ]);
}

function applyVoiceTrackingTranscript(transcript, options = {}) {
  const text = String(transcript || "").trim();
  if (!text || !isPlaying || getActiveMode() !== "voice") {
    return;
  }

  const { isFinal = false } = options;
  if (isPaused) {
    return;
  }

  if (!isFinal) {
    const now = performance.now();
    const partialTokens = tokenizeNormalizedText(text);
    const partialKey = partialTokens.slice(-3).join(" ");

    if (!partialKey) {
      return;
    }

    if (partialKey === lastVoiceTrackingPartialKey && now - lastVoiceTrackingPartialHandledAt < 400) {
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
      || findVoiceLineMatch(spokenTokens, isFinal ? { radius: 1, allowExact: true } : { radius: 1, allowExact: false })
  ));
  const bestMatchIndex = bestLineMatch?.matchedWordIndex ?? -1;

  if (bestMatchIndex >= 0 && bestMatchIndex !== currentIndex) {
    if (bestMatchIndex < currentIndex) {
      return;
    }

    const previousLineIndex = lineIndexByWord[currentIndex] ?? 0;
    const nextLineIndex = bestLineMatch?.lineIndex ?? previousLineIndex;
    currentIndex = bestMatchIndex;
    updateWordState(nextLineIndex !== previousLineIndex);

    if (currentIndex >= wordNodes.length - 1) {
      finishPlayback();
      stopVoiceTracking().catch(console.error);
    }
  }
}

async function startVoiceTracking() {
  if (!hasOfflineVoiceCommandSupport()) {
    throw new Error("Vosk voice recognition is not supported");
  }

  if (voiceRecognition?.remove && voiceTrackingAudioContext && voiceTrackingMediaStream) {
    return;
  }

  const session = ++voiceTrackingSession;
  syncStateFromStorage();
  const languageTag = getVoiceLanguageTag();
  rebuildNormalizedScriptTokenMap(languageTag);
  const soundInputSettings = getSoundInputSettings();
  const mediaStream = await requestVoiceCaptureMediaStream(soundInputSettings);
  if (session !== voiceTrackingSession) {
    stopMediaStreamTracks(mediaStream);
    return;
  }

  let model = null;
  try {
    model = await ensureOfflineVoiceCommandModel(languageTag);
  } catch (error) {
    stopMediaStreamTracks(mediaStream);
    throw error;
  }

  if (session !== voiceTrackingSession) {
    stopMediaStreamTracks(mediaStream);
    releaseUnusedVoiceModels([
      voiceCommandRecognition?.engine && voiceCommandRecognition.engine !== "web-speech"
        ? getVoiceCommandLanguageTag()
        : null,
      voiceRecognition ? activeVoiceTrackingLanguageTag : null
    ]);
    return;
  }

  if (!model) {
    stopMediaStreamTracks(mediaStream);
    throw new Error(`Missing Vosk model for ${getVoiceLanguageLabel(languageTag)}`);
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  voiceTrackingMediaStream = mediaStream;
  voiceTrackingAudioContext = new AudioContextClass({ sampleRate: 16000 });
  if (session !== voiceTrackingSession) {
    stopMediaStreamTracks(mediaStream);
    await disposeVoiceTrackingAudioContext();
    return;
  }

  if (voiceTrackingAudioContext.state === "suspended") {
    try {
      await voiceTrackingAudioContext.resume();
    } catch (error) {
      // Resume may require a user gesture in some webviews.
    }

    if (session !== voiceTrackingSession) {
      stopMediaStreamTracks(mediaStream);
      await disposeVoiceTrackingAudioContext();
      return;
    }
  }

  const recognizer = new model.KaldiRecognizer(voiceTrackingAudioContext.sampleRate);
  recognizer.on("partialresult", (message) => {
    applyVoiceTrackingTranscript(message?.result?.partial, { isFinal: false });
  });
  recognizer.on("result", (message) => {
    applyVoiceTrackingTranscript(getVoskResultText(message), {
      isFinal: true,
      confidence: getAverageVoskWordConfidence(getVoskResultWords(message)),
      wakeConfidence: getWakePhraseConfidence(message, languageTag)
    });
  });

  voiceRecognition = recognizer;
  activeVoiceTrackingLanguageTag = languageTag;
  lastVoiceTrackingAudioProcessAt = performance.now();

  if (shouldEnableVoiceCommandListener() || (isPlaying && getActiveMode() === "voice")) {
    try {
      await attachVoiceCommandRecognizerToTracking(voiceTrackingAudioContext.sampleRate);
    } catch (error) {
      console.error("Offline voice command recognizer failed to attach to tracking", error);
      lastVoiceCommandError = getVoiceCommandErrorMessage(error);
      isVoiceCommandRecognitionBlocked = shouldBlockVoiceCommandRecognition(error);
      updateVoiceCommandIndicator();
    }

    if (session !== voiceTrackingSession) {
      stopMediaStreamTracks(mediaStream);
      await disposeVoiceTrackingAudioContext();
      return;
    }
  }

  const captureNodes = await createVoiceCaptureNode(voiceTrackingAudioContext, mediaStream, (samples, sampleRate) => {
    if (!voiceRecognition?.acceptWaveformFloat) {
      return;
    }

    lastVoiceTrackingAudioProcessAt = performance.now();

    try {
      voiceRecognition.acceptWaveformFloat(samples, sampleRate);
    } catch (error) {
      console.error("Vosk voice tracking audio processing failed", error);
    }

    if (voiceCommandSharedWithTracking) {
      acceptVoiceCommandSamples(samples, sampleRate);
    }
  }, { soundInputSettings });

  if (session !== voiceTrackingSession) {
    if (captureNodes.sourceNode) {
      try {
        captureNodes.sourceNode.disconnect();
      } catch (error) {
        // Node already disconnected.
      }
    }

    if (captureNodes.processorNode) {
      try {
        captureNodes.processorNode.disconnect();
      } catch (error) {
        // Node already disconnected.
      }
      if (captureNodes.processorNode.port) {
        captureNodes.processorNode.port.onmessage = null;
      }
      captureNodes.processorNode.onaudioprocess = null;
    }

    if (captureNodes.silenceNode) {
      try {
        captureNodes.silenceNode.disconnect();
      } catch (error) {
        // Node already disconnected.
      }
    }

    stopMediaStreamTracks(mediaStream);
    await disposeVoiceTrackingAudioContext();
    return;
  }

  voiceTrackingSourceNode = captureNodes.sourceNode;
  voiceTrackingProcessorNode = captureNodes.processorNode;
  voiceTrackingSilenceNode = captureNodes.silenceNode;
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
    if (!response.ok) {
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
  const previousAppWideVoiceCommands = Boolean(state.appearance?.appWideVoiceCommands);
  const previousVoiceCaptureSettings = getVoiceCaptureSettingsSignature();
  const previousState = {
    script: state.script,
    speed: state.speed,
    language: state.language,
    desktop: JSON.stringify(state.desktop),
    remote: JSON.stringify(state.remote),
    appearance: JSON.stringify(state.appearance),
    window: JSON.stringify(state.window)
  };

  syncStateFromStorage();
  state.desktop = state.desktop || structuredClone(defaultState.desktop);
  const nextVoiceLanguage = getVoiceLanguageTag();
  const voiceLanguageChanged = previousVoiceLanguage !== nextVoiceLanguage;
  const appWideVoiceCommandsChanged = previousAppWideVoiceCommands !== Boolean(state.appearance?.appWideVoiceCommands);
  const voiceCaptureSettingsChanged = previousVoiceCaptureSettings !== getVoiceCaptureSettingsSignature();
  syncVoiceCommandListener({ forceReset: voiceLanguageChanged || appWideVoiceCommandsChanged || voiceCaptureSettingsChanged });

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

    if ((voiceLanguageChanged || voiceCaptureSettingsChanged) && isPlaying && getActiveMode() === "voice") {
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
    setSpeedValue(ui.speedRailSlider.value);
  });
  ui.speedRailSlider.addEventListener("change", () => {
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
    invoke?.("close_app").catch((error) => {
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
  window.addEventListener("keydown", handlePlaybackHotkeys);
  window.addEventListener("beforeunload", () => {
    if (speedPersistTimer) {
      flushPendingSpeedPersist();
    }
    stopVoiceCommandListener();
    stopVoiceTracking();
    disarmVoiceCommandListener();
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
  });

  resizeObserver = new ResizeObserver(() => {
    applyResponsiveText();
  });
  resizeObserver.observe(ui.promptViewport);
}

async function applyStoredWindowSettings() {
  if (!tauriWindow?.getCurrentWindow || !tauriDpi?.LogicalSize) return;

  const appWindow = tauriWindow.getCurrentWindow();
  state.window.width = getBaseWindowWidth();
  state.window.height = Math.max(state.window.height || defaultState.window.height, MIN_HEIGHT);

  setSpeedRailGutter(getSpeedRailWindowGutter());

  if (isCollapsed) {
    return;
  }

  await appWindow.setSize(new tauriDpi.LogicalSize(getTargetWindowWidth(), state.window.height));
  currentWindowHeight = state.window.height;

  await positionWindowForCurrentLayout(appWindow);
}

window.addEventListener("DOMContentLoaded", () => {
  syncStateFromStorage();
  state.desktop = state.desktop || structuredClone(defaultState.desktop);
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
});



