/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { defaultState } from "../core/config.js";
import { normalizeGroqSettings, resolveGroqOutputLanguage, getLanguageLabel } from "../core/normalizers.js";

function describeGroqPersonality(personality) {
  switch (personality) {
    case "confident":
      return "Use a confident, decisive speaking style.";
    case "friendly":
      return "Use a warm, approachable speaking style.";
    case "professional":
      return "Use a polished, professional speaking style.";
    case "persuasive":
      return "Use a persuasive, high-conviction speaking style.";
    default:
      return "Use a natural, human speaking style.";
  }
}

function describeGroqGrammarLevel(grammarLevel) {
  switch (grammarLevel) {
    case "relaxed":
      return "Keep grammar slightly relaxed and conversational without becoming sloppy.";
    case "polished":
      return "Use polished grammar and tighter sentence structure.";
    default:
      return "Use standard grammar that sounds clear and smooth when spoken aloud.";
  }
}

function describeGroqEmojiUsage(emojiUsage) {
  return emojiUsage === "on"
    ? "You may use a small number of emojis only when they genuinely improve tone or clarity."
    : "Do not use emojis.";
}

function describeGroqAcademicWordUsage(academicWordUsage) {
  switch (academicWordUsage) {
    case "aggressive":
      return "Lean heavily into academic, formal, and intellectually dense wording when it still remains readable aloud.";
    case "on":
      return "You may use moderately academic wording when it helps precision or credibility.";
    default:
      return "Avoid academic jargon unless the user's instruction explicitly requires it.";
  }
}

function describeGroqPointOfView(pointOfView) {
  return pointOfView === "third-person"
    ? "Prefer third-person framing and avoid writing from the speaker's personal 'I' perspective unless the user's instruction explicitly requires it."
    : "Prefer first-person phrasing when the script speaks for the user personally.";
}

export function buildGroqRequest({
  instruction = "",
  script = "",
  groqSettings = defaultState.groq,
  appLanguage = defaultState.language
} = {}) {
  const normalizedSettings = normalizeGroqSettings(groqSettings, defaultState.groq);
  const normalizedInstruction = String(instruction || "").trim();
  const normalizedScript = String(script || "").trim();
  const outputLanguage = resolveGroqOutputLanguage(normalizedSettings.outputLanguage, appLanguage);
  const preferences = [
    `Write the final script in ${getLanguageLabel(outputLanguage)}.`,
    "Optimize strictly for spoken teleprompter delivery: natural speaking rhythm, clear sentence boundaries, and standard spoken punctuation.",
    "Do NOT use em dashes (—), en dashes (–), or standalone hyphens (-). Replace dashes with standard commas, periods, or natural pauses so speech tracking is not disrupted.",
    "Do NOT use brackets, parentheticals, stage directions, asterisks, bullet markers, or unpronounceable formatting (e.g. no [pause], (applause), **bold**, or ---).",
    describeGroqPersonality(normalizedSettings.personality),
    describeGroqGrammarLevel(normalizedSettings.grammarLevel),
    describeGroqEmojiUsage(normalizedSettings.emojiUsage),
    describeGroqAcademicWordUsage(normalizedSettings.academicWordUsage),
    describeGroqPointOfView(normalizedSettings.pointOfView)
  ];

  if (normalizedSettings.userContext) {
    preferences.push(`User context: ${normalizedSettings.userContext}`);
  }

  return [
    "You are editing or generating teleprompter text.",
    "Always follow the user's instruction exactly.",
    "If existing teleprompter text is provided, use it as the source text and rewrite or transform it according to the user's instruction.",
    "If no existing teleprompter text is provided, generate new teleprompter text from the user's instruction only.",
    "If the user's direct instruction conflicts with a saved preference, follow the user's direct instruction.",
    "Make sure that there are no hallucinated facts in the output and make sure that you do not add any hallucinated letters or words that don't make sense or are in the wrong language.",
    "Return only the final teleprompter text.",
    "Do not include any intro, label, explanation, notes, or quotation marks.",
    `PREFERENCES:\n${preferences.join("\n")}`,
    `USER INSTRUCTION:\n${normalizedInstruction || "Use the existing teleprompter text and improve it for teleprompter delivery."}`,
    normalizedScript ? `EXISTING TELEPROMPTER TEXT:\n${normalizedScript}` : ""
  ].filter(Boolean).join("\n\n");
}

export function sanitizeTeleprompterScriptText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\s*[—–]+\s*/g, ", ")
    .replace(/\s+-\s+/g, ", ")
    .replace(/--+/g, ", ")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^\)]*(?:pause|applause|laughter|music|clears throat)[^\)]*\)/gi, "")
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/,\s*,+/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

export const GROQ_MODEL_CANDIDATES = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b"
];

async function requestGroqCompletion(apiKey, instruction, script, model = GROQ_MODEL_CANDIDATES[0], signal) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: `${instruction}${script ? `\n\nEXISTING SCRIPT:\n${script}` : ""}`
          }
        ]
      })
    }
  );

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();

  return { response, data, text, model };
}

export async function generateWithGroq(apiKey, instruction, script = "", { signal } = {}) {
  let lastError = null;

  for (const model of GROQ_MODEL_CANDIDATES) {
    try {
      const { response, data, text } = await requestGroqCompletion(apiKey, instruction, script, model, signal);
      const message = data?.error?.message || "";

      if (response.ok && text) {
        return sanitizeTeleprompterScriptText(text);
      }

      if (/quota exceeded|rate limit|too many requests/i.test(message)) {
        throw new Error("This Groq key is currently rate-limited or out of quota. Save your text normally, then try again shortly.");
      }

      if (response.status === 404 || /decommissioned|deprecated|not found|does not exist|invalid_model/i.test(message)) {
        lastError = new Error(message || `Model ${model} unavailable.`);
        continue;
      }

      if (message) {
        throw new Error(message);
      }
    } catch (err) {
      if (/quota exceeded|rate limit|too many requests/i.test(err.message)) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error("Groq request failed across all available models.");
}
