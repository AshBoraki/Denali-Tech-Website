const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../../assets/js/blog-reader-tools.js'), 'utf8');

function buildGuide(href, readyState = 'complete') {
  const location = new URL(href);
  const base = new URL('/', location).href;
  const created = [];
  class Element {
    constructor(tag) {
      this.tagName = tag;
      this.children = [];
      this.id = '';
      this.textContent = '';
      this.classList = { add() {} };
      created.push(this);
    }
    appendChild(child) { this.children.push(child); }
    setAttribute(name, value) { this[name] = value; }
    closest() { return null; }
    set href(value) { this.rawHref = value; }
    get href() { return new URL(this.rawHref, base).href; }
  }
  const headings = ['1. Compare the complete proposal', 'Support & service'].map(text => {
    const heading = new Element('h2');
    heading.textContent = text;
    return heading;
  });
  headings[1].id = 'support & service';
  const main = {
    querySelectorAll(selector) { assert.equal(selector, 'h2'); return headings; },
    insertBefore(guide, heading) {
      assert.equal(heading, headings[0]);
      this.guide = guide;
    }
  };
  headings.forEach(heading => { heading.parentNode = main; });
  let onReady;
  const document = {
    readyState,
    head: new Element('head'),
    getElementById(id) { return created.find(element => element.id === id); },
    createElement(tag) { return new Element(tag); },
    querySelector(selector) {
      return selector === 'main' ? main : created.find(element => element.className === selector.slice(1));
    },
    addEventListener(event, callback) {
      assert.equal(event, 'DOMContentLoaded');
      onReady = callback;
    }
  };
  vm.runInNewContext(source, { window: { location }, document });
  if (onReady) onReady();
  const nav = created.find(element => element.className === 'dt-blog-reader-links');
  assert.ok(nav, 'The reader guide must be generated');
  return { links: nav.children, headings, main };
}

for (const href of [
  'https://denalitechs.com/blogs/how-to-choose-smart-home-installer/',
  'https://denalitechs.com/blogs/how-to-choose-smart-home-installer/?review=ready#old-section',
  'https://denalitechs.com/blogs/how-to-choose-smart-home-installer/index.html?review=ready#old-section',
  'http://127.0.0.1:4203/blogs/how-to-choose-smart-home-installer/?preview=reader#old-section'
]) {
  test(`reader section links stay on the current article with a root base: ${href}`, () => {
    const { links, headings } = buildGuide(href);
    const current = new URL(href);
    assert.equal(links.length, headings.length);
    links.forEach((link, index) => {
      const target = new URL(link.href);
      assert.equal(target.origin, current.origin);
      assert.equal(target.pathname, current.pathname, 'Do not send the section link to the homepage via <base href="/">');
      assert.equal(target.search, current.search, 'Preserve the current article query');
      assert.equal(decodeURIComponent(target.hash.slice(1)), headings[index].id);
      assert.equal(link.textContent, headings[index].textContent);
    });
  });
}

test('reader section links also stay on the article when initialized after DOMContentLoaded', () => {
  const href = 'https://denalitechs.com/blogs/how-to-choose-smart-home-installer/?review=ready#old-section';
  const { links, main } = buildGuide(href, 'loading');
  assert.ok(main.guide);
  assert.equal(links[0].href, href.split('#')[0] + '#1-compare-the-complete-proposal');
});
