const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const slug = 'araknis-access-point-model-comparison';
const html = fs.readFileSync(path.join(root, 'blogs', slug, 'index.html'), 'utf8');
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test('Araknis review retains the public URL, original publication and established anchors', () => {
  const url = 'https://denalitechs.com/blogs/' + slug + '/';
  assert.ok(html.includes('<link rel="canonical" href="' + url + '">'));
  assert.equal(schema.mainEntityOfPage, url);
  assert.equal(schema.datePublished, '2026-07-11');
  assert.equal(schema.dateModified, '2026-10-19');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const id of ['models', 'all-current-choices-side-by-side', 'technical-comparison', 'what-wi-fi-7-changes-and-what-it-does-not', 'a-simple-way-to-compare-the-models', 'the-model-is-only-one-part-of-the-system']) {
    assert.ok(ids.includes(id), id);
  }
});

test('Wi-Fi 7 power limits are separated by exact model rather than generalized', () => {
  assert.match(html, /Both the 530 and 830 specify a 60W PoE\+\+ source for full operation/);
  assert.match(html, /On PoE\+, 2.4 and 6 GHz have a 50% transmit duty cycle; 5 GHz remains at 100%/);
  assert.match(html, /On PoE\+, the 6 GHz radio is disabled/);
  assert.match(html, /Ethernet port 1 to 2.5Gbps, and port 2 is disabled/);
  assert.match(html, /Two 10GbE Ethernet ports/);
  assert.match(html, /not a claim that the access point continuously consumes 60 watts/);
});

test('Outdoor power, mounting and source discrepancies are explained without weatherproof guarantees', () => {
  assert.match(html, /PoE\+ supports normal Wi-Fi with heater off, but not PoE-out/);
  assert.match(html, /with PoE\+ and the heater on, radio performance is limited/);
  assert.match(html, /up to 15.4W PoE-out/);
  assert.match(html, /vertical installation with ports facing down/);
  assert.match(html, /not mean it is submersible/);
  assert.match(html, /820 source discrepancy/);
  assert.match(html, /family comparison chart lists 60W PoE\+\+/);
  assert.match(html, /Confirm the supplied hardware revision/);
});

test('Customer guidance distinguishes client speed, infrastructure and conditional recommendations', () => {
  assert.match(html, /does not make a phone download at 10Gbps/);
  assert.match(html, /a 2×2 client does not become a 4×4 client/);
  assert.match(html, /Working Wi-Fi 6 already/);
  assert.match(html, /Keep it if it meets your needs/);
  assert.match(html, /rather than replacing its router/);
  assert.match(html, /not fixed room-size or coverage promises/);
  assert.doesNotMatch(html, /<blockquote|our everyday Wi.Fi 6 choice|premium high-density areas/);
});

test('All seven manufacturer images have reproducible provenance and retain full frames', () => {
  const dir = path.join(root, 'Video/Blogs imge/Araknis AP Comparison');
  const record = JSON.parse(fs.readFileSync(path.join(dir, 'asset-sources.json'), 'utf8'));
  assert.equal(record.assets.length, 7);
  for (const asset of record.assets) {
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, asset.file))).digest('hex'), asset.sha256, asset.file);
    assert.match(asset.sourceFile, /^https:\/\/www\.snapav\.com\//);
    assert.ok(html.includes(asset.file));
    assert.ok(html.includes('width="' + asset.dimensions[0] + '" height="' + asset.dimensions[1] + '"'));
    assert.match(asset.transformation, /lossless/);
  }
  assert.equal([...html.matchAll(/<img /g)].length, 7);
  assert.doesNotMatch(html, /object-fit:\s*cover|araknis-model-lineup-blue\.png/);
  assert.match(html, /not Denali Tech installation photographs/);
});

test('Article uses native optional detail, semantic tables and keyboard navigation', () => {
  assert.match(html, /<details class="jump"><summary>Jump to a section/);
  assert.equal([...html.matchAll(/<details class="spec-details">/g)].length, 2);
  assert.match(html, /href="#main-content"/);
  assert.match(html, /id="main-content" tabindex="-1"/);
  assert.match(html, /<th scope="col">/);
  assert.match(html, /<th scope="row">/);
  assert.match(html, /<table role="table">/);
  assert.match(html, /class="cell-label" aria-hidden="true">Wireless radios/);
  assert.match(html, /class="cell-label" aria-hidden="true">Full-operation source/);
  assert.doesNotMatch(html, /min-width:\s*900px|blog-reader-tools\.js/);
  for (const sku of ['320-ap-i', '520-ap-i', '820-ap-i', '530-ap-i', '830-ap-i', '520-ap-o']) {
    assert.ok(html.includes('https://www.snapav.com/shop/en/snapav/an-' + sku));
  }
});

test('Catalog and both hub thumbnails use the real manufacturer artwork', () => {
  const hub = fs.readFileSync(path.join(root, 'blogs/index.html'), 'utf8');
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'blogs/blog-data.json'), 'utf8'));
  const items = Array.isArray(catalog) ? catalog : Object.values(catalog).find(Array.isArray);
  assert.match(items.find(item => item.slug === slug).heroImage, /araknis-wifi7-manufacturer-banner\.webp$/);
  assert.equal([...hub.matchAll(/src="[^"]*araknis-wifi7-manufacturer-banner\.webp"/g)].length, 2);
  const rule = hub.match(/\.blog-card-image-link\[href="\/blogs\/araknis-access-point-model-comparison\/"\] img\s*\{([^}]+)\}/);
  assert.ok(rule);
  assert.match(rule[1], /object-fit:\s*contain !important/);
  assert.match(rule[1], /transform:\s*none !important/);
});
