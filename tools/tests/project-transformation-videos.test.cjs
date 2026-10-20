const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'projects/index.html'), 'utf8');
const videos = [...html.matchAll(/<video class="project-transformation-video"([\s\S]*?)<\/video>/g)].map(m=>m[0]);

test('both supplied transformation videos have native controls and never autoplay or preload the clips', () => {
  assert.equal(videos.length, 2);
  for (const video of videos) {
    assert.match(video, /controls playsinline preload="none"/);
    assert.doesNotMatch(video, /autoplay|\bloop\b/);
    assert.match(video, /width="406" height="720"/);
    assert.match(video, /aria-label="[^"<]+" aria-describedby="[^"<]+"/);
    for (const file of [...video.matchAll(/(?:src|poster|href)="(\/Video\/[^"<]+)"/g)].map(m=>decodeURIComponent(m[1]))) assert.ok(fs.existsSync(path.join(root, file)), file);
  }
});

test('the portrait clips stay uncropped and all original AV videos remain', () => {
  assert.match(html, /\.project-transformation-video\s*\{[^}]*object-fit: contain/);
  assert.match(html, /@media \(max-width: 600px\)[\s\S]*?\.project-transformation-pair \.project-video-card \{ grid-template-columns: 1fr; \}/);
  for (const id of ['c1XsFCtvaUI','oZtPCCqB3I4','VUuqk9xgQ98','RMhACTGt4U8','oUFmSTj9N6I']) assert.equal((html.match(new RegExp('data-video-id="'+id+'"','g'))||[]).length, 1);
  assert.equal((html.match(/data-video-id="trIB-ld2lQA"/g)||[]).length, 1);
  assert.ok(html.indexOf('id="basement-network-transformation"') < html.indexOf('class="project-video-collection"'));
  assert.ok(html.includes('id="structured-wiring-transformation"'));
});
