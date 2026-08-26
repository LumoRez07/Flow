/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { defaultState } from "../core/config.js";
import {
  normalizeTheme,
  normalizeAppOpacity,
  normalizeCompanionOpacity,
  normalizeCornerRadius,
  normalizeCardRadius,
  normalizeBorderWidth,
  normalizeBorderOpacity,
  normalizeGlassBlur,
  normalizeCustomColor,
  resolveFontStack
} from "../core/normalizers.js";

export function applyThemeToDocument(theme, target = document) {
  if (!target?.body) return;
  target.body.dataset.theme = normalizeTheme(theme, defaultState.appearance.theme);
}

export function applyAppearanceToDocument(appearance = {}, target = document) {
  if (!target?.body) return;
  const merged = {
    ...defaultState.appearance,
    ...appearance
  };

  const appOpacity = normalizeAppOpacity(merged.appOpacity, defaultState.appearance.appOpacity);
  const companionOpacity = normalizeCompanionOpacity(merged.companionOpacity, defaultState.appearance.companionOpacity);
  const cornerRadius = normalizeCornerRadius(merged.cornerRadius, defaultState.appearance.cornerRadius);
  const cardRadius = normalizeCardRadius(merged.cardRadius, defaultState.appearance.cardRadius);
  const borderWidth = normalizeBorderWidth(merged.borderWidth, defaultState.appearance.borderWidth);
  const borderOpacity = normalizeBorderOpacity(merged.borderOpacity, defaultState.appearance.borderOpacity);
  const glassBlur = normalizeGlassBlur(merged.glassBlur, defaultState.appearance.glassBlur);
  const customAccent = normalizeCustomColor(merged.customAccentColor, "");
  const customHighlight = normalizeCustomColor(merged.customHighlightColor, "");

  applyThemeToDocument(merged.theme, target);
  target.body.dataset.style = merged.style || defaultState.appearance.style;
  target.body.dataset.mirrorMode = merged.mirrorMode ? "true" : "false";
  target.body.dataset.mirrorVertical = merged.mirrorVertical ? "true" : "false";
  target.body.dataset.toolbarAutoHide = merged.autoHideToolbar ? "true" : "false";
  target.body.dataset.performanceMode = merged.performanceMode ? "true" : "false";

  const rootStyle = target.documentElement?.style;
  if (rootStyle) {
    rootStyle.setProperty("--flow-app-opacity", String(appOpacity / 100));
    rootStyle.setProperty("--flow-app-opacity-percent", `${appOpacity}%`);
    rootStyle.setProperty("--flow-companion-opacity", String(companionOpacity / 100));
    rootStyle.setProperty("--flow-companion-opacity-percent", `${companionOpacity}%`);
    rootStyle.setProperty("--flow-corner-radius", `${cornerRadius}px`);
    rootStyle.setProperty("--flow-card-radius", `${cardRadius}px`);
    rootStyle.setProperty("--flow-border-width", `${borderWidth}px`);
    rootStyle.setProperty("--flow-border-opacity", String(borderOpacity / 100));
    rootStyle.setProperty("--flow-glass-blur", `${glassBlur}px`);
    rootStyle.setProperty("--teleprompter-font-family", resolveFontStack(merged.fontFamily, target?.documentElement?.lang || defaultState.language));

    if (customAccent) {
      rootStyle.setProperty("--flow-custom-accent", customAccent);
    } else {
      rootStyle.removeProperty("--flow-custom-accent");
    }

    if (customHighlight) {
      rootStyle.setProperty("--flow-custom-highlight", customHighlight);
    } else {
      rootStyle.removeProperty("--flow-custom-highlight");
    }
  }
}
