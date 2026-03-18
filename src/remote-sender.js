const TRANSLATIONS = {
  en: { language: "Language", pageKicker: "Flow Remote Sender", pageTitle: "Authenticate before sending text to a live receiver", pageSubtitle: "Use the active UUID plus the generated 24-word access password from the receiver settings page. After authentication, this page can only send text messages.", authSessionIdLabel: "Receiver UUID", authSessionIdPlaceholder: "Paste the active UUID from Flow settings", authAccessPasswordLabel: "Access password", authAccessPasswordPlaceholder: "Paste the generated 24-word access password", composerTitle: "Authenticated sender", titleLabel: "Title", titlePlaceholder: "Example: Producer note", importanceLabel: "Importance", importanceNormal: "Normal", importanceImportant: "IMPORTANT", contentLabel: "Content", contentPlaceholder: "Type the text that should be offered to the receiver.", authIdle: "Continue", authBusy: "Checking…", sendIdle: "Send", sendBusy: "Sending…", cancel: "Clear draft", switchReceiver: "Switch receiver", importantNote: "IMPORTANT adds a red highlight tag in the receiver preview.", portForwardNote: "To use this from anywhere, the receiver machine still needs port 43127 opened and forwarded on the router/firewall to Flow.", authFailed: "Authentication failed.", verifyFailed: "Unable to verify the target UUID right now.", relayRejected: "The relay rejected the message.", connectedTo: "Connected to {id}", authenticatedReady: "Authenticated. You can now send text messages.", readyToSend: "Ready to send.", fillAuth: "Fill in the UUID and access password first.", checkingAccess: "Checking receiver access…", uuidInactive: "That UUID is not currently active.", fillContent: "Fill in the Title and Content fields before sending.", checkingLive: "Checking whether the receiver is still live…", uuidNoLongerActive: "That UUID is no longer active. Authenticate again after the receiver reconnects.", receiverOffline: "Receiver went offline.", receiverLiveSending: "Receiver is live. Sending message…", messageSent: "Message sent.", authExpired: "Authentication expired or failed. Sign in again.", savedLoginOffline: "Saved login found, but the receiver is currently offline.", draftCleared: "Draft cleared.", signInDifferent: "Sign in to a different receiver." },
  tr: { language: "Dil", pageKicker: "Flow Uzak Gönderici", pageTitle: "Canlı bir alıcıya metin göndermeden önce kimlik doğrulayın", pageSubtitle: "Alıcı ayarları sayfasındaki etkin UUID ile oluşturulan 24 kelimelik erişim parolasını kullanın. Kimlik doğrulamadan sonra bu sayfa yalnızca metin mesajı gönderebilir.", authSessionIdLabel: "Alıcı UUID", authSessionIdPlaceholder: "Flow ayarlarından etkin UUID'yi yapıştırın", authAccessPasswordLabel: "Erişim parolası", authAccessPasswordPlaceholder: "Oluşturulan 24 kelimelik erişim parolasını yapıştırın", composerTitle: "Kimliği doğrulanmış gönderici", titleLabel: "Başlık", titlePlaceholder: "Örnek: Yapımcı notu", importanceLabel: "Önem", importanceNormal: "Normal", importanceImportant: "ÖNEMLİ", contentLabel: "İçerik", contentPlaceholder: "Alıcıya sunulacak metni yazın.", authIdle: "Devam et", authBusy: "Kontrol ediliyor…", sendIdle: "Gönder", sendBusy: "Gönderiliyor…", cancel: "Taslağı temizle", switchReceiver: "Alıcıyı değiştir", importantNote: "ÖNEMLİ, alıcı önizlemesine kırmızı vurgu etiketi ekler.", portForwardNote: "Bunu her yerden kullanmak için alıcı makinede 43127 portunun açılmış ve yönlendiricide/güvenlik duvarında Flow'a yönlendirilmiş olması gerekir.", authFailed: "Kimlik doğrulama başarısız oldu.", verifyFailed: "Hedef UUID şu anda doğrulanamıyor.", relayRejected: "Röle mesajı reddetti.", connectedTo: "Bağlandı: {id}", authenticatedReady: "Kimlik doğrulandı. Artık metin mesajları gönderebilirsiniz.", readyToSend: "Göndermeye hazır.", fillAuth: "Önce UUID ve erişim parolasını doldurun.", checkingAccess: "Alıcı erişimi kontrol ediliyor…", uuidInactive: "Bu UUID şu anda etkin değil.", fillContent: "Göndermeden önce Başlık ve İçerik alanlarını doldurun.", checkingLive: "Alıcının hâlâ canlı olup olmadığı kontrol ediliyor…", uuidNoLongerActive: "Bu UUID artık etkin değil. Alıcı yeniden bağlandıktan sonra tekrar kimlik doğrulayın.", receiverOffline: "Alıcı çevrimdışı oldu.", receiverLiveSending: "Alıcı canlı. Mesaj gönderiliyor…", messageSent: "Mesaj gönderildi.", authExpired: "Kimlik doğrulama süresi doldu veya başarısız oldu. Yeniden giriş yapın.", savedLoginOffline: "Kayıtlı oturum bulundu ancak alıcı şu anda çevrimdışı.", draftCleared: "Taslak temizlendi.", signInDifferent: "Farklı bir alıcı için giriş yapın." },
  ar: { language: "اللغة", pageKicker: "مرسل Flow البعيد", pageTitle: "قم بالمصادقة قبل إرسال النص إلى مستقبِل مباشر", pageSubtitle: "استخدم الـ UUID النشط مع كلمة مرور الوصول المكونة من 24 كلمة من صفحة إعدادات المستقبِل. بعد المصادقة، يمكن لهذه الصفحة إرسال رسائل نصية فقط.", authSessionIdLabel: "UUID المستقبِل", authSessionIdPlaceholder: "ألصق الـ UUID النشط من إعدادات Flow", authAccessPasswordLabel: "كلمة مرور الوصول", authAccessPasswordPlaceholder: "ألصق كلمة مرور الوصول المكونة من 24 كلمة", composerTitle: "مرسل تمت مصادقته", titleLabel: "العنوان", titlePlaceholder: "مثال: ملاحظة المنتج", importanceLabel: "الأهمية", importanceNormal: "عادي", importanceImportant: "مهم", contentLabel: "المحتوى", contentPlaceholder: "اكتب النص الذي يجب عرضه على المستقبِل.", authIdle: "متابعة", authBusy: "جارٍ التحقق…", sendIdle: "إرسال", sendBusy: "جارٍ الإرسال…", cancel: "مسح المسودة", switchReceiver: "تبديل المستقبِل", importantNote: "تضيف كلمة مهم علامة تمييز حمراء في معاينة المستقبِل.", portForwardNote: "لاستخدام هذا من أي مكان، ما زال جهاز المستقبِل يحتاج إلى فتح المنفذ 43127 وتحويله على الموجّه/الجدار الناري إلى Flow.", authFailed: "فشلت المصادقة.", verifyFailed: "تعذر التحقق من UUID الهدف الآن.", relayRejected: "رفض المرحل الرسالة.", connectedTo: "متصل بـ {id}", authenticatedReady: "تمت المصادقة. يمكنك الآن إرسال رسائل نصية.", readyToSend: "جاهز للإرسال.", fillAuth: "املأ UUID وكلمة مرور الوصول أولاً.", checkingAccess: "جارٍ التحقق من وصول المستقبِل…", uuidInactive: "هذا الـ UUID غير نشط حاليًا.", fillContent: "املأ حقلي العنوان والمحتوى قبل الإرسال.", checkingLive: "جارٍ التحقق مما إذا كان المستقبِل ما يزال مباشرًا…", uuidNoLongerActive: "لم يعد هذا الـ UUID نشطًا. قم بالمصادقة مرة أخرى بعد إعادة اتصال المستقبِل.", receiverOffline: "أصبح المستقبِل غير متصل.", receiverLiveSending: "المستقبِل مباشر. جارٍ إرسال الرسالة…", messageSent: "تم إرسال الرسالة.", authExpired: "انتهت المصادقة أو فشلت. سجّل الدخول مرة أخرى.", savedLoginOffline: "تم العثور على تسجيل دخول محفوظ، لكن المستقبِل غير متصل حاليًا.", draftCleared: "تم مسح المسودة.", signInDifferent: "سجّل الدخول إلى مستقبِل مختلف." },
  de: { language: "Sprache", pageKicker: "Flow Remote-Sender", pageTitle: "Authentifiziere dich, bevor du Text an einen Live-Empfänger sendest", pageSubtitle: "Verwende die aktive UUID und das generierte 24-Wörter-Zugriffspasswort aus den Empfängereinstellungen. Nach der Authentifizierung kann diese Seite nur Textnachrichten senden.", authSessionIdLabel: "Empfänger-UUID", authSessionIdPlaceholder: "Füge die aktive UUID aus den Flow-Einstellungen ein", authAccessPasswordLabel: "Zugriffspasswort", authAccessPasswordPlaceholder: "Füge das generierte 24-Wörter-Zugriffspasswort ein", composerTitle: "Authentifizierter Sender", titleLabel: "Titel", titlePlaceholder: "Beispiel: Hinweis der Regie", importanceLabel: "Wichtigkeit", importanceNormal: "Normal", importanceImportant: "WICHTIG", contentLabel: "Inhalt", contentPlaceholder: "Gib den Text ein, der dem Empfänger angeboten werden soll.", authIdle: "Weiter", authBusy: "Wird geprüft…", sendIdle: "Senden", sendBusy: "Wird gesendet…", cancel: "Entwurf löschen", switchReceiver: "Empfänger wechseln", importantNote: "WICHTIG fügt in der Empfängervorschau ein rotes Hervorhebungs-Tag hinzu.", portForwardNote: "Damit dies von überall funktioniert, muss auf dem Empfängergerät Port 43127 weiterhin geöffnet und im Router bzw. in der Firewall an Flow weitergeleitet werden.", authFailed: "Authentifizierung fehlgeschlagen.", verifyFailed: "Die Ziel-UUID kann derzeit nicht überprüft werden.", relayRejected: "Das Relay hat die Nachricht abgelehnt.", connectedTo: "Verbunden mit {id}", authenticatedReady: "Authentifiziert. Du kannst jetzt Textnachrichten senden.", readyToSend: "Bereit zum Senden.", fillAuth: "Fülle zuerst UUID und Zugriffspasswort aus.", checkingAccess: "Empfängerzugriff wird geprüft…", uuidInactive: "Diese UUID ist derzeit nicht aktiv.", fillContent: "Fülle vor dem Senden die Felder Titel und Inhalt aus.", checkingLive: "Es wird geprüft, ob der Empfänger noch live ist…", uuidNoLongerActive: "Diese UUID ist nicht mehr aktiv. Authentifiziere dich erneut, nachdem der Empfänger wieder verbunden ist.", receiverOffline: "Empfänger ist offline gegangen.", receiverLiveSending: "Empfänger ist live. Nachricht wird gesendet…", messageSent: "Nachricht gesendet.", authExpired: "Authentifizierung abgelaufen oder fehlgeschlagen. Bitte erneut anmelden.", savedLoginOffline: "Gespeicherte Anmeldung gefunden, aber der Empfänger ist derzeit offline.", draftCleared: "Entwurf gelöscht.", signInDifferent: "Melde dich bei einem anderen Empfänger an." }
};

