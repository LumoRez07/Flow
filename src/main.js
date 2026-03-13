import {
  applyAppearanceToDocument,
  applyTextDirection,
  applyTranslationsToDocument,
  clamp,
  defaultState,
  generateWithGroq,
  loadState,
  parseFormattedScript,
  resolveFontStack,
  saveState,
  splitWords,
  translate
} from "./shared.js";

const MIN_WIDTH = 400;
const MIN_HEIGHT = 200;
const COLLAPSED_HEIGHT = 56;
const COLLAPSE_DURATION = 420;

const invoke = window.__TAURI__?.core?.invoke;
const tauriWindow = window.__TAURI__?.window;
const tauriDpi = window.__TAURI__?.dpi;

const state = loadState();
const COMPACT_SPEED_WIDTH = 450;

const ui = {};
let tickTimer = null;
let scrollAnimationFrame = null;
let currentIndex = 0;
let isPlaying = false;
let isPaused = false;
let isCollapsed = false;
let currentWindowHeight = null;
let resizeAnimationToken = 0;
let wordNodes = [];
let lineGroups = [];
let lineIndexByWord = [];
let resizeObserver = null;
let scrollProgress = 0;
let lastRenderedMode = null;
let lastRenderedWordIndex = -1;
let lastRenderedLineIndex = -1;
let lastStatusUpdateAt = 0;

function syncStateFromStorage() {
  const latest = loadState();
  Object.assign(state, latest);
}

function t(key, params = {}) {
  return translate(key, state.language, params);
}

function cacheUi() {
  ui.promptViewport = document.querySelector("#promptViewport");
  ui.promptText = document.querySelector("#promptText");
  ui.progressLabel = document.querySelector("#progressLabel");
  ui.statusLabel = document.querySelector("#statusLabel");
  ui.footerMeta = document.querySelector("#footerMeta");
  ui.speedLabel = document.querySelector("#speedLabel");
  ui.speedDownButton = document.querySelector("#speedDownButton");
  ui.speedUpButton = document.querySelector("#speedUpButton");
  ui.generateButton = document.querySelector("#generateButton");
  ui.playButton = document.querySelector("#playButton");
  ui.floatingControls = document.querySelector("#floatingControls");
  ui.floatingReplayButton = document.querySelector("#floatingReplayButton");
  ui.floatingPauseButton = document.querySelector("#floatingPauseButton");
  ui.floatingStopButton = document.querySelector("#floatingStopButton");
  ui.inputButton = document.querySelector("#inputButton");
  ui.settingsButton = document.querySelector("#settingsButton");
  ui.closeAppButton = document.querySelector("#closeAppButton");
  ui.collapseButton = document.querySelector("#collapseButton");
}

function words() {
  return splitWords(state.script);
}

function updateSpeedLabel() {
  ui.speedLabel.value = String(state.speed);
  ui.speedLabel.title = `${state.speed} ${t("common.wpm")}`;
}

function commitTypedSpeed() {
  const typedSpeed = clamp(Number(ui.speedLabel.value) || state.speed, 60, 260);
  state.speed = typedSpeed;
  saveState({ speed: state.speed });
  updateSpeedLabel();
}

function updateSpeedInputMode() {
  const compactMode = window.innerWidth < COMPACT_SPEED_WIDTH;
  ui.speedDownButton.classList.toggle("hidden", compactMode);
  ui.speedUpButton.classList.toggle("hidden", compactMode);
  ui.speedLabel.readOnly = !compactMode;
  ui.speedLabel.classList.toggle("speed-pill-editable", compactMode);
}

function getActiveMode() {
  return state.appearance?.performanceMode ? "scroll" : state.appearance.mode;
}

function getScrollBehavior() {
  return state.appearance?.performanceMode ? "auto" : "smooth";
}

function getPlaybackLabel() {
  if (!isPlaying) return currentIndex > 0 ? t("tele.status.stopped") : t("tele.status.ready");
  const activeMode = getActiveMode();
  if (isPaused) return activeMode === "arrow" ? t("tele.status.arrowPaused") : t("tele.status.paused");
  if (state.appearance?.performanceMode) return t("tele.status.performance");
  if (activeMode === "scroll") return t("tele.status.scrolling");
  if (activeMode === "line") return t("tele.status.line");
  if (activeMode === "arrow") return t("tele.status.arrow");
  return t("tele.status.highlight");
}

