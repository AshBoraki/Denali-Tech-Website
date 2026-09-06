const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/inquiry-support.js'), 'utf8');
const details = { form_id: 'booking-form', lead_type: 'contact_form' };

function storage(seed = {}, denied = false) {
  const data = { ...seed };
  return {
    data,
    getItem(key) { if (denied) throw new Error('Storage denied'); return data[key] ?? null; },
    setItem(key, value) { if (denied) throw new Error('Storage denied'); data[key] = value; }
  };
}

function environment(options = {}) {
  const events = { document: {}, window: {} };
  const requests = [], meta = [], clarity = [], timers = new Map();
  let now = 1800000000000, serial = 0;
  const location = new URL(options.url || 'https://denalitechs.com/contact/');
  const sessionStorage = options.sessionStorage || storage({}, options.denied);
  const localStorage = options.localStorage || storage({}, options.denied);
  const document = {
    referrer: options.referrer || '', readyState: 'complete',
    addEventListener(name, fn) { (events.document[name] ||= []).push(fn); },
    removeEventListener() {},
    createElement() { return {}; },
    getElementsByTagName() { return [{ parentNode: { insertBefore() {} } }]; }
  };
  class FormData {
    constructor(form) { this.values = new Map(Object.entries(form.fields || {})); }
    set(key, value) { this.values.set(key, value); }
    delete(key) { this.values.delete(key); }
    get(key) { return this.values.get(key) ?? null; }
  }
  const window = {
    location, sessionStorage, localStorage, FormData, AbortController,
    crypto: { randomUUID: () => options.fixedId || `00000000-0000-4000-8000-${String(++serial).padStart(12, '0')}` },
    dataLayer: [], uetq: [],
    clarity: (...args) => clarity.push(args),
    fbq: (...args) => meta.push(args),
    addEventListener(name, fn) { (events.window[name] ||= []).push(fn); },
    setTimeout(fn) { const id = timers.size + 1; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch: async (url, request) => {
      requests.push({ url, request });
      if (options.fetch) return options.fetch(url, request);
      return { ok: true, json: async () => ({ success: true }) };
    }
  };
  const context = vm.createContext({
    window, document, URL, URLSearchParams,
    Date: { now: () => now },
    setTimeout: window.setTimeout,
    requestIdleCallback: fn => fn()
  });
  vm.runInContext(source, context);
  return {
    window, document, context, events, requests, meta, clarity, timers,
    api: window.denaliLeads,
    advance(ms) { now += ms; },
    form(fields = {}) { return { action: 'https://api.web3forms.com/submit', fields }; },
    leadEvents() { return window.dataLayer.filter(value => value.event === 'generate_lead'); }
  };
}

test('one accepted response emits one canonical lead per system with a submission identifier', async () => {
  const env = environment();
  const result = await env.api.submit(env.form({ name: 'Example Person', email: 'person@example.test' }), details);
  assert.equal(result.success, true);
  assert.equal(env.leadEvents().length, 1);
  assert.equal(env.window.uetq.filter(value => value === 'generate_lead').length, 1);
  assert.equal(env.meta.filter(value => value[1] === 'Lead').length, 1);
  assert.equal(env.meta[0][3].eventID, result.submission_id);
  assert.equal(env.requests[0].request.body.get('submission_id'), result.submission_id);
  assert.equal(env.requests[0].url, 'https://api.web3forms.com/submit');
  assert.equal(env.requests[0].request.headers.Accept, 'application/json');
  assert.ok(env.clarity.some(value => value[1] === 'form_submit_success'));
  assert.equal(env.timers.size, 0);
});

test('a double-click shares one in-flight request and one accepted lead', async () => {
  let release;
  const env = environment({ fetch: () => new Promise(resolve => { release = resolve; }) });
  const form = env.form();
  const first = env.api.submit(form, details);
  const second = env.api.submit(form, details);
  assert.equal(first, second);
  assert.equal(env.requests.length, 1);
  release({ ok: true, json: async () => ({ success: true }) });
  await Promise.all([first, second]);
  assert.equal(env.leadEvents().length, 1);
});

for (const scenario of [
  { name: 'HTTP failure despite a success-shaped body', response: { ok: false, json: async () => ({ success: true }) } },
  { name: 'provider rejection', response: { ok: true, json: async () => ({ success: false }) } },
  { name: 'invalid JSON', response: { ok: true, json: async () => { throw new Error('invalid JSON'); } } },
  { name: 'string success instead of boolean acceptance', response: { ok: true, json: async () => ({ success: 'true' }) } }
]) {
  test(`${scenario.name} produces failure, not a lead`, async () => {
    const env = environment({ fetch: async () => scenario.response });
    const result = await env.api.submit(env.form(), details);
    assert.equal(result.success, false);
    assert.equal(env.leadEvents().length, 0);
    assert.equal(env.meta.length, 0);
    assert.ok(env.clarity.some(value => value[1] === 'form_submit_failure'));
  });
}

test('network failure and timeout emit failure and release the pending request', async () => {
  const env = environment({ fetch: async () => { throw new TypeError('Failed to fetch'); } });
  const form = env.form();
  await assert.rejects(env.api.submit(form, details), /Failed to fetch/);
  await assert.rejects(env.api.submit(form, details), /Failed to fetch/);
  assert.equal(env.requests.length, 2);
  assert.equal(env.leadEvents().length, 0);
  assert.equal(env.timers.size, 0);

  const timeout = environment({ fetch: (url, request) => new Promise((resolve, reject) => {
    request.signal.addEventListener('abort', () => {
      const error = new Error('Aborted'); error.name = 'AbortError'; reject(error);
    });
  }) });
  const promise = timeout.api.submit(timeout.form(), details);
  timeout.timers.values().next().value();
  await assert.rejects(promise, { name: 'AbortError' });
  assert.equal(timeout.leadEvents().length, 0);
  assert.ok(timeout.window.dataLayer.some(value => value.reason === 'timeout'));
});

test('accepted response remains accepted when analytics integrations throw', async () => {
  const env = environment();
  env.window.dataLayer = { push() { throw new Error('Analytics unavailable'); } };
  env.window.uetq = { push() { throw new Error('Analytics unavailable'); } };
  env.window.clarity = () => { throw new Error('Analytics unavailable'); };
  env.window.fbq = () => { throw new Error('Analytics unavailable'); };
  assert.equal((await env.api.submit(env.form(), details)).success, true);
});

test('denied storage does not break submission and keeps same-page deduplication', async () => {
  const env = environment({ denied: true, fixedId: 'one-accepted-submission' });
  assert.equal((await env.api.submit(env.form(), details)).success, true);
  assert.equal((await env.api.submit(env.form(), details)).success, true);
  assert.equal(env.leadEvents().length, 1);
});

test('corrupt or wrong-shaped storage is discarded safely', async () => {
  const env = environment({
    sessionStorage: storage({ denali_lead_attribution_v1: '{broken', denali_accepted_leads_v1: '{}' }),
    localStorage: storage({ form_submission_history: '{broken' })
  });
  assert.equal((await env.api.submit(env.form(), details)).success, true);
  const limiter = env.api.createRateLimiter({ key: 'form_submission_history', max: 3, minIntervalMs: 5000, windowMs: 3600000 });
  assert.equal(limiter.check().allowed, true);
  limiter.record();
  assert.equal(limiter.check().allowed, false);
});

test('readable storage with denied writes still retains the current rate history in memory', () => {
  const localStorage = { getItem: () => '[]', setItem() { throw new Error('Quota exceeded'); } };
  const env = environment({ localStorage });
  const limiter = env.api.createRateLimiter({ key: 'form_submission_history', max: 3, minIntervalMs: 5000, windowMs: 3600000 });
  limiter.record();
  assert.equal(limiter.check().allowed, false);
});

for (const denied of [false, true]) {
  test(`three-per-hour rate history stays current (${denied ? 'denied storage' : 'normal storage'})`, () => {
    const env = environment({ denied });
    const limiter = env.api.createRateLimiter({ key: 'form_submission_history', max: 3, minIntervalMs: 5000, windowMs: 3600000 });
    for (let i = 0; i < 3; i += 1) {
      assert.equal(limiter.check().allowed, true);
      limiter.record();
      assert.equal(limiter.check().allowed, false);
      env.advance(6000);
    }
    assert.equal(limiter.check().allowed, false);
    if (!denied) assert.equal(JSON.parse(env.window.localStorage.getItem('form_submission_history')).length, 3);
    env.advance(3600000);
    assert.equal(limiter.check().allowed, true);
  });
}

test('safe campaign and guide attribution persists across pages into the inquiry only', async () => {
  const session = storage();
  environment({ sessionStorage: session, url: 'https://denalitechs.com/blogs/lutron-smart-lighting-guide/?utm_source=google&utm_campaign=lighting_fall&guide=lutron&gclid=abcdef0123456789abcdef', referrer: 'https://www.google.com/search?q=private+search' });
  const env = environment({ sessionStorage: session, url: 'https://denalitechs.com/contact/?source=site-navigation' });
  await env.api.submit(env.form({ email: 'private@example.test', phone: '3125551212', project_details: 'Private details' }), { ...details, email: 'private@example.test', source: 'private@example.test' });
  const body = env.requests[0].request.body;
  assert.equal(body.get('utm_campaign'), 'lighting_fall');
  assert.equal(body.get('guide'), 'lutron');
  assert.equal(body.get('landing_page'), '/blogs/lutron-smart-lighting-guide/');
  assert.equal(body.get('source'), 'site-navigation');
  assert.equal(body.get('referrer_host'), 'www.google.com');
  assert.equal(body.get('referrer'), null);
  assert.equal(body.get('email'), 'private@example.test');
  const analytics = JSON.stringify([env.window.dataLayer, env.window.uetq, env.meta, env.clarity]);
  for (const privateValue of ['private@example.test', '3125551212', 'Private details', 'lighting_fall', 'abcdef0123456789abcdef', 'private+search']) {
    assert.ok(!analytics.includes(privateValue), privateValue);
  }
});

test('email, phone, unsafe paths, raw referrers and unknown fields are not persisted as attribution', async () => {
  const env = environment({ url: 'https://denalitechs.com/contact/?source=person%40example.test&utm_campaign=call-312-555-1212&guide=https%3A%2F%2Fevil.test%2F&email=private%40example.test', referrer: 'https://example.com/path/person@example.test?token=secret' });
  const attribution = env.api.captureAttribution();
  assert.equal(attribution.source, undefined);
  assert.equal(attribution.utm_campaign, undefined);
  assert.equal(attribution.guide, undefined);
  assert.equal(attribution.email, undefined);
  assert.equal(attribution.landing_page, '/contact/');
  assert.equal(attribution.referrer_host, 'example.com');
  const form = env.form({ utm_source: 'person@example.test', referrer: 'https://secret.test/?email=person@example.test', landing_page: 'https://secret.test/?password=x' });
  await env.api.submit(form, details);
  assert.equal(env.requests[0].request.body.get('utm_source'), null);
  assert.equal(env.requests[0].request.body.get('referrer'), null);
  assert.equal(env.requests[0].request.body.get('landing_page'), '/contact/');
  assert.ok(!JSON.stringify(env.window.sessionStorage.data).includes('@'));
});

test('contact clicks are intent only and initialization does not duplicate listeners', () => {
  const env = environment();
  vm.runInContext(source, env.context);
  assert.equal(env.events.document.click.length, 1);
  for (const href of ['https://wa.me/13124397500?text=Private', 'mailto:private@example.test', 'tel:3125551212', '/contact/']) {
    env.events.document.click[0]({ target: { closest: () => ({ href }) } });
  }
  assert.equal(env.leadEvents().length, 0);
  assert.equal(env.window.dataLayer.filter(value => value.event === 'denali_contact_intent').length, 4);
  assert.ok(!JSON.stringify(env.window.dataLayer).includes('Private'));
});

test('local preview does not emit production analytics events', async () => {
  const env = environment({ url: 'http://localhost:8765/contact/' });
  env.api.track('form_start', details);
  await env.api.submit(env.form(), details);
  assert.equal(env.window.dataLayer.length, 0);
  assert.equal(env.window.uetq.length, 0);
  assert.equal(env.meta.length, 0);
  assert.equal(env.clarity.length, 0);
});

function inlineScripts(relative) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/src=|application\/ld\+json/i.test(match[1])).map(match => match[2]);
}

