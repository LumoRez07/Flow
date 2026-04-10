/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const TRANSLATIONS = {
  en: { language: "Language", pageKicker: "Flow Remote Sender", pageTitle: "Authenticate before sending text to a live receiver", pageSubtitle: "Use the active UUID plus the generated 24-word access password from the receiver settings page. After authentication, this page can only send text messages.", authSessionIdLabel: "Receiver UUID", authSessionIdPlaceholder: "Paste the active UUID from Flow settings", authAccessPasswordLabel: "Access password", authAccessPasswordPlaceholder: "Paste the generated 24-word access password", composerTitle: "Authenticated sender", titleLabel: "Title", titlePlaceholder: "Example: Producer note", importanceLabel: "Importance", importanceNormal: "Normal", importanceImportant: "IMPORTANT", contentLabel: "Content", contentPlaceholder: "Type the text that should be offered to the receiver.", authIdle: "Continue", authBusy: "Checking…", sendIdle: "Send", sendBusy: "Sending…", cancel: "Clear draft", switchReceiver: "Switch receiver", importantNote: "IMPORTANT adds a red highlight tag in the receiver preview.", portForwardNote: "To use this from anywhere, the receiver machine still needs port 43127 opened and forwarded on the router/firewall to Flow.", authFailed: "Authentication failed.", verifyFailed: "Unable to verify the target UUID right now.", relayRejected: "The relay rejected the message.", connectedTo: "Connected to {id}", authenticatedReady: "Authenticated. You can now send text messages.", readyToSend: "Ready to send.", fillAuth: "Fill in the UUID and access password first.", checkingAccess: "Checking receiver access…", uuidInactive: "That UUID is not currently active.", fillContent: "Fill in the Title and Content fields before sending.", checkingLive: "Checking whether the receiver is still live…", uuidNoLongerActive: "That UUID is no longer active. Authenticate again after the receiver reconnects.", receiverOffline: "Receiver went offline.", receiverLiveSending: "Receiver is live. Sending message…", messageSent: "Message sent.", authExpired: "Authentication expired or failed. Sign in again.", savedLoginOffline: "Saved login found, but the receiver is currently offline.", draftCleared: "Draft cleared.", signInDifferent: "Sign in to a different receiver." },
  tr: { language: "Dil", pageKicker: "Flow Uzak Gönderici", pageTitle: "Canlı bir alıcıya metin göndermeden önce kimlik doğrulayın", pageSubtitle: "Alıcı ayarları sayfasındaki etkin UUID ile oluşturulan 24 kelimelik erişim parolasını kullanın. Kimlik doğrulamadan sonra bu sayfa yalnızca metin mesajı gönderebilir.", authSessionIdLabel: "Alıcı UUID", authSessionIdPlaceholder: "Flow ayarlarından etkin UUID'yi yapıştırın", authAccessPasswordLabel: "Erişim parolası", authAccessPasswordPlaceholder: "Oluşturulan 24 kelimelik erişim parolasını yapıştırın", composerTitle: "Kimliği doğrulanmış gönderici", titleLabel: "Başlık", titlePlaceholder: "Örnek: Yapımcı notu", importanceLabel: "Önem", importanceNormal: "Normal", importanceImportant: "ÖNEMLİ", contentLabel: "İçerik", contentPlaceholder: "Alıcıya sunulacak metni yazın.", authIdle: "Devam et", authBusy: "Kontrol ediliyor…", sendIdle: "Gönder", sendBusy: "Gönderiliyor…", cancel: "Taslağı temizle", switchReceiver: "Alıcıyı değiştir", importantNote: "ÖNEMLİ, alıcı önizlemesine kırmızı vurgu etiketi ekler.", portForwardNote: "Bunu her yerden kullanmak için alıcı makinede 43127 portunun açılmış ve yönlendiricide/güvenlik duvarında Flow'a yönlendirilmiş olması gerekir.", authFailed: "Kimlik doğrulama başarısız oldu.", verifyFailed: "Hedef UUID şu anda doğrulanamıyor.", relayRejected: "Röle mesajı reddetti.", connectedTo: "Bağlandı: {id}", authenticatedReady: "Kimlik doğrulandı. Artık metin mesajları gönderebilirsiniz.", readyToSend: "Göndermeye hazır.", fillAuth: "Önce UUID ve erişim parolasını doldurun.", checkingAccess: "Alıcı erişimi kontrol ediliyor…", uuidInactive: "Bu UUID şu anda etkin değil.", fillContent: "Göndermeden önce Başlık ve İçerik alanlarını doldurun.", checkingLive: "Alıcının hâlâ canlı olup olmadığı kontrol ediliyor…", uuidNoLongerActive: "Bu UUID artık etkin değil. Alıcı yeniden bağlandıktan sonra tekrar kimlik doğrulayın.", receiverOffline: "Alıcı çevrimdışı oldu.", receiverLiveSending: "Alıcı canlı. Mesaj gönderiliyor…", messageSent: "Mesaj gönderildi.", authExpired: "Kimlik doğrulama süresi doldu veya başarısız oldu. Yeniden giriş yapın.", savedLoginOffline: "Kayıtlı oturum bulundu ancak alıcı şu anda çevrimdışı.", draftCleared: "Taslak temizlendi.", signInDifferent: "Farklı bir alıcı için giriş yapın." },
  ar: { language: "اللغة", pageKicker: "مرسل Flow البعيد", pageTitle: "قم بالمصادقة قبل إرسال النص إلى مستقبِل مباشر", pageSubtitle: "استخدم الـ UUID النشط مع كلمة مرور الوصول المكونة من 24 كلمة من صفحة إعدادات المستقبِل. بعد المصادقة، يمكن لهذه الصفحة إرسال رسائل نصية فقط.", authSessionIdLabel: "UUID المستقبِل", authSessionIdPlaceholder: "ألصق الـ UUID النشط من إعدادات Flow", authAccessPasswordLabel: "كلمة مرور الوصول", authAccessPasswordPlaceholder: "ألصق كلمة مرور الوصول المكونة من 24 كلمة", composerTitle: "مرسل تمت مصادقته", titleLabel: "العنوان", titlePlaceholder: "مثال: ملاحظة المنتج", importanceLabel: "الأهمية", importanceNormal: "عادي", importanceImportant: "مهم", contentLabel: "المحتوى", contentPlaceholder: "اكتب النص الذي يجب عرضه على المستقبِل.", authIdle: "متابعة", authBusy: "جارٍ التحقق…", sendIdle: "إرسال", sendBusy: "جارٍ الإرسال…", cancel: "مسح المسودة", switchReceiver: "تبديل المستقبِل", importantNote: "تضيف كلمة مهم علامة تمييز حمراء في معاينة المستقبِل.", portForwardNote: "لاستخدام هذا من أي مكان، ما زال جهاز المستقبِل يحتاج إلى فتح المنفذ 43127 وتحويله على الموجّه/الجدار الناري إلى Flow.", authFailed: "فشلت المصادقة.", verifyFailed: "تعذر التحقق من UUID الهدف الآن.", relayRejected: "رفض المرحل الرسالة.", connectedTo: "متصل بـ {id}", authenticatedReady: "تمت المصادقة. يمكنك الآن إرسال رسائل نصية.", readyToSend: "جاهز للإرسال.", fillAuth: "املأ UUID وكلمة مرور الوصول أولاً.", checkingAccess: "جارٍ التحقق من وصول المستقبِل…", uuidInactive: "هذا الـ UUID غير نشط حاليًا.", fillContent: "املأ حقلي العنوان والمحتوى قبل الإرسال.", checkingLive: "جارٍ التحقق مما إذا كان المستقبِل ما يزال مباشرًا…", uuidNoLongerActive: "لم يعد هذا الـ UUID نشطًا. قم بالمصادقة مرة أخرى بعد إعادة اتصال المستقبِل.", receiverOffline: "أصبح المستقبِل غير متصل.", receiverLiveSending: "المستقبِل مباشر. جارٍ إرسال الرسالة…", messageSent: "تم إرسال الرسالة.", authExpired: "انتهت المصادقة أو فشلت. سجّل الدخول مرة أخرى.", savedLoginOffline: "تم العثور على تسجيل دخول محفوظ، لكن المستقبِل غير متصل حاليًا.", draftCleared: "تم مسح المسودة.", signInDifferent: "سجّل الدخول إلى مستقبِل مختلف." },
  de: { language: "Sprache", pageKicker: "Flow Remote-Sender", pageTitle: "Authentifiziere dich, bevor du Text an einen Live-Empfänger sendest", pageSubtitle: "Verwende die aktive UUID und das generierte 24-Wörter-Zugriffspasswort aus den Empfängereinstellungen. Nach der Authentifizierung kann diese Seite nur Textnachrichten senden.", authSessionIdLabel: "Empfänger-UUID", authSessionIdPlaceholder: "Füge die aktive UUID aus den Flow-Einstellungen ein", authAccessPasswordLabel: "Zugriffspasswort", authAccessPasswordPlaceholder: "Füge das generierte 24-Wörter-Zugriffspasswort ein", composerTitle: "Authentifizierter Sender", titleLabel: "Titel", titlePlaceholder: "Beispiel: Hinweis der Regie", importanceLabel: "Wichtigkeit", importanceNormal: "Normal", importanceImportant: "WICHTIG", contentLabel: "Inhalt", contentPlaceholder: "Gib den Text ein, der dem Empfänger angeboten werden soll.", authIdle: "Weiter", authBusy: "Wird geprüft…", sendIdle: "Senden", sendBusy: "Wird gesendet…", cancel: "Entwurf löschen", switchReceiver: "Empfänger wechseln", importantNote: "WICHTIG fügt in der Empfängervorschau ein rotes Hervorhebungs-Tag hinzu.", portForwardNote: "Damit dies von überall funktioniert, muss auf dem Empfängergerät Port 43127 weiterhin geöffnet und im Router bzw. in der Firewall an Flow weitergeleitet werden.", authFailed: "Authentifizierung fehlgeschlagen.", verifyFailed: "Die Ziel-UUID kann derzeit nicht überprüft werden.", relayRejected: "Das Relay hat die Nachricht abgelehnt.", connectedTo: "Verbunden mit {id}", authenticatedReady: "Authentifiziert. Du kannst jetzt Textnachrichten senden.", readyToSend: "Bereit zum Senden.", fillAuth: "Fülle zuerst UUID und Zugriffspasswort aus.", checkingAccess: "Empfängerzugriff wird geprüft…", uuidInactive: "Diese UUID ist derzeit nicht aktiv.", fillContent: "Fülle vor dem Senden die Felder Titel und Inhalt aus.", checkingLive: "Es wird geprüft, ob der Empfänger noch live ist…", uuidNoLongerActive: "Diese UUID ist nicht mehr aktiv. Authentifiziere dich erneut, nachdem der Empfänger wieder verbunden ist.", receiverOffline: "Empfänger ist offline gegangen.", receiverLiveSending: "Empfänger ist live. Nachricht wird gesendet…", messageSent: "Nachricht gesendet.", authExpired: "Authentifizierung abgelaufen oder fehlgeschlagen. Bitte erneut anmelden.", savedLoginOffline: "Gespeicherte Anmeldung gefunden, aber der Empfänger ist derzeit offline.", draftCleared: "Entwurf gelöscht.", signInDifferent: "Melde dich bei einem anderen Empfänger an." },
  fr: { language: "Langue", pageKicker: "Expéditeur distant Flow", pageTitle: "Authentifiez-vous avant d'envoyer du texte à un récepteur en direct", pageSubtitle: "Utilisez l'UUID actif et le mot de passe d'accès généré de 24 mots depuis la page des paramètres du récepteur. Après authentification, cette page peut uniquement envoyer des messages texte.", authSessionIdLabel: "UUID du récepteur", authSessionIdPlaceholder: "Collez l'UUID actif depuis les paramètres de Flow", authAccessPasswordLabel: "Mot de passe d'accès", authAccessPasswordPlaceholder: "Collez le mot de passe d'accès généré de 24 mots", composerTitle: "Expéditeur authentifié", titleLabel: "Titre", titlePlaceholder: "Exemple : note du producteur", importanceLabel: "Importance", importanceNormal: "Normale", importanceImportant: "IMPORTANT", contentLabel: "Contenu", contentPlaceholder: "Saisissez le texte à proposer au récepteur.", authIdle: "Continuer", authBusy: "Vérification…", sendIdle: "Envoyer", sendBusy: "Envoi…", cancel: "Effacer le brouillon", switchReceiver: "Changer de récepteur", importantNote: "IMPORTANT ajoute une balise de surbrillance rouge dans l'aperçu du récepteur.", portForwardNote: "Pour l'utiliser depuis n'importe où, la machine du récepteur doit toujours avoir le port 43127 ouvert et redirigé vers Flow dans le routeur ou le pare-feu.", authFailed: "Échec de l'authentification.", verifyFailed: "Impossible de vérifier l'UUID cible pour le moment.", relayRejected: "Le relais a rejeté le message.", connectedTo: "Connecté à {id}", authenticatedReady: "Authentifié. Vous pouvez maintenant envoyer des messages texte.", readyToSend: "Prêt à envoyer.", fillAuth: "Renseignez d'abord l'UUID et le mot de passe d'accès.", checkingAccess: "Vérification de l'accès au récepteur…", uuidInactive: "Cet UUID n'est pas actif actuellement.", fillContent: "Remplissez les champs Titre et Contenu avant l'envoi.", checkingLive: "Vérification que le récepteur est toujours en direct…", uuidNoLongerActive: "Cet UUID n'est plus actif. Authentifiez-vous de nouveau après la reconnexion du récepteur.", receiverOffline: "Le récepteur s'est déconnecté.", receiverLiveSending: "Le récepteur est en direct. Envoi du message…", messageSent: "Message envoyé.", authExpired: "L'authentification a expiré ou a échoué. Reconnectez-vous.", savedLoginOffline: "Connexion enregistrée trouvée, mais le récepteur est actuellement hors ligne.", draftCleared: "Brouillon effacé.", signInDifferent: "Connectez-vous à un autre récepteur." }
};

