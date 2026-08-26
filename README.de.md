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
  <img src="src/assets/readme-assets/github-readme-header.webp" width="960" alt="Flow Teleprompter v2" />
</p>

<table align="center">
  <tr>
    <td align="center"><a href="README.md"><img src="src/assets/readme-assets/en-circle.webp" width="32" height="32" alt="English" /><br /><sub><b>English</b></sub></a></td>
    <td align="center"><a href="README.es.md"><img src="src/assets/readme-assets/es-circle.webp" width="32" height="32" alt="Español" /><br /><sub><b>Español</b></sub></a></td>
    <td align="center"><a href="README.tr.md"><img src="src/assets/readme-assets/tr-circle.webp" width="32" height="32" alt="Türkçe" /><br /><sub><b>Türkçe</b></sub></a></td>
    <td align="center"><a href="README.ar.md"><img src="src/assets/readme-assets/sa-circle.webp" width="32" height="32" alt="العربية" /><br /><sub><b>العربية</b></sub></a></td>
    <td align="center"><img src="src/assets/readme-assets/de-circle-active.webp" width="32" height="32" alt="Deutsch" /><br /><sub><b>Deutsch</b></sub></td>
    <td align="center"><a href="README.fr.md"><img src="src/assets/readme-assets/fr-circle.webp" width="32" height="32" alt="Français" /><br /><sub><b>Français</b></sub></a></td>
    <td align="center"><a href="README.pt.md"><img src="src/assets/readme-assets/br-circle.webp" width="32" height="32" alt="Português" /><br /><sub><b>Português</b></sub></a></td>
    <td align="center"><a href="README.fi.md"><img src="src/assets/readme-assets/fi-circle.webp" width="32" height="32" alt="Suomi" /><br /><sub><b>Suomi</b></sub></a></td>
  </tr>
</table>

<p align="center">
  <a href="https://github.com/LumoRez07/flow/releases" target="_blank">
    <img src="https://img.shields.io/github/v/release/LumoRez07/flow?style=flat-square&color=2563eb&label=Version" alt="Version 2.0.0" />
  </a>
  <a href="https://github.com/LumoRez07/flow/releases" target="_blank">
    <img src="https://img.shields.io/github/downloads/LumoRez07/flow/total?style=flat-square&color=3b82f6" alt="GitHub Downloads" />
  </a>
  <a href="https://sourceforge.net/projects/flowteleprompter/files/latest/download">
    <img src="https://img.shields.io/sourceforge/dm/flowteleprompter.svg?style=flat-square" alt="SourceForge Downloads" />
  </a>
  <img src="https://img.shields.io/badge/Plattform-Windows%2010%20%7C%2011-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/Backend-Rust%20%2B%20Tauri%20v2-FFC131?style=flat-square&logo=tauri&logoColor=black" alt="Tauri + Rust" />
  <img src="https://img.shields.io/badge/Lizenz-GPLv3-22c55e?style=flat-square" alt="GPLv3-Lizenz" />
</p>

<p align="center">
  <strong>Leistungsstarker, ressourcenschonender Teleprompter für Windows, entwickelt mit Rust und Tauri.</strong>
</p>

<p align="center">
  Bitte gib diesem Repository einen Stern, wenn es dir hilft! ⭐
</p>

<p align="center">
  <a href="https://www.ghacks.net/de/2026/05/28/flow-teleprompter-windows-voice-tracking/" target="_blank">
    <img src="assets/featured%20on%20ghacks.svg" alt="Vorgestellt auf Ghacks" width="480" />
  </a>
</p>

## Flow ist verfügbar auf
<div align="center">
  <a href="https://sourceforge.net/p/flowteleprompter/">
    <img alt="Flow Teleprompter herunterladen" src="https://sourceforge.net/sflogo.php?type=17&amp;group_id=4087698" width="200">
  </a>
  <a href="https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct">
    <img alt="Im Microsoft Store erhältlich" src="https://get.microsoft.com/images/en-us%20dark.svg" width="200"/>
  </a>
  <br>
