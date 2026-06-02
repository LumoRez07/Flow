const REALTIME_EDITING_STORAGE_KEY = "flow.realtime.editing.v1";
const REALTIME_EDITING_UPDATED_EVENT = "flow-realtime-editing-updated";
const REALTIME_HOST_EDIT_ACTIVITY_KEY = "flow.realtime.editing.host-activity.v1";
const REALTIME_HOST_EDIT_ACTIVITY_WINDOW_MS = 1800;
const REALTIME_EDITING_STALE_MS = 90_000;

function readBrowserStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeBrowserStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures and keep the feature ephemeral.
  }
}

function removeBrowserStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function normalizeString(value, maxLength = 512) {
  return String(value || "").trim().slice(0, maxLength);
}

export function normalizeRealtimeEditingConfig(rawConfig = {}) {
  return {
    enabled: rawConfig?.enabled === true,
    roomId: normalizeString(rawConfig?.roomId, 128),
    passwordHash: normalizeString(rawConfig?.passwordHash, 256),
    roomUrl: normalizeString(rawConfig?.roomUrl, 2048),
    initializedAtMs: Number(rawConfig?.initializedAtMs) || 0,
    lastPublishedAtMs: Number(rawConfig?.lastPublishedAtMs) || 0,
    lastReadyAtMs: Number(rawConfig?.lastReadyAtMs) || 0
  };
}

export function loadRealtimeEditingConfig() {
  try {
    const raw = readBrowserStorage(REALTIME_EDITING_STORAGE_KEY);
    if (!raw) {
      return normalizeRealtimeEditingConfig();
    }

    return normalizeRealtimeEditingConfig(JSON.parse(raw));
  } catch {
    return normalizeRealtimeEditingConfig();
  }
}

export function saveRealtimeEditingConfig(nextConfig = {}) {
  const normalized = normalizeRealtimeEditingConfig(nextConfig);
  writeBrowserStorage(REALTIME_EDITING_STORAGE_KEY, normalized);
  window.dispatchEvent(new CustomEvent(REALTIME_EDITING_UPDATED_EVENT, { detail: normalized }));
  return normalized;
}

export function clearRealtimeEditingConfig() {
  removeBrowserStorage(REALTIME_EDITING_STORAGE_KEY);
  const cleared = normalizeRealtimeEditingConfig();
  window.dispatchEvent(new CustomEvent(REALTIME_EDITING_UPDATED_EVENT, { detail: cleared }));
  return cleared;
}

export function isRealtimeEditingConfigStale(config = loadRealtimeEditingConfig(), maxAgeMs = REALTIME_EDITING_STALE_MS) {
  if (!config?.enabled) {
    return false;
  }

  const freshestActivityAtMs = Math.max(
    Number(config.lastReadyAtMs) || 0,
    Number(config.lastPublishedAtMs) || 0,
    Number(config.initializedAtMs) || 0
  );

  if (!freshestActivityAtMs) {
    return true;
  }

  return Date.now() - freshestActivityAtMs > maxAgeMs;
}

export function clearStaleRealtimeEditingConfig(maxAgeMs = REALTIME_EDITING_STALE_MS) {
  const config = loadRealtimeEditingConfig();
  if (!isRealtimeEditingConfigStale(config, maxAgeMs)) {
    return config;
  }

  return clearRealtimeEditingConfig();
}

export function getRealtimeEditingUpdatedEventName() {
  return REALTIME_EDITING_UPDATED_EVENT;
}

export function buildRealtimeRoomUrl(baseUrl = "", roomId = "", passwordHash = "") {
  const normalizedBase = String(baseUrl || "").trim().replace(/\/+$/, "");
  const normalizedRoomId = normalizeString(roomId, 128);
  const normalizedPasswordHash = normalizeString(passwordHash, 256);

  if (!normalizedBase || !normalizedRoomId || !normalizedPasswordHash) {
    return "";
  }

  return `${normalizedBase}/room/${encodeURIComponent(normalizedRoomId)}/passhs/${encodeURIComponent(normalizedPasswordHash)}`;
}

export async function sha256Hex(value) {
  const source = new TextEncoder().encode(String(value || ""));
  const buffer = await crypto.subtle.digest("SHA-256", source);
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createRealtimePasswordHash(roomId = "", accessPassword = "") {
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  const nonce = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return sha256Hex(`${normalizeString(roomId, 128)}:${normalizeString(accessPassword, 1024)}:${nonce}:${Date.now()}`);
}

export function computeTextPatch(previousText = "", nextText = "") {
  const sourceText = String(previousText || "");
  const targetText = String(nextText || "");

  if (sourceText === targetText) {
    return {
      start: sourceText.length,
      deleteCount: 0,
      insertText: ""
    };
  }

  let start = 0;
  const sourceLength = sourceText.length;
  const targetLength = targetText.length;
  const maxPrefix = Math.min(sourceLength, targetLength);

  while (start < maxPrefix && sourceText[start] === targetText[start]) {
    start += 1;
  }

  let sourceEnd = sourceLength;
  let targetEnd = targetLength;
  while (sourceEnd > start && targetEnd > start && sourceText[sourceEnd - 1] === targetText[targetEnd - 1]) {
    sourceEnd -= 1;
    targetEnd -= 1;
  }

  return {
    start,
    deleteCount: sourceEnd - start,
    insertText: targetText.slice(start, targetEnd)
  };
}

export function applyTextPatch(sourceText = "", patch = {}) {
  const normalizedSource = String(sourceText || "");
  const start = Math.max(0, Math.min(Number(patch?.start) || 0, normalizedSource.length));
  const deleteCount = Math.max(0, Number(patch?.deleteCount) || 0);
  const insertText = String(patch?.insertText || "");
  return normalizedSource.slice(0, start) + insertText + normalizedSource.slice(start + deleteCount);
}

export function markHostRealtimeEditActivity() {
  try {
    localStorage.setItem(REALTIME_HOST_EDIT_ACTIVITY_KEY, String(Date.now()));
  } catch {
    // Ignore activity tracking failures.
  }
}

export function isHostRealtimeEditActive() {
  try {
    const value = Number(localStorage.getItem(REALTIME_HOST_EDIT_ACTIVITY_KEY));
    return Number.isFinite(value) && Date.now() - value <= REALTIME_HOST_EDIT_ACTIVITY_WINDOW_MS;
  } catch {
    return false;
  }
}