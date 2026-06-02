/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { applyAppearanceToDocument, applyTranslationsToDocument, initializeDesktopWindowOpacityFade, initializePersistentStorage, loadState, saveState, translate } from "./shared.js";

await initializePersistentStorage();

const invoke = window.__TAURI__?.core?.invoke;
const tauriWindow = window.__TAURI__?.window;
const tauriDpi = window.__TAURI__?.dpi;

const ui = {
  window: document.querySelector(".remote-inbox-window"),
  inbox: document.querySelector("#remoteInboxWindow")
};

const COLLAPSED_WIDTH = 360;
const EXPANDED_WIDTH = 360;
const WINDOW_MIN_HEIGHT = 96;
const WINDOW_BOTTOM_OFFSET = 24;
const WINDOW_VERTICAL_PADDING = 16;
const WINDOW_STACK_GAP = 10;
const REMOTE_CARD_SLOT_HEIGHT = 220;

let remoteMessages = [];
const remotePendingActions = new Set();
let pollTimer = null;
let lastMessageSignature = "";

function logRemoteInboxError(context, error) {
  console.error(`[remote-inbox] ${context}`, error);
}

function getCurrentState() {
  return loadState();
}

function applyCurrentDocumentState() {
  const currentState = getCurrentState();
  applyAppearanceToDocument(currentState.appearance);
  applyTranslationsToDocument(currentState.language);
}

function getVisibleRemoteMessages() {
  return remoteMessages.filter((message) => !remotePendingActions.has(message.id));
}

function t(key, params = {}) {
  return translate(key, getCurrentState().language, params);
}

function buildRemoteScriptAppend(content) {
  const state = getCurrentState();
  const existing = (state.script || "").trimEnd();
  const addition = String(content || "").trim();

  if (!addition) {
    return existing;
  }

  return existing ? `${existing}\n\n${addition}` : addition;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function normalizeScaleFactor(scaleFactor) {
  const numericScaleFactor = Number(scaleFactor);
  return Number.isFinite(numericScaleFactor) && numericScaleFactor > 0 ? numericScaleFactor : 1;
}

function logicalValueToPhysical(value, scaleFactor) {
  return Math.round((Number(value) || 0) * scaleFactor);
}

async function syncWindowVisibility(hasMessages) {
  if (!invoke) {
    return;
  }

  await invoke("sync_remote_inbox_window", { hasMessages }).catch(console.error);
}

async function positionInboxWindow() {
  if (!tauriWindow?.getCurrentWindow || !tauriDpi?.PhysicalPosition) {
    return;
  }

  const appWindow = tauriWindow.getCurrentWindow();
  const monitor = (await tauriWindow.currentMonitor?.()) ?? (await tauriWindow.primaryMonitor?.());
  if (!monitor) {
    return;
  }

  const outer = await appWindow.outerSize();
  const scaleFactor = normalizeScaleFactor(await appWindow.scaleFactor?.().catch(() => monitor.scaleFactor ?? 1));
  const bottomOffsetPhysical = logicalValueToPhysical(WINDOW_BOTTOM_OFFSET, scaleFactor);
  const x = monitor.position.x + Math.round((monitor.size.width - outer.width) / 2);
  const y = monitor.position.y + monitor.size.height - outer.height - bottomOffsetPhysical;
  await appWindow.setPosition(new tauriDpi.PhysicalPosition(x, y)).catch(console.error);
}

async function applyWindowLayout() {
  if (!tauriWindow?.getCurrentWindow || !tauriDpi?.LogicalSize || !tauriDpi?.PhysicalPosition) {
    return;
  }

  const appWindow = tauriWindow.getCurrentWindow();
  const width = COLLAPSED_WIDTH;
  const visibleMessageCount = getVisibleRemoteMessages().length;
  const contentHeight = visibleMessageCount > 0
    ? WINDOW_VERTICAL_PADDING
      + (visibleMessageCount * REMOTE_CARD_SLOT_HEIGHT)
      + (Math.max(visibleMessageCount - 1, 0) * WINDOW_STACK_GAP)
    : WINDOW_MIN_HEIGHT;
  const height = Math.max(contentHeight, WINDOW_MIN_HEIGHT);

  const [outerSize, outerPosition] = await Promise.all([
    appWindow.outerSize().catch(() => null),
    appWindow.outerPosition().catch(() => null)
  ]);

  if (outerSize && outerPosition) {
    const scaleFactor = normalizeScaleFactor(await appWindow.scaleFactor?.().catch(() => 1));
    const targetPhysicalHeight = logicalValueToPhysical(height, scaleFactor);
    const anchoredY = outerPosition.y + (outerSize.height - targetPhysicalHeight);
    if (anchoredY !== outerPosition.y) {
      await appWindow.setPosition(new tauriDpi.PhysicalPosition(outerPosition.x, anchoredY)).catch(console.error);
    }
  }

  await appWindow.setSize(new tauriDpi.LogicalSize(width, height)).catch(console.error);
  await positionInboxWindow();
}

function getMessageSignature(messages = []) {
  return messages
    .map((message) => [message.id, message.title, message.preview, message.content, message.importance].join("::"))
    .join("||");
}

function renderRemoteInbox() {
  if (!ui.inbox) {
    return;
  }

  const visibleMessages = getVisibleRemoteMessages();
  ui.inbox.replaceChildren();

  visibleMessages.forEach((message) => {
    const card = document.createElement("article");
    card.className = "remote-card";
    card.dataset.messageId = message.id;
    card.dataset.importance = message.importance || "normal";
    if (message.importance === "important") {
      card.classList.add("is-important");
    }

    card.innerHTML = `
      <div class="remote-card-preview">
        <div class="remote-card-badge">✉</div>
        <div class="remote-card-body">
          <div class="remote-card-header">
            <strong class="remote-card-title"></strong>
            <span class="remote-importance ${message.importance === "important" ? "is-important" : ""}">${message.importance === "important" ? t("remote.importance.important") : t("remote.importance.normal")}</span>
          </div>
          <p class="remote-card-excerpt"></p>
          <span class="remote-card-hint">${t("remote.cardHint")}</span>
        </div>
        <button class="remote-reject" type="button" aria-label="${t("remote.rejectAria")}">×</button>
      </div>
    `;

    card.querySelector(".remote-card-title").textContent = message.title;
    card.querySelector(".remote-card-excerpt").textContent = message.preview || message.content || "";

    card.addEventListener("dblclick", () => {
      acceptRemoteMessage(message.id).catch((error) => logRemoteInboxError("accept remote message", error));
    });

    card.querySelector(".remote-reject").addEventListener("click", (event) => {
      event.stopPropagation();
      denyRemoteMessage(message.id).catch((error) => logRemoteInboxError("deny remote message", error));
    });

    ui.inbox.appendChild(card);
  });
}

async function syncRemoteMessages() {
  if (!invoke || remotePendingActions.size > 0) {
    return;
  }

  try {
    const messages = await invoke("list_remote_messages");
    remoteMessages = Array.isArray(messages) ? messages : [];

    if (remoteMessages.length === 0) {
      lastMessageSignature = "";
      await syncWindowVisibility(false);
      renderRemoteInbox();
      return;
    }

    const nextSignature = getMessageSignature(remoteMessages);
    if (nextSignature !== lastMessageSignature) {
      lastMessageSignature = nextSignature;
      renderRemoteInbox();
      await applyWindowLayout();
    }
  } catch (error) {
    logRemoteInboxError("sync remote messages", error);
  }
}

async function resolveRemoteMessageAction(messageId, action) {
  if (!invoke) {
    return false;
  }

  return invoke("resolve_remote_message", { messageId, action });
}

async function acceptRemoteMessage(messageId) {
  const message = remoteMessages.find((entry) => entry.id === messageId);
  const card = ui.inbox?.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);

  if (!message || remotePendingActions.has(messageId)) {
    return;
  }

  remotePendingActions.add(messageId);
  card?.classList.add("is-accepting");

  await wait(2000);
  card?.classList.remove("is-accepting");
  card?.classList.add("is-accepted");

  await wait(260);

  saveState({ script: buildRemoteScriptAppend(message.content) });
  await resolveRemoteMessageAction(messageId, "accept").catch((error) => {
    logRemoteInboxError("resolve accepted remote message", error);
  });

  remoteMessages = remoteMessages.filter((entry) => entry.id !== messageId);
  renderRemoteInbox();
  if (remoteMessages.length === 0) {
    await syncWindowVisibility(false);
    return;
  }

  await applyWindowLayout();
}

