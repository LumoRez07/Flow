/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { splitWords, estimateMinutes } from "../shared.js";
import { classifyImportFile, getFileNameFromPath, readImportedText } from "../core/file-parser.js";

const STORAGE_KEY = "flow_script_library";

export function createScriptManager({
  state,
  t,
  onLoadScript = () => {},
  onSaveCurrentScript = () => {},
  onToggleCollapse = () => {}
} = {}) {
  let containerElement = null;
  let searchFilter = "";
  let isSavingNew = false;
  let isCollapsed = true;
  let isImportMenuOpen = false;
  let feedbackToast = "";
  let fileInputEl = null;
  let folderInputEl = null;

  function getStoredScripts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function setStoredScripts(scripts) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
    } catch (error) {
      console.error("Failed to save scripts to localStorage:", error);
    }
  }

  async function handleImportFiles(files) {
    if (!files || files.length === 0) return;
    let importedCount = 0;
    const existingScripts = getStoredScripts();
    const existingTitles = new Set(existingScripts.map((s) => s.title.toLowerCase().trim()));

    for (const file of Array.from(files)) {
      const classification = classifyImportFile(file);
      if (classification === "unsupported") continue;

      try {
        const text = await readImportedText(file);
        if (!text || !text.trim()) continue;

        let baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "Imported Script";
        let candidateTitle = baseName;
        let counter = 2;
        while (existingTitles.has(candidateTitle.toLowerCase().trim())) {
          candidateTitle = `${baseName} (${counter++})`;
        }
        existingTitles.add(candidateTitle.toLowerCase().trim());

        saveScriptRecord(candidateTitle, text, { skipRender: true });
        importedCount++;
      } catch (err) {
        console.error("Failed to import script file:", file.name, err);
      }
    }

    if (importedCount > 0) {
      feedbackToast = t("modules.importedCount", { count: importedCount }) || `Imported ${importedCount} script(s)`;
      render();
      setTimeout(() => {
        feedbackToast = "";
        render();
      }, 3200);
    } else {
      feedbackToast = t("modules.noReadableFiles") || "No readable text files found";
      render();
      setTimeout(() => {
        feedbackToast = "";
        render();
      }, 3200);
    }
  }

  function normalizeSearchText(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, " ");
  }

  function matchesSearchQuery(script, query) {
    if (!query || !query.trim()) return true;
    const rawQuery = query.toLowerCase().trim();
    const tokens = rawQuery.split(/\s+/).filter(Boolean);
    if (!tokens.length) return true;

    const titleNorm = normalizeSearchText(script.title);
    const contentNorm = normalizeSearchText(script.content);
    const titleRaw = String(script.title || "").toLowerCase();
    const contentRaw = String(script.content || "").toLowerCase();

    return tokens.every((token) => {
      const cleanToken = normalizeSearchText(token).trim();
      return (
        titleRaw.includes(token) ||
        contentRaw.includes(token) ||
        (cleanToken && (titleNorm.includes(cleanToken) || contentNorm.includes(cleanToken)))
      );
    });
  }

  function formatReadingDuration(wordCount) {
    const speed = Math.max(60, Number(state.speed) || Number(state.scrollSpeed) || 160);
    const totalSeconds = Math.round((wordCount / speed) * 60);
    const minUnit = t("common.minutesShort") || "m";
    const secUnit = t("common.secondsShort") || "s";
    if (totalSeconds < 60) {
      return `~${totalSeconds}${secUnit}`;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (seconds > 0) {
      return `~${minutes}${minUnit} ${seconds}${secUnit}`;
    }
    return `~${minutes}${minUnit}`;
  }

  function saveScriptRecord(title, content, options = {}) {
    const trimmedTitle = String(title || "").trim() || t("modules.untitledScript");
    const scriptContent = String(content ?? state.script ?? "");
    const words = splitWords(scriptContent);
    const wordCount = words.length;
    const minutes = Math.max(1, Math.round(wordCount / Math.max(1, state.speed || 160)));

    const newRecord = {
      id: `script_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: trimmedTitle,
      content: scriptContent,
      wordCount,
      estimatedMinutes: minutes,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const scripts = getStoredScripts();
    scripts.unshift(newRecord);
    setStoredScripts(scripts);
    if (!options.skipRender) {
      render();
    }
    return newRecord;
  }

  function deleteScriptRecord(id) {
    const scripts = getStoredScripts().filter((s) => s.id !== id);
    setStoredScripts(scripts);
    render();
  }

  function loadScriptRecord(id) {
    const record = getStoredScripts().find((s) => s.id === id);
    if (record) {
      isCollapsed = true;
      try {
        localStorage.setItem("flow_script_manager_collapsed", "true");
      } catch {}
      onToggleCollapse(true);
      onLoadScript(record.content, record);
      render();
    }
  }

  function render() {
    if (!containerElement) return;

    containerElement.innerHTML = "";

    const scripts = getStoredScripts();
    const filtered = scripts.filter((s) => {
      if (!searchFilter) return true;
      const term = searchFilter.toLowerCase();
      return (
        s.title.toLowerCase().includes(term) ||
        s.content.toLowerCase().includes(term)
      );
    });

    // Hidden File & Folder Inputs for Importing
    if (!fileInputEl) {
      fileInputEl = document.createElement("input");
      fileInputEl.type = "file";
      fileInputEl.multiple = true;
      fileInputEl.accept = ".txt,.text,.md,.markdown,.csv,.tsv,.json,.xml,.html,.htm,.docx,.pdf";
      fileInputEl.style.display = "none";
      fileInputEl.addEventListener("change", () => {
        handleImportFiles(fileInputEl.files);
        fileInputEl.value = "";
      });
      document.body.appendChild(fileInputEl);
    }

    if (!folderInputEl) {
      folderInputEl = document.createElement("input");
      folderInputEl.type = "file";
      folderInputEl.webkitdirectory = true;
      folderInputEl.setAttribute("directory", "");
      folderInputEl.multiple = true;
      folderInputEl.style.display = "none";
      folderInputEl.addEventListener("change", () => {
        handleImportFiles(folderInputEl.files);
        folderInputEl.value = "";
      });
      document.body.appendChild(folderInputEl);
    }

    // Unified Morphing Card
    const card = document.createElement("div");
    card.className = `side-card script-manager-dock ${isCollapsed ? "is-collapsed" : "is-expanded"}`;

    // Drag-and-drop file import on dock
    card.addEventListener("dragenter", (e) => {
      e.preventDefault();
      card.classList.add("is-dragover");
    });
    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      card.classList.add("is-dragover");
    });
    card.addEventListener("dragleave", (e) => {
      if (!card.contains(e.relatedTarget)) {
        card.classList.remove("is-dragover");
      }
    });
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.classList.remove("is-dragover");
      if (e.dataTransfer?.files?.length) {
        handleImportFiles(e.dataTransfer.files);
      }
    });

    // ============================================
    // 1. Minimized Pill View
    // ============================================
    const pillView = document.createElement("div");
    pillView.className = "dock-pill-view";

    const expandBtn = document.createElement("button");
    expandBtn.type = "button";
    expandBtn.className = "dock-expand-handle-btn";
    expandBtn.title = t("modules.expandScriptManager") || "Expand Script Manager";
    expandBtn.setAttribute("aria-label", expandBtn.title);

    const caretIcon = document.createElement("i");
    caretIcon.className = "ph ph-caret-up";
    caretIcon.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "dock-expand-label";
    label.textContent = `${t("modules.scriptManager")} (${scripts.length})`;

    expandBtn.append(caretIcon, label);
    expandBtn.addEventListener("click", () => {
      console.log("[Flow Action] Click Expand Script Manager Pill -> Expanding Deck View");
      console.log("[Flow Transition] Script Manager Expanding -> Studio Deck View");
      isCollapsed = false;
      onToggleCollapse(false);
    });
    pillView.appendChild(expandBtn);
    card.appendChild(pillView);

    // ============================================
    // 2. Expanded Studio Deck View
    // ============================================
    const deckView = document.createElement("div");
    deckView.className = "dock-deck-view";

    // Header
    const header = document.createElement("div");
    header.className = "side-card-header dock-header";

    const headerLeft = document.createElement("div");
    headerLeft.className = "side-card-title-group";

    const icon = document.createElement("i");
    icon.className = "ph ph-folder-notch-open side-card-icon";
    icon.setAttribute("aria-hidden", "true");

    const title = document.createElement("span");
    title.className = "side-card-title";
    title.textContent = t("modules.scriptManager");

    const countBadge = document.createElement("span");
    countBadge.className = "side-card-badge";
    countBadge.textContent = String(scripts.length);

    headerLeft.append(icon, title, countBadge);

    const headerCenter = document.createElement("div");
    headerCenter.className = "dock-header-center";
    if (scripts.length > 0 && !isSavingNew) {
      const searchWrap = document.createElement("div");
      searchWrap.className = "dock-search-wrap";

      const searchIcon = document.createElement("i");
      searchIcon.className = "ph ph-magnifying-glass dock-search-icon";
      searchIcon.setAttribute("aria-hidden", "true");

      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.className = "dock-search-input";
      searchInput.placeholder = t("modules.searchScriptsPlaceholder");
      searchInput.value = searchFilter;

      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "dock-search-clear-btn";
      clearBtn.style.display = searchFilter ? "inline-flex" : "none";
      clearBtn.title = t("common.clear") || "Clear";
      clearBtn.innerHTML = `<i class="ph ph-x" aria-hidden="true"></i>`;
      clearBtn.addEventListener("click", () => {
        searchFilter = "";
        searchInput.value = "";
        clearBtn.style.display = "none";
        renderScriptList(deckView);
        searchInput.focus();
      });

      searchInput.addEventListener("input", (e) => {
        searchFilter = e.target.value;
        clearBtn.style.display = searchFilter ? "inline-flex" : "none";
        renderScriptList(deckView);
      });

      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          searchFilter = "";
          searchInput.value = "";
          clearBtn.style.display = "none";
          renderScriptList(deckView);
        }
      });

      searchWrap.append(searchIcon, searchInput, clearBtn);
      headerCenter.appendChild(searchWrap);
    }

    const headerActions = document.createElement("div");
    headerActions.className = "side-card-header-actions";

    const importWrap = document.createElement("div");
    importWrap.className = "dock-import-wrap";

    const importBtn = document.createElement("button");
    importBtn.type = "button";
    importBtn.className = "side-card-action-btn";
    importBtn.setAttribute("title", t("modules.importScripts") || "Import scripts or folder");
    importBtn.setAttribute("aria-label", importBtn.title);

    const importIcon = document.createElement("i");
    importIcon.className = "ph ph-upload-simple";
    importIcon.setAttribute("aria-hidden", "true");
    importBtn.appendChild(importIcon);

    importBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      isImportMenuOpen = !isImportMenuOpen;
      render();
    });

    importWrap.appendChild(importBtn);

    if (isImportMenuOpen) {
      const importMenu = document.createElement("div");
      importMenu.className = "dock-import-dropdown";

      const importFilesOption = document.createElement("button");
      importFilesOption.type = "button";
      importFilesOption.className = "dock-dropdown-item";
      importFilesOption.innerHTML = `<i class="ph ph-file-text"></i> <span>${t("modules.importFiles") || "Import Files"}</span>`;
      importFilesOption.addEventListener("click", (e) => {
        e.stopPropagation();
        isImportMenuOpen = false;
        render();
        fileInputEl?.click();
      });

      const importFolderOption = document.createElement("button");
      importFolderOption.type = "button";
      importFolderOption.className = "dock-dropdown-item";
      importFolderOption.innerHTML = `<i class="ph ph-folder-open"></i> <span>${t("modules.importFolder") || "Import Folder"}</span>`;
      importFolderOption.addEventListener("click", (e) => {
        e.stopPropagation();
        isImportMenuOpen = false;
        render();
        folderInputEl?.click();
      });

      importMenu.append(importFilesOption, importFolderOption);
      importWrap.appendChild(importMenu);
    }

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "side-card-action-btn";
    saveBtn.setAttribute("title", t("modules.saveCurrentScript"));
    saveBtn.setAttribute("aria-label", t("modules.saveCurrentScript"));

    const saveIcon = document.createElement("i");
    saveIcon.className = "ph ph-plus";
    saveIcon.setAttribute("aria-hidden", "true");
    saveBtn.appendChild(saveIcon);

    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      isSavingNew = !isSavingNew;
      isImportMenuOpen = false;
      render();
    });

    const collapseBtn = document.createElement("button");
    collapseBtn.type = "button";
    collapseBtn.className = "side-card-action-btn";
    collapseBtn.setAttribute("title", t("modules.collapseScriptManager") || "Collapse Script Manager");
    collapseBtn.setAttribute("aria-label", collapseBtn.title);

    const collapseIcon = document.createElement("i");
    collapseIcon.className = "ph ph-caret-down";
    collapseIcon.setAttribute("aria-hidden", "true");
    collapseBtn.appendChild(collapseIcon);

    collapseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      console.log("[Flow Action] Click Collapse Script Manager Deck -> Collapsing to Pill");
      console.log("[Flow Transition] Script Manager Collapsing -> Pill View");
      isCollapsed = true;
      isImportMenuOpen = false;
      onToggleCollapse(true);
    });

    headerActions.append(importWrap, saveBtn, collapseBtn);
    header.append(headerLeft, headerCenter, headerActions);
    deckView.appendChild(header);

    // Feedback Toast (e.g. "Imported 4 scripts")
    if (feedbackToast) {
      const toastEl = document.createElement("div");
      toastEl.className = "dock-feedback-toast";
      toastEl.innerHTML = `<i class="ph ph-check-circle"></i> <span>${feedbackToast}</span>`;
      deckView.appendChild(toastEl);
    }

    // Save view (when clicking +)
    if (isSavingNew) {
      const saveForm = document.createElement("form");
      saveForm.className = "side-card-save-view smooth-fade-in";

      const errorMsg = document.createElement("div");
      errorMsg.className = "side-card-error-msg hidden";

      const saveInput = document.createElement("input");
      saveInput.type = "text";
      saveInput.className = "side-card-input";
      saveInput.placeholder = t("modules.scriptNamePlaceholder") || "Enter script title...";
      saveInput.maxLength = 60;
      saveInput.required = true;

      saveInput.addEventListener("input", () => {
        errorMsg.classList.add("hidden");
        errorMsg.textContent = "";
      });

      saveInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          isSavingNew = false;
          render();
        }
      });

      saveForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = saveInput.value?.trim();
        if (!val) return;

        const isDuplicate = scripts.some(
          (s) => s.title.trim().toLowerCase() === val.toLowerCase()
        );

        if (isDuplicate) {
          errorMsg.textContent = t("modules.duplicateScriptError") || "A script with this title already exists.";
          errorMsg.classList.remove("hidden");
          saveInput.focus();
          return;
        }

        saveScriptRecord(val, state.script);
        isSavingNew = false;
        onSaveCurrentScript(val);
        render();
      });

      const saveActions = document.createElement("div");
      saveActions.className = "side-card-form-actions";

      const confirmBtn = document.createElement("button");
      confirmBtn.type = "submit";
      confirmBtn.className = "side-card-btn side-card-btn-primary";
      confirmBtn.textContent = t("common.save") || "Save";

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "side-card-btn side-card-btn-secondary";
      cancelBtn.textContent = t("common.cancel") || "Cancel";
      cancelBtn.addEventListener("click", () => {
        isSavingNew = false;
        render();
      });

      saveActions.append(confirmBtn, cancelBtn);
      saveForm.append(saveInput, errorMsg, saveActions);
      deckView.appendChild(saveForm);
      setTimeout(() => saveInput.focus(), 40);
    } else {
      renderScriptList(deckView);
    }

    card.appendChild(deckView);
    containerElement.appendChild(card);
  }

  function renderScriptList(deckView) {
    let list = deckView.querySelector(".dock-script-list");
    if (!list) {
      list = document.createElement("div");
      list.className = "dock-script-list custom-scrollbar";
      deckView.appendChild(list);
    }
    list.innerHTML = "";

    const scripts = getStoredScripts();
    const filtered = scripts.filter((s) => matchesSearchQuery(s, searchFilter));

    if (filtered.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "dock-script-empty";
      emptyState.textContent = scripts.length === 0
        ? t("modules.noSavedScripts")
        : t("modules.noScriptsMatch");
      list.appendChild(emptyState);
      return;
    }

    filtered.forEach((script) => {
      const row = document.createElement("div");
      row.className = "dock-script-row";

      const info = document.createElement("div");
      info.className = "dock-script-info";

      const rowTitle = document.createElement("div");
      rowTitle.className = "dock-script-title";
      rowTitle.dir = "auto";
      rowTitle.textContent = script.title;
      rowTitle.title = script.title;

      const meta = document.createElement("div");
      meta.className = "dock-script-meta";
      meta.dir = "auto";
      const wordsLabel = t("common.words") || "words";
      const duration = formatReadingDuration(script.wordCount);
      meta.textContent = t("modules.scriptMeta", {
        count: script.wordCount,
        words: wordsLabel,
        duration
      }) || `${script.wordCount} ${wordsLabel} · ${duration}`;

      info.append(rowTitle, meta);

      const actions = document.createElement("div");
      actions.className = "dock-script-actions";

      const loadBtn = document.createElement("button");
      loadBtn.type = "button";
      loadBtn.className = "dock-script-btn dock-script-load-btn";
      loadBtn.setAttribute("title", t("modules.loadScriptTooltip"));
      loadBtn.setAttribute("aria-label", t("modules.loadScriptTooltip"));

      const loadIcon = document.createElement("i");
      loadIcon.className = "ph ph-arrow-square-out";
      loadIcon.setAttribute("aria-hidden", "true");
      loadBtn.appendChild(loadIcon);

      loadBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log(`[Flow Action] Click Load Saved Script -> id=${script.id}, title="${script.title}"`);
        loadScriptRecord(script.id);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "dock-script-btn dock-script-delete-btn";
      deleteBtn.setAttribute("title", t("modules.deleteScriptTooltip"));
      deleteBtn.setAttribute("aria-label", t("modules.deleteScriptTooltip"));

      const deleteIcon = document.createElement("i");
      deleteIcon.className = "ph ph-trash";
      deleteIcon.setAttribute("aria-hidden", "true");
      deleteBtn.appendChild(deleteIcon);

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log(`[Flow Action] Click Delete Saved Script -> id=${script.id}, title="${script.title}"`);
        deleteScriptRecord(script.id);
      });

      actions.append(loadBtn, deleteBtn);
      row.append(info, actions);

      row.addEventListener("click", () => {
        console.log(`[Flow Action] Click Script Row -> id=${script.id}, title="${script.title}"`);
        loadScriptRecord(script.id);
      });

      list.appendChild(row);
    });
  }

  function updateCollapsedClass() {
    if (!containerElement) return false;
    const card = containerElement.querySelector(".script-manager-dock");
    if (!card) return false;
    card.classList.toggle("is-collapsed", isCollapsed);
    card.classList.toggle("is-expanded", !isCollapsed);
    return true;
  }

  function mount(element) {
    containerElement = element;
    render();
  }

  function toggle(visible) {
    if (containerElement) {
      containerElement.classList.toggle("hidden", !visible);
    }
    if (visible) {
      render();
    }
  }

  return {
    mount,
    render,
    toggle,
    saveScriptRecord,
    deleteScriptRecord,
    loadScriptRecord,
    getStoredScripts,
    getIsCollapsed: () => isCollapsed,
    setCollapsed: (collapsed, options = {}) => {
      isCollapsed = Boolean(collapsed);
      try {
        localStorage.setItem("flow_script_manager_collapsed", String(isCollapsed));
      } catch {}
      if (options.notify !== false) {
        onToggleCollapse(isCollapsed, options);
      }
      if (!updateCollapsedClass()) {
        render();
      }
    },
    collapse: (options = {}) => {
      isCollapsed = true;
      try {
        localStorage.setItem("flow_script_manager_collapsed", "true");
      } catch {}
      if (options.notify !== false) {
        onToggleCollapse(true, options);
      }
      if (!updateCollapsedClass()) {
        render();
      }
    },
    expand: (options = {}) => {
      isCollapsed = false;
      try {
        localStorage.setItem("flow_script_manager_collapsed", "false");
      } catch {}
      if (options.notify !== false) {
        onToggleCollapse(false, options);
      }
      if (!updateCollapsedClass()) {
        render();
      }
    }
  };
}