Object.assign(TRANSLATIONS.en, {
  replyTitle: "Message replies",
  replyHelp: "Queued messages update here when the receiver accepts or denies them.",
  replyHelpUnavailable: "This relay does not expose message replies yet, so sent messages can only show as queued here.",
  replyEmpty: "No sent messages yet.",
  replyUpdated: "Updated {time}",
  replyStatusQueued: "Queued",
  replyStatusAccepted: "Accepted",
  replyStatusDenied: "Denied",
  replyStatusNotFound: "Missing",
  replyStatusUnsupported: "Unavailable"
});

Object.assign(TRANSLATIONS.tr, {
  replyTitle: "Mesaj yanıtları",
  replyHelp: "Sıradaki mesajlar, alıcı kabul ettiğinde veya reddettiğinde burada güncellenir.",
  replyHelpUnavailable: "Bu röle henüz mesaj yanıtlarını sunmuyor, bu yüzden gönderilen mesajlar burada yalnızca kuyrukta olarak görünebilir.",
  replyEmpty: "Henüz gönderilmiş mesaj yok.",
  replyUpdated: "Güncellendi: {time}",
  replyStatusQueued: "Kuyrukta",
  replyStatusAccepted: "Kabul edildi",
  replyStatusDenied: "Reddedildi",
  replyStatusNotFound: "Bulunamadı",
  replyStatusUnsupported: "Kullanılamıyor"
});

