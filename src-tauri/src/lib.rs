/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

use std::{
    collections::{HashMap, HashSet, VecDeque},
    env, fs,
    io::Cursor,
    net::{IpAddr, Ipv4Addr, SocketAddr, UdpSocket},
    path::{Path as FsPath, PathBuf},
    process::Command,
    sync::{Arc, Mutex},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use axum::{
    extract::{ConnectInfo, Path, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use flate2::read::GzDecoder;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tar::Archive;
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, LogicalSize, Manager, Size, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use tauri_plugin_prevent_default::Flags;
use tokio::io::AsyncWriteExt;
use uuid::Uuid;
use vosk::{set_log_level, LogLevel};
use zip::ZipArchive;

mod platform;
mod voice_engine;

#[cfg(windows)]
use windows::core::{HSTRING, PCWSTR};

#[cfg(windows)]
use winreg::{
    enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE},
    RegKey,
};

#[cfg(windows)]
use windows::Win32::System::Power::{
    SetThreadExecutionState, ES_CONTINUOUS, ES_DISPLAY_REQUIRED, ES_SYSTEM_REQUIRED,
};

#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{
    MessageBoxW, SetWindowDisplayAffinity, MB_ICONERROR, MB_OK, WDA_EXCLUDEFROMCAPTURE, WDA_NONE,
};

#[allow(dead_code)]
const REMOTE_RELAY_PORT: u16 = 43_127;
#[allow(dead_code)]
const HEARTBEAT_TTL: Duration = Duration::from_secs(35);
#[allow(dead_code)]
const RATE_LIMIT_WINDOW: Duration = Duration::from_secs(20);
#[allow(dead_code)]
const RATE_LIMIT_MAX_MESSAGES: usize = 3;
#[allow(dead_code)]
const MAX_PENDING_MESSAGES: usize = 24;
#[allow(dead_code)]
const MAX_MESSAGE_STATUS_HISTORY: usize = 64;
const VOICE_MODEL_DOWNLOAD_EVENT: &str = "flow-voice-model-download";
const APP_STATE_FILE_NAME: &str = "state.json";
const VOICE_MODEL_REGISTRY_FILE_NAME: &str = "voice-model-registry.json";
const SETTINGS_WINDOW_WIDTH: f64 = 620.0;
const SETTINGS_WINDOW_HEIGHT: f64 = 700.0;
const UPDATER_FEED_URL: &str =
    "https://github.com/LumoRez07/Flow/releases/latest/download/latest.json";
const WEBVIEW2_CONSUMER_DOWNLOAD_URL: &str =
    "https://developer.microsoft.com/microsoft-edge/webview2/consumer/";
#[cfg(windows)]
const WEBVIEW2_RUNTIME_CLIENT_ID: &str = "{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";
const BUNDLED_ENGLISH_VOSK_MODEL: &[u8] = include_bytes!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../src/assets/vosk-model-small-en-us-0.15.tar.gz"
));

#[derive(Debug, Serialize, Deserialize)]
struct UpdaterFeedMetadata {
    version: String,
    #[serde(rename = "publishedAt")]
    published_at: String,
    notes: String,
}

