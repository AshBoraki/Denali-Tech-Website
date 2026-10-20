const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('blogs/control4-halo-touch-review/index.html');
const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
test('Halo Touch retains title, H1, canonical, original publication and six established deep links',()=>{
 assert.match(html,/<title>Control4 Halo Touch Remote Review \| Denali Tech<\/title>/);
 assert.match(html,/<h1>Control4 Halo Touch: what it is like to use every day<\/h1>/);
 assert.equal(schema.mainEntityOfPage,'https://denalitechs.com/blogs/control4-halo-touch-review/');
 assert.equal(schema.datePublished,'2024-01-30T00:00:00+00:00');assert.equal(schema.dateModified,'2026-10-19');
 for(const id of ['see-the-control4-remotes-side-by-side','halo-touch-from-two-useful-angles','what-is-the-control4-halo-touch','key-features-that-make-the-halo-touch-stand-out','charging-and-battery-expectations','strengths-and-tradeoffs'])assert.ok(html.includes(`id="${id}"`),id);
 assert.match(html,/"@type":"BreadcrumbList"/);
});
test('Hardware specifications identify the exact model and dated minimum rather than promising current compatibility',()=>{
 assert.match(html,/C4-HALO-TS-BL \(black\); C4-HALO-TS-AS \(silver\)/);
 assert.match(html,/480 × 800 image pixels/);assert.match(html,/480 × 3\(RGB\) × 800/);
 assert.match(html,/not have the button-first Halo's full physical number pad/);
 assert.match(html,/numeric entry is available through its touch interface/);
 assert.match(html,/Control4 OS 3\.3\.2\+ in this data sheet/);
 assert.match(html,/not advice to install an old software release/);
 assert.match(html,/controller, OS, remote firmware and drivers together/);
});
test('Voice and system features remain conditional and do not imply tablet or standalone operation',()=>{
 assert.match(html,/supported Apple TV integration/);assert.match(html,/supported Xfinity integration/);
 assert.match(html,/not a universal microphone for every app, television or smart-home command/);
 assert.match(html,/not an unrestricted tablet where you can install any app/);
 assert.match(html,/only where supported and configured/);
 assert.match(html,/handheld interface for a compatible Control4 system/);
});
test('Charging and recovery avoid guaranteed runtime, invented reset sequences and unnecessary replacement',()=>{
 assert.match(html,/1900 mAh rechargeable lithium-ion/);assert.match(html,/included 10 W charger/);
 assert.match(html,/not a controlled battery test/);assert.match(html,/not a guaranteed household runtime/);
 assert.match(html,/Do not factory-reset the controller or erase the project/);
 assert.match(html,/working NEEO or SR-260 does not need replacing/);
 assert.doesNotMatch(html,/Use this section during a walkthrough|The homeowner should|all-day battery|up to 5×/);
});
test('All six image records match source hashes and originals remain accessible',()=>{
 const record=JSON.parse(read('blogs/control4-halo-touch-review/images/asset-sources.json'));
 assert.equal(record.assets.length,6);assert.match(record.notes,/not an independent license grant/);
 for(const asset of record.assets){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,asset.file.slice(1)))).digest('hex'),asset.sha256,asset.file);assert.match(asset.sourceFile,/^https:\/\/(www\.snapav\.com|cdn\.prod\.website-files\.com)\//);}
 for(const name of ['docked','angle'])assert.ok(html.includes(`href="/blogs/control4-halo-touch-review/images/halo-touch-${name}-original.png"`));
 assert.equal([...html.matchAll(/<img /g)].length,3);
 assert.equal([...html.matchAll(/target="_blank" rel="noopener" aria-label="[^"]+\(opens a new tab\)"/g)].length,3);
 assert.match(html,/\.product-stage img\{[^}]*object-fit:contain/);
 assert.doesNotMatch(html,/object-fit:\s*cover|transparent\.webp|control4-halo-touch-blue/);
 assert.match(html,/not included streaming subscriptions or video playback on the remote/);
});
test('Native reading aids and one article inquiry action retain keyboard and motion support',()=>{
 assert.match(html,/<a class="skip-link" href="#main-content">/);assert.match(html,/<main id="main-content" class="wrap" tabindex="-1">/);
 assert.match(html,/<details class="jump"><summary>/);assert.match(html,/<details class="spec-details"><summary>/);
 assert.equal([...html.matchAll(/<th scope="row">/g)].length,7);assert.equal([...html.matchAll(/<details><summary>/g)].length,4);
 assert.equal([...html.matchAll(/class="btn"/g)].length,1);assert.match(html,/@media\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(html,/blog-reader-tools\.js|copyToClipboard|<form\b|FAQPage|aggregateRating/);
});
test('Individual remote reviews and original analytics remain without changing contact form fields',()=>{
 for(const slug of ['control4-halo-button-remote-review','control4-neeo-remote-review','control4-remote-review','control4-halo-remote-review'])assert.ok(html.includes('href="/blogs/'+slug+'/"'));
 assert.match(html,/GTM-MWPTRPDR/);assert.match(html,/1475625250840344/);assert.match(html,/microsoft-clarity\.js/);assert.match(html,/microsoft-uet\.js/);
 assert.ok(html.includes('/contact/?source=blog-guide&amp;guide=control4-halo-touch-review#booking'));
});
test('Halo Touch cover matches article, catalog and static hub with no hover cropping',()=>{
 const image='/blogs/control4-halo-touch-review/images/halo-touch-review-cover.webp';
 const post=JSON.parse(read('blogs/blog-data.json')).posts.find(p=>p.slug==='control4-halo-touch-review');
 assert.equal(post.heroImage,image);assert.equal(post.updatedDate,'2026-10-19');assert.equal(post.publishedDate,'2024-01-30');assert.equal(schema.image,'https://denalitechs.com'+image);
 const hub=read('blogs/index.html');assert.ok(hub.includes(`src="${image}"`));
 assert.match(hub,/\.blog-card-image-link\[href="\/blogs\/control4-halo-touch-review\/"\] img\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*none/);
});
