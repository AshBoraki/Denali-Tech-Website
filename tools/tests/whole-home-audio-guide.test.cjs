const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const slug = 'whole-home-audio-sonos-vs-traditional';
const html = fs.readFileSync(path.join(root, 'blogs', slug, 'index.html'), 'utf8');
const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));

test('Audio guide retains search identity, publication and six established anchors', () => {
  const url = 'https://denalitechs.com/blogs/' + slug + '/';
  assert.ok(html.includes('<link rel="canonical" href="' + url + '">'));
  assert.match(html, /<title>Sonos Whole-House Audio vs a Wired System \| Denali Tech<\/title>/);
  const schema = schemas.find(s=>s['@type']==='BlogPosting');
  assert.equal(schema.datePublished, '2025-01-11T00:00:00+00:00');
  assert.equal(schema.dateModified, '2026-10-19');
  assert.equal(schema.mainEntityOfPage['@id'], url);
  assert.equal(schemas.find(s=>s['@type']==='BreadcrumbList').itemListElement[2].item, url);
  assert.equal(schema.wordCount, undefined);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const id of ['what-whole-home-audio-should-let-you-do', 'sonos-wireless-whole-home-audio', 'traditional-distributed-audio-in-wall-in-ceiling-systems', 'head-to-head-comparison-sonos-vs-traditional-audio', 'cost-comparison-build-the-same-zone-schedule', 'which-system-is-right-for-you']) assert.ok(ids.includes(id), id);
});

test('Audio comparison distinguishes a playback platform from speaker wiring and amplification', () => {
  assert.match(html, /Sonos can use freestanding speakers or power wired ceiling speakers/);
  assert.match(html, /Port does not power passive speakers directly/);
  assert.match(html, /Sonos specifies eight amplified outputs and four zones/);
  assert.match(html, /Eight channels do not mean eight independent music zones/);
  assert.match(html, /channel count is not the same as independent source count/);
  assert.match(html, /Mixing unrelated playback platforms does not automatically give synchronized/);
  assert.match(html, /Neither design guarantees better sound, lower cost/);
});

test('Network, TV, outdoor and control integration claims have explicit limits', () => {
  assert.match(html, /Wired speakers do not make streaming offline/);
  assert.match(html, /do not use its dedicated SonosNet wireless network/);
  assert.match(html, /group-audio delay when TV sound/);
  assert.match(html, /not a promise that every URC handheld remote/);
  assert.match(html, /current driver or module/);
  assert.match(html, /covered patio is not automatically a dry indoor environment/);
  assert.match(html, /amplifier's load requirements are checked/);
  assert.doesNotMatch(html, /Yes!|Best of Both Worlds|Easy - plug in|invisible speakers|No visible speakers cluttering/);
});

test('Audio photos retain whole-frame manufacturer provenance and smaller display versions', () => {
  const dir = path.join(root, 'Video/Blogs imge/Whole Home Audio Guide');
  const record = JSON.parse(fs.readFileSync(path.join(dir, 'asset-sources.json'), 'utf8'));
  assert.equal(record.assets.length, 6);
  assert.match(record.notes, /not an independent license grant/);
  for (const asset of record.assets) {
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, asset.file))).digest('hex'), asset.sha256);
    assert.ok(html.includes(asset.file));
    if (asset.role === 'original') {
      assert.match(asset.sourcePage, /^https:\/\/www\.sonos\.com\/en-us\/shop\//);
      assert.match(asset.sourceFile, /^https:\/\/media\.sonos\.com\/images\//);
      assert.ok(record.assets.some(a=>a.originalFile===asset.file));
    } else {
      assert.ok(html.includes('width="' + asset.dimensions[0] + '" height="' + asset.dimensions[1] + '"'));
    }
  }
  assert.match(html, /not a Denali Tech project/);
  assert.match(html, /not shown to scale/);
  assert.doesNotMatch(html, /object-fit:\s*cover/);
  assert.match(html, /figcaption strong\{display:block/);
});

test('Audio navigation and comparison reflow preserve keyboard and table semantics', () => {
  assert.match(html, /class="skip-link" href="#main-content"/);
  assert.match(html, /<main class="wrap" id="main-content" tabindex="-1">/);
  assert.doesNotMatch(html, /<base|blog-reader-tools\.js/);
  assert.match(html, /<details class="jump"><summary>/);
  assert.equal((html.match(/<details class="question">/g)||[]).length, 3);
  assert.match(html, /<table role="table"><caption>/);
  assert.match(html, /table,caption,tbody,tr,th,td\{display:block;width:100%\}/);
  assert.equal((html.match(/scope="col"/g)||[]).length, 3);
  assert.equal((html.match(/scope="row"/g)||[]).length, 6);
  assert.equal((html.match(/class="cell-label" aria-hidden="true"/g)||[]).length, 12);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /@view-transition\{navigation:none\}/);
});

test('Audio page keeps existing analytics paths and has one clear inquiry block', () => {
  for (const marker of ['GTM-MWPTRPDR','1475625250840344','/assets/js/microsoft-clarity.js','/assets/js/microsoft-uet.js']) assert.ok(html.includes(marker));
  assert.equal((html.match(/<section class="cta"/g)||[]).length, 1);
  assert.equal((html.match(/class="btn"/g)||[]).length, 1);
  for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (!m[1].includes('application/ld+json') && m[2].trim()) new vm.Script(m[2]);
  }
});

test('Audio catalog and hub use the same manufacturer scene without hover cropping', () => {
  const hub = fs.readFileSync(path.join(root, 'blogs/index.html'),'utf8');
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'blogs/blog-data.json'),'utf8'));
  const post = catalog.posts.find(p=>p.slug===slug);
  assert.match(post.heroImage, /sonos-architectural-living-room-display\.webp$/);
  assert.ok(hub.includes(post.heroImage.replaceAll(' ','%20')));
  const rule = hub.match(/\.blog-card-image-link\[href="\/blogs\/whole-home-audio-sonos-vs-traditional\/"\] img \{([^}]+)\}/)[1];
  assert.match(rule,/object-fit: contain !important/);
  assert.match(rule,/transform: none !important/);
});
