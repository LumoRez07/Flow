/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { applyAppearanceToDocument, applyTranslationsToDocument, initializeDesktopWindowOpacityFade, initializePersistentStorage, initializeSmoothScrollbox, invokeAfterDesktopFadeOut, loadState, translate } from "./shared.js";
import { isProEdition } from "./core/distribution.js";

await initializePersistentStorage();

const invoke = window.__TAURI__?.core?.invoke;
const openUrl = window.__TAURI__?.opener?.openUrl;

async function syncTheme() {
  const state = loadState();
  applyAppearanceToDocument(state.appearance);
  applyTranslationsToDocument(state.language);
  const isPro = await isProEdition();
  const versionEl = document.querySelector(".about-version");
  if (versionEl) {
    versionEl.textContent = isPro ? "Flow Pro 2.0.0" : "Flow 2.0.0";
  }

  const p2El = document.querySelector("[data-i18n-html='about.p2']");
  if (p2El) {
    p2El.style.display = isPro ? "none" : "";
  }

  if (isPro) {
    const titleEl = document.querySelector("[data-i18n='about.title']");
    if (titleEl) {
      titleEl.textContent = translate("about.pro.title", state.language);
    }
    const p1El = document.querySelector("[data-i18n-html='about.p1']");
    if (p1El) {
      p1El.innerHTML = translate("about.pro.p1", state.language);
    }
    const p3El = document.querySelector("[data-i18n-html='about.p3']");
    if (p3El) {
      p3El.innerHTML = translate("about.pro.p3", state.language);
    }
    const p4El = document.querySelector("[data-i18n-html='about.p4']");
    if (p4El) {
      p4El.innerHTML = translate("about.pro.p4", state.language);
    }
  }
}

function bootAboutPage() {
  syncTheme();

  document.querySelector("#closeWindowButton")?.addEventListener("click", () => {
    if (!invoke) {
      return;
    }

    invokeAfterDesktopFadeOut("hide_aux_window", { kind: "about" }).catch(console.error);
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

  initializeDesktopWindowOpacityFade();
  initializeSmoothScrollbox();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", bootAboutPage, { once: true });
} else {
  bootAboutPage();
}
