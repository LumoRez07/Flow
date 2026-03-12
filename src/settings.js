import { defaultState, loadState, saveState } from "./shared.js";

const MIN_WIDTH = 450;
const MIN_HEIGHT = 230;

const invoke = window.__TAURI__?.core?.invoke;
const tauriWindow = window.__TAURI__?.window;
const tauriDpi = window.__TAURI__?.dpi;

const state = loadState();
state.window = state.window || structuredClone(defaultState.window);

const ui = {
  xInput: document.querySelector("#xInput"),
  yInput: document.querySelector("#yInput"),
  widthInput: document.querySelector("#widthInput"),
  heightInput: document.querySelector("#heightInput"),
  presetSelect: document.querySelector("#presetSelect"),
  applyButton: document.querySelector("#applyButton"),
  refreshButton: document.querySelector("#refreshButton"),
  windowStatus: document.querySelector("#windowStatus"),
  closeWindowButton: document.querySelector("#closeWindowButton"),
  openTextButton: document.querySelector("#openTextButton"),
  stepButtons: document.querySelectorAll(".step-button")
};

function stepInput(input, amount) {
  const currentValue = input.value === "" ? 0 : Number(input.value);
  const min = input.min !== "" ? Number(input.min) : Number.NEGATIVE_INFINITY;
  const max = input.max !== "" ? Number(input.max) : Number.POSITIVE_INFINITY;
  const nextValue = Math.min(Math.max(currentValue + amount, min), max);
  input.value = Number.isFinite(nextValue) ? String(nextValue) : "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function getMainWindow() {
  if (!tauriWindow?.getAllWindows) return null;
  const windows = await tauriWindow.getAllWindows();
  return windows.find((windowRef) => windowRef.label === "main") || windows[0] || null;
}

function fillForm() {
  ui.xInput.value = state.window.x ?? "";
  ui.yInput.value = state.window.y ?? "";
  ui.widthInput.value = state.window.width;
  ui.heightInput.value = state.window.height;
  ui.presetSelect.value = state.window.preset || "top-center";
}

async function readCurrentWindow() {
  const appWindow = await getMainWindow();
  if (!appWindow) return;

  const size = await appWindow.outerSize();
  const pos = await appWindow.outerPosition();

  state.window.width = size.width;
  state.window.height = size.height;
  state.window.x = pos.x;
  state.window.y = pos.y;
  saveState(state);
  fillForm();
  ui.windowStatus.textContent = "Loaded current main window values.";
}

async function applyWindowSettings() {
  const appWindow = await getMainWindow();
  if (!appWindow || !tauriDpi) return;

  state.window.width = Math.max(Number(ui.widthInput.value) || defaultState.window.width, MIN_WIDTH);
  state.window.height = Math.max(Number(ui.heightInput.value) || defaultState.window.height, MIN_HEIGHT);
  state.window.x = ui.xInput.value === "" ? null : Number(ui.xInput.value);
  state.window.y = ui.yInput.value === "" ? null : Number(ui.yInput.value);
  state.window.preset = ui.presetSelect.value;

  await appWindow.setSize(new tauriDpi.LogicalSize(state.window.width, state.window.height));

  if (state.window.preset === "center") {
    await appWindow.center();
  } else if (state.window.preset === "top-center" && tauriWindow.currentMonitor && tauriWindow.primaryMonitor) {
    const monitor = (await tauriWindow.currentMonitor()) ?? (await tauriWindow.primaryMonitor());
    if (monitor) {
      const outer = await appWindow.outerSize();
      const x = monitor.position.x + Math.round((monitor.size.width - outer.width) / 2);
      const y = monitor.position.y;
      await appWindow.setPosition(new tauriDpi.PhysicalPosition(x, y));
      state.window.x = x;
      state.window.y = y;
    }
  } else if (state.window.x !== null && state.window.y !== null) {
    await appWindow.setPosition(new tauriDpi.LogicalPosition(state.window.x, state.window.y));
  }

  saveState(state);
  fillForm();
  ui.windowStatus.textContent = "Window settings applied.";
}

window.addEventListener("DOMContentLoaded", () => {
  fillForm();
  ui.stepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(`#${button.dataset.target}`);
      const amount = Number(button.dataset.step || "0");
      if (target) {
        stepInput(target, amount);
      }
    });
  });
  ui.applyButton.addEventListener("click", () => applyWindowSettings().catch(console.error));
  ui.refreshButton.addEventListener("click", () => readCurrentWindow().catch(console.error));
  ui.closeWindowButton.addEventListener("click", () => {
    invoke?.("hide_aux_window", { kind: "settings" }).catch(console.error);
  });
  ui.openTextButton.addEventListener("click", () => {
    invoke?.("open_aux_window", { kind: "input" }).catch(console.error);
  });
});
