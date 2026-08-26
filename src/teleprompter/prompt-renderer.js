/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import {
  parseFormattedScript,
  applyTextDirection,
  splitWords,
  parseWaitCardText,
  clamp,
  defaultState,
  resolveFontStack
} from "../shared.js";
import { WAIT_CARD_TRIGGER_VIEWPORT_OFFSET } from "./playback-constants.js";

export function applyLocaleVoiceNormalization(text, locale) {
  let normalized = String(text || "");

  if (/^ar\b/i.test(locale)) {
    normalized = normalized
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
      .replace(/ـ/gu, "")
      .replace(/[أإآٱ]/gu, "ا")
      .replace(/[ؤئ]/gu, (character) => (character === "ؤ" ? "و" : "ي"))
      .replace(/ى/gu, "ي")
      .replace(/ة/gu, "ه");
  }

  if (/^de\b/i.test(locale)) {
    normalized = normalized.replace(/ß/gu, "ss");
  }

  return normalized;
}

export function normalizeText(text, locale = "en-US") {
  return applyLocaleVoiceNormalization(text, locale)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase(locale)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeNormalizedText(text, locale = "en-US") {
  const normalized = normalizeText(text, locale);
  return normalized ? normalized.split(" ") : [];
}

export function createPromptWaitCardNumberSpan(value, extraClassName = "") {
  const span = document.createElement("span");
  span.className = ["prompt-card-wait-number-value", extraClassName].filter(Boolean).join(" ");
  span.textContent = String(value);
  return span;
}

export function setPromptWaitCardNumber(cardElement, value, { animate = false } = {}) {
  const viewport = cardElement?.querySelector(".prompt-card-wait-number-viewport");
  if (!viewport) {
    return;
  }

  const nextValue = String(Math.max(1, Math.round(Number(value) || 0)));
  const previousValue = viewport.dataset.value || nextValue;

  if (!animate || previousValue === nextValue) {
    viewport.dataset.value = nextValue;
    cardElement.classList.remove("is-wait-number-animating");
    viewport.replaceChildren(createPromptWaitCardNumberSpan(nextValue));
    return;
  }

  viewport.dataset.value = nextValue;
  viewport.replaceChildren(
    createPromptWaitCardNumberSpan(previousValue, "is-outgoing"),
    createPromptWaitCardNumberSpan(nextValue, "is-incoming")
  );

  cardElement.classList.remove("is-wait-number-animating");
  void viewport.offsetWidth;
  cardElement.classList.add("is-wait-number-animating");

  window.setTimeout(() => {
    if (!cardElement.isConnected || viewport.dataset.value !== nextValue) {
      return;
    }
    cardElement.classList.remove("is-wait-number-animating");
    viewport.replaceChildren(createPromptWaitCardNumberSpan(nextValue));
  }, 180);
}

export function createPromptRenderer({
  state,
  ui,
  t,
  getVoiceLanguageTag = () => "en-US",
  updateWordState = () => {},
  updateStatus = () => {},
  getPlaybackViewportOffset = () => 0.32,
  getLineTargetTop = () => 0,
  getLineIndexForScrollTop = () => 0,
  getActiveMode = () => "highlight",
  getIsPlaying = () => false,
  getIsPaused = () => false,
  getCurrentIndex = () => 0,
  setCurrentIndex = () => {},
  getScrollProgress = () => 0,
  setScrollProgress = () => {},
  clearPlayback = () => {},
  stopPlayback = () => {},
  setViewportPosition = () => {},
  clearRenderedState = () => {},
  setReadingMode = () => {},
  restartPlaybackLoopForCurrentMode = () => {},
  updatePlaybackIndicators = () => {},
  updatePlayButtons = () => {},
  syncVoiceCommandListener = () => {},
  scheduleVoiceHealthCheck = () => {},
  getFrozenReadingViewportWidth = () => 0,
  getFrozenReadingViewportHeight = () => 0
} = {}) {
  let wordNodes = [];
  let lineGroups = [];
  let lineIndexByWord = [];
  let promptWaitCards = [];
  let activePromptWaitCardId = "";
  let normalizedWordTokens = [];
  let wordIndexByNormalizedToken = [];
  let normalizedTokenRangeByWord = [];
  let cachedPromptViewportWidth = 0;
  let cachedPromptViewportHeight = 0;
  let cachedPromptScrollableHeight = 0;
  let lastResponsiveFontSize = 0;
  let lastResponsiveViewportWidth = 0;
  let lastResponsiveViewportHeight = 0;
  let lastRenderedScriptSnapshot = "";
  let lineMapRebuildFrame = null;
  let pendingScriptRerenderTimer = 0;
  let promptWaitAnimationCleanupTimer = null;
  let lastRenderedMode = null;
  let lastRenderedWordIndex = -1;
  let lastRenderedLineIndex = -1;

  function getDecorationSignature(style) {
    if (!style) return "";
    return JSON.stringify({
      highlight: style.highlight || null,
      underline: Boolean(style.underline),
      textTone: style.textTone || null
    });
  }

  function createWordSpan(token, wordIndex, options = {}) {
    const span = document.createElement("span");
    span.className = "prompt-word";
    span.textContent = token.text;
    span.dataset.index = String(wordIndex);

    if (token.style.bold) {
      span.classList.add("is-bold");
    }

    if (token.style.italic) {
      span.classList.add("is-italic");
    }

    if (token.style.underline && options.includeUnderline) {
      span.classList.add("is-underlined");
    }

    if (token.style.highlight && options.includeHighlight) {
      span.classList.add("is-highlighted", `highlight-${token.style.highlight}`);
    }

    if (token.style.textTone) {
      span.classList.add(`is-tone-${token.style.textTone}`);
    }

    return span;
  }

  function createDecorationGroupSpan(style) {
    const group = document.createElement("span");
    group.className = "prompt-highlight-group";

    if (style.highlight) {
      group.classList.add("is-highlighted", `highlight-${style.highlight}`);
    }

    if (style.underline) {
      group.classList.add("is-underlined");
    }

    if (style.textTone) {
      group.classList.add(`is-tone-${style.textTone}`);
    }

    return group;
  }

  function syncPromptBlockDirection(element) {
    if (!element) return;
    const blockText = element.textContent || "";
    const direction = applyTextDirection(element, blockText);
    element.dataset.textDirection = direction;
  }

  function parseWaitCardDescriptor(text) {
    return parseWaitCardText(text);
  }

  function createPromptCard(token) {
    const card = document.createElement("section");
    card.className = "prompt-card";

    const placement = token.placement === "between" ? "between" : "centered";
    const tone = token.tone || "neutral";

    card.classList.add(`prompt-card-${placement}`);
    card.classList.add(`prompt-card-tone-${tone}`);
    card.dataset.placement = placement;
    card.dataset.tone = tone;

    if (token.style?.accent) {
      card.classList.add(`card-accent-${token.style.accent}`);
    }

    const waitDescriptor = parseWaitCardDescriptor(token.text);
    const seconds = Number(token.waitSeconds || waitDescriptor?.seconds || 0);

    if (seconds > 0) {
      card.classList.add("prompt-card-wait");
      card.dataset.waitSeconds = String(seconds);

      const copy = document.createElement("p");
      copy.className = "prompt-card-wait-copy";
      applyTextDirection(copy, token.text);

      const icon = document.createElement("i");
      icon.className = "ph ph-hourglass-high prompt-card-wait-icon";
      icon.setAttribute("aria-hidden", "true");
      copy.appendChild(icon);

      if (waitDescriptor?.prefix) {
        const prefix = document.createElement("span");
        prefix.className = "prompt-card-wait-prefix";
        prefix.textContent = waitDescriptor.prefix;
        copy.appendChild(prefix);
      }

      const numberViewport = document.createElement("span");
      numberViewport.className = "prompt-card-wait-number-viewport";
      numberViewport.dataset.value = String(seconds);

      const number = document.createElement("span");
      number.className = "prompt-card-wait-number-value";
      number.textContent = String(seconds);
      numberViewport.appendChild(number);
      copy.appendChild(numberViewport);

      if (waitDescriptor?.suffix) {
        const suffix = document.createElement("span");
        suffix.className = "prompt-card-wait-suffix";
        suffix.textContent = waitDescriptor.suffix;
        copy.appendChild(suffix);
      } else if (!waitDescriptor?.prefix) {
        const suffix = document.createElement("span");
        suffix.className = "prompt-card-wait-suffix";
        suffix.textContent = t("common.secondsShort") !== "common.secondsShort" ? t("common.secondsShort") : "s";
        copy.appendChild(suffix);
      }

      card.appendChild(copy);
      syncPromptBlockDirection(card);
      return card;
    }

    const copy = document.createElement("p");
    copy.className = "prompt-card-copy";
    copy.textContent = token.text;
    card.appendChild(copy);
    syncPromptBlockDirection(card);
    return card;
  }

  function createPromptListItem(token) {
    const item = document.createElement("div");
    item.className = "prompt-list-item";

    const marker = document.createElement("span");
    marker.className = "prompt-list-marker";
    marker.textContent = token.marker;
    marker.setAttribute("aria-hidden", "true");

    const content = document.createElement("div");
    content.className = "prompt-list-content";

    item.append(marker, content);
    return { element: item, content };
  }

  function createPromptBlockquote() {
    const quote = document.createElement("blockquote");
    quote.className = "prompt-blockquote";

    const content = document.createElement("div");
    content.className = "prompt-blockquote-content";

    quote.appendChild(content);
    return { element: quote, content };
  }

  function updatePromptSafeArea() {
    const controlHeight = ui.floatingControls?.offsetHeight || 0;
    const safeBottom = document.body.classList.contains("reading-mode") && controlHeight > 0
      ? controlHeight + 28
      : 0;

    document.documentElement.style.setProperty("--teleprompter-reading-safe-bottom", `${safeBottom}px`);
  }

  function refreshPromptViewportMetrics() {
    updatePromptSafeArea();

    if (!ui.promptViewport) {
      cachedPromptViewportWidth = 0;
      cachedPromptViewportHeight = 0;
      cachedPromptScrollableHeight = 0;
      return 0;
    }

    const rect = ui.promptViewport.getBoundingClientRect();
    const currentWidth = Math.round(rect.width || ui.promptViewport.clientWidth || 0);
    const currentHeight = Math.round(rect.height || ui.promptViewport.clientHeight || 0);

    if (currentWidth > 0 && currentHeight > 0) {
      cachedPromptViewportWidth = currentWidth;
      cachedPromptViewportHeight = currentHeight;
      cachedPromptScrollableHeight = Math.max((ui.promptViewport.scrollHeight || 0) - cachedPromptViewportHeight, 0);
    }

    return cachedPromptScrollableHeight;
  }

  function updatePromptWaitCardLayout() {
    if (!promptWaitCards.length || !lineGroups.length) {
      return;
    }

    const viewportOffset = getPlaybackViewportOffset(0.32, WAIT_CARD_TRIGGER_VIEWPORT_OFFSET);
    const promptViewportHeight = ui.promptViewport?.clientHeight || 0;

    promptWaitCards.forEach((card) => {
      const lineIndex = lineIndexByWord[card.triggerWordIndex] ?? 0;
      const lineTargetTop = getLineTargetTop(lineIndex);
      const cardElementTop = card.element?.offsetTop ?? lineTargetTop;
      card.triggerTop = Math.max(cardElementTop - promptViewportHeight * viewportOffset, 0);
    });
  }

  function rebuildLineMap() {
    lineGroups = [];
    lineIndexByWord = new Array(wordNodes.length).fill(0);

    if (wordNodes.length === 0 || !ui.promptText) {
      return;
    }

    const promptRect = ui.promptText.getBoundingClientRect();
    let currentLine = null;

    wordNodes.forEach((node, index) => {
      const top = Math.round(node.getBoundingClientRect().top - promptRect.top);
      if (!currentLine || Math.abs(currentLine.top - top) > 4) {
        currentLine = {
          top,
          firstIndex: index,
          lastIndex: index
        };
        lineGroups.push(currentLine);
      } else {
        currentLine.lastIndex = index;
      }

      lineIndexByWord[index] = lineGroups.length - 1;
      node.dataset.lineIndex = String(lineGroups.length - 1);
    });

    refreshPromptViewportMetrics();
    updatePromptWaitCardLayout();
  }

  function scheduleLineMapRebuild() {
    if (lineMapRebuildFrame) {
      return;
    }

    lineMapRebuildFrame = requestAnimationFrame(() => {
      lineMapRebuildFrame = null;
      rebuildLineMap();
      lastRenderedLineIndex = -1;
      lastRenderedWordIndex = -1;
      lastRenderedMode = null;
      updateWordState(false);
    });
  }

  function rebuildNormalizedScriptTokenMap(languageTag = getVoiceLanguageTag(), sourceWords = splitWords(state.script)) {
    normalizedWordTokens = [];
    wordIndexByNormalizedToken = [];
    normalizedTokenRangeByWord = [];

    sourceWords.forEach((word, index) => {
      const normalizedTokens = tokenizeNormalizedText(word, languageTag);
      if (normalizedTokens.length === 0) {
        normalizedTokenRangeByWord[index] = null;
        return;
      }

      const start = normalizedWordTokens.length;
      normalizedWordTokens.push(...normalizedTokens);
      wordIndexByNormalizedToken.push(...normalizedTokens.map(() => index));
      normalizedTokenRangeByWord[index] = {
        start,
        end: normalizedWordTokens.length - 1
      };
    });
  }

  function renderScript() {
    const tokens = parseFormattedScript(state.script);
    const allWords = tokens.filter((token) => token.type === "word");
    const fragment = document.createDocumentFragment();
    lastRenderedScriptSnapshot = state.script;

    if (ui.promptText) {
      ui.promptText.innerHTML = "";
      const promptDirection = applyTextDirection(ui.promptText, state.script);
      if (ui.promptViewport) {
        ui.promptViewport.setAttribute("dir", promptDirection);
        ui.promptViewport.dataset.textDirection = promptDirection;
      }
    }

    wordNodes = [];
    lineGroups = [];
    lineIndexByWord = [];
    promptWaitCards = [];
    activePromptWaitCardId = "";
    lastRenderedMode = null;
    lastRenderedWordIndex = -1;
    lastRenderedLineIndex = -1;

    if (allWords.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-copy";
      empty.textContent = t("tele.empty");
      ui.promptText?.appendChild(empty);
      updateStatus();
      return;
    }

    rebuildNormalizedScriptTokenMap(getVoiceLanguageTag(), allWords.map((token) => token.text));

    let wordIndex = 0;
    let currentDecorationGroup = null;
    let currentDecorationSignature = "";
    let currentBlockContent = null;

    const closeDecorationGroup = () => {
      currentDecorationGroup = null;
      currentDecorationSignature = "";
    };

    const closeBlock = () => {
      closeDecorationGroup();
      currentBlockContent = null;
    };

    const getInlineTarget = () => currentBlockContent || fragment;

    tokens.forEach((token, tokenIndex) => {
      if (token.type === "blockquote-start") {
        closeBlock();
        const blockquote = createPromptBlockquote();
        fragment.appendChild(blockquote.element);
        currentBlockContent = blockquote.content;
        return;
      }

      if (token.type === "list-item-start") {
        closeBlock();
        const listItem = createPromptListItem(token);
        fragment.appendChild(listItem.element);
        currentBlockContent = listItem.content;
        return;
      }

      if (token.type === "block-end") {
        closeBlock();
        return;
      }

      if (token.type === "section") {
        closeBlock();
        const sectionWrapper = document.createElement("div");
        sectionWrapper.className = "prompt-section-wrapper";
        sectionWrapper.dataset.sectionTitle = token.title;
        sectionWrapper.dataset.wordIndex = String(wordIndex);

        const heading = document.createElement("div");
        heading.className = "prompt-section-heading";

        const titleSpan = document.createElement("span");
        titleSpan.className = "prompt-section-title-text";
        titleSpan.textContent = token.title;
        heading.appendChild(titleSpan);

        if (token.waitSeconds && token.waitSeconds > 0) {
          sectionWrapper.classList.add("prompt-card-wait", "has-section-wait");
          sectionWrapper.dataset.waitSeconds = String(token.waitSeconds);

          const waitBadge = document.createElement("span");
          waitBadge.className = "prompt-section-wait-badge";

          const icon = document.createElement("i");
          icon.className = "ph ph-hourglass-high prompt-card-wait-icon";
          icon.setAttribute("aria-hidden", "true");
          waitBadge.appendChild(icon);

          const numberViewport = document.createElement("span");
          numberViewport.className = "prompt-card-wait-number-viewport";
          numberViewport.dataset.value = String(token.waitSeconds);

          const number = document.createElement("span");
          number.className = "prompt-card-wait-number-value";
          number.textContent = String(token.waitSeconds);
          numberViewport.appendChild(number);
          waitBadge.appendChild(numberViewport);

          const suffix = document.createElement("span");
          suffix.className = "prompt-card-wait-suffix";
          suffix.textContent = "s";
          waitBadge.appendChild(suffix);

          heading.appendChild(waitBadge);

          promptWaitCards.push({
            id: `wait-${promptWaitCards.length}`,
            element: sectionWrapper,
            seconds: token.waitSeconds,
            triggerTop: 0,
            triggerWordIndex: wordIndex,
            consumed: false
          });
        }

        const underline = document.createElement("div");
        underline.className = "prompt-section-underline";

        sectionWrapper.append(heading, underline);
        fragment.appendChild(sectionWrapper);
        return;
      }

      if (token.type === "card") {
        closeDecorationGroup();
        const cardElement = createPromptCard(token);
        getInlineTarget().appendChild(cardElement);

        if (currentBlockContent) {
          syncPromptBlockDirection(currentBlockContent);
        }

        const waitSeconds = Number(cardElement.dataset.waitSeconds || 0);
        if (waitSeconds > 0) {
          promptWaitCards.push({
            id: `wait-${promptWaitCards.length}`,
            element: cardElement,
            seconds: waitSeconds,
            triggerTop: 0,
            triggerWordIndex: wordIndex,
            consumed: false
          });
        }

        return;
      }

      if (token.type === "word") {
        const decorationSignature = getDecorationSignature(token.style);
        const target = decorationSignature
          ? (() => {
              if (!currentDecorationGroup || currentDecorationSignature !== decorationSignature) {
                currentDecorationGroup = createDecorationGroupSpan(token.style);
                currentDecorationSignature = decorationSignature;
                getInlineTarget().appendChild(currentDecorationGroup);
              }

              return currentDecorationGroup;
            })()
          : (() => {
              closeDecorationGroup();
              return getInlineTarget();
            })();

        const span = createWordSpan(token, wordIndex, {
          includeHighlight: !token.style.highlight || !decorationSignature,
          includeUnderline: !token.style.underline || !decorationSignature
        });

        wordNodes.push(span);
        target.appendChild(span);
        if (currentBlockContent) {
          syncPromptBlockDirection(currentBlockContent);
        }
        wordIndex += 1;
        return;
      }

      if (token.type === "symbol") {
        const span = document.createElement("span");
        span.className = "prompt-symbol";
        span.textContent = token.text;
        getInlineTarget().appendChild(span);
        if (currentBlockContent) {
          syncPromptBlockDirection(currentBlockContent);
        }
        return;
      }

      if (token.type === "space") {
        const previousToken = tokens[tokenIndex - 1];
        const nextToken = tokens[tokenIndex + 1];
        const previousSignature = previousToken?.type === "word" ? getDecorationSignature(previousToken.style) : "";
        const nextSignature = nextToken?.type === "word" ? getDecorationSignature(nextToken.style) : "";
        const sharedDecoration = previousToken?.type === "word"
          && nextToken?.type === "word"
          && previousSignature
          && previousSignature === nextSignature;

        if (sharedDecoration && currentDecorationGroup) {
          currentDecorationGroup.appendChild(document.createTextNode(" "));
        } else {
          closeDecorationGroup();
          getInlineTarget().appendChild(document.createTextNode(" "));
        }

        if (currentBlockContent) {
          syncPromptBlockDirection(currentBlockContent);
        }
        return;
      }

      if (token.type === "newline") {
        const prevToken = tokens[tokenIndex - 1];
        if (prevToken && prevToken.type === "section") {
          return;
        }
        closeDecorationGroup();
        fragment.appendChild(document.createElement("br"));
        return;
      }

      closeDecorationGroup();
      fragment.appendChild(document.createElement("br"));
    });

    ui.promptText?.appendChild(fragment);
    refreshPromptViewportMetrics();
    rebuildLineMap();
    updateStatus();
    scheduleLineMapRebuild();
    clearRenderedState();
    if (typeof updateWordState === "function") {
      updateWordState(false);
    }
  }

  function applyResponsiveText(options = {}) {
    if (!options.force && (
      document.body.classList.contains("teleprompter-collapsing") ||
      document.body.classList.contains("teleprompter-expanding") ||
      document.body.classList.contains("teleprompter-collapsed") ||
      document.body.classList.contains("transition-to-script-manager") ||
      document.body.classList.contains("transition-to-prompter") ||
      document.body.classList.contains("transition-to-notch") ||
      document.body.classList.contains("script-manager-open")
    )) {
      return;
    }

    refreshPromptViewportMetrics();

    const basisWidth = options.frozenWidth || cachedPromptViewportWidth;
    let basisHeight = options.frozenHeight || cachedPromptViewportHeight;

    if (basisWidth <= 0 || basisHeight <= 0) {
      return;
    }

    if (!options.isReadingMode && state.appearance?.autoHideToolbar && ui.teleprompterApp) {
      const appHeight = ui.teleprompterApp.clientHeight || cachedPromptViewportHeight;
      const footerHeight = ui.teleprompterFooter?.offsetHeight || 0;
      const reservedToolbarHeight = Math.max(ui.teleprompterToolbar?.offsetHeight || 0, 60);
      const reservedGapHeight = 16;
      const availableHeight = appHeight - footerHeight - reservedToolbarHeight - reservedGapHeight;
      if (availableHeight > 0) {
        basisHeight = availableHeight;
      }
    }

    const widthSize = basisWidth * 0.11;
    const heightSize = basisHeight * 0.18;
    const baseSize = clamp(Math.min(widthSize, heightSize), 28, 120);
    const scale = (state.appearance?.textScale || defaultState.appearance.textScale) / 100;
    const minimumTextScale = 30;
    const minimumRenderedSize = Math.max(8, (baseSize * minimumTextScale) / 100);
    const computed = Math.round(clamp(baseSize * scale, minimumRenderedSize, 180));

    const viewportChanged = basisWidth !== lastResponsiveViewportWidth
      || basisHeight !== lastResponsiveViewportHeight;

    if (!viewportChanged && computed === lastResponsiveFontSize) {
      return;
    }

    document.documentElement.style.setProperty("--teleprompter-font-size", `${computed}px`);
    lastResponsiveFontSize = computed;
    lastResponsiveViewportWidth = basisWidth;
    lastResponsiveViewportHeight = basisHeight;
    scheduleLineMapRebuild();
  }

  function getNormalizedTokenIndexForWord(wordIndex, edge = "end") {
    const range = normalizedTokenRangeByWord[wordIndex];
    if (range) {
      return edge === "start" ? range.start : range.end;
    }

    const fallbackWordIndex = clamp(wordIndex, 0, Math.max(wordNodes.length - 1, 0));
    const fallbackTokenIndex = wordIndexByNormalizedToken.findIndex((index) => index >= fallbackWordIndex);
    if (fallbackTokenIndex >= 0) {
      return fallbackTokenIndex;
    }

    return Math.max(normalizedWordTokens.length - 1, 0);
  }

  function getWordIndexForNormalizedToken(tokenIndex) {
    if (!normalizedWordTokens.length) {
      return -1;
    }

    const safeTokenIndex = clamp(tokenIndex, 0, normalizedWordTokens.length - 1);
    return wordIndexByNormalizedToken[safeTokenIndex] ?? -1;
  }

  function getNormalizedTokenRangeForLine(lineIndex) {
    const line = lineGroups[lineIndex];
    if (!line) {
      return null;
    }

    let start = -1;
    let end = -1;

    for (let wordIndex = line.firstIndex; wordIndex <= line.lastIndex; wordIndex += 1) {
      const range = normalizedTokenRangeByWord[wordIndex];
      if (!range) {
        continue;
      }

      if (start < 0) {
        start = range.start;
      }

      end = range.end;
    }

    return start >= 0 && end >= start ? { start, end } : null;
  }

  function findPreservedWordIndex(previousScript, nextScript, previousIndex) {
    const nextWords = splitWords(nextScript);
    if (nextWords.length === 0) {
      return 0;
    }

    const fallbackIndex = clamp(previousIndex, 0, nextWords.length - 1);
    if (!previousScript || nextScript.startsWith(previousScript)) {
      return fallbackIndex;
    }

    const previousWords = splitWords(previousScript);
    if (previousWords.length === 0) {
      return fallbackIndex;
    }

    const anchorPlans = [
      { before: 2, after: 2 },
      { before: 1, after: 1 },
      { before: 0, after: 0 }
    ];

    for (const plan of anchorPlans) {
      const start = Math.max(previousIndex - plan.before, 0);
      const end = Math.min(previousIndex + plan.after + 1, previousWords.length);
      const anchor = previousWords.slice(start, end);

      if (anchor.length === 0) {
        continue;
      }

      for (let index = 0; index <= nextWords.length - anchor.length; index += 1) {
        const matches = anchor.every((word, offset) => nextWords[index + offset] === word);
        if (matches) {
          return clamp(index + (previousIndex - start), 0, nextWords.length - 1);
        }
      }
    }

    return fallbackIndex;
  }

  function syncPromptLayout() {
    refreshPromptViewportMetrics();
    rebuildLineMap();
  }

  function clearPendingScriptRerender() {
    if (!pendingScriptRerenderTimer) {
      return;
    }

    clearTimeout(pendingScriptRerenderTimer);
    pendingScriptRerenderTimer = 0;
  }

  function scheduleScriptRerender() {
    if (pendingScriptRerenderTimer) {
      clearTimeout(pendingScriptRerenderTimer);
    }

    pendingScriptRerenderTimer = window.setTimeout(() => {
      pendingScriptRerenderTimer = 0;
      rerenderScriptPreservingPosition(lastRenderedScriptSnapshot, { allowResponsiveResize: false });
    }, 80);
  }

  function setRealtimeRerenderActive(enabled) {
    document.body?.toggleAttribute("data-realtime-rerender", Boolean(enabled));
  }

  function captureScrollViewportAnchor(viewportTop) {
    if (!lineGroups.length) {
      return null;
    }

    const anchorLineIndex = getLineIndexForScrollTop(viewportTop);
    const anchorWordIndex = lineGroups[anchorLineIndex]?.firstIndex ?? 0;
    const anchorLineTop = getLineTargetTop(anchorLineIndex);

    return {
      previousWordIndex: anchorWordIndex,
      offsetWithinLine: Math.max(viewportTop - anchorLineTop, 0)
    };
  }

  function resolvePreservedScrollTop(previousScript, viewportAnchor, fallbackScrollProgress, totalScrollable) {
    if (!viewportAnchor) {
      return clamp(totalScrollable * fallbackScrollProgress, 0, totalScrollable);
    }

    const nextAnchorWordIndex = findPreservedWordIndex(previousScript, state.script, viewportAnchor.previousWordIndex);
    const nextAnchorLineIndex = lineIndexByWord[nextAnchorWordIndex] ?? 0;
    const nextAnchorTop = getLineTargetTop(nextAnchorLineIndex) + viewportAnchor.offsetWithinLine;
    return clamp(nextAnchorTop, 0, totalScrollable);
  }

  function rerenderScriptPreservingPosition(previousScript, options = {}) {
    const { allowResponsiveResize = true } = options;
    const playbackMode = getActiveMode();
    const isPlaying = getIsPlaying();
    const isPaused = getIsPaused();
    const preserveVoiceTracking = playbackMode === "voice" && isPlaying;
    const currentScrollable = refreshPromptViewportMetrics();
    const scrollProgress = getScrollProgress();
    const currentIndex = getCurrentIndex();
    const previousScrollTop = playbackMode === "scroll"
      ? currentScrollable * scrollProgress
      : (ui.promptViewport?.scrollTop || 0);
    const playbackSnapshot = {
      wasPlaying: isPlaying,
      wasPaused: isPaused,
      previousIndex: currentIndex,
      previousScrollProgress: scrollProgress,
      previousScrollTop,
      viewportAnchor: captureScrollViewportAnchor(previousScrollTop),
      previousScrollHeight: ui.promptViewport?.scrollHeight || 0,
      previousClientHeight: ui.promptViewport?.clientHeight || 0
    };

    clearPlayback({ preserveVoiceTracking });
    setRealtimeRerenderActive(true);
    renderScript();
    if (allowResponsiveResize) {
      applyResponsiveText();
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (wordNodes.length === 0) {
          setRealtimeRerenderActive(false);
          stopPlayback(true);
          return;
        }

        const nextIndex = findPreservedWordIndex(previousScript, state.script, playbackSnapshot.previousIndex);
        setCurrentIndex(nextIndex);

        const totalScrollable = refreshPromptViewportMetrics();
        const previousScrollable = Math.max(playbackSnapshot.previousScrollHeight - playbackSnapshot.previousClientHeight, 0);
        const previousScrollRatio = previousScrollable > 0
          ? clamp(playbackSnapshot.previousScrollTop / previousScrollable, 0, 1)
          : playbackSnapshot.previousScrollProgress;
        const preservedTop = resolvePreservedScrollTop(
          previousScript,
          playbackSnapshot.viewportAnchor,
          playbackSnapshot.previousScrollProgress,
          totalScrollable
        );

        if (getActiveMode() === "scroll") {
          const nextProgress = totalScrollable > 0 ? clamp(preservedTop / totalScrollable, 0, 1) : 0;
          setScrollProgress(nextProgress);
          setViewportPosition(preservedTop, "auto");
        } else {
          const nextProgress = totalScrollable > 0 ? clamp(preservedTop / totalScrollable, 0, 1) : previousScrollRatio;
          setScrollProgress(nextProgress);
          setViewportPosition(preservedTop, "auto");
        }

        clearRenderedState();
        updateWordState(false);
        setRealtimeRerenderActive(false);
        setReadingMode(playbackSnapshot.wasPlaying);

        if (playbackSnapshot.wasPlaying && !playbackSnapshot.wasPaused) {
          if (playbackMode === "voice" && preserveVoiceTracking) {
            scheduleVoiceHealthCheck(0);
            updatePlaybackIndicators(true);
            updatePlayButtons();
            syncVoiceCommandListener();
            return;
          }

          restartPlaybackLoopForCurrentMode();
          return;
        }

        updatePlaybackIndicators(true);
        updatePlayButtons();
      });
    });
  }

  return {
    getWordNodes: () => wordNodes,
    getLineGroups: () => lineGroups,
    getLineIndexByWord: () => lineIndexByWord,
    getPromptWaitCards: () => promptWaitCards,
    getActivePromptWaitCardId: () => activePromptWaitCardId,
    setActivePromptWaitCardId: (id) => { activePromptWaitCardId = id; },
    getNormalizedWordTokens: () => normalizedWordTokens,
    getWordIndexByNormalizedToken: () => wordIndexByNormalizedToken,
    getNormalizedTokenRangeByWord: () => normalizedTokenRangeByWord,
    getCachedPromptViewportWidth: () => cachedPromptViewportWidth,
    getCachedPromptViewportHeight: () => cachedPromptViewportHeight,
    getCachedPromptScrollableHeight: () => cachedPromptScrollableHeight,
    getLastRenderedScriptSnapshot: () => lastRenderedScriptSnapshot,
    renderScript,
    rebuildLineMap,
    scheduleLineMapRebuild,
    rebuildNormalizedScriptTokenMap,
    applyResponsiveText,
    refreshPromptViewportMetrics,
    updatePromptSafeArea,
    syncPromptLayout,
    clearPendingScriptRerender,
    scheduleScriptRerender,
    setRealtimeRerenderActive,
    captureScrollViewportAnchor,
    resolvePreservedScrollTop,
    rerenderScriptPreservingPosition,
    getNormalizedTokenIndexForWord,
    getWordIndexForNormalizedToken,
    getNormalizedTokenRangeForLine,
    findPreservedWordIndex,
    parseWaitCardDescriptor,
    setPromptWaitCardNumber
  };
}
