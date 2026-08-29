/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const invoke = window.__TAURI__?.core?.invoke;

// Assume full capability until proven otherwise: this matches the app's
// pre-Linux-port behavior (nothing was ever hidden), so a failed/unavailable
// invoke never hides UI that would have worked fine before this module
// existed.
const DEFAULT_CAPABILITIES = Object.freeze({
  os: "unknown",
  session: "unknown",
  captureProtection: true,
  globalShortcuts: true,
  alwaysOnTop: true,
  windowPositioning: true,
  inAppUpdater: true,
  packageSource: "unknown",
});

let capabilitiesPromise = null;
let capabilitiesCached = null;

export async function getPlatformCapabilities() {
  if (capabilitiesCached) {
    return capabilitiesCached;
  }

  if (!invoke) {
    capabilitiesCached = DEFAULT_CAPABILITIES;
    return capabilitiesCached;
  }

  if (capabilitiesPromise) {
    return capabilitiesPromise;
  }

  capabilitiesPromise = invoke("get_platform_capabilities")
    .then((capabilities) => {
      capabilitiesCached = { ...DEFAULT_CAPABILITIES, ...capabilities };
      return capabilitiesCached;
    })
    .catch((error) => {
      console.warn("Failed to query platform capabilities, assuming full capability", error);
      capabilitiesCached = DEFAULT_CAPABILITIES;
      return capabilitiesCached;
    })
    .finally(() => {
      capabilitiesPromise = null;
    });

  return capabilitiesPromise;
}

export async function hasCaptureProtection() {
  return (await getPlatformCapabilities()).captureProtection;
}

export async function hasGlobalShortcuts() {
  return (await getPlatformCapabilities()).globalShortcuts;
}

export async function hasInAppUpdater() {
  return (await getPlatformCapabilities()).inAppUpdater;
}

export async function isLinux() {
  return (await getPlatformCapabilities()).os === "linux";
}
