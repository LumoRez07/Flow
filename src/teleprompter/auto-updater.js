/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { AUTO_UPDATE_CHECK_INTERVAL_MS } from "./playback-constants.js";

export function createAutoUpdater({
  invoke = window.__TAURI__?.core?.invoke,
  tauriCore = window.__TAURI__?.core,
  tauriApp = window.__TAURI__?.app,
  onStatusUpdate = () => {}
} = {}) {
  let isMicrosoftStoreBuild = null;
  let microsoftStoreBuildPromise = null;
  let autoUpdateCheckTimer = null;
  let isAutoUpdateChecking = false;
  let isAutoUpdateInstalling = false;
  let totalBytesToDownload = 0;
  let totalBytesDownloaded = 0;

  function getAutoUpdaterAvailable() {
    return !isMicrosoftStoreBuild && Boolean(invoke && tauriCore?.Channel);
  }

  async function resolveMicrosoftStoreBuild() {
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

  function setStatus(key, params = {}) {
    onStatusUpdate(key, params);
  }

  function handleAutomaticUpdateDownloadEvent(version, event) {
    if (!event?.event) {
      return;
    }

    if (event.event === "Started") {
      totalBytesToDownload = Math.max(Number(event.data?.contentLength) || 0, 0);
      totalBytesDownloaded = 0;
      setStatus("tele.updaterInstalling", { version });
      return;
    }

    if (event.event === "Progress") {
      const chunkLength = Math.max(Number(event.data?.chunkLength) || 0, 0);
      totalBytesDownloaded += chunkLength;
      const percent = totalBytesToDownload > 0
        ? Math.min(Math.round((totalBytesDownloaded / totalBytesToDownload) * 100), 100)
        : 0;
      setStatus("tele.updaterDownloading", { version, progress: percent });
      return;
    }

    if (event.event === "Finished") {
      setStatus("tele.updaterInstalling", { version });
    }
  }

  async function runAutomaticUpdateCheck(options = {}) {
    const { announceNoUpdate = false, announceErrors = false } = options;

    if (!getAutoUpdaterAvailable() || isAutoUpdateChecking || isAutoUpdateInstalling) {
      return null;
    }

    isAutoUpdateChecking = true;
    totalBytesDownloaded = 0;

    try {
      const metadata = await invoke("plugin:updater|check", {
        allowDowngrades: false
      });

      if (!metadata) {
        if (announceNoUpdate) {
          setStatus("tele.updaterCurrent");
        }
        return null;
      }

      isAutoUpdateInstalling = true;
      setStatus("tele.updaterInstalling", { version: metadata.version || (await tauriApp?.getVersion?.().catch(() => "")) || "" });

      const channel = new tauriCore.Channel();
      channel.onmessage = (event) => {
        handleAutomaticUpdateDownloadEvent(metadata.version, event);
      };

      await invoke("plugin:updater|download_and_install", {
        rid: metadata.rid,
        onEvent: channel
      });

      return metadata;
    } catch (error) {
      console.error("Automatic updater failed", error);
      if (announceErrors) {
        setStatus("tele.updaterFailed", { error: error?.message || String(error) });
      }
      return null;
    } finally {
      isAutoUpdateChecking = false;
      isAutoUpdateInstalling = false;
    }
  }

  function startAutomaticUpdater() {
    runAutomaticUpdateCheck().catch(console.error);

    if (autoUpdateCheckTimer) {
      clearInterval(autoUpdateCheckTimer);
    }

    autoUpdateCheckTimer = window.setInterval(() => {
      runAutomaticUpdateCheck().catch(console.error);
    }, AUTO_UPDATE_CHECK_INTERVAL_MS);
  }

  function stopAutomaticUpdater() {
    if (autoUpdateCheckTimer) {
      clearInterval(autoUpdateCheckTimer);
      autoUpdateCheckTimer = null;
    }
  }

  return {
    getAutoUpdaterAvailable,
    resolveMicrosoftStoreBuild,
    runAutomaticUpdateCheck,
    startAutomaticUpdater,
    stopAutomaticUpdater
  };
}
