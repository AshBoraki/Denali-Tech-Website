const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modulePath = path.resolve(__dirname, '../../assets/js/blog-search.js');
const { search } = require(modulePath);
const catalog = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../blogs/blog-data.json'), 'utf8')).posts;
const slugs = (posts, query) => search(posts, query).map(post => post.slug);

const intendedArticles = [
  ['new router', 'control4-after-new-router-internet-provider'],
  ['halo touch', 'control4-halo-touch-review'],
  ['home theater', 'home-theater-installation-guide'],
  ['outdoor speakers', 'outdoor-tv-audio-chicago-guide'],
  ['motorized blinds', 'motorized-shades-blinds-drapery-control4-guide'],
  ['Connect subscription', 'control4-connect-subscription-guide'],
  ['control4 not working', 'control4-safe-troubleshooting-checklist'],
  ['control4', 'what-is-control4-guide']
];

for (const [query, expected] of intendedArticles) {
  test(`homeowner intent ranks first: ${query}`, () => {
    assert.ok(catalog.some(post => post.slug === expected), `Fixture article exists: ${expected}`);
    assert.equal(slugs(catalog, query)[0], expected);
  });
}

test('Wi-Fi spelling, punctuation and whitespace produce identical complete results', () => {
  const expected = slugs(catalog, 'wifi');
  assert.ok(expected.includes('wifi-dead-zones-fix-guide'));
  assert.ok(expected.includes('araknis-router-model-comparison'));
  for (const query of ['WiFi', ' WI-FI ', 'wi fi', 'wi–fi', '\tWi   Fi\n']) {
    assert.deepEqual(slugs(catalog, query), expected, query);
  }
});

test('Control4 variants, surrounding spaces and punctuation retain direct intent', () => {
  for (const query of ['Control 4', ' CONTROL4 ', 'control-4']) {
    assert.deepEqual(slugs(catalog, query), slugs(catalog, 'control4'));
  }
  for (const query of ['  HALO   TOUCH  ', 'Halo—Touch', 'halo, touch']) {
    assert.deepEqual(slugs(catalog, query), slugs(catalog, 'halo touch'));
  }
  assert.equal(slugs(catalog, 'Control 4 is not working!')[0], 'control4-safe-troubleshooting-checklist');
  assert.equal(slugs(catalog, 'Control4 isn’t working')[0], 'control4-safe-troubleshooting-checklist');
});

test('accent normalization and selected common spelling/plural equivalents work', () => {
  const posts = [{ slug: 'lighting', title: 'Caséta and motorized shades', tags: ['Outdoor Speakers'] }];
  assert.deepEqual(search(posts, 'caseta'), posts);
  assert.deepEqual(search(posts, 'Caséta'), posts);
  assert.deepEqual(search(posts, 'motorised shade'), posts);
  assert.deepEqual(search(posts, 'outdoor speaker'), posts);
  assert.deepEqual(slugs(catalog, 'home theatre'), slugs(catalog, 'home theater'));
  assert.deepEqual(slugs(catalog, 'radio ra 3'), slugs(catalog, 'radiora3'));
});

test('all meaningful tokens may span fields and occur in a different order', () => {
  const matching = { title: 'Outdoor TV planning', excerpt: 'Weather-rated speakers for backyards.', tags: ['Chicago'] };
  const unrelated = { title: 'Outdoor TV planning', excerpt: 'Indoor stereo equipment.' };
  assert.deepEqual(search([unrelated, matching], 'Chicago outdoor speakers'), [matching]);
  assert.deepEqual(search([matching], 'speakers outdoor'), [matching]);
  assert.deepEqual(search([matching], 'outdoor speakers bedroom'), []);
});

test('whole-token matching rejects junk, partial words and meaningful unknown additions', () => {
  for (const query of ['qzxv987unknown', 'halo qzxv987unknown', 'halo 火星', 'outdoor speakers banana', 'con', 'the and of', '!!!']) {
    assert.deepEqual(search(catalog, query), [], query);
  }
  assert.deepEqual(search([{ title: 'Halogen lights and connection advice' }], 'halo'), []);
  assert.deepEqual(search([{ title: 'Working Control4 system' }], 'control4 not working'), []);
});

test('title phrase and direct-model relevance beat incidental mentions and newer dates', () => {
  const direct = { slug: 'direct', title: 'Halo Touch review', publishedDate: '2020-01-01' };
  const comparison = { slug: 'comparison', title: 'Remote comparison: Halo Touch and more', publishedDate: '2026-01-01' };
  const incidental = { slug: 'incidental', title: 'Halo button remote', excerpt: 'Compare with Halo Touch.', publishedDate: '2030-01-01' };
  assert.deepEqual(search([incidental, comparison, direct], 'halo touch'), [direct, comparison, incidental]);
});

test('blank searches copy supplied browse order, not catalog or date order', () => {
  const supplied = [catalog[9], catalog[2], catalog[18]];
  for (const query of ['', ' \n\t ', null, undefined]) {
    const result = search(supplied, query);
    assert.notEqual(result, supplied);
    assert.deepEqual(result, supplied);
  }
});

test('ranking is deterministic regardless of caller category/date ordering', () => {
  for (const [query] of intendedArticles) {
    assert.deepEqual(slugs([...catalog].reverse(), query), slugs(catalog, query), query);
  }
  const tied = [{ slug: 'z', title: 'Router' }, { slug: 'a', title: 'Router' }];
  assert.deepEqual(slugs(tied, 'router'), ['a', 'z']);
});

test('category-filtered input stays scoped to the caller supplied subset', () => {
  const networkPosts = catalog.filter(post => post.category === 'Network Planning Guide');
  const results = search(networkPosts, 'wi fi');
  assert.ok(results.length > 0);
  assert.ok(results.every(post => networkPosts.includes(post)));
  assert.ok(results.some(post => post.slug === 'araknis-router-model-comparison'));
});

test('search does not mutate catalog, post objects, tags or URLs and returns original references', () => {
  const input = Object.freeze(catalog.map(post => Object.freeze({ ...post, tags: Object.freeze([...post.tags]) })));
  const before = JSON.stringify(input);
  const result = search(input, 'control4');
  assert.ok(result.length > 0);
  assert.ok(result.every(post => input.includes(post)));
  assert.equal(JSON.stringify(input), before);
});

test('missing optional metadata is safe and malformed entries cannot match', () => {
  const minimal = { title: 'Router' };
  assert.deepEqual(search([null, undefined, 1, {}, minimal], 'router'), [minimal]);
  assert.deepEqual(search(null, 'router'), []);
  assert.deepEqual(search([{ title: 'Router', tags: [null, 42, 'WiFi'] }], 'wifi').map(post => post.title), ['Router']);
  assert.deepEqual(search(catalog, 'constructor'), []);
  const literal = { title: 'Constructor guide' };
  assert.deepEqual(search([literal], 'constructor'), [literal]);
});

test('browser global exports the same API without document, network or storage', () => {
  const window = {};
  vm.runInNewContext(fs.readFileSync(modulePath, 'utf8'), { window });
  assert.equal(typeof window.DenaliBlogSearch.search, 'function');
  for (const [query] of intendedArticles) {
    const result = window.DenaliBlogSearch.search(catalog, query);
    assert.deepEqual(Array.from(result, post => post.slug), slugs(catalog, query));
    assert.ok(result.every(post => catalog.includes(post)));
  }
});
