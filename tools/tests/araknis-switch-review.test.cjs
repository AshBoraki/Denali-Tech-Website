const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('blogs/araknis-network-switch-comparison/index.html');
const folder = 'Video/Blogs imge/Araknis Switch Comparison/';
const provenance = JSON.parse(read(folder + 'asset-sources.json'));
const cards = [...html.matchAll(/<article class="card">([\s\S]*?)<\/article>/g)].map(m => m[1]);

test('Switch guide preserves its canonical, publication date and established section anchors', () => {
  assert.match(html, /rel="canonical" href="https:\/\/denalitechs.com\/blogs\/araknis-network-switch-comparison\/"/);
  assert.match(html, /"datePublished":"2026-07-12"/);
  assert.match(html, /"dateModified":"2026-10-19"/);
  assert.equal([...html.matchAll(/<h1[ >]/g)].length, 1);
  assert.match(html, /<main class="wrap" id="main-content" tabindex="-1">/);
  for (const id of ['see-the-switch-families-side-by-side', 'araknis-220-series', 'araknis-320-series', 'araknis-620-series', 'araknis-920-series', 'family-comparison']) {
    assert.ok(html.includes(`id="${id}"`));
    assert.ok(html.includes(`href="#${id}"`));
  }
});

test('Gigabit models identify real SKUs and shared rather than per-port total power', () => {
  assert.equal(cards.length, 8);
  assert.doesNotMatch(html, /AN-220-SW-C-8-POE/);
  for (const [i, sku, watts] of [[0, 'AN-220-SW-R-8-POE', 65], [1, 'AN-220-SW-R-24-POE', 190], [2, 'AN-320-SW-R-8-POE', 130], [3, 'AN-320-SW-F-24-POE', 375]]) {
    assert.ok(cards[i].includes(sku));
    assert.ok(cards[i].includes(`${watts}W shared budget`));
    assert.match(cards[i], /Up to 30W per (?:PoE\+ )?port/);
  }
  assert.match(html, /PoE budget means shared power/);
  assert.match(html, /higher series number does not automatically improve WiFi coverage or internet speed/);
});

test('620 model limits and routing qualifications remain model-specific', () => {
  assert.match(cards[4], /240W shared budget/);
  assert.match(cards[5], /720W shared budget/);
  for (const card of cards.slice(4, 6)) {
    assert.match(card, /2\.5G RJ45 ports; 2 × 10G SFP\+ uplinks/);
    assert.match(card, /Up to 60W per port/);
  }
  assert.match(html, /Layer 3 Lite adds static and inter-VLAN routing/);
  assert.match(html, /not a replacement for the internet router or firewall/);
  assert.match(html, /620-Series%20L3-Managed-Multi-Gigabit%20PoE_Switch-Data%20Sheets_092223\.pdf/);
});

test('920 cards qualify optional modules and disclose conflicting manufacturer power references', () => {
  for (const card of cards.slice(6)) assert.match(card, /Up to 90W per port/);
  assert.match(cards[6], /One possible 100G QSFP28 uplink with the optional module/);
  assert.match(cards[7], /Up to two 100G QSFP28 uplinks with optional modules/);
  assert.match(html, /920 power budgets: why the documents differ/);
  assert.match(html, /750W with one power module[\s\S]*1080W[\s\S]*1650W/);
  assert.match(html, /not a verified limit for your installed unit/);
  assert.match(html, /QSFP28 and additional power modules are sold separately/);
  assert.match(html, /does not[\s\S]*guarantee that the same load stays powered if a supply fails/);
});

test('Every exact-model image has its original, documented source and verified file hash', () => {
  assert.equal(provenance.assets.filter(a => a.role === 'original').length, 8);
  assert.equal(provenance.assets.filter(a => a.role === 'display').length, 8);
  assert.match(provenance.notes, /not a license grant/);
  for (const asset of provenance.assets) {
    const bytes = fs.readFileSync(path.join(root, folder, asset.file));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.file);
    assert.match(asset.sourceFile, /^https:\/\/www\.snapav\.com\/wcsstore\//);
    assert.match(asset.sourcePage, /^https:\/\/www\.snapav\.com\/shop\//);
  }
});

test('SVG framing retains full device bounds and matches the labelled SKU to the original photograph', () => {
  const display = provenance.assets.filter(a => a.role === 'display');
  for (const card of cards) {
    const file = decodeURIComponent(card.match(/<image href="([^"]+)"/)[1]).split('/').pop();
    const asset = display.find(a => a.file === file);
    assert.ok(asset, file);
    const vb = card.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    assert.deepEqual(vb, asset.viewBox);
    const [x, y, w, h] = vb;
    const [left, top, right, bottom] = asset.deviceBounds;
    assert.ok(x <= left && y <= top && x + w >= right && y + h >= bottom, file);
    assert.ok(card.includes(`<p class="sku">${asset.sku}</p>`));
    assert.ok(decodeURIComponent(card).includes(asset.originalFile));
    assert.match(card, /<svg[^>]*role="img"[^>]*aria-label=/);
    assert.match(card, /<image[^>]*width="1700" height="1700"/);
  }
  assert.match(html, /\.pic svg\{[^}]*overflow:hidden/);
});

test('Optional reading aids and customer-facing copy do not depend on custom reader scripts', () => {
  assert.match(html, /<details class="jump"><summary>In this guide/);
  assert.match(html, /<details class="spec-details"><summary>Open the family comparison table/);
  assert.equal([...html.matchAll(/scope="row"/g)].length, 4);
  assert.equal([...html.matchAll(/scope="col"/g)].length, 4);
  assert.match(html, /@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(html, /reader-tools\.js|Use this section during a walkthrough|what to tell the customer|<form\b/i);
});

test('Article, social preview and blog listing use the same whole-subject editorial cover', () => {
  const cover = '/Video/Blogs%20imge/Araknis%20Switch%20Comparison/araknis-switch-comparison-cover.webp';
  const post = JSON.parse(read('blogs/blog-data.json')).posts.find(p => p.slug === 'araknis-network-switch-comparison');
  assert.equal(post.heroImage, cover);
  assert.ok(html.includes(`https://denalitechs.com${cover}`));
  const hub = read('blogs/index.html');
  assert.ok(hub.includes(`src="${cover}"`));
  assert.match(hub, /\.blog-card-image-link\[href="\/blogs\/araknis-network-switch-comparison\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
