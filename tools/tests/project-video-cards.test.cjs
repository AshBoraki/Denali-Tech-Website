const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'projects/index.html'), 'utf8');
const collection = html.slice(html.indexOf('<div class="project-video-collection"'), html.indexOf('<!-- FILTER SECTION -->'));
const cards = [...collection.matchAll(/<article class="project-video-card">([\s\S]*?)<\/article>/g)].map(m => m[1]);

test('all four supporting video cards have concise balanced copy and a relevant guide', () => {
  assert.equal(cards.length, 4);
  for (const card of cards) {
    assert.equal((card.match(/<h3>/g) || []).length, 1);
    const paragraphs = [...card.matchAll(/<p>([^<]+)<\/p>/g)];
    assert.equal(paragraphs.length, 1);
    const words = paragraphs[0][1].trim().split(/\s+/).length;
    assert.ok(words >= 14 && words <= 24, `Keep card summaries short: ${words} words`);
    const links = [...card.matchAll(/<a class="video-card-link" href="([^"]+)">([^<]+)<\/a>/g)];
    assert.equal(links.length, 1);
    assert.ok(fs.existsSync(path.join(root, links[0][1], 'index.html')), links[0][1]);
  }
});

test('rack guide links match the video in their card and outdoor link covers access points', () => {
  const routes = [
    '/blogs/araknis-access-point-model-comparison/',
    '/blogs/sanus-15u-mini-rack-guide/',
    '/blogs/middle-atlantic-av-rack-build-guide/',
    '/blogs/sanus-cfr2127-rack-guide/'
  ];
  cards.forEach((card, i) => {
    assert.ok(card.includes(`href="${routes[i]}"`));
    const target = fs.readFileSync(path.join(root, routes[i], 'index.html'), 'utf8');
    if (i === 0) assert.match(target, /Outdoor/);
    else assert.ok(target.includes(card.match(/data-video-id="([^"]+)"/)[1]));
  });
});

test('card layout aligns links without truncating the descriptions', () => {
  assert.match(html, /\.project-video-collection \.video-card-copy\s*\{[^}]*flex:\s*1;/);
  assert.match(html, /\.project-video-collection \.video-card-link\s*\{[^}]*min-height:\s*44px;[^}]*margin-top:\s*auto;/);
  assert.doesNotMatch(collection, /line-clamp|text-overflow/);
});
