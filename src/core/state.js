/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { normalizeVoiceLanguage } from "./config.js";
import { normalizeState, createDefaults, mergeState } from "./normalizers.js";

const STORAGE_KEY = "flow.teleprompter.state.v2";
const VOICE_MODEL_REGISTRY_KEY = "flow.voice.models.v1";
const STORAGE_WRITE_DEBOUNCE_MS = 140;

const tauriInvoke = window.__TAURI__?.core?.invoke;
const tauriEvent = window.__TAURI__?.event;

let stateCache = null;
let voiceModelRegistryCache = null;
let storageInitPromise = null;
let persistedStateWriteTimer = 0;
let persistedVoiceModelRegistryWriteTimer = 0;

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
    // Ignore browser storage failures and continue with in-memory state.
  }
}

function readCachedStateFromBrowser() {
  try {
    const raw = readBrowserStorage(STORAGE_KEY);
    if (!raw) {
      return createDefaults();
    }
    return normalizeState(JSON.parse(raw));
  } catch {
    return createDefaults();
  }
}

export function normalizeVoiceModelRegistry(rawRegistry = {}) {
  if (!rawRegistry || typeof rawRegistry !== "object" || Array.isArray(rawRegistry)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(rawRegistry).map(([language, entry]) => {
      const normalizedLanguage = normalizeVoiceLanguage(language);
      const nextEntry = entry && typeof entry === "object" && !Array.isArray(entry)
        ? { ...entry }
        : {};
      const models = nextEntry.models && typeof nextEntry.models === "object" && !Array.isArray(nextEntry.models)
        ? Object.fromEntries(
            Object.entries(nextEntry.models).map(([modelId, modelEntry]) => [
              String(modelId || "").trim(),
              modelEntry && typeof modelEntry === "object" && !Array.isArray(modelEntry)
                ? { ...modelEntry, modelId: String(modelId || "").trim() }
                : { modelId: String(modelId || "").trim() }
            ]).filter(([modelId]) => Boolean(modelId))
          )
        : {};

      return [normalizedLanguage, {
        ...nextEntry,
        language: normalizedLanguage,
        selectedModelId: typeof nextEntry.selectedModelId === "string" && nextEntry.selectedModelId.trim()
          ? nextEntry.selectedModelId.trim()
          : "",
        models
      }];
    })
  );
}

function readCachedVoiceModelRegistryFromBrowser() {
  try {
    const raw = readBrowserStorage(VOICE_MODEL_REGISTRY_KEY);
    if (!raw) {
      return {};
    }
    return normalizeVoiceModelRegistry(JSON.parse(raw));
  } catch {
    return {};
  }
}

function hasBrowserStorageValue(key) {
  return Boolean(readBrowserStorage(key));
}

function cacheState(nextState) {
  stateCache = normalizeState(nextState);
  return stateCache;
}

function setStateCache(nextState) {
  cacheState(nextState);
  writeBrowserStorage(STORAGE_KEY, stateCache);
  return stateCache;
}

function cacheVoiceModelRegistry(nextRegistry) {
  voiceModelRegistryCache = normalizeVoiceModelRegistry(nextRegistry);
  return voiceModelRegistryCache;
}

function setVoiceModelRegistryCache(nextRegistry) {
  cacheVoiceModelRegistry(nextRegistry);
  writeBrowserStorage(VOICE_MODEL_REGISTRY_KEY, voiceModelRegistryCache);
  return voiceModelRegistryCache;
}

function schedulePersistedStateWrite(nextState) {
  if (!tauriInvoke) {
    return;
  }
  window.clearTimeout(persistedStateWriteTimer);
  persistedStateWriteTimer = window.setTimeout(() => {
    tauriInvoke("save_persisted_app_state", { state: nextState }).catch((error) => {
      console.error("Persisted app state save failed", error);
    });
  }, STORAGE_WRITE_DEBOUNCE_MS);
}

function schedulePersistedVoiceModelRegistryWrite(nextRegistry) {
  if (!tauriInvoke) {
    return;
  }
  window.clearTimeout(persistedVoiceModelRegistryWriteTimer);
  persistedVoiceModelRegistryWriteTimer = window.setTimeout(() => {
    tauriInvoke("save_persisted_voice_model_registry", { registry: nextRegistry }).catch((error) => {
      console.error("Persisted voice model registry save failed", error);
    });
  }, STORAGE_WRITE_DEBOUNCE_MS);
}

