#!/usr/bin/env python3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def replace_once(path, old, new):
    full = ROOT / path
    text = full.read_text()
    if old not in text:
        raise SystemExit(f"Missing expected text in {path}: {old[:90]}")
    full.write_text(text.replace(old, new, 1))


def replace_all(path, old, new):
    full = ROOT / path
    text = full.read_text()
    if old not in text:
        raise SystemExit(f"Missing expected text in {path}: {old[:90]}")
    full.write_text(text.replace(old, new))


def ensure_before(path, marker, insert):
    full = ROOT / path
    text = full.read_text()
    if insert.strip() in text:
        return
    if marker not in text:
        raise SystemExit(f"Missing marker in {path}: {marker[:90]}")
    full.write_text(text.replace(marker, insert + marker, 1))


def update_problem_page(path, image, alt, width="1376", height="768", visual_html=""):
    replace_once(
        path,
        '<meta property="og:image" content="https://denalitechs.com/Video/logo-social.jpg">',
        f'<meta property="og:image" content="https://denalitechs.com{image}">',
    )
    replace_once(
        path,
        '<source srcset="../Video/homepage/denali-tech-hero-field-team.webp" type="image/webp">\n            <img src="../Video/homepage/denali-tech-hero-field-team.webp" alt="Denali Tech field team using a laptop beside the service van" width="2752" height="1536" loading="eager">',
        f'<source srcset="{image}" type="image/webp">\n            <img src="{image}" alt="{alt}" width="{width}" height="{height}" loading="eager">',
    )
    if visual_html:
        ensure_before(path, '    <section class="section cta">', visual_html)