Object.assign(TRANSLATIONS.ar, {
  replyTitle: "ردود الرسائل",
  replyHelp: "تتحدث الرسائل الموضوعة في الانتظار هنا عندما يقبلها المستقبِل أو يرفضها.",
  replyHelpUnavailable: "هذا المرحل لا يوفّر ردود الرسائل بعد، لذلك لن تظهر الرسائل المرسلة هنا إلا كأنها في الانتظار.",
  replyEmpty: "لا توجد رسائل مرسلة بعد.",
  replyUpdated: "تم التحديث {time}",
  replyStatusQueued: "قيد الانتظار",
  replyStatusAccepted: "تم القبول",
  replyStatusDenied: "تم الرفض",
  replyStatusNotFound: "غير موجودة",
  replyStatusUnsupported: "غير متاح"
});

Object.assign(TRANSLATIONS.de, {
  replyTitle: "Nachrichtenrückmeldungen",
  replyHelp: "Eingereihte Nachrichten werden hier aktualisiert, wenn der Empfänger sie annimmt oder ablehnt.",
  replyHelpUnavailable: "Dieses Relay stellt noch keine Nachrichtenrückmeldungen bereit, daher können gesendete Nachrichten hier nur als eingereiht angezeigt werden.",
  replyEmpty: "Noch keine gesendeten Nachrichten.",
  replyUpdated: "Aktualisiert {time}",
  replyStatusQueued: "Eingereiht",
  replyStatusAccepted: "Angenommen",
  replyStatusDenied: "Abgelehnt",
  replyStatusNotFound: "Fehlt",
  replyStatusUnsupported: "Nicht verfügbar"
});

