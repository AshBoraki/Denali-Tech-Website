const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const slug = 'control4-smart-lock-access-control-guide';
const html = fs.readFileSync(path.join(root, 'blogs', slug, 'index.html'), 'utf8');
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test('smart-lock review preserves the public URL, original publication and six established section anchors', () => {
  const canonical = 'https://denalitechs.com/blogs/' + slug + '/';
  assert.ok(html.includes('<link rel="canonical" href="' + canonical + '">'));
  assert.equal(schema.mainEntityOfPage, canonical);
  assert.equal(schema.datePublished, '2026-07-13');
  assert.equal(schema.dateModified, '2026-10-19');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of [
    'three-residential-lock-families-control4-highlights',
    'side-by-side-comparison',
    'locked-and-closed-are-different-facts',
    'small-sensors-make-the-automation-honest',
    'choose-the-access-system-by-the-opening',
    'user-codes-should-identify-people-not-households'
  ]) {
    assert.ok(html.includes('<h2 id="' + id + '">'), id);
    assert.ok(html.includes('href="#' + id + '"'), id);
  }
});

test('lock guide explains the exact Yale module limitation without promising brand-wide compatibility', () => {
  assert.match(html, /AYR202-ZB-HA Zigbee module is not compatible with Control4/);
  assert.match(html, /brand name alone does not prove compatibility/);
  assert.ok(html.includes('https://support.shopyalehome.com/installation-manual-BJHpdEHB'));
  assert.ok(html.includes('https://support.shopyalehome.com/crestron-control4-faq-SJOUWgZkD'));
  assert.match(html, /Check the lock generation as well as the module/);
  assert.match(html, /applicable service subscription/);
});

test('lock feedback is not represented as a security guarantee or as moving-door safety protection', () => {
  assert.match(html, /Sending a lock command is not the same as confirming its result/);
  assert.match(html, /not a guarantee against forced entry/);
  assert.match(html, /old reading should not be treated as fresh confirmation/);
  assert.match(html, /not substitutes for garage safety sensors or gate-protection devices/);
  assert.match(html, /not every lock has a mechanical key/);
  assert.doesNotMatch(html, /Complete security state:|reports that the entry is safe/);
  assert.match(html, /Do not send door codes or passwords/);
});

test('smart-lock photographs retain their original manufacturer files, identity and full frames', () => {
  const directory = path.join(root, 'Video/Blogs imge/Control4 Smart Locks Access Guide');
  const record = JSON.parse(fs.readFileSync(path.join(directory, 'asset-sources.json'), 'utf8'));
  assert.equal(record.assets.length, 4);
  for (const asset of record.assets) {
    const bytes = fs.readFileSync(path.join(directory, asset.file));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.file);
    assert.ok(html.includes(asset.file));
    assert.match(asset.sourceFile, /^https:\/\/cdn\.prod\.website-files\.com\//);
  }
  assert.equal([...html.matchAll(/<img /g)].length, 5);
  assert.doesNotMatch(html, /object-fit:\s*cover|window-door-sensor-navy\.webp/);
  assert.match(html, /not Denali Tech installations or model-by-model compatibility approvals/);
});

test('smart-lock guide has native optional navigation and a contained accessible comparison', () => {
  assert.match(html, /<details class="jump"><summary>Jump to a section/);
  assert.match(html, /<details class="opening-details"><summary>/);
  assert.match(html, /href="#main-content"/);
  assert.match(html, /id="main-content" tabindex="-1"/);
  assert.match(html, /<th scope="col">/);
  assert.match(html, /<th scope="row">/);
  assert.doesNotMatch(html, /min-width:\s*1050px|blog-reader-tools\.js/);
});

test('smart-lock thumbnail retains the top focal point without hover zoom in static and dynamic cards', () => {
  const hub = fs.readFileSync(path.join(root, 'blogs/index.html'), 'utf8');
  const rule = hub.match(/\.blog-card-image-link\[href="\/blogs\/control4-smart-lock-access-control-guide\/"\] img\s*\{([^}]+)\}/);
  assert.ok(rule);
  assert.match(rule[1], /object-position:\s*center top/);
  assert.match(rule[1], /transform:\s*none !important/);
});
