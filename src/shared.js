export const defaultState = {
  script: "Welcome to Flow. Add your own script from the text page and this teleprompter will highlight the next word while softly dimming the rest.",
  speed: 120,
  groqKey: "",
  groqPrompt: "",
  window: {
    x: null,
    y: null,
    width: 960,
    height: 260,
    preset: "top-center"
  }
};

const STORAGE_KEY = "flow.teleprompter.state.v2";

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function splitWords(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(defaultState);
    }

    const parsed = JSON.parse(raw);
    const groqKey = parsed.groqKey ?? parsed.geminiKey ?? "";
    const groqPrompt = parsed.groqPrompt ?? parsed.geminiPrompt ?? "";

    return {
      ...structuredClone(defaultState),
      ...parsed,
      groqKey,
      groqPrompt,
      window: {
        ...structuredClone(defaultState).window,
        ...(parsed.window || {})
      }
    };
  } catch {
    return structuredClone(defaultState);
  }
}

export function saveState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

export function estimateMinutes(wordCount, speed) {
  if (!wordCount || !speed) return 0;
  return wordCount / speed;
}

async function requestGroqCompletion(apiKey, instruction, script) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
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

  return { response, data, text };
}

export async function generateWithGroq(apiKey, instruction, script = "") {
  const { response, data, text } = await requestGroqCompletion(apiKey, instruction, script);
  const message = data?.error?.message || "Groq did not return any text.";

  if (response.ok && text) {
    return text;
  }

  if (/quota exceeded|rate limit|too many requests/i.test(message)) {
    throw new Error("This Groq key is currently rate-limited or out of quota. Save your text normally, then try again shortly.");
  }

  throw new Error(message);
}
