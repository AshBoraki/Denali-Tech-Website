const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'blogs/index.html'), 'utf8');
const { search } = require('../../assets/js/blog-search.js');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'blogs/blog-data.json'), 'utf8'));
const hubScript = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1])
    .find(source => source.includes('async function loadBlogData()'));

test('article search precedes browsing extras and provides named, operable controls', () => {
    const searchStart = html.indexOf('id="blogSearchForm"');
    assert.ok(searchStart > html.indexOf('<h1>'));
    assert.ok(searchStart < html.indexOf('id="popularGuides"'));
    assert.ok(searchStart < html.indexOf('class="planning-entry"'));
    assert.match(html, /<label for="searchInput">Search articles<\/label>/);
    assert.match(html, /<input type="search" id="searchInput"[^>]* disabled>/);
    assert.match(html, /id="postCount"[^>]*role="status"/);
    assert.match(html, /id="clearBlogSearch" aria-label="Clear article search" hidden/);
    assert.match(html, /id="resetBlogSearch">Clear search and filters/);
});

test('homeowner shortcuts link to practical guides without changing the article grid', () => {
    const shortcuts = html.slice(html.indexOf('id="popularGuides"'), html.indexOf('id="blogGrid"'));
    const links = [...shortcuts.matchAll(/class="popular-guide" href="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(links, [
        '/blogs/wifi-dead-zones-fix-guide/',
        '/blogs/control4-safe-troubleshooting-checklist/',
        '/blogs/how-much-does-smart-home-automation-cost/'
    ]);
    for (const link of links) assert.ok(catalog.posts.some(post => post.url === link));
});

test('the crawlable grid still links to every existing article in the catalog', () => {
    const grid = html.slice(html.indexOf('id="blogGrid"'), html.indexOf('id="blogLoadMore"'));
    const links = new Set([...grid.matchAll(/href="(\/blogs\/[^"#?]+\/)"/g)].map(match => match[1]));
    assert.deepEqual(links, new Set(catalog.posts.map(post => post.url)));
});

for (const failure of ['missing search module', 'catalog request failure', 'malformed catalog']) {
    test(`fallback preserves the static article grid on ${failure}`, async () => {
        const count = { textContent: '' };
        const controls = { searchInput: { disabled: true }, categorySelect: { disabled: true } };
        const staticCards = catalog.posts.map(post => ({ href: post.url }));
        const grid = {
            querySelectorAll(selector) {
                assert.equal(selector, '.blog-card');
                return staticCards;
            },
            set innerHTML(value) { assert.fail('Static article links must not be replaced: ' + value); }
        };
        const document = {
            getElementById(id) {
                const element = { postCount: count, blogGrid: grid, ...controls }[id];
                assert.ok(element, 'No enhanced UI should render without search and valid data');
                return element;
            }
        };
        let requests = 0;
        const fetch = async url => {
            requests++;
            assert.equal(url, '/blogs/blog-data.json');
            if (failure === 'catalog request failure') throw new Error('offline');
            return { ok: true, json: async () => ({ posts: null }) };
        };
        assert.ok(hubScript);
        await vm.runInNewContext(hubScript, {
            document, fetch,
            window: failure === 'missing search module' ? {} : { DenaliBlogSearch: { search } }
        });
        assert.equal(requests, failure === 'missing search module' ? 0 : 1);
        assert.equal(controls.searchInput.disabled, true);
        assert.equal(controls.categorySelect.disabled, true);
        assert.equal(count.textContent, `Search is unavailable. Browse all ${staticCards.length} articles below.`);
    });
}
