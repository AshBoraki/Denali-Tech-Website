const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const slugs = [
  'av-technician-backpack-guide', 'av-rack-wire-management-guide',
  'how-much-does-smart-home-automation-cost', 'home-theater-installation-guide',
  'control4-neeo-remote-review', 'wifi-dead-zones-fix-guide',
  'why-professional-network-setup-is-superior', 'control4-vs-urc-comparison',
  'smart-home-not-working-troubleshooting', 'smart-home-buyers-guide',
  'control4-remote-review', 'smart-home-automation-for-beginners',
  'questions-to-ask-installer', 'how-to-choose-smart-home-installer',
  'smart-home-automation-arlington-heights-guide', 'lutron-smart-lighting-guide',
  'lutron-pico-motorized-shades-guide', 'luxul-network-setup-guide'
];
const flatSlugs = [
  'luma-security-camera-planning-guide', 'control4-x4-homeowner-guide',
  'smart-home-takeover-service-guide', 'ovrc-remote-monitoring-guide',
  'smart-home-prewire-builders-guide', 'outdoor-tv-audio-chicago-guide',
  'smart-home-designers-architects-guide', 'wattbox-power-management-guide',
  'araknis-access-point-placement-guide'
];

function rgb(hex) {
  assert.match(hex, /^#[a-f0-9]{6}$/i);
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
}
function luminance(color) {
  const channels = color.map(v => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}
function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x,y)=>y-x);
  return (lighter + .05) / (darker + .05);
}
function gradientSamples(a, b) {
  return Array.from({ length: 101 }, (_, i) => a.map((v, channel) => v + (b[channel] - v) * i / 100));
}
function block(html, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...html.matchAll(new RegExp(escaped + '\\s*\\{([^}]+)\\}', 'g'))].at(-1)?.[1] || '';
}

for (const slug of slugs) {
  test(`${slug}: orange CTA text meets 4.5:1 through normal, hover, visited and focus states`, () => {
    const html = fs.readFileSync(path.join(root, 'blogs', slug, 'index.html'), 'utf8');
    const normal = block(html, '.btn-primary');
    const state = html.match(/\.btn-primary:visited,\s*\.btn-primary:hover,\s*\.btn-primary:focus-visible\s*\{([^}]+)\}/)?.[1] || '';
    const foreground = normal.match(/(?:^|;)\s*color:\s*(#[a-f0-9]{6})\s*;/i)?.[1];
    const stateForeground = state.match(/color:\s*(#[a-f0-9]{6})\s*;/i)?.[1];
    assert.ok(foreground, 'A fixed dark button foreground must not depend on the page theme');
    assert.equal(stateForeground, foreground, 'Visited, hover and focus must preserve readable text');
    assert.match(normal, /background:\s*linear-gradient\(135deg,\s*var\(--accent-primary\),\s*#fb923c\)/);
    const accents = [...new Set([...html.matchAll(/--accent-primary:\s*(#[a-f0-9]{6})/gi)].map(m=>m[1]))];
    assert.ok(accents.length);
    const hover = block(html, '.btn-primary:hover');
    assert.doesNotMatch(hover, /background(?:-color|-image)?\s*:|(?:^|;)\s*color\s*:/, 'Hover uses the tested gradient and grouped state foreground');
    for (const accent of accents) {
      const samples = gradientSamples(rgb(accent), rgb('#fb923c'));
      const minimum = Math.min(...samples.map(background => contrast(rgb(foreground), background)));
      assert.ok(minimum >= 4.5, `${slug} normal/hover gradient minimum contrast ${minimum.toFixed(2)}:1`);
    }
    assert.match(normal, /min-height:\s*44px/);
    const focus = block(html, '.btn-primary:focus-visible');
    assert.match(focus, /outline:\s*3px solid #111827/);
    assert.match(focus, /outline-offset:\s*3px/);
    assert.match(focus, /box-shadow:\s*0 0 0 6px #fff !important/);
  });
}

for (const slug of flatSlugs) {
  test(`${slug}: flat-orange CTA text meets 4.5:1 through normal, hover, visited and focus states`, () => {
    const html = fs.readFileSync(path.join(root, 'blogs', slug, 'index.html'), 'utf8');
    const normal = block(html, '.btn-primary');
    const state = html.match(/\.btn-primary:visited,\s*\.btn-primary:hover,\s*\.btn-primary:focus-visible\s*\{([^}]+)\}/)?.[1] || '';
    const foreground = normal.match(/(?:^|;)\s*color:\s*(#[a-f0-9]{6})\s*(?:!important)?\s*;/i)?.[1];
    const stateForeground = state.match(/color:\s*(#[a-f0-9]{6})\s*(?:!important)?\s*;/i)?.[1];
    assert.equal(foreground, '#111827');
    assert.equal(stateForeground, foreground, 'Visited, hover and focus must preserve readable text');
    assert.match(normal, /background:\s*var\(--accent\)/);
    const accents = [...new Set([...html.matchAll(/--accent:\s*(#[a-f0-9]{6})/gi)].map(m => m[1]))];
    assert.ok(accents.length, 'Resolve contrast against the page\'s actual declared orange');
    assert.deepEqual(accents, [slug === 'araknis-access-point-placement-guide' ? '#f36f21' : '#f97316'], 'Preserve the existing orange background');
    const hover = block(html, '.btn-primary:hover');
    assert.doesNotMatch(hover, /background(?:-color|-image)?\s*:|(?:^|;)\s*color\s*:/, 'Hover inherits the tested background and grouped state foreground');
    assert.doesNotMatch(state, /background(?:-color|-image)?\s*:/, 'All interaction states inherit the tested orange');
    for (const accent of accents) {
      const ratio = contrast(rgb(foreground), rgb(accent));
      assert.ok(ratio >= 4.5, `${slug} normal/hover/visited/focus contrast ${ratio.toFixed(2)}:1`);
    }
    if (slug === 'araknis-access-point-placement-guide') {
      assert.match(html, /\.btn-primary,\s*\.btn-secondary\s*\{[^}]*min-height:\s*50px/);
      assert.match(block(html, '.btn-secondary'), /color:\s*var\(--white\)/, 'Do not recolor the dark-background secondary button');
    } else {
      assert.match(normal, /min-height:\s*44px/);
      assert.match(normal, /color:\s*#111827\s*!important/, 'Override the more specific article link foreground');
      assert.match(state, /color:\s*#111827\s*!important/, 'Preserve that override for interactive states');
    }
    const focus = block(html, '.btn-primary:focus-visible');
    assert.match(focus, /outline:\s*3px solid #111827/);
    assert.match(focus, /outline-offset:\s*3px/);
    assert.match(focus, /box-shadow:\s*0 0 0 6px #fff !important/);
  });
}
