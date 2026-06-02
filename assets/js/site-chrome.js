(function () {
  "use strict";

  var version = "20260602d";
  var whatsappHref = "https://wa.me/13124397500?text=Hi%20Denali%20Tech%2C%20I%20need%20a%20clear%20plan%20for%20my%20home%20technology.%20I%20can%20send%20photos.%20My%20home%20is%20in%3A";

  var navItems = [
    { label: "Home", href: "/" },
    { label: "What We Do", href: "/services/" },
    { label: "Projects", href: "/projects/" },
    { label: "About Us", href: "/about/" },
    { label: "Blog", href: "/blogs/" },
    { label: "Contact", href: "/contact/" }
  ];

  var footerGroups = [
    {
      title: "Solutions",
      links: [
        { label: "Smart Home Control", href: "/smart-home-control/" },
        { label: "Home Theater", href: "/home-theater-room/" },
        { label: "WiFi & Networking", href: "/residential-wifi-network/" },
        { label: "Security Cameras", href: "/security-cameras/" },
        { label: "Lighting & Shades", href: "/smart-lighting-shades/" },
        { label: "Video Distribution", href: "/video-distribution/" }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about/" },
        { label: "Our Projects", href: "/projects/" },
        { label: "Blog", href: "/blogs/" },
        { label: "FAQ", href: "/faq.html" },
        { label: "Contact", href: "/contact/" },
        { label: "Privacy", href: "/privacy/" }
      ]
    },
    {
      title: "Platforms",
      links: [
        { label: "Our Brands", href: "/brands/" },
        { label: "Control4 Help", href: "/control4-installer-chicago/" },
        { label: "URC Programming", href: "/urc-programming-chicago/" },
        { label: "Hub", href: "/hub/" }
      ]
    }
  ];

  function makeElement(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function normalizePath(pathname) {
    if (!pathname || pathname === "/index.html") return "/";
    return pathname.replace(/\/index\.html$/, "/");
  }

  function isCurrent(href) {
    var current = normalizePath(window.location.pathname);
    var target = normalizePath(new URL(href, window.location.origin).pathname);

    if (target === "/") return current === "/";
    return current === target || current.indexOf(target) === 0;
  }

  function addLogoImage(parent) {
    var picture = document.createElement("picture");
    var source = document.createElement("source");
    var img = document.createElement("img");

    source.srcset = "/Video/logo.webp?v=" + version;
    source.type = "image/webp";
    img.src = "/Video/logo.JPG?v=" + version;
    img.alt = "Denali Tech";
    img.width = 52;
    img.height = 38;
    img.decoding = "async";
    img.loading = "eager";

    picture.appendChild(source);
    picture.appendChild(img);
    parent.appendChild(picture);
  }

  function hideExistingChrome() {
    var selectors = [
      "body > header",
      "main > header",
      "header.top",
      ".header:not(.dt-site-header)",
      ".prestige-footer",
      ".footer:not(.dt-site-footer)",
      "body > footer",
      "main > footer"
    ];

    var seen = [];
    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (node) {
        if (node.matches("[data-denali-chrome]")) return;
        if (seen.indexOf(node) !== -1) return;
        seen.push(node);
        node.classList.add("dt-chrome-retired");
        node.setAttribute("aria-hidden", "true");
      });
    });
  }

  function buildHeader() {
    var header = makeElement("header", "dt-site-header");
    header.setAttribute("data-denali-chrome", "site-header");

    var nav = makeElement("nav", "dt-site-nav");
    nav.setAttribute("aria-label", "Main navigation");

    var brand = makeElement("a", "dt-site-brand");
    brand.href = "/";
    brand.setAttribute("aria-label", "Denali Tech home");
    addLogoImage(brand);
    brand.appendChild(makeElement("span", "", "Denali Tech"));

    var links = makeElement("ul", "dt-site-nav-links");
    links.id = "dt-site-nav-links";
    navItems.forEach(function (item) {
      var li = document.createElement("li");
      var a = makeElement("a", "", item.label);
      a.href = item.href;
      if (isCurrent(item.href)) a.setAttribute("aria-current", "page");
      li.appendChild(a);
      links.appendChild(li);
    });

    var mobileLi = document.createElement("li");
    var mobileCta = makeElement("a", "dt-site-mobile-cta", "Get a Project Plan");
    mobileCta.href = whatsappHref;
    mobileCta.target = "_blank";
    mobileCta.rel = "noopener noreferrer";
    mobileLi.appendChild(mobileCta);
    links.appendChild(mobileLi);

    var cta = makeElement("a", "dt-site-cta", "Get a Project Plan");
    cta.href = whatsappHref;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";

    var button = makeElement("button", "dt-site-menu-button");
    button.type = "button";
    button.setAttribute("aria-label", "Open navigation menu");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "dt-site-nav-links");
    button.appendChild(document.createElement("span"));

    button.addEventListener("click", function () {
      var open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      button.setAttribute("aria-label", open ? "Open navigation menu" : "Close navigation menu");
      header.classList.toggle("dt-menu-open", !open);
    });

    links.addEventListener("click", function (event) {
      if (!event.target.closest("a")) return;
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation menu");
      header.classList.remove("dt-menu-open");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation menu");
      header.classList.remove("dt-menu-open");
    });

    nav.appendChild(brand);
    nav.appendChild(links);
    nav.appendChild(cta);
    nav.appendChild(button);
    header.appendChild(nav);
    return header;
  }

  function appendFooterColumn(parent, group) {
    var column = makeElement("section", "dt-site-footer-column");
    var heading = makeElement("h2", "", group.title);
    var list = document.createElement("ul");

    group.links.forEach(function (item) {
      var li = document.createElement("li");
      var a = makeElement("a", "", item.label);
      a.href = item.href;
      li.appendChild(a);
      list.appendChild(li);
    });

    column.appendChild(heading);
    column.appendChild(list);
    parent.appendChild(column);
  }

  function buildFooter() {
    var footer = makeElement("footer", "dt-site-footer");
    footer.setAttribute("data-denali-chrome", "site-footer");

    var inner = makeElement("div", "dt-site-footer-inner");
    var grid = makeElement("div", "dt-site-footer-grid");
    var brandColumn = makeElement("section", "dt-site-footer-brand");

    var logo = makeElement("a", "dt-site-footer-logo");
    logo.href = "/";
    logo.setAttribute("aria-label", "Denali Tech home");
    addLogoImage(logo);
    logo.appendChild(makeElement("span", "", "Denali Tech"));

    var description = makeElement(
      "p",
      "",
      "Smart home, WiFi, theater, lighting, shades, cameras, audio, and control systems installed cleanly for Chicago-area homes."
    );

    var cta = makeElement("a", "dt-site-cta", "Send Project Details");
    cta.href = whatsappHref;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";

    brandColumn.appendChild(logo);
    brandColumn.appendChild(description);
    brandColumn.appendChild(cta);
    grid.appendChild(brandColumn);

    footerGroups.forEach(function (group) {
      appendFooterColumn(grid, group);
    });

    appendFooterColumn(grid, {
      title: "Contact",
      links: [
        { label: "(312) 439-7500", href: "tel:+13124397500" },
        { label: "ash@denalitechs.com", href: "mailto:ash@denalitechs.com" },
        { label: "LinkedIn", href: "https://www.linkedin.com/company/denali-tech-inc" },
        { label: "YouTube", href: "https://www.youtube.com/@denalitechav" }
      ]
    });

    var bottom = makeElement("div", "dt-site-footer-bottom");
    bottom.appendChild(makeElement("span", "", "Copyright " + new Date().getFullYear() + " Denali Tech Inc. Serving Chicago and nearby suburbs."));
    var legal = makeElement("span", "");
    var privacy = makeElement("a", "", "Privacy & Terms");
    privacy.href = "/privacy/";
    legal.appendChild(privacy);
    bottom.appendChild(legal);

    inner.appendChild(grid);
    inner.appendChild(bottom);
    footer.appendChild(inner);
    return footer;
  }

  function init() {
    if (document.body.dataset.denaliChromeReady === "true") return;
    document.body.dataset.denaliChromeReady = "true";
    document.body.classList.add("dt-unified-chrome", "light-theme");
    document.documentElement.setAttribute("data-theme", "light");

    hideExistingChrome();
    var header = buildHeader();
    var spacer = makeElement("div", "dt-site-header-spacer");
    spacer.setAttribute("aria-hidden", "true");
    spacer.setAttribute("data-denali-chrome", "site-header-spacer");
    document.body.insertBefore(header, document.body.firstChild);
    document.body.insertBefore(spacer, header.nextSibling);
    document.body.appendChild(buildFooter());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
