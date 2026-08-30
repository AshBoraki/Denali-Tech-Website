(function(c, l, a, r, i, t, y) {
  // Keep local previews and development traffic out of production analytics.
  if (!/^(?:www\.)?denalitechs\.com$/i.test(c.location.hostname)) {
    return;
  }

  c[a] = c[a] || function() {
    (c[a].q = c[a].q || []).push(arguments);
  };
  t = l.createElement(r);
  t.async = 1;
  t.src = "https://www.clarity.ms/tag/" + i;
  y = l.getElementsByTagName(r)[0];
  y.parentNode.insertBefore(t, y);
})(window, document, "clarity", "script", "x2xgvr7dj9");
