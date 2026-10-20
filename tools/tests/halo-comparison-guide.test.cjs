const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const slug = 'control4-halo-remote-review';
const html = fs.readFileSync(path.join(root, 'blogs', slug, 'index.html'), 'utf8');
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test('Halo comparison preserves its URL, publication date and established deep links', () => {
  const url = 'https://denalitechs.com/blogs/' + slug + '/';
  assert.ok(html.includes('<link rel="canonical" href="' + url + '">'));
  assert.equal(schema.mainEntityOfPage, url);
  assert.equal(schema.datePublished, '2026-07-13');
  assert.equal(schema.dateModified, '2026-10-19');
  assert.match(html, /property="article:modified_time" content="2026-10-19"/);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['see-all-four-models-clearly', 'control4-remote-comparison-table', 'halo-touch-screen-when-you-want-it-buttons-when-you-do-not', 'halo-the-easier-transition-from-a-traditional-remote', 'neeo-and-sr-260-keep-or-upgrade', 'match-the-remote-to-the-room', 'halo-details']) {
    assert.ok(ids.includes(id), id);
  }
});

test('The four remotes retain individual reviews and distinct interface and wireless descriptions', () => {
  for (const review of ['control4-halo-touch-review', 'control4-halo-button-remote-review', 'control4-neeo-remote-review', 'control4-remote-review']) {
    assert.ok(html.includes('href="/blogs/' + review + '/"'));
  }
  assert.match(html, /2.8-inch <strong>non-touch<\/strong> display/);
  assert.match(html, /Halo and Halo Touch use 2.4 or 5 GHz Wi-Fi; NEEO uses 2.4 GHz Wi-Fi/);
  assert.match(html, /SR-260 uses Control4 Zigbee/);
  assert.match(html, /not stand-alone remotes that replace a controller/);
  assert.match(html, /does not make the rest of the system independent/);
});

test('Voice and software claims require the supported source and actual project rather than promising universal support', () => {
  assert.match(html, /supported Apple TV integration/);
  assert.match(html, /supported Xfinity integration/);
  assert.match(html, /not a promise that every TV, streaming app or smart-home voice command works/);
  assert.match(html, /OS 3.3.2 is the minimum listed/);
  assert.match(html, /not a recommendation to install an old release/);
  assert.match(html, /current software, remote firmware and supported source integrations/);
  assert.doesNotMatch(html, /Best one-handed option|Halo usually wins|strongest choice/);
});

test('SR-260 charging advice distinguishes supported rechargeable kits from AA cells and avoids runtime promises', () => {
  assert.match(html, /does not support rechargeable AA cells/);
  assert.match(html, /dedicated lithium-polymer battery\/cover and recharging station/);
  assert.match(html, /confirm the exact bundle/);
  assert.match(html, /Battery capacity is not a measured runtime comparison/);
  assert.match(html, /A working older remote may still be the right choice/);
  assert.match(html, /age alone is not a reason to replace it/);
});

test('Manufacturer originals, smaller display renditions and editorial artwork have honest provenance', () => {
  const dir = path.join(root, 'Video/Blogs imge/Control4 Remote Comparison');
  const record = JSON.parse(fs.readFileSync(path.join(dir, 'asset-sources.json'), 'utf8'));
  assert.equal(record.assets.length, 10);
  for (const asset of record.assets) {
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, asset.file))).digest('hex'), asset.sha256, asset.file);
    assert.ok(html.includes(asset.file));
    if (asset.role !== 'original') {
      assert.ok(html.includes('width="' + asset.dimensions[0] + '" height="' + asset.dimensions[1] + '"'));
    }
    assert.match(asset.sourceFile, /^https:\/\/(?:docs\.control4\.com|www\.snapav\.com|cdn\.prod\.website-files\.com)\//);
  }
  for (const original of record.assets.filter(a => a.role === 'original')) {
    assert.ok(html.includes('href="/Video/Blogs%20imge/Control4%20Remote%20Comparison/' + original.file + '"'));
    assert.ok(record.assets.some(a => a.originalFile === original.file && a.role === 'display'));
  }
  const legacy = record.retainedEditorialGraphic;
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, legacy.file))).digest('hex'), legacy.sha256);
  assert.match(legacy.notes, /not an unmodified manufacturer original/);
  assert.match(html, /Comparison artwork, not a size chart/);
  assert.match(html, /not Denali Tech installation photos/);
  assert.match(html, /not video playback on the remote or streaming subscriptions included/);
  assert.equal([...html.matchAll(/class="remote-photo"/g)].length, 4);
  assert.doesNotMatch(html, /object-fit:\s*cover/);
});

test('Comparison is keyboard reachable and narrow-screen details use labeled semantic rows', () => {
  assert.match(html, /href="#main-content"/);
  assert.match(html, /id="main-content" tabindex="-1"/);
  assert.match(html, /<details class="jump"><summary>/);
  assert.equal([...html.matchAll(/<details class="spec-details">/g)].length, 2);
  assert.match(html, /<table role="table">/);
  assert.match(html, /<th scope="col">/);
  assert.match(html, /<th scope="row">/);
  assert.match(html, /class="cell-label" aria-hidden="true">Battery and charging/);
  assert.doesNotMatch(html, /min-width:\s*1050px|blog-reader-tools\.js/);
});

test('Halo comparison thumbnail remains complete and cannot zoom-crop its labels on hover', () => {
  const hub = fs.readFileSync(path.join(root, 'blogs/index.html'), 'utf8');
  const rule = hub.match(/\.blog-card-image-link\[href="\/blogs\/control4-halo-remote-review\/"\] img\s*\{([^}]+)\}/);
  assert.ok(rule);
  assert.match(rule[1], /object-fit:\s*contain !important/);
  assert.match(rule[1], /transform:\s*none !important/);
});
