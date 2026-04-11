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
    width: 1280,
    height: 260,
    preset: "top-center",
    isPinned: true
  },
  appearance: {
    mode: "highlight",
    fontFamily: "inter",
    theme: "main",
    style: "main",
    speedRailEnabled: true,
    autoHideToolbar: false,
    performanceMode: false,
    appOpacity: 100,
    textScale: 100,
    textColor: "#ffffff",
    textOpacity: 88,
    voiceLanguage: "en-US",
    voiceScrollStyle: "highlight",
    appWideVoiceCommands: false,
    soundInputDeviceId: "default",
    soundInputNoiseGate: 0.01,
    soundInputGain: 2
  }
};

const STORAGE_KEY = "flow.teleprompter.state.v2";
const VOICE_MODEL_REGISTRY_KEY = "flow.voice.models.v1";

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "ar", label: "العربية" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" }
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
  { value: "english-pro", label: "English Pro" },
  { value: "dutch-pro", label: "Dutch Pro" },
  { value: "arabic-pro", label: "Arabic Pro" },
  { value: "turkish-pro", label: "Turkish Pro" },
  { value: "german-pro", label: "German Pro" },
  { value: "system", label: "System UI" },
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
    "settings.kicker": "Settings",
    "settings.title": "Live controls",
    "settings.section": "Section",
    "settings.sectionTitle": "Browse settings",
    "settings.section.remote": "Remote",
    "settings.section.positioning": "Positioning",
    "settings.section.appearance": "Appearance",
    "settings.section.soundInput": "Sound input settings",
    "settings.section.privacy": "Privacy & system",
    "settings.section.usability": "Usability",
    "settings.positioning": "Positioning",
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
    "settings.sizeAndPlayback": "Size and playback style",
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
    "settings.voiceStyle.highlight": "Word highlight",
    "settings.voiceStyle.line": "Line highlight",
    "settings.voiceStyle.plain": "Plain text",
    "settings.appWideVoiceCommands": "App-wide Flow voice commands",
    "settings.appWideVoiceCommandsHelp": "Lets English voice commands like 'Hey Flow pause' or 'Hey Flow down' work outside voice tracking too.",
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
    "settings.voiceModelCheckingHelp": "Flow checks whether the selected Vosk model is already stored locally.",
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
    "settings.speedSlider": "Left speed slider",
    "settings.speedSliderHelp": "Shows the vertical WPM slider on the left side while playing.",
    "settings.performance": "Performance mode",
    "settings.performanceHelp": "Disables UI animations and forces normal scrolling for smoother performance.",
    "settings.autoHideToolbar": "Auto-hide top bar",
    "settings.autoHideToolbarHelp": "Shows a small top handle and reveals the toolbar only while the teleprompter is hovered.",
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
    "input.editorHelp": "Formatting works like Reddit-style markdown for <strong>**bold**</strong> and <em>*italic*</em>, plus tags for <span class=\"toolbar-underline\">[u]underline[/u]</span>, <mark class=\"mark-yellow\">[yellow]highlight[/yellow]</mark>, <mark class=\"mark-blue\">[blue]highlight[/blue]</mark>, and <mark class=\"mark-red\">[red]highlight[/red]</mark>.",
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
    "about.p3": "This project was made by <a href=\"https://lumorez.vercel.app/\">LumoRez</a> with ❤️ in 2026.",
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
    "settings.voiceStyle.highlight": "Kelime vurgusu",
    "settings.voiceStyle.line": "Satır vurgusu",
    "settings.voiceStyle.plain": "Düz metin",
    "settings.appWideVoiceCommands": "Uygulama genelinde Flow ses komutları",
    "settings.appWideVoiceCommandsHelp": "'Hey Flow duraklat' veya 'Hey Flow aşağı' gibi İngilizce Flow komutlarının ses takibi dışında da çalışmasını sağlar.",
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
    "input.editorHelp": "Biçimlendirme, <strong>**kalın**</strong> ve <em>*italik*</em> için Reddit tarzı markdown gibi çalışır; ayrıca <span class=\"toolbar-underline\">[u]altı çizili[/u]</span>, <mark class=\"mark-yellow\">[yellow]vurgu[/yellow]</mark>, <mark class=\"mark-blue\">[blue]vurgu[/blue]</mark> ve <mark class=\"mark-red\">[red]vurgu[/red]</mark> etiketlerini destekler.",
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
    "about.p3": "Bu proje 2026 yılında <a href=\"https://lumorez.vercel.app/\">LumoRez</a> tarafından ❤️ ile yapıldı.",
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
    "settings.voiceStyle.highlight": "تمييز الكلمة",
    "settings.voiceStyle.line": "تمييز السطر",
    "settings.voiceStyle.plain": "نص عادي",
    "settings.appWideVoiceCommands": "أوامر Flow الصوتية على مستوى التطبيق",
    "settings.appWideVoiceCommandsHelp": "يسمح لأوامر Flow الإنجليزية مثل 'Hey Flow pause' أو 'Hey Flow down' بالعمل حتى خارج تتبع الصوت.",
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
    "input.editorHelp": "يعمل التنسيق مثل Markdown بأسلوب Reddit مع <strong>**عريض**</strong> و<em>*مائل*</em>، بالإضافة إلى الوسوم <span class=\"toolbar-underline\">[u]تسطير[/u]</span> و<mark class=\"mark-yellow\">[yellow]تمييز[/yellow]</mark> و<mark class=\"mark-blue\">[blue]تمييز[/blue]</mark> و<mark class=\"mark-red\">[red]تمييز[/red]</mark>.",
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
    "about.p3": "تم إنشاء هذا المشروع بواسطة <a href=\"https://lumorez.vercel.app/\">LumoRez</a> مع ❤️ في عام 2026.",
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
    "settings.voiceStyle.highlight": "Worthervorhebung",
    "settings.voiceStyle.line": "Zeilenhervorhebung",
    "settings.voiceStyle.plain": "Klartext",
    "settings.appWideVoiceCommands": "App-weite Flow-Sprachbefehle",
    "settings.appWideVoiceCommandsHelp": "Erlaubt englische Flow-Befehle wie 'Hey Flow pause' oder 'Hey Flow down' auch außerhalb der Sprachverfolgung.",
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
    "input.editorHelp": "Die Formatierung funktioniert wie Reddit-Markdown für <strong>**fett**</strong> und <em>*kursiv*</em> sowie mit Tags für <span class=\"toolbar-underline\">[u]Unterstreichung[/u]</span>, <mark class=\"mark-yellow\">[yellow]Hervorhebung[/yellow]</mark>, <mark class=\"mark-blue\">[blue]Hervorhebung[/blue]</mark> und <mark class=\"mark-red\">[red]Hervorhebung[/red]</mark>.",
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
    "about.p3": "Dieses Projekt wurde 2026 von <a href=\"https://lumorez.vercel.app/\">LumoRez</a> mit ❤️ erstellt.",
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
  "settings.remoteStatusWaiting": "Waiting for relay status.",
  "settings.remotePublicHost": "Public host / domain",
  "settings.remotePublicHostPlaceholder": "Example: flow.example.com or 82.14.25.90",
  "settings.remoteLocalHelp": "For local relay, the sender needs your public address, the UUID, and the generated access password above.",
  "settings.copyNothing": "Nothing is available to copy yet.",
  "settings.copyFailed": "Copy failed. You can still select the value manually.",
  "settings.copiedUuid": "UUID copied.",
  "settings.copiedAccessPassword": "Access password copied.",
  "settings.copiedSenderLink": "Sender link copied.",
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
  "settings.appearance": "Apparence",
  "settings.sizeAndPlayback": "Taille et style de lecture",
  "settings.group.windowSize": "Taille de la fenêtre",
  "settings.group.playback": "Lecture",
  "settings.group.typography": "Typographie",
  "settings.group.visuals": "Visuel",
  "settings.font": "Police",
  "settings.textSize": "Taille du texte",
  "settings.voiceTrackingStyle": "Style du suivi vocal",
  "settings.voiceTrackingStyleHelp": "Choisissez comment la position détectée est affichée pendant que vous parlez.",
  "settings.voiceStyle.highlight": "Mise en évidence du mot",
  "settings.voiceStyle.line": "Mise en évidence de la ligne",
  "settings.voiceStyle.plain": "Texte brut",
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
  "settings.performance": "Mode performance",
  "settings.performanceHelp": "Désactive les animations et force le défilement normal pour une meilleure fluidité.",
  "settings.autoHideToolbar": "Masquer automatiquement la barre du haut",
  "settings.autoHideToolbarHelp": "Affiche une petite poignée en haut et révèle la barre seulement au survol.",
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
  "input.editorHelp": "Le formatage fonctionne comme du markdown façon Reddit pour <strong>**gras**</strong> et <em>*italique*</em>, avec en plus des balises pour <span class=\"toolbar-underline\">[u]souligné[/u]</span>, <mark class=\"mark-yellow\">[yellow]surbrillance[/yellow]</mark>, <mark class=\"mark-blue\">[blue]surbrillance[/blue]</mark> et <mark class=\"mark-red\">[red]surbrillance[/red]</mark>.",
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

