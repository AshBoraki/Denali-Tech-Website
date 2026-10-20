const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('blogs/lux-by-control4-keypad-guide/index.html');
const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
test('Lux retains established URL, title, H1, publication and six section links',()=>{
 assert.match(html,/<title>Lux by Control4 Keypad Guide \| Denali Tech<\/title>/);
 assert.match(html,/<h1 id="article-title">The keypad becomes part of the room<\/h1>/);
 assert.equal(schema.mainEntityOfPage,'https://denalitechs.com/blogs/lux-by-control4-keypad-guide/');
 assert.equal(schema.datePublished,'2026-07-26');assert.equal(schema.dateModified,'2026-10-19');
 for(const id of ['see-lux-at-the-wall','understand-the-lux-family','wired-or-wireless','choose-a-button-layout-that-stays-simple','see-the-finish-before-you-choose','plan-the-labels-around-real-routines'])assert.ok(html.includes(`id="${id}"`),id);
 assert.match(html,/"@type":"BreadcrumbList"/);assert.doesNotMatch(html,/Updated August 2/);
});
test('Lux distinguishes exact configurable, load-control, bus and auxiliary models',()=>{
 for(const model of ['C4-L-KC','C4-L-KDS','C4-L-KCB','C4-L-KA'])assert.ok(html.includes(model));
 assert.match(html,/It does not directly dim a connected lighting load/);
 assert.match(html,/not a line-voltage dimmer/);assert.match(html,/48V DC control point communicating over RS-485/);
 assert.match(html,/not another fully configurable scene keypad/);
 assert.doesNotMatch(html,/<h3>Keypad switch<\/h3>/i);
});
test('Wireless, power and retrofit guidance avoids no-wiring or no-neutral LED promises',()=>{
 assert.match(html,/use Zigbee, not your home's WiFi/);
 assert.match(html,/does not mean battery-powered or no electrical work/);
 assert.match(html,/not every switch can be exchanged directly/);
 assert.match(html,/AC installation requires a neutral/);
 assert.match(html,/incandescent-only limits/);assert.match(html,/not a general promise of no-neutral LED compatibility/);
 assert.match(html,/not automatically this wired-communication model/);
 assert.match(html,/qualified professional/);assert.match(html,/not a wiring or installation procedure/);
});
test('Lux layout examples follow six positions and preserve engraving/programming distinction',()=>{
 assert.match(html,/34 variations for the Lux Wired Keypad/);assert.match(html,/within six positions/);
 assert.match(html,/two triple-height/);assert.match(html,/three double-height/);assert.match(html,/six single-height/);
 assert.match(html,/five single-height buttons and one bottom up\/down assembly/);
 assert.match(html,/physical layout and Control4 programming must match/);
 assert.match(html,/changing caps alone does not update/i);assert.doesNotMatch(html,/class="keypad"/);
});
test('Lux finish and scene advice is customer-facing and does not turn photos into compatibility evidence',()=>{
 assert.match(html,/faceplate finish and button color are separate choices/);
 assert.match(html,/does not mean every button is metal/);
 assert.match(html,/not approving an exact color match/);
 assert.match(html,/not built-in scenes that every keypad includes/);
 assert.match(html,/not proof that every connected device completed an action/);
 assert.doesNotMatch(html,/Use this section during a walkthrough|show the homeowner|guaranteed|nighttime readability before choosing/i);
});
test('Lux manufacturer originals, display versions and cover have traceable matching hashes',()=>{
 const r=JSON.parse(read('blogs/lux-by-control4-keypad-guide/images/manufacturer/asset-sources.json'));
 assert.equal(r.assets.length,7);assert.match(r.notes,/not an independent license grant/);
 for(const a of r.assets){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.file.slice(1)))).digest('hex'),a.sha256,a.file);assert.match(a.sourceFile,/^https:\/\/www\.snapav\.com\//);}
 const imgs=[...html.matchAll(/<img src="([^"]+)"[^>]+width="(\d+)" height="(\d+)"/g)];assert.equal(imgs.length,3);
 for(const [,src,w,h]of imgs){const a=r.assets.find(a=>a.file===src);assert.deepEqual(a.dimensions,[+w,+h]);}
 assert.equal([...html.matchAll(/target="_blank" rel="noopener" aria-label="[^"]+\(opens a new tab\)"/g)].length,3);
 assert.match(html,/\.photo img\{[^}]*object-fit:contain/);assert.doesNotMatch(html,/object-fit:\s*cover|lux-front-blue|touchscreen-evening/);
});
test('Lux reading aids, contact attribution and original shared analytics path are retained',()=>{
 assert.match(html,/<main id="main-content" class="wrap" tabindex="-1">/);assert.match(html,/<a class="skip-link" href="#main-content">/);
 assert.match(html,/<details class="jump"><summary>/);assert.match(html,/<details class="spec-details"><summary>/);
 assert.match(html,/@media\(prefers-reduced-motion:reduce\)/);assert.equal([...html.matchAll(/class="btn"/g)].length,1);
 assert.ok(html.includes('/contact/?source=blog-guide&amp;guide=lux-by-control4-keypad-guide#booking'));
 assert.match(html,/microsoft-clarity\.js/);assert.match(html,/site-chrome\.js/);
 assert.doesNotMatch(html,/blog-reader-tools\.js|<form\b|FAQPage|aggregateRating|CEDIA|1475625250840344/);
});
test('Lux catalog and static hub share the same uncropped editorial cover and accurate date',()=>{
 const image='/blogs/lux-by-control4-keypad-guide/images/manufacturer/lux-keypad-guide-cover.webp';
 const p=JSON.parse(read('blogs/blog-data.json')).posts.find(p=>p.slug==='lux-by-control4-keypad-guide');
 assert.equal(p.heroImage,image);assert.equal(p.updatedDate,'2026-10-19');assert.equal(p.publishedDate,'2026-07-26');assert.equal(p.readingTime,6);
 assert.equal(schema.image,'https://denalitechs.com'+image);const hub=read('blogs/index.html');assert.ok(hub.includes(`src="${image}"`));
 assert.match(hub,/fetch\('\/blogs\/blog-data\.json', \{ cache: 'no-cache' \}\)/);
 assert.match(hub,/\.blog-card-image-link\[href="\/blogs\/lux-by-control4-keypad-guide\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
