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
    env, fs,
    path::{Path, PathBuf},
    process,
};

fn main() {
    if let Err(error) = stage_vosk_runtime() {
        handle_build_failure(error);
        return;
    }

    let result =
        std::panic::catch_unwind(|| tauri_build::try_build(tauri_build::Attributes::default()));

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

fn stage_vosk_runtime() -> Result<(), String> {
    match env::var("CARGO_CFG_TARGET_OS").ok().as_deref() {
        Some("windows") => stage_vosk_windows(),
        Some("linux") => stage_vosk_linux(),
        _ => Ok(()),
    }
}

fn stage_vosk_windows() -> Result<(), String> {
    let runtime_dir =
        PathBuf::from(env::var("CARGO_MANIFEST_DIR").map_err(|error| error.to_string())?)
            .join("resources")
            .join("vosk")
            .join("windows-x64");

    println!("cargo:rerun-if-changed={}", runtime_dir.display());

    let import_lib = runtime_dir.join("libvosk.lib");
    let runtime_files = [
        runtime_dir.join("libvosk.dll"),
        runtime_dir.join("libgcc_s_seh-1.dll"),
        runtime_dir.join("libstdc++-6.dll"),
        runtime_dir.join("libwinpthread-1.dll"),
    ];

    if !import_lib.is_file() {
        return Err(format!(
            "Missing Vosk import library at {}",
            import_lib.display()
        ));
    }

    println!("cargo:rustc-link-search=native={}", runtime_dir.display());

    let profile_dir = resolve_profile_dir()?;
    fs::create_dir_all(&profile_dir).map_err(|error| error.to_string())?;

    for runtime_file in runtime_files {
        if !runtime_file.is_file() {
            return Err(format!(
                "Missing Vosk runtime file at {}",
                runtime_file.display()
            ));
        }

        let destination = profile_dir.join(runtime_file.file_name().ok_or_else(|| {
            format!("Invalid Vosk runtime file path: {}", runtime_file.display())
        })?);
        stage_runtime_file(&runtime_file, &destination)?;
    }

    Ok(())
}

fn stage_vosk_linux() -> Result<(), String> {
    let manifest_dir =
        PathBuf::from(env::var("CARGO_MANIFEST_DIR").map_err(|error| error.to_string())?);
    let vendored_dir = manifest_dir.join("resources").join("vosk").join("linux-x64");
    let vendored_lib = vendored_dir.join("libvosk.so");

    println!("cargo:rerun-if-env-changed=FLOW_VOSK_LIB_DIR");
    println!("cargo:rerun-if-changed={}", vendored_dir.display());

    // Resolution order: explicit override, then a vendored copy (AppImage/deb/rpm
    // packaging), then whatever the system linker can already find (the Arch path,
    // where `vosk-api` installs libvosk.so into /usr/lib).
    if let Ok(override_dir) = env::var("FLOW_VOSK_LIB_DIR") {
        let override_path = PathBuf::from(&override_dir);
        let override_lib = override_path.join("libvosk.so");

        if !override_lib.is_file() {
            return Err(format!(
                "FLOW_VOSK_LIB_DIR is set to '{}' but no libvosk.so was found there.\n\
                 Install the Vosk API runtime (e.g. `sudo pacman -S vosk-api` on Arch \
                 Linux) or point FLOW_VOSK_LIB_DIR at a directory containing libvosk.so.",
                override_path.display()
            ));
        }

        emit_vosk_link_directives(&override_path);
        return Ok(());
    }

    if vendored_lib.is_file() {
        emit_vosk_link_directives(&vendored_dir);

        let profile_dir = resolve_profile_dir()?;
        fs::create_dir_all(&profile_dir).map_err(|error| error.to_string())?;
        let destination = profile_dir.join("libvosk.so");
        copy_if_changed(&vendored_lib, &destination)?;

        return Ok(());
    }

    if let Some(system_dir) = find_system_vosk_lib_dir() {
        emit_vosk_link_directives(&system_dir);
        return Ok(());
    }

    Err(
        "Could not find libvosk.so for the Linux build.\n\
         Install the Vosk API runtime, e.g. `sudo pacman -S vosk-api` on Arch Linux,\n\
         or place a vendored copy at src-tauri/resources/vosk/linux-x64/libvosk.so\n\
         (see packaging/linux/fetch-vosk.sh), or set FLOW_VOSK_LIB_DIR to a directory\n\
         containing libvosk.so."
            .to_string(),
    )
}

fn emit_vosk_link_directives(dir: &Path) {
    println!("cargo:rustc-link-search=native={}", dir.display());
    println!("cargo:rustc-link-arg=-Wl,-rpath,$ORIGIN");
    println!("cargo:rustc-link-arg=-Wl,-rpath,$ORIGIN/../lib/flow");
}

fn find_system_vosk_lib_dir() -> Option<PathBuf> {
    let output = process::Command::new("ldconfig").arg("-p").output().ok()?;
    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    stdout.lines().find_map(|line| {
        let line = line.trim();
        if !line.starts_with("libvosk.so") {
            return None;
        }

        let resolved_path = line.rsplit("=> ").next()?.trim();
        PathBuf::from(resolved_path)
            .parent()
            .map(Path::to_path_buf)
    })
}

fn copy_if_changed(source: &Path, destination: &Path) -> Result<(), String> {
    if destination.is_file() {
        let source_metadata = fs::metadata(source).map_err(|error| error.to_string())?;
        let destination_metadata = fs::metadata(destination).map_err(|error| error.to_string())?;

        if source_metadata.len() == destination_metadata.len() {
            return Ok(());
        }
    }

    fs::copy(source, destination)
        .map(|_| ())
        .map_err(|error| error.to_string())
}

fn stage_runtime_file(source: &Path, destination: &Path) -> Result<(), String> {
    if destination.is_file() {
        let source_metadata = fs::metadata(source).map_err(|error| error.to_string())?;
        let destination_metadata = fs::metadata(destination).map_err(|error| error.to_string())?;

        if source_metadata.len() == destination_metadata.len() {
            return Ok(());
        }
    }

    match fs::copy(source, destination) {
        Ok(_) => Ok(()),
        Err(error) if destination.is_file() && error.raw_os_error() == Some(32) => {
            println!(
                "cargo:warning=Skipping locked Vosk runtime file {} during this build; the existing staged copy will be reused.",
                destination.display()
            );
            Ok(())
        }
        Err(error) => Err(error.to_string()),
    }
}

fn resolve_profile_dir() -> Result<PathBuf, String> {
    let out_dir = PathBuf::from(env::var("OUT_DIR").map_err(|error| error.to_string())?);

    for ancestor in out_dir.ancestors() {
        if is_profile_dir(ancestor) {
            return Ok(ancestor.to_path_buf());
        }
    }

    Err(format!(
        "Could not determine Cargo profile directory from OUT_DIR {}",
        out_dir.display()
    ))
}

fn is_profile_dir(path: &Path) -> bool {
    path.file_name()
        .and_then(|value| value.to_str())
        .is_some_and(|value| matches!(value, "debug" | "release"))
}
