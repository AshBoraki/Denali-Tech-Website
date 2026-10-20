const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const slug = 'control4-connect-subscription-guide';
const html = fs.readFileSync(path.join(root, 'blogs', slug, 'index.html'), 'utf8');
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test('Connect guide preserves its URL, title, publication date and established section fragments', () => {
  const url = 'https://denalitechs.com/blogs/' + slug + '/';
  assert.ok(html.includes('<link rel="canonical" href="' + url + '">'));
  assert.match(html, /<title>Control4 Connect: What the Subscription Does \| Denali Tech<\/title>/);
  assert.equal(schema.mainEntityOfPage, url);
  assert.equal(schema.datePublished, '2026-08-17');
  assert.equal(schema.dateModified, '2026-10-19');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const id of ['the-features-homeowners-notice-most', 'connect-or-4sight-which-name-applies', 'what-remote-access-looks-like', 'what-connect-does-and-does-not-solve', 'before-activating-or-renewing-check-four-things', 'connect-is-not-the-same-as-an-onsite-service-plan']) {
    assert.ok(ids.includes(id), id);
  }
});

test('Connect guide distinguishes optional X4 access from legacy OS 3 Connect and 4Sight', () => {
  assert.match(html, /On X4, it is an optional subscription/);
  assert.match(html, /On X4, you can keep local app control without Connect/);
  assert.match(html, /OS 3 <em>Connect<\/em> accounts can lose local app access when Connect expires/);
  assert.match(html, /<em>4Sight<\/em> customers who stay on OS 3 can continue renewing 4Sight/);
  assert.match(html, /later X4 policy made Connect optional/);
  assert.doesNotMatch(html, /Systems installed after that date use|installation date matters|Connect is required for all/i);
});

test('U.S. pricing is a dated published reference with renewal and finite transition caveats', () => {
  assert.ok(html.includes('$249 per year'));
  assert.match(html, /published reference price, not a quote for your account/);
  assert.match(html, /current charge, tax, term and renewal settings/);
  assert.ok(html.includes('existing $249 X4 plans become optional at renewal'));
  assert.match(html, /through the end of 2026—not indefinitely/);
  assert.match(html, /November 12, 2025/);
});

test('Connect benefits are bounded by hardware, internet, account and separate support requirements', () => {
  assert.match(html, /subscription alone cannot detect it/);
  assert.match(html, /does not make every camera an intercom/);
  assert.match(html, /Local does not mean everything works without internet/);
  assert.match(html, /Apple Music itself may require a separate music subscription/);
  assert.match(html, /Control4 Assist is a separate manufacturer-backed remote-support offering/);
  assert.match(html, /Do not assume Connect includes visits, replacement hardware/);
  assert.match(html, /There is no need to replace working equipment/);
});

test('All three images are verified unchanged public manufacturer originals with correct dimensions', () => {
  const dir = path.join(root, 'Video/Blogs imge/Control4 Connect Guide');
  const record = JSON.parse(fs.readFileSync(path.join(dir, 'asset-sources.json'), 'utf8'));
  assert.equal(record.assets.length, 3);
  assert.match(record.notes, /not an independent license grant/);
  for (const image of record.assets) {
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, image.file))).digest('hex'), image.sha256);
    assert.match(image.sourceFile, /^https:\/\/cdn\.prod\.website-files\.com\//);
    assert.ok(html.includes('width="' + image.dimensions[0] + '" height="' + image.dimensions[1] + '"'));
    assert.ok(html.includes('href="/Video/Blogs%20imge/Control4%20Connect%20Guide/' + image.file + '"'));
  }
  assert.match(html, /not Denali Tech installation photos/);
  assert.match(html, /\.photo figcaption\{position:static/);
  assert.doesNotMatch(html, /object-fit:cover|min-height:430px/);
});

test('Connect guide provides keyboard-friendly navigation, reduced motion and reflow', () => {
  assert.match(html, /class="skip-link" href="#main-content"/);
  assert.match(html, /<main class="wrap" id="main-content" tabindex="-1">/);
  assert.match(html, /<details class="jump"><summary>/);
  assert.match(html, /id="connect-price"><summary>/);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /@view-transition\{navigation:none\}/);
  assert.match(html, /main\{overflow-wrap:anywhere\}/);
  assert.doesNotMatch(html, /blog-reader-tools\.js/);
});

test('References and scoped hub thumbnail treatment are present without replacing shared navigation', () => {
  for (const url of ['https://www.control4.com/services', 'https://news.snapav.com/post/connect-is-now-optional-for-new-x4-systems', 'https://help.snapone.com/optional-connect-x4-faq/X4-Connect%20FAQ%20Domestic.pdf', 'https://docs.control4.com/o/4sight-services/']) {
    assert.ok(html.includes('href="' + url + '"'));
  }
  const hub = fs.readFileSync(path.join(root, 'blogs/index.html'), 'utf8');
  const scoped = hub.match(/\.blog-card-image-link\[href="\/blogs\/control4-connect-subscription-guide\/"\] img \{([^}]+)\}/)[1];
  assert.match(scoped, /object-fit: contain !important/);
  assert.match(scoped, /transform: none !important/);
});
