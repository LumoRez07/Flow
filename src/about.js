/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { applyAppearanceToDocument, applyTranslationsToDocument, loadState } from "./shared.js";

const invoke = window.__TAURI__?.core?.invoke;
const openUrl = window.__TAURI__?.opener?.openUrl;

function syncTheme() {
  const state = loadState();
  applyAppearanceToDocument(state.appearance);
  applyTranslationsToDocument(state.language);
}

window.addEventListener("DOMContentLoaded", () => {
  syncTheme();

  document.querySelector("#closeWindowButton")?.addEventListener("click", () => {
    invoke?.("hide_aux_window", { kind: "about" }).catch(console.error);
  });

  document.querySelector("#openSettingsButton")?.addEventListener("click", () => {
    invoke?.("open_aux_window", { kind: "settings" }).catch(console.error);
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    const url = new URL(href, window.location.href);
    if (!["https:", "http:"].includes(url.protocol)) return;

    event.preventDefault();
    openUrl?.(url.toString()).catch(console.error);
  });

  window.addEventListener("focus", syncTheme);
  window.addEventListener("storage", syncTheme);
  window.addEventListener("flow-state-updated", syncTheme);
});
