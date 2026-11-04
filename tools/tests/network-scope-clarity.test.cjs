const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.resolve(__dirname, '../../blogs/why-professional-network-setup-is-superior/index.html'), 'utf8');

test('network installation example is not presented as a fixed package for every customer', () => {
  assert.match(html, /one possible layout—not a fixed package for every home/);
  assert.match(html, /written proposal should identify the exact equipment, quantities, installation work, and exclusions/);
  assert.doesNotMatch(html, /this is exactly what you get|this is what you get|What's Included:/);
  assert.match(html, /<link rel="canonical" href="https:\/\/denalitechs.com\/blogs\/why-professional-network-setup-is-superior\/">/);
});

test('network support terms are conditional, with one quiet project CTA', () => {
  assert.match(html, /Remote monitoring and support apply only when included in the agreement/);
  assert.match(html, /required accounts, permissions, platform, and internet connection are available/);
  assert.match(html, /Written warranty coverage, support period, and later service rates/);
  assert.equal((html.match(/<div class="cta-box">/g) || []).length, 1);
  assert.match(html, /class="btn-primary">Send Network Details<\/a>/);
  assert.doesNotMatch(html, /Free Network Consultation|Transform Your Home Network Today|Ongoing support when you need it/);
  assert.match(html, /"dateModified": "2026-11-04"/);
  for (const source of ['https://www.snapav.com/shop/en/snapav/araknis', 'https://www.legrandav.com/products/luxul', 'https://cedia.org/en-au/smart-home-professionals/news/the-ultimate-smart-home-wiring-guide/']) assert.ok(html.includes(source));
});
