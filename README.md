<p align="center">
  <img src="src-tauri/icons/128x128.png" width="128" height="128" alt="Flow logo" />
</p>

<h1 align="center">Flow</h1>

<p align="center">
  A clean, lightweight desktop teleprompter for Windows built with Tauri.
</p>

## Overview

Flow is a focused teleprompter app designed for fast reading, quick script editing, and low-friction control during recording or presentation. It combines a minimal always-on-top reading surface with a separate editor, live appearance controls, optional AI-assisted drafting, and cloud-based remote message delivery.

## Highlights

- Multiple playback styles: highlight, normal scroll, line-by-line, and arrow mode
- Live speed control with keyboard shortcuts and click-to-jump navigation
- Separate windows for the teleprompter, script editor, settings, and about page
- Script formatting with bold, italic, underline, and highlight tags
- Optional Groq-powered drafting and rewriting
- Cloud remote inbox for receiving notes or script additions
- Theme, font, transparency, and text-scale customization
- Automatic RTL/LTR handling
- English, Turkish, Arabic, and German localization
- Windows-focused desktop features such as tray support, clickthrough mode, and capture hiding

## Screenshots

<p align="center">
  <img src="assets/screenshot%20main.png" alt="Flow main teleprompter" width="900" />
</p>

<p align="center">
  <img src="assets/screenshot%20editor.png" alt="Flow text editor" width="48%" />
  <img src="assets/settings.png" alt="Flow settings" width="48%" />
</p>

## Tech Stack

- Tauri v2
- Rust
- Vanilla JavaScript, HTML, and CSS
- Groq API for optional AI features

## Keyboard Shortcuts

- `P` — play or stop
- `Space` — pause or continue
- `R` — reset to start
- `↑ / ↓` — move one line up or down in scroll and line modes
- `← / →` — decrease or increase WPM while playing
- `Ctrl + Shift + X` — toggle clickthrough mode

## Development

### Requirements

- Node.js
- Rust
- Tauri prerequisites for Windows

### Run locally

1. Install dependencies:
   - `npm install`
2. Start the desktop app:
   - `npm run tauri dev`

## Build

To create a Windows build, ensure Visual Studio Build Tools and a Windows SDK are installed, then run:

- `npm run tauri build`

Build artifacts are generated in:

- [src-tauri/target/release](src-tauri/target/release)
- [src-tauri/target/release/bundle](src-tauri/target/release/bundle)

## Remote Messaging

Flow supports a cloud-based remote workflow for receiving messages in the teleprompter window. The relay service is configured separately from this desktop app.

Set the relay URL in [src/remote-config.js](src/remote-config.js), keep the teleprompter window open, then use the generated receiver credentials from the settings window to connect a sender.

## Notes

- This project is primarily optimized for Windows.
- AI features are optional and require a Groq API key.
- Groq keys are stored locally on the device.