function updateStatus() {
  const total = wordNodes.length;
  const current = total === 0 ? 0 : Math.min(currentIndex + 1, total);
  ui.progressLabel.textContent = t("tele.progress", { current, total });
  ui.statusLabel.textContent = getPlaybackLabel();
}

function updatePlaybackIndicators(force = false) {
  const activeMode = getActiveMode();
  const now = performance.now();
  const shouldThrottle = activeMode === "scroll";

  if (force || !shouldThrottle || now - lastStatusUpdateAt >= 120 || !isPlaying || isPaused) {
    lastStatusUpdateAt = now;
    updateStatus();
  }
}

function updateCollapseButton() {
  ui.collapseButton.title = isCollapsed ? t("common.expand") : t("common.collapse");
  ui.collapseButton.setAttribute("aria-label", ui.collapseButton.title);
  ui.collapseButton.classList.toggle("is-collapsed", isCollapsed);
}

function setReadingMode(enabled) {
  document.body.classList.toggle("reading-mode", enabled);
  ui.floatingControls.classList.toggle("hidden", !enabled);
}

function updatePlayButtons() {
  const isResume = currentIndex > 0 && currentIndex < Math.max(wordNodes.length - 1, 0);
  ui.playButton.textContent = isResume ? "⏵" : "▶";
  ui.playButton.title = isResume ? t("common.continue") : t("common.play");
  ui.playButton.setAttribute("aria-label", ui.playButton.title);

  const pauseLabel = isPaused ? t("common.continue") : t("common.pause");
  ui.floatingPauseButton.textContent = isPaused ? "▶" : "⏸";
  ui.floatingPauseButton.title = pauseLabel;
  ui.floatingPauseButton.setAttribute("aria-label", pauseLabel);
  ui.floatingPauseButton.disabled = !isPlaying && !isPaused;

  ui.floatingReplayButton.title = t("common.replayStart");
  ui.floatingReplayButton.setAttribute("aria-label", ui.floatingReplayButton.title);
  ui.floatingStopButton.title = t("common.stopKeep");
  ui.floatingStopButton.setAttribute("aria-label", ui.floatingStopButton.title);

  const showReplay = isPaused && currentIndex > 0;
  ui.floatingReplayButton.classList.toggle("hidden", !showReplay);
}

function hexToRgbTriplet(hexColor) {
  const normalized = hexColor.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((value) => value + value).join("")
    : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
}

function applyAppearanceSettings() {
  const appearance = state.appearance || defaultState.appearance;
  applyAppearanceToDocument(appearance);
  document.body.dataset.animationStyle = getActiveMode();
  document.documentElement.style.setProperty("--teleprompter-font-family", resolveFontStack(appearance.fontFamily));
  document.documentElement.style.setProperty("--teleprompter-text-rgb", hexToRgbTriplet(appearance.textColor));
  document.documentElement.style.setProperty("--teleprompter-text-opacity", String(clamp(appearance.textOpacity / 100, 0.1, 1)));
}

async function animateWindowHeight(targetHeight) {
  if (state.appearance?.performanceMode) {
    currentWindowHeight = targetHeight;
    if (tauriWindow?.getCurrentWindow && tauriDpi?.LogicalSize) {
      const appWindow = tauriWindow.getCurrentWindow();
      const width = Math.max(state.window.width || defaultState.window.width, MIN_WIDTH);
      await appWindow.setSize(new tauriDpi.LogicalSize(width, targetHeight)).catch(console.error);
    }
    return;
  }

  if (!tauriWindow?.getCurrentWindow || !tauriDpi?.LogicalSize) {
    currentWindowHeight = targetHeight;
    return;
  }

  const appWindow = tauriWindow.getCurrentWindow();
  const width = Math.max(state.window.width || defaultState.window.width, MIN_WIDTH);
  const startHeight = currentWindowHeight ?? Math.max(state.window.height || defaultState.window.height, MIN_HEIGHT);

  if (startHeight === targetHeight) {
    currentWindowHeight = targetHeight;
    return;
  }

  const token = ++resizeAnimationToken;

  const easeInOutCubic = (progress) => {
    if (progress < 0.5) {
      return 4 * progress * progress * progress;
    }

    return 1 - ((-2 * progress + 2) ** 3) / 2;
  };

  await new Promise((resolve) => {
    let lastAppliedHeight = startHeight;

    const step = (now, startedAt = now) => {
      if (token !== resizeAnimationToken) {
        resolve();
        return;
      }

      const progress = Math.min((now - startedAt) / COLLAPSE_DURATION, 1);
      const eased = easeInOutCubic(progress);
      const nextHeight = Math.round(startHeight + (targetHeight - startHeight) * eased);

      if (nextHeight !== lastAppliedHeight) {
        lastAppliedHeight = nextHeight;
        currentWindowHeight = nextHeight;
        appWindow.setSize(new tauriDpi.LogicalSize(width, nextHeight)).catch(console.error);
      }

      if (progress < 1) {
        requestAnimationFrame((timestamp) => step(timestamp, startedAt));
        return;
      }

      currentWindowHeight = targetHeight;
      appWindow.setSize(new tauriDpi.LogicalSize(width, targetHeight)).catch(console.error).finally(resolve);
    };

    requestAnimationFrame((timestamp) => step(timestamp, timestamp));
  });
}

