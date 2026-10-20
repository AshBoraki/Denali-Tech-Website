const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),slug='control4-scenes-routines-guide',html=read('blogs/'+slug+'/index.html'),schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
test('Scene guide preserves title, publication, canonical and original six deep links',()=>{
 assert.match(html,/<title>Control4 Scenes and Routines: A Homeowner Guide \| Denali Tech<\/title>/);
 assert.equal(schema.datePublished,'2026-06-03');assert.equal(schema.dateModified,'2026-10-19');assert.equal(schema.mainEntityOfPage,'https://denalitechs.com/blogs/'+slug+'/');
 for(const id of ['scene-and-routine-are-related-not-identical','seven-moments-worth-simplifying','one-experience-across-the-wall-and-the-app','how-one-useful-automation-gets-designed','small-guardrails-make-automation-feel-trustworthy','the-simple-experience-depends-on-a-solid-foundation'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/"@type":"BreadcrumbList"/);
});
test('Scene guide distinguishes lighting scenes, programmed activities and X4 templates',()=>{
 assert.match(html,/lighting scene recalls selected light levels/);assert.match(html,/additional programming/);
 assert.match(html,/scene is not necessarily manual-only/);assert.match(html,/not a new name for every existing Control4 automation/);
 assert.match(html,/choices based on the devices in your project/);assert.match(html,/does not automatically require an X4 upgrade/);
});
test('Scene examples have an accurate count and do not imply security success',()=>{
 assert.match(html,/>Four moments worth simplifying</);assert.equal([...html.matchAll(/class="moment"/g)].length,4);
 for(const s of ['Good morning','Dinner','Movie','Goodnight'])assert.ok(html.includes('<h3>'+s+'</h3>'));
 assert.match(html,/not proof that every door closed or the alarm armed successfully/);assert.match(html,/avoid cutting power to the controller/);
 assert.doesNotMatch(html,/>Seven moments worth simplifying</);
});
test('Scene guidance explains one-off skips, recurring events and manual-control limits',()=>{
 assert.match(html,/Skipping once is different from disabling a recurring schedule/);
 assert.match(html,/manual adjustment may not cancel the next automation/);assert.match(html,/second scene press restores the previous settings/);
 assert.match(html,/not automatically a standalone fallback during controller or network failure/);
 assert.match(html,/command sent from a confirmed result/);assert.match(html,/not a replacement for those systems/);
});
test('Routines service and configuration requirements are qualified',()=>{
 assert.match(html,/Connect optional for local X4 app use/);assert.match(html,/curated Routines among Connect’s premium features/);
 assert.match(html,/Older OS 3 accounts/);assert.match(html,/does not mean every personalization feature/i);
 assert.match(html,/Not every template supports every condition/);assert.match(html,/separate from the scope and cost/);
 assert.ok(html.includes('/blogs/control4-connect-subscription-guide/'));assert.match(html,/Leave disruptive outage tests to your integrator/);
});
test('Scene guide uses three complete traceable images with original screenshot access',()=>{
 const r=JSON.parse(read('blogs/'+slug+'/images/manufacturer/asset-sources.json'));assert.equal(r.assets.length,5);assert.match(r.notes,/not an independent license grant/);
 for(const a of r.assets)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.file.slice(1)))).digest('hex'),a.sha256);
 const imgs=[...html.matchAll(/<img src="([^"]+)"[^>]+width="(\d+)" height="(\d+)"/g)];assert.equal(imgs.length,3);
 for(const[,src,w,h]of imgs)assert.deepEqual(r.assets.find(a=>a.file===src).dimensions,[+w,+h]);
 assert.equal([...html.matchAll(/target="_blank" rel="noopener" aria-label="[^"]+\(opens a new tab\)"/g)].length,3);
 assert.match(html,/object-fit:contain/);assert.match(html,/max-width:660px/);assert.doesNotMatch(html,/object-fit:\s*cover|min-height:430px|control4-connect-phone.webp/);
 assert.match(html,/original keypad inset/);assert.match(html,/not a live status display/);
});
test('Scene guide has one attributed inquiry, native navigation and shared analytics',()=>{
 assert.match(html,/<main id="main-content" class="wrap" tabindex="-1"><article>/);assert.match(html,/<a class="skip-link" href="#main-content">/);
 assert.match(html,/<details class="jump"><summary>/);assert.match(html,/<details class="sources"><summary>/);
 assert.equal([...html.matchAll(/<details><summary>/g)].length,3);assert.equal([...html.matchAll(/class="btn"/g)].length,1);
 assert.ok(html.includes('/contact/?source=blog-guide&amp;guide='+slug+'#booking'));assert.match(html,/microsoft-clarity\.js/);assert.match(html,/site-chrome\.js/);
 assert.match(html,/prefers-reduced-motion/);assert.doesNotMatch(html,/blog-reader-tools\.js|<form\b|FAQPage|aggregateRating|CEDIA/);
});
test('Scene metadata and static/dynamic hub use the same uncropped cover',()=>{
 const image='/blogs/'+slug+'/images/manufacturer/control4-goodnight-example.webp',p=JSON.parse(read('blogs/blog-data.json')).posts.find(p=>p.slug===slug),hub=read('blogs/index.html');
 assert.equal(p.heroImage,image);assert.equal(schema.image,'https://denalitechs.com'+image);assert.equal(p.updatedDate,'2026-10-19');assert.equal(p.publishedDate,'2026-06-03');assert.equal(p.readingTime,7);
 assert.ok(hub.includes('src="'+image+'"'));assert.match(hub,/fetch\('\/blogs\/blog-data\.json', \{ cache: 'no-cache' \}\)/);
 assert.match(hub,/\.blog-card-image-link\[href="\/blogs\/control4-scenes-routines-guide\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
