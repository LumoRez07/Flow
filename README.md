<!--
  Flow - A high-performance teleprompter for Windows.
  Copyright (C) 2026 Waled Alturkmani (LumoRez07)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
-->

<p align="center">
  <img src="src/assets/flow-logo.png" width="128" height="128" alt="Flow logo" />
</p>

<h1 align="center">Flow</h1>

<p align="center">
  Windows-first teleprompter software built with Tauri for clean reading, fast control, voice-assisted workflows, and low-overhead desktop performance.
</p>

<p align="center">
  <strong>v1.4.0</strong> · Tauri v2 · Rust Core · Vanilla JS UI · Windows-first
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.4.0-2563eb?style=for-the-badge" />
  <img alt="Platform" src="https://img.shields.io/badge/platform-Windows-0f172a?style=for-the-badge&logo=windows" />
  <img alt="Tauri v2" src="https://img.shields.io/badge/Tauri-v2-24c8db?style=for-the-badge&logo=tauri" />
  <img alt="Rust" src="https://img.shields.io/badge/Rust-Core-b7410e?style=for-the-badge&logo=rust" />
  <img alt="JavaScript" src="https://img.shields.io/badge/Frontend-Vanilla%20JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=111827" />
</p>

<p align="center">
  <img alt="Voice Commands" src="https://img.shields.io/badge/Voice-Hey%20Flow-7c3aed?style=for-the-badge" />
  <img alt="Voice Tracking" src="https://img.shields.io/badge/Voice%20Tracking-6%20Languages-16a34a?style=for-the-badge" />
  <img alt="AI Drafting" src="https://img.shields.io/badge/AI-Groq-0ea5e9?style=for-the-badge" />
  <img alt="Remote Messaging" src="https://img.shields.io/badge/Remote-Messaging-10b981?style=for-the-badge" />
</p>

## Overview

Flow is a desktop teleprompter focused on live readability and operational speed. It keeps the reading surface clean while still covering voice tracking, app-wide voice commands, script editing, remote text delivery, and optional AI-assisted drafting.

## What's New in 1.4.0

- Added expanded Groq customization controls for drafting and rewriting workflows.
- Added French app localization and refreshed translation coverage in settings.
- Added a left-side playback speed rail with runtime toggle support.
- Improved Tauri window sizing and teleprompter layout stability during playback.
- Refined voice-tracking settings, model install status, and translated language labels.
- Lowered the minimum text size setting from 60% to 30%.

## Preview

<p align="center">
  <img src="assets/flow%20main.png" alt="Flow main teleprompter" width="48%" />
  <img src="assets/flow%20main%20playing.png" alt="Flow main teleprompter while playing" width="48%" />
</p>

<p align="center">
  <img src="assets/flow%20text%20editor.png" alt="Flow text editor" width="48%" />
  <img src="assets/flow%20settings.png" alt="Flow settings" width="48%" />
</p>

<p align="center">
  <img src="assets/flow%20ai%20assistant.png" alt="Flow AI assistant" width="48%" />
  <img src="assets/flow%20about.png" alt="Flow about screen" width="48%" />
</p>

<p align="center">
  <img src="assets/flow%20bright%20playing.png" alt="Flow bright theme while playing" width="48%" />
  <img src="assets/flow%20yellow%20green%20playing.png" alt="Flow yellow green theme while playing" width="48%" />
</p>

## Highlights

- Five playback styles: highlight, scroll, line, arrow, and voice tracking.
- Local-first script storage and settings persistence.
- App-wide voice control with localized wake greetings and command aliases.
- Vosk speech models with bundled English and downloadable Turkish, Arabic, German, French, and Spanish support.
- Built-in script editor with formatting, word count, and reading-time helpers.
- Remote messaging flow with inbox review before insertion.
- Optional Groq-powered generation and rewriting.
- Always-on-top Windows overlay with click-through and capture-protection options.
- Built-in updater for published Windows installer releases.

## Installation

Download the latest Windows release from the GitHub Releases page.

## Development

Requirements:
- Node.js
- Rust
- Tauri prerequisites for Windows

Run locally:

```bash
npm install
npm run tauri dev
```

Build:

```bash
npm run tauri build
```

Build output:

```text
src-tauri/target/release
src-tauri/target/release/bundle
```

## Voice and AI

- Wake phrase support follows the selected voice language.
- Voice tracking currently supports English, Turkish, Arabic, German, French, and Spanish.
- English is bundled; the other Vosk models are downloaded on demand from Settings.
- Groq features are optional and require a user-provided API key.

## Remote Messaging

Flow includes a remote sender and inbox flow for pushing text into a running teleprompter session. Remote infrastructure is still evolving, so very heavy usage may hit temporary service limits.

## Privacy

- Most data is stored locally on the device.
- Voice tracking is designed to run locally with Vosk models.
- Groq requests are only sent when AI features are used.
- See [privacy-policy.md](privacy-policy.md) for the current privacy policy.

## License

This project is licensed under GPL-3.0-or-later. See [LICENSE](LICENSE).
## Türkçe

### Genel Bakış

Flow, canlı okuma için tasarlanmış, hızlı ve sade bir masaüstü teleprompter uygulamasıdır. Ses takibi, uygulama genelinde sesli komutlar, metin düzenleme, uzaktan metin gönderimi ve isteğe bağlı yapay zekâ destekli yazım araçlarını temiz bir arayüzde birleştirir.

### 1.4.0 Sürümündeki Yenilikler

- Groq ile yazım ve yeniden yazım için gelişmiş özelleştirme seçenekleri eklendi.
- Fransızca uygulama dili ve ayarlarda daha geniş çeviri desteği eklendi.
- Oynatma sırasında görünen sol hız rayı ve ayarlardan açma kapama desteği eklendi.
- Tauri pencere boyutlandırması ve teleprompter yerleşimi iyileştirildi.
- Ses takibi ayarları, model durumu ve dil etiketleri iyileştirildi.
- Minimum metin boyutu yüzde 60'tan yüzde 30'a düşürüldü.

### Öne Çıkanlar

- Vurgu, kaydırma, satır, ok ve ses takibi modları.
- Yerel olarak saklanan metin ve ayarlar.
- Yerelleştirilmiş uyandırma ifadeleri ve komutlarla uygulama genelinde ses kontrolü.
- İngilizce gömülü, Türkçe, Arapça, Almanca, Fransızca ve İspanyolca için indirilebilir Vosk modelleri.
- Biçimlendirme, kelime sayısı ve okuma süresi araçları içeren metin düzenleyici.
- Metni eklemeden önce inceleme sunan uzaktan mesaj alma akışı.
- İsteğe bağlı Groq destekli üretim ve yeniden yazım.
- Her zaman üstte çalışan Windows katmanı, tıklama geçişi ve yakalama koruması seçenekleri.

### Kurulum

En güncel Windows sürümünü GitHub Releases sayfasından indirin.

### Geliştirme

Gereksinimler:
- Node.js
- Rust
- Windows için Tauri önkoşulları

Çalıştırma:

```bash
npm install
npm run tauri dev
```

Derleme:

```bash
npm run tauri build
```

### Ses ve Yapay Zekâ

- Uyandırma ifadesi seçili ses diline göre çalışır.
- Ses takibi İngilizce, Türkçe, Arapça, Almanca, Fransızca ve İspanyolca destekler.
- İngilizce model gömülüdür; diğer Vosk modelleri Ayarlar ekranından indirilebilir.
- Groq özellikleri isteğe bağlıdır ve kullanıcı tarafından sağlanan API anahtarı gerektirir.

### Uzaktan Mesajlaşma

Flow, çalışan teleprompter oturumuna uzaktan metin göndermek için gönderici ve gelen kutusu akışı içerir. Altyapı hâlâ geliştirildiği için çok yoğun kullanım geçici sınırlara yol açabilir.

### Gizlilik

- Verilerin çoğu cihazda yerel olarak saklanır.
- Ses takibi Vosk modelleriyle yerel çalışacak şekilde tasarlanmıştır.
- Groq istekleri yalnızca AI özellikleri kullanıldığında gönderilir.
- Ayrıntılar için [privacy-policy.md](privacy-policy.md) dosyasına bakın.

