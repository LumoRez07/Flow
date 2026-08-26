/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

function deepFreeze(obj) {
  if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    Object.values(obj).forEach(deepFreeze);
  }
  return obj;
}

export const defaultState = deepFreeze({
  script: "Welcome to Flow. Add your own script from the text page and this teleprompter will highlight the next word while softly dimming the rest.",
  speed: 120,
  groqKey: "",
  groqPrompt: "",
  googleCloud: {
    textToSpeechApiKey: "",
    translationApiKey: "",
    translationProjectId: ""
  },
  groq: {
    personality: "natural",
    grammarLevel: "standard",
    userContext: "",
    emojiUsage: "off",
    academicWordUsage: "off",
    pointOfView: "first-person",
    outputLanguage: "app"
  },
  language: "en",
  desktop: {
    hideFromCapture: false,
    useSystemTray: true,
    preventSleep: false,
    clickthroughShortcutEnabled: false
  },
  remote: {
    provider: "cloud",
    receiverId: "",
    receiverSecret: "",
    accessPassword: "",
    publicHost: "",
  },
  window: {
    x: null,
    y: null,
    width: 550,
    height: 260,
    preset: "top-center",
    isPinned: true
  },
  appearance: {
    mode: "highlight",
    fontFamily: "inter",
    theme: "main",
    style: "main",
    mirrorMode: false,
    mirrorVertical: false,
    speedRailEnabled: true,
    autoHideToolbar: false,
    performanceMode: false,
    appOpacity: 100,
    companionOpacity: 95,
    textScale: 100,
    textColor: "#ffffff",
    textOpacity: 88,
    scrollStartDelaySeconds: 3,
    voiceLanguage: "en-US",
    voiceScrollStyle: "highlight",
    appWideVoiceCommands: false,
    soundInputDeviceId: "default",
    soundInputDeviceLabel: "",
    soundInputNoiseGate: 0.01,
    soundInputGain: 2,
    cornerRadius: 24,
    cardRadius: 14,
    borderWidth: 1,
    borderOpacity: 10,
    glassBlur: 28,
    customAccentColor: "",
    customHighlightColor: ""
  },
  voiceTracking: {
    confidenceThreshold: 0.35
  },
  modules: {
    scriptManager: false,
    scriptCompletion: false
  }
});

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "ar", label: "العربية" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "fi", label: "Suomi" }
];

export const GROQ_PERSONALITY_OPTIONS = [
  { value: "natural", label: "Natural" },
  { value: "confident", label: "Confident" },
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "persuasive", label: "Persuasive" }
];

export const GROQ_GRAMMAR_LEVEL_OPTIONS = [
  { value: "relaxed", label: "Relaxed" },
  { value: "standard", label: "Standard" },
  { value: "polished", label: "Polished" }
];

export const GROQ_EMOJI_USAGE_OPTIONS = [
  { value: "off", label: "Off" },
  { value: "on", label: "On" }
];

export const GROQ_ACADEMIC_WORD_USAGE_OPTIONS = [
  { value: "off", label: "Off" },
  { value: "on", label: "On" },
  { value: "aggressive", label: "Aggressive" }
];

export const GROQ_POINT_OF_VIEW_OPTIONS = [
  { value: "first-person", label: "First person" },
  { value: "third-person", label: "Third person" }
];

export const GROQ_OUTPUT_LANGUAGE_OPTIONS = [
  { value: "app", label: "App language" },
  ...LANGUAGE_OPTIONS
];

export const VOICE_LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English" },
  { value: "tr-TR", label: "Turkish" },
  { value: "ar-SA", label: "Arabic" },
  { value: "de-DE", label: "German" },
  { value: "fr-FR", label: "French" },
  { value: "es-ES", label: "Spanish" },
  { value: "pt-BR", label: "Portuguese" },
  { value: "fi-FI", label: "Finnish" }
];

export const FONT_OPTIONS = [
  { value: "inter", label: "Inter" },
  { value: "space-grotesk", label: "Space Grotesk" },
  { value: "outfit", label: "Outfit" },
  { value: "noto-sans", label: "Noto Sans" },
  { value: "english-pro", label: "English Pro" },
  { value: "dutch-pro", label: "Dutch Pro" },
  { value: "arabic-pro", label: "Arabic Pro" },
  { value: "arabic-naskh", label: "Arabic Naskh" },
  { value: "amiri", label: "Amiri" },
  { value: "turkish-pro", label: "Turkish Pro" },
  { value: "german-pro", label: "German Pro" },
  { value: "spanish-pro", label: "Spanish Pro" },
  { value: "french-pro", label: "French Pro" },
  { value: "portuguese-pro", label: "Portuguese Pro" },
  { value: "finnish-pro", label: "Finnish Pro" },
  { value: "montserrat", label: "Montserrat" },
  { value: "poppins", label: "Poppins" },
  { value: "roboto", label: "Roboto" },
  { value: "fira-sans", label: "Fira Sans" },
  { value: "system", label: "System UI" },
  { value: "ibm-plex-serif", label: "IBM Plex Serif" },
  { value: "lora", label: "Lora" },
  { value: "merriweather", label: "Merriweather" },
  { value: "source-serif", label: "Source Serif 4" },
  { value: "georgia", label: "Georgia" },
  { value: "garamond", label: "Garamond" },
  { value: "verdana", label: "Verdana" },
  { value: "jetbrains-mono", label: "JetBrains Mono" },
  { value: "mono", label: "Mono" }
];

export const THEME_OPTIONS = [
  { value: "main", label: "Main" },
  { value: "dark", label: "Dark" },
  { value: "bright", label: "Bright" },
  { value: "meadow", label: "Yellow-green" }
];

export const STYLE_OPTIONS = [
  { value: "main", label: "Main" },
  { value: "glass", label: "Frosted Glass" },
  { value: "minimal", label: "Minimalist" }
];

export function normalizeVoiceLanguage(value, fallback = defaultState.appearance.voiceLanguage) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return fallback;
  }

  if (/^en\b/i.test(normalized)) {
    return "en-US";
  }

  const match = VOICE_LANGUAGE_OPTIONS.find((option) => option.value.toLowerCase() === normalized.toLowerCase());
  return match?.value || fallback;
}
