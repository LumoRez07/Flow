/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { clamp } from "../core/utils.js";
import { scheduleAnimationFrame } from "./window.js";

export function initializeSmoothScrollbox(hostOrSelector = ".page-shell", target = document) {
  const host = typeof hostOrSelector === "string"
    ? target.querySelector(hostOrSelector)
    : hostOrSelector;

  if (!host || host.dataset.smoothScrollboxReady === "true") {
    return;
  }

  host.dataset.smoothScrollboxReady = "true";
  host.classList.add("smooth-scrollbox-host");

  const rail = document.createElement("div");
  rail.className = "smooth-scrollbox";

  const thumb = document.createElement("div");
  thumb.className = "smooth-scrollbox-thumb";

  rail.append(thumb);
  host.append(rail);

  let currentThumbHeight = 0;
  let activePointerId = null;
  let pointerOffsetY = 0;
  const railInset = 12;

  const setScrollFromPointer = (clientY) => {
    const clientHeight = host.clientHeight;
    const scrollHeight = host.scrollHeight;
    const maxScrollTop = Math.max(scrollHeight - clientHeight, 0);
    const hostRect = host.getBoundingClientRect();
    const railTop = hostRect.top + railInset;
    const railHeight = Math.max(host.clientHeight - railInset * 2, 0);
    const maxOffset = Math.max(railHeight - currentThumbHeight, 0);

    if (maxScrollTop <= 0 || maxOffset <= 0) {
      return;
    }

    const nextOffset = clamp(clientY - railTop - pointerOffsetY, 0, maxOffset);
    const progress = nextOffset / maxOffset;
    host.scrollTop = progress * maxScrollTop;
    updateThumb();
  };

  const stopDragging = () => {
    activePointerId = null;
    host.classList.remove("is-dragging-scrollbox");
  };

  let isUpdating = false;
  const updateThumb = () => {
    if (isUpdating) return;
    isUpdating = true;
    try {
      const clientHeight = host.clientHeight;
      const scrollHeight = host.scrollHeight;
      const maxScrollTop = Math.max(scrollHeight - clientHeight, 0);
      const railHeight = rail.clientHeight;
      const hasOverflow = scrollHeight > clientHeight + 1 && railHeight > 0;

      rail.style.transform = `translateY(${host.scrollTop}px)`;

      const currentHasOverflow = host.classList.contains("has-smooth-scrollbox");
      if (currentHasOverflow !== hasOverflow) {
        host.classList.toggle("has-smooth-scrollbox", hasOverflow);
      }

      if (!hasOverflow) {
        currentThumbHeight = 0;
        thumb.style.height = "0px";
        thumb.style.transform = "translateY(0px)";
        return;
      }

      const thumbHeight = Math.max((clientHeight / scrollHeight) * railHeight, 34);
      const maxOffset = Math.max(railHeight - thumbHeight, 0);
      const progress = maxScrollTop > 0 ? host.scrollTop / maxScrollTop : 0;
      const offset = progress * maxOffset;

      currentThumbHeight = thumbHeight;
      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translateY(${offset}px)`;
    } finally {
      isUpdating = false;
    }
  };

  const scheduleUpdate = scheduleAnimationFrame(updateThumb);
  const resizeObserver = new ResizeObserver(scheduleUpdate);
  const mutationObserver = new MutationObserver((mutations) => {
    const isSelfMutation = mutations.every((m) => {
      const target = m.target;
      return target === rail || target === thumb || (m.type === "attributes" && m.attributeName === "class" && target === host);
    });
    if (!isSelfMutation) {
      scheduleUpdate();
    }
  });

  resizeObserver.observe(host);

  Array.from(host.children).forEach((child) => {
    if (child !== rail) {
      resizeObserver.observe(child);
    }
  });

  mutationObserver.observe(host, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class", "hidden", "aria-hidden"]
  });

  host.addEventListener("scroll", () => {
    if (activePointerId !== null) {
      updateThumb();
      return;
    }

    scheduleUpdate();
  }, { passive: true });
  window.addEventListener("resize", scheduleUpdate);

  rail.addEventListener("pointerdown", (event) => {
    if (!host.classList.contains("has-smooth-scrollbox")) {
      return;
    }

    const thumbRect = thumb.getBoundingClientRect();
    const startedFromThumb = event.target === thumb || thumb.contains(event.target);

    activePointerId = event.pointerId;
    pointerOffsetY = startedFromThumb
      ? clamp(event.clientY - thumbRect.top, 0, currentThumbHeight)
      : currentThumbHeight * 0.5;

    host.classList.add("is-dragging-scrollbox");
    rail.setPointerCapture?.(event.pointerId);
    setScrollFromPointer(event.clientY);
    event.preventDefault();
  });

  rail.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    setScrollFromPointer(event.clientY);
    event.preventDefault();
  });

  rail.addEventListener("pointerup", (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    rail.releasePointerCapture?.(event.pointerId);
    stopDragging();
  });

  rail.addEventListener("pointercancel", (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    rail.releasePointerCapture?.(event.pointerId);
    stopDragging();
  });

  scheduleUpdate();
}
