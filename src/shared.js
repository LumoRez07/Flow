/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// Core math and time utilities
export {
  clamp,
  parseLocaleNumber,
  clampNumber,
  wait,
  estimateMinutes
} from "./core/utils.js";

// Core configuration and constants
export {
  defaultState,
  LANGUAGE_OPTIONS,
  GROQ_PERSONALITY_OPTIONS,
  GROQ_GRAMMAR_LEVEL_OPTIONS,
  GROQ_EMOJI_USAGE_OPTIONS,
  GROQ_ACADEMIC_WORD_USAGE_OPTIONS,
  GROQ_POINT_OF_VIEW_OPTIONS,
  GROQ_OUTPUT_LANGUAGE_OPTIONS,
  VOICE_LANGUAGE_OPTIONS,
  FONT_OPTIONS,
  THEME_OPTIONS,
  STYLE_OPTIONS,
  normalizeVoiceLanguage
} from "./core/config.js";

// Core sanitizers and normalizers
export {
  createDefaults,
  normalizeState,
  mergeState,
  normalizeColor,
  normalizeOpacity,
  normalizeAppOpacity,
  normalizeTextScale,
  normalizeScrollStartDelaySeconds,
  normalizeFontFamily,
  normalizeSpeed,
  normalizeTheme,
  normalizeStyle,
  getThemeTeleprompterTextColor,
  normalizeTeleprompterTextColor,
  normalizeLanguage,
  normalizeGroqSelect,
  normalizeGroqText,
  normalizeGroqSettings,
  resolveGroqOutputLanguage,
  getLanguageLabel,
  normalizeRemoteCredential,
  normalizeRemoteHost,
  normalizeRemoteProvider,
  normalizeDesktopSettings,
  normalizeWindowSettings,
  generateRemoteId,
  generateRemoteSecret,
  generateRemoteAccessPassword,
  resolveLanguageSystemFontStack,
  resolveFontStack,
  normalizeCornerRadius,
  normalizeCardRadius,
  normalizeBorderWidth,
  normalizeBorderOpacity,
  normalizeGlassBlur,
  normalizeCustomColor
} from "./core/normalizers.js";

// Core persistence and state management
export {
  initializePersistentStorage,
  loadState,
  saveState,
  loadVoiceModelRegistry,
  saveVoiceModelRegistry,
  getVoiceModelRegistryEntry,
  getSelectedVoiceModelId,
  updateVoiceModelRegistry
} from "./core/state.js";

// Internationalization and translations
export {
  getLanguageDirection,
  translate,
  parseWaitCardText,
  applyTranslationsToDocument
} from "./core/i18n.js";

// Document and file importers
export {
  PDF_TEXT_TYPES,
  DOCX_TEXT_TYPES,
  DIRECT_TEXT_EXTENSIONS,
  getFileExtension,
  getFileNameFromPath,
  mimeTypeFromFileName,
  classifyImportFile,
  loadPdfModule,
  loadMammothModule,
  detectTextEncoding,
  decodeTextBytes,
  extractPdfText,
  extractDocxText,
  extractImportedText,
  readImportedText
} from "./core/file-parser.js";

// Teleprompter script markup and tokenizer
export {
  stripFormattingMarkers,
  parseCardDescriptor,
  detectTextDirection,
  applyTextDirection,
  parseFormattedScript,
  splitWords,
  extractScriptSections
} from "./core/script-parser.js";

// UI themes and appearance
export {
  applyThemeToDocument,
  applyAppearanceToDocument
} from "./ui/theme.js";

// UI window lifecycle and animations
export {
  DESKTOP_WINDOW_FADE_MS,
  scheduleAnimationFrame,
  waitForMs,
  revealDesktopWindow,
  initializeDesktopWindowOpacityFade,
  fadeOutDesktopWindow,
  invokeAfterDesktopFadeOut
} from "./ui/window.js";

// Custom smooth scrollbar
export {
  initializeSmoothScrollbox
} from "./ui/scrollbox.js";

// Disable default browser context menu (inspect element, reload)
if (typeof window !== "undefined") {
  window.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
}
