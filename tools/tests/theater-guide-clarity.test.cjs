const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const article = fs.readFileSync(path.join(root, 'blogs/home-theater-installation-guide/index.html'), 'utf8');
const service = fs.readFileSync(path.join(root, 'home-theater-room/index.html'), 'utf8');

test('theater installation guide separates electrical work, agreed calibration, and support terms', () => {
  assert.match(article, /assign new outlets and other electrical work to the appropriately qualified electrical trade/);
  assert.match(article, /specify whether instrument-based video calibration is included/);
  assert.match(article, /Included support, service hours, and later charges belong in the written proposal or service agreement/);
  assert.doesNotMatch(article, /We install all components|calibrate everything for optimal performance|provide ongoing support:|delivers an good experience/);
  assert.doesNotMatch(article, /Prevents sound from disturbing|Rectangular rooms work best/);
  assert.match(article, /the result depends on the construction/);
  assert.equal((article.match(/<div class="cta-box">/g) || []).length, 1);
  assert.match(article, /"dateModified": "2026-11-04"/);
  assert.match(article, /<link rel="canonical" href="https:\/\/denalitechs.com\/blogs\/home-theater-installation-guide\/">/);
});

test('theater service page links naturally to the full installation guide without replacing specialist guides', () => {
  const guides = service.slice(service.indexOf('aria-labelledby="theater-guides-title"'), service.indexOf('<section class="section">', service.indexOf('aria-labelledby="theater-guides-title"')));
  assert.match(guides, /href="\/blogs\/home-theater-installation-guide\/">Home theater installation planning/);
  assert.match(guides, /href="\/blogs\/motorized-projector-screen-installation-guide\/"/);
  assert.match(guides, /href="\/blogs\/triad-powered-subwoofer-comparison\/"/);
  assert.match(guides, /href="\/blogs\/plex-media-server-build-guide\/"/);
  assert.equal((guides.match(/<article class="card">/g) || []).length, 6);
});
