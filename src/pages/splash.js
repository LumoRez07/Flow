/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { initializeDesktopWindowOpacityFade, wait } from "../shared.js";
import { isProEdition } from "../core/distribution.js";

const invoke = window.__TAURI__?.core?.invoke;
const tauriWindow = window.__TAURI__?.window;

export async function initializeSplashScreen() {
  const splashScreen = document.getElementById("splashScreen");
  const splashEdition = document.getElementById("splashEdition");
  const MINIMUM_SPLASH_TIME = 2200;

  initializeDesktopWindowOpacityFade();

  if (splashEdition) {
    const isPro = await isProEdition();
    splashEdition.textContent = isPro ? "V2 Pro" : "V2 Community";
    splashEdition.classList.toggle("is-pro", isPro);
  }

  if (!splashScreen) {
    if (invoke) {
      await invoke("show_main_window_command").catch(console.error);
    }
    return;
  }

  await wait(MINIMUM_SPLASH_TIME);

  // 1. Trigger main window display to initiate seamless crossfade
  if (invoke) {
    await invoke("show_main_window_command").catch(console.error);
  }

  // 2. Smoothly fade out splash screen concurrently
  splashScreen.classList.add("fade-out");
  await wait(380);

  // 3. Close the splash window after fade-out transition completes
  if (tauriWindow?.getCurrentWindow) {
    const current = await tauriWindow.getCurrentWindow();
    if (current) {
      await current.close().catch(console.error);
    }
  }
}
