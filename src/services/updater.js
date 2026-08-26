/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const tauriApp = window.__TAURI__?.app;
const tauriCore = window.__TAURI__?.core;
const invoke = tauriCore?.invoke;

export let isMicrosoftStoreBuild = null;
let microsoftStoreBuildPromise = null;

export let updaterState = {
  update: null,
  publishedVersion: "",
  publishedAt: "",
  publishedNotes: "",
  currentVersion: "",
  progress: null,
  checking: false,
  installing: false,
  badgeKey: "settings.updaterStatusCurrent",
  messageKey: "settings.updaterCurrent",
  messageParams: {}
};

let delegate = {
  onStateChange: (state) => {},
  translate: (key, params) => key,
  onWindowStatusChange: (text) => {}
};

export function setUpdaterDelegate(newDelegate) {
  delegate = { ...delegate, ...newDelegate };
}

export function setUpdaterState(nextState = {}) {
  updaterState = {
    ...updaterState,
    ...nextState
  };
  delegate.onStateChange(updaterState);
}

export function getUpdaterCheckAvailable() {
  return !isMicrosoftStoreBuild && Boolean(invoke);
}

export function getUpdaterInstallAvailable() {
  return !isMicrosoftStoreBuild && Boolean(invoke && tauriCore?.Channel);
}

export async function resolveMicrosoftStoreBuild() {
  if (typeof isMicrosoftStoreBuild === "boolean") {
    return isMicrosoftStoreBuild;
  }

  if (!invoke) {
    isMicrosoftStoreBuild = false;
    return isMicrosoftStoreBuild;
  }

  if (microsoftStoreBuildPromise) {
    return microsoftStoreBuildPromise;
  }

  microsoftStoreBuildPromise = invoke("get_distribution_channel")
    .then((channel) => {
      isMicrosoftStoreBuild = String(channel || "").trim().toLowerCase() === "store";
      return isMicrosoftStoreBuild;
    })
    .catch((error) => {
      console.error("Failed to resolve distribution channel", error);
      isMicrosoftStoreBuild = false;
      return isMicrosoftStoreBuild;
    })
    .finally(() => {
      microsoftStoreBuildPromise = null;
    });

  return microsoftStoreBuildPromise;
}

export async function ensureCurrentAppVersion() {
  if (updaterState.currentVersion) {
    return updaterState.currentVersion;
  }

  const version = await tauriApp?.getVersion?.().catch(() => "") || "";
  setUpdaterState({ currentVersion: version });
  return version;
}

export async function fetchPublishedUpdaterFeedMetadata() {
  if (!invoke) return null;
  return invoke("fetch_updater_feed_metadata");
}

function handleUpdaterDownloadEvent(event) {
  if (!event?.event) {
    return;
  }

  if (event.event === "Started") {
    setUpdaterState({
      progress: {
        totalBytes: Number(event.data?.contentLength) || 0,
        downloadedBytes: 0
      }
    });
    return;
  }

  if (event.event === "Progress") {
    const previousProgress = updaterState.progress || { totalBytes: 0, downloadedBytes: 0 };
    setUpdaterState({
      progress: {
        totalBytes: previousProgress.totalBytes,
        downloadedBytes: previousProgress.downloadedBytes + (Number(event.data?.chunkLength) || 0)
      }
    });
    return;
  }

  if (event.event === "Finished") {
    const previousProgress = updaterState.progress || { totalBytes: 0, downloadedBytes: 0 };
    setUpdaterState({
      progress: {
        totalBytes: previousProgress.totalBytes,
        downloadedBytes: previousProgress.totalBytes || previousProgress.downloadedBytes
      }
    });
  }
}

