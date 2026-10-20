const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),slug='control4-contemporary-keypad-guide';
const html=read(`blogs/${slug}/index.html`),schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
test('Contemporary preserves URL, title, H1, publication and established section links',()=>{
 assert.match(html,/<title>Control4 Contemporary Keypad Guide \| Denali Tech<\/title>/);
 assert.match(html,/<h1 id="article-title">One clean keypad\. The actions you use every day\.<\/h1>/);
 assert.equal(schema.mainEntityOfPage,`https://denalitechs.com/blogs/${slug}/`);assert.equal(schema.datePublished,'2026-07-26');assert.equal(schema.dateModified,'2026-10-19');
 for(const id of ['see-engraved-control4-keypads-in-finished-rooms','first-choose-what-the-device-needs-to-do','button-layouts-side-by-side','what-makes-contemporary-flexible','see-the-color-direction','a-keypad-can-control-more-than-lighting'])assert.ok(html.includes(`id="${id}"`),id);
 assert.match(html,/"@type":"BreadcrumbList"/);
});
test('Contemporary separates exact scene, local-load and wired-bus models',()=>{
 for(const model of ['C4-KC120277-C','C4-KD120-C','C4-KCB-C'])assert.ok(html.includes(model));
 assert.match(html,/It does not directly dim a connected light/);assert.match(html,/using Zigbee/);assert.match(html,/not a battery-powered device/);
 assert.match(html,/not interchangeable with the 240V or 277V variants/);assert.match(html,/48V DC keypad communicating over RS-485/);assert.match(html,/not a line-voltage dimmer/);
 assert.doesNotMatch(html,/Zigbee 3\.0/);
});
test('Contemporary electrical guidance avoids blanket no-neutral LED or load-rating promises',()=>{
 assert.match(html,/AC installation requires a neutral/);assert.match(html,/not applicable without neutral/);assert.match(html,/not a 600W LED rating/);
 assert.match(html,/qualified professional/);assert.match(html,/not an installation or wiring procedure/);assert.match(html,/multi-gang arrangement/);assert.match(html,/software, drivers and network compatibility/);
});
test('Contemporary configuration counts and indicators have explicit limits',()=>{
 assert.match(html,/37 configurations, using four button sizes/);assert.match(html,/two to seven buttons/);assert.match(html,/not a specification for every Control4 lighting product/);
 assert.match(html,/backlit engraving, programmable RGB status LEDs/);assert.match(html,/ambient-light sensor/);assert.match(html,/Replacing button caps alone does not define a new scene/);
 assert.match(html,/not independent proof that a lock is secure/);assert.doesNotMatch(html,/class="keypad"|class="swatch"/);
});
test('Contemporary finish and scene advice is conditional and customer-facing',()=>{
 assert.match(html,/ten button colors/);assert.match(html,/C4-KC240-C counterpart lists six/);assert.match(html,/specification sheets are dated 2021/);assert.match(html,/faceplates are sold separately/i);
 assert.match(html,/not included subscriptions or a compatibility guarantee/);
 assert.doesNotMatch(html,/Use this section during a walkthrough|show the homeowner|guaranteed|2015|personalize-your-keypad-brochure/i);
});
test('Contemporary full-frame manufacturer images have traceable sources and matching hashes',()=>{
 const r=JSON.parse(read(`blogs/${slug}/images/manufacturer/asset-sources.json`));assert.equal(r.assets.length,6);assert.match(r.notes,/not an independent license grant/);
 for(const a of r.assets){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.file.slice(1)))).digest('hex'),a.sha256,a.file);assert.match(a.sourceFile,/^https:\/\/(cn\.control4\.com|docs\.control4\.com|www\.snapav\.com)\//);}
 const imgs=[...html.matchAll(/<img src="([^"]+)"[^>]+width="(\d+)" height="(\d+)"/g)];assert.equal(imgs.length,3);
 for(const [,src,w,h]of imgs)assert.deepEqual(r.assets.find(a=>a.file===src).dimensions,[+w,+h]);
 assert.match(r.assets.find(a=>a.file.endsWith('dimmer-original.png')).transformation,/CMYK converted to browser RGB/);
 assert.equal([...html.matchAll(/target="_blank" rel="noopener" aria-label="[^"]+\(opens a new tab\)"/g)].length,3);
 assert.match(html,/\.photo img\{[^}]*object-fit:contain/);assert.doesNotMatch(html,/object-fit:\s*cover|contemporary-front-blue|touchscreen-evening/);
});
test('Contemporary reading aids, single attributed CTA and shared analytics path remain',()=>{
 assert.match(html,/<main id="main-content" class="wrap" tabindex="-1">/);assert.match(html,/<a class="skip-link" href="#main-content">/);
 assert.match(html,/<details class="jump"><summary>/);assert.match(html,/<details class="spec-details"><summary>/);assert.match(html,/@media\(prefers-reduced-motion:reduce\)/);
 assert.equal([...html.matchAll(/class="btn"/g)].length,1);assert.ok(html.includes(`/contact/?source=blog-guide&amp;guide=${slug}#booking`));
 assert.match(html,/microsoft-clarity\.js/);assert.match(html,/site-chrome\.js/);assert.doesNotMatch(html,/blog-reader-tools\.js|<form\b|FAQPage|aggregateRating|CEDIA|1475625250840344/);
});
test('Contemporary social, catalog and hub use the same full-room photo without hover crop',()=>{
 const image=`/blogs/${slug}/images/manufacturer/contemporary-room.webp`,p=JSON.parse(read('blogs/blog-data.json')).posts.find(p=>p.slug===slug),hub=read('blogs/index.html');
 assert.equal(p.heroImage,image);assert.equal(p.updatedDate,'2026-10-19');assert.equal(p.publishedDate,'2026-07-26');assert.equal(p.readingTime,6);assert.equal(schema.image,'https://denalitechs.com'+image);
 assert.ok(hub.includes(`src="${image}"`));assert.match(hub,/fetch\('\/blogs\/blog-data\.json', \{ cache: 'no-cache' \}\)/);
 assert.match(hub,/\.blog-card-image-link\[href="\/blogs\/control4-contemporary-keypad-guide\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
