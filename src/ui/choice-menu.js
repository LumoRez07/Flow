export function getChoiceTextDirection(text, fallback = document.body?.dataset.uiDirection || "ltr") {
  const normalizedText = String(text || "").trim();
  if (!normalizedText) {
    return fallback;
  }

  return fallback;
}

export function setChoiceTextContent(element, text, dir = getChoiceTextDirection(text)) {
  if (!element) {
    return;
  }

  const normalizedText = String(text || "").trim();
  element.textContent = "";
  element.dir = dir;

  if (!normalizedText) {
    return;
  }

  const ticker = document.createElement("span");
  ticker.className = "choice-ticker";
  ticker.dir = dir;

  const tickerText = document.createElement("span");
  tickerText.className = "choice-ticker-text";
  tickerText.textContent = normalizedText;

  ticker.append(tickerText);
  element.append(ticker);
}

export function refreshChoiceTickerOverflow(root) {
  if (!root) {
    return;
  }

  root.querySelectorAll(".choice-ticker").forEach((ticker) => {
    const tickerText = ticker.querySelector(".choice-ticker-text");
    if (!tickerText) {
      return;
    }

    const overflowDistance = Math.max(Math.ceil(tickerText.scrollWidth - ticker.clientWidth), 0);
    const hasOverflow = overflowDistance > 10;
    ticker.classList.toggle("is-overflowing", hasOverflow);

    if (!hasOverflow) {
      ticker.style.removeProperty("--choice-overflow-distance");
      ticker.style.removeProperty("--choice-overflow-duration");
      return;
    }

    ticker.style.setProperty("--choice-overflow-distance", `${overflowDistance}px`);
    ticker.style.setProperty("--choice-overflow-duration", `${Math.min(Math.max(overflowDistance / 28 + 4.2, 5.2), 11)}s`);
  });
}

export function queueChoiceTickerOverflowRefresh(...roots) {
  requestAnimationFrame(() => {
    roots.forEach((root) => refreshChoiceTickerOverflow(root));
  });
}

export function createChoiceLeadingElement(leading) {
  if (!leading?.kind) {
    return null;
  }

  if (leading.kind === "flag") {
    const flag = document.createElement("span");
    flag.className = "language-flag choice-leading";
    flag.dataset.flag = leading.flag;
    flag.setAttribute("aria-hidden", "true");
    flag.dataset.choiceLeading = "true";
    return flag;
  }

  const shell = document.createElement("span");
  shell.className = "choice-leading";
  shell.setAttribute("aria-hidden", "true");
  shell.dataset.choiceLeading = "true";

  if (leading.kind === "icon") {
    shell.classList.add("choice-leading-icon");
    shell.dataset.accent = leading.accent || "default";
    const icon = document.createElement("i");
    icon.className = `ph ${leading.icon || "ph-circle"}`;
    shell.append(icon);
    return shell;
  }

  if (leading.kind === "theme") {
    shell.classList.add("choice-swatch");
    shell.dataset.themeValue = leading.theme || "main";
    return shell;
  }

  if (leading.kind === "status") {
    shell.classList.add("choice-status-dot");
    shell.dataset.state = leading.state || "idle";
    const icon = document.createElement("i");
    icon.className = `ph ${leading.icon || "ph-waveform"}`;
    shell.append(icon);
    return shell;
  }

  return null;
}

export function replaceChoiceLeading(host, leading) {
  if (!host) {
    return;
  }

  host.querySelectorAll('[data-choice-leading="true"]').forEach((node) => node.remove());
  const leadingElement = createChoiceLeadingElement(leading);
  if (leadingElement) {
    host.prepend(leadingElement);
  }
}