Object.assign(TRANSLATIONS.fr, {
  replyTitle: "Réponses des messages",
  replyHelp: "Les messages en file d'attente se mettent à jour ici lorsque le récepteur les accepte ou les refuse.",
  replyHelpUnavailable: "Ce relais n'expose pas encore les réponses des messages, donc les messages envoyés ne peuvent apparaître ici qu'en attente.",
  replyEmpty: "Aucun message envoyé pour l'instant.",
  replyUpdated: "Mis à jour {time}",
  replyStatusQueued: "En attente",
  replyStatusAccepted: "Accepté",
  replyStatusDenied: "Refusé",
  replyStatusNotFound: "Introuvable",
  replyStatusUnsupported: "Indisponible"
});

const RTL_LANGUAGES = new Set(["ar"]);
const LANGUAGE_STORAGE_KEY = "flow.remote.sender.language";
const MESSAGE_REPLY_POLL_MS = 2_500;
const MESSAGE_REPLY_HISTORY_LIMIT = 8;

const ui = {
  languageLabel: document.querySelector("#languageLabel"), languageSelect: document.querySelector("#languageSelect"), pageKicker: document.querySelector("#pageKicker"), pageTitle: document.querySelector("#pageTitle"), pageSubtitle: document.querySelector("#pageSubtitle"), authForm: document.querySelector("#authForm"), authSessionIdLabel: document.querySelector("#authSessionIdLabel"), authSessionIdInput: document.querySelector("#authSessionIdInput"), authAccessPasswordLabel: document.querySelector("#authAccessPasswordLabel"), authAccessPasswordInput: document.querySelector("#authAccessPasswordInput"), authButton: document.querySelector("#authButton"), authStatus: document.querySelector("#authStatus"), composerSection: document.querySelector("#composerSection"), composerTitle: document.querySelector("#composerTitle"), sessionSummary: document.querySelector("#sessionSummary"), switchSessionButton: document.querySelector("#switchSessionButton"), form: document.querySelector("#remoteForm"), titleLabel: document.querySelector("#titleLabel"), titleInput: document.querySelector("#titleInput"), contentLabel: document.querySelector("#contentLabel"), contentInput: document.querySelector("#contentInput"), importanceLabel: document.querySelector("#importanceLabel"), importanceInput: document.querySelector("#importanceInput"), sendButton: document.querySelector("#sendButton"), cancelButton: document.querySelector("#cancelButton"), statusMessage: document.querySelector("#statusMessage"), replySection: document.querySelector("#replySection"), replyTitle: document.querySelector("#replyTitle"), replyHelp: document.querySelector("#replyHelp"), replyList: document.querySelector("#replyList"), importantNote: document.querySelector("#importantNote"), portForwardNote: document.querySelector("#portForwardNote")
};

