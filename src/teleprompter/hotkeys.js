/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export function createHotkeyManager({
  state,
  getState = () => state || {},
  getIsPlaying = () => false,
  getIsPaused = () => false,
  getActiveMode = () => "scroll",
  getLineGroups = () => [],
  jumpToIndex = () => {},
  hasNativeInvoke = () => false,
  toggleClickthroughMode = async () => {},
  stopPlayback = () => {},
  play = () => {},
  scrollBackward = () => {},
  togglePause = () => {},
  adjustSpeed = () => {},
  stepPlaybackArrow = () => {},
  startPlaybackArrowHold = () => {},
  stopPlaybackArrowHold = () => {}
} = {}) {
  function handleKeyDown(event) {
    const target = event.target;
    if (target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)) {
      return;
    }

    const currentAppState = getState();
    const isPlaying = getIsPlaying();
    const isPaused = getIsPaused();
    const activeMode = getActiveMode();

    if (!hasNativeInvoke() && event.ctrlKey && event.shiftKey && event.code === "KeyX" && currentAppState.desktop?.clickthroughShortcutEnabled) {
      event.preventDefault();
      console.log("[Flow Action] Hotkey Pressed -> Ctrl+Shift+X (Toggle Clickthrough)");
      toggleClickthroughMode().catch(console.error);
      return;
    }

    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.code === "KeyP") {
      event.preventDefault();
      console.log(`[Flow Action] Hotkey Pressed -> KeyP (isPlaying=${isPlaying}, isPaused=${isPaused})`);
      if (isPlaying || isPaused) {
        stopPlayback(false);
      } else {
        play();
      }
      return;
    }

    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.code === "KeyR") {
      event.preventDefault();
      console.log("[Flow Action] Hotkey Pressed -> KeyR (Stop & Reset)");
      stopPlayback(true);
      return;
    }

    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.code === "PageUp") {
      event.preventDefault();
      console.log("[Flow Action] Hotkey Pressed -> PageUp (Scroll Backward)");
      scrollBackward();
      return;
    }

    if (event.code === "Space" && (isPlaying || isPaused)) {
      event.preventDefault();
      console.log(`[Flow Action] Hotkey Pressed -> Space (Toggle Pause, currently isPaused=${isPaused})`);
      togglePause();
      return;
    }

    if (!event.ctrlKey && !event.metaKey && !event.altKey && (isPlaying || isPaused)) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        console.log("[Flow Action] Hotkey Pressed -> ArrowRight (Speed Up)");
        adjustSpeed(event.repeat ? 4 : 2);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        console.log("[Flow Action] Hotkey Pressed -> ArrowLeft (Speed Down)");
        adjustSpeed(event.repeat ? -4 : -2);
        return;
      }
    }

    if (!event.ctrlKey && !event.metaKey && !event.altKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      const direction = event.key === "ArrowDown" ? 1 : -1;
      if (isPlaying || isPaused || activeMode === "arrow") {
        event.preventDefault();
        console.log(`[Flow Action] Hotkey Pressed -> ${event.key} (Direction ${direction})`);
        if (!event.repeat) {
          stepPlaybackArrow(direction);
          startPlaybackArrowHold(direction);
        }
        return;
      }
    }
  }

  function handleKeyUp(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      stopPlaybackArrowHold();
    }
  }

  function handlePromptClick(event) {
    const word = event.target?.closest?.(".prompt-word");
    if (!word) {
      return;
    }

    const activeMode = getActiveMode();
    if (activeMode !== "highlight" && activeMode !== "line") {
      return;
    }

    const wordIndex = Number(word.dataset?.index);
    if (!Number.isFinite(wordIndex)) {
      return;
    }

    if (activeMode === "highlight") {
      jumpToIndex(wordIndex);
      return;
    }

    const lineIndex = Number(word.dataset?.lineIndex);
    const lineGroups = getLineGroups();
    const line = Number.isFinite(lineIndex) ? lineGroups[lineIndex] : null;
    jumpToIndex(line?.firstIndex ?? wordIndex);
  }

  function bind() {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
  }

  function unbind() {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  }

  return {
    handleKeyDown,
    handleKeyUp,
    handlePromptClick,
    bind,
    unbind
  };
}
