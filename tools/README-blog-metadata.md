# Blog metadata maintenance

The article HTML is the source of truth for `dateModified`. The catalog and the crawlable blog-hub fallback should agree with it. Reading estimates use main-content words at 200 words per minute, rounded up, excluding metadata, navigation, sharing controls, related links, and scripts. These estimates are not a promise about an individual reader's speed.

Check without writing:

```powershell
node tools/refresh-blog-metadata.mjs
node --test tools/tests/blog-metadata.test.mjs
```

Recalculate reading estimates and copy existing article dates into the catalog:

```powershell
node tools/refresh-blog-metadata.mjs --write
```

Only after substantive article changes, explicitly name the changed slugs and their actual modification date:

```powershell
node tools/refresh-blog-metadata.mjs --write --modified-date=YYYY-MM-DD --modified-articles=article-slug,another-article-slug
```

The explicit-date mode updates those article dates, visible updated labels, catalog dates, and the corresponding sitemap entries plus the blog hub. It does not re-date other articles or service pages. Ordinary read-time or catalog corrections do not change article publication or modification dates.

Existing hub cards retain their markup and images; missing catalog articles receive a fallback card. RSS publication dates stay unchanged when existing articles are edited. New publications or changes to RSS titles/excerpts require a separate feed review.

Always inspect the diff, run the checks, and verify the changed pages in the local preview before publishing. This script never deploys.
