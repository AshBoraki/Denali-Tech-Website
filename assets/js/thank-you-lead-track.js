window.addEventListener("load", function () {
  if (window.denaliMetaPixel && typeof window.denaliMetaPixel.trackLeadOnce === "function") {
    window.denaliMetaPixel.trackLeadOnce({
      lead_type: "thank_you_page",
      page: "thank_you"
    });
  } else if (typeof window.fbq === "function") {
    window.fbq("track", "Lead", {
      lead_type: "thank_you_page",
      page: "thank_you"
    });
  }

  if (window.dataLayer && typeof window.dataLayer.push === "function") {
    window.dataLayer.push({
      event: "generate_lead",
      lead_type: "thank_you_page",
      page: "thank_you"
    });
  }

  window.uetq = window.uetq || [];
  window.uetq.push("event", "generate_lead", {
    event_category: "lead",
    event_label: "thank_you_page",
    lead_type: "thank_you_page",
    page: "thank_you"
  });
});
