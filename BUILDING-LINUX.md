<!--
  Flow - A high-performance teleprompter for Windows.
  Copyright (C) 2026 Waled Alturkmani (LumoRez07)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
-->

# Building Flow on Linux

Flow is primarily a Windows application, but this branch adds a native
Linux build (AppImage, `.deb`, `.rpm`, and an Arch `PKGBUILD`). This
document covers everything needed to build and run it from source on
Linux, plus the known platform limitations.

## Prerequisites

You need Rust (stable), Node.js 20+, and the Tauri v2 native
dependencies for your distro.

### Debian / Ubuntu (22.04+)

```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libasound2-dev \
  libssl-dev \
  pkg-config \
  xdg-utils \
  unzip \
  file
```

(`unzip` and `file` are only needed to run `fetch-vosk.sh` and to build
an AppImage; skip them if you only want a debug build for development.)

### Arch Linux

```bash
sudo pacman -S --needed webkit2gtk-4.1 gtk3 libayatana-appindicator \
  alsa-lib vosk-api hicolor-icon-theme gtk-update-icon-cache \
  desktop-file-utils rust nodejs npm pkgconf
```

Arch's `vosk-api` package is used directly (see [Speech recognition
library (Vosk)](#speech-recognition-library-vosk) below) — you do not
need `fetch-vosk.sh` on Arch. A ready-to-use `PKGBUILD` is provided at
[packaging/arch/PKGBUILD](packaging/arch/PKGBUILD).

### Fedora / openSUSE (rpm-based)

Package names vary by distro/version; the runtime dependencies a built
`.rpm` declares are `webkit2gtk4.1`, `gtk3`, `libayatana-appindicator-
gtk3`, and `alsa-lib` (see
[tauri.linux.conf.json](src-tauri/tauri.linux.conf.json)) — install
their `-devel` equivalents to build from source.

## Speech recognition library (Vosk)

Flow's voice engine links against `libvosk.so` at runtime. Two ways to
provide it:

- **System package** (Arch): install the distro's `vosk-api` package;
  `FLOW_LINUX_PACKAGE=pacman` tells the build to expect it on the
  system instead of vendoring a copy (see
  [packaging/arch/PKGBUILD](packaging/arch/PKGBUILD)).
- **Vendored copy** (AppImage/deb/rpm, or plain development builds on
  distros without a `vosk-api` package): run
  [packaging/linux/fetch-vosk.sh](packaging/linux/fetch-vosk.sh) once.
  It downloads the official prebuilt `libvosk.so` (pinned to v0.3.45 —
  the last version with published binary release assets, see the
  script's comments) into
  `src-tauri/resources/vosk/linux-x64/libvosk.so`, verifying its
  SHA-256 against a hardcoded value. `src-tauri/build.rs` picks it up
  automatically once present.

## Building

```bash
npm ci
bash packaging/linux/fetch-vosk.sh   # skip on Arch if using system vosk-api
```

**Development build (debug, runs in place):**

```bash
cd src-tauri && cargo build
./packaging/linux/flow-launcher.sh   # or run target/debug/flow directly
```

**Packaged builds**, each via `tauri build` with the Linux config
overlay (`tauri.linux.conf.json` merges automatically-shared settings
from `tauri.conf.json`; nothing there needs editing per-package):

```bash
# AppImage
FLOW_LINUX_PACKAGE=appimage npx tauri build \
  --config src-tauri/tauri.linux.conf.json \
  --bundles appimage
bash packaging/linux/fix-appimage-libs.sh \
  src-tauri/target/release/bundle/appimage/*.AppImage

# .deb
FLOW_LINUX_PACKAGE=deb npx tauri build \
  --config src-tauri/tauri.linux.conf.json --bundles deb

# .rpm
FLOW_LINUX_PACKAGE=rpm npx tauri build \
  --config src-tauri/tauri.linux.conf.json --bundles rpm
```

`fix-appimage-libs.sh` is **required** after every AppImage build — see
[Known issues](#known-issues) below for why. It re-signs the AppImage
if a `.sig` file (updater artifact) exists next to it and
`TAURI_SIGNING_PRIVATE_KEY` is set in the environment, since repacking
changes the file's signature-relevant bytes.

To also produce a signed updater artifact (`.AppImage.sig`), add
`--config src-tauri/tauri.linux.appimage.conf.json` as a second
`--config` flag to the AppImage build above, with
`TAURI_SIGNING_PRIVATE_KEY` (and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`,
even if empty) set — this is the same signing key already used for
Windows releases, not a separate one.

[.github/workflows/build-linux.yml](.github/workflows/build-linux.yml)
runs this exact sequence in CI (on `ubuntu-22.04` — see the workflow's
own comments for why not a newer Ubuntu) and uploads all three package
formats as artifacts on every push/PR to `linux-native-build`.

## Known issues and platform limitations

- **Wayland**: Flow is an always-on-top overlay that relies on absolute
  window positioning, always-on-top, and global hotkeys. Native
  Wayland's security model doesn't allow any of these for regular
  applications, and neither GTK3 nor `tao` (Tauri's windowing layer on
  Linux) work around that. [flow-launcher.sh](packaging/linux/flow-launcher.sh)
  therefore forces the app onto XWayland by default
  (`GDK_BACKEND=x11`); set `FLOW_ALLOW_WAYLAND=1` to opt out and run
  under native Wayland, with the caveat that window positioning,
  always-on-top, and global hotkeys will not work correctly.
- **Blank/black window (DMA-BUF renderer)**: on some AMD/Mesa driver
  combinations, WebKitGTK's DMA-BUF renderer fails to initialize the
  window contents. `flow-launcher.sh` sets
  `WEBKIT_DISABLE_DMABUF_RENDERER=1` by default to work around this;
  unset it explicitly if you've verified your system doesn't need it.
- **Screen-capture protection is not available on Linux.** The
  Windows build can hide the teleprompter window from screen
  recording/sharing (via a Windows-only API); there is no equivalent
  mechanism on X11 or Wayland, so this feature is disabled on Linux.
- **Remote Control needs a firewall exception.** The "Remote Control"
  feature runs a small local HTTP relay on TCP port **43127** so
  another device on the same network can send text to Flow directly
  (see `REMOTE_RELAY_PORT` in
  [src-tauri/src/lib.rs](src-tauri/src/lib.rs)). Most desktop Linux
  distros ship a default-deny firewall (`ufw`, `firewalld`) with no
  interactive per-app prompt like Windows Defender Firewall shows on
  first launch — you need to open the port yourself if you want to use
  this feature from another device on your LAN, e.g.:
  ```bash
  sudo ufw allow 43127/tcp        # ufw (Debian/Ubuntu)
  sudo firewall-cmd --add-port=43127/tcp --permanent && sudo firewall-cmd --reload   # firewalld (Fedora)
  ```
- **AppImage and bundled Wayland/XCB libraries**: `linuxdeploy-plugin-
  gtk` bundles Wayland/X11/XCB client libraries and `libxkbcommon`
  into the AppImage, but these must match the exact protocol/ABI
  version of the host's own compositor or X server. A version mismatch
  causes WebKitGTK to fail EGL/GL context creation entirely (`Could
  not create default EGL display: EGL_BAD_PARAMETER`).
  [fix-appimage-libs.sh](packaging/linux/fix-appimage-libs.sh) strips
  these specific libraries out and repacks the AppImage so the dynamic
  linker falls through to the host's own copies instead — this is why
  the script must run after every AppImage build, not just optionally.