#[derive(Debug, Deserialize)]
struct RawUpdaterFeedMetadata {
    #[serde(default)]
    version: String,
    #[serde(default)]
    notes: String,
    #[serde(default, alias = "date")]
    pub_date: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum BundledVoiceArchiveKind {
    TarGz,
}

#[derive(Clone, Copy, Debug)]
pub(crate) struct VoiceModelSpec {
    model_id: &'static str,
    language: &'static str,
    label: &'static str,
    family: &'static str,
    archive_name: &'static str,
    install_dir_name: &'static str,
    download_url: &'static str,
    download_size_mb: u64,
    runtime_memory_mb: u64,
    license: &'static str,
    description: &'static str,
    recommended: bool,
    bundled_archive_kind: Option<BundledVoiceArchiveKind>,
}

const VOICE_MODEL_SPECS: [VoiceModelSpec; 26] = [
    VoiceModelSpec {
        model_id: "vosk-model-small-en-us-0.15",
        language: "en-US",
        label: "English",
        family: "Small",
        archive_name: "vosk-model-small-en-us-0.15.zip",
        install_dir_name: "vosk-model-small-en-us-0.15",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip",
        download_size_mb: 40,
        runtime_memory_mb: 300,
        license: "Apache 2.0",
        description: "Lightweight wideband model for desktop and mobile use.",
        recommended: true,
        bundled_archive_kind: Some(BundledVoiceArchiveKind::TarGz),
    },
    VoiceModelSpec {
        model_id: "vosk-model-en-us-0.22",
        language: "en-US",
        label: "English",
        family: "Large",
        archive_name: "vosk-model-en-us-0.22.zip",
        install_dir_name: "vosk-model-en-us-0.22",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip",
        download_size_mb: 1843,
        runtime_memory_mb: 16000,
        license: "Apache 2.0",
        description: "Accurate generic US English model.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-en-us-0.22-lgraph",
        language: "en-US",
        label: "English",
        family: "Medium LGraph",
        archive_name: "vosk-model-en-us-0.22-lgraph.zip",
        install_dir_name: "vosk-model-en-us-0.22-lgraph",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22-lgraph.zip",
        download_size_mb: 128,
        runtime_memory_mb: 900,
        license: "Apache 2.0",
        description: "English model with dynamic graph and lower memory use.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-en-us-0.42-gigaspeech",
        language: "en-US",
        label: "English",
        family: "Large GigaSpeech",
        archive_name: "vosk-model-en-us-0.42-gigaspeech.zip",
        install_dir_name: "vosk-model-en-us-0.42-gigaspeech",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-en-us-0.42-gigaspeech.zip",
        download_size_mb: 2355,
        runtime_memory_mb: 16000,
        license: "Apache 2.0",
        description: "Accurate English model tuned for podcasts and general speech.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-en-us-daanzu-20200905",
        language: "en-US",
        label: "English",
        family: "Dictation",
        archive_name: "vosk-model-en-us-daanzu-20200905.zip",
        install_dir_name: "vosk-model-en-us-daanzu-20200905",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-en-us-daanzu-20200905.zip",
        download_size_mb: 1024,
        runtime_memory_mb: 9000,
        license: "AGPL",
        description: "Large English dictation model from Kaldi Active Grammar.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-en-us-daanzu-20200905-lgraph",
        language: "en-US",
        label: "English",
        family: "Dictation LGraph",
        archive_name: "vosk-model-en-us-daanzu-20200905-lgraph.zip",
        install_dir_name: "vosk-model-en-us-daanzu-20200905-lgraph",
        download_url:
            "https://alphacephei.com/vosk/models/vosk-model-en-us-daanzu-20200905-lgraph.zip",
        download_size_mb: 129,
        runtime_memory_mb: 900,
        license: "AGPL",
        description: "Smaller dynamic-graph English dictation model.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-en-us-librispeech-0.2",
        language: "en-US",
        label: "English",
        family: "Librispeech",
        archive_name: "vosk-model-en-us-librispeech-0.2.zip",
        install_dir_name: "vosk-model-en-us-librispeech-0.2",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-en-us-librispeech-0.2.zip",
        download_size_mb: 845,
        runtime_memory_mb: 7000,
        license: "Apache 2.0",
        description: "English Librispeech model for research and testing.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-small-en-us-zamia-0.5",
        language: "en-US",
        label: "English",
        family: "Small Zamia",
        archive_name: "vosk-model-small-en-us-zamia-0.5.zip",
        install_dir_name: "vosk-model-small-en-us-zamia-0.5",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-small-en-us-zamia-0.5.zip",
        download_size_mb: 49,
        runtime_memory_mb: 340,
        license: "LGPL-3.0",
        description: "Small English research model repackaged from Zamia.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-en-us-aspire-0.2",
        language: "en-US",
        label: "English",
        family: "ASPIRE",
        archive_name: "vosk-model-en-us-aspire-0.2.zip",
        install_dir_name: "vosk-model-en-us-aspire-0.2",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-en-us-aspire-0.2.zip",
        download_size_mb: 1434,
        runtime_memory_mb: 12000,
        license: "Apache 2.0",
        description: "Older English ASPIRE model for experimentation.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-en-us-0.21",
        language: "en-US",
        label: "English",
        family: "Large Legacy",
        archive_name: "vosk-model-en-us-0.21.zip",
        install_dir_name: "vosk-model-en-us-0.21",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-en-us-0.21.zip",
        download_size_mb: 1638,
        runtime_memory_mb: 13000,
        license: "Apache 2.0",
        description: "Previous-generation large English model.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-small-tr-0.3",
        language: "tr-TR",
        label: "Turkish",
        family: "Small",
        archive_name: "vosk-model-small-tr-0.3.zip",
        install_dir_name: "vosk-model-small-tr-0.3",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-small-tr-0.3.zip",
        download_size_mb: 35,
        runtime_memory_mb: 300,
        license: "Apache 2.0",
        description: "Lightweight Turkish model for desktop and mobile use.",
        recommended: true,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-ar-mgb2-0.4",
        language: "ar-SA",
        label: "Arabic",
        family: "Medium",
        archive_name: "vosk-model-ar-mgb2-0.4.zip",
        install_dir_name: "vosk-model-ar-mgb2-0.4",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-ar-mgb2-0.4.zip",
        download_size_mb: 318,
        runtime_memory_mb: 2200,
        license: "Apache 2.0",
        description: "Arabic model trained on the MGB2 dataset.",
        recommended: true,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-ar-0.22-linto-1.1.0",
        language: "ar-SA",
        label: "Arabic",
        family: "Large LINTO",
        archive_name: "vosk-model-ar-0.22-linto-1.1.0.zip",
        install_dir_name: "vosk-model-ar-0.22-linto-1.1.0",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-ar-0.22-linto-1.1.0.zip",
        download_size_mb: 1331,
        runtime_memory_mb: 11000,
        license: "AGPL",
        description: "Large Arabic model from LINTO.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-small-de-0.15",
        language: "de-DE",
        label: "German",
        family: "Small",
        archive_name: "vosk-model-small-de-0.15.zip",
        install_dir_name: "vosk-model-small-de-0.15",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-small-de-0.15.zip",
        download_size_mb: 45,
        runtime_memory_mb: 320,
        license: "Apache 2.0",
        description: "Lightweight German model for desktop and mobile use.",
        recommended: true,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-de-0.21",
        language: "de-DE",
        label: "German",
        family: "Large",
        archive_name: "vosk-model-de-0.21.zip",
        install_dir_name: "vosk-model-de-0.21",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-de-0.21.zip",
        download_size_mb: 1946,
        runtime_memory_mb: 15000,
        license: "Apache 2.0",
        description: "Large German model for telephony and server workloads.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-de-tuda-0.6-900k",
        language: "de-DE",
        label: "German",
        family: "Tuda-DE",
        archive_name: "vosk-model-de-tuda-0.6-900k.zip",
        install_dir_name: "vosk-model-de-tuda-0.6-900k",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-de-tuda-0.6-900k.zip",
        download_size_mb: 4506,
        runtime_memory_mb: 16000,
        license: "Apache 2.0",
        description: "High-accuracy German model from the Tuda-DE project.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-small-de-zamia-0.3",
        language: "de-DE",
        label: "German",
        family: "Small Zamia",
        archive_name: "vosk-model-small-de-zamia-0.3.zip",
        install_dir_name: "vosk-model-small-de-zamia-0.3",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-small-de-zamia-0.3.zip",
        download_size_mb: 49,
        runtime_memory_mb: 340,
        license: "LGPL-3.0",
        description: "Small repackaged German model from Zamia.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-small-fr-0.22",
        language: "fr-FR",
        label: "French",
        family: "Small",
        archive_name: "vosk-model-small-fr-0.22.zip",
        install_dir_name: "vosk-model-small-fr-0.22",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip",
        download_size_mb: 41,
        runtime_memory_mb: 300,
        license: "Apache 2.0",
        description: "Lightweight French model for desktop and mobile use.",
        recommended: true,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-fr-0.22",
        language: "fr-FR",
        label: "French",
        family: "Large",
        archive_name: "vosk-model-fr-0.22.zip",
        install_dir_name: "vosk-model-fr-0.22",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-fr-0.22.zip",
        download_size_mb: 1434,
        runtime_memory_mb: 12000,
        license: "Apache 2.0",
        description: "Large accurate French model.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-small-fr-pguyot-0.3",
        language: "fr-FR",
        label: "French",
        family: "Small PGuyot",
        archive_name: "vosk-model-small-fr-pguyot-0.3.zip",
        install_dir_name: "vosk-model-small-fr-pguyot-0.3",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-small-fr-pguyot-0.3.zip",
        download_size_mb: 39,
        runtime_memory_mb: 300,
        license: "CC-BY-NC-SA 4.0",
        description: "Alternative small French model by Paul Guyot.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-fr-0.6-linto-2.2.0",
        language: "fr-FR",
        label: "French",
        family: "Large LINTO",
        archive_name: "vosk-model-fr-0.6-linto-2.2.0.zip",
        install_dir_name: "vosk-model-fr-0.6-linto-2.2.0",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-fr-0.6-linto-2.2.0.zip",
        download_size_mb: 1536,
        runtime_memory_mb: 12000,
        license: "AGPL",
        description: "Large French model from the LINTO project.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-small-es-0.42",
        language: "es-ES",
        label: "Spanish",
        family: "Small",
        archive_name: "vosk-model-small-es-0.42.zip",
        install_dir_name: "vosk-model-small-es-0.42",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip",
        download_size_mb: 39,
        runtime_memory_mb: 300,
        license: "Apache 2.0",
        description: "Lightweight Spanish model for desktop and mobile use.",
        recommended: true,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-es-0.42",
        language: "es-ES",
        label: "Spanish",
        family: "Large",
        archive_name: "vosk-model-es-0.42.zip",
        install_dir_name: "vosk-model-es-0.42",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-es-0.42.zip",
        download_size_mb: 1434,
        runtime_memory_mb: 12000,
        license: "Apache 2.0",
        description: "Large accurate Spanish model.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-small-pt-0.3",
        language: "pt-BR",
        label: "Portuguese",
        family: "Small",
        archive_name: "vosk-model-small-pt-0.3.zip",
        install_dir_name: "vosk-model-small-pt-0.3",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-small-pt-0.3.zip",
        download_size_mb: 31,
        runtime_memory_mb: 300,
        license: "Apache 2.0",
        description: "Lightweight Portuguese model for desktop and mobile use.",
        recommended: true,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-pt-fb-v0.1.1-20220516_2113",
        language: "pt-BR",
        label: "Portuguese",
        family: "Large",
        archive_name: "vosk-model-pt-fb-v0.1.1-20220516_2113.zip",
        install_dir_name: "vosk-model-pt-fb-v0.1.1-20220516_2113",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-pt-fb-v0.1.1-20220516_2113.zip",
        download_size_mb: 1638,
        runtime_memory_mb: 12000,
        license: "Apache 2.0",
        description: "Large accurate Portuguese model trained on Common Voice and VoxForge.",
        recommended: false,
        bundled_archive_kind: None,
    },
    VoiceModelSpec {
        model_id: "vosk-model-small-fi-0.22",
        language: "fi-FI",
        label: "Finnish",
        family: "Small",
        archive_name: "vosk-model-small-fi-0.22.zip",
        install_dir_name: "vosk-model-small-fi-0.22",
        download_url: "https://alphacephei.com/vosk/models/vosk-model-small-fi-0.22.zip",
        download_size_mb: 42,
        runtime_memory_mb: 300,
        license: "Apache 2.0",
        description: "Lightweight Finnish model for desktop and mobile use.",
        recommended: true,
        bundled_archive_kind: None,
    },
];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct PersistedAppDataPayload {
    state: serde_json::Value,
    voice_model_registry: serde_json::Value,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct RemoteMessage {
    id: String,
    title: String,
    content: String,
    importance: String,
    preview: String,
    created_at_ms: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct RemoteMessageReplyStatus {
    message_id: String,
    title: String,
    status: String,
    created_at_ms: u64,
    resolved_at_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct RemoteReceiverStatus {
    session_id: String,
    sender_url: String,
    public_sender_url: String,
    relay_port: u16,
    active: bool,
    auth_configured: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ImportedFilePayload {
    name: String,
    bytes: Vec<u8>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceModelStatus {
    model_id: String,
    language: String,
    label: String,
    family: String,
    download_size_mb: u64,
    runtime_memory_mb: u64,
    license: String,
    description: String,
    recommended: bool,
    bundled: bool,
    installed: bool,
    path: Option<String>,
    size_bytes: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct VoiceModelDownloadEvent {
    model_id: String,
    language: String,
    stage: String,
    label: String,
    downloaded_bytes: u64,
    total_bytes: Option<u64>,
    remaining_bytes: Option<u64>,
    speed_bytes_per_second: Option<f64>,
    path: Option<String>,
    message: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RemoteAccessRequest {
    access_password: String,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SendRemoteMessageRequest {
    title: String,
    content: String,
    importance: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ActiveReceiverResponse {
    active: bool,
}

#[allow(dead_code)]
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SenderApiResponse {
    ok: bool,
    message: String,
    active: bool,
    queued_message_id: Option<String>,
    retry_after_seconds: Option<u64>,
}

#[allow(dead_code)]
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RemoteMessageStatusResponse {
    ok: bool,
    message: String,
    active: bool,
    message_id: Option<String>,
    title: Option<String>,
    status: Option<String>,
    created_at_ms: Option<u64>,
    resolved_at_ms: Option<u64>,
}

#[derive(Debug, Clone, Default)]
struct RemoteAccessCredentials {
    public_host: String,
    access_password: String,
}

impl RemoteAccessCredentials {
    fn is_configured(&self) -> bool {
        !self.access_password.is_empty()
    }
}

#[derive(Debug, Clone)]
struct DesktopPreferences {
    hide_from_capture: bool,
    use_system_tray: bool,
    prevent_sleep: bool,
    clickthrough_shortcut_enabled: bool,
}

impl Default for DesktopPreferences {
    fn default() -> Self {
        Self {
            hide_from_capture: false,
            use_system_tray: true,
            prevent_sleep: false,
            clickthrough_shortcut_enabled: false,
        }
    }
}

#[derive(Debug, Default)]
struct DesktopState {
    preferences: Mutex<DesktopPreferences>,
    clickthrough_active: Mutex<bool>,
}

#[derive(Debug, Default)]
struct VoiceModelDownloads {
    active_models: Mutex<HashSet<String>>,
}

#[allow(dead_code)]
#[derive(Debug)]
struct ReceiverSession {
    last_seen: Instant,
    pending_messages: VecDeque<RemoteMessage>,
    message_statuses: VecDeque<RemoteMessageReplyStatus>,
    recent_attempts: VecDeque<Instant>,
    recent_by_ip: HashMap<String, VecDeque<Instant>>,
}

#[allow(dead_code)]
impl ReceiverSession {
    fn new() -> Self {
        Self {
            last_seen: Instant::now(),
            pending_messages: VecDeque::new(),
            message_statuses: VecDeque::new(),
            recent_attempts: VecDeque::new(),
            recent_by_ip: HashMap::new(),
        }
    }
}

#[allow(dead_code)]
#[derive(Debug)]
struct RemoteRelayInner {
    session_id: String,
    sender_url: String,
    sessions: Mutex<HashMap<String, ReceiverSession>>,
    credentials: Mutex<RemoteAccessCredentials>,
}

#[allow(dead_code)]
#[derive(Clone, Debug)]
struct RemoteRelay {
    inner: Arc<RemoteRelayInner>,
}

#[allow(dead_code)]
#[derive(Debug)]
enum QueueRemoteMessageError {
    SessionOffline,
    RateLimited,
    BadRequest(String),
}

#[allow(dead_code)]
#[derive(Debug)]
enum RemoteAccessError {
    SessionNotFound,
    AuthNotConfigured,
    MissingCredentials,
    InvalidCredentials,
}

#[allow(dead_code)]
impl RemoteRelay {
    fn new() -> Self {
        let relay = Self {
            inner: Arc::new(RemoteRelayInner {
                session_id: Uuid::new_v4().to_string(),
                sender_url: format!("http://{}:{}/sender", detect_local_ip(), REMOTE_RELAY_PORT),
                sessions: Mutex::new(HashMap::new()),
                credentials: Mutex::new(RemoteAccessCredentials::default()),
            }),
        };

        relay.ensure_current_session();
        relay
    }

    fn current_session_id(&self) -> String {
        self.inner.session_id.clone()
    }

    fn ensure_current_session(&self) {
        let session_id = self.current_session_id();
        let mut sessions = self
            .inner
            .sessions
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        sessions
            .entry(session_id)
            .or_insert_with(ReceiverSession::new);
    }

    fn current_status(&self) -> RemoteReceiverStatus {
        self.ensure_current_session();
        let credentials = self
            .inner
            .credentials
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .clone();

        RemoteReceiverStatus {
            session_id: self.current_session_id(),
            sender_url: self.inner.sender_url.clone(),
            public_sender_url: self.public_sender_url(&credentials),
            relay_port: REMOTE_RELAY_PORT,
            active: self.is_session_active(&self.current_session_id()),
            auth_configured: credentials.is_configured(),
        }
    }

    fn heartbeat_current_session(&self) -> RemoteReceiverStatus {
        self.ensure_current_session();

        let session_id = self.current_session_id();
        let mut sessions = self
            .inner
            .sessions
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        if let Some(session) = sessions.get_mut(&session_id) {
            session.last_seen = Instant::now();
        }

        let credentials = self
            .inner
            .credentials
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .clone();

        RemoteReceiverStatus {
            session_id,
            sender_url: self.inner.sender_url.clone(),
            public_sender_url: self.public_sender_url(&credentials),
            relay_port: REMOTE_RELAY_PORT,
            active: true,
            auth_configured: credentials.is_configured(),
        }
    }

    fn public_sender_url(&self, credentials: &RemoteAccessCredentials) -> String {
        if credentials.public_host.is_empty() {
            return self.inner.sender_url.clone();
        }

        format!(
            "http://{}:{}/sender",
            credentials.public_host, REMOTE_RELAY_PORT
        )
    }

    fn update_access(&self, public_host: String, access_password: String) -> RemoteReceiverStatus {
        let mut credentials = self
            .inner
            .credentials
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        credentials.public_host = truncate(strip_protocol(&public_host), 255);
        credentials.access_password = truncate(&access_password, 1024);
        drop(credentials);

        self.current_status()
    }

    fn authenticate_sender(
        &self,
        session_id: &str,
        access_password: &str,
    ) -> Result<bool, RemoteAccessError> {
        let sessions = self
            .inner
            .sessions
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        if !sessions.contains_key(session_id) {
            return Err(RemoteAccessError::SessionNotFound);
        }

        drop(sessions);

        let credentials = self
            .inner
            .credentials
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .clone();

        if !credentials.is_configured() {
            return Err(RemoteAccessError::AuthNotConfigured);
        }

        if access_password.trim().is_empty() {
            return Err(RemoteAccessError::MissingCredentials);
        }

        if credentials.access_password != access_password.trim() {
            return Err(RemoteAccessError::InvalidCredentials);
        }

        Ok(self.is_session_active(session_id))
    }

    fn is_session_active(&self, session_id: &str) -> bool {
        let sessions = self
            .inner
            .sessions
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        sessions
            .get(session_id)
            .map(|session| session.last_seen.elapsed() <= HEARTBEAT_TTL)
            .unwrap_or(false)
    }

    fn current_messages(&self) -> Vec<RemoteMessage> {
        self.ensure_current_session();

        let sessions = self
            .inner
            .sessions
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        sessions
            .get(&self.current_session_id())
            .map(|session| session.pending_messages.iter().cloned().collect())
            .unwrap_or_default()
    }

    fn current_message_status(
        &self,
        session_id: &str,
        message_id: &str,
    ) -> Option<RemoteMessageReplyStatus> {
        let sessions = self
            .inner
            .sessions
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        let session = sessions.get(session_id)?;

        if let Some(message) = session
            .pending_messages
            .iter()
            .find(|message| message.id == message_id)
        {
            return Some(build_remote_message_reply_status(message, "queued", None));
        }

        session
            .message_statuses
            .iter()
            .find(|status| status.message_id == message_id)
            .cloned()
    }

    fn resolve_current_message(&self, message_id: &str, action: &str) -> bool {
        self.ensure_current_session();

        let mut sessions = self
            .inner
            .sessions
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        let current_session_id = self.current_session_id();

        let Some(session) = sessions.get_mut(&current_session_id) else {
            return false;
        };

        let Some(index) = session
            .pending_messages
            .iter()
            .position(|message| message.id == message_id)
        else {
            return false;
        };

        let Some(message) = session.pending_messages.remove(index) else {
            return false;
        };

        upsert_remote_message_reply_status(
            session,
            build_remote_message_reply_status(
                &message,
                normalize_remote_message_resolution(action),
                Some(now_unix_ms()),
            ),
        );

        true
    }

    fn queue_message(
        &self,
        session_id: &str,
        payload: SendRemoteMessageRequest,
        sender_ip: Option<IpAddr>,
    ) -> Result<RemoteMessage, QueueRemoteMessageError> {
        let title = payload.title.trim();
        let content = payload.content.trim();

        if title.is_empty() {
            return Err(QueueRemoteMessageError::BadRequest(
                "Title is required.".into(),
            ));
        }

        if content.is_empty() {
            return Err(QueueRemoteMessageError::BadRequest(
                "Content is required.".into(),
            ));
        }

        let mut sessions = self
            .inner
            .sessions
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        let Some(session) = sessions.get_mut(session_id) else {
            return Err(QueueRemoteMessageError::SessionOffline);
        };

        if session.last_seen.elapsed() > HEARTBEAT_TTL {
            return Err(QueueRemoteMessageError::SessionOffline);
        }

        prune_attempts(&mut session.recent_attempts);
        if session.recent_attempts.len() >= RATE_LIMIT_MAX_MESSAGES {
            return Err(QueueRemoteMessageError::RateLimited);
        }

        if let Some(ip) = sender_ip {
            let per_ip_queue = session.recent_by_ip.entry(ip.to_string()).or_default();
            prune_attempts(per_ip_queue);

            if per_ip_queue.len() >= RATE_LIMIT_MAX_MESSAGES {
                return Err(QueueRemoteMessageError::RateLimited);
            }

            per_ip_queue.push_back(Instant::now());
        }

        session.recent_attempts.push_back(Instant::now());

        while session.pending_messages.len() >= MAX_PENDING_MESSAGES {
            session.pending_messages.pop_front();
        }

        let message = RemoteMessage {
            id: Uuid::new_v4().to_string(),
            title: truncate(title, 80),
            content: truncate(content, 8_000),
            importance: normalize_importance(payload.importance.as_deref()),
            preview: create_preview(content),
            created_at_ms: now_unix_ms(),
        };

        session.pending_messages.push_back(message.clone());
        upsert_remote_message_reply_status(
            session,
            build_remote_message_reply_status(&message, "queued", None),
        );
        Ok(message)
    }
}

#[allow(dead_code)]
fn build_remote_message_reply_status(
    message: &RemoteMessage,
    status: &str,
    resolved_at_ms: Option<u64>,
) -> RemoteMessageReplyStatus {
    RemoteMessageReplyStatus {
        message_id: message.id.clone(),
        title: message.title.clone(),
        status: status.to_string(),
        created_at_ms: message.created_at_ms,
        resolved_at_ms,
    }
}

#[allow(dead_code)]
fn upsert_remote_message_reply_status(
    session: &mut ReceiverSession,
    status: RemoteMessageReplyStatus,
) {
    if let Some(existing) = session
        .message_statuses
        .iter_mut()
        .find(|entry| entry.message_id == status.message_id)
    {
        *existing = status;
    } else {
        session.message_statuses.push_back(status);
        while session.message_statuses.len() > MAX_MESSAGE_STATUS_HISTORY {
            session.message_statuses.pop_front();
        }
    }
}

#[allow(dead_code)]
fn normalize_remote_message_resolution(action: &str) -> &'static str {
    match action {
        "accept" => "accepted",
        "deny" => "denied",
        _ => "queued",
    }
}

#[cfg(windows)]
fn apply_capture_protection(window: &tauri::WebviewWindow, enabled: bool) {
    if let Ok(hwnd) = window.hwnd() {
        let affinity = if enabled {
            WDA_EXCLUDEFROMCAPTURE
        } else {
            WDA_NONE
        };
        let _ = unsafe { SetWindowDisplayAffinity(hwnd, affinity) };
    }
}

#[cfg(not(windows))]
fn apply_capture_protection(_window: &tauri::WebviewWindow, _enabled: bool) {}

#[cfg(windows)]
fn set_sleep_prevention(enabled: bool) {
    let flags = if enabled {
        ES_CONTINUOUS | ES_DISPLAY_REQUIRED | ES_SYSTEM_REQUIRED
    } else {
        ES_CONTINUOUS
    };

    let _ = unsafe { SetThreadExecutionState(flags) };
}

#[cfg(target_os = "linux")]
fn set_sleep_prevention(enabled: bool) {
    platform::set_sleep_prevention(enabled);
}

#[cfg(all(not(windows), not(target_os = "linux")))]
fn set_sleep_prevention(_enabled: bool) {}

fn load_dev_tray_icon() -> tauri::Result<Image<'static>> {
    #[cfg(debug_assertions)]
    {
        let icon_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("icons")
            .join("icon.ico");
        if icon_path.exists() {
            return Image::from_path(icon_path).map(|image| image.to_owned());
        }
    }

    Err(tauri::Error::AssetNotFound("dev tray icon missing".into()))
}

#[cfg(windows)]
fn show_startup_error_dialog(message: &str) {
    let text = HSTRING::from(message);
    let title = HSTRING::from("Flow startup error");

    let _ = unsafe {
        MessageBoxW(
            None,
            PCWSTR(text.as_ptr()),
            PCWSTR(title.as_ptr()),
            MB_OK | MB_ICONERROR,
        )
    };
}

#[cfg(target_os = "linux")]
fn show_startup_error_dialog(message: &str) {
    platform::show_startup_error_dialog(message);
}

#[cfg(all(not(windows), not(target_os = "linux")))]
fn show_startup_error_dialog(_message: &str) {}

#[cfg(windows)]
fn is_valid_webview2_version(version: &str) -> bool {
    let trimmed = version.trim();
    !trimmed.is_empty()
        && trimmed != "0.0.0.0"
        && trimmed.split('.').all(|segment| {
            !segment.is_empty() && segment.chars().all(|character| character.is_ascii_digit())
        })
}

#[cfg(windows)]
fn webview2_runtime_binary_exists(version: &str) -> bool {
    let relative_path = [
        "Microsoft",
        "EdgeWebView",
        "Application",
        version,
        "msedgewebview2.exe",
    ];
    let candidate_roots = [
        env::var_os("LOCALAPPDATA"),
        env::var_os("ProgramFiles(x86)"),
        env::var_os("ProgramFiles"),
    ];

    candidate_roots.into_iter().flatten().any(|root| {
        let mut path = PathBuf::from(root);
        for segment in relative_path {
            path.push(segment);
        }
        path.is_file()
    })
}

#[cfg(windows)]
fn find_webview2_runtime_version() -> Option<String> {
    let subkeys = [
        (
            HKEY_CURRENT_USER,
            format!(
                r"SOFTWARE\Microsoft\EdgeUpdate\Clients\{}",
                WEBVIEW2_RUNTIME_CLIENT_ID
            ),
        ),
        (
            HKEY_LOCAL_MACHINE,
            format!(
                r"SOFTWARE\Microsoft\EdgeUpdate\Clients\{}",
                WEBVIEW2_RUNTIME_CLIENT_ID
            ),
        ),
        (
            HKEY_LOCAL_MACHINE,
            format!(
                r"SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{}",
                WEBVIEW2_RUNTIME_CLIENT_ID
            ),
        ),
    ];

    subkeys.iter().find_map(|(hive, path)| {
        let key = RegKey::predef(*hive).open_subkey(path).ok()?;
        let version: String = key.get_value("pv").ok()?;
        (is_valid_webview2_version(&version) && webview2_runtime_binary_exists(&version))
            .then_some(version)
    })
}

#[cfg(windows)]
fn open_webview2_download_page() {
    let _ = Command::new("explorer.exe")
        .arg(WEBVIEW2_CONSUMER_DOWNLOAD_URL)
        .spawn();
}

#[cfg(not(windows))]
fn open_webview2_download_page() {}

#[cfg(windows)]
fn ensure_webview2_runtime_available() -> bool {
    if find_webview2_runtime_version().is_some() {
        return true;
    }

    show_startup_error_dialog(
        "Flow requires the Microsoft Edge WebView2 Runtime to start, but it does not appear to be installed correctly on this PC.\n\nClick OK to open Microsoft's official WebView2 Runtime download page. After installing it, launch Flow again.",
    );
    open_webview2_download_page();
    false
}

#[cfg(not(windows))]
fn ensure_webview2_runtime_available() -> bool {
    true
}

#[cfg(target_os = "linux")]
fn format_startup_error_message(error: &tauri::Error) -> String {
    format!(
        concat!(
            "Flow could not start the desktop runtime.\n\n",
            "Common causes on Linux:\n",
            "- The WebKitGTK runtime (webkit2gtk-4.1) is missing or too old.\n",
            "- A GPU/driver DMA-BUF rendering issue is blocking the embedded webview \n",
            "  (try relaunching with WEBKIT_DISABLE_DMABUF_RENDERER=1).\n",
            "- The user profile or app data location (~/.local/share) is unavailable.\n\n",
            "Install webkit2gtk-4.1 via your distribution's package manager, then try again.\n\n",
            "Technical details:\n{}"
        ),
        error
    )
}

#[cfg(not(target_os = "linux"))]
fn format_startup_error_message(error: &tauri::Error) -> String {
    format!(
        concat!(
            "Flow could not start the desktop runtime.\n\n",
            "Common causes on Windows:\n",
            "- Microsoft Edge WebView2 Runtime is missing, outdated, or blocked by Group Policy.\n",
            "- Security software prevented the embedded webview from starting.\n",
            "- The user profile or app data location is unavailable.\n\n",
            "Install or repair the Evergreen WebView2 Runtime, then try again.\n\n",
            "Technical details:\n{}"
        ),
        error
    )
}

fn log_backend_error(context: &str, error: &dyn std::fmt::Display) {
    eprintln!("[flow-backend] {context}: {error}");
}

fn remove_existing_path(path: &FsPath) -> Result<(), String> {
    if !path.exists() {
        return Ok(());
    }

    if path.is_dir() {
        fs::remove_dir_all(path).map_err(|error| error.to_string())
    } else {
        fs::remove_file(path).map_err(|error| error.to_string())
    }
}

fn backup_path_for(target: &FsPath) -> PathBuf {
    let mut file_name = target
        .file_name()
        .map(|name| name.to_os_string())
        .unwrap_or_else(|| "flow-backup".into());
    file_name.push(".bak");
    target.with_file_name(file_name)
}

fn replace_path_from_temp(temp_path: &FsPath, final_path: &FsPath) -> Result<(), String> {
    let backup_path = backup_path_for(final_path);
    remove_existing_path(&backup_path)?;

    let had_original = final_path.exists();
    if had_original {
        fs::rename(final_path, &backup_path).map_err(|error| error.to_string())?;
    }

    match fs::rename(temp_path, final_path) {
        Ok(()) => {
            if had_original {
                remove_existing_path(&backup_path)?;
            }
            Ok(())
        }
        Err(error) => {
            if had_original && backup_path.exists() {
                let _ = fs::rename(&backup_path, final_path);
            }
            Err(error.to_string())
        }
    }
}

fn install_dpi_scale_guard(window: &WebviewWindow) {
    let guarded_window = window.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::ScaleFactorChanged { scale_factor, .. } = event {
            let Ok(current_physical_size) = guarded_window.inner_size() else {
                return;
            };

            let logical_size = current_physical_size.to_logical::<f64>(*scale_factor);
            let _ = guarded_window.set_size(Size::Logical(LogicalSize::new(
                logical_size.width,
                logical_size.height,
            )));
        }
    });
}

fn ensure_window(
    app: &tauri::AppHandle,
    label: &str,
    title: &str,
    path: &str,
    width: f64,
    height: f64,
) -> tauri::Result<()> {
    if app.get_webview_window(label).is_some() {
        return Ok(());
    }

    let mut builder = WebviewWindowBuilder::new(app, label, WebviewUrl::App(path.into()))
        .title(title)
        .inner_size(width, height)
        .visible(false)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .resizable(false)
        .skip_taskbar(true)
        .always_on_top(true)
        .center();

    if label == "remote-inbox" {
        if let Some(main) = app.get_webview_window("main") {
            // `owner()` is Windows-only in Tauri; `parent()` is the cross-platform
            // equivalent (GTK `set_transient_for` on Linux, child window on macOS).
            #[cfg(windows)]
            {
                builder = builder.owner(&main)?;
            }
            #[cfg(not(windows))]
            {
                builder = builder.parent(&main)?;
            }
        }
    }

    let window = builder.build()?;
    install_dpi_scale_guard(&window);

    let capture_enabled = app
        .try_state::<DesktopState>()
        .map(|desktop| current_desktop_preferences(&desktop).hide_from_capture)
        .unwrap_or(false);
    apply_capture_protection(&window, capture_enabled);

    let app_handle = app.clone();
    let win_label = label.to_string();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::Focused(true) = event {
            promote_active_window(&app_handle, &win_label);
        }
    });

    Ok(())
}

fn ensure_aux_window(app: &tauri::AppHandle, kind: &str) -> Result<&'static str, String> {
    let (label, title, path, width, height) = match kind {
        "input" => ("input", "Flow Text", "input.html", 860.0, 860.0),
        "settings" => (
            "settings",
            "Flow Settings",
            "settings.html",
            SETTINGS_WINDOW_WIDTH,
            SETTINGS_WINDOW_HEIGHT,
        ),
        "about" => ("about", "About Flow", "about.html", 520.0, 420.0),
        "remote-inbox" => (
            "remote-inbox",
            "Flow Notifications",
            "remote-inbox.html",
            260.0,
            96.0,
        ),
        _ => return Err("Unknown window type".into()),
    };

    ensure_window(app, label, title, path, width, height).map_err(|error| error.to_string())?;

    Ok(label)
}

fn set_main_always_on_top(app: &tauri::AppHandle, value: bool) {
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.set_always_on_top(value);
    }
}

fn current_desktop_preferences(desktop: &tauri::State<DesktopState>) -> DesktopPreferences {
    desktop
        .preferences
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
        .clone()
}

fn apply_capture_protection_to_windows(app: &tauri::AppHandle, enabled: bool) {
    for label in ["main", "input", "settings", "about", "remote-inbox"] {
        if let Some(window) = app.get_webview_window(label) {
            apply_capture_protection(&window, enabled);
        }
    }
}

fn ensure_tray_icon(app: &tauri::AppHandle) -> tauri::Result<()> {
    if app.tray_by_id("flow-tray").is_some() {
        return Ok(());
    }

    let show_item = MenuItemBuilder::with_id("show_main", "Show").build(app)?;
    let hide_item = MenuItemBuilder::with_id("hide_main", "Hide").build(app)?;
    let settings_item = MenuItemBuilder::with_id("open_settings", "Open Settings").build(app)?;
    let text_item = MenuItemBuilder::with_id("open_input", "Open Text Editor").build(app)?;
    let about_item = MenuItemBuilder::with_id("open_about", "About").build(app)?;
    let close_item = MenuItemBuilder::with_id("close_app", "Close").build(app)?;

    let menu = MenuBuilder::new(app)
        .items(&[
            &show_item,
            &hide_item,
            &text_item,
            &settings_item,
            &about_item,
            &close_item,
        ])
        .build()?;

    let icon = load_dev_tray_icon().or_else(|_| {
        app.default_window_icon()
            .cloned()
            .ok_or_else(|| tauri::Error::AssetNotFound("default tray icon missing".into()))
    })?;

    TrayIconBuilder::with_id("flow-tray")
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show_main" => {
                show_main_window(app);
            }
            "hide_main" => {
                hide_main_window_impl(app);
            }
            "open_input" => {
                show_window(app, "input");
            }
            "open_settings" => {
                show_window(app, "settings");
            }
            "open_about" => {
                show_window(app, "about");
            }
            "close_app" => exit_app(app),
            _ => {}
        })
        .build(app)?;

    Ok(())
}