async function setCollapsed(nextValue) {
  if (isCollapsed === nextValue) return;

  if (nextValue && isPlaying) {
    stopPlayback(true);
  }

  const expandedHeight = Math.max(state.window.height || defaultState.window.height, MIN_HEIGHT);

  isCollapsed = nextValue;
  updateCollapseButton();

  if (isCollapsed) {
    document.body.classList.add("teleprompter-collapsing");
    document.body.classList.remove("teleprompter-expanding");
    document.body.classList.add("teleprompter-collapsed");
    await animateWindowHeight(COLLAPSED_HEIGHT);
    document.body.classList.remove("teleprompter-collapsing");
  } else {
    document.body.classList.add("teleprompter-expanding");
    document.body.classList.remove("teleprompter-collapsed", "teleprompter-collapsing");
    await animateWindowHeight(expandedHeight);
    document.body.classList.remove("teleprompter-expanding");
  }

  if (!isCollapsed) {
    applyResponsiveText();
  }
}

function rebuildLineMap() {
  lineGroups = [];
  lineIndexByWord = new Array(wordNodes.length).fill(0);

  if (wordNodes.length === 0) {
    return;
  }

  let currentLine = null;

  wordNodes.forEach((node, index) => {
    const top = Math.round(node.offsetTop);
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
}

function scheduleLineMapRebuild() {
  requestAnimationFrame(() => {
    rebuildLineMap();
    lastRenderedLineIndex = -1;
    lastRenderedWordIndex = -1;
    lastRenderedMode = null;
    updateWordState(false);
  });
}

function applyResponsiveText() {
  const widthSize = ui.promptViewport.clientWidth * 0.11;
  const heightSize = ui.promptViewport.clientHeight * 0.18;
  const baseSize = clamp(Math.min(widthSize, heightSize), 28, 120);
  const scale = (state.appearance?.textScale || defaultState.appearance.textScale) / 100;
  const computed = clamp(baseSize * scale, 20, 180);
  document.documentElement.style.setProperty("--teleprompter-font-size", `${computed}px`);
  scheduleLineMapRebuild();
}

function createWordSpan(token, index, options = {}) {
  const { includeHighlight = true, includeUnderline = true } = options;
  const span = document.createElement("span");
  span.className = "prompt-word";
  span.dataset.index = String(index);
  span.textContent = token.text;

  if (token.style.bold) {
    span.classList.add("is-bold");
  }

  if (token.style.italic) {
    span.classList.add("is-italic");
  }

  if (includeUnderline && token.style.underline) {
    span.classList.add("is-underlined");
  }

  if (includeHighlight && token.style.highlight) {
    span.classList.add("is-marked", `is-marked-${token.style.highlight}`);
  }

  return span;
}

function createDecorationGroupSpan(style) {
  const span = document.createElement("span");
  span.className = "prompt-highlight-group";

  if (style.highlight) {
    span.classList.add("is-marked", `is-marked-${style.highlight}`);
  } else {
    span.classList.remove("is-marked");
  }

  if (style.underline) {
    span.classList.add("is-underlined");
  }

  return span;
}

function getDecorationSignature(style = {}) {
  if (!style.highlight && !style.underline) {
    return "";
  }

  return JSON.stringify({
    highlight: style.highlight || null,
    underline: Boolean(style.underline)
  });
}

function renderScript() {
  const tokens = parseFormattedScript(state.script);
  const allWords = tokens.filter((token) => token.type === "word");
  const fragment = document.createDocumentFragment();

  ui.promptText.innerHTML = "";
  const promptDirection = applyTextDirection(ui.promptText, state.script);
  ui.promptViewport?.setAttribute("dir", promptDirection);
  ui.promptViewport.dataset.textDirection = promptDirection;
  wordNodes = [];
  lineGroups = [];
  lineIndexByWord = [];
  lastRenderedMode = null;
  lastRenderedWordIndex = -1;
  lastRenderedLineIndex = -1;

  if (allWords.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-copy";
    empty.textContent = t("tele.empty");
    ui.promptText.appendChild(empty);
    updateStatus();
    return;
  }

  let wordIndex = 0;
  let currentDecorationGroup = null;
  let currentDecorationSignature = "";

  const closeDecorationGroup = () => {
    currentDecorationGroup = null;
    currentDecorationSignature = "";
  };

  tokens.forEach((token, tokenIndex) => {
    if (token.type === "word") {
      const decorationSignature = getDecorationSignature(token.style);
      const target = decorationSignature
        ? (() => {
            if (!currentDecorationGroup || currentDecorationSignature !== decorationSignature) {
              currentDecorationGroup = createDecorationGroupSpan(token.style);
              currentDecorationSignature = decorationSignature;
              fragment.appendChild(currentDecorationGroup);
            }

            return currentDecorationGroup;
          })()
        : (() => {
            closeDecorationGroup();
            return fragment;
          })();

      const span = createWordSpan(token, wordIndex, {
        includeHighlight: !token.style.highlight || !decorationSignature,
        includeUnderline: !token.style.underline || !decorationSignature
      });

      wordNodes.push(span);
      target.appendChild(span);
      wordIndex += 1;
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
        fragment.appendChild(document.createTextNode(" "));
      }
      return;
    }

    closeDecorationGroup();
    fragment.appendChild(document.createElement("br"));
  });

  ui.promptText.appendChild(fragment);
  scheduleLineMapRebuild();
}

async function generatePromptScript() {
  syncStateFromStorage();
  const apiKey = state.groqKey?.trim();
  let promptDescription = state.groqPrompt?.trim();
  const existingScript = state.script?.trim() || "";

  if (!apiKey) {
    ui.statusLabel.textContent = t("tele.addGroqKey");
    return;
  }

  if (!promptDescription) {
    promptDescription = window.prompt(
      existingScript
        ? t("tele.promptExisting")
        : t("tele.promptNew"),
      existingScript
        ? t("tele.promptExistingDefault")
        : t("tele.promptNewDefault")
    )?.trim() || "";
    if (!promptDescription) {
      ui.statusLabel.textContent = t("tele.cancelled");
      return;
    }
    state.groqPrompt = promptDescription;
    saveState({ groqPrompt: promptDescription });
  }

  const request = [
    "You are editing or generating teleprompter text.",
    "Always follow the user's instruction exactly.",
    "If existing teleprompter text is provided, use it as the source text and rewrite or transform it according to the user's instruction.",
    "If no existing teleprompter text is provided, generate new teleprompter text from the user's instruction only.",
    "Match the language requested by the user. If the user asks for Arabic, write fully in Arabic.",
    "Do not invent a random topic unless the user explicitly asks for one.",
    "Return only the final teleprompter text.",
    "Do not include any intro, label, explanation, notes, or quotation marks.",
    `USER INSTRUCTION:\n${promptDescription}`,
    existingScript ? `\nEXISTING TELEPROMPTER TEXT:\n${existingScript}` : ""
  ].filter(Boolean).join("\n\n");

  ui.statusLabel.textContent = t("tele.generating");
  ui.generateButton.disabled = true;

  try {
    const text = await generateWithGroq(apiKey, request);

    state.script = text;
    saveState({ script: text, groqPrompt: promptDescription });
    stopPlayback(true);
    renderScript();
    applyResponsiveText();
    ui.statusLabel.textContent = t("tele.generated");
  } catch (error) {
    console.error(error);
    ui.statusLabel.textContent = t("tele.groqFailed", { error: error.message || error });
  } finally {
    ui.generateButton.disabled = false;
  }
}

function clearWordClasses() {
  wordNodes.forEach((node) => {
    node.classList.remove("active", "past", "next", "active-line", "past-line", "next-line", "arrow-active", "arrow-nearby");
  });
}

function clearRenderedState() {
  clearWordClasses();
  lastRenderedMode = null;
  lastRenderedWordIndex = -1;
  lastRenderedLineIndex = -1;
}

function setClassesForLine(lineIndex, classNames, enabled) {
  const line = lineGroups[lineIndex];
  if (!line) return;

  for (let index = line.firstIndex; index <= line.lastIndex; index += 1) {
    const node = wordNodes[index];
    if (!node) continue;

    classNames.forEach((className) => {
      node.classList.toggle(className, enabled);
    });
  }
}

function renderHighlightState() {
  if (lastRenderedMode !== "highlight") {
    clearRenderedState();
    lastRenderedMode = "highlight";
  }

  if (lastRenderedWordIndex === currentIndex) {
    return;
  }

  const previousIndex = lastRenderedWordIndex;
  const isSequentialForward = previousIndex >= 0 && currentIndex === previousIndex + 1;

  if (!isSequentialForward) {
    clearWordClasses();

    for (let index = 0; index < currentIndex; index += 1) {
      wordNodes[index]?.classList.add("past");
    }

    wordNodes[currentIndex]?.classList.add("active");

    for (let index = currentIndex + 1; index <= Math.min(currentIndex + 3, wordNodes.length - 1); index += 1) {
      wordNodes[index]?.classList.add("next");
    }
  } else {
    wordNodes[previousIndex]?.classList.remove("active");
    wordNodes[previousIndex]?.classList.add("past");
    wordNodes[currentIndex]?.classList.remove("next");
    wordNodes[currentIndex]?.classList.add("active");
    wordNodes[currentIndex + 3]?.classList.add("next");
  }

  lastRenderedWordIndex = currentIndex;
}

function renderLineState(mode) {
  const activeLineIndex = lineIndexByWord[currentIndex] ?? 0;
  const isArrowMode = mode === "arrow";

  if (lastRenderedMode !== mode) {
    clearRenderedState();
    lastRenderedMode = mode;
  }

  if (lastRenderedLineIndex === activeLineIndex) {
    return activeLineIndex;
  }

  const previousLineIndex = lastRenderedLineIndex;
  const isSequentialForward = previousLineIndex >= 0 && activeLineIndex === previousLineIndex + 1;

  if (!isSequentialForward) {
    clearWordClasses();

    if (isArrowMode) {
      setClassesForLine(activeLineIndex - 1, ["arrow-nearby"], true);
      setClassesForLine(activeLineIndex, ["arrow-active"], true);
      setClassesForLine(activeLineIndex + 1, ["arrow-nearby"], true);
    } else {
      for (let lineIndex = 0; lineIndex < activeLineIndex; lineIndex += 1) {
        setClassesForLine(lineIndex, ["past-line"], true);
      }

      setClassesForLine(activeLineIndex, ["active-line"], true);
      setClassesForLine(activeLineIndex + 1, ["next-line"], true);
    }
  } else if (isArrowMode) {
    setClassesForLine(previousLineIndex - 1, ["arrow-nearby"], false);
    setClassesForLine(previousLineIndex, ["arrow-active"], false);
    setClassesForLine(previousLineIndex, ["arrow-nearby"], true);
    setClassesForLine(activeLineIndex, ["arrow-nearby"], false);
    setClassesForLine(activeLineIndex, ["arrow-active"], true);
    setClassesForLine(activeLineIndex + 1, ["arrow-nearby"], true);
  } else {
    setClassesForLine(previousLineIndex, ["active-line"], false);
    setClassesForLine(previousLineIndex, ["past-line"], true);
    setClassesForLine(activeLineIndex, ["next-line"], false);
    setClassesForLine(activeLineIndex, ["active-line"], true);
    setClassesForLine(activeLineIndex + 1, ["next-line"], true);
  }

  lastRenderedLineIndex = activeLineIndex;
  lastRenderedWordIndex = currentIndex;
  return activeLineIndex;
}

function scrollToNode(node) {
  if (!node) return;
  const top = node.offsetTop - ui.promptViewport.clientHeight * 0.32;
  ui.promptViewport.scrollTo({ top: Math.max(top, 0), behavior: getScrollBehavior() });
}

function scrollToLine(lineIndex) {
  const line = lineGroups[lineIndex];
  if (!line) return;
  const top = line.top - ui.promptViewport.clientHeight * 0.28;
  ui.promptViewport.scrollTo({ top: Math.max(top, 0), behavior: getScrollBehavior() });
}

function updateWordState(shouldScroll = true) {
  const activeMode = getActiveMode();

  if (state.appearance?.performanceMode && activeMode === "scroll") {
    updatePlaybackIndicators(false);
    return;
  }

  if (activeMode === "highlight") {
    renderHighlightState();

    if (shouldScroll) {
      scrollToNode(wordNodes[currentIndex]);
    }
  } else if (activeMode === "line") {
    const activeLineIndex = renderLineState("line");

    if (shouldScroll) {
      scrollToLine(activeLineIndex);
    }
  } else if (activeMode === "arrow") {
    const activeLineIndex = renderLineState("arrow");

    if (shouldScroll) {
      scrollToLine(activeLineIndex);
    }
  }

  updatePlaybackIndicators(false);
}

function clearPlayback() {
  if (tickTimer) {
    clearTimeout(tickTimer);
    tickTimer = null;
  }

  if (scrollAnimationFrame) {
    cancelAnimationFrame(scrollAnimationFrame);
    scrollAnimationFrame = null;
  }
}

function stopPlayback(reset = true) {
  isPlaying = false;
  isPaused = false;
  setReadingMode(false);
  clearPlayback();

  if (reset) {
    currentIndex = 0;
    scrollProgress = 0;
    ui.promptViewport.scrollTo({ top: 0, behavior: getScrollBehavior() });
    clearRenderedState();
  } else {
    const totalScrollable = Math.max(ui.promptViewport.scrollHeight - ui.promptViewport.clientHeight, 0);
    scrollProgress = totalScrollable > 0 ? ui.promptViewport.scrollTop / totalScrollable : 0;
  }

  updateWordState(false);
  updatePlayButtons();
}

function finishPlayback() {
  isPlaying = false;
  isPaused = false;
  setReadingMode(false);
  clearPlayback();
  scrollProgress = 1;
  updatePlaybackIndicators(true);
  updatePlayButtons();
}

function playTimedStep() {
  updateWordState(true);

  if (currentIndex >= wordNodes.length - 1) {
    finishPlayback();
    return;
  }

  tickTimer = setTimeout(() => {
    currentIndex += 1;
    playTimedStep();
  }, 60000 / state.speed);
}

function playScrollMode() {
  const totalWords = wordNodes.length;
  const totalScrollable = Math.max(ui.promptViewport.scrollHeight - ui.promptViewport.clientHeight, 0);
  const duration = Math.max((totalWords / state.speed) * 60000, 1000);
  const startedAt = performance.now() - scrollProgress * duration;

  const step = (now) => {
    if (!isPlaying || isPaused) {
      return;
    }

    const progress = Math.min((now - startedAt) / duration, 1);
    scrollProgress = progress;
    ui.promptViewport.scrollTop = totalScrollable * progress;
    currentIndex = totalWords === 0 ? 0 : Math.min(Math.floor(progress * totalWords), totalWords - 1);

    if (state.appearance?.performanceMode) {
      updatePlaybackIndicators(false);
    } else {
      updateWordState(false);
    }

    if (progress >= 1) {
      finishPlayback();
      return;
    }

    scrollAnimationFrame = requestAnimationFrame(step);
  };

  scrollAnimationFrame = requestAnimationFrame(step);
}

function beginArrowMode() {
  isPlaying = true;
  isPaused = false;
  setReadingMode(true);
  updateWordState(true);
}

function play() {
  if (wordNodes.length === 0) return;
  const activeMode = getActiveMode();

  if (currentIndex >= wordNodes.length - 1) {
    currentIndex = 0;
    scrollProgress = 0;
    ui.promptViewport.scrollTo({ top: 0, behavior: "auto" });
  }

  clearPlayback();
  isPlaying = true;
  isPaused = false;
  setReadingMode(true);
  lastStatusUpdateAt = 0;
  updatePlayButtons();

  if (activeMode === "arrow") {
    beginArrowMode();
    return;
  }

  if (activeMode === "scroll") {
    playScrollMode();
    return;
  }

  playTimedStep();
}

async function openAuxWindow(kind) {
  if (invoke) {
    await invoke("open_aux_window", { kind });
    const kindLabel = kind === "input" ? t("common.text") : kind === "settings" ? t("common.settings") : kind;
    ui.statusLabel.textContent = t("tele.opened", { kind: kindLabel });
  }
}

function togglePause() {
  if (!isPlaying && !isPaused) {
    return;
  }

  const activeMode = getActiveMode();

  if (activeMode === "arrow") {
    isPaused = !isPaused;
    updatePlaybackIndicators(true);
    updatePlayButtons();
    return;
  }

  if (isPaused) {
    isPaused = false;

    if (activeMode === "scroll") {
      playScrollMode();
    } else {
      playTimedStep();
    }
  } else {
    isPaused = true;
    clearPlayback();
  }

  updatePlaybackIndicators(true);
  updatePlayButtons();
}

function replayFromStart() {
  stopPlayback(true);
  play();
}

function stepArrowMode(direction) {
  if (getActiveMode() !== "arrow" || !isPlaying || isPaused) {
    return;
  }

  const activeLineIndex = lineIndexByWord[currentIndex] ?? 0;
  const nextLineIndex = clamp(activeLineIndex + direction, 0, Math.max(lineGroups.length - 1, 0));
  const nextLine = lineGroups[nextLineIndex];

  if (!nextLine) {
    return;
  }

  currentIndex = nextLine.firstIndex;
  const totalScrollable = Math.max(ui.promptViewport.scrollHeight - ui.promptViewport.clientHeight, 0);
  const targetTop = Math.max(nextLine.top - ui.promptViewport.clientHeight * 0.28, 0);
  scrollToLine(nextLineIndex);
  scrollProgress = totalScrollable > 0 ? clamp(targetTop / totalScrollable, 0, 1) : scrollProgress;
  updateWordState(false);
}

function jumpToIndex(targetIndex) {
  if (wordNodes.length === 0) {
    return;
  }

  const nextIndex = clamp(targetIndex, 0, wordNodes.length - 1);
  currentIndex = nextIndex;

  const totalScrollable = Math.max(ui.promptViewport.scrollHeight - ui.promptViewport.clientHeight, 0);
  const activeLineIndex = lineIndexByWord[currentIndex] ?? 0;
  const targetTop = Math.max((lineGroups[activeLineIndex]?.top ?? 0) - ui.promptViewport.clientHeight * 0.28, 0);
  scrollProgress = totalScrollable > 0 ? clamp(targetTop / totalScrollable, 0, 1) : 0;

  if (isPlaying && !isPaused) {
    clearPlayback();
    playTimedStep();
    return;
  }

  updateWordState(true);
}

function handlePromptClick(event) {
  const word = event.target.closest(".prompt-word");
  if (!word) {
    return;
  }

  const activeMode = getActiveMode();
  if (activeMode !== "highlight" && activeMode !== "line") {
    return;
  }

  const wordIndex = Number(word.dataset.index);
  if (!Number.isFinite(wordIndex)) {
    return;
  }

  if (activeMode === "highlight") {
    jumpToIndex(wordIndex);
    return;
  }

  const lineIndex = Number(word.dataset.lineIndex);
  const line = Number.isFinite(lineIndex) ? lineGroups[lineIndex] : null;
  jumpToIndex(line?.firstIndex ?? wordIndex);
}

function handlePlaybackHotkeys(event) {
  const target = event.target;
  if (target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)) {
    return;
  }

  if (event.code === "Space" && (isPlaying || isPaused)) {
    event.preventDefault();
    togglePause();
    return;
  }

  if (getActiveMode() !== "arrow" || !isPlaying) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    stepArrowMode(1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    stepArrowMode(-1);
  }
}

