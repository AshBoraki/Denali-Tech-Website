const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),slug='episode-whole-home-audio-planning-guide',html=read('blogs/'+slug+'/index.html'),schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
test('Episode guide preserves canonical, publication and original six section deep links',()=>{
 assert.equal(schema.datePublished,'2026-07-13');assert.equal(schema.dateModified,'2026-10-19');assert.equal(schema.mainEntityOfPage,'https://denalitechs.com/blogs/'+slug+'/');
 assert.match(html,/<title>Episode Speaker Comparison Guide \| Denali Tech<\/title>/);
 for(const id of ['start-with-the-zone-not-the-speaker-count','signature-3-5-and-7-series','how-the-main-episode-choices-compare','core-works-when-the-room-does-not-need-signature','impression-keeps-the-ceiling-quieter-visually','choose-size-and-type-for-the-job'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/"@type":"BreadcrumbList"/);
});
test('Signature comparison labels exact standard models without pretending to be a listening test',()=>{
 assert.equal([...html.matchAll(/class="speaker"/g)].length,3);
 for(const s of ['SIG-36-IC','SIG-56-IC','SIG-76-IC'])assert.match(html,new RegExp(s+' · 6-inch'));
 assert.match(html,/not a controlled listening test/);assert.match(html,/titanium-coated silk-dome tweeter/i);assert.match(html,/Honeycomb fiberglass Nomex/);assert.match(html,/woofer- and tweeter-level switches/);
 assert.match(html,/manufacturer lists these speakers individually/i);assert.match(html,/ES-CORE-36-IC is listed as a pair/);
});
test('Episode guide separates nominal size, cutout, grille and enclosure depth',()=>{
 for(const v of ['8.3-inch cutout','9.6-inch finished grille','4.8-inch mounting depth','depth increases to 6.2 inches','cutout is 102mm','grilles are 124mm'])assert.ok(html.includes(v));
 assert.match(html,/nominal 6-inch speaker does not need a 6-inch hole/);assert.match(html,/not a cutting template/);assert.match(html,/matching a hole does not establish/i);
});
test('Episode guide distinguishes passive hardware, source controls and amplifier ratings',()=>{
 assert.match(html,/examples here are passive speakers/);assert.match(html,/do not stream Spotify, AirPlay or Bluetooth by themselves/);
 assert.match(html,/peak-power handling is not a required amplifier wattage or a continuous-power rating/);
 assert.match(html,/never join amplifier outputs together/);assert.match(html,/does not automatically add independently controlled zones/);
 assert.match(html,/not a promise of soundproofing/);assert.match(html,/does not automatically mean every speaker must be replaced/);
});
test('Episode outdoor guidance limits family-level and weather claims',()=>{
 assert.match(html,/Indoor and all-weather variants are different products/);assert.match(html,/ES-SS6 listing specifies selectable 70V taps and an 8-ohm bypass/);
 assert.match(html,/IP67 rating does not replace the installation instructions/);assert.match(html,/not a guarantee that sound will stay within the property/);
 assert.match(html,/not a complete system, stake or amplifier package/);assert.match(html,/Do not connect a 70V speaker circuit/);
});
test('Episode guide has seven whole images with traceable originals and correct dimensions',()=>{
 const r=JSON.parse(read('blogs/'+slug+'/images/manufacturer/asset-sources.json'));assert.equal(r.assets.length,14);assert.match(r.notes,/not an independent license grant/);
 for(const a of r.assets)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.file.slice(1)))).digest('hex'),a.sha256);
 const imgs=[...html.matchAll(/<img src="([^"]+)"[^>]+width="(\d+)" height="(\d+)"/g)];assert.equal(imgs.length,7);
 for(const[,src,w,h]of imgs)assert.deepEqual(r.assets.find(a=>a.file===src).dimensions,[+w,+h]);
 assert.equal([...html.matchAll(/target="_blank" rel="noopener" aria-label="[^"]+\(opens a new tab\)"/g)].length,7);
 assert.match(html,/object-fit:contain/);assert.doesNotMatch(html,/object-fit:\s*cover|episode-inwall-install|episode-surroundscape-install/);
});
test('Episode guide stays client-facing with native navigation and one attributed inquiry',()=>{
 assert.match(html,/<main id="main-content" class="wrap" tabindex="-1"><article>/);assert.match(html,/<a class="skip-link" href="#main-content">/);
 assert.match(html,/<details class="jump"><summary>/);assert.match(html,/<details class="sources"><summary>/);assert.equal([...html.matchAll(/<details><summary>/g)].length,3);
 assert.equal([...html.matchAll(/class="btn"/g)].length,1);assert.ok(html.includes('/contact/?source=blog-guide&amp;guide='+slug+'#booking'));
 assert.match(html,/microsoft-clarity\.js/);assert.match(html,/site-chrome\.js/);assert.match(html,/prefers-reduced-motion/);
 assert.doesNotMatch(html,/blog-reader-tools\.js|<form\b|FAQPage|aggregateRating|CEDIA|Use this section during|a simple way to compare the options/i);
});
test('Episode article metadata and both hub render paths share a complete labeled cover',()=>{
 const image='/blogs/'+slug+'/images/manufacturer/episode-signature-cover.webp',p=JSON.parse(read('blogs/blog-data.json')).posts.find(p=>p.slug===slug),hub=read('blogs/index.html');
 assert.equal(p.heroImage,image);assert.equal(schema.image,'https://denalitechs.com'+image);assert.equal(p.updatedDate,'2026-10-19');assert.equal(p.publishedDate,'2026-07-13');assert.equal(p.readingTime,8);
 assert.ok(hub.includes('src="'+image+'"'));assert.match(hub,/fetch\('\/blogs\/blog-data\.json', \{ cache: 'no-cache' \}\)/);
 assert.match(hub,/\.blog-card-image-link\[href="\/blogs\/episode-whole-home-audio-planning-guide\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
