const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('Homepage keeps its search identity, primary choices and established business positioning', () => {
  assert.match(html, /<title>Home Automation Chicago \| Control4, WiFi &amp; AV \| Denali Tech<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/denalitechs\.com\/">/);
  assert.match(html, /name="robots" content="index, follow/);
  assert.equal([...html.matchAll(/<h1[ >]/g)].length, 1);
  const hero = html.slice(html.indexOf('<div class="hero-content">'), html.indexOf('<section class="homepage-guides-section"'));
  assert.match(hero, /href="\/contact\/" class="btn-primary">Start a home tech plan/);
  assert.match(hero, /href="\/blogs\/" class="btn-secondary">Read the guides/);
  assert.match(hero, /Control4 \/ URC Authorized Dealer/);
  assert.match(hero, /5\.0 Google rating\. 100\+ homes served/);
  assert.match(hero, /tel:\+13124397500/);
  assert.match(hero, /https:\/\/wa\.me\/13124397500/);
  assert.doesNotMatch(html, /<form\b/i);
});

test('Featured Connect guide follows the hero in both DOM and visual order', () => {
  assert.ok(html.indexOf('<section class="homepage-guides-section"') < html.indexOf('<section id="project-plan"'));
  assert.match(html, /main#main-content > \.hero \{ order: 10; \}/);
  assert.match(html, /main#main-content > \.homepage-guides-section \{ order: 15; \}/);
  assert.match(html, /main#main-content > \.offer-plan-section \{ order: 20; \}/);
  assert.match(html, /href="\/blogs\/control4-connect-subscription-guide\/"/);
});

test('Installation cards use existing Denali project-video frames and native crawlable links', () => {
  const section = html.slice(html.indexOf('<!-- Featured Projects Showcase -->'), html.indexOf('<!-- Services Section -->'));
  const cards = [...section.matchAll(/<a class="project-showcase-card" href="([^"]+)"[\s\S]*?<\/a>/g)];
  assert.equal(cards.length, 3);
  const projects = fs.readFileSync(path.join(root, 'projects/index.html'), 'utf8');
  assert.match(projects, /id="project-videos"/);
  for (const card of cards) {
    assert.equal(card[1], '/projects/#project-videos');
    const src = card[0].match(/<img src="([^"]+)"/)[1];
    assert.ok(fs.existsSync(path.join(root, decodeURIComponent(src))));
    assert.ok(projects.includes(src));
    assert.match(card[0], /width="1280" height="720"/);
    assert.match(card[0], /object-fit: contain/);
    assert.doesNotMatch(card[0], /onclick=|onkeydown=|tabindex=|role="article"/);
  }
  assert.match(html, /Control4 manufacturer images\. See our installations below/);
  assert.match(html, /control4-countertop-remote\.webp 1800w/);
  assert.match(html, /control4-kitchen-lighting-scene\.webp 1800w/);
});

test('Homepage media keeps full subjects and mobile projects do not depend on a sideways gesture', () => {
  const css = html.slice(html.indexOf('<style id="homepage-accessibility-flow-polish">'));
  assert.match(css, /homepage-control4-images picture:nth-child\(n\)\s*\{\s*aspect-ratio: auto !important;\s*min-height: 0 !important;/);
  assert.match(css, /homepage-control4-images img\s*\{\s*height: auto !important;\s*object-fit: contain !important;/);
  assert.match(css, /project-image-wrapper img\s*\{\s*height: 100% !important;\s*object-fit: contain !important;\s*transform: none !important;/);
  assert.match(css, /projects-showcase-grid\s*\{\s*display: grid !important;\s*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /project-showcase-card:nth-child\(n\+2\)\s*\{\s*min-width: 0 !important;\s*max-width: none !important;/);
  assert.match(css, /touch-action: pan-y pinch-zoom !important/);
  assert.match(css, /hero-content h1 \{ overflow-wrap: anywhere; \}/);
  assert.match(html, /id="main-content" tabindex="-1"/);
  assert.doesNotMatch(html, /const target = document\.querySelector\(href\)/);
  assert.doesNotMatch(html, /this\.innerHTML = '<span[^\n]+Loading/);
});

test('Homepage structured data uses the current existing logo without adding review-rich-result claims', () => {
  for (const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    if (!script[0].startsWith('<script type="application/ld+json"')) new vm.Script(script[1]);
  }
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const business = schemas.find(s=>Array.isArray(s['@type']) && s['@type'].includes('LocalBusiness'));
  assert.equal(business.url, 'https://denalitechs.com/');
  assert.equal(business.telephone, '+1-312-439-7500');
  assert.equal(business.logo, 'https://denalitechs.com/Video/Denali-Tech-Google-Logo-Final-Polished.png');
  assert.equal(business.aggregateRating, undefined);
  assert.ok(fs.existsSync(path.join(root, 'Video/Denali-Tech-Google-Logo-Final-Polished.png')));
  for (const schema of schemas.filter(s=>s.logo)) assert.equal(schema.logo, business.logo);
});

function videoHarness({desktop = true, reduced = false, saveData = false, initialEmptySourceError = false} = {}) {
  const listeners = {};
  const sourceListeners = {};
  const documentListeners = {};
  const classes = new Set();
  const source = {
    attrs: {},
    getAttribute(name) { return name === 'data-src' ? 'Video/homepage/denali-tech-hero-smart-home.mp4' : this.attrs[name] ?? null; },
    set src(value) { this.attrs.src=value; },
    addEventListener(name, callback) { sourceListeners[name]=callback; }
  };
  const video = {
    paused: true, loads: 0, plays: 0,
    classList: {contains:name=>classes.has(name),add:name=>classes.add(name),remove:name=>classes.delete(name)},
    querySelector:()=>source,
    closest:()=>({}),
    load(){this.loads++;},
    play(){this.plays++;this.paused=false;listeners.playing();return Promise.resolve();},
    pause(){this.paused=true;if(listeners.pause) listeners.pause();},
    addEventListener(name,callback){listeners[name]=callback;}
  };
  const toggle={hidden:true,textContent:'',addEventListener(name,callback){this[name]=callback;}};
  const setting=matches=>({matches,addEventListener(name,callback){this.changed=callback;}});
  const desktopSetting=setting(desktop),motionSetting=setting(reduced),connection={saveData,addEventListener(name,callback){this.changed=callback;}};
  let idle;
  let intersection;
  const document={readyState:'complete',hidden:false,getElementById:id=>id==='hero-background-video'?video:toggle,addEventListener:(name,callback)=>documentListeners[name]=callback};
  const window={matchMedia:query=>query.includes('min-width')?desktopSetting:motionSetting,requestIdleCallback:callback=>idle=callback,IntersectionObserver:function(){}};
  const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function initHeroVideo()'));
  vm.runInNewContext(script,{window,document,navigator:{connection},requestIdleCallback:callback=>idle=callback,IntersectionObserver:function(callback){intersection=callback;this.observe=()=>{};}});
  if (initialEmptySourceError) sourceListeners.error();
  idle();
  return {video,source,toggle,motionSetting,desktopSetting,connection,document,documentListeners,sourceListeners,intersection};
}

test('Background video does not load on mobile, with reduced motion, or with data saving', () => {
  for (const options of [{desktop:false},{reduced:true},{saveData:true}]) {
    const h=videoHarness(options);
    assert.equal(h.video.loads,0);
    assert.equal(h.video.plays,0);
    assert.equal(h.source.getAttribute('src'),null);
    assert.equal(h.toggle.hidden,true);
  }
});

test('Background video can be paused and stays paused until the visitor resumes it', () => {
  const h=videoHarness({initialEmptySourceError:true});
  assert.equal(h.video.loads,1);
  assert.equal(h.toggle.hidden,false);
  assert.equal(h.toggle.textContent,'Pause background video');
  h.toggle.click();
  assert.equal(h.video.paused,true);
  assert.equal(h.toggle.textContent,'Play background video');
  h.intersection([{isIntersecting:false}]);
  h.intersection([{isIntersecting:true}]);
  assert.equal(h.video.paused,true);
  h.toggle.click();
  assert.equal(h.video.paused,false);
  assert.equal(h.video.loads,1);
});

test('Background video follows live motion and visibility changes and falls back to its poster on failure', () => {
  const h=videoHarness();
  h.document.hidden=true;h.documentListeners.visibilitychange();
  assert.equal(h.video.paused,true);
  h.document.hidden=false;h.documentListeners.visibilitychange();
  assert.equal(h.video.paused,false);
  h.motionSetting.matches=true;h.motionSetting.changed();
  assert.equal(h.video.paused,true);
  assert.equal(h.toggle.hidden,true);
  h.motionSetting.matches=false;h.motionSetting.changed();
  assert.equal(h.video.paused,false);
  h.sourceListeners.error();
  assert.equal(h.video.paused,true);
  assert.equal(h.video.classList.contains('is-ready'),false);
  assert.equal(h.toggle.hidden,true);
});