const RTL_LANGUAGES = new Set(["ar"]);
const LANGUAGE_STORAGE_KEY = "flow.remote.sender.language";

const ui = {
  languageLabel: document.querySelector("#languageLabel"), languageSelect: document.querySelector("#languageSelect"), pageKicker: document.querySelector("#pageKicker"), pageTitle: document.querySelector("#pageTitle"), pageSubtitle: document.querySelector("#pageSubtitle"), authForm: document.querySelector("#authForm"), authSessionIdLabel: document.querySelector("#authSessionIdLabel"), authSessionIdInput: document.querySelector("#authSessionIdInput"), authAccessPasswordLabel: document.querySelector("#authAccessPasswordLabel"), authAccessPasswordInput: document.querySelector("#authAccessPasswordInput"), authButton: document.querySelector("#authButton"), authStatus: document.querySelector("#authStatus"), composerSection: document.querySelector("#composerSection"), composerTitle: document.querySelector("#composerTitle"), sessionSummary: document.querySelector("#sessionSummary"), switchSessionButton: document.querySelector("#switchSessionButton"), form: document.querySelector("#remoteForm"), titleLabel: document.querySelector("#titleLabel"), titleInput: document.querySelector("#titleInput"), contentLabel: document.querySelector("#contentLabel"), contentInput: document.querySelector("#contentInput"), importanceLabel: document.querySelector("#importanceLabel"), importanceInput: document.querySelector("#importanceInput"), sendButton: document.querySelector("#sendButton"), cancelButton: document.querySelector("#cancelButton"), statusMessage: document.querySelector("#statusMessage"), importantNote: document.querySelector("#importantNote"), portForwardNote: document.querySelector("#portForwardNote")
};

