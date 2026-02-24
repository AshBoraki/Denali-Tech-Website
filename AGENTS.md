# AGENTS.md

## Cursor Cloud specific instructions

This is a **static HTML/CSS/JS website** with zero build dependencies, no package manager, and no framework. All external libraries load from CDNs.

### Running the dev server

```bash
python3 -m http.server 8080
```

Serves the site at `http://localhost:8080`. Any static HTTP server works (e.g. `npx serve`).

### Linting

```bash
html-validate <file.html>
```

`html-validate` is installed globally via npm. Pre-existing warnings (trailing whitespace, inline styles) are expected in the codebase.

### Key notes

- There is no `package.json`, no build step, and no automated test suite.
- The contact form uses **Web3Forms** (external SaaS) — it won't submit locally without internet access and a valid API key.
- The `.htaccess` file configures Apache-specific caching/security headers; irrelevant when using Python or Node static servers.
- The `CNAME` file points to `denalitechs.com` for GitHub Pages hosting.
- The dark/light theme toggle persists preference to `localStorage`.
