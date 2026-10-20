const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('blogs/urc-remote-programming-guide/index.html');
const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const record=JSON.parse(read('blogs/urc-remote-programming-guide/images/manufacturer/asset-sources.json'));
test('URC programming retains established title, URL, publication and six deep links',()=>{
 assert.match(html,/<title>URC Remote Programming: Complete vs Total Control \| Denali Tech<\/title>/);
 assert.match(html,/<h1>URC remote programming: identify the system first<\/h1>/);
 assert.equal(schema.mainEntityOfPage,'https://denalitechs.com/blogs/urc-remote-programming-guide/');
 assert.equal(schema.datePublished,'2024-01-15T00:00:00+00:00');assert.equal(schema.dateModified,'2026-10-19');
 for(const id of ['complete-control-and-total-control-are-not-the-same','the-equipment-behind-a-complete-control-remote','what-can-be-programmed-realistically','why-the-original-project-file-matters','what-a-careful-service-visit-should-include','common-symptoms-and-what-they-can-mean'])assert.ok(html.includes(`id="${id}"`),id);
 assert.match(html,/"@type":"BreadcrumbList"/);
});
test('URC platform and command-path advice uses exact examples rather than blanket model-prefix claims',()=>{
 assert.match(html,/MX-990, for example, sends one-way commands/);
 assert.match(html,/TRC-1480 work with a compatible Total Control system controller/);
 assert.match(html,/MRF-350 sends infrared commands/);assert.match(html,/RFX-250 receives the radio signal/);
 assert.match(html,/That radio link is not WiFi/);assert.match(html,/matching model and regional versions/);
 assert.match(html,/Do not choose software or a replacement remote from appearance or the MX\/TRC prefix alone/);
 assert.match(html,/MRX-15 is a system controller, not an MRF-350 replacement/);
 assert.match(html,/Bluetooth remote does not automatically accept the infrared commands/);
});
test('Software guidance retains manufacturer policy, consumer eligibility and legacy date warning',()=>{
 assert.match(html,/Complete Control Programming \(CCP\)/);assert.match(html,/Accelerator and TC Flex/);
 assert.match(html,/Existing consumer CCP access has separate eligibility conditions/);
 assert.match(html,/https:\/\/www.urc-automation.com\/legal\/ccp-software-license-agreement\//);
 assert.match(html,/Do not use an unofficial software download/);
 assert.match(html,/MX-900 \/ KP-900 owners/);assert.match(html,/before September 2013/);assert.match(html,/can disable newer units/);
 assert.match(html,/https:\/\/www.urc-automation.com\/support\//);
});
test('Service guidance protects project files, privacy and working equipment without recovery guarantees',()=>{
 assert.match(html,/Do not assume any installer can recover the original program from every remote or controller/);
 assert.match(html,/Request a backup before changes/);assert.match(html,/not automatically supplied with your existing room's program/);
 assert.match(html,/Do not factory-reset the remote or controller/);assert.match(html,/Hide passwords, access codes and personal details/);
 assert.match(html,/Do not move a heavy rack or expose wiring/);assert.match(html,/Keep equipment that still does its job/);
 assert.doesNotMatch(html,/Use this section during a walkthrough|show the homeowner|before promising|guaranteed recovery/i);
});
test('Manufacturer provenance hashes and SVG framing preserve complete devices',()=>{
 assert.equal(record.assets.length,9);assert.match(record.notes,/not an independent license grant/);
 for(const a of record.assets){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.file.slice(1)))).digest('hex'),a.sha256,a.file);assert.match(a.sourceFile,/^https:\/\/www\.urc-automation\.com\//);}
 const photos=[...html.matchAll(/<svg viewBox="([\d ]+)"[^>]+><image href="([^"]+)"/g)];assert.equal(photos.length,4);
 for(const [,box,file]of photos){const [x,y,w,h]=box.split(' ').map(Number),a=record.assets.find(a=>a.file===file);assert.ok(a,file);const[l,t,r,b]=a.deviceBounds;assert.ok(l>=x&&t>=y&&r<=x+w&&b<=y+h,`${file} is clipped`);}
 assert.equal([...html.matchAll(/target="_blank" rel="noopener" aria-label="[^"]+\(opens a new tab\)"/g)].length,4);
 assert.match(html,/not interchangeable platforms or an actual-size comparison/);
 assert.match(html,/Screen artwork does not establish that every pictured service works/);
 assert.doesNotMatch(html,/object-fit:\s*cover/);
});
test('Native reading aids retain keyboard, mobile reflow and one main service action',()=>{
 assert.match(html,/<a class="skip-link" href="#main-content">/);assert.match(html,/<main id="main-content" class="wrap" tabindex="-1">/);
 assert.match(html,/<details class="jump"><summary>/);assert.match(html,/<details class="spec-details"><summary>/);
 assert.equal([...html.matchAll(/<details><summary>/g)].length,4);assert.equal([...html.matchAll(/class="btn"/g)].length,1);
 assert.match(html,/@media\(prefers-reduced-motion:reduce\)/);assert.match(html,/@media\(max-width:600px\)/);
 assert.doesNotMatch(html,/blog-reader-tools\.js|copyToClipboard|<form\b|FAQPage|aggregateRating/);
});
test('Related reviews, service path and existing analytics are retained',()=>{
 for(const slug of ['urc-mx-990-review','control4-vs-urc-comparison','questions-to-ask-installer'])assert.ok(html.includes('href="/blogs/'+slug+'/"'));
 assert.ok(html.includes('/urc-programming-chicago/?source=blog-guide&amp;guide=urc-remote-programming-guide'));
 for(const token of ['GTM-MWPTRPDR','1475625250840344','microsoft-clarity.js','microsoft-uet.js'])assert.ok(html.includes(token));
});
test('URC cover agrees across article, catalog and static hub without hover cropping',()=>{
 const image='/blogs/urc-remote-programming-guide/images/manufacturer/urc-programming-cover.webp';
 const post=JSON.parse(read('blogs/blog-data.json')).posts.find(p=>p.slug==='urc-remote-programming-guide');
 assert.equal(post.heroImage,image);assert.equal(post.updatedDate,'2026-10-19');assert.equal(post.publishedDate,'2024-01-15');assert.equal(post.readingTime,6);
 assert.equal(schema.image,'https://denalitechs.com'+image);const hub=read('blogs/index.html');assert.ok(hub.includes(`src="${image}"`));
 assert.match(hub,/\.blog-card-image-link\[href="\/blogs\/urc-remote-programming-guide\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