async function denyRemoteMessage(messageId) {
  const card = ui.inbox?.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);

  if (remotePendingActions.has(messageId)) {
    return;
  }

  remotePendingActions.add(messageId);
  card?.classList.add("is-denying");

  await wait(420);
  await resolveRemoteMessageAction(messageId, "deny").catch((error) => {
    logRemoteInboxError("resolve denied remote message", error);
  });

  remoteMessages = remoteMessages.filter((entry) => entry.id !== messageId);
  renderRemoteInbox();
  if (remoteMessages.length === 0) {
    await syncWindowVisibility(false);
    return;
  }

  await applyWindowLayout();
}

function startRemoteInboxPolling() {
  pollTimer = window.setInterval(() => {
    syncRemoteMessages().catch((error) => logRemoteInboxError("poll remote messages", error));
  }, 1200);
}

function stopRemoteInboxPolling() {
  if (!pollTimer) {
    return;
  }

  clearInterval(pollTimer);
  pollTimer = null;
}

function bindRemoteInboxWindowEvents() {
  window.addEventListener("resize", () => {
    positionInboxWindow().catch((error) => logRemoteInboxError("position inbox window", error));
  });

  window.addEventListener("beforeunload", () => {
    stopRemoteInboxPolling();
  });
}

function bindRemoteInboxStateEvents() {
  const handleStateChange = () => {
    applyCurrentDocumentState();
    renderRemoteInbox();
  };

  window.addEventListener("storage", handleStateChange);
  window.addEventListener("flow-state-updated", handleStateChange);
}

function bootRemoteInboxPage() {
  applyCurrentDocumentState();
  applyWindowLayout().catch((error) => logRemoteInboxError("apply window layout", error));
  syncRemoteMessages().catch((error) => logRemoteInboxError("initial remote message sync", error));
  initializeDesktopWindowOpacityFade();
  startRemoteInboxPolling();
  bindRemoteInboxWindowEvents();
  bindRemoteInboxStateEvents();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", bootRemoteInboxPage, { once: true });
} else {
  bootRemoteInboxPage();
}
