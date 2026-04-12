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
  <strong>v1.5.0</strong> · Tauri v2 · Rust Core · Vanilla JS UI · Windows-first
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.5.0-2563eb?style=for-the-badge" />
  <img alt="Platform" src="https://img.shields.io/badge/platform-Windows-0f172a?style=for-the-badge&logo=windows" />
  <img alt="Tauri v2" src="https://img.shields.io/badge/Tauri-v2-24c8db?style=for-the-badge&logo=tauri" />
  <img alt="Rust" src="https://img.shields.io/badge/Rust-Core-b7410e?style=for-the-badge&logo=rust" />
  <img alt="JavaScript" src="https://img.shields.io/badge/Frontend-Vanilla%20JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=111827" />
</p>

<p align="center">
  <img alt="Voice Commands" src="https://img.shields.io/badge/Voice-Hey%20Flow-7c3aed?style=for-the-badge" />
  <img alt="Voice Tracking" src="https://img.shields.io/badge/Voice%20Tracking-6%20Languages-16a34a?style=for-the-badge" />
  <img alt="AI Drafting" src="https://img.shields.io/badge/AI-Groq-0ea5e9?style=for-the-badge" />
</p>

## Overview

Flow is a desktop teleprompter focused on live readability and operational speed. It keeps the reading surface clean while still covering voice tracking, app-wide voice commands, script editing, remote text delivery, and optional AI-assisted drafting.

## What's New in 1.5.0

- Integrated the official Tauri updater with GitHub release-feed support and signed Windows installer artifacts.
- Added an Updates section in Settings so published releases can be checked and installed from inside the app.
- Added automatic background update checks in the main window for supported builds.
- Enabled signed release-feed checks that can install whichever version is published, including downgrade paths when needed.
- Expanded translation coverage for the updater, sound input, and new settings states across the supported languages.

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
- Dedicated sound input tuning with device selection, live monitoring, noise gate, and gain controls.
- App-wide voice control with localized wake greetings and more resilient recognition handling.
- Vosk speech models with bundled English and downloadable Turkish, Arabic, German, French, and Spanish support.
- Built-in script editor with formatting, word count, and reading-time helpers.
- Remote messaging flow with inbox review, quick-connect QR links, and sender-side reply status updates.
- Optional Groq-powered generation and rewriting.
- Always-on-top Windows overlay with click-through and capture-protection options.
- Official Tauri updater with in-app checks, install controls, and signed Windows release-feed support.

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

### Signed updater release