## العربية

### نظرة عامة

Flow هو تطبيق تلقين مكتبي سريع ومبسّط مخصص للقراءة المباشرة. يجمع بين تتبع الصوت، والأوامر الصوتية على مستوى التطبيق، وتحرير النصوص، وإرسال النصوص عن بُعد، وأدوات الكتابة المدعومة بالذكاء الاصطناعي ضمن واجهة نظيفة.

### الجديد في 1.4.0

- تمت إضافة خيارات تخصيص موسعة لـ Groq للكتابة وإعادة الصياغة.
- تمت إضافة اللغة الفرنسية للتطبيق وتحسين الترجمة في شاشة الإعدادات.
- تمت إضافة شريط سرعة جانبي يظهر أثناء التشغيل مع خيار تفعيله أو تعطيله من الإعدادات.
- تم تحسين حجم نافذة Tauri واستقرار تخطيط التلقين.
- تم تحسين إعدادات تتبع الصوت وحالة النماذج وتسميات اللغات.
- تم خفض الحد الأدنى لحجم النص من 60 بالمئة إلى 30 بالمئة.

### أبرز الميزات

- أوضاع التمييز والتمرير والسطر والسهم وتتبع الصوت.
- تخزين النصوص والإعدادات محلياً.
- تحكم صوتي على مستوى التطبيق مع عبارات تنبيه وأوامر مترجمة.
- نماذج Vosk مع الإنجليزية المضمنة ودعم قابل للتنزيل للتركية والعربية والألمانية والفرنسية والإسبانية.
- محرر نصوص مع أدوات التنسيق وعدّ الكلمات ووقت القراءة المتوقع.
- نظام رسائل عن بُعد مع مراجعة النص قبل إدخاله.
- كتابة وإعادة صياغة اختيارية عبر Groq.
- طبقة Windows دائمة الظهور مع دعم النقر العابر وحماية الالتقاط.

### التثبيت

قم بتنزيل أحدث إصدار لويندوز من صفحة GitHub Releases.

### التطوير

المتطلبات:
- Node.js
- Rust
- متطلبات Tauri على Windows

التشغيل:

```bash
npm install
npm run tauri dev
```

البناء:

```bash
npm run tauri build
```

### الصوت والذكاء الاصطناعي

- تعمل عبارة التنبيه حسب لغة الصوت المحددة.
- يدعم تتبع الصوت الإنجليزية والتركية والعربية والألمانية والفرنسية والإسبانية.
- اللغة الإنجليزية مدمجة؛ ويمكن تنزيل بقية نماذج Vosk من الإعدادات.
- ميزات Groq اختيارية وتتطلب مفتاح API يقدمه المستخدم.

### الرسائل عن بُعد

يتضمن Flow مسار إرسال وصندوق وارد لإرسال النصوص إلى جلسة تلقين تعمل حالياً. ما زالت البنية التحتية تتطور، لذلك قد يؤدي الاستخدام المكثف إلى حدود مؤقتة.

### الخصوصية

- يتم تخزين معظم البيانات محلياً على الجهاز.
- تم تصميم تتبع الصوت ليعمل محلياً باستخدام نماذج Vosk.
- لا يتم إرسال طلبات Groq إلا عند استخدام ميزات الذكاء الاصطناعي.
- راجع [privacy-policy.md](privacy-policy.md) لمزيد من التفاصيل.

## Français

### Vue d'ensemble

Flow est un teleprompter de bureau rapide et epure concu pour la lecture en direct. Il combine le suivi vocal, les commandes vocales globales, l'edition de texte, l'envoi de texte a distance et des outils d'ecriture IA optionnels dans une interface propre.

### Nouveautes de la version 1.4.0

- Ajout d'options avancees de personnalisation Groq pour l'ecriture et la reecriture.
- Ajout du francais comme langue de l'application et amelioration des traductions dans les parametres.
- Ajout d'un rail lateral de vitesse visible pendant la lecture avec option d'activation dans les parametres.
- Amelioration du dimensionnement de la fenetre Tauri et de la stabilite de la mise en page du teleprompter.
- Amelioration des reglages de suivi vocal, de l'etat des modeles et des libelles de langue.
- Reduction de la taille minimale du texte de 60 pour cent a 30 pour cent.

