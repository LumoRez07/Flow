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
  MIN_HEIGHT,
  COLLAPSED_HEIGHT,
  SIDE_PANEL_WINDOW_GUTTER,
  BOTTOM_DOCK_WINDOW_GUTTER,
  BOTTOM_DOCK_COLLAPSED_GUTTER
} from "./layout.js";
import { defaultState } from "../shared.js";
import { wait } from "../core/utils.js";

export function createViewStateController({
  state,
  ui,
  getIsPlaying = () => false,
  getIsPaused = () => false,
  getIsCollapsed = () => false,
  setIsCollapsed = () => {},
  setCollapsed = async () => {},
  getScriptManager = () => null,
  getCompletionTracker = () => null,
  getWindowManager = () => null,
  getPromptRenderer = () => null,
  tauriWindow = window.__TAURI__?.window
} = {}) {
  let currentViewState = getIsCollapsed() ? "BOTH_MINIMIZED" : "PROMPTER_EXPANDED";
  let previousViewStateBeforeScriptManager = "PROMPTER_EXPANDED";
  let viewTransitionTimer = null;
  let viewStateTransitionToken = 0;
  let syncModulesDebounceTimer = null;

  let lastBottomDockGutter = -1;
  let lastSidePanelGutter = -1;
  let lastManagerActive = null;
  let lastCompletionActive = null;

  function getSidePanelWindowGutter() {
    const isReadingSession = getIsPlaying() || getIsPaused();
    const showCompletion = Boolean(state.modules?.scriptCompletion) && isReadingSession;
    return showCompletion ? SIDE_PANEL_WINDOW_GUTTER : 0;
  }

  function getBottomDockWindowGutter() {
    const showManager = Boolean(state.modules?.scriptManager);
    if (!showManager) return 0;
    return BOTTOM_DOCK_COLLAPSED_GUTTER;
  }

  function setSidePanelWidth(value) {
    const normalized = Math.max(0, Math.min(SIDE_PANEL_WINDOW_GUTTER, Number(value) || 0));
    document.documentElement.style.setProperty("--side-panel-width", `${normalized}px`);
    document.documentElement.style.setProperty("--side-panel-gap", normalized > 0 ? "14px" : "0px");
  }

  function setBottomDockHeight(value) {
    const normalized = Math.max(0, Math.min(BOTTOM_DOCK_WINDOW_GUTTER, Number(value) || 0));
    document.documentElement.style.setProperty("--bottom-dock-height", `${normalized}px`);
    document.documentElement.style.setProperty("--bottom-dock-gap", "0px");
  }

  function syncModulesVisibility(options = {}) {
    const isReadingSession = getIsPlaying() || getIsPaused();
    const showManager = Boolean(state.modules?.scriptManager);
    const showCompletion = Boolean(state.modules?.scriptCompletion) && isReadingSession;
    const bottomGutter = getBottomDockWindowGutter();
    const sideGutter = getSidePanelWindowGutter();

    setBottomDockHeight(bottomGutter);
    setSidePanelWidth(sideGutter);

    ui.teleprompterBottomDock?.classList.toggle("hidden", !showManager);
    ui.scriptManagerCardSlot?.classList.toggle("hidden", !showManager);

    if (showCompletion) {
      ui.teleprompterRightDock?.classList.remove("hidden");
      ui.scriptCompletionCardSlot?.classList.remove("hidden");
      requestAnimationFrame(() => {
        ui.teleprompterRightDock?.classList.add("dock-visible");
      });
    } else {
      ui.teleprompterRightDock?.classList.remove("dock-visible");
      ui.teleprompterRightDock?.classList.add("hidden");
      ui.scriptCompletionCardSlot?.classList.add("hidden");
    }

    const scriptManager = getScriptManager();
    const completionTracker = getCompletionTracker();
    const windowManager = getWindowManager();

    if (showManager !== lastManagerActive) {
      lastManagerActive = showManager;
      scriptManager?.toggle?.(showManager);
    }
    if (showCompletion !== lastCompletionActive) {
      lastCompletionActive = showCompletion;
      completionTracker?.toggle?.(showCompletion);
    }

    const sideGutterChanged = sideGutter !== lastSidePanelGutter;
    const bottomGutterChanged = bottomGutter !== lastBottomDockGutter;
    lastSidePanelGutter = sideGutter;
    lastBottomDockGutter = bottomGutter;

    if ((sideGutterChanged || bottomGutterChanged || options.force) && tauriWindow?.getCurrentWindow) {
      if (syncModulesDebounceTimer) {
        clearTimeout(syncModulesDebounceTimer);
        syncModulesDebounceTimer = null;
      }

      if (options.immediate) {
        const appWindow = tauriWindow.getCurrentWindow();
        windowManager?.positionWindowForCurrentLayout?.(appWindow).catch(console.error);
      } else {
        syncModulesDebounceTimer = setTimeout(() => {
          syncModulesDebounceTimer = null;
          const appWindow = tauriWindow.getCurrentWindow();
          windowManager?.positionWindowForCurrentLayout?.(appWindow).catch(console.error);
        }, 100);
      }
    }
  }

  async function setViewState(targetState) {
    const fromState = currentViewState;
    if (fromState === targetState) return;
    const token = ++viewStateTransitionToken;
    currentViewState = targetState;

    if (viewTransitionTimer) {
      clearTimeout(viewTransitionTimer);
      viewTransitionTimer = null;
    }

    const scriptManager = getScriptManager();
    const windowManager = getWindowManager();

    if (targetState === "SCRIPT_MANAGER_EXPANDED") {
      previousViewStateBeforeScriptManager = fromState;
      const bottomGutter = getBottomDockWindowGutter();
      const targetHeight = Math.max(state.window?.height || defaultState.window.height, MIN_HEIGHT) + (bottomGutter > 0 ? bottomGutter : 0);

      if (fromState === "PROMPTER_EXPANDED") {
        document.body.classList.add("transition-to-script-manager");
        scriptManager?.expand?.({ notify: false });
        await wait(280);
        if (token !== viewStateTransitionToken) return;

        document.body.classList.remove("teleprompter-collapsed", "teleprompter-collapsing", "transition-to-prompter", "transition-to-notch", "transition-to-script-manager");
        document.body.classList.add("script-manager-open", "notch-entering");
        setTimeout(() => {
          document.body.classList.remove("notch-entering");
        }, 220);
      } else {
        await windowManager?.positionWindowForCurrentLayout?.(null, { totalHeight: targetHeight, resize: true }).catch(console.error);
        if (token !== viewStateTransitionToken) return;

        document.body.classList.remove("teleprompter-collapsed");
        document.body.classList.add("script-manager-open", "transition-to-script-manager");
        scriptManager?.expand?.({ notify: false });
        await wait(280);
        if (token !== viewStateTransitionToken) return;
        document.body.classList.remove("transition-to-script-manager");
      }
    } else if (targetState === "PROMPTER_EXPANDED") {
      if (fromState === "SCRIPT_MANAGER_EXPANDED") {
        document.body.classList.remove("script-manager-open");
        document.body.classList.add("transition-to-prompter");
        await wait(280);
        if (token !== viewStateTransitionToken) return;

        scriptManager?.collapse?.({ notify: false });
        document.body.classList.remove("transition-to-prompter", "transition-to-script-manager", "transition-to-notch", "teleprompter-collapsed", "teleprompter-collapsing");
        setIsCollapsed(false);
        windowManager?.updateCollapseButton?.();
        windowManager?.updateDragControls?.();
        getPromptRenderer()?.applyResponsiveText?.({ force: true });
      } else {
        scriptManager?.collapse?.({ notify: false });
        document.body.classList.remove("script-manager-open", "transition-to-script-manager", "transition-to-notch");
        await setCollapsed(false, true).catch(console.error);
      }
    } else if (targetState === "BOTH_MINIMIZED") {
      if (fromState === "SCRIPT_MANAGER_EXPANDED") {
        document.body.classList.add("transition-to-notch");
        await wait(280);
        if (token !== viewStateTransitionToken) return;

        const bottomGutter = getBottomDockWindowGutter();
        const collapsedTargetHeight = COLLAPSED_HEIGHT + (bottomGutter > 0 ? bottomGutter : 0);
        document.body.classList.remove("script-manager-open");
        document.body.classList.add("teleprompter-collapsed");
        setIsCollapsed(true);
        await windowManager?.positionWindowForCurrentLayout?.(null, { totalHeight: collapsedTargetHeight, resize: true }).catch(console.error);
        if (token !== viewStateTransitionToken) return;

        scriptManager?.collapse?.({ notify: false });
        document.body.classList.remove("transition-to-script-manager", "transition-to-prompter", "transition-to-notch", "teleprompter-collapsing");
        windowManager?.updateCollapseButton?.();
        windowManager?.updateDragControls?.();
      } else {
        scriptManager?.collapse?.({ notify: false });
        document.body.classList.remove("script-manager-open", "transition-to-script-manager", "transition-to-prompter", "transition-to-notch");
        await setCollapsed(true, true).catch(console.error);
      }
    }

    if (token === viewStateTransitionToken) {
      windowManager?.updateCollapseButton?.();
      syncModulesVisibility({ immediate: true });
    }
  }

  return {
    getCurrentViewState: () => currentViewState,
    getPreviousViewStateBeforeScriptManager: () => previousViewStateBeforeScriptManager,
    setViewState,
    getSidePanelWindowGutter,
    getBottomDockWindowGutter,
    setSidePanelWidth,
    setBottomDockHeight,
    syncModulesVisibility
  };
}
