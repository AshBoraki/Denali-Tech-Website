const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),slug='control4-chime-pro-video-doorbell-guide',read=f=>fs.readFileSync(path.join(root,f),'utf8'),html=read(`blogs/${slug}/index.html`),catalog=JSON.parse(read('blogs/blog-data.json')).posts;

test('Chime Pro is a distinct sourced guide with original Chime cross-links',()=>{
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema.mainEntityOfPage,`https://denalitechs.com/blogs/${slug}/`);
 assert.equal(schema.datePublished,'2026-10-20');assert.equal(schema.dateModified,'2026-10-20');
 assert.match(html,/documentation-based buying guide, not an independent image-quality or reliability test/);
 assert.ok(html.includes('/blogs/control4-chime-video-doorbell-planning-guide/'));
 assert.ok(read('blogs/control4-chime-video-doorbell-planning-guide/index.html').includes(`/blogs/${slug}/`));
 assert.match(html,/"@type":"BreadcrumbList"/);
});
test('Chime Pro source differences and exact product limits remain explicit',()=>{
 for(const term of ['802.3af Power over Ethernet','no Wi-Fi model','OS 4.3.0 or later','prerequisites page currently says 4.2.1','2560 × 1440','not a second 4K stream','IP55','−4°F to 140°F','C4-VDB-IP-PRO-BL','C4-VDB-IP-PRO-BZ'])assert.ok(html.includes(term),term);
 assert.doesNotMatch(html,/dual 4K|works with every|weatherproof guarantee|<table\b/i);
});
test('Chime Pro recording and alert guidance does not promise retention, detection or compatibility',()=>{
 for(const term of ['not compatible with Luma Bridge','Luma X20/X21','up to 256GB','not mean seven days of continuous cloud recording','not a guarantee that every event','identifying motion is not authorization to unlock','local storage is not the same thing as remote access during an outage'])assert.ok(html.includes(term),term);
 assert.match(html,/active|Connect for remote mobile alerts/);
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
 assert.equal([...html.matchAll(/<img /g)].length,7);
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
test('Chime Pro is discoverable in the catalog, static hub, sitemap and RSS',()=>{
 const p=catalog.find(p=>p.slug===slug);assert.ok(p);assert.equal(p.heroImage,`/blogs/${slug}/images/chime-pro-entryway.webp`);
 assert.equal(p.readingTime,9);assert.equal(p.publishedDate,'2026-10-20');
 for(const file of ['blogs/index.html','blogs/rss.xml','sitemap.xml'])assert.ok(read(file).includes(`/blogs/${slug}/`),file);
 assert.ok(read('blogs/index.html').includes('src="'+p.heroImage+'"'));
 assert.match(read('blogs/index.html'),/\.blog-card-image-link\[href="\/blogs\/control4-chime-pro-video-doorbell-guide\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