fn remove_tray_icon(app: &tauri::AppHandle) {
    let _ = app.remove_tray_by_id("flow-tray");
}

fn exit_app(app: &tauri::AppHandle) {
    remove_tray_icon(app);
    app.exit(0);
}

fn center_aux_window_on_active_monitor(window: &WebviewWindow, anchor: &WebviewWindow) {
    if let Ok(Some(monitor)) = anchor.current_monitor() {
        if let Ok(window_size) = window.outer_size() {
            let monitor_pos = monitor.position();
            let monitor_size = monitor.size();
            let x = monitor_pos.x + ((monitor_size.width as i32 - window_size.width as i32) / 2).max(0);
            let y = monitor_pos.y + ((monitor_size.height as i32 - window_size.height as i32) / 2).max(0);
            let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }));
            return;
        }
    }
    let _ = window.center();
}

fn promote_active_window(app: &tauri::AppHandle, active_label: &str) {
    if active_label == "main" {
        let has_visible_aux = ["input", "settings", "about"]
            .iter()
            .any(|aux| {
                app.get_webview_window(aux)
                    .and_then(|w| w.is_visible().ok())
                    .unwrap_or(false)
            });
        if !has_visible_aux {
            set_main_always_on_top(app, true);
        } else {
            set_main_always_on_top(app, false);
        }
    } else {
        // Demote main teleprompter
        set_main_always_on_top(app, false);

        // Demote all other aux windows
        for other_aux in ["input", "settings", "about", "remote-inbox"] {
            if other_aux != active_label {
                if let Some(other_win) = app.get_webview_window(other_aux) {
                    let _ = other_win.set_always_on_top(false);
                }
            }
        }

        // Promote the active aux window to always_on_top
        if let Some(active_win) = app.get_webview_window(active_label) {
            let _ = active_win.set_always_on_top(true);
        }
    }
}

