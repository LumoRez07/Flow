/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export const defaultState = {
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
    hideFromCapture: true,
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
    soundInputGain: 2
  },
  voiceTracking: {
    confidenceThreshold: 0.35
  }
};

const STORAGE_KEY = "flow.teleprompter.state.v2";
const VOICE_MODEL_REGISTRY_KEY = "flow.voice.models.v1";
const STORAGE_WRITE_DEBOUNCE_MS = 140;

const tauriInvoke = window.__TAURI__?.core?.invoke;

let stateCache = null;
let voiceModelRegistryCache = null;
let storageInitPromise = null;
let persistedStateWriteTimer = 0;
let persistedVoiceModelRegistryWriteTimer = 0;

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "ar", label: "العربية" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" }
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
  { value: "es-ES", label: "Spanish" }
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

const UI_STRINGS = {
  en: {
    "doc.teleprompterTitle": "Flow Teleprompter",
    "doc.settingsTitle": "Flow · Settings",
    "doc.textTitle": "Flow · Text",
    "doc.aboutTitle": "Flow · About",
    "common.settings": "Settings",
    "common.text": "Text",
    "common.close": "Close",
    "common.on": "On",
    "common.off": "Off",
    "common.ai": "AI",
    "common.wpm": "wpm",
    "common.slower": "Slower",
    "common.faster": "Faster",
    "common.speedAria": "Speed in words per minute",
    "common.generatePrompt": "Generate prompt",
    "common.play": "Play",
    "common.continue": "Continue",
    "common.pause": "Pause",
    "common.replayStart": "Replay from start",
    "common.stopKeep": "Stop and keep position",
    "common.openTextPage": "Open text page",
    "common.openSettings": "Open settings",
    "common.pinWindow": "Pin window",
    "common.unpinWindow": "Unpin window",
    "common.closeApp": "Close app",
    "common.collapse": "Collapse teleprompter",
    "common.expand": "Expand teleprompter",
    "common.language": "Language",
    "language.en": "English",
    "language.tr": "Turkish",
    "language.ar": "Arabic",
    "language.de": "German",
    "language.es": "Spanish",
    "tele.status.ready": "Ready",
    "tele.status.stopped": "Stopped",
    "tele.status.paused": "Paused",
    "tele.status.arrowPaused": "Arrow mode paused",
    "tele.status.performance": "Performance scroll",
    "tele.status.scrolling": "Scrolling",
    "tele.status.line": "Line by line",
    "tele.status.arrow": "Arrow mode",
    "tele.status.highlight": "Highlighting",
    "tele.progress": "Word {current} / {total}",
    "tele.floatingStats": "{words} left · {minutes} min left",
    "tele.empty": "Open the text editor and add your script.",
    "tele.status.micBlocked": "Mic blocked by Windows privacy",
    "tele.status.noMic": "No microphone detected",
    "tele.status.micUnavailable": "Microphone unavailable",
    "tele.voiceFeedback.micBlocked": "Microphone access is blocked in Windows Privacy settings.\nTurn microphone access back on for Flow, then try Voice Tracking again.\n\nYour script is still saved.",
    "tele.voiceFeedback.noMic": "No microphone was detected.\nConnect or enable a microphone, then try Voice Tracking again.\n\nYour script is still saved.",
    "tele.voiceFeedback.micUnavailable": "Flow could not start Voice Tracking because the microphone is unavailable or not working.\nCheck the selected input device, then try again.\n\nYour script is still saved.",
    "tele.addGroqKey": "Add Groq API key on the text page first",
    "tele.promptExisting": "Describe how Groq should rewrite the current teleprompter text:",
    "tele.promptExistingDefault": "Rewrite this in Arabic with a different personality and aesthetic in 200 words.",
    "tele.promptNew": "Describe the teleprompter script you want Groq to generate:",
    "tele.promptNewDefault": "A concise product launch pitch with confident, natural pacing.",
    "tele.cancelled": "Generation cancelled",
    "tele.generating": "Generating with Groq...",
    "tele.generated": "Groq generated a new script",
    "tele.pinned": "Window pinned",
    "tele.unpinned": "Window free dragging",
    "tele.groqFailed": "Groq failed: {error}",
    "tele.clickthroughEnabled": "Clickthrough mode enabled",
    "tele.clickthroughDisabled": "Clickthrough mode disabled",
    "tele.opened": "Opened {kind}",
    "tele.failedOpenInput": "Failed to open input: {error}",
    "tele.failedOpenSettings": "Failed to open settings: {error}",
    "tele.failedCloseApp": "Failed to close app: {error}",
    "tele.updaterChecking": "Checking for Flow updates...",
    "tele.updaterInstalling": "Installing Flow {version}...",
    "tele.updaterDownloading": "Downloading Flow {version}: {progress}%",
    "tele.updaterFailed": "Updater failed: {error}",
    "tele.updaterCurrent": "Flow is already up to date.",
    "settings.kicker": "Settings",
    "settings.title": "Live controls",
    "settings.section": "Section",
    "settings.sectionTitle": "Browse settings",
    "settings.section.remote": "Remote",
    "settings.section.appearance": "Appearance",
    "settings.section.scrolling": "Scrolling",
    "settings.section.positioning": "Positioning",
    "settings.section.windowSettings": "Window settings",
    "settings.section.soundInput": "Sound input settings",
    "settings.section.updates": "Updates",
    "settings.section.privacy": "Privacy & system",
    "settings.section.usability": "Usability",
    "settings.positioning": "Positioning",
    "settings.windowSettings": "Window settings",
    "settings.windowSettingsTitle": "Positioning and size",
    "settings.windowPlacement": "Window placement",
    "settings.windowLocation": "Window location",
    "settings.privacy": "Privacy & system",
    "settings.desktopBehavior": "Desktop behavior",
    "settings.hideFromCapture": "Invisible in screen capture",
    "settings.hideFromCaptureHelp": "Keeps Flow out of screenshots and screen recordings on supported Windows systems.",
    "settings.systemTray": "Use system tray icon",
    "settings.systemTrayHelp": "When enabled, Flow hides from the taskbar and stays available from the system tray. When disabled, Flow appears on the taskbar.",
    "settings.preventSleep": "Prevent sleep mode",
    "settings.preventSleepHelp": "Keeps the display and system awake while Flow is running.",
    "settings.usability": "Usability",
    "settings.shortcuts": "Keyboard shortcuts",
    "settings.clickthroughShortcut": "Clickthrough mode shortcut",
    "settings.clickthroughShortcutHelp": "Lets you toggle clickthrough mode with Ctrl + Shift + X.",
    "settings.shortcutPlayStop": "Play / stop",
    "settings.shortcutReset": "Reset to start",
    "settings.shortcutBackward": "Scroll backward",
    "settings.shortcutSpeed": "Speed down / up while playing",
    "settings.shortcutPause": "Pause / continue",
    "settings.shortcutPlayStopValue": "P",
    "settings.shortcutResetValue": "R",
    "settings.shortcutBackwardValue": "Page Up",
    "settings.shortcutSpeedValue": "← / →",
    "settings.shortcutPauseValue": "Space",
    "settings.x": "X",
    "settings.y": "Y",
    "settings.topCenter": "Top center",
    "settings.center": "Center",
    "settings.custom": "Custom x / y",
    "settings.drag": "Free drag",
    "settings.appearance": "Appearance",
    "settings.appearanceTitle": "Typography and visuals",
    "settings.sizeAndPlayback": "Size and playback style",
    "settings.scrolling": "Scrolling",
    "settings.scrollingTitle": "Playback and tracking",
    "settings.group.windowSize": "Window size",
    "settings.group.playback": "Playback",
    "settings.group.typography": "Typography",
    "settings.group.visuals": "Visuals",
    "settings.width": "Width",
    "settings.height": "Height",
    "settings.animationStyle": "Scroll Mode",
    "settings.mode.highlight": "Highlight mode",
    "settings.mode.scroll": "Normal scroll mode",
    "settings.mode.line": "Line by line highlight",
    "settings.mode.arrow": "Arrow mode",
    "settings.mode.voice": "Voice tracking",
    "settings.voiceTrackingStyle": "Voice tracking style",
    "settings.voiceTrackingStyleHelp": "Choose how the matched position is shown while speaking.",
    "settings.voiceConfidence": "Confidence level",
    "settings.voiceConfidenceHelp": "Higher values make Flow stricter about low-confidence speech matches.",
    "settings.voiceConfidenceSkips": "If Flow skips ahead or jumps over words, increase this value.",
    "settings.voiceConfidenceStalls": "If Flow does not move even when you read clearly, decrease this value.",
    "settings.voiceStyle.highlight": "Word highlight",
    "settings.voiceStyle.line": "Line highlight",
    "settings.voiceStyle.plain": "Plain text",
    "settings.appWideVoiceCommands": "App-wide Flow voice commands",
    "settings.appWideVoiceCommandsHelp": "Lets English voice commands like 'Hey Flow pause' or 'Hey Flow down' work outside voice tracking too. Currently unstable and may not work reliably.",
    "settings.font": "Font",
    "settings.textSize": "Text size",
    "settings.style": "Style",
    "settings.style.main": "Main",
    "settings.style.glass": "Frosted glass",
    "settings.style.minimal": "Minimalist",
    "settings.theme": "Theme",
    "settings.theme.main": "Main",
    "settings.theme.dark": "Dark",
    "settings.theme.bright": "Bright",
    "settings.theme.meadow": "Yellow-green",
    "settings.voiceLanguage": "Voice Language",
    "settings.voiceModeHelp": "Uses the selected language for voice tracking and app-wide Flow commands.",
    "settings.voiceModelChecking": "Checking model…",
    "settings.voiceModelSelector": "Voice model",
    "settings.voiceModelCheckingHelp": "Flow checks whether the selected Vosk model is already stored locally.",
    "settings.voiceModelNoOptions": "No public models found for this language.",
    "settings.voiceModelPathPending": "Checking local model path…",
    "settings.voiceModelProgressIdle": "Waiting to download",
    "settings.voiceModelProgressStats": "{remaining} left · {speed}",
    "settings.voiceModelInstalled": "Installed ✓",
    "settings.voiceModelInstalledHelp": "This Vosk model is ready. Flow will use it for voice tracking and app-wide commands.",
    "settings.voiceModelMissing": "Model required",
    "settings.voiceModelMissingHelp": "This language is not installed yet. Download the Vosk model before using it for commands or voice tracking.",
    "settings.voiceModelDownloading": "Downloading…",
    "settings.voiceModelDownloadingHelp": "Downloading the selected Vosk model now. Keep this window open until it finishes.",
    "settings.voiceModelPathValue": "Saved model: {path}",
    "settings.voiceModelPathMissing": "No local Vosk model has been saved for this language yet.",
    "settings.voiceModelDownloadAction": "Download Vosk model",
    "settings.voiceModelDownloadingAction": "Downloading model…",
    "settings.voiceModelInstalledAction": "Model downloaded",
    "settings.voiceModelDownloadComplete": "{language} Vosk model is ready.",
    "settings.voiceModelDownloadFailed": "Could not download the selected Vosk model.",
    "settings.soundInput": "Sound input",
    "settings.soundInputTitle": "Sound input settings",
    "settings.soundInputMonitoring": "Monitoring",
    "settings.soundInputDevice": "Input device",
    "settings.soundInputDeviceHelp": "Choose the microphone used for voice tracking and app-wide Flow commands.",
    "settings.soundInputDeviceDefault": "System default",
    "settings.soundInputDeviceUnavailable": "Previously selected microphone unavailable",
    "settings.soundInputDeviceUnnamed": "Microphone",
    "settings.soundInputLevel": "Level",
    "settings.soundInputCleanup": "Cleanup",
    "settings.soundInputRecommended": "Use recommended",
    "settings.soundInputRecommendedApplied": "Recommended sound input values applied.",
    "settings.soundInputNoiseGate": "Noise gate",
    "settings.soundInputNoiseGateHelp": "Cuts low-level room noise before Flow sends audio to voice tracking.",
    "settings.soundInputGain": "Input gain",
    "settings.soundInputGainHelp": "Boosts the selected microphone before the Vosk recognizer processes it.",
    "settings.soundInputPreviewIdle": "Open this section to preview your microphone level.",
    "settings.soundInputPreviewReady": "Monitoring the selected microphone.",
    "settings.soundInputPreviewUnavailable": "Microphone preview is not available here.",
    "settings.soundInputPermissionDenied": "Microphone preview blocked. Allow microphone access to see the live level.",
    "settings.soundInputNoDevices": "No microphone devices were found.",
    "settings.updates": "Updates",
    "settings.updaterTitle": "App updates",
    "settings.updaterChannelTitle": "Installed build",
    "settings.updaterCurrentVersion": "Current version",
    "settings.updaterAvailableVersion": "Available version",
    "settings.updaterPublishedAt": "Published",
    "settings.updaterNotChecked": "Not checked yet",
    "settings.updaterNoDate": "Not published yet",
    "settings.updaterStatusIdle": "Ready",
    "settings.updaterStatusChecking": "Checking",
    "settings.updaterStatusAvailable": "Update ready",
    "settings.updaterStatusCurrent": "Current",
    "settings.updaterStatusInstalling": "Installing",
    "settings.updaterStatusError": "Feed error",
    "settings.updaterStatusUnavailable": "Unavailable",
    "settings.updaterIdle": "Flow checks the signed release feed and installs updates when you trigger it.",
    "settings.updaterChecking": "Checking the configured release feed for updates.",
    "settings.updaterCurrent": "Flow {version} is already the newest version published in the update feed.",
    "settings.updaterAvailable": "Flow {version} is available and ready to install.",
    "settings.updaterInstalling": "Downloading and installing Flow {version}. The app may close when setup starts.",
    "settings.updaterInstallingWindow": "Downloading Flow {version}. The app may close when setup starts.",
    "settings.updaterFailed": "Flow could not read the configured update feed: {error}",
    "settings.updaterFeedUnavailable": "The configured update feed is unavailable right now. Publish latest.json and the signed installer before testing again.",
    "settings.updaterUnavailable": "The updater API is unavailable in this window.",
    "settings.updaterNoNotes": "Release notes appear here when an update is found.",
    "settings.updaterCheckAction": "Check and update",
    "settings.updaterCheckingAction": "Checking…",
    "settings.updaterInstallAction": "Install update",
    "settings.updaterInstallingAction": "Installing…",
    "settings.updaterProgressIdle": "Waiting to start",
    "settings.updaterProgressStats": "{downloaded} of {total}",
    "settings.updaterInstallFailed": "Update install failed: {error}",
    "settings.speedSlider": "Left speed slider",
    "settings.speedSliderHelp": "Shows the vertical WPM slider on the left side while playing.",
    "settings.scrollStartDelay": "Text start delay",
    "settings.scrollStartDelayHelp": "After the 3, 2, 1 countdown, keeps the text still for this many seconds before scroll mode starts moving.",
    "settings.performance": "Performance mode",
    "settings.performanceHelp": "Disables UI animations and forces normal scrolling for smoother performance.",
    "settings.autoHideToolbar": "Auto-hide top bar",
    "settings.autoHideToolbarHelp": "Shows a small top handle and reveals the toolbar only while the teleprompter is hovered.",
    "settings.mirrorMode": "Mirror text horizontally",
    "settings.mirrorModeHelp": "Flips the teleprompter side-to-side so the reflection reads correctly through a physical mirror.",
    "settings.mirrorVertical": "Flip text upside down",
    "settings.mirrorVerticalHelp": "Flips the teleprompter top-to-bottom so mirrored rigs can be mounted from either side.",
    "settings.textColor": "Text color",
    "settings.textTransparency": "Text transparency",
    "settings.appTransparency": "App transparency",
    "settings.synced": "Settings synced to the current main window.",
    "settings.applied": "Changes applied automatically.",
    "settings.autoApply": "Changes apply automatically as you move sliders or pick a setting.",
    "input.kicker": "New text",
    "input.title": "Script editor",
    "input.section": "Section",
    "input.sectionTitle": "Choose editor panel",
    "input.section.editor": "Editor",
    "input.section.assistant": "Groq assistant",
    "input.teleprompterText": "Teleprompter text",
    "input.toolbar": "Formatting toolbar",
    "input.scriptPlaceholder": "Paste or write your script here...",
    "input.importButton": "Import file",
    "input.importHelp": "Drop a TXT, DOCX, or PDF file into the editor, or choose one from your device.",
    "input.importing": "Importing {name}...",
    "input.imported": "Loaded text from {name}.",
    "input.importUnsupported": "That file type is not supported. Use TXT, DOCX, PDF, or another readable text file.",
    "input.importFailed": "Could not read that file.",
    "input.meta": "{count} words · {minutes} min read",
    "input.editorHelp": "Formatting works like Reddit-style markdown for <strong>**bold**</strong>, <em>*italic*</em>, bullet lists with <strong>- item</strong>, numbered lists with <strong>1. item</strong>, blockquotes with <strong>&gt; quote</strong>, plus tags for <span class=\"toolbar-underline\">[u]underline[/u]</span>, <span class=\"tone-white\">[white]white[/white]</span>, <span class=\"tone-softwhite\">[softwhite]soft white[/softwhite]</span>, <mark class=\"mark-yellow\">[yellow]highlight[/yellow]</mark>, <mark class=\"mark-blue\">[blue]highlight[/blue]</mark>, and <mark class=\"mark-red\">[red]highlight[/red]</mark>.",
    "input.cardBuilder": "Cue cards",
    "input.cardBuilderHelp": "Insert presenter cues as styled cards inside the script. Centered cards break onto their own line, while between-words cards stay compact inline.",
    "input.cardPanelCollapse": "Collapse cue cards",
    "input.cardPanelExpand": "Expand cue cards",
    "input.cardTemplate": "Template",
    "input.cardTemplateBuiltin": "Built-in templates",
    "input.cardTemplateCustom": "Custom templates",
    "input.cardType": "Card type",
    "input.cardType.centered": "Centered",
    "input.cardType.between": "Between words",
    "input.cardText": "Card text",
    "input.cardWaitSeconds": "Wait seconds",
    "input.cardTextPlaceholder": "Example: WAIT 3 SECONDS",
    "input.cardCustomName": "Template name",
    "input.cardCustomNamePlaceholder": "Example: Interview pause",
    "input.cardAdd": "Add",
    "input.cardSaveTemplate": "Save template",
    "input.cardPreview": "Preview",
    "input.cardLibrary": "Saved templates",
    "input.cardUseAction": "Use",
    "input.cardDeleteAction": "Delete",
    "input.cardLibraryEmpty": "Saved custom templates will appear here.",
    "input.cardTemplateSaved": "Custom cue card saved locally.",
    "input.cardTemplateDeleted": "Custom cue card removed.",
    "input.cardTemplateDuplicate": "A saved template with that name already exists.",
    "input.cardTemplateNeedName": "Add a template name before saving.",
    "input.cardTemplateNeedText": "Add card text before inserting or saving.",
    "input.groq": "Groq",
    "input.draftHelper": "Draft helper",
    "input.apiKey": "API key",
    "input.apiKeyPlaceholder": "Paste your Groq API key",
    "input.instruction": "Instruction",
    "input.instructionPlaceholder": "Example: Rewrite this to sound more natural and easier to read on camera.",
    "input.saveText": "Save text",
    "input.useGroq": "Use Groq",
    "input.groqOptional": "Groq is optional. Your key stays in local storage on this device.",
    "input.needKey": "Add your Groq API key first.",
    "input.needInstructionOrScript": "Add an instruction or some script text first.",
    "input.thinking": "Thinking...",
    "input.groqUpdated": "Groq updated your script.",
    "input.groqFailed": "Groq request failed.",
    "input.saved": "Saved locally.",
    "about.kicker": "About",
    "about.title": "About this project",
    "about.summary": "A modern desktop teleprompter for smooth reading, quick editing, voice controls, and remote message injection.",
    "about.p1": "Flow is a teleprompter app built with web technologies and Tauri. It's designed to be simple, lightweight, and customizable.",
    "about.p2": "This project is open source and available on my <a href=\"https://github.com/LumoRez07\">GitHub account</a>. If you have any questions, suggestions, or want to contribute, feel free to reach out or open an issue.",
    "about.p3": "This project was made by <a href=\"https://flowremote.app/\">LumoRez</a> with ❤️ in 2026.",
    "about.p4": "Flow includes script editing, multiple playback modes, voice tracking, AI-assisted drafting, remote notifications, tray controls, and Windows-first privacy options like capture protection."
  },
  tr: {
    "doc.teleprompterTitle": "Flow Teleprompter",
    "doc.settingsTitle": "Flow · Ayarlar",
    "doc.textTitle": "Flow · Metin",
    "doc.aboutTitle": "Flow · Hakkında",
    "common.settings": "Ayarlar",
    "common.text": "Metin",
    "common.close": "Kapat",
    "common.ai": "AI",
    "common.wpm": "k/dk",
    "common.slower": "Daha yavaş",
    "common.faster": "Daha hızlı",
    "common.speedAria": "Dakikadaki kelime hızı",
    "common.generatePrompt": "İstem oluştur",
    "common.play": "Başlat",
    "common.continue": "Devam et",
    "common.pause": "Duraklat",
    "common.replayStart": "Baştan oynat",
    "common.stopKeep": "Durdur ve konumu koru",
    "common.openTextPage": "Metin sayfasını aç",
    "common.openSettings": "Ayarları aç",
    "common.pinWindow": "Pencereyi sabitle",
    "common.unpinWindow": "Pencere sabitlemesini kaldır",
    "common.closeApp": "Uygulamayı kapat",
    "common.collapse": "Teleprompter'ı daralt",
    "common.expand": "Teleprompter'ı genişlet",
    "common.language": "Dil",
    "language.en": "İngilizce",
    "language.tr": "Türkçe",
    "language.ar": "Arapça",
    "language.de": "Almanca",
    "language.es": "İspanyolca",
    "tele.status.ready": "Hazır",
    "tele.status.stopped": "Durduruldu",
    "tele.status.paused": "Duraklatıldı",
    "tele.status.arrowPaused": "Ok modu duraklatıldı",
    "tele.status.performance": "Performans kaydırması",
    "tele.status.scrolling": "Kaydırılıyor",
    "tele.status.line": "Satır satır",
    "tele.status.arrow": "Ok modu",
    "tele.status.highlight": "Vurgulanıyor",
    "tele.progress": "Kelime {current} / {total}",
    "tele.floatingStats": "{words} kaldı · {minutes} dk kaldı",
    "tele.empty": "Metin düzenleyicisini açın ve metninizi ekleyin.",
    "tele.status.micBlocked": "Mikrofon Windows gizliliği tarafından engellendi",
    "tele.status.noMic": "Mikrofon bulunamadı",
    "tele.status.micUnavailable": "Mikrofon kullanılamıyor",
    "tele.voiceFeedback.micBlocked": "Mikrofon erişimi Windows Gizlilik ayarlarında engellenmiş.\nFlow için mikrofon erişimini yeniden açın, sonra Ses takibini tekrar deneyin.\n\nMetniniz kaydedildi.",
    "tele.voiceFeedback.noMic": "Hiç mikrofon algılanmadı.\nBir mikrofon bağlayın veya etkinleştirin, sonra Ses takibini tekrar deneyin.\n\nMetniniz kaydedildi.",
    "tele.voiceFeedback.micUnavailable": "Flow, mikrofon kullanılamadığı veya çalışmadığı için Ses takibini başlatamadı.\nSeçili giriş aygıtını kontrol edin, sonra tekrar deneyin.\n\nMetniniz kaydedildi.",
    "tele.addGroqKey": "Önce metin sayfasına Groq API anahtarını ekleyin",
    "tele.promptExisting": "Groq'un mevcut teleprompter metnini nasıl yeniden yazması gerektiğini açıklayın:",
    "tele.promptExistingDefault": "Bunu Arapça olarak farklı bir kişilik ve estetikle 200 kelimede yeniden yaz.",
    "tele.promptNew": "Groq'un oluşturmasını istediğiniz teleprompter metnini açıklayın:",
    "tele.promptNewDefault": "Güvenli ve doğal akışa sahip kısa bir ürün lansmanı konuşması.",
    "tele.cancelled": "Oluşturma iptal edildi",
    "tele.generating": "Groq ile oluşturuluyor...",
    "tele.generated": "Groq yeni bir metin oluşturdu",
    "tele.groqFailed": "Groq başarısız oldu: {error}",
    "tele.opened": "Açıldı: {kind}",
    "tele.failedOpenInput": "Metin açılamadı: {error}",
    "tele.failedOpenSettings": "Ayarlar açılamadı: {error}",
    "tele.failedCloseApp": "Uygulama kapatılamadı: {error}",
    "settings.kicker": "Ayarlar",
    "settings.title": "Canlı kontroller",
    "settings.section": "Bölüm",
    "settings.sectionTitle": "Ayarlara göz at",
    "settings.section.remote": "Uzak",
    "settings.section.positioning": "Konum",
    "settings.section.appearance": "Görünüm",
    "settings.section.privacy": "Gizlilik ve sistem",
    "settings.section.usability": "Kullanılabilirlik",
    "settings.positioning": "Konumlandırma",
    "settings.windowPlacement": "Pencere yerleşimi",
    "settings.windowLocation": "Pencere konumu",
    "settings.x": "X",
    "settings.y": "Y",
    "settings.topCenter": "Üst orta",
    "settings.center": "Orta",
    "settings.custom": "Özel x / y",
    "settings.drag": "Serbest sürükleme",
    "settings.appearance": "Görünüm",
    "settings.appearanceTitle": "Tipografi ve görseller",
    "settings.sizeAndPlayback": "Boyut ve oynatma stili",
    "settings.group.windowSize": "Pencere boyutu",
    "settings.group.playback": "Oynatma",
    "settings.group.typography": "Tipografi",
    "settings.group.visuals": "Görseller",
    "settings.width": "Genişlik",
    "settings.height": "Yükseklik",
    "settings.animationStyle": "Animasyon stili",
    "settings.mode.highlight": "Vurgu modu",
    "settings.mode.scroll": "Normal kaydırma modu",
    "settings.mode.line": "Satır satır vurgu",
    "settings.mode.arrow": "Ok modu",
    "settings.mode.voice": "Ses takibi",
    "settings.voiceTrackingStyle": "Ses takibi stili",
    "settings.voiceTrackingStyleHelp": "Konuşurken eşleşen konumun nasıl gösterileceğini seçin.",
    "settings.voiceConfidence": "Güven seviyesi",
    "settings.voiceConfidenceHelp": "Daha yüksek değerler, düşük güvenli konuşma eşleşmelerinde Flow'u daha katı yapar.",
    "settings.voiceConfidenceSkips": "Flow kelimeleri atlıyor veya ileri sıçrıyorsa bu değeri artırın.",
    "settings.voiceConfidenceStalls": "Net okumanıza rağmen hiç ilerlemiyorsa bu değeri azaltın.",
    "settings.voiceStyle.highlight": "Kelime vurgusu",
    "settings.voiceStyle.line": "Satır vurgusu",
    "settings.voiceStyle.plain": "Düz metin",
    "settings.appWideVoiceCommands": "Uygulama genelinde Flow ses komutları",
    "settings.appWideVoiceCommandsHelp": "'Hey Flow duraklat' veya 'Hey Flow aşağı' gibi İngilizce Flow komutlarının ses takibi dışında da çalışmasını sağlar. Şu anda kararsızdır ve güvenilir çalışmayabilir.",
    "settings.font": "Yazı tipi",
    "settings.textSize": "Metin boyutu",
    "settings.style": "Stil",
    "settings.style.main": "Ana",
    "settings.style.glass": "Buzlu cam",
    "settings.style.minimal": "Minimalist",
    "settings.theme": "Tema",
    "settings.theme.main": "Ana",
    "settings.theme.dark": "Koyu",
    "settings.theme.bright": "Parlak",
    "settings.theme.meadow": "Sarı-yeşil",
    "settings.voiceLanguage": "Ses dili",
    "settings.voiceModeHelp": "Ses takibi ve uygulama geneli Flow komutları için seçili dili kullanır.",
    "settings.voiceModelChecking": "Model kontrol ediliyor…",
    "settings.voiceModelCheckingHelp": "Flow seçili Vosk modelinin yerel olarak kayıtlı olup olmadığını kontrol eder.",
    "settings.voiceModelPathPending": "Yerel model yolu kontrol ediliyor…",
    "settings.voiceModelProgressIdle": "İndirme bekleniyor",
    "settings.voiceModelProgressStats": "{remaining} kaldı · {speed}",
    "settings.voiceModelInstalled": "Yüklü ✓",
    "settings.voiceModelInstalledHelp": "Bu Vosk modeli hazır. Flow bunu ses takibi ve uygulama geneli komutlar için kullanacak.",
    "settings.voiceModelMissing": "Model gerekli",
    "settings.voiceModelMissingHelp": "Bu dil henüz yüklü değil. Komutlarda veya ses takibinde kullanmadan önce Vosk modelini indirin.",
    "settings.voiceModelDownloading": "İndiriliyor…",
    "settings.voiceModelDownloadingHelp": "Seçili Vosk modeli indiriliyor. Bitene kadar bu pencereyi açık tutun.",
    "settings.voiceModelPathValue": "Kayıtlı model: {path}",
    "settings.voiceModelPathMissing": "Bu dil için henüz yerel bir Vosk modeli kaydedilmedi.",
    "settings.voiceModelDownloadAction": "Vosk modelini indir",
    "settings.voiceModelDownloadingAction": "Model indiriliyor…",
    "settings.voiceModelInstalledAction": "Model indirildi",
    "settings.voiceModelDownloadComplete": "{language} Vosk modeli hazır.",
    "settings.voiceModelDownloadFailed": "Seçilen Vosk modeli indirilemedi.",
    "settings.speedSlider": "Sol hız kaydırıcısı",
    "settings.speedSliderHelp": "Oynatma sırasında solda dikey WPM kaydırıcısını gösterir.",
    "settings.scrollStartDelay": "Metin başlama gecikmesi",
    "settings.scrollStartDelayHelp": "3, 2, 1 geri sayımından sonra, kaydırma modu hareket etmeden önce metni bu kadar saniye sabit tutar.",
    "settings.performance": "Performans modu",
    "settings.performanceHelp": "Daha akıcı performans için arayüz animasyonlarını kapatır ve normal kaydırmayı zorlar.",
    "settings.autoHideToolbar": "Üst çubuğu otomatik gizle",
    "settings.autoHideToolbarHelp": "Üstte küçük bir tutamak gösterir ve araç çubuğunu yalnızca teleprompter üzerine gelindiğinde açar.",
    "settings.textColor": "Metin rengi",
    "settings.textTransparency": "Metin şeffaflığı",
    "settings.appTransparency": "Uygulama şeffaflığı",
    "settings.synced": "Ayarlar mevcut ana pencereyle eşitlendi.",
    "settings.applied": "Değişiklikler otomatik uygulandı.",
    "settings.autoApply": "Kaydırıcıları hareket ettirdiğinizde veya bir ayar seçtiğinizde değişiklikler otomatik uygulanır.",
    "input.kicker": "Yeni metin",
    "input.title": "Metin düzenleyici",
    "input.section": "Bölüm",
    "input.sectionTitle": "Düzenleyici panelini seç",
    "input.section.editor": "Düzenleyici",
    "input.section.assistant": "Groq yardımcısı",
    "input.teleprompterText": "Teleprompter metni",
    "input.toolbar": "Biçimlendirme araç çubuğu",
    "input.scriptPlaceholder": "Metninizi buraya yapıştırın veya yazın...",
    "input.meta": "{count} kelime · {minutes} dk okuma",
    "input.editorHelp": "Biçimlendirme; <strong>**kalın**</strong>, <em>*italik*</em>, <strong>- öğe</strong> ile madde işaretli listeler, <strong>1. öğe</strong> ile numaralı listeler, <strong>&gt; alıntı</strong> ile alıntı blokları ve ayrıca <span class=\"toolbar-underline\">[u]altı çizili[/u]</span>, <span class=\"tone-white\">[white]beyaz[/white]</span>, <span class=\"tone-softwhite\">[softwhite]kırık beyaz[/softwhite]</span>, <mark class=\"mark-yellow\">[yellow]vurgu[/yellow]</mark>, <mark class=\"mark-blue\">[blue]vurgu[/blue]</mark> ve <mark class=\"mark-red\">[red]vurgu[/red]</mark> etiketleri için Reddit tarzı markdown gibi çalışır.",
    "input.groq": "Groq",
    "input.draftHelper": "Taslak yardımcısı",
    "input.apiKey": "API anahtarı",
    "input.apiKeyPlaceholder": "Groq API anahtarınızı yapıştırın",
    "input.instruction": "Talimat",
    "input.instructionPlaceholder": "Örnek: Bunu kamera önünde okumak için daha doğal hale getir.",
    "input.saveText": "Metni kaydet",
    "input.useGroq": "Groq kullan",
    "input.groqOptional": "Groq isteğe bağlıdır. Anahtarınız bu cihazda yerel depolamada kalır.",
    "input.needKey": "Önce Groq API anahtarınızı ekleyin.",
    "input.needInstructionOrScript": "Önce bir talimat veya metin ekleyin.",
    "input.thinking": "Düşünüyor...",
    "input.groqUpdated": "Groq metninizi güncelledi.",
    "input.groqFailed": "Groq isteği başarısız oldu.",
    "input.saved": "Yerel olarak kaydedildi.",
    "about.kicker": "Hakkında",
    "about.title": "Bu proje hakkında",
    "about.summary": "Akıcı okuma, hızlı düzenleme, sesli kontroller ve uzak mesaj ekleme için modern bir masaüstü teleprompter.",
    "about.p1": "Flow, web teknolojileri ve Tauri ile oluşturulmuş bir teleprompter uygulamasıdır. Basit, hafif ve özelleştirilebilir olacak şekilde tasarlanmıştır.",
    "about.p2": "Bu proje açık kaynaklıdır ve <a href=\"https://github.com/LumoRez07\">GitHub hesabımda</a> yer almaktadır. Sorularınız, önerileriniz varsa veya katkı sağlamak istiyorsanız iletişime geçebilir ya da bir issue açabilirsiniz.",
    "about.p3": "Bu proje 2026 yılında <a href=\"https://flowremote.app/\">LumoRez</a> tarafından ❤️ ile yapıldı.",
    "about.p4": "Flow; metin düzenleme, birden fazla oynatma modu, ses takibi, yapay zekâ destekli taslak oluşturma, uzak bildirimler, sistem tepsisi kontrolleri ve ekran yakalama koruması gibi Windows odaklı gizlilik seçenekleri içerir."
  },
  ar: {
    "doc.teleprompterTitle": "ملقن Flow",
    "doc.settingsTitle": "Flow · الإعدادات",
    "doc.textTitle": "Flow · النص",
    "doc.aboutTitle": "Flow · حول",
    "common.settings": "الإعدادات",
    "common.text": "النص",
    "common.close": "إغلاق",
    "common.ai": "AI",
    "common.wpm": "ك/د",
    "common.slower": "أبطأ",
    "common.faster": "أسرع",
    "common.speedAria": "السرعة بالكلمات في الدقيقة",
    "common.generatePrompt": "إنشاء طلب",
    "common.play": "تشغيل",
    "common.continue": "متابعة",
    "common.pause": "إيقاف مؤقت",
    "common.replayStart": "إعادة من البداية",
    "common.stopKeep": "إيقاف مع حفظ الموضع",
    "common.openTextPage": "فتح صفحة النص",
    "common.openSettings": "فتح الإعدادات",
    "common.pinWindow": "تثبيت النافذة",
    "common.unpinWindow": "إلغاء تثبيت النافذة",
    "common.closeApp": "إغلاق التطبيق",
    "common.collapse": "تصغير الملقن",
    "common.expand": "توسيع الملقن",
    "common.language": "اللغة",
    "language.en": "الإنجليزية",
    "language.tr": "التركية",
    "language.ar": "العربية",
    "language.de": "الألمانية",
    "language.es": "الإسبانية",
    "tele.status.ready": "جاهز",
    "tele.status.stopped": "متوقف",
    "tele.status.paused": "متوقف مؤقتًا",
    "tele.status.arrowPaused": "وضع السهم متوقف مؤقتًا",
    "tele.status.performance": "تمرير الأداء",
    "tele.status.scrolling": "يتم التمرير",
    "tele.status.line": "سطرًا بسطر",
    "tele.status.arrow": "وضع السهم",
    "tele.status.highlight": "تمييز",
    "tele.progress": "الكلمة {current} / {total}",
    "tele.floatingStats": "المتبقي {words} · المتبقي {minutes} دقيقة",
    "tele.empty": "افتح محرر النص وأضف النص الخاص بك.",
    "tele.status.micBlocked": "الميكروفون محظور من إعدادات خصوصية ويندوز",
    "tele.status.noMic": "لم يتم العثور على ميكروفون",
    "tele.status.micUnavailable": "الميكروفون غير متاح",
    "tele.voiceFeedback.micBlocked": "تم حظر الوصول إلى الميكروفون من إعدادات خصوصية ويندوز.\nأعد تفعيل وصول Flow إلى الميكروفون ثم جرّب تتبع الصوت مرة أخرى.\n\nالنص الخاص بك ما زال محفوظًا.",
    "tele.voiceFeedback.noMic": "لم يتم اكتشاف أي ميكروفون.\nقم بتوصيل ميكروفون أو تفعيله ثم جرّب تتبع الصوت مرة أخرى.\n\nالنص الخاص بك ما زال محفوظًا.",
    "tele.voiceFeedback.micUnavailable": "تعذر على Flow بدء تتبع الصوت لأن الميكروفون غير متاح أو لا يعمل.\nتحقق من جهاز الإدخال المحدد ثم جرّب مرة أخرى.\n\nالنص الخاص بك ما زال محفوظًا.",
    "tele.addGroqKey": "أضف مفتاح Groq API أولاً من صفحة النص",
    "tele.promptExisting": "اشرح كيف يجب على Groq إعادة كتابة نص الملقن الحالي:",
    "tele.promptExistingDefault": "أعد كتابة هذا بالعربية بشخصية وجمالية مختلفة في 200 كلمة.",
    "tele.promptNew": "اشرح النص الذي تريد من Groq إنشاءه للملقن:",
    "tele.promptNewDefault": "نص إطلاق منتج مختصر بإيقاع واثق وطبيعي.",
    "tele.cancelled": "تم إلغاء الإنشاء",
    "tele.generating": "يتم الإنشاء باستخدام Groq...",
    "tele.generated": "أنشأ Groq نصًا جديدًا",
    "tele.groqFailed": "فشل Groq: {error}",
    "tele.opened": "تم فتح {kind}",
    "tele.failedOpenInput": "تعذر فتح النص: {error}",
    "tele.failedOpenSettings": "تعذر فتح الإعدادات: {error}",
    "tele.failedCloseApp": "تعذر إغلاق التطبيق: {error}",
    "settings.kicker": "الإعدادات",
    "settings.title": "عناصر تحكم مباشرة",
    "settings.section": "القسم",
    "settings.sectionTitle": "تصفح الإعدادات",
    "settings.section.remote": "عن بُعد",
    "settings.section.positioning": "الموضع",
    "settings.section.appearance": "المظهر",
    "settings.section.privacy": "الخصوصية والنظام",
    "settings.section.usability": "سهولة الاستخدام",
    "settings.positioning": "الموضع",
    "settings.windowPlacement": "موضع النافذة",
    "settings.windowLocation": "مكان النافذة",
    "settings.x": "X",
    "settings.y": "Y",
    "settings.topCenter": "أعلى الوسط",
    "settings.center": "الوسط",
    "settings.custom": "مخصص x / y",
    "settings.drag": "سحب حر",
    "settings.appearance": "المظهر",
    "settings.appearanceTitle": "الطباعة والمظهر",
    "settings.sizeAndPlayback": "الحجم ونمط التشغيل",
    "settings.group.windowSize": "حجم النافذة",
    "settings.group.playback": "التشغيل",
    "settings.group.typography": "الطباعة",
    "settings.group.visuals": "المظهر",
    "settings.width": "العرض",
    "settings.height": "الارتفاع",
    "settings.animationStyle": "نمط الحركة",
    "settings.mode.highlight": "وضع التمييز",
    "settings.mode.scroll": "وضع التمرير العادي",
    "settings.mode.line": "تمييز سطر بسطر",
    "settings.mode.arrow": "وضع السهم",
    "settings.mode.voice": "تتبع الصوت",
    "settings.voiceTrackingStyle": "نمط تتبع الصوت",
    "settings.voiceTrackingStyleHelp": "اختر كيف يظهر الموضع المطابق أثناء التحدث.",
    "settings.voiceConfidence": "مستوى الثقة",
    "settings.voiceConfidenceHelp": "القيم الأعلى تجعل Flow أكثر تشددًا مع مطابقات الكلام منخفضة الثقة.",
    "settings.voiceConfidenceSkips": "إذا كان Flow يقفز فوق الكلمات أو يتقدم كثيرًا، فزد هذه القيمة.",
    "settings.voiceConfidenceStalls": "إذا لم يتحرك إطلاقًا رغم قراءتك بوضوح، فخفّض هذه القيمة.",
    "settings.voiceStyle.highlight": "تمييز الكلمة",
    "settings.voiceStyle.line": "تمييز السطر",
    "settings.voiceStyle.plain": "نص عادي",
    "settings.appWideVoiceCommands": "أوامر Flow الصوتية على مستوى التطبيق",
    "settings.appWideVoiceCommandsHelp": "يسمح لأوامر Flow الإنجليزية مثل 'Hey Flow pause' أو 'Hey Flow down' بالعمل حتى خارج تتبع الصوت. هذه الميزة غير مستقرة حاليًا وقد لا تعمل بشكل موثوق.",
    "settings.font": "الخط",
    "settings.textSize": "حجم النص",
    "settings.style": "الأسلوب",
    "settings.style.main": "الرئيسي",
    "settings.style.glass": "زجاج بلوري",
    "settings.style.minimal": "بسيط",
    "settings.theme": "السمة",
    "settings.theme.main": "الرئيسية",
    "settings.theme.dark": "داكن",
    "settings.theme.bright": "فاتح",
    "settings.theme.meadow": "أصفر-أخضر",
    "settings.voiceLanguage": "لغة الصوت",
    "settings.voiceModeHelp": "يستخدم اللغة المحددة لتتبع الصوت وأوامر Flow على مستوى التطبيق.",
    "settings.voiceModelChecking": "جارٍ فحص النموذج…",
    "settings.voiceModelCheckingHelp": "يتحقق Flow مما إذا كان نموذج Vosk المحدد محفوظًا محليًا بالفعل.",
    "settings.voiceModelPathPending": "جارٍ فحص مسار النموذج المحلي…",
    "settings.voiceModelProgressIdle": "بانتظار التنزيل",
    "settings.voiceModelProgressStats": "المتبقي {remaining} · {speed}",
    "settings.voiceModelInstalled": "مثبت ✓",
    "settings.voiceModelInstalledHelp": "نموذج Vosk هذا جاهز. سيستخدمه Flow لتتبع الصوت والأوامر على مستوى التطبيق.",
    "settings.voiceModelMissing": "النموذج مطلوب",
    "settings.voiceModelMissingHelp": "هذه اللغة غير مثبتة بعد. نزّل نموذج Vosk قبل استخدامها في الأوامر أو تتبع الصوت.",
    "settings.voiceModelDownloading": "جارٍ التنزيل…",
    "settings.voiceModelDownloadingHelp": "يتم الآن تنزيل نموذج Vosk المحدد. أبقِ هذه النافذة مفتوحة حتى يكتمل التنزيل.",
    "settings.voiceModelPathValue": "المسار المحفوظ: {path}",
    "settings.voiceModelPathMissing": "لم يتم حفظ أي نموذج Vosk محلي لهذه اللغة بعد.",
    "settings.voiceModelDownloadAction": "نزّل نموذج Vosk",
    "settings.voiceModelDownloadingAction": "جارٍ تنزيل النموذج…",
    "settings.voiceModelInstalledAction": "تم تنزيل النموذج",
    "settings.voiceModelDownloadComplete": "أصبح نموذج Vosk للغة {language} جاهزًا.",
    "settings.voiceModelDownloadFailed": "تعذر تنزيل نموذج Vosk المحدد.",
    "settings.speedSlider": "شريط السرعة الأيسر",
    "settings.speedSliderHelp": "يعرض منزلق WPM عموديًا على الجانب الأيسر أثناء التشغيل.",
    "settings.scrollStartDelay": "تأخير بدء النص",
    "settings.scrollStartDelayHelp": "بعد العد التنازلي 3 و2 و1، يُبقي النص ثابتًا لهذه المدة قبل أن يبدأ وضع التمرير بالحركة.",
    "settings.performance": "وضع الأداء",
    "settings.performanceHelp": "يعطّل حركات الواجهة ويفرض التمرير العادي لأداء أكثر سلاسة.",
    "settings.autoHideToolbar": "إخفاء الشريط العلوي تلقائيًا",
    "settings.autoHideToolbarHelp": "يعرض مقبضًا صغيرًا في الأعلى ويُظهر الشريط فقط عند تمرير المؤشر فوق شاشة التلقين.",
    "settings.textColor": "لون النص",
    "settings.textTransparency": "شفافية النص",
    "settings.appTransparency": "شفافية التطبيق",
    "settings.synced": "تمت مزامنة الإعدادات مع النافذة الرئيسية الحالية.",
    "settings.applied": "تم تطبيق التغييرات تلقائيًا.",
    "settings.autoApply": "تُطبَّق التغييرات تلقائيًا عند تحريك الشرائط أو اختيار إعداد.",
    "input.kicker": "نص جديد",
    "input.title": "محرر النص",
    "input.section": "القسم",
    "input.sectionTitle": "اختر لوحة المحرر",
    "input.section.editor": "المحرر",
    "input.section.assistant": "مساعد Groq",
    "input.teleprompterText": "نص الملقن",
    "input.toolbar": "شريط التنسيق",
    "input.scriptPlaceholder": "الصق أو اكتب النص هنا...",
    "input.meta": "{count} كلمة · {minutes} دقيقة قراءة",
    "input.editorHelp": "يعمل التنسيق مثل Markdown بأسلوب Reddit مع <strong>**عريض**</strong> و<em>*مائل*</em> والقوائم النقطية باستخدام <strong>- عنصر</strong> والقوائم المرقمة باستخدام <strong>1. عنصر</strong> والاقتباسات باستخدام <strong>&gt; اقتباس</strong>، بالإضافة إلى الوسوم <span class=\"toolbar-underline\">[u]تسطير[/u]</span> و<span class=\"tone-white\">[white]أبيض[/white]</span> و<span class=\"tone-softwhite\">[softwhite]أبيض مائل للرمادي[/softwhite]</span> و<mark class=\"mark-yellow\">[yellow]تمييز[/yellow]</mark> و<mark class=\"mark-blue\">[blue]تمييز[/blue]</mark> و<mark class=\"mark-red\">[red]تمييز[/red]</mark>.",
    "input.groq": "Groq",
    "input.draftHelper": "مساعد المسودة",
    "input.apiKey": "مفتاح API",
    "input.apiKeyPlaceholder": "ألصق مفتاح Groq API",
    "input.instruction": "التعليمات",
    "input.instructionPlaceholder": "مثال: أعد كتابة هذا ليبدو أكثر طبيعية وأسهل للقراءة أمام الكاميرا.",
    "input.saveText": "حفظ النص",
    "input.useGroq": "استخدام Groq",
    "input.groqOptional": "Groq اختياري. يبقى مفتاحك محفوظًا محليًا على هذا الجهاز.",
    "input.needKey": "أضف مفتاح Groq API أولاً.",
    "input.needInstructionOrScript": "أضف تعليمات أو بعض النص أولاً.",
    "input.thinking": "جارٍ التفكير...",
    "input.groqUpdated": "قام Groq بتحديث النص الخاص بك.",
    "input.groqFailed": "فشل طلب Groq.",
    "input.saved": "تم الحفظ محليًا.",
    "about.kicker": "حول",
    "about.title": "حول هذا المشروع",
    "about.summary": "ملقن مكتبي حديث لقراءة سلسة وتحرير سريع وتحكم صوتي وإدخال الرسائل عن بُعد.",
    "about.p1": "Flow هو تطبيق ملقن نصوص مبني بتقنيات الويب وTauri. صُمم ليكون بسيطًا وخفيفًا وقابلًا للتخصيص.",
    "about.p2": "هذا المشروع مفتوح المصدر ومتوفر على <a href=\"https://github.com/LumoRez07\">حسابي على GitHub</a>. إذا كانت لديك أسئلة أو اقتراحات أو ترغب في المساهمة، فلا تتردد في التواصل أو فتح issue.",
    "about.p3": "تم إنشاء هذا المشروع بواسطة <a href=\"https://flowremote.app/\">LumoRez</a> مع ❤️ في عام 2026.",
    "about.p4": "يتضمن Flow تحرير النصوص وأنماط تشغيل متعددة وتتبعًا صوتيًا وصياغة مدعومة بالذكاء الاصطناعي وإشعارات عن بُعد وعناصر تحكم من شريط النظام وخيارات خصوصية موجهة لويندوز مثل الحماية من الالتقاط."
  },
  de: {
    "doc.teleprompterTitle": "Flow Teleprompter",
    "doc.settingsTitle": "Flow · Einstellungen",
    "doc.textTitle": "Flow · Text",
    "doc.aboutTitle": "Flow · Über",
    "common.settings": "Einstellungen",
    "common.text": "Text",
    "common.close": "Schließen",
    "common.ai": "AI",
    "common.wpm": "WPM",
    "common.slower": "Langsamer",
    "common.faster": "Schneller",
    "common.speedAria": "Geschwindigkeit in Wörtern pro Minute",
    "common.generatePrompt": "Prompt erzeugen",
    "common.play": "Starten",
    "common.continue": "Fortsetzen",
    "common.pause": "Pause",
    "common.replayStart": "Von vorn abspielen",
    "common.stopKeep": "Stoppen und Position behalten",
    "common.openTextPage": "Textseite öffnen",
    "common.openSettings": "Einstellungen öffnen",
    "common.pinWindow": "Fenster anheften",
    "common.unpinWindow": "Fenster lösen",
    "common.closeApp": "App schließen",
    "common.collapse": "Teleprompter einklappen",
    "common.expand": "Teleprompter ausklappen",
    "common.language": "Sprache",
    "language.en": "Englisch",
    "language.tr": "Türkisch",
    "language.ar": "Arabisch",
    "language.de": "Deutsch",
    "language.es": "Spanisch",
    "tele.status.ready": "Bereit",
    "tele.status.stopped": "Gestoppt",
    "tele.status.paused": "Pausiert",
    "tele.status.arrowPaused": "Pfeilmodus pausiert",
    "tele.status.performance": "Performance-Scrollen",
    "tele.status.scrolling": "Scrollt",
    "tele.status.line": "Zeile für Zeile",
    "tele.status.arrow": "Pfeilmodus",
    "tele.status.highlight": "Hervorhebung",
    "tele.progress": "Wort {current} / {total}",
    "tele.floatingStats": "{words} übrig · {minutes} Min. übrig",
    "tele.empty": "Öffne den Texteditor und füge dein Skript hinzu.",
    "tele.status.micBlocked": "Mikrofon durch Windows-Datenschutz blockiert",
    "tele.status.noMic": "Kein Mikrofon erkannt",
    "tele.status.micUnavailable": "Mikrofon nicht verfügbar",
    "tele.voiceFeedback.micBlocked": "Der Mikrofonzugriff ist in den Windows-Datenschutzeinstellungen blockiert.\nAktiviere den Mikrofonzugriff für Flow wieder und versuche dann Voice Tracking erneut.\n\nDein Skript ist weiterhin gespeichert.",
    "tele.voiceFeedback.noMic": "Es wurde kein Mikrofon erkannt.\nSchließe ein Mikrofon an oder aktiviere es und versuche dann Voice Tracking erneut.\n\nDein Skript ist weiterhin gespeichert.",
    "tele.voiceFeedback.micUnavailable": "Flow konnte Voice Tracking nicht starten, weil das Mikrofon nicht verfügbar ist oder nicht funktioniert.\nPrüfe das ausgewählte Eingabegerät und versuche es dann erneut.\n\nDein Skript ist weiterhin gespeichert.",
    "tele.addGroqKey": "Füge zuerst den Groq-API-Schlüssel auf der Textseite hinzu",
    "tele.promptExisting": "Beschreibe, wie Groq den aktuellen Teleprompter-Text umschreiben soll:",
    "tele.promptExistingDefault": "Schreibe dies auf Arabisch mit einer anderen Persönlichkeit und Ästhetik in 200 Wörtern um.",
    "tele.promptNew": "Beschreibe den Teleprompter-Text, den Groq erzeugen soll:",
    "tele.promptNewDefault": "Ein prägnanter Produktlaunch-Pitch mit sicherem, natürlichem Rhythmus.",
    "tele.cancelled": "Erstellung abgebrochen",
    "tele.generating": "Erzeuge mit Groq...",
    "tele.generated": "Groq hat ein neues Skript erzeugt",
    "tele.groqFailed": "Groq fehlgeschlagen: {error}",
    "tele.opened": "Geöffnet: {kind}",
    "tele.failedOpenInput": "Text konnte nicht geöffnet werden: {error}",
    "tele.failedOpenSettings": "Einstellungen konnten nicht geöffnet werden: {error}",
    "tele.failedCloseApp": "App konnte nicht geschlossen werden: {error}",
    "settings.kicker": "Einstellungen",
    "settings.title": "Live-Steuerung",
    "settings.section": "Bereich",
    "settings.sectionTitle": "Einstellungen durchsuchen",
    "settings.section.remote": "Remote",
    "settings.section.positioning": "Positionierung",
    "settings.section.appearance": "Darstellung",
    "settings.section.privacy": "Datenschutz und System",
    "settings.section.usability": "Bedienung",
    "settings.positioning": "Positionierung",
    "settings.windowPlacement": "Fensterplatzierung",
    "settings.windowLocation": "Fensterposition",
    "settings.x": "X",
    "settings.y": "Y",
    "settings.topCenter": "Oben mittig",
    "settings.center": "Zentriert",
    "settings.custom": "Benutzerdefiniert x / y",
    "settings.drag": "Freies Ziehen",
    "settings.appearance": "Darstellung",
    "settings.appearanceTitle": "Typografie und Darstellung",
    "settings.sizeAndPlayback": "Größe und Wiedergabestil",
    "settings.group.windowSize": "Fenstergröße",
    "settings.group.playback": "Wiedergabe",
    "settings.group.typography": "Typografie",
    "settings.group.visuals": "Darstellung",
    "settings.width": "Breite",
    "settings.height": "Höhe",
    "settings.animationStyle": "Animationsstil",
    "settings.mode.highlight": "Hervorhebungsmodus",
    "settings.mode.scroll": "Normaler Scrollmodus",
    "settings.mode.line": "Zeilenweise Hervorhebung",
    "settings.mode.arrow": "Pfeilmodus",
    "settings.mode.voice": "Sprachverfolgung",
    "settings.voiceTrackingStyle": "Sprachstil",
    "settings.voiceTrackingStyleHelp": "Wähle, wie die erkannte Position beim Sprechen angezeigt wird.",
    "settings.voiceConfidence": "Konfidenzniveau",
    "settings.voiceConfidenceHelp": "Höhere Werte machen Flow bei Sprachtreffern mit niedriger Sicherheit strenger.",
    "settings.voiceConfidenceSkips": "Wenn Flow Wörter überspringt oder zu weit vorspringt, erhöhe diesen Wert.",
    "settings.voiceConfidenceStalls": "Wenn sich nichts bewegt, obwohl du klar sprichst, senke diesen Wert.",
    "settings.voiceStyle.highlight": "Worthervorhebung",
    "settings.voiceStyle.line": "Zeilenhervorhebung",
    "settings.voiceStyle.plain": "Klartext",
    "settings.appWideVoiceCommands": "App-weite Flow-Sprachbefehle",
    "settings.appWideVoiceCommandsHelp": "Erlaubt englische Flow-Befehle wie 'Hey Flow pause' oder 'Hey Flow down' auch außerhalb der Sprachverfolgung. Aktuell instabil und funktioniert eventuell nicht zuverlässig.",
    "settings.font": "Schriftart",
    "settings.textSize": "Textgröße",
    "settings.style": "Stil",
    "settings.style.main": "Haupt",
    "settings.style.glass": "Milchglas",
    "settings.style.minimal": "Minimalistisch",
    "settings.theme": "Design",
    "settings.theme.main": "Haupt",
    "settings.theme.dark": "Dunkel",
    "settings.theme.bright": "Hell",
    "settings.theme.meadow": "Gelbgrün",
    "settings.voiceLanguage": "Spracheingabe",
    "settings.voiceModeHelp": "Verwendet die gewählte Sprache für Sprachverfolgung und app-weite Flow-Befehle.",
    "settings.voiceModelChecking": "Modell wird geprüft…",
    "settings.voiceModelCheckingHelp": "Flow prüft, ob das ausgewählte Vosk-Modell bereits lokal gespeichert ist.",
    "settings.voiceModelPathPending": "Lokaler Modellpfad wird geprüft…",
    "settings.voiceModelProgressIdle": "Wartet auf Download",
    "settings.voiceModelProgressStats": "{remaining} übrig · {speed}",
    "settings.voiceModelInstalled": "Installiert ✓",
    "settings.voiceModelInstalledHelp": "Dieses Vosk-Modell ist bereit. Flow verwendet es für Sprachverfolgung und app-weite Befehle.",
    "settings.voiceModelMissing": "Modell erforderlich",
    "settings.voiceModelMissingHelp": "Diese Sprache ist noch nicht installiert. Lade zuerst das Vosk-Modell herunter.",
    "settings.voiceModelDownloading": "Wird heruntergeladen…",
    "settings.voiceModelDownloadingHelp": "Das ausgewählte Vosk-Modell wird jetzt geladen. Lass dieses Fenster geöffnet, bis es fertig ist.",
    "settings.voiceModelPathValue": "Gespeichertes Modell: {path}",
    "settings.voiceModelPathMissing": "Für diese Sprache wurde noch kein lokales Vosk-Modell gespeichert.",
    "settings.voiceModelDownloadAction": "Vosk-Modell herunterladen",
    "settings.voiceModelDownloadingAction": "Modell wird geladen…",
    "settings.voiceModelInstalledAction": "Modell geladen",
    "settings.voiceModelDownloadComplete": "Das {language}-Vosk-Modell ist bereit.",
    "settings.voiceModelDownloadFailed": "Das ausgewählte Vosk-Modell konnte nicht heruntergeladen werden.",
    "settings.speedSlider": "Linker Geschwindigkeitsregler",
    "settings.speedSliderHelp": "Zeigt beim Abspielen links einen vertikalen WPM-Regler an.",
    "settings.scrollStartDelay": "Text-Startverzögerung",
    "settings.scrollStartDelayHelp": "Nach dem 3-2-1-Countdown bleibt der Text für diese Anzahl Sekunden stehen, bevor der Scrollmodus losläuft.",
    "settings.performance": "Performance-Modus",
    "settings.performanceHelp": "Deaktiviert UI-Animationen und erzwingt normales Scrollen für flüssigere Leistung.",
    "settings.autoHideToolbar": "Obere Leiste automatisch ausblenden",
    "settings.autoHideToolbarHelp": "Zeigt oben einen kleinen Griff an und blendet die Leiste nur ein, wenn der Teleprompter mit der Maus berührt wird.",
    "settings.textColor": "Textfarbe",
    "settings.textTransparency": "Texttransparenz",
    "settings.appTransparency": "App-Transparenz",
    "settings.synced": "Einstellungen mit dem aktuellen Hauptfenster synchronisiert.",
    "settings.applied": "Änderungen wurden automatisch übernommen.",
    "settings.autoApply": "Änderungen werden automatisch übernommen, wenn du Regler bewegst oder eine Einstellung auswählst.",
    "input.kicker": "Neuer Text",
    "input.title": "Skript-Editor",
    "input.section": "Bereich",
    "input.sectionTitle": "Editor-Bereich wählen",
    "input.section.editor": "Editor",
    "input.section.assistant": "Groq-Assistent",
    "input.teleprompterText": "Teleprompter-Text",
    "input.toolbar": "Formatierungsleiste",
    "input.scriptPlaceholder": "Füge dein Skript hier ein oder schreibe es...",
    "input.meta": "{count} Wörter · {minutes} Min. Lesezeit",
    "input.editorHelp": "Die Formatierung funktioniert wie Reddit-Markdown für <strong>**fett**</strong>, <em>*kursiv*</em>, Aufzählungen mit <strong>- Punkt</strong>, nummerierte Listen mit <strong>1. Punkt</strong>, Blockzitate mit <strong>&gt; Zitat</strong> sowie mit Tags für <span class=\"toolbar-underline\">[u]Unterstreichung[/u]</span>, <span class=\"tone-white\">[white]Weiß[/white]</span>, <span class=\"tone-softwhite\">[softwhite]Off-White[/softwhite]</span>, <mark class=\"mark-yellow\">[yellow]Hervorhebung[/yellow]</mark>, <mark class=\"mark-blue\">[blue]Hervorhebung[/blue]</mark> und <mark class=\"mark-red\">[red]Hervorhebung[/red]</mark>.",
    "input.groq": "Groq",
    "input.draftHelper": "Entwurfshilfe",
    "input.apiKey": "API-Schlüssel",
    "input.apiKeyPlaceholder": "Füge deinen Groq-API-Schlüssel ein",
    "input.instruction": "Anweisung",
    "input.instructionPlaceholder": "Beispiel: Schreibe das natürlicher und leichter für die Kamera um.",
    "input.saveText": "Text speichern",
    "input.useGroq": "Groq verwenden",
    "input.groqOptional": "Groq ist optional. Dein Schlüssel bleibt lokal auf diesem Gerät gespeichert.",
    "input.needKey": "Füge zuerst deinen Groq-API-Schlüssel ein.",
    "input.needInstructionOrScript": "Füge zuerst eine Anweisung oder etwas Text ein.",
    "input.thinking": "Denkt nach...",
    "input.groqUpdated": "Groq hat dein Skript aktualisiert.",
    "input.groqFailed": "Groq-Anfrage fehlgeschlagen.",
    "input.saved": "Lokal gespeichert.",
    "about.kicker": "Über",
    "about.title": "Über dieses Projekt",
    "about.summary": "Ein moderner Desktop-Teleprompter für flüssiges Lesen, schnelles Bearbeiten, Sprachsteuerung und Remote-Nachrichten.",
    "about.p1": "Flow ist eine Teleprompter-App, die mit Web-Technologien und Tauri entwickelt wurde. Sie wurde so gestaltet, dass sie einfach, leichtgewichtig und anpassbar ist.",
    "about.p2": "Dieses Projekt ist Open Source und auf meinem <a href=\"https://github.com/LumoRez07\">GitHub-Konto</a> verfügbar. Wenn du Fragen oder Vorschläge hast oder beitragen möchtest, melde dich gern oder eröffne ein Issue.",
    "about.p3": "Dieses Projekt wurde 2026 von <a href=\"https://flowremote.app/\">LumoRez</a> mit ❤️ erstellt.",
    "about.p4": "Flow bietet Skriptbearbeitung, mehrere Wiedergabemodi, Sprachverfolgung, KI-gestützte Entwürfe, Remote-Benachrichtigungen, Tray-Steuerung und Windows-orientierte Datenschutzoptionen wie Aufnahmeschutz."
  }
};