function namedFunction(relative, name) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  let start = html.indexOf('async function ' + name + '(');
  if (start === -1) start = html.indexOf('function ' + name + '(');
  assert.ok(start !== -1);
  const opening = html.indexOf('{', start);
  let depth = 1, end = opening + 1;
  while (depth > 0 && end < html.length) {
    if (html[end] === '{') depth += 1;
    if (html[end] === '}') depth -= 1;
    end += 1;
  }
  return html.slice(start, end);
}

function contactSubmitHandler() {
  const html = fs.readFileSync(path.join(root, 'contact/index.html'), 'utf8');
  const marker = "bookingForm.addEventListener('submit', ";
  const start = html.indexOf(marker) + marker.length;
  assert.ok(start >= marker.length);
  const end = html.indexOf('\n                });', start);
  assert.ok(end > start);
  return html.slice(start, end).trim() + '\n}';
}

for (const helperPresent of [true, false]) {
  test(`contact handler serializes two queued CAPTCHA waits (${helperPresent ? 'helper present' : 'helper missing'})`, async () => {
    let releaseResponse, captchaReady = false, recorded = 0;
    const env = environment({ denied: true, fetch: () => new Promise(resolve => { releaseResponse = resolve; }) });
    // A browser Location accepts relative href assignments; Node's URL does not.
    env.window.location = {
      href: env.window.location.href, origin: env.window.location.origin,
      hostname: env.window.location.hostname, search: env.window.location.search
    };
    if (!helperPresent) delete env.window.denaliLeads;
    const captchaWaits = [], messages = [], results = [];
    const buttonText = { textContent: 'Send Project Details' };
    const buttonLoader = { style: {} };
    const classes = new Set();
    const button = {
      disabled: false, style: {},
      classList: { add: value => classes.add(value), remove: value => classes.delete(value) },
      querySelector: selector => selector === '.btn-text' ? buttonText : buttonLoader
    };
    const form = Object.assign(env.form({ email: 'customer@example.test' }), {
      querySelectorAll: () => [],
      querySelector(selector) {
        if (selector === 'textarea[name="h-captcha-response"]') return captchaReady ? { value: 'offline-captcha-token' } : null;
        if (selector === 'button[type="submit"]') return button;
        return null;
      }
    });
    const messageDiv = {
      textContent: '', style: {},
      appendChild: node => messages.push(node.textContent),
      scrollIntoView() {}
    };
    env.document.createElement = () => ({ textContent: '', className: '' });
    const limiter = helperPresent ? env.api.createRateLimiter({ key: 'race-test-rate', max: 3, minIntervalMs: 5000, windowMs: 3600000 }) : null;
    Object.assign(env.context, {
      bookingForm: form, messageDiv, leadDetails: details, submissionInProgress: false,
      validateField: () => true,
      checkRateLimit: () => limiter ? limiter.check() : { allowed: true },
      recordSubmission() { recorded += 1; if (limiter) limiter.record(); },
      formAnalytics: { trackSubmission: result => results.push(result) },
      fetch: env.window.fetch, FormData: env.window.FormData, AbortController,
      clearTimeout: env.window.clearTimeout,
      setTimeout(fn, delay) {
        if (delay === 500) { captchaWaits.push(fn); return 0; }
        return env.window.setTimeout(fn, delay);
      }
    });
    vm.runInContext(namedFunction('contact/index.html', 'sendValidatedInquiry'), env.context);
    const handler = vm.runInContext('(' + contactSubmitHandler() + ')', env.context);
    const first = handler({ preventDefault() {} });
    const second = handler({ preventDefault() {} });
    assert.equal(captchaWaits.length, 2);
    assert.equal(env.requests.length, 0);
    captchaReady = true;
    captchaWaits.forEach(resolve => resolve());
    // Let both complete their CAPTCHA wait; keep the first network request pending.
    for (let step = 0; step < 4; step += 1) await Promise.resolve();
    assert.equal(env.requests.length, 1);
    assert.equal(recorded, 1);
    assert.equal(button.disabled, true);
    assert.deepEqual(messages, ['Processing your request...']);
    releaseResponse({ ok: true, json: async () => ({ success: true }) });
    await Promise.all([first, second]);
    assert.deepEqual(results, [true]);
    assert.equal(env.context.submissionInProgress, false);
    assert.equal(env.window.location.href, '/thank-you/');
    assert.equal(env.leadEvents().length, helperPresent ? 1 : 0);
  });
}