function refreshFromStorage() {
  const previousState = {
    script: state.script,
    speed: state.speed,
    language: state.language,
    appearance: JSON.stringify(state.appearance),
    window: JSON.stringify(state.window)
  };

  syncStateFromStorage();

  if (previousState.speed !== state.speed) {
    updateSpeedLabel();
  }

  if (previousState.language !== state.language) {
    applyTranslationsToDocument(state.language);
    updateCollapseButton();
    updatePlayButtons();
  }

  if (previousState.appearance !== JSON.stringify(state.appearance)) {
    applyAppearanceSettings();
  }

  if (!isCollapsed) {
    currentWindowHeight = Math.max(state.window.height || defaultState.window.height, MIN_HEIGHT);
  }

  if (previousState.script !== state.script || previousState.appearance !== JSON.stringify(state.appearance)) {
    stopPlayback(true);
    renderScript();
    applyResponsiveText();
    return;
  }

  if (previousState.window !== JSON.stringify(state.window)) {
    applyStoredWindowSettings().catch(console.error);
  }
}

function wireEvents() {
  ui.speedDownButton.addEventListener("click", () => {
    state.speed = clamp(state.speed - 10, 60, 260);
    saveState({ speed: state.speed });
    updateSpeedLabel();
  });

  ui.speedUpButton.addEventListener("click", () => {
    state.speed = clamp(state.speed + 10, 60, 260);
    saveState({ speed: state.speed });
    updateSpeedLabel();
  });

  ui.speedLabel.addEventListener("input", () => {
    if (ui.speedLabel.readOnly) {
      updateSpeedLabel();
      return;
    }

    ui.speedLabel.value = ui.speedLabel.value.replace(/[^\d]/g, "");
  });

  ui.speedLabel.addEventListener("change", commitTypedSpeed);
  ui.speedLabel.addEventListener("blur", commitTypedSpeed);
  ui.speedLabel.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      ui.speedLabel.blur();
    }
  });

  ui.generateButton.addEventListener("click", () => {
    generatePromptScript().catch(console.error);
  });

  ui.playButton.addEventListener("click", () => {
    if (isPlaying) return;
    play();
  });

  ui.floatingStopButton.addEventListener("click", () => {
    stopPlayback(false);
  });

  ui.floatingReplayButton.addEventListener("click", () => {
    replayFromStart();
  });

  ui.floatingPauseButton.addEventListener("click", () => {
    togglePause();
  });

  ui.inputButton.addEventListener("click", () => {
    openAuxWindow("input").catch((error) => {
      console.error(error);
      ui.statusLabel.textContent = t("tele.failedOpenInput", { error });
    });
  });

  ui.settingsButton.addEventListener("click", () => {
    openAuxWindow("settings").catch((error) => {
      console.error(error);
      ui.statusLabel.textContent = t("tele.failedOpenSettings", { error });
    });
  });

  ui.closeAppButton.addEventListener("click", () => {
    invoke?.("close_app").catch((error) => {
      console.error(error);
      ui.statusLabel.textContent = t("tele.failedCloseApp", { error });
    });
  });

  ui.collapseButton.addEventListener("click", () => {
    setCollapsed(!isCollapsed).catch(console.error);
  });

  ui.promptText.addEventListener("click", handlePromptClick);

  window.addEventListener("resize", () => {
    applyResponsiveText();
    updateSpeedInputMode();
  });
  window.addEventListener("focus", refreshFromStorage);
  window.addEventListener("storage", refreshFromStorage);
  window.addEventListener("flow-state-updated", refreshFromStorage);
  window.addEventListener("keydown", handlePlaybackHotkeys);

  resizeObserver = new ResizeObserver(() => {
    applyResponsiveText();
  });
  resizeObserver.observe(ui.promptViewport);
}

