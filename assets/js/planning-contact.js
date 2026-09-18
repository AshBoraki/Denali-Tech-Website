(function () {
  'use strict';
  function init() {
    const tool = new URLSearchParams(window.location.search).get('planner');
    if (!['prewire', 'cameras', 'existing'].includes(tool) || !window.DenaliPlanSession) return;
    let storage; try { storage = window.sessionStorage; } catch (_) {}
    const session = window.DenaliPlanSession;
    const handoff = session.handoff(storage, tool);
    const form = document.getElementById('booking-form');
    const details = document.getElementById('booking-details');
    const phone = document.getElementById('booking-phone');
    const service = document.getElementById('booking-service');
    if (!form || !details || !phone) return;
    phone.required = false; phone.setAttribute('aria-required', 'false');
    phone.setAttribute('data-planner-optional-phone', 'true');
    const phoneLabel = document.querySelector('label[for="booking-phone"]');
    if (phoneLabel) phoneLabel.textContent = 'Phone / WhatsApp (optional)';
    const banner = document.createElement('div'); banner.setAttribute('data-clarity-mask', 'true');
    banner.style.cssText = 'padding:16px 18px;margin:0 0 24px;border:1px solid #c8d9d0;border-radius:10px;background:#eff6f1;color:#173c28;line-height:1.6;font-size:15px';
    const text = document.createElement('p'); text.style.margin = '0'; banner.append(text);
    if (handoff) {
      let inserted = false;
      if (!details.value.trim()) { details.value = handoff.text; inserted = true; }
      if (service && !service.value && Array.from(service.options).some(o => o.value === handoff.service)) service.value = handoff.service;
      text.textContent = inserted ? 'Your planning summary is included in Project details below. Review it and add anything else you would like us to know.' : 'Your existing Project details have been kept. You can add your planning summary below.';
      details.setAttribute('data-clarity-mask', 'true');
      const add = document.createElement('button'); add.type = 'button'; add.textContent = inserted ? 'Remove the included plan' : 'Add my planning summary';
      add.style.cssText = 'font:inherit;text-decoration:underline;background:transparent;border:0;color:#173c28;padding:10px 0;min-height:44px;cursor:pointer';
      add.addEventListener('click', () => {
        if (!inserted) { details.value = [details.value, handoff.text].filter(Boolean).join('\n\n'); inserted = true; add.textContent = 'Remove the included plan'; text.textContent = 'Your plan has been added to Project details. Review everything before sending.'; }
        else {
          if (!details.value.includes(handoff.text)) {
            text.textContent = 'This summary has been edited, so we have kept your changes. Remove any text you no longer want from Project details.';
            text.setAttribute('role', 'status');
            details.focus();
            return;
          }
          details.value = details.value.replace(handoff.text, '').trim();
          try { storage.removeItem(session.handoffKey); } catch (_) {}
          add.remove(); text.textContent = 'The planning summary was removed. Your other project details have been kept.';
        }
        details.dispatchEvent(new Event('input', { bubbles: true }));
      }); banner.append(add);
    } else text.textContent = 'Paste your saved planning summary into Project details, or describe what you would like help with. No plan has been attached automatically.';
    form.prepend(banner);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
