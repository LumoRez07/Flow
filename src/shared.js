export const defaultState = {
  script: "Welcome to Flow. Add your own script from the text page and this teleprompter will highlight the next word while softly dimming the rest.",
  speed: 120,
  groqKey: "",
  groqPrompt: "",
  language: "en",
  window: {
    x: null,
    y: null,
    width: 960,
    height: 260,
    preset: "top-center"
  },
  appearance: {
    mode: "highlight",
    fontFamily: "inter",
    theme: "main",
    performanceMode: false,
    appOpacity: 100,
    textScale: 100,
    textColor: "#f8fbff",
    textOpacity: 88
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

const UI_STRINGS = {
  en: {
    "doc.teleprompterTitle": "Flow Teleprompter",
    "doc.settingsTitle": "Flow · Settings",
    "doc.textTitle": "Flow · Text",
    "doc.aboutTitle": "Flow · About",
    "common.settings": "Settings",
    "common.text": "Text",
    "common.close": "Close",
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
    "tele.empty": "Open the text page and add your script.",
    "tele.addGroqKey": "Add Groq API key on the text page first",
    "tele.promptExisting": "Describe how Groq should rewrite the current teleprompter text:",
    "tele.promptExistingDefault": "Rewrite this in Arabic with a different personality and aesthetic in 200 words.",
    "tele.promptNew": "Describe the teleprompter script you want Groq to generate:",
    "tele.promptNewDefault": "A concise product launch pitch with confident, natural pacing.",
    "tele.cancelled": "Generation cancelled",
    "tele.generating": "Generating with Groq...",
    "tele.generated": "Groq generated a new script",
    "tele.groqFailed": "Groq failed: {error}",
    "tele.opened": "Opened {kind}",
    "tele.failedOpenInput": "Failed to open input: {error}",
    "tele.failedOpenSettings": "Failed to open settings: {error}",
    "tele.failedCloseApp": "Failed to close app: {error}",
    "settings.kicker": "Settings",
    "settings.title": "Live controls",
    "settings.positioning": "Positioning",
    "settings.windowPlacement": "Window placement",
    "settings.windowLocation": "Window location",
    "settings.x": "X",
    "settings.y": "Y",
    "settings.topCenter": "Top center",
    "settings.center": "Center",
    "settings.custom": "Custom x / y",
    "settings.appearance": "Appearance",
    "settings.sizeAndPlayback": "Size and playback style",
    "settings.width": "Width",
    "settings.height": "Height",
    "settings.animationStyle": "Animation style",
    "settings.mode.highlight": "Highlight mode",
    "settings.mode.scroll": "Normal scroll mode",
    "settings.mode.line": "Line by line highlight",
    "settings.mode.arrow": "Arrow mode",
    "settings.font": "Font",
    "settings.textSize": "Text size",
    "settings.theme": "Theme",
    "settings.theme.main": "Main",
    "settings.theme.dark": "Dark",
    "settings.theme.bright": "Bright",
    "settings.theme.meadow": "Yellow-green",
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
    "about.p1": "Flow is a teleprompter app built with web technologies and Tauri. It's designed to be simple, lightweight, and customizable.",
    "about.p2": "This project is open source and available on my <a href=\"https://github.com/LumoRez07\">GitHub account</a>. If you have any questions, suggestions, or want to contribute, feel free to reach out or open an issue.",
    "about.p3": "This project was made by <a href=\"https://lumorez.vercel.app/\">LumoRez</a> with ❤️ in 2026."
  },
  tr: {
    "doc.teleprompterTitle": "Flow Teleprompter",
    "doc.settingsTitle": "Flow · Ayarlar",
    "doc.textTitle": "Flow · Metin",
    "doc.aboutTitle": "Flow · Hakkında",
    "common.settings": "Ayarlar",
    "common.text": "Metin",
    "common.close": "Kapat",
    "common.ai": "YZ",
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
    "tele.empty": "Metin sayfasını açın ve metninizi ekleyin.",
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
    "settings.appearance": "Görünüm",
    "settings.sizeAndPlayback": "Boyut ve oynatma stili",
    "settings.width": "Genişlik",
    "settings.height": "Yükseklik",
    "settings.animationStyle": "Animasyon stili",
    "settings.mode.highlight": "Vurgu modu",
    "settings.mode.scroll": "Normal kaydırma modu",
    "settings.mode.line": "Satır satır vurgu",
    "settings.mode.arrow": "Ok modu",
    "settings.font": "Yazı tipi",
    "settings.textSize": "Metin boyutu",
    "settings.theme": "Tema",
    "settings.theme.main": "Ana",
    "settings.theme.dark": "Koyu",
    "settings.theme.bright": "Parlak",
    "settings.theme.meadow": "Sarı-yeşil",
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
    "about.p1": "Flow, web teknolojileri ve Tauri ile oluşturulmuş bir teleprompter uygulamasıdır. Basit, hafif ve özelleştirilebilir olacak şekilde tasarlanmıştır.",
    "about.p2": "Bu proje açık kaynaklıdır ve <a href=\"https://github.com/LumoRez07\">GitHub hesabımda</a> yer almaktadır. Sorularınız, önerileriniz varsa veya katkı sağlamak istiyorsanız iletişime geçebilir ya da bir issue açabilirsiniz.",
    "about.p3": "Bu proje 2026 yılında <a href=\"https://lumorez.vercel.app/\">LumoRez</a> tarafından ❤️ ile yapıldı."
  },
  ar: {
    "doc.teleprompterTitle": "ملقن Flow",
    "doc.settingsTitle": "Flow · الإعدادات",
    "doc.textTitle": "Flow · النص",
    "doc.aboutTitle": "Flow · حول",
    "common.settings": "الإعدادات",
    "common.text": "النص",
    "common.close": "إغلاق",
    "common.ai": "ذكاء",
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
    "tele.empty": "افتح صفحة النص وأضف النص الخاص بك.",
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
    "settings.appearance": "المظهر",
    "settings.sizeAndPlayback": "الحجم ونمط التشغيل",
    "settings.width": "العرض",
    "settings.height": "الارتفاع",
    "settings.animationStyle": "نمط الحركة",
    "settings.mode.highlight": "وضع التمييز",
    "settings.mode.scroll": "وضع التمرير العادي",
    "settings.mode.line": "تمييز سطر بسطر",
    "settings.mode.arrow": "وضع السهم",
    "settings.font": "الخط",
    "settings.textSize": "حجم النص",
    "settings.theme": "السمة",
    "settings.theme.main": "الرئيسية",
    "settings.theme.dark": "داكن",
    "settings.theme.bright": "فاتح",
    "settings.theme.meadow": "أصفر-أخضر",
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
    "about.p1": "Flow هو تطبيق ملقن نصوص مبني بتقنيات الويب وTauri. صُمم ليكون بسيطًا وخفيفًا وقابلًا للتخصيص.",
    "about.p2": "هذا المشروع مفتوح المصدر ومتوفر على <a href=\"https://github.com/LumoRez07\">حسابي على GitHub</a>. إذا كانت لديك أسئلة أو اقتراحات أو ترغب في المساهمة، فلا تتردد في التواصل أو فتح issue.",
    "about.p3": "تم إنشاء هذا المشروع بواسطة <a href=\"https://lumorez.vercel.app/\">LumoRez</a> مع ❤️ في عام 2026."
  },
  de: {
    "doc.teleprompterTitle": "Flow Teleprompter",
    "doc.settingsTitle": "Flow · Einstellungen",
    "doc.textTitle": "Flow · Text",
    "doc.aboutTitle": "Flow · Über",
    "common.settings": "Einstellungen",
    "common.text": "Text",
    "common.close": "Schließen",
    "common.ai": "KI",
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
    "tele.empty": "Öffne die Textseite und füge dein Skript hinzu.",
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
    "settings.appearance": "Darstellung",
    "settings.sizeAndPlayback": "Größe und Wiedergabestil",
    "settings.width": "Breite",
    "settings.height": "Höhe",
    "settings.animationStyle": "Animationsstil",
    "settings.mode.highlight": "Hervorhebungsmodus",
    "settings.mode.scroll": "Normaler Scrollmodus",
    "settings.mode.line": "Zeilenweise Hervorhebung",
    "settings.mode.arrow": "Pfeilmodus",
    "settings.font": "Schriftart",
    "settings.textSize": "Textgröße",
    "settings.theme": "Design",
    "settings.theme.main": "Haupt",
    "settings.theme.dark": "Dunkel",
    "settings.theme.bright": "Hell",
    "settings.theme.meadow": "Gelbgrün",
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
    "about.p1": "Flow ist eine Teleprompter-App, die mit Web-Technologien und Tauri entwickelt wurde. Sie wurde so gestaltet, dass sie einfach, leichtgewichtig und anpassbar ist.",
    "about.p2": "Dieses Projekt ist Open Source und auf meinem <a href=\"https://github.com/LumoRez07\">GitHub-Konto</a> verfügbar. Wenn du Fragen oder Vorschläge hast oder beitragen möchtest, melde dich gern oder eröffne ein Issue.",
    "about.p3": "Dieses Projekt wurde 2026 von <a href=\"https://lumorez.vercel.app/\">LumoRez</a> mit ❤️ erstellt."
  }
};

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

function normalizeTheme(value, fallback) {
  return THEME_OPTIONS.some((option) => option.value === value) ? value : fallback;
}

function normalizeLanguage(value, fallback) {
  return LANGUAGE_OPTIONS.some((option) => option.value === value) ? value : fallback;
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
  normalized.language = normalizeLanguage(normalized.language, defaults.language);
  normalized.appearance.theme = normalizeTheme(normalized.appearance.theme, defaults.appearance.theme);
  normalized.appearance.performanceMode = Boolean(normalized.appearance.performanceMode);
  normalized.appearance.appOpacity = normalizeAppOpacity(normalized.appearance.appOpacity, defaults.appearance.appOpacity);
  normalized.appearance.textScale = normalizeTextScale(normalized.appearance.textScale, defaults.appearance.textScale);
  normalized.appearance.textColor = normalizeColor(normalized.appearance.textColor, defaults.appearance.textColor);
  normalized.appearance.textOpacity = normalizeOpacity(normalized.appearance.textOpacity, defaults.appearance.textOpacity);
  normalized.appearance.mode = ["highlight", "scroll", "line", "arrow"].includes(normalized.appearance.mode)
    ? normalized.appearance.mode
    : defaults.appearance.mode;

  return normalized;
}

function mergeState(currentState, nextState = {}) {
  return normalizeState({
    ...currentState,
    ...nextState,
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
