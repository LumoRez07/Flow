<p align="center">
	<img src="src-tauri/icons/128x128.png" width="128" height="128" alt="Flow logo" />
</p>

<h1 align="center">Flow</h1>

Flow is a lightweight desktop teleprompter built with Tauri, vanilla JavaScript, HTML, and CSS. It is designed for fast script reading, quick text editing, simple window controls, tray behavior, and AI-assisted script generation.

## Description

Flow is a minimal teleprompter app for Windows that stays out of the way while you read. It includes a main teleprompter window, a text editor window, settings, an about page, system tray controls, and Groq-powered prompt generation for quickly drafting or rewriting scripts.

## Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript (ES modules)
- Tauri frontend API via global `window.__TAURI__`

### Desktop / Backend

- Tauri v2
- Rust
- `tauri-plugin-opener`
- `tauri-plugin-prevent-default`
- Windows API via the `windows` crate

### AI

- Groq API
- Model currently used: `llama-3.3-70b-versatile`

## Features

- Minimal always-on-top teleprompter UI
- Word-by-word highlight playback
- Speed controls
- Separate text editor window
- Separate settings window
- Separate about window
- Tray menu with show/hide/settings/text editor/about/close
- Hide to tray behavior
- Groq-powered script generation
- Transparent borderless windows
- Hidden from screen capture on Windows
- Hidden from taskbar



### Requirements for Development

- Node.js
- Rust
- Tauri CLI

Install frontend dependencies:

- `npm install`

Run in development:

- `npm run tauri dev`

## Windows Build

To create a Windows build and installer, install:

- Visual Studio Build Tools
- Desktop development with C++
- Windows 10 SDK or Windows 11 SDK

Then build with:

- `npm run tauri build`

Build output is typically created under:

- [src-tauri/target/release](src-tauri/target/release)
- [src-tauri/target/release/bundle](src-tauri/target/release/bundle)

## Notes

- The app is Windows-focused.
- Tray and capture-protection behavior are especially tailored for Windows.
- In debug mode, icon/resource embedding may be skipped if `RC.EXE` is unavailable.

## Next Ideas

- Speech-based scrolling
- Better onboarding for AI setup
- More typography and pacing controls
- Export/import settings and scripts
- More polished installer metadata