Object.assign(UI_STRINGS.en, {
  "common.copy": "Copy",
  "common.copyLink": "Copy link",
  "common.loading": "Loading…",
  "common.unavailable": "Unavailable",
  "common.live": "Live",
  "common.offline": "Offline",
  "common.setup": "Setup",
  "tele.promptExistingDefault": "Rewrite this with a different tone, personality, and visual style in about 200 words.",
  "doc.remoteInboxTitle": "Flow Notifications",
  "settings.remoteInjection": "Remote injection",
  "settings.remoteSession": "Live receiver session",
  "settings.remoteTransport": "Remote transport",
  "settings.remoteTransport.local": "Local relay",
  "settings.remoteTransport.cloud": "Cloud relay",
  "settings.remoteCloudHelp": "Cloud relay uses the active UUID plus the generated access password. Senders open the cloud sender page, and the relay checks that the UUID is live and the access password matches.",
  "settings.remoteUuid": "Active UUID",
  "settings.remoteAccessPassword": "Access password",
  "settings.remoteSenderPage": "Sender page",
  "settings.remoteSenderQr": "Quick connect QR",
  "settings.remoteSenderQrHelp": "Scan to open the sender page with the UUID and access password already filled in.",
  "settings.remoteSenderQrPending": "Open the teleprompter so Flow can publish an active UUID and access password before scanning.",
  "settings.remoteSenderQrUnavailable": "QR code is unavailable until the cloud sender page is configured.",
  "settings.remoteRealtimeSection": "Realtime editing",
  "settings.remoteRealtimeHelp": "Create a private browser room for live script editing. The teleprompter stays authoritative and the cloud relay only carries the handshake.",
  "settings.remoteRealtimeUnavailable": "Realtime editing is unavailable until the cloud relay URL is configured.",
  "settings.remoteRealtimePending": "Open the teleprompter first so Flow can publish an active UUID before initializing realtime editing.",
  "settings.remoteRealtimeReady": "Realtime editing is ready. Open or copy the room link to connect a browser editor.",
  "settings.remoteRealtimePassword": "Realtime password",
  "settings.remoteRealtimeLinkLabel": "Realtime room link",
  "settings.remoteRealtimeRoomLink": "Open realtime room",
  "settings.remoteRealtimeQrHelp": "Scan to open the realtime room directly in the browser editor.",
  "settings.remoteRealtimeQrPending": "Initialize realtime editing to generate the room QR code.",
  "settings.remoteRealtimePublishing": "Realtime editing is initializing. Keep the teleprompter open while Flow publishes the room.",
  "settings.remoteRealtimeOnline": "A browser editor is connected to realtime editing. Open or scan the room to keep collaborating.",
  "settings.remoteRealtimeRelayUnavailable": "The configured realtime relay website is unreachable right now. Deploy or fix the cloud relay URL before opening the room.",
  "settings.remoteRealtimeBadgeIdle": "Idle",
  "settings.remoteRealtimeBadgeWaiting": "Waiting",
  "settings.remoteRealtimeBadgeAvailable": "Available",
  "settings.remoteRealtimeBadgeOnline": "Connected",
  "settings.remoteRealtimeBadgeUnavailable": "Unavailable",
  "settings.remoteRealtimeInit": "Create room",
  "settings.remoteRealtimeClose": "Close room",
  "settings.remoteRealtimeInitializing": "Creating room…",
  "settings.remoteStatusWaiting": "Waiting for relay status.",
  "settings.remotePublicHost": "Public host / domain",
  "settings.remotePublicHostPlaceholder": "Example: flow.example.com or 82.14.25.90",
  "settings.remoteLocalHelp": "For local relay, the sender needs your public address, the UUID, and the generated access password above.",
  "settings.copyNothing": "Nothing is available to copy yet.",
  "settings.copyFailed": "Copy failed. You can still select the value manually.",
  "settings.copiedUuid": "UUID copied.",
  "settings.copiedAccessPassword": "Access password copied.",
  "settings.copiedSenderLink": "Sender link copied.",
  "settings.copiedRealtimePassword": "Realtime password copied.",
  "settings.copiedRealtimeLink": "Realtime room link copied.",
  "settings.remoteStatusUnavailable": "The relay status is unavailable right now.",
  "settings.remoteStatusListeningPublic": "Relay is listening on port {port}. The copied sender link uses your configured public host.",
  "settings.remoteStatusListeningLocal": "Relay is listening on port {port}. Add a public host or domain below if you want the copied link to work outside your local network.",
  "settings.remoteStatusPasswordMissing": "Access password is missing. Restart Flow to generate a new one.",
  "settings.remoteStatusHeartbeatStale": "Receiver heartbeat is stale. Open the teleprompter window to restore the live session.",
  "settings.remoteSenderUnavailable": "Cloud sender unavailable",
  "settings.remoteStatusCloudNeedsBuild": "Cloud relay is not configured in the app build yet. Set the URL once in src/remote-config.js.",
  "settings.remoteStatusCloudRegister": "Cloud relay is configured. Open the teleprompter window to start heartbeats and register this receiver.",
  "settings.remoteStatusCloudActive": "Cloud relay is active. Senders need the UUID and the generated access password.",
  "settings.remoteStatusCloudOffline": "Cloud relay knows this receiver, but it is currently offline. Keep Flow open to receive messages.",
  "remote.importance.normal": "NORMAL",
  "remote.importance.important": "IMPORTANT",
  "remote.cardHint": "Double-click to inject · use × to deny",
  "remote.rejectAria": "Deny remote message",
  "remote.fetchFailed": "Unable to fetch cloud messages.",
  "remote.resolveFailed": "Unable to resolve cloud message.",
  "remote.acceptedAppending": "Remote message accepted. Appending text…",
  "remote.denied": "Remote message denied.",
  "remote.heartbeatFailed": "Cloud heartbeat failed with status {status}."
});

