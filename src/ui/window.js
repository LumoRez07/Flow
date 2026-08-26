/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const tauriInvoke = window.__TAURI__?.core?.invoke;
const tauriEvent = window.__TAURI__?.event;

export const DESKTOP_WINDOW_FADE_MS = 320;

export function scheduleAnimationFrame(callback) {
  let frameId = 0;

  return () => {
    if (frameId) {
      return;
    }

    frameId = window.requestAnimationFrame(() => {
      frameId = 0;
      callback();
    });
  };
}

export function waitForMs(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function revealDesktopWindow(target = document) {
  const body = target?.body;
  if (!body) {
    return;
  }

  body.classList.remove("window-closing");
  body.classList.remove("window-ready");

  const markReady = () => {
    body.classList.add("window-ready");
  };

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(markReady);
  });

  // Failsafe in case rAF is throttled in hidden/background webviews
  window.setTimeout(markReady, 60);
}

export function preventDevToolsInProduction() {
  window.addEventListener(
    "keydown",
    (event) => {
      const isDevTools =
        event.key === "F12" ||
        ((event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          (event.key === "I" ||
            event.key === "i" ||
            event.key === "J" ||
            event.key === "j" ||
            event.key === "C" ||
            event.key === "c")) ||
        ((event.ctrlKey || event.metaKey) && (event.key === "U" || event.key === "u"));

      if (isDevTools && !window.__FLOW_DEV__) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
}

export function initializeDesktopWindowOpacityFade(target = document, autoReveal = true) {
  preventDevToolsInProduction();
  const body = target?.body;
  if (!body) {
    return;
  }

  body.classList.add("desktop-window-opacity-fade");

  if (autoReveal) {
    revealDesktopWindow(target);
  }

  if (tauriEvent?.listen) {
    tauriEvent.listen("flow-reveal-main-window", () => {
      revealDesktopWindow(target);
    }).catch(() => {});
  }

  window.addEventListener("focus", () => {
    if (body.classList.contains("window-closing") || !body.classList.contains("window-ready")) {
      revealDesktopWindow(target);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !body.classList.contains("window-ready")) {
      revealDesktopWindow(target);
    }
  });
}

export async function fadeOutDesktopWindow(target = document, durationMs = DESKTOP_WINDOW_FADE_MS) {
  const body = target?.body;
  if (!body) {
    return;
  }

  body.classList.add("window-closing");
  body.classList.remove("window-ready");
  await waitForMs(durationMs);
}

export async function invokeAfterDesktopFadeOut(command, args = {}, durationMs = DESKTOP_WINDOW_FADE_MS) {
  if (!tauriInvoke) {
    return;
  }

  await fadeOutDesktopWindow(document, durationMs);
  await tauriInvoke(command, args);
}
