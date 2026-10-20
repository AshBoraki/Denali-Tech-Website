const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),slug='control4-garage-door-gate-automation-guide',html=read('blogs/'+slug+'/index.html'),schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
test('Garage guide preserves canonical, publication and six existing deep links',()=>{
 assert.equal(schema.datePublished,'2026-07-13');assert.equal(schema.dateModified,'2026-10-19');assert.equal(schema.mainEntityOfPage,'https://denalitechs.com/blogs/'+slug+'/');
 for(const id of ['the-six-layers-of-a-complete-system','garage-doors-and-driveway-gates-are-not-the-same-project','status-needs-more-than-two-words','compare-the-control-and-feedback-paths','put-the-useful-information-in-one-place','automation-must-never-bypass-entrapment-protection'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/"@type":"BreadcrumbList"/);
});
test('Garage status guidance separates a command, one contact, measured movement and stale status',()=>{
 assert.match(html,/not proof that a door closed or that its path is safe/);assert.match(html,/not confirmed closed/);assert.match(html,/not “fully open\.”/);
 assert.match(html,/Elapsed time after a command is only an estimate/);assert.match(html,/Missing, stale or contradictory feedback/);
 assert.match(html,/Not every driver or interface provides all the states/);assert.match(html,/does not separately prove the door is locked/);
});
test('Garage compatibility guidance qualifies toggle inputs and the historical bundle',()=>{
 assert.match(html,/toggle input may open, stop or close/);assert.match(html,/Do not keep resending commands/);
 assert.match(html,/working opener app does not prove Control4 compatibility/);assert.match(html,/proprietary signaling/);
 assert.match(html,/data sheet is dated January 2018/);assert.match(html,/not proof that every current opener accepts/);assert.match(html,/or that the package is currently available/);
});
test('Garage safety guidance never substitutes analytics or software for operator protection',()=>{
 for(const s of ['not replacements for required pedestrian entrapment protection','software delay or spoken smart-home announcement does not by itself satisfy','Do not program repeated close attempts around an operator’s safety shutdown','Never bypass a protection device','person, pet or vehicle as an obstruction test','not a wiring plan, site safety assessment or compliance certification'])assert.ok(html.includes(s));
 assert.match(html,/16 CFR Part 1211 as the mandatory U.S. standard/);assert.match(html,/ANSI\/CAN\/UL 325/);assert.match(html,/ASTM F2200/);
 assert.match(html,/adding Control4 is not a safety certification/);
});
test('Garage access, cloud service and emergency advice have clear limits',()=>{
 assert.match(html,/Neither proves the gate’s path is clear/);assert.match(html,/feature documented for a smart lock/);
 assert.match(html,/older system’s eligible legacy service/);assert.match(html,/Backup power protects only the equipment it actually supplies/);
 assert.match(html,/battery in the opener does not keep the home router/);assert.match(html,/do not improvise a release/);
 assert.match(html,/Do not perform hazardous outage or obstruction tests yourself/);assert.ok(html.includes('/blogs/control4-connect-subscription-guide/'));
});
test('Garage illustrations retain whole framing, original screenshot access and provenance hashes',()=>{
 const r=JSON.parse(read('blogs/'+slug+'/images/manufacturer/asset-sources.json'));assert.equal(r.assets.length,4);assert.match(r.notes,/not an independent license grant/);
 for(const a of r.assets)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.file.slice(1)))).digest('hex'),a.sha256);
 const imgs=[...html.matchAll(/<img src="([^"]+)"[^>]+width="(\d+)" height="(\d+)"/g)];assert.equal(imgs.length,3);
 for(const[,src,w,h]of imgs)assert.deepEqual(r.assets.find(a=>a.file===src).dimensions,[+w,+h]);
 assert.equal([...html.matchAll(/target="_blank" rel="noopener" aria-label="[^"]+\(opens a new tab\)"/g)].length,4);
 assert.match(html,/object-fit:contain/);assert.doesNotMatch(html,/object-fit:\s*cover/);assert.match(html,/not a Denali installation or live controls/);assert.match(html,/not a live status screen/);
});
test('Garage page is client-facing, accessible and uses one attributed inquiry',()=>{
 assert.match(html,/<main id="main-content" class="wrap" tabindex="-1"><article>/);assert.match(html,/<a class="skip-link" href="#main-content">/);
 assert.match(html,/<details class="jump"><summary>/);assert.match(html,/<details class="sources"><summary>/);assert.equal([...html.matchAll(/<details><summary>/g)].length,3);
 assert.equal([...html.matchAll(/class="btn"/g)].length,1);assert.ok(html.includes('/contact/?source=blog-guide&amp;guide='+slug+'#booking'));
 assert.match(html,/microsoft-clarity\.js/);assert.match(html,/site-chrome\.js/);assert.match(html,/prefers-reduced-motion/);
 assert.doesNotMatch(html,/blog-reader-tools\.js|<form\b|<table\b|FAQPage|aggregateRating|CEDIA|A simple way to compare the options/i);
});
test('Garage metadata and static/dynamic blog cards use the same complete cover',()=>{
 const image='/blogs/'+slug+'/images/manufacturer/control4-arrival.webp',p=JSON.parse(read('blogs/blog-data.json')).posts.find(p=>p.slug===slug),hub=read('blogs/index.html');
 assert.equal(p.heroImage,image);assert.equal(schema.image,'https://denalitechs.com'+image);assert.equal(p.updatedDate,'2026-10-19');assert.equal(p.publishedDate,'2026-07-13');assert.equal(p.readingTime,9);
 assert.ok(hub.includes('src="'+image+'"'));assert.match(hub,/fetch\('\/blogs\/blog-data\.json', \{ cache: 'no-cache' \}\)/);
 assert.match(hub,/\.blog-card-image-link\[href="\/blogs\/control4-garage-door-gate-automation-guide\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
