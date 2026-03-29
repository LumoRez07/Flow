# Flow 1.3.0 Release Notes

Release date: March 29, 2026

## Highlights

- Added expanded Groq prompt customization controls for drafting, rewriting, tone, grammar, context, and language output.
- Added French as an app language and improved translation coverage across settings and related UI.
- Added a left-side playback speed rail that appears during playback and can be enabled or disabled from Settings.
- Improved main-window sizing so the Tauri shell and teleprompter layout behave more predictably.
- Reduced teleprompter layout flicker and shake during playback rail transitions.
- Lowered the minimum text size setting from 60% to 30%.

## Voice Improvements

- Improved voice-tracking follow behavior for faster on-screen movement.
- Refined voice model management in Settings with better install state and progress feedback.
- Fixed voice language labels so they refresh correctly after app-language changes.
- Kept the side speed rail disabled in voice-tracking and arrow modes to match mode behavior.

## UI and Settings

- Refined the teleprompter layout and startup window sizing.
- Added a dedicated setting for the side speed slider.
- Updated width handling so teleprompter width remains user-controlled while the outer window accounts for the left rail.
- Updated About and project documentation for version 1.3.0.

## Notes

- Flow remains Windows-first.
- Groq features require a valid Groq API key.
- The built-in updater checks published GitHub releases and installs the latest x64 MSI package.