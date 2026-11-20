const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('shared primary navigation stays focused and preserves the contact CTA', () => {
  const source = read('assets/js/site-chrome.js');
  const items = vm.runInNewContext(source.match(/var navItems = (\[[\s\S]*?\]);/)[1]);
  assert.equal(items.filter(item => item.href === '/planning/').length, 0);
  assert.equal(items.length, 6);
  for (const href of ['/', '/services/', '/projects/', '/about/', '/blogs/', '/contact/']) {
    assert.equal(items.filter(item => item.href === href).length, 1);
  }
  assert.match(source, /var projectPlanHref = "\/contact\/\?source=site-navigation#booking"/);
  assert.match(source, /mobileCta\.href = projectPlanHref/);
  assert.match(source, /cta\.href = projectPlanHref/);
});

test('planning remains in the footer without falsely activating a primary navigation item', () => {
  const source = read('assets/js/site-chrome.js');
  const footer = source.slice(source.indexOf('  function buildFooter()'), source.indexOf('  function init()'));
  assert.equal((footer.match(/href: "\/planning\/"/g) || []).length, 1);
  assert.match(footer, /\{ label: "Planning tools", href: "\/planning\/" \}/);
  const functions = source.slice(source.indexOf('  function normalizePath'), source.indexOf('  function addLogoImage'));
  const items = vm.runInNewContext(source.match(/var navItems = (\[[\s\S]*?\]);/)[1]);
  for (const pathname of ['/planning/', '/planning/prewire/', '/planning/cameras/index.html', '/planning/existing-system/']) {
    const context = { window: { location: { pathname, origin: 'https://denalitechs.com' } }, URL };
    const current = vm.runInNewContext(functions + '; isCurrent', context);
    assert.equal(items.filter(item => current(item.href)).length, 0);
    assert.equal(current('/planning/'), true);
  }
});

test('blog entry remains a crawlable link outside dynamic article filtering', () => {
  const html = read('blogs/index.html');
  const entry = html.match(/<p class="planning-entry">[\s\S]*?<\/p>/)?.[0];
  assert.ok(entry);
  assert.match(entry, /<a href="\/planning\/">Explore our free planning tools/);
  assert.ok(html.indexOf(entry) > html.indexOf('id="blogLoadMore"'));
  assert.match(html, /<div class="blog-resource-links">[\s\S]*?<p class="planning-entry">/);
});

test('shared header assets use the refreshed version on every tracked HTML page', () => {
  const files = cp.execFileSync('git', ['ls-files', '-z', '*.html'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  let count = 0;
  for (const file of files) {
    for (const match of read(file).matchAll(/(?:src|href)=["']([^"']*assets\/(?:js\/site-chrome\.js|css\/site-chrome\.css)[^"']*)["']/g)) {
      const version = match[1].includes('/js/') ? '20261119-compact-logo' : '20261119-contact';
      assert.ok(match[1].endsWith('?v=' + version), file + ': ' + match[1]);
      count++;
    }
  }
  assert.ok(count > 100, 'Verify the shared assets site-wide, not only the blog hub');
});

test('the navigation and its preloaded fallback use one lightweight logo asset', () => {
  const logo = '/Video/Denali-Tech-Logo-144.webp';
  const original = '/Video/Denali-Tech-Google-Logo-Final-Polished.png';
  const chrome = read('assets/js/site-chrome.js');
  const home = read('index.html');
  assert.ok(chrome.includes(`var navigationLogo = "${logo}"`));
  assert.match(chrome, /img\.src = navigationLogo/);
  assert.ok(home.includes(`rel="preload" href="${logo}" as="image" type="image/webp"`));
  assert.ok(home.includes(`<img src="${logo}"`));
  assert.ok(home.includes(`"logo": "https://denalitechs.com${original}"`));
  assert.ok(fs.statSync(path.join(root, logo.slice(1))).size < 20000);
});

test('the website contact journey no longer advertises WhatsApp', () => {
  const publicFiles = cp.execFileSync('git', [
    'ls-files', '-z', '*.html', 'assets/*.js', 'assets/*.css', '*.vcf', '*.xml', 'blogs/*.json', '.well-known/*.json',
  ], { cwd: root, encoding: 'utf8' }).split('\0').filter(file => file && !file.startsWith('tools/'));
  for (const file of publicFiles) {
    assert.doesNotMatch(read(file), /whatsapp|\bwa\.me\b/i, file);
  }
  const home = read('index.html');
  const footer = read('assets/js/site-chrome.js');
  assert.match(home, /href="\/contact\/\?source=homepage-hero#booking" class="btn-primary">Tell us about your project/);
  assert.match(home, /<div class="hero-contact-options"[^>]*>\s*<a href="tel:\+13124397500">Call \(312\) 439-7500/);
  assert.match(footer, /var phoneHref = "tel:\+13124397500"/);
  assert.match(footer, /call\.href = phoneHref/);
});
