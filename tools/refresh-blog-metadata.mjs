import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Blog source HTML owns content dates. Reading estimates use 200 words/minute,
// rounded up, from main content including headings, tables, and captions, but
// excluding navigation, metadata, sharing controls, related links and scripts.
// Metadata corrections NEVER imply a new article modification date.
const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const READ_LABEL = /\b\d+(?:\s+min|[-\s]+minutes?)\s+(?:read|case study)\b/gi;
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const OMIT_CLASSES = new Set(['meta', 'case-meta', 'blog-meta', 'blog-breadcrumb', 'crumb', 'tags', 'blog-tags', 'blog-share', 'related', 'related-posts', 'related-links']);

function decode(text) {
  return text.replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&(?:nbsp|amp|quot|apos|lt|gt|[a-z]+);/gi, ' ');
}

export function readingMinutes(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (!main) throw new Error('Article has no main content');
  const clean = main.replace(/<!--[^]*?-->/g, '').replace(/<(script|style|svg)\b[^>]*>[^]*?<\/\1>/gi, '');
  const stack = [];
  const chunks = [];
  for (const token of clean.match(/<[^>]+>|[^<]+/g) || []) {
    if (!token.startsWith('<')) {
      if (!stack.some(node => node.omit)) chunks.push(token);
      continue;
    }
    const closing = token.match(/^<\/([\w-]+)/);
    if (closing) {
      const index = stack.map(node => node.tag).lastIndexOf(closing[1].toLowerCase());
      if (index !== -1) stack.length = index;
      continue;
    }
    const tag = token.match(/^<([\w-]+)/)?.[1]?.toLowerCase();
    if (!tag || VOID_TAGS.has(tag) || /\/>$/.test(token)) continue;
    const classes = token.match(/\bclass\s*=\s*(["'])(.*?)\1/i)?.[2].split(/\s+/) || [];
    stack.push({ tag, omit: ['nav', 'footer'].includes(tag) || classes.some(name => OMIT_CLASSES.has(name) || name.endsWith('-meta')) || /\bdata-denali-chrome\b/.test(token) });
  }
  const words = decode(chunks.join(' ')).match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length || 0;
  return { words, minutes: Math.max(1, Math.ceil(words / 200)) };
}

export function articleDates(html) {
  const blocks = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const entities = blocks.flatMap(match => {
    const data = JSON.parse(match[1]);
    return Array.isArray(data) ? data : data['@graph'] || [data];
  });
  const article = entities.find(item => [item['@type']].flat().some(type => ['BlogPosting', 'Article'].includes(type)));
  if (!article?.dateModified || !article?.datePublished) throw new Error('Article date metadata is missing');
  return { published: article.datePublished.slice(0, 10), modified: article.dateModified.slice(0, 10) };
}

export function replaceReadLabel(html, minutes) {
  if (!new RegExp(READ_LABEL.source, 'i').test(html)) throw new Error('Article reading-time label is missing');
  return html.replace(READ_LABEL, `${minutes} min read`);
}

function staticCard(post) {
  const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const date = new Date(`${post.publishedDate.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
  return `
                <article class="blog-card">
                    <a href="${escape(post.url)}" class="blog-card-image-link" style="text-decoration: none; color: inherit; display: block;">
                        <div class="blog-image-wrapper">
                            <img src="${escape(post.heroImage)}" alt="${escape(post.title)}" loading="lazy" decoding="async" width="400" height="225" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                    </a>
                    <div class="blog-card-content">
                        <div class="blog-card-meta"><span class="blog-card-category">${escape(post.category)}</span><span>${date}</span></div>
                        <h2 class="blog-card-title"><a href="${escape(post.url)}">${escape(post.title)}</a></h2>
                        <p class="blog-card-excerpt">${escape(post.excerpt)}</p>
                        <div class="blog-card-footer"><span class="blog-card-reading-time">${post.readingTime} min read</span><a href="${escape(post.url)}" class="blog-card-link">Open Article →</a></div>
                    </div>
                </article>`;
}

export function setModifiedDate(html, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) throw new Error('Use a valid YYYY-MM-DD modification date');
  const display = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
  let result = html.replace(/("dateModified"\s*:\s*")[^"]+("\s*[,}])/g, `$1${date}$2`)
    .replace(/(<meta\b[^>]*(?:name|property)=["']article:modified_time["'][^>]*content=["'])[^"']+(["'][^>]*>)/gi, `$1${date}$2`);
  const updated = `<span>Updated: <time datetime="${date}">${display}</time></span>`;
  if (/<span[^>]*>Updated\b/i.test(result)) {
    result = result.replace(/<span[^>]*>Updated\b[\s\S]*?<\/span>/i, updated);
  } else {
    result = result.replace(/(<span[^>]*>Published\b[\s\S]*?<\/span>)/i, `$1${updated}`);
  }
  return result.replace(/<\/span><span>Updated:/, '</span> <span>Updated:');
}

export function planRefresh(root = DEFAULT_ROOT, options = {}) {
  const catalogPath = path.join(root, 'blogs/blog-data.json');
  const catalogBefore = fs.readFileSync(catalogPath, 'utf8');
  const catalog = JSON.parse(catalogBefore);
  const changes = new Map();
  const touched = new Set(options.modifiedArticles || []);
  const known = new Set(catalog.posts.map(post => post.slug));
  for (const slug of touched) if (!known.has(slug)) throw new Error(`Unknown article: ${slug}`);
  if (touched.size && !options.modifiedDate) throw new Error('An explicit modification date is required for edited articles');
  const summaries = [];
  for (const post of catalog.posts) {
    const filename = path.join(root, 'blogs', post.slug, 'index.html');
    const before = fs.readFileSync(filename, 'utf8');
    let after = touched.has(post.slug) ? setModifiedDate(before, options.modifiedDate) : before;
    const dates = articleDates(after);
    const reading = readingMinutes(after);
    after = replaceReadLabel(after, reading.minutes);
    if (after !== before) changes.set(filename, after);
    summaries.push({ slug: post.slug, ...dates, ...reading, previousUpdatedDate: post.updatedDate, previousReadingTime: post.readingTime });
    post.updatedDate = dates.modified;
    post.readingTime = reading.minutes;
  }
  const catalogAfter = JSON.stringify(catalog, null, 2) + '\n';
  if (catalogBefore.replaceAll('\r\n', '\n') !== catalogAfter) changes.set(catalogPath, catalogAfter);

  const hubPath = path.join(root, 'blogs/index.html');
  const hubBefore = fs.readFileSync(hubPath, 'utf8');
  const seen = new Set();
  let hubAfter = hubBefore.replace(/<article\b[^>]*class=["']blog-card["'][^>]*>[\s\S]*?<\/article>/g, card => {
    const slug = card.match(/href=["']\/blogs\/([^/]+)\//)?.[1];
    const post = catalog.posts.find(item => item.slug === slug);
    if (!post) throw new Error(`Unknown static hub card: ${slug}`);
    if (seen.has(slug)) throw new Error(`Duplicate static hub card: ${slug}`);
    seen.add(slug);
    return replaceReadLabel(card, post.readingTime);
  });
  const missingCards = catalog.posts.filter(post => !seen.has(post.slug));
  if (missingCards.length) {
    const marker = '<!-- Crawlable server-rendered cards. JavaScript enhances these with search and filtering. -->';
    if (!hubAfter.includes(marker)) throw new Error('Static hub insertion marker is missing');
    hubAfter = hubAfter.replace(marker, marker + missingCards.map(staticCard).join(''));
  }
  if (hubAfter !== hubBefore) changes.set(hubPath, hubAfter);

  // RSS retains original publication dates: no new article was published.
  // Touch only changed blog routes, leaving service-page and other dates alone.
  if (touched.size) {
    const sitemapPath = path.join(root, 'sitemap.xml');
    const sitemapBefore = fs.readFileSync(sitemapPath, 'utf8');
    const urls = new Set(['https://denalitechs.com/blogs/', ...[...touched].map(slug => `https://denalitechs.com/blogs/${slug}/`)]);
    const sitemapAfter = sitemapBefore.replace(/(<loc>)([^<]+)(<\/loc>\s*<lastmod>)([^<]+)(<\/lastmod>)/g, (match, start, url, middle, oldDate, end) => urls.has(url) ? `${start}${url}${middle}${options.modifiedDate}${end}` : match);
    if (sitemapAfter !== sitemapBefore) changes.set(sitemapPath, sitemapAfter);
  }
  return { changes, summaries };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const modifiedDate = args.find(arg => arg.startsWith('--modified-date='))?.split('=')[1];
  const modifiedArticles = args.find(arg => arg.startsWith('--modified-articles='))?.split('=')[1].split(',').filter(Boolean) || [];
  const { changes, summaries } = planRefresh(DEFAULT_ROOT, { modifiedDate, modifiedArticles });
  if (write) for (const [filename, content] of changes) fs.writeFileSync(filename, content, 'utf8');
  console.log(JSON.stringify({ mode: write ? 'write' : 'check', articles: summaries.length, changedFiles: [...changes.keys()].map(file => path.relative(DEFAULT_ROOT, file)), dateCorrections: summaries.filter(item => item.previousUpdatedDate !== item.modified), readingCorrections: summaries.filter(item => item.previousReadingTime !== item.minutes).length }, null, 2));
  if (!write && changes.size) process.exitCode = 1;
}
