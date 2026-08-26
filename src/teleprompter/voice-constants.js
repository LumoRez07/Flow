/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export const VOICE_WORD_VIEWPORT_OFFSET = 0.42;
export const VOICE_LINE_VIEWPORT_OFFSET = 0.38;
export const VOICE_SCROLL_EASING = 0.28;
export const VOICE_SCROLL_MAX_STEP = 56;
export const VOICE_TRACKING_PARTIAL_MIN_INTERVAL_MS = 10;
export const VOICE_TRACKING_PARTIAL_REPEAT_GUARD_MS = 25;
export const VOICE_TRACKING_ADVANCE_STEP_MS = 120;
export const VOICE_TRACKING_MIN_STEP_MS = 30;
export const VOICE_TRACKING_MAX_STEP_MS = 180;
export const VOICE_TRACKING_DEFAULT_STEP_MS = 120;
export const VOICE_TRACKING_MAX_ANIMATED_JUMP = 10;
export const VOICE_TRACKING_MATCH_RADIUS = 2;
export const VOICE_FORWARD_SKIP_CONFIRM_MS = 2500;
export const VOICE_COMMAND_SOUND_REPEAT_GUARD_MS = 700;
export const VOICE_COMMAND_RESTART_DELAY_MS = 0;
export const VOICE_COMMAND_COOLDOWN_MS = 40;
export const VOICE_COMMAND_IDLE_ARM_MS = 45_000;
export const VOICE_COMMAND_REPEAT_GUARD_MS = 450;
export const VOICE_COMMAND_ACTION_REPEAT_GUARD_MS = 520;
export const VOICE_COMMAND_MIN_CONFIDENCE = 0.35;
export const VOICE_COMMAND_BUFFER_TOKEN_LIMIT = 12;
export const VOICE_COMMAND_LOOKBACK_TOKENS = 10;
export const VOSK_COMMAND_BUFFER_SIZE = 4096;
export const VOSK_SCRIPT_PROCESSOR_FALLBACK_BUFFER_SIZE = 1024;
export const NATIVE_VOICE_EVENT_NAME = "flow-native-voice-event";
export const VOICE_WAKE_VISUAL_MS = 2400;
export const VOICE_WAKE_COMMAND_WINDOW_MS = 3200;
export const VOICE_WAKE_COOLDOWN_MS = 2000;
export const VOICE_WAKE_REPEAT_GUARD_MS = 900;
export const VOICE_WAKE_MIN_CONFIDENCE = 0.35;
export const VOICE_HEALTH_IDLE_CHECK_MS = 30_000;
export const VOICE_HEALTH_ACTIVE_CHECK_MS = 8_000;
export const VOICE_COMMAND_STALL_RESET_MS = 20_000;
export const VOICE_CAPTURE_ERROR_PERMISSION_DENIED = "voice-capture-permission-denied";
export const VOICE_CAPTURE_ERROR_NO_DEVICE = "voice-capture-no-device";
export const VOICE_CAPTURE_ERROR_UNAVAILABLE = "voice-capture-unavailable";
export const ENGLISH_VOICE_LANGUAGE = "en-US";

export const BASE_VOICE_COMMAND_FILLER_TOKENS = ["please", "the", "a", "an", "to", "for", "now", "okay", "ok", "hey", "just"];
export const BASE_VOICE_ACTION_ALIASES = {
  "open-about": ["about", "about flow", "open info", "app info"],
  "open-settings": ["settings", "setting", "preferences", "open settings"],
  "open-input": ["text editor", "text page", "input", "editor", "open text editor"],
  "use-groq": ["use groq", "groq", "ask groq", "generate with groq"],
  "next-theme": ["next theme", "change theme", "switch theme"],
  "open-receiver": ["open receiver", "receiver", "receiver inbox", "open inbox", "remote inbox"],
  "free-drag": ["free drag", "free-drag", "freedrag", "drag free"],
  "top-center": ["top center", "top centre", "top-center", "topcentre", "center top", "centre top"],
  "play": ["play", "start", "begin"],
  "hide": ["hide", "hyde", "high", "hides", "conceal", "disappear", "vanish"],
  "show": ["show", "unhide", "display", "reveal", "appear"],
  "minimize": ["minimize", "minimise", "minimized", "minimised", "mini", "minimum", "collapse", "collapsed"],
  "expand": ["expand", "restore", "open"],
  "exit": ["exit", "exist", "eggsit", "eggzit", "close", "quit"],
  "restart": ["restart", "reset", "replay"],
  "stop": ["stop", "end"],
  "pause": ["pause", "halt", "hold", "wait"],
  "continue": ["continue", "resume", "continue on"],
  "up": ["up", "previous", "back"],
  "down": ["down", "next", "forward"]
};

