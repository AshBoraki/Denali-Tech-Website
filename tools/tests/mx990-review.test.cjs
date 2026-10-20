const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('blogs/urc-mx-990-review/index.html');
const folder = 'blogs/urc-mx-990-review/images/manufacturer/';
const source = JSON.parse(read(folder + 'asset-sources.json'));

test('MX-990 review preserves its URL, title, H1, original publication and six established anchors', () => {
  assert.match(html, /<title>URC MX-990 Review: Is It Still Worth It\? \| Denali Tech<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/denalitechs.com\/blogs\/urc-mx-990-review\/"/);
  assert.match(html, /<h1>URC MX-990 review: is it still the right remote\?<\/h1>/);
  assert.equal([...html.matchAll(/<h1[ >]/g)].length, 1);
  assert.match(html, /"datePublished":"2024-01-30T00:00:00\+00:00"/);
  assert.match(html, /"dateModified":"2026-10-19"/);
  for (const id of ['what-the-urc-mx-990-is-designed-to-do','how-the-mx-990-works-in-a-finished-room','battery-life-what-to-expect','where-the-mx-990-works-well-and-where-it-does-not','who-the-mx-990-fits-best','common-questions-about-the-mx-990']) {
    assert.ok(html.includes(`id="${id}"`));
    assert.ok(html.includes(`href="#${id}"`));
  }
});

test('MX-990 display, one-way control and RF hardware are described without platform conflation', () => {
  assert.match(html, /2\.4-inch color LCD is not a touchscreen/);
  assert.match(html, /physical keys beside the display/);
  assert.match(html, /handset does not receive live equipment status/);
  assert.match(html, /RFX-250: receives the radio signal/);
  assert.match(html, /MRF-350: sends the IR commands/);
  assert.match(html, /six adjustable IR outputs/);
  assert.match(html, /418 MHz[\s\S]*433 MHz/);
  assert.match(html, /This RF link is not your home's WiFi/);
  assert.doesNotMatch(html, /sits at the top|most advanced|best remote|255 devices/i);
});

test('Programming and recovery guidance does not encourage destructive reset or promise file recovery', () => {
  assert.match(html, /Complete Control software \(CCP\)/);
  assert.match(html, /Factory Default erases the programming/);
  assert.match(html, /Do not assume every installer has the original file or can recover it/);
  assert.match(html, /does not establish compatibility with your current device/);
  assert.match(html, /Do not assume that every device with a remote accepts IR/);
  assert.ok(html.includes('/download/47330/'));
  assert.ok(html.includes('/download/47331/'));
});

test('Charging guidance avoids guaranteed runtime and unnecessary replacement', () => {
  assert.match(html, /no useful blanket promise/);
  assert.match(html, /Check that the remote seats properly and shows charging/);
  assert.match(html, /Use the specified battery and charging equipment/);
  assert.match(html, /Keep a working system if it meets the need/);
  assert.match(html, /no reason to replace it just for a newer model name/);
});

test('All manufacturer originals, display encodings and editorial cover match provenance hashes', () => {
  assert.equal(source.assets.filter(a => a.role === 'original').length, 4);
  assert.equal(source.assets.filter(a => a.role === 'display').length, 4);
  assert.equal(source.assets.filter(a => a.role === 'editorial cover').length, 1);
  assert.match(source.notes, /not an independent license grant/);
  assert.match(source.notes, /RGB compression is not pixel-identical/);
  for (const asset of source.assets) {
    const bytes = fs.readFileSync(path.join(root, folder, asset.file));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.file);
    assert.match(asset.sourceFile, /^https:\/\/www\.urc-automation\.com\/wp-content\/uploads\//);
    assert.match(asset.sourcePage, /^https:\/\/www\.urc-automation\.com\/product\//);
    assert.ok(fs.existsSync(path.join(root, folder, asset.originalFile)));
  }
});

test('SVG image framing keeps every device and antenna inside the visible bounds', () => {
  const displays = source.assets.filter(a => a.role === 'display');
  const visuals = [...html.matchAll(/<svg viewBox="([^"]+)"[^>]*role="img"[^>]*aria-label="([^"]+)"><image href="([^"]+)" width="1500" height="1500"\/><\/svg>/g)];
  assert.equal(visuals.length, 3);
  for (const [tag, frame, label, href] of visuals) {
    const asset = displays.find(a => href.endsWith(a.file));
    assert.ok(asset, href);
    const [x,y,w,h] = frame.split(' ').map(Number);
    const [left,top,right,bottom] = asset.deviceBounds;
    assert.ok(x <= left && y <= top && x+w >= right && y+h >= bottom, asset.file);
    assert.ok(html.includes(`href="/${folder}${asset.originalFile}"`));
    assert.ok(label.length > 20);
  }
  assert.match(html, /Manufacturer photo, not an installation/);
  assert.doesNotMatch(html, /urc-rfx-250-rf-sensor-navy|urc-mx-990-in-living-room/);
});

test('Reading aids use native semantics, one primary inquiry action and no injected sales panel', () => {
  assert.match(html, /<a class="skip-link" href="#main-content">/);
  assert.match(html, /<main id="main-content" class="wrap" tabindex="-1">/);
  assert.match(html, /<details class="jump"><summary>In this guide/);
  assert.equal([...html.matchAll(/<details><summary>/g)].length, 4);
  assert.equal([...html.matchAll(/class="btn"/g)].length, 1);
  assert.match(html, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(html, /script src="\/assets\/js\/site-chrome\.js/);
  assert.doesNotMatch(html, /blog-reader-tools\.js|copyToClipboard|<base |<form\b|FAQPage|aggregateRating/);
  assert.match(html, /GTM-MWPTRPDR/);
  assert.match(html, /1475625250840344/);
  assert.match(html, /src="\/assets\/js\/microsoft-uet\.js"/);
});

test('MX-990 editorial thumbnail is synchronized with catalog, social metadata and noncropping hub style', () => {
  const image = '/' + folder + 'mx990-review-cover.webp';
  const post = JSON.parse(read('blogs/blog-data.json')).posts.find(p => p.slug === 'urc-mx-990-review');
  assert.equal(post.heroImage, image);
  assert.equal(post.publishedDate, '2024-01-30');
  assert.equal(post.updatedDate, '2026-10-19');
  assert.ok(html.includes('https://denalitechs.com'+image));
  const hub = read('blogs/index.html');
  assert.ok(hub.includes(`src="${image}"`));
  assert.match(hub, /\.blog-card-image-link\[href="\/blogs\/urc-mx-990-review\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
