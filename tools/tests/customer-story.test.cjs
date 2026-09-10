const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

// Run with: node --test tools/tests/customer-story.test.cjs
// Source-only tests: no browser, network, submissions, Git dependency, or writes.
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const videoId = 'trIB-ld2lQA';
const posterPath = '/Video/Project%20videos/glenn-control4-theater.webp';
const c4 = read('control4-installer-chicago/index.html');
const projects = read('projects/index.html');
const theater = read('home-theater-room/index.html');

function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&rsquo;/g, '’')
    .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”');
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map(match => [match[1].toLowerCase(), decode(match[2] ?? match[3] ?? match[4])]));
}

function tags(html, name) {
  return [...html.matchAll(new RegExp('<' + name + '\\b[^>]*>', 'gi'))]
    .map(match => attributes(match[0]));
}

function block(html, element, id) {
  const opening = new RegExp('<' + element + '\\b[^>]*\\bid="' + id + '"[^>]*>', 'i');
  const start = html.search(opening);
  assert.notEqual(start, -1, 'Missing ' + id);
  const end = html.indexOf('</' + element + '>', start);
  assert.notEqual(end, -1, 'Unclosed ' + id);
  return html.slice(start, end + element.length + 3);
}

function text(html) {
  return decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
}

function metadata(html) {
  return {
    title: decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)[1]).trim(),
    meta: tags(html, 'meta').map(stable)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    canonical: tags(html, 'link').filter(tag => tag.rel === 'canonical'),
    structuredData: [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      .map(match => JSON.parse(match[1]))
  };
}

function webpDimensions(file) {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const type = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    assert.ok(data + size <= bytes.length, 'Truncated WebP chunk');
    if (type === 'VP8X') {
      return [bytes.readUIntLE(data + 4, 3) + 1, bytes.readUIntLE(data + 7, 3) + 1];
    }
    if (type === 'VP8 ') {
      assert.equal(bytes.toString('hex', data + 3, data + 6), '9d012a');
      return [bytes.readUInt16LE(data + 6) & 0x3fff, bytes.readUInt16LE(data + 8) & 0x3fff];
    }
    if (type === 'VP8L') {
      assert.equal(bytes[data], 0x2f);
      const bits = bytes.readUInt32LE(data + 1);
      return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
    }
    offset = data + size + (size % 2);
  }
  assert.fail('No supported WebP image chunk');
}

const projectStory = block(projects, 'article', 'glenn-control4-theater');
const projectLoaderStart = projects.indexOf("document.querySelectorAll('.video-poster[data-video-id]')");
const projectLoaderEnd = projects.indexOf('// Project Filtering', projectLoaderStart);
assert.ok(projectLoaderStart >= 0 && projectLoaderEnd > projectLoaderStart, 'Missing Projects player loader');
const projectScript = projects.slice(projectLoaderStart, projectLoaderEnd);

function setup(options = {}) {
  const created = [];
  const replaced = [];
  const focused = [];
  const ids = options.ids || [videoId];
  const posters = ids.map(id => ({
    dataset: { videoId: id, videoTitle: "Glenn's Control4 theater story and equipment tour" },
    connected: true,
    addEventListener(event, callback) {
      assert.equal(event, 'click');
      this.clickHandler = callback;
    },
    replaceWith(player) {
      this.connected = false;
      replaced.push(player);
    }
  }));
  const document = {
    activeElement: options.focused === false ? null : posters[0],
    querySelectorAll(selector) {
      assert.equal(selector, '.video-poster[data-video-id]');
      return posters;
    },
    createElement(tag) {
      assert.equal(tag, 'iframe');
      const player = {
        focus(settings) {
          assert.equal(settings.preventScroll, true);
          focused.push(this);
        }
      };
      created.push(player);
      return player;
    }
  };
  vm.runInNewContext(projectScript, { document });
  return {
    created, replaced, focused, posters,
    click(overrides = {}, index = 0) {
      let prevented = false;
      posters[index].clickHandler({
        defaultPrevented: false, button: 0,
        preventDefault() { prevented = true; },
        ...overrides
      });
      return prevented;
    }
  };
}