const FONT_STACKS = {
  inter: 'Inter, "Segoe UI", Arial, sans-serif',
  "space-grotesk": '"Space Grotesk", "Segoe UI", Arial, sans-serif',
  outfit: '"Outfit", "Segoe UI", Arial, sans-serif',
  "english-pro": 'Inter, "Segoe UI", "Arial Nova", Arial, sans-serif',
  "dutch-pro": '"IBM Plex Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  "arabic-pro": '"Cairo", "Noto Naskh Arabic", "Segoe UI", Tahoma, Arial, sans-serif',
  "turkish-pro": '"Manrope", "Segoe UI", "Arial Nova", Arial, sans-serif',
  "german-pro": '"IBM Plex Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  merriweather: '"Merriweather", Georgia, "Times New Roman", serif',
  "source-serif": '"Source Serif 4", Georgia, "Times New Roman", serif',
  georgia: 'Georgia, "Times New Roman", serif',
  garamond: 'Garamond, Baskerville, "Times New Roman", serif',
  verdana: 'Verdana, Geneva, sans-serif',
  "jetbrains-mono": '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
  mono: '"Cascadia Code", "Fira Code", Consolas, monospace'
};

const RTL_CHARACTERS = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/g;
const LTR_CHARACTERS = /[A-Za-z\u00C0-\u024F]/g;
const MIN_SPEED = 60;
const MAX_SPEED = 360;
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

