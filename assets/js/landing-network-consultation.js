(function () {
  var form = document.getElementById("wifi-consult-form");
  var submitBtn = document.getElementById("submit-btn");
  var formMessage = document.getElementById("form-message");
  if (!form || !submitBtn || !formMessage) return;

  var MIN_FILL_MS = 2500;
  var MIN_INTERACTIONS = 1;
  var COOLDOWN_MS = 45000;
  var interactions = 0;
  var spamLinkPattern = /(https?:\/\/|www\.)/i;

  var fields = {
    name: document.getElementById("name"),
    phone: document.getElementById("phone"),
    email: document.getElementById("email"),
    contactPreference: document.getElementById("contact-preference"),
    wifiSystem: document.getElementById("wifi-system"),
    wifiProblems: document.getElementById("wifi-problems"),
    websiteTrap: form.querySelector('input[name="website"]'),
    gotchaTrap: form.querySelector('input[name="_gotcha"]'),
    formStartedAt: document.getElementById("form-started-at")
  };

  if (fields.formStartedAt) fields.formStartedAt.value = String(Date.now());
  form.addEventListener("input", function () { interactions += 1; });
  form.addEventListener("change", function () { interactions += 1; });
  form.addEventListener("keydown", function () { interactions += 1; });
  form.addEventListener("pointerdown", function () { interactions += 1; });

  function setError(id, message) {
    var el = document.getElementById(id);
    if (el) el.textContent = message || "";
  }

  function clearErrors() {
    setError("name-error", "");
    setError("phone-error", "");
    setError("email-error", "");
    setError("contact-preference-error", "");
    setError("wifi-system-error", "");
    setError("wifi-problems-error", "");
  }

  function setMessage(message, isError) {
    formMessage.textContent = message;
    formMessage.className = "form-message " + (isError ? "error" : "success");
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validPhone(phone) {
    return phone.replace(/\D/g, "").length >= 10;
  }

  function getCaptchaToken() {
    var captcha = form.querySelector('textarea[name="h-captcha-response"]');
    return captcha ? captcha.value.trim() : "";
  }

  function canSubmitAgain() {
    try {
      var lastSubmit = Number(localStorage.getItem("denali_wifi_last_submit") || 0);
      return !lastSubmit || Date.now() - lastSubmit > COOLDOWN_MS;
    } catch (error) {
      return true;
    }
  }

  function rememberSubmitTime() {
    try {
      localStorage.setItem("denali_wifi_last_submit", String(Date.now()));
    } catch (error) {
      /* no-op */
    }
  }

  function setHiddenField(id, value) {
    var input = document.getElementById(id);
    if (input) input.value = value || "";
  }

  function captureAttribution() {
    var params = new URLSearchParams(window.location.search);
    setHiddenField("utm-source", params.get("utm_source"));
    setHiddenField("utm-medium", params.get("utm_medium"));
    setHiddenField("utm-campaign", params.get("utm_campaign"));
    setHiddenField("utm-content", params.get("utm_content"));
    setHiddenField("utm-term", params.get("utm_term"));
    setHiddenField("fbclid", params.get("fbclid"));
    setHiddenField("msclkid", params.get("msclkid"));
    setHiddenField("gclid", params.get("gclid"));
    setHiddenField("landing-page", window.location.href);
    setHiddenField("referrer", document.referrer || "");
  }

  captureAttribution();

  function trackDenaliIntent(method, source) {
    var payload = {
      contact_method: method || "unknown",
      source: source || "network_consultation_landing",
      lead_type: "network_consultation"
    };
    var isDirectLead = /^whatsapp|^email/.test(payload.contact_method);

    if (window.dataLayer && typeof window.dataLayer.push === "function") {
      window.dataLayer.push({
        event: "denali_contact_intent",
        contact_method: payload.contact_method,
        lead_type: payload.lead_type,
        source: payload.source
      });

      if (isDirectLead) {
        window.dataLayer.push({
          event: "denali_generate_lead",
          contact_method: payload.contact_method,
          lead_type: payload.lead_type,
          source: payload.source
        });
      }
    }

    window.uetq = window.uetq || [];
    window.uetq.push("event", "lead_intent", {
      event_category: "lead",
      event_label: payload.contact_method,
      contact_method: payload.contact_method,
      lead_type: payload.lead_type
    });

    if (isDirectLead) {
      window.uetq.push("event", "generate_lead", {
        event_category: "lead",
        event_label: payload.contact_method,
        contact_method: payload.contact_method,
        lead_type: payload.lead_type
      });
    }
  }

  document.querySelectorAll(".denali-contact-track").forEach(function (link) {
    link.addEventListener("click", function () {
      trackDenaliIntent(link.getAttribute("data-contact-method"), "landing_click");
    });
  });

  function validate() {
    clearErrors();
    setMessage("", false);

    var ok = true;
    var startedAt = Number(fields.formStartedAt && fields.formStartedAt.value);

    if ((fields.websiteTrap && fields.websiteTrap.value.trim()) || (fields.gotchaTrap && fields.gotchaTrap.value.trim())) {
      setMessage("Verification failed. Please refresh and try again.", true);
      return false;
    }

    if (!startedAt || Date.now() - startedAt < MIN_FILL_MS) {
      setMessage("Please review your details, then submit again.", true);
      ok = false;
    }

    if (interactions < MIN_INTERACTIONS) {
      setMessage("Please complete the form manually and try again.", true);
      ok = false;
    }

    if (!fields.name.value.trim()) {
      setError("name-error", "Please enter your name.");
      ok = false;
    }

    if (!fields.phone.value.trim() && !fields.email.value.trim()) {
      setError("phone-error", "Please enter a phone/WhatsApp number or an email.");
      setError("email-error", "Please enter an email or a phone/WhatsApp number.");
      ok = false;
    } else if (fields.phone.value.trim() && !validPhone(fields.phone.value)) {
      setError("phone-error", "Please enter a valid phone number.");
      ok = false;
    }

    if (fields.email.value.trim() && !validEmail(fields.email.value)) {
      setError("email-error", "Please enter a valid email address.");
      ok = false;
    }

    if (fields.contactPreference && fields.contactPreference.value === "Email" && !fields.email.value.trim()) {
      setError("email-error", "Please enter your email if you want an email reply.");
      ok = false;
    }

    if (fields.contactPreference && fields.contactPreference.value !== "Email" && !fields.phone.value.trim()) {
      setError("phone-error", "Please enter your phone or WhatsApp number for text or WhatsApp replies.");
      ok = false;
    }

    if (!fields.wifiProblems.value.trim()) {
      setError("wifi-problems-error", "Please describe the Wi-Fi issue.");
      ok = false;
    } else if (spamLinkPattern.test(fields.wifiProblems.value)) {
      setError("wifi-problems-error", "Please remove links from this field.");
      ok = false;
    }

    return ok;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!validate()) return;

    if (!getCaptchaToken()) {
      await new Promise(function (resolve) { setTimeout(resolve, 500); });
    }
    if (!getCaptchaToken()) {
      setMessage("Please complete the captcha verification before submitting.", true);
      return;
    }

    if (!canSubmitAgain()) {
      setMessage("Please wait about a minute before sending another request.", true);
      return;
    }

    submitBtn.disabled = true;
    setMessage("Submitting your request...", false);

    fetch(form.action, {
      method: "POST",
      body: new FormData(form)
    })
      .then(function (response) { return response.json(); })
      .then(function (data) {
        if (data && data.success) {
          if (window.denaliMetaPixel && typeof window.denaliMetaPixel.trackLeadOnce === "function") {
            window.denaliMetaPixel.trackLeadOnce({
              lead_type: "network_consultation",
              form_id: "network-consultation-form"
            });
          } else if (typeof window.fbq === "function") {
            window.fbq("track", "Lead", {
              lead_type: "network_consultation",
              form_id: "network-consultation-form"
            });
          }
          trackDenaliIntent("form_submit", "landing_form_success");
          window.uetq = window.uetq || [];
          window.uetq.push("event", "generate_lead", {
            event_category: "lead",
            event_label: "network_consultation_form",
            lead_type: "network_consultation",
            form_id: "network-consultation-form"
          });
          rememberSubmitTime();
          setMessage("Thanks. Redirecting...", false);
          window.location.href = form.querySelector('[name="redirect"]').value;
        } else {
          setMessage((data && data.message) || "Something went wrong. Please try again.", true);
          submitBtn.disabled = false;
        }
      })
      .catch(function () {
        setMessage("Network error. Please try again.", true);
        submitBtn.disabled = false;
      });
  });
})();
