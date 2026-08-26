/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { clamp } from "../core/utils.js";

export const MIN_WIDTH = 400;
export const MIN_HEIGHT = 200;
export const COLLAPSED_HEIGHT = 56;
export const COLLAPSE_DURATION = 420;
export const SPEED_RAIL_WINDOW_GUTTER = 74;
export const REMOTE_RAIL_WINDOW_GUTTER = 94;
export const BOTTOM_DOCK_WINDOW_GUTTER = 280;
export const BOTTOM_DOCK_COLLAPSED_GUTTER = 40;
export const SIDE_PANEL_WINDOW_GUTTER = 260;
export const SIDE_PANEL_COLLAPSED_GUTTER = 0;
export const MAX_WIDTH_FALLBACK = 2200;
export const MAX_HEIGHT_FALLBACK = 1400;
export const SPEED_RAIL_TRANSITION_MS = 220;
export const TOP_CENTER_X_OFFSET = 0;
export const WINDOW_POSITION_RETRY_DELAY_MS = 120;
export const MAX_WINDOW_POSITION_RETRIES = 3;

const tauriDpi = window.__TAURI__?.dpi;

export function normalizeScaleFactor(scaleFactor) {
  const numericScaleFactor = Number(scaleFactor);
  return Number.isFinite(numericScaleFactor) && numericScaleFactor > 0 ? numericScaleFactor : 1;
}

export function physicalSizeToLogical(size, scaleFactor) {
  if (!size) {
    return { width: 0, height: 0 };
  }

  if (typeof size.toLogical === "function") {
    return size.toLogical(scaleFactor);
  }

  if (tauriDpi?.PhysicalSize) {
    return new tauriDpi.PhysicalSize(Number(size.width || 0), Number(size.height || 0)).toLogical(scaleFactor);
  }

  return {
    width: Number(size.width || 0) / scaleFactor,
    height: Number(size.height || 0) / scaleFactor
  };
}

export function logicalSizeToPhysical(size, scaleFactor) {
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

export function logicalValueToPhysical(value, scaleFactor) {
  return Math.round((Number(value) || 0) * scaleFactor);
}

export function getMonitorLogicalSize(monitor) {
  return physicalSizeToLogical(monitor?.size, normalizeScaleFactor(monitor?.scaleFactor));
}

export function isPositionInMonitor(x, y, monitor) {
  if (!monitor?.position || !monitor?.size) {
    return false;
  }

  const minX = monitor.position.x;
  const minY = monitor.position.y;
  const maxX = monitor.position.x + monitor.size.width;
  const maxY = monitor.position.y + monitor.size.height;

  return x >= minX && x < maxX && y >= minY && y < maxY;
}

export function findMonitorForPosition(x, y, monitors = []) {
  if (!Array.isArray(monitors) || !monitors.length) {
    return null;
  }

  return monitors.find((monitor) => isPositionInMonitor(x, y, monitor)) || null;
}

export function clampWindowPositionToMonitor(x, y, monitor, width, height) {
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
