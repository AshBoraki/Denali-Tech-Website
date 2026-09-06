(function (w, d) {
  'use strict';

  // Marketing pages only. Never expand tracking into previews, account tools or downloads.
  if (!/^(?:www\.)?denalitechs\.com$/i.test(w.location.hostname)) return;
  var path = w.location.pathname.replace(/\/index\.html$/i, '/');
  if (path !== '/' && !/\/$|\.html$/i.test(path)) path += '/';
  var publicPages = [
    '/', '/about/', '/brands/', '/contact/', '/projects/', '/faq.html', '/privacy/',
    '/editorial-policy/', '/home-theater-room/', '/residential-wifi-network/',
    '/control4-installer-chicago/', '/smart-home-control/', '/smart-lighting-shades/',
    '/security-cameras/', '/sonos-installer-chicago/', '/urc-programming-chicago/',
    '/video-distribution/', '/landing/network-consultation/', '/thank-you/'
  ];
  if (publicPages.indexOf(path) === -1 && !/^\/(?:blogs|services)\/(?:[a-z0-9-]+\/)?$/i.test(path)) return;
  if (w.denaliPublicAnalyticsScheduled) return;
  w.denaliPublicAnalyticsScheduled = true;

  var containerId = 'GTM-MWPTRPDR';
  var events = ['scroll', 'click', 'touchstart', 'keydown'];
  var started = false;

  function existingOwner() {
    // Legacy pages already schedule this exact site's container. Leave their timing intact.
    if (typeof w.loadGTM === 'function' && typeof w.gtmLoaded === 'boolean') return true;
    if (w.google_tag_manager && w.google_tag_manager[containerId]) return true;
    return Array.prototype.some.call(d.querySelectorAll('script[src]'), function (script) {
      try {
        var url = new URL(script.src, w.location.origin);
        return url.hostname === 'www.googletagmanager.com' && url.pathname === '/gtm.js' && url.searchParams.get('id') === containerId;
      } catch (error) { return false; }
    });
  }

  if (existingOwner()) return;

  function stopListening() {
    events.forEach(function (event) { d.removeEventListener(event, load); });
    w.removeEventListener('load', scheduleIdle);
  }

  function load() {
    if (started) return;
    started = true;
    stopListening();
    // Recheck ownership after the idle/interaction wait to avoid an initialization race.
    if (existingOwner()) return;
    try {
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      var script = d.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtm.js?id=' + containerId;
      d.head.appendChild(script);
    } catch (error) { /* Optional measurement must never interrupt the page or inquiry flow. */ }
  }

  function scheduleIdle() {
    if (started) return;
    if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(load, { timeout: 3000 });
    else w.setTimeout(load, 2000);
  }

  // No Clarity initialization here: pages own the existing direct Clarity loader.
  events.forEach(function (event) { d.addEventListener(event, load, { passive: true, once: true }); });
  if (d.readyState === 'complete') scheduleIdle();
  else w.addEventListener('load', scheduleIdle, { once: true });
})(window, document);
