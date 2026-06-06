(function () {
  var meta = document.querySelector('meta[name="facebook-pixel-id"]');
  var pixelId = meta ? meta.getAttribute("content") : "";

  if (!pixelId) return;

  if (!window.fbq) {
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  }

  try {
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
  } catch (error) {
    /* no-op */
  }

  window.denaliMetaPixel = window.denaliMetaPixel || {};
  window.denaliMetaPixel.pixelId = pixelId;
  window.denaliMetaPixel.trackLeadOnce = function (details) {
    var now = Date.now();

    try {
      var key = "denali_meta_last_lead_at";
      var last = parseInt(sessionStorage.getItem(key) || "0", 10);
      if (last && now - last < 1800000) return false;
      sessionStorage.setItem(key, String(now));
    } catch (error) {
      /* no-op */
    }

    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead", details || {});
      return true;
    }

    return false;
  };
})();
