const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function buildNavigationForTest(legacyListener = false) {
  class Element {
    constructor(tag) {
      this.tagName = tag;
      this.children = [];
      this.attributes = {};
      this.listeners = {};
      const classes = new Set();
      this.classList = {
        add: name => classes.add(name),
        remove: name => classes.delete(name),
        contains: name => classes.has(name),
        toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name)
      };
    }
    appendChild(child) { this.children.push(child); }
    setAttribute(name, value) { this.attributes[name] = value; }
    getAttribute(name) { return this.attributes[name]; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
  }
  let breakpointListener;
  const query = { matches: true };
  query[legacyListener ? 'addListener' : 'addEventListener'] = (...args) => { breakpointListener = args.at(-1); };
  const document = {
    body: new Element('body'),
    createElement: tag => new Element(tag),
    addEventListener() {}
  };
  const source = read('assets/js/site-chrome.js');
  const functions = source.slice(source.indexOf('  function makeElement'), source.indexOf('  function appendFooterColumn'));
  const header = vm.runInNewContext(functions + '; buildHeader();', {
    document,
    window: { location: { pathname: '/', origin: 'https://denalitechs.com' }, matchMedia: () => query },
    URL,
    navItems: [],
    projectPlanHref: '/contact/?source=site-navigation#booking',
    version: 'test'
  });
  const button = header.children[0].children.at(-1);
  return { document, header, button, query, resize: () => breakpointListener() };
}

for (const legacyListener of [false, true]) {
  test(`navigation unlocks scrolling when an open mobile menu becomes desktop (${legacyListener ? 'legacy' : 'modern'} listener)`, () => {
    const nav = buildNavigationForTest(legacyListener);
    nav.button.listeners.click();
    assert.equal(nav.document.body.classList.contains('dt-site-menu-lock'), true);
    assert.equal(nav.header.classList.contains('dt-menu-open'), true);
    assert.equal(nav.button.getAttribute('aria-expanded'), 'true');
    nav.query.matches = false;
    nav.resize();
    assert.equal(nav.document.body.classList.contains('dt-site-menu-lock'), false);
    assert.equal(nav.header.classList.contains('dt-menu-open'), false);
    assert.equal(nav.button.getAttribute('aria-expanded'), 'false');
    assert.equal(nav.button.getAttribute('aria-label'), 'Open navigation menu');
    nav.query.matches = true;
    nav.resize();
    assert.equal(nav.document.body.classList.contains('dt-site-menu-lock'), false);
    assert.equal(nav.button.getAttribute('aria-expanded'), 'false');
    nav.button.listeners.click();
    assert.equal(nav.button.getAttribute('aria-expanded'), 'true');
  });
}

test('contact preference stays in natural keyboard order between location and service', () => {
  const html = read('contact/index.html');
  const location = html.indexOf('id="booking-location"');
  const preference = html.indexOf('id="booking-contact-preference"');
  const service = html.indexOf('id="booking-service"');
  assert.ok(location > 0 && location < preference && preference < service);
  assert.doesNotMatch(html, /formSteps\.forEach/);
  assert.doesNotMatch(html, /lastField\?\.addEventListener\('keydown'/);
});

test('network product visuals preserve the whole product rather than cover-cropping', () => {
  const html = read('residential-wifi-network/index.html');
  const imageStyle = html.match(/\.asset-strip img\s*\{([^}]+)\}/)?.[1];
  assert.match(imageStyle, /object-fit:\s*contain/);
  assert.match(imageStyle, /height:\s*auto/);
  assert.match(html, /arakhnis-network-overview-header\.png[^>]+width="1025" height="400"/);
  assert.match(html, /snapav-wattbox-800-ipvm-power-management\.jpg[^>]+width="1000" height="311"/);
});

test('projects content has one main landmark and keeps the modal outside it', () => {
  const html = read('projects/index.html');
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.equal((html.match(/<\/main>/g) || []).length, 1);
  assert.ok(html.indexOf('<main id="main-content">') < html.indexOf('<h1>Real Project Work</h1>'));
  assert.ok(html.indexOf('</main>') < html.indexOf('id="projectModal"'));
});

test('rack illustrations use existing high-resolution assets with accurate labels', () => {
  const binary = read('blogs/binary-video-distribution-hdmi-matrix-guide/index.html');
  const strong = read('blogs/strong-av-rack-mounting-guide/index.html');
  assert.match(binary, /strong-rack-cables-1100\.jpg[^>]+width="1100" height="733"/);
  assert.match(binary, /Cable-management example\./);
  assert.match(strong, /strong-fs-27u-hq-navy\.webp[^>]+alt="Strong FS 27U enclosed equipment rack"/);
});

test('620 power specification links to the exact model datasheet', () => {
  const html = read('blogs/araknis-network-switch-comparison/index.html');
  assert.match(html, /620-Series%20L3-Managed-Multi-Gigabit%20PoE_Switch-Data%20Sheets_092223\.pdf/);
  assert.match(html, /specifies 240W for the 8-port model and 720W for the 24-port model/);
});

test('shared orange CTA labels meet normal-text contrast at both gradient ends', () => {
  const css = read('assets/css/site-chrome.css');
  for (const selector of [/\.dt-site-cta\s*\{([^}]+)\}/, /\.dt-site-cta:focus-visible\s*\{([^}]+)\}/, /\.dt-site-nav-links \.dt-site-mobile-cta\s*\{([^}]*color:[^}]+)\}/]) {
    assert.match(css.match(selector)?.[1] || '', /color:\s*#111827\s*!important/);
  }
  const luminance = hex => {
    const [r, g, b] = hex.match(/../g).map(value => parseInt(value, 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return r * 0.2126 + g * 0.7152 + b * 0.0722;
  };
  const text = luminance('111827');
  for (const background of ['f97316', 'ea580c']) assert.ok((luminance(background) + 0.05) / (text + 0.05) >= 4.5);
});