Object.assign(UI_STRINGS.tr, {
  "common.copy": "Kopyala",
  "common.copyLink": "Bağlantıyı kopyala",
  "common.loading": "Yükleniyor…",
  "common.unavailable": "Kullanılamıyor",
  "common.live": "Canlı",
  "common.on": "Açık",
  "common.off": "Kapalı",
  "common.offline": "Çevrimdışı",
  "common.setup": "Kurulum",
  "tele.promptExistingDefault": "Bunu farklı bir ton, kişilik ve görsel stille yaklaşık 200 kelimede yeniden yaz.",
  "tele.pinned": "Pencere sabitlendi",
  "tele.unpinned": "Pencere serbest sürüklenebilir",
  "tele.clickthroughEnabled": "Tıklama geçiş modu etkinleştirildi",
  "tele.clickthroughDisabled": "Tıklama geçiş modu devre dışı bırakıldı",
  "doc.remoteInboxTitle": "Flow Bildirimleri",
  "settings.privacy": "Gizlilik ve sistem",
  "settings.desktopBehavior": "Masaüstü davranışı",
  "settings.hideFromCapture": "Ekran yakalamada görünmez",
  "settings.hideFromCaptureHelp": "Desteklenen Windows sistemlerinde Flow'u ekran görüntülerinden ve ekran kayıtlarından gizler.",
  "settings.systemTray": "Sistem tepsisi simgesini kullan",
  "settings.systemTrayHelp": "Etkin olduğunda Flow görev çubuğundan gizlenir ve sistem tepsisinden kullanılabilir kalır. Devre dışı olduğunda Flow görev çubuğunda görünür.",
  "settings.preventSleep": "Uyku modunu engelle",
  "settings.preventSleepHelp": "Flow çalışırken ekranı ve sistemi uyanık tutar.",
  "settings.usability": "Kullanılabilirlik",
  "settings.shortcuts": "Klavye kısayolları",
  "settings.clickthroughShortcut": "Tıklama geçiş modu kısayolu",
  "settings.clickthroughShortcutHelp": "Ctrl + Shift + X ile tıklama geçiş modunu açıp kapatmanızı sağlar.",
  "settings.shortcutPlayStop": "Başlat / durdur",
  "settings.shortcutReset": "Başa dön",
  "settings.shortcutBackward": "Geri kaydır",
  "settings.shortcutSpeed": "Oynatırken hızı azalt / artır",
  "settings.shortcutPause": "Duraklat / devam et",
  "settings.shortcutPlayStopValue": "P",
  "settings.shortcutResetValue": "R",
  "settings.shortcutBackwardValue": "Page Up",
  "settings.shortcutSpeedValue": "← / →",
  "settings.shortcutPauseValue": "Boşluk",
  "settings.remoteInjection": "Uzak ekleme",
  "settings.remoteSession": "Canlı alıcı oturumu",
  "settings.remoteTransport": "Uzak aktarım",
  "settings.remoteTransport.local": "Yerel röle",
  "settings.remoteTransport.cloud": "Bulut rölesi",
  "settings.remoteCloudHelp": "Bulut rölesi etkin UUID ile oluşturulan erişim parolasını kullanır. Gönderenler bulut gönderici sayfasını açar ve röle UUID'nin canlı olduğunu ve erişim parolasının eşleştiğini kontrol eder.",
  "settings.remoteUuid": "Etkin UUID",
  "settings.remoteAccessPassword": "Erişim parolası",
  "settings.remoteSenderPage": "Gönderici sayfası",
  "settings.remoteSenderQr": "Hızlı bağlantı QR",
  "settings.remoteSenderQrHelp": "UUID ve erişim parolası zaten doldurulmuş şekilde gönderici sayfasını açmak için tarayın.",
  "settings.remoteSenderQrPending": "Taramadan önce Flow'un etkin bir UUID ve erişim parolası yayınlaması için teleprompter'ı açın.",
  "settings.remoteSenderQrUnavailable": "Bulut gönderici sayfası yapılandırılana kadar QR kodu kullanılamaz.",
  "settings.remoteStatusWaiting": "Röle durumu bekleniyor.",
  "settings.remotePublicHost": "Genel ana bilgisayar / alan adı",
  "settings.remotePublicHostPlaceholder": "Örnek: flow.example.com veya 82.14.25.90",
  "settings.remoteLocalHelp": "Yerel röle için gönderenin genel adresinize, UUID'ye ve yukarıdaki oluşturulan erişim parolasına ihtiyacı vardır.",
  "settings.copyNothing": "Henüz kopyalanacak bir şey yok.",
  "settings.copyFailed": "Kopyalama başarısız oldu. Değeri yine de elle seçebilirsiniz.",
  "settings.copiedUuid": "UUID kopyalandı.",
  "settings.copiedAccessPassword": "Erişim parolası kopyalandı.",
  "settings.copiedSenderLink": "Gönderici bağlantısı kopyalandı.",
  "settings.remoteStatusUnavailable": "Röle durumu şu anda kullanılamıyor.",
  "settings.remoteStatusListeningPublic": "Röle {port} portunda dinliyor. Kopyalanan gönderici bağlantısı yapılandırdığınız genel ana bilgisayarı kullanır.",
  "settings.remoteStatusListeningLocal": "Röle {port} portunda dinliyor. Kopyalanan bağlantının yerel ağınız dışında çalışmasını istiyorsanız aşağıya bir genel ana bilgisayar veya alan adı ekleyin.",
  "settings.remoteStatusPasswordMissing": "Erişim parolası eksik. Yeniden oluşturmak için Flow'u yeniden başlatın.",
  "settings.remoteStatusHeartbeatStale": "Alıcı kalp atışı eski. Canlı oturumu geri yüklemek için teleprompter penceresini açın.",
  "settings.remoteSenderUnavailable": "Bulut gönderici kullanılamıyor",
  "settings.remoteStatusCloudNeedsBuild": "Bulut rölesi henüz uygulama derlemesinde yapılandırılmadı. URL'yi bir kez src/remote-config.js içinde ayarlayın.",
  "settings.remoteStatusCloudRegister": "Bulut rölesi yapılandırıldı. Kalp atışlarını başlatmak ve bu alıcıyı kaydetmek için teleprompter penceresini açın.",
  "settings.remoteStatusCloudActive": "Bulut rölesi etkin. Gönderenlerin UUID'ye ve oluşturulan erişim parolasına ihtiyacı vardır.",
  "settings.remoteStatusCloudOffline": "Bulut rölesi bu alıcıyı biliyor, ancak şu anda çevrimdışı. Mesaj almak için Flow'u açık tutun.",
  "remote.importance.normal": "NORMAL",
  "remote.importance.important": "ÖNEMLİ",
  "remote.cardHint": "Eklemek için çift tıklayın · reddetmek için × kullanın",
  "remote.rejectAria": "Uzak mesajı reddet",
  "remote.fetchFailed": "Bulut mesajları alınamadı.",
  "remote.resolveFailed": "Bulut mesajı çözümlenemedi.",
  "input.importButton": "Dosya içe aktar",
  "input.importHelp": "Bir TXT, DOCX veya PDF dosyasını düzenleyiciye bırakın ya da cihazınızdan seçin.",
  "input.importing": "{name} içe aktarılıyor...",
  "input.imported": "{name} dosyasından metin yüklendi.",
  "input.importUnsupported": "Bu dosya türü desteklenmiyor. TXT, DOCX, PDF veya okunabilir başka bir metin dosyası kullanın.",
  "input.importFailed": "Bu dosya okunamadı.",
  "remote.acceptedAppending": "Uzak mesaj kabul edildi. Metin ekleniyor…",
  "remote.denied": "Uzak mesaj reddedildi.",
  "remote.heartbeatFailed": "Bulut kalp atışı {status} durumuyla başarısız oldu."
});

Object.assign(UI_STRINGS.ar, {
  "common.copy": "نسخ",
  "common.copyLink": "نسخ الرابط",
  "common.loading": "جارٍ التحميل…",
  "common.unavailable": "غير متاح",
  "common.live": "مباشر",
  "common.on": "تشغيل",
  "common.off": "إيقاف",
  "common.offline": "غير متصل",
  "common.setup": "إعداد",
  "tele.promptExistingDefault": "أعد كتابة هذا بنبرة وشخصية وأسلوب بصري مختلف في نحو 200 كلمة.",
  "tele.pinned": "تم تثبيت النافذة",
  "tele.unpinned": "النافذة قابلة للسحب الحر",
  "tele.clickthroughEnabled": "تم تفعيل وضع المرور بالنقر",
  "tele.clickthroughDisabled": "تم تعطيل وضع المرور بالنقر",
  "doc.remoteInboxTitle": "إشعارات Flow",
  "settings.privacy": "الخصوصية والنظام",
  "settings.desktopBehavior": "سلوك سطح المكتب",
  "settings.hideFromCapture": "إخفاء من التقاط الشاشة",
  "settings.hideFromCaptureHelp": "يبقي Flow خارج لقطات الشاشة وتسجيلات الشاشة على أنظمة Windows المدعومة.",
  "settings.systemTray": "استخدام أيقونة شريط النظام",
  "settings.systemTrayHelp": "عند التفعيل، يختفي Flow من شريط المهام ويظل متاحًا من شريط النظام. عند التعطيل، يظهر Flow في شريط المهام.",
  "settings.preventSleep": "منع وضع السكون",
  "settings.preventSleepHelp": "يبقي الشاشة والنظام في وضع الاستيقاظ أثناء تشغيل Flow.",
  "settings.usability": "سهولة الاستخدام",
  "settings.shortcuts": "اختصارات لوحة المفاتيح",
  "settings.clickthroughShortcut": "اختصار وضع المرور بالنقر",
  "settings.clickthroughShortcutHelp": "يتيح لك تبديل وضع المرور بالنقر باستخدام Ctrl + Shift + X.",
  "settings.shortcutPlayStop": "تشغيل / إيقاف",
  "settings.shortcutReset": "إعادة إلى البداية",
  "settings.shortcutBackward": "تمرير للخلف",
  "settings.shortcutSpeed": "إبطاء / تسريع أثناء التشغيل",
  "settings.shortcutPause": "إيقاف مؤقت / متابعة",
  "settings.shortcutPlayStopValue": "P",
  "settings.shortcutResetValue": "R",
  "settings.shortcutBackwardValue": "Page Up",
  "settings.shortcutSpeedValue": "← / →",
  "settings.shortcutPauseValue": "مسافة",
  "settings.remoteInjection": "الإدخال عن بُعد",
  "settings.remoteSession": "جلسة المستقبِل المباشرة",
  "settings.remoteTransport": "النقل عن بُعد",
  "settings.remoteTransport.local": "مرحل محلي",
  "settings.remoteTransport.cloud": "مرحل سحابي",
  "settings.remoteCloudHelp": "يستخدم المرحل السحابي الـ UUID النشط مع كلمة مرور الوصول المُولدة. يفتح المُرسلون صفحة المُرسل السحابية ويتحقق المرحل من أن الـ UUID نشط وأن كلمة المرور مطابقة.",
  "settings.remoteUuid": "UUID النشط",
  "settings.remoteAccessPassword": "كلمة مرور الوصول",
  "settings.remoteSenderPage": "صفحة المُرسل",
  "settings.remoteSenderQr": "رمز QR للاتصال السريع",
  "settings.remoteSenderQrHelp": "امسح لفتح صفحة المُرسل مع تعبئة UUID وكلمة مرور الوصول مسبقًا.",
  "settings.remoteSenderQrPending": "افتح الملقن أولاً حتى يتمكن Flow من نشر UUID نشط وكلمة مرور وصول قبل المسح.",
  "settings.remoteSenderQrUnavailable": "رمز QR غير متاح حتى يتم إعداد صفحة المُرسل السحابية.",
  "settings.remoteStatusWaiting": "بانتظار حالة المرحل.",
  "settings.remotePublicHost": "المضيف العام / النطاق",
  "settings.remotePublicHostPlaceholder": "مثال: flow.example.com أو 82.14.25.90",
  "settings.remoteLocalHelp": "في المرحل المحلي، يحتاج المُرسل إلى عنوانك العام وUUID وكلمة مرور الوصول المُولدة أعلاه.",
  "settings.copyNothing": "لا يوجد شيء متاح للنسخ بعد.",
  "settings.copyFailed": "فشل النسخ. ما زال بإمكانك تحديد القيمة يدويًا.",
  "settings.copiedUuid": "تم نسخ UUID.",
  "settings.copiedAccessPassword": "تم نسخ كلمة مرور الوصول.",
  "settings.copiedSenderLink": "تم نسخ رابط المُرسل.",
  "settings.remoteStatusUnavailable": "حالة المرحل غير متاحة الآن.",
  "settings.remoteStatusListeningPublic": "يستمع المرحل على المنفذ {port}. يستخدم رابط المُرسل المنسوخ المضيف العام الذي قمت بإعداده.",
  "settings.remoteStatusListeningLocal": "يستمع المرحل على المنفذ {port}. أضف مضيفًا عامًا أو نطاقًا أدناه إذا أردت أن يعمل الرابط المنسوخ خارج شبكتك المحلية.",
  "settings.remoteStatusPasswordMissing": "كلمة مرور الوصول مفقودة. أعد تشغيل Flow لإنشاء واحدة جديدة.",
  "settings.remoteStatusHeartbeatStale": "نبضة المستقبِل قديمة. افتح نافذة الملقن لاستعادة الجلسة المباشرة.",
  "settings.remoteSenderUnavailable": "مرسل السحابة غير متاح",
  "settings.remoteStatusCloudNeedsBuild": "لم يتم إعداد المرحل السحابي بعد داخل نسخة التطبيق. اضبط الرابط مرة واحدة في src/remote-config.js.",
  "settings.remoteStatusCloudRegister": "تم إعداد المرحل السحابي. افتح نافذة الملقن لبدء النبضات وتسجيل هذا المستقبِل.",
  "settings.remoteStatusCloudActive": "المرحل السحابي نشط. يحتاج المُرسلون إلى UUID وكلمة مرور الوصول المُولدة.",
  "settings.remoteStatusCloudOffline": "يعرف المرحل السحابي هذا المستقبِل، لكنه غير متصل حاليًا. أبقِ Flow مفتوحًا لتلقي الرسائل.",
  "remote.importance.normal": "عادي",
  "remote.importance.important": "مهم",
  "remote.cardHint": "انقر نقرًا مزدوجًا للإدخال · استخدم × للرفض",
  "remote.rejectAria": "رفض الرسالة البعيدة",
  "remote.fetchFailed": "تعذر جلب رسائل السحابة.",
  "remote.resolveFailed": "تعذر معالجة رسالة السحابة.",
  "input.importButton": "استيراد ملف",
  "input.importHelp": "أسقط ملف TXT أو DOCX أو PDF داخل المحرر، أو اختر ملفًا من جهازك.",
  "input.importing": "جارٍ استيراد {name}...",
  "input.imported": "تم تحميل النص من {name}.",
  "input.importUnsupported": "نوع الملف هذا غير مدعوم. استخدم TXT أو DOCX أو PDF أو أي ملف نصي آخر قابل للقراءة.",
  "input.importFailed": "تعذر قراءة هذا الملف.",
  "remote.acceptedAppending": "تم قبول الرسالة البعيدة. تتم إضافة النص…",
  "remote.denied": "تم رفض الرسالة البعيدة.",
  "remote.heartbeatFailed": "فشلت نبضة السحابة بالحالة {status}."
});