fn show_aux_window_impl(app: &tauri::AppHandle, label: &str) -> Result<(), String> {
    if let Some(desktop) = app.try_state::<DesktopState>() {
        let _ = set_clickthrough_impl(app, &desktop, false);
    }

    let window = app
        .get_webview_window(label)
        .ok_or_else(|| format!("Window '{label}' was not created"))?;

    if label != "remote-inbox" {
        if let Some(main) = app.get_webview_window("main") {
            center_aux_window_on_active_monitor(&window, &main);
        } else {
            let _ = window.center();
        }
    }

    window.show().map_err(|error| error.to_string())?;
    promote_active_window(app, label);
    window.set_focus().map_err(|error| error.to_string())?;

    Ok(())
}

fn hide_aux_window_impl(app: &tauri::AppHandle, label: &str) -> Result<(), String> {
    let window = app
        .get_webview_window(label)
        .ok_or_else(|| format!("Window '{label}' was not created"))?;

    let _ = window.set_always_on_top(false);
    window.hide().map_err(|error| error.to_string())?;

    let mut remaining_aux_window: Option<String> = None;
    for other_label in ["input", "settings", "about"] {
        if other_label != label {
            if let Some(other_win) = app.get_webview_window(other_label) {
                if let Ok(true) = other_win.is_visible() {
                    remaining_aux_window = Some(other_label.to_string());
                    break;
                }
            }
        }
    }

    if let Some(other_label) = remaining_aux_window {
        promote_active_window(app, &other_label);
        if let Some(other_win) = app.get_webview_window(&other_label) {
            let _ = other_win.set_focus();
        }
    } else {
        set_main_always_on_top(app, true);
    }

    Ok(())
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(desktop) = app.try_state::<DesktopState>() {
        let _ = set_clickthrough_impl(app, &desktop, false);
    }

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("flow-reveal-main-window", ());
        let _ = window.show();
        promote_active_window(app, "main");
        let _ = window.set_focus();
    }
}

