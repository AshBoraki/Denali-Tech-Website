const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const questions = read('blogs/questions-to-ask-installer/index.html');
const proposals = read('blogs/how-to-choose-smart-home-installer/index.html');
const hub = read('blogs/index.html');
const catalog = JSON.parse(read('blogs/blog-data.json')).posts;

test('installer articles have distinct purposes and reciprocal crawlable links at unchanged URLs', () => {
  assert.match(questions, /<h1[^>]*>10 Questions to Ask Your Smart Home Installer Before Hiring<\/h1>/);
  assert.match(proposals, /<h1[^>]*>How to Compare Smart Home Installation Quotes<\/h1>/);
  assert.match(questions, /Use this checklist for an initial conversation/);
  assert.match(questions, /href="\/blogs\/how-to-choose-smart-home-installer\/"/);
  assert.match(proposals, /href="\/blogs\/questions-to-ask-installer\/"/);
  assert.match(proposals, /Compare the same outcome, room by room/);
  assert.match(proposals, /Make programming a written deliverable/);
  assert.doesNotMatch(proposals, /Question 1:|10 Essential Questions to Ask|🚩/);
  for (const [slug, html] of [['questions-to-ask-installer', questions], ['how-to-choose-smart-home-installer', proposals]]) {
    assert.ok(html.includes(`<link rel="canonical" href="https://denalitechs.com/blogs/${slug}/">`));
    assert.equal((html.match(/<div class="cta-box">/g) || []).length, 1);
    assert.match(html, /"dateModified": "2026-11-04"/);
  }
});

test('installer advice judges defined scope and coverage, not price or brand count alone', () => {
  assert.match(questions, /Supporting several brands is not itself a warning sign/);
  assert.match(questions, /Paid support can be appropriate/);
  assert.match(questions, /Additional paid training can be reasonable/);
  assert.match(questions, /One well-supported brand may be the right choice/);
  assert.match(questions, /A business license is not a substitute for any trade credentials/);
  assert.doesNotMatch(questions, /because you make more money/);
  assert.match(proposals, /The lowest price is not automatically a mistake, and the highest price is not proof of better work/);
  assert.match(proposals, /Manufacturer product coverage, installer workmanship, programming corrections, and later service are different commitments/);
  assert.match(proposals, /where the platform permits/);
  assert.match(proposals, /Manufacturer example:/);
  assert.equal((proposals.match(/<img /g) || []).length, 4);
});

test('catalog and crawlable hub reflect accurate publication date and revised proposal title', () => {
  const q = catalog.find(post => post.id === 'questions-to-ask-installer');
  const p = catalog.find(post => post.id === 'how-to-choose-smart-home-installer');
  assert.equal(q.publishedDate, '2024-01-25');
  assert.match(questions, /"datePublished": "2024-01-25/);
  assert.match(hub, /January 25, 2024/);
  assert.equal(p.title, 'How to Compare Smart Home Installation Quotes');
  assert.ok(hub.includes(`href="${p.url}">${p.title}</a>`));
  assert.ok(hub.includes(p.excerpt));
  assert.equal(p.publishedDate, '2025-01-05');
});
