const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const slug = 'control4-t5-vs-t4-touchscreen-size-guide';
const html = fs.readFileSync(path.join(root, 'blogs', slug, 'index.html'), 'utf8');
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const anchors = [
  'first-get-the-generations-and-sizes-right',
  'four-screen-choices-side-by-side',
  'how-touchscreens-look-in-real-rooms',
  'the-installation-parts-hidden-behind-the-wall',
  'prewire-checklist-before-drywall-closes',
  'a-simple-room-by-room-recommendation'
];

test('touchscreen review preserves the search URL, publication date and existing section links', () => {
  const canonical = 'https://denalitechs.com/blogs/' + slug + '/';
  assert.ok(html.includes('<link rel="canonical" href="' + canonical + '">'));
  assert.equal(schema.mainEntityOfPage, canonical);
  assert.equal(schema.datePublished, '2026-07-12');
  assert.equal(schema.dateModified, '2026-10-19');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');
  for (const id of anchors) {
    assert.ok(html.includes('<h2 id="' + id + '">'), id);
    assert.ok(html.includes('href="#' + id + '"'), id);
  }
});

test('comparison separates T5 in-wall from T4 tabletop and cites model-specific documentation', () => {
  const rows = [...html.matchAll(/<tr><th scope="row">([\s\S]*?)<\/tr>/g)].map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  assert.equal(rows.length, 4);
  assert.match(rows[0], /^T5 8-inch In-wall /);
  assert.match(rows[1], /^T5 11-inch In-wall /);
  assert.match(rows[2], /^T4 8-inch In-wall or tabletop /);
  assert.match(rows[3], /^T4 10-inch In-wall or tabletop /);
  assert.match(html, /Requires Control4 X4\.2 \/ OS 4\.2\.0 or later/);
  for (const source of [
    '798_25_Control4T5_SpecSheet.pdf',
    'Specifications%20and%20Requirements.htm',
    't4-series-touchscreen-data-sheet-rev-d.pdf',
    't4-touchscreen-tabletop/dealer-installation-guide/english/latest/'
  ]) assert.ok(html.includes(source), source);
});

test('touchscreen content offers a native, optional contents list without a forced wide table', () => {
  assert.match(html, /<details class="jump">\s*<summary>Jump to a section<\/summary>/);
  assert.doesNotMatch(html, /blog-reader-tools\.js|min-width:\s*880px/);
  assert.match(html, /<th scope="col">/);
  assert.match(html, /href="#main-content"/);
  assert.match(html, /id="main-content" tabindex="-1"/);
});

test('every touchscreen image and responsive source resolves to an existing local asset', () => {
  const urls = [];
  for (const match of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) urls.push(match[1]);
  for (const match of html.matchAll(/\bsrcset="([^"]+)"/g)) {
    for (const entry of match[1].split(',')) urls.push(entry.trim().split(/\s+/)[0]);
  }
  assert.ok(urls.length > 10);
  for (const url of urls) {
    assert.ok(url.startsWith('/Video/'), url);
    assert.ok(fs.existsSync(path.join(root, decodeURIComponent(url))), url);
  }
  assert.doesNotMatch(html, /object-fit:\s*cover/);
  assert.match(html, /not Denali Tech project photographs/);
  assert.match(html, /Music · wall-mounted control/);
  assert.match(html, /Lighting · wall-mounted control/);
  assert.doesNotMatch(html, /T5 In-Wall [—•] (?:Media|Office|Lighting)/);
});

test('tabletop product source record identifies the real model and both complete manufacturer views', () => {
  const folder = path.join(root, 'Video/Blogs imge/Control4 Touchscreens');
  const record = JSON.parse(fs.readFileSync(path.join(folder, 'asset-sources.json'), 'utf8'));
  const products = record.assets.filter(asset => asset.model);
  assert.equal(products.length, 2);
  for (const product of products) {
    assert.equal(product.model, 'C4-T4T10-BL');
    assert.match(product.sourceFile, /^https:\/\/www\.snapav\.com\//);
    assert.ok(fs.existsSync(path.join(folder, product.file)));
    assert.ok(html.includes(product.file));
  }
});