fn hide_main_window_impl(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

fn set_tray_enabled_impl(app: &tauri::AppHandle, enabled: bool) -> Result<(), String> {
    if let Some(main) = app.get_webview_window("main") {
        main.set_skip_taskbar(enabled)
            .map_err(|error| error.to_string())?;
    }

    if enabled {
        ensure_tray_icon(app).map_err(|error| error.to_string())?;
    } else {
        remove_tray_icon(app);
    }

    Ok(())
}

fn set_clickthrough_impl(
    app: &tauri::AppHandle,
    desktop: &tauri::State<DesktopState>,
    enabled: bool,
) -> Result<bool, String> {
    let main = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window was not found".to_string())?;

    main.set_ignore_cursor_events(enabled)
        .map_err(|error| error.to_string())?;

    let mut clickthrough_active = desktop
        .clickthrough_active
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    *clickthrough_active = enabled;

    let _ = app.emit("flow-clickthrough-changed", enabled);

    Ok(enabled)
}

fn toggle_clickthrough_impl(
    app: &tauri::AppHandle,
    desktop: &tauri::State<DesktopState>,
) -> Result<bool, String> {
    let current = *desktop
        .clickthrough_active
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    set_clickthrough_impl(app, desktop, !current)
}

/// Lets a user on native Wayland (where global hotkeys can't be grabbed by
/// the app itself, see `platform::session_type`) bind desktop-environment
/// shortcuts to launching `flow --toggle-clickthrough` / `--show` / `--hide`.
/// The single-instance plugin forwards the second invocation's argv here
/// instead of starting a second app instance.
#[cfg(unix)]
fn handle_secondary_instance_cli_args(app: &tauri::AppHandle, argv: &[String]) {
    let Some(desktop) = app.try_state::<DesktopState>() else {
        return;
    };

    for arg in argv.iter().skip(1) {
        match arg.as_str() {
            "--toggle-clickthrough" => {
                let _ = toggle_clickthrough_impl(app, &desktop);
            }
            "--show" => show_main_window(app),
            "--hide" => hide_main_window_impl(app),
            _ => {}
        }
    }
}

#[tauri::command]
fn close_app(app: tauri::AppHandle) {
    exit_app(&app);
}

#[tauri::command]
fn hide_main_window(app: tauri::AppHandle) {
    hide_main_window_impl(&app);
}

#[tauri::command]
fn show_main_window_command(app: tauri::AppHandle) {
    show_main_window(&app);
}

#[tauri::command]
fn set_capture_protection(
    app: tauri::AppHandle,
    desktop: tauri::State<DesktopState>,
    enabled: bool,
) {
    {
        let mut preferences = desktop
            .preferences
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        preferences.hide_from_capture = enabled;
    }

    apply_capture_protection_to_windows(&app, enabled);
}

#[tauri::command]
fn set_system_tray_enabled(
    app: tauri::AppHandle,
    desktop: tauri::State<DesktopState>,
    enabled: bool,
) -> Result<(), String> {
    {
        let mut preferences = desktop
            .preferences
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        preferences.use_system_tray = enabled;
    }

    set_tray_enabled_impl(&app, enabled)
}

#[tauri::command]
fn set_prevent_sleep(desktop: tauri::State<DesktopState>, enabled: bool) {
    {
        let mut preferences = desktop
            .preferences
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        preferences.prevent_sleep = enabled;
    }

    set_sleep_prevention(enabled);
}

#[tauri::command]
fn set_clickthrough_shortcut_enabled(desktop: tauri::State<DesktopState>, enabled: bool) {
    let mut preferences = desktop
        .preferences
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    preferences.clickthrough_shortcut_enabled = enabled;
}

#[tauri::command]
fn set_main_clickthrough(
    app: tauri::AppHandle,
    desktop: tauri::State<DesktopState>,
    enabled: bool,
) -> Result<bool, String> {
    set_clickthrough_impl(&app, &desktop, enabled)
}

#[tauri::command]
fn toggle_main_clickthrough(
    app: tauri::AppHandle,
    desktop: tauri::State<DesktopState>,
) -> Result<bool, String> {
    toggle_clickthrough_impl(&app, &desktop)
}

#[tauri::command]
fn open_aux_window(
    app: tauri::AppHandle,
    desktop: tauri::State<DesktopState>,
    kind: String,
) -> Result<(), String> {
    let label = ensure_aux_window(&app, &kind)?;

    let _ = set_clickthrough_impl(&app, &desktop, false);
    show_aux_window_impl(&app, label)
}

#[tauri::command]
fn hide_aux_window(app: tauri::AppHandle, kind: String) -> Result<(), String> {
    let label = ensure_aux_window(&app, &kind)?;
    hide_aux_window_impl(&app, label)
}

#[tauri::command]
fn sync_remote_inbox_window(app: tauri::AppHandle, has_messages: bool) -> Result<(), String> {
    if has_messages {
        let label = ensure_aux_window(&app, "remote-inbox")?;
        let window = app
            .get_webview_window(label)
            .ok_or_else(|| format!("Window '{label}' was not created"))?;

        let is_visible = window.is_visible().map_err(|error| error.to_string())?;

        if !is_visible {
            window
                .set_always_on_top(true)
                .map_err(|error| error.to_string())?;
            window.show().map_err(|error| error.to_string())?;
        }

        window.set_focus().map_err(|error| error.to_string())?;
        return Ok(());
    }

    if let Some(window) = app.get_webview_window("remote-inbox") {
        window.close().map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn get_remote_receiver_status(relay: tauri::State<RemoteRelay>) -> RemoteReceiverStatus {
    relay.current_status()
}

#[tauri::command]
fn configure_remote_receiver_access(
    relay: tauri::State<RemoteRelay>,
    public_host: String,
    access_password: String,
) -> RemoteReceiverStatus {
    relay.update_access(public_host, access_password)
}

#[tauri::command]
fn remote_receiver_heartbeat(relay: tauri::State<RemoteRelay>) -> RemoteReceiverStatus {
    relay.heartbeat_current_session()
}

#[tauri::command]
fn list_remote_messages(relay: tauri::State<RemoteRelay>) -> Vec<RemoteMessage> {
    relay.current_messages()
}

#[tauri::command]
fn resolve_remote_message(
    relay: tauri::State<RemoteRelay>,
    message_id: String,
    action: String,
) -> Result<bool, String> {
    match action.as_str() {
        "accept" | "deny" => Ok(relay.resolve_current_message(&message_id, &action)),
        _ => Err("Unknown message action".into()),
    }
}

#[tauri::command]
fn list_voice_models(app: tauri::AppHandle) -> Result<Vec<VoiceModelStatus>, String> {
    VOICE_MODEL_SPECS
        .iter()
        .map(|spec| build_voice_model_status(&app, spec))
        .collect()
}

#[tauri::command]
fn get_voice_model_status(
    app: tauri::AppHandle,
    language: String,
    model_id: Option<String>,
) -> Result<VoiceModelStatus, String> {
    let spec = get_voice_model_spec(&language, model_id.as_deref())
        .ok_or_else(|| "Unsupported voice language or model".to_string())?;
    build_voice_model_status(&app, spec)
}

#[tauri::command]
async fn fetch_updater_feed_metadata() -> Result<UpdaterFeedMetadata, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|error| error.to_string())?;

    let response_text = client
        .get(UPDATER_FEED_URL)
        .header(reqwest::header::ACCEPT, "application/json")
        .send()
        .await
        .map_err(|error| error.to_string())?
        .error_for_status()
        .map_err(|error| error.to_string())?
        .text()
        .await
        .map_err(|error| error.to_string())?;

    let payload = serde_json::from_str::<RawUpdaterFeedMetadata>(&response_text)
        .map_err(|error| error.to_string())?;

    Ok(UpdaterFeedMetadata {
        version: payload.version.trim().to_string(),
        published_at: payload.pub_date.trim().to_string(),
        notes: payload.notes.trim().to_string(),
    })
}

#[tauri::command]
fn get_distribution_channel() -> String {
    option_env!("FLOW_DISTRIBUTION_CHANNEL")
        .unwrap_or("public")
        .to_string()
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct PlatformCapabilities {
    os: &'static str,
    session: String,
    capture_protection: bool,
    global_shortcuts: bool,
    always_on_top: bool,
    window_positioning: bool,
    in_app_updater: bool,
    package_source: String,
}

#[cfg(target_os = "linux")]
fn platform_session_type() -> String {
    platform::session_type()
}

#[cfg(not(target_os = "linux"))]
fn platform_session_type() -> String {
    "unknown".to_string()
}

#[cfg(target_os = "linux")]
fn platform_package_source() -> String {
    option_env!("FLOW_LINUX_PACKAGE")
        .unwrap_or("unknown")
        .to_string()
}

#[cfg(not(target_os = "linux"))]
fn platform_package_source() -> String {
    "unknown".to_string()
}

#[tauri::command]
fn get_platform_capabilities() -> PlatformCapabilities {
    let session = platform_session_type();
    let package_source = platform_package_source();

    // On Linux, always-on-top / absolute positioning / global shortcuts all
    // rely on the same thing: an X11 server tao/global-hotkey can talk to.
    // That's present under X11 and under XWayland, but not under native
    // Wayland (see plan.md E2 and Task 3.6's verification).
    let has_x11_window_management = cfg!(target_os = "linux").then(|| session == "x11").unwrap_or(true);

    PlatformCapabilities {
        os: if cfg!(target_os = "windows") {
            "windows"
        } else if cfg!(target_os = "linux") {
            "linux"
        } else if cfg!(target_os = "macos") {
            "macos"
        } else {
            "unknown"
        },
        session,
        capture_protection: cfg!(windows),
        global_shortcuts: has_x11_window_management,
        always_on_top: has_x11_window_management,
        window_positioning: has_x11_window_management,
        in_app_updater: cfg!(windows) || package_source == "appimage",
        package_source,
    }
}

#[tauri::command]
async fn download_voice_model(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    downloads: tauri::State<'_, VoiceModelDownloads>,
    language: String,
    model_id: Option<String>,
) -> Result<VoiceModelStatus, String> {
    let spec = get_voice_model_spec(&language, model_id.as_deref())
        .ok_or_else(|| "Unsupported voice language or model".to_string())?;
    let model_key = format!("{}::{}", spec.language, spec.model_id);

    {
        let mut active = downloads
            .active_models
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        if active.contains(&model_key) {
            return Err("That voice model is already downloading".into());
        }

        active.insert(model_key.clone());
    }

    let result: Result<VoiceModelStatus, String> = async {
        let final_dir = voice_model_install_dir(&app, spec)?;
        if is_installed_voice_model_dir(&final_dir) || spec.bundled_archive_kind.is_some() {
            let status = build_voice_model_status(&app, spec)?;
            emit_voice_model_download_event(
                &window,
                VoiceModelDownloadEvent {
                    model_id: spec.model_id.to_string(),
                    language: spec.language.to_string(),
                    stage: "completed".into(),
                    label: spec.label.to_string(),
                    downloaded_bytes: status.size_bytes,
                    total_bytes: Some(status.size_bytes),
                    remaining_bytes: Some(0),
                    speed_bytes_per_second: None,
                    path: status.path.clone(),
                    message: Some("Voice model already installed".into()),
                },
            );
            return Ok(status);
        }

        let final_path = voice_model_archive_path(&app, spec)?;
        let temp_path = final_path.with_extension("download");
        if temp_path.exists() {
            fs::remove_file(&temp_path).map_err(|error| error.to_string())?;
        }

        let client = reqwest::Client::new();
        let response = client
            .get(spec.download_url)
            .send()
            .await
            .map_err(|error| error.to_string())?
            .error_for_status()
            .map_err(|error| error.to_string())?;

        let total_bytes = response.content_length();
        let mut stream = response.bytes_stream();
        let mut file = tokio::fs::File::create(&temp_path)
            .await
            .map_err(|error| error.to_string())?;
        let started_at = Instant::now();
        let mut downloaded_bytes = 0u64;
        let mut last_emit_at = Instant::now() - Duration::from_secs(1);

        emit_voice_model_download_event(
            &window,
            VoiceModelDownloadEvent {
                model_id: spec.model_id.to_string(),
                language: spec.language.to_string(),
                stage: "started".into(),
                label: spec.label.to_string(),
                downloaded_bytes: 0,
                total_bytes,
                remaining_bytes: total_bytes,
                speed_bytes_per_second: None,
                path: None,
                message: Some("Downloading voice model".into()),
            },
        );

        while let Some(chunk) = stream.next().await {
            let bytes = chunk.map_err(|error| error.to_string())?;
            file.write_all(&bytes)
                .await
                .map_err(|error| error.to_string())?;
            downloaded_bytes += bytes.len() as u64;

            if last_emit_at.elapsed() >= Duration::from_millis(150) {
                let elapsed = started_at.elapsed().as_secs_f64().max(0.001);
                let speed = downloaded_bytes as f64 / elapsed;
                emit_voice_model_download_event(
                    &window,
                    VoiceModelDownloadEvent {
                        model_id: spec.model_id.to_string(),
                        language: spec.language.to_string(),
                        stage: "progress".into(),
                        label: spec.label.to_string(),
                        downloaded_bytes,
                        total_bytes,
                        remaining_bytes: total_bytes
                            .map(|total| total.saturating_sub(downloaded_bytes)),
                        speed_bytes_per_second: Some(speed),
                        path: None,
                        message: None,
                    },
                );
                last_emit_at = Instant::now();
            }
        }

        file.flush().await.map_err(|error| error.to_string())?;
        drop(file);

        replace_path_from_temp(&temp_path, &final_path)?;
        extract_downloaded_voice_model(&app, spec)?;
        fs::remove_file(&final_path).map_err(|error| error.to_string())?;

        let status = build_voice_model_status(&app, spec)?;
        emit_voice_model_download_event(
            &window,
            VoiceModelDownloadEvent {
                model_id: spec.model_id.to_string(),
                language: spec.language.to_string(),
                stage: "completed".into(),
                label: spec.label.to_string(),
                downloaded_bytes: status.size_bytes,
                total_bytes: Some(status.size_bytes),
                remaining_bytes: Some(0),
                speed_bytes_per_second: Some(
                    status.size_bytes as f64 / started_at.elapsed().as_secs_f64().max(0.001),
                ),
                path: status.path.clone(),
                message: Some("Voice model download completed".into()),
            },
        );

        Ok(status)
    }
    .await;

    if let Err(error) = &result {
        emit_voice_model_download_event(
            &window,
            VoiceModelDownloadEvent {
                model_id: spec.model_id.to_string(),
                language: spec.language.to_string(),
                stage: "error".into(),
                label: spec.label.to_string(),
                downloaded_bytes: 0,
                total_bytes: None,
                remaining_bytes: None,
                speed_bytes_per_second: None,
                path: None,
                message: Some(error.clone()),
            },
        );
    }

    {
        let mut active = downloads
            .active_models
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        active.remove(&model_key);
    }

    result
}

#[tauri::command]
fn read_import_file(path: String) -> Result<ImportedFilePayload, String> {
    let path = PathBuf::from(path);
    let name = path
        .file_name()
        .and_then(|value| value.to_str())
        .map(str::to_owned)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Could not determine dropped file name".to_string())?;
    let bytes = fs::read(&path).map_err(|error| error.to_string())?;

    Ok(ImportedFilePayload { name, bytes })
}

fn setup_aux_windows(app: &tauri::AppHandle) -> tauri::Result<()> {
    ensure_window(app, "input", "Flow Text", "input.html", 860.0, 860.0)?;
    ensure_window(
        app,
        "settings",
        "Flow Settings",
        "settings.html",
        SETTINGS_WINDOW_WIDTH,
        SETTINGS_WINDOW_HEIGHT,
    )?;
    ensure_window(app, "about", "About Flow", "about.html", 520.0, 420.0)?;

    Ok(())
}

fn show_window(app: &tauri::AppHandle, label: &str) {
    let _ = ensure_aux_window(app, label);
    let _ = show_aux_window_impl(app, label);
}

#[allow(dead_code)]
fn spawn_remote_relay_server(relay: RemoteRelay) {
    tauri::async_runtime::spawn(async move {
        let router = Router::new()
            .route(
                "/api/receiver/:session_id/auth",
                post(authenticate_remote_sender),
            )
            .route("/api/receiver/:session_id/active", get(receiver_active))
            .route(
                "/api/receiver/:session_id/messages",
                post(send_remote_message),
            )
            .route(
                "/api/receiver/:session_id/messages/:message_id/status",
                get(remote_message_status),
            )
            .with_state(relay);

        let listener = match tokio::net::TcpListener::bind(SocketAddr::from((
            [0, 0, 0, 0],
            REMOTE_RELAY_PORT,
        )))
        .await
        {
            Ok(listener) => listener,
            Err(error) => {
                log_backend_error("remote relay bind", &error);
                return;
            }
        };

        if let Err(error) = axum::serve(
            listener,
            router.into_make_service_with_connect_info::<SocketAddr>(),
        )
        .await
        {
            log_backend_error("remote relay server", &error);
        }
    });
}

#[allow(dead_code)]
fn remote_access_error_response(error: RemoteAccessError) -> (StatusCode, Json<SenderApiResponse>) {
    match error {
        RemoteAccessError::SessionNotFound => (
            StatusCode::NOT_FOUND,
            Json(SenderApiResponse {
                ok: false,
                message: "That UUID does not exist on this receiver.".into(),
                active: false,
                queued_message_id: None,
                retry_after_seconds: None,
            }),
        ),
        RemoteAccessError::AuthNotConfigured => (
            StatusCode::FORBIDDEN,
            Json(SenderApiResponse {
                ok: false,
                message: "This receiver does not have an access password yet.".into(),
                active: false,
                queued_message_id: None,
                retry_after_seconds: None,
            }),
        ),
        RemoteAccessError::MissingCredentials => (
            StatusCode::BAD_REQUEST,
            Json(SenderApiResponse {
                ok: false,
                message: "Access password is required.".into(),
                active: false,
                queued_message_id: None,
                retry_after_seconds: None,
            }),
        ),
        RemoteAccessError::InvalidCredentials => (
            StatusCode::UNAUTHORIZED,
            Json(SenderApiResponse {
                ok: false,
                message: "Invalid access password for this receiver.".into(),
                active: false,
                queued_message_id: None,
                retry_after_seconds: None,
            }),
        ),
    }
}

#[allow(dead_code)]
fn extract_sender_access_password(headers: &HeaderMap) -> String {
    headers
        .get("x-flow-access-password")
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default()
        .trim()
        .to_string()
}

#[allow(dead_code)]
async fn authenticate_remote_sender(
    State(relay): State<RemoteRelay>,
    Path(session_id): Path<String>,
    Json(payload): Json<RemoteAccessRequest>,
) -> impl IntoResponse {
    match relay.authenticate_sender(&session_id, &payload.access_password) {
        Ok(active) => (
            StatusCode::OK,
            Json(SenderApiResponse {
                ok: true,
                message: if active {
                    "Authenticated successfully.".into()
                } else {
                    "Authenticated, but the receiver is currently offline.".into()
                },
                active,
                queued_message_id: None,
                retry_after_seconds: None,
            }),
        ),
        Err(error) => remote_access_error_response(error),
    }
}

#[allow(dead_code)]
async fn receiver_active(
    State(relay): State<RemoteRelay>,
    Path(session_id): Path<String>,
    headers: HeaderMap,
) -> Response {
    let access_password = extract_sender_access_password(&headers);

    match relay.authenticate_sender(&session_id, &access_password) {
        Ok(active) => (StatusCode::OK, Json(ActiveReceiverResponse { active })).into_response(),
        Err(error) => remote_access_error_response(error).into_response(),
    }
}

#[allow(dead_code)]
async fn remote_message_status(
    State(relay): State<RemoteRelay>,
    Path((session_id, message_id)): Path<(String, String)>,
    headers: HeaderMap,
) -> Response {
    let access_password = extract_sender_access_password(&headers);

    match relay.authenticate_sender(&session_id, &access_password) {
        Ok(active) => {
            if let Some(status) = relay.current_message_status(&session_id, &message_id) {
                return (
                    StatusCode::OK,
                    Json(RemoteMessageStatusResponse {
                        ok: true,
                        message: format!("Message status: {}.", status.status),
                        active,
                        message_id: Some(status.message_id.clone()),
                        title: Some(status.title.clone()),
                        status: Some(status.status.clone()),
                        created_at_ms: Some(status.created_at_ms),
                        resolved_at_ms: status.resolved_at_ms,
                    }),
                )
                    .into_response();
            }

            (
                StatusCode::NOT_FOUND,
                Json(RemoteMessageStatusResponse {
                    ok: false,
                    message: "Message status was not found for this receiver.".into(),
                    active,
                    message_id: Some(message_id),
                    title: None,
                    status: Some("notFound".into()),
                    created_at_ms: None,
                    resolved_at_ms: None,
                }),
            )
                .into_response()
        }
        Err(error) => remote_access_error_response(error).into_response(),
    }
}

#[allow(dead_code)]
async fn send_remote_message(
    State(relay): State<RemoteRelay>,
    Path(session_id): Path<String>,
    headers: HeaderMap,
    ConnectInfo(address): ConnectInfo<SocketAddr>,
    Json(payload): Json<SendRemoteMessageRequest>,
) -> impl IntoResponse {
    let access_password = extract_sender_access_password(&headers);

    match relay.authenticate_sender(&session_id, &access_password) {
        Ok(false) => {
            return (
                StatusCode::NOT_FOUND,
                Json(SenderApiResponse {
                    ok: false,
                    message: "That UUID is not active right now.".into(),
                    active: false,
                    queued_message_id: None,
                    retry_after_seconds: None,
                }),
            );
        }
        Ok(true) => {}
        Err(error) => {
            return remote_access_error_response(error);
        }
    }

    match relay.queue_message(&session_id, payload, Some(address.ip())) {
        Ok(message) => (
            StatusCode::CREATED,
            Json(SenderApiResponse {
                ok: true,
                message: "Message queued for delivery.".into(),
                active: true,
                queued_message_id: Some(message.id),
                retry_after_seconds: None,
            }),
        ),
        Err(QueueRemoteMessageError::SessionOffline) => (
            StatusCode::NOT_FOUND,
            Json(SenderApiResponse {
                ok: false,
                message: "That UUID is not active right now.".into(),
                active: false,
                queued_message_id: None,
                retry_after_seconds: None,
            }),
        ),
        Err(QueueRemoteMessageError::RateLimited) => (
            StatusCode::TOO_MANY_REQUESTS,
            Json(SenderApiResponse {
                ok: false,
                message: "Too many messages were sent to this UUID. Please wait a few seconds and try again.".into(),
                active: true,
                queued_message_id: None,
                retry_after_seconds: Some(RATE_LIMIT_WINDOW.as_secs()),
            }),
        ),
        Err(QueueRemoteMessageError::BadRequest(message)) => (
            StatusCode::BAD_REQUEST,
            Json(SenderApiResponse {
                ok: false,
                message,
                active: relay.is_session_active(&session_id),
                queued_message_id: None,
                retry_after_seconds: None,
            }),
        ),
    }
}

#[allow(dead_code)]
fn prune_attempts(entries: &mut VecDeque<Instant>) {
    while entries
        .front()
        .map(|entry| entry.elapsed() > RATE_LIMIT_WINDOW)
        .unwrap_or(false)
    {
        entries.pop_front();
    }
}

#[allow(dead_code)]
fn normalize_importance(value: Option<&str>) -> String {
    match value
        .unwrap_or_default()
        .trim()
        .to_ascii_lowercase()
        .as_str()
    {
        "important" => "important".into(),
        _ => "normal".into(),
    }
}

fn truncate(input: &str, max_chars: usize) -> String {
    input.trim().chars().take(max_chars).collect()
}

fn strip_protocol(input: &str) -> &str {
    let trimmed = input.trim().trim_end_matches('/');

    trimmed
        .strip_prefix("http://")
        .or_else(|| trimmed.strip_prefix("https://"))
        .unwrap_or(trimmed)
}

#[allow(dead_code)]
fn create_preview(content: &str) -> String {
    let mut words = content.split_whitespace();
    let preview = words.by_ref().take(14).collect::<Vec<_>>().join(" ");

    if words.next().is_some() {
        format!("{preview}…")
    } else {
        preview
    }
}

fn detect_local_ip() -> IpAddr {
    if let Ok(socket) = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)) {
        if socket.connect((Ipv4Addr::new(1, 1, 1, 1), 80)).is_ok() {
            if let Ok(address) = socket.local_addr() {
                return address.ip();
            }
        }
    }

    IpAddr::V4(Ipv4Addr::LOCALHOST)
}