export const VOICE_COMMAND_ACTION_DEDUPE_ACTIONS = new Set([
  "up",
  "down",
  "hide",
  "show",
  "minimize",
  "expand",
  "free-drag",
  "top-center"
]);

export const VOICE_COMMAND_EXACT_SINGLE_TOKEN_ACTIONS = new Set([
  "hide",
  "show",
  "minimize",
  "expand",
  "exit"
]);

export function mergeVoiceActionAliases(baseAliases, localizedAliases = {}) {
  return Object.fromEntries(
    Object.entries(baseAliases).map(([action, aliases]) => {
      const localized = Array.isArray(localizedAliases[action]) ? localizedAliases[action] : [];
      return [action, Array.from(new Set([...aliases, ...localized]))];
    })
  );
}

export function createVoiceLanguageConfigs() {
  return {
    "en-US": {
      language: "en-US",
      wakeDisplay: "Hey Flow",
      greetings: ["hey", "hi", "hello"],
      wake: ["flow", "flo"],
      filler: [...BASE_VOICE_COMMAND_FILLER_TOKENS],
      actions: mergeVoiceActionAliases(BASE_VOICE_ACTION_ALIASES)
    },
    "tr-TR": {
      language: "tr-TR",
      wakeDisplay: "Selam Flow",
      greetings: ["hey", "selam", "merhaba"],
      wake: ["flow", "flo", "flov"],
      filler: [...BASE_VOICE_COMMAND_FILLER_TOKENS, "lütfen", "bir", "bu", "şimdi", "tamam"],
      actions: mergeVoiceActionAliases(BASE_VOICE_ACTION_ALIASES, {
        "open-about": ["hakkında", "flow hakkında", "bilgi"],
        "open-settings": ["ayarlar", "ayarları aç", "tercihler"],
        "open-input": ["metin editörü", "metin sayfası", "girdi", "editör"],
        "use-groq": ["groq kullan", "groq sor", "groq ile oluştur"],
        "next-theme": ["sonraki tema", "tema değiştir", "temayı değiştir"],
        "open-receiver": ["alıcıyı aç", "alıcı", "gelen kutusu", "uzak gelen kutusu"],
        "free-drag": ["serbest sürükle", "özgür sürükle", "serbest mod"],
        "top-center": ["üst orta", "üste ortala", "üst merkeze al"],
        "play": ["başlat", "oynat"],
        "hide": ["gizle", "sakla"],
        "show": ["göster", "açığa çıkar"],
        "minimize": ["küçült", "daralt"],
        "expand": ["genişlet", "geri aç", "eski boyut"],
        "exit": ["çık", "kapat"],
        "restart": ["yeniden başlat", "baştan başlat", "sıfırla"],
        "stop": ["durdur", "bitir"],
        "pause": ["duraklat", "bekle"],
        "continue": ["devam et", "sürdür"],
        "up": ["yukarı", "önceki", "geri"],
        "down": ["aşağı", "sonraki", "ileri"]
      })
    },
    "ar-SA": {
      language: "ar-SA",
      wakeDisplay: "مرحبا فلو",
      greetings: ["مرحبا", "اهلا", "يا", "هاي"],
      wake: ["فلو", "فلوو", "flow", "flo"],
      filler: [...BASE_VOICE_COMMAND_FILLER_TOKENS, "من", "إلى", "الآن", "من فضلك", "حسنا"],
      actions: mergeVoiceActionAliases(BASE_VOICE_ACTION_ALIASES, {
        "open-about": ["حول", "حول فلو", "معلومات"],
        "open-settings": ["الإعدادات", "افتح الإعدادات", "التفضيلات"],
        "open-input": ["محرر النص", "صفحة النص", "الإدخال", "المحرر"],
        "use-groq": ["استخدم groq", "اسأل groq", "أنشئ عبر groq"],
        "next-theme": ["السمة التالية", "غيّر السمة", "بدل السمة"],
        "open-receiver": ["افتح المستقبِل", "المستقبِل", "صندوق الوارد", "الوارد البعيد"],
        "free-drag": ["سحب حر", "حرّك بحرية"],
        "top-center": ["أعلى الوسط", "توسيط علوي"],
        "play": ["ابدأ", "شغّل"],
        "hide": ["أخف", "اخفاء"],
        "show": ["أظهر", "اظهر"],
        "minimize": ["صغّر", "قلّص"],
        "expand": ["وسّع", "استعد الحجم"],
        "exit": ["اخرج", "اغلق", "إنهاء"],
        "restart": ["أعد التشغيل", "ابدأ من جديد", "إعادة ضبط"],
        "stop": ["توقف", "انه"],
        "pause": ["أوقف مؤقتا", "انتظر"],
        "continue": ["تابع", "استأنف"],
        "up": ["أعلى", "السابق", "ارجع"],
        "down": ["أسفل", "التالي", "تقدم"]
      })
    },
    "de-DE": {
      language: "de-DE",
      wakeDisplay: "Hallo Flow",
      greetings: ["hey", "hallo", "hi"],
      wake: ["flow", "flo", "flou"],
      filler: [...BASE_VOICE_COMMAND_FILLER_TOKENS, "bitte", "jetzt", "okay", "mal"],
      actions: mergeVoiceActionAliases(BASE_VOICE_ACTION_ALIASES, {
        "open-about": ["über", "über flow", "info"],
        "open-settings": ["einstellungen", "einstellung", "öffne einstellungen"],
        "open-input": ["texteditor", "textseite", "eingabe", "editor"],
        "use-groq": ["nutze groq", "frage groq", "mit groq erzeugen"],
        "next-theme": ["nächstes thema", "thema wechseln", "thema ändern"],
        "open-receiver": ["empfänger öffnen", "empfänger", "posteingang", "remote posteingang"],
        "free-drag": ["frei ziehen", "freies ziehen", "freier modus"],
        "top-center": ["oben mitte", "oben zentriert"],
        "play": ["start", "abspielen"],
        "hide": ["verstecken", "ausblenden"],
        "show": ["zeigen", "einblenden"],
        "minimize": ["minimieren", "verkleinern"],
        "expand": ["erweitern", "wiederherstellen"],
        "exit": ["beenden", "schließen"],
        "restart": ["neu starten", "zurücksetzen", "von vorn"],
        "stop": ["stopp", "anhalten"],
        "pause": ["pause", "warte"],
        "continue": ["weiter", "fortsetzen"],
        "up": ["hoch", "zurück", "vorherige"],
        "down": ["runter", "weiter", "nächste"]
      })
    },
    "fr-FR": {
      language: "fr-FR",
      wakeDisplay: "Salut Flow",
      greetings: ["salut", "bonjour", "hey"],
      wake: ["flow", "flo", "flot"],
      filler: [...BASE_VOICE_COMMAND_FILLER_TOKENS, "s'il", "te", "plaît", "maintenant", "ok"],
      actions: mergeVoiceActionAliases(BASE_VOICE_ACTION_ALIASES, {
        "open-about": ["à propos", "à propos de flow", "infos"],
        "open-settings": ["paramètres", "ouvrir paramètres", "préférences"],
        "open-input": ["éditeur de texte", "page texte", "entrée", "éditeur"],
        "use-groq": ["utilise groq", "demande groq", "génère avec groq"],
        "next-theme": ["thème suivant", "changer thème", "theme suivant"],
        "open-receiver": ["ouvrir récepteur", "récepteur", "boîte de réception", "boite de réception"],
        "free-drag": ["glisser librement", "déplacement libre", "drag libre"],
        "top-center": ["haut centre", "centre en haut"],
        "play": ["lecture", "démarrer", "jouer"],
        "hide": ["masquer", "cache"],
        "show": ["afficher", "montre"],
        "minimize": ["réduire", "minimiser"],
        "expand": ["agrandir", "restaurer"],
        "exit": ["quitter", "fermer"],
        "restart": ["redémarrer", "recommencer", "réinitialiser"],
        "stop": ["arrête", "stop"],
        "pause": ["pause", "attends"],
        "continue": ["continuer", "reprendre"],
        "up": ["haut", "précédent", "retour"],
        "down": ["bas", "suivant", "avance"]
      })
    },
    "es-ES": {
      language: "es-ES",
      wakeDisplay: "Hola Flow",
      greetings: ["hola", "hey", "oye"],
      wake: ["flow", "flo", "flou"],
      filler: [...BASE_VOICE_COMMAND_FILLER_TOKENS, "por", "favor", "ahora", "vale", "ok"],
      actions: mergeVoiceActionAliases(BASE_VOICE_ACTION_ALIASES, {
        "open-about": ["acerca de", "sobre flow", "información"],
        "open-settings": ["ajustes", "configuración", "abrir ajustes"],
        "open-input": ["editor de texto", "página de texto", "entrada", "editor"],
        "use-groq": ["usar groq", "pregunta a groq", "genera con groq"],
        "next-theme": ["siguiente tema", "cambiar tema"],
        "open-receiver": ["abrir receptor", "receptor", "bandeja", "bandeja remota"],
        "free-drag": ["arrastre libre", "mover libremente"],
        "top-center": ["arriba centro", "centro superior"],
        "play": ["reproducir", "iniciar", "empezar"],
        "hide": ["ocultar", "esconder"],
        "show": ["mostrar", "enseñar"],
        "minimize": ["minimizar", "reducir"],
        "expand": ["expandir", "restaurar"],
        "exit": ["salir", "cerrar"],
        "restart": ["reiniciar", "empezar de nuevo", "restablecer"],
        "stop": ["detener", "para"],
        "pause": ["pausa", "espera"],
        "continue": ["continuar", "reanudar"],
        "up": ["arriba", "anterior", "atrás"],
        "down": ["abajo", "siguiente", "adelante"]
      })
    },
    "pt-BR": {
      language: "pt-BR",
      wakeDisplay: "Olá Flow",
      greetings: ["olá", "ola", "oi", "hey"],
      wake: ["flow", "flo", "flou"],
      filler: [...BASE_VOICE_COMMAND_FILLER_TOKENS, "por", "favor", "agora", "ok", "beleza"],
      actions: mergeVoiceActionAliases(BASE_VOICE_ACTION_ALIASES, {
        "open-about": ["sobre", "sobre flow", "informações", "info"],
        "open-settings": ["configurações", "ajustes", "abrir configurações", "preferências"],
        "open-input": ["editor de texto", "página de texto", "entrada", "editor"],
        "use-groq": ["usar groq", "perguntar ao groq", "gerar com groq"],
        "next-theme": ["próximo tema", "mudar tema", "trocar tema"],
        "open-receiver": ["abrir receptor", "receptor", "caixa de entrada", "inbox remoto"],
        "free-drag": ["arrastar livre", "modo livre", "mover livremente"],
        "top-center": ["topo centro", "centralizar no topo", "centro superior"],
        "play": ["reproduzir", "iniciar", "começar", "play"],
        "hide": ["ocultar", "esconder", "sumir"],
        "show": ["mostrar", "exibir", "aparecer"],
        "minimize": ["minimizar", "reduzir", "encolher"],
        "expand": ["expandir", "restaurar", "abrir"],
        "exit": ["sair", "fechar", "encerrar"],
        "restart": ["reiniciar", "recomeçar", "do início"],
        "stop": ["parar", "encerrar"],
        "pause": ["pausar", "esperar", "pausa"],
        "continue": ["continuar", "prosseguir", "retomar"],
        "up": ["cima", "anterior", "voltar"],
        "down": ["baixo", "próximo", "avançar"]
      })
    },
    "fi-FI": {
      language: "fi-FI",
      wakeDisplay: "Hei Flow",
      greetings: ["hei", "terve", "moro", "moi", "hey"],
      wake: ["flow", "flo", "flou"],
      filler: [...BASE_VOICE_COMMAND_FILLER_TOKENS, "ole", "hyvä", "nyt", "okei", "ok", "vain"],
      actions: mergeVoiceActionAliases(BASE_VOICE_ACTION_ALIASES, {
        "open-about": ["tietoja", "tietoja sovelluksesta", "info"],
        "open-settings": ["asetukset", "avaa asetukset", "valinnat"],
        "open-input": ["tekstieditori", "tekstisivu", "syöte", "editori"],
        "use-groq": ["käytä groqia", "kysy groqilta", "luo groqilla"],
        "next-theme": ["seuraava teema", "vaihda teemaa"],
        "open-receiver": ["avaa vastaanotin", "vastaanotin", "saapuneet"],
        "free-drag": ["vapaa siirto", "vapaa tila"],
        "top-center": ["yläosa keskellä", "keskitä ylös"],
        "play": ["toista", "aloita", "käynnistä"],
        "hide": ["piilota", "kätke"],
        "show": ["näytä", "tuo esiin"],
        "minimize": ["pienennä", "kutista"],
        "expand": ["suurenna", "palauta", "avaa"],
        "exit": ["poistu", "sulje", "lopeta"],
        "restart": ["aloita alusta", "käynnistä uudelleen", "nollaa"],
        "stop": ["pysäytä", "lopeta"],
        "pause": ["keskeytä", "tauko", "odota"],
        "continue": ["jatka", "jatka eteenpäin"],
        "up": ["ylös", "edellinen", "takaisin"],
        "down": ["alas", "seuraava", "eteenpäin"]
      })
    }
  };
}

export const VOICE_LANGUAGE_CONFIGS = createVoiceLanguageConfigs();
