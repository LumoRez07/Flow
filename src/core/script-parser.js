/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const RTL_CHARACTERS = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/g;
const LTR_CHARACTERS = /[A-Za-z\u00C0-\u024F]/g;

export function stripFormattingMarkers(text) {
  return String(text || "")
    .replace(/\[(?:section|chapter|pause)(?::[^\]]*)?\]|\[\/(?:section|chapter)\]/gi, " ")
    .replace(/\[card[^\]]*\]|\[\/card\]/gi, " ")
    .replace(/\[(?:\/)?(?:u|yellow|blue|red|white|softwhite)\]/gi, " ")
    .replace(/\*\*|\*|==/g, " ");
}

export function parseCardDescriptor(rawTag) {
  const parts = String(rawTag || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts[0] !== "card") {
    return null;
  }

  let placement = "centered";
  let tone = "neutral";
  let seconds = 0;
  const supportedTones = new Set(["warning", "pause", "delivery", "cue", "identity", "bookend", "neutral"]);

  parts.slice(1).forEach((part) => {
    if (part === "centered" || part === "between") {
      placement = part;
      return;
    }

    if (part.startsWith("placement=")) {
      const val = part.slice(10).trim();
      if (val === "between" || val === "centered") {
        placement = val;
      }
      return;
    }

    if (supportedTones.has(part)) {
      tone = part;
      return;
    }

    if (part.startsWith("tone=")) {
      const val = part.slice(5).trim();
      if (supportedTones.has(val)) {
        tone = val;
      }
      return;
    }

    const waitMatch = part.match(/^(?:wait|seconds|duration)[:=](\d+(?:\.\d+)?)$/i)
      || part.match(/^(\d+(?:\.\d+)?)(?:s|sec|secs|second|seconds)$/i);
    if (waitMatch) {
      const parsedSeconds = Number(waitMatch[1]);
      if (Number.isFinite(parsedSeconds) && parsedSeconds > 0) {
        seconds = Math.max(1, Math.round(parsedSeconds));
      }
    }
  });

  return { placement, tone, seconds: seconds > 0 ? seconds : null };
}

export function detectTextDirection(text) {
  const source = stripFormattingMarkers(text);
  let rtlCount = 0;
  let ltrCount = 0;
  const sampleLimit = Math.min(source.length, 600);

  for (let i = 0; i < sampleLimit; i += 1) {
    const code = source.charCodeAt(i);
    if ((code >= 0x0590 && code <= 0x08FF) || (code >= 0xFB1D && code <= 0xFEFC)) {
      rtlCount += 1;
    } else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122) || (code >= 0x00C0 && code <= 0x024F)) {
      ltrCount += 1;
    }
  }

  if (rtlCount === 0) {
    return "ltr";
  }

  if (ltrCount === 0) {
    return "rtl";
  }

  return rtlCount >= ltrCount ? "rtl" : "ltr";
}

export function applyTextDirection(target, text) {
  if (!target) return "ltr";
  const direction = detectTextDirection(text);
  target.setAttribute("dir", direction);
  target.dataset.textDirection = direction;
  return direction;
}

function pushToken(tokens, token) {
  const previous = tokens[tokens.length - 1];

  if (token.type === "space") {
    if (!previous || previous.type === "space" || previous.type === "newline") {
      return;
    }
  }

  if (token.type === "newline") {
    if (previous?.type === "space") {
      tokens.pop();
    }

    if (previous?.type === "newline") {
      return;
    }
  }

  tokens.push(token);
}

function matchLineBlockMarker(source, index) {
  const slice = source.slice(index);
  const match = slice.match(/^(?:[ \t]{0,3})(>+[ \t]+|[-*+][ \t]+|(\d+)[.)][ \t]+)/u);
  if (!match) {
    return null;
  }

  if (match[2]) {
    return {
      type: "list-item-start",
      ordered: true,
      marker: `${match[2]}.`,
      length: match[0].length
    };
  }

  if (match[1]?.trim().startsWith(">")) {
    return {
      type: "blockquote-start",
      length: match[0].length
    };
  }

  return {
    type: "list-item-start",
    ordered: false,
    marker: "•",
    length: match[0].length
  };
}

