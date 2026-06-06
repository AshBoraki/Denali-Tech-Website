window.dataLayer = window.dataLayer || [];
window.denaliLeadTrack = function(type, label) {
  try {
    window.dataLayer.push({
      event: "denali_lead_action",
      lead_type: type,
      lead_label: label || ""
    });
  } catch (error) {}
};

document.addEventListener("click", function(event) {
  var target = event.target.closest("[data-lead-action]");
  if (!target) return;
  window.denaliLeadTrack(target.getAttribute("data-lead-action"), target.textContent.trim());
});
