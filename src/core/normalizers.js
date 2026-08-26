/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { clamp, parseLocaleNumber } from "./utils.js";
import {
  defaultState,
  LANGUAGE_OPTIONS,
  GROQ_PERSONALITY_OPTIONS,
  GROQ_GRAMMAR_LEVEL_OPTIONS,
  GROQ_EMOJI_USAGE_OPTIONS,
  GROQ_ACADEMIC_WORD_USAGE_OPTIONS,
  GROQ_POINT_OF_VIEW_OPTIONS,
  GROQ_OUTPUT_LANGUAGE_OPTIONS,
  THEME_OPTIONS,
  STYLE_OPTIONS,
  normalizeVoiceLanguage
} from "./config.js";

const FONT_STACKS = {
  inter: 'Inter, "Segoe UI", Arial, sans-serif',
  "space-grotesk": '"Space Grotesk", "Segoe UI", Arial, sans-serif',
  outfit: '"Outfit", "Segoe UI", Arial, sans-serif',
  "noto-sans": '"Noto Sans", "Segoe UI", Arial, sans-serif',
  "english-pro": 'Inter, "Segoe UI", "Arial Nova", Arial, sans-serif',
  "dutch-pro": '"IBM Plex Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  "arabic-pro": '"Cairo", "Noto Naskh Arabic", "Segoe UI", Tahoma, Arial, sans-serif',
  "arabic-naskh": '"Noto Naskh Arabic", "Amiri", "Segoe UI", Tahoma, serif',
  amiri: '"Amiri", "Noto Naskh Arabic", "Segoe UI", Tahoma, serif',
  "turkish-pro": '"Manrope", "Segoe UI", "Arial Nova", Arial, sans-serif',
  "german-pro": '"IBM Plex Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  "spanish-pro": '"Noto Sans", "Segoe UI", "Arial Nova", Arial, sans-serif',
  "french-pro": '"Noto Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  "portuguese-pro": 'Inter, "Noto Sans", "Segoe UI", Arial, sans-serif',
  "finnish-pro": '"IBM Plex Sans", "Segoe UI", Arial, sans-serif',
  montserrat: 'Montserrat, "Segoe UI", Arial, sans-serif',
  poppins: 'Poppins, "Segoe UI", Arial, sans-serif',
  roboto: 'Roboto, "Segoe UI", Arial, sans-serif',
  "fira-sans": '"Fira Sans", "Segoe UI", Arial, sans-serif',
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  "ibm-plex-serif": '"IBM Plex Serif", Georgia, "Times New Roman", serif',
  lora: '"Lora", Georgia, "Times New Roman", serif',
  merriweather: '"Merriweather", Georgia, "Times New Roman", serif',
  "source-serif": '"Source Serif 4", Georgia, "Times New Roman", serif',
  georgia: 'Georgia, "Times New Roman", serif',
  garamond: 'Garamond, Baskerville, "Times New Roman", serif',
  verdana: 'Verdana, Geneva, sans-serif',
  "jetbrains-mono": '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
  mono: '"Cascadia Code", "Fira Code", Consolas, monospace'
};

const LANGUAGE_SYSTEM_FONT_STACKS = {
  default: '"Segoe UI Variable Text", "Segoe UI Variable Display", "Segoe UI", "Arial Nova", Arial, sans-serif',
  de: '"IBM Plex Sans", "Segoe UI Variable Text", "Segoe UI", "Arial Nova", Arial, sans-serif',
  es: '"Noto Sans", "Segoe UI Variable Text", "Segoe UI", "Arial Nova", Arial, sans-serif',
  fr: '"Noto Sans", "Segoe UI Variable Text", "Segoe UI", "Arial Nova", Arial, sans-serif',
  tr: '"IBM Plex Sans", "Segoe UI Variable Text", "Segoe UI", "Arial Nova", Arial, sans-serif',
  ar: '"Segoe UI Variable Text", "Segoe UI", Tahoma, "Noto Sans Arabic UI", "Noto Sans Arabic", Arial, sans-serif',
  pt: '"Noto Sans", "Segoe UI Variable Text", "Segoe UI", "Arial Nova", Arial, sans-serif',
  fi: '"IBM Plex Sans", "Segoe UI Variable Text", "Segoe UI", "Arial Nova", Arial, sans-serif'
};

