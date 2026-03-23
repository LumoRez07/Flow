export const defaultState = {
  script: "Welcome to Flow. Add your own script from the text page and this teleprompter will highlight the next word while softly dimming the rest.",
  speed: 120,
  groqKey: "",
  groqPrompt: "",
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
    width: 960,
    height: 260,
    preset: "top-center",
    isPinned: true
  },
  appearance: {
    mode: "highlight",
    fontFamily: "inter",
    theme: "main",
    style: "main",
    performanceMode: false,
    appOpacity: 100,
    textScale: 100,
    textColor: "#ffffff",
    textOpacity: 88,
    voiceLanguage: "en-US",
    voiceScrollStyle: "highlight",
    appWideVoiceCommands: false
  }
};

const STORAGE_KEY = "flow.teleprompter.state.v2";

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "ar", label: "العربية" },
  { value: "de", label: "Deutsch" }
];

export const FONT_OPTIONS = [
  { value: "inter", label: "Inter" },
  { value: "arabic-pro", label: "Arabic Pro" },
  { value: "turkish-pro", label: "Turkish Pro" },
  { value: "german-pro", label: "German Pro" },
  { value: "system", label: "System UI" },
  { value: "georgia", label: "Georgia" },
  { value: "garamond", label: "Garamond" },
  { value: "verdana", label: "Verdana" },
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
    "settings.appWideVoiceCommandsHelp": "Lets English Flow commands like 'Hey flow pause' or 'Hey flow down' work outside voice tracking too.",
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
    "settings.voiceModeHelp": "Matches spoken words to the script.",
    "settings.performance": "Performance mode",
    "settings.performanceHelp": "Disables UI animations and forces normal scrolling for smoother performance.",
    "settings.textColor": "Text color",
    "settings.textTransparency": "Text transparency",
    "settings.appTransparency": "App transparency",
    "settings.synced": "Settings synced to the current main window.",
    "settings.applied": "Changes applied automatically.",
    "settings.autoApply": "Changes apply automatically as you move sliders or pick a setting.",
    "input.kicker": "New text",
    "input.title": "Script editor",
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
    "settings.appWideVoiceCommandsHelp": "'Hey flow pause' veya 'Hey flow down' gibi İngilizce Flow komutlarının ses takibi dışında da çalışmasını sağlar.",
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
    "settings.voiceModeHelp": "Konuşulan kelimeleri metinle eşleştirir.",
    "settings.performance": "Performans modu",
    "settings.performanceHelp": "Daha akıcı performans için arayüz animasyonlarını kapatır ve normal kaydırmayı zorlar.",
    "settings.textColor": "Metin rengi",
    "settings.textTransparency": "Metin şeffaflığı",
    "settings.appTransparency": "Uygulama şeffaflığı",
    "settings.synced": "Ayarlar mevcut ana pencereyle eşitlendi.",
    "settings.applied": "Değişiklikler otomatik uygulandı.",
    "settings.autoApply": "Kaydırıcıları hareket ettirdiğinizde veya bir ayar seçtiğinizde değişiklikler otomatik uygulanır.",
    "input.kicker": "Yeni metin",
    "input.title": "Metin düzenleyici",
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
    "settings.appWideVoiceCommandsHelp": "يسمح لأوامر Flow الإنجليزية مثل 'Hey flow pause' أو 'Hey flow down' بالعمل حتى خارج وضع تتبع الصوت.",
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
    "settings.voiceModeHelp": "يطابق الكلمات المنطوقة مع النص.",
    "settings.performance": "وضع الأداء",
    "settings.performanceHelp": "يعطّل حركات الواجهة ويفرض التمرير العادي لأداء أكثر سلاسة.",
    "settings.textColor": "لون النص",
    "settings.textTransparency": "شفافية النص",
    "settings.appTransparency": "شفافية التطبيق",
    "settings.synced": "تمت مزامنة الإعدادات مع النافذة الرئيسية الحالية.",
    "settings.applied": "تم تطبيق التغييرات تلقائيًا.",
    "settings.autoApply": "تُطبَّق التغييرات تلقائيًا عند تحريك الشرائط أو اختيار إعداد.",
    "input.kicker": "نص جديد",
    "input.title": "محرر النص",
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
    "settings.appWideVoiceCommandsHelp": "Erlaubt englische Flow-Befehle wie 'Hey flow pause' oder 'Hey flow down' auch außerhalb der Sprachverfolgung.",
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
    "settings.voiceModeHelp": "Gleicht gesprochene Wörter mit dem Skript ab.",
    "settings.performance": "Performance-Modus",
    "settings.performanceHelp": "Deaktiviert UI-Animationen und erzwingt normales Scrollen für flüssigere Leistung.",
    "settings.textColor": "Textfarbe",
    "settings.textTransparency": "Texttransparenz",
    "settings.appTransparency": "App-Transparenz",
    "settings.synced": "Einstellungen mit dem aktuellen Hauptfenster synchronisiert.",
    "settings.applied": "Änderungen wurden automatisch übernommen.",
    "settings.autoApply": "Änderungen werden automatisch übernommen, wenn du Regler bewegst oder eine Einstellung auswählst.",
    "input.kicker": "Neuer Text",
    "input.title": "Skript-Editor",
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

const FONT_STACKS = {
  inter: 'Inter, "Segoe UI", Arial, sans-serif',
  "arabic-pro": '"Cairo", "Noto Naskh Arabic", "Segoe UI", Tahoma, Arial, sans-serif',
  "turkish-pro": '"Manrope", "Segoe UI", "Arial Nova", Arial, sans-serif',
  "german-pro": '"IBM Plex Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  georgia: 'Georgia, "Times New Roman", serif',
  garamond: 'Garamond, Baskerville, "Times New Roman", serif',
  verdana: 'Verdana, Geneva, sans-serif',
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
  return clamp(Math.round(numeric), 60, 180);
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
    language: rawState.language ?? defaults.language,
    desktop: {
      ...defaults.desktop,
      ...(rawState.desktop || {})
    },
    remote: {
      ...defaults.remote,
      ...(rawState.remote || {})
    },
    window: {
      ...defaults.window,
      ...(rawState.window || {})
    },
    appearance: {
      ...defaults.appearance,
      ...(rawState.appearance || {})
    }
  };

  normalized.appearance.fontFamily = normalizeFontFamily(normalized.appearance.fontFamily, defaults.appearance.fontFamily);
  normalized.speed = normalizeSpeed(normalized.speed, defaults.speed);
  normalized.language = normalizeLanguage(normalized.language, defaults.language);
  normalized.desktop = normalizeDesktopSettings(normalized.desktop, defaults.desktop);
  normalized.remote.provider = normalizeRemoteProvider(normalized.remote.provider, defaults.remote.provider);
  normalized.remote.receiverId = normalizeRemoteCredential(normalized.remote.receiverId, "", 128) || generateRemoteId();
  normalized.remote.receiverSecret = normalizeRemoteCredential(normalized.remote.receiverSecret, "", 256) || generateRemoteSecret();
  normalized.remote.accessPassword = normalizeRemoteCredential(normalized.remote.accessPassword, "", 1024) || generateRemoteAccessPassword();
  normalized.remote.publicHost = normalizeRemoteHost(normalized.remote.publicHost, defaults.remote.publicHost);
  normalized.appearance.theme = normalizeTheme(normalized.appearance.theme, defaults.appearance.theme);
  normalized.appearance.style = normalizeStyle(normalized.appearance.style, defaults.appearance.style);
  normalized.appearance.performanceMode = Boolean(normalized.appearance.performanceMode);
  normalized.appearance.appWideVoiceCommands = Boolean(normalized.appearance.appWideVoiceCommands);
  normalized.appearance.appOpacity = normalizeAppOpacity(normalized.appearance.appOpacity, defaults.appearance.appOpacity);
  normalized.appearance.textScale = normalizeTextScale(normalized.appearance.textScale, defaults.appearance.textScale);
  normalized.appearance.textColor = normalizeTeleprompterTextColor(
    normalized.appearance.textColor,
    getThemeTeleprompterTextColor(normalized.appearance.theme)
  );
  normalized.appearance.textOpacity = normalizeOpacity(normalized.appearance.textOpacity, defaults.appearance.textOpacity);
  normalized.appearance.voiceScrollStyle = ["highlight", "line", "plain"].includes(normalized.appearance.voiceScrollStyle)
    ? normalized.appearance.voiceScrollStyle
    : defaults.appearance.voiceScrollStyle;
  normalized.appearance.mode = ["highlight", "scroll", "line", "arrow", "voice"].includes(normalized.appearance.mode)
    ? normalized.appearance.mode
    : defaults.appearance.mode;

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
      : currentState.appearance
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
