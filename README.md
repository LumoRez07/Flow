<p align="center">
  <img src="src-tauri/icons/128x128.png" width="128" height="128" alt="Flow logo" />
</p>

<h1 align="center">Flow</h1>

Flow is a lightweight desktop teleprompter built with Tauri, vanilla JavaScript, HTML, and CSS. It is designed for fast script reading, quick text editing, simple window controls, tray behavior, and AI-assisted script generation.

## Description

Flow is a minimal teleprompter app for Windows that stays out of the way while you read. It includes a main teleprompter window, a text editor window, settings, an about page, system tray controls, and Groq-powered prompt generation for quickly drafting or rewriting scripts.

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