test('Projects retains the exact quote and existing-equipment integration context', () => {
  const copy = text(projectStory);
  assert.ok(copy.includes('It’s been a real lifesaver for me.'));
  assert.match(copy, /Glenn already owned [^.]*theater/i);
  assert.match(copy, /Denali Tech integrated [^.]*existing [^.]*Control4/i);
  assert.match(copy, /him and his guests/i);
  assert.match(copy, /Glenn[^.]*Homeowner/i);
  assert.doesNotMatch(copy, /(?:Chicago|North Shore|Northbrook) homeowner|built Glenn.s theater/i);
  assert.match(copy, /4:16/);
});

test('the real local poster exists and is 1280 by 720 WebP', () => {
  const file = path.join(root, decodeURIComponent(posterPath.slice(1)));
  assert.ok(fs.statSync(file).size > 0);
  assert.deepEqual(webpDimensions(file), [1280, 720]);
  const image = tags(projectStory, 'img').find(tag => tag.src === posterPath);
  assert.ok(image, 'Story must use the local Glenn poster');
  assert.equal(image.width, '1280');
  assert.equal(image.height, '720');
  assert.ok(image.alt);
});

test('Projects retains six unique playable videos including Glenn exactly once', () => {
  const posters = tags(projects, 'a').filter(tag => tag['data-video-id']);
  const expected = [videoId, 'c1XsFCtvaUI', 'oZtPCCqB3I4', 'VUuqk9xgQ98', 'RMhACTGt4U8', 'oUFmSTj9N6I'];
  assert.equal(posters.length, 6);
  assert.deepEqual(posters.map(tag => tag['data-video-id']).sort(), expected.sort());
  assert.equal(new Set(posters.map(tag => tag['data-video-id'])).size, 6);
  assert.equal((projects.match(/\bid="glenn-control4-theater"/g) || []).length, 1);
  assert.equal(posters.filter(tag => tag['data-video-id'] === videoId).length, 1);
  assert.equal(tags(projectStory, 'article')[0]['aria-labelledby'], 'glenn-control4-theater-title');
  for (const poster of posters) {
    const fallback = new URL(poster.href);
    const linkedId = fallback.searchParams.get('v') || fallback.pathname.split('/').pop();
    assert.equal(fallback.hostname, 'www.youtube.com');
    assert.equal(linkedId, poster['data-video-id']);
    assert.match(poster.rel, /\bnoopener\b/);
  }
});

test('Projects poster is a labelled real link with a persistent YouTube fallback', () => {
  const links = tags(projectStory, 'a').filter(tag => {
    const url = new URL(tag.href, 'https://denalitechs.com');
    return url.hostname === 'www.youtube.com' && url.searchParams.get('v') === videoId;
  });
  assert.ok(links.length >= 2, 'Keep a separate fallback after poster replacement');
  const poster = links.find(tag => tag['data-video-id'] === videoId);
  assert.ok(poster && poster['aria-label']);
  for (const link of links) {
    assert.equal(link.target, '_blank');
    assert.match(link.rel, /\bnoopener\b/);
  }
});

test('poster/player sizing and contain-fit are guarded without screenshot dependencies', () => {
  const projectPlayerCss = projects.match(/\.video-player\s*\{([^}]*)\}/)?.[1] || '';
  assert.match(projectPlayerCss, /min-height:\s*200px;/);
  assert.match(projectPlayerCss, /aspect-ratio:\s*16\s*\/\s*9;/);
  assert.match(projects, /#glenn-control4-theater \.video-poster img\s*\{[^}]*object-fit:\s*contain;/);
});

for (const [name, html] of [['Control4', c4], ['Home theater', theater]]) {
  test(name + ' contains no Glenn story, teaser, reference or scoped player code', () => {
    assert.ok(!/Glenn|trIB-ld2lQA|glenn-control4-theater|glenn-story|control4-story/i.test(html),
      'Glenn story and its scoped CSS/JS must appear only on Projects');
    assert.ok(!html.includes(posterPath));
  });
}

