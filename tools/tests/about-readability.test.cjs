const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.resolve(__dirname, '../../about/index.html'), 'utf8');
const main = html.split('<main role="main"')[1].split('<!-- Footer -->')[0];

test('About keeps identity, credentials and existing deep links without repeated sales sections', () => {
  for (const text of ['Ash Boraki', '2023', 'Control4 and URC dealer', 'Mount Prospect business license', 'General liability insurance', 'id="client-fit-heading"', 'id="software-products-heading"', 'id="business-credentials"']) assert.ok(main.includes(text), text);
  for (const text of ['Our Core Values', 'Why Homeowners Call Denali Tech', 'Who We Work Best With', 'Every project includes']) assert.ok(!main.includes(text), text);
  assert.equal([...main.matchAll(/<h1>/g)].length, 1);
  assert.match(main, /additional service charges are explained in your proposal or service agreement/);
});

test('About shows an uncropped existing project frame and keeps software secondary', () => {
  assert.match(main, /src="\/Video\/Project%20videos\/rack-before-after\.webp"/);
  assert.match(main, /href="\/projects\/#project-videos"/);
  assert.doesNotMatch(main, /<iframe|product-points|denali-tech-hero-laptop-new-wrap/);
  assert.match(html, /\.about-project-proof img\s*\{[^}]*object-fit: contain/);
  assert.match(main, /href="https:\/\/dt-nt.com\/"/);
  assert.match(main, /href="https:\/\/propokit.com\/"/);
});