const MIN_SPEED = 1;
const MAX_SPEED = 500;
const ACCESS_PASSWORD_WORDS = [
  "amber", "anchor", "apricot", "arcade", "arrow", "atlas", "aurora", "autumn",
  "bamboo", "banner", "beacon", "berry", "blossom", "border", "breeze", "brook",
  "candle", "canyon", "caramel", "cedar", "cherry", "clover", "comet", "copper",
  "coral", "crystal", "daisy", "dawn", "delta", "ember", "falcon", "feather",
  "fern", "field", "firefly", "forest", "frost", "galaxy", "garden", "glimmer",
  "granite", "harbor", "hazel", "horizon", "island", "jasmine", "juniper", "lagoon",
  "lantern", "lavender", "legend", "lemon", "lilac", "lotus", "lunar", "maple",
  "meadow", "meteor", "midnight", "mist", "moon", "morning", "mountain", "nectar",
  "nova", "oasis", "ocean", "olive", "onyx", "orchid", "pearl", "pebble",
  "phoenix", "pine", "planet", "plaza", "prairie", "quartz", "rainfall", "raven",
  "reef", "river", "robin", "rose", "saffron", "sail", "scarlet", "shadow",
  "shore", "silver", "sky", "solar", "sparrow", "spring", "star", "stone",
  "summit", "sunrise", "sunset", "thunder", "tiger", "topaz", "trail", "valley",
  "velvet", "violet", "wave", "willow", "winter", "woodland", "zephyr"
];

export function createDefaults() {
  return structuredClone(defaultState);
}

export function normalizeColor(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^#([\da-f]{3}|[\da-f]{6})$/i.test(trimmed) ? trimmed : fallback;
}

export function normalizeOpacity(value, fallback) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 10, 100);
}

export function normalizeAppOpacity(value, fallback) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 15, 100);
}

export function normalizeCompanionOpacity(value, fallback = 95) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 15, 100);
}

export function normalizeTextScale(value, fallback) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 30, 180);
}

export function normalizeScrollStartDelaySeconds(value, fallback) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 0, 10);
}

export function normalizeCornerRadius(value, fallback = 24) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 0, 36);
}

export function normalizeCardRadius(value, fallback = 14) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 0, 24);
}

export function normalizeBorderWidth(value, fallback = 1) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 0, 3);
}

export function normalizeBorderOpacity(value, fallback = 10) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 0, 100);
}

export function normalizeGlassBlur(value, fallback = 28) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 0, 48);
}

export function normalizeCustomColor(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) ? trimmed : fallback;
}

export function normalizeFontFamily(value, fallback) {
  return Object.hasOwn(FONT_STACKS, value) ? value : fallback;
}

export function normalizeSpeed(value, fallback) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return clamp(Math.round(numeric), MIN_SPEED, MAX_SPEED);
}

export function normalizeTheme(value, fallback) {
  return THEME_OPTIONS.some((option) => option.value === value) ? value : fallback;
}

export function normalizeStyle(value, fallback) {
  return STYLE_OPTIONS.some((option) => option.value === value) ? value : fallback;
}

export function getThemeTeleprompterTextColor(theme) {
  return normalizeTheme(theme, defaultState.appearance.theme) === "bright" ? "#000000" : "#ffffff";
}

export function normalizeTeleprompterTextColor(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized) ? normalized : fallback;
}

export function normalizeLanguage(value, fallback) {
  return LANGUAGE_OPTIONS.some((option) => option.value === value) ? value : fallback;
}

export function normalizeGroqSelect(value, options, fallback) {
  return options.some((option) => option.value === value) ? value : fallback;
}

export function normalizeGroqText(value, fallback = "", maxLength = 2000) {
  if (typeof value !== "string") {
    return fallback;
  }
  return value.slice(0, maxLength);
}

