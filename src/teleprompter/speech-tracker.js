/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { clamp } from "../shared.js";
import {
  VOICE_TRACKING_MATCH_RADIUS,
  VOICE_TRACKING_MAX_ANIMATED_JUMP,
  VOICE_FORWARD_SKIP_CONFIRM_MS,
  VOICE_TRACKING_PARTIAL_REPEAT_GUARD_MS,
  VOICE_TRACKING_PARTIAL_MIN_INTERVAL_MS
} from "./voice-constants.js";
import { tokenizeNormalizedText } from "./prompt-renderer.js";

export function isStrongPartialVoiceMatch(spokenToken, scriptToken) {
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

export function createSpeechTracker({
  state,
  ui,
  t,
  getWordNodes = () => [],
  getLineGroups = () => [],
  getLineIndexByWord = () => [],
  getNormalizedWordTokens = () => [],
  getNormalizedTokenIndexForWord = () => 0,
  getNormalizedTokenRangeForLine = () => null,
  getWordIndexForNormalizedToken = () => 0,
  getCurrentIndex = () => 0,
  setCurrentIndex = () => {},
  getIsPlaying = () => false,
  getIsPaused = () => false,
  getActiveMode = () => "highlight",
  updateWordState = () => {},
  finishPlayback = () => {},
  getVoiceTrackingConfidenceThreshold = () => 0.35,
  getActivePromptWaitCardId = () => "",
  getDuePromptWaitCardForVoiceIndex = () => null,
  getPromptWaitCardVoiceTriggerWordIndex = () => -1,
  runPromptWaitPause = async () => true,
  syncVoiceCommandListener = () => {},
  updateVoiceCommandIndicator = () => {},
  getVoiceLanguageTag = () => "en-US",
  rebuildNormalizedScriptTokenMap = () => {},
  ensureNativeVoiceEventListener = async () => {},
  getTrackingAndCommandGrammar = () => [],
  buildNativeVoicePayload = () => ({}),
  isVoiceCommandRecognizerActive = () => false,
  isVoiceCommandRecognitionStarting = () => false,
  stopVoiceCommandListener = async () => {},
  syncStateFromStorage = () => {},
  invoke = window.__TAURI__?.core?.invoke
} = {}) {
  let voiceRecognition = null;
  let voiceTrackingMediaStream = null;
  let voiceTrackingAudioContext = null;
  let voiceTrackingSourceNode = null;
  let voiceTrackingProcessorNode = null;
  let voiceTrackingSilenceNode = null;
  let voiceTrackingSession = 0;
  let voiceTrackingStartPromise = null;
  let isVoiceTrackingStarting = false;
  let activeVoiceTrackingLanguageTag = null;
  let lastVoiceTrackingAudioProcessAt = 0;
  let lastVoiceTrackingPartialHandledAt = 0;
  let lastVoiceTrackingPartialKey = "";
  let lastVoiceMatchAt = 0;
  let lastVoiceMatchIndex = -1;
  let rollingVoiceCadenceMsPerWord = 0;
  let voiceTrackingAdvanceFrame = null;
  let voiceTrackingAdvanceTarget = -1;
  let voiceTrackingAdvanceLastStepAt = 0;
  let pendingForwardVoiceSkip = null;
  let voiceTranscript = "";

  function getVoiceLineWindow(radius = 3) {
    const lineGroups = getLineGroups();
    if (lineGroups.length === 0) {
      return null;
    }

    const currentIndex = getCurrentIndex();
    const lineIndexByWord = getLineIndexByWord();
    const activeLineIndex = clamp(lineIndexByWord[currentIndex] ?? 0, 0, Math.max(lineGroups.length - 1, 0));
    return {
      activeLineIndex,
      startLineIndex: Math.max(activeLineIndex - radius, 0),
      endLineIndex: Math.min(activeLineIndex + radius, lineGroups.length - 1)
    };
  }

  function clampVoiceTrackingMatchToAdjacentLine(match) {
    const lineGroups = getLineGroups();
    if (!match || lineGroups.length === 0) {
      return match;
    }

    const currentIndex = getCurrentIndex();
    const lineIndexByWord = getLineIndexByWord();
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

    const currentIndex = getCurrentIndex();

    return matches.reduce((bestMatch, candidate) => {
      if (!bestMatch) {
        return candidate;
      }

      if ((candidate.phraseLength || 0) !== (bestMatch.phraseLength || 0)) {
        return (candidate.phraseLength || 0) > (bestMatch.phraseLength || 0) ? candidate : bestMatch;
      }

      const candidateWordIndex = candidate.matchedWordIndex ?? -1;
      const bestWordIndex = bestMatch.matchedWordIndex ?? -1;

      const candidateIsForward = candidateWordIndex >= currentIndex;
      const bestIsForward = bestWordIndex >= currentIndex;
      if (candidateIsForward !== bestIsForward) {
        return candidateIsForward ? candidate : bestMatch;
      }

      const candidateLineDistance = Math.abs((candidate.lineIndex ?? activeLineIndex) - activeLineIndex);
      const bestLineDistance = Math.abs((bestMatch.lineIndex ?? activeLineIndex) - activeLineIndex);
      if (candidateLineDistance !== bestLineDistance) {
        return candidateLineDistance < bestLineDistance ? candidate : bestMatch;
      }

      if (candidateIsForward && bestIsForward) {
        return candidateWordIndex >= bestWordIndex ? candidate : bestMatch;
      }

      const candidateWordDistance = Math.abs(candidateWordIndex - currentIndex);
      const bestWordDistance = Math.abs(bestWordIndex - currentIndex);
      if (candidateWordDistance !== bestWordDistance) {
        return candidateWordDistance < bestWordDistance ? candidate : bestMatch;
      }

      return candidateWordIndex >= bestWordIndex ? candidate : bestMatch;
    }, null);
  }

  function findVoicePartialMatchIndex(spokenTokens, options = {}) {
    const normalizedWordTokens = getNormalizedWordTokens();
    if (spokenTokens.length === 0 || normalizedWordTokens.length === 0) {
      return -1;
    }

    const currentIndex = getCurrentIndex();
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
    const defaultEnd = Math.min(searchStart + 2, maxIndex);
    const searchEnd = clamp(options.endIndex ?? defaultEnd, searchStart, Math.min(searchStart + 2, maxIndex));

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

  function findVoiceExactPhraseMatch(spokenTokens, options = {}) {
    const normalizedWordTokens = getNormalizedWordTokens();
    if (spokenTokens.length === 0 || normalizedWordTokens.length === 0) {
      return null;
    }

    const lineIndexByWord = getLineIndexByWord();
    const currentIndex = getCurrentIndex();
    const recentSpoken = spokenTokens.slice(-12);
    const maxIndex = normalizedWordTokens.length - 1;
    const searchStart = clamp(options.startIndex ?? 0, 0, maxIndex);
    const searchEnd = clamp(options.endIndex ?? maxIndex, searchStart, maxIndex);
    const maxPhraseLength = Math.min(options.maxPhraseLength ?? 5, recentSpoken.length);
    const minPhraseLength = Math.max(options.minPhraseLength ?? 1, 1);
    const activeLineIndex = options.activeLineIndex ?? (lineIndexByWord[currentIndex] ?? 0);
    const lineFilter = typeof options.lineFilter === "function" ? options.lineFilter : null;

    for (let anchor = recentSpoken.length; anchor >= 1; anchor -= 1) {
      const availableLen = Math.min(anchor, maxPhraseLength);
      for (let phraseLength = availableLen; phraseLength >= minPhraseLength; phraseLength -= 1) {
        const offset = anchor - phraseLength;
        const spokenPhraseTokens = recentSpoken.slice(offset, offset + phraseLength);
        const spokenPhrase = spokenPhraseTokens.join(" ");
        if (!spokenPhrase || (phraseLength === 1 && spokenPhrase.length < 2)) {
          continue;
        }

        const matches = [];

        for (let index = searchStart; index <= searchEnd - phraseLength + 1; index += 1) {
          let tokenMatches = true;
          for (let p = 0; p < phraseLength; p += 1) {
            if (normalizedWordTokens[index + p] !== spokenPhraseTokens[p]) {
              tokenMatches = false;
              break;
            }
          }
          if (!tokenMatches) {
            continue;
          }

          const trailingTokensSpoken = recentSpoken.length - anchor;
          const matchedIndex = Math.min(index + phraseLength - 1 + trailingTokensSpoken, maxIndex);
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
          }

          const best = selectBestVoiceMatch(matches, activeLineIndex);
          if (best) {
            return best;
          }
        }
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
    const normalizedWordTokens = getNormalizedWordTokens();
    const lineGroups = getLineGroups();
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

  function getVoiceTrackingPartialTokenWindow() {
    const normalizedWordTokens = getNormalizedWordTokens();
    const lineGroups = getLineGroups();
    if (normalizedWordTokens.length === 0 || lineGroups.length === 0) {
      return null;
    }

    const currentIndex = getCurrentIndex();
    const lineIndexByWord = getLineIndexByWord();
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
    const wordNodes = getWordNodes();
    const nextIndex = clamp(Number(targetIndex) || 0, 0, Math.max(wordNodes.length - 1, 0));
    const currentIndex = getCurrentIndex();
    if (nextIndex === currentIndex) {
      return;
    }

    const lineIndexByWord = getLineIndexByWord();
    const previousLineIndex = lineIndexByWord[currentIndex] ?? 0;
    const nextLineIndex = lineIndexByWord[nextIndex] ?? previousLineIndex;
    setCurrentIndex(nextIndex);
    updateWordState(nextLineIndex !== previousLineIndex);

    if (nextIndex >= wordNodes.length - 1) {
      finishPlayback();
      stopVoiceTracking().catch(console.error);
    }
  }

  function getVoiceTrackingPacingIntervalMs(delta) {
    const currentSpeed = clamp(Number(state?.speed) || 130, 40, 400);
    const baseCadence = clamp(rollingVoiceCadenceMsPerWord || ((60_000 / currentSpeed) * 0.8), 160, 600);
    if (delta <= 1) {
      return clamp(baseCadence * 0.55, 90, 260);
    }
    if (delta <= 3) {
      return clamp(baseCadence * 0.42, 75, 190);
    }
    return clamp(baseCadence * 0.32, 60, 150);
  }

  function scheduleVoiceTrackingAdvance(targetIndex, options = {}) {
    const wordNodes = getWordNodes();
    if (!wordNodes.length) {
      return;
    }

    const currentIndex = getCurrentIndex();
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

      if (!getIsPlaying() || getIsPaused() || getActiveMode() !== "voice") {
        stopVoiceTrackingAdvance();
        return;
      }

      const curIdx = getCurrentIndex();
      if (voiceTrackingAdvanceTarget <= curIdx) {
        stopVoiceTrackingAdvance();
        return;
      }

      const remainingDelta = voiceTrackingAdvanceTarget - curIdx;
      const stepIntervalMs = getVoiceTrackingPacingIntervalMs(remainingDelta);

      if (!voiceTrackingAdvanceLastStepAt || now - voiceTrackingAdvanceLastStepAt >= stepIntervalMs) {
        voiceTrackingAdvanceLastStepAt = now;
        commitVoiceTrackingIndex(curIdx + 1);
      }

      if (getIsPlaying() && !getIsPaused() && getActiveMode() === "voice" && getCurrentIndex() < voiceTrackingAdvanceTarget) {
        voiceTrackingAdvanceFrame = requestAnimationFrame(step);
        return;
      }

      stopVoiceTrackingAdvance();
    };

    voiceTrackingAdvanceFrame = requestAnimationFrame(step);
  }

  function applyVoiceTrackingMatch(match, options = {}) {
    const bestMatchIndex = match?.matchedWordIndex ?? -1;
    const currentIndex = getCurrentIndex();
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
        setCurrentIndex(waitTriggerWordIndex);
        updateWordState(true);
      }

      runPromptWaitPause(waitCard).then((completed) => {
        if (completed && getIsPlaying() && !getIsPaused() && getActiveMode() === "voice") {
          updateWordState(false);
        }
      }).catch(console.error);
      return true;
    }

    const now = performance.now();
    if (lastVoiceMatchIndex >= 0 && bestMatchIndex > lastVoiceMatchIndex) {
      const wordsAdvanced = bestMatchIndex - lastVoiceMatchIndex;
      const timeElapsed = now - lastVoiceMatchAt;
      if (timeElapsed >= 80 && timeElapsed <= 4000) {
        const instantaneousPace = timeElapsed / wordsAdvanced;
        rollingVoiceCadenceMsPerWord = clamp(
          rollingVoiceCadenceMsPerWord * 0.5 + instantaneousPace * 0.5,
          100,
          750
        );
      }
    }
    lastVoiceMatchAt = now;
    lastVoiceMatchIndex = bestMatchIndex;

    scheduleVoiceTrackingAdvance(bestMatchIndex, { immediate: Boolean(options.immediate) });
    return true;
  }

  function applyVoiceTrackingWordHints(words, options = {}) {
    const { confidence = 0, isFinal = false } = options;
    if (!Array.isArray(words) || !words.length) {
      return false;
    }

    if (isFinal && Number(confidence) > 0 && Number(confidence) < getVoiceTrackingConfidenceThreshold()) {
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
      maxPhraseLength: Math.min(5, spokenTokens.length),
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

    const lineGroups = getLineGroups();
    const lineIndexByWord = getLineIndexByWord();
    const currentIndex = getCurrentIndex();
    const normalizedWordTokens = getNormalizedWordTokens();
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
    const currentIndex = getCurrentIndex();

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

    if (voiceTrackingMediaStream) {
      voiceTrackingMediaStream.getTracks().forEach((track) => {
        track.enabled = false;
        track.stop();
      });
      voiceTrackingMediaStream = null;
    }
  }

  function applyVoiceTrackingTranscript(transcript, options = {}) {
    const text = String(transcript || "").trim();
    if (!text || !getIsPlaying() || getActiveMode() !== "voice") {
      return;
    }

    const {
      isFinal = false,
      confidence = 0
    } = options;
    if (getIsPaused()) {
      return;
    }

    if (getActivePromptWaitCardId()) {
      return;
    }

    if (isFinal && Number(confidence) > 0 && Number(confidence) < getVoiceTrackingConfidenceThreshold()) {
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

    applyVoiceTrackingMatch(bestLineMatch, { immediate: false });
  }

  async function startVoiceTracking() {
    if (!invoke) {
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
      const grammar = getTrackingAndCommandGrammar(languageTag);
      await invoke("start_voice_tracking", buildNativeVoicePayload(languageTag, { grammar }));
      if (session !== voiceTrackingSession) {
        await invoke("stop_voice_tracking").catch(() => {});
        return;
      }

      voiceRecognition = { engine: "native" };
      activeVoiceTrackingLanguageTag = languageTag;
      lastVoiceTrackingAudioProcessAt = performance.now();

      if (isVoiceCommandRecognizerActive() || isVoiceCommandRecognitionStarting()) {
        await stopVoiceCommandListener();
      }

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

  return {
    startVoiceTracking,
    stopVoiceTracking,
    applyVoiceTrackingTranscript,
    applyVoiceTrackingWordHints,
    findVoiceLineMatch,
    findVoiceExactPhraseMatch,
    findVoicePartialMatchIndex,
    stopVoiceTrackingAdvance,
    getVoiceTranscript: () => voiceTranscript,
    resetVoiceTranscript: () => { voiceTranscript = ""; },
    getIsVoiceTrackingActive: () => Boolean(voiceRecognition),
    getIsVoiceTrackingStarting: () => isVoiceTrackingStarting,
    getActiveVoiceTrackingLanguageTag: () => activeVoiceTrackingLanguageTag,
    getLastVoiceTrackingAudioProcessAt: () => lastVoiceTrackingAudioProcessAt
  };
}
