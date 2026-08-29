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
# Launcher wrapper for the Flow teleprompter on Linux.
#
# Flow is an always-on-top overlay: it needs absolute window positioning,
# always-on-top, and global hotkeys to work the way it does on Windows.
# Neither GTK3 nor the windowing toolkit Tauri uses on Linux (tao) support
# those under native Wayland, so this wrapper forces the app onto X11 via
# XWayland by default. Set FLOW_ALLOW_WAYLAND=1 to opt out and run under
# native Wayland instead (window positioning, always-on-top and global
# hotkeys will not work correctly in that mode).
#
# WEBKIT_DISABLE_DMABUF_RENDERER=1 works around the most common cause of a
# blank/black WebKitGTK window on Linux (DMA-BUF renderer issues, seen
# especially on some AMD/Mesa driver combinations). It is on by default;
# unset it explicitly if you have verified your system does not need it.

set -euo pipefail

if [[ -z "${FLOW_ALLOW_WAYLAND:-}" ]]; then
    export GDK_BACKEND=x11
fi

export WEBKIT_DISABLE_DMABUF_RENDERER="${WEBKIT_DISABLE_DMABUF_RENDERER:-1}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Installed layout: binary lives at /usr/lib/flow/flow next to this wrapper's
# install location (/usr/bin/flow). Development layout: fall back to the
# debug binary built by `cargo build` inside the repository.
if [[ -x "${SCRIPT_DIR}/../lib/flow/flow" ]]; then
    BINARY="${SCRIPT_DIR}/../lib/flow/flow"
elif [[ -x "${SCRIPT_DIR}/../../src-tauri/target/debug/flow" ]]; then
    BINARY="${SCRIPT_DIR}/../../src-tauri/target/debug/flow"
elif [[ -x "${SCRIPT_DIR}/../../src-tauri/target/release/flow" ]]; then
    BINARY="${SCRIPT_DIR}/../../src-tauri/target/release/flow"
else
    echo "flow-launcher.sh: could not locate the flow binary" >&2
    exit 1
fi

exec "${BINARY}" "$@"
