/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { buildCloudApiUrl, isCloudRemoteEnabled } from "./remote.js";
import { loadState } from "../../core/state.js";
import { translate } from "../../core/i18n.js";

function t(key, params = {}) {
  return translate(key, delegate.getState().language, params);
}

const CLOUD_POLL_MIN_INTERVAL_MS = 6_000;
const CLOUD_POLL_MAX_INTERVAL_MS = 14_000;
const CLOUD_POLL_BACKOFF_STEP_MS = 2_000;
const CLOUD_HEARTBEAT_INTERVAL_MS = 34_000;

export let remoteMessages = [];
export const remotePendingActions = new Set();
export let remoteInboxTimer = 0;
export let remoteHeartbeatTimer = 0;
export let remoteCloudPollDelayMs = CLOUD_POLL_MIN_INTERVAL_MS;
export const remoteCardCollapseTimers = new Map();

let delegate = {
  getRemoteInbox: () => document.querySelector("#remoteInbox"),
  setStatusLabel: (text) => {
    const el = document.querySelector("#statusLabel");
    if (el) el.textContent = text;
  },
  onScriptAppend: (addition) => {},
  wait: (ms) => new Promise((resolve) => window.setTimeout(resolve, ms)),
  getState: () => loadState()
};

export function setRemoteInboxDelegate(newDelegate) {
  delegate = { ...delegate, ...newDelegate };
}

export function buildRemoteScriptAppend(content) {
  const existing = (delegate.getState().script || "").trimEnd();
  const addition = String(content || "").trim();

  if (!addition) {
    return existing;
  }

  return existing ? `${existing}\n\n${addition}` : addition;
}

export function clearRemoteCardCollapseTimer(messageId) {
  const timer = remoteCardCollapseTimers.get(messageId);
  if (timer) {
    clearTimeout(timer);
    remoteCardCollapseTimers.delete(messageId);
  }
}

export function expandRemoteCard(card, messageId) {
  clearRemoteCardCollapseTimer(messageId);
  card.classList.add("is-expanded");
}

export function scheduleRemoteCardCollapse(card, messageId, delayMs = 140) {
  clearRemoteCardCollapseTimer(messageId);
  const timer = window.setTimeout(() => {
    remoteCardCollapseTimers.delete(messageId);
    if (!card.matches(":hover") && !card.matches(":focus-within")) {
      card.classList.remove("is-expanded");
    }
  }, delayMs);
  remoteCardCollapseTimers.set(messageId, timer);
}

export function renderRemoteInbox() {
  const remoteInbox = delegate.getRemoteInbox();
  if (!remoteInbox) {
    return;
  }

  const visibleMessages = remoteMessages.filter((message) => !remotePendingActions.has(message.id));
  remoteCardCollapseTimers.forEach((timer) => clearTimeout(timer));
  remoteCardCollapseTimers.clear();
  remoteInbox.replaceChildren();
  remoteInbox.classList.toggle("hidden", visibleMessages.length === 0);

  visibleMessages.forEach((message) => {
    const card = document.createElement("article");
    card.className = "remote-card";
    card.dataset.messageId = message.id;
    card.dataset.importance = message.importance || "normal";

    if (message.importance === "important") {
      card.classList.add("is-important");
    }

    card.title = "Double-click to append this message to the end of the teleprompter text.";
    card.innerHTML = `
      <div class="remote-card-preview">
        <div class="remote-card-badge"><i class="ph ph-envelope-simple" aria-hidden="true"></i></div>
        <div class="remote-card-body">
          <div class="remote-card-header">
            <strong class="remote-card-title"></strong>
            <span class="remote-importance ${message.importance === "important" ? "is-important" : ""}">${message.importance === "important" ? t("remote.importance.important") : t("remote.importance.normal")}</span>
          </div>
          <p class="remote-card-excerpt"></p>
          <span class="remote-card-hint">${t("remote.cardHint")}</span>
        </div>
        <button class="remote-reject" type="button" aria-label="${t("remote.rejectAria")}"><i class="ph ph-x" aria-hidden="true"></i></button>
      </div>
    `;

    card.querySelector(".remote-card-title").textContent = message.title;
    card.querySelector(".remote-card-excerpt").textContent = message.preview || message.content || "";

    card.addEventListener("mouseenter", () => {
      expandRemoteCard(card, message.id);
    });

    card.addEventListener("mouseleave", () => {
      scheduleRemoteCardCollapse(card, message.id);
    });

    card.addEventListener("focusin", () => {
      expandRemoteCard(card, message.id);
    });

    card.addEventListener("focusout", () => {
      scheduleRemoteCardCollapse(card, message.id);
    });

    card.addEventListener("dblclick", () => {
      acceptRemoteMessage(message.id).catch(console.error);
    });

    card.querySelector(".remote-reject").addEventListener("click", (event) => {
      event.stopPropagation();
      denyRemoteMessage(message.id).catch(console.error);
    });

    remoteInbox.appendChild(card);
  });
}