Object.assign(UI_STRINGS.de, {
  "common.copy": "Kopieren",
  "common.copyLink": "Link kopieren",
  "common.loading": "Lädt…",
  "common.unavailable": "Nicht verfügbar",
  "common.live": "Live",
  "common.on": "Ein",
  "common.off": "Aus",
  "common.offline": "Offline",
  "common.setup": "Einrichtung",
  "tele.promptExistingDefault": "Schreibe dies mit einem anderen Ton, einer anderen Persönlichkeit und einem anderen visuellen Stil in etwa 200 Wörtern um.",
  "tele.pinned": "Fenster angeheftet",
  "tele.unpinned": "Fenster frei verschiebbar",
  "tele.clickthroughEnabled": "Klickdurch-Modus aktiviert",
  "tele.clickthroughDisabled": "Klickdurch-Modus deaktiviert",
  "doc.remoteInboxTitle": "Flow Benachrichtigungen",
  "settings.privacy": "Datenschutz und System",
  "settings.desktopBehavior": "Desktop-Verhalten",
  "settings.hideFromCapture": "In Bildschirmaufnahmen unsichtbar",
  "settings.hideFromCaptureHelp": "Hält Flow auf unterstützten Windows-Systemen aus Screenshots und Bildschirmaufzeichnungen heraus.",
  "settings.systemTray": "Systemtray-Symbol verwenden",
  "settings.systemTrayHelp": "Wenn aktiviert, wird Flow aus der Taskleiste ausgeblendet und bleibt über das Systemtray erreichbar. Wenn deaktiviert, erscheint Flow in der Taskleiste.",
  "settings.preventSleep": "Ruhezustand verhindern",
  "settings.preventSleepHelp": "Hält Bildschirm und System wach, während Flow läuft.",
  "settings.usability": "Bedienung",
  "settings.shortcuts": "Tastenkürzel",
  "settings.clickthroughShortcut": "Klickdurch-Modus-Kürzel",
  "settings.clickthroughShortcutHelp": "Ermöglicht das Umschalten des Klickdurch-Modus mit Ctrl + Shift + X.",
  "settings.shortcutPlayStop": "Start / Stopp",
  "settings.shortcutReset": "Zum Anfang zurücksetzen",
  "settings.shortcutBackward": "Zurück scrollen",
  "settings.shortcutSpeed": "Während der Wiedergabe langsamer / schneller",
  "settings.shortcutPause": "Pause / Fortsetzen",
  "settings.shortcutPlayStopValue": "P",
  "settings.shortcutResetValue": "R",
  "settings.shortcutBackwardValue": "Page Up",
  "settings.shortcutSpeedValue": "← / →",
  "settings.shortcutPauseValue": "Leertaste",
  "settings.remoteInjection": "Remote-Einspeisung",
  "settings.remoteSession": "Live-Empfängersitzung",
  "settings.remoteTransport": "Remote-Transport",
  "settings.remoteTransport.local": "Lokales Relay",
  "settings.remoteTransport.cloud": "Cloud-Relay",
  "settings.remoteCloudHelp": "Das Cloud-Relay verwendet die aktive UUID und das generierte Zugriffspasswort. Sender öffnen die Cloud-Senderseite, und das Relay prüft, ob die UUID aktiv ist und das Zugriffspasswort stimmt.",
  "settings.remoteUuid": "Aktive UUID",
  "settings.remoteAccessPassword": "Zugriffspasswort",
  "settings.remoteSenderPage": "Senderseite",
  "settings.remoteSenderQr": "QR für Schnellverbindung",
  "settings.remoteSenderQrHelp": "Scanne, um die Senderseite mit bereits eingetragener UUID und Zugriffspasswort zu öffnen.",
  "settings.remoteSenderQrPending": "Öffne den Teleprompter, damit Flow vor dem Scannen eine aktive UUID und ein Zugriffspasswort veröffentlichen kann.",
  "settings.remoteSenderQrUnavailable": "Der QR-Code ist nicht verfügbar, bis die Cloud-Senderseite konfiguriert ist.",
  "settings.remoteStatusWaiting": "Warte auf Relay-Status.",
  "settings.remotePublicHost": "Öffentlicher Host / Domain",
  "settings.remotePublicHostPlaceholder": "Beispiel: flow.example.com oder 82.14.25.90",
  "settings.remoteLocalHelp": "Für das lokale Relay benötigt der Sender deine öffentliche Adresse, die UUID und das oben generierte Zugriffspasswort.",
  "settings.copyNothing": "Es ist noch nichts zum Kopieren verfügbar.",
  "settings.copyFailed": "Kopieren fehlgeschlagen. Du kannst den Wert trotzdem manuell markieren.",
  "settings.copiedUuid": "UUID kopiert.",
  "settings.copiedAccessPassword": "Zugriffspasswort kopiert.",
  "settings.copiedSenderLink": "Sender-Link kopiert.",
  "settings.remoteStatusUnavailable": "Der Relay-Status ist im Moment nicht verfügbar.",
  "settings.remoteStatusListeningPublic": "Das Relay lauscht auf Port {port}. Der kopierte Sender-Link verwendet deinen konfigurierten öffentlichen Host.",
  "settings.remoteStatusListeningLocal": "Das Relay lauscht auf Port {port}. Füge unten einen öffentlichen Host oder eine Domain hinzu, wenn der kopierte Link auch außerhalb deines lokalen Netzwerks funktionieren soll.",
  "settings.remoteStatusPasswordMissing": "Das Zugriffspasswort fehlt. Starte Flow neu, um ein neues zu erzeugen.",
  "settings.remoteStatusHeartbeatStale": "Der Empfänger-Heartbeat ist veraltet. Öffne das Teleprompter-Fenster, um die Live-Sitzung wiederherzustellen.",
  "settings.remoteSenderUnavailable": "Cloud-Sender nicht verfügbar",
  "settings.remoteStatusCloudNeedsBuild": "Das Cloud-Relay ist im App-Build noch nicht konfiguriert. Lege die URL einmal in src/remote-config.js fest.",
  "settings.remoteStatusCloudRegister": "Das Cloud-Relay ist konfiguriert. Öffne das Teleprompter-Fenster, um Heartbeats zu starten und diesen Empfänger zu registrieren.",
  "settings.remoteStatusCloudActive": "Das Cloud-Relay ist aktiv. Sender benötigen die UUID und das generierte Zugriffspasswort.",
  "settings.remoteStatusCloudOffline": "Das Cloud-Relay kennt diesen Empfänger, aber er ist derzeit offline. Lass Flow geöffnet, um Nachrichten zu empfangen.",
  "remote.importance.normal": "NORMAL",
  "remote.importance.important": "WICHTIG",
  "remote.cardHint": "Doppelklicken zum Einfügen · mit × ablehnen",
  "remote.rejectAria": "Remote-Nachricht ablehnen",
  "remote.fetchFailed": "Cloud-Nachrichten konnten nicht geladen werden.",
  "remote.resolveFailed": "Cloud-Nachricht konnte nicht verarbeitet werden.",
  "input.importButton": "Datei importieren",
  "input.importHelp": "Lege eine TXT-, DOCX- oder PDF-Datei im Editor ab oder wähle eine von deinem Gerät aus.",
  "input.importing": "{name} wird importiert...",
  "input.imported": "Text aus {name} geladen.",
  "input.importUnsupported": "Dieser Dateityp wird nicht unterstützt. Verwende TXT, DOCX, PDF oder eine andere lesbare Textdatei.",
  "input.importFailed": "Diese Datei konnte nicht gelesen werden.",
  "remote.acceptedAppending": "Remote-Nachricht akzeptiert. Text wird angehängt…",
  "remote.denied": "Remote-Nachricht abgelehnt.",
  "remote.heartbeatFailed": "Cloud-Heartbeat mit Status {status} fehlgeschlagen."
});

Object.assign(UI_STRINGS.en, {
  "language.fr": "French",
  "language.es": "Spanish",
  "common.relaxed": "Relaxed",
  "common.standard": "Standard",
  "common.polished": "Polished",
  "common.natural": "Natural",
  "common.confident": "Confident",
  "common.friendly": "Friendly",
  "common.professional": "Professional",
  "common.persuasive": "Persuasive",
  "common.firstPerson": "First person",
  "common.thirdPerson": "Third person",
  "common.appLanguage": "App language",
  "common.aggressive": "Aggressive",
  "input.groqImportButton": "Import file to Groq",
  "input.groqImportClear": "Remove file",
  "input.groqImportHelp": "Attach a TXT, DOCX, PDF, or other readable text file for Groq to work from.",
  "input.groqImporting": "Preparing {name} for Groq...",
  "input.groqImportAttached": "{name} is attached. Groq will use it as the source text instead of the editor content.",
  "input.groqImportFailed": "Could not read that file for Groq.",
  "input.assistantHelp": "Saved preferences shape every Groq request, while your instruction stays the task-specific command.",
  "input.profileTitle": "Writing profile",
  "input.profileHelp": "These preferences bias tone and delivery, but your instruction still wins when it conflicts.",
  "input.personality": "Personality",
  "input.personality.natural": "Natural",
  "input.personality.confident": "Confident",
  "input.personality.friendly": "Friendly",
  "input.personality.professional": "Professional",
  "input.personality.persuasive": "Persuasive",
  "input.grammarLevel": "Grammar level",
  "input.grammarLevel.relaxed": "Relaxed",
  "input.grammarLevel.standard": "Standard",
  "input.grammarLevel.polished": "Polished",
  "input.userContext": "Context about you",
  "input.userContextPlaceholder": "Example: I am a medical student, I speak fast when nervous, and I want the script to sound calm and credible.",
  "input.emojiUsage": "Emoji usage",
  "input.academicWordUsage": "Academic words",
  "input.academicWordUsage.off": "Off",
  "input.academicWordUsage.on": "On",
  "input.academicWordUsage.aggressive": "Aggressive",
  "input.pointOfView": "Speech point of view",
  "input.pointOfView.firstPerson": "First person (I / me)",
  "input.pointOfView.thirdPerson": "Third person",
  "input.outputLanguage": "Output language",
  "input.outputLanguage.app": "App language",
  "input.preferencesSaved": "Groq preferences saved locally.",
  "input.contextHint": "Add background about your role, audience, goals, or how you want to sound.",
  "input.outputLanguageHint": "Choose the language Groq should use for the final script."
});

Object.assign(UI_STRINGS.tr, {
  "language.fr": "Fransızca",
  "language.es": "İspanyolca",
  "common.relaxed": "Rahat",
  "common.standard": "Standart",
  "common.polished": "Cilalı",
  "common.natural": "Doğal",
  "common.confident": "Kendinden emin",
  "common.friendly": "Samimi",
  "common.professional": "Profesyonel",
  "common.persuasive": "İkna edici",
  "common.firstPerson": "Birinci kişi",
  "common.thirdPerson": "Üçüncü kişi",
  "common.appLanguage": "Uygulama dili",
  "common.aggressive": "Agresif",
  "input.groqImportButton": "Dosyayı Groq'a aktar",
  "input.groqImportClear": "Dosyayı kaldır",
  "input.groqImportHelp": "Groq'un kullanması için bir TXT, DOCX, PDF veya okunabilir başka bir metin dosyası ekleyin.",
  "input.groqImporting": "{name} Groq için hazırlanıyor...",
  "input.groqImportAttached": "{name} eklendi. Groq bunu düzenleyici içeriği yerine kaynak metin olarak kullanacak.",
  "input.groqImportFailed": "Bu dosya Groq için okunamadı.",
  "input.assistantHelp": "Kaydedilen tercihler her Groq isteğini şekillendirir, talimatınız ise göreve özel komut olarak kalır.",
  "input.profileTitle": "Yazım profili",
  "input.profileHelp": "Bu tercihler tonu ve akışı yönlendirir, ancak çakışma olursa talimatınız baskın gelir.",
  "input.personality": "Kişilik",
  "input.personality.natural": "Doğal",
  "input.personality.confident": "Kendinden emin",
  "input.personality.friendly": "Samimi",
  "input.personality.professional": "Profesyonel",
  "input.personality.persuasive": "İkna edici",
  "input.grammarLevel": "Dilbilgisi seviyesi",
  "input.grammarLevel.relaxed": "Rahat",
  "input.grammarLevel.standard": "Standart",
  "input.grammarLevel.polished": "Cilalı",
  "input.userContext": "Sizin hakkınızda bağlam",
  "input.userContextPlaceholder": "Örnek: Tıp öğrencisiyim, heyecanlanınca hızlı konuşuyorum ve metnin sakin ama güvenilir duyulmasını istiyorum.",
  "input.emojiUsage": "Emoji kullanımı",
  "input.academicWordUsage": "Akademik kelimeler",
  "input.academicWordUsage.off": "Kapalı",
  "input.academicWordUsage.on": "Açık",
  "input.academicWordUsage.aggressive": "Agresif",
  "input.pointOfView": "Konuşma bakış açısı",
  "input.pointOfView.firstPerson": "Birinci kişi (ben)",
  "input.pointOfView.thirdPerson": "Üçüncü kişi",
  "input.outputLanguage": "Çıktı dili",
  "input.outputLanguage.app": "Uygulama dili",
  "input.preferencesSaved": "Groq tercihleri yerel olarak kaydedildi.",
  "input.contextHint": "Rolünüz, kitleniz, hedefiniz veya nasıl duyulmak istediğiniz hakkında bilgi ekleyin.",
  "input.outputLanguageHint": "Groq'un son metni hangi dilde yazacağını seçin."
});

Object.assign(UI_STRINGS.ar, {
  "language.fr": "الفرنسية",
  "language.es": "الإسبانية",
  "common.relaxed": "مرن",
  "common.standard": "قياسي",
  "common.polished": "مصقول",
  "common.natural": "طبيعي",
  "common.confident": "واثق",
  "common.friendly": "ودود",
  "common.professional": "احترافي",
  "common.persuasive": "إقناعي",
  "common.firstPerson": "المتكلم",
  "common.thirdPerson": "الغائب",
  "common.appLanguage": "لغة التطبيق",
  "common.aggressive": "مكثف",
  "input.groqImportButton": "استيراد ملف إلى Groq",
  "input.groqImportClear": "إزالة الملف",
  "input.groqImportHelp": "أرفق ملف TXT أو DOCX أو PDF أو أي ملف نصي قابل للقراءة ليستخدمه Groq.",
  "input.groqImporting": "جارٍ تجهيز {name} لـ Groq...",
  "input.groqImportAttached": "تم إرفاق {name}. سيستخدمه Groq كنص المصدر بدلًا من محتوى المحرر.",
  "input.groqImportFailed": "تعذر قراءة هذا الملف لاستخدامه مع Groq.",
  "input.assistantHelp": "تؤثر التفضيلات المحفوظة في كل طلب Groq، بينما تبقى تعليماتك هي الأمر الخاص بالمهمة.",
  "input.profileTitle": "ملف أسلوب الكتابة",
  "input.profileHelp": "توجّه هذه التفضيلات النبرة والإلقاء، لكن تعليماتك تظل المرجع عند التعارض.",
  "input.personality": "الشخصية",
  "input.personality.natural": "طبيعية",
  "input.personality.confident": "واثقة",
  "input.personality.friendly": "ودودة",
  "input.personality.professional": "احترافية",
  "input.personality.persuasive": "إقناعية",
  "input.grammarLevel": "مستوى القواعد",
  "input.grammarLevel.relaxed": "مرن",
  "input.grammarLevel.standard": "قياسي",
  "input.grammarLevel.polished": "مصقول",
  "input.userContext": "معلومات عنك",
  "input.userContextPlaceholder": "مثال: أنا طالب طب، أتكلم بسرعة عندما أتوتر، وأريد أن يبدو النص هادئًا وموثوقًا.",
  "input.emojiUsage": "استخدام الإيموجي",
  "input.academicWordUsage": "المفردات الأكاديمية",
  "input.academicWordUsage.off": "إيقاف",
  "input.academicWordUsage.on": "تشغيل",
  "input.academicWordUsage.aggressive": "مكثف",
  "input.pointOfView": "وجهة النظر في الخطاب",
  "input.pointOfView.firstPerson": "المتكلم (أنا)",
  "input.pointOfView.thirdPerson": "الغائب",
  "input.outputLanguage": "لغة المخرجات",
  "input.outputLanguage.app": "لغة التطبيق",
  "input.preferencesSaved": "تم حفظ تفضيلات Groq محليًا.",
  "input.contextHint": "أضف خلفية عن دورك أو جمهورك أو أهدافك أو كيف تريد أن يبدو صوتك.",
  "input.outputLanguageHint": "اختر اللغة التي يجب أن يستخدمها Groq في النص النهائي."
});

Object.assign(UI_STRINGS.de, {
  "language.fr": "Französisch",
  "language.es": "Spanisch",
  "common.relaxed": "Locker",
  "common.standard": "Standard",
  "common.polished": "Ausgefeilt",
  "common.natural": "Natürlich",
  "common.confident": "Selbstbewusst",
  "common.friendly": "Freundlich",
  "common.professional": "Professionell",
  "common.persuasive": "Überzeugend",
  "common.firstPerson": "Ich-Perspektive",
  "common.thirdPerson": "Dritte Person",
  "common.appLanguage": "App-Sprache",
  "common.aggressive": "Aggressiv",
  "input.groqImportButton": "Datei zu Groq importieren",
  "input.groqImportClear": "Datei entfernen",
  "input.groqImportHelp": "Hänge eine TXT-, DOCX-, PDF- oder andere lesbare Textdatei an, mit der Groq arbeiten soll.",
  "input.groqImporting": "{name} wird für Groq vorbereitet...",
  "input.groqImportAttached": "{name} ist angehängt. Groq verwendet sie als Quelltext statt des Editorinhalts.",
  "input.groqImportFailed": "Diese Datei konnte für Groq nicht gelesen werden.",
  "input.assistantHelp": "Gespeicherte Präferenzen formen jede Groq-Anfrage, während deine Anweisung der aufgabenspezifische Befehl bleibt.",
  "input.profileTitle": "Schreibprofil",
  "input.profileHelp": "Diese Präferenzen lenken Ton und Vortrag, aber deine Anweisung hat im Konfliktfall Vorrang.",
  "input.personality": "Persönlichkeit",
  "input.personality.natural": "Natürlich",
  "input.personality.confident": "Selbstbewusst",
  "input.personality.friendly": "Freundlich",
  "input.personality.professional": "Professionell",
  "input.personality.persuasive": "Überzeugend",
  "input.grammarLevel": "Grammatikniveau",
  "input.grammarLevel.relaxed": "Locker",
  "input.grammarLevel.standard": "Standard",
  "input.grammarLevel.polished": "Ausgefeilt",
  "input.userContext": "Kontext über dich",
  "input.userContextPlaceholder": "Beispiel: Ich studiere Medizin, spreche unter Stress schnell und möchte ruhig und glaubwürdig klingen.",
  "input.emojiUsage": "Emoji-Nutzung",
  "input.academicWordUsage": "Akademische Wörter",
  "input.academicWordUsage.off": "Aus",
  "input.academicWordUsage.on": "Ein",
  "input.academicWordUsage.aggressive": "Aggressiv",
  "input.pointOfView": "Sprechperspektive",
  "input.pointOfView.firstPerson": "Ich-Perspektive (ich / mir)",
  "input.pointOfView.thirdPerson": "Dritte Person",
  "input.outputLanguage": "Ausgabesprache",
  "input.outputLanguage.app": "App-Sprache",
  "input.preferencesSaved": "Groq-Präferenzen lokal gespeichert.",
  "input.contextHint": "Füge Hintergrund zu Rolle, Publikum, Zielen oder gewünschter Wirkung hinzu.",
  "input.outputLanguageHint": "Wähle die Sprache, die Groq für den finalen Text verwenden soll."
});

Object.assign(UI_STRINGS.tr, {
  "tele.updaterChecking": "Flow güncellemeleri denetleniyor...",
  "tele.updaterInstalling": "Flow {version} yükleniyor...",
  "tele.updaterDownloading": "Flow {version} indiriliyor: {progress}%",
  "tele.updaterFailed": "Güncelleyici başarısız oldu: {error}",
  "tele.updaterCurrent": "Flow zaten güncel.",
  "settings.section.soundInput": "Ses girişi ayarları",
  "settings.section.updates": "Güncellemeler",
  "settings.soundInput": "Ses girişi",
  "settings.soundInputTitle": "Ses girişi ayarları",
  "settings.soundInputMonitoring": "İzleme",
  "settings.soundInputDevice": "Giriş cihazı",
  "settings.soundInputDeviceHelp": "Ses takibi ve uygulama genelindeki Flow komutları için kullanılan mikrofonu seçin.",
  "settings.soundInputDeviceDefault": "Sistem varsayılanı",
  "settings.soundInputDeviceUnavailable": "Daha önce seçilen mikrofon kullanılamıyor",
  "settings.soundInputDeviceUnnamed": "Mikrofon",
  "settings.soundInputLevel": "Seviye",
  "settings.soundInputCleanup": "Temizleme",
  "settings.soundInputRecommended": "Önerileni kullan",
  "settings.soundInputRecommendedApplied": "Önerilen ses girişi değerleri uygulandı.",
  "settings.soundInputNoiseGate": "Gürültü eşiği",
  "settings.soundInputNoiseGateHelp": "Flow sesi ses takibine göndermeden önce düşük seviyeli ortam gürültüsünü keser.",
  "settings.soundInputGain": "Giriş kazancı",
  "settings.soundInputGainHelp": "Seçili mikrofonu Vosk tanıyıcısı işlemeden önce güçlendirir.",
  "settings.soundInputPreviewIdle": "Mikrofon seviyenizi önizlemek için bu bölümü açın.",
  "settings.soundInputPreviewReady": "Seçilen mikrofon izleniyor.",
  "settings.soundInputPreviewUnavailable": "Mikrofon önizlemesi burada kullanılamıyor.",
  "settings.soundInputPermissionDenied": "Mikrofon önizlemesi engellendi. Canlı seviyeyi görmek için mikrofon erişimine izin verin.",
  "settings.soundInputNoDevices": "Mikrofon aygıtı bulunamadı.",
  "settings.updates": "Güncellemeler",
  "settings.updaterTitle": "Uygulama güncellemeleri",
  "settings.updaterChannelTitle": "Yüklü sürüm",
  "settings.updaterCurrentVersion": "Geçerli sürüm",
  "settings.updaterAvailableVersion": "Kullanılabilir sürüm",
  "settings.updaterPublishedAt": "Yayınlandı",
  "settings.updaterNotChecked": "Henüz denetlenmedi",
  "settings.updaterNoDate": "Henüz yayımlanmadı",
  "settings.updaterStatusIdle": "Hazır",
  "settings.updaterStatusChecking": "Denetleniyor",
  "settings.updaterStatusAvailable": "Güncelleme hazır",
  "settings.updaterStatusCurrent": "Güncel",
  "settings.updaterStatusInstalling": "Yükleniyor",
  "settings.updaterStatusError": "Akış hatası",
  "settings.updaterStatusUnavailable": "Kullanılamıyor",
  "settings.updaterIdle": "Flow imzalı yayın akışını denetler ve siz tetiklediğinizde güncellemeleri kurar.",
  "settings.updaterChecking": "Yapılandırılan yayın akışında güncellemeler denetleniyor.",
  "settings.updaterCurrent": "Flow {version}, güncelleme akışında yayımlanan en yeni sürüm zaten.",
  "settings.updaterAvailable": "Flow {version} kullanılabilir ve kurulmaya hazır.",
  "settings.updaterInstalling": "Flow {version} indiriliyor ve kuruluyor. Kurulum başladığında uygulama kapanabilir.",
  "settings.updaterInstallingWindow": "Flow {version} indiriliyor. Kurulum başladığında uygulama kapanabilir.",
  "settings.updaterFailed": "Flow yapılandırılan güncelleme akışını okuyamadı: {error}",
  "settings.updaterFeedUnavailable": "Yapılandırılan güncelleme akışı şu anda kullanılamıyor. Yeniden test etmeden önce latest.json dosyasını ve imzalı yükleyiciyi yayımlayın.",
  "settings.updaterUnavailable": "Güncelleyici API'si bu pencerede kullanılamıyor.",
  "settings.updaterNoNotes": "Bir güncelleme bulunduğunda sürüm notları burada görünür.",
  "settings.updaterCheckAction": "Denetle ve güncelle",
  "settings.updaterCheckingAction": "Denetleniyor…",
  "settings.updaterInstallAction": "Güncellemeyi yükle",
  "settings.updaterInstallingAction": "Yükleniyor…",
  "settings.updaterProgressIdle": "Başlamak için bekleniyor",
  "settings.updaterProgressStats": "{downloaded} / {total}",
  "settings.updaterInstallFailed": "Güncelleme kurulumu başarısız oldu: {error}"
});

Object.assign(UI_STRINGS.ar, {
  "tele.updaterChecking": "جارٍ التحقق من تحديثات Flow...",
  "tele.updaterInstalling": "جارٍ تثبيت Flow {version}...",
  "tele.updaterDownloading": "جارٍ تنزيل Flow {version}: {progress}%",
  "tele.updaterFailed": "فشل المُحدِّث: {error}",
  "tele.updaterCurrent": "Flow مُحدَّث بالفعل.",
  "settings.section.soundInput": "إعدادات إدخال الصوت",
  "settings.section.updates": "التحديثات",
  "settings.soundInput": "إدخال الصوت",
  "settings.soundInputTitle": "إعدادات إدخال الصوت",
  "settings.soundInputMonitoring": "المراقبة",
  "settings.soundInputDevice": "جهاز الإدخال",
  "settings.soundInputDeviceHelp": "اختر الميكروفون المستخدم لتتبع الصوت وأوامر Flow العامة على مستوى التطبيق.",
  "settings.soundInputDeviceDefault": "افتراضي النظام",
  "settings.soundInputDeviceUnavailable": "الميكروفون المحدد سابقًا غير متاح",
  "settings.soundInputDeviceUnnamed": "ميكروفون",
  "settings.soundInputLevel": "المستوى",
  "settings.soundInputCleanup": "تنقية",
  "settings.soundInputRecommended": "استخدام الموصى به",
  "settings.soundInputRecommendedApplied": "تم تطبيق قيم إدخال الصوت الموصى بها.",
  "settings.soundInputNoiseGate": "بوابة الضوضاء",
  "settings.soundInputNoiseGateHelp": "تزيل ضوضاء الغرفة منخفضة المستوى قبل أن يرسل Flow الصوت إلى تتبع الصوت.",
  "settings.soundInputGain": "كسب الإدخال",
  "settings.soundInputGainHelp": "يعزز الميكروفون المحدد قبل أن يعالجه محرك Vosk.",
  "settings.soundInputPreviewIdle": "افتح هذا القسم لمعاينة مستوى الميكروفون.",
  "settings.soundInputPreviewReady": "تتم مراقبة الميكروفون المحدد.",
  "settings.soundInputPreviewUnavailable": "معاينة الميكروفون غير متاحة هنا.",
  "settings.soundInputPermissionDenied": "تم حظر معاينة الميكروفون. اسمح بالوصول إلى الميكروفون لرؤية المستوى المباشر.",
  "settings.soundInputNoDevices": "لم يتم العثور على أجهزة ميكروفون.",
  "settings.updates": "التحديثات",
  "settings.updaterTitle": "تحديثات التطبيق",
  "settings.updaterChannelTitle": "الإصدار المثبت",
  "settings.updaterCurrentVersion": "الإصدار الحالي",
  "settings.updaterAvailableVersion": "الإصدار المتاح",
  "settings.updaterPublishedAt": "تاريخ النشر",
  "settings.updaterNotChecked": "لم يتم التحقق بعد",
  "settings.updaterNoDate": "لم يُنشر بعد",
  "settings.updaterStatusIdle": "جاهز",
  "settings.updaterStatusChecking": "جارٍ التحقق",
  "settings.updaterStatusAvailable": "التحديث جاهز",
  "settings.updaterStatusCurrent": "حالي",
  "settings.updaterStatusInstalling": "جارٍ التثبيت",
  "settings.updaterStatusError": "خطأ في المصدر",
  "settings.updaterStatusUnavailable": "غير متاح",
  "settings.updaterIdle": "يتحقق Flow من موجز الإصدارات الموقّع ويثبت التحديثات عندما تقوم بتشغيله.",
  "settings.updaterChecking": "جارٍ التحقق من موجز الإصدارات المكوَّن بحثًا عن تحديثات.",
  "settings.updaterCurrent": "الإصدار Flow {version} هو بالفعل أحدث إصدار منشور في موجز التحديث.",
  "settings.updaterAvailable": "الإصدار Flow {version} متاح وجاهز للتثبيت.",
  "settings.updaterInstalling": "جارٍ تنزيل وتثبيت Flow {version}. قد يُغلق التطبيق عند بدء برنامج التثبيت.",
  "settings.updaterInstallingWindow": "جارٍ تنزيل Flow {version}. قد يُغلق التطبيق عند بدء برنامج التثبيت.",
  "settings.updaterFailed": "تعذر على Flow قراءة موجز التحديث المكوَّن: {error}",
  "settings.updaterFeedUnavailable": "موجز التحديث المكوَّن غير متاح الآن. انشر latest.json والمثبّت الموقّع قبل الاختبار مرة أخرى.",
  "settings.updaterUnavailable": "واجهة برمجة المُحدِّث غير متاحة في هذه النافذة.",
  "settings.updaterNoNotes": "ستظهر ملاحظات الإصدار هنا عند العثور على تحديث.",
  "settings.updaterCheckAction": "تحقق وحدّث",
  "settings.updaterCheckingAction": "جارٍ التحقق…",
  "settings.updaterInstallAction": "تثبيت التحديث",
  "settings.updaterInstallingAction": "جارٍ التثبيت…",
  "settings.updaterProgressIdle": "بانتظار البدء",
  "settings.updaterProgressStats": "{downloaded} من {total}",
  "settings.updaterInstallFailed": "فشل تثبيت التحديث: {error}"
});

Object.assign(UI_STRINGS.de, {
  "tele.updaterChecking": "Flow-Updates werden geprüft...",
  "tele.updaterInstalling": "Flow {version} wird installiert...",
  "tele.updaterDownloading": "Flow {version} wird heruntergeladen: {progress}%",
  "tele.updaterFailed": "Updater fehlgeschlagen: {error}",
  "tele.updaterCurrent": "Flow ist bereits auf dem neuesten Stand.",
  "settings.section.soundInput": "Audioeingabe",
  "settings.section.updates": "Updates",
  "settings.soundInput": "Audioeingabe",
  "settings.soundInputTitle": "Audioeingabe-Einstellungen",
  "settings.soundInputMonitoring": "Überwachung",
  "settings.soundInputDevice": "Eingabegerät",
  "settings.soundInputDeviceHelp": "Wähle das Mikrofon aus, das für Sprachverfolgung und app-weite Flow-Befehle verwendet wird.",
  "settings.soundInputDeviceDefault": "Systemstandard",
  "settings.soundInputDeviceUnavailable": "Das zuvor gewählte Mikrofon ist nicht verfügbar",
  "settings.soundInputDeviceUnnamed": "Mikrofon",
  "settings.soundInputLevel": "Pegel",
  "settings.soundInputCleanup": "Bereinigung",
  "settings.soundInputRecommended": "Empfohlenes verwenden",
  "settings.soundInputRecommendedApplied": "Empfohlene Werte für die Audioeingabe wurden übernommen.",
  "settings.soundInputNoiseGate": "Noise Gate",
  "settings.soundInputNoiseGateHelp": "Filtert leise Raumgeräusche heraus, bevor Flow Audio an die Sprachverfolgung sendet.",
  "settings.soundInputGain": "Eingangsverstärkung",
  "settings.soundInputGainHelp": "Verstärkt das ausgewählte Mikrofon, bevor der Vosk-Erkenner es verarbeitet.",
  "settings.soundInputPreviewIdle": "Öffne diesen Bereich, um den Mikrofonpegel zu sehen.",
  "settings.soundInputPreviewReady": "Das ausgewählte Mikrofon wird überwacht.",
  "settings.soundInputPreviewUnavailable": "Die Mikrofonvorschau ist hier nicht verfügbar.",
  "settings.soundInputPermissionDenied": "Die Mikrofonvorschau ist blockiert. Erlaube den Mikrofonzugriff, um den Live-Pegel zu sehen.",
  "settings.soundInputNoDevices": "Es wurden keine Mikrofone gefunden.",
  "settings.updates": "Updates",
  "settings.updaterTitle": "App-Updates",
  "settings.updaterChannelTitle": "Installierter Build",
  "settings.updaterCurrentVersion": "Aktuelle Version",
  "settings.updaterAvailableVersion": "Verfügbare Version",
  "settings.updaterPublishedAt": "Veröffentlicht",
  "settings.updaterNotChecked": "Noch nicht geprüft",
  "settings.updaterNoDate": "Noch nicht veröffentlicht",
  "settings.updaterStatusIdle": "Bereit",
  "settings.updaterStatusChecking": "Prüft",
  "settings.updaterStatusAvailable": "Update bereit",
  "settings.updaterStatusCurrent": "Aktuell",
  "settings.updaterStatusInstalling": "Installiert",
  "settings.updaterStatusError": "Feed-Fehler",
  "settings.updaterStatusUnavailable": "Nicht verfügbar",
  "settings.updaterIdle": "Flow prüft den signierten Release-Feed und installiert Updates, wenn du es auslöst.",
  "settings.updaterChecking": "Der konfigurierte Release-Feed wird auf Updates geprüft.",
  "settings.updaterCurrent": "Flow {version} ist bereits die neueste im Update-Feed veröffentlichte Version.",
  "settings.updaterAvailable": "Flow {version} ist verfügbar und bereit zur Installation.",
  "settings.updaterInstalling": "Flow {version} wird heruntergeladen und installiert. Die App kann sich schließen, sobald das Setup startet.",
  "settings.updaterInstallingWindow": "Flow {version} wird heruntergeladen. Die App kann sich schließen, sobald das Setup startet.",
  "settings.updaterFailed": "Flow konnte den konfigurierten Update-Feed nicht lesen: {error}",
  "settings.updaterFeedUnavailable": "Der konfigurierte Update-Feed ist derzeit nicht verfügbar. Veröffentliche latest.json und das signierte Installationsprogramm, bevor du erneut testest.",
  "settings.updaterUnavailable": "Die Updater-API ist in diesem Fenster nicht verfügbar.",
  "settings.updaterNoNotes": "Versionshinweise erscheinen hier, sobald ein Update gefunden wird.",
  "settings.updaterCheckAction": "Prüfen und aktualisieren",
  "settings.updaterCheckingAction": "Prüft…",
  "settings.updaterInstallAction": "Update installieren",
  "settings.updaterInstallingAction": "Installiert…",
  "settings.updaterProgressIdle": "Wartet auf Start",
  "settings.updaterProgressStats": "{downloaded} von {total}",
  "settings.updaterInstallFailed": "Update-Installation fehlgeschlagen: {error}"
});

