const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),slug='what-is-control4-guide',html=read('blogs/'+slug+'/index.html'),schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
test('What is Control4 preserves title, canonical, publication and original six deep links',()=>{
 assert.match(html,/<title>What Is Control4\? Homeowner Guide \| Denali Tech<\/title>/);assert.match(html,/<h1 id="article-title">What is Control4\?<\/h1>/);
 assert.equal(schema.datePublished,'2025-01-06');assert.equal(schema.dateModified,'2026-10-19');assert.equal(schema.mainEntityOfPage,'https://denalitechs.com/blogs/'+slug+'/');
 for(const id of ['what-is-control4-in-simple-terms','how-does-control4-work','what-can-control4-control','control4-key-features','is-control4-right-for-your-home','control4-vs-diy-smart-home-solutions'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/"@type":"BreadcrumbList"/);
});
test('Control4 introduction separates controller, connection, programming and device capabilities',()=>{
 assert.match(html,/not just a remote or an app/);assert.match(html,/Software on the primary controller, called Director/);assert.match(html,/driver is the software connection/);
 assert.match(html,/not a compatibility guarantee/);assert.match(html,/may not report its actual state/);
 assert.doesNotMatch(html,/controls all your smart devices|Control everything from one place|no more switching|everything smart.*reliable/i);
});
test('Control4 subscription guidance follows optional X4 policy and distinguishes older accounts',()=>{
 assert.match(html,/On X4, Connect is optional for local app use/);assert.match(html,/older OS 3 account/);assert.match(html,/Connect or legacy 4Sight/);
 assert.match(html,/curated Routines and HomeKit/);assert.match(html,/optional-for-new-x4-systems/);assert.ok(html.includes('/blogs/control4-connect-subscription-guide/'));
 assert.doesNotMatch(html,/all new.*require Control4 Connect|Connect subscription is required for every|April 23, 2024/);
});
test('Control4 local operation does not imply internet, network and power are interchangeable',()=>{
 assert.match(html,/internet outage are also different from a network or power failure/);assert.match(html,/cloud services and remote access cannot/);
 assert.match(html,/loses power, affected functions can stop/);assert.match(html,/Streaming accounts and content subscriptions remain separate/);
 assert.match(html,/not replace a monitored alarm service/);assert.match(html,/protective devices/);
});
test('Control4 ownership guidance is practical, neutral and scope-based',()=>{
 assert.match(html,/Do not replace working products/);assert.match(html,/Neither approach is automatically trouble-free/);
 assert.match(html,/not automatically a local labor or unlimited-support agreement/);assert.match(html,/account email/);
 assert.match(html,/Do not factory-reset inherited equipment/);assert.match(html,/moving a controller alone does not recreate/);
 assert.doesNotMatch(html,/Control4 systems can be moved to your new home|around since 2003|all your questions|Final Thoughts/);
});
test('Control4 introduction uses traceable native whole-frame manufacturer images',()=>{
 const r=JSON.parse(read('blogs/'+slug+'/images/manufacturer/asset-sources.json'));assert.equal(r.assets.length,2);assert.match(r.notes,/not an independent license grant/);
 for(const a of r.assets){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.file.slice(1)))).digest('hex'),a.sha256);assert.match(a.sourceFile,/^https:\/\/cdn.prod.website-files.com\//);}
 const imgs=[...html.matchAll(/<img src="([^"]+)"[^>]+width="(\d+)" height="(\d+)"/g)];assert.equal(imgs.length,2);for(const[,src,w,h]of imgs)assert.deepEqual(r.assets.find(a=>a.file===src).dimensions,[+w,+h]);
 assert.match(html,/object-fit:contain/);assert.doesNotMatch(html,/object-fit:\s*cover/);assert.match(html,/Not a Denali Tech project photograph/);
 assert.equal([...html.matchAll(/target="_blank" rel="noopener" aria-label="[^"]+\(opens a new tab\)"/g)].length,2);
});
test('Control4 introduction has native disclosures, keyboard entry, one inquiry and retained tracking',()=>{
 assert.match(html,/<main id="main-content" class="wrap" tabindex="-1"><article>/);assert.match(html,/<a class="skip-link" href="#main-content">/);
 assert.match(html,/<details class="jump"><summary>/);assert.match(html,/<details class="sources"><summary>/);assert.equal([...html.matchAll(/<details><summary>/g)].length,4);
 assert.equal([...html.matchAll(/class="btn"/g)].length,1);assert.ok(html.includes('/contact/?source=blog-guide&amp;guide='+slug+'#booking'));
 for(const script of ['microsoft-clarity.js','microsoft-uet.js','site-chrome.js'])assert.ok(html.includes(script));
 assert.equal([...html.matchAll(/window\.fbq\("init", pixelId\)/g)].length,1);
 assert.match(html,/prefers-reduced-motion/);assert.doesNotMatch(html,/blog-reader-tools\.js|<form\b|FAQPage|aggregateRating|CEDIA|function loadGTM/);
 assert.equal([...html.matchAll(/<\/main>/g)].length,1);assert.equal([...html.matchAll(/<\/article>/g)].length,1);
});
test('Control4 introduction thumbnail, metadata and catalog remain consistent',()=>{
 const image='/blogs/'+slug+'/images/manufacturer/control4-touchscreen-home.webp',p=JSON.parse(read('blogs/blog-data.json')).posts.find(p=>p.slug===slug),hub=read('blogs/index.html');
 assert.equal(p.heroImage,image);assert.equal(schema.image,'https://denalitechs.com'+image);assert.equal(p.updatedDate,'2026-10-19');assert.equal(p.publishedDate,'2025-01-06');assert.equal(p.readingTime,8);
 assert.ok(hub.includes('src="'+image+'"'));assert.match(hub,/fetch\('\/blogs\/blog-data\.json', \{ cache: 'no-cache' \}\)/);
 assert.match(hub,/\.blog-card-image-link\[href="\/blogs\/what-is-control4-guide\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
