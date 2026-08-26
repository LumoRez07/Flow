/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import {
  clamp,
  defaultState,
  estimateMinutes,
  wait
} from "../shared.js";
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
  SPEED_PERSIST_DEBOUNCE_MS,
  ARROW_REPEAT_INITIAL_DELAY_MS,
  ARROW_REPEAT_INTERVAL_MS
} from "./playback-constants.js";
import {
  VOICE_WORD_VIEWPORT_OFFSET,
  VOICE_LINE_VIEWPORT_OFFSET,
  VOICE_SCROLL_EASING,
  VOICE_SCROLL_MAX_STEP
} from "./voice-constants.js";
import { setButtonIcon } from "./toolbar.js";
import { setPromptWaitCardNumber } from "./prompt-renderer.js";

export function createPlaybackController({
  state,
  ui,
  t,
  saveState,
  getActiveMode = () => "highlight",
  getVoiceScrollStyle = () => "highlight",
  getScrollBehavior = () => "smooth",
  getWordNodes = () => [],
  getLineGroups = () => [],
  getLineIndexByWord = () => [],
  getPromptWaitCards = () => [],
  getCachedPromptViewportWidth = () => 0,
  getCachedPromptViewportHeight = () => 0,
  getCachedPromptScrollableHeight = () => 0,
  refreshPromptViewportMetrics = () => 0,
  updatePromptSafeArea = () => {},
  updateSpeedRailVisibility = () => {},
  syncVoiceCommandListener = () => {},
  scheduleVoiceHealthCheck = () => {},
  stopVoiceTracking = async () => {},
  playVoiceMode = () => {},
  getRealtimeHostController = () => null,
  updateStatus = () => {},
  onPlaybackStateChange = () => {}
} = {}) {
  let isPlaying = false;
  let isPaused = false;
  let currentIndex = 0;
  let scrollProgress = 0;
  let tickTimer = null;
  let scrollAnimationFrame = null;
  let lastScrollFrameAt = 0;
  let playbackCountdownToken = 0;
  let isPlaybackCountdownActive = false;
  let isResuming = false;
  let promptWaitRunToken = 0;
  let activePromptWaitCardId = "";
  let promptWaitAnimationCleanupTimer = null;
  let viewportScrollAnimationFrame = null;
  let viewportScrollTarget = null;
  let lastAppliedViewportTop = null;
  let arrowHoldTimer = null;
  let arrowHoldInterval = null;
  let activeArrowDirection = null;
  let speedPersistTimer = null;
  let pendingPersistSpeed = null;
  let frozenReadingViewportWidth = 0;
  let frozenReadingViewportHeight = 0;
  let lastRenderedMode = null;
  let lastRenderedWordIndex = -1;
  let lastRenderedLineIndex = -1;
  let isUserManualScrolling = false;
  let userManualScrollTimer = null;

  function reCenterPlaybackPosition() {
    if (!isPlaying || isPaused || !ui.promptViewport) return;
    console.log(`[Flow Transition] Teleprompter Manual Scroll Timer Expired -> Smoothly re-centering to word #${currentIndex + 1}`);
    const wordNodes = getWordNodes();
    const node = wordNodes[currentIndex];
    if (node) {
      scrollToNode(node, true);
    }
  }

  function handleUserManualScroll(event) {
    if (!isPlaying || isPaused) return;
    if (event?.target && !ui.promptViewport?.contains(event.target) && !event.target.closest?.(".teleprompter-app")) {
      return;
    }

    if (!isUserManualScrolling) {
      console.log("[Flow Transition] Teleprompter Manual Scroll Engaged -> Programmatic scrolling locked for 5 seconds");
    }

    isUserManualScrolling = true;
    stopViewportScrollAnimation();

    if (userManualScrollTimer) {
      clearTimeout(userManualScrollTimer);
    }
    userManualScrollTimer = setTimeout(() => {
      isUserManualScrolling = false;
      userManualScrollTimer = null;
      reCenterPlaybackPosition();
    }, 5000);
  }

  if (typeof window !== "undefined") {
    window.addEventListener("wheel", handleUserManualScroll, { passive: true, capture: true });
    window.addEventListener("touchmove", handleUserManualScroll, { passive: true, capture: true });
    window.addEventListener("pointerdown", handleUserManualScroll, { passive: true, capture: true });
  }

  function getPlaybackViewportOffset(defaultOffset, voiceOffset) {
    if (document.body.classList.contains("reading-mode")) {
      return 0;
    }
    return getActiveMode() === "voice" ? voiceOffset : defaultOffset;
  }

  function getLineTargetTop(lineIndex) {
    const lineGroups = getLineGroups();
    const line = lineGroups[lineIndex];
    if (!line) {
      return 0;
    }

    const viewportHeight = getCachedPromptViewportHeight() || ui.promptViewport?.clientHeight || 0;
    return Math.max(line.top - viewportHeight * getPlaybackViewportOffset(0.28, VOICE_LINE_VIEWPORT_OFFSET), 0);
  }

  function getLineIndexForScrollTop(scrollTop) {
    const lineGroups = getLineGroups();
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
    return getLineGroups()[lineIndex]?.firstIndex ?? 0;
  }

  function stopViewportScrollAnimation() {
    if (viewportScrollAnimationFrame) {
      cancelAnimationFrame(viewportScrollAnimationFrame);
      viewportScrollAnimationFrame = null;
    }
    viewportScrollTarget = null;
  }

  function animateViewportScroll(targetTop) {
    if (!ui.promptViewport || isUserManualScrolling) {
      return;
    }

    viewportScrollTarget = Math.max(targetTop, 0);
    if (viewportScrollAnimationFrame) {
      return;
    }

    const step = () => {
      if (!ui.promptViewport || viewportScrollTarget === null || isUserManualScrolling) {
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
      if (ui.promptViewport && ui.promptViewport.scrollTop !== 0) {
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
    ui.promptViewport?.scrollTo({ top: nextTop, behavior });
  }

  function scrollToNode(node, force = false) {
    if (!node || !ui.promptViewport || (!force && isUserManualScrolling)) return;
    const viewportOffset = getPlaybackViewportOffset(0.32, VOICE_WORD_VIEWPORT_OFFSET);

    let targetTop = node.offsetTop;
    const prevElement = node.previousElementSibling;
    if (prevElement && (prevElement.classList.contains("prompt-section-wrapper") || prevElement.classList.contains("prompt-card"))) {
      targetTop = prevElement.offsetTop;
    }

    const top = targetTop - ui.promptViewport.clientHeight * viewportOffset;
    const nextTop = Math.max(top, 0);

    if (getActiveMode() === "voice") {
      animateViewportScroll(nextTop);
      return;
    }

    ui.promptViewport.scrollTo({ top: nextTop, behavior: getScrollBehavior() });
  }

  function scrollToLine(lineIndex, force = false) {
    const line = getLineGroups()[lineIndex];
    if (!line || !ui.promptViewport || (!force && isUserManualScrolling)) return;
    const viewportOffset = getPlaybackViewportOffset(0.28, VOICE_LINE_VIEWPORT_OFFSET);
    const top = line.top - ui.promptViewport.clientHeight * viewportOffset;
    const nextTop = Math.max(top, 0);

    if (getActiveMode() === "voice") {
      animateViewportScroll(nextTop);
      return;
    }

    ui.promptViewport.scrollTo({ top: nextTop, behavior: getScrollBehavior() });
  }

  function clearWordClasses() {
    getWordNodes().forEach((node) => {
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
    const line = getLineGroups()[lineIndex];
    if (!line) return;
    const wordNodes = getWordNodes();

    for (let index = line.firstIndex; index <= line.lastIndex; index += 1) {
      const node = wordNodes[index];
      if (!node) continue;
      classNames.forEach((className) => {
        node.classList.toggle(className, enabled);
      });
    }
  }

  function renderHighlightState() {
    const wordNodes = getWordNodes();
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
    const activeLineIndex = getLineIndexByWord()[currentIndex] ?? 0;
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

  function updateWordState(shouldScroll = true) {
    const activeMode = getActiveMode();
    const wordNodes = getWordNodes();

    const syncRealtimePlaybackState = () => {
      getRealtimeHostController()?.syncPlaybackState({
        active: isPlaying,
        paused: isPaused,
        wordIndex: currentIndex,
        totalWords: wordNodes.length,
        wordText: wordNodes[currentIndex]?.textContent || ""
      });
    };

    if (state.appearance?.performanceMode && activeMode === "scroll") {
      syncRealtimePlaybackState();
      updatePlaybackIndicators(false);
      return;
    }

    if (activeMode === "voice") {
      const voiceStyle = getVoiceScrollStyle();
      const activeLineIndex = getLineIndexByWord()[currentIndex] ?? 0;

      if (voiceStyle === "line") {
        renderLineState("line");
        if (shouldScroll) scrollToLine(activeLineIndex);
      } else if (voiceStyle === "plain") {
        renderPlainState();
        if (shouldScroll) scrollToLine(activeLineIndex);
      } else {
        renderHighlightState();
        if (shouldScroll) scrollToLine(activeLineIndex);
      }
    } else if (activeMode === "highlight") {
      renderHighlightState();
      if (shouldScroll) scrollToNode(wordNodes[currentIndex]);
    } else if (activeMode === "line") {
      const activeLineIndex = renderLineState("line");
      if (shouldScroll) scrollToLine(activeLineIndex);
    } else if (activeMode === "arrow") {
      const activeLineIndex = renderLineState("arrow");
      if (shouldScroll) scrollToLine(activeLineIndex);
    }

    syncRealtimePlaybackState();
    updatePlaybackIndicators(false);
  }

  function formatMinutesLeft(wordCount, speed) {
    const minutes = estimateMinutes(wordCount, speed);
    if (!Number.isFinite(minutes) || minutes <= 0) return "0";
    if (minutes >= 10) return String(Math.round(minutes));
    return minutes.toFixed(1).replace(/\.0$/, "");
  }

  function updateFloatingPlaybackMeta() {
    if (!ui.floatingPlaybackMeta) return;
    const wordNodes = getWordNodes();
    const shouldShow = (isPlaying || isPaused) && wordNodes.length > 0;
    ui.floatingPlaybackMeta.classList.toggle("hidden", !shouldShow);
    if (!shouldShow) return;

    const wordsLeft = Math.max(wordNodes.length - currentIndex - 1, 0);
    const minutesLeft = formatMinutesLeft(wordsLeft, state.speed);
    const statsText = t("tele.floatingStats", { words: wordsLeft, minutes: minutesLeft });

    if (ui.floatingPlaybackMetaText) {
      ui.floatingPlaybackMetaText.textContent = statsText;
    } else {
      ui.floatingPlaybackMeta.textContent = statsText;
    }
  }

  function updatePlayButtons() {
    const wordNodes = getWordNodes();
    const isResume = currentIndex > 0 && currentIndex < Math.max(wordNodes.length - 1, 0);
    if (ui.playButton) {
      setButtonIcon(ui.playButton, "ph-play");
      ui.playButton.title = isResume ? t("common.startFresh") : t("common.play");
      ui.playButton.setAttribute("aria-label", ui.playButton.title);
    }

    if (ui.floatingPauseButton) {
      const pauseLabel = isPaused ? t("common.continue") : t("common.pause");
      setButtonIcon(ui.floatingPauseButton, isPaused ? "ph-play-circle" : "ph-pause-circle");
      ui.floatingPauseButton.title = pauseLabel;
      ui.floatingPauseButton.setAttribute("aria-label", pauseLabel);
      ui.floatingPauseButton.disabled = !isPlaying && !isPaused;
    }

    if (ui.floatingReplayButton) {
      ui.floatingReplayButton.title = t("common.replayStart");
      ui.floatingReplayButton.setAttribute("aria-label", ui.floatingReplayButton.title);
      const showReplay = isPaused && currentIndex > 0;
      ui.floatingReplayButton.classList.toggle("hidden", !showReplay);
    }

    if (ui.floatingStopButton) {
      setButtonIcon(ui.floatingStopButton, "ph-stop-circle");
      ui.floatingStopButton.title = t("common.stopKeep");
      ui.floatingStopButton.setAttribute("aria-label", ui.floatingStopButton.title);
    }

    updateFloatingPlaybackMeta();
    updateSpeedRailVisibility();
  }

  function updatePlaybackIndicators(force = false) {
    updatePlayButtons();
    updateStatus();
  }

  function setReadingMode(enabled) {
    if (enabled) {
      refreshPromptViewportMetrics();
      frozenReadingViewportWidth = getCachedPromptViewportWidth();
      frozenReadingViewportHeight = getCachedPromptViewportHeight();
    } else {
      frozenReadingViewportWidth = 0;
      frozenReadingViewportHeight = 0;
    }

    document.body.classList.toggle("reading-mode", enabled);
    if (ui.floatingControls) {
      ui.floatingControls.classList.toggle("hidden", !enabled);
    }
    updatePromptSafeArea();

    if (!enabled && ui.floatingPlaybackMeta) {
      ui.floatingPlaybackMeta.classList.add("hidden");
    }
  }

  function setPlaybackCountdownVisible(visible, label = "") {
    if (!ui.playbackCountdown || !ui.playbackCountdownLabel) return;
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

  async function runPlaybackCountdown() {
    if (!ui.playbackCountdown || !ui.playbackCountdownLabel) {
      return true;
    }

    const token = ++playbackCountdownToken;
    const countdownStepMs = PLAYBACK_COUNTDOWN_STEP_MS;
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

  function clearPlayback(options = {}) {
    const { preserveVoiceTracking = false } = options;

    if (tickTimer) {
      clearTimeout(tickTimer);
      tickTimer = null;
    }

    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
    }

    isUserManualScrolling = false;
    if (userManualScrollTimer) {
      clearTimeout(userManualScrollTimer);
      userManualScrollTimer = null;
    }

    lastScrollFrameAt = 0;
    currentWordStartTime = 0;
    promptWaitRunToken += 1;
    activePromptWaitCardId = "";
    setPlaybackCountdownVisible(false);
    stopViewportScrollAnimation();

    if (!preserveVoiceTracking) {
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
    onPlaybackStateChange({ immediate: true });
    console.log("[Flow Transition] Reading Mode Stopped -> Teleprompter in Standby");

    if (reset) {
      currentIndex = 0;
      scrollProgress = 0;
      setViewportPosition(0, getScrollBehavior());
      clearRenderedState();
      resetPromptWaitCards(0, 0);
    } else {
      const totalScrollable = refreshPromptViewportMetrics();
      const currentTop = getActiveMode() === "scroll"
        ? totalScrollable * scrollProgress
        : (ui.promptViewport?.scrollTop || 0);
      scrollProgress = totalScrollable > 0 ? currentTop / totalScrollable : 0;
      resetPromptWaitCards(currentTop, currentIndex);
    }

    updateWordState(false);
    updatePlayButtons();
    syncVoiceCommandListener();
    scheduleVoiceHealthCheck(0);
  }

  function pausePlayback() {
    if (isPlaybackCountdownActive || isResuming) {
      playbackCountdownToken += 1;
      isPlaybackCountdownActive = false;
      isResuming = false;
      setPlaybackCountdownVisible(false);
      isPaused = true;
      onPlaybackStateChange({ immediate: true });
      console.log("[Flow Transition] Playback Paused (Aborted Countdown)");
      updatePlaybackIndicators(true);
      updatePlayButtons();
      syncVoiceCommandListener();
      return true;
    }

    if (!isPlaying || isPaused) {
      return false;
    }

    const activeMode = getActiveMode();
    isPaused = true;
    onPlaybackStateChange({ immediate: true });
    console.log("[Flow Transition] Playback Paused");

    if (activeMode !== "arrow" && activeMode !== "voice") {
      clearPlayback();
    }

    updatePlaybackIndicators(true);
    updatePlayButtons();
    syncVoiceCommandListener();
    return true;
  }

  async function resumePlayback() {
    if (!isPlaying || !isPaused || isPlaybackCountdownActive || isResuming) {
      return false;
    }

    isResuming = true;
    const activeMode = getActiveMode();
    console.log(`[Flow Transition] Playback Resuming (Mode: ${activeMode})`);
    try {
      const countdownCompleted = await runPlaybackCountdown();
      if (!countdownCompleted || !isPlaying || !isPaused) {
        return false;
      }

      const settleCompleted = await waitForPlaybackCountdownSettle();
      if (!settleCompleted || !isPlaying || !isPaused) {
        return false;
      }

      isPaused = false;
      onPlaybackStateChange({ immediate: true });

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
    } finally {
      isResuming = false;
    }
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

    const viewportHeight = getCachedPromptViewportHeight() || ui.promptViewport.clientHeight;
    return Math.max(card.element.offsetTop + card.element.offsetHeight * 0.5 - viewportHeight * WAIT_CARD_TRIGGER_VIEWPORT_OFFSET, 0);
  }

  function getCurrentPromptViewportTop() {
    if (getActiveMode() === "scroll") {
      if (typeof lastAppliedViewportTop === "number") {
        return Math.max(lastAppliedViewportTop, 0);
      }

      return Math.max(getCachedPromptScrollableHeight() * scrollProgress, 0);
    }

    return Math.max(ui.promptViewport?.scrollTop || 0, 0);
  }

  function resetPromptWaitCards(scrollTop = 0, wordIndex = 0) {
    const normalizedTop = Math.max(Number(scrollTop) || 0, 0);
    const normalizedWordIndex = Math.max(Number(wordIndex) || 0, 0);
    const cards = getPromptWaitCards();

    promptWaitRunToken += 1;

    cards.forEach((card) => {
      clearPromptWaitCardState(card);
      if (normalizedTop === 0 && normalizedWordIndex === 0) {
        card.consumed = false;
        return;
      }

      const isAfterWord = typeof card.triggerWordIndex === "number" && card.triggerWordIndex >= normalizedWordIndex;
      const isAfterScroll = typeof card.triggerTop === "number" && (card.triggerTop === 0 || card.triggerTop >= normalizedTop - 10);
      card.consumed = !(isAfterWord && isAfterScroll);
    });

    activePromptWaitCardId = "";
  }

  function getDuePromptWaitCardForScroll(scrollTop) {
    const cards = getPromptWaitCards();
    const normalizedTop = Math.max(Number(scrollTop) || 0, 0);
    const viewportHeight = getCachedPromptViewportHeight() || ui.promptViewport?.clientHeight || 0;
    const lineIndexByWord = getLineIndexByWord();

    return cards.find((card) => {
      if (card.consumed || card.id === activePromptWaitCardId || card.seconds <= 0) {
        return false;
      }

      if ((!card.triggerTop || card.triggerTop <= 0) && card.element) {
        const lineIndex = lineIndexByWord[card.triggerWordIndex] ?? 0;
        const lineTargetTop = getLineTargetTop(lineIndex);
        const cardElementTop = card.element.offsetTop || lineTargetTop;
        card.triggerTop = Math.max(cardElementTop - viewportHeight * WAIT_CARD_TRIGGER_VIEWPORT_OFFSET, 0);
      }

      if (card.triggerWordIndex > 0 && normalizedTop < Math.max(card.triggerTop - 30, 0)) {
        return false;
      }

      return normalizedTop >= Math.max(card.triggerTop - 4, 0);
    }) || null;
  }

  function getPromptWaitCardVoiceTriggerWordIndex(card) {
    if (!card) {
      return -1;
    }

    const wordNodes = getWordNodes();
    const lineIndexByWord = getLineIndexByWord();
    const lineGroups = getLineGroups();

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
    const cards = getPromptWaitCards();
    return cards.find((card) => {
      if (card.consumed || card.id === activePromptWaitCardId) {
        return false;
      }

      return normalizedWordIndex >= getPromptWaitCardVoiceTriggerWordIndex(card);
    }) || null;
  }

  function getDuePromptWaitCardForWordIndex(wordIndex) {
    const normalizedWordIndex = Math.max(Number(wordIndex) || 0, 0);
    const cards = getPromptWaitCards();
    return cards.find((card) => !card.consumed && card.id !== activePromptWaitCardId && card.seconds > 0 && normalizedWordIndex >= card.triggerWordIndex) || null;
  }

  function getPromptWaitCardVoiceResumeTop(card) {
    if (!card?.element || !ui.promptViewport) {
      return 0;
    }

    const wordNodes = getWordNodes();
    const lineIndexByWord = getLineIndexByWord();
    const viewportHeight = getCachedPromptViewportHeight() || ui.promptViewport.clientHeight;
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
    const activeMode = getActiveMode();
    card.consumed = true;
    activePromptWaitCardId = card.id;

    const pauseTop = getCurrentPromptViewportTop();
    stopViewportScrollAnimation();

    if (activeMode === "scroll") {
      const totalScrollable = getCachedPromptScrollableHeight();
      scrollProgress = totalScrollable > 0 ? clamp(pauseTop / totalScrollable, 0, 1) : scrollProgress;
    }

    setViewportPosition(pauseTop, "auto");

    card.element.classList.add("is-waiting");
    setPromptWaitCardNumber(card.element, card.seconds, { animate: false });

    const isStillPlaying = () => isPlaying && !isPaused;

    for (let remaining = card.seconds; remaining > 0; remaining -= 1) {
      if (runToken !== promptWaitRunToken || !isStillPlaying()) {
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

    return true;
  }

  async function pausePlaybackForWaitCard(card) {
    if (!card || card.consumed || !isPlaying || isPaused) {
      return;
    }

    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
    }
    if (tickTimer) {
      clearTimeout(tickTimer);
      tickTimer = null;
    }

    const completed = await runPromptWaitPause(card);
    if (!completed || !isPlaying || isPaused) {
      return;
    }

    lastScrollFrameAt = performance.now();
    const activeMode = getActiveMode();
    if (activeMode === "scroll") {
      playScrollMode();
    } else if (activeMode !== "voice" && activeMode !== "arrow") {
      playTimedStep();
    }
  }

  let currentWordStartTime = 0;

  function playTimedStep() {
    if (!isPlaying || isPaused) {
      currentWordStartTime = 0;
      return;
    }

    const wordNodes = getWordNodes();
    if (currentIndex >= wordNodes.length - 1) {
      currentWordStartTime = 0;
      stopPlayback(false);
      return;
    }

    const nextIndex = currentIndex + 1;
    const dueCard = getDuePromptWaitCardForWordIndex(nextIndex);
    if (dueCard) {
      currentWordStartTime = 0;
      pausePlaybackForWaitCard(dueCard);
      return;
    }

    currentIndex = nextIndex;
    updateWordState(true);
    currentWordStartTime = performance.now();

    const stepInterval = Math.max(Math.round((60 / Math.max(state.speed, 1)) * 1000), 20);
    tickTimer = window.setTimeout(() => playTimedStep(), stepInterval);
  }

  function playScrollMode() {
    if (!isPlaying || isPaused) {
      return;
    }

    const totalScrollable = getCachedPromptScrollableHeight();
    if (totalScrollable <= 0) {
      stopPlayback(false);
      return;
    }

    const wordNodes = getWordNodes();
    const totalWords = Math.max(wordNodes.length, 1);
    const pixelsPerWord = totalScrollable > 0 ? (totalScrollable / totalWords) : 24;
    const pixelsPerSecond = (Math.max(state.speed, 1) / 60) * (pixelsPerWord > 0 ? pixelsPerWord : 24);
    lastScrollFrameAt = performance.now();

    const step = (now) => {
      if (!isPlaying || isPaused) {
        return;
      }

      if (isUserManualScrolling) {
        if (ui.promptViewport && totalScrollable > 0) {
          const userTop = ui.promptViewport.scrollTop;
          scrollProgress = userTop / totalScrollable;
          currentIndex = getPlaybackIndexForScrollTop(userTop);
          updateWordState(false);
        }
        lastScrollFrameAt = now;
        scrollAnimationFrame = requestAnimationFrame(step);
        return;
      }

      const deltaMs = Math.min(now - (lastScrollFrameAt || now), 100);
      lastScrollFrameAt = now;

      const currentTotalScrollable = getCachedPromptScrollableHeight() || totalScrollable;
      const currentPixelsPerWord = currentTotalScrollable > 0 ? (currentTotalScrollable / totalWords) : pixelsPerWord;
      const currentPixelsPerSecond = (Math.max(state.speed, 1) / 60) * (currentPixelsPerWord > 0 ? currentPixelsPerWord : 24);

      const deltaPixels = (currentPixelsPerSecond * deltaMs) / 1000;
      const currentTop = currentTotalScrollable * scrollProgress;
      const nextTop = Math.min(currentTop + deltaPixels, currentTotalScrollable);

      const dueCard = getDuePromptWaitCardForScroll(nextTop);
      if (dueCard) {
        scrollProgress = currentTotalScrollable > 0 ? dueCard.triggerTop / currentTotalScrollable : scrollProgress;
        setViewportPosition(dueCard.triggerTop, "auto");
        pausePlaybackForWaitCard(dueCard);
        return;
      }

      scrollProgress = currentTotalScrollable > 0 ? nextTop / currentTotalScrollable : 1;
      setViewportPosition(nextTop, "auto");
      currentIndex = getPlaybackIndexForScrollTop(nextTop);
      updateWordState(false);

      if (nextTop >= currentTotalScrollable) {
        stopPlayback(false);
        return;
      }

      scrollAnimationFrame = requestAnimationFrame(step);
    };

    scrollAnimationFrame = requestAnimationFrame(step);
  }

  async function startPlayback(options = {}) {
    const { fromBeginning = false } = options;
    const wordNodes = getWordNodes();
    if (wordNodes.length === 0) {
      return;
    }

    stopPlayback(fromBeginning);
    isPlaying = true;
    isPaused = false;
    setReadingMode(true);
    onPlaybackStateChange({ immediate: true });

    if (fromBeginning) {
      currentIndex = 0;
      scrollProgress = 0;
      setViewportPosition(0, "auto");
      resetPromptWaitCards(0, 0);
    }

    updateWordState(true);
    updatePlayButtons();
    syncVoiceCommandListener();

    const activeMode = getActiveMode();
    console.log(`[Flow Transition] Reading Mode Started (Mode: ${activeMode}, Speed: ${state.speed} WPM)`);
    const countdownCompleted = await runPlaybackCountdown();
    if (!countdownCompleted || !isPlaying || isPaused) {
      return;
    }

    const settleCompleted = await waitForPlaybackCountdownSettle();
    if (!settleCompleted || !isPlaying || isPaused) {
      return;
    }

    if (supportsPlaybackStartDelay(activeMode)) {
      const delayCompleted = await waitForPlaybackStartDelay();
      if (!delayCompleted || !isPlaying || isPaused) {
        return;
      }
    }

    if (!isPlaying || isPaused) {
      return;
    }

    if (activeMode === "scroll") {
      playScrollMode();
    } else if (activeMode === "voice") {
      playVoiceMode();
    } else if (activeMode !== "arrow") {
      playTimedStep();
    }
  }

  function togglePlayback() {
    if (isPlaying) {
      if (isPaused) {
        resumePlayback().catch(console.error);
      } else {
        pausePlayback();
      }
      return;
    }

    startPlayback({ fromBeginning: false }).catch(console.error);
  }

  function jumpToWordIndex(targetIndex) {
    const wordNodes = getWordNodes();
    const clampedIndex = Math.max(0, Math.min(Math.max(0, wordNodes.length - 1), Number(targetIndex) || 0));
    currentIndex = clampedIndex;
    currentWordStartTime = performance.now();
    console.log(`[Flow Transition] Reading Position Jumped -> Word #${clampedIndex + 1} of ${wordNodes.length}`);
    updateWordState(true);
    updatePlaybackIndicators(true);
  }

  function restartPlaybackLoopForCurrentMode() {
    if (!isPlaying || isPaused) {
      updatePlaybackIndicators(true);
      return;
    }

    clearPlayback({ preserveVoiceTracking: true });
    const activeMode = getActiveMode();

    if (activeMode === "scroll") {
      playScrollMode();
    } else if (activeMode === "voice") {
      playVoiceMode();
    } else if (activeMode !== "arrow") {
      playTimedStep();
    }

    updatePlaybackIndicators(true);
  }

  function updateSpeedLabel() {
    if (ui.speedLabel && document.activeElement !== ui.speedLabel) {
      ui.speedLabel.value = String(state.speed);
      ui.speedLabel.title = `${state.speed} ${t("common.wpm")}`;
    }
    if (ui.speedRailValue) {
      ui.speedRailValue.textContent = String(state.speed);
    }
    if (ui.speedRailSlider && document.activeElement !== ui.speedRailSlider) {
      ui.speedRailSlider.value = String(state.speed);
      syncSliderProgress(ui.speedRailSlider);
      ui.speedRailSlider.title = `${state.speed} ${t("common.wpm")}`;
    }
    updateFloatingPlaybackMeta();
  }

  function syncSliderProgress(input) {
    if (!input) return;
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const value = Number(input.value || min);
    const range = max - min;
    const progress = range > 0 ? ((value - min) / range) * 100 : 0;
    input.style.setProperty("--progress", `${progress}%`);
    input.style.setProperty("--slider-progress", `${progress}%`);
  }

  function flushPendingSpeedPersist() {
    if (!speedPersistTimer && pendingPersistSpeed === null) return;
    if (speedPersistTimer) {
      clearTimeout(speedPersistTimer);
      speedPersistTimer = null;
    }
    if (pendingPersistSpeed !== null) {
      saveState({ speed: pendingPersistSpeed });
      pendingPersistSpeed = null;
    }
  }

  function scheduleSpeedPersist(nextSpeed) {
    pendingPersistSpeed = nextSpeed;
    if (speedPersistTimer) clearTimeout(speedPersistTimer);
    speedPersistTimer = window.setTimeout(() => {
      speedPersistTimer = null;
      if (pendingPersistSpeed !== null) {
        saveState({ speed: pendingPersistSpeed });
        pendingPersistSpeed = null;
      }
    }, SPEED_PERSIST_DEBOUNCE_MS);
  }

  function setPlaybackSpeed(nextSpeed, options = {}) {
    const { persist = true } = options;
    const normalizedSpeed = clamp(Math.round(Number(nextSpeed) || defaultState.speed), 40, 500);
    if (state.speed === normalizedSpeed && options.force !== true) {
      return;
    }
    state.speed = normalizedSpeed;
    updateSpeedLabel();
    if (persist) {
      scheduleSpeedPersist(normalizedSpeed);
    }

    // Seamlessly update remaining word delay during active timed playback
    if (isPlaying && !isPaused && !["scroll", "voice", "arrow"].includes(getActiveMode())) {
      if (tickTimer) {
        clearTimeout(tickTimer);
        tickTimer = null;
      }
      const newInterval = Math.max(Math.round((60 / Math.max(state.speed, 1)) * 1000), 20);
      const elapsed = currentWordStartTime > 0 ? (performance.now() - currentWordStartTime) : 0;
      const remainingDelay = Math.max(Math.round(newInterval - elapsed), 20);
      tickTimer = window.setTimeout(() => playTimedStep(), remainingDelay);
    }
  }

  function stepPlaybackArrow(direction) {
    const wordNodes = getWordNodes();
    if (wordNodes.length === 0) return;
    const activeMode = getActiveMode();

    if (activeMode === "arrow" || activeMode === "line") {
      const lineGroups = getLineGroups();
      const currentLineIndex = getLineIndexByWord()[currentIndex] ?? 0;
      const targetLineIndex = clamp(currentLineIndex + direction, 0, Math.max(lineGroups.length - 1, 0));
      currentIndex = lineGroups[targetLineIndex]?.firstIndex ?? currentIndex;
    } else {
      currentIndex = clamp(currentIndex + direction, 0, Math.max(wordNodes.length - 1, 0));
    }

    updateWordState(true);
    updatePlayButtons();
  }

  function startPlaybackArrowHold(direction) {
    stopPlaybackArrowHold();
    activeArrowDirection = direction;
    stepPlaybackArrow(direction);

    arrowHoldTimer = window.setTimeout(() => {
      arrowHoldInterval = window.setInterval(() => {
        if (activeArrowDirection) {
          stepPlaybackArrow(activeArrowDirection);
        }
      }, ARROW_REPEAT_INTERVAL_MS);
    }, ARROW_REPEAT_INITIAL_DELAY_MS);
  }

  function stopPlaybackArrowHold() {
    if (arrowHoldTimer) {
      clearTimeout(arrowHoldTimer);
      arrowHoldTimer = null;
    }
    if (arrowHoldInterval) {
      clearInterval(arrowHoldInterval);
      arrowHoldInterval = null;
    }
    activeArrowDirection = null;
  }

  return {
    getIsPlaying: () => isPlaying,
    setIsPlaying: (val) => { isPlaying = val; },
    getIsPaused: () => isPaused,
    setIsPaused: (val) => { isPaused = val; },
    getIsPlaybackCountdownActive: () => isPlaybackCountdownActive || isResuming,
    getIsResuming: () => isResuming,
    getCurrentIndex: () => currentIndex,
    setCurrentIndex: (val) => { currentIndex = val; },
    getScrollProgress: () => scrollProgress,
    setScrollProgress: (val) => { scrollProgress = val; },
    getFrozenReadingViewportWidth: () => frozenReadingViewportWidth,
    getFrozenReadingViewportHeight: () => frozenReadingViewportHeight,
    getLineTargetTop,
    getLineIndexForScrollTop,
    getPlaybackIndexForScrollTop,
    getPlaybackViewportOffset,
    setReadingMode,
    setPlaybackCountdownVisible,
    runPlaybackCountdown,
    waitForPlaybackCountdownSettle,
    getPlaybackStartDelayMs,
    supportsPlaybackStartDelay,
    waitForPlaybackStartDelay,
    formatMinutesLeft,
    updateFloatingPlaybackMeta,
    setViewportPosition,
    clearPromptScrollTransform,
    stopViewportScrollAnimation,
    animateViewportScroll,
    scrollToNode,
    scrollToLine,
    clearWordClasses,
    clearRenderedState,
    renderPlainState,
    renderHighlightState,
    renderLineState,
    updateWordState,
    clearPlayback,
    stopPlayback,
    pausePlayback,
    resumePlayback,
    startPlayback,
    togglePlayback,
    jumpToWordIndex,
    restartPlaybackLoopForCurrentMode,
    updateSpeedLabel,
    syncSliderProgress,
    setPlaybackSpeed,
    flushPendingSpeedPersist,
    scheduleSpeedPersist,
    updatePlayButtons,
    updatePlaybackIndicators,
    stepPlaybackArrow,
    startPlaybackArrowHold,
    stopPlaybackArrowHold,
    dispose() {
      if (typeof window !== "undefined") {
        window.removeEventListener("wheel", handleUserManualScroll, { capture: true });
        window.removeEventListener("touchmove", handleUserManualScroll, { capture: true });
        window.removeEventListener("pointerdown", handleUserManualScroll, { capture: true });
      }
    },
    getActivePromptWaitCardId: () => activePromptWaitCardId,
    clearPromptWaitCardState,
    getPromptWaitCardTargetTop,
    getCurrentPromptViewportTop,
    resetPromptWaitCards,
    getDuePromptWaitCardForScroll,
    getPromptWaitCardVoiceTriggerWordIndex,
    getDuePromptWaitCardForVoiceIndex,
    getDuePromptWaitCardForWordIndex,
    getPromptWaitCardVoiceResumeTop,
    runPromptWaitPause
  };
}
