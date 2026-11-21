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
      ".dt-blog-reader-guide{margin:1.5rem 0;padding:0 1rem;color:#f8fafc;background:#102039;border:1px solid #3a4b62;border-radius:10px}",
      ".dt-blog-reader-guide *{box-sizing:border-box}",
      ".dt-blog-reader-guide>summary{cursor:pointer;min-height:48px;padding:.8rem 0;line-height:1.5;font-size:1rem;font-weight:700;color:#f8fafc}",
      ".dt-blog-reader-guide>summary::marker{color:#fdba74}",
      ".dt-blog-reader-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem .85rem;padding:.35rem 0}",
      ".dt-blog-reader-links a,.dt-blog-reader-action{display:flex;align-items:center;min-height:44px;padding:.55rem 0;color:#fdba74!important;text-decoration:underline!important;text-underline-offset:.18em;font-size:1rem;line-height:1.45;overflow-wrap:anywhere}",
      ".dt-blog-reader-guide>summary:focus-visible,.dt-blog-reader-guide a:focus-visible{outline:3px solid #fdba74;outline-offset:3px}",
      ".dt-blog-reader-action{border-top:1px solid #3a4b62;margin:.35rem 0 0}",
      ".dt-blog-reader-target{scroll-margin-top:96px}",
      "@media(max-width:760px){.dt-blog-reader-links{grid-template-columns:1fr}}"
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

    var guide = document.createElement("details");
    guide.className = "dt-blog-reader-guide";
    var title = document.createElement("summary");
    title.textContent = "Jump to a section";

    var links = document.createElement("nav");
    links.className = "dt-blog-reader-links";
    links.setAttribute("aria-label", "Article sections");
    headings.forEach(function (heading) {
      var link = document.createElement("a");
      link.href = window.location.href.split("#")[0] + "#" + encodeURIComponent(heading.id);
      link.textContent = heading.textContent.trim();
      links.appendChild(link);
    });

    var actionLink = document.createElement("a");
    actionLink.className = "dt-blog-reader-action";
    actionLink.href = "/contact/?source=blog-guide&guide=" + encodeURIComponent(path.split("/").filter(Boolean).pop()) + "#booking";
    actionLink.textContent = "Ask about this guide";

    guide.appendChild(title);
    guide.appendChild(links);
    guide.appendChild(actionLink);

    headings[0].parentNode.insertBefore(guide, headings[0]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