function normalizeColor(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^#([\da-f]{3}|[\da-f]{6})$/i.test(trimmed) ? trimmed : fallback;
}

function normalizeOpacity(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 10, 100);
}

function normalizeAppOpacity(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 15, 100);
}

function normalizeTextScale(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 30, 180);
}

function normalizeFontFamily(value, fallback) {
  return Object.hasOwn(FONT_STACKS, value) ? value : fallback;
}

function normalizeSpeed(value, fallback) {
  const numeric = Number(value);
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

  if (
    [960, 1040, 1120].includes(Number(merged.width))
    && Number(merged.height) === fallback.height
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

export function resolveFontStack(fontFamily) {
  return FONT_STACKS[fontFamily] || FONT_STACKS.inter;
}

export function getLanguageDirection(language) {
  return language === "ar" ? "rtl" : "ltr";
}

export function translate(key, language = defaultState.language, params = {}) {
  const normalizedLanguage = normalizeLanguage(language, defaultState.language);
  const template = UI_STRINGS[normalizedLanguage]?.[key] ?? UI_STRINGS.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}

export function applyTranslationsToDocument(language = defaultState.language, target = document) {
  const normalizedLanguage = normalizeLanguage(language, defaultState.language);
  const direction = getLanguageDirection(normalizedLanguage);
  if (target.documentElement) {
    target.documentElement.lang = normalizedLanguage;
    target.documentElement.dir = direction;
  }
  if (target.body) {
    target.body.dataset.language = normalizedLanguage;
    target.body.dataset.uiDirection = direction;
  }

  target.querySelectorAll?.("[data-i18n]").forEach((element) => {
    element.textContent = translate(element.dataset.i18n, normalizedLanguage);
  });
  target.querySelectorAll?.("[data-i18n-html]").forEach((element) => {
    element.innerHTML = translate(element.dataset.i18nHtml, normalizedLanguage);
  });
  target.querySelectorAll?.("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", translate(element.dataset.i18nPlaceholder, normalizedLanguage));
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
    groqKey: rawState.groqKey ?? rawState.geminiKey ?? defaults.groqKey,
    groqPrompt: rawState.groqPrompt ?? rawState.geminiPrompt ?? defaults.groqPrompt,
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
  normalized.appearance.speedRailEnabled = normalized.appearance.speedRailEnabled !== false;
  normalized.appearance.autoHideToolbar = Boolean(normalized.appearance.autoHideToolbar);
  normalized.appearance.performanceMode = Boolean(normalized.appearance.performanceMode);
  normalized.appearance.appWideVoiceCommands = Boolean(normalized.appearance.appWideVoiceCommands);
  normalized.appearance.appOpacity = normalizeAppOpacity(normalized.appearance.appOpacity, defaults.appearance.appOpacity);
  normalized.appearance.textScale = normalizeTextScale(normalized.appearance.textScale, defaults.appearance.textScale);
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
    .replace(/\[(?:\/)?(?:u|yellow|blue|red)\]/gi, " ")
    .replace(/\*\*|\*|==/g, " ");
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
  let style = {
    bold: false,
    italic: false,
    underline: false,
    highlight: null
  };

  const applyTag = (tag) => {
    switch (tag) {
      case "u":
        style = { ...style, underline: true };
        return true;
      case "/u":
        style = { ...style, underline: false };
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

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "[") {
      const closingIndex = source.indexOf("]", index + 1);
      if (closingIndex !== -1) {
        const tag = source.slice(index + 1, closingIndex).trim().toLowerCase();
        const isFormattingTag = ["u", "/u", "yellow", "/yellow", "blue", "/blue", "red", "/red"].includes(tag);
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

    buffer += source[index];
  }

  flush();

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

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaults();
    }

    return normalizeState(JSON.parse(raw));
  } catch {
    return createDefaults();
  }
}

export function saveState(nextState) {
  const mergedState = mergeState(loadState(), nextState);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedState));
  window.dispatchEvent(new CustomEvent("flow-state-updated", { detail: mergedState }));
  return mergedState;
}

export function loadVoiceModelRegistry() {
  try {
    const raw = localStorage.getItem(VOICE_MODEL_REGISTRY_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveVoiceModelRegistry(nextRegistry = {}) {
  const registry = nextRegistry && typeof nextRegistry === "object" ? nextRegistry : {};
  localStorage.setItem(VOICE_MODEL_REGISTRY_KEY, JSON.stringify(registry));
  window.dispatchEvent(new CustomEvent("flow-voice-models-updated", { detail: registry }));
  return registry;
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

  applyThemeToDocument(merged.theme, target);
  target.body.dataset.style = merged.style || defaultState.appearance.style;
  target.body.dataset.toolbarAutoHide = merged.autoHideToolbar ? "true" : "false";
  target.body.dataset.performanceMode = merged.performanceMode ? "true" : "false";
  target.documentElement?.style?.setProperty("--flow-app-opacity", String(clamp(merged.appOpacity / 100, 0.15, 1)));
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