UI_STRINGS.fr = {
  ...UI_STRINGS.en,
  "doc.settingsTitle": "Flow · Paramètres",
  "doc.textTitle": "Flow · Texte",
  "doc.aboutTitle": "Flow · À propos",
  "common.settings": "Paramètres",
  "common.text": "Texte",
  "common.close": "Fermer",
  "common.on": "Activé",
  "common.off": "Désactivé",
  "common.language": "Langue",
  "common.copy": "Copier",
  "common.copyLink": "Copier le lien",
  "common.loading": "Chargement…",
  "common.unavailable": "Indisponible",
  "common.live": "En direct",
  "common.offline": "Hors ligne",
  "common.setup": "Configuration",
  "common.relaxed": "Souple",
  "common.standard": "Standard",
  "common.polished": "Soigné",
  "common.natural": "Naturel",
  "common.confident": "Sûr de soi",
  "common.friendly": "Chaleureux",
  "common.professional": "Professionnel",
  "common.persuasive": "Persuasif",
  "common.firstPerson": "Première personne",
  "common.thirdPerson": "Troisième personne",
  "common.appLanguage": "Langue de l'application",
  "common.aggressive": "Agressif",
  "language.en": "Anglais",
  "language.tr": "Turc",
  "language.ar": "Arabe",
  "language.de": "Allemand",
  "language.fr": "Français",
  "language.es": "Espagnol",
  "settings.kicker": "Paramètres",
  "settings.title": "Contrôles en direct",
  "settings.section": "Section",
  "settings.sectionTitle": "Parcourir les paramètres",
  "settings.section.remote": "À distance",
  "settings.section.positioning": "Position",
  "settings.section.appearance": "Apparence",
  "settings.section.privacy": "Confidentialité et système",
  "settings.section.usability": "Ergonomie",
  "settings.x": "X",
  "settings.y": "Y",
  "settings.topCenter": "Haut centré",
  "settings.center": "Centre",
  "settings.custom": "x / y personnalisés",
  "settings.drag": "Glisser librement",
  "settings.appearance": "Apparence",
  "settings.appearanceTitle": "Typographie et visuels",
  "settings.sizeAndPlayback": "Taille et style de lecture",
  "settings.group.windowSize": "Taille de la fenêtre",
  "settings.group.playback": "Lecture",
  "settings.group.typography": "Typographie",
  "settings.group.visuals": "Visuel",
  "settings.font": "Police",
  "settings.textSize": "Taille du texte",
  "settings.width": "Largeur",
  "settings.height": "Hauteur",
  "settings.animationStyle": "Mode de défilement",
  "settings.mode.highlight": "Mode surlignage",
  "settings.mode.scroll": "Mode de défilement normal",
  "settings.mode.line": "Surlignage ligne par ligne",
  "settings.mode.arrow": "Mode flèche",
  "settings.mode.voice": "Suivi vocal",
  "settings.voiceTrackingStyle": "Style du suivi vocal",
  "settings.voiceTrackingStyleHelp": "Choisissez comment la position détectée est affichée pendant que vous parlez.",
  "settings.voiceConfidence": "Niveau de confiance",
  "settings.voiceConfidenceHelp": "Des valeurs plus élevées rendent Flow plus strict avec les correspondances vocales peu fiables.",
  "settings.voiceConfidenceSkips": "Si Flow saute des mots ou avance trop loin, augmentez cette valeur.",
  "settings.voiceConfidenceStalls": "S'il ne bouge pas du tout alors que vous lisez clairement, baissez cette valeur.",
  "settings.voiceStyle.highlight": "Mise en évidence du mot",
  "settings.voiceStyle.line": "Mise en évidence de la ligne",
  "settings.voiceStyle.plain": "Texte brut",
  "settings.appWideVoiceCommands": "Commandes vocales Flow à l'échelle de l'application",
  "settings.appWideVoiceCommandsHelp": "Permet à des commandes vocales anglaises comme 'Hey Flow pause' ou 'Hey Flow down' de fonctionner aussi en dehors du suivi vocal. Cette fonction reste instable et peut ne pas fonctionner de manière fiable.",
  "settings.voiceModelChecking": "Vérification du modèle…",
  "settings.voiceModelCheckingHelp": "Flow vérifie si le modèle Vosk sélectionné est déjà enregistré localement.",
  "settings.voiceModelPathPending": "Vérification du chemin du modèle local…",
  "settings.voiceModelProgressIdle": "En attente du téléchargement",
  "settings.voiceModelProgressStats": "{remaining} restants · {speed}",
  "settings.voiceModelInstalled": "Installé ✓",
  "settings.voiceModelInstalledHelp": "Ce modèle Vosk est prêt. Flow l'utilisera pour le suivi vocal et les commandes globales.",
  "settings.voiceModelMissing": "Modèle requis",
  "settings.voiceModelMissingHelp": "Cette langue n'est pas encore installée. Téléchargez le modèle Vosk avant de l'utiliser pour les commandes ou le suivi vocal.",
  "settings.voiceModelDownloading": "Téléchargement…",
  "settings.voiceModelDownloadingHelp": "Le modèle Vosk sélectionné est en cours de téléchargement. Gardez cette fenêtre ouverte jusqu'à la fin.",
  "settings.voiceModelPathValue": "Modèle enregistré : {path}",
  "settings.voiceModelPathMissing": "Aucun modèle Vosk local n'a encore été enregistré pour cette langue.",
  "settings.voiceModelDownloadAction": "Télécharger le modèle Vosk",
  "settings.voiceModelDownloadingAction": "Téléchargement du modèle…",
  "settings.voiceModelInstalledAction": "Modèle téléchargé",
  "settings.voiceModelDownloadComplete": "Le modèle Vosk {language} est prêt.",
  "settings.voiceModelDownloadFailed": "Impossible de télécharger le modèle Vosk sélectionné.",
  "settings.speedSlider": "Curseur de vitesse à gauche",
  "settings.speedSliderHelp": "Affiche le curseur WPM vertical à gauche pendant la lecture.",
  "settings.scrollStartDelay": "Délai avant le départ du texte",
  "settings.scrollStartDelayHelp": "Après le compte à rebours 3, 2, 1, garde le texte immobile pendant ce nombre de secondes avant que le mode défilement commence.",
  "settings.performance": "Mode performance",
  "settings.performanceHelp": "Désactive les animations et force le défilement normal pour une meilleure fluidité.",
  "settings.autoHideToolbar": "Masquer automatiquement la barre du haut",
  "settings.autoHideToolbarHelp": "Affiche une petite poignée en haut et révèle la barre seulement au survol.",
  "settings.style": "Style",
  "settings.style.main": "Principal",
  "settings.style.glass": "Verre dépoli",
  "settings.style.minimal": "Minimaliste",
  "settings.theme": "Thème",
  "settings.theme.main": "Principal",
  "settings.theme.dark": "Sombre",
  "settings.theme.bright": "Clair",
  "settings.theme.meadow": "Jaune-vert",
  "settings.voiceLanguage": "Langue vocale",
  "settings.voiceModeHelp": "Utilise la langue sélectionnée pour le suivi vocal et les commandes Flow à l'échelle de l'application.",
  "settings.textColor": "Couleur du texte",
  "settings.textTransparency": "Transparence du texte",
  "settings.appTransparency": "Transparence de l'application",
  "settings.synced": "Paramètres synchronisés avec la fenêtre principale actuelle.",
  "settings.applied": "Les changements ont été appliqués automatiquement.",
  "settings.autoApply": "Les changements s'appliquent automatiquement lorsque vous modifiez un réglage.",
  "input.kicker": "Nouveau texte",
  "input.title": "Éditeur de script",
  "input.section": "Section",
  "input.sectionTitle": "Choisir un panneau",
  "input.section.editor": "Éditeur",
  "input.section.assistant": "Assistant Groq",
  "input.teleprompterText": "Texte du téléprompteur",
  "input.toolbar": "Barre de formatage",
  "input.scriptPlaceholder": "Collez ou écrivez votre texte ici...",
  "input.importButton": "Importer un fichier",
  "input.importHelp": "Déposez un fichier TXT, DOCX ou PDF dans l'éditeur, ou choisissez-en un depuis votre appareil.",
  "input.importing": "Importation de {name}...",
  "input.imported": "Texte chargé depuis {name}.",
  "input.importUnsupported": "Ce type de fichier n'est pas pris en charge. Utilisez TXT, DOCX, PDF ou un autre fichier texte lisible.",
  "input.importFailed": "Impossible de lire ce fichier.",
  "input.meta": "{count} mots · {minutes} min de lecture",
  "input.editorHelp": "Le formatage fonctionne comme du markdown façon Reddit pour <strong>**gras**</strong>, <em>*italique*</em>, les listes à puces avec <strong>- élément</strong>, les listes numérotées avec <strong>1. élément</strong>, les citations avec <strong>&gt; citation</strong>, avec en plus des balises pour <span class=\"toolbar-underline\">[u]souligné[/u]</span>, <span class=\"tone-white\">[white]blanc[/white]</span>, <span class=\"tone-softwhite\">[softwhite]blanc cassé[/softwhite]</span>, <mark class=\"mark-yellow\">[yellow]surbrillance[/yellow]</mark>, <mark class=\"mark-blue\">[blue]surbrillance[/blue]</mark> et <mark class=\"mark-red\">[red]surbrillance[/red]</mark>.",
  "input.groq": "Groq",
  "input.draftHelper": "Assistant de rédaction",
  "input.apiKey": "Clé API",
  "input.apiKeyPlaceholder": "Collez votre clé API Groq",
  "input.instruction": "Instruction",
  "input.instructionPlaceholder": "Exemple : réécris ceci pour que cela sonne plus naturellement et soit plus facile à lire face caméra.",
  "input.saveText": "Enregistrer le texte",
  "input.useGroq": "Utiliser Groq",
  "input.groqOptional": "Groq est optionnel. Votre clé reste stockée localement sur cet appareil.",
  "input.needKey": "Ajoutez d'abord votre clé API Groq.",
  "input.needInstructionOrScript": "Ajoutez d'abord une instruction ou du texte.",
  "input.thinking": "Réflexion en cours...",
  "input.groqUpdated": "Groq a mis à jour votre script.",
  "input.groqFailed": "La requête Groq a échoué.",
  "input.groqImportButton": "Importer un fichier vers Groq",
  "input.groqImportClear": "Retirer le fichier",
  "input.groqImportHelp": "Ajoutez un fichier TXT, DOCX, PDF ou un autre fichier texte lisible pour que Groq s'en serve.",
  "input.groqImporting": "Préparation de {name} pour Groq...",
  "input.groqImportAttached": "{name} est joint. Groq l'utilisera comme texte source à la place du contenu de l'éditeur.",
  "input.groqImportFailed": "Impossible de lire ce fichier pour Groq.",
  "input.saved": "Enregistré localement.",
  "input.assistantHelp": "Les préférences enregistrées influencent chaque requête Groq, tandis que votre instruction reste la commande spécifique à la tâche.",
  "input.profileTitle": "Profil d'écriture",
  "input.profileHelp": "Ces préférences orientent le ton et la livraison, mais votre instruction reste prioritaire en cas de conflit.",
  "input.personality": "Personnalité",
  "input.personality.natural": "Naturel",
  "input.personality.confident": "Sûr de soi",
  "input.personality.friendly": "Chaleureux",
  "input.personality.professional": "Professionnel",
  "input.personality.persuasive": "Persuasif",
  "input.grammarLevel": "Niveau de grammaire",
  "input.grammarLevel.relaxed": "Souple",
  "input.grammarLevel.standard": "Standard",
  "input.grammarLevel.polished": "Soigné",
  "input.userContext": "Contexte sur vous",
  "input.userContextPlaceholder": "Exemple : je suis étudiant en médecine, je parle vite quand je stresse et je veux un ton calme et crédible.",
  "input.emojiUsage": "Utilisation des emojis",
  "input.academicWordUsage": "Vocabulaire académique",
  "input.academicWordUsage.off": "Désactivé",
  "input.academicWordUsage.on": "Activé",
  "input.academicWordUsage.aggressive": "Agressif",
  "input.pointOfView": "Point de vue du discours",
  "input.pointOfView.firstPerson": "Première personne (je / moi)",
  "input.pointOfView.thirdPerson": "Troisième personne",
  "input.outputLanguage": "Langue de sortie",
  "input.outputLanguage.app": "Langue de l'application",
  "input.preferencesSaved": "Préférences Groq enregistrées localement.",
  "input.contextHint": "Ajoutez du contexte sur votre rôle, votre public, vos objectifs ou le ton souhaité.",
  "input.outputLanguageHint": "Choisissez la langue que Groq doit utiliser pour le texte final.",
  "about.kicker": "À propos",
  "about.title": "À propos de ce projet",
  "about.summary": "Un téléprompteur moderne pour bureau, pensé pour une lecture fluide, une édition rapide, le contrôle vocal et l'injection de messages à distance."
};

Object.assign(UI_STRINGS.fr, {
  "tele.updaterChecking": "Vérification des mises à jour de Flow...",
  "tele.updaterInstalling": "Installation de Flow {version}...",
  "tele.updaterDownloading": "Téléchargement de Flow {version} : {progress}%",
  "tele.updaterFailed": "Échec de la mise à jour : {error}",
  "tele.updaterCurrent": "Flow est déjà à jour.",
  "settings.section.soundInput": "Paramètres d'entrée audio",
  "settings.section.updates": "Mises à jour",
  "settings.soundInput": "Entrée audio",
  "settings.soundInputTitle": "Paramètres d'entrée audio",
  "settings.soundInputMonitoring": "Surveillance",
  "settings.soundInputDevice": "Périphérique d'entrée",
  "settings.soundInputDeviceHelp": "Choisissez le microphone utilisé pour le suivi vocal et les commandes globales de Flow.",
  "settings.soundInputDeviceDefault": "Valeur par défaut du système",
  "settings.soundInputDeviceUnavailable": "Le microphone précédemment sélectionné est indisponible",
  "settings.soundInputDeviceUnnamed": "Microphone",
  "settings.soundInputLevel": "Niveau",
  "settings.soundInputCleanup": "Nettoyage",
  "settings.soundInputRecommended": "Utiliser la recommandation",
  "settings.soundInputRecommendedApplied": "Les valeurs recommandées pour l'entrée audio ont été appliquées.",
  "settings.soundInputNoiseGate": "Porte de bruit",
  "settings.soundInputNoiseGateHelp": "Coupe les bruits ambiants faibles avant que Flow n'envoie l'audio au suivi vocal.",
  "settings.soundInputGain": "Gain d'entrée",
  "settings.soundInputGainHelp": "Amplifie le microphone sélectionné avant son traitement par le moteur Vosk.",
  "settings.soundInputPreviewIdle": "Ouvrez cette section pour prévisualiser le niveau de votre microphone.",
  "settings.soundInputPreviewReady": "Le microphone sélectionné est en cours de surveillance.",
  "settings.soundInputPreviewUnavailable": "L'aperçu du microphone n'est pas disponible ici.",
  "settings.soundInputPermissionDenied": "L'aperçu du microphone est bloqué. Autorisez l'accès au microphone pour voir le niveau en direct.",
  "settings.soundInputNoDevices": "Aucun microphone n'a été trouvé.",
  "settings.updates": "Mises à jour",
  "settings.updaterTitle": "Mises à jour de l'application",
  "settings.updaterChannelTitle": "Version installée",
  "settings.updaterCurrentVersion": "Version actuelle",
  "settings.updaterAvailableVersion": "Version disponible",
  "settings.updaterPublishedAt": "Publié",
  "settings.updaterNotChecked": "Pas encore vérifié",
  "settings.updaterNoDate": "Pas encore publié",
  "settings.updaterStatusIdle": "Prêt",
  "settings.updaterStatusChecking": "Vérification",
  "settings.updaterStatusAvailable": "Mise à jour prête",
  "settings.updaterStatusCurrent": "Actuelle",
  "settings.updaterStatusInstalling": "Installation",
  "settings.updaterStatusError": "Erreur du flux",
  "settings.updaterStatusUnavailable": "Indisponible",
  "settings.updaterIdle": "Flow vérifie le flux de publication signé et installe les mises à jour lorsque vous le lancez.",
  "settings.updaterChecking": "Vérification des mises à jour dans le flux de publication configuré.",
  "settings.updaterCurrent": "Flow {version} est déjà la version la plus récente publiée dans le flux de mise à jour.",
  "settings.updaterAvailable": "Flow {version} est disponible et prêt à être installé.",
  "settings.updaterInstalling": "Téléchargement et installation de Flow {version}. L'application peut se fermer au démarrage de l'installation.",
  "settings.updaterInstallingWindow": "Téléchargement de Flow {version}. L'application peut se fermer au démarrage de l'installation.",
  "settings.updaterFailed": "Flow n'a pas pu lire le flux de mise à jour configuré : {error}",
  "settings.updaterFeedUnavailable": "Le flux de mise à jour configuré est indisponible pour le moment. Publiez latest.json et l'installateur signé avant de retester.",
  "settings.updaterUnavailable": "L'API de mise à jour n'est pas disponible dans cette fenêtre.",
  "settings.updaterNoNotes": "Les notes de version apparaîtront ici lorsqu'une mise à jour sera trouvée.",
  "settings.updaterCheckAction": "Vérifier et mettre à jour",
  "settings.updaterCheckingAction": "Vérification…",
  "settings.updaterInstallAction": "Installer la mise à jour",
  "settings.updaterInstallingAction": "Installation…",
  "settings.updaterProgressIdle": "En attente du démarrage",
  "settings.updaterProgressStats": "{downloaded} sur {total}",
  "settings.updaterInstallFailed": "Échec de l'installation de la mise à jour : {error}"
});

UI_STRINGS.es = {
  ...UI_STRINGS.en,
  "doc.teleprompterTitle": "Teleprónter Flow",
  "doc.settingsTitle": "Flow · Configuración",
  "doc.textTitle": "Flow · Texto",
  "doc.aboutTitle": "Flow · Acerca de",
  "common.settings": "Configuración",
  "common.text": "Texto",
  "common.close": "Cerrar",
  "common.on": "Activado",
  "common.off": "Desactivado",
  "common.ai": "IA",
  "common.wpm": "ppm",
  "common.slower": "Más lento",
  "common.faster": "Más rápido",
  "common.speedAria": "Velocidad en palabras por minuto",
  "common.generatePrompt": "Generar instrucción",
  "common.play": "Reproducir",
  "common.continue": "Continuar",
  "common.pause": "Pausar",
  "common.replayStart": "Reiniciar desde el principio",
  "common.stopKeep": "Detener y mantener la posición",
  "common.openTextPage": "Abrir la página de texto",
  "common.openSettings": "Abrir configuración",
  "common.pinWindow": "Fijar ventana",
  "common.unpinWindow": "Soltar ventana",
  "common.closeApp": "Cerrar la aplicación",
  "common.collapse": "Contraer teleprónter",
  "common.expand": "Expandir teleprónter",
  "common.language": "Idioma",
  "common.copy": "Copiar",
  "common.copyLink": "Copiar enlace",
  "common.loading": "Cargando…",
  "common.unavailable": "No disponible",
  "common.live": "En vivo",
  "common.offline": "Sin conexión",
  "common.setup": "Configuración",
  "language.en": "Inglés",
  "language.tr": "Turco",
  "language.ar": "Árabe",
  "language.de": "Alemán",
  "language.fr": "Francés",
  "language.es": "Español",
  "tele.status.ready": "Listo",
  "tele.status.stopped": "Detenido",
  "tele.status.paused": "En pausa",
  "tele.status.arrowPaused": "Modo flecha en pausa",
  "tele.status.performance": "Desplazamiento de rendimiento",
  "tele.status.scrolling": "Desplazándose",
  "tele.status.line": "Línea por línea",
  "tele.status.arrow": "Modo flecha",
  "tele.status.highlight": "Resaltando",
  "tele.progress": "Palabra {current} / {total}",
  "tele.floatingStats": "{words} restantes · {minutes} min restantes",
  "tele.empty": "Abre el editor de texto y añade tu guion.",
  "tele.status.micBlocked": "Micrófono bloqueado por la privacidad de Windows",
  "tele.status.noMic": "No se detectó micrófono",
  "tele.status.micUnavailable": "Micrófono no disponible",
  "tele.voiceFeedback.micBlocked": "El acceso al micrófono está bloqueado en la configuración de privacidad de Windows.\nVuelve a permitir el acceso al micrófono para Flow y prueba otra vez el seguimiento por voz.\n\nTu guion sigue guardado.",
  "tele.voiceFeedback.noMic": "No se detectó ningún micrófono.\nConecta o habilita un micrófono y vuelve a probar el seguimiento por voz.\n\nTu guion sigue guardado.",
  "tele.voiceFeedback.micUnavailable": "Flow no pudo iniciar el seguimiento por voz porque el micrófono no está disponible o no funciona.\nComprueba el dispositivo de entrada seleccionado y vuelve a intentarlo.\n\nTu guion sigue guardado.",
  "tele.addGroqKey": "Añade primero la clave API de Groq desde la página de texto",
  "tele.promptExisting": "Describe cómo debe Groq reescribir el texto actual del teleprónter:",
  "tele.promptExistingDefault": "Reescribe esto con un tono, una personalidad y un estilo visual diferentes en unas 200 palabras.",
  "tele.promptNew": "Describe el texto de teleprónter que quieres que Groq genere:",
  "tele.promptNewDefault": "Un discurso breve para lanzar un producto con un ritmo seguro y natural.",
  "tele.cancelled": "Generación cancelada",
  "tele.generating": "Generando con Groq...",
  "tele.generated": "Groq generó un nuevo guion",
  "tele.pinned": "Ventana fijada",
  "tele.unpinned": "Ventana en modo arrastre libre",
  "tele.groqFailed": "Groq falló: {error}",
  "tele.clickthroughEnabled": "Modo clic a través activado",
  "tele.clickthroughDisabled": "Modo clic a través desactivado",
  "tele.opened": "Se abrió {kind}",
  "tele.failedOpenInput": "No se pudo abrir el texto: {error}",
  "tele.failedOpenSettings": "No se pudo abrir la configuración: {error}",
  "tele.failedCloseApp": "No se pudo cerrar la aplicación: {error}",
  "settings.kicker": "Configuración",
  "settings.title": "Controles en vivo",
  "settings.section": "Sección",
  "settings.sectionTitle": "Explorar configuración",
  "settings.section.remote": "Remoto",
  "settings.section.appearance": "Apariencia",
  "settings.section.scrolling": "Desplazamiento",
  "settings.section.positioning": "Posicionamiento",
  "settings.section.windowSettings": "Configuración de la ventana",
  "settings.section.privacy": "Privacidad y sistema",
  "settings.section.usability": "Usabilidad",
  "settings.positioning": "Posicionamiento",
  "settings.windowSettings": "Configuración de la ventana",
  "settings.windowSettingsTitle": "Posición y tamaño",
  "settings.windowPlacement": "Ubicación de la ventana",
  "settings.windowLocation": "Posición de la ventana",
  "settings.privacy": "Privacidad y sistema",
  "settings.desktopBehavior": "Comportamiento del escritorio",
  "settings.hideFromCapture": "Invisible en capturas de pantalla",
  "settings.hideFromCaptureHelp": "Mantiene a Flow fuera de capturas y grabaciones de pantalla en sistemas Windows compatibles.",
  "settings.systemTray": "Usar el icono de la bandeja del sistema",
  "settings.systemTrayHelp": "Cuando está activado, Flow se oculta de la barra de tareas y sigue disponible desde la bandeja del sistema. Cuando está desactivado, Flow aparece en la barra de tareas.",
  "settings.preventSleep": "Evitar el modo de suspensión",
  "settings.preventSleepHelp": "Mantiene la pantalla y el sistema despiertos mientras Flow está en ejecución.",
  "settings.usability": "Usabilidad",
  "settings.shortcuts": "Atajos de teclado",
  "settings.clickthroughShortcut": "Atajo para modo clic a través",
  "settings.clickthroughShortcutHelp": "Permite alternar el modo clic a través con Ctrl + Shift + X.",
  "settings.shortcutPlayStop": "Reproducir / detener",
  "settings.shortcutReset": "Reiniciar al inicio",
  "settings.shortcutBackward": "Desplazar hacia atrás",
  "settings.shortcutSpeed": "Bajar / subir velocidad durante la reproducción",
  "settings.shortcutPause": "Pausar / continuar",
  "settings.shortcutPauseValue": "Espacio",
  "settings.x": "X",
  "settings.y": "Y",
  "settings.topCenter": "Arriba al centro",
  "settings.center": "Centro",
  "settings.custom": "x / y personalizados",
  "settings.drag": "Arrastre libre",
  "settings.appearance": "Apariencia",
  "settings.appearanceTitle": "Tipografía y aspecto",
  "settings.sizeAndPlayback": "Tamaño y estilo de reproducción",
  "settings.scrolling": "Desplazamiento",
  "settings.scrollingTitle": "Reproducción y seguimiento",
  "settings.group.windowSize": "Tamaño de la ventana",
  "settings.group.playback": "Reproducción",
  "settings.group.typography": "Tipografía",
  "settings.group.visuals": "Aspecto visual",
  "settings.width": "Ancho",
  "settings.height": "Alto",
  "settings.animationStyle": "Modo de desplazamiento",
  "settings.mode.highlight": "Modo de resaltado",
  "settings.mode.scroll": "Modo de desplazamiento normal",
  "settings.mode.line": "Resaltado línea por línea",
  "settings.mode.arrow": "Modo flecha",
  "settings.mode.voice": "Seguimiento por voz",
  "settings.voiceTrackingStyle": "Estilo de seguimiento por voz",
  "settings.voiceTrackingStyleHelp": "Elige cómo se muestra la posición detectada mientras hablas.",
  "settings.voiceConfidence": "Nivel de confianza",
  "settings.voiceConfidenceHelp": "Los valores más altos hacen que Flow sea más estricto con coincidencias de voz de baja confianza.",
  "settings.voiceConfidenceSkips": "Si Flow se salta palabras o avanza demasiado, aumenta este valor.",
  "settings.voiceConfidenceStalls": "Si no avanza aunque leas con claridad, reduce este valor.",
  "settings.voiceStyle.highlight": "Resaltado de palabra",
  "settings.voiceStyle.line": "Resaltado de línea",
  "settings.voiceStyle.plain": "Texto plano",
  "settings.appWideVoiceCommands": "Comandos de voz de Flow en toda la aplicación",
  "settings.appWideVoiceCommandsHelp": "Permite que comandos en inglés como 'Hey Flow pause' o 'Hey Flow down' funcionen también fuera del seguimiento por voz. Actualmente es inestable y puede no funcionar de forma fiable.",
  "settings.font": "Fuente",
  "settings.textSize": "Tamaño del texto",
  "settings.style": "Estilo",
  "settings.style.main": "Principal",
  "settings.style.glass": "Cristal esmerilado",
  "settings.style.minimal": "Minimalista",
  "settings.theme": "Tema",
  "settings.theme.main": "Principal",
  "settings.theme.dark": "Oscuro",
  "settings.theme.bright": "Claro",
  "settings.theme.meadow": "Amarillo verdoso",
  "settings.voiceLanguage": "Idioma de voz",
  "settings.voiceModeHelp": "Usa el idioma seleccionado para el seguimiento por voz y los comandos globales de Flow.",
  "settings.speedSlider": "Deslizador de velocidad izquierdo",
  "settings.speedSliderHelp": "Muestra el control vertical de PPM en el lado izquierdo durante la reproducción.",
  "settings.scrollStartDelay": "Retraso de inicio del texto",
  "settings.scrollStartDelayHelp": "Después de la cuenta atrás 3, 2, 1, mantiene el texto quieto durante estos segundos antes de que empiece a moverse.",
  "settings.performance": "Modo de rendimiento",
  "settings.performanceHelp": "Desactiva las animaciones de la interfaz y fuerza el desplazamiento normal para un rendimiento más fluido.",
  "settings.autoHideToolbar": "Ocultar automáticamente la barra superior",
  "settings.autoHideToolbarHelp": "Muestra una pequeña pestaña arriba y revela la barra solo cuando el teleprónter está enfocado o bajo el cursor.",
  "settings.mirrorMode": "Reflejar texto horizontalmente",
  "settings.mirrorModeHelp": "Invierte el teleprónter de lado a lado para que el reflejo se lea correctamente a través de un espejo físico.",
  "settings.mirrorVertical": "Voltear el texto boca abajo",
  "settings.mirrorVerticalHelp": "Invierte el teleprónter de arriba abajo para que los montajes con espejo puedan colocarse desde cualquiera de los lados.",
  "settings.textColor": "Color del texto",
  "settings.textTransparency": "Transparencia del texto",
  "settings.appTransparency": "Transparencia de la aplicación",
  "settings.synced": "La configuración se sincronizó con la ventana principal actual.",
  "settings.applied": "Los cambios se aplicaron automáticamente.",
  "settings.autoApply": "Los cambios se aplican automáticamente al mover deslizadores o elegir una opción.",
  "input.kicker": "Texto nuevo",
  "input.title": "Editor de guiones",
  "input.section": "Sección",
  "input.sectionTitle": "Elegir panel del editor",
  "input.section.editor": "Editor",
  "input.section.assistant": "Asistente de Groq",
  "input.teleprompterText": "Texto del teleprónter",
  "input.toolbar": "Barra de formato",
  "input.scriptPlaceholder": "Pega o escribe tu guion aquí...",
  "input.meta": "{count} palabras · {minutes} min de lectura",
  "input.groq": "Groq",
  "input.draftHelper": "Asistente de redacción",
  "input.apiKey": "Clave API",
  "input.apiKeyPlaceholder": "Pega tu clave API de Groq",
  "input.instruction": "Instrucción",
  "input.instructionPlaceholder": "Ejemplo: Reescribe esto para que suene más natural y sea más fácil de leer ante la cámara.",
  "input.saveText": "Guardar texto",
  "input.useGroq": "Usar Groq",
  "input.groqOptional": "Groq es opcional. Tu clave permanece guardada localmente en este dispositivo.",
  "input.needKey": "Añade primero tu clave API de Groq.",
  "input.needInstructionOrScript": "Añade primero una instrucción o algo de texto.",
  "input.thinking": "Pensando...",
  "input.groqUpdated": "Groq actualizó tu guion.",
  "input.groqFailed": "La solicitud a Groq falló.",
  "input.saved": "Guardado localmente.",
  "about.kicker": "Acerca de",
  "about.title": "Acerca de este proyecto",
  "about.summary": "Un teleprónter de escritorio moderno para leer con fluidez, editar rápido, usar controles por voz e inyectar mensajes remotos.",
  "about.p1": "Flow es una aplicación de teleprónter creada con tecnologías web y Tauri. Está diseñada para ser simple, ligera y personalizable.",
  "about.p2": "Este proyecto es de código abierto y está disponible en mi <a href=\"https://github.com/LumoRez07\">cuenta de GitHub</a>. Si tienes preguntas, sugerencias o quieres contribuir, no dudes en escribirme o abrir un issue.",
  "about.p3": "Este proyecto fue creado por <a href=\"https://flowremote.app/\">LumoRez</a> con ❤️ en 2026.",
  "about.p4": "Flow incluye edición de guiones, varios modos de reproducción, seguimiento por voz, redacción asistida por IA, notificaciones remotas, controles de bandeja y opciones de privacidad centradas en Windows como la protección frente a capturas.",
  "tele.updaterChecking": "Comprobando actualizaciones de Flow...",
  "tele.updaterInstalling": "Instalando Flow {version}...",
  "tele.updaterDownloading": "Descargando Flow {version}: {progress}%",
  "tele.updaterFailed": "La actualización falló: {error}",
  "tele.updaterCurrent": "Flow ya está actualizado.",
  "settings.section.soundInput": "Configuración de entrada de audio",
  "settings.section.updates": "Actualizaciones",
  "settings.soundInput": "Entrada de audio",
  "settings.soundInputTitle": "Configuración de entrada de audio",
  "settings.soundInputMonitoring": "Monitorización",
  "settings.soundInputDevice": "Dispositivo de entrada",
  "settings.soundInputDeviceHelp": "Elige el micrófono usado para el seguimiento por voz y los comandos globales de Flow.",
  "settings.soundInputDeviceDefault": "Predeterminado del sistema",
  "settings.soundInputDeviceUnavailable": "El micrófono seleccionado anteriormente no está disponible",
  "settings.soundInputDeviceUnnamed": "Micrófono",
  "settings.soundInputLevel": "Nivel",
  "settings.soundInputCleanup": "Limpieza",
  "settings.soundInputRecommended": "Usar recomendado",
  "settings.soundInputRecommendedApplied": "Se aplicaron los valores recomendados de entrada de audio.",
  "settings.soundInputNoiseGate": "Puerta de ruido",
  "settings.soundInputNoiseGateHelp": "Recorta el ruido ambiente de bajo nivel antes de que Flow envíe el audio al seguimiento por voz.",
  "settings.soundInputGain": "Ganancia de entrada",
  "settings.soundInputGainHelp": "Amplifica el micrófono seleccionado antes de que el motor Vosk lo procese.",
  "settings.soundInputPreviewIdle": "Abre esta sección para ver una vista previa del nivel del micrófono.",
  "settings.soundInputPreviewReady": "Monitorizando el micrófono seleccionado.",
  "settings.soundInputPreviewUnavailable": "La vista previa del micrófono no está disponible aquí.",
  "settings.soundInputPermissionDenied": "La vista previa del micrófono está bloqueada. Permite el acceso al micrófono para ver el nivel en vivo.",
  "settings.soundInputNoDevices": "No se encontraron micrófonos.",
  "settings.updates": "Actualizaciones",
  "settings.updaterTitle": "Actualizaciones de la aplicación",
  "settings.updaterChannelTitle": "Versión instalada",
  "settings.updaterCurrentVersion": "Versión actual",
  "settings.updaterAvailableVersion": "Versión disponible",
  "settings.updaterPublishedAt": "Publicado",
  "settings.updaterNotChecked": "Aún no comprobado",
  "settings.updaterNoDate": "Aún no publicado",
  "settings.updaterStatusIdle": "Listo",
  "settings.updaterStatusChecking": "Comprobando",
  "settings.updaterStatusAvailable": "Actualización lista",
  "settings.updaterStatusCurrent": "Actual",
  "settings.updaterStatusInstalling": "Instalando",
  "settings.updaterStatusError": "Error del feed",
  "settings.updaterStatusUnavailable": "No disponible",
  "settings.updaterIdle": "Flow comprueba el feed firmado de versiones e instala actualizaciones cuando lo activas.",
  "settings.updaterChecking": "Comprobando actualizaciones en el feed de versiones configurado.",
  "settings.updaterCurrent": "Flow {version} ya es la versión más reciente publicada en el feed de actualización.",
  "settings.updaterAvailable": "Flow {version} está disponible y listo para instalarse.",
  "settings.updaterInstalling": "Descargando e instalando Flow {version}. La aplicación puede cerrarse cuando comience el instalador.",
  "settings.updaterInstallingWindow": "Descargando Flow {version}. La aplicación puede cerrarse cuando comience el instalador.",
  "settings.updaterFailed": "Flow no pudo leer el feed de actualización configurado: {error}",
  "settings.updaterFeedUnavailable": "El feed de actualización configurado no está disponible ahora mismo. Publica latest.json y el instalador firmado antes de volver a probar.",
  "settings.updaterUnavailable": "La API del actualizador no está disponible en esta ventana.",
  "settings.updaterNoNotes": "Las notas de la versión aparecerán aquí cuando se encuentre una actualización.",
  "settings.updaterCheckAction": "Comprobar y actualizar",
  "settings.updaterCheckingAction": "Comprobando…",
  "settings.updaterInstallAction": "Instalar actualización",
  "settings.updaterInstallingAction": "Instalando…",
  "settings.updaterProgressIdle": "Esperando para empezar",
  "settings.updaterProgressStats": "{downloaded} de {total}",
  "settings.updaterInstallFailed": "La instalación de la actualización falló: {error}"
};

