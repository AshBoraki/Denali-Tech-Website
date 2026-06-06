(() => {
  "use strict";

  if (window.__denaliSiteChromeNavReady) return;
  window.__denaliSiteChromeNavReady = true;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.denaliLeadTrack !== "function") {
    window.denaliLeadTrack = function(type, label) {
      try {
        window.dataLayer.push({
          event: "denali_lead_action",
          lead_type: type,
          lead_label: label || ""
        });
      } catch (error) {}
    };
  }

  const header = document.querySelector(".dt-site-header");
  const button = header?.querySelector(".dt-site-menu-button");
  const links = header?.querySelector("#dt-site-nav-links");

  if (header && button && links) {
    function closeMenu() {
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation menu");
      header.classList.remove("dt-menu-open");
      document.body.classList.remove("dt-site-menu-lock");
    }

    function openMenu() {
      button.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-label", "Close navigation menu");
      header.classList.add("dt-menu-open");
      document.body.classList.add("dt-site-menu-lock");
    }

    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeMenu();
        return;
      }
      openMenu();
    });

    links.addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  document.addEventListener("click", (event) => {
    const leadTarget = event.target.closest("[data-lead-action]");
    if (leadTarget) {
      window.denaliLeadTrack(
        leadTarget.getAttribute("data-lead-action"),
        (leadTarget.textContent || "").trim()
      );
    }

    const copyTarget = event.target.closest("[data-copy-link]");
    if (!copyTarget) return;

    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      window.alert("Link copied to clipboard!");
    }).catch(() => {});
  });
})();