To produce a Windows release that is ready for GitHub Releases and Flow's in-app updater, load the updater signing key into the environment before building:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw "$HOME\.tauri\flow-updater.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<your-updater-key-password>"
npm run tauri build
```

Publish these files from `src-tauri/target/release/bundle` to the GitHub release:

- `msi/flow_1.5.0_x64_en-US.msi`
- `latest.json`

The `.sig` file is generated alongside the MSI for reference, while `latest.json` is the updater feed consumed by the app.

## Voice and AI

- Voice command wake phrase is fixed to English: `Hey Flow`.
- Voice tracking currently supports English, Turkish, Arabic, German, French, and Spanish.
- Settings now include microphone selection, live level preview, noise gate, and gain tuning for voice features.
- English is bundled; the other Vosk models are downloaded on demand from Settings.
- Groq features are optional and require a user-provided API key.

## Remote Messaging

Flow includes a remote sender and inbox flow for pushing text into a running teleprompter session. Cloud sessions can expose quick-connect links and QR codes with the receiver UUID and access password prefilled, and senders can monitor queued messages as they move to accepted or denied. Remote infrastructure is still evolving, so very heavy usage may hit temporary service limits.

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

### 1.5.0 Sürümündeki Yenilikler

- Resmi Tauri güncelleyicisi; GitHub release akışı ve imzalı Windows paketleri desteğiyle entegre edildi.
- Ayarlar ekranına, yayınlanan sürümleri uygulama içinden denetleyip kurabilen Güncellemeler bölümü eklendi.
- Uyumlu sürümlerde ana pencerede otomatik arka plan güncelleme denetimleri eklendi.
- İmzalı yayın akışında bulunan sürümü kurabilen ve gerektiğinde düşürmeyi de destekleyen güncelleme denetimleri etkinleştirildi.
- Güncelleyici, ses girişi ve yeni ayar durumları için çeviriler genişletildi.

### Öne Çıkanlar

- Vurgu, kaydırma, satır, ok ve ses takibi modları.
- Yerel olarak saklanan metin ve ayarlar.
- Aygıt seçimi, canlı izleme, gürültü kapısı ve kazanç kontrolleri içeren ses girişi ayarları.
- Yerelleştirilmiş uyandırma ifadeleri ve daha dayanıklı algılama yapısıyla uygulama genelinde ses kontrolü.
- İngilizce gömülü, Türkçe, Arapça, Almanca, Fransızca ve İspanyolca için indirilebilir Vosk modelleri.
- Biçimlendirme, kelime sayısı ve okuma süresi araçları içeren metin düzenleyici.
- Metni eklemeden önce inceleme, hızlı bağlantı QR ve gönderici yanıt durumu sunan uzaktan mesaj akışı.
- İsteğe bağlı Groq destekli üretim ve yeniden yazım.
- Her zaman üstte çalışan Windows katmanı, tıklama geçişi ve yakalama koruması seçenekleri.
- Resmi Tauri güncelleyicisi, uygulama içi denetim ve kurulum ile imzalı release akışı desteği.

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

- Sesli komutlar için uyandırma ifadesi sabittir: `Hey Flow`.
- Ses takibi İngilizce, Türkçe, Arapça, Almanca, Fransızca ve İspanyolca destekler.
- Ayarlar ekranında mikrofon seçimi, canlı seviye önizlemesi, gürültü kapısı ve giriş kazancı araçları bulunur.
- İngilizce model gömülüdür; diğer Vosk modelleri Ayarlar ekranından indirilebilir.
- Groq özellikleri isteğe bağlıdır ve kullanıcı tarafından sağlanan API anahtarı gerektirir.

### Uzaktan Mesajlaşma

Flow, çalışan teleprompter oturumuna uzaktan metin göndermek için gönderici ve gelen kutusu akışı içerir. Bulut oturumları, alıcı UUID'si ve erişim parolası doldurulmuş hızlı bağlantı bağlantıları ve QR kodları üretebilir; göndericiler de kuyruktaki mesajların kabul veya ret durumuna geçtiğini izleyebilir. Altyapı hâlâ geliştirildiği için çok yoğun kullanım geçici sınırlara yol açabilir.

### Gizlilik

- Verilerin çoğu cihazda yerel olarak saklanır.
- Ses takibi Vosk modelleriyle yerel çalışacak şekilde tasarlanmıştır.
- Groq istekleri yalnızca AI özellikleri kullanıldığında gönderilir.
- Ayrıntılar için [privacy-policy.md](privacy-policy.md) dosyasına bakın.

## العربية

### نظرة عامة

Flow هو تطبيق تلقين مكتبي سريع ومبسّط مخصص للقراءة المباشرة. يجمع بين تتبع الصوت، والأوامر الصوتية على مستوى التطبيق، وتحرير النصوص، وإرسال النصوص عن بُعد، وأدوات الكتابة المدعومة بالذكاء الاصطناعي ضمن واجهة نظيفة.

### الجديد في 1.5.0

- تم دمج المُحدِّث الرسمي لـ Tauri مع دعم موجز GitHub Releases وحزم Windows الموقعة.
- تمت إضافة قسم التحديثات داخل الإعدادات مع إمكانية التحقق والتثبيت من داخل التطبيق.
- تمت إضافة فحوصات تحديث تلقائية في الخلفية داخل النافذة الرئيسية للإصدارات المتوافقة.
- تم تفعيل فحوصات موجز الإصدار الموقّع بحيث يمكن تثبيت أي إصدار منشور، بما في ذلك الرجوع إلى إصدار أقدم عند الحاجة.
- تم توسيع الترجمة لتشمل المُحدِّث وإدخال الصوت وحالات الإعدادات الجديدة.

### أبرز الميزات

- أوضاع التمييز والتمرير والسطر والسهم وتتبع الصوت.
- تخزين النصوص والإعدادات محلياً.
- إعدادات لإدخال الصوت تشمل اختيار الجهاز، والمراقبة الحية، وبوابة الضوضاء، والتحكم في الكسب.
- تحكم صوتي على مستوى التطبيق مع عبارات تنبيه مترجمة ومعالجة أكثر ثباتًا للتعرّف.
- نماذج Vosk مع الإنجليزية المضمنة ودعم قابل للتنزيل للتركية والعربية والألمانية والفرنسية والإسبانية.
- محرر نصوص مع أدوات التنسيق وعدّ الكلمات ووقت القراءة المتوقع.
- نظام رسائل عن بُعد مع مراجعة النص، وروابط QR سريعة، وتحديثات لحالة رد المُرسل.
- كتابة وإعادة صياغة اختيارية عبر Groq.
- طبقة Windows دائمة الظهور مع دعم النقر العابر وحماية الالتقاط.
- مُحدِّث Tauri رسمي مع فحص وتثبيت من داخل التطبيق ودعم للإصدارات الموقعة.

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

- عبارة التنبيه للأوامر الصوتية ثابتة بالإنجليزية: `Hey Flow`.
- يدعم تتبع الصوت الإنجليزية والتركية والعربية والألمانية والفرنسية والإسبانية.
- تتضمن الإعدادات الآن اختيار الميكروفون، ومعاينة المستوى مباشرة، وبوابة الضوضاء، وضبط كسب الإدخال.
- اللغة الإنجليزية مدمجة؛ ويمكن تنزيل بقية نماذج Vosk من الإعدادات.
- ميزات Groq اختيارية وتتطلب مفتاح API يقدمه المستخدم.

### الرسائل عن بُعد

يتضمن Flow مسار إرسال وصندوق وارد لإرسال النصوص إلى جلسة تلقين تعمل حالياً. يمكن للجلسات السحابية توفير روابط سريعة ورموز QR مع تعبئة UUID وكلمة مرور الوصول مسبقًا، كما يمكن للمُرسل متابعة الرسائل المعلقة عندما تنتقل إلى حالة قبول أو رفض. ما زالت البنية التحتية تتطور، لذلك قد يؤدي الاستخدام المكثف إلى حدود مؤقتة.

### الخصوصية

- يتم تخزين معظم البيانات محلياً على الجهاز.
- تم تصميم تتبع الصوت ليعمل محلياً باستخدام نماذج Vosk.
- لا يتم إرسال طلبات Groq إلا عند استخدام ميزات الذكاء الاصطناعي.
- راجع [privacy-policy.md](privacy-policy.md) لمزيد من التفاصيل.

## Français

### Vue d'ensemble

Flow est un teleprompter de bureau rapide et epure concu pour la lecture en direct. Il combine le suivi vocal, les commandes vocales globales, l'edition de texte, l'envoi de texte a distance et des outils d'ecriture IA optionnels dans une interface propre.

### Nouveautes de la version 1.5.0

- Integration du programme officiel de mise a jour Tauri avec prise en charge du flux GitHub Releases et des artefacts Windows signes.
- Ajout d'une section Mises a jour dans les parametres avec verification et installation depuis l'application.
- Ajout de verifications automatiques en arriere-plan dans la fenetre principale pour les builds compatibles.
- Activation des verifications du flux de release signe permettant d'installer la version publiee, y compris un retour en arriere si necessaire.
- Traductions etendues pour la mise a jour, l'entree audio et les nouveaux etats des parametres.

### Points forts

- Modes surlignage, defilement, ligne, fleches et suivi vocal.
- Stockage local du texte et des parametres.
- Reglages d'entree audio avec selection du peripherique, monitoring en direct, noise gate et controle du gain.
- Commandes vocales globales avec expressions de reveil localisees et reconnaissance plus robuste.
- Modeles Vosk avec anglais integre et prise en charge telechargeable du turc, de l'arabe, de l'allemand, du francais et de l'espagnol.
- Editeur de texte avec mise en forme, compteur de mots et estimation du temps de lecture.
- Flux de messagerie distante avec verification, QR de connexion rapide et statut des reponses cote emetteur.
- Generation et reecriture facultatives avec Groq.
- Fenetre Windows toujours au premier plan avec options click-through et protection de capture.
- Programme officiel de mise a jour Tauri avec verification integree, installation depuis l'application et prise en charge des releases signees.

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

- L'expression de reveil des commandes vocales est fixe en anglais : `Hey Flow`.
- Le suivi vocal prend en charge l'anglais, le turc, l'arabe, l'allemand, le francais et l'espagnol.
- Les parametres incluent maintenant la selection du microphone, un apercu du niveau en direct, un noise gate et le reglage du gain.
- L'anglais est integre; les autres modeles Vosk peuvent etre telecharges depuis les parametres.
- Les fonctions Groq sont optionnelles et necessitent une cle API fournie par l'utilisateur.

### Messagerie distante

Flow inclut un emetteur distant et une boite de reception pour envoyer du texte vers une session de teleprompter active. Les sessions cloud peuvent fournir des liens rapides et des QR codes avec l'UUID du recepteur et le mot de passe deja remplis, et les emetteurs peuvent suivre les messages en attente jusqu'a leur acceptation ou leur refus. L'infrastructure evolue encore, donc un usage intensif peut provoquer des limites temporaires.

### Confidentialite

- La plupart des donnees sont stockees localement sur l'appareil.
- Le suivi vocal est concu pour fonctionner localement avec les modeles Vosk.
- Les requetes Groq ne sont envoyees que lorsque les fonctions IA sont utilisees.
- Consultez [privacy-policy.md](privacy-policy.md) pour plus de details.

## Deutsch

### Ueberblick

Flow ist ein schnelles und reduziertes Desktop-Teleprompter-Tool fuer Live-Lesen. Es kombiniert Sprachverfolgung, app-weite Sprachbefehle, Textbearbeitung, Remote-Textuebertragung und optionale KI-Schreibwerkzeuge in einer sauberen Oberflaeche.

### Neu in 1.5.0

- Offiziellen Tauri-Updater mit GitHub-Release-Feed und signierten Windows-Artefakten integriert.
- Updates-Bereich in den Einstellungen mit Pruefen und Installieren direkt in der App hinzugefuegt.
- Automatische Hintergrundpruefungen im Hauptfenster fuer kompatible Builds hinzugefuegt.
- Signierte Release-Feed-Pruefungen aktiviert, die die veroeffentlichte Version installieren und bei Bedarf auch Downgrades erlauben.
- Uebersetzungen fuer Updater, Audioeingabe und neue Einstellungszustaende erweitert.

### Highlights

- Hervorheben, Scrollen, Zeilen-, Pfeil- und Sprachverfolgungsmodus.
- Lokale Speicherung von Text und Einstellungen.
- Audioeingabe-Einstellungen mit Geraetewahl, Live-Monitoring, Noise Gate und Gain-Reglern.
- App-weite Sprachsteuerung mit lokalisierten Aktivierungsphrasen und robusterer Erkennung.
- Vosk-Modelle mit integriertem Englisch und herunterladbarer Unterstuetzung fuer Tuerkisch, Arabisch, Deutsch, Franzoesisch und Spanisch.
- Texteditor mit Formatierung, Wortzaehler und Lesedauer-Schaetzung.
- Remote-Messaging mit Pruefung, Schnellverbindungs-QR und Antwortstatus auf Senderseite.
- Optionale Groq-Generierung und -Umschreibung.
- Immer-im-Vordergrund-Windows-Overlay mit Click-through und Aufnahmeschutz.
- Offizieller Tauri-Updater mit integrierter Pruefung, Installation in der App und Unterstuetzung fuer signierte Releases.

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

- Die Aktivierungsphrase fuer Sprachbefehle ist fest auf Englisch: `Hey Flow`.
- Sprachverfolgung unterstuetzt Englisch, Tuerkisch, Arabisch, Deutsch, Franzoesisch und Spanisch.
- Die Einstellungen enthalten jetzt Mikrofonwahl, Live-Pegelvorschau, Noise Gate und Eingangsverstaerkung fuer Sprachfunktionen.
- Englisch ist integriert; die anderen Vosk-Modelle koennen in den Einstellungen heruntergeladen werden.
- Groq-Funktionen sind optional und benoetigen einen vom Nutzer bereitgestellten API-Schluessel.

### Remote Messaging

Flow enthaelt einen Remote-Sender und einen Posteingang, um Text an eine laufende Teleprompter-Sitzung zu senden. Cloud-Sitzungen koennen Schnellverbindungs-Links und QR-Codes mit vorausgefuellter UUID und Zugriffspasswort bereitstellen, und Sender koennen wartende Nachrichten bis zur Annahme oder Ablehnung verfolgen. Die Infrastruktur entwickelt sich noch weiter, daher kann starke Nutzung zu temporaeren Begrenzungen fuehren.

### Datenschutz

- Die meisten Daten werden lokal auf dem Geraet gespeichert.
- Die Sprachverfolgung ist fuer lokale Ausfuehrung mit Vosk-Modellen ausgelegt.
- Groq-Anfragen werden nur gesendet, wenn KI-Funktionen genutzt werden.
- Weitere Details stehen in [privacy-policy.md](privacy-policy.md).

## Espanol

### Resumen

Flow es un teleprompter de escritorio rapido y limpio pensado para lectura en vivo. Combina seguimiento por voz, comandos de voz en toda la aplicacion, edicion de texto, envio remoto de texto y herramientas opcionales de escritura con IA en una interfaz sencilla.

### Novedades en 1.5.0

- Se integro el actualizador oficial de Tauri con soporte para GitHub Releases y artefactos firmados de Windows.
- Se agrego una seccion de Actualizaciones en Configuracion con comprobacion e instalacion dentro de la app.
- Se agregaron comprobaciones automaticas en segundo plano en la ventana principal para compilaciones compatibles.
- Se habilitaron comprobaciones del feed firmado para instalar la version publicada, incluidos descensos de version cuando haga falta.
- Se amplio la traduccion para el actualizador, la entrada de audio y los nuevos estados de configuracion.

### Puntos destacados

- Modos de resaltado, desplazamiento, linea, flechas y seguimiento por voz.
- Almacenamiento local de texto y configuracion.
- Ajustes de entrada de audio con seleccion de dispositivo, monitoreo en vivo, puerta de ruido y controles de ganancia.
- Control por voz en toda la aplicacion con frases de activacion localizadas y reconocimiento mas resistente.
- Modelos Vosk con ingles integrado y soporte descargable para turco, arabe, aleman, frances y espanol.
- Editor de texto con formato, conteo de palabras y estimacion de tiempo de lectura.
- Flujo de mensajeria remota con revision, QR de conexion rapida y actualizaciones de estado de respuesta para el emisor.
- Generacion y reescritura opcionales con Groq.
- Superposicion de Windows siempre visible con opciones de click-through y proteccion de captura.
- Actualizador oficial de Tauri con comprobacion integrada, instalacion dentro de la app y soporte para releases firmadas.

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

- La frase de activacion para los comandos de voz esta fija en ingles: `Hey Flow`.
- El seguimiento por voz admite ingles, turco, arabe, aleman, frances y espanol.
- Configuracion ahora incluye seleccion de microfono, vista previa de nivel en vivo, puerta de ruido y ajuste de ganancia para las funciones de voz.
- Ingles viene integrado; los demas modelos Vosk se pueden descargar desde Configuracion.
- Las funciones de Groq son opcionales y requieren una clave API proporcionada por el usuario.

### Mensajeria remota

Flow incluye un emisor remoto y una bandeja de entrada para enviar texto a una sesion de teleprompter en ejecucion. Las sesiones en la nube pueden ofrecer enlaces rapidos y codigos QR con el UUID del receptor y la contrasena de acceso ya completados, y los emisores pueden seguir los mensajes en cola hasta que sean aceptados o rechazados. La infraestructura aun sigue evolucionando, por lo que un uso intensivo puede generar limites temporales.

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
