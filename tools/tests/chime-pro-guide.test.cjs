const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),slug='control4-chime-pro-video-doorbell-guide',read=f=>fs.readFileSync(path.join(root,f),'utf8'),html=read(`blogs/${slug}/index.html`),catalog=JSON.parse(read('blogs/blog-data.json')).posts;

test('Chime Pro is a distinct sourced guide with original Chime cross-links',()=>{
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema.mainEntityOfPage,`https://denalitechs.com/blogs/${slug}/`);
 assert.equal(schema.datePublished,'2026-10-20');assert.equal(schema.dateModified,'2026-11-21');
 assert.match(html,/We haven’t independently tested image quality or reliability/);
 assert.ok(html.includes('/blogs/control4-chime-video-doorbell-planning-guide/'));
 assert.ok(read('blogs/control4-chime-video-doorbell-planning-guide/index.html').includes(`/blogs/${slug}/`));
 assert.match(html,/"@type":"BreadcrumbList"/);
});
test('Chime Pro uses the current minimum OS and keeps exact product limits explicit',()=>{
 for(const term of ['802.3af Power over Ethernet','no Wi-Fi model','OS 4.3.0 or later','prerequisites and Composer setup both specify 4.3.0 or later','2560 × 1440','not a second 4K stream','package camera does not use infrared night vision','IP55','−4°F to 140°F','C4-VDB-IP-PRO-BL','C4-VDB-IP-PRO-BZ'])assert.ok(html.includes(term),term);
 assert.ok(html.includes('https://docs.adiglobal.com/1396358/Content/Topics/Prerequisites.htm'));
 assert.doesNotMatch(html,/\b4\.2\.1\b/);
 assert.doesNotMatch(html,/dual 4K|works with every|weatherproof guarantee|<table\b/i);
});
test('Chime Pro recording and alert guidance does not promise retention, detection or compatibility',()=>{
 for(const term of ['not compatible with Luma Bridge','Luma X20/X21','up to 256GB','not mean seven days of continuous cloud recording','Shadows and obstructions can affect detection','A person or package alert is not permission to unlock','Local storage is not the same thing as remote access during an outage'])assert.ok(html.includes(term),term);
 assert.match(html,/phone alerts away from home, check your .*Control4 Connect/);
 assert.ok(html.includes('/blogs/control4-connect-subscription-guide/'));
});
test('Chime Pro has six traceable whole-frame manufacturer assets without signed links',()=>{
 const record=JSON.parse(read(`blogs/${slug}/images/asset-sources.json`));assert.equal(record.assets.length,6);
 assert.match(record.notes,/not an independent license grant/);assert.doesNotMatch(JSON.stringify(record),/Expires=|Signature=|KeyName=/);
 for(const a of record.assets){
  const bytes=fs.readFileSync(path.join(root,a.file));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256);
  assert.ok(a.dimensions[0]<=a.sourceDimensions[0]);assert.ok(a.dimensions[1]<=a.sourceDimensions[1]);
  assert.ok(Math.abs(a.dimensions[0]/a.dimensions[1]-a.sourceDimensions[0]/a.sourceDimensions[1])<.002);
 }
 for(const[,src,w,h] of html.matchAll(/<img src="([^"]+)" width="(\d+)" height="(\d+)"/g)){
  assert.deepEqual(record.assets.find(a=>a.file.endsWith(src.slice('images/'.length))).dimensions,[+w,+h]);
 }
 const images=[...html.matchAll(/<img src="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(images.length,6);
 assert.equal(new Set(images).size,images.length);
 assert.match(html,/object-fit:contain/);assert.doesNotMatch(html,/object-fit:\s*cover|transform:\s*scale/);
 assert.match(html,/not photographs of Denali Tech installations/);
});
test('Chime Pro article has native navigation, optional detail and one attributed inquiry',()=>{
 assert.match(html,/<main id="main-content" class="wrap" tabindex="-1"><article>/);
 assert.match(html,/<a class="skip-link" href="#main-content">/);
 assert.match(html,/<details class="jump">/);assert.match(html,/<details class="specs">/);assert.match(html,/<details class="sources">/);
 assert.equal([...html.matchAll(/class="btn"/g)].length,1);
 assert.ok(html.includes(`/contact/?source=blog-guide&amp;guide=${slug}#booking`));
 assert.match(html,/prefers-reduced-motion/);assert.match(html,/microsoft-clarity\.js/);
 assert.doesNotMatch(html,/blog-reader-tools\.js|FAQPage|aggregateRating|<form\b|CEDIA|Use this section during/i);
});
test('the quick answer precedes the first image and technical detail does not block the main reading path',()=>{
 const hero=html.match(/<header class="hero">([\s\S]*?)<\/header>/)[1];
 const answer=hero.match(/<div class="quick"><p>(.*?)<\/p>/)[1];
 assert.match(answer,/Ethernet at the door/);
 assert.match(answer,/OS 4\.3\.0 or later/);
 assert.ok(hero.indexOf('class="quick"')<hero.indexOf('<img '));
 assert.ok(html.indexOf('id="wiring"')<html.indexOf('id="finishes"'));
 assert.match(html,/<details class="specs recording-options">\s*<summary>Compare the three recording options<\/summary>/);
 for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes('id="'+id+'"'),id);
});
test('Chime Pro is discoverable in the catalog, static hub, sitemap and RSS',()=>{
 const p=catalog.find(p=>p.slug===slug);assert.ok(p);assert.equal(p.heroImage,`/blogs/${slug}/images/chime-pro-entryway.webp`);
 assert.equal(p.readingTime,5);assert.equal(p.publishedDate,'2026-10-20');
 for(const file of ['blogs/index.html','blogs/rss.xml','sitemap.xml'])assert.ok(read(file).includes(`/blogs/${slug}/`),file);
 assert.ok(read('blogs/index.html').includes('src="'+p.heroImage+'"'));
 assert.match(read('blogs/index.html'),/\.blog-card-image-link\[href="\/blogs\/control4-chime-pro-video-doorbell-guide\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
