(() => {
  "use strict";

  if (window.__denaliSiteChromeNavReady) return;
  window.__denaliSiteChromeNavReady = true;

  const header = document.querySelector(".dt-site-header");
  const button = header?.querySelector(".dt-site-menu-button");
  const links = header?.querySelector("#dt-site-nav-links");

  if (!header || !button || !links) return;

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
})();
