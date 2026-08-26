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
  applyTextPatch,
  computeTextPatch,
  isHostRealtimeEditActive,
  loadRealtimeEditingConfig,
  saveRealtimeEditingConfig,
  transformTextPatch
} from "./realtime-editing.js";
import { loadState } from "../../core/state.js";
import { CONFIGURED_REALTIME_RELAY_URL } from "./realtime.js";
import Peer from "../../assets/vendor/peerjs.esm.js";

const REALTIME_HANDSHAKE_REFRESH_MS = 45_000;
const REALTIME_RECONNECT_DELAY_MS = 1_500;
const REALTIME_CONNECTION_HEARTBEAT_MS = 3_000;
const REALTIME_WAKE_POLL_MS = 2_500;

let peerConstructorPromise = null;

async function loadPeerConstructor() {
  const PeerConstructor = Peer?.Peer || Peer || window.PeerJS?.Peer || window.Peer;
  if (typeof PeerConstructor === "function") {
    return PeerConstructor;
  }

  if (!peerConstructorPromise) {
    peerConstructorPromise = new Promise((resolve, reject) => {
      const existingConstructor = window.PeerJS?.Peer || window.Peer;
      if (typeof existingConstructor === "function") {
        resolve(existingConstructor);
        return;
      }

      const existingScript = document.querySelector(`script[data-flow-peerjs="true"]`);
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          const loadedConstructor = window.PeerJS?.Peer || window.Peer;
          if (typeof loadedConstructor === "function") {
            resolve(loadedConstructor);
            return;
          }

          reject(new Error("PeerJS vendor bundle loaded without exposing a Peer constructor."));
        }, { once: true });
        existingScript.addEventListener("error", () => {
          reject(new Error("Failed to load the PeerJS vendor bundle."));
        }, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "./assets/vendor/peerjs.min.js";
      script.async = true;
      script.dataset.flowPeerjs = "true";
      script.addEventListener("load", () => {
        const loadedConstructor = window.PeerJS?.Peer || window.Peer;
        if (typeof loadedConstructor === "function") {
          resolve(loadedConstructor);
          return;
        }

        reject(new Error("PeerJS vendor bundle loaded without exposing a Peer constructor."));
      }, { once: true });
      script.addEventListener("error", () => {
        reject(new Error("Failed to load the PeerJS vendor bundle."));
      }, { once: true });
      document.head.appendChild(script);
    }).catch((error) => {
      peerConstructorPromise = null;
      throw error;
    });
  }

  return peerConstructorPromise;
}

