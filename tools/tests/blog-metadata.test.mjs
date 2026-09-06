import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readingMinutes, articleDates, replaceReadLabel, setModifiedDate, planRefresh } from '../refresh-blog-metadata.mjs';

test('reading estimate counts main prose and captions, excluding surrounding UI', () => {
  const html = `<nav>${'outside '.repeat(500)}</nav><main><div class="meta">${'byline '.repeat(500)}</div><p>${'word '.repeat(200)}</p><figure><figcaption>Caption</figcaption></figure><div class="blog-share"><a>Share</a></div><div class="related"><p>${'related '.repeat(500)}</p></div><script>${'script '.repeat(500)}</script></main>`;
  assert.deepEqual(readingMinutes(html), { words: 201, minutes: 2 });
});

test('read-label correction does not refresh article dates', () => {
  const html = '<script type="application/ld+json">{"@type":"BlogPosting","datePublished":"2026-01-01","dateModified":"2026-02-01"}</script><span>9-minute read</span>';
  const result = replaceReadLabel(html, 3);
  assert.match(result, /3 min read/);
  assert.equal(articleDates(result).modified, '2026-02-01');
});

test('explicit content date updates modified metadata and visible time but not publication', () => {
  const html = '<meta name="article:modified_time" content="2026-02-01"><script type="application/ld+json">{"@type":"BlogPosting","datePublished":"2026-01-01","dateModified":"2026-02-01"}</script><span>Published: January 1, 2026</span>';
  const result = setModifiedDate(html, '2026-09-05');
  assert.deepEqual(articleDates(result), { published: '2026-01-01', modified: '2026-09-05' });
  assert.match(result, /datetime="2026-09-05"/);
  assert.equal(setModifiedDate(result, '2026-09-05'), result);
});

test('catalog, all article labels and static hub metadata remain synchronized', () => {
  const result = planRefresh();
  const catalog = JSON.parse(fs.readFileSync(new URL('../../blogs/blog-data.json', import.meta.url), 'utf8'));
  assert.equal(result.summaries.length, catalog.posts.length);
  assert.deepEqual([...result.changes.keys()], []);
});

test('blog skip link targets the current-page focusable main landmark', () => {
  const hub = fs.readFileSync(new URL('../../blogs/index.html', import.meta.url), 'utf8');
  assert.match(hub, /<a href="#main-content" class="skip-link">/);
  assert.match(hub, /<main id="main-content" tabindex="-1"/);
  assert.doesNotMatch(hub, /href="\/#main-content"/);
});

test('operator-facing FAQ is absent from both visible page and structured data', () => {
  const html = fs.readFileSync(new URL('../../blogs/snap-one-brand-stack-smart-home-guide/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /Can this help AI search recommend Denali Tech/);
  const faq = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1])).find(item => item['@type'] === 'FAQPage');
  assert.equal(faq.mainEntity.length, 2);
  for (const item of faq.mainEntity) assert.ok(html.includes(`<h2>${item.name}</h2>`));
});

test('six expanded guides retain topic-specific conclusions and current update dates', () => {
  for (const slug of ['control4-apple-homekit-guide', 'luma-security-camera-planning-guide', 'outdoor-tv-audio-chicago-guide', 'smart-home-designers-architects-guide', 'smart-home-prewire-builders-guide', 'smart-home-takeover-service-guide']) {
    const html = fs.readFileSync(new URL(`../../blogs/${slug}/index.html`, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /The best smart home projects feel calm because the hard decisions were handled early/);
    assert.equal(articleDates(html).modified, '2026-09-05');
    assert.ok(readingMinutes(html).words >= 650, slug);
  }
});
