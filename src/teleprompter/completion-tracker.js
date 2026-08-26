/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { extractScriptSections, splitWords } from "../shared.js";

export function createCompletionTracker({
  state,
  t,
  onJumpToSection = () => {}
} = {}) {
  let containerElement = null;
  let sections = [];
  let currentWordIndex = 0;
  let totalWordCount = 0;
  let activeSectionIndex = 0;

  let isUserManualScrolling = false;
  let userManualScrollTimer = null;

  function centerActiveMilestone(behavior = "smooth") {
    if (isUserManualScrolling || !containerElement) return;
    const list = containerElement.querySelector(".milestone-list");
    const activeItem = containerElement.querySelector(".milestone-item.is-active");
    if (list && activeItem) {
      const targetScroll = activeItem.offsetTop - (list.clientHeight / 2) + (activeItem.clientHeight / 2);
      list.scrollTo({ top: Math.max(0, targetScroll), behavior });
    }
  }

  function handleUserManualScroll() {
    if (!isUserManualScrolling) {
      console.log("[Flow Transition] Milestone Manual Scroll Engaged -> Auto-centering locked for 5 seconds");
    }
    isUserManualScrolling = true;
    if (userManualScrollTimer) {
      clearTimeout(userManualScrollTimer);
    }
    userManualScrollTimer = setTimeout(() => {
      isUserManualScrolling = false;
      userManualScrollTimer = null;
      console.log(`[Flow Transition] Milestone Manual Scroll Timer Expired -> Smoothly re-centering to Section #${activeSectionIndex + 1}`);
      centerActiveMilestone("smooth");
    }, 5000);
  }

  function refreshSections() {
    sections = extractScriptSections(state.script);
    const words = splitWords(state.script);
    totalWordCount = words.length;
    computeActiveSection();
    render();
    centerActiveMilestone("auto");
  }

  function computeActiveSection() {
    if (sections.length === 0) {
      activeSectionIndex = 0;
      return;
    }

    let found = 0;
    for (let i = 0; i < sections.length; i += 1) {
      if (currentWordIndex >= sections[i].wordOffset) {
        found = i;
      } else {
        break;
      }
    }
    if (found !== activeSectionIndex) {
      console.log(`[Flow Transition] Milestone Active Section Switched -> Section #${found + 1}: "${sections[found]?.title || ''}"`);
      activeSectionIndex = found;
      centerActiveMilestone("smooth");
    }
  }

  function computeSectionProgressPercent() {
    if (sections.length > 0) {
      const currentSection = sections[activeSectionIndex];
      const sectionStart = currentSection?.wordOffset ?? 0;
      const nextSection = sections[activeSectionIndex + 1];
      const sectionEnd = nextSection ? nextSection.wordOffset : totalWordCount;
      const sectionWordCount = Math.max(1, sectionEnd - sectionStart);
      const wordsIntoSection = Math.max(0, currentWordIndex - sectionStart);
      return Math.min(100, Math.max(0, Math.round((wordsIntoSection / sectionWordCount) * 100)));
    }

    return totalWordCount > 0
      ? Math.min(100, Math.max(0, Math.round((currentWordIndex / totalWordCount) * 100)))
      : 0;
  }

  function updateWordProgress(wordIndex, totalWords) {
    currentWordIndex = wordIndex;
    if (totalWords) totalWordCount = totalWords;
    const previousActive = activeSectionIndex;
    computeActiveSection();

    if (!containerElement) return;
    const list = containerElement.querySelector(".milestone-list");
    const items = containerElement.querySelectorAll(".milestone-item");
    if (!list || items.length !== sections.length) {
      render();
      centerActiveMilestone("auto");
      return;
    }

    const progressPercent = computeSectionProgressPercent();

    const fill = containerElement.querySelector(".completion-progress-fill");
    if (fill) {
      fill.style.width = `${progressPercent}%`;
    }

    const badge = containerElement.querySelector(".side-card-level-badge");
    if (badge) {
      badge.textContent = sections.length > 0
        ? `${activeSectionIndex + 1} / ${sections.length}`
        : `${progressPercent}%`;
    }

    items.forEach((item, idx) => {
      const isCompleted = idx < activeSectionIndex || (idx === sections.length - 1 && currentWordIndex >= totalWordCount && totalWordCount > 0);
      const isActive = idx === activeSectionIndex && !isCompleted;
      const isUpcoming = idx > activeSectionIndex;

      item.classList.toggle("is-completed", isCompleted);
      item.classList.toggle("is-active", isActive);
      item.classList.toggle("is-upcoming", isUpcoming);

      const node = item.querySelector(".milestone-node");
      if (node) {
        if (isCompleted) {
          if (!node.querySelector(".ph-check")) {
            node.innerHTML = '<i class="ph ph-check" aria-hidden="true"></i>';
          }
        } else {
          node.textContent = String(idx + 1);
        }
      }

      const meta = item.querySelector(".milestone-meta");
      if (meta) {
        meta.textContent = isCompleted
          ? t("modules.completed")
          : isActive
            ? t("modules.inProgress")
            : t("modules.upcoming");
      }
    });

    if (previousActive !== activeSectionIndex) {
      centerActiveMilestone("smooth");
    }
  }

  function render() {
    if (!containerElement) return;

    containerElement.innerHTML = "";

    const card = document.createElement("div");
    card.className = "side-card script-completion-card";

    // Progress Percentage Calculation
    const progressPercent = computeSectionProgressPercent();

    // Header
    const header = document.createElement("div");
    header.className = "side-card-header";

    const headerLeft = document.createElement("div");
    headerLeft.className = "side-card-title-group";

    const icon = document.createElement("i");
    icon.className = "ph ph-list-numbers side-card-icon";
    icon.setAttribute("aria-hidden", "true");

    const title = document.createElement("span");
    title.className = "side-card-title";
    title.textContent = t("modules.scriptCompletion");

    headerLeft.append(icon, title);

    const levelBadge = document.createElement("span");
    levelBadge.className = "side-card-badge side-card-level-badge";
    levelBadge.textContent = sections.length > 0
      ? `${activeSectionIndex + 1} / ${sections.length}`
      : `${progressPercent}%`;

    header.append(headerLeft, levelBadge);
    card.appendChild(header);

    // Progress Bar Track
    const progressBarWrap = document.createElement("div");
    progressBarWrap.className = "completion-progress-track";

    const progressBarFill = document.createElement("div");
    progressBarFill.className = "completion-progress-fill";
    progressBarFill.style.width = `${progressPercent}%`;

    progressBarWrap.appendChild(progressBarFill);
    card.appendChild(progressBarWrap);

    // Milestones List
    const list = document.createElement("div");
    list.className = "side-card-list milestone-list custom-scrollbar";

    if (sections.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "side-card-empty";
      emptyState.textContent = t("modules.noSectionsHint");
      list.appendChild(emptyState);
    } else {
      sections.forEach((sec, idx) => {
        const item = document.createElement("div");
        item.className = "milestone-item";

        const isCompleted = idx < activeSectionIndex;
        const isActive = idx === activeSectionIndex;
        const isUpcoming = idx > activeSectionIndex;

        if (isCompleted) item.classList.add("is-completed");
        if (isActive) item.classList.add("is-active");
        if (isUpcoming) item.classList.add("is-upcoming");

        // Milestone Node Indicator
        const node = document.createElement("div");
        node.className = "milestone-node";

        if (isCompleted) {
          const checkIcon = document.createElement("i");
          checkIcon.className = "ph ph-check";
          checkIcon.setAttribute("aria-hidden", "true");
          node.appendChild(checkIcon);
        } else {
          const levelNum = document.createElement("span");
          levelNum.className = "milestone-level-num";
          levelNum.textContent = String(idx + 1);
          node.appendChild(levelNum);
        }

        // Milestone Info
        const info = document.createElement("div");
        info.className = "milestone-info";

        const secTitle = document.createElement("div");
        secTitle.className = "milestone-title";
        secTitle.dir = "auto";
        secTitle.textContent = sec.title;

        const secMeta = document.createElement("div");
        secMeta.className = "milestone-meta";
        const statusSpan = document.createElement("span");
        statusSpan.textContent = isCompleted
          ? t("modules.completed")
          : isActive
            ? t("modules.inProgress")
            : t("modules.upcoming");
        secMeta.appendChild(statusSpan);

        if (sec.waitSeconds && sec.waitSeconds > 0) {
          const pauseBadge = document.createElement("span");
          pauseBadge.className = "milestone-pause-badge";
          const icon = document.createElement("i");
          icon.className = "ph ph-hourglass-high";
          icon.setAttribute("aria-hidden", "true");
          const text = document.createElement("span");
          text.textContent = `${sec.waitSeconds}s`;
          pauseBadge.append(icon, text);
          secMeta.appendChild(pauseBadge);
        }

        info.append(secTitle, secMeta);
        item.append(node, info);

        item.addEventListener("click", () => {
          onJumpToSection(sec);
        });

        list.appendChild(item);
      });
    }

    list.addEventListener("wheel", handleUserManualScroll, { passive: true });
    list.addEventListener("touchmove", handleUserManualScroll, { passive: true });
    list.addEventListener("pointerdown", handleUserManualScroll, { passive: true });

    card.appendChild(list);
    containerElement.appendChild(card);
  }

  function mount(element) {
    containerElement = element;
    refreshSections();
  }

  function toggle(visible) {
    if (containerElement) {
      containerElement.classList.toggle("hidden", !visible);
    }
    if (visible) {
      refreshSections();
    }
  }

  return {
    mount,
    render,
    toggle,
    refreshSections,
    updateWordProgress
  };
}
