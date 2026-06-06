window.dataLayer = window.dataLayer || [];

(function () {
  var gtmLoaded = false;

  function loadGTM() {
    if (gtmLoaded) return;
    gtmLoaded = true;
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      var f = d.getElementsByTagName(s)[0];
      var j = d.createElement(s);
      var dl = l !== "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", "GTM-MWPTRPDR");
  }

  function scheduleLoad() {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(loadGTM, { timeout: 3000 });
    } else {
      setTimeout(loadGTM, 2000);
    }
  }

  function initGTM() {
    if (document.readyState === "complete") {
      scheduleLoad();
    } else {
      window.addEventListener("load", scheduleLoad, { once: true });
    }

    var interactionEvents = ["scroll", "click", "touchstart", "keydown"];
    var loadOnInteraction = function () {
      loadGTM();
      interactionEvents.forEach(function (eventName) {
        document.removeEventListener(eventName, loadOnInteraction, { passive: true });
      });
    };

    interactionEvents.forEach(function (eventName) {
      document.addEventListener(eventName, loadOnInteraction, { passive: true, once: true });
    });
  }

  initGTM();
})();
