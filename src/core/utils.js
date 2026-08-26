/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeLocaleDigits(value) {
  return String(value || "")
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06F0))
    .replace(/[\uFF10-\uFF19]/g, (digit) => String(digit.charCodeAt(0) - 0xFF10))
    .replace(/\u066B/g, ".")
    .replace(/\u066C/g, ",");
}

export function parseLocaleNumber(value) {
  if (typeof value === "number") {
    return value;
  }

  let source = normalizeLocaleDigits(value).trim();
  if (!source) {
    return Number.NaN;
  }

  source = source.replace(/[\s\u00A0\u202F']/g, "");

  const commaCount = (source.match(/,/g) || []).length;
  const dotCount = (source.match(/\./g) || []).length;

  if (commaCount && dotCount) {
    source = source.lastIndexOf(",") > source.lastIndexOf(".")
      ? source.replace(/\./g, "").replace(/,/g, ".")
      : source.replace(/,/g, "");
  } else if (commaCount) {
    const looksGrouped = /^[-+]?\d{1,3}(?:,\d{3})+$/.test(source);
    source = looksGrouped ? source.replace(/,/g, "") : source.replace(/,/g, ".");
  }

  return parseFloat(source);
}

export function clampNumber(value, min, max, fallback) {
  const numericValue = parseLocaleNumber(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(numericValue, min), max);
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function estimateMinutes(wordCount, speed) {
  if (!wordCount || !speed) return 0;
  return wordCount / speed;
}