test('Projects contains no initial YouTube iframe or raw dynamic URL attribute', () => {
  assert.equal(tags(projects, 'iframe').filter(tag => /youtube(?:-nocookie)?\.com/.test(tag.src || '')).length, 0);
  assert.equal((projects.match(/\b(?:src|href)\s*=\s*(?:"[^"]*\$\{[^"]*"|'[^']*\$\{[^']*'|\$\{[^}]*\})/g) || []).length, 0);
  assert.equal(setup().created.length, 0);
});

  test('Projects activates one exact no-cookie video and transfers keyboard focus', () => {
    const env = setup();
    assert.equal(env.click(), true);
    assert.equal(env.created.length, 1);
    assert.equal(env.replaced.length, 1);
    const player = env.created[0];
    const url = new URL(player.src);
    assert.equal(url.origin, 'https://www.youtube-nocookie.com');
    assert.equal(url.pathname, '/embed/' + videoId);
    assert.equal(url.searchParams.get('autoplay'), '1');
    assert.equal(url.searchParams.get('rel'), '0');
    assert.match(player.title, /Glenn.*Control4.*theater/i);
    assert.equal(player.allowFullscreen, true);
    assert.equal(player.tabIndex, 0);
    assert.equal(env.focused[0], player);
  });

  for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) {
    test('Projects preserves ' + modifier + ' fallback navigation', () => {
      const env = setup();
      assert.equal(env.click({ [modifier]: true }), false);
      assert.equal(env.created.length, 0);
    });
  }

  test('Projects ignores non-primary and previously prevented clicks', () => {
    const env = setup();
    assert.equal(env.click({ button: 1 }), false);
    assert.equal(env.click({ button: 2 }), false);
    assert.equal(env.click({ defaultPrevented: true }), false);
    assert.equal(env.created.length, 0);
  });

  test('Projects rejects absent or malformed video IDs without swallowing the fallback link', () => {
    for (const id of ['', undefined, 'invalid', '../bad/path', '<script>x</script>']) {
      const env = setup({ ids: [id] });
      assert.equal(env.click(), false);
      assert.equal(env.created.length, 0);
    }
  });

  test('Projects safely handles pages with no matching posters', () => {
    assert.equal(setup({ ids: [] }).created.length, 0);
  });

test('Projects does not move focus when the poster did not own keyboard focus', () => {
  const env = setup({ focused: false });
  env.click();
  assert.equal(env.focused.length, 0);
});

// Intentional SEO-only baseline from before the customer-story change.
// Attribute order and formatting are normalized; visible page prose is not snapshotted.
// Update these hashes only when a separate SEO metadata/schema change is authorized.
const seoBaseline = [
  ['Control4', c4, '/control4-installer-chicago/', 'b5a60ddaf5400f8852c57953b831c6faa865c0ff9e680980b45ac0444c767e01'],
  ['Projects', projects, '/projects/', 'fcf57edae56685c99836a6fb975bc6bd24c8a5b6009e0a989a8e2fb6eaf36f41'],
  ['Home theater', theater, '/home-theater-room/', '6e8094805b0c7a3168471f89e45a348ab535bc804cf14007f69984696a772846']
];

for (const [name, html, pathname, expected] of seoBaseline) {
  test(name + ' retains its existing SEO metadata and valid non-review structured data', () => {
    const data = metadata(html);
    assert.equal(data.canonical.length, 1);
    assert.equal(data.canonical[0].href, 'https://denalitechs.com' + pathname);
    assert.ok(data.meta.some(tag => tag.name === 'robots' && /\bindex\b/.test(tag.content)));
    assert.ok(!data.meta.some(tag => /robots|googlebot/.test(tag.name || '') && /\bnoindex\b/.test(tag.content || '')));
    assert.doesNotMatch(JSON.stringify(data.structuredData), /"@type"\s*:\s*"(?:Review|AggregateRating|VideoObject)"/);
    const actual = crypto.createHash('sha256').update(JSON.stringify(stable(data))).digest('hex');
    assert.equal(actual, expected, 'SEO metadata/schema changed outside the customer-story scope');
  });
}
