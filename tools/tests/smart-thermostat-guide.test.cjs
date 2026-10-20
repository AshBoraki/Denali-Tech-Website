const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),slug='control4-smart-thermostat-guide',read=f=>fs.readFileSync(path.join(root,f),'utf8'),html=read(`blogs/${slug}/index.html`),catalog=JSON.parse(read('blogs/blog-data.json')).posts;

test('new thermostat is a separate first-look guide, not an invented hands-on review',()=>{
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema.mainEntityOfPage,`https://denalitechs.com/blogs/${slug}/`);
 assert.match(schema.headline,/First Look/);assert.equal(schema.datePublished,'2026-10-20');
 assert.match(html,/source-based first look, not a hands-on review/);
 assert.match(html,/certification uses C4-SMART-THERM; the ADI studio assets use C4-SMART-THERM-U/);
 assert.match(html,/does not use the older Aprilaire product page as evidence/);
 assert.ok(read('blogs/control4-climate-control-system-guide/index.html').includes(`/blogs/${slug}/`));
});
test('thermostat features are attributed and unsupported installation claims are excluded',()=>{
 for(const text of ['4682834','5-inch capacitive touchscreen','on-device occupancy sensor','VOC air-quality sensor','Doorbell camera streaming','do not assume Chime Pro compatibility','not guarantee a particular reduction','does not verify a drop-in replacement','minimum Control4 software version'])assert.ok(html.includes(text),text);
 assert.doesNotMatch(html,/works with every|guaranteed savings|OS [234]\.\d|24VAC|<table\b|CEDIA|aggregateRating|FAQPage/i);
 assert.equal([...html.matchAll(/class="btn"/g)].length,1);
 assert.ok(html.includes(`/contact/?source=blog-guide&amp;guide=${slug}#booking`));
});
test('thermostat has two purposeful front/rear photos with traceable full-frame originals',()=>{
 const manifest=JSON.parse(read(`blogs/${slug}/images/asset-sources.json`));assert.equal(manifest.assets.length,4);
 assert.deepEqual(manifest.activeArticleImages,['control4-smart-thermostat-front.webp','control4-smart-thermostat-back.webp']);
 assert.match(manifest.retainedAssets,/no longer displayed/);
 assert.match(manifest.notes,/not an independent license grant/);assert.doesNotMatch(JSON.stringify(manifest),/Expires=|Signature=|KeyName=/);
 for(const a of manifest.assets){
  const bytes=fs.readFileSync(path.join(root,a.file));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256);
  assert.ok(a.dimensions[0]<=a.sourceDimensions[0]&&a.dimensions[1]<=a.sourceDimensions[1]);
  assert.ok(Math.abs(a.dimensions[0]/a.dimensions[1]-a.sourceDimensions[0]/a.sourceDimensions[1])<.002);
  assert.match(a.changes,/alpha transparency retained/);
 }
 assert.equal([...html.matchAll(/<img /g)].length,2);
 for(const[,src,w,h]of html.matchAll(/<img src="([^"]+)" width="(\d+)" height="(\d+)"/g))assert.deepEqual(manifest.assets.find(a=>a.file.endsWith(src.slice(7))).dimensions,[+w,+h]);
 assert.match(html,/object-fit:contain/);assert.doesNotMatch(html,/object-fit:\s*cover|transform:\s*scale/);
});
test('rear photo replaces repetitive angles without implying wiring or mounting compatibility',()=>{
 assert.match(html,/What sits behind the screen/);
 assert.ok(html.includes('control4-smart-thermostat-back.webp'));
 assert.doesNotMatch(html,/control4-smart-thermostat-(left|right)\.webp|Left-angle view|Right-angle view|three (clear|official) product views/);
 assert.match(html,/not a wiring diagram or a photograph of the separate wall base/);
 assert.match(html,/rear product photo cannot establish that it will fit the old mounting/);
 assert.match(html,/6ms3gcfwthr6cb9g4k2n2jqn/);
});
test('thermostat navigation and discovery metadata remain synchronized',()=>{
 const p=catalog.find(p=>p.slug===slug);assert.ok(p);assert.equal(p.heroImage,`/blogs/${slug}/images/control4-smart-thermostat-front.webp`);
 for(const file of ['blogs/index.html','blogs/rss.xml','sitemap.xml'])assert.ok(read(file).includes(`/blogs/${slug}/`),file);
 assert.match(html,/<main id="main-content" class="wrap" tabindex="-1"><article>/);
 assert.match(html,/<details class="jump">/);assert.match(html,/<details class="sources">/);assert.match(html,/prefers-reduced-motion/);
 assert.match(read('blogs/index.html'),/\.blog-card-image-link\[href="\/blogs\/control4-smart-thermostat-guide\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
 assert.doesNotMatch(html,/Use this section during|blog-reader-tools\.js|<form\b/i);
});
