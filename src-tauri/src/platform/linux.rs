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

/// Returns "x11", "wayland", or "unknown" for the current desktop session,
/// consulting the same environment signals GDK itself uses to pick a backend.
pub fn session_type() -> String {
    if let Ok(value) = env::var("XDG_SESSION_TYPE") {
        let normalized = value.to_lowercase();
        if normalized == "x11" || normalized == "wayland" {
            return normalized;
        }
    }

    // GDK_BACKEND (set by our own launcher, or by the user) overrides the
    // session compositor's own type when present.
    if let Ok(value) = env::var("GDK_BACKEND") {
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
