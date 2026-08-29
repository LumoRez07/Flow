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
    collections::HashMap,
    sync::{
        mpsc::{sync_channel, SyncSender, TrySendError},
        Arc, Mutex, MutexGuard,
    },
    thread::{self, JoinHandle},
};

use cpal::{
    traits::{DeviceTrait, HostTrait, StreamTrait},
    BufferSize, Device, SampleFormat, SampleRate, Stream, StreamConfig, SupportedBufferSize,
    SupportedStreamConfig,
};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};
use vosk::{CompleteResult, DecodingState, Model, PartialResult, Recognizer, Word};

use crate::{ensure_voice_model_ready_for_model, normalize_voice_language};

const NATIVE_VOICE_EVENT: &str = "flow-native-voice-event";
const TARGET_SAMPLE_RATE: f32 = 16_000.0;
const AUDIO_QUEUE_CAPACITY: usize = 6;
const INPUT_BUFFER_TARGET_MS: u32 = 12;
const RECOGNIZER_BATCH_SAMPLES: usize = 320;

#[derive(Debug, Clone, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceInputSettings {
    pub(crate) device_id: Option<String>,
    pub(crate) device_label: Option<String>,
    pub(crate) noise_gate: Option<f32>,
    pub(crate) input_gain: Option<f32>,
}

impl VoiceInputSettings {
    fn normalized_device_label(&self) -> Option<String> {
        let label = normalized_device_match_key(self.device_label.as_deref().unwrap_or_default());
        (!label.is_empty()).then_some(label)
    }

    fn normalized_noise_gate(&self) -> f32 {
        self.noise_gate.unwrap_or(0.01).clamp(0.0, 0.08)
    }