#[allow(dead_code)]
fn now_unix_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

pub(crate) fn normalize_voice_language(language: &str) -> &'static str {
    match language.trim().to_ascii_lowercase().as_str() {
        "en" | "en-gb" | "en-us" => "en-US",
        "tr" | "tr-tr" => "tr-TR",
        "ar" | "ar-sa" => "ar-SA",
        "de" | "de-de" => "de-DE",
        "fr" | "fr-fr" => "fr-FR",
        "es" | "es-es" => "es-ES",
        _ => "en-US",
    }
}

pub(crate) fn get_voice_model_spec(
    language: &str,
    model_id: Option<&str>,
) -> Option<&'static VoiceModelSpec> {
    let normalized = normalize_voice_language(language);
    if let Some(requested_model_id) = model_id.map(str::trim).filter(|value| !value.is_empty()) {
        if let Some(spec) = VOICE_MODEL_SPECS
            .iter()
            .find(|spec| spec.language == normalized && spec.model_id == requested_model_id)
        {
            return Some(spec);
        }
    }

    VOICE_MODEL_SPECS
        .iter()
        .find(|spec| spec.language == normalized && spec.recommended)
        .or_else(|| {
            VOICE_MODEL_SPECS
                .iter()
                .find(|spec| spec.language == normalized)
        })
}

