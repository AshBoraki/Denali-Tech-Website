(function () {
  "use strict";

  var version = "20260602h";
  var whatsappHref = "https://wa.me/13124397500?text=Hi%20Denali%20Tech%2C%20I%20need%20a%20clear%20plan%20for%20my%20home%20technology.%20I%20can%20send%20photos.%20My%20home%20is%20in%3A";
  var whatsappCallHref = "https://wa.me/13124397500?text=Hi%20Denali%20Tech%2C%20I%20would%20rather%20use%20WhatsApp.%20Can%20you%20help%20me%20with%3A";

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
      document.body.classList.toggle("dt-site-menu-lock", !open);
    });

    links.addEventListener("click", function (event) {
      if (!event.target.closest("a")) return;
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation menu");
      header.classList.remove("dt-menu-open");
      document.body.classList.remove("dt-site-menu-lock");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation menu");
      header.classList.remove("dt-menu-open");
      document.body.classList.remove("dt-site-menu-lock");
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

  function appendSimpleLink(parent, label, href) {
    var a = makeElement("a", "", label);
    a.href = href;
    parent.appendChild(a);
  }

  function buildFooterLinkGroup(title, links) {
    var group = makeElement("div", "dt-site-footer-link-group");
    var heading = makeElement("h3", "", title);
    var list = makeElement("div", "dt-site-footer-link-list");

    links.forEach(function (item) {
      appendSimpleLink(list, item.label, item.href);
    });

    group.appendChild(heading);
    group.appendChild(list);
    return group;
  }

  function buildProofList(items) {
    var list = makeElement("ul", "dt-site-footer-proof-list");

    items.forEach(function (item) {
      var li = document.createElement("li");
      li.appendChild(makeElement("strong", "", item.title));
      li.appendChild(makeElement("span", "", item.copy));
      list.appendChild(li);
    });

    return list;
  }

  function buildFooter() {
    var footer = makeElement("footer", "dt-site-footer");
    footer.setAttribute("data-denali-chrome", "site-footer");

    var inner = makeElement("div", "dt-site-footer-inner");
    var close = makeElement("section", "dt-site-footer-close");
    close.setAttribute("aria-labelledby", "dt-footer-title");

    var closeCopy = makeElement("div", "dt-site-footer-close-copy");

    var logo = makeElement("a", "dt-site-footer-logo");
    logo.href = "/";
    logo.setAttribute("aria-label", "Denali Tech home");
    addLogoImage(logo);
    logo.appendChild(makeElement("span", "", "Denali Tech"));

    var kicker = makeElement("p", "dt-site-footer-kicker", "Chicago-area smart home, WiFi, AV, and control help");
    var title = makeElement("h2", "", "Fix the right thing first.");
    title.id = "dt-footer-title";
    var description = makeElement(
      "p",
      "dt-site-footer-lead",
      "Send the problem, photos, and city. We will help you find the practical next step before you buy more gear."
    );

    var actions = makeElement("div", "dt-site-footer-actions");
    var cta = makeElement("a", "dt-site-cta", "Send Project Details");
    cta.href = whatsappHref;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
    var call = makeElement("a", "dt-site-footer-secondary", "WhatsApp / Call");
    call.href = whatsappCallHref;
    call.target = "_blank";
    call.rel = "noopener noreferrer";
    actions.appendChild(cta);
    actions.appendChild(call);

    var proof = makeElement("aside", "dt-site-footer-proof");
    proof.appendChild(makeElement("h3", "", "Why homeowners call Denali Tech"));
    proof.appendChild(buildProofList([
      {
        title: "Clear diagnosis first",
        copy: "We look for the real failure before recommending equipment."
      },
      {
        title: "Clean installs",
        copy: "WiFi, theater, lighting, cameras, audio, shades, and control work built to be usable."
      },
      {
        title: "Local support",
        copy: "Mount Prospect based and serving Chicago-area homes."
      }
    ]));

    closeCopy.appendChild(logo);
    closeCopy.appendChild(kicker);
    closeCopy.appendChild(title);
    closeCopy.appendChild(description);
    closeCopy.appendChild(actions);
    close.appendChild(closeCopy);
    close.appendChild(proof);

    var linkBar = makeElement("nav", "dt-site-footer-linkbar");
    linkBar.setAttribute("aria-label", "Footer navigation");
    linkBar.appendChild(buildFooterLinkGroup("Fix", [
      { label: "Smart Home Control", href: "/smart-home-control/" },
      { label: "Home Theater", href: "/home-theater-room/" },
      { label: "WiFi & Networking", href: "/residential-wifi-network/" },
      { label: "Lighting & Shades", href: "/smart-lighting-shades/" }
    ]));
    linkBar.appendChild(buildFooterLinkGroup("Proof", [
      { label: "Projects", href: "/projects/" },
      { label: "About Us", href: "/about/" },
      { label: "Control4 Help", href: "/control4-installer-chicago/" },
      { label: "URC Programming", href: "/urc-programming-chicago/" }
    ]));
    linkBar.appendChild(buildFooterLinkGroup("Start", [
      { label: "Contact", href: "/contact/" },
      { label: "Blog", href: "/blogs/" },
      { label: "FAQ", href: "/faq.html" },
      { label: "Hub", href: "/hub/" }
    ]));

    var bottom = makeElement("div", "dt-site-footer-bottom");
    bottom.appendChild(makeElement("span", "", "Copyright " + new Date().getFullYear() + " Denali Tech Inc."));
    bottom.appendChild(makeElement("span", "", "Mount Prospect based. Serving Chicago and nearby suburbs."));
    var legal = makeElement("span", "");
    var privacy = makeElement("a", "", "Privacy & Terms");
    privacy.href = "/privacy/";
    legal.appendChild(privacy);
    bottom.appendChild(legal);

    inner.appendChild(close);
    inner.appendChild(linkBar);
    inner.appendChild(bottom);
    footer.appendChild(inner);
    return footer;
  }

  function setContactActionText(anchor, text) {
    var spans = Array.prototype.slice.call(anchor.querySelectorAll("span"));
    var target = spans.find(function (span) {
      return !span.classList.contains("phone-icon") && !span.classList.contains("copy-feedback");
    });

    if (target) {
      target.textContent = text;
      return;
    }

    anchor.textContent = text;
  }

  function upgradePhoneLinks() {
    document.querySelectorAll('a[href^="tel:+13124397500"], a[href^="tel:13124397500"]').forEach(function (anchor) {
      if (anchor.dataset.denaliKeepTel === "true") return;

      anchor.href = whatsappCallHref;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.classList.add("dt-whatsapp-upgraded");

      var ownText = anchor.textContent.replace(/\s+/g, " ").trim().toLowerCase();
      var parentText = anchor.parentElement ? anchor.parentElement.textContent.toLowerCase() : "";
      var isContactAction =
        anchor.classList.contains("call-now-button") ||
        anchor.classList.contains("phone-link") ||
        anchor.classList.contains("contact-item") ||
        ownText === "call now" ||
        parentText.indexOf("call") !== -1;

      if (isContactAction) setContactActionText(anchor, "WhatsApp / Call");
    });
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
    upgradePhoneLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