### Points forts

- Modes surlignage, defilement, ligne, fleches et suivi vocal.
- Stockage local du texte et des parametres.
- Commandes vocales globales avec expressions de reveil et commandes localisees.
- Modeles Vosk avec anglais integre et prise en charge telechargeable du turc, de l'arabe, de l'allemand, du francais et de l'espagnol.
- Editeur de texte avec mise en forme, compteur de mots et estimation du temps de lecture.
- Flux de messagerie distante avec verification avant insertion du texte.
- Generation et reecriture facultatives avec Groq.
- Fenetre Windows toujours au premier plan avec options click-through et protection de capture.

### Installation

Telechargez la derniere version Windows depuis la page GitHub Releases.

### Developpement

Prerequis:
- Node.js
- Rust
- Prerequis Tauri pour Windows

Execution:

```bash
npm install
npm run tauri dev
```

Build:

```bash
npm run tauri build
```

### Voix et IA

- L'expression de reveil suit la langue vocale selectionnee.
- Le suivi vocal prend en charge l'anglais, le turc, l'arabe, l'allemand, le francais et l'espagnol.
- L'anglais est integre; les autres modeles Vosk peuvent etre telecharges depuis les parametres.
- Les fonctions Groq sont optionnelles et necessitent une cle API fournie par l'utilisateur.

### Messagerie distante

Flow inclut un emetteur distant et une boite de reception pour envoyer du texte vers une session de teleprompter active. L'infrastructure evolue encore, donc un usage intensif peut provoquer des limites temporaires.

### Confidentialite

- La plupart des donnees sont stockees localement sur l'appareil.
- Le suivi vocal est concu pour fonctionner localement avec les modeles Vosk.
- Les requetes Groq ne sont envoyees que lorsque les fonctions IA sont utilisees.
- Consultez [privacy-policy.md](privacy-policy.md) pour plus de details.

## Deutsch

### Ueberblick

Flow ist ein schnelles und reduziertes Desktop-Teleprompter-Tool fuer Live-Lesen. Es kombiniert Sprachverfolgung, app-weite Sprachbefehle, Textbearbeitung, Remote-Textuebertragung und optionale KI-Schreibwerkzeuge in einer sauberen Oberflaeche.

### Neu in 1.4.0

- Erweiterte Groq-Anpassungen fuer Schreiben und Umschreiben hinzugefuegt.
- Franzoesisch als App-Sprache hinzugefuegt und Uebersetzungen in den Einstellungen erweitert.
- Linke Geschwindigkeitsleiste hinzugefuegt, die waehrend der Wiedergabe erscheint und in den Einstellungen umschaltbar ist.
- Tauri-Fenstergroesse und Stabilitaet des Teleprompter-Layouts verbessert.
- Sprachverfolgungs-Einstellungen, Modellstatus und Sprachbezeichnungen verbessert.
- Minimale Textgroesse von 60 Prozent auf 30 Prozent reduziert.

### Highlights

- Hervorheben, Scrollen, Zeilen-, Pfeil- und Sprachverfolgungsmodus.
- Lokale Speicherung von Text und Einstellungen.
- App-weite Sprachsteuerung mit lokalisierten Aktivierungsphrasen und Befehlen.
- Vosk-Modelle mit integriertem Englisch und herunterladbarer Unterstuetzung fuer Tuerkisch, Arabisch, Deutsch, Franzoesisch und Spanisch.
- Texteditor mit Formatierung, Wortzaehler und Lesedauer-Schaetzung.
- Remote-Messaging mit Pruefung vor dem Einfuegen des Textes.
- Optionale Groq-Generierung und -Umschreibung.
- Immer-im-Vordergrund-Windows-Overlay mit Click-through und Aufnahmeschutz.

### Installation

Laden Sie die neueste Windows-Version von der GitHub-Releases-Seite herunter.

### Entwicklung

Voraussetzungen:
- Node.js
- Rust
- Tauri-Voraussetzungen fuer Windows

