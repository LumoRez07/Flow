#!/usr/bin/env bash
#
# Flow - A high-performance teleprompter for Windows.
# Copyright (C) 2026 Waled Alturkmani (LumoRez07)
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Tauri's AppImage bundling (via linuxdeploy + linuxdeploy-plugin-gtk) pulls
# in the full GTK dependency chain, including Wayland/X11 protocol client
# libraries that must match the exact protocol/ABI version of whatever
# compositor or X server the AppImage actually runs against. Bundling them
# is a well-known linuxdeploy-plugin-gtk anti-pattern: the AppImage's own
# (older, build-host-vintage) copies get preferred over the running
# system's copies via RUNPATH, and a mismatch there causes WebKitGTK to
# fail EGL/GL context creation entirely ("Could not create default EGL
# display: EGL_BAD_PARAMETER. Aborting...") even though every other part
# of the app is fine.
#
# Verified by hand: building the AppImage on Ubuntu 22.04 (per the CI
# environment used to sidestep unrelated RELR-relocation/strip
# incompatibilities with newer distros) and running the result on an
# unrelated, much newer Arch Linux desktop reproduced the EGL failure
# every time these libraries were present, and fixed it every time they
# were removed and the AppImage was repacked, letting the dynamic linker
# fall through to the host's own (correct, matching) copies instead.
#
# Usage: fix-appimage-libs.sh <path/to/flow_*.AppImage>
# Rewrites the given AppImage in place.

set -euo pipefail

if [[ $# -ne 1 ]]; then
    echo "Usage: $0 <path/to/flow_*.AppImage>" >&2
    exit 1
fi

APPIMAGE_PATH="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"

# Libraries that must come from the host system, never be bundled: Wayland/
# X11/XCB client protocol libraries and their EGL glue. libxkbcommon is
# included because a mismatched keymap-compiler ABI causes similar (if
# rarer) failures.
LIBS_TO_REMOVE=(
    libwayland-client.so.0
    libwayland-server.so.0
    libwayland-egl.so.1
    libwayland-cursor.so.0
    libxcb-randr.so.0
    libxcb-render.so.0
    libxcb-shm.so.0
    libxkbcommon.so.0
)

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

echo "Extracting ${APPIMAGE_PATH}..."
cd "${WORK_DIR}"
APPIMAGE_EXTRACT_AND_RUN=1 "${APPIMAGE_PATH}" --appimage-extract >/dev/null

REMOVED_ANY=0
for lib in "${LIBS_TO_REMOVE[@]}"; do
    LIB_PATH="squashfs-root/usr/lib/${lib}"
    if [[ -f "${LIB_PATH}" ]]; then
        echo "Removing bundled ${lib} (must come from the host system)"
        rm -f "${LIB_PATH}"
        REMOVED_ANY=1
    fi
done

if [[ "${REMOVED_ANY}" -eq 0 ]]; then
    echo "No known-problematic libraries were bundled; nothing to do."
    exit 0
fi

echo "Repacking AppImage..."
LINUXDEPLOY_PLUGIN_APPIMAGE="${LINUXDEPLOY_PLUGIN_APPIMAGE:-${HOME}/.cache/tauri/linuxdeploy-plugin-appimage.AppImage}"
if [[ ! -x "${LINUXDEPLOY_PLUGIN_APPIMAGE}" ]]; then
    echo "linuxdeploy-plugin-appimage.AppImage not found at ${LINUXDEPLOY_PLUGIN_APPIMAGE}" >&2
    echo "(set LINUXDEPLOY_PLUGIN_APPIMAGE to override, or run a tauri appimage build once first so it gets cached)" >&2
    exit 1
fi

APPIMAGE_EXTRACT_AND_RUN=1 "${LINUXDEPLOY_PLUGIN_APPIMAGE}" --appdir=squashfs-root

REBUILT="$(find . -maxdepth 1 -name '*.AppImage' -not -path "$(basename "${APPIMAGE_PATH}")")"
if [[ -z "${REBUILT}" ]]; then
    echo "Repacking did not produce a new .AppImage file" >&2
    exit 1
fi

mv "${REBUILT}" "${APPIMAGE_PATH}"
chmod +x "${APPIMAGE_PATH}"
echo "Fixed AppImage written to ${APPIMAGE_PATH}"
