/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export function setButtonIcon(element, iconClassName) {
  const icon = element?.querySelector(".ph");
  if (!icon) {
    return;
  }

  icon.className = `ph ${iconClassName}`;
  icon.setAttribute("aria-hidden", "true");
}

export function updatePlayButtonState(playButton, isPlaying, isPaused) {
  if (!playButton) return;
  if (isPlaying) {
    setButtonIcon(playButton, isPaused ? "ph-play" : "ph-pause");
    playButton.classList.toggle("is-active", true);
  } else {
    setButtonIcon(playButton, "ph-play");
    playButton.classList.toggle("is-active", false);
  }
}

export function updateCollapseButtonState(collapseButton, isCollapsed) {
  if (!collapseButton) return;
  collapseButton.classList.toggle("is-collapsed", isCollapsed);
}