let authenticatedSession = null;
let currentLanguage = normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) || navigator.language || "en");
let authBusy = false;
let sendBusy = false;
let sentMessageReplies = [];
let replyPollTimer = 0;
let replyEndpointUnsupported = false;

function normalizeLanguage(value) { const normalized = String(value || "en").toLowerCase().slice(0, 2); return Object.hasOwn(TRANSLATIONS, normalized) ? normalized : "en"; }
function t(key, params = {}) { const template = TRANSLATIONS[currentLanguage]?.[key] ?? TRANSLATIONS.en[key] ?? key; return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`)); }

function normalizeReplyStatus(value) {
  switch (String(value || "").trim()) {
    case "accepted":
      return "accepted";
    case "denied":
      return "denied";
    case "notFound":
      return "notFound";
    case "unsupported":
      return "unsupported";
    default:
      return "queued";
  }
}

function getReplyStatusLabel(status) {
  switch (normalizeReplyStatus(status)) {
    case "accepted":
      return t("replyStatusAccepted");
    case "denied":
      return t("replyStatusDenied");
    case "notFound":
      return t("replyStatusNotFound");
    case "unsupported":
      return t("replyStatusUnsupported");
    default:
      return t("replyStatusQueued");
  }
}

function formatReplyTimestamp(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "";
  }

  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (error) {
    return "";
  }
}

function getVisibleReplies() {
  if (!authenticatedSession?.sessionId) {
    return [];
  }

  return sentMessageReplies.filter((entry) => entry.sessionId === authenticatedSession.sessionId);
}

function stopReplyPolling() {
  if (replyPollTimer) {
    clearTimeout(replyPollTimer);
    replyPollTimer = 0;
  }
}

function renderReplyList() {
  if (!ui.replyList || !ui.replyHelp || !ui.replyTitle) {
    return;
  }

  ui.replyTitle.textContent = t("replyTitle");
  ui.replyHelp.textContent = replyEndpointUnsupported ? t("replyHelpUnavailable") : t("replyHelp");

  const replies = getVisibleReplies();
  ui.replyList.replaceChildren();

  if (replies.length === 0) {
    const empty = document.createElement("p");
    empty.className = "reply-empty";
    empty.textContent = t("replyEmpty");
    ui.replyList.appendChild(empty);
    return;
  }

  replies.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "reply-item";

    const header = document.createElement("div");
    header.className = "reply-item-header";

    const title = document.createElement("strong");
    title.className = "reply-item-title";
    title.textContent = entry.title || entry.messageId;

    const badge = document.createElement("span");
    badge.className = "reply-badge";
    badge.dataset.status = normalizeReplyStatus(entry.status);
    badge.textContent = getReplyStatusLabel(entry.status);

    header.append(title, badge);

    const meta = document.createElement("p");
    meta.className = "reply-item-meta";
    const updatedAt = formatReplyTimestamp(entry.resolvedAtMs || entry.createdAtMs);
    meta.textContent = updatedAt ? t("replyUpdated", { time: updatedAt }) : "";

    item.append(header, meta);
    ui.replyList.appendChild(item);
  });
}

function upsertReplyEntry(entry) {
  const nextEntry = {
    sessionId: entry.sessionId,
    messageId: entry.messageId,
    title: entry.title || entry.messageId,
    status: normalizeReplyStatus(entry.status),
    createdAtMs: Number(entry.createdAtMs) || Date.now(),
    resolvedAtMs: Number(entry.resolvedAtMs) || null
  };
  const existingIndex = sentMessageReplies.findIndex((item) => item.sessionId === nextEntry.sessionId && item.messageId === nextEntry.messageId);
  if (existingIndex >= 0) {
    sentMessageReplies[existingIndex] = { ...sentMessageReplies[existingIndex], ...nextEntry };
  } else {
    sentMessageReplies.unshift(nextEntry);
  }

  if (sentMessageReplies.length > MESSAGE_REPLY_HISTORY_LIMIT) {
    sentMessageReplies = sentMessageReplies.slice(0, MESSAGE_REPLY_HISTORY_LIMIT);
  }

  renderReplyList();
}

function scheduleReplyPolling(delayMs = MESSAGE_REPLY_POLL_MS) {
  stopReplyPolling();

  if (replyEndpointUnsupported) {
    return;
  }

  const hasPendingReplies = getVisibleReplies().some((entry) => normalizeReplyStatus(entry.status) === "queued");
  if (!hasPendingReplies) {
    return;
  }

  replyPollTimer = window.setTimeout(() => {
    pollReplyStatuses().catch(console.error);
  }, Math.max(delayMs, 0));
}

async function fetchMessageReplyStatus(sessionId, messageId) {
  const response = await fetch(`/api/receiver/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(messageId)}/status`, {
    headers: buildAuthHeaders(),
    cache: "no-store"
  });
  const data = await response.json().catch(() => null);

  if (!response.ok && response.status === 404 && !data?.status) {
    return { unsupported: true };
  }

  if (!response.ok && data?.status === "notFound") {
    return data;
  }

  if (!response.ok) {
    throw new Error(data?.message || t("verifyFailed"));
  }

  return data;
}

async function pollReplyStatuses() {
  const pendingReplies = getVisibleReplies().filter((entry) => normalizeReplyStatus(entry.status) === "queued");
  if (!pendingReplies.length) {
    stopReplyPolling();
    renderReplyList();
    return;
  }

  let shouldContinue = false;

  for (const entry of pendingReplies) {
    try {
      const result = await fetchMessageReplyStatus(entry.sessionId, entry.messageId);
      if (result?.unsupported) {
        replyEndpointUnsupported = true;
        renderReplyList();
        stopReplyPolling();
        return;
      }

      const nextStatus = normalizeReplyStatus(result?.status);
      upsertReplyEntry({
        sessionId: entry.sessionId,
        messageId: result?.messageId || entry.messageId,
        title: result?.title || entry.title,
        status: nextStatus,
        createdAtMs: result?.createdAtMs || entry.createdAtMs,
        resolvedAtMs: result?.resolvedAtMs || null
      });

      if (nextStatus === "queued") {
        shouldContinue = true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/auth|credential|password|access|unauthorized|forbidden/i.test(message)) {
        leaveComposer(t("authExpired"));
        setStatus(message, "error");
        stopReplyPolling();
        return;
      }

      shouldContinue = true;
    }
  }

  renderReplyList();
  if (shouldContinue) {
    scheduleReplyPolling();
  }
}

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
  renderReplyList();
}

function setStatus(message, tone = "") { ui.statusMessage.textContent = message; ui.statusMessage.className = `status${tone ? ` ${tone}` : ""}`; }
function setAuthStatus(message, tone = "") { ui.authStatus.textContent = message; ui.authStatus.className = `status${tone ? ` ${tone}` : ""}`; }
function setBusy(isBusy) { sendBusy = isBusy; ui.sendButton.disabled = isBusy; ui.sendButton.textContent = isBusy ? t("sendBusy") : t("sendIdle"); }
function setAuthBusy(isBusy) { authBusy = isBusy; ui.authButton.disabled = isBusy; ui.authButton.textContent = isBusy ? t("authBusy") : t("authIdle"); }
function buildAuthHeaders(auth = authenticatedSession) { return auth ? { "X-Flow-Access-Password": auth.accessPassword } : {}; }

function getPresetAuthFromUrl(url = new URL(window.location.href)) {
  return {
    sessionId: url.searchParams.get("id")?.trim() || "",
    accessPassword: url.searchParams.get("accessPassword")?.trim() || ""
  };
}

function stripSensitiveAuthParamsFromUrl(url = new URL(window.location.href)) {
  if (!url.searchParams.has("accessPassword")) {
    return;
  }

  const sanitizedUrl = new URL(url.toString());
  sanitizedUrl.searchParams.delete("accessPassword");
  window.history.replaceState({}, "", sanitizedUrl.toString());
}

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

async function tryAuthenticatePrefilledSession(payload, options = {}) {
  const { inactiveMessage = t("uuidInactive"), inactiveTone = "error" } = options;
  if (!payload?.sessionId || !payload?.accessPassword) {
    return false;
  }

  setAuthBusy(true);
  setAuthStatus(t("checkingAccess"));

  try {
    const result = await authenticateSession(payload);
    if (!result.active) {
      sessionStorage.removeItem("flow.remote.sender.auth");
      setAuthStatus(inactiveMessage, inactiveTone);
      return false;
    }

    enterComposer(payload);
    return true;
  } catch (error) {
    setAuthStatus(error instanceof Error ? error.message : String(error), "error");
    return false;
  } finally {
    setAuthBusy(false);
  }
}

function enterComposer(auth) {
  authenticatedSession = auth;
  replyEndpointUnsupported = false;
  sessionStorage.setItem("flow.remote.sender.auth", JSON.stringify(auth));
  ui.composerSection.classList.remove("hidden");
  ui.authForm.classList.add("hidden");
  ui.sessionSummary.textContent = t("connectedTo", { id: auth.sessionId });
  setAuthStatus(t("authenticatedReady"), "success");
  setStatus(t("readyToSend"));
  renderReplyList();
  scheduleReplyPolling(0);
}

function leaveComposer(message = "") {
  authenticatedSession = null;
  replyEndpointUnsupported = false;
  stopReplyPolling();
  sessionStorage.removeItem("flow.remote.sender.auth");
  ui.composerSection.classList.add("hidden");
  ui.authForm.classList.remove("hidden");
  resetForm();
  renderReplyList();
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
    const queuedMessageId = result?.queuedMessageId || result?.queued_message_id;
    if (queuedMessageId) {
      upsertReplyEntry({
        sessionId: payload.sessionId,
        messageId: queuedMessageId,
        title: payload.title,
        status: "queued",
        createdAtMs: Date.now(),
        resolvedAtMs: null
      });
      scheduleReplyPolling(0);
    }
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
  const presetAuth = getPresetAuthFromUrl(url);
  if (presetAuth.sessionId) ui.authSessionIdInput.value = presetAuth.sessionId;
  if (presetAuth.accessPassword) ui.authAccessPasswordInput.value = presetAuth.accessPassword;
  stripSensitiveAuthParamsFromUrl(url);

  ui.languageSelect.addEventListener("change", () => {
    currentLanguage = normalizeLanguage(ui.languageSelect.value);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    applyTranslations();
  });

  if (presetAuth.sessionId && presetAuth.accessPassword) {
    await tryAuthenticatePrefilledSession(presetAuth);
  } else {
    const savedAuth = sessionStorage.getItem("flow.remote.sender.auth");
    if (savedAuth) {
    try {
      const parsed = JSON.parse(savedAuth);
      if (parsed?.sessionId && parsed?.accessPassword) {
        ui.authSessionIdInput.value = parsed.sessionId;
        ui.authAccessPasswordInput.value = parsed.accessPassword;
        await tryAuthenticatePrefilledSession(parsed, {
          inactiveMessage: t("savedLoginOffline"),
          inactiveTone: "warn"
        });
      }
    } catch (error) {
      console.error(error);
      sessionStorage.removeItem("flow.remote.sender.auth");
    }
    }
  }

  ui.authForm.addEventListener("submit", handleAuthenticate);
  ui.form.addEventListener("submit", handleSubmit);
  ui.cancelButton.addEventListener("click", () => { resetForm(); setStatus(t("draftCleared")); });
  ui.switchSessionButton.addEventListener("click", () => { leaveComposer(t("signInDifferent")); });
});
