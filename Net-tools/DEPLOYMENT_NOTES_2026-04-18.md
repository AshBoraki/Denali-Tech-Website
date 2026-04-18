## DTNT website deployment notes

Date: 2026-04-18

### Current setup

- Live product hub: `https://denalitechs.com/Net-tools/`
- Custom domain is defined in the repo `CNAME` as `denalitechs.com`
- Live responses show `Server: GitHub.com`, which indicates GitHub Pages is serving the site
- Website source repo remote is `https://github.com/AshBoraki/Denali-Tech-Website.git`
- Active branch in local git config is `main`

### What is live right now

- `https://denalitechs.com/Net-tools/` returns `200`
- `https://denalitechs.com/Net-tools/sitemap.xml` is live, but currently only lists:
  - `/Net-tools/`
  - `/Net-tools/legal/`
- The new DTNT child pages currently return `404` on the live site:
  - `/Net-tools/features/`
  - `/Net-tools/download/`
  - `/Net-tools/pricing/`
  - `/Net-tools/activation/`
  - `/Net-tools/faq/`
  - `/Net-tools/changelog/`

### What exists locally in this repo

- `Net-tools/features/index.html`
- `Net-tools/download/index.html`
- `Net-tools/pricing/index.html`
- `Net-tools/activation/index.html`
- `Net-tools/faq/index.html`
- `Net-tools/changelog/index.html`
- `Net-tools/product-pages.css`
- updated `Net-tools/index.html`
- updated `Net-tools/sitemap.xml`
- updated root `sitemap.xml`

### Meaning

The DTNT website work exists in local source, but it has not been published to the live GitHub Pages site yet.

### Safe next release step

Publish the current `Denali-Tech-Website` repo changes to the live branch that GitHub Pages serves.

Because the site is public commerce-facing content, this publish step should be treated as a live release.

### Things intentionally not touched in this pass

- Stripe checkout behavior
- DTNT `commerce.js`
- Microsoft Store / download delivery logic
- app licensing behavior

### Recommended post-publish checks

1. Open `/Net-tools/`
2. Open each new child page and confirm `200`
3. Open `/Net-tools/sitemap.xml` and confirm the new URLs are present
4. Re-check Search Console sitemap status after Google re-reads the files