</div>

</div>

---

<p align="center">
  <img src="src/assets/readme-assets/de-f.webp" alt="Funktionen" width="960" />
</p>

- Fünf Wiedergabemodi: Hervorhebung (Highlight), Scrollen (Scroll), Zeile (Line), Pfeil (Arrow) und Sprachverfolgung (Voice Tracking).
- Lokale Speicherung von Skripten und persistente Einstellungen nach dem Local-First-Prinzip.
- Dedizierte Audioeingangskalibrierung mit Geräteauswahl, Live-Pegelüberwachung, Noise Gate und Verstärkungsregelung (Gain).
- App-weite Sprachsteuerung mit lokalisierten Aktivierungswörtern und zuverlässiger Erkennungslogik.
- Vosk-Sprachmodelle mit integrierter englischer Sprachunterstützung und herunterladbaren Paketen für Deutsch, Türkisch, Arabisch, Französisch, Spanisch, Portugiesisch und Finnisch.
- Hinweiskarten (Cue Cards) mit Countdown-Pausen und automatischer Fortsetzung.
- Integrierter Skript-Editor mit Formatierungsoptionen, Wortzähler und Lesezeitschätzung.
- Remote-Nachrichtenübertragung mit Posteingangsvorschau, Schnellverbindungs-QR-Codes und Antwortstatus-Updates auf Absenderseite.
- Echtzeit-Textbearbeitung, die es mehreren Gästen ermöglicht, über einen privaten Browser-Raum gleichzeitig am selben Skript zu arbeiten.
- Optionale Textgenerierung und Umformulierung mit KI-Unterstützung durch Groq.
- Always-on-Top-Windows-Overlay mit Durchklickmodus (Click-Through) und Aufnahmeschutz (Capture-Protection).
- Offizieller Tauri-Updater mit In-App-Prüfungen, Installationssteuerung und Unterstützung signierter Windows-Release-Feeds.

---

<p align="center">
  <img src="src/assets/readme-assets/de-sc.webp" alt="Funktionsübersicht" width="960" />
</p>

### 1. Nachrichteneinblendung (Message Injection)
https://github.com/user-attachments/assets/5e6a4fd1-5084-4e33-b56e-0142c2ad83ce

### 2. Echtzeit-Bearbeitung (Realtime Editing)
https://github.com/user-attachments/assets/653988f9-03f1-40ad-95b8-04339356cb07

---

<p align="center">
  <img src="src/assets/readme-assets/de-ss.webp" alt="Screenshots" width="960" />
</p>

<div align="center">
  <h3>Hauptansicht des Teleprompters</h3>
  <img src="./assets/main teleprompter.png" width="400" alt="Hauptansicht"/>
  <img src="./assets/main chaned size.png" width="400" alt="Angepasstes Layout"/>
  
  <br><br>
  
  <h3>Skript-Editor & integrierter KI-Assistent</h3>
  <img src="./assets/text editor.png" width="400" alt="Editor-Benutzeroberfläche"/>
  <img src="./assets/AI assistant.png" width="400" alt="KI-Arbeitsbereich-Integration"/>

  <br><br>

  <h3>Einstellungen & Kompaktansicht</h3>
  <img src="./assets/settings.png" width="400" alt="Anwendungseinstellungen"/>
  <img src="./assets/minimized.png" width="400" alt="Kompaktes Overlay"/>
</div>

---

<p align="center">
  <img src="src/assets/readme-assets/de-win.webp" alt="Was ist neu?" width="960" />
</p>

