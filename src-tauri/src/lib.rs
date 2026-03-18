use std::{
    collections::{HashMap, VecDeque},
    fs,
    net::{IpAddr, Ipv4Addr, SocketAddr, UdpSocket},
    path::PathBuf,
    sync::{Arc, Mutex},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use axum::{
    extract::{ConnectInfo, Path, State},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::{Html, IntoResponse, Redirect, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use tauri_plugin_prevent_default::Flags;
use uuid::Uuid;

#[cfg(windows)]
use windows::Win32::System::Power::{
    SetThreadExecutionState, ES_CONTINUOUS, ES_DISPLAY_REQUIRED, ES_SYSTEM_REQUIRED,
};

#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{
    SetWindowDisplayAffinity, WDA_EXCLUDEFROMCAPTURE, WDA_NONE,
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
            hide_from_capture: true,
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

#[allow(dead_code)]
#[derive(Debug)]
struct ReceiverSession {
    last_seen: Instant,
    pending_messages: VecDeque<RemoteMessage>,
    recent_attempts: VecDeque<Instant>,
    recent_by_ip: HashMap<String, VecDeque<Instant>>,
}

#[allow(dead_code)]
impl ReceiverSession {
    fn new() -> Self {
        Self {
            last_seen: Instant::now(),
            pending_messages: VecDeque::new(),
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

        sessions.entry(session_id).or_insert_with(ReceiverSession::new);
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

        format!("http://{}:{}/sender", credentials.public_host, REMOTE_RELAY_PORT)
    }

    fn update_access(&self, public_host: String, access_password: String) -> RemoteReceiverStatus {
        let mut credentials = self
            .inner
            .credentials
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        credentials.public_host = truncate(&strip_protocol(&public_host), 255).trim().to_string();
        credentials.access_password = truncate(&access_password, 1024).trim().to_string();
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

    fn resolve_current_message(&self, message_id: &str) -> bool {
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

        session.pending_messages.remove(index);
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
        Ok(message)
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

#[cfg(not(windows))]
fn set_sleep_prevention(_enabled: bool) {}

fn load_dev_tray_icon() -> tauri::Result<Image<'static>> {
    #[cfg(debug_assertions)]
    {
        let icon_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("icons").join("icon.ico");
        if icon_path.exists() {
            return Image::from_path(icon_path).map(|image| image.to_owned());
        }
    }

    Err(tauri::Error::AssetNotFound("dev tray icon missing".into()))
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

    let window = WebviewWindowBuilder::new(app, label, WebviewUrl::App(path.into()))
        .title(title)
        .inner_size(width, height)
        .visible(false)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .resizable(false)
        .skip_taskbar(true)
        .always_on_top(true)
        .center()
        .build()?;

    let capture_enabled = app
        .try_state::<DesktopState>()
        .map(|desktop| current_desktop_preferences(&desktop).hide_from_capture)
        .unwrap_or(true);
    apply_capture_protection(&window, capture_enabled);

    Ok(())
}

fn ensure_aux_window(app: &tauri::AppHandle, kind: &str) -> Result<&'static str, String> {
    let (label, title, path, width, height) = match kind {
        "input" => ("input", "Flow Text", "input.html", 860.0, 860.0),
        "settings" => ("settings", "Flow Settings", "settings.html", 520.0, 520.0),
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

#[tauri::command]
fn close_app(app: tauri::AppHandle) {
    exit_app(&app);
}

#[tauri::command]
fn hide_main_window(app: tauri::AppHandle) {
    hide_main_window_impl(&app);
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

    set_main_always_on_top(&app, false);
    let _ = set_clickthrough_impl(&app, &desktop, false);

    let window = app
        .get_webview_window(label)
        .ok_or_else(|| format!("Window '{label}' was not created"))?;

    window
        .set_always_on_top(true)
        .map_err(|error| error.to_string())?;
    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
fn hide_aux_window(app: tauri::AppHandle, kind: String) -> Result<(), String> {
    let label = ensure_aux_window(&app, &kind)?;

    let window = app
        .get_webview_window(label)
        .ok_or_else(|| format!("Window '{label}' was not created"))?;

    window.hide().map_err(|error| error.to_string())?;
    set_main_always_on_top(&app, true);

    Ok(())
}

#[tauri::command]
fn sync_remote_inbox_window(app: tauri::AppHandle, has_messages: bool) -> Result<(), String> {
    if has_messages {
        let label = ensure_aux_window(&app, "remote-inbox")?;
        let window = app
            .get_webview_window(label)
            .ok_or_else(|| format!("Window '{label}' was not created"))?;

        let is_visible = window.is_visible().map_err(|error| error.to_string())?;

        if is_visible {
            return Ok(());
        }

        window
            .set_always_on_top(true)
            .map_err(|error| error.to_string())?;
        window.show().map_err(|error| error.to_string())?;
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
        "accept" | "deny" => Ok(relay.resolve_current_message(&message_id)),
        _ => Err("Unknown message action".into()),
    }
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
    ensure_window(app, "settings", "Flow Settings", "settings.html", 520.0, 520.0)?;
    ensure_window(app, "about", "About Flow", "about.html", 520.0, 420.0)?;

    Ok(())
}

fn show_window(app: &tauri::AppHandle, label: &str) {
    let _ = ensure_aux_window(app, label);
    set_main_always_on_top(app, false);

    if let Some(desktop) = app.try_state::<DesktopState>() {
        let _ = set_clickthrough_impl(app, &desktop, false);
    }

    if let Some(window) = app.get_webview_window(label) {
        let _ = window.set_always_on_top(true);
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(desktop) = app.try_state::<DesktopState>() {
        let _ = set_clickthrough_impl(app, &desktop, false);
    }

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_always_on_top(true);
        let _ = window.set_focus();
    }
}

fn hide_main_window_impl(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

#[allow(dead_code)]
fn spawn_remote_relay_server(relay: RemoteRelay) {
    tauri::async_runtime::spawn(async move {
        let router = Router::new()
            .route("/", get(redirect_to_sender))
            .route("/sender", get(sender_page))
            .route("/remote.js", get(sender_script))
            .route("/api/receiver/:session_id/auth", post(authenticate_remote_sender))
            .route("/api/receiver/:session_id/active", get(receiver_active))
            .route("/api/receiver/:session_id/messages", post(send_remote_message))
            .with_state(relay);

        let listener = match tokio::net::TcpListener::bind(SocketAddr::from(([0, 0, 0, 0], REMOTE_RELAY_PORT))).await {
            Ok(listener) => listener,
            Err(error) => {
                eprintln!("remote relay bind error: {error}");
                return;
            }
        };

        if let Err(error) = axum::serve(listener, router.into_make_service_with_connect_info::<SocketAddr>()).await {
            eprintln!("remote relay server error: {error}");
        }
    });
}

#[allow(dead_code)]
async fn redirect_to_sender() -> Redirect {
    Redirect::temporary("/sender")
}

#[allow(dead_code)]
async fn sender_page() -> impl IntoResponse {
    let headers = [(
        header::CONTENT_TYPE,
        HeaderValue::from_static("text/html; charset=utf-8"),
    )];
    (headers, Html(include_str!("../../src/remote-sender.html")))
}

#[allow(dead_code)]
async fn sender_script() -> impl IntoResponse {
    let headers = [(
        header::CONTENT_TYPE,
        HeaderValue::from_static("application/javascript; charset=utf-8"),
    )];
    (headers, include_str!("../../src/remote-sender.js"))
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
    match value.unwrap_or_default().trim().to_ascii_lowercase().as_str() {
        "important" => "important".into(),
        _ => "normal".into(),
    }
}

fn truncate(input: &str, max_chars: usize) -> String {
    input.trim().chars().take(max_chars).collect()
}

fn strip_protocol(input: &str) -> String {
    input
        .trim()
        .trim_end_matches('/')
        .strip_prefix("http://")
        .or_else(|| input.trim().trim_end_matches('/').strip_prefix("https://"))
        .unwrap_or(input.trim().trim_end_matches('/'))
        .to_string()
}

#[allow(dead_code)]
fn create_preview(content: &str) -> String {
    let words = content.split_whitespace().take(14).collect::<Vec<_>>();
    let preview = words.join(" ");

    if content.split_whitespace().count() > words.len() {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let prevent = tauri_plugin_prevent_default::Builder::new()
        .with_flags(Flags::CONTEXT_MENU | Flags::PRINT | Flags::DOWNLOADS)
        .build();
    let relay = RemoteRelay::new();
    let desktop_state = DesktopState::default();

    tauri::Builder::default()
        .manage(relay.clone())
        .manage(desktop_state)
        .plugin(prevent)
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            open_aux_window,
            hide_aux_window,
            sync_remote_inbox_window,
            close_app,
            hide_main_window,
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
            read_import_file
        ])
        .setup(move |app| {
            setup_aux_windows(app.handle())?;

            if let Err(error) = app
                .handle()
                .global_shortcut()
                .on_shortcut("Ctrl+Shift+X", |app, _shortcut, event| {
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
                })
            {
                eprintln!("global shortcut registration error: {error}");
            }

            if let Some(desktop) = app.try_state::<DesktopState>() {
                let preferences = current_desktop_preferences(&desktop);
                set_tray_enabled_impl(app.handle(), preferences.use_system_tray)?;
                apply_capture_protection_to_windows(app.handle(), preferences.hide_from_capture);
                set_sleep_prevention(preferences.prevent_sleep);
            }

            if let Some(main_window) = app.get_webview_window("main") {
                if let Some(desktop) = app.try_state::<DesktopState>() {
                    let preferences = current_desktop_preferences(&desktop);
                    apply_capture_protection(&main_window, preferences.hide_from_capture);
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
