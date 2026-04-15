(() => {
    const config = {
        checkoutUrl: "https://buy.stripe.com/eVq8wO1Kkevj08A2td3ks00",
        checkoutMode: "live",
        autoRedirectWhenLive: false,
        latestManifestUrl: "/downloads/dtnt/latest.json",
        fulfillmentApiBaseUrl: "https://skill-deploy-88gdr6ys4x-codex-agent-deploys.vercel.app",
        homeUrl: "/Net-tools/",
        buyUrl: "/Net-tools/buy/",
        successUrl: "/Net-tools/success/",
        cancelUrl: "/Net-tools/cancel/",
        pricingUrl: "/Net-tools/#pricing",
        activationUrl: "/Net-tools/#activation",
        supportEmail: "Hello@denalitechs.com",
        supportSubject: "DTNT order help",
        launchPriceLabel: "$59 one time",
        regularPriceLabel: "$99 after launch"
    };

    let latestReleasePromise;

    async function loadLatestRelease() {
        if (!latestReleasePromise) {
            latestReleasePromise = fetch(config.latestManifestUrl, { cache: "no-store" })
                .then(async response => {
                    if (!response.ok) {
                        throw new Error(`Could not load ${config.latestManifestUrl}.`);
                    }

                    return response.json();
                })
                .catch(() => null);
        }

        return latestReleasePromise;
    }

    async function hydrateLatestRelease(root = document) {
        const release = await loadLatestRelease();
        if (!release) {
            return null;
        }

        const freeDownloadUrl = release.downloadUrl || config.homeUrl;
        const version = release.version || "";
        const installer = release.installer || {};
        const appInstallerUrl = installer.appInstallerUrl || "";
        const msixUrl = installer.msixUrl || "";
        const releaseNotesUrl = release.releaseNotesUrl || "";
        const sha256 = release.sha256 || "";

        root.querySelectorAll('[data-dtnt-download="free"]').forEach(anchor => {
            anchor.setAttribute("href", freeDownloadUrl);
            anchor.removeAttribute("aria-disabled");
        });

        root.querySelectorAll('[data-dtnt-download="appinstaller"]').forEach(anchor => {
            if (!appInstallerUrl) {
                anchor.hidden = true;
                return;
            }

            anchor.hidden = false;
            anchor.setAttribute("href", appInstallerUrl);
            anchor.removeAttribute("aria-disabled");
        });

        root.querySelectorAll('[data-dtnt-download="msix"]').forEach(anchor => {
            if (!msixUrl) {
                anchor.hidden = true;
                return;
            }

            anchor.hidden = false;
            anchor.setAttribute("href", msixUrl);
            anchor.removeAttribute("aria-disabled");
        });

        root.querySelectorAll("[data-dtnt-release-notes]").forEach(anchor => {
            if (!releaseNotesUrl) {
                anchor.hidden = true;
                return;
            }

            anchor.hidden = false;
            anchor.setAttribute("href", releaseNotesUrl);
        });

        root.querySelectorAll("[data-dtnt-version]").forEach(node => {
            node.textContent = version;
        });

        root.querySelectorAll("[data-dtnt-sha256]").forEach(node => {
            node.textContent = sha256;
        });

        return release;
    }

    function hydrateSupportEmail(root = document) {
        const mailto = `mailto:${config.supportEmail}`;
        root.querySelectorAll("[data-dtnt-support-email]").forEach(anchor => {
            anchor.textContent = config.supportEmail;
            anchor.setAttribute("href", mailto);
        });
    }

    function createSupportMailto(subject, body = "") {
        const parts = [`mailto:${config.supportEmail}`];
        const query = new URLSearchParams();
        if (subject) {
            query.set("subject", subject);
        }

        if (body) {
            query.set("body", body);
        }

        const queryString = query.toString();
        if (queryString) {
            parts.push(`?${queryString}`);
        }

        return parts.join("");
    }

    function checkoutIsConfigured() {
        return typeof config.checkoutUrl === "string" && config.checkoutUrl.trim().length > 0;
    }

    function checkoutIsLive() {
        return checkoutIsConfigured() && config.checkoutMode === "live";
    }

    function absoluteUrl(path) {
        return new URL(path, window.location.origin).toString();
    }

    function fulfillmentApiIsConfigured() {
        return typeof config.fulfillmentApiBaseUrl === "string"
            && config.fulfillmentApiBaseUrl.trim().length > 0;
    }

    window.DTNTCommerce = {
        config,
        loadLatestRelease,
        hydrateLatestRelease,
        hydrateSupportEmail,
        createSupportMailto,
        checkoutIsConfigured,
        checkoutIsLive,
        absoluteUrl,
        fulfillmentApiIsConfigured
    };
})();
