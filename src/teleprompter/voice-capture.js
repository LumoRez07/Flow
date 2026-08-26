/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { defaultState, clamp, parseLocaleNumber } from "../shared.js";
import {
  VOICE_CAPTURE_ERROR_PERMISSION_DENIED,
  VOICE_CAPTURE_ERROR_NO_DEVICE,
  VOICE_CAPTURE_ERROR_UNAVAILABLE,
  VOSK_SCRIPT_PROCESSOR_FALLBACK_BUFFER_SIZE
} from "./voice-constants.js";

const DEFAULT_WORKLET_URL = new URL("../assets/vendor/voice-capture-worklet.js", import.meta.url).href;
const voiceCaptureWorkletModulePromises = new WeakMap();

export function clampSoundInputNumber(value, min, max, fallback) {
  const numericValue = parseLocaleNumber(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return clamp(numericValue, min, max);
}

export function normalizeSoundInputDeviceId(value) {
  const normalizedValue = String(value || "").trim();
  return normalizedValue || defaultState.appearance.soundInputDeviceId;
}

export function normalizeSoundInputDeviceLabel(value) {
  return String(value || "").trim();
}

export function getSoundInputSettings(appearance = defaultState.appearance) {
  const source = appearance || defaultState.appearance;
  return {
    deviceId: normalizeSoundInputDeviceId(source.soundInputDeviceId || defaultState.appearance.soundInputDeviceId),
    deviceLabel: normalizeSoundInputDeviceLabel(source.soundInputDeviceLabel || defaultState.appearance.soundInputDeviceLabel),
    noiseGate: clampSoundInputNumber(source.soundInputNoiseGate, 0, 0.08, defaultState.appearance.soundInputNoiseGate),
    inputGain: clampSoundInputNumber(source.soundInputGain, 0.5, 4, defaultState.appearance.soundInputGain)
  };
}

export function getVoiceCaptureSettingsSignature(appearance = defaultState.appearance) {
  return JSON.stringify(getSoundInputSettings(appearance));
}

export function buildVoiceCaptureAudioConstraints(soundInputSettings = getSoundInputSettings()) {
  const constraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: false,
    channelCount: 1
  };

  if (soundInputSettings.deviceId !== defaultState.appearance.soundInputDeviceId) {
    constraints.deviceId = { exact: soundInputSettings.deviceId };
  }

  return constraints;
}

export function createVoiceCaptureError(code, message, cause = null) {
  const error = new Error(message);
  error.name = "VoiceCaptureError";
  error.code = code;
  if (cause) {
    error.cause = cause;
  }
  return error;
}

export function stopMediaStreamTracks(mediaStream) {
  mediaStream?.getTracks?.().forEach((track) => {
    track.enabled = false;
    track.stop();
  });
}

export function normalizeVoiceCaptureError(error) {
  if (error?.code === VOICE_CAPTURE_ERROR_PERMISSION_DENIED
    || error?.code === VOICE_CAPTURE_ERROR_NO_DEVICE
    || error?.code === VOICE_CAPTURE_ERROR_UNAVAILABLE) {
    return error;
  }

  const message = String(error?.message || error || "").trim();
  const name = String(error?.name || "").trim();

  if (/NotAllowedError|SecurityError/i.test(name) || /permission|denied|notallowed/i.test(message)) {
    return createVoiceCaptureError(VOICE_CAPTURE_ERROR_PERMISSION_DENIED, "Microphone permission denied", error);
  }

  if (/NotFoundError|DevicesNotFoundError/i.test(name) || /no microphone|requested device not found/i.test(message)) {
    return createVoiceCaptureError(VOICE_CAPTURE_ERROR_NO_DEVICE, "No microphone detected", error);
  }

  if (/NotReadableError|TrackStartError|AbortError|OverconstrainedError/i.test(name)) {
    return createVoiceCaptureError(VOICE_CAPTURE_ERROR_UNAVAILABLE, "Microphone unavailable", error);
  }

  return createVoiceCaptureError(VOICE_CAPTURE_ERROR_UNAVAILABLE, message || "Microphone unavailable", error);
}