- **Skript-Bibliothek & Manager**: Integrierter Skript-Manager zum sofortigen Speichern, Organisieren, Durchsuchen und Wechseln zwischen mehreren Skripten inklusive schneller Datei-Importfunktionen.<br><br>
- **Abschnitts-Navigator & Fortschrittsverfolgung**: Neue Abschnitts-Tags und visuelle Meilensteine, um lange Skripte zu strukturieren, mit einem Klick zwischen Abschnitten zu springen und den Lesefortschritt live zu verfolgen.<br><br>
- **Modularisierte Codebasis**: Vollständige Neustrukturierung der Kernfunktionen in eine modulare Architektur für schnellere Ladezeiten, maximale Stabilität und zukunftssichere Erweiterbarkeit.<br><br>
- **Startbildschirm (Splash Screen)**: Eleganter Ladebildschirm mit sanfter Überblendung (Crossfade) zur Vermeidung von Fensterflackern beim Start.<br><br>
- **Multi-Monitor- & DPI-Korrekturen**: Optimierte Fensterpositionierung, Koordinatenpräzision und Skalierung bei Setups mit mehreren Monitoren und gemischten DPI-Werten.<br><br>

---

<p align="center">
  <img src="src/assets/readme-assets/de-rm.webp" alt="Roadmap" width="960" />
</p>

- [x] Neuentwicklung der Kernarchitektur mit Tauri + Rust
- [x] Unsichtbares Overlay für Bildschirmübertragungen, Präsentationen und Videoanrufe
- [x] Zertifizierung und Veröffentlichung im Microsoft Store
- [x] Migration zu Cloudflare
- [x] v2.0.0: Refaktorisierung der Frontend-JavaScript-Module und Leistungsoptimierungen
- [x] v2.0.0: Implementierung der Free/Pro-Funktionstrennung
- [ ] v2.1.0: Verbesserungen an der Web-Landingpage und dem Remote-Relay-Client
- [ ] v2.2.0+: Noch festzulegen

---

<p align="center">
  <img src="src/assets/readme-assets/de-gs.webp" alt="Jetzt starten" width="960" />
</p>

1. Lade die neueste Version aus dem [Microsoft Store](https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct) oder von den [GitHub Releases](https://github.com/LumoRez07/flow/releases) herunter;
2. Führe das `.exe`- oder `.msi`-Installationsprogramm aus;
3. Starte Flow und beginne mit dem Vortragen.

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

Erstellen (Build):

```bash
npm run tauri build
```

Build-Ausgabe:

```text
src-tauri/target/release
src-tauri/target/release/bundle
```

### Signiertes Updater-Release

Um ein Windows-Release zu erstellen, das für GitHub Releases und den In-App-Updater von Flow bereit ist, lade den Updater-Signaturschlüssel vor dem Build in die Umgebung:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw "$HOME\.tauri\flow-updater.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<your-updater-key-password>"
npm run tauri build
```

Veröffentliche diese Dateien aus `src-tauri/target/release/bundle` im GitHub-Release:

- `msi/flow_2.0.0_x64_en-US.msi`
- `latest.json`

Die `.sig`-Datei wird zusammen mit der MSI zur Referenz generiert, während `latest.json` der vom Programm genutzte Updater-Feed ist.

---

## Datenschutz

- Die meisten Daten werden lokal auf dem Gerät gespeichert.
- Die Sprachverfolgung läuft vollständig lokal über Vosk-Modelle.
- Groq-Anfragen werden nur gesendet, wenn KI-Funktionen aktiv genutzt werden.
- Siehe [privacy-policy.md](privacy-policy.md) für die aktuelle Datenschutzerklärung.

---

## Danksagung

Ein besonderer Dank gilt [@emanschigames](https://www.instagram.com/emanschigames/?hl=en) und [@nour690](https://github.com/nour690) für ihre Unterstützung von Flow Teleprompter, als es am meisten gebraucht wurde. Auch wenn es eine kleine Geste gewesen sein mag, hat sie viel bedeutet und wird aufrichtig geschätzt.


---

## Lizenz

Dieses Projekt ist unter der GPL-3.0-or-later lizenziert. Siehe [LICENSE](LICENSE).

---

## Star History

<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