Starten:

```bash
npm install
npm run tauri dev
```

Build:

```bash
npm run tauri build
```

### Sprache und KI

- Die Aktivierungsphrase folgt der ausgewaehlten Sprachsprache.
- Sprachverfolgung unterstuetzt Englisch, Tuerkisch, Arabisch, Deutsch, Franzoesisch und Spanisch.
- Englisch ist integriert; die anderen Vosk-Modelle koennen in den Einstellungen heruntergeladen werden.
- Groq-Funktionen sind optional und benoetigen einen vom Nutzer bereitgestellten API-Schluessel.

### Remote Messaging

Flow enthaelt einen Remote-Sender und einen Posteingang, um Text an eine laufende Teleprompter-Sitzung zu senden. Die Infrastruktur entwickelt sich noch weiter, daher kann starke Nutzung zu temporaeren Begrenzungen fuehren.

### Datenschutz

- Die meisten Daten werden lokal auf dem Geraet gespeichert.
- Die Sprachverfolgung ist fuer lokale Ausfuehrung mit Vosk-Modellen ausgelegt.
- Groq-Anfragen werden nur gesendet, wenn KI-Funktionen genutzt werden.
- Weitere Details stehen in [privacy-policy.md](privacy-policy.md).

## Espanol

### Resumen

Flow es un teleprompter de escritorio rapido y limpio pensado para lectura en vivo. Combina seguimiento por voz, comandos de voz en toda la aplicacion, edicion de texto, envio remoto de texto y herramientas opcionales de escritura con IA en una interfaz sencilla.

### Novedades en 1.4.0

- Se agregaron opciones avanzadas de personalizacion de Groq para escribir y reescribir.
- Se agrego frances como idioma de la aplicacion y se mejoraron las traducciones en configuracion.
- Se agrego una barra lateral de velocidad visible durante la reproduccion con opcion para activarla o desactivarla.
- Se mejoro el tamano de la ventana Tauri y la estabilidad del diseno del teleprompter.
- Se mejoraron la configuracion de seguimiento por voz, el estado de los modelos y las etiquetas de idioma.
- El tamano minimo del texto bajo de 60 por ciento a 30 por ciento.

### Puntos destacados

- Modos de resaltado, desplazamiento, linea, flechas y seguimiento por voz.
- Almacenamiento local de texto y configuracion.
- Control por voz en toda la aplicacion con frases de activacion y comandos localizados.
- Modelos Vosk con ingles integrado y soporte descargable para turco, arabe, aleman, frances y espanol.
- Editor de texto con formato, conteo de palabras y estimacion de tiempo de lectura.
- Flujo de mensajeria remota con revision antes de insertar el texto.
- Generacion y reescritura opcionales con Groq.
- Superposicion de Windows siempre visible con opciones de click-through y proteccion de captura.

### Instalacion

Descarga la version mas reciente de Windows desde la pagina de GitHub Releases.

### Desarrollo

Requisitos:
- Node.js
- Rust
- Requisitos previos de Tauri para Windows

Ejecucion:

```bash
npm install
npm run tauri dev
```

Compilacion:

```bash
npm run tauri build
```

### Voz e IA

- La frase de activacion sigue el idioma de voz seleccionado.
- El seguimiento por voz admite ingles, turco, arabe, aleman, frances y espanol.
- Ingles viene integrado; los demas modelos Vosk se pueden descargar desde Configuracion.
- Las funciones de Groq son opcionales y requieren una clave API proporcionada por el usuario.

### Mensajeria remota

Flow incluye un emisor remoto y una bandeja de entrada para enviar texto a una sesion de teleprompter en ejecucion. La infraestructura aun sigue evolucionando, por lo que un uso intensivo puede generar limites temporales.

### Privacidad

- La mayor parte de los datos se guarda localmente en el dispositivo.
- El seguimiento por voz esta pensado para funcionar localmente con modelos Vosk.
- Las solicitudes a Groq solo se envian cuando se usan las funciones de IA.
- Consulta [privacy-policy.md](privacy-policy.md) para mas detalles.


## Star History

<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
