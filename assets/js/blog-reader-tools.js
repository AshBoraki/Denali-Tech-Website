(function () {
  "use strict";

  var path = window.location.pathname.replace(/\/index\.html$/, "/");
  if (!/^\/blogs\/[^/]+\/?$/.test(path)) return;

  function slugify(value) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "guide-section";
  }

  function addStyles() {
    if (document.getElementById("dt-blog-reader-tools-styles")) return;

    var style = document.createElement("style");
    style.id = "dt-blog-reader-tools-styles";
    style.textContent = [
      ".dt-blog-reader-guide{margin:clamp(1.4rem,3vw,2.4rem) 0;padding:clamp(1.15rem,2.7vw,1.7rem);display:grid;grid-template-columns:minmax(0,1.35fr) minmax(240px,.65fr);gap:clamp(1rem,2.5vw,1.6rem);color:#f8fafc;background:linear-gradient(135deg,#071525 0%,#102a46 100%);border:1px solid rgba(148,163,184,.3);border-top:3px solid #f97316;border-radius:16px;box-shadow:0 18px 45px rgba(2,8,23,.18)}",
      ".dt-blog-reader-guide *{box-sizing:border-box}",
      ".dt-blog-reader-guide h2{margin:0 0 .35rem!important;color:#fff!important;font-size:clamp(1.25rem,2.4vw,1.55rem)!important;line-height:1.2!important}",
      ".dt-blog-reader-guide p{margin:0;color:#cbd5e1!important;font-size:.96rem;line-height:1.55}",
      ".dt-blog-reader-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem;margin-top:1rem}",
      ".dt-blog-reader-links a{display:flex;align-items:center;min-height:44px;padding:.65rem .78rem;color:#f8fafc!important;background:rgba(255,255,255,.065);border:1px solid rgba(255,255,255,.16);border-radius:9px;text-decoration:none!important;font-size:.88rem;font-weight:700;line-height:1.3;transition:border-color .2s ease,background .2s ease,transform .2s ease}",
      ".dt-blog-reader-links a:hover{border-color:#fb923c;background:rgba(249,115,22,.16);transform:translateY(-1px)}",
      ".dt-blog-reader-links a:focus-visible,.dt-blog-reader-action a:focus-visible{outline:3px solid #fdba74;outline-offset:3px}",
      ".dt-blog-reader-action{display:flex;flex-direction:column;justify-content:center;padding:1rem;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.14);border-radius:12px}",
      ".dt-blog-reader-action strong{display:block;margin:0 0 .3rem;color:#fff;font-size:1rem}",
      ".dt-blog-reader-action span{display:block;color:#cbd5e1;font-size:.9rem;line-height:1.45}",
      ".dt-blog-reader-action a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;margin-top:.9rem;padding:.7rem .95rem;color:#fff!important;background:#c2410c;border:1px solid #ea580c;border-radius:9px;text-decoration:none!important;font-size:.9rem;font-weight:800;text-align:center}",
      ".dt-blog-reader-action a:hover{background:#9a3412}",
      ".dt-blog-reader-target{scroll-margin-top:96px}",
      "@media(max-width:760px){.dt-blog-reader-guide{grid-template-columns:1fr;margin:1.2rem 0;padding:1rem}.dt-blog-reader-links{grid-template-columns:1fr}.dt-blog-reader-action{padding:.9rem}.dt-blog-reader-action a{width:100%}}",
      "@media(prefers-reduced-motion:reduce){.dt-blog-reader-links a{transition:none}.dt-blog-reader-links a:hover{transform:none}}"
    ].join("");
    document.head.appendChild(style);
  }

  function getArticleHeadings(main) {
    return Array.prototype.slice.call(main.querySelectorAll("h2")).filter(function (heading) {
      var text = heading.textContent.trim();
      if (!text) return false;
      if (heading.closest(".cta, .related, .references, footer, nav, [data-denali-chrome]")) return false;
      return !/^(related|official references|sources|references|want to|ready to|need help)/i.test(text);
    }).slice(0, 6);
  }

  function uniqueId(base) {
    var candidate = base;
    var number = 2;
    while (document.getElementById(candidate)) {
      candidate = base + "-" + number;
      number += 1;
    }
    return candidate;
  }

  function init() {
    if (document.querySelector(".dt-blog-reader-guide")) return;

    var main = document.querySelector("main");
    if (!main) return;

    var headings = getArticleHeadings(main);
    if (headings.length < 2) return;

    addStyles();

    headings.forEach(function (heading) {
      if (!heading.id) heading.id = uniqueId(slugify(heading.textContent));
      heading.classList.add("dt-blog-reader-target");
    });

    var guide = document.createElement("aside");
    guide.className = "dt-blog-reader-guide";
    guide.setAttribute("aria-labelledby", "dt-blog-reader-title");

    var content = document.createElement("div");
    var title = document.createElement("h2");
    title.id = "dt-blog-reader-title";
    title.textContent = "In this guide";
    var description = document.createElement("p");
    description.textContent = "Jump directly to the part that matches your project.";

    var links = document.createElement("nav");
    links.className = "dt-blog-reader-links";
    links.setAttribute("aria-label", "Article sections");
    headings.forEach(function (heading) {
      var link = document.createElement("a");
      link.href = "#" + heading.id;
      link.textContent = heading.textContent.trim();
      links.appendChild(link);
    });

    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(links);

    var action = document.createElement("div");
    action.className = "dt-blog-reader-action";
    var actionTitle = document.createElement("strong");
    actionTitle.textContent = "Planning this for your home?";
    var actionCopy = document.createElement("span");
    actionCopy.textContent = "Send a room photo or model number. We can help you identify the practical next step.";
    var actionLink = document.createElement("a");
    actionLink.href = "/contact/?source=blog-guide&guide=" + encodeURIComponent(path.split("/").filter(Boolean).pop()) + "#booking";
    actionLink.textContent = "Ask about this guide";

    action.appendChild(actionTitle);
    action.appendChild(actionCopy);
    action.appendChild(actionLink);
    guide.appendChild(content);
    guide.appendChild(action);

    headings[0].parentNode.insertBefore(guide, headings[0]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
