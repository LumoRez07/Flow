const invoke = window.__TAURI__?.core?.invoke;
const openUrl = window.__TAURI__?.opener?.openUrl;

window.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#closeWindowButton")?.addEventListener("click", () => {
    invoke?.("hide_aux_window", { kind: "about" }).catch(console.error);
  });

  document.querySelector("#openSettingsButton")?.addEventListener("click", () => {
    invoke?.("open_aux_window", { kind: "settings" }).catch(console.error);
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    const url = new URL(href, window.location.href);
    if (!["https:", "http:"].includes(url.protocol)) return;

    event.preventDefault();
    openUrl?.(url.toString()).catch(console.error);
  });
});