Object.assign(UI_STRINGS.tr, {
  "settings.section.scrolling": "Kaydırma",
  "settings.section.windowSettings": "Pencere ayarları",
  "settings.windowSettings": "Pencere ayarları",
  "settings.windowSettingsTitle": "Konum ve boyut",
  "settings.scrolling": "Kaydırma",
  "settings.scrollingTitle": "Oynatma ve takip",
  "settings.mirrorMode": "Metni yatay olarak aynala",
  "settings.mirrorModeHelp": "Teleprompteri sağdan sola çevirir; böylece fiziksel aynadan yansıma doğru okunur.",
  "settings.mirrorVertical": "Metni baş aşağı çevir",
  "settings.mirrorVerticalHelp": "Teleprompteri yukarıdan aşağıya çevirir; böylece aynalı düzenekler iki yönden de kurulabilir.",
  "input.cardBuilder": "İpucu kartları",
  "input.cardBuilderHelp": "Sunucu ipuçlarını metnin içine biçimli kartlar olarak ekleyin. Ortalanmış kartlar kendi satırına geçer, kelime arası kartlar ise satır içinde kompakt kalır.",
  "input.cardPanelCollapse": "İpucu kartlarını daralt",
  "input.cardPanelExpand": "İpucu kartlarını genişlet",
  "input.cardTemplate": "Şablon",
  "input.cardTemplateBuiltin": "Hazır şablonlar",
  "input.cardTemplateCustom": "Özel şablonlar",
  "input.cardType": "Kart türü",
  "input.cardType.centered": "Ortalanmış",
  "input.cardType.between": "Kelime arası",
  "input.cardText": "Kart metni",
  "input.cardWaitSeconds": "Bekleme süresi",
  "input.cardTextPlaceholder": "Örnek: 3 SANİYE BEKLE",
  "input.cardCustomName": "Şablon adı",
  "input.cardCustomNamePlaceholder": "Örnek: Röportaj duraksaması",
  "input.cardAdd": "Ekle",
  "input.cardSaveTemplate": "Şablonu kaydet",
  "input.cardPreview": "Önizleme",
  "input.cardLibrary": "Kaydedilen şablonlar",
  "input.cardUseAction": "Kullan",
  "input.cardDeleteAction": "Sil",
  "input.cardLibraryEmpty": "Kaydedilen özel şablonlar burada görünür.",
  "input.cardTemplateSaved": "Özel ipucu kartı yerel olarak kaydedildi.",
  "input.cardTemplateDeleted": "Özel ipucu kartı kaldırıldı.",
  "input.cardTemplateDuplicate": "Bu adla kayıtlı bir şablon zaten var.",
  "input.cardTemplateNeedName": "Kaydetmeden önce bir şablon adı ekleyin.",
  "input.cardTemplateNeedText": "Eklemek veya kaydetmek için kart metni ekleyin."
});

Object.assign(UI_STRINGS.ar, {
  "settings.section.scrolling": "التمرير",
  "settings.section.windowSettings": "إعدادات النافذة",
  "settings.windowSettings": "إعدادات النافذة",
  "settings.windowSettingsTitle": "الموضع والحجم",
  "settings.scrolling": "التمرير",
  "settings.scrollingTitle": "التشغيل والتتبع",
  "settings.mirrorMode": "عكس النص أفقيًا",
  "settings.mirrorModeHelp": "يقلب شاشة التلقين من اليمين إلى اليسار حتى تُقرأ الانعكاسات بشكل صحيح عبر المرآة الفعلية.",
  "settings.mirrorVertical": "اقلب النص رأسًا على عقب",
  "settings.mirrorVerticalHelp": "يقلب شاشة التلقين من الأعلى إلى الأسفل حتى يمكن تركيب أنظمة المرايا من أي جهة.",
  "input.cardBuilder": "بطاقات التلقين",
  "input.cardBuilderHelp": "أدرج إشارات المقدم كبطاقات منسقة داخل النص. البطاقات المتمركزة تنتقل إلى سطر مستقل، بينما تبقى بطاقات ما بين الكلمات مدمجة داخل السطر.",
  "input.cardPanelCollapse": "طي بطاقات التلقين",
  "input.cardPanelExpand": "توسيع بطاقات التلقين",
  "input.cardTemplate": "القالب",
  "input.cardTemplateBuiltin": "القوالب المدمجة",
  "input.cardTemplateCustom": "القوالب المخصصة",
  "input.cardType": "نوع البطاقة",
  "input.cardType.centered": "متمركزة",
  "input.cardType.between": "بين الكلمات",
  "input.cardText": "نص البطاقة",
  "input.cardWaitSeconds": "ثواني الانتظار",
  "input.cardTextPlaceholder": "مثال: انتظر 3 ثوانٍ",
  "input.cardCustomName": "اسم القالب",
  "input.cardCustomNamePlaceholder": "مثال: وقفة المقابلة",
  "input.cardAdd": "إضافة",
  "input.cardSaveTemplate": "حفظ القالب",
  "input.cardPreview": "معاينة",
  "input.cardLibrary": "القوالب المحفوظة",
  "input.cardUseAction": "استخدام",
  "input.cardDeleteAction": "حذف",
  "input.cardLibraryEmpty": "ستظهر القوالب المخصصة المحفوظة هنا.",
  "input.cardTemplateSaved": "تم حفظ بطاقة التلقين المخصصة محليًا.",
  "input.cardTemplateDeleted": "تمت إزالة بطاقة التلقين المخصصة.",
  "input.cardTemplateDuplicate": "يوجد بالفعل قالب محفوظ بهذا الاسم.",
  "input.cardTemplateNeedName": "أضف اسمًا للقالب قبل الحفظ.",
  "input.cardTemplateNeedText": "أضف نص البطاقة قبل الإدراج أو الحفظ."
});

Object.assign(UI_STRINGS.de, {
  "settings.section.scrolling": "Scrollen",
  "settings.section.windowSettings": "Fenstereinstellungen",
  "settings.windowSettings": "Fenstereinstellungen",
  "settings.windowSettingsTitle": "Position und Größe",
  "settings.scrolling": "Scrollen",
  "settings.scrollingTitle": "Wiedergabe und Tracking",
  "settings.mirrorMode": "Text horizontal spiegeln",
  "settings.mirrorModeHelp": "Spiegelt den Teleprompter von links nach rechts, damit die Reflexion in einem echten Spiegel korrekt lesbar ist.",
  "settings.mirrorVertical": "Text auf den Kopf stellen",
  "settings.mirrorVerticalHelp": "Spiegelt den Teleprompter von oben nach unten, damit Spiegel-Rigs von beiden Seiten montiert werden können.",
  "input.cardBuilder": "Hinweiskarten",
  "input.cardBuilderHelp": "Füge Sprecherhinweise als gestaltete Karten in das Skript ein. Zentrierte Karten stehen in einer eigenen Zeile, Zwischenwort-Karten bleiben kompakt im Textfluss.",
  "input.cardPanelCollapse": "Hinweiskarten einklappen",
  "input.cardPanelExpand": "Hinweiskarten ausklappen",
  "input.cardTemplate": "Vorlage",
  "input.cardTemplateBuiltin": "Integrierte Vorlagen",
  "input.cardTemplateCustom": "Benutzerdefinierte Vorlagen",
  "input.cardType": "Kartentyp",
  "input.cardType.centered": "Zentriert",
  "input.cardType.between": "Zwischen Wörtern",
  "input.cardText": "Kartentext",
  "input.cardWaitSeconds": "Wartezeit in Sekunden",
  "input.cardTextPlaceholder": "Beispiel: 3 SEKUNDEN WARTEN",
  "input.cardCustomName": "Vorlagenname",
  "input.cardCustomNamePlaceholder": "Beispiel: Interview-Pause",
  "input.cardAdd": "Hinzufügen",
  "input.cardSaveTemplate": "Vorlage speichern",
  "input.cardPreview": "Vorschau",
  "input.cardLibrary": "Gespeicherte Vorlagen",
  "input.cardUseAction": "Verwenden",
  "input.cardDeleteAction": "Löschen",
  "input.cardLibraryEmpty": "Gespeicherte benutzerdefinierte Vorlagen erscheinen hier.",
  "input.cardTemplateSaved": "Benutzerdefinierte Hinweiskarte lokal gespeichert.",
  "input.cardTemplateDeleted": "Benutzerdefinierte Hinweiskarte entfernt.",
  "input.cardTemplateDuplicate": "Eine gespeicherte Vorlage mit diesem Namen existiert bereits.",
  "input.cardTemplateNeedName": "Füge vor dem Speichern einen Vorlagennamen hinzu.",
  "input.cardTemplateNeedText": "Füge Kartentext hinzu, bevor du einfügst oder speicherst."
});

Object.assign(UI_STRINGS.fr, {
  "settings.section.scrolling": "Défilement",
  "settings.section.windowSettings": "Paramètres de la fenêtre",
  "settings.windowSettings": "Paramètres de la fenêtre",
  "settings.windowSettingsTitle": "Position et taille",
  "settings.scrolling": "Défilement",
  "settings.scrollingTitle": "Lecture et suivi",
  "settings.mirrorMode": "Miroir horizontal du texte",
  "settings.mirrorModeHelp": "Inverse le téléprompteur de gauche à droite pour que le reflet reste lisible à travers un miroir physique.",
  "settings.mirrorVertical": "Retourner le texte à l'envers",
  "settings.mirrorVerticalHelp": "Inverse le téléprompteur de haut en bas afin que les montages avec miroir puissent être installés dans les deux sens.",
  "input.cardBuilder": "Cartes d'indication",
  "input.cardBuilderHelp": "Insérez des repères de présentation sous forme de cartes stylisées dans le script. Les cartes centrées passent sur leur propre ligne, tandis que les cartes entre les mots restent compactes dans le texte.",
  "input.cardPanelCollapse": "Réduire les cartes d'indication",
  "input.cardPanelExpand": "Développer les cartes d'indication",
  "input.cardTemplate": "Modèle",
  "input.cardTemplateBuiltin": "Modèles intégrés",
  "input.cardTemplateCustom": "Modèles personnalisés",
  "input.cardType": "Type de carte",
  "input.cardType.centered": "Centrée",
  "input.cardType.between": "Entre les mots",
  "input.cardText": "Texte de la carte",
  "input.cardWaitSeconds": "Secondes d'attente",
  "input.cardTextPlaceholder": "Exemple : ATTENDRE 3 SECONDES",
  "input.cardCustomName": "Nom du modèle",
  "input.cardCustomNamePlaceholder": "Exemple : Pause interview",
  "input.cardAdd": "Ajouter",
  "input.cardSaveTemplate": "Enregistrer le modèle",
  "input.cardPreview": "Aperçu",
  "input.cardLibrary": "Modèles enregistrés",
  "input.cardUseAction": "Utiliser",
  "input.cardDeleteAction": "Supprimer",
  "input.cardLibraryEmpty": "Les modèles personnalisés enregistrés apparaîtront ici.",
  "input.cardTemplateSaved": "Carte d'indication personnalisée enregistrée localement.",
  "input.cardTemplateDeleted": "Carte d'indication personnalisée supprimée.",
  "input.cardTemplateDuplicate": "Un modèle enregistré portant ce nom existe déjà.",
  "input.cardTemplateNeedName": "Ajoutez un nom de modèle avant l'enregistrement.",
  "input.cardTemplateNeedText": "Ajoutez du texte à la carte avant de l'insérer ou de l'enregistrer."
});

Object.assign(UI_STRINGS.es, {
  "settings.section.scrolling": "Desplazamiento",
  "settings.section.windowSettings": "Configuración de la ventana",
  "settings.windowSettings": "Configuración de la ventana",
  "settings.windowSettingsTitle": "Posición y tamaño",
  "settings.scrolling": "Desplazamiento",
  "settings.scrollingTitle": "Reproducción y seguimiento",
  "settings.mirrorMode": "Reflejar texto horizontalmente",
  "settings.mirrorModeHelp": "Invierte el teleprónter de lado a lado para que el reflejo se lea correctamente a través de un espejo físico.",
  "settings.mirrorVertical": "Voltear el texto boca abajo",
  "settings.mirrorVerticalHelp": "Invierte el teleprónter de arriba abajo para que los montajes con espejo puedan colocarse desde cualquiera de los lados.",
  "input.cardBuilder": "Tarjetas de señal",
  "input.cardBuilderHelp": "Inserta indicaciones para el presentador como tarjetas con estilo dentro del guion. Las tarjetas centradas van en su propia línea, mientras que las tarjetas entre palabras permanecen compactas en línea.",
  "input.cardPanelCollapse": "Contraer tarjetas de señal",
  "input.cardPanelExpand": "Expandir tarjetas de señal",
  "input.cardTemplate": "Plantilla",
  "input.cardTemplateBuiltin": "Plantillas integradas",
  "input.cardTemplateCustom": "Plantillas personalizadas",
  "input.cardType": "Tipo de tarjeta",
  "input.cardType.centered": "Centrada",
  "input.cardType.between": "Entre palabras",
  "input.cardText": "Texto de la tarjeta",
  "input.cardWaitSeconds": "Segundos de espera",
  "input.cardTextPlaceholder": "Ejemplo: ESPERAR 3 SEGUNDOS",
  "input.cardCustomName": "Nombre de la plantilla",
  "input.cardCustomNamePlaceholder": "Ejemplo: Pausa de entrevista",
  "input.cardAdd": "Añadir",
  "input.cardSaveTemplate": "Guardar plantilla",
  "input.cardPreview": "Vista previa",
  "input.cardLibrary": "Plantillas guardadas",
  "input.cardUseAction": "Usar",
  "input.cardDeleteAction": "Eliminar",
  "input.cardLibraryEmpty": "Las plantillas personalizadas guardadas aparecerán aquí.",
  "input.cardTemplateSaved": "Tarjeta de señal personalizada guardada localmente.",
  "input.cardTemplateDeleted": "Tarjeta de señal personalizada eliminada.",
  "input.cardTemplateDuplicate": "Ya existe una plantilla guardada con ese nombre.",
  "input.cardTemplateNeedName": "Añade un nombre de plantilla antes de guardarla.",
  "input.cardTemplateNeedText": "Añade texto a la tarjeta antes de insertarla o guardarla."
});

Object.assign(UI_STRINGS.en, {
  "input.cardPreset.warningAlert": "WARNING / ALERT",
  "input.cardPreset.speakLouder": "SPEAK LOUDER",
  "input.cardPreset.shortPause": "SHORT PAUSE",
  "input.cardPreset.longPause": "LONG PAUSE",
  "input.cardPreset.pause": "PAUSE",
  "input.cardPreset.waitSecondsName": "WAIT x SECONDS",
  "input.cardPreset.waitSecondsText": "WAIT {seconds} SECONDS",
  "input.cardPreset.continue": "CONTINUE",
  "input.cardPreset.slowDown": "SLOW DOWN",
  "input.cardPreset.punch": "PUNCH",
  "input.cardPreset.smile": "SMILE",
  "input.cardPreset.gesture": "GESTURE",
  "input.cardPreset.nameTitle": "NAME / TITLE",
  "input.cardPreset.startEnd": "START / END"
});

Object.assign(UI_STRINGS.tr, {
  "input.cardPreset.warningAlert": "UYARI / ALARM",
  "input.cardPreset.speakLouder": "DAHA YÜKSEK KONUŞ",
  "input.cardPreset.shortPause": "KISA DURAKLAMA",
  "input.cardPreset.longPause": "UZUN DURAKLAMA",
  "input.cardPreset.pause": "DURAKLA",
  "input.cardPreset.waitSecondsName": "x SANİYE BEKLE",
  "input.cardPreset.waitSecondsText": "{seconds} SANİYE BEKLE",
  "input.cardPreset.continue": "DEVAM ET",
  "input.cardPreset.slowDown": "YAVAŞLA",
  "input.cardPreset.punch": "VURGULA",
  "input.cardPreset.smile": "GÜLÜMSE",
  "input.cardPreset.gesture": "JEST",
  "input.cardPreset.nameTitle": "İSİM / UNVAN",
  "input.cardPreset.startEnd": "BAŞLANGIÇ / BİTİŞ"
});

Object.assign(UI_STRINGS.ar, {
  "input.cardPreset.warningAlert": "تحذير / تنبيه",
  "input.cardPreset.speakLouder": "تحدث بصوت أعلى",
  "input.cardPreset.shortPause": "وقفة قصيرة",
  "input.cardPreset.longPause": "وقفة طويلة",
  "input.cardPreset.pause": "وقفة",
  "input.cardPreset.waitSecondsName": "انتظر x ثوانٍ",
  "input.cardPreset.waitSecondsText": "انتظر {seconds} ثوانٍ",
  "input.cardPreset.continue": "تابع",
  "input.cardPreset.slowDown": "أبطئ",
  "input.cardPreset.punch": "شدد",
  "input.cardPreset.smile": "ابتسم",
  "input.cardPreset.gesture": "إشارة",
  "input.cardPreset.nameTitle": "الاسم / اللقب",
  "input.cardPreset.startEnd": "البداية / النهاية"
});

Object.assign(UI_STRINGS.de, {
  "input.cardPreset.warningAlert": "WARNUNG / ALARM",
  "input.cardPreset.speakLouder": "LAUTER SPRECHEN",
  "input.cardPreset.shortPause": "KURZE PAUSE",
  "input.cardPreset.longPause": "LANGE PAUSE",
  "input.cardPreset.pause": "PAUSE",
  "input.cardPreset.waitSecondsName": "WARTE x SEKUNDEN",
  "input.cardPreset.waitSecondsText": "WARTE {seconds} SEKUNDEN",
  "input.cardPreset.continue": "WEITER",
  "input.cardPreset.slowDown": "LANGSAMER",
  "input.cardPreset.punch": "BETONEN",
  "input.cardPreset.smile": "LÄCHELN",
  "input.cardPreset.gesture": "GESTE",
  "input.cardPreset.nameTitle": "NAME / TITEL",
  "input.cardPreset.startEnd": "START / ENDE"
});

Object.assign(UI_STRINGS.fr, {
  "input.cardPreset.warningAlert": "AVERTISSEMENT / ALERTE",
  "input.cardPreset.speakLouder": "PARLER PLUS FORT",
  "input.cardPreset.shortPause": "COURTE PAUSE",
  "input.cardPreset.longPause": "LONGUE PAUSE",
  "input.cardPreset.pause": "PAUSE",
  "input.cardPreset.waitSecondsName": "ATTENDS x SECONDES",
  "input.cardPreset.waitSecondsText": "ATTENDS {seconds} SECONDES",
  "input.cardPreset.continue": "CONTINUER",
  "input.cardPreset.slowDown": "RALENTIR",
  "input.cardPreset.punch": "INSISTER",
  "input.cardPreset.smile": "SOURIRE",
  "input.cardPreset.gesture": "GESTE",
  "input.cardPreset.nameTitle": "NOM / TITRE",
  "input.cardPreset.startEnd": "DÉBUT / FIN"
});

Object.assign(UI_STRINGS.en, {
  "common.startFresh": "Start (fresh start)"
});

Object.assign(UI_STRINGS.tr, {
  "common.startFresh": "Başlat (sıfırdan)"
});

Object.assign(UI_STRINGS.ar, {
  "common.startFresh": "ابدأ (بداية جديدة)"
});

Object.assign(UI_STRINGS.de, {
  "common.startFresh": "Starten (neu beginnen)"
});

Object.assign(UI_STRINGS.fr, {
  "common.startFresh": "Démarrer (nouveau départ)"
});

Object.assign(UI_STRINGS.es, {
  "common.startFresh": "Iniciar (desde el principio)",
  "input.cardPreset.warningAlert": "ADVERTENCIA / ALERTA",
  "input.cardPreset.speakLouder": "HABLA MÁS FUERTE",
  "input.cardPreset.shortPause": "PAUSA CORTA",
  "input.cardPreset.longPause": "PAUSA LARGA",
  "input.cardPreset.pause": "PAUSA",
  "input.cardPreset.waitSecondsName": "ESPERA x SEGUNDOS",
  "input.cardPreset.waitSecondsText": "ESPERA {seconds} SEGUNDOS",
  "input.cardPreset.continue": "CONTINUAR",
  "input.cardPreset.slowDown": "MÁS DESPACIO",
  "input.cardPreset.punch": "ENFATIZA",
  "input.cardPreset.smile": "SONRÍE",
  "input.cardPreset.gesture": "GESTO",
  "input.cardPreset.nameTitle": "NOMBRE / TÍTULO",
  "input.cardPreset.startEnd": "INICIO / FIN",
  "input.editorHelp": "El formato funciona como markdown estilo Reddit para <strong>**negrita**</strong>, <em>*cursiva*</em>, listas con viñetas usando <strong>- elemento</strong>, listas numeradas usando <strong>1. elemento</strong>, citas usando <strong>&gt; cita</strong>, además de etiquetas para <span class=\"toolbar-underline\">[u]subrayado[/u]</span>, <span class=\"tone-white\">[white]blanco[/white]</span>, <span class=\"tone-softwhite\">[softwhite]blanco suave[/softwhite]</span>, <mark class=\"mark-yellow\">[yellow]resaltado[/yellow]</mark>, <mark class=\"mark-blue\">[blue]resaltado[/blue]</mark> y <mark class=\"mark-red\">[red]resaltado[/red]</mark>."
});

