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
# Fetches the official prebuilt Vosk API shared library for Linux x86_64
# and stages it under src-tauri/resources/vosk/linux-x64/, so that
# src-tauri/build.rs can pick it up as a vendored fallback for packaged
# builds (AppImage/deb/rpm) that should not depend on a system-installed
# vosk-api package.
#
# The Vosk project stopped publishing prebuilt release assets after
# v0.3.45 (v0.3.50, the version Arch Linux's `vosk-api` package builds
# from source, has no binary release assets) - see
# https://github.com/alphacep/vosk-api/releases. v0.3.45 is therefore
# pinned deliberately, not because it is "latest".

set -euo pipefail

VOSK_VERSION="0.3.45"
ARCHIVE_NAME="vosk-linux-x86_64-${VOSK_VERSION}.zip"
DOWNLOAD_URL="https://github.com/alphacep/vosk-api/releases/download/v${VOSK_VERSION}/${ARCHIVE_NAME}"
# Verified by hand against the published GitHub release asset:
#   curl -sL "$DOWNLOAD_URL" | sha256sum
EXPECTED_SHA256="bbdc8ed85c43979f6443142889770ea95cbfbc56cffb5c5dcd73afa875c5fbb2"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DEST_DIR="${REPO_ROOT}/src-tauri/resources/vosk/linux-x64"
DEST_LIB="${DEST_DIR}/libvosk.so"

if [[ -f "${DEST_LIB}" ]]; then
    echo "libvosk.so already present at ${DEST_LIB}, skipping download."
    echo "Delete it and re-run this script to force a re-fetch."
    exit 0
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

ARCHIVE_PATH="${WORK_DIR}/${ARCHIVE_NAME}"

echo "Downloading Vosk API ${VOSK_VERSION} for linux-x86_64..."
curl -fL --retry 3 -o "${ARCHIVE_PATH}" "${DOWNLOAD_URL}"

echo "Verifying checksum..."
ACTUAL_SHA256="$(sha256sum "${ARCHIVE_PATH}" | cut -d' ' -f1)"
if [[ "${ACTUAL_SHA256}" != "${EXPECTED_SHA256}" ]]; then
    echo "ERROR: checksum mismatch for ${ARCHIVE_NAME}" >&2
    echo "  expected: ${EXPECTED_SHA256}" >&2
    echo "  actual:   ${ACTUAL_SHA256}" >&2
    exit 1
fi

echo "Extracting libvosk.so..."
unzip -q -j "${ARCHIVE_PATH}" "vosk-linux-x86_64-${VOSK_VERSION}/libvosk.so" -d "${WORK_DIR}"

mkdir -p "${DEST_DIR}"
mv "${WORK_DIR}/libvosk.so" "${DEST_LIB}"
chmod 0644 "${DEST_LIB}"

echo "Staged $(du -h "${DEST_LIB}" | cut -f1) libvosk.so at ${DEST_LIB}"
