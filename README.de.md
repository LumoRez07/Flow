<!--
  Flow - A high-performance teleprompter for Windows.
  Copyright (C) 2026 Waled Alturkmani (LumoRez07)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
-->

<div align="center">

<p align="center">
  <img src="src/assets/flow-logo.png" width="128" height="128" alt="Flow logo" />
</p>

<h1 align="center">Flow Teleprompter</h1>

[English](/README.md) / [Español](/README.es.md) / [Türkçe](/README.tr.md) / [العربية](/README.ar.md) / Deutsch / [Français](/README.fr.md)

<a href="https://github.com/LumoRez07/flow/releases" target="_blank">
  <img src="https://img.shields.io/github/downloads/LumoRez07/flow/total?style=flat-square&color=blue" alt="Downloads" height="20"/>
</a>
<a href="https://sourceforge.net/projects/flowteleprompter/files/latest/download">
  <img alt="Download Flow Teleprompter" src="https://img.shields.io/sourceforge/dm/flowteleprompter.svg" />
</a>

Ultraleichter, hardwarebeschleunigter Teleprompter, entwickelt mit Rust & Tauri.

![Windows][Windows-image]
![Tauri][Tauri-image]
![Rust][Rust-image]
<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.9.0-2563eb?style=for-the-badge" />
  <img alt="JavaScript" src="https://img.shields.io/badge/Frontend-Vanilla%20JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=111827" />
</p>
<p align="center">
Bitte gib diesem Repo einen Stern, wenn es dir hilft! ⭐
</p>

<p align="center">
  <a href="https://www.ghacks.net/de/2026/05/28/flow-teleprompter-windows-voice-tracking/" target="_blank">
    <img src="assets/featured%20on%20ghacks.svg" alt="Featured on Ghacks" width="480" />
  </a>
</p>

## Flow ist verfügbar auf
<div align="center">
  <a href="https://sourceforge.net/p/flowteleprompter/">
    <img alt="Download Flow Teleprompter" src="https://sourceforge.net/sflogo.php?type=17&amp;group_id=4087698" width="200">
  </a>
  <a href="https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct">
    <img alt="Get it from Microsoft" src="https://get.microsoft.com/images/en-us%20dark.svg" width="200"/>
  </a>
  <br>
</div>



[Windows-image]: https://img.shields.io/badge/-Windows-0078D6?logo=windows&style=flat-square
[Tauri-image]: https://img.shields.io/badge/-Tauri-FFC131?logo=tauri&style=flat-square&logoColor=black
[Rust-image]: https://img.shields.io/badge/-Rust-000000?logo=rust&style=flat-square
</div>


> [!CAUTION]
> Wenn du auf Skalierungsprobleme stößt, lade dir bitte die neueste Version (1.9.0) herunter.
> Wenn Flow im Voice-Tracking-Modus nicht zu scrollen beginnt, überprüfe bitte die Mikrofon-Berechtigungseinstellungen für die App und stelle sicher, dass in den Einstellungen das richtige Eingabegerät ausgewählt ist.


> [!IMPORTANT]
> Hinweis zum Vertrieb: Die Microsoft Store-Edition soll zu einer Pro-Version werden. Ihr Preis wird voraussichtlich auf 5-10 USD steigen (noch nicht entschieden), um die Servermiete zu kompensieren, und gehostete Dienste werden aktiviert, sobald die Pro-Veröffentlichung die erforderliche Nutzergrenze erreicht. Die GitHub-Version bleibt der kostenlose Open-Source-Build und wird weiterhin wichtige Funktionen und Updates erhalten.



## Highlights

- Fünf Wiedergabestile: Hervorheben, Scrollen, Linie, Pfeil und Sprachverfolgung.
- Lokale Skriptspeicherung und Beibehaltung der Einstellungen.
- Dedizierte Ton-Eingangsabstimmung mit Geräteauswahl, Live-Überwachung, Noise Gate und Verstärkungsreglern.
- App-weite Sprachsteuerung mit lokalisierten Begrüßungen zum Aufwecken und robusterer Erkennungsverarbeitung.
- Vosk-Sprachmodelle mit integriertem Englisch und herunterladbarer Unterstützung für Türkisch, Arabisch, Deutsch, Französisch und Spanisch.
- Eingebauter Skript-Editor mit Formatierung, Wortzählung und Lesezeit-Hilfen.
- Remote-Messaging-Ablauf mit Posteingangsüberprüfung, Quick-Connect-QR-Links und absenderseitigen Antworten-Statusaktualisierungen.
- Echtzeit-Textbearbeitung, die es einer unbegrenzten Anzahl von Gästen ermöglicht, beizutreten und das Skript gleichzeitig zu bearbeiten.
- Optionale Groq-gestützte Generierung und Umschreibung.
- Always-on-top-Windows-Overlay mit Click-through- und Capture-Schutz-Optionen.
-Offizieller Tauri-Updater mit In-App-Prüfungen, Installationskontrollen und Unterstützung für signierte Windows-Release-Feeds.

