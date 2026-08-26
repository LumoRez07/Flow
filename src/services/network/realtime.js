/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { REALTIME_RELAY_URL } from "./remote-config.js";
import { normalizeRemoteCloudUrl } from "./remote.js";

export const CONFIGURED_REALTIME_RELAY_URL = normalizeRemoteCloudUrl(REALTIME_RELAY_URL);

export function buildRealtimeApiUrl(path) {
  const base = CONFIGURED_REALTIME_RELAY_URL;
  if (!base) {
    return "";
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isRealtimeRelayConfigured() {
  return Boolean(CONFIGURED_REALTIME_RELAY_URL);
}

let probePromiseCache = null;
let probeUrlCache = "";
let probeStateCache = "idle";

export async function fetchRealtimeRelayProbe(force = false) {
  const probeUrl = buildRealtimeApiUrl("/api/realtime/lookup");
  if (!probeUrl) {
    probeStateCache = "idle";
    probeUrlCache = "";
    probePromiseCache = null;
    return false;
  }

  if (!force && probePromiseCache) {
    return probePromiseCache;
  }

  if (!force && probeUrlCache === probeUrl && (probeStateCache === "online" || probeStateCache === "error")) {
    return probeStateCache === "online";
  }

  probeUrlCache = probeUrl;
  probeStateCache = "checking";

  probePromiseCache = fetch(probeUrl, {
    method: "OPTIONS",
    signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined
  })
    .then((response) => {
      probeStateCache = response.ok ? "online" : "error";
      return response.ok;
    })
    .catch((error) => {
      console.error("Realtime relay probe failed", error);
      probeStateCache = "error";
      return false;
    })
    .finally(() => {
      probePromiseCache = null;
    });

  return probePromiseCache;
}

export function getRealtimeRelayProbeState() {
  return probeStateCache;
}
