/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { normalizeVoiceLanguage } from "../shared.js";
import {
  VOICE_LANGUAGE_CONFIGS,
  VOICE_COMMAND_LOOKBACK_TOKENS,
  VOICE_COMMAND_BUFFER_TOKEN_LIMIT,
  VOICE_COMMAND_EXACT_SINGLE_TOKEN_ACTIONS,
  VOICE_COMMAND_ACTION_DEDUPE_ACTIONS,
  VOICE_COMMAND_REPEAT_GUARD_MS,
  VOICE_COMMAND_ACTION_REPEAT_GUARD_MS,
  VOICE_COMMAND_SOUND_REPEAT_GUARD_MS,
  VOICE_COMMAND_RESTART_DELAY_MS,
  VOICE_COMMAND_COOLDOWN_MS,
  VOICE_WAKE_VISUAL_MS,
  VOICE_WAKE_COMMAND_WINDOW_MS,
  VOICE_WAKE_COOLDOWN_MS,
  VOICE_WAKE_MIN_CONFIDENCE,
  VOICE_HEALTH_IDLE_CHECK_MS,
  VOICE_HEALTH_ACTIVE_CHECK_MS
} from "./voice-constants.js";
import { tokenizeNormalizedText } from "./prompt-renderer.js";

const VOICE_COMMAND_SOUND_URL = new URL("../assets/sounds/voice-command.mp3", import.meta.url).href;

