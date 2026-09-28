import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Static regression guard: FAQ content must exist in the article body.
// Browser visibility checks supplement this; this is not a full schema validator.
const normalize = value => String(value)
  .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&(?:amp|nbsp|quot|apos|rsquo|lsquo|rdquo|ldquo);/gi, ' ')
  .replace(/<[^>]*>/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const catalog = JSON.parse(fs.readFileSync(new URL('../../blogs/blog-data.json', import.meta.url), 'utf8'));

test('retained blog FAQ markup matches article questions and answers', () => {
  let questions = 0;
  for (const post of catalog.posts) {
    const html = fs.readFileSync(new URL(`../../blogs/${post.slug}/index.html`, import.meta.url), 'utf8');
    const body = normalize(html.replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ''));
    for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : data['@graph'] || [data];
      for (const faq of items.filter(item => item['@type'] === 'FAQPage')) {
        for (const question of faq.mainEntity) {
          questions++;
          assert.ok(body.includes(normalize(question.name)), `${post.slug}: absent question: ${question.name}`);
          assert.ok(body.includes(normalize(question.acceptedAnswer.text)), `${post.slug}: answer differs: ${question.name}`);
        }
      }
    }
  }
  assert.ok(questions > 0, 'Exercise retained FAQ content');
});
