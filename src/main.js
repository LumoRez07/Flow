import { clamp, defaultState, generateWithGroq, loadState, saveState, splitWords } from "./shared.js";

const MIN_WIDTH = 450;
const MIN_HEIGHT = 230;
const COLLAPSED_HEIGHT = 56;
const COLLAPSE_DURATION = 420;

const invoke = window.__TAURI__?.core?.invoke;
const tauriWindow = window.__TAURI__?.window;
const tauriDpi = window.__TAURI__?.dpi;

const state = loadState();
state.script = state.script || defaultState.script;
state.speed = state.speed || defaultState.speed;

const ui = {};
let tickTimer = null;
let currentIndex = 0;
let isPlaying = false;
let isCollapsed = false;
let currentWindowHeight = null;
let resizeAnimationToken = 0;

function syncStateFromStorage() {
  const latest = loadState();
  state.script = latest.script || defaultState.script;
  state.speed = latest.speed || defaultState.speed;
  state.groqKey = latest.groqKey || "";
  state.groqPrompt = latest.groqPrompt || "";
  state.window = {
    ...defaultState.window,
    ...(latest.window || {})
  };
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
  ui.speedLabel.textContent = `${state.speed} wpm`;
}

function updateStatus() {
  const allWords = words();
  const total = allWords.length;
  const current = total === 0 ? 0 : Math.min(currentIndex + 1, total);
  ui.progressLabel.textContent = `Word ${current} / ${total}`;
  ui.statusLabel.textContent = isPlaying ? "Playing" : "Ready";
}

function updateCollapseButton() {
  ui.collapseButton.title = isCollapsed ? "Expand teleprompter" : "Collapse teleprompter";
  ui.collapseButton.setAttribute("aria-label", ui.collapseButton.title);
  ui.collapseButton.classList.toggle("is-collapsed", isCollapsed);
}

function setReadingMode(enabled) {
  document.body.classList.toggle("reading-mode", enabled);
  ui.floatingStopButton.classList.toggle("hidden", !enabled);
}

async function animateWindowHeight(targetHeight) {
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

function applyResponsiveText() {
  const widthSize = ui.promptViewport.clientWidth * 0.11;
  const heightSize = ui.promptViewport.clientHeight * 0.18;
  const computed = clamp(Math.min(widthSize, heightSize), 28, 120);
  document.documentElement.style.setProperty("--teleprompter-font-size", `${computed}px`);
}

function renderScript() {
  const allWords = words();
  ui.promptText.innerHTML = "";

  if (allWords.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-copy";
    empty.textContent = "Open the text page and add your script.";
    ui.promptText.appendChild(empty);
    updateStatus();
    return;
  }

  allWords.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = "prompt-word";
    span.dataset.index = String(index);
    span.textContent = word;
    ui.promptText.appendChild(span);
    ui.promptText.appendChild(document.createTextNode(" "));
  });

  updateWordState(false);
}

async function generatePromptScript() {
  syncStateFromStorage();
  const apiKey = state.groqKey?.trim();
  let promptDescription = state.groqPrompt?.trim();

  if (!apiKey) {
    ui.statusLabel.textContent = "Add Groq API key on the text page first";
    return;
  }

  if (!promptDescription) {
    promptDescription = window.prompt("Describe the teleprompter script you want Groq to generate:", "A concise product launch pitch with confident, natural pacing.")?.trim() || "";
    if (!promptDescription) {
      ui.statusLabel.textContent = "Generation cancelled";
      return;
    }
    state.groqPrompt = promptDescription;
    saveState(state);
  }

  ui.statusLabel.textContent = "Generating with Groq...";
  ui.generateButton.disabled = true;

  try {
    const text = await generateWithGroq(
      apiKey,
      `Create a clean teleprompter script based on this description. Keep it natural, easy to read aloud, and return only the final script text.\n\nDESCRIPTION:\n${promptDescription}`
    );

    state.script = text;
    saveState(state);
    stopPlayback(true);
    renderScript();
    applyResponsiveText();
    ui.statusLabel.textContent = "Groq generated a new script";
  } catch (error) {
    console.error(error);
    ui.statusLabel.textContent = `Groq failed: ${error.message || error}`;
  } finally {
    ui.generateButton.disabled = false;
  }
}

