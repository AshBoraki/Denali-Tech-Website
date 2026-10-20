const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.resolve(__dirname, '../../about/index.html'), 'utf8');
const section = html.match(/<section class="business-credentials"[\s\S]*?<\/section>/)?.[0];

test('About credentials contain only the requested local license and insurance statements', () => {
  assert.ok(section);
  assert.equal([...section.matchAll(/<li>/g)].length, 2);
  assert.match(section, /<li>Mount Prospect business license<\/li>/);
  assert.match(section, /<li>General liability insurance<\/li>/);
  assert.ok(section.includes('Proof of business licensing and insurance is available upon request.'));
  assert.doesNotMatch(section, /Control4|Automation Programmer|training|certif|bonded|state.licensed|guarantee/i);
});

test('About credentials do not expose documents, identifiers, extra tracking or claims', () => {
  assert.doesNotMatch(section, /<a\b|<img\b|<iframe\b|<object\b|<embed\b|<script\b|\.pdf|policy\s*(?:number|#)|license\s*(?:number|#)|\$|\d{3,}/i);
  assert.match(section, /aria-labelledby="business-credentials-heading"/);
  assert.match(section, /<h2[^>]+id="business-credentials-heading"/);
  assert.match(html, /\.business-credentials__items\s*\{[^}]*flex-wrap:\s*wrap/);
  assert.match(html, /\.business-credentials__proof\s*\{[^}]*color:\s*var\(--text-secondary\)/);
  assert.ok(html.indexOf('id="business-credentials"') > html.indexOf('Why Ash Built Denali Tech'));
  assert.ok(html.indexOf('id="business-credentials"') < html.indexOf('<!-- Mission Section -->'));
  assert.match(html, /<link rel="canonical" href="https:\/\/denalitechs.com\/about\/">/);
});
