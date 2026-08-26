export const MENU_CLOSE_ANIMATION_MS = 170;

export function resetAnimatedMenuState(menu) {
  if (menu?._closeTimer) {
    window.clearTimeout(menu._closeTimer);
    menu._closeTimer = 0;
  }

  menu?.classList.remove("is-closing");
  menu?.querySelectorAll(".is-selection-fading").forEach((element) => {
    element.classList.remove("is-selection-fading");
  });
}

export function openAnimatedMenu(menu, trigger, picker) {
  resetAnimatedMenuState(menu);
  menu.classList.remove("hidden");
  trigger.setAttribute("aria-expanded", "true");
  picker.classList.add("is-open");
}

export function closeAnimatedMenu(menu, trigger, picker, selectedOption = null, onAfterClose = null) {
  if (menu.classList.contains("hidden") && !menu.classList.contains("is-closing")) {
    onAfterClose?.();
    return;
  }

  resetAnimatedMenuState(menu);
  menu.classList.remove("hidden");
  menu.classList.add("is-closing");
  trigger.setAttribute("aria-expanded", "false");
  picker.classList.remove("is-open");

  if (selectedOption) {
    selectedOption.classList.add("is-selection-fading");
  }

  menu._closeTimer = window.setTimeout(() => {
    menu.classList.add("hidden");
    resetAnimatedMenuState(menu);
    onAfterClose?.();
  }, MENU_CLOSE_ANIMATION_MS);
}