test('network landing cooldown works with denied, malformed, or future storage', () => {
  for (const localStorage of [storage({}, true), storage({ denali_wifi_last_submit: 'corrupt' }), storage({ denali_wifi_last_submit: '999999999999999' })]) {
    const env = environment({ localStorage });
    Object.assign(env.context, { localStorage, lastSuccessfulSubmitAt: 0, COOLDOWN_MS: 45000 });
    vm.runInContext(namedFunction('landing/network-consultation/index.html', 'canSubmitAgain'), env.context);
    vm.runInContext(namedFunction('landing/network-consultation/index.html', 'rememberSubmitTime'), env.context);
    assert.equal(env.context.canSubmitAgain(), true);
    env.context.rememberSubmitTime();
    assert.equal(env.context.canSubmitAgain(), false);
    env.advance(45000);
    assert.equal(env.context.canSubmitAgain(), true);
  }
});

for (const relative of ['contact/index.html', 'landing/network-consultation/index.html']) {
  test(`${relative} still sends a validated inquiry with optional support missing`, async () => {
    for (const accepted of [true, false]) {
      const env = environment({ denied: true, fetch: async () => ({ ok: accepted, json: async () => ({ success: true }) }) });
      delete env.window.denaliLeads;
      Object.assign(env.context, {
        fetch: env.window.fetch, FormData: env.window.FormData, AbortController,
        clearTimeout: env.window.clearTimeout
      });
      vm.runInContext(namedFunction(relative, 'sendValidatedInquiry'), env.context);
      const result = await env.context.sendValidatedInquiry(env.form({ email: 'customer@example.test' }));
      assert.equal(result.success, accepted);
      assert.equal(env.requests.length, 1);
      assert.equal(env.requests[0].url, 'https://api.web3forms.com/submit');
      assert.equal(env.requests[0].request.body.get('email'), 'customer@example.test');
      assert.equal(env.leadEvents().length, 0);
      assert.equal(env.timers.size, 0);
    }
  });
}