function flushBuffer(tokens, buffer, style) {
  if (!buffer) return;

  let currentWord = "";
  const commitWord = () => {
    if (!currentWord) return;
    if (/[\p{L}\p{N}]/u.test(currentWord)) {
      tokens.push({
        type: "word",
        text: currentWord,
        style: { ...style }
      });
    } else {
      tokens.push({
        type: "symbol",
        text: currentWord,
        style: { ...style }
      });
    }
    currentWord = "";
  };

  for (const char of buffer) {
    if (char === "\r") continue;

    if (char === "\n") {
      commitWord();
      pushToken(tokens, { type: "newline" });
      continue;
    }

    if (/\s/.test(char)) {
      commitWord();
      pushToken(tokens, { type: "space" });
      continue;
    }

    if (char === "—" || char === "–") {
      commitWord();
      pushToken(tokens, { type: "space" });
      continue;
    }

    currentWord += char;
  }

  commitWord();
}

export function parseFormattedScript(text) {
  const source = String(text || "");
  const tokens = [];
  let buffer = "";
  let atLineStart = true;
  let activeLineBlock = null;
  let style = {
    bold: false,
    italic: false,
    underline: false,
    highlight: null,
    textTone: null
  };

  const applyTag = (tag) => {
    switch (tag) {
      case "u":
        style = { ...style, underline: true };
        return true;
      case "/u":
        style = { ...style, underline: false };
        return true;
      case "white":
        style = { ...style, textTone: "white" };
        return true;
      case "/white":
        style = { ...style, textTone: style.textTone === "white" ? null : style.textTone };
        return true;
      case "softwhite":
        style = { ...style, textTone: "softwhite" };
        return true;
      case "/softwhite":
        style = { ...style, textTone: style.textTone === "softwhite" ? null : style.textTone };
        return true;
      case "yellow":
        style = { ...style, highlight: "yellow" };
        return true;
      case "/yellow":
        style = { ...style, highlight: style.highlight === "yellow" ? null : style.highlight };
        return true;
      case "blue":
        style = { ...style, highlight: "blue" };
        return true;
      case "/blue":
        style = { ...style, highlight: style.highlight === "blue" ? null : style.highlight };
        return true;
      case "red":
        style = { ...style, highlight: "red" };
        return true;
      case "/red":
        style = { ...style, highlight: style.highlight === "red" ? null : style.highlight };
        return true;
      default:
        return false;
    }
  };

  const flush = () => {
    flushBuffer(tokens, buffer, style);
    buffer = "";
  };

  const closeLineBlock = () => {
    if (!activeLineBlock) {
      return;
    }

    tokens.push({ type: "block-end", blockKind: activeLineBlock });
    activeLineBlock = null;
  };

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\r") {
      continue;
    }

    if (atLineStart) {
      const blockMarker = matchLineBlockMarker(source, index);
      if (blockMarker) {
        flush();
        activeLineBlock = blockMarker.type === "blockquote-start" ? "blockquote" : "list-item";
        tokens.push(blockMarker);
        index += blockMarker.length - 1;
        atLineStart = false;
        continue;
      }

      if (source[index] === " " || source[index] === "\t") {
        continue;
      }
    }

    if (source[index] === "[") {
      const closingIndex = source.indexOf("]", index + 1);
      if (closingIndex !== -1) {
        const tag = source.slice(index + 1, closingIndex).trim().toLowerCase();
        const cardDescriptor = parseCardDescriptor(tag);
        if (cardDescriptor) {
          const closeCardIndex = source.indexOf("[/card]", closingIndex + 1);
          if (closeCardIndex !== -1) {
            flush();
            const cardText = source.slice(closingIndex + 1, closeCardIndex)
              .replace(/\r/g, "")
              .replace(/\s+/g, " ")
              .trim();

            if (cardText) {
              tokens.push({
                type: "card",
                text: cardText,
                placement: cardDescriptor.placement,
                tone: cardDescriptor.tone,
                waitSeconds: cardDescriptor.seconds || null
              });
            }

            index = closeCardIndex + "[/card]".length - 1;
            continue;
          }
        }

        if (tag.startsWith("pause:") || tag.startsWith("wait:")) {
          flush();
          const colonPos = source.indexOf(":", index + 1);
          const val = source.slice(colonPos + 1, closingIndex).trim();
          const match = val.match(/^(\d+(?:\.\d+)?)/);
          const seconds = match ? Math.max(1, Math.round(Number(match[1]))) : 3;
          tokens.push({
            type: "card",
            text: `Pause (${seconds}s)`,
            placement: "centered",
            tone: "pause",
            waitSeconds: seconds
          });
          index = closingIndex;
          continue;
        }

        if (tag.startsWith("section:") || tag.startsWith("chapter:")) {
          flush();
          const colonPos = source.indexOf(":", index + 1);
          const rawContent = source.slice(colonPos + 1, closingIndex).trim();
          let sectionTitle = rawContent;
          let waitSeconds = null;

          const commaIndex = rawContent.lastIndexOf(",");
          if (commaIndex !== -1) {
            const optionPart = rawContent.slice(commaIndex + 1).trim();
            const waitMatch = optionPart.match(/^(?:wait|seconds|duration|pause)[:=]\s*(\d+(?:\.\d+)?)/i)
              || optionPart.match(/^(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds)?$/i);
            if (waitMatch) {
              const parsedSec = Number(waitMatch[1]);
              if (Number.isFinite(parsedSec) && parsedSec > 0) {
                waitSeconds = Math.max(1, Math.round(parsedSec));
                sectionTitle = rawContent.slice(0, commaIndex).trim();
              } else if (parsedSec === 0) {
                sectionTitle = rawContent.slice(0, commaIndex).trim();
              }
            }
          }

          if (sectionTitle) {
            tokens.push({
              type: "section",
              title: sectionTitle.slice(0, 80),
              waitSeconds
            });
          }
          index = closingIndex;
          continue;
        }

        if (tag === "section" || tag === "chapter") {
          flush();
          tokens.push({
            type: "section",
            title: "Section"
          });
          index = closingIndex;
          continue;
        }

        if (tag === "/section" || tag === "/chapter") {
          flush();
          index = closingIndex;
          continue;
        }

        const isFormattingTag = ["u", "/u", "white", "/white", "softwhite", "/softwhite", "yellow", "/yellow", "blue", "/blue", "red", "/red"].includes(tag);
        if (isFormattingTag) {
          flush();
          applyTag(tag);
          index = closingIndex;
          continue;
        }
      }
    }

    if (source.startsWith("**", index)) {
      flush();
      style = { ...style, bold: !style.bold };
      index += 1;
      continue;
    }

    if (source.startsWith("==", index)) {
      flush();
      style = { ...style, highlight: style.highlight === "yellow" ? null : "yellow" };
      index += 1;
      continue;
    }

    if (source[index] === "*") {
      flush();
      style = { ...style, italic: !style.italic };
      continue;
    }

    if (source[index] === "\n") {
      flush();
      if (activeLineBlock) {
        closeLineBlock();
      } else {
        pushToken(tokens, { type: "newline" });
      }
      atLineStart = true;
      continue;
    }

    buffer += source[index];
    atLineStart = false;
  }

  flush();
  closeLineBlock();

  while (tokens[tokens.length - 1]?.type === "space" || tokens[tokens.length - 1]?.type === "newline") {
    tokens.pop();
  }

  return tokens;
}

export function splitWords(text) {
  return parseFormattedScript(text)
    .filter((token) => token.type === "word")
    .map((token) => token.text);
}

export function extractScriptSections(text) {
  const tokens = parseFormattedScript(text);
  const sections = [];
  let wordCount = 0;

  tokens.forEach((token) => {
    if (token.type === "section") {
      sections.push({
        id: `sec-${sections.length + 1}`,
        index: sections.length,
        level: sections.length + 1,
        title: token.title,
        waitSeconds: token.waitSeconds || null,
        wordOffset: wordCount
      });
    } else if (token.type === "word") {
      wordCount += 1;
    }
  });

  return sections;
}
