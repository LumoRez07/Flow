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
    <td align="center"><img src="src/assets/readme-assets/en-circle-active.webp" width="32" height="32" alt="English" /><br /><sub><b>English</b></sub></td>
    <td align="center"><a href="README.es.md"><img src="src/assets/readme-assets/es-circle.webp" width="32" height="32" alt="Español" /><br /><sub><b>Español</b></sub></a></td>
    <td align="center"><a href="README.tr.md"><img src="src/assets/readme-assets/tr-circle.webp" width="32" height="32" alt="Türkçe" /><br /><sub><b>Türkçe</b></sub></a></td>
    <td align="center"><a href="README.ar.md"><img src="src/assets/readme-assets/sa-circle.webp" width="32" height="32" alt="العربية" /><br /><sub><b>العربية</b></sub></a></td>
    <td align="center"><a href="README.de.md"><img src="src/assets/readme-assets/de-circle.webp" width="32" height="32" alt="Deutsch" /><br /><sub><b>Deutsch</b></sub></a></td>
    <td align="center"><a href="README.fr.md"><img src="src/assets/readme-assets/fr-circle.webp" width="32" height="32" alt="Français" /><br /><sub><b>Français</b></sub></a></td>
    <td align="center"><a href="README.pt.md"><img src="src/assets/readme-assets/br-circle.webp" width="32" height="32" alt="Português" /><br /><sub><b>Português</b></sub></a></td>
    <td align="center"><a href="README.fi.md"><img src="src/assets/readme-assets/fi-circle.webp" width="32" height="32" alt="Suomi" /><br /><sub><b>Suomi</b></sub></a></td>
  </tr>
</table>

<p align="center">
  <a href="https://github.com/LumoRez07/flow/releases" target="_blank">
    <img src="https://img.shields.io/github/v/release/LumoRez07/flow?style=flat-square&color=2563eb&label=version" alt="Version 2.0.0" />
  </a>
  <a href="https://github.com/LumoRez07/flow/releases" target="_blank">
    <img src="https://img.shields.io/github/downloads/LumoRez07/flow/total?style=flat-square&color=3b82f6" alt="GitHub Downloads" />
  </a>
  <a href="https://sourceforge.net/projects/flowteleprompter/files/latest/download">
    <img src="https://img.shields.io/sourceforge/dm/flowteleprompter.svg?style=flat-square" alt="SourceForge Downloads" />
  </a>
  <img src="https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/backend-Rust%20%2B%20Tauri%20v2-FFC131?style=flat-square&logo=tauri&logoColor=black" alt="Tauri + Rust" />
  <img src="https://img.shields.io/badge/license-GPLv3-22c55e?style=flat-square" alt="GPLv3 License" />
</p>

<p align="center">
  <strong>Lightweight teleprompter for Windows, built with Rust and Tauri.</strong>
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

</div>

---

<p align="center">
  <img src="src/assets/readme-assets/en-f.webp" alt="Features" width="960" />
</p>

- Five playback styles: highlight, scroll, line, arrow, and voice tracking.
- Local-first script storage and settings persistence.
- Dedicated sound input tuning with device selection, live monitoring, noise gate, and gain controls.
- App-wide voice control with localized wake greetings and resilient recognition handling.
- Vosk speech models with bundled English and downloadable Turkish, Arabic, German, French, Spanish, Portuguese, and Finnish support.
- Cue cards with countdown pauses and auto-resume.
- Built-in script editor with formatting, word count, and reading-time helpers.
- Remote messaging flow with inbox review, quick-connect QR links, and sender-side reply status updates.
- Realtime text editing allowing multiple guests to join and edit the script at the same time via a private browser room.
- Optional Groq-powered generation and rewriting.
- Always-on-top Windows overlay with click-through and capture-protection options.
- Official Tauri updater with in-app checks, install controls, and signed Windows release-feed support.

---

<p align="center">
  <img src="src/assets/readme-assets/en-sc.webp" alt="Feature Showcase" width="960" />
</p>

### 1. Message Injection
https://github.com/user-attachments/assets/5e6a4fd1-5084-4e33-b56e-0142c2ad83ce

### 2. Realtime Editing
https://github.com/user-attachments/assets/653988f9-03f1-40ad-95b8-04339356cb07

---

<p align="center">
  <img src="src/assets/readme-assets/en-ss.webp" alt="Screenshots" width="960" />
</p>

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

<p align="center">
  <img src="src/assets/readme-assets/en-win.webp" alt="What is new?" width="960" />
</p>

- **Script Library & Manager**: Added a built-in script manager to save, organize, search, and switch between multiple scripts instantly, along with quick file import capabilities.<br><br>
- **Section Navigator & Completion Tracker**: Added section tags and visual milestone indicators to break scripts into structured parts, jump between sections with one click, and track reading progress in real time.<br><br>
- **Modularized Codebase**: Restructured core functionality into an optimized modular architecture for faster load times, rock-solid stability, and seamless future development.<br><br>
- **Splash Screen**: Added a graceful startup screen with a smooth crossfade to eliminate window flickering during launch.<br><br>
- **Multi-Monitor & DPI Fixes**: Enhanced window positioning, coordinate precision, and scaling across mixed-DPI and multi-monitor setups.<br><br>

---

<p align="center">
  <img src="src/assets/readme-assets/en-rm.webp" alt="Roadmap" width="960" />
</p>

- [x] Tauri + Rust core architecture rewrite
- [x] Invisible overlay for screensharing, presentations, and video calls
- [x] Microsoft Store certification and release
- [x] Cloudflare migration
- [x] v2.0.0: Frontend JavaScript module refactor and performance improvements
- [x] v2.0.0: Free/Pro tier split logic implementation
- [ ] v2.1.0: Improvements to the web landing page and remote relay client
- [ ] v2.2.0+: To be decided

---

<p align="center">
  <img src="src/assets/readme-assets/en-gs.webp" alt="Get Started" width="960" />
</p>

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

- `msi/flow_2.0.0_x64_en-US.msi`
- `latest.json`

The `.sig` file is generated alongside the MSI for reference, while `latest.json` is the updater feed consumed by the app.

---

## Privacy

- Most data is stored locally on the device.
- Voice tracking runs locally with Vosk models.
- Groq requests are only sent when AI features are used.
- See [privacy-policy.md](privacy-policy.md) for the current privacy policy.

---

## Acknowledgments

Special thanks to [@emanschigames](https://www.instagram.com/emanschigames/?hl=en) and [@nour690](https://github.com/nour690) for supporting Flow Teleprompter when it needed it most. Even though it may have been a small gesture, it meant a lot and is sincerely appreciated.


---

## License

This project is licensed under GPL-3.0-or-later. See [LICENSE](LICENSE).

---

## Star History

<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