function updateWordState(shouldScroll = true) {
  const all = ui.promptText.querySelectorAll(".prompt-word");
  all.forEach((node) => {
    const index = Number(node.dataset.index);
    node.classList.remove("active", "past", "next");
    if (index < currentIndex) {
      node.classList.add("past");
    } else if (index === currentIndex) {
      node.classList.add("active");
    } else if (index <= currentIndex + 3) {
      node.classList.add("next");
    }
  });

  updateStatus();

  if (shouldScroll) {
    const active = ui.promptText.querySelector(`.prompt-word[data-index="${currentIndex}"]`);
    if (active) {
      const top = active.offsetTop - ui.promptViewport.clientHeight * 0.32;
      ui.promptViewport.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    }
  }
}

function stopPlayback(reset = true) {
  isPlaying = false;
  setReadingMode(false);
  if (tickTimer) {
    clearTimeout(tickTimer);
    tickTimer = null;
  }
  if (reset) {
    currentIndex = 0;
    ui.promptViewport.scrollTo({ top: 0, behavior: "smooth" });
  }
  updateWordState(false);
}

function playStep() {
  const allWords = words();
  updateWordState(true);

  if (currentIndex >= allWords.length - 1) {
    isPlaying = false;
    updateStatus();
    return;
  }

  tickTimer = setTimeout(() => {
    currentIndex += 1;
    playStep();
  }, 60000 / state.speed);
}

function play() {
  if (words().length === 0) return;
  if (tickTimer) clearTimeout(tickTimer);
  isPlaying = true;
  setReadingMode(true);
  playStep();
}

async function openAuxWindow(kind) {
  if (invoke) {
    await invoke("open_aux_window", { kind });
    ui.statusLabel.textContent = `Opened ${kind}`;
  }
}

function refreshFromStorage() {
  const previousScript = state.script;
  const previousSpeed = state.speed;

  syncStateFromStorage();

  if (previousSpeed !== state.speed) {
    updateSpeedLabel();
  }

  if (!isCollapsed) {
    currentWindowHeight = Math.max(state.window.height || defaultState.window.height, MIN_HEIGHT);
  }

  if (previousScript !== state.script) {
    stopPlayback(true);
    renderScript();
    applyResponsiveText();
  }
}

function wireEvents() {
  ui.speedDownButton.addEventListener("click", () => {
    state.speed = clamp(state.speed - 10, 60, 260);
    saveState(state);
    updateSpeedLabel();
  });

  ui.speedUpButton.addEventListener("click", () => {
    state.speed = clamp(state.speed + 10, 60, 260);
    saveState(state);
    updateSpeedLabel();
  });

  ui.generateButton.addEventListener("click", () => {
    generatePromptScript().catch(console.error);
  });

  ui.playButton.addEventListener("click", () => {
    if (isPlaying) return;
    play();
  });

  ui.floatingStopButton.addEventListener("click", () => {
    stopPlayback(true);
  });

  ui.inputButton.addEventListener("click", () => {
    openAuxWindow("input").catch((error) => {
      console.error(error);
      ui.statusLabel.textContent = `Failed to open input: ${error}`;
    });
  });

  ui.settingsButton.addEventListener("click", () => {
    openAuxWindow("settings").catch((error) => {
      console.error(error);
      ui.statusLabel.textContent = `Failed to open settings: ${error}`;
    });
  });

  ui.closeAppButton.addEventListener("click", () => {
    invoke?.("hide_main_window").catch((error) => {
      console.error(error);
      ui.statusLabel.textContent = `Failed to hide app: ${error}`;
    });
  });

  ui.collapseButton.addEventListener("click", () => {
    setCollapsed(!isCollapsed).catch(console.error);
  });

  window.addEventListener("resize", applyResponsiveText);
  window.addEventListener("focus", refreshFromStorage);
  window.addEventListener("storage", refreshFromStorage);
  new ResizeObserver(applyResponsiveText).observe(ui.promptViewport);
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
  cacheUi();
  updateCollapseButton();
  updateSpeedLabel();
  renderScript();
  applyResponsiveText();
  wireEvents();
  applyStoredWindowSettings().catch(console.error);
});