export async function initializePersistentStorage() {
  if (storageInitPromise) {
    return storageInitPromise;
  }

  storageInitPromise = (async () => {
    const hasBrowserState = hasBrowserStorageValue(STORAGE_KEY);
    const hasBrowserVoiceModelRegistry = hasBrowserStorageValue(VOICE_MODEL_REGISTRY_KEY);
    const browserState = readCachedStateFromBrowser();
    const browserVoiceModelRegistry = readCachedVoiceModelRegistryFromBrowser();
    setStateCache(browserState);
    setVoiceModelRegistryCache(browserVoiceModelRegistry);

    if (!tauriInvoke) {
      return {
        state: stateCache,
        voiceModelRegistry: voiceModelRegistryCache
      };
    }

    try {
      const payload = await tauriInvoke("load_persisted_app_data");
      const persistedStateRaw = payload?.state;
      const persistedRegistryRaw = payload?.voiceModelRegistry;
      const hasPersistedState = persistedStateRaw && typeof persistedStateRaw === "object" && Object.keys(persistedStateRaw).length > 0;
      const hasPersistedRegistry = persistedRegistryRaw && typeof persistedRegistryRaw === "object" && Object.keys(persistedRegistryRaw).length > 0;

      if (hasPersistedState) {
        setStateCache(persistedStateRaw);
      } else if (hasBrowserState) {
        setStateCache(browserState);
        schedulePersistedStateWrite(browserState);
      }

      if (hasPersistedRegistry) {
        setVoiceModelRegistryCache(persistedRegistryRaw);
      } else if (hasBrowserVoiceModelRegistry) {
        setVoiceModelRegistryCache(browserVoiceModelRegistry);
        schedulePersistedVoiceModelRegistryWrite(browserVoiceModelRegistry);
      }
    } catch (error) {
      console.error("Persistent storage initialization failed", error);
    }

    return {
      state: stateCache,
      voiceModelRegistry: voiceModelRegistryCache
    };
  })();

  return storageInitPromise;
}

export function loadState() {
  const browserState = readCachedStateFromBrowser();
  if (!stateCache || JSON.stringify(stateCache) !== JSON.stringify(browserState)) {
    return cacheState(browserState);
  }
  return normalizeState(stateCache);
}

export function saveState(nextState) {
  const mergedState = mergeState(loadState(), nextState);
  setStateCache(mergedState);
  schedulePersistedStateWrite(mergedState);
  window.dispatchEvent(new CustomEvent("flow-state-updated", { detail: mergedState }));
  if (tauriEvent?.emit) {
    tauriEvent.emit("flow-state-updated", mergedState).catch(() => {});
  }
  return mergedState;
}

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY && event.newValue) {
    try {
      const parsed = normalizeState(JSON.parse(event.newValue));
      cacheState(parsed);
      window.dispatchEvent(new CustomEvent("flow-state-updated", { detail: parsed }));
    } catch (e) {
      // Ignore parse errors on storage sync
    }
  }

  if (event.key === VOICE_MODEL_REGISTRY_KEY && event.newValue) {
    try {
      const parsed = normalizeVoiceModelRegistry(JSON.parse(event.newValue));
      cacheVoiceModelRegistry(parsed);
      window.dispatchEvent(new CustomEvent("flow-voice-models-updated", { detail: parsed }));
    } catch (e) {
      // Ignore parse errors on storage sync
    }
  }
});

if (tauriEvent?.listen) {
  tauriEvent.listen("flow-state-updated", (event) => {
    if (event?.payload) {
      try {
        const parsed = normalizeState(event.payload);
        cacheState(parsed);
        window.dispatchEvent(new CustomEvent("flow-state-updated", { detail: parsed }));
      } catch (e) {
        // Ignore parse errors on Tauri sync
      }
    }
  });

  tauriEvent.listen("flow-voice-models-updated", (event) => {
    if (event?.payload) {
      try {
        const parsed = normalizeVoiceModelRegistry(event.payload);
        cacheVoiceModelRegistry(parsed);
        window.dispatchEvent(new CustomEvent("flow-voice-models-updated", { detail: parsed }));
      } catch (e) {
        // Ignore parse errors on Tauri sync
      }
    }
  });
}

export function loadVoiceModelRegistry() {
  const browserRegistry = readCachedVoiceModelRegistryFromBrowser();
  if (!voiceModelRegistryCache || JSON.stringify(voiceModelRegistryCache) !== JSON.stringify(browserRegistry)) {
    return cacheVoiceModelRegistry(browserRegistry);
  }
  return normalizeVoiceModelRegistry(voiceModelRegistryCache);
}

export function saveVoiceModelRegistry(nextRegistry = {}) {
  const registry = setVoiceModelRegistryCache(nextRegistry && typeof nextRegistry === "object" ? nextRegistry : {});
  schedulePersistedVoiceModelRegistryWrite(registry);
  window.dispatchEvent(new CustomEvent("flow-voice-models-updated", { detail: registry }));
  if (tauriEvent?.emit) {
    tauriEvent.emit("flow-voice-models-updated", registry).catch(() => {});
  }
  return registry;
}

export function getVoiceModelRegistryEntry(language, registry = loadVoiceModelRegistry()) {
  const normalizedLanguage = normalizeVoiceLanguage(language);
  return registry?.[normalizedLanguage] || null;
}

export function getSelectedVoiceModelId(language, registry = loadVoiceModelRegistry()) {
  const selectedModelId = getVoiceModelRegistryEntry(language, registry)?.selectedModelId;
  return typeof selectedModelId === "string" && selectedModelId.trim()
    ? selectedModelId.trim()
    : null;
}

export function updateVoiceModelRegistry(language, patch = {}) {
  const normalizedLanguage = normalizeVoiceLanguage(language);
  const registry = loadVoiceModelRegistry();
  const nextRegistry = {
    ...registry,
    [normalizedLanguage]: {
      ...(registry[normalizedLanguage] || {}),
      ...patch,
      language: normalizedLanguage
    }
  };
  return saveVoiceModelRegistry(nextRegistry);
}
