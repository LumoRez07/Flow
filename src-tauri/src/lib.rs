// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::path::PathBuf;

use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_prevent_default::Flags;

#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{
    SetWindowDisplayAffinity, WDA_EXCLUDEFROMCAPTURE,
};

#[cfg(windows)]
fn apply_capture_protection(window: &tauri::WebviewWindow) {
    if let Ok(hwnd) = window.hwnd() {
        let _ = unsafe { SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE) };
    }
}

#[cfg(not(windows))]
fn apply_capture_protection(_window: &tauri::WebviewWindow) {}

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

    apply_capture_protection(&window);

    Ok(())
}

fn ensure_aux_window(app: &tauri::AppHandle, kind: &str) -> Result<&'static str, String> {
    let (label, title, path, width, height) = match kind {
        "input" => ("input", "Flow Text", "input.html", 860.0, 860.0),
        "settings" => ("settings", "Flow Settings", "settings.html", 520.0, 520.0),
        "about" => ("about", "About Flow", "about.html", 520.0, 420.0),
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

#[tauri::command]
fn close_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn hide_main_window(app: tauri::AppHandle) {
    hide_main_window_impl(&app);
}

#[tauri::command]
fn open_aux_window(app: tauri::AppHandle, kind: String) -> Result<(), String> {
    let label = ensure_aux_window(&app, &kind)?;

    set_main_always_on_top(&app, false);

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

fn setup_aux_windows(app: &tauri::AppHandle) -> tauri::Result<()> {
    ensure_window(app, "input", "Flow Text", "input.html", 860.0, 860.0)?;
    ensure_window(app, "settings", "Flow Settings", "settings.html", 520.0, 520.0)?;
    ensure_window(app, "about", "About Flow", "about.html", 520.0, 420.0)?;

    Ok(())
}

fn show_window(app: &tauri::AppHandle, label: &str) {
    let _ = ensure_aux_window(app, label);
    set_main_always_on_top(app, false);

    if let Some(window) = app.get_webview_window(label) {
        let _ = window.set_always_on_top(true);
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn show_main_window(app: &tauri::AppHandle) {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let prevent = tauri_plugin_prevent_default::Builder::new()
        .with_flags(Flags::CONTEXT_MENU | Flags::PRINT | Flags::DOWNLOADS)
        .build();

    tauri::Builder::default()
        .plugin(prevent)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![open_aux_window, hide_aux_window, close_app, hide_main_window])
        .setup(|app| {
            setup_aux_windows(app.handle())?;

            if let Some(main_window) = app.get_webview_window("main") {
                apply_capture_protection(&main_window);
            }

            let show_item = MenuItemBuilder::with_id("show_main", "Show").build(app)?;
            let hide_item = MenuItemBuilder::with_id("hide_main", "Hide").build(app)?;
            let settings_item = MenuItemBuilder::with_id("open_settings", "Open Settings").build(app)?;
            let text_item = MenuItemBuilder::with_id("open_input", "Open Text Editor").build(app)?;
            let about_item = MenuItemBuilder::with_id("open_about", "About").build(app)?;
            let close_item = MenuItemBuilder::with_id("close_app", "Close").build(app)?;

            let menu = MenuBuilder::new(app)
                .items(&[&show_item, &hide_item, &text_item, &settings_item, &about_item, &close_item])
                .build()?;

            let icon = load_dev_tray_icon()
                .or_else(|_| app.default_window_icon().cloned().ok_or_else(|| tauri::Error::AssetNotFound("default tray icon missing".into())))?;

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
                    "close_app" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