export function normalizeGroqSettings(value = {}, fallback = defaultState.groq) {
  return {
    personality: normalizeGroqSelect(value?.personality, GROQ_PERSONALITY_OPTIONS, fallback.personality),
    grammarLevel: normalizeGroqSelect(value?.grammarLevel, GROQ_GRAMMAR_LEVEL_OPTIONS, fallback.grammarLevel),
    userContext: normalizeGroqText(value?.userContext, fallback.userContext, 1600),
    emojiUsage: normalizeGroqSelect(value?.emojiUsage, GROQ_EMOJI_USAGE_OPTIONS, fallback.emojiUsage),
    academicWordUsage: normalizeGroqSelect(value?.academicWordUsage, GROQ_ACADEMIC_WORD_USAGE_OPTIONS, fallback.academicWordUsage),
    pointOfView: normalizeGroqSelect(value?.pointOfView, GROQ_POINT_OF_VIEW_OPTIONS, fallback.pointOfView),
    outputLanguage: normalizeGroqSelect(value?.outputLanguage, GROQ_OUTPUT_LANGUAGE_OPTIONS, fallback.outputLanguage)
  };
}

export function resolveGroqOutputLanguage(outputLanguage = defaultState.groq.outputLanguage, appLanguage = defaultState.language) {
  if (outputLanguage === "app") {
    return normalizeLanguage(appLanguage, defaultState.language);
  }
  return normalizeLanguage(outputLanguage, defaultState.language);
}

export function getLanguageLabel(language) {
  return LANGUAGE_OPTIONS.find((option) => option.value === normalizeLanguage(language, defaultState.language))?.label
    || LANGUAGE_OPTIONS[0].label;
}

export function normalizeRemoteCredential(value, fallback, maxLength = 128) {
  if (typeof value !== "string") {
    return fallback;
  }
  return value.trim().slice(0, maxLength);
}

export function normalizeRemoteHost(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  return value.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "").slice(0, 255);
}

export function normalizeRemoteProvider(value, fallback) {
  return value === "cloud" ? "cloud" : fallback;
}

export function normalizeDesktopSettings(value, fallback) {
  return {
    hideFromCapture: value?.hideFromCapture ?? fallback.hideFromCapture,
    useSystemTray: value?.useSystemTray ?? fallback.useSystemTray,
    preventSleep: value?.preventSleep ?? fallback.preventSleep,
    clickthroughShortcutEnabled: value?.clickthroughShortcutEnabled ?? fallback.clickthroughShortcutEnabled
  };
}

export function normalizeWindowSettings(value, fallback) {
  const merged = {
    ...fallback,
    ...(value || {})
  };

  const width = parseLocaleNumber(merged.width);
  const height = parseLocaleNumber(merged.height);
  const x = parseLocaleNumber(merged.x);
  const y = parseLocaleNumber(merged.y);

  merged.width = Number.isFinite(width) && width >= 400 && width <= 2200
    ? Math.round(width)
    : fallback.width;
  merged.height = Number.isFinite(height) && height >= 200 && height <= 1400
    ? Math.round(height)
    : fallback.height;
  merged.x = Number.isFinite(x) ? Math.round(x) : fallback.x;
  merged.y = Number.isFinite(y) ? Math.round(y) : fallback.y;
  merged.preset = ["top-center", "center", "custom", "drag"].includes(merged.preset)
    ? merged.preset
    : fallback.preset;
  merged.isPinned = merged.isPinned !== false;

  if (
    [960, 1040, 1120, 1280, 1354].includes(parseLocaleNumber(merged.width))
    && parseLocaleNumber(merged.height) === fallback.height
    && (merged.preset === fallback.preset || !merged.preset)
  ) {
    merged.width = fallback.width;
  }

  return merged;
}

export function generateRemoteId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `flow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function generateRemoteSecret() {
  const values = globalThis.crypto?.getRandomValues ? globalThis.crypto.getRandomValues(new Uint8Array(24)) : null;
  if (values) {
    return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("");
  }
  return `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function generateRemoteAccessPassword(wordCount = 24) {
  const words = [];
  if (globalThis.crypto?.getRandomValues) {
    const values = globalThis.crypto.getRandomValues(new Uint32Array(wordCount));
    values.forEach((value) => {
      words.push(ACCESS_PASSWORD_WORDS[value % ACCESS_PASSWORD_WORDS.length]);
    });
    return words.join(" ");
  }

  for (let index = 0; index < wordCount; index += 1) {
    words.push(ACCESS_PASSWORD_WORDS[Math.floor(Math.random() * ACCESS_PASSWORD_WORDS.length)]);
  }

  return words.join(" ");
}

