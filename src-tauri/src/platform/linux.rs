/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

use std::env;
use std::process::Command;
use std::sync::Mutex;

use zbus::blocking::Connection;
use zbus::zvariant::OwnedFd;

const STARTUP_ERROR_TITLE: &str = "Flow startup error";

/// Shows a startup error dialog on Linux, mirroring Windows' `MessageBoxW`
/// use in lib.rs. Tries native dialog tools in order of how commonly they're
/// preinstalled, since at this point in startup nothing GTK-based can be
/// assumed to work yet (that's exactly what failed) - `kdialog`/`zenity`/
/// `notify-send` are separate processes, so they don't depend on our own
/// (broken) webview or GTK context.
pub fn show_startup_error_dialog(message: &str) {
    if try_command_dialog("kdialog", &["--error", message, "--title", STARTUP_ERROR_TITLE]) {
        return;
    }

    if try_command_dialog(
        "zenity",
        &[
            "--error",
            &format!("--title={STARTUP_ERROR_TITLE}"),
            &format!("--text={message}"),
        ],
    ) {
        return;
    }

    if try_command_dialog(
        "notify-send",
        &["--urgency=critical", STARTUP_ERROR_TITLE, message],
    ) {
        return;
    }

    eprintln!("[flow] {STARTUP_ERROR_TITLE}: {message}");
}

fn try_command_dialog(program: &str, args: &[&str]) -> bool {
    Command::new(program)
        .args(args)
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}

const INHIBIT_APP_NAME: &str = "Flow";
const INHIBIT_REASON: &str = "Teleprompter is actively being used";

/// Holds whatever handles are needed to release an active sleep/screensaver
/// inhibitor later. Dropping the logind file descriptor releases that
/// inhibitor automatically; the ScreenSaver one needs an explicit UnInhibit
/// call on the same connection that requested it.
struct SleepInhibitor {
    screensaver: Option<(Connection, u32)>,
    // Only ever dropped, never read: closing the fd is what releases the
    // logind inhibitor lock.
    #[allow(dead_code)]
    logind_fd: Option<OwnedFd>,
}

static SLEEP_INHIBITOR: Mutex<Option<SleepInhibitor>> = Mutex::new(None);

/// Prevents (or re-allows) the system from sleeping/screen-locking while
/// Flow is actively being used, mirroring Windows' `SetThreadExecutionState`
/// use in lib.rs. Two independent D-Bus mechanisms are used together since
/// desktop environments vary in which one they honor:
/// - `org.freedesktop.ScreenSaver.Inhibit` blocks the screensaver/DPMS
///   (supported by GNOME, KDE/kscreenlocker, and most other DEs).
/// - `org.freedesktop.login1.Manager.Inhibit("idle", ...)` blocks systemd-
///   logind from suspending the system due to idle timeout.
/// Failures are logged but never fatal - a teleprompter that occasionally
/// lets the screen sleep is a much smaller problem than one that crashes.
pub fn set_sleep_prevention(enabled: bool) {
    let mut guard = SLEEP_INHIBITOR
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());

    if enabled {
        if guard.is_some() {
            return;
        }
        *guard = Some(acquire_sleep_inhibitor());
    } else if let Some(inhibitor) = guard.take() {
        release_sleep_inhibitor(inhibitor);
    }
}

fn acquire_sleep_inhibitor() -> SleepInhibitor {
    let screensaver = match inhibit_screensaver() {
        Ok(inhibitor) => Some(inhibitor),
        Err(error) => {
            crate::log_backend_error("org.freedesktop.ScreenSaver.Inhibit", &error);
            None
        }
    };

    let logind_fd = match inhibit_logind() {
        Ok(fd) => Some(fd),
        Err(error) => {
            crate::log_backend_error("org.freedesktop.login1.Manager.Inhibit", &error);
            None
        }
    };

    SleepInhibitor {
        screensaver,
        logind_fd,
    }
}

fn release_sleep_inhibitor(inhibitor: SleepInhibitor) {
    if let Some((connection, cookie)) = inhibitor.screensaver {
        let result = connection.call_method(
            Some("org.freedesktop.ScreenSaver"),
            "/org/freedesktop/ScreenSaver",
            Some("org.freedesktop.ScreenSaver"),
            "UnInhibit",
            &(cookie,),
        );
        if let Err(error) = result {
            crate::log_backend_error("org.freedesktop.ScreenSaver.UnInhibit", &error);
        }
    }
    // `inhibitor.logind_fd` (if any) is dropped here, closing the file
    // descriptor and releasing the logind idle inhibitor lock.
}

fn inhibit_screensaver() -> zbus::Result<(Connection, u32)> {
    let connection = Connection::session()?;
    let reply = connection.call_method(
        Some("org.freedesktop.ScreenSaver"),
        "/org/freedesktop/ScreenSaver",
        Some("org.freedesktop.ScreenSaver"),
        "Inhibit",
        &(INHIBIT_APP_NAME, INHIBIT_REASON),
    )?;
    let cookie: u32 = reply.body().deserialize()?;
    Ok((connection, cookie))
}

fn inhibit_logind() -> zbus::Result<OwnedFd> {
    let connection = Connection::system()?;
    let reply = connection.call_method(
        Some("org.freedesktop.login1"),
        "/org/freedesktop/login1",
        Some("org.freedesktop.login1.Manager"),
        "Inhibit",
        &("idle", INHIBIT_APP_NAME, INHIBIT_REASON, "block"),
    )?;
    let fd: OwnedFd = reply.body().deserialize()?;
    Ok(fd)
}

/// Returns "x11", "wayland", or "unknown" for the windowing backend GTK/tao
/// actually uses - not necessarily the compositor's own session type.
///
/// `GDK_BACKEND` is checked first and wins whenever set: our own launcher
/// (packaging/linux/flow-launcher.sh) sets `GDK_BACKEND=x11` by default so
/// the app runs under XWayland even in a `XDG_SESSION_TYPE=wayland` session,
/// since always-on-top/window positioning/global shortcuts only work that
/// way (see plan.md E2). Reporting the compositor's session type instead
/// would make `get_platform_capabilities` claim those features are
/// unavailable on a system where they actually work fine under XWayland.
pub fn session_type() -> String {
    if let Ok(value) = env::var("GDK_BACKEND") {
        let normalized = value.to_lowercase();
        if normalized == "x11" || normalized == "wayland" {
            return normalized;
        }
    }

    if let Ok(value) = env::var("XDG_SESSION_TYPE") {
        let normalized = value.to_lowercase();
        if normalized == "x11" || normalized == "wayland" {
            return normalized;
        }
    }

    if env::var("WAYLAND_DISPLAY").is_ok() {
        return "wayland".to_string();
    }

    if env::var("DISPLAY").is_ok() {
        return "x11".to_string();
    }

    "unknown".to_string()
}