def main():
    # Shared styles for the exact-intent service pages.
    ensure_before(
        "assets/css/problem-pages.css",
        "@media (max-width: 760px) {",
        """
.visual-proof {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 24px;
  align-items: stretch;
}

.asset-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.asset-strip figure {
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
}

.asset-strip img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.asset-strip figcaption {
  padding: 10px 12px;
  color: var(--muted);
  font-size: 0.86rem;
  font-weight: 800;
  line-height: 1.35;
}

.asset-note {
  margin: 16px 0 0;
  color: var(--muted);
  font-size: 0.94rem;
  line-height: 1.6;
}

@media (max-width: 760px) {
  .visual-proof {
    grid-template-columns: 1fr;
  }

  .asset-strip {
    grid-template-columns: 1fr;
  }
}

""",
    )

    update_problem_page(
        "smart-home-control/index.html",
        "/Video/services-real/smart-home-control.webp",
        "Control4 remote programmed for simple smart home control in a finished room",
        visual_html="""
    <section class="section visual-proof">
      <div>
        <div class="eyebrow">Planning visuals</div>
        <h2>The control system is only as good as the rack, network, and power behind it.</h2>
        <p class="asset-note">These ADI/Snap One marketing assets are used as product planning references for categories Denali installs and supports.</p>
      </div>
      <div class="asset-strip" aria-label="Smart home control equipment planning visuals">
        <figure><img src="/assets/brandfolder/adi/strong-rack-cables.jpg" alt="Structured AV rack cable planning reference" loading="lazy" width="243" height="162"><figcaption>Rack layout and service access</figcaption></figure>
        <figure><img src="/assets/brandfolder/adi/wattbox-rack-install.jpg" alt="WattBox rack power management reference" loading="lazy" width="243" height="162"><figcaption>Remote power management planning</figcaption></figure>
      </div>
    </section>
""",
    )
    update_problem_page(
        "security-cameras/index.html",
        "/Video/services-real/security-cameras-access.webp",
        "Camera monitoring screen showing a real yard view for residential security coverage",
        visual_html="""
    <section class="section visual-proof">
      <div>
        <div class="eyebrow">Planning visuals</div>
        <h2>Camera pages need to show more than a generic service photo.</h2>
        <p class="asset-note">The camera system still depends on clean wiring, phone access, storage, and network health.</p>
      </div>
      <div class="asset-strip" aria-label="Security camera planning visuals">
        <figure><img src="/assets/brandfolder/adi/luma-phone-ui-install.jpg" alt="Luma phone app camera planning reference" loading="lazy" width="243" height="162"><figcaption>Phone viewing and alerts</figcaption></figure>
        <figure><img src="/assets/brandfolder/adi/araknis-network-wiring.jpg" alt="Network wiring reference for camera systems" loading="lazy" width="243" height="162"><figcaption>Network support for cameras</figcaption></figure>
      </div>
    </section>
""",
    )
    update_problem_page(
        "home-theater-room/index.html",
        "/Video/services-real/home-theater-media-room.webp",
        "Dedicated home theater with projector, large screen, in-wall speakers, and theater seating",
        width="1600",
        height="900",
        visual_html="""
    <section class="section visual-proof">
      <div>
        <div class="eyebrow">Planning visuals</div>
        <h2>The hidden equipment plan matters as much as the screen.</h2>
        <p class="asset-note">Strong rack and Binary video assets help explain the behind-the-wall work that makes a theater reliable.</p>
      </div>
      <div class="asset-strip" aria-label="Home theater planning visuals">
        <figure><img src="/assets/brandfolder/adi/binary-fiber-hdmi-pull-strength.jpg" alt="Binary HDMI cable planning reference" loading="lazy" width="550" height="367"><figcaption>Long video paths and HDMI planning</figcaption></figure>
        <figure><img src="/assets/brandfolder/adi/strong-rack-cables.jpg" alt="Strong rack wiring planning reference" loading="lazy" width="243" height="162"><figcaption>Rack wiring and service access</figcaption></figure>
      </div>
    </section>
""",
    )
    update_problem_page(
        "smart-lighting-shades/index.html",
        "/Video/services-real/motorized-shades.webp",
        "Motorized window shades lowered in a bright living room for privacy and glare control",
    )

    # Residential WiFi page has its own inline CSS and layout.
    replace_once(
        "residential-wifi-network/index.html",
        '<meta property="og:image" content="https://denalitechs.com/Video/logo-social.jpg">',
        '<meta property="og:image" content="https://denalitechs.com/Video/services-real/whole-home-wifi-network.webp">',
    )
    replace_once(
        "residential-wifi-network/index.html",
        '<source srcset="../Video/homepage/denali-tech-hero-field-team.webp" type="image/webp">\n            <img src="../Video/homepage/denali-tech-hero-field-team.webp" alt="Denali Tech field team using a laptop beside the service van" width="2752" height="1536" loading="eager">',
        '<source srcset="/Video/services-real/whole-home-wifi-network.webp" type="image/webp">\n            <img src="/Video/services-real/whole-home-wifi-network.webp" alt="Real home network rack with router, switch, power management, and WiFi equipment" width="1376" height="768" loading="eager">',
    )
    ensure_before(
        "residential-wifi-network/index.html",
        "    .cta {",
        """
    .visual-proof {
      display: grid;
      grid-template-columns: 0.9fr 1.1fr;
      gap: 24px;
      align-items: stretch;
    }
    .asset-strip {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .asset-strip figure {
      margin: 0;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.055);
    }
    .asset-strip img {
      display: block;
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
    }
    .asset-strip figcaption {
      padding: 10px 12px;
      color: var(--muted);
      font-size: 0.86rem;
      font-weight: 800;
      line-height: 1.35;
    }
    .asset-note {
      margin-top: 16px;
      color: var(--muted);
      font-size: 0.94rem;
      line-height: 1.6;
    }
""",
    )
    ensure_before(
        "residential-wifi-network/index.html",
        "      .hero-grid, .split { grid-template-columns: 1fr; gap: 28px; }",
        "      .visual-proof { grid-template-columns: 1fr; }\n      .asset-strip { grid-template-columns: 1fr; }\n",
    )
    ensure_before(
        "residential-wifi-network/index.html",
        '    <section class="section cta">',
        """
    <section class="section visual-proof">
      <div>
        <div class="eyebrow">Planning visuals</div>
        <h2>The network page now shows the gear story, not only a service truck.</h2>
        <p class="asset-note">These ADI/Snap One references support the parts of a reliable home network customers rarely see: wiring, rack layout, and remote power recovery.</p>
      </div>
      <div class="asset-strip" aria-label="Home network planning visuals">
        <figure><img src="/assets/brandfolder/adi/araknis-network-wiring.jpg" alt="Araknis network wiring planning reference" loading="lazy" width="243" height="162"><figcaption>Network wiring and access points</figcaption></figure>
        <figure><img src="/assets/brandfolder/adi/wattbox-rack-install.jpg" alt="WattBox rack power management reference" loading="lazy" width="243" height="162"><figcaption>Remote power reset and serviceability</figcaption></figure>
      </div>
    </section>
""",
    )

    # Services overview social previews should use service photography instead of the logo.
    replace_all(
        "services/index.html",
        "https://denalitechs.com/Video/logo-social.jpg",
        "https://denalitechs.com/Video/services-real/smart-home-control.webp",
    )

    # Local exact-intent/location service pages get a real social image.
    for path in sorted((ROOT / "services").glob("*/index.html")):
        rel = str(path.relative_to(ROOT))
        if rel == "services/index.html":
            continue
        replace_all(
            rel,
            "https://denalitechs.com/Video/logo-social.jpg",
            "https://denalitechs.com/Video/homepage/denali-tech-hero-field-team.webp",
        )

    # Brands page gets product-context visuals from the ADI asset pass.
    replace_all(
        "brands/index.html",
        "https://denalitechs.com/Video/logo-social.jpg",
        "https://denalitechs.com/assets/brandfolder/adi/strong-rack-banner.jpg",
    )
    ensure_before(
        "brands/index.html",
        "        .cta-section {",
        """
        .brand-proof-section {
            padding: 80px 5%;
            background: var(--bg-color);
        }

        .brand-proof-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
            margin-top: 34px;
        }

        .brand-proof-card {
            overflow: hidden;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background: rgba(255,255,255,0.05);
        }

        .brand-proof-card img {
            display: block;
            width: 100%;
            aspect-ratio: 4 / 3;
            object-fit: cover;
        }

        .brand-proof-card div {
            padding: 18px;
        }

        .brand-proof-card h3 {
            margin: 0 0 8px;
            color: var(--text-primary);
            font-family: var(--font-heading);
            font-size: 1.05rem;
        }

        .brand-proof-card p {
            margin: 0;
            color: var(--text-secondary);
            line-height: 1.55;
        }

""",
    )
    ensure_before(
        "brands/index.html",
        "    <!-- CTA Section -->",
        """
    <section class="brand-proof-section">
        <div class="container">
            <div class="brands-intro">
                <h2>Product Context, Not Just Logos</h2>
                <p>The useful brand story is what the equipment does in a real install: power recovery, rack serviceability, outdoor viewing, cameras, wiring, and video distribution.</p>
            </div>
            <div class="brand-proof-grid">
                <article class="brand-proof-card">
                    <img src="/assets/brandfolder/adi/wattbox-rack-install.jpg" alt="WattBox rack power management marketing asset" loading="lazy" width="243" height="162">
                    <div><h3>WattBox and OvrC</h3><p>Remote power reset and monitoring are important because serviceable systems recover faster.</p></div>
                </article>
                <article class="brand-proof-card">
                    <img src="/assets/brandfolder/adi/strong-rack-cables.jpg" alt="Strong rack wiring marketing asset" loading="lazy" width="243" height="162">
                    <div><h3>Strong racks and structured wiring</h3><p>Clean racks make theater, networking, audio, and camera systems easier to support.</p></div>
                </article>
                <article class="brand-proof-card">
                    <img src="/assets/brandfolder/adi/binary-fiber-hdmi-pull-strength.jpg" alt="Binary HDMI cable marketing asset" loading="lazy" width="550" height="367">
                    <div><h3>Binary video paths</h3><p>Video distribution depends on choosing the right cable, extender, or AV-over-IP path.</p></div>
                </article>
            </div>
        </div>
    </section>

""",
    )
    ensure_before(
        "brands/index.html",
        "            .brands-grid {",
        "            .brand-proof-grid { grid-template-columns: 1fr; }\n",
    )


if __name__ == "__main__":
    main()
