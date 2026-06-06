window.dataLayer = window.dataLayer || [];

window.denaliLeadTrack = function (type, label) {
  try {
    window.dataLayer.push({
      event: "denali_lead_action",
      lead_type: type,
      lead_label: label || ""
    });
  } catch (error) {
    /* no-op */
  }
};

document.addEventListener("click", function (event) {
  var target = event.target.closest("[data-lead-action]");
  if (!target) return;
  window.denaliLeadTrack(target.getAttribute("data-lead-action"), target.textContent.trim());
});

document.addEventListener("submit", function (event) {
  var form = event.target.closest("form[data-lead-action]");
  if (!form) return;
  window.denaliLeadTrack(form.getAttribute("data-lead-action"), form.getAttribute("id") || "form");
});
