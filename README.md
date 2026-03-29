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
  <strong>v1.3.0</strong> · Tauri v2 · Rust Core · Vanilla JS UI · Windows-first
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.3.0-2563eb?style=for-the-badge" />
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
  <img alt="Updater" src="https://img.shields.io/badge/Updates-Built%20In-f59e0b?style=for-the-badge" />
</p>

## Overview

Flow is a desktop teleprompter focused on live readability and operational speed. It keeps the reading surface clean while still covering voice tracking, app-wide voice commands, script editing, remote text delivery, and optional AI-assisted drafting.

## What's New in 1.3.0

- Added expanded Groq customization controls for drafting and rewriting workflows.
- Added French app localization and refreshed translation coverage in settings.
- Added a left-side playback speed rail with runtime toggle support.
- Improved Tauri window sizing and teleprompter layout stability during playback.
- Refined voice-tracking settings, model install status, and translated language labels.
- Lowered the minimum text size setting from 60% to 30%.

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for the full release summary.

## Preview

<p align="center">
  <img src="assets/screenshot%20main.png" alt="Flow main teleprompter" width="900" />
</p>

<p align="center">
  <img src="assets/screenshot%20editor.png" alt="Flow script editor" width="48%" />
  <img src="assets/settings.png" alt="Flow settings" width="48%" />
</p>

<p align="center">
  <img src="assets/screenshot%20dark.png" alt="Flow dark theme" width="31%" />
  <img src="assets/screenshot%20bright.png" alt="Flow bright theme" width="31%" />
  <img src="assets/screenshot%20yellow%20green.png" alt="Flow yellow green theme" width="31%" />
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