export function processVoiceCaptureSamples(samples, soundInputSettings = getSoundInputSettings()) {
  if (!samples?.length) {
    return samples;
  }

  const inputGain = clampSoundInputNumber(soundInputSettings.inputGain, 0.5, 4, 1);
  const noiseGate = clampSoundInputNumber(soundInputSettings.noiseGate, 0, 0.08, 0);
  let sumSquares = 0;
  let peak = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index] * inputGain;
    sumSquares += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
  }

  const rmsLevel = Math.sqrt(sumSquares / samples.length);
  const limiterScale = peak > 0.985 ? 0.985 / peak : 1;
  const gateScale = noiseGate > 0 && rmsLevel < noiseGate
    ? Math.max(rmsLevel / Math.max(noiseGate, 0.0001), 0.18)
    : 1;
  const finalScale = inputGain * limiterScale * gateScale;

  if (Math.abs(finalScale - 1) < 0.001) {
    return samples;
  }

  const processedSamples = new Float32Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    processedSamples[index] = clamp(samples[index] * finalScale, -1, 1);
  }

  return processedSamples;
}

export async function resumeAudioContext(audioContext) {
  if (!audioContext || audioContext.state !== "suspended") {
    return;
  }

  try {
    await audioContext.resume();
  } catch (error) {
    // Resume may require a user gesture in some webviews.
  }
}

export async function ensureVoiceCaptureWorklet(audioContext, workletUrl = DEFAULT_WORKLET_URL) {
  if (!audioContext?.audioWorklet?.addModule) {
    return false;
  }

  if (!voiceCaptureWorkletModulePromises.has(audioContext)) {
    const modulePromise = audioContext.audioWorklet.addModule(workletUrl)
      .then(() => true)
      .catch((error) => {
        console.error("Voice capture worklet failed to load", error);
        voiceCaptureWorkletModulePromises.delete(audioContext);
        return false;
      });

    voiceCaptureWorkletModulePromises.set(audioContext, modulePromise);
  }

  return voiceCaptureWorkletModulePromises.get(audioContext);
}

export async function createVoiceCaptureNode(audioContext, mediaStream, onSamples, options = {}) {
  const {
    soundInputSettings = getSoundInputSettings(),
    preferScriptProcessor = false,
    workletUrl = DEFAULT_WORKLET_URL
  } = options;
  const sourceNode = audioContext.createMediaStreamSource(mediaStream);
  const silenceNode = audioContext.createGain();
  silenceNode.gain.value = 0;

  const workletReady = !preferScriptProcessor && await ensureVoiceCaptureWorklet(audioContext, workletUrl);
  if (workletReady && typeof AudioWorkletNode !== "undefined") {
    const processorNode = new AudioWorkletNode(audioContext, "flow-voice-capture", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      channelCount: 1,
      channelCountMode: "explicit",
      channelInterpretation: "speakers"
    });

    processorNode.port.onmessage = (event) => {
      const samples = event.data;
      if (!samples || !onSamples) {
        return;
      }

      onSamples(processVoiceCaptureSamples(samples, soundInputSettings), audioContext.sampleRate);
    };

    sourceNode.connect(processorNode);
    processorNode.connect(silenceNode);
    silenceNode.connect(audioContext.destination);

    return {
      sourceNode,
      processorNode,
      silenceNode,
      usingWorklet: true
    };
  }

  const processorNode = audioContext.createScriptProcessor(VOSK_SCRIPT_PROCESSOR_FALLBACK_BUFFER_SIZE, 1, 1);
  processorNode.onaudioprocess = (event) => {
    const samples = event.inputBuffer?.getChannelData?.(0);
    if (!samples || !onSamples) {
      return;
    }

    const copy = new Float32Array(samples.length);
    copy.set(samples);
    onSamples(processVoiceCaptureSamples(copy, soundInputSettings), event.inputBuffer.sampleRate);
  };

  sourceNode.connect(processorNode);
  processorNode.connect(silenceNode);
  silenceNode.connect(audioContext.destination);

  return {
    sourceNode,
    processorNode,
    silenceNode,
    usingWorklet: false
  };
}

export function disconnectAudioGraph(graph) {
  if (!graph) return;

  if (graph.sourceNode) {
    try {
      graph.sourceNode.disconnect();
    } catch {}
    graph.sourceNode = null;
  }

  if (graph.processorNode) {
    try {
      graph.processorNode.disconnect();
    } catch {}
    if (graph.processorNode.port) {
      graph.processorNode.port.onmessage = null;
    }
    graph.processorNode.onaudioprocess = null;
    graph.processorNode = null;
  }

  if (graph.silenceNode) {
    try {
      graph.silenceNode.disconnect();
    } catch {}
    graph.silenceNode = null;
  }
}

export async function disposeAudioContext(audioContext) {
  if (!audioContext) return;
  try {
    await audioContext.close();
  } catch {}
}
