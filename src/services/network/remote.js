/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { REMOTE_PUBLIC_URL, REMOTE_RELAY_URL } from "./remote-config.js";
import { generateRemoteAccessPassword } from "../../core/normalizers.js";
import { loadState, saveState } from "../../core/state.js";

export function normalizeRemoteCloudUrl(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

export const CONFIGURED_REMOTE_PUBLIC_URL = normalizeRemoteCloudUrl(REMOTE_PUBLIC_URL) || normalizeRemoteCloudUrl(REMOTE_RELAY_URL);
export const CONFIGURED_CLOUD_RELAY_URL = normalizeRemoteCloudUrl(REMOTE_RELAY_URL);

export function isCloudRemoteSelected() {
  return true;
}

export function isCloudRemoteEnabled() {
  return Boolean(CONFIGURED_CLOUD_RELAY_URL);
}

export function buildCloudApiUrl(path) {
  const base = CONFIGURED_CLOUD_RELAY_URL;
  if (!base) {
    return "";
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildCloudSenderUrl(receiverId = loadState().remote?.receiverId || "") {
  const base = CONFIGURED_REMOTE_PUBLIC_URL;
  if (!base || !receiverId) {
    return "";
  }

  return `${base}/?id=${encodeURIComponent(receiverId)}`;
}

export function buildCloudSenderAuthUrl(receiverId = loadState().remote?.receiverId || "", accessPassword = loadState().remote?.accessPassword || "") {
  const base = CONFIGURED_REMOTE_PUBLIC_URL;
  if (!base || !receiverId || !accessPassword) {
    return "";
  }

  const url = new URL(`${base}/`);
  url.searchParams.set("id", receiverId);
  url.searchParams.set("accessPassword", accessPassword);
  return url.toString();
}

export function rotateRemoteAccessPasswordForLaunch(currentState = loadState()) {
  const nextAccessPassword = generateRemoteAccessPassword();
  const mergedState = saveState({
    remote: {
      ...currentState.remote,
      accessPassword: nextAccessPassword
    }
  });
  return mergedState;
}

export async function fetchCloudRemoteStatus(receiverId = loadState().remote?.receiverId) {
  const url = buildCloudApiUrl(`/api/receiver/${encodeURIComponent(receiverId || "")}/status`);
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url, { cache: "no-store" });
    const status = await response.json().catch(() => null);
    return response.ok ? status : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}
