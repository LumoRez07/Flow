<p align="center">
	<img src="src-tauri/icons/128x128.png" width="128" height="128" alt="Flow logo" />
</p>

<h1 align="center">Flow</h1>


## Description

Flow is a minimal teleprompter app for Windows that stays out of the way while you read. It includes a main teleprompter window, a text editor window, settings, an about page, system tray controls, and Groq-powered prompt generation for quickly drafting or rewriting scripts.

## Screenshots

<p align="center">
	<img src="assets/screenshot%20main.png" alt="Flow main teleprompter" width="900" />
</p>

<p align="center"><strong>Main teleprompter</strong></p>

<p align="center">
	<img src="assets/screenshot%20editor.png" alt="Flow text editor" width="48%" />
	<img src="assets/settings.png" alt="Flow settings" width="48%" />
</p>

<p align="center"><strong>Text editor</strong> &nbsp;•&nbsp; <strong>Settings</strong></p>

<p align="center">
	<img src="assets/screenshot%20dark.png" alt="Flow dark theme" width="31%" />
	<img src="assets/screenshot%20bright.png" alt="Flow bright theme" width="31%" />
	<img src="assets/screenshot%20yellow%20green.png" alt="Flow yellow-green theme" width="31%" />
</p>

<p align="center"><strong>Dark theme</strong> &nbsp;•&nbsp; <strong>Bright theme</strong> &nbsp;•&nbsp; <strong>Yellow-green theme</strong></p>

<p align="center">
	<img src="assets/screenshot%20minimized.png" alt="Flow minimized bar" width="48%" />
	<img src="assets/screenshot%20aboutme.png" alt="Flow about page" width="48%" />
</p>

<p align="center"><strong>Collapsed view</strong> &nbsp;•&nbsp; <strong>About page</strong></p>

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

## Get a Free Groq API Key

1. Go to [console.groq.com](https://console.groq.com/)
2. Sign up or log in
3. Open the API keys page at [console.groq.com/keys](https://console.groq.com/keys)
4. Create a new API key
5. Copy the key
6. Open the Flow text editor window
7. Paste the key into the `API key` field under the Groq section

Your key is stored locally on your device for use inside the app.

## Features

- Minimal always-on-top teleprompter UI
- Multiple teleprompter playback styles:
	- Highlight mode
	- Normal scroll mode
	- Line-by-line highlight mode
	- Arrow mode
- Speed controls with compact responsive editing
- Pause, continue, stop-in-place, and replay controls
- Click-to-jump playback in highlight and line modes
- Separate text editor window
- Separate settings window
- Separate about window
- Groq-powered script generation and rewriting
- Reddit-style text formatting support for:
	- Bold
	- Italic
	- Underline
	- Yellow, blue, and red highlights
- Live settings updates
- Persistent saved settings and text across relaunches
- Themes and appearance customization
- Font customization, including Arabic, Turkish, and German-friendly fonts
- Text size, text transparency, and app transparency controls
- Automatic RTL/LTR text direction handling
- App localization for English, Turkish, Arabic, and German
- Custom language picker with flag icons
- Tray menu with show/hide/settings/text editor/about/close
- Hide to tray behavior
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
