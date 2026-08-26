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
  MIN_WIDTH,
  MIN_HEIGHT,
  COLLAPSED_HEIGHT,
  COLLAPSE_DURATION,
  SPEED_RAIL_WINDOW_GUTTER,
  REMOTE_RAIL_WINDOW_GUTTER,
  SIDE_PANEL_WINDOW_GUTTER,
  MAX_WIDTH_FALLBACK,
  MAX_HEIGHT_FALLBACK,
  TOP_CENTER_X_OFFSET,
  WINDOW_POSITION_RETRY_DELAY_MS,
  MAX_WINDOW_POSITION_RETRIES,
  normalizeScaleFactor,
  physicalSizeToLogical,
  logicalSizeToPhysical,
  logicalValueToPhysical,
  getMonitorLogicalSize,
  findMonitorForPosition,
  clampWindowPositionToMonitor
} from "./layout.js";
import { defaultState, clamp } from "../shared.js";
import { wait } from "../core/utils.js";
import { setButtonIcon } from "./toolbar.js";

export function createWindowManager({
  state,
  ui,
  saveState,
  t,
  getSpeedRailWindowGutter = () => 0,
  getSidePanelWindowGutter = () => 0,
  getBottomDockWindowGutter = () => 0,
  setSpeedRailGutter = () => {},
  getIsCollapsed = () => false,
  setIsCollapsed = () => {},
  getIsPlaying = () => false,
  stopPlayback = () => {},
  applyResponsiveText = () => {},
  onCollapse = () => {},
  tauriWindow = window.__TAURI__?.window,
  tauriDpi = window.__TAURI__?.dpi,
  tauriEvent = window.__TAURI__?.event,
  invoke = window.__TAURI__?.core?.invoke
} = {}) {
  let currentWindowHeight = null;
  let resizeAnimationToken = 0;
  let collapseTransitionToken = 0;
  let pendingWindowPositionRetryTimer = 0;
  let windowPositionRetryCount = 0;
  let unlistenClickthroughChanged = null;
  let shouldAnnounceClickthroughStatus = false;

  function isFreeDragMode() {
    return state.window?.preset === "drag";
  }

  function isWindowPinned() {
    return state.window?.isPinned !== false;
  }

  function updateCollapseButton() {
    if (!ui.collapseButton) return;
    const isCollapsed = getIsCollapsed();
    const isScriptManagerOpen = document.body?.classList?.contains("script-manager-open") ?? false;
    const shouldShowExpand = isCollapsed || isScriptManagerOpen;
    ui.collapseButton.title = shouldShowExpand ? t("common.expand") : t("common.collapse");
    ui.collapseButton.setAttribute("aria-label", ui.collapseButton.title);
    ui.collapseButton.classList.toggle("is-collapsed", shouldShowExpand);
  }

  function updateDragControls() {
    const isFreeDrag = isFreeDragMode();
    const isPinned = isWindowPinned();
    const isCollapsed = getIsCollapsed();
    const pinLabel = isPinned ? t("common.unpinWindow") : t("common.pinWindow");
    const shouldShowPin = isFreeDrag && !isCollapsed;

    if (ui.pinButton) {
      ui.pinButton.classList.toggle("hidden", !shouldShowPin);
      setButtonIcon(ui.pinButton, isPinned ? "ph-push-pin-simple-slash" : "ph-push-pin-simple");
      ui.pinButton.title = pinLabel;
      ui.pinButton.setAttribute("aria-label", pinLabel);
    }

    if (ui.dragOverlay) {
      const shouldShowOverlay = isFreeDrag && !isPinned;
      ui.dragOverlay.classList.toggle("hidden", !shouldShowOverlay);
      ui.dragOverlay.setAttribute("aria-hidden", shouldShowOverlay ? "false" : "true");
    }
  }

  function getBaseWindowWidth() {
    return Math.max(state.window.width || defaultState.window.width, MIN_WIDTH);
  }

  async function getPreferredMonitor() {
    if (!tauriWindow?.currentMonitor || !tauriWindow?.primaryMonitor) {
      return null;
    }

    return (await tauriWindow.currentMonitor()) ?? (await tauriWindow.primaryMonitor());
  }

  function usesMonitorRelativeWindowPreset() {
    return state.window?.preset === "center" || state.window?.preset === "top-center";
  }

  async function getSafeWindowGeometry(requestedHeight = state.window.height, requestedGutter = getSpeedRailWindowGutter(), requestedSideGutter = getSidePanelWindowGutter()) {
    const monitor = await getPreferredMonitor();
    const logicalMonitorSize = getMonitorLogicalSize(monitor);
    const gutterWidth = Math.max(0, Math.min(SPEED_RAIL_WINDOW_GUTTER, Number(requestedGutter) || 0));
    const sideGutter = Math.max(0, Math.min(SIDE_PANEL_WINDOW_GUTTER, Number(requestedSideGutter) || 0));
    const bottomGutter = getBottomDockWindowGutter();
    const totalGutters = gutterWidth + sideGutter;
    const requestedWindowHeight = Number(requestedHeight) || defaultState.window.height;
    const minAllowedHeight = requestedWindowHeight <= MIN_HEIGHT ? COLLAPSED_HEIGHT : MIN_HEIGHT;
    const maxContentWidth = Math.max(
      Math.min((logicalMonitorSize.width || MAX_WIDTH_FALLBACK) - totalGutters, MAX_WIDTH_FALLBACK - totalGutters),
      MIN_WIDTH
    );
    const maxHeight = Math.max(
      Math.min((logicalMonitorSize.height || MAX_HEIGHT_FALLBACK) - (bottomGutter > 0 ? bottomGutter : 0), MAX_HEIGHT_FALLBACK - (bottomGutter > 0 ? bottomGutter : 0)),
      minAllowedHeight
    );

    return {
      monitor,
      gutterWidth,
      sideGutter,
      width: clamp(getBaseWindowWidth(), MIN_WIDTH, maxContentWidth),
      height: clamp(requestedWindowHeight, minAllowedHeight, maxHeight),
      maxHeight
    };
  }

  async function positionWindowForCurrentLayout(appWindow, options = {}) {
    let targetAppWindow = appWindow;
    let actualOptions = options;
    if (appWindow && typeof appWindow === "object" && !appWindow.setPosition && !appWindow.setSize) {
      actualOptions = appWindow;
      targetAppWindow = tauriWindow?.getCurrentWindow?.();
    }
    if (!targetAppWindow && tauriWindow?.getCurrentWindow) {
      targetAppWindow = tauriWindow.getCurrentWindow();
    }
    if (!targetAppWindow) return false;

    const isCollapsed = getIsCollapsed();
    const isScriptManagerOpen = document.body?.classList?.contains("script-manager-open") ?? false;
    const gutterWidth = actualOptions.gutterWidth ?? getSpeedRailWindowGutter();
    const remoteGutter = REMOTE_RAIL_WINDOW_GUTTER;
    const sideGutter = actualOptions.sideGutter ?? getSidePanelWindowGutter();
    const bottomGutter = actualOptions.bottomGutter ?? getBottomDockWindowGutter();
    const sideGap = sideGutter > 0 ? 14 : 0;
    const baseWidth = Math.max(actualOptions.width ?? getBaseWindowWidth(), MIN_WIDTH);
    const targetWidth = baseWidth + gutterWidth + remoteGutter + sideGutter + sideGap;
    setSpeedRailGutter(gutterWidth);

    let targetHeight;
    if (actualOptions.totalHeight !== undefined) {
      targetHeight = actualOptions.totalHeight;
    } else if (isScriptManagerOpen) {
      targetHeight = Math.max(actualOptions.height ?? state.window.height ?? defaultState.window.height, MIN_HEIGHT) + (bottomGutter > 0 ? bottomGutter : 0);
    } else if (isCollapsed) {
      targetHeight = COLLAPSED_HEIGHT + (bottomGutter > 0 ? bottomGutter : 0);
    } else {
      const prompterHeight = Math.max(actualOptions.height ?? state.window.height ?? defaultState.window.height, MIN_HEIGHT);
      targetHeight = prompterHeight + (bottomGutter > 0 ? bottomGutter : 0);
    }

    let monitor = actualOptions.monitor;
    if (!monitor) {
      if (state.window.preset === "custom" && state.window.x !== null && state.window.y !== null && tauriWindow?.availableMonitors) {
        const allMonitors = await tauriWindow.availableMonitors().catch(() => []) || [];
        monitor = findMonitorForPosition(state.window.x, state.window.y, allMonitors);
      }
      if (!monitor) {
        monitor = await getPreferredMonitor();
      }
    }

    const scaleFactor = normalizeScaleFactor(monitor?.scaleFactor ?? await targetAppWindow?.scaleFactor?.().catch(() => 1));
    const targetPhysicalSize = logicalSizeToPhysical({ width: targetWidth, height: targetHeight }, scaleFactor);
    const gutterWidthPhysical = logicalValueToPhysical(gutterWidth, scaleFactor);
    const baseWidthPhysical = logicalValueToPhysical(baseWidth, scaleFactor);

    let targetPosition = null;
    if (state.window.preset === "center") {
      if (monitor) {
        const x = monitor.position.x + Math.round((monitor.size.width - baseWidthPhysical) / 2) - gutterWidthPhysical;
        const y = monitor.position.y + Math.round((monitor.size.height - targetPhysicalSize.height) / 2);
        targetPosition = new tauriDpi.PhysicalPosition(x, y);
      }
    } else if (state.window.preset === "top-center") {
      if (monitor) {
        const x = monitor.position.x + Math.round((monitor.size.width - baseWidthPhysical) / 2) - gutterWidthPhysical;
        targetPosition = new tauriDpi.PhysicalPosition(x, monitor.position.y);
      }
    } else if (state.window.x !== null && state.window.y !== null && tauriDpi?.PhysicalPosition) {
      const clampedPosition = clampWindowPositionToMonitor(
        state.window.x - gutterWidthPhysical,
        state.window.y,
        monitor,
        targetPhysicalSize.width,
        targetPhysicalSize.height
      );
      targetPosition = new tauriDpi.PhysicalPosition(clampedPosition.x, clampedPosition.y);
    }

    const promises = [];
    if (actualOptions.resize !== false && tauriDpi?.LogicalSize) {
      promises.push(targetAppWindow.setSize(new tauriDpi.LogicalSize(targetWidth, targetHeight)).catch(console.error));
    }
    if (targetPosition) {
      promises.push(targetAppWindow.setPosition(targetPosition).catch(console.error));
    }

    if (promises.length > 0) {
      await Promise.all(promises);
      return Boolean(targetPosition);
    }

    return false;
  }

  async function captureCurrentWindowState() {
    if (!tauriWindow?.getCurrentWindow) {
      return null;
    }

    const appWindow = tauriWindow.getCurrentWindow();
    const [position, scaleFactorValue] = await Promise.all([
      appWindow.outerPosition?.().catch?.(() => null) ?? null,
      appWindow.scaleFactor?.().catch?.(() => 1) ?? 1
    ]);

    const scaleFactor = normalizeScaleFactor(scaleFactorValue);
    const gutterWidth = getSpeedRailWindowGutter();
    const gutterWidthPhysical = logicalValueToPhysical(gutterWidth, scaleFactor);
    const positionOffset = -gutterWidthPhysical;

    return {
      x: position ? position.x - positionOffset : state.window?.x ?? null,
      y: position?.y ?? state.window?.y ?? null,
      width: state.window?.width ?? defaultState.window.width,
      height: state.window?.height ?? defaultState.window.height
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

  async function snapWindowHeight(targetHeight) {
    const geometry = await getSafeWindowGeometry(targetHeight);
    currentWindowHeight = geometry.height;
    if (tauriWindow?.getCurrentWindow && tauriDpi?.LogicalSize) {
      const appWindow = tauriWindow.getCurrentWindow();
      await positionWindowForCurrentLayout(appWindow, { totalHeight: geometry.height, resize: true }).catch(console.error);
    }
  }

  async function animateWindowHeight(targetHeight) {
    await snapWindowHeight(targetHeight);
  }

  async function setCollapsed(nextValue, force = false) {
    const isCollapsed = getIsCollapsed();
    if (!force && isCollapsed === nextValue) return;

    const transitionToken = ++collapseTransitionToken;

    if (nextValue && getIsPlaying()) {
      stopPlayback(true);
    }

    if (nextValue) {
      document.body.classList.remove("script-manager-open");
      try {
        onCollapse();
      } catch {}
    }

    const bottomGutter = getBottomDockWindowGutter();
    const collapsedTargetHeight = COLLAPSED_HEIGHT + (bottomGutter > 0 ? bottomGutter : 0);
    const expandedHeight = Math.max(state.window.height || defaultState.window.height, MIN_HEIGHT) + (bottomGutter > 0 ? bottomGutter : 0);

    setIsCollapsed(nextValue);

    if (nextValue) {
      document.body.classList.add("teleprompter-collapsing");
      document.body.classList.remove("teleprompter-expanding", "teleprompter-collapsed");
      updateCollapseButton();
      updateDragControls();

      // 1. Play GPU slide-out animation (300ms)
      await wait(300);

      if (transitionToken !== collapseTransitionToken) {
        return;
      }

      // 2. Snap window height to collapsed size in 1 atomic call
      await snapWindowHeight(collapsedTargetHeight);
      document.body.classList.add("teleprompter-collapsed", "notch-entering");
      document.body.classList.remove("teleprompter-collapsing");
      setTimeout(() => {
        document.body.classList.remove("notch-entering");
      }, 220);
    } else {
      // 1. Snap window height to expanded size immediately (invisible because canvas is transparent)
      await snapWindowHeight(expandedHeight);

      if (transitionToken !== collapseTransitionToken) {
        return;
      }

      // 2. Play GPU slide-in animation (300ms)
      document.body.classList.add("teleprompter-expanding");
      document.body.classList.remove("teleprompter-collapsed", "teleprompter-collapsing");
      updateCollapseButton();
      updateDragControls();

      await wait(300);

      if (transitionToken !== collapseTransitionToken) {
        return;
      }

      document.body.classList.remove("teleprompter-expanding");
      applyResponsiveText({ force: true });
    }
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

  function unbindDesktopEventListeners() {
    unlistenClickthroughChanged?.();
    unlistenClickthroughChanged = null;
  }

  async function applyStoredWindowSettings() {
    if (!tauriWindow?.getCurrentWindow || !tauriDpi?.LogicalSize) return;

    const appWindow = tauriWindow.getCurrentWindow();
    const geometry = await getSafeWindowGeometry();
    state.window.width = geometry.width;
    state.window.height = geometry.height;

    setSpeedRailGutter(geometry.gutterWidth);

    if (getIsCollapsed()) {
      return;
    }

    const bottomGutter = getBottomDockWindowGutter();
    currentWindowHeight = state.window.height + (bottomGutter > 0 ? bottomGutter : 0);
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

  return {
    isFreeDragMode,
    isWindowPinned,
    updateCollapseButton,
    updateDragControls,
    getBaseWindowWidth,
    getPreferredMonitor,
    usesMonitorRelativeWindowPreset,
    getSafeWindowGeometry,
    positionWindowForCurrentLayout,
    captureCurrentWindowState,
    setWindowPinned,
    toggleDragOverlay,
    setWindowPreset,
    snapWindowHeight,
    animateWindowHeight,
    setCollapsed,
    applyDesktopPreferences,
    bindDesktopEventListeners,
    unbindDesktopEventListeners,
    applyStoredWindowSettings
  };
}