pub(crate) fn voice_models_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("voice-models");

    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir)
}

fn app_storage_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir)
}

fn app_storage_file_path(app: &tauri::AppHandle, file_name: &str) -> Result<PathBuf, String> {
    Ok(app_storage_dir(app)?.join(file_name))
}

fn read_json_storage<T>(app: &tauri::AppHandle, file_name: &str) -> Result<Option<T>, String>
where
    T: for<'de> Deserialize<'de>,
{
    let path = app_storage_file_path(app, file_name)?;
    if !path.exists() {
        return Ok(None);
    }

    let raw = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    let parsed = serde_json::from_str::<T>(&raw).map_err(|error| error.to_string())?;
    Ok(Some(parsed))
}

fn write_json_storage<T>(app: &tauri::AppHandle, file_name: &str, value: &T) -> Result<(), String>
where
    T: Serialize,
{
    let path = app_storage_file_path(app, file_name)?;
    let temp_path = path.with_extension("tmp");
    let bytes = serde_json::to_vec_pretty(value).map_err(|error| error.to_string())?;
    fs::write(&temp_path, bytes).map_err(|error| error.to_string())?;
    replace_path_from_temp(&temp_path, &path)?;
    Ok(())
}

#[tauri::command]
fn load_persisted_app_data(app: tauri::AppHandle) -> Result<PersistedAppDataPayload, String> {
    let state = read_json_storage::<serde_json::Value>(&app, APP_STATE_FILE_NAME)?
        .unwrap_or_else(|| serde_json::json!({}));
    let voice_model_registry =
        read_json_storage::<serde_json::Value>(&app, VOICE_MODEL_REGISTRY_FILE_NAME)?
            .unwrap_or_else(|| serde_json::json!({}));

    Ok(PersistedAppDataPayload {
        state,
        voice_model_registry,
    })
}

#[tauri::command]
fn save_persisted_app_state(app: tauri::AppHandle, state: serde_json::Value) -> Result<(), String> {
    write_json_storage(&app, APP_STATE_FILE_NAME, &state)
}

#[tauri::command]
fn save_persisted_voice_model_registry(
    app: tauri::AppHandle,
    registry: serde_json::Value,
) -> Result<(), String> {
    write_json_storage(&app, VOICE_MODEL_REGISTRY_FILE_NAME, &registry)
}

fn voice_model_language_dir(
    app: &tauri::AppHandle,
    spec: &VoiceModelSpec,
) -> Result<PathBuf, String> {
    let dir = voice_models_dir(app)?.join(spec.language);
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir)
}

fn voice_model_archive_path(
    app: &tauri::AppHandle,
    spec: &VoiceModelSpec,
) -> Result<PathBuf, String> {
    Ok(voice_model_language_dir(app, spec)?.join(spec.archive_name))
}