let authenticatedSession = null;
let currentLanguage = normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) || navigator.language || "en");
let authBusy = false;
let sendBusy = false;

function normalizeLanguage(value) { const normalized = String(value || "en").toLowerCase().slice(0, 2); return Object.hasOwn(TRANSLATIONS, normalized) ? normalized : "en"; }
function t(key, params = {}) { const template = TRANSLATIONS[currentLanguage]?.[key] ?? TRANSLATIONS.en[key] ?? key; return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`)); }

function applyTranslations() {
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = RTL_LANGUAGES.has(currentLanguage) ? "rtl" : "ltr";
  document.title = t("pageKicker");
  ui.languageSelect.value = currentLanguage;
  ui.languageLabel.textContent = t("language");
  ui.pageKicker.textContent = t("pageKicker");
  ui.pageTitle.textContent = t("pageTitle");
  ui.pageSubtitle.textContent = t("pageSubtitle");
  ui.authSessionIdLabel.textContent = t("authSessionIdLabel");
  ui.authSessionIdInput.placeholder = t("authSessionIdPlaceholder");
  ui.authAccessPasswordLabel.textContent = t("authAccessPasswordLabel");
  ui.authAccessPasswordInput.placeholder = t("authAccessPasswordPlaceholder");
  ui.composerTitle.textContent = t("composerTitle");
  ui.titleLabel.textContent = t("titleLabel");
  ui.titleInput.placeholder = t("titlePlaceholder");
  ui.importanceLabel.textContent = t("importanceLabel");
  ui.importanceInput.options[0].textContent = t("importanceNormal");
  ui.importanceInput.options[1].textContent = t("importanceImportant");
  ui.contentLabel.textContent = t("contentLabel");
  ui.contentInput.placeholder = t("contentPlaceholder");
  ui.cancelButton.textContent = t("cancel");
  ui.switchSessionButton.textContent = t("switchReceiver");
  ui.importantNote.textContent = t("importantNote");
  ui.portForwardNote.textContent = t("portForwardNote");
  setAuthBusy(authBusy);
  setBusy(sendBusy);
  if (authenticatedSession?.sessionId) ui.sessionSummary.textContent = t("connectedTo", { id: authenticatedSession.sessionId });
}

function setStatus(message, tone = "") { ui.statusMessage.textContent = message; ui.statusMessage.className = `status${tone ? ` ${tone}` : ""}`; }
function setAuthStatus(message, tone = "") { ui.authStatus.textContent = message; ui.authStatus.className = `status${tone ? ` ${tone}` : ""}`; }
function setBusy(isBusy) { sendBusy = isBusy; ui.sendButton.disabled = isBusy; ui.sendButton.textContent = isBusy ? t("sendBusy") : t("sendIdle"); }
function setAuthBusy(isBusy) { authBusy = isBusy; ui.authButton.disabled = isBusy; ui.authButton.textContent = isBusy ? t("authBusy") : t("authIdle"); }
function buildAuthHeaders(auth = authenticatedSession) { return auth ? { "X-Flow-Access-Password": auth.accessPassword } : {}; }

async function authenticateSession(payload) {
  const response = await fetch(`/api/receiver/${encodeURIComponent(payload.sessionId)}/auth`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessPassword: payload.accessPassword }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || t("authFailed"));
  return data;
}

async function checkSessionActive(sessionId) {
  const response = await fetch(`/api/receiver/${encodeURIComponent(sessionId)}/active`, { headers: buildAuthHeaders() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || t("verifyFailed"));
  return data;
}

async function sendMessage(payload) {
  const response = await fetch(`/api/receiver/${encodeURIComponent(payload.sessionId)}/messages`, { method: "POST", headers: { "Content-Type": "application/json", ...buildAuthHeaders() }, body: JSON.stringify({ title: payload.title, content: payload.content, importance: payload.importance }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || t("relayRejected"));
  return data;
}

function getAuthPayload() { return { sessionId: ui.authSessionIdInput.value.trim(), accessPassword: ui.authAccessPasswordInput.value.trim() }; }
function getFormPayload() { return { sessionId: authenticatedSession?.sessionId || "", title: ui.titleInput.value.trim(), content: ui.contentInput.value.trim(), importance: ui.importanceInput.value }; }
function resetForm() { ui.form.reset(); ui.importanceInput.value = "normal"; }

function enterComposer(auth) {
  authenticatedSession = auth;
  sessionStorage.setItem("flow.remote.sender.auth", JSON.stringify(auth));
  ui.composerSection.classList.remove("hidden");
  ui.authForm.classList.add("hidden");
  ui.sessionSummary.textContent = t("connectedTo", { id: auth.sessionId });
  setAuthStatus(t("authenticatedReady"), "success");
  setStatus(t("readyToSend"));
}

function leaveComposer(message = "") {
  authenticatedSession = null;
  sessionStorage.removeItem("flow.remote.sender.auth");
  ui.composerSection.classList.add("hidden");
  ui.authForm.classList.remove("hidden");
  resetForm();
  if (message) setAuthStatus(message);
}

async function handleAuthenticate(event) {
  event.preventDefault();
  const payload = getAuthPayload();
  if (!payload.sessionId || !payload.accessPassword) { setAuthStatus(t("fillAuth"), "error"); return; }
  setAuthBusy(true);
  setAuthStatus(t("checkingAccess"));
  try {
    const result = await authenticateSession(payload);
    if (!result.active) { setAuthStatus(t("uuidInactive"), "error"); return; }
    enterComposer(payload);
  } catch (error) {
    setAuthStatus(error instanceof Error ? error.message : String(error), "error");
  } finally { setAuthBusy(false); }
}

async function handleSubmit(event) {
  event.preventDefault();
  const payload = getFormPayload();
  if (!payload.sessionId || !payload.title || !payload.content) { setStatus(t("fillContent"), "error"); return; }
  setBusy(true);
  setStatus(t("checkingLive"));
  try {
    const activeCheck = await checkSessionActive(payload.sessionId);
    if (!activeCheck.active) { leaveComposer(t("uuidNoLongerActive")); setStatus(t("receiverOffline"), "error"); return; }
    setStatus(t("receiverLiveSending"));
    const result = await sendMessage(payload);
    setStatus(result.message || t("messageSent"), "success");
    resetForm();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const tone = /too many|wait/i.test(message) ? "warn" : "error";
    setStatus(message, tone);
    if (/auth|credential|password|access|unauthorized|forbidden/i.test(message)) leaveComposer(t("authExpired"));
  } finally { setBusy(false); }
}

window.addEventListener("DOMContentLoaded", async () => {
  applyTranslations();
  const url = new URL(window.location.href);
  const presetId = url.searchParams.get("id");
  if (presetId) ui.authSessionIdInput.value = presetId;

  ui.languageSelect.addEventListener("change", () => {
    currentLanguage = normalizeLanguage(ui.languageSelect.value);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    applyTranslations();
  });

  const savedAuth = sessionStorage.getItem("flow.remote.sender.auth");
  if (savedAuth) {
    try {
      const parsed = JSON.parse(savedAuth);
      if (parsed?.sessionId && parsed?.accessPassword) {
        ui.authSessionIdInput.value = parsed.sessionId;
        ui.authAccessPasswordInput.value = parsed.accessPassword;
        const result = await authenticateSession(parsed);
        if (result.active) enterComposer(parsed);
        else { setAuthStatus(t("savedLoginOffline"), "warn"); sessionStorage.removeItem("flow.remote.sender.auth"); }
      }
    } catch (error) {
      console.error(error);
      sessionStorage.removeItem("flow.remote.sender.auth");
    }
  }

  ui.authForm.addEventListener("submit", handleAuthenticate);
  ui.form.addEventListener("submit", handleSubmit);
  ui.cancelButton.addEventListener("click", () => { resetForm(); setStatus(t("draftCleared")); });
  ui.switchSessionButton.addEventListener("click", () => { leaveComposer(t("signInDifferent")); });
});