    fn normalized_input_gain(&self) -> f32 {
        self.input_gain.unwrap_or(2.0).clamp(0.5, 4.0)
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceInputDeviceInfo {
    pub(crate) label: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeVoiceEvent {
    channel: String,
    stage: String,
    language: String,
    text: Option<String>,
    confidence: Option<f32>,
    words: Option<Vec<NativeVoiceWord>>,
    debug: Option<NativeVoiceDebugInfo>,
    error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeVoiceWord {
    word: String,
    start: f32,
    end: f32,
    confidence: f32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeVoiceDebugInfo {
    raw_text: Option<String>,
    sample_count: Option<usize>,
    word_count: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CaptureDebugInfo {
    device_name: String,
    channels: u16,
    sample_rate: u32,
    sample_format: String,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
struct RecognizerDebugState {
    last_stage: Option<String>,
    last_partial_text: Option<String>,
    last_partial_raw_text: Option<String>,
    last_final_text: Option<String>,
    last_confidence: Option<f32>,
    last_words: Vec<NativeVoiceWord>,
    last_error: Option<String>,
    last_sample_count: Option<usize>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceEngineDebugState {
    capture_active: bool,
    tracking_active: bool,
    command_active: bool,
    current_settings: Option<VoiceInputSettings>,
    capture: Option<CaptureDebugInfo>,
    tracking: Option<RecognizerDebugState>,
    commands: Option<RecognizerDebugState>,
    model_cache_languages: Vec<String>,
}

#[derive(Default)]
pub(crate) struct VoiceEngineState {
    inner: Mutex<VoiceEngine>,
}

impl VoiceEngineState {
    fn lock(&self) -> MutexGuard<'_, VoiceEngine> {
        self.inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
    }
}

#[derive(Default)]
struct VoiceEngine {
    capture: Option<CaptureSession>,
    shared: Option<Arc<Mutex<SharedVoiceState>>>,
    model_cache: HashMap<String, CachedModel>,
    current_settings: Option<VoiceInputSettings>,
    capture_debug: Option<CaptureDebugInfo>,
}

unsafe impl Send for VoiceEngine {}

struct CaptureSession {
    stream: Stream,
    worker: Option<JoinHandle<()>>,
}

struct CachedModel {
    path: String,
    model: Arc<Model>,
}

struct SharedVoiceState {
    app: AppHandle,
    tracking: Option<ActiveRecognizer>,
    commands: Option<ActiveRecognizer>,
}

struct ActiveRecognizer {
    language: String,
    recognizer: Recognizer,
    last_partial: String,
    debug_state: RecognizerDebugState,
}

struct CaptureProcessor {
    settings: VoiceInputSettings,
    resampler: LinearResampler,
}

struct LinearResampler {
    step: f32,
    position: f32,
    buffer: Vec<f32>,
}

#[tauri::command]
pub(crate) fn start_voice_tracking(
    app: AppHandle,
    voice_engine: State<'_, VoiceEngineState>,
    language: String,
    sound_input: VoiceInputSettings,
    model_id: Option<String>,
    grammar: Option<Vec<String>>,
) -> Result<(), String> {
    let mut engine = voice_engine.lock();
    let language = normalize_voice_language(&language).to_string();
    let model = engine.load_model(&app, &language, model_id.as_deref())?;
    engine.ensure_capture(&app, &sound_input)?;
    let recognizer = build_active_recognizer(model, language.clone(), grammar)?;

    if let Some(shared) = &engine.shared {
        let mut shared = shared
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        shared.app = app.clone();
        shared.tracking = Some(recognizer);
    }

    emit_started_event(&app, "tracking", &language);
    Ok(())
}

#[tauri::command]
pub(crate) fn stop_voice_tracking(
    app: AppHandle,
    voice_engine: State<'_, VoiceEngineState>,
) -> Result<(), String> {
    let mut engine = voice_engine.lock();
    engine.stop_tracking(&app)
}

#[tauri::command]
pub(crate) fn start_voice_command_listener(
    app: AppHandle,
    voice_engine: State<'_, VoiceEngineState>,
    language: String,
    sound_input: VoiceInputSettings,
    model_id: Option<String>,
    grammar: Option<Vec<String>>,
) -> Result<(), String> {
    let mut engine = voice_engine.lock();
    let language = normalize_voice_language(&language).to_string();
    let model = engine.load_model(&app, &language, model_id.as_deref())?;
    engine.ensure_capture(&app, &sound_input)?;
    let recognizer = build_active_recognizer(model, language.clone(), grammar)?;

    if let Some(shared) = &engine.shared {
        let mut shared = shared
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        shared.app = app.clone();
        shared.commands = Some(recognizer);
    }

    emit_started_event(&app, "commands", &language);
    Ok(())
}

#[tauri::command]
pub(crate) fn stop_voice_command_listener(
    app: AppHandle,
    voice_engine: State<'_, VoiceEngineState>,
) -> Result<(), String> {
    let mut engine = voice_engine.lock();
    engine.stop_commands(&app)
}

#[allow(dead_code)]
#[tauri::command]
pub(crate) fn get_voice_engine_debug_state(
    voice_engine: State<'_, VoiceEngineState>,
) -> Result<VoiceEngineDebugState, String> {
    let engine = voice_engine.lock();
    Ok(engine.build_debug_state())
}

#[tauri::command]
pub(crate) fn list_input_devices() -> Result<Vec<VoiceInputDeviceInfo>, String> {
    let host = cpal::default_host();
    let devices = host
        .input_devices()
        .map_err(|error| format!("Failed to enumerate microphones: {error}"))?;

    #[allow(unused_mut)]
    let mut devices: Vec<VoiceInputDeviceInfo> = devices
        .filter_map(|device| {
            let label = device.name().unwrap_or_default().trim().to_string();
            (!label.is_empty()).then_some(VoiceInputDeviceInfo { label })
        })
        .collect();

    #[cfg(target_os = "linux")]
    {
        devices.retain(|device| is_selectable_linux_input_device(&device.label));
        devices.sort_by(|a, b| linux_input_device_sort_key(&a.label).cmp(&linux_input_device_sort_key(&b.label)));
    }

    Ok(devices)
}

/// ALSA enumerates every PCM name a card's plugin chain defines, not just the
/// ones that make sense for microphone capture. On a typical Linux desktop
/// (verified against a live PipeWire-routed ALSA stack) this includes
/// resampler/plugin building blocks (`speexrate`, `lavrate`, `jack`, `upmix`,
/// ...) and output-routing topology variants (`front:`, `surroundNN:`,
/// `iec958:`) that were never meant to be picked directly as an input device.
/// This filters those out so the Settings UI shows a short, meaningful list.
#[cfg(target_os = "linux")]
const ALSA_NON_DEVICE_PLUGIN_NAMES: &[&str] = &[
    "lavrate",
    "samplerate",
    "speexrate",
    "speex",
    "jack",
    "upmix",
    "vdownmix",
];

#[cfg(target_os = "linux")]
fn is_selectable_linux_input_device(label: &str) -> bool {
    if ALSA_NON_DEVICE_PLUGIN_NAMES.contains(&label) {
        return false;
    }

    let is_output_topology_variant = label.starts_with("front:")
        || label.starts_with("surround")
        || label.starts_with("iec958:");

    !is_output_topology_variant
}

/// Ranks the common cross-desktop virtual devices first (in the order a user
/// is most likely to want them), then per-card `sysdefault:CARD=...` entries,
/// then anything else (e.g. raw `hw:`/`plughw:` devices on setups without a
/// sound server) last.
#[cfg(target_os = "linux")]
const ALSA_PREFERRED_DEVICE_ORDER: &[&str] = &["default", "pipewire", "pulse"];

#[cfg(target_os = "linux")]
fn linux_input_device_sort_key(label: &str) -> (u8, String) {
    if let Some(position) = ALSA_PREFERRED_DEVICE_ORDER
        .iter()
        .position(|preferred| *preferred == label)
    {
        return (0, format!("{position}"));
    }

    if label.starts_with("sysdefault:") {
        return (1, label.to_lowercase());
    }

    (2, label.to_lowercase())
}

impl VoiceEngine {
    fn build_debug_state(&self) -> VoiceEngineDebugState {
        let (tracking, commands) = self
            .shared
            .as_ref()
            .and_then(|shared| shared.lock().ok())
            .map(|shared| {
                (
                    shared
                        .tracking
                        .as_ref()
                        .map(|recognizer| recognizer.debug_state.clone()),
                    shared
                        .commands
                        .as_ref()
                        .map(|recognizer| recognizer.debug_state.clone()),
                )
            })
            .unwrap_or((None, None));

        let mut model_cache_languages = self.model_cache.keys().cloned().collect::<Vec<_>>();
        model_cache_languages.sort();

        VoiceEngineDebugState {
            capture_active: self.capture.is_some(),
            tracking_active: tracking.is_some(),
            command_active: commands.is_some(),
            current_settings: self.current_settings.clone(),
            capture: self.capture_debug.clone(),
            tracking,
            commands,
            model_cache_languages,
        }
    }

    fn load_model(
        &mut self,
        app: &AppHandle,
        language: &str,
        model_id: Option<&str>,
    ) -> Result<Arc<Model>, String> {
        let model_path = ensure_voice_model_ready_for_model(app, language, model_id)?;
        let normalized_language = normalize_voice_language(language).to_string();
        let normalized_model_id = model_id.unwrap_or_default().trim();
        let cache_key = if normalized_model_id.is_empty() {
            normalized_language
        } else {
            format!("{normalized_language}::{normalized_model_id}")
        };
        let model_path_string = model_path.to_string_lossy().to_string();

        if let Some(cached) = self.model_cache.get(&cache_key) {
            if cached.path == model_path_string {
                return Ok(cached.model.clone());
            }
        }

        let model = Model::new(model_path_string.clone())
            .map(Arc::new)
            .ok_or_else(|| format!("Failed to load Vosk model from {}", model_path.display()))?;

        self.model_cache.insert(
            cache_key,
            CachedModel {
                path: model_path_string,
                model: model.clone(),
            },
        );

        Ok(model)
    }

    fn ensure_capture(
        &mut self,
        app: &AppHandle,
        settings: &VoiceInputSettings,
    ) -> Result<(), String> {
        if self.capture.is_some() && self.current_settings.as_ref() != Some(settings) {
            self.stop_all_internal(app)?;
        }

        if self.capture.is_some() {
            if let Some(shared) = &self.shared {
                let mut shared = shared
                    .lock()
                    .unwrap_or_else(|poisoned| poisoned.into_inner());
                shared.app = app.clone();
            }
            return Ok(());
        }

        let device = select_input_device(settings)?;
        let supported_config = select_input_config(&device)?;
        let shared = Arc::new(Mutex::new(SharedVoiceState {
            app: app.clone(),
            tracking: None,
            commands: None,
        }));
        let capture =
            build_capture_session(&device, &supported_config, settings.clone(), shared.clone())?;
        capture
            .stream
            .play()
            .map_err(|error| format!("Failed to activate microphone capture: {error}"))?;

        self.capture = Some(capture);
        self.shared = Some(shared);
        self.current_settings = Some(settings.clone());
        self.capture_debug = Some(CaptureDebugInfo {
            device_name: device
                .name()
                .unwrap_or_else(|_| "Unknown microphone".to_string()),
            channels: supported_config.channels(),
            sample_rate: supported_config.sample_rate().0,
            sample_format: format!("{:?}", supported_config.sample_format()),
        });

        Ok(())
    }

    fn stop_tracking(&mut self, app: &AppHandle) -> Result<(), String> {
        let language = if let Some(shared) = &self.shared {
            let mut shared = shared
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());
            if let Some(recognizer) = shared.tracking.take() {
                let language = recognizer.language.clone();
                flush_recognizer(&shared.app, "tracking", recognizer);
                language
            } else {
                normalize_voice_language("en-US").to_string()
            }
        } else {
            normalize_voice_language("en-US").to_string()
        };

        emit_stopped_event(app, "tracking", &language);
        self.teardown_if_idle();
        Ok(())
    }

    fn stop_commands(&mut self, app: &AppHandle) -> Result<(), String> {
        let language = if let Some(shared) = &self.shared {
            let mut shared = shared
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());
            if let Some(recognizer) = shared.commands.take() {
                let language = recognizer.language.clone();
                flush_recognizer(&shared.app, "commands", recognizer);
                language
            } else {
                normalize_voice_language("en-US").to_string()
            }
        } else {
            normalize_voice_language("en-US").to_string()
        };

        emit_stopped_event(app, "commands", &language);
        self.teardown_if_idle();
        Ok(())
    }

    fn stop_all_internal(&mut self, app: &AppHandle) -> Result<(), String> {
        if let Some(shared) = &self.shared {
            let mut shared = shared
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());
            if let Some(recognizer) = shared.tracking.take() {
                flush_recognizer(&shared.app, "tracking", recognizer);
            }
            if let Some(recognizer) = shared.commands.take() {
                flush_recognizer(&shared.app, "commands", recognizer);
            }
        }

        self.stop_capture();
        emit_stopped_event(app, "tracking", normalize_voice_language("en-US"));
        emit_stopped_event(app, "commands", normalize_voice_language("en-US"));
        Ok(())
    }

    fn teardown_if_idle(&mut self) {
        let should_stop = self
            .shared
            .as_ref()
            .and_then(|shared| {
                let shared = shared.lock().ok()?;
                Some(shared.tracking.is_none() && shared.commands.is_none())
            })
            .unwrap_or(true);

        if should_stop {
            self.stop_capture();
            self.model_cache.clear();
        }
    }

    fn stop_capture(&mut self) {
        if let Some(capture) = self.capture.take() {
            let CaptureSession { stream, worker } = capture;
            drop(stream);
            if let Some(worker) = worker {
                let _ = worker.join();
            }
        }

        self.shared = None;
        self.current_settings = None;
        self.capture_debug = None;
    }
}

impl CaptureProcessor {
    fn new(settings: VoiceInputSettings, input_sample_rate: f32) -> Self {
        Self {
            settings,
            resampler: LinearResampler::new(input_sample_rate, TARGET_SAMPLE_RATE),
        }
    }

    fn process_i16(&mut self, data: &[i16], channels: usize) -> Vec<i16> {
        self.process_f32(&interleaved_to_mono_f32_i16(data, channels))
    }

    fn process_u16(&mut self, data: &[u16], channels: usize) -> Vec<i16> {
        self.process_f32(&interleaved_to_mono_f32_u16(data, channels))
    }

    fn process_raw_f32(&mut self, data: &[f32], channels: usize) -> Vec<i16> {
        self.process_f32(&interleaved_to_mono_f32(data, channels))
    }

    fn process_f32(&mut self, mono_samples: &[f32]) -> Vec<i16> {
        let prepared = apply_voice_input_settings(mono_samples, &self.settings);
        if prepared.is_empty() {
            return Vec::new();
        }

        let resampled = self.resampler.process(&prepared);
        if resampled.is_empty() {
            return Vec::new();
        }

        resampled
            .into_iter()
            .map(|sample| (sample.clamp(-1.0, 1.0) * i16::MAX as f32) as i16)
            .collect()
    }
}

impl LinearResampler {
    fn new(input_sample_rate: f32, output_sample_rate: f32) -> Self {
        let safe_input_sample_rate = input_sample_rate.max(1.0);
        let safe_output_sample_rate = output_sample_rate.max(1.0);

        Self {
            step: safe_input_sample_rate / safe_output_sample_rate,
            position: 0.0,
            buffer: Vec::new(),
        }
    }

    fn process(&mut self, input: &[f32]) -> Vec<f32> {
        if input.is_empty() {
            return Vec::new();
        }

        self.buffer.extend_from_slice(input);
        if self.buffer.len() < 2 {
            return Vec::new();
        }

        let estimated_output = ((input.len() as f32) / self.step).ceil() as usize;
        let mut output = Vec::with_capacity(estimated_output.max(1));

        while self.position + 1.0 < self.buffer.len() as f32 {
            let left_index = self.position.floor() as usize;
            let right_index = (left_index + 1).min(self.buffer.len() - 1);
            let fraction = self.position - left_index as f32;
            let left = self.buffer[left_index];
            let right = self.buffer[right_index];
            output.push(left + (right - left) * fraction);
            self.position += self.step;
        }

        let drain_until = self.position.floor() as usize;
        if drain_until > 0 {
            self.buffer.drain(0..drain_until);
            self.position -= drain_until as f32;
        }

        output
    }
}

fn build_capture_session(
    device: &Device,
    config: &cpal::SupportedStreamConfig,
    settings: VoiceInputSettings,
    shared: Arc<Mutex<SharedVoiceState>>,
) -> Result<CaptureSession, String> {
    let (audio_tx, audio_rx) = sync_channel::<Vec<i16>>(AUDIO_QUEUE_CAPACITY);
    let worker_shared = shared.clone();
    let worker = thread::spawn(move || {
        while let Ok(samples) = audio_rx.recv() {
            process_audio_chunk(&worker_shared, &samples);
        }
    });

    let stream = build_input_stream(device, config, settings, audio_tx, shared)?;
    Ok(CaptureSession {
        stream,
        worker: Some(worker),
    })
}

fn build_active_recognizer(
    model: Arc<Model>,
    language: String,
    grammar: Option<Vec<String>>,
) -> Result<ActiveRecognizer, String> {
    let mut recognizer =
        if let Some(grammar) = grammar.as_ref().filter(|phrases| !phrases.is_empty()) {
            Recognizer::new_with_grammar(model.as_ref(), TARGET_SAMPLE_RATE, grammar)
                .ok_or_else(|| format!("Failed to create grammar Vosk recognizer for {language}"))?
        } else {
            Recognizer::new(model.as_ref(), TARGET_SAMPLE_RATE)
                .ok_or_else(|| format!("Failed to create Vosk recognizer for {language}"))?
        };

    recognizer.set_words(true);
    recognizer.set_partial_words(true);

    Ok(ActiveRecognizer {
        language,
        recognizer,
        last_partial: String::new(),
        debug_state: RecognizerDebugState::default(),
    })
}

fn select_input_device(settings: &VoiceInputSettings) -> Result<Device, String> {
    let host = cpal::default_host();

    if let Some(requested_label) = settings.normalized_device_label() {
        let devices = host
            .input_devices()
            .map_err(|error| format!("Failed to enumerate microphones: {error}"))?;

        for device in devices {
            let name = device.name().unwrap_or_default();
            let normalized_name = normalized_device_match_key(&name);
            if normalized_name == requested_label
                || normalized_name.contains(&requested_label)
                || requested_label.contains(&normalized_name)
            {
                return Ok(device);
            }
        }
    }

    host.default_input_device()
        .ok_or_else(|| "No microphone detected".to_string())
}

fn normalized_device_match_key(value: &str) -> String {
    value
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .trim()
        .to_ascii_lowercase()
}

fn select_input_config(device: &Device) -> Result<SupportedStreamConfig, String> {
    let mut supported_configs = device
        .supported_input_configs()
        .map_err(|error| format!("Failed to enumerate microphone formats: {error}"))?
        .collect::<Vec<_>>();

    if supported_configs.is_empty() {
        return device
            .default_input_config()
            .map_err(|error| format!("Failed to read microphone config: {error}"));
    }

    supported_configs.sort_by(|left, right| {
        let left_score = input_config_score(left.channels(), left.sample_format());
        let right_score = input_config_score(right.channels(), right.sample_format());
        left_score.cmp(&right_score)
    });

    let selected_range = supported_configs
        .into_iter()
        .next()
        .ok_or_else(|| "No usable microphone format found".to_string())?;

    let selected_rate = choose_sample_rate(
        selected_range.min_sample_rate().0,
        selected_range.max_sample_rate().0,
    );

    Ok(selected_range.with_sample_rate(SampleRate(selected_rate)))
}

fn input_config_score(channels: u16, sample_format: SampleFormat) -> (u8, u8) {
    let channel_score = if channels == 1 { 0 } else { 1 };
    let format_score = match sample_format {
        SampleFormat::I16 => 0,
        SampleFormat::F32 => 1,
        SampleFormat::U16 => 2,
        _ => 3,
    };

    (channel_score, format_score)
}

fn choose_sample_rate(min_rate: u32, max_rate: u32) -> u32 {
    if min_rate <= 16_000 && 16_000 <= max_rate {
        return 16_000;
    }

    if min_rate <= 48_000 && 48_000 <= max_rate {
        return 48_000;
    }

    48_000.clamp(min_rate, max_rate)
}

fn build_input_stream(
    device: &Device,
    config: &cpal::SupportedStreamConfig,
    settings: VoiceInputSettings,
    audio_tx: SyncSender<Vec<i16>>,
    shared: Arc<Mutex<SharedVoiceState>>,
) -> Result<Stream, String> {
    let channels = config.channels() as usize;
    let input_sample_rate = config.sample_rate().0 as f32;
    let mut stream_config: StreamConfig = config.clone().into();
    stream_config.buffer_size = select_input_buffer_size(config);
    let error_shared = shared.clone();
    let error_callback = move |error| {
        if let Ok(shared) = error_shared.lock() {
            emit_stream_error(&shared.app, format!("Microphone stream error: {error}"));
        }
    };

    match config.sample_format() {
        SampleFormat::I16 => {
            let mut processor = CaptureProcessor::new(settings, input_sample_rate);
            device
                .build_input_stream(
                    &stream_config,
                    move |data: &[i16], _| {
                        forward_audio_chunk(
                            &audio_tx,
                            processor.process_i16(data, channels),
                            &shared,
                        )
                    },
                    error_callback,
                    None,
                )
                .map_err(|error| error.to_string())
        }
        SampleFormat::U16 => {
            let mut processor = CaptureProcessor::new(settings, input_sample_rate);
            device
                .build_input_stream(
                    &stream_config,
                    move |data: &[u16], _| {
                        forward_audio_chunk(
                            &audio_tx,
                            processor.process_u16(data, channels),
                            &shared,
                        )
                    },
                    error_callback,
                    None,
                )
                .map_err(|error| error.to_string())
        }
        SampleFormat::F32 => {
            let mut processor = CaptureProcessor::new(settings, input_sample_rate);
            device
                .build_input_stream(
                    &stream_config,
                    move |data: &[f32], _| {
                        forward_audio_chunk(
                            &audio_tx,
                            processor.process_raw_f32(data, channels),
                            &shared,
                        )
                    },
                    error_callback,
                    None,
                )
                .map_err(|error| error.to_string())
        }
        sample_format => Err(format!(
            "Unsupported microphone sample format: {sample_format:?}"
        )),
    }
}

fn select_input_buffer_size(config: &SupportedStreamConfig) -> BufferSize {
    let target_frames = ((config.sample_rate().0 as u64 * INPUT_BUFFER_TARGET_MS as u64) / 1000)
        .max(128)
        .min(u32::MAX as u64) as u32;

    match config.buffer_size() {
        SupportedBufferSize::Range { min, max } => {
            BufferSize::Fixed(target_frames.clamp(*min, *max))
        }
        SupportedBufferSize::Unknown => BufferSize::Default,
    }
}

fn forward_audio_chunk(
    audio_tx: &SyncSender<Vec<i16>>,
    samples: Vec<i16>,
    shared: &Arc<Mutex<SharedVoiceState>>,
) {
    if samples.is_empty() {
        return;
    }

    match audio_tx.try_send(samples) {
        Ok(()) => {}
        Err(TrySendError::Full(_)) => {}
        Err(TrySendError::Disconnected(_)) => {
            if let Ok(shared) = shared.lock() {
                emit_stream_error(
                    &shared.app,
                    "Native voice worker stopped unexpectedly".to_string(),
                );
            }
        }
    }
}

fn process_audio_chunk(shared: &Arc<Mutex<SharedVoiceState>>, samples: &[i16]) {
    if samples.is_empty() {
        return;
    }

    let mut shared = match shared.lock() {
        Ok(shared) => shared,
        Err(poisoned) => poisoned.into_inner(),
    };

    let app = shared.app.clone();

    if let Some(tracking) = shared.tracking.as_mut() {
        feed_recognizer_in_batches(&app, "tracking", tracking, samples);
    }

    if let Some(commands) = shared.commands.as_mut() {
        feed_recognizer_in_batches(&app, "commands", commands, samples);
    }
}

fn feed_recognizer_in_batches(
    app: &AppHandle,
    channel: &str,
    recognizer: &mut ActiveRecognizer,
    samples: &[i16],
) {
    if samples.len() <= RECOGNIZER_BATCH_SAMPLES {
        feed_recognizer(app, channel, recognizer, samples);
        return;
    }

    for chunk in samples.chunks(RECOGNIZER_BATCH_SAMPLES) {
        if chunk.is_empty() {
            continue;
        }

        feed_recognizer(app, channel, recognizer, chunk);
    }
}

fn feed_recognizer(
    app: &AppHandle,
    channel: &str,
    recognizer: &mut ActiveRecognizer,
    samples: &[i16],
) {
    match recognizer.recognizer.accept_waveform(samples) {
        Ok(DecodingState::Running) => {
            let partial = recognizer.recognizer.partial_result();
            let raw_text = normalize_optional_text(partial.partial);
            let text = extract_partial_text(&partial);
            if text.is_empty() || text == recognizer.last_partial {
                return;
            }

            recognizer.last_partial = text.clone();
            let word_count = partial.partial_result.len();
            recognizer.debug_state.last_stage = Some("partial".into());
            recognizer.debug_state.last_partial_text = Some(text.clone());
            recognizer.debug_state.last_partial_raw_text = raw_text.clone();
            recognizer.debug_state.last_confidence = average_confidence(&partial.partial_result);
            recognizer.debug_state.last_words =
                serialize_words(&partial.partial_result).unwrap_or_default();
            recognizer.debug_state.last_error = None;
            recognizer.debug_state.last_sample_count = Some(samples.len());
            emit_native_voice_event(
                app,
                NativeVoiceEvent {
                    channel: channel.to_string(),
                    stage: "partial".into(),
                    language: recognizer.language.clone(),
                    text: Some(text),
                    confidence: average_confidence(&partial.partial_result),
                    words: serialize_words(&partial.partial_result),
                    debug: Some(NativeVoiceDebugInfo {
                        raw_text,
                        sample_count: Some(samples.len()),
                        word_count,
                    }),
                    error: None,
                },
            );
        }
        Ok(DecodingState::Finalized) => {
            recognizer.last_partial.clear();
            if let Some(details) =
                build_complete_event_details(recognizer.recognizer.result(), Some(samples.len()))
            {
                recognizer.debug_state.last_stage = Some("final".into());
                recognizer.debug_state.last_partial_text = None;
                recognizer.debug_state.last_partial_raw_text = None;
                recognizer.debug_state.last_final_text = Some(details.text.clone());
                recognizer.debug_state.last_confidence = details.confidence;
                recognizer.debug_state.last_words = details.words.clone().unwrap_or_default();
                recognizer.debug_state.last_error = None;
                recognizer.debug_state.last_sample_count = Some(samples.len());
                emit_native_voice_event(
                    app,
                    NativeVoiceEvent {
                        channel: channel.to_string(),
                        stage: "final".into(),
                        language: recognizer.language.clone(),
                        text: Some(details.text),
                        confidence: details.confidence,
                        words: details.words,
                        debug: Some(details.debug),
                        error: None,
                    },
                );
            }
        }
        Ok(DecodingState::Failed) => {
            recognizer.debug_state.last_stage = Some("error".into());
            recognizer.debug_state.last_error = Some("Vosk decoding failed".into());
            recognizer.debug_state.last_sample_count = Some(samples.len());
            emit_native_voice_event(
                app,
                NativeVoiceEvent {
                    channel: channel.to_string(),
                    stage: "error".into(),
                    language: recognizer.language.clone(),
                    text: None,
                    confidence: None,
                    words: None,
                    debug: Some(NativeVoiceDebugInfo {
                        raw_text: None,
                        sample_count: Some(samples.len()),
                        word_count: 0,
                    }),
                    error: Some("Vosk decoding failed".into()),
                },
            );
        }
        Err(error) => {
            let error_message = format!("Vosk decoding failed: {error}");
            recognizer.debug_state.last_stage = Some("error".into());
            recognizer.debug_state.last_error = Some(error_message.clone());
            recognizer.debug_state.last_sample_count = Some(samples.len());
            emit_native_voice_event(
                app,
                NativeVoiceEvent {
                    channel: channel.to_string(),
                    stage: "error".into(),
                    language: recognizer.language.clone(),
                    text: None,
                    confidence: None,
                    words: None,
                    debug: Some(NativeVoiceDebugInfo {
                        raw_text: None,
                        sample_count: Some(samples.len()),
                        word_count: 0,
                    }),
                    error: Some(error_message),
                },
            );
        }
    }
}

fn extract_partial_text(partial: &PartialResult<'_>) -> String {
    let text = partial.partial.trim();
    if !text.is_empty() {
        return text.to_string();
    }

    partial
        .partial_result
        .iter()
        .map(|word| word.word.to_string())
        .filter(|word| !word.is_empty())
        .collect::<Vec<_>>()
        .join(" ")
        .trim()
        .to_string()
}

fn flush_recognizer(app: &AppHandle, channel: &str, mut recognizer: ActiveRecognizer) {
    recognizer.last_partial.clear();
    if let Some(details) = build_complete_event_details(recognizer.recognizer.final_result(), None)
    {
        emit_native_voice_event(
            app,
            NativeVoiceEvent {
                channel: channel.to_string(),
                stage: "final".into(),
                language: recognizer.language.clone(),
                text: Some(details.text),
                confidence: details.confidence,
                words: details.words,
                debug: Some(details.debug),
                error: None,
            },
        );
    }
}

struct CompleteEventDetails {
    text: String,
    confidence: Option<f32>,
    words: Option<Vec<NativeVoiceWord>>,
    debug: NativeVoiceDebugInfo,
}

fn build_complete_event_details(
    result: CompleteResult<'_>,
    sample_count: Option<usize>,
) -> Option<CompleteEventDetails> {
    match result {
        CompleteResult::Single(single) => {
            let text = single.text.trim().to_string();
            if text.is_empty() {
                return None;
            }

            let word_count = single.result.len();
            Some(CompleteEventDetails {
                text: text.clone(),
                confidence: average_confidence(&single.result),
                words: serialize_words(&single.result),
                debug: NativeVoiceDebugInfo {
                    raw_text: Some(text),
                    sample_count,
                    word_count,
                },
            })
        }
        CompleteResult::Multiple(multiple) => {
            let alternative = multiple.alternatives.into_iter().next()?;
            let text = alternative.text.trim().to_string();
            if text.is_empty() {
                return None;
            }

            Some(CompleteEventDetails {
                text: text.clone(),
                confidence: Some(alternative.confidence),
                words: None,
                debug: NativeVoiceDebugInfo {
                    raw_text: Some(text),
                    sample_count,
                    word_count: 0,
                },
            })
        }
    }
}

fn serialize_words(words: &[Word<'_>]) -> Option<Vec<NativeVoiceWord>> {
    let words = words
        .iter()
        .map(|word| NativeVoiceWord {
            word: word.word.to_string(),
            start: word.start,
            end: word.end,
            confidence: word.conf,
        })
        .collect::<Vec<_>>();
    (!words.is_empty()).then_some(words)
}

fn normalize_optional_text(value: &str) -> Option<String> {
    let value = value.trim();
    (!value.is_empty()).then(|| value.to_string())
}

fn average_confidence(words: &[Word<'_>]) -> Option<f32> {
    let (sum, count) = words.iter().fold((0.0, 0usize), |(sum, count), word| {
        (sum + word.conf, count + 1)
    });
    (count > 0).then_some(sum / count as f32)
}

fn apply_voice_input_settings(samples: &[f32], settings: &VoiceInputSettings) -> Vec<f32> {
    if samples.is_empty() {
        return Vec::new();
    }

    let input_gain = settings.normalized_input_gain();
    let noise_gate = settings.normalized_noise_gate();
    let mut sum_squares = 0.0f32;
    let mut peak = 0.0f32;

    for sample in samples {
        let scaled = *sample * input_gain;
        sum_squares += scaled * scaled;
        peak = peak.max(scaled.abs());
    }

    let rms_level = (sum_squares / samples.len() as f32).sqrt();
    let limiter_scale = if peak > 0.985 { 0.985 / peak } else { 1.0 };
    let gate_scale = if noise_gate > 0.0 && rms_level < noise_gate {
        (rms_level / noise_gate.max(0.0001)).max(0.18)
    } else {
        1.0
    };

    samples
        .iter()
        .map(|sample| (*sample * input_gain * limiter_scale * gate_scale).clamp(-1.0, 1.0))
        .collect()
}

fn interleaved_to_mono_f32_i16(data: &[i16], channels: usize) -> Vec<f32> {
    interleaved_to_mono(data.len(), channels, |index| {
        data[index] as f32 / i16::MAX as f32
    })
}

fn interleaved_to_mono_f32_u16(data: &[u16], channels: usize) -> Vec<f32> {
    interleaved_to_mono(data.len(), channels, |index| {
        (data[index] as f32 / u16::MAX as f32) * 2.0 - 1.0
    })
}

fn interleaved_to_mono_f32(data: &[f32], channels: usize) -> Vec<f32> {
    interleaved_to_mono(data.len(), channels, |index| data[index])
}

fn interleaved_to_mono<F>(length: usize, channels: usize, mut sample_at: F) -> Vec<f32>
where
    F: FnMut(usize) -> f32,
{
    if channels <= 1 {
        return (0..length).map(&mut sample_at).collect();
    }

    let mut mono = Vec::with_capacity(length / channels.max(1));
    let channel_count = channels as f32;
    let mut index = 0usize;
    while index + channels <= length {
        let mut sum = 0.0f32;
        for channel in 0..channels {
            sum += sample_at(index + channel);
        }
        mono.push(sum / channel_count);
        index += channels;
    }

    mono
}

fn emit_started_event(app: &AppHandle, channel: &str, language: &str) {
    emit_native_voice_event(
        app,
        NativeVoiceEvent {
            channel: channel.to_string(),
            stage: "started".into(),
            language: language.to_string(),
            text: None,
            confidence: None,
            words: None,
            debug: None,
            error: None,
        },
    );
}

fn emit_stopped_event(app: &AppHandle, channel: &str, language: &str) {
    emit_native_voice_event(
        app,
        NativeVoiceEvent {
            channel: channel.to_string(),
            stage: "stopped".into(),
            language: language.to_string(),
            text: None,
            confidence: None,
            words: None,
            debug: None,
            error: None,
        },
    );
}

fn emit_stream_error(app: &AppHandle, error: String) {
    emit_native_voice_event(
        app,
        NativeVoiceEvent {
            channel: "tracking".into(),
            stage: "error".into(),
            language: normalize_voice_language("en-US").into(),
            text: None,
            confidence: None,
            words: None,
            debug: None,
            error: Some(error.clone()),
        },
    );
    emit_native_voice_event(
        app,
        NativeVoiceEvent {
            channel: "commands".into(),
            stage: "error".into(),
            language: normalize_voice_language("en-US").into(),
            text: None,
            confidence: None,
            words: None,
            debug: None,
            error: Some(error),
        },
    );
}

fn emit_native_voice_event(app: &AppHandle, payload: NativeVoiceEvent) {
    let _ = app.emit(NATIVE_VOICE_EVENT, payload);
}