export async function checkForAppUpdates(options = {}) {
  const { silentNoUpdate = false, installIfAvailable = false } = options;
  const storeBuild = await resolveMicrosoftStoreBuild();
  await ensureCurrentAppVersion();

  if (storeBuild || !getUpdaterCheckAvailable() || !invoke) {
    setUpdaterState({
      update: null,
      checking: false,
      installing: false,
      progress: null,
      badgeKey: "settings.updaterStatusUnavailable",
      messageKey: "settings.updaterUnavailable",
      messageParams: {}
    });
    return null;
  }

  setUpdaterState({
    checking: true,
    progress: null,
    badgeKey: "settings.updaterStatusChecking",
    messageKey: "settings.updaterChecking",
    messageParams: {}
  });

  const publishedFeed = await fetchPublishedUpdaterFeedMetadata().catch(() => null);

  if (publishedFeed) {
    setUpdaterState({
      publishedVersion: publishedFeed.version || updaterState.publishedVersion,
      publishedAt: publishedFeed.publishedAt || updaterState.publishedAt,
      publishedNotes: publishedFeed.notes || updaterState.publishedNotes
    });
  }

  try {
    const metadata = await invoke("plugin:updater|check", {
      allowDowngrades: true
    });

    if (!metadata) {
      setUpdaterState({
        update: null,
        checking: false,
        installing: false,
        progress: null,
        badgeKey: "settings.updaterStatusCurrent",
        messageKey: silentNoUpdate ? "settings.updaterIdle" : "settings.updaterCurrent",
        messageParams: { version: updaterState.currentVersion || delegate.translate("common.unavailable") }
      });
      return null;
    }

    setUpdaterState({
      update: metadata,
      publishedVersion: metadata.version || publishedFeed?.version || updaterState.publishedVersion,
      publishedAt: metadata.date || metadata.pub_date || publishedFeed?.publishedAt || updaterState.publishedAt,
      publishedNotes: String(metadata.body || publishedFeed?.notes || updaterState.publishedNotes || "").trim(),
      checking: false,
      installing: false,
      progress: null,
      currentVersion: metadata.currentVersion || updaterState.currentVersion,
      badgeKey: "settings.updaterStatusAvailable",
      messageKey: "settings.updaterAvailable",
      messageParams: { version: metadata.version }
    });

    if (installIfAvailable) {
      await installAvailableUpdate();
    }

    return metadata;
  } catch (error) {
    console.error(error);
    const message = String(error?.message || error || "");
    const unavailableKey = /404|not found/i.test(message)
      ? "settings.updaterFeedUnavailable"
      : "settings.updaterFailed";

    setUpdaterState({
      update: null,
      checking: false,
      installing: false,
      progress: null,
      badgeKey: "settings.updaterStatusError",
      messageKey: unavailableKey,
      messageParams: { error: message }
    });
    return null;
  }
}

export async function installAvailableUpdate() {
  if (!updaterState.update?.version || updaterState.installing || updaterState.checking || !getUpdaterInstallAvailable() || !invoke || !tauriCore) {
    return;
  }

  const targetVersion = updaterState.update.version;
  setUpdaterState({
    installing: true,
    progress: {
      totalBytes: 0,
      downloadedBytes: 0
    },
    badgeKey: "settings.updaterStatusInstalling",
    messageKey: "settings.updaterInstalling",
    messageParams: { version: targetVersion }
  });
  delegate.onWindowStatusChange(delegate.translate("settings.updaterInstallingWindow", { version: targetVersion }));

  try {
    const channel = new tauriCore.Channel();
    channel.onmessage = handleUpdaterDownloadEvent;
    await invoke("plugin:updater|download_and_install", {
      rid: updaterState.update.rid,
      onEvent: channel
    });

    setUpdaterState({
      installing: false,
      badgeKey: "settings.updaterStatusInstalling",
      messageKey: "settings.updaterInstallingWindow",
      messageParams: { version: targetVersion }
    });
  } catch (error) {
    console.error(error);
    const message = String(error?.message || error || "");
    setUpdaterState({
      installing: false,
      progress: null,
      badgeKey: "settings.updaterStatusError",
      messageKey: "settings.updaterInstallFailed",
      messageParams: { error: message }
    });
    delegate.onWindowStatusChange(delegate.translate("settings.updaterInstallFailed", { error: message }));
  }
}