Object.assign(UI_STRINGS.en, {
  "input.toolbar.bold": "Bold",
  "input.toolbar.italic": "Italic",
  "input.toolbar.underline": "Underline",
  "input.toolbar.white": "White",
  "input.toolbar.softWhite": "Soft white",
  "input.toolbar.bullets": "Bullets",
  "input.toolbar.numbered": "Numbered",
  "input.toolbar.quote": "Quote",
  "input.toolbar.highlightYellow": "Yellow",
  "input.toolbar.highlightBlue": "Blue",
  "input.toolbar.highlightRed": "Red"
});

Object.assign(UI_STRINGS.tr, {
  "input.toolbar.bold": "Kalın",
  "input.toolbar.italic": "İtalik",
  "input.toolbar.underline": "Altı çizili",
  "input.toolbar.white": "Beyaz",
  "input.toolbar.softWhite": "Kırık beyaz",
  "input.toolbar.bullets": "Madde",
  "input.toolbar.numbered": "Numaralı",
  "input.toolbar.quote": "Alıntı",
  "input.toolbar.highlightYellow": "Sarı",
  "input.toolbar.highlightBlue": "Mavi",
  "input.toolbar.highlightRed": "Kırmızı"
});

Object.assign(UI_STRINGS.ar, {
  "input.toolbar.bold": "عريض",
  "input.toolbar.italic": "مائل",
  "input.toolbar.underline": "تحته خط",
  "input.toolbar.white": "أبيض",
  "input.toolbar.softWhite": "أبيض مائل للرمادي",
  "input.toolbar.bullets": "نقاط",
  "input.toolbar.numbered": "مرقمة",
  "input.toolbar.quote": "اقتباس",
  "input.toolbar.highlightYellow": "أصفر",
  "input.toolbar.highlightBlue": "أزرق",
  "input.toolbar.highlightRed": "أحمر"
});

Object.assign(UI_STRINGS.de, {
  "input.toolbar.bold": "Fett",
  "input.toolbar.italic": "Kursiv",
  "input.toolbar.underline": "Unterstrichen",
  "input.toolbar.white": "Weiß",
  "input.toolbar.softWhite": "Off-White",
  "input.toolbar.bullets": "Aufzählung",
  "input.toolbar.numbered": "Nummeriert",
  "input.toolbar.quote": "Zitat",
  "input.toolbar.highlightYellow": "Gelb",
  "input.toolbar.highlightBlue": "Blau",
  "input.toolbar.highlightRed": "Rot"
});

Object.assign(UI_STRINGS.fr, {
  "input.toolbar.bold": "Gras",
  "input.toolbar.italic": "Italique",
  "input.toolbar.underline": "Souligné",
  "input.toolbar.white": "Blanc",
  "input.toolbar.softWhite": "Blanc cassé",
  "input.toolbar.bullets": "Puces",
  "input.toolbar.numbered": "Numérotée",
  "input.toolbar.quote": "Citation",
  "input.toolbar.highlightYellow": "Jaune",
  "input.toolbar.highlightBlue": "Bleu",
  "input.toolbar.highlightRed": "Rouge"
});

Object.assign(UI_STRINGS.es, {
  "input.toolbar.bold": "Negrita",
  "input.toolbar.italic": "Cursiva",
  "input.toolbar.underline": "Subrayado",
  "input.toolbar.white": "Blanco",
  "input.toolbar.softWhite": "Blanco suave",
  "input.toolbar.bullets": "Viñetas",
  "input.toolbar.numbered": "Numerada",
  "input.toolbar.quote": "Cita",
  "input.toolbar.highlightYellow": "Amarillo",
  "input.toolbar.highlightBlue": "Azul",
  "input.toolbar.highlightRed": "Rojo"
});

Object.assign(UI_STRINGS.fr, {
  "doc.remoteInboxTitle": "Notifications Flow",
  "settings.remoteInjection": "Injection à distance",
  "settings.remoteSession": "Session du récepteur en direct",
  "settings.remoteTransport": "Transport à distance",
  "settings.remoteTransport.local": "Relais local",
  "settings.remoteTransport.cloud": "Relais cloud",
  "settings.remoteCloudHelp": "Le relais cloud utilise l'UUID actif et le mot de passe d'accès généré. Les expéditeurs ouvrent la page d'envoi cloud, et le relais vérifie que l'UUID est actif et que le mot de passe d'accès correspond.",
  "settings.remoteUuid": "UUID actif",
  "settings.remoteAccessPassword": "Mot de passe d'accès",
  "settings.remoteSenderPage": "Page d'envoi",
  "settings.remoteSenderQr": "QR de connexion rapide",
  "settings.remoteSenderQrHelp": "Scannez pour ouvrir la page d'envoi avec l'UUID et le mot de passe d'accès déjà remplis.",
  "settings.remoteSenderQrPending": "Ouvrez d'abord le téléprompteur pour que Flow publie un UUID actif et un mot de passe d'accès avant le scan.",
  "settings.remoteSenderQrUnavailable": "Le code QR n'est pas disponible tant que la page d'envoi cloud n'est pas configurée.",
  "settings.remoteStatusWaiting": "En attente de l'état du relais.",
  "settings.remotePublicHost": "Hôte public / domaine",
  "settings.remotePublicHostPlaceholder": "Exemple : flow.example.com ou 82.14.25.90",
  "settings.remoteLocalHelp": "Pour le relais local, l'expéditeur a besoin de votre adresse publique, de l'UUID et du mot de passe d'accès généré ci-dessus.",
  "settings.copyNothing": "Rien n'est encore disponible à copier.",
  "settings.copyFailed": "La copie a échoué. Vous pouvez quand même sélectionner la valeur manuellement.",
  "settings.copiedUuid": "UUID copié.",
  "settings.copiedAccessPassword": "Mot de passe d'accès copié.",
  "settings.copiedSenderLink": "Lien d'envoi copié.",
  "settings.copiedRealtimePassword": "Mot de passe temps réel copié.",
  "settings.copiedRealtimeLink": "Lien de la salle temps réel copié.",
  "settings.remoteStatusUnavailable": "L'état du relais n'est pas disponible pour le moment.",
  "settings.remoteStatusListeningPublic": "Le relais écoute sur le port {port}. Le lien d'envoi copié utilise l'hôte public que vous avez configuré.",
  "settings.remoteStatusListeningLocal": "Le relais écoute sur le port {port}. Ajoutez ci-dessous un hôte public ou un domaine si vous voulez que le lien copié fonctionne en dehors de votre réseau local.",
  "settings.remoteStatusPasswordMissing": "Le mot de passe d'accès est manquant. Redémarrez Flow pour en générer un nouveau.",
  "settings.remoteStatusHeartbeatStale": "Le heartbeat du récepteur est périmé. Ouvrez la fenêtre du téléprompteur pour rétablir la session en direct.",
  "settings.remoteSenderUnavailable": "Expéditeur cloud indisponible",
  "settings.remoteStatusCloudNeedsBuild": "Le relais cloud n'est pas encore configuré dans la version de l'application. Définissez l'URL une fois dans src/remote-config.js.",
  "settings.remoteStatusCloudRegister": "Le relais cloud est configuré. Ouvrez la fenêtre du téléprompteur pour démarrer les heartbeats et enregistrer ce récepteur.",
  "settings.remoteStatusCloudActive": "Le relais cloud est actif. Les expéditeurs ont besoin de l'UUID et du mot de passe d'accès généré.",
  "settings.remoteStatusCloudOffline": "Le relais cloud connaît ce récepteur, mais il est actuellement hors ligne. Laissez Flow ouvert pour recevoir les messages.",
  "remote.importance.normal": "NORMAL",
  "remote.importance.important": "IMPORTANT",
  "remote.cardHint": "Double-cliquez pour injecter · utilisez × pour refuser",
  "remote.rejectAria": "Refuser le message distant",
  "remote.fetchFailed": "Impossible de récupérer les messages cloud.",
  "remote.resolveFailed": "Impossible de traiter le message cloud.",
  "remote.acceptedAppending": "Message distant accepté. Ajout du texte…",
  "remote.denied": "Message distant refusé.",
  "remote.heartbeatFailed": "Le heartbeat cloud a échoué avec le statut {status}."
});

Object.assign(UI_STRINGS.es, {
  "doc.remoteInboxTitle": "Notificaciones de Flow",
  "settings.remoteInjection": "Inyección remota",
  "settings.remoteSession": "Sesión del receptor en vivo",
  "settings.remoteTransport": "Transporte remoto",
  "settings.remoteTransport.local": "Relé local",
  "settings.remoteTransport.cloud": "Relé en la nube",
  "settings.remoteCloudHelp": "El relé en la nube usa el UUID activo y la contraseña de acceso generada. Los remitentes abren la página del remitente en la nube y el relé comprueba que el UUID siga activo y que la contraseña de acceso coincida.",
  "settings.remoteUuid": "UUID activo",
  "settings.remoteAccessPassword": "Contraseña de acceso",
  "settings.remoteSenderPage": "Página del remitente",
  "settings.remoteSenderQr": "QR de conexión rápida",
  "settings.remoteSenderQrHelp": "Escanea para abrir la página del remitente con el UUID y la contraseña de acceso ya rellenados.",
  "settings.remoteSenderQrPending": "Abre primero el teleprónter para que Flow publique un UUID activo y una contraseña de acceso antes de escanear.",
  "settings.remoteSenderQrUnavailable": "El código QR no está disponible hasta que se configure la página del remitente en la nube.",
  "settings.remoteStatusWaiting": "Esperando el estado del relé.",
  "settings.remotePublicHost": "Host público / dominio",
  "settings.remotePublicHostPlaceholder": "Ejemplo: flow.example.com o 82.14.25.90",
  "settings.remoteLocalHelp": "Para el relé local, el remitente necesita tu dirección pública, el UUID y la contraseña de acceso generada arriba.",
  "settings.copyNothing": "Todavía no hay nada disponible para copiar.",
  "settings.copyFailed": "La copia falló. Aun así puedes seleccionar el valor manualmente.",
  "settings.copiedUuid": "UUID copiado.",
  "settings.copiedAccessPassword": "Contraseña de acceso copiada.",
  "settings.copiedSenderLink": "Enlace del remitente copiado.",
  "settings.copiedRealtimePassword": "Contraseña de tiempo real copiada.",
  "settings.copiedRealtimeLink": "Enlace de la sala en tiempo real copiado.",
  "settings.remoteStatusUnavailable": "El estado del relé no está disponible en este momento.",
  "settings.remoteStatusListeningPublic": "El relé está escuchando en el puerto {port}. El enlace del remitente copiado usa el host público que configuraste.",
  "settings.remoteStatusListeningLocal": "El relé está escuchando en el puerto {port}. Añade abajo un host público o un dominio si quieres que el enlace copiado funcione fuera de tu red local.",
  "settings.remoteStatusPasswordMissing": "Falta la contraseña de acceso. Reinicia Flow para generar una nueva.",
  "settings.remoteStatusHeartbeatStale": "El latido del receptor está obsoleto. Abre la ventana del teleprónter para restaurar la sesión en vivo.",
  "settings.remoteSenderUnavailable": "Remitente en la nube no disponible",
  "settings.remoteStatusCloudNeedsBuild": "El relé en la nube todavía no está configurado en la compilación de la aplicación. Define la URL una vez en src/remote-config.js.",
  "settings.remoteStatusCloudRegister": "El relé en la nube está configurado. Abre la ventana del teleprónter para iniciar los latidos y registrar este receptor.",
  "settings.remoteStatusCloudActive": "El relé en la nube está activo. Los remitentes necesitan el UUID y la contraseña de acceso generada.",
  "settings.remoteStatusCloudOffline": "El relé en la nube conoce este receptor, pero ahora mismo está desconectado. Mantén Flow abierto para recibir mensajes.",
  "remote.importance.normal": "NORMAL",
  "remote.importance.important": "IMPORTANTE",
  "remote.cardHint": "Haz doble clic para inyectar · usa × para rechazar",
  "remote.rejectAria": "Rechazar mensaje remoto",
  "remote.fetchFailed": "No se pudieron obtener los mensajes en la nube.",
  "remote.resolveFailed": "No se pudo resolver el mensaje en la nube.",
  "remote.acceptedAppending": "Mensaje remoto aceptado. Añadiendo texto…",
  "remote.denied": "Mensaje remoto rechazado.",
  "remote.heartbeatFailed": "El latido del relé en la nube falló con el estado {status}."
});

Object.assign(UI_STRINGS.tr, {
  "settings.remoteRealtimeSection": "Gerçek zamanlı düzenleme",
  "settings.remoteRealtimeHelp": "Canlı metin düzenleme için özel bir tarayıcı odası oluşturun. Teleprompter yetkili kalır ve bulut rölesi yalnızca el sıkışmasını taşır.",
  "settings.remoteRealtimeUnavailable": "Bulut rölesi adresi yapılandırılana kadar gerçek zamanlı düzenleme kullanılamaz.",
  "settings.remoteRealtimePending": "Gerçek zamanlı düzenlemeyi başlatmadan önce Flow'un etkin UUID yayımlayabilmesi için teleprompteri açın.",
  "settings.remoteRealtimeReady": "Gerçek zamanlı düzenleme hazır. Tarayıcı düzenleyicisini bağlamak için oda bağlantısını açın veya kopyalayın.",
  "settings.remoteRealtimePassword": "Gerçek zamanlı parola",
  "settings.remoteRealtimeLinkLabel": "Gerçek zamanlı oda bağlantısı",
  "settings.remoteRealtimeRoomLink": "Gerçek zamanlı odayı aç",
  "settings.remoteRealtimeQrHelp": "Gerçek zamanlı odayı tarayıcı düzenleyicisinde doğrudan açmak için tarayın.",
  "settings.remoteRealtimeQrPending": "Oda QR kodunu oluşturmak için gerçek zamanlı düzenlemeyi başlatın.",
  "settings.remoteRealtimePublishing": "Gerçek zamanlı düzenleme başlatılıyor. Flow odayı yayımlarken teleprompteri açık tutun.",
  "settings.remoteRealtimeOnline": "Bir tarayıcı düzenleyicisi gerçek zamanlı düzenlemeye bağlandı. İş birliğine devam etmek için odayı açın veya tarayın.",
  "settings.remoteRealtimeRelayUnavailable": "Yapılandırılmış gerçek zamanlı röle sitesine şu an ulaşılamıyor. Odayı açmadan önce dağıtımı veya bulut rölesi adresini düzeltin.",
  "settings.remoteRealtimeBadgeIdle": "Boşta",
  "settings.remoteRealtimeBadgeWaiting": "Bekleniyor",
  "settings.remoteRealtimeBadgeAvailable": "Hazır",
  "settings.remoteRealtimeBadgeOnline": "Bağlı",
  "settings.remoteRealtimeBadgeUnavailable": "Kullanılamıyor",
  "settings.remoteRealtimeInit": "Oda oluştur",
  "settings.remoteRealtimeClose": "Odayı kapat",
  "settings.remoteRealtimeInitializing": "Oda oluşturuluyor…"
});

Object.assign(UI_STRINGS.ar, {
  "settings.remoteRealtimeSection": "التحرير الفوري",
  "settings.remoteRealtimeHelp": "أنشئ غرفة متصفح خاصة لتحرير النص مباشرة. يبقى الملقن هو المصدر المعتمد بينما ينقل المرحل السحابي المصافحة فقط.",
  "settings.remoteRealtimeUnavailable": "التحرير الفوري غير متاح حتى يتم إعداد رابط المرحل السحابي.",
  "settings.remoteRealtimePending": "افتح الملقن أولاً حتى يتمكن Flow من نشر UUID نشط قبل تهيئة التحرير الفوري.",
  "settings.remoteRealtimeReady": "التحرير الفوري جاهز. افتح رابط الغرفة أو انسخه لتوصيل محرر المتصفح.",
  "settings.remoteRealtimePassword": "كلمة مرور التحرير الفوري",
  "settings.remoteRealtimeLinkLabel": "رابط غرفة التحرير الفوري",
  "settings.remoteRealtimeRoomLink": "افتح غرفة التحرير الفوري",
  "settings.remoteRealtimeQrHelp": "امسح لفتح غرفة التحرير الفوري مباشرة في محرر المتصفح.",
  "settings.remoteRealtimeQrPending": "هيئ التحرير الفوري لإنشاء رمز QR للغرفة.",
  "settings.remoteRealtimePublishing": "يتم تهيئة التحرير الفوري. اترك الملقن مفتوحاً بينما ينشر Flow الغرفة.",
  "settings.remoteRealtimeOnline": "اتصل محرر متصفح بالتحرير الفوري. افتح الغرفة أو امسحها لمتابعة التعاون.",
  "settings.remoteRealtimeRelayUnavailable": "يتعذر الوصول حالياً إلى موقع المرحل الفوري المُعد. أصلح النشر أو رابط المرحل السحابي قبل فتح الغرفة.",
  "settings.remoteRealtimeBadgeIdle": "خامل",
  "settings.remoteRealtimeBadgeWaiting": "بانتظار",
  "settings.remoteRealtimeBadgeAvailable": "متاح",
  "settings.remoteRealtimeBadgeOnline": "متصل",
  "settings.remoteRealtimeBadgeUnavailable": "غير متاح",
  "settings.remoteRealtimeInit": "أنشئ الغرفة",
  "settings.remoteRealtimeClose": "أغلق الغرفة",
  "settings.remoteRealtimeInitializing": "يتم إنشاء الغرفة..."
});

Object.assign(UI_STRINGS.de, {
  "settings.remoteRealtimeSection": "Echtzeitbearbeitung",
  "settings.remoteRealtimeHelp": "Erstelle einen privaten Browserraum fur die Live-Bearbeitung des Skripts. Der Teleprompter bleibt autoritativ, und das Cloud-Relay ubertragt nur den Verbindungsaufbau.",
  "settings.remoteRealtimeUnavailable": "Die Echtzeitbearbeitung ist erst verfugbar, wenn die Cloud-Relay-URL konfiguriert ist.",
  "settings.remoteRealtimePending": "Offne zuerst den Teleprompter, damit Flow vor der Initialisierung der Echtzeitbearbeitung eine aktive UUID veroffentlichen kann.",
  "settings.remoteRealtimeReady": "Die Echtzeitbearbeitung ist bereit. Offne oder kopiere den Raumlink, um einen Browser-Editor zu verbinden.",
  "settings.remoteRealtimePassword": "Echtzeitpasswort",
  "settings.remoteRealtimeLinkLabel": "Echtzeit-Raumlink",
  "settings.remoteRealtimeRoomLink": "Echtzeitraum offnen",
  "settings.remoteRealtimeQrHelp": "Scanne, um den Echtzeitraum direkt im Browser-Editor zu offnen.",
  "settings.remoteRealtimeQrPending": "Initialisiere die Echtzeitbearbeitung, um den QR-Code fur den Raum zu erzeugen.",
  "settings.remoteRealtimePublishing": "Die Echtzeitbearbeitung wird initialisiert. Lass den Teleprompter geoffnet, wahrend Flow den Raum veroffentlicht.",
  "settings.remoteRealtimeOnline": "Ein Browser-Editor ist mit der Echtzeitbearbeitung verbunden. Offne oder scanne den Raum, um weiter zusammenzuarbeiten.",
  "settings.remoteRealtimeRelayUnavailable": "Die konfigurierte Echtzeit-Relay-Website ist derzeit nicht erreichbar. Behebe das Deployment oder die Cloud-Relay-URL, bevor du den Raum offnest.",
  "settings.remoteRealtimeBadgeIdle": "Leerlauf",
  "settings.remoteRealtimeBadgeWaiting": "Warten",
  "settings.remoteRealtimeBadgeAvailable": "Verfugbar",
  "settings.remoteRealtimeBadgeOnline": "Verbunden",
  "settings.remoteRealtimeBadgeUnavailable": "Nicht verfugbar",
  "settings.remoteRealtimeInit": "Raum erstellen",
  "settings.remoteRealtimeClose": "Raum schliessen",
  "settings.remoteRealtimeInitializing": "Raum wird erstellt..."
});

Object.assign(UI_STRINGS.fr, {
  "settings.remoteRealtimeSection": "Edition en temps reel",
  "settings.remoteRealtimeHelp": "Creez une salle de navigateur privee pour modifier le script en direct. Le teleprompteur reste la source d'autorite et le relais cloud ne transporte que l'etablissement de la connexion.",
  "settings.remoteRealtimeUnavailable": "L'edition en temps reel n'est pas disponible tant que l'URL du relais cloud n'est pas configuree.",
  "settings.remoteRealtimePending": "Ouvrez d'abord le teleprompteur pour que Flow puisse publier un UUID actif avant d'initialiser l'edition en temps reel.",
  "settings.remoteRealtimeReady": "L'edition en temps reel est prete. Ouvrez ou copiez le lien de la salle pour connecter un editeur dans le navigateur.",
  "settings.remoteRealtimePassword": "Mot de passe temps reel",
  "settings.remoteRealtimeLinkLabel": "Lien de la salle temps reel",
  "settings.remoteRealtimeRoomLink": "Ouvrir la salle temps reel",
  "settings.remoteRealtimeQrHelp": "Scannez pour ouvrir directement la salle temps reel dans l'editeur du navigateur.",
  "settings.remoteRealtimeQrPending": "Initialisez l'edition en temps reel pour generer le QR code de la salle.",
  "settings.remoteRealtimePublishing": "L'edition en temps reel s'initialise. Laissez le teleprompteur ouvert pendant que Flow publie la salle.",
  "settings.remoteRealtimeOnline": "Un editeur de navigateur est connecte a l'edition en temps reel. Ouvrez ou scannez la salle pour continuer a collaborer.",
  "settings.remoteRealtimeRelayUnavailable": "Le site du relais temps reel configure est actuellement inaccessible. Corrigez le deploiement ou l'URL du relais cloud avant d'ouvrir la salle.",
  "settings.remoteRealtimeBadgeIdle": "Inactif",
  "settings.remoteRealtimeBadgeWaiting": "Attente",
  "settings.remoteRealtimeBadgeAvailable": "Disponible",
  "settings.remoteRealtimeBadgeOnline": "Connecte",
  "settings.remoteRealtimeBadgeUnavailable": "Indisponible",
  "settings.remoteRealtimeInit": "Creer la salle",
  "settings.remoteRealtimeClose": "Fermer la salle",
  "settings.remoteRealtimeInitializing": "Creation de la salle..."
});

Object.assign(UI_STRINGS.es, {
  "settings.remoteRealtimeSection": "Edicion en tiempo real",
  "settings.remoteRealtimeHelp": "Crea una sala privada del navegador para editar el guion en vivo. El teleprompter sigue siendo la fuente autoritativa y el relay en la nube solo lleva el enlace inicial.",
  "settings.remoteRealtimeUnavailable": "La edicion en tiempo real no esta disponible hasta que se configure la URL del relay en la nube.",
  "settings.remoteRealtimePending": "Abre primero el teleprompter para que Flow pueda publicar un UUID activo antes de iniciar la edicion en tiempo real.",
  "settings.remoteRealtimeReady": "La edicion en tiempo real esta lista. Abre o copia el enlace de la sala para conectar un editor del navegador.",
  "settings.remoteRealtimePassword": "Contrasena de tiempo real",
  "settings.remoteRealtimeLinkLabel": "Enlace de la sala en tiempo real",
  "settings.remoteRealtimeRoomLink": "Abrir sala en tiempo real",
  "settings.remoteRealtimeQrHelp": "Escanea para abrir directamente la sala en tiempo real en el editor del navegador.",
  "settings.remoteRealtimeQrPending": "Inicia la edicion en tiempo real para generar el codigo QR de la sala.",
  "settings.remoteRealtimePublishing": "La edicion en tiempo real se esta iniciando. Mantén el teleprompter abierto mientras Flow publica la sala.",
  "settings.remoteRealtimeOnline": "Un editor del navegador esta conectado a la edicion en tiempo real. Abre o escanea la sala para seguir colaborando.",
  "settings.remoteRealtimeRelayUnavailable": "El sitio configurado del relay en tiempo real no es accesible ahora mismo. Corrige el despliegue o la URL del relay en la nube antes de abrir la sala.",
  "settings.remoteRealtimeBadgeIdle": "Inactivo",
  "settings.remoteRealtimeBadgeWaiting": "En espera",
  "settings.remoteRealtimeBadgeAvailable": "Disponible",
  "settings.remoteRealtimeBadgeOnline": "Conectado",
  "settings.remoteRealtimeBadgeUnavailable": "No disponible",
  "settings.remoteRealtimeInit": "Crear sala",
  "settings.remoteRealtimeClose": "Cerrar sala",
  "settings.remoteRealtimeInitializing": "Creando sala..."
});

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
  ar: '"Segoe UI Variable Text", "Segoe UI", Tahoma, "Noto Sans Arabic UI", "Noto Sans Arabic", Arial, sans-serif'
};

const RTL_CHARACTERS = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/g;
const LTR_CHARACTERS = /[A-Za-z\u00C0-\u024F]/g;
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

function createDefaults() {
  return structuredClone(defaultState);
}

function normalizeLocaleDigits(value) {
  return String(value || "")
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06F0))
    .replace(/[\uFF10-\uFF19]/g, (digit) => String(digit.charCodeAt(0) - 0xFF10))
    .replace(/\u066B/g, ".")
    .replace(/\u066C/g, ",");
}

export function parseLocaleNumber(value) {
  if (typeof value === "number") {
    return value;
  }

  let source = normalizeLocaleDigits(value).trim();
  if (!source) {
    return Number.NaN;
  }

  source = source.replace(/[\s\u00A0\u202F']/g, "");

  const commaCount = (source.match(/,/g) || []).length;
  const dotCount = (source.match(/\./g) || []).length;

  if (commaCount && dotCount) {
    source = source.lastIndexOf(",") > source.lastIndexOf(".")
      ? source.replace(/\./g, "").replace(/,/g, ".")
      : source.replace(/,/g, "");
  } else if (commaCount) {
    const looksGrouped = /^[-+]?\d{1,3}(?:,\d{3})+$/.test(source);
    source = looksGrouped ? source.replace(/,/g, "") : source.replace(/,/g, ".");
  }

  return Number(source);
}

function normalizeColor(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^#([\da-f]{3}|[\da-f]{6})$/i.test(trimmed) ? trimmed : fallback;
}

function normalizeOpacity(value, fallback) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 10, 100);
}

function normalizeAppOpacity(value, fallback) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 15, 100);
}

function normalizeTextScale(value, fallback) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 30, 180);
}

function normalizeScrollStartDelaySeconds(value, fallback) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 0, 10);
}

function normalizeFontFamily(value, fallback) {
  return Object.hasOwn(FONT_STACKS, value) ? value : fallback;
}

function normalizeSpeed(value, fallback) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return clamp(Math.round(numeric), MIN_SPEED, MAX_SPEED);
}

function normalizeTheme(value, fallback) {
  return THEME_OPTIONS.some((option) => option.value === value) ? value : fallback;
}

function normalizeStyle(value, fallback) {
  return STYLE_OPTIONS.some((option) => option.value === value) ? value : fallback;
}

export function getThemeTeleprompterTextColor(theme) {
  return normalizeTheme(theme, defaultState.appearance.theme) === "bright" ? "#000000" : "#ffffff";
}

function normalizeTeleprompterTextColor(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized) ? normalized : fallback;
}

function normalizeLanguage(value, fallback) {
  return LANGUAGE_OPTIONS.some((option) => option.value === value) ? value : fallback;
}

function normalizeGroqSelect(value, options, fallback) {
  return options.some((option) => option.value === value) ? value : fallback;
}