export function resolveLanguageSystemFontStack(language = defaultState.language) {
  const normalizedLanguage = normalizeLanguage(language, defaultState.language);
  return LANGUAGE_SYSTEM_FONT_STACKS[normalizedLanguage] || LANGUAGE_SYSTEM_FONT_STACKS.default;
}

export function resolveFontStack(fontFamily, language = defaultState.language) {
  if (fontFamily === "inter") {
    return resolveLanguageSystemFontStack(language);
  }
  if (fontFamily === "system") {
    return FONT_STACKS.system;
  }
  return FONT_STACKS[fontFamily] || resolveLanguageSystemFontStack(language);
}

export function normalizeState(rawState = {}) {
  const defaults = createDefaults();
  const normalized = {
    ...defaults,
    ...rawState,
    groqKey: rawState.groqKey ?? defaults.groqKey,
    groqPrompt: rawState.groqPrompt ?? defaults.groqPrompt,
    groq: {
      ...defaults.groq,
      ...(rawState.groq || {})
    },
    language: rawState.language ?? defaults.language,
    googleCloud: {
      textToSpeechApiKey: String(rawState.googleCloud?.textToSpeechApiKey ?? defaults.googleCloud.textToSpeechApiKey),
      translationApiKey: String(rawState.googleCloud?.translationApiKey ?? defaults.googleCloud.translationApiKey),
      translationProjectId: String(rawState.googleCloud?.translationProjectId ?? defaults.googleCloud.translationProjectId)
    },
    desktop: {
      ...defaults.desktop,
      ...(rawState.desktop || {})
    },
    remote: {
      ...defaults.remote,
      ...(rawState.remote || {})
    },
    voiceTracking: {
      ...defaults.voiceTracking,
      ...(rawState.voiceTracking || {})
    },
    window: normalizeWindowSettings(rawState.window, defaults.window),
    appearance: {
      ...defaults.appearance,
      ...(rawState.appearance || {})
    }
  };

  normalized.appearance.fontFamily = normalizeFontFamily(normalized.appearance.fontFamily, defaults.appearance.fontFamily);
  normalized.speed = normalizeSpeed(normalized.speed, defaults.speed);
  normalized.language = normalizeLanguage(normalized.language, defaults.language);
  normalized.desktop = normalizeDesktopSettings(normalized.desktop, defaults.desktop);
  normalized.window = normalizeWindowSettings(normalized.window, defaults.window);
  normalized.remote.provider = normalizeRemoteProvider(normalized.remote.provider, defaults.remote.provider);
  normalized.remote.receiverId = normalizeRemoteCredential(normalized.remote.receiverId, "", 128) || generateRemoteId();
  normalized.remote.receiverSecret = normalizeRemoteCredential(normalized.remote.receiverSecret, "", 256) || generateRemoteSecret();
  normalized.remote.accessPassword = normalizeRemoteCredential(normalized.remote.accessPassword, "", 1024) || generateRemoteAccessPassword();
  normalized.remote.publicHost = normalizeRemoteHost(normalized.remote.publicHost, defaults.remote.publicHost);
  normalized.appearance.theme = normalizeTheme(normalized.appearance.theme, defaults.appearance.theme);
  normalized.appearance.style = normalizeStyle(normalized.appearance.style, defaults.appearance.style);
  normalized.appearance.mirrorMode = Boolean(normalized.appearance.mirrorMode);
  normalized.appearance.mirrorVertical = Boolean(normalized.appearance.mirrorVertical);
  normalized.appearance.speedRailEnabled = normalized.appearance.speedRailEnabled !== false;
  normalized.appearance.autoHideToolbar = Boolean(normalized.appearance.autoHideToolbar);
  normalized.appearance.performanceMode = Boolean(normalized.appearance.performanceMode);
  normalized.appearance.appWideVoiceCommands = Boolean(normalized.appearance.appWideVoiceCommands);
  normalized.appearance.appOpacity = normalizeAppOpacity(normalized.appearance.appOpacity, defaults.appearance.appOpacity);
  normalized.appearance.companionOpacity = normalizeCompanionOpacity(normalized.appearance.companionOpacity, defaults.appearance.companionOpacity);
  normalized.appearance.textScale = normalizeTextScale(normalized.appearance.textScale, defaults.appearance.textScale);
  normalized.appearance.scrollStartDelaySeconds = normalizeScrollStartDelaySeconds(
    normalized.appearance.scrollStartDelaySeconds,
    defaults.appearance.scrollStartDelaySeconds
  );
  normalized.appearance.textColor = normalizeTeleprompterTextColor(
    normalized.appearance.textColor,
    getThemeTeleprompterTextColor(normalized.appearance.theme)
  );
  normalized.appearance.textOpacity = normalizeOpacity(normalized.appearance.textOpacity, defaults.appearance.textOpacity);
  normalized.appearance.voiceLanguage = normalizeVoiceLanguage(
    normalized.appearance.voiceLanguage,
    defaults.appearance.voiceLanguage
  );
  normalized.appearance.voiceScrollStyle = ["highlight", "line", "plain"].includes(normalized.appearance.voiceScrollStyle)
    ? normalized.appearance.voiceScrollStyle
    : defaults.appearance.voiceScrollStyle;
  normalized.appearance.mode = ["highlight", "scroll", "line", "arrow", "voice"].includes(normalized.appearance.mode)
    ? normalized.appearance.mode
    : defaults.appearance.mode;
  normalized.appearance.cornerRadius = normalizeCornerRadius(
    normalized.appearance.cornerRadius,
    defaults.appearance.cornerRadius
  );
  normalized.appearance.cardRadius = normalizeCardRadius(
    normalized.appearance.cardRadius,
    defaults.appearance.cardRadius
  );
  normalized.appearance.borderWidth = normalizeBorderWidth(
    normalized.appearance.borderWidth,
    defaults.appearance.borderWidth
  );
  normalized.appearance.borderOpacity = normalizeBorderOpacity(
    normalized.appearance.borderOpacity,
    defaults.appearance.borderOpacity
  );
  normalized.appearance.glassBlur = normalizeGlassBlur(
    normalized.appearance.glassBlur,
    defaults.appearance.glassBlur
  );
  normalized.appearance.customAccentColor = normalizeCustomColor(
    normalized.appearance.customAccentColor,
    defaults.appearance.customAccentColor
  );
  normalized.appearance.customHighlightColor = normalizeCustomColor(
    normalized.appearance.customHighlightColor,
    defaults.appearance.customHighlightColor
  );
  normalized.groq = normalizeGroqSettings(normalized.groq, defaults.groq);
  normalized.modules = {
    scriptManager: Boolean(rawState.modules?.scriptManager ?? defaults.modules?.scriptManager),
    scriptCompletion: Boolean(rawState.modules?.scriptCompletion ?? defaults.modules?.scriptCompletion)
  };

  return normalized;
}

export function mergeState(currentState, nextState = {}) {
  return normalizeState({
    ...currentState,
    ...nextState,
    desktop: nextState.desktop
      ? {
          ...currentState.desktop,
          ...nextState.desktop
        }
      : currentState.desktop,
    remote: nextState.remote
      ? {
          ...currentState.remote,
          ...nextState.remote
        }
      : currentState.remote,
    voiceTracking: nextState.voiceTracking
      ? {
          ...currentState.voiceTracking,
          ...nextState.voiceTracking
        }
      : currentState.voiceTracking,
    window: nextState.window
      ? {
          ...currentState.window,
          ...nextState.window
        }
      : currentState.window,
    appearance: nextState.appearance
      ? {
          ...currentState.appearance,
          ...nextState.appearance
        }
      : currentState.appearance,
    groq: nextState.groq
      ? {
          ...currentState.groq,
          ...nextState.groq
        }
      : currentState.groq,
    modules: nextState.modules
      ? {
          ...currentState.modules,
          ...nextState.modules
        }
      : currentState.modules
  });
}
