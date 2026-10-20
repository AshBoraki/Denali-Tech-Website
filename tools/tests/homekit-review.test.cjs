const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('blogs/control4-apple-homekit-guide/index.html');
const source = JSON.parse(read('blogs/control4-apple-homekit-guide/images/asset-sources.json'));

test('HomeKit guide preserves identity, publication and all six established section links', () => {
  assert.match(html, /<title>Control4 and Apple HomeKit Guide \| Denali Tech<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/denalitechs.com\/blogs\/control4-apple-homekit-guide\/"/);
  assert.match(html, /<h1>Control4 and Apple HomeKit: What Homeowners Should Understand<\/h1>/);
  assert.equal([...html.matchAll(/<h1[ >]/g)].length, 1);
  assert.match(html, /"datePublished":"2026-06-03"/);
  assert.match(html, /"dateModified":"2026-10-19"/);
  for (const id of ['control-layer-heading', 'one-primary-control-layer-keeps-the-home-calmer', 'what-does-the-built-in-integration-actually-support', 'do-i-need-a-subscription-or-an-apple-home-hub', 'what-to-ask-before-connecting-systems', 'final-thought']) {
    assert.ok(html.includes(`id="${id}"`), id);
    assert.ok(html.includes(`href="#${id}"`), id);
  }
});

test('Official X4 integration is distinguished from reverse accessory import and legacy bridges', () => {
  assert.match(html, /X4 offers an official integration for supported Control4 functions/);
  assert.match(html, /It does not mean every Apple Home accessory can be imported into Control4/);
  assert.match(html, /HomeKit or Matter accessory can be added to Control4/);
  assert.match(html, /identify its purpose, compatibility and maintenance responsibilities before changing or removing it/);
  assert.match(html, /Keep what works/);
});

test('Seven documented categories remain scoped to OS 4.0 and do not promise full AV or lock support', () => {
  assert.match(html, /release-specific reference—not a guarantee for every model, driver or later release/);
  assert.match(html, /Categories documented for X4 \(OS 4\.0\)/);
  assert.equal([...html.matchAll(/<th scope="row">/g)].length, 7);
  assert.equal([...html.matchAll(/<th scope="col">/g)].length, 2);
  assert.match(html, /Lighting scenes<\/th><td>Appear as switches in Apple Home/);
  assert.match(html, /Native Control4 thermostats in this reference—not every third-party thermostat/);
  assert.match(html, /does not establish camera, lock or complete A\/V interface support/);
  assert.match(html, /different from receiving a complete A\/V control panel in Apple Home/);
});

test('Connect entitlement and Apple home hub roles remain separate', () => {
  assert.match(html, /Apple integration among Connect's premium features/);
  assert.match(html, /Local Control4 operation without Connect is a separate question/);
  assert.match(html, /supported HomePod or Apple TV as a home hub/);
  assert.match(html, /This is not the Control4 controller/);
  assert.ok(html.includes('https://support.apple.com/en-us/102557'));
  assert.ok(html.includes('https://www.control4.com/services'));
  assert.doesNotMatch(html, /iPad as a home hub|X4 requires Connect to operate|\$\d/);
});

test('Setup and troubleshooting encourage backups, account privacy and non-destructive checks', () => {
  assert.match(html, /make a backup before any upgrade/);
  assert.match(html, /Menu labels may differ with the app version/);
  assert.match(html, /do not share passwords/);
  assert.match(html, /Do not factory-reset controllers or delete the home as a first step/);
  assert.match(html, /This is not an upgrade procedure/);
  assert.doesNotMatch(html, /Use this section during a walkthrough|before promising|The homeowner should/);
});

test('Original, display and editorial images match provenance hashes with truthful labels', () => {
  assert.equal(source.assets.length, 5);
  assert.match(source.notes, /not an independent license grant/);
  for (const asset of source.assets) {
    const bytes = fs.readFileSync(path.join(root, asset.file.slice(1)));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.file);
    assert.ok(asset.sourcePage && asset.sourceFile);
  }
  assert.ok(fs.existsSync(path.join(root, 'assets/brandfolder/control4/control4-countertop-remote-480.webp')));
  assert.equal([...html.matchAll(/<img /g)].length, 3);
  assert.match(html, /\.photo img\{[^}]*height:auto;object-fit:contain;transform:none/);
  assert.match(html, /Control4 X4 app shown—not Apple Home/);
  assert.match(html, /Manufacturer lifestyle photo, not a Denali installation/);
});

test('Native reading controls, analytics and a single inquiry action remain available', () => {
  assert.match(html, /<main id="main-content" class="wrap" tabindex="-1">/);
  assert.match(html, /<a class="skip-link" href="#main-content">/);
  assert.match(html, /<details class="jump"><summary>In this guide/);
  assert.match(html, /<details class="spec-details"><summary>/);
  assert.equal([...html.matchAll(/<details><summary>/g)].length, 3);
  assert.equal([...html.matchAll(/class="btn"/g)].length, 1);
  assert.match(html, /@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(html, /@view-transition\s*\{\s*navigation:\s*none/);
  assert.match(html, /GTM-MWPTRPDR/);
  assert.match(html, /src="\/assets\/js\/microsoft-clarity\.js"/);
  assert.match(html, /src="\/assets\/js\/microsoft-uet\.js"/);
  assert.doesNotMatch(html, /blog-reader-tools\.js|<form\b|FAQPage|aggregateRating/);
});

test('HomeKit cover matches catalog, social preview and non-cropping static hub', () => {
  const image = '/blogs/control4-apple-homekit-guide/images/control4-apple-home-cover.webp';
  const post = JSON.parse(read('blogs/blog-data.json')).posts.find(p => p.slug === 'control4-apple-homekit-guide');
  assert.equal(post.heroImage, image);
  assert.equal(post.publishedDate, '2026-06-03');
  assert.equal(post.updatedDate, '2026-10-19');
  assert.ok(html.includes('https://denalitechs.com'+image));
  const hub = read('blogs/index.html');
  assert.ok(hub.includes(`src="${image}"`));
  assert.match(hub, /\.blog-card-image-link\[href="\/blogs\/control4-apple-homekit-guide\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