export function getOfflineVoiceCommandGrammar(languageTag = "en") {
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

export function shouldBlockVoiceCommandRecognition(error) {
  const message = String(error?.message || error || "").trim();
  return /permission|denied|notallowederror|missing vosk model|failed to fetch|networkerror|asset|no microphone|microphone unavailable|failed to start microphone capture|failed to activate microphone capture/i.test(message);
}

export function getVoiceCommandErrorMessage(error, t = (k) => k) {
  const message = String(error?.message || error || "").trim();

  if (/Missing Vosk model/i.test(message)) {
    return "🎤 Vosk model not downloaded";
  }

  if (/No microphone detected/i.test(message)) {
    return t("tele.status.noMic");
  }

  if (/Microphone unavailable|Failed to read microphone config|Failed to enumerate microphone formats/i.test(message)) {
    return t("tele.status.micUnavailable");
  }

  return message ? `🎤 ${message}` : "🎤 Voice commands unavailable";
}

export function getActiveVoiceConfig(languageTag = "en") {
  return VOICE_LANGUAGE_CONFIGS[normalizeVoiceLanguage(languageTag)] || VOICE_LANGUAGE_CONFIGS["en-US"];
}

export function getVoiceActionEntries(languageTag = "en") {
  return Object.entries(getActiveVoiceConfig(languageTag).actions);
}

export function getVoiceWakePhrase(languageTag = "en") {
  return getActiveVoiceConfig(languageTag).wakeDisplay;
}

export function getVoiceCommandFillerTokens(languageTag = "en") {
  return new Set(getActiveVoiceConfig(languageTag).filler);
}

export function getVoiceCommandAction(phrase, languageTag = "en") {
  for (const [action, aliases] of getVoiceActionEntries(languageTag)) {
    if (aliases.includes(phrase)) {
      return action;
    }
  }

  return null;
}

export function isVoiceGreetingToken(token, languageTag = "en") {
  if (!token) {
    return false;
  }

  const config = getActiveVoiceConfig(languageTag);
  return config.greetings.some((greeting) => isVoiceAliasTokenFuzzyMatch(token, greeting));
}

export function isVoiceWakeToken(token, languageTag = "en") {
  if (!token) {
    return false;
  }

  const config = getActiveVoiceConfig(languageTag);
  if (config.wake.includes(token)) {
    return true;
  }

  return token.startsWith("flo");
}

export function isVoiceWakeSequence(tokens, index, languageTag = "en") {
  return isVoiceGreetingToken(tokens[index], languageTag) && isVoiceWakeToken(tokens[index + 1], languageTag);
}

export function findVoiceWakeMatch(tokens, languageTag = "en") {
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

export function findVoiceWakeIndex(tokens, languageTag = "en") {
  return findVoiceWakeMatch(tokens, languageTag)?.index ?? -1;
}

export function hasVoiceWakePhrase(text, languageTag = "en") {
  const tokens = tokenizeNormalizedText(text, languageTag);
  return Boolean(findVoiceWakeMatch(tokens, languageTag));
}

export function getVoiceCommandActionFuzzy(phrase, languageTag = "en") {
  for (const [action, aliases] of getVoiceActionEntries(languageTag)) {
    if (aliases.some((alias) => phrase === alias || phrase.startsWith(alias) || alias.startsWith(phrase))) {
      return action;
    }
  }

  return null;
}

export function isVoiceAliasTokenMatch(spokenToken, aliasToken) {
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

export function getVoiceTokenEditDistance(left, right) {
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

export function isVoiceAliasTokenFuzzyMatch(spokenToken, aliasToken) {
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

export function getVoiceCommandActionFromTokens(candidateTokens, languageTag = "en") {
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

export function collectVoiceCommandCandidateTokens(tokens, startIndex, languageTag = "en", options = {}) {
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

export function extractVoiceCommandWithoutWake(text, languageTag = "en") {
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

export function getVoskResultText(message) {
  return String(message?.result?.text || "").trim();
}

export function getVoskResultWords(message) {
  return Array.isArray(message?.result?.result) ? message.result.result : [];
}

export function getAverageVoskWordConfidence(words = []) {
  const validConfidences = words
    .map((word) => Number(word?.conf))
    .filter((confidence) => Number.isFinite(confidence) && confidence >= 0);

  if (validConfidences.length === 0) {
    return 0;
  }

  return validConfidences.reduce((sum, confidence) => sum + confidence, 0) / validConfidences.length;
}

export function getWakePhraseConfidence(message, languageTag = "en") {
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

export function createVoiceCommandListener({
  state,
  ui,
  t,
  getVoiceCommandLanguageTag = () => "en",
  getActiveMode = () => "highlight",
  getIsPlaying = () => false,
  getIsPaused = () => false,
  handleVoiceCommandAction = () => false,
  ensureNativeVoiceEventListener = async () => {},
  buildNativeVoicePayload = () => ({}),
  getIsVoiceTrackingActive = () => false,
  getIsVoiceTrackingStarting = () => false,
  playVoiceMode = () => {},
  invoke = window.__TAURI__?.core?.invoke
} = {}) {
  let voiceCommandRecognition = null;
  let voiceCommandMediaStream = null;
  let voiceCommandAudioContext = null;
  let voiceCommandSharedWithTracking = false;
  let voiceCommandTranscript = "";
  let voiceCommandListenerSession = 0;
  let voiceCommandCooldownUntil = 0;
  let voiceCommandRestartTimer = null;
  let voiceCommandSyncPromise = Promise.resolve();
  let voiceCommandHealthTimer = null;
  let voiceCommandAudio = null;
  let voiceCommandSoundAssetAvailable = true;
  let voiceCommandFallbackAudioContext = null;
  let voiceWakeActiveUntil = 0;
  let voiceWakeAwaitingFollowup = false;
  let voiceWakeOverlayTimer = null;
  let isVoiceCommandRecognitionStarting = false;
  let isVoiceCommandRecognitionBlocked = false;
  let lastVoiceCommandError = "";
  let lastVoiceCommandKey = "";
  let lastVoiceCommandAt = 0;
  let lastVoiceCommandAction = "";
  let lastVoiceCommandActionAt = 0;
  let lastVoiceCommandSoundKey = "";
  let lastVoiceCommandSoundAt = 0;
  let lastVoiceCommandAudioProcessAt = 0;

  function shouldEnableVoiceCommandListener() {
    return Boolean(state.appearance?.appWideVoiceCommands);
  }

  function isVoiceWakeActive() {
    return performance.now() < voiceWakeActiveUntil;
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
    voiceWakeActiveUntil = 0;
    voiceWakeAwaitingFollowup = false;
    resetVoiceCommandTranscript();

    if (voiceWakeOverlayTimer) {
      clearTimeout(voiceWakeOverlayTimer);
      voiceWakeOverlayTimer = null;
    }

    updateVoiceCommandIndicator();
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
    voiceWakeActiveUntil = now + VOICE_WAKE_COMMAND_WINDOW_MS;
    voiceWakeAwaitingFollowup = awaitFollowup;
    resetVoiceCommandGuard();
    resetVoiceCommandTranscript();
    showVoiceWakeOverlay(VOICE_WAKE_VISUAL_MS);
    updateVoiceCommandIndicator();
  }

  function appendVoiceCommandTranscript(text, languageTag = getVoiceCommandLanguageTag()) {
    const nextTokens = tokenizeNormalizedText(`${voiceCommandTranscript} ${text}`, languageTag);
    voiceCommandTranscript = nextTokens.slice(-VOICE_COMMAND_BUFFER_TOKEN_LIMIT).join(" ");
  }

  function isVoiceCommandRecognizerActive() {
    return Boolean(
      voiceCommandRecognition
        && (
          voiceCommandRecognition.engine === "native"
          || voiceCommandRecognition.engine === "web-speech"
          || voiceCommandSharedWithTracking
          || (voiceCommandMediaStream && voiceCommandAudioContext)
        )
    );
  }

  function updateVoiceCommandStatusLabel() {
    if (!ui.statusLabel || getIsPlaying()) {
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
    const enabled = (
      shouldEnableVoiceCommandListener()
      || isVoiceCommandRecognizerActive()
      || isVoiceCommandRecognitionStarting
      || isVoiceWakeActive()
      || voiceCommandSharedWithTracking
      || (getIsPlaying() && getActiveMode() === "voice")
    );
    const active = isVoiceCommandRecognizerActive() || (getIsPlaying() && getActiveMode() === "voice");
    const wakeActive = isVoiceWakeActive();
    const stateLabel = !enabled
      ? "off"
      : isVoiceCommandRecognitionBlocked
        ? "blocked"
        : wakeActive
          ? "wake"
          : active
            ? "listening"
            : isVoiceCommandRecognitionStarting
              ? "starting"
              : "off";

    const description = stateLabel === "blocked" && lastVoiceCommandError
      ? lastVoiceCommandError
      : `Voice commands: ${stateLabel}`;

    [ui.voiceCommandIndicator, ui.collapsedVoiceIndicator].forEach((indicator) => {
      if (!indicator) return;
      indicator.classList.toggle("hidden", !enabled);
      indicator.dataset.state = stateLabel;
      indicator.title = description;
      indicator.setAttribute("aria-label", description);
    });

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
      // Ignore reset issues.
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

  function processVoiceCommand(command, options = {}) {
    if (!command || !shouldHandleVoiceCommand(command)) {
      return false;
    }

    const { playSound = true } = options;
    resetVoiceCommandTranscript();
    beginVoiceCommandCooldown();
    const handled = handleVoiceCommandAction(command.action);

    if (handled && playSound) {
      playVoiceCommandRecognitionSound(command);
    }

    return handled;
  }

  function handleOfflineVoiceCommandTranscript(text, options = {}) {
    if (getIsPlaying() && !getIsPaused() && getActiveMode() === "voice") {
      return { handled: false, consumed: false };
    }

    const transcript = String(text || "").trim();
    if (!transcript) {
      return { handled: false, consumed: false };
    }

    const languageTag = getVoiceCommandLanguageTag();
    const { isFinal = false, confidence = 0, wakeConfidence = 0 } = options;
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
  function ensureVoiceCommandRecognition() {
    if (!invoke) {
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
      startVoiceCommandListener().catch(console.error);
    }, delay);
  }

  async function startVoiceCommandListener(options = {}) {
    const { force = false } = options;
    if (force) {
      isVoiceCommandRecognitionBlocked = false;
      lastVoiceCommandError = "";
    }

    if (!shouldEnableVoiceCommandListener() || isVoiceCommandRecognitionStarting || (isVoiceCommandRecognitionBlocked && !force) || performance.now() < voiceCommandCooldownUntil) {
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
      voiceCommandSharedWithTracking = Boolean(getIsVoiceTrackingActive());
      lastVoiceCommandAudioProcessAt = performance.now();
      isVoiceCommandRecognitionBlocked = false;
      updateVoiceCommandIndicator();
    } catch (error) {
      console.error("Native voice command listener failed to start", error);
      lastVoiceCommandError = getVoiceCommandErrorMessage(error, t);
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

  async function stopVoiceCommandListener(options = {}) {
    const { preserveError = false } = options;
    voiceCommandListenerSession += 1;
    isVoiceCommandRecognitionStarting = false;
    resetVoiceCommandTranscript();
    lastVoiceCommandAudioProcessAt = 0;
    clearVoiceWakeState();
    if (!preserveError) {
      lastVoiceCommandError = "";
    }

    if (voiceCommandRecognition?.engine === "native" && invoke) {
      try {
        await invoke("stop_voice_command_listener");
      } catch (error) {
        console.error("Native voice command listener failed to stop", error);
      }
    }

    voiceCommandRecognition = null;
    voiceCommandSharedWithTracking = false;
    updateVoiceCommandIndicator();
  }

  function syncVoiceCommandListener(options = {}) {
    const { forceReset = false } = options;

    scheduleVoiceHealthCheck(0);

    voiceCommandSyncPromise = voiceCommandSyncPromise
      .catch(() => {})
      .then(async () => {
        if (forceReset) {
          isVoiceCommandRecognitionBlocked = false;
          lastVoiceCommandError = "";
          await stopVoiceCommandListener();
        }

        if (shouldEnableVoiceCommandListener()) {
          await startVoiceCommandListener({ force: forceReset });
          return;
        }

        await stopVoiceCommandListener();
      });

    return voiceCommandSyncPromise;
  }

  function shouldMonitorVoiceHealth() {
    return shouldEnableVoiceCommandListener() || (getIsPlaying() && getActiveMode() === "voice");
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

    if (getIsPlaying() && getActiveMode() === "voice" && !getIsVoiceTrackingActive() && !getIsVoiceTrackingStarting()) {
      playVoiceMode();
      scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
      return;
    }

    if (shouldEnableVoiceCommandListener() && !isVoiceCommandRecognitionStarting && !isVoiceCommandRecognitionBlocked) {
      if (!isVoiceCommandRecognizerActive()) {
        syncVoiceCommandListener({ forceReset: true });
        scheduleVoiceHealthCheck(VOICE_HEALTH_ACTIVE_CHECK_MS);
        return;
      }
    }

    scheduleVoiceHealthCheck(shouldMonitorVoiceHealth() && !isVoiceCommandRecognitionBlocked ? VOICE_HEALTH_ACTIVE_CHECK_MS : VOICE_HEALTH_IDLE_CHECK_MS);
  }

  function handleNativeVoiceCommandEvent(payload) {
    if (!payload?.stage) {
      return;
    }

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
      lastVoiceCommandError = getVoiceCommandErrorMessage(payload.error || "Voice commands unavailable", t);
      isVoiceCommandRecognitionBlocked = true;
      voiceCommandRecognition = null;
      voiceCommandSharedWithTracking = Boolean(getIsVoiceTrackingActive());
      updateVoiceCommandIndicator();
      return;
    }

    if (payload.stage === "stopped" && !isVoiceCommandRecognitionStarting) {
      voiceCommandRecognition = null;
      voiceCommandSharedWithTracking = false;
      updateVoiceCommandIndicator();
    }
  }

  return {
    isVoiceCommandRecognizerActive,
    isVoiceWakeActive,
    activateVoiceWake,
    clearVoiceWakeState,
    showVoiceWakeOverlay,
    handleOfflineVoiceCommandTranscript,
    extractVoiceCommand,
    processVoiceCommand,
    playVoiceCommandRecognitionSound,
    startVoiceCommandListener,
    stopVoiceCommandListener,
    syncVoiceCommandListener,
    shouldMonitorVoiceHealth,
    scheduleVoiceHealthCheck,
    startVoiceCommandHealthMonitor,
    handleNativeVoiceCommandEvent,
    updateVoiceCommandIndicator,
    updateVoiceCommandStatusLabel,
    resetVoiceCommandGuard,
    resetVoiceCommandTranscript,
    ensureVoiceCommandRecognition,
    clearVoiceCommandRestartTimer,
    scheduleVoiceCommandListenerRestart,
    getVoiceCommandRecognition: () => voiceCommandRecognition,
    getIsVoiceCommandRecognitionStarting: () => isVoiceCommandRecognitionStarting,
    getIsVoiceCommandRecognitionBlocked: () => isVoiceCommandRecognitionBlocked,
    getVoiceCommandSharedWithTracking: () => voiceCommandSharedWithTracking,
    getLastVoiceCommandError: () => lastVoiceCommandError,
    getLastVoiceCommandAudioProcessAt: () => lastVoiceCommandAudioProcessAt,
    setIsVoiceCommandRecognitionBlocked: (val) => { isVoiceCommandRecognitionBlocked = val; },
    setLastVoiceCommandError: (err) => { lastVoiceCommandError = err; }
  };
}
