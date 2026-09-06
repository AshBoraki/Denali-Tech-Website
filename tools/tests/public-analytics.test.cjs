const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const childProcess = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'assets/js/public-analytics.js'), 'utf8');
const container = 'GTM-MWPTRPDR';

function setup(options = {}) {
  const scripts = (options.scripts || []).map(src => ({ src }));
  const initialScriptCount = scripts.length;
  const queued = [];
  const listeners = { document: new Map(), window: new Map() };
  let clarityCalls = 0;
  function target(name) {
    return {
      addEventListener(event, callback) {
        const list = listeners[name].get(event) || [];
        list.push(callback); listeners[name].set(event, list);
      },
      removeEventListener(event, callback) {
        const list = listeners[name].get(event) || [];
        listeners[name].set(event, list.filter(value => value !== callback));
      }
    };
  }
  const window = Object.assign(target('window'), {
    location: new URL(options.url || 'https://denalitechs.com/services/'),
    dataLayer: options.dataLayer || [],
    clarity() { clarityCalls += 1; },
    setTimeout: fn => queued.push(fn)
  });
  if (options.idle !== false) window.requestIdleCallback = fn => queued.push(fn);
  if (options.legacy) {
    window.gtmLoaded = false;
    window.loadGTM = options.legacy;
  }
  if (options.runtime) window.google_tag_manager = { [container]: {} };
  const document = Object.assign(target('document'), {
    readyState: options.readyState || 'complete',
    querySelectorAll: () => scripts,
    createElement: () => ({}),
    head: {
      appendChild(script) {
        if (options.failInsert) throw new Error('Script blocked');
        scripts.push(script);
      }
    }
  });
  const context = vm.createContext({ window, document, URL, Date });
  vm.runInContext(source, context);
  return {
    window, document, scripts, queued, listeners, context,
    inserted() { return scripts.slice(initialScriptCount); },
    clarityCalls() { return clarityCalls; },
    emit(target, name) { for (const fn of [...(listeners[target].get(name) || [])]) fn(); },
    flush() { while (queued.length) queued.shift()(); }
  };
}

test('loads GTM once on a public production page, preserving queued inquiry events', () => {
  const event = { event: 'denali_contact_intent', contact_method: 'form' };
  const env = setup({ dataLayer: [event] });
  assert.equal(env.inserted().length, 0);
  env.flush();
  assert.equal(env.inserted().length, 1);
  assert.equal(env.inserted()[0].src, 'https://www.googletagmanager.com/gtm.js?id=' + container);
  assert.equal(env.inserted()[0].async, true);
  assert.equal(env.window.dataLayer[0], event);
  assert.equal(env.window.dataLayer.filter(value => value.event === 'gtm.js').length, 1);
  assert.equal(env.clarityCalls(), 0);
});

test('duplicate execution and overlapping idle/interaction/load callbacks cannot reload GTM', () => {
  const env = setup({ readyState: 'loading' });
  vm.runInContext(source, env.context);
  assert.equal(env.listeners.window.get('load').length, 1);
  env.emit('window', 'load');
  env.emit('document', 'click');
  env.emit('document', 'scroll');
  env.flush();
  vm.runInContext(source, env.context);
  assert.equal(env.inserted().length, 1);
  assert.equal(env.window.dataLayer.filter(value => value.event === 'gtm.js').length, 1);
  assert.equal(env.listeners.document.get('keydown').length, 0);
});

test('leaves an existing legacy page loader in charge without changing its timing', () => {
  let legacyCalls = 0;
  const env = setup({ legacy: () => { legacyCalls += 1; } });
  env.flush();
  env.emit('document', 'click');
  assert.equal(legacyCalls, 0);
  assert.equal(env.window.gtmLoaded, false);
  assert.equal(env.inserted().length, 0);
  assert.equal(env.window.dataLayer.length, 0);
});

test('recognizes an initialized container and an existing script with reordered parameters', () => {
  for (const options of [
    { runtime: true },
    { scripts: ['https://www.googletagmanager.com/gtm.js?l=dataLayer&id=' + container] }
  ]) {
    const env = setup(options);
    env.flush();
    assert.equal(env.inserted().length, 0);
    assert.equal(env.window.dataLayer.length, 0);
  }
});

test('ownership that appears during the idle wait wins without a second start event', () => {
  for (const claim of [
    env => { env.window.gtmLoaded = false; env.window.loadGTM = () => {}; },
    env => { env.scripts.push({ src: 'https://www.googletagmanager.com/gtm.js?id=' + container }); },
    env => { env.window.google_tag_manager = { [container]: {} }; }
  ]) {
    const env = setup();
    claim(env);
    const count = env.scripts.length;
    env.flush();
    assert.equal(env.scripts.length, count);
    assert.equal(env.window.dataLayer.length, 0);
  }
});

