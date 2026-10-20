const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),slug='control4-pool-spa-automation-guide',html=read(`blogs/${slug}/index.html`),schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
test('Pool guide keeps publication, canonical identity and original six deep links',()=>{
 assert.match(html,/<title>Control4 Pool &amp; Spa Automation Planning Guide \| Denali Tech<\/title>/);
 assert.equal(schema.datePublished,'2026-07-13');assert.equal(schema.dateModified,'2026-10-19');assert.equal(schema.mainEntityOfPage,`https://denalitechs.com/blogs/${slug}/`);
 for(const id of ['one-system-two-clear-responsibilities','current-integration-starting-points','check-the-exact-chain-not-only-the-logo','what-the-homeowner-should-see','what-spa-ready-really-means','scenes-that-make-sense'])assert.ok(html.includes(`id="${id}"`));
 assert.match(html,/"@type":"BreadcrumbList"/);
});
test('Pool catalog examples do not imply certification, all features or local-only IP',()=>{
 for(const name of ['Pentair IntelliCenter','Jandy iAquaLink IQ900','Hayward OmniLogic','Fluidra ConnectMyPool'])assert.ok(html.includes(name));
 assert.match(html,/IP does not, by itself, tell you whether a connection is local or cloud-dependent/);
 assert.match(html,/not marked certified/);assert.match(html,/not confirmation that your installation supports every function/);
 assert.match(html,/driver name, developer and version/);assert.match(html,/recurring charges and who supports each part/);
});
test('Pool requested settings, screen readings and readiness are distinguished',()=>{
 assert.match(html,/requested setting is not proof/);assert.match(html,/Dashes show unavailable readings/);assert.match(html,/not a live system/);
 assert.match(html,/Color selection, equipment faults and “ready” notifications need separate verification/);
 assert.match(html,/Start spa warm-up/);assert.match(html,/not<\/strong> mean the water is safe to enter/);
 assert.match(html,/no single dependable warm-up time/);assert.match(html,/not a universal valve, pump or heater programming recipe/);
});
test('Pool entertainment scenes do not bypass equipment or move covers unattended',()=>{
 assert.match(html,/Do not use a generic “all off” command/);assert.match(html,/Keep automatic pool-cover movement out/);
 assert.match(html,/not an unattended whole-home shortcut/);assert.match(html,/not a substitute for active adult supervision/);
 assert.match(html,/drain cover is loose, broken or missing/);assert.match(html,/app status is not a water-quality assessment/);
 assert.doesNotMatch(html,/VGB-compliant drains|Verification before sale|Give the homeowner|A simple way to compare the options/);
});
test('Pool outage and winter advice has equipment-specific boundaries',()=>{
 assert.match(html,/different failure conditions/);assert.match(html,/does not mean it can run pumps or heaters during a power outage/);
 assert.match(html,/not proof that every attached device is automatically covered/);assert.match(html,/Do not change those settings from a general guide/);
 assert.match(html,/not a substitute for professional winterization/);assert.match(html,/winterized or serviced equipment from being restarted/);
 assert.match(html,/pool contractor and electrician/);
});
test('Pool manufacturer sources preserve native image dimensions, attribution and hashes',()=>{
 const r=JSON.parse(read(`blogs/${slug}/images/manufacturer/asset-sources.json`));assert.equal(r.assets.length,3);assert.match(r.notes,/not an independent license grant/);
 for(const a of r.assets)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.file.slice(1)))).digest('hex'),a.sha256,a.file);
 const imgs=[...html.matchAll(/<img src="([^"]+)"[^>]+width="(\d+)" height="(\d+)"/g)];assert.equal(imgs.length,2);
 for(const[,src,w,h]of imgs)assert.deepEqual(r.assets.find(a=>a.file===src).dimensions,[+w,+h]);
 assert.equal([...html.matchAll(/target="_blank" rel="noopener" aria-label="[^"]+\(opens a new tab\)"/g)].length,2);
 assert.match(html,/object-fit:contain/);assert.doesNotMatch(html,/object-fit:\s*cover|control4-pool-brands/);
 assert.match(html,/Not a Denali Tech project/);assert.match(html,/CPSC Pool Safely/);
});
test('Pool guide has calm native navigation, one inquiry and shared analytics',()=>{
 assert.match(html,/<main id="main-content" class="wrap" tabindex="-1"><article>/);assert.match(html,/<a class="skip-link" href="#main-content">/);
 assert.match(html,/<details class="jump"><summary>/);assert.match(html,/<details class="sources"><summary>/);
 assert.equal([...html.matchAll(/class="btn"/g)].length,1);assert.ok(html.includes(`/contact/?source=blog-guide&amp;guide=${slug}#booking`));
 assert.match(html,/prefers-reduced-motion/);assert.match(html,/microsoft-clarity\.js/);assert.match(html,/site-chrome\.js/);
 assert.doesNotMatch(html,/blog-reader-tools\.js|<form\b|<table\b|FAQPage|aggregateRating|CEDIA|1475625250840344/);
});
test('Pool static and dynamic hub retain the complete photo and matching metadata',()=>{
 const image=`/blogs/${slug}/images/manufacturer/control4-outdoor-original.webp`,p=JSON.parse(read('blogs/blog-data.json')).posts.find(p=>p.slug===slug),hub=read('blogs/index.html');
 assert.equal(p.heroImage,image);assert.equal(schema.image,'https://denalitechs.com'+image);assert.equal(p.updatedDate,'2026-10-19');assert.equal(p.publishedDate,'2026-07-13');assert.equal(p.readingTime,7);
 assert.ok(hub.includes(`src="${image}"`));assert.match(hub,/fetch\('\/blogs\/blog-data\.json', \{ cache: 'no-cache' \}\)/);
 assert.match(hub,/\.blog-card-image-link\[href="\/blogs\/control4-pool-spa-automation-guide\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