## 🎥 Feature Showcase

### 1. Nachrichten-Injektion
https://github.com/user-attachments/assets/5e6a4fd1-5084-4e33-b56e-0142c2ad83ce



### 2. Echtzeit-Bearbeitung
https://github.com/user-attachments/assets/653988f9-03f1-40ad-95b8-04339356cb07

---




## 📸 Screenshots

<div align="center">
  <h3>Hauptansicht des Teleprompters</h3>
  <img src="./assets/main teleprompter.png" width="400" alt="Main Teleprompter"/>
  <img src="./assets/main chaned size.png" width="400" alt="Resized Layout"/>
  
  <br><br>
  
  <h3>Texteditor & integrierter KI-Assistent</h3>
  <img src="./assets/text editor.png" width="400" alt="Text Editor Interface"/>
  <img src="./assets/AI assistant.png" width="400" alt="AI Workspace Integration"/>

  <br><br>

  <h3>Einstellungen & Kompaktansicht</h3>
  <img src="./assets/settings.png" width="400" alt="Application Settings"/>
  <img src="./assets/minimized.png" width="400" alt="Minimized Compact Overlay"/>
</div>

---

## Roadmap

- [x] Umstellung der Kernarchitektur auf Tauri + Rust
- [x] Unsichtbares Overlay zur OBS-Umgehung
- [x] Microsoft Store Zertifizierung und Veröffentlichung
- [x] Cloudflare-Migration
- [ ] v2.0.0: Frontend-JavaScript-Modul-Refactoring und Erweiterung für Leistungsverbesserungen
- [ ] v2.0.0: Implementierung der Aufteilungslogik für Free/Pro-Stufen

---

## Was ist neu in v1.9.0

- Es wurde eine neue Echtzeit-Bearbeitungsfunktion mithilfe von WebRTC (PeerJS) eingeführt, die eine geräteübergreifende Live-Bearbeitung von Skripten über einen sicheren, privaten Browser-Raum ermöglicht.
- Der QR-Code-Generator wurde auf eine leistungsfähigere Bibliothek (QRCode) aktualisiert.
- Verbesserung der Stabilität, Leistung und Skalierung in der gesamten App durch verschiedene Optimierungen und Fehlerbehebungen unter der Haube.
- Verringerter RAM-Verbrauch bei gleichzeitiger Beibehaltung/Verbesserung der Leistung.

---

## Erste Schritte

1. Lade die neueste Version aus dem [Microsoft Store](https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct) oder von den [GitHub Releases](https://github.com/LumoRez07/flow/releases) herunter;
2. Führe den `.exe` oder `.msi` installer aus;
3. Starte Flow und beginne mit dem Prompting.

---

## Entwicklung

Voraussetzungen:
- Node.js
- Rust
- Tauri-Voraussetzungen für Windows

Lokal ausführen:

```bash
npm install
npm run tauri dev
```

Bauen:

```bash
npm run tauri build
```

Build-Ausgabe:

```text
src-tauri/target/release
src-tauri/target/release/bundle
```

### Signierte Updater-Veröffentlichung

Um ein Windows-Release zu erstellen, das für GitHub Releases und den In-App-Updater von Flow bereit ist, lade den Updater-Signaturschlüssel vor dem Erstellen in die Umgebungsvariablen:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw "$HOME\.tauri\flow-updater.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<your-updater-key-password>"
npm run tauri build
```

Veröffentliche diese Dateien aus `src-tauri/target/release/bundle` im GitHub-Release:

- `msi/flow_1.9.0_x64_en-US.msi`
- `latest.json`

Die `.sig`-Datei wird zusammen mit der MSI als Referenz generiert, während `latest.json` der Updater-Feed ist, der von der App verwendet wird.


## Datenschutz

- Die meisten Daten werden lokal auf dem Gerät gespeichert.
- Das Voice-Tracking ist so konzipiert, dass es lokal mit Vosk-Modellen läuft.
- Groq-Anfragen werden nur gesendet, wenn KI-Funktionen genutzt werden.
- Siehe [privacy-policy.md](privacy-policy.md) für die aktuelle Datenschutzerklärung.

## Lizenz

Dieses Projekt ist unter GPL-3.0-or-later lizenziert. Siehe [LICENSE](LICENSE).

## Stern-Verlauf

<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