test('supports browsers without requestIdleCallback and survives an optional script failure', () => {
  const normal = setup({ idle: false });
  normal.flush();
  assert.equal(normal.inserted().length, 1);
  const blocked = setup({ failInsert: true });
  assert.doesNotThrow(() => blocked.flush());
  assert.equal(blocked.inserted().length, 0);
});

test('only the two public production hostnames are eligible', () => {
  for (const host of ['localhost:8765', '127.0.0.1:8765', 'denalitechs.github.io', 'staging.denalitechs.com', 'denalitechs.com.evil.test']) {
    const env = setup({ url: 'https://' + host + '/services/' });
    env.flush();
    assert.equal(env.inserted().length, 0, host);
    assert.equal(env.window.dataLayer.length, 0, host);
    assert.equal(env.window.denaliPublicAnalyticsScheduled, undefined, host);
  }
  const www = setup({ url: 'https://www.denalitechs.com/services/' });
  www.flush();
  assert.equal(www.inserted().length, 1);
});

test('missing-GTM marketing pages and their index.html variants are eligible', () => {
  const paths = [
    '/', '/index.html', '/services/', '/services/index.html', '/services/park-ridge-smart-home/',
    '/blogs/', '/blogs/what-is-control4-guide/', '/home-theater-room/',
    '/residential-wifi-network/', '/control4-installer-chicago/',
    '/landing/network-consultation/', '/landing/network-consultation/index.html',
    '/security-cameras', '/video-distribution/', '/privacy/', '/faq.html'
  ];
  for (const pathname of paths) {
    const env = setup({ url: 'https://denalitechs.com' + pathname });
    env.flush();
    assert.equal(env.inserted().length, 1, pathname);
  }
});

test('private, commerce, tools, downloads, unknown and nested routes stay excluded', () => {
  for (const pathname of [
    '/Net-tools/', '/Net-tools/buy/', '/net-tools/orders/private.json', '/tools/',
    '/admin/', '/admin/index.html', '/account/', '/company-hub/', '/business-profile/',
    '/hub/', '/downloads/', '/resources/network-tools/', '/wrap-design/',
    '/landing/private/', '/services/admin/settings/', '/blogs/private/account/', '/unknown/'
  ]) {
    const env = setup({ url: 'https://denalitechs.com' + pathname });
    env.flush();
    assert.equal(env.inserted().length, 0, pathname);
    assert.equal(env.window.denaliPublicAnalyticsScheduled, undefined, pathname);
  }
});

test('no URL values, campaign parameters, contact details or form events are emitted by bootstrap', () => {
  const env = setup({ url: 'https://denalitechs.com/services/?email=person%40example.test&phone=3125551212&utm_campaign=private' });
  env.flush();
  const payload = JSON.stringify(env.window.dataLayer);
  for (const value of ['person', '3125551212', 'utm_campaign', 'private', 'generate_lead', 'page_view']) assert.ok(!payload.includes(value), value);
  assert.deepEqual(Object.keys(env.window.dataLayer[0]).sort(), ['event', 'gtm.start']);
});

test('shared chrome and standalone landing load the helper, with existing inquiry support unchanged', () => {
  const chrome = fs.readFileSync(path.join(root, 'assets/js/site-chrome.js'), 'utf8');
  assert.match(chrome, /function loadPublicAnalytics\(\)/);
  assert.match(chrome, /loadPublicAnalytics\(\);/);
  assert.match(chrome, /\/assets\/js\/public-analytics\.js\?v=20260906/);
  const landing = fs.readFileSync(path.join(root, 'landing/network-consultation/index.html'), 'utf8');
  assert.match(landing, /src="\/assets\/js\/public-analytics\.js\?v=20260906" defer/);
  assert.match(landing, /src="\/assets\/js\/inquiry-support\.js\?v=20260905" defer/);
  assert.match(landing, /src="\/assets\/js\/microsoft-clarity\.js" defer/);
});

test('optional shared-chrome script insertion cannot throw into navigation initialization', () => {
  const chrome = fs.readFileSync(path.join(root, 'assets/js/site-chrome.js'), 'utf8').replace(/\r\n/g, '\n');
  const start = chrome.indexOf('function loadPublicAnalytics()');
  const end = chrome.indexOf('\n\n  var navItems', start);
  assert.ok(start >= 0 && end > start);
  const document = {
    querySelector: () => null,
    createElement: () => ({}),
    head: { appendChild() { throw new Error('Script insertion denied'); } }
  };
  const context = vm.createContext({ window: { location: new URL('https://denalitechs.com/services/') }, document });
  vm.runInContext(chrome.slice(start, end), context);
  assert.doesNotThrow(() => context.loadPublicAnalytics());
});

test('all existing GTM HTML pages retain direct Clarity after the duplicate container tag is paused', () => {
  const tracked = childProcess.execFileSync('git', ['ls-files', '*.html'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/);
  const missing = tracked.filter(file => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    return html.includes(container) && !html.includes('microsoft-clarity.js');
  });
  assert.deepEqual(missing, []);
});
