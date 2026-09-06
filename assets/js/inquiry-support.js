(function (w, d) {
  'use strict';
  if (w.denaliLeads) return;

  var memory = Object.create(null);
  var memoryOnly = Object.create(null);
  var attributionKey = 'denali_lead_attribution_v1';
  var emittedKey = 'denali_accepted_leads_v1';
  var formIds = ['booking-form', 'network-consultation-form'];
  var leadTypes = ['contact_form', 'network_consultation'];
  var events = ['form_start', 'form_validation_error', 'form_submit', 'form_submit_success', 'form_submit_failure', 'contact_intent'];
  var pending = new WeakMap();

  function read(area, key, fallback) {
    if (memoryOnly[key]) return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : fallback;
    try {
      var raw = w[area].getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch (error) { /* Storage is optional, including in private/restricted browsers. */ }
    return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : fallback;
  }

  function write(area, key, value) {
    memory[key] = value;
    try { w[area].setItem(key, JSON.stringify(value)); } catch (error) { memoryOnly[key] = true; }
  }

  function safeLabel(value) {
    if (typeof value !== 'string' || value.length > 100) return '';
    value = value.trim();
    // Attribution labels are not free text: discard contact details, URLs and long numbers.
    if (!/^[a-z][a-z0-9 _-]*$/i.test(value) || /\d{7}|(?:\d[ ()-]*){7}/.test(value)) return '';
    return value;
  }

  function safePath(value) {
    try {
      var url = new URL(value, w.location.origin);
      var path = decodeURIComponent(url.pathname);
      if (url.origin !== w.location.origin || !/^\/[a-z0-9/_.-]*$/i.test(path) || path.length > 180 || /\d{7}/.test(path)) return '';
      return path;
    } catch (error) { return ''; }
  }

  function sanitizeAttribution(value) {
    var clean = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return clean;
    ['source', 'guide', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (key) {
      var label = safeLabel(value[key]);
      if (label) clean[key] = label;
    });
    ['gclid', 'msclkid', 'fbclid'].forEach(function (key) {
      var id = value[key];
      if (typeof id === 'string' && /^[a-z0-9_-]{16,256}$/i.test(id)) clean[key] = id;
    });
    ['landing_page', 'referrer_path'].forEach(function (key) {
      var path = safePath(value[key] || '');
      if (value[key] && path) clean[key] = path;
    });
    if (typeof value.referrer_host === 'string' && /^[a-z0-9.-]{1,120}$/i.test(value.referrer_host) && !/\d{7}/.test(value.referrer_host)) {
      clean.referrer_host = value.referrer_host;
    }
    return clean;
  }

  function captureAttribution() {
    var previous = sanitizeAttribution(read('sessionStorage', attributionKey, {}));
    var params = new URLSearchParams(w.location.search);
    var current = {};
    ['source', 'guide', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'msclkid', 'fbclid'].forEach(function (key) {
      current[key] = params.get(key);
    });
    current = sanitizeAttribution(current);
    var attributedArrival = ['utm_source', 'utm_campaign', 'gclid', 'msclkid', 'fbclid'].some(function (key) { return !!current[key]; });
    if (!previous.landing_page || attributedArrival) previous.landing_page = safePath(w.location.href);
    if (!previous.referrer_host && d.referrer) {
      try {
        var referrer = new URL(d.referrer);
        previous.referrer_host = referrer.hostname;
        if (referrer.origin === w.location.origin) previous.referrer_path = safePath(referrer.href);
      } catch (error) { /* Ignore invalid referrers. */ }
    }
    var result = sanitizeAttribution(Object.assign(previous, current));
    write('sessionStorage', attributionKey, result);
    return result;
  }

  function safeDetails(details) {
    details = details || {};
    var result = {};
    if (formIds.indexOf(details.form_id) !== -1) result.form_id = details.form_id;
    if (leadTypes.indexOf(details.lead_type) !== -1) result.lead_type = details.lead_type;
    if (['whatsapp', 'email', 'phone', 'form'].indexOf(details.contact_method) !== -1) result.contact_method = details.contact_method;
    if (['validation', 'captcha', 'rate_limit', 'provider', 'network', 'timeout'].indexOf(details.reason) !== -1) result.reason = details.reason;
    return result;
  }

  function safely(fn) {
    try { fn(); } catch (error) { /* Analytics must never turn an accepted inquiry into an error. */ }
  }

  function production() {
    return /^(?:www\.)?denalitechs\.com$/i.test(w.location.hostname);
  }

  function track(event, details) {
    if (!production() || events.indexOf(event) === -1) return;
    var payload = safeDetails(details);
    safely(function () {
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push(Object.assign({ event: 'denali_' + event }, payload));
    });
    safely(function () { if (typeof w.clarity === 'function') w.clarity('event', event); });
  }

  function createSubmissionId() {
    if (w.crypto && typeof w.crypto.randomUUID === 'function') return w.crypto.randomUUID();
    return 'lead-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 14);
  }

  function accepted(id, details) {
    var emitted = read('sessionStorage', emittedKey, []);
    if (!Array.isArray(emitted)) emitted = [];
    if (emitted.indexOf(id) !== -1) return false;
    write('sessionStorage', emittedKey, emitted.concat(id).slice(-100));
    var payload = Object.assign(safeDetails(details), { submission_id: id });
    track('form_submit_success', details);
    if (!production()) return true;
    // One canonical GTM event, not both dataLayer and gtag for the same lead.
    safely(function () {
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push(Object.assign({ event: 'generate_lead' }, payload));
    });
    safely(function () {
      w.uetq = w.uetq || [];
      w.uetq.push('event', 'generate_lead', Object.assign({ event_category: 'lead' }, payload));
    });
    safely(function () {
      if (typeof w.fbq === 'function') w.fbq('track', 'Lead', payload, { eventID: id });
    });
    return true;
  }

  function createRateLimiter(options) {
    function history() {
      var list = read('localStorage', options.key, []);
      var now = Date.now();
      if (!Array.isArray(list)) list = [];
      return list.filter(function (time) { return typeof time === 'number' && time > now - options.windowMs && time <= now; });
    }
    return {
      check: function () {
        var list = history().sort(function (a, b) { return a - b; });
        write('localStorage', options.key, list);
        var waitMs = list.length ? Math.max(0, list[list.length - 1] + options.minIntervalMs - Date.now()) : 0;
        if (list.length >= options.max) waitMs = Math.max(waitMs, list[0] + options.windowMs - Date.now());
        return { allowed: waitMs <= 0, waitMs: waitMs };
      },
      record: function () { write('localStorage', options.key, history().concat(Date.now())); }
    };
  }

  async function sendSubmission(form, details) {
    var id = createSubmissionId();
    var body = new w.FormData(form);
    // Attribution is delivered with the inquiry only, never copied into analytics events.
    var attribution = captureAttribution();
    ['source', 'guide', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'msclkid', 'fbclid', 'landing_page', 'referrer', 'referrer_path', 'referrer_host'].forEach(function (key) {
      body.delete(key);
      if (attribution[key]) body.set(key, attribution[key]);
    });
    body.set('submission_id', id);
    var controller = typeof w.AbortController === 'function' ? new w.AbortController() : null;
    var timer = controller ? w.setTimeout(function () { controller.abort(); }, 20000) : null;
    track('form_submit', details);
    try {
      var response = await w.fetch(form.action, {
        method: 'POST', headers: { Accept: 'application/json' }, body: body,
        signal: controller ? controller.signal : undefined
      });
      var data = await response.json().catch(function () { return {}; });
      if (response.ok && data && data.success === true) {
        accepted(id, details);
        return { success: true, submission_id: id };
      }
      track('form_submit_failure', Object.assign({}, details, { reason: 'provider' }));
      return { success: false, message: 'We could not send your request. Please try again or message us on WhatsApp.' };
    } catch (error) {
      var timeout = error && error.name === 'AbortError';
      track('form_submit_failure', Object.assign({}, details, { reason: timeout ? 'timeout' : 'network' }));
      throw error;
    } finally {
      if (timer !== null) w.clearTimeout(timer);
    }
  }

  function submit(form, details) {
    if (pending.has(form)) return pending.get(form);
    var request = sendSubmission(form, details);
    pending.set(form, request);
    function clear() { pending.delete(form); }
    request.then(clear, clear);
    return request;
  }

  w.denaliLeads = {
    captureAttribution: captureAttribution,
    createRateLimiter: createRateLimiter,
    submit: submit,
    track: track
  };
  captureAttribution();
  d.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    try {
      var url = new URL(link.href, w.location.origin);
      var method = url.protocol === 'mailto:' ? 'email' : url.protocol === 'tel:' ? 'phone' : url.hostname === 'wa.me' ? 'whatsapp' : url.origin === w.location.origin && /^\/contact\/?$/.test(url.pathname) ? 'form' : '';
      if (method) track('contact_intent', { contact_method: method });
    } catch (error) { /* Ignore unsupported links. */ }
  });
})(window, document);