pub(crate) fn voice_model_install_dir(
    app: &tauri::AppHandle,
    spec: &VoiceModelSpec,
) -> Result<PathBuf, String> {
    Ok(voice_model_language_dir(app, spec)?.join(spec.install_dir_name))
}

fn is_installed_voice_model_dir(path: &FsPath) -> bool {
    if !path.is_dir() {
        return false;
    }

    fs::read_dir(path)
        .ok()
        .into_iter()
        .flatten()
        .filter_map(Result::ok)
        .any(|entry| {
            let child = entry.path();
            child.is_dir()
                || entry
                    .file_name()
                    .to_str()
                    .is_some_and(|name| matches!(name, "README" | "README.md" | "mfcc.conf"))
        })
}

fn compute_dir_size_bytes(path: &FsPath) -> u64 {
    fs::read_dir(path)
        .ok()
        .into_iter()
        .flatten()
        .filter_map(Result::ok)
        .map(|entry| {
            let child = entry.path();
            if child.is_dir() {
                compute_dir_size_bytes(&child)
            } else {
                entry.metadata().map(|metadata| metadata.len()).unwrap_or(0)
            }
        })
        .sum()
}

fn extract_bundled_voice_model(
    app: &tauri::AppHandle,
    spec: &VoiceModelSpec,
) -> Result<PathBuf, String> {
    let final_dir = voice_model_install_dir(app, spec)?;
    if is_installed_voice_model_dir(&final_dir) {
        return Ok(final_dir);
    }

    let extraction_root = voice_model_language_dir(app, spec)?;
    let temp_dir = extraction_root.join(format!("{}.extract", spec.install_dir_name));
    if temp_dir.exists() {
        fs::remove_dir_all(&temp_dir).map_err(|error| error.to_string())?;
    }
    fs::create_dir_all(&temp_dir).map_err(|error| error.to_string())?;

    match spec.bundled_archive_kind {
        Some(BundledVoiceArchiveKind::TarGz) => {
            let decoder = GzDecoder::new(Cursor::new(BUNDLED_ENGLISH_VOSK_MODEL));
            let mut archive = Archive::new(decoder);
            archive
                .unpack(&temp_dir)
                .map_err(|error| error.to_string())?;
        }
        None => return Err("This voice model is not bundled".into()),
    }

    finalize_extracted_voice_model(&temp_dir, &final_dir)
}

fn extract_downloaded_voice_model(
    app: &tauri::AppHandle,
    spec: &VoiceModelSpec,
) -> Result<PathBuf, String> {
    let archive_path = voice_model_archive_path(app, spec)?;
    let extraction_root = voice_model_language_dir(app, spec)?;
    let final_dir = voice_model_install_dir(app, spec)?;
    let temp_dir = extraction_root.join(format!("{}.extract", spec.install_dir_name));

    if temp_dir.exists() {
        fs::remove_dir_all(&temp_dir).map_err(|error| error.to_string())?;
    }
    fs::create_dir_all(&temp_dir).map_err(|error| error.to_string())?;

    let archive_file = fs::File::open(&archive_path).map_err(|error| error.to_string())?;
    let mut archive = ZipArchive::new(archive_file).map_err(|error| error.to_string())?;
    for index in 0..archive.len() {
        let mut entry = archive.by_index(index).map_err(|error| error.to_string())?;
        let relative_path = entry
            .enclosed_name()
            .map(|path| path.to_path_buf())
            .ok_or_else(|| "Voice model archive contained an invalid path".to_string())?;
        let output_path = temp_dir.join(relative_path);

        if entry.is_dir() {
            fs::create_dir_all(&output_path).map_err(|error| error.to_string())?;
            continue;
        }

        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }

        let mut output_file = fs::File::create(&output_path).map_err(|error| error.to_string())?;
        std::io::copy(&mut entry, &mut output_file).map_err(|error| error.to_string())?;
    }

    finalize_extracted_voice_model(&temp_dir, &final_dir)
}

fn finalize_extracted_voice_model(
    temp_dir: &FsPath,
    final_dir: &FsPath,
) -> Result<PathBuf, String> {
    let extracted_root = resolve_extracted_voice_model_root(temp_dir)?;

    if extracted_root == temp_dir {
        replace_path_from_temp(temp_dir, final_dir)?;
    } else {
        replace_path_from_temp(&extracted_root, final_dir)?;
        fs::remove_dir_all(temp_dir).map_err(|error| error.to_string())?;
    }

    Ok(final_dir.to_path_buf())
}

fn resolve_extracted_voice_model_root(extraction_dir: &FsPath) -> Result<PathBuf, String> {
    let mut entries = fs::read_dir(extraction_dir)
        .map_err(|error| error.to_string())?
        .filter_map(Result::ok)
        .collect::<Vec<_>>();

    if entries.len() == 1 && entries[0].path().is_dir() {
        return Ok(entries.remove(0).path());
    }

    Ok(extraction_dir.to_path_buf())
}

pub(crate) fn ensure_voice_model_ready_for_model(
    app: &tauri::AppHandle,
    language: &str,
    model_id: Option<&str>,
) -> Result<PathBuf, String> {
    let spec = get_voice_model_spec(language, model_id)
        .ok_or_else(|| "Unsupported voice language or model".to_string())?;
    let final_dir = voice_model_install_dir(app, spec)?;
    if is_installed_voice_model_dir(&final_dir) {
        return Ok(final_dir);
    }

    if spec.bundled_archive_kind.is_some() {
        return extract_bundled_voice_model(app, spec);
    }

    Err(format!("Missing Vosk model for {}", spec.label))
}

fn build_voice_model_status(
    app: &tauri::AppHandle,
    spec: &VoiceModelSpec,
) -> Result<VoiceModelStatus, String> {
    let install_dir = voice_model_install_dir(app, spec)?;
    if !is_installed_voice_model_dir(&install_dir) && spec.bundled_archive_kind.is_some() {
        let _ = extract_bundled_voice_model(app, spec);
    }

    let installed = is_installed_voice_model_dir(&install_dir);
    let size_bytes = if installed {
        compute_dir_size_bytes(&install_dir)
    } else {
        0
    };

    Ok(VoiceModelStatus {
        model_id: spec.model_id.to_string(),
        language: spec.language.to_string(),
        label: spec.label.to_string(),
        family: spec.family.to_string(),
        download_size_mb: spec.download_size_mb,
        runtime_memory_mb: spec.runtime_memory_mb,
        license: spec.license.to_string(),
        description: spec.description.to_string(),
        recommended: spec.recommended,
        bundled: spec.bundled_archive_kind.is_some(),
        installed,
        path: installed.then(|| install_dir.to_string_lossy().to_string()),
        size_bytes,
    })
}

fn emit_voice_model_download_event(
    window: &tauri::WebviewWindow,
    payload: VoiceModelDownloadEvent,
) {
    let _ = window.emit(VOICE_MODEL_DOWNLOAD_EVENT, payload);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if !ensure_webview2_runtime_available() {
        return;
    }

    set_log_level(LogLevel::Error);

    let prevent = tauri_plugin_prevent_default::Builder::new()
        .with_flags(Flags::CONTEXT_MENU | Flags::PRINT | Flags::DOWNLOADS | Flags::DEV_TOOLS)
        .build();
    let relay = RemoteRelay::new();
    let desktop_state = DesktopState::default();
    let voice_model_downloads = VoiceModelDownloads::default();
    let voice_engine_state = voice_engine::VoiceEngineState::default();

    let mut builder = tauri::Builder::default();

    #[cfg(unix)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            handle_secondary_instance_cli_args(app, &argv);
        }));
    }

    let result = builder
        .manage(relay.clone())
        .manage(desktop_state)
        .manage(voice_model_downloads)
        .manage(voice_engine_state)
        .plugin(prevent)
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            open_aux_window,
            hide_aux_window,
            sync_remote_inbox_window,
            close_app,
            hide_main_window,
            show_main_window_command,
            set_capture_protection,
            set_system_tray_enabled,
            set_prevent_sleep,
            set_clickthrough_shortcut_enabled,
            set_main_clickthrough,
            toggle_main_clickthrough,
            get_remote_receiver_status,
            configure_remote_receiver_access,
            remote_receiver_heartbeat,
            list_remote_messages,
            resolve_remote_message,
            load_persisted_app_data,
            save_persisted_app_state,
            save_persisted_voice_model_registry,
            get_distribution_channel,
            get_platform_capabilities,
            fetch_updater_feed_metadata,
            list_voice_models,
            get_voice_model_status,
            download_voice_model,
            voice_engine::list_input_devices,
            voice_engine::start_voice_tracking,
            voice_engine::stop_voice_tracking,
            voice_engine::start_voice_command_listener,
            voice_engine::stop_voice_command_listener,
            read_import_file
        ])
        .setup(move |app| {
            setup_aux_windows(app.handle())?;

            if let Some(main) = app.handle().get_webview_window("main") {
                let app_handle = app.handle().clone();
                main.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(true) = event {
                        promote_active_window(&app_handle, "main");
                    }
                });
            }

            if let Err(error) = app.handle().global_shortcut().on_shortcut(
                "Ctrl+Shift+X",
                |app, _shortcut, event| {
                    if event.state != ShortcutState::Pressed {
                        return;
                    }

                    let Some(desktop) = app.try_state::<DesktopState>() else {
                        return;
                    };

                    let shortcut_enabled = desktop
                        .preferences
                        .lock()
                        .unwrap_or_else(|poisoned| poisoned.into_inner())
                        .clickthrough_shortcut_enabled;

                    if !shortcut_enabled {
                        return;
                    }

                    let _ = toggle_clickthrough_impl(app, &desktop);
                },
            ) {
                log_backend_error("global shortcut registration", &error);
            }

            if let Some(desktop) = app.try_state::<DesktopState>() {
                let preferences = current_desktop_preferences(&desktop);
                set_tray_enabled_impl(app.handle(), preferences.use_system_tray)?;
                apply_capture_protection_to_windows(app.handle(), preferences.hide_from_capture);
                set_sleep_prevention(preferences.prevent_sleep);
            }

            if let Some(main_window) = app.get_webview_window("main") {
                install_dpi_scale_guard(&main_window);
                if let Some(desktop) = app.try_state::<DesktopState>() {
                    let preferences = current_desktop_preferences(&desktop);
                    apply_capture_protection(&main_window, preferences.hide_from_capture);
                }
            }

            // show_main_window(app.handle()); // Removed so splash screen can control when it shows.

            Ok(())
        })
        .run(tauri::generate_context!());

    if let Err(error) = result {
        log_backend_error("tauri runtime", &error);
        show_startup_error_dialog(&format_startup_error_message(&error));
    }
}