function buildPeerId(roomId = "") {
  const normalizedRoomId = String(roomId || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 36) || "room";
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  const suffix = Array.from(randomBytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `flow-${normalizedRoomId}-${suffix}`;
}

function normalizeMessage(value) {
  return value && typeof value === "object" ? value : {};
}

function notifyRoomClosed(connection) {
  try {
    connection.send({ type: "room-closed" });
  } catch {
    // Ignore connection send failures during shutdown.
  }
}

export function createRealtimeHostController(options = {}) {
  let destroyed = false;
  let peer = null;
  let handshakeTimer = 0;
  let reconnectTimer = 0;
  let heartbeatTimer = 0;
  let wakePollTimer = 0;
  let activeConfigSignature = "";
  let isStartingPeer = false;
  let currentText = String(options.getCurrentScript?.() || "");
  let currentRevision = 0;
  const MAX_PATCH_HISTORY = 60;
  const patchHistory = [];
  let currentPlaybackState = normalizePlaybackState(options.getCurrentPlaybackState?.());
  const connections = new Set();

  function normalizePlaybackState(state = {}) {
    return {
      active: state?.active === true,
      paused: state?.paused === true,
      wordIndex: Math.max(0, Number(state?.wordIndex) || 0),
      totalWords: Math.max(0, Number(state?.totalWords) || 0),
      wordText: String(state?.wordText || "").slice(0, 160)
    };
  }

  function clearHandshakeTimer() {
    if (handshakeTimer) {
      clearTimeout(handshakeTimer);
      handshakeTimer = 0;
    }
  }

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = 0;
    }
  }

  function clearHeartbeatTimer() {
    if (!heartbeatTimer) {
      return;
    }

    clearInterval(heartbeatTimer);
    heartbeatTimer = 0;
  }

  function clearWakePollTimer() {
    if (!wakePollTimer) {
      return;
    }

    clearTimeout(wakePollTimer);
    wakePollTimer = 0;
  }

  function getConfigSignature(config) {
    if (!config?.roomId || !config?.passwordHash) {
      return "";
    }

    return `${config.roomId}:${config.passwordHash}`;
  }

  function hasActivePeer(signature) {
    return Boolean(peer && activeConfigSignature === signature && !peer.destroyed);
  }

  function resetRuntimeState() {
    currentText = String(options.getCurrentScript?.() || "");
    currentRevision = 0;
    patchHistory.length = 0;
    currentPlaybackState = normalizePlaybackState(options.getCurrentPlaybackState?.());
  }

  function getActiveConfig() {
    const config = loadRealtimeEditingConfig();
    const currentRoomId = String(options.getCurrentRoomId?.() || "").trim();
    if (!config.enabled || !config.roomId || !config.passwordHash) {
      return null;
    }

    if (!currentRoomId || config.roomId !== currentRoomId) {
      return null;
    }

    return config;
  }

  async function postJson(path, payload) {
    const url = options.buildCloudApiUrl?.(path) || "";
    if (!url) {
      return null;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message || `Realtime relay request failed with status ${response.status}.`);
    }

    return response;
  }

  async function postJsonData(path, payload) {
    const response = await postJson(path, payload);
    return response ? response.json().catch(() => null) : null;
  }

  async function announceHost(peerId) {
    const config = getActiveConfig();
    if (!config || !peerId) {
      return;
    }

    await postJson("/api/realtime/announce", {
      roomId: config.roomId,
      passwordHash: config.passwordHash,
      peerId
    });
  }

  async function clearHandshake() {
    const config = getActiveConfig();
    if (!config) {
      return;
    }

    await postJson("/api/realtime/clear", {
      roomId: config.roomId,
      passwordHash: config.passwordHash
    });
  }

  async function clearWakeRequest(config = getActiveConfig()) {
    if (!config) {
      return;
    }

    await postJson("/api/realtime/wake", {
      action: "clear",
      roomId: config.roomId,
      passwordHash: config.passwordHash
    });
  }

  async function peekWakeRequest(config = getActiveConfig()) {
    if (!config) {
      return false;
    }

    const payload = await postJsonData("/api/realtime/wake", {
      action: "peek",
      roomId: config.roomId,
      passwordHash: config.passwordHash
    });
    return payload?.pending === true;
  }

  function updateConfigTimestamp(fieldName) {
    const config = getActiveConfig();
    if (!config) {
      return;
    }

    saveRealtimeEditingConfig({
      ...config,
      [fieldName]: Date.now()
    });
  }

  function destroyPeerAnd(nextStep = null) {
    destroyPeer()
      .catch(console.error)
      .finally(() => {
        if (destroyed) {
          return;
        }

        if (nextStep === "wake") {
          scheduleWakePoll();
          return;
        }

        if (nextStep === "reconnect") {
          scheduleReconnect();
        }
      });
  }

  let consecutiveReconnectFailures = 0;

  function scheduleReconnect() {
    clearReconnectTimer();
    if (destroyed) {
      return;
    }

    consecutiveReconnectFailures += 1;
    if (consecutiveReconnectFailures > 3) {
      scheduleWakePoll();
      return;
    }

    const delay = Math.min(REALTIME_RECONNECT_DELAY_MS * Math.pow(2, consecutiveReconnectFailures - 1), 30_000);
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = 0;
      refreshConfig().catch(console.error);
    }, delay);
  }

  function scheduleWakePoll() {
    clearWakePollTimer();
    if (destroyed || peer || connections.size > 0 || !getActiveConfig()) {
      return;
    }

    const pollInterval = consecutiveReconnectFailures > 2
      ? Math.min(REALTIME_WAKE_POLL_MS * Math.pow(2, consecutiveReconnectFailures - 2), 30_000)
      : REALTIME_WAKE_POLL_MS;

    wakePollTimer = window.setTimeout(async () => {
      wakePollTimer = 0;
      try {
        const shouldWake = await peekWakeRequest();
        if (shouldWake && consecutiveReconnectFailures <= 4) {
          await startPeer();
          return;
        }
      } catch (error) {
        console.error("Failed to poll realtime wake request", error);
      }

      if (!destroyed && !peer && connections.size === 0) {
        scheduleWakePoll();
      }
    }, pollInterval);
  }

  function scheduleHandshake(peerId) {
    clearHandshakeTimer();
    if (destroyed || !peerId) {
      return;
    }

    handshakeTimer = window.setTimeout(() => {
      announceHost(peerId)
        .then(updatePublishedTimestamp)
        .catch(console.error)
        .finally(() => {
          if (!destroyed && peer?.id === peerId) {
            scheduleHandshake(peerId);
          }
        });
    }, REALTIME_HANDSHAKE_REFRESH_MS);
  }

  function broadcast(message, excludedConnection = null) {
    connections.forEach((connection) => {
      if (connection === excludedConnection || !connection?.open) {
        return;
      }

      try {
        connection.send(message);
      } catch (error) {
        console.error("Failed to broadcast realtime message", error);
      }
    });
  }

  function ensureHeartbeatLoop() {
    if (heartbeatTimer) {
      return;
    }

    heartbeatTimer = window.setInterval(() => {
      if (!connections.size) {
        clearHeartbeatTimer();
        return;
      }

      broadcast({
        type: "host-heartbeat",
        revision: currentRevision,
        playback: currentPlaybackState,
        sentAtMs: Date.now()
      });
    }, REALTIME_CONNECTION_HEARTBEAT_MS);
  }

  function sendSnapshot(connection) {
    if (!connection?.open) {
      return;
    }

    connection.send({
      type: "script-sync",
      revision: currentRevision,
      text: currentText,
      playback: currentPlaybackState
    });
  }

  function broadcastRoomClosed() {
    connections.forEach((connection) => {
      notifyRoomClosed(connection);
    });
  }

  async function handleConnectionMessage(connection, message) {
    const normalizedMessage = normalizeMessage(message);
    switch (normalizedMessage.type) {
      case "request-sync":
        sendSnapshot(connection);
        return;
      case "close-room":
        broadcastRoomClosed();
        await options.closeRealtimeRoom?.();
        return;
      case "edit-patch":
        break;
      default:
        return;
    }

    if (options.isHostEditingActive?.() || isHostRealtimeEditActive()) {
      sendSnapshot(connection);
      return;
    }

    const baseRevision = Number(normalizedMessage.baseRevision);
    if (!Number.isFinite(baseRevision)) {
      sendSnapshot(connection);
      return;
    }

    let patchToApply = normalizedMessage.patch;
    if (baseRevision !== currentRevision) {
      if (baseRevision < currentRevision && currentRevision - baseRevision <= patchHistory.length) {
        const historySinceBase = patchHistory.filter((entry) => entry.revision > baseRevision);
        for (const entry of historySinceBase) {
          patchToApply = transformTextPatch(patchToApply, entry.patch);
        }
      } else {
        sendSnapshot(connection);
        return;
      }
    }

    const nextText = applyTextPatch(currentText, patchToApply);
    if (nextText === currentText) {
      connection.send({
        type: "script-ack",
        revision: currentRevision
      });
      return;
    }

    currentText = nextText;
    currentRevision += 1;
    patchHistory.push({ revision: currentRevision, patch: patchToApply });
    if (patchHistory.length > MAX_PATCH_HISTORY) {
      patchHistory.shift();
    }

    connection.send({
      type: "script-ack",
      revision: currentRevision
    });
    broadcast({
      type: "script-patch",
      revision: currentRevision,
      patch: patchToApply
    }, connection);
    await options.applyRemoteScript?.(nextText);
  }

  function updateReadyTimestamp() {
    updateConfigTimestamp("lastReadyAtMs");
  }

  function updatePublishedTimestamp() {
    updateConfigTimestamp("lastPublishedAtMs");
  }

  function detachConnection(connection) {
    connections.delete(connection);
    options.onConnectionCountChanged?.(connections.size);
    if (!connections.size) {
      clearHeartbeatTimer();
    }
  }

  function attachConnection(connection) {
    connections.add(connection);
    options.onConnectionCountChanged?.(connections.size);
    ensureHeartbeatLoop();

    connection.on("open", () => {
      sendSnapshot(connection);
      clearWakeRequest().catch(console.error);
      updateReadyTimestamp();
    });

    connection.on("data", (message) => {
      handleConnectionMessage(connection, message).catch(console.error);
    });

    connection.on("close", () => {
      detachConnection(connection);
    });

    connection.on("error", (error) => {
      console.error("Realtime connection error", error);
      detachConnection(connection);
    });
  }

  async function destroyPeer() {
    clearHandshakeTimer();
    clearHeartbeatTimer();
    clearWakePollTimer();
    connections.forEach((connection) => {
      try {
        connection.close();
      } catch {
        // Ignore close failures during teardown.
      }
    });
    connections.clear();
    options.onConnectionCountChanged?.(0);

    if (peer) {
      try {
        peer.destroy();
      } catch {
        // Ignore destroy failures during teardown.
      }
      peer = null;
    }
  }

  function getPeerOptions() {
    const configuredHost = String(loadState()?.remote?.publicHost || CONFIGURED_REALTIME_RELAY_URL || "").trim();
    if (configuredHost) {
      try {
        const url = new URL(configuredHost.startsWith("http") ? configuredHost : `https://${configuredHost}`);
        return {
          host: url.hostname,
          port: url.port ? Number(url.port) : (url.protocol === "https:" ? 443 : 80),
          path: url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`,
          secure: url.protocol === "https:",
          debug: 0
        };
      } catch {
        // Fall back to default cloud server if URL parsing fails
      }
    }

    return {
      host: "0.peerjs.com",
      port: 443,
      path: "/",
      secure: true,
      debug: 0
    };
  }

  async function startPeer() {
    const config = getActiveConfig();
    if (!config || isStartingPeer) {
      return;
    }

    const nextSignature = getConfigSignature(config);
    if (hasActivePeer(nextSignature)) {
      return;
    }

    isStartingPeer = true;
    activeConfigSignature = nextSignature;
    resetRuntimeState();
    await destroyPeer();

    try {
      const Peer = await loadPeerConstructor();
      if (destroyed) return;
      const nextPeer = new Peer(buildPeerId(config.roomId), getPeerOptions());
      peer = nextPeer;

      nextPeer.on("open", (peerId) => {
        consecutiveReconnectFailures = 0;
        announceHost(peerId)
          .then(() => {
            updatePublishedTimestamp();
            scheduleHandshake(peerId);
            clearWakeRequest(config).catch(console.error);
          })
          .catch((error) => {
            console.error("Failed to announce realtime host", error);
            scheduleReconnect();
          });
      });

      nextPeer.on("connection", (connection) => {
        attachConnection(connection);
      });

      nextPeer.on("disconnected", () => {
        if (peer && !peer.destroyed) {
          try {
            peer.reconnect();
          } catch {
            destroyPeerAnd("wake");
          }
        }
      });

      nextPeer.on("close", () => {
        destroyPeerAnd("wake");
      });

      nextPeer.on("error", (error) => {
        console.warn("Realtime host peer connection warning:", error?.message || error);
        destroyPeerAnd("reconnect");
      });
    } finally {
      isStartingPeer = false;
    }
  }

  async function refreshConfig() {
    if (destroyed) {
      return;
    }

    const config = getActiveConfig();
    if (!config) {
      if (activeConfigSignature || connections.size) {
        broadcastRoomClosed();
      }
      activeConfigSignature = "";
      resetRuntimeState();
      clearWakePollTimer();
      await destroyPeer();
      return;
    }

    const nextSignature = getConfigSignature(config);
    if (hasActivePeer(nextSignature)) {
      return;
    }

    await startPeer();
  }

  function isPlaybackStateEqual(a, b) {
    if (!a || !b) return false;
    return a.active === b.active &&
      a.paused === b.paused &&
      a.wordIndex === b.wordIndex &&
      a.totalWords === b.totalWords &&
      a.wordText === b.wordText;
  }

  function syncLocalScript(nextText) {
    const normalizedText = String(nextText || "");
    if (normalizedText === currentText) {
      return;
    }

    const patch = computeTextPatch(currentText, normalizedText);
    currentText = normalizedText;
    currentRevision += 1;
    patchHistory.push({ revision: currentRevision, patch });
    if (patchHistory.length > MAX_PATCH_HISTORY) {
      patchHistory.shift();
    }
    if (connections.size > 0) {
      broadcast({
        type: "script-patch",
        revision: currentRevision,
        patch
      });
    }
  }

  function syncPlaybackState(nextState) {
    const normalizedState = normalizePlaybackState(nextState);
    if (isPlaybackStateEqual(normalizedState, currentPlaybackState)) {
      return;
    }

    currentPlaybackState = normalizedState;
    if (connections.size > 0) {
      broadcast({
        type: "host-playback",
        playback: currentPlaybackState
      });
    }
  }

  return {
    refreshConfig,
    syncLocalScript,
    syncPlaybackState,
    dispose() {
      destroyed = true;
      clearReconnectTimer();
      clearWakePollTimer();
      clearHandshake().catch(console.error);
      clearWakeRequest().catch(console.error);
      destroyPeer().catch(console.error);
    }
  };
}