async function applyStoredWindowSettings() {
  if (!tauriWindow?.getCurrentWindow || !tauriDpi?.LogicalSize) return;

  const appWindow = tauriWindow.getCurrentWindow();
  state.window.width = Math.max(state.window.width || defaultState.window.width, MIN_WIDTH);
  state.window.height = Math.max(state.window.height || defaultState.window.height, MIN_HEIGHT);
  await appWindow.setSize(new tauriDpi.LogicalSize(state.window.width, state.window.height));
  currentWindowHeight = state.window.height;

  if (state.window.preset === "center") {
    await appWindow.center();
    return;
  }

  if (state.window.preset === "top-center" && tauriWindow.currentMonitor && tauriWindow.primaryMonitor) {
    const monitor = (await tauriWindow.currentMonitor()) ?? (await tauriWindow.primaryMonitor());
    if (monitor) {
      const outer = await appWindow.outerSize();
      const x = monitor.position.x + Math.round((monitor.size.width - outer.width) / 2);
      await appWindow.setPosition(new tauriDpi.PhysicalPosition(x, monitor.position.y));
      return;
    }
  }

  if (state.window.x !== null && state.window.y !== null && tauriDpi.LogicalPosition) {
    await appWindow.setPosition(new tauriDpi.LogicalPosition(state.window.x, state.window.y));
  }
}

window.addEventListener("DOMContentLoaded", () => {
  syncStateFromStorage();
  applyTranslationsToDocument(state.language);
  cacheUi();
  applyAppearanceSettings();
  updateCollapseButton();
  updateSpeedLabel();
  updateSpeedInputMode();
  renderScript();
  applyResponsiveText();
  wireEvents();
  updatePlayButtons();
  applyStoredWindowSettings().catch(console.error);
});



