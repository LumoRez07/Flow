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
    any::Any,
    env,
    process,
};

fn main() {
    let result = std::panic::catch_unwind(|| tauri_build::try_build(tauri_build::Attributes::default()));

    match result {
        Ok(Ok(())) => {}
        Ok(Err(error)) => handle_build_failure(format!("{error:#}")),
        Err(payload) => handle_build_failure(panic_message(payload)),
    }
}

fn handle_build_failure(message: String) {
    if should_ignore_missing_windows_rc(&message) {
        println!(
            "cargo:warning=RC.EXE was not found; skipping Windows resource embedding for local debug builds. Install the Windows SDK / Visual Studio Build Tools to restore the app icon and manifest."
        );
        return;
    }

    println!("{message}");
    process::exit(1);
}

fn should_ignore_missing_windows_rc(message: &str) -> bool {
    env::var("CARGO_CFG_TARGET_OS").is_ok_and(|value| value == "windows")
        && env::var("PROFILE").is_ok_and(|value| value == "debug")
        && message.contains("RC.EXE in your $PATH")
}

fn panic_message(payload: Box<dyn Any + Send>) -> String {
    if let Some(message) = payload.downcast_ref::<&str>() {
        (*message).to_string()
    } else if let Some(message) = payload.downcast_ref::<String>() {
        message.clone()
    } else {
        "tauri-build panicked".to_string()
    }
}