function normalizeGroqText(value, fallback = "", maxLength = 2000) {
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

function describeGroqPersonality(personality) {
  switch (personality) {
    case "confident":
      return "Use a confident, decisive speaking style.";
    case "friendly":
      return "Use a warm, approachable speaking style.";
    case "professional":
      return "Use a polished, professional speaking style.";
    case "persuasive":
      return "Use a persuasive, high-conviction speaking style.";
    default:
      return "Use a natural, human speaking style.";
  }
}

function describeGroqGrammarLevel(grammarLevel) {
  switch (grammarLevel) {
    case "relaxed":
      return "Keep grammar slightly relaxed and conversational without becoming sloppy.";
    case "polished":
      return "Use polished grammar and tighter sentence structure.";
    default:
      return "Use standard grammar that sounds clear and smooth when spoken aloud.";
  }
}

function describeGroqEmojiUsage(emojiUsage) {
  return emojiUsage === "on"
    ? "You may use a small number of emojis only when they genuinely improve tone or clarity."
    : "Do not use emojis.";
}

function describeGroqAcademicWordUsage(academicWordUsage) {
  switch (academicWordUsage) {
    case "aggressive":
      return "Lean heavily into academic, formal, and intellectually dense wording when it still remains readable aloud.";
    case "on":
      return "You may use moderately academic wording when it helps precision or credibility.";
    default:
      return "Avoid academic jargon unless the user's instruction explicitly requires it.";
  }
}

function describeGroqPointOfView(pointOfView) {
  return pointOfView === "third-person"
    ? "Prefer third-person framing and avoid writing from the speaker's personal 'I' perspective unless the user's instruction explicitly requires it."
    : "Prefer first-person phrasing when the script speaks for the user personally.";
}

export function buildGroqRequest({
  instruction = "",
  script = "",
  groqSettings = defaultState.groq,
  appLanguage = defaultState.language
} = {}) {
  const normalizedSettings = normalizeGroqSettings(groqSettings, defaultState.groq);
  const normalizedInstruction = String(instruction || "").trim();
  const normalizedScript = String(script || "").trim();
  const outputLanguage = resolveGroqOutputLanguage(normalizedSettings.outputLanguage, appLanguage);
  const preferences = [
    `Write the final script in ${getLanguageLabel(outputLanguage)}.`,
    "Optimize for teleprompter delivery: natural rhythm, clean punctuation, and sentences that are easy to read aloud.",
    describeGroqPersonality(normalizedSettings.personality),
    describeGroqGrammarLevel(normalizedSettings.grammarLevel),
    describeGroqEmojiUsage(normalizedSettings.emojiUsage),
    describeGroqAcademicWordUsage(normalizedSettings.academicWordUsage),
    describeGroqPointOfView(normalizedSettings.pointOfView)
  ];

  if (normalizedSettings.userContext) {
    preferences.push(`User context: ${normalizedSettings.userContext}`);
  }

  return [
    "You are editing or generating teleprompter text.",
    "Always follow the user's instruction exactly.",
    "If existing teleprompter text is provided, use it as the source text and rewrite or transform it according to the user's instruction.",
    "If no existing teleprompter text is provided, generate new teleprompter text from the user's instruction only.",
    "If the user's direct instruction conflicts with a saved preference, follow the user's direct instruction.",
    "Make sure that there are no hallucinated facts in the output and make sure that you do not add any hallucinated letters or words that don't make sense or are in the wrong language.",
    "Return only the final teleprompter text.",
    "Do not include any intro, label, explanation, notes, or quotation marks.",
    `PREFERENCES:\n${preferences.join("\n")}`,
    `USER INSTRUCTION:\n${normalizedInstruction || "Use the existing teleprompter text and improve it for teleprompter delivery."}`,
    normalizedScript ? `EXISTING TELEPROMPTER TEXT:\n${normalizedScript}` : ""
  ].filter(Boolean).join("\n\n");
}

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

function normalizeRemoteCredential(value, fallback, maxLength = 128) {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim().slice(0, maxLength);
}

function normalizeRemoteHost(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "").slice(0, 255);
}

function normalizeRemoteProvider(value, fallback) {
  return value === "cloud" ? "cloud" : fallback;
}

function normalizeDesktopSettings(value, fallback) {
  return {
    hideFromCapture: value?.hideFromCapture ?? fallback.hideFromCapture,
    useSystemTray: value?.useSystemTray ?? fallback.useSystemTray,
    preventSleep: value?.preventSleep ?? fallback.preventSleep,
    clickthroughShortcutEnabled: value?.clickthroughShortcutEnabled ?? fallback.clickthroughShortcutEnabled
  };
}

function normalizeWindowSettings(value, fallback) {
  const merged = {
    ...fallback,
    ...(value || {})
  };

  const width = parseLocaleNumber(merged.width);
  const height = parseLocaleNumber(merged.height);
  const x = parseLocaleNumber(merged.x);
  const y = parseLocaleNumber(merged.y);

  merged.width = Number.isFinite(width) && width > 0 && width <= 10_000
    ? Math.round(width)
    : fallback.width;
  merged.height = Number.isFinite(height) && height > 0 && height <= 10_000
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

function generateRemoteId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `flow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function generateRemoteSecret() {
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

export function getLanguageDirection(language) {
  return language === "ar" ? "rtl" : "ltr";
}

export function translate(key, language = defaultState.language, params = {}) {
  const normalizedLanguage = normalizeLanguage(language, defaultState.language);
  const template = UI_STRINGS[normalizedLanguage]?.[key] ?? UI_STRINGS.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}

const WAIT_CARD_PATTERNS = [
  /^(.*?\bwait\s+)(\d+(?:[.,\u066B]\d+)?)(\s*(?:seconds?|secs?|s)?[\s\S]*)$/iu,
  /^(.*?)(\d+(?:[.,\u066B]\d+)?)(\s*(?:san[iıİI]ye|sn|s)\s*bekle[\s\S]*)$/iu,
  /^(.*?\bbekle\s+)(\d+(?:[.,\u066B]\d+)?)(\s*(?:san[iıİI]ye|sn|s)?[\s\S]*)$/iu,
  /^(.*?انتظر\s+)(\d+(?:[.,\u066B]\d+)?)(\s*(?:ثوان(?:ٍ|ي)?|ثانية)?[\s\S]*)$/u,
  /^(.*?\bwarte\s+)(\d+(?:[.,\u066B]\d+)?)(\s*(?:sekunden?|sek|s)?[\s\S]*)$/iu,
  /^(.*?\battends\s+)(\d+(?:[.,\u066B]\d+)?)(\s*(?:secondes?|sec|s)?[\s\S]*)$/iu,
  /^(.*?\battendez\s+)(\d+(?:[.,\u066B]\d+)?)(\s*(?:secondes?|sec|s)?[\s\S]*)$/iu,
  /^(.*?\battendre\s+)(\d+(?:[.,\u066B]\d+)?)(\s*(?:secondes?|sec|s)?[\s\S]*)$/iu,
  /^(.*?\bespera\s+)(\d+(?:[.,\u066B]\d+)?)(\s*(?:segundos?|seg|s)?[\s\S]*)$/iu,
  /^(.*?\besperar\s+)(\d+(?:[.,\u066B]\d+)?)(\s*(?:segundos?|seg|s)?[\s\S]*)$/iu
];

export function parseWaitCardText(text) {
  const source = String(text || "").trim();
  if (!source) {
    return null;
  }

  for (const pattern of WAIT_CARD_PATTERNS) {
    const match = source.match(pattern);
    if (!match) {
      continue;
    }

    const seconds = parseLocaleNumber(match[2]);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return null;
    }

    return {
      prefix: match[1].trim(),
      seconds: Math.max(1, Math.round(seconds)),
      suffix: match[3].trim()
    };
  }

  return null;
}

export function applyTranslationsToDocument(language = defaultState.language, target = document) {
  const normalizedLanguage = normalizeLanguage(language, defaultState.language);
  const uiDirection = "ltr";
  if (target.documentElement) {
    target.documentElement.lang = normalizedLanguage;
    target.documentElement.dir = uiDirection;
    target.documentElement.style.setProperty("--flow-ui-font-family", resolveLanguageSystemFontStack(normalizedLanguage));
  }
  if (target.body) {
    target.body.dataset.language = normalizedLanguage;
    target.body.dataset.uiDirection = uiDirection;
  }

  target.querySelectorAll?.("[data-i18n]").forEach((element) => {
    element.textContent = translate(element.dataset.i18n, normalizedLanguage);
    element.dir = uiDirection;
  });
  target.querySelectorAll?.("[data-i18n-html]").forEach((element) => {
    element.innerHTML = translate(element.dataset.i18nHtml, normalizedLanguage);
    element.dir = uiDirection;
  });
  target.querySelectorAll?.("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", translate(element.dataset.i18nPlaceholder, normalizedLanguage));
    element.dir = uiDirection;
  });
  target.querySelectorAll?.("[data-i18n-title]").forEach((element) => {
    const value = translate(element.dataset.i18nTitle, normalizedLanguage);
    element.setAttribute("title", value);
  });
  target.querySelectorAll?.("[data-i18n-aria-label]").forEach((element) => {
    const value = translate(element.dataset.i18nAriaLabel, normalizedLanguage);
    element.setAttribute("aria-label", value);
  });
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
  normalized.groq = normalizeGroqSettings(normalized.groq, defaults.groq);

  return normalized;
}

function mergeState(currentState, nextState = {}) {
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
      : currentState.groq
  });
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function stripFormattingMarkers(text) {
  return String(text || "")
    .replace(/\[card[^\]]*\]|\[\/card\]/gi, " ")
    .replace(/\[(?:\/)?(?:u|yellow|blue|red)\]/gi, " ")
    .replace(/\*\*|\*|==/g, " ");
}

function parseCardDescriptor(rawTag) {
  const parts = String(rawTag || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts[0] !== "card") {
    return null;
  }

  let placement = "centered";
  let tone = "neutral";
  const supportedTones = new Set(["warning", "pause", "delivery", "cue", "identity", "bookend", "neutral"]);

  parts.slice(1).forEach((part) => {
    if (part === "centered" || part === "between") {
      placement = part;
      return;
    }

    if (supportedTones.has(part)) {
      tone = part;
    }
  });

  return { placement, tone };
}

export function detectTextDirection(text) {
  const source = stripFormattingMarkers(text);
  const rtlMatches = source.match(RTL_CHARACTERS) || [];
  const ltrMatches = source.match(LTR_CHARACTERS) || [];

  if (rtlMatches.length === 0) {
    return "ltr";
  }

  if (ltrMatches.length === 0) {
    return "rtl";
  }

  return rtlMatches.length >= ltrMatches.length ? "rtl" : "ltr";
}

export function applyTextDirection(target, text) {
  if (!target) return "ltr";
  const direction = detectTextDirection(text);
  target.setAttribute("dir", direction);
  target.dataset.textDirection = direction;
  return direction;
}

function pushToken(tokens, token) {
  const previous = tokens[tokens.length - 1];

  if (token.type === "space") {
    if (!previous || previous.type === "space" || previous.type === "newline") {
      return;
    }
  }

  if (token.type === "newline") {
    if (previous?.type === "space") {
      tokens.pop();
    }

    if (previous?.type === "newline") {
      return;
    }
  }

  tokens.push(token);
}

function matchLineBlockMarker(source, index) {
  const slice = source.slice(index);
  const match = slice.match(/^(?:[ \t]{0,3})(>+[ \t]+|[-*+][ \t]+|(\d+)[.)][ \t]+)/u);
  if (!match) {
    return null;
  }

  if (match[2]) {
    return {
      type: "list-item-start",
      ordered: true,
      marker: `${match[2]}.`,
      length: match[0].length
    };
  }

  if (match[1]?.trim().startsWith(">")) {
    return {
      type: "blockquote-start",
      length: match[0].length
    };
  }

  return {
    type: "list-item-start",
    ordered: false,
    marker: "•",
    length: match[0].length
  };
}

function flushBuffer(tokens, buffer, style) {
  if (!buffer) return;

  let currentWord = "";
  const commitWord = () => {
    if (!currentWord) return;
    tokens.push({
      type: "word",
      text: currentWord,
      style: { ...style }
    });
    currentWord = "";
  };

  for (const char of buffer) {
    if (char === "\r") continue;

    if (char === "\n") {
      commitWord();
      pushToken(tokens, { type: "newline" });
      continue;
    }

    if (/\s/.test(char)) {
      commitWord();
      pushToken(tokens, { type: "space" });
      continue;
    }

    currentWord += char;
  }

  commitWord();
}

export function parseFormattedScript(text) {
  const source = String(text || "");
  const tokens = [];
  let buffer = "";
  let atLineStart = true;
  let activeLineBlock = null;
  let style = {
    bold: false,
    italic: false,
    underline: false,
    highlight: null,
    textTone: null
  };

  const applyTag = (tag) => {
    switch (tag) {
      case "u":
        style = { ...style, underline: true };
        return true;
      case "/u":
        style = { ...style, underline: false };
        return true;
      case "white":
        style = { ...style, textTone: "white" };
        return true;
      case "/white":
        style = { ...style, textTone: style.textTone === "white" ? null : style.textTone };
        return true;
      case "softwhite":
        style = { ...style, textTone: "softwhite" };
        return true;
      case "/softwhite":
        style = { ...style, textTone: style.textTone === "softwhite" ? null : style.textTone };
        return true;
      case "yellow":
        style = { ...style, highlight: "yellow" };
        return true;
      case "/yellow":
        style = { ...style, highlight: style.highlight === "yellow" ? null : style.highlight };
        return true;
      case "blue":
        style = { ...style, highlight: "blue" };
        return true;
      case "/blue":
        style = { ...style, highlight: style.highlight === "blue" ? null : style.highlight };
        return true;
      case "red":
        style = { ...style, highlight: "red" };
        return true;
      case "/red":
        style = { ...style, highlight: style.highlight === "red" ? null : style.highlight };
        return true;
      default:
        return false;
    }
  };

  const flush = () => {
    flushBuffer(tokens, buffer, style);
    buffer = "";
  };

  const closeLineBlock = () => {
    if (!activeLineBlock) {
      return;
    }

    tokens.push({ type: "block-end", blockKind: activeLineBlock });
    activeLineBlock = null;
  };

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\r") {
      continue;
    }

    if (atLineStart) {
      const blockMarker = matchLineBlockMarker(source, index);
      if (blockMarker) {
        flush();
        activeLineBlock = blockMarker.type === "blockquote-start" ? "blockquote" : "list-item";
        tokens.push(blockMarker);
        index += blockMarker.length - 1;
        atLineStart = false;
        continue;
      }

      if (source[index] === " " || source[index] === "\t") {
        continue;
      }
    }

    if (source[index] === "[") {
      const closingIndex = source.indexOf("]", index + 1);
      if (closingIndex !== -1) {
        const tag = source.slice(index + 1, closingIndex).trim().toLowerCase();
        const cardDescriptor = parseCardDescriptor(tag);
        if (cardDescriptor) {
          const closeCardIndex = source.indexOf("[/card]", closingIndex + 1);
          if (closeCardIndex !== -1) {
            flush();
            const cardText = source.slice(closingIndex + 1, closeCardIndex)
              .replace(/\r/g, "")
              .replace(/\s+/g, " ")
              .trim();

            if (cardText) {
              tokens.push({
                type: "card",
                text: cardText,
                placement: cardDescriptor.placement,
                tone: cardDescriptor.tone
              });
            }

            index = closeCardIndex + "[/card]".length - 1;
            continue;
          }
        }

        const isFormattingTag = ["u", "/u", "white", "/white", "softwhite", "/softwhite", "yellow", "/yellow", "blue", "/blue", "red", "/red"].includes(tag);
        if (isFormattingTag) {
          flush();
          applyTag(tag);
          index = closingIndex;
          continue;
        }
      }
    }

    if (source.startsWith("**", index)) {
      flush();
      style = { ...style, bold: !style.bold };
      index += 1;
      continue;
    }

    if (source.startsWith("==", index)) {
      flush();
      style = { ...style, highlight: style.highlight === "yellow" ? null : "yellow" };
      index += 1;
      continue;
    }

    if (source[index] === "*") {
      flush();
      style = { ...style, italic: !style.italic };
      continue;
    }

    if (source[index] === "\n") {
      flush();
      if (activeLineBlock) {
        closeLineBlock();
      } else {
        pushToken(tokens, { type: "newline" });
      }
      atLineStart = true;
      continue;
    }

    buffer += source[index];
    atLineStart = false;
  }

  flush();
  closeLineBlock();

  while (tokens[tokens.length - 1]?.type === "space" || tokens[tokens.length - 1]?.type === "newline") {
    tokens.pop();
  }

  return tokens;
}

export function splitWords(text) {
  return parseFormattedScript(text)
    .filter((token) => token.type === "word")
    .map((token) => token.text);
}

function readBrowserStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeBrowserStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore browser storage failures and continue with in-memory state.
  }
}

function readCachedStateFromBrowser() {
  try {
    const raw = readBrowserStorage(STORAGE_KEY);
    if (!raw) {
      return createDefaults();
    }

    return normalizeState(JSON.parse(raw));
  } catch {
    return createDefaults();
  }
}

function normalizeVoiceModelRegistry(rawRegistry = {}) {
  if (!rawRegistry || typeof rawRegistry !== "object" || Array.isArray(rawRegistry)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(rawRegistry).map(([language, entry]) => {
      const normalizedLanguage = normalizeVoiceLanguage(language);
      const nextEntry = entry && typeof entry === "object" && !Array.isArray(entry)
        ? { ...entry }
        : {};
      const models = nextEntry.models && typeof nextEntry.models === "object" && !Array.isArray(nextEntry.models)
        ? Object.fromEntries(
            Object.entries(nextEntry.models).map(([modelId, modelEntry]) => [
              String(modelId || "").trim(),
              modelEntry && typeof modelEntry === "object" && !Array.isArray(modelEntry)
                ? { ...modelEntry, modelId: String(modelId || "").trim() }
                : { modelId: String(modelId || "").trim() }
            ]).filter(([modelId]) => Boolean(modelId))
          )
        : {};

      return [normalizedLanguage, {
        ...nextEntry,
        language: normalizedLanguage,
        selectedModelId: typeof nextEntry.selectedModelId === "string" && nextEntry.selectedModelId.trim()
          ? nextEntry.selectedModelId.trim()
          : "",
        models
      }];
    })
  );
}

function readCachedVoiceModelRegistryFromBrowser() {
  try {
    const raw = readBrowserStorage(VOICE_MODEL_REGISTRY_KEY);
    if (!raw) {
      return {};
    }

    return normalizeVoiceModelRegistry(JSON.parse(raw));
  } catch {
    return {};
  }
}

function hasBrowserStorageValue(key) {
  return Boolean(readBrowserStorage(key));
}

function cacheState(nextState) {
  stateCache = normalizeState(nextState);
  return stateCache;
}

function setStateCache(nextState) {
  cacheState(nextState);
  writeBrowserStorage(STORAGE_KEY, stateCache);
  return stateCache;
}

function cacheVoiceModelRegistry(nextRegistry) {
  voiceModelRegistryCache = normalizeVoiceModelRegistry(nextRegistry);
  return voiceModelRegistryCache;
}

function setVoiceModelRegistryCache(nextRegistry) {
  cacheVoiceModelRegistry(nextRegistry);
  writeBrowserStorage(VOICE_MODEL_REGISTRY_KEY, voiceModelRegistryCache);
  return voiceModelRegistryCache;
}

function schedulePersistedStateWrite(nextState) {
  if (!tauriInvoke) {
    return;
  }

  window.clearTimeout(persistedStateWriteTimer);
  persistedStateWriteTimer = window.setTimeout(() => {
    tauriInvoke("save_persisted_app_state", { state: nextState }).catch((error) => {
      console.error("Persisted app state save failed", error);
    });
  }, STORAGE_WRITE_DEBOUNCE_MS);
}

function schedulePersistedVoiceModelRegistryWrite(nextRegistry) {
  if (!tauriInvoke) {
    return;
  }

  window.clearTimeout(persistedVoiceModelRegistryWriteTimer);
  persistedVoiceModelRegistryWriteTimer = window.setTimeout(() => {
    tauriInvoke("save_persisted_voice_model_registry", { registry: nextRegistry }).catch((error) => {
      console.error("Persisted voice model registry save failed", error);
    });
  }, STORAGE_WRITE_DEBOUNCE_MS);
}

export async function initializePersistentStorage() {
  if (storageInitPromise) {
    return storageInitPromise;
  }

  storageInitPromise = (async () => {
    const hasBrowserState = hasBrowserStorageValue(STORAGE_KEY);
    const hasBrowserVoiceModelRegistry = hasBrowserStorageValue(VOICE_MODEL_REGISTRY_KEY);
    const browserState = readCachedStateFromBrowser();
    const browserVoiceModelRegistry = readCachedVoiceModelRegistryFromBrowser();
    setStateCache(browserState);
    setVoiceModelRegistryCache(browserVoiceModelRegistry);

    if (!tauriInvoke) {
      return {
        state: stateCache,
        voiceModelRegistry: voiceModelRegistryCache
      };
    }

    try {
      const payload = await tauriInvoke("load_persisted_app_data");
      const persistedStateRaw = payload?.state;
      const persistedRegistryRaw = payload?.voiceModelRegistry;
      const hasPersistedState = persistedStateRaw && typeof persistedStateRaw === "object" && Object.keys(persistedStateRaw).length > 0;
      const hasPersistedRegistry = persistedRegistryRaw && typeof persistedRegistryRaw === "object" && Object.keys(persistedRegistryRaw).length > 0;

      if (hasPersistedState) {
        setStateCache(persistedStateRaw);
      } else if (hasBrowserState) {
        setStateCache(browserState);
        schedulePersistedStateWrite(browserState);
      }

      if (hasPersistedRegistry) {
        setVoiceModelRegistryCache(persistedRegistryRaw);
      } else if (hasBrowserVoiceModelRegistry) {
        setVoiceModelRegistryCache(browserVoiceModelRegistry);
        schedulePersistedVoiceModelRegistryWrite(browserVoiceModelRegistry);
      }
    } catch (error) {
      console.error("Persistent storage initialization failed", error);
    }

    return {
      state: stateCache,
      voiceModelRegistry: voiceModelRegistryCache
    };
  })();

  return storageInitPromise;
}

export function loadState() {
  const browserState = readCachedStateFromBrowser();

  if (!stateCache || JSON.stringify(stateCache) !== JSON.stringify(browserState)) {
    return cacheState(browserState);
  }

  return normalizeState(stateCache);
}

export function saveState(nextState) {
  const mergedState = mergeState(loadState(), nextState);
  setStateCache(mergedState);
  schedulePersistedStateWrite(mergedState);
  window.dispatchEvent(new CustomEvent("flow-state-updated", { detail: mergedState }));
  return mergedState;
}

export function loadVoiceModelRegistry() {
  const browserRegistry = readCachedVoiceModelRegistryFromBrowser();

  if (!voiceModelRegistryCache || JSON.stringify(voiceModelRegistryCache) !== JSON.stringify(browserRegistry)) {
    return cacheVoiceModelRegistry(browserRegistry);
  }

  return normalizeVoiceModelRegistry(voiceModelRegistryCache);
}

export function saveVoiceModelRegistry(nextRegistry = {}) {
  const registry = setVoiceModelRegistryCache(nextRegistry && typeof nextRegistry === "object" ? nextRegistry : {});
  schedulePersistedVoiceModelRegistryWrite(registry);
  window.dispatchEvent(new CustomEvent("flow-voice-models-updated", { detail: registry }));
  return registry;
}

export function getVoiceModelRegistryEntry(language, registry = loadVoiceModelRegistry()) {
  const normalizedLanguage = normalizeVoiceLanguage(language);
  return registry?.[normalizedLanguage] || null;
}

export function getSelectedVoiceModelId(language, registry = loadVoiceModelRegistry()) {
  const selectedModelId = getVoiceModelRegistryEntry(language, registry)?.selectedModelId;
  return typeof selectedModelId === "string" && selectedModelId.trim()
    ? selectedModelId.trim()
    : null;
}

export function updateVoiceModelRegistry(language, patch = {}) {
  const normalizedLanguage = normalizeVoiceLanguage(language);
  const registry = loadVoiceModelRegistry();
  const nextRegistry = {
    ...registry,
    [normalizedLanguage]: {
      ...(registry[normalizedLanguage] || {}),
      ...patch,
      language: normalizedLanguage
    }
  };

  return saveVoiceModelRegistry(nextRegistry);
}

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

  applyThemeToDocument(merged.theme, target);
  target.body.dataset.style = merged.style || defaultState.appearance.style;
  target.body.dataset.mirrorMode = merged.mirrorMode ? "true" : "false";
  target.body.dataset.mirrorVertical = merged.mirrorVertical ? "true" : "false";
  target.body.dataset.toolbarAutoHide = merged.autoHideToolbar ? "true" : "false";
  target.body.dataset.performanceMode = merged.performanceMode ? "true" : "false";
  target.documentElement?.style?.setProperty("--flow-app-opacity", String(appOpacity / 100));
  target.documentElement?.style?.setProperty("--flow-app-opacity-percent", `${appOpacity}%`);
}

const DESKTOP_WINDOW_FADE_MS = 230;

function scheduleAnimationFrame(callback) {
  let frameId = 0;

  return () => {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }

    frameId = window.requestAnimationFrame(() => {
      frameId = 0;
      callback();
    });
  };
}

function waitForMs(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function revealDesktopWindow(target = document) {
  const body = target?.body;
  if (!body) {
    return;
  }

  body.classList.remove("window-closing");
  body.classList.remove("window-ready");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      body.classList.add("window-ready");
    });
  });
}

export function initializeDesktopWindowOpacityFade(target = document) {
  const body = target?.body;
  if (!body) {
    return;
  }

  body.classList.add("desktop-window-opacity-fade");
  revealDesktopWindow(target);

  window.addEventListener("focus", () => {
    if (body.classList.contains("window-closing") || !body.classList.contains("window-ready")) {
      revealDesktopWindow(target);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && body.classList.contains("window-closing")) {
      revealDesktopWindow(target);
    }
  });
}

export function initializeSmoothScrollbox(hostOrSelector = ".page-shell", target = document) {
  const host = typeof hostOrSelector === "string"
    ? target.querySelector(hostOrSelector)
    : hostOrSelector;

  if (!host || host.dataset.smoothScrollboxReady === "true") {
    return;
  }

  host.dataset.smoothScrollboxReady = "true";
  host.classList.add("smooth-scrollbox-host");

  const rail = document.createElement("div");
  rail.className = "smooth-scrollbox";

  const thumb = document.createElement("div");
  thumb.className = "smooth-scrollbox-thumb";

  rail.append(thumb);
  host.append(rail);

  let currentThumbHeight = 0;
  let activePointerId = null;
  let pointerOffsetY = 0;
  const railInset = 12;

  const setScrollFromPointer = (clientY) => {
    const clientHeight = host.clientHeight;
    const scrollHeight = host.scrollHeight;
    const maxScrollTop = Math.max(scrollHeight - clientHeight, 0);
    const hostRect = host.getBoundingClientRect();
    const railTop = hostRect.top + railInset;
    const railHeight = Math.max(host.clientHeight - railInset * 2, 0);
    const maxOffset = Math.max(railHeight - currentThumbHeight, 0);

    if (maxScrollTop <= 0 || maxOffset <= 0) {
      return;
    }

    const nextOffset = clamp(clientY - railTop - pointerOffsetY, 0, maxOffset);
    const progress = nextOffset / maxOffset;
    host.scrollTop = progress * maxScrollTop;
    updateThumb();
  };

  const stopDragging = () => {
    activePointerId = null;
    host.classList.remove("is-dragging-scrollbox");
  };

  const updateThumb = () => {
    const clientHeight = host.clientHeight;
    const scrollHeight = host.scrollHeight;
    const maxScrollTop = Math.max(scrollHeight - clientHeight, 0);
    const railHeight = rail.clientHeight;
    const hasOverflow = scrollHeight > clientHeight + 1 && railHeight > 0;

    rail.style.transform = `translateY(${host.scrollTop}px)`;

    host.classList.toggle("has-smooth-scrollbox", hasOverflow);

    if (!hasOverflow) {
      currentThumbHeight = 0;
      thumb.style.height = "0px";
      thumb.style.transform = "translateY(0px)";
      return;
    }

    const thumbHeight = Math.max((clientHeight / scrollHeight) * railHeight, 34);
    const maxOffset = Math.max(railHeight - thumbHeight, 0);
    const progress = maxScrollTop > 0 ? host.scrollTop / maxScrollTop : 0;
    const offset = progress * maxOffset;

    currentThumbHeight = thumbHeight;
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${offset}px)`;
  };

  const scheduleUpdate = scheduleAnimationFrame(updateThumb);
  const resizeObserver = new ResizeObserver(scheduleUpdate);
  const mutationObserver = new MutationObserver(scheduleUpdate);

  resizeObserver.observe(host);

  Array.from(host.children).forEach((child) => {
    if (child !== rail) {
      resizeObserver.observe(child);
    }
  });

  mutationObserver.observe(host, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class", "hidden", "aria-hidden"]
  });

  host.addEventListener("scroll", () => {
    if (activePointerId !== null) {
      updateThumb();
      return;
    }

    scheduleUpdate();
  }, { passive: true });
  window.addEventListener("resize", scheduleUpdate);

  rail.addEventListener("pointerdown", (event) => {
    if (!host.classList.contains("has-smooth-scrollbox")) {
      return;
    }

    const thumbRect = thumb.getBoundingClientRect();
    const startedFromThumb = event.target === thumb || thumb.contains(event.target);

    activePointerId = event.pointerId;
    pointerOffsetY = startedFromThumb
      ? clamp(event.clientY - thumbRect.top, 0, currentThumbHeight)
      : currentThumbHeight * 0.5;

    host.classList.add("is-dragging-scrollbox");
    rail.setPointerCapture?.(event.pointerId);
    setScrollFromPointer(event.clientY);
    event.preventDefault();
  });

  rail.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    setScrollFromPointer(event.clientY);
    event.preventDefault();
  });

  rail.addEventListener("pointerup", (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    rail.releasePointerCapture?.(event.pointerId);
    stopDragging();
  });

  rail.addEventListener("pointercancel", (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    rail.releasePointerCapture?.(event.pointerId);
    stopDragging();
  });

  scheduleUpdate();
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

export function estimateMinutes(wordCount, speed) {
  if (!wordCount || !speed) return 0;
  return wordCount / speed;
}

async function requestGroqCompletion(apiKey, instruction, script) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: `${instruction}${script ? `\n\nEXISTING SCRIPT:\n${script}` : ""}`
          }
        ]
      })
    }
  );

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();

  return { response, data, text };
}

export async function generateWithGroq(apiKey, instruction, script = "") {
  const { response, data, text } = await requestGroqCompletion(apiKey, instruction, script);
  const message = data?.error?.message || "Groq did not return any text.";

  if (response.ok && text) {
    return text;
  }

  if (/quota exceeded|rate limit|too many requests/i.test(message)) {
    throw new Error("This Groq key is currently rate-limited or out of quota. Save your text normally, then try again shortly.");
  }

  throw new Error(message);
}
