const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),slug='luma-camera-model-comparison',html=read(`blogs/${slug}/index.html`);
const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
test('Luma preserves established identity, publication and six reader-tool deep links',()=>{
 assert.match(html,/<title>Luma Camera Comparison Guide \| Denali Tech<\/title>/);assert.match(html,/<h1 id="article-title">Which Luma camera goes in each location\?<\/h1>/);
 assert.equal(schema.mainEntityOfPage,`https://denalitechs.com/blogs/${slug}/`);assert.equal(schema.datePublished,'2026-07-13');assert.equal(schema.dateModified,'2026-10-19');
 for(const id of ['start-with-the-job-each-camera-must-perform','the-three-core-luma-camera-tiers','bullet-turret-or-dome','4mp-smart-tracking-ptz-with-25-optical-zoom','other-specialty-choices','core-camera-comparison'])assert.ok(html.includes(`id="${id}"`),id);
 assert.match(html,/"@type":"BreadcrumbList"/);
});
test('Luma camera claims distinguish actual model suffixes, fixed lenses and lighting needs',()=>{
 for(const model of ['LUM-220-IP-TFW','LUM-520-IP-BFCW','LUM-820-IP-TFHB'])assert.ok(html.includes(model));
 assert.match(html,/2MP, 1920 × 1080/);assert.match(html,/5MP, 2592 × 1944/);assert.match(html,/8MP, 3840 × 2160/);
 assert.match(html,/fixed-lens model does not have optical zoom/);assert.match(html,/ordinary 820 IR cameras do not inherit every Hybrid feature/);
 assert.match(html,/does not mean color without any light/);assert.match(html,/conflicting 8MP feature bullet/);assert.match(html,/not a guaranteed identification distance/);
 assert.doesNotMatch(html,/Maximum detail|invisible IR|all three families are current/i);
});
test('Specialty camera power and coverage limits are explicit and model-specific',()=>{
 assert.match(html,/PoE\+ \(802\.3at\), up to 24W/);assert.match(html,/cannot look in every direction at once/);
 assert.match(html,/60W PoE source/);assert.match(html,/802\.3bt/);assert.match(html,/ordinary PoE or PoE\+ camera port is not enough/i);
 assert.match(html,/Wi-Fi is its network connection, not battery power/);assert.match(html,/12MP LUM-1220-IP-FE-W/);assert.match(html,/excludes it from Luma Insights support/);
});
test('Recorder budgets, supplied drives and retention are not conflated',()=>{
 assert.match(html,/LUM-121-NVR-4CH-2T/);assert.match(html,/LUM-221-NVR-8CH-4T/);assert.match(html,/48W total PoE budget/);assert.match(html,/120W total PoE budget/);assert.match(html,/shared—not 120W at each port/);
 assert.match(html,/supplied-drive variant is not the same thing/);assert.match(html,/32TB total maximum/);assert.match(html,/do not promise 36TB/);
 assert.match(html,/No drive size guarantees a fixed number of days/);assert.match(html,/Recording capacity, simultaneous playback and multi-camera display limits are different/);
});
test('Insights distinguishes event history, Bridge capacity, cloud service and recognition limits',()=>{
 assert.match(html,/active cloud-services subscription/);assert.match(html,/up to four monitored IP cameras and four areas of interest per camera/);
 assert.match(html,/event history, not seven days of continuous video/);assert.match(html,/Connect or existing 4Sight eligibility needs checking for your system/);
 assert.match(html,/not a monitored security service/);assert.match(html,/recognition is not guaranteed/);assert.match(html,/Analytics can miss an event or generate a false alert/);
 assert.ok(html.includes('/blogs/control4-connect-subscription-guide/'));
});
test('Luma native product extractions and cover have verifiable full-frame provenance',()=>{
 const r=JSON.parse(read(`blogs/${slug}/images/manufacturer/asset-sources.json`));assert.equal(r.assets.length,14);assert.match(r.notes,/not an independent license grant/);
 for(const a of r.assets){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.file.slice(1)))).digest('hex'),a.sha256,a.file);if(a.sourceFile){assert.match(a.sourceFile,/^https:\/\/www\.snapav\.com\//);assert.equal(a.pdfPage,1);}else for(const f of a.sourceFiles)assert.ok(r.assets.some(a=>a.file===f));}
 const imgs=[...html.matchAll(/<img src="([^"]+)"[^>]+width="(\d+)" height="(\d+)"/g)];assert.equal(imgs.length,7);for(const[,src,w,h]of imgs)assert.deepEqual(r.assets.find(a=>a.file===src).dimensions,[+w,+h]);
 assert.equal([...html.matchAll(/target="_blank" rel="noopener" aria-label="[^"]+\(opens a new tab\)"/g)].length,7);
 assert.match(html,/object-fit:contain/);assert.doesNotMatch(html,/object-fit:\s*cover|luma-x20-family-blue|luma-insights-mobile-blue|luma-x20-rack-install/);
});
test('Luma native disclosure, keyboard entry and single inquiry avoid duplicated reader panels',()=>{
 assert.match(html,/<main id="main-content" class="wrap" tabindex="-1">/);assert.match(html,/<a class="skip-link" href="#main-content">/);assert.match(html,/<details class="jump"><summary>/);
 assert.equal([...html.matchAll(/<details class="spec-details/g)].length,3);assert.equal([...html.matchAll(/class="btn"/g)].length,1);assert.ok(html.includes(`/contact/?source=blog-guide&amp;guide=${slug}#booking`));
 assert.match(html,/prefers-reduced-motion/);assert.match(html,/microsoft-clarity\.js/);assert.match(html,/site-chrome\.js/);
 assert.doesNotMatch(html,/blog-reader-tools\.js|<form\b|<table\b|min-width:1060px|FAQPage|aggregateRating|CEDIA|1475625250840344/);
});
test('Luma social and catalog cover match the uncropped static and dynamic hub',()=>{
 const image=`/blogs/${slug}/images/manufacturer/luma-camera-guide-cover.webp`,p=JSON.parse(read('blogs/blog-data.json')).posts.find(p=>p.slug===slug),hub=read('blogs/index.html');
 assert.equal(p.heroImage,image);assert.equal(schema.image,'https://denalitechs.com'+image);assert.equal(p.updatedDate,'2026-10-19');assert.equal(p.publishedDate,'2026-07-13');assert.equal(p.readingTime,8);
 assert.ok(hub.includes(`src="${image}"`));assert.match(hub,/fetch\('\/blogs\/blog-data\.json', \{ cache: 'no-cache' \}\)/);
 assert.match(hub,/\.blog-card-image-link\[href="\/blogs\/luma-camera-model-comparison\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
