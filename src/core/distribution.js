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

let distributionChannelPromise = null;
let isProEditionCached = null;


export async function isProEdition() {
  if (typeof isProEditionCached === "boolean") {
    return isProEditionCached;
  }

  if (!invoke) {
    isProEditionCached = false;
    return isProEditionCached;
  }

  if (distributionChannelPromise) {
    return distributionChannelPromise;
  }

  distributionChannelPromise = invoke("get_distribution_channel")
    .then((channel) => {
      isProEditionCached = String(channel || "").trim().toLowerCase() === "store";
      return isProEditionCached;
    })
    .catch((error) => {
      console.warn("Failed to query distribution channel, defaulting to free open-source edition", error);
      isProEditionCached = false;
      return isProEditionCached;
    })
    .finally(() => {
      distributionChannelPromise = null;
    });

  return distributionChannelPromise;
}

export function getEditionName(isPro) {
  return isPro ? "Flow Pro" : "Flow";
}
