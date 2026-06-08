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

English / [Español](/README.es.md) / [Türkçe](/README.tr.md) / [العربية](/README.ar.md) / [Deutsch](/README.de.md) / [Français](/README.fr.md)

<a href="https://github.com/LumoRez07/flow/releases" target="_blank">
  <img src="https://img.shields.io/github/downloads/LumoRez07/flow/total?style=flat-square&color=blue" alt="Downloads" height="20"/>
</a>
<a href="https://sourceforge.net/projects/flowteleprompter/files/latest/download">
  <img alt="Download Flow Teleprompter" src="https://img.shields.io/sourceforge/dm/flowteleprompter.svg" />
</a>

Ultra-lightweight, hardware-accelerated teleprompter built with Rust & Tauri.

![Windows][Windows-image]
![Tauri][Tauri-image]
![Rust][Rust-image]
<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.9.0-2563eb?style=for-the-badge" />
  <img alt="JavaScript" src="https://img.shields.io/badge/Frontend-Vanilla%20JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=111827" />
</p>
<p align="center">
Please consider starring this repo if it helps you! ⭐
</p>

<p align="center">
  <a href="https://www.ghacks.net/de/2026/05/28/flow-teleprompter-windows-voice-tracking/" target="_blank">
    <img src="assets/featured%20on%20ghacks.svg" alt="Featured on Ghacks" width="480" />
  </a>
</p>

## Flow is available on
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
> If you are encountering scaling issues please download the latest version (1.9.0).
> If flow doesn't start scrolling on voice tracking mode, please check the microphone permission settings for the app and make sure the correct input device is selected in settings.


> [!IMPORTANT]
> Distribution note: the Microsoft Store edition is planned to become a Pro version. Its price is expected to increase to **5-10 USD** (*Not decided yet*) to help compensate for server rental, and hosted services will be turned on once the Pro release reaches the required user threshold. The GitHub version will remain the free open-source build and will continue receiving major features and updates.



## Highlights

- Five playback styles: highlight, scroll, line, arrow, and voice tracking.
- Local-first script storage and settings persistence.
- Dedicated sound input tuning with device selection, live monitoring, noise gate, and gain controls.
- App-wide voice control with localized wake greetings and more resilient recognition handling.
- Vosk speech models with bundled English and downloadable Turkish, Arabic, German, French, and Spanish support.
- Built-in script editor with formatting, word count, and reading-time helpers.
- Remote messaging flow with inbox review, quick-connect QR links, and sender-side reply status updates.
- Realtime text editing that allows an unlimited number of guests to join and edit the script at the same time.
- Optional Groq-powered generation and rewriting.
- Always-on-top Windows overlay with click-through and capture-protection options.
- Official Tauri updater with in-app checks, install controls, and signed Windows release-feed support.

## 🎥 Feature Showcase

### 1. Message Injection
https://github.com/user-attachments/assets/5e6a4fd1-5084-4e33-b56e-0142c2ad83ce



### 2. Realtime Editing
https://github.com/user-attachments/assets/653988f9-03f1-40ad-95b8-04339356cb07

---




## 📸 Screenshots

<div align="center">
  <h3>Main Teleprompter Look</h3>
  <img src="./assets/main teleprompter.png" width="400" alt="Main Teleprompter"/>
  <img src="./assets/main chaned size.png" width="400" alt="Resized Layout"/>
  
  <br><br>
  
  <h3>Text Editor & Built-in AI Assistant</h3>
  <img src="./assets/text editor.png" width="400" alt="Text Editor Interface"/>
  <img src="./assets/AI assistant.png" width="400" alt="AI Workspace Integration"/>

  <br><br>

  <h3>Settings & Compact View</h3>
  <img src="./assets/settings.png" width="400" alt="Application Settings"/>
  <img src="./assets/minimized.png" width="400" alt="Minimized Compact Overlay"/>
</div>

---

## Roadmap

- [x] Tauri + Rust core architecture rewrite
- [x] Invisible overlay for OBS bypass
- [x] Microsoft Store certification and release
- [x] Cloudflare migration
- [ ] v2.0.0: Frontend JavaScript module refactor and enhancement for performance improvements
- [ ] v2.0.0: Free/Pro tier split logic implementation

---

## What's New in v1.9.0

- Introduced a new Realtime Editing feature using WebRTC (PeerJS), allowing live cross-device script editing through a secure, private browser room.
- Upgraded the QR code generator to a more performant library (QRCode).
- Improve stability, performance, and scaling across the app with various under-the-hood optimizations and fixes.
- Decreased RAM usage while maintaining/improving performance.

---

## Get Started

1. Download the latest release from the [Microsoft Store](https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct) or [GitHub Releases](https://github.com/LumoRez07/flow/releases);
2. Run the `.exe` or `.msi` installer;
3. Launch Flow and start prompting.

---

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

- `msi/flow_1.9.0_x64_en-US.msi`
- `latest.json`

The `.sig` file is generated alongside the MSI for reference, while `latest.json` is the updater feed consumed by the app.


## Privacy

- Most data is stored locally on the device.
- Voice tracking is designed to run locally with Vosk models.
- Groq requests are only sent when AI features are used.
- See [privacy-policy.md](privacy-policy.md) for the current privacy policy.

## License

This project is licensed under GPL-3.0-or-later. See [LICENSE](LICENSE).

## Star History

<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