test('direct and repeated thank-you loads emit no conversion', () => {
  const sharedSession = storage();
  for (let visit = 0; visit < 2; visit += 1) {
    const env = environment({ url: 'https://denalitechs.com/thank-you/', sessionStorage: sharedSession });
    for (const script of inlineScripts('thank-you/index.html')) vm.runInContext(script, env.context);
    for (const callback of env.events.window.load || []) callback();
    assert.equal(env.leadEvents().length, 0);
    assert.equal(env.meta.filter(value => value[1] === 'Lead').length, 0);
    assert.equal(env.window.uetq.filter(value => value === 'generate_lead').length, 0);
  }
});

test('edited inline scripts parse; required email and delivery routing remain intact', () => {
  for (const relative of ['contact/index.html', 'landing/network-consultation/index.html', 'thank-you/index.html']) {
    for (const script of inlineScripts(relative)) assert.doesNotThrow(() => new vm.Script(script));
  }
  const contact = fs.readFileSync(path.join(root, 'contact/index.html'), 'utf8');
  assert.match(contact, /id="booking-email"[^>]*required/);
  assert.match(contact, /id="booking-form" action="https:\/\/api\.web3forms\.com\/submit"/);
  assert.match(contact, /window\.location\.href = '\/thank-you\/'/);
  const landing = fs.readFileSync(path.join(root, 'landing/network-consultation/index.html'), 'utf8');
  assert.match(landing, /href="#consultation-form">Describe Your Project<\/a>/);
  assert.ok(!landing.includes('>Send Photos</a>'));
});
