(() => {
    const config = {
        checkoutUrl: "https://buy.stripe.com/test_fZu4gsgkE0xuexD6jv63K01",
        checkoutMode: "test",
        autoRedirectWhenLive: true,
        latestManifestUrl: "/downloads/dtnt/latest.json",
        homeUrl: "/Net-tools/",
        buyUrl: "/Net-tools/buy/",
        pricingUrl: "/Net-tools/#pricing",
        activationUrl: "/Net-tools/#activation",
        supportEmail: "Hello@denalitechs.com",
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

        root.querySelectorAll('[data-dtnt-download="free"]').forEach(anchor => {
            anchor.setAttribute("href", freeDownloadUrl);
            anchor.removeAttribute("aria-disabled");
        });

        root.querySelectorAll("[data-dtnt-version]").forEach(node => {
            node.textContent = version;
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

    function checkoutIsConfigured() {
        return typeof config.checkoutUrl === "string" && config.checkoutUrl.trim().length > 0;
    }

    function checkoutIsLive() {
        return checkoutIsConfigured() && config.checkoutMode === "live";
    }

    window.DTNTCommerce = {
        config,
        loadLatestRelease,
        hydrateLatestRelease,
        hydrateSupportEmail,
        checkoutIsConfigured,
        checkoutIsLive
    };
})();