export async function syncRemoteMessages() {
  if (remotePendingActions.size > 0) {
    return { ok: true, messageCount: remoteMessages.length };
  }

  const url = buildCloudApiUrl("/api/receiver/messages/list");
  if (!url) {
    remoteMessages = [];
    renderRemoteInbox();
    return { ok: false, messageCount: 0 };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        receiverId: delegate.getState().remote?.receiverId,
        receiverSecret: delegate.getState().remote?.receiverSecret,
        accessPassword: delegate.getState().remote?.accessPassword
      })
    });
    const payload = await response.json().catch(() => ({}));
    const serverMessage = String(payload.message || "").trim();
    if (!response.ok) {
      if (response.status === 401 && /receiver not found/i.test(serverMessage)) {
        remoteMessages = [];
        renderRemoteInbox();
        return { ok: true, messageCount: 0 };
      }

      throw new Error(payload.message || t("remote.fetchFailed"));
    }

    remoteMessages = Array.isArray(payload.messages) ? payload.messages : [];
    renderRemoteInbox();
    return { ok: true, messageCount: remoteMessages.length };
  } catch (error) {
    console.error(error);
    return { ok: false, messageCount: 0 };
  }
}

export function scheduleNextRemoteMessageSync(delayMs = remoteCloudPollDelayMs) {
  if (remoteInboxTimer) {
    clearTimeout(remoteInboxTimer);
  }

  remoteInboxTimer = window.setTimeout(() => {
    runRemoteMessageSyncLoop().catch(console.error);
  }, delayMs);
}

export async function runRemoteMessageSyncLoop() {
  const result = await syncRemoteMessages();

  if (!isCloudRemoteEnabled()) {
    return;
  }

  if (!result?.ok) {
    remoteCloudPollDelayMs = CLOUD_POLL_MAX_INTERVAL_MS;
  } else if ((result.messageCount || 0) > 0) {
    remoteCloudPollDelayMs = CLOUD_POLL_MIN_INTERVAL_MS;
  } else {
    remoteCloudPollDelayMs = Math.min(remoteCloudPollDelayMs + CLOUD_POLL_BACKOFF_STEP_MS, CLOUD_POLL_MAX_INTERVAL_MS);
  }

  scheduleNextRemoteMessageSync(remoteCloudPollDelayMs);
}

export async function resolveRemoteMessageAction(messageId, action) {
  const url = buildCloudApiUrl("/api/receiver/messages/resolve");
  if (!url) {
    return false;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      receiverId: delegate.getState().remote?.receiverId,
      receiverSecret: delegate.getState().remote?.receiverSecret,
      messageId,
      action
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || t("remote.resolveFailed"));
  }

  return Boolean(payload.ok);
}

export async function acceptRemoteMessage(messageId) {
  const message = remoteMessages.find((entry) => entry.id === messageId);
  const remoteInbox = delegate.getRemoteInbox();
  const card = remoteInbox?.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);

  if (!message || remotePendingActions.has(messageId)) {
    return;
  }

  remotePendingActions.add(messageId);
  card?.classList.add("is-accepting");
  delegate.setStatusLabel(t("remote.acceptedAppending"));

  await delegate.wait(2000);
  card?.classList.remove("is-accepting");
  card?.classList.add("is-accepted");

  await delegate.wait(260);

  delegate.onScriptAppend(message.content);
  
  await resolveRemoteMessageAction(messageId, "accept").catch(console.error);

  remoteMessages = remoteMessages.filter((entry) => entry.id !== messageId);
  remotePendingActions.delete(messageId);
  renderRemoteInbox();
}

export async function denyRemoteMessage(messageId) {
  const remoteInbox = delegate.getRemoteInbox();
  const card = remoteInbox?.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);

  if (remotePendingActions.has(messageId)) {
    return;
  }

  remotePendingActions.add(messageId);
  card?.classList.add("is-denying");
  delegate.setStatusLabel(t("remote.denied"));

  await delegate.wait(420);
  await resolveRemoteMessageAction(messageId, "deny").catch(console.error);

  remoteMessages = remoteMessages.filter((entry) => entry.id !== messageId);
  remotePendingActions.delete(messageId);
  renderRemoteInbox();
}

export async function heartbeatRemoteReceiver() {
  const url = buildCloudApiUrl("/api/receiver/heartbeat");
  if (!url) {
    return;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        receiverId: delegate.getState().remote?.receiverId,
        receiverSecret: delegate.getState().remote?.receiverSecret,
        accessPassword: delegate.getState().remote?.accessPassword
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message || t("remote.heartbeatFailed", { status: response.status }));
    }
  } catch (error) {
    console.error(error);
  }
}

export function stopRemoteReceiverLoop() {
  if (remoteInboxTimer) {
    clearTimeout(remoteInboxTimer);
    remoteInboxTimer = 0;
  }
  if (remoteHeartbeatTimer) {
    clearInterval(remoteHeartbeatTimer);
    remoteHeartbeatTimer = 0;
  }
}

export function startRemoteReceiverLoop() {
  const remoteInbox = delegate.getRemoteInbox();
  if (!isCloudRemoteEnabled()) {
    remoteInbox?.classList.add("hidden");
    return;
  }

  stopRemoteReceiverLoop();

  heartbeatRemoteReceiver().catch(console.error);
  remoteCloudPollDelayMs = CLOUD_POLL_MIN_INTERVAL_MS;
  runRemoteMessageSyncLoop().catch(console.error);

  remoteHeartbeatTimer = window.setInterval(() => {
    heartbeatRemoteReceiver().catch(console.error);
  }, CLOUD_HEARTBEAT_INTERVAL_MS);
}
