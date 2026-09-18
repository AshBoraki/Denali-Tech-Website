(function () {
  'use strict';
  const root = document.querySelector('[data-planner]');
  const rules = window.DenaliPlanning;
  const session = window.DenaliPlanSession;
  if (!root || !rules || !session) return;
  const tool = root.dataset.planner;
  const config = rules.configs[tool];
  if (!config) return;
  let storage;
  try { storage = window.sessionStorage; } catch (_) {}
  const saved = session.read(storage, session.key);
  let answers = rules.sanitize(tool, { ...(saved?.tools?.[tool] || {}), ...(saved?.profile || {}) });
  let step = 0, currentReport;
  let storageAvailable = !!storage;
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const button = (text, className, action) => {
    const el = node('button', className, text); el.type = 'button'; el.addEventListener('click', action); return el;
  };
  function persist() {
    const previous = session.read(storage, session.key);
    const profile = Object.fromEntries(rules.profile.map(f => [f.name, answers[f.name]]));
    storageAvailable = session.write(storage, session.key, { profile, tools: { ...(previous?.tools || {}), [tool]: answers } });
  }
  function focusHeading(el) { el.tabIndex = -1; el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  function progress() {
    const list = node('ol', 'plan-progress'); list.setAttribute('aria-label', 'Your progress');
    ['Your home', tool === 'prewire' ? 'Your priorities' : 'Your system', tool === 'cameras' ? 'Storage example' : 'A few details'].forEach((name, i) => {
      const li = node('li', i < step ? 'complete' : '', `${i + 1}. ${name}`);
      if (i === step) li.setAttribute('aria-current', 'step'); list.append(li);
    }); return list;
  }
  function sessionNote() {
    const wrap = node('div');
    wrap.append(node('p', 'plan-session-note', storageAvailable ? 'Your choices are kept in this tab for up to 24 hours. No contact details are needed to see your result.' : 'This browser cannot save your choices. Keep this page open and copy or download your result before leaving.'));
    wrap.append(button('Clear my saved choices', 'plan-button-link', () => {
      if (!window.confirm('Clear the saved choices for all three planners in this tab?')) return;
      try { storage.removeItem(session.key); storage.removeItem(session.handoffKey); } catch (_) {}
      answers = rules.defaults(tool); step = 0; showStep(true);
    })); return wrap;
  }
  function showStep(focus) {
    root.replaceChildren(); root.append(progress());
    const shell = node('section', 'plan-app-shell');
    const heading = node('h2', 'plan-step-title', config.steps[step].title);
    shell.append(heading, node('p', 'plan-step-intro', config.steps[step].intro));
    const form = node('form'); form.id = 'planning-form'; form.noValidate = true;
    const fields = node('div', 'plan-fields');
    const wrappers = new Map();
    for (const field of config.steps[step].fields) {
      const wrap = node('div', 'plan-field' + (field.type === 'checks' ? ' plan-field-wide' : ''));
      wrappers.set(field.name, wrap); wrap.hidden = !rules.active(field, answers);
      const id = 'plan-' + field.name;
      if (field.type === 'checks') {
        const fieldset = node('fieldset'); fieldset.append(node('legend', '', field.label));
        const options = node('div', 'plan-checks');
        for (const [value, label] of field.options) {
          const row = node('label', 'plan-check');
          const input = node('input'); input.type = 'checkbox'; input.name = field.name; input.value = value; input.checked = answers[field.name].includes(value);
          input.addEventListener('change', () => {
            if (value === 'unknown' && input.checked) options.querySelectorAll('input').forEach(other => { if (other !== input) other.checked = false; });
            if (value !== 'unknown' && input.checked) { const unknown = options.querySelector('input[value="unknown"]'); if (unknown) unknown.checked = false; }
            answers[field.name] = Array.from(options.querySelectorAll('input:checked'), i => i.value); persist();
          });
          row.append(input, node('span', '', label)); options.append(row);
        }
        fieldset.append(options); wrap.append(fieldset);
      } else {
        const label = node('label', '', field.label); label.htmlFor = id;
        const input = node(field.type === 'select' ? 'select' : 'input'); input.id = id; input.name = field.name;
        if (field.type === 'select') {
          field.options.forEach(([value, label]) => { const option = node('option', '', label); option.value = value; input.append(option); });
        } else { input.type = 'number'; input.min = field.min; input.max = field.max; input.step = field.step; input.inputMode = field.step === 1 ? 'numeric' : 'decimal'; input.required = true; }
        input.value = answers[field.name];
        input.setAttribute('aria-describedby', `${id}-help ${id}-error`);
        input.addEventListener(field.type === 'select' ? 'change' : 'input', () => {
          answers[field.name] = input.value; input.removeAttribute('aria-invalid');
          errorSummary.textContent = '';
          const error = document.getElementById(id + '-error'); error.textContent = '';
          for (const other of config.steps[step].fields) wrappers.get(other.name).hidden = !rules.active(other, answers);
          persist();
        });
        const help = node('p', '', field.help || ''); help.id = id + '-help';
        const error = node('p', 'plan-error'); error.id = id + '-error';
        wrap.append(label, input, help, error);
      }
      fields.append(wrap);
    }
    const errorSummary = node('p', 'plan-status plan-error'); errorSummary.setAttribute('role', 'alert');
    const actions = node('div', 'plan-actions');
    if (step) actions.append(button('Back', 'plan-button', () => { step--; showStep(true); }));
    else { const link = node('a', 'plan-button', 'All planners'); link.href = '/planning/'; actions.append(link); }
    const next = node('button', 'plan-button plan-button-primary', step === config.steps.length - 1 ? 'See my plan' : 'Continue'); next.type = 'submit'; actions.append(next);
    form.append(fields, errorSummary, actions);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const errors = rules.validate(tool, answers, step);
      if (errors.length) {
        errorSummary.textContent = 'Check the highlighted numbers before continuing.';
        errors.forEach(error => { document.getElementById(`plan-${error.name}-error`).textContent = error.message; document.getElementById(`plan-${error.name}`).setAttribute('aria-invalid', 'true'); });
        document.getElementById(`plan-${errors[0].name}`).focus(); return;
      }
      persist();
      if (step < config.steps.length - 1) { step++; showStep(true); }
      else showReport();
    });
    shell.append(form); root.append(shell, sessionNote()); if (focus) focusHeading(heading);
  }
  function showReport() {
    currentReport = rules.report(tool, answers);
    const r = currentReport;
    root.replaceChildren();
    const shell = node('section', 'plan-app-shell'); shell.id = 'planning-result';
    shell.append(node('p', 'plan-print-mark', 'DENALI TECH | Planning & Help Center | denalitechs.com/planning/'));
    shell.append(node('p', 'plan-eyebrow', 'Your starting plan'));
    const heading = node('h2', 'plan-result-title', r.title); shell.append(heading, node('p', 'plan-report-intro', r.intro));
    if (r.metrics.length) {
      const metrics = node('div', 'plan-metrics'); r.metrics.forEach(m => { const el = node('div', 'plan-metric'); el.append(node('strong', '', m.value), node('span', '', m.label)); metrics.append(el); }); shell.append(metrics);
    }
    const exportBar = node('div', 'plan-export');
    const status = node('p', 'plan-status'); status.setAttribute('role', 'status');
    exportBar.append(button('Print / save PDF', 'plan-button', () => {
      const closed = [...shell.querySelectorAll('details:not([open])')]; closed.forEach(d => { d.open = true; });
      const restore = () => { closed.forEach(d => { d.open = false; }); window.removeEventListener('afterprint', restore); };
      window.addEventListener('afterprint', restore); window.print();
    }), button('Copy summary', 'plan-button', async () => {
      try { await navigator.clipboard.writeText(rules.asText(r)); status.textContent = 'Summary copied. You can paste it into an email or share it with your builder.'; }
      catch (_) {
        let area = document.getElementById('plan-copy-fallback');
        if (!area) { area = node('textarea', 'plan-copy-box'); area.id = 'plan-copy-fallback'; area.setAttribute('aria-label', 'Your summary — select and copy'); area.readOnly = true; exportBar.after(area); }
        area.value = rules.asText(r); area.focus(); area.select(); status.textContent = 'Select and copy the summary below.';
      }
    }), button('Download summary', 'plan-button', () => {
      const url = URL.createObjectURL(new Blob([rules.asText(r)], { type: 'text/plain;charset=utf-8' }));
      const link = node('a'); link.href = url; link.download = `denali-${tool}-plan.txt`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }), button('Edit answers', 'plan-button', () => { step = 0; showStep(true); }));
    shell.append(exportBar, status);
    r.groups.forEach(group => {
      const section = node('section', 'plan-report-group'); section.append(node('h3', '', group.title));
      group.items.forEach(item => {
        const article = node('div', 'plan-report-item'); article.append(node('h4', '', item.title), node('p', '', item.detail));
        const detail = node('details'); detail.append(node('summary', '', 'Why this matters'), node('p', '', item.why)); article.append(detail); section.append(article);
      }); shell.append(section);
    });
    const facts = node('details', 'plan-facts'); facts.append(node('summary', '', 'Review the answers behind this plan'));
    const list = node('dl'); r.facts.forEach(f => { list.append(node('dt', '', f.label), node('dd', '', f.value)); }); facts.append(list); shell.append(facts);
    const review = node('section', 'plan-review'); review.append(node('h3', '', r.next), node('p', '', 'Your summary will be included in the contact form. Add your name, email, and city or ZIP so we can review the next step. Phone is optional.'));
    const reviewButton = button('Have Denali review my plan', 'plan-button plan-button-primary', () => {
      const stored = session.write(storage, session.handoffKey, { tool, text: rules.asText(r) });
      const href = `/contact/?source=planning-center&guide=${encodeURIComponent(tool)}&planner=${encodeURIComponent(tool)}#booking`;
      if (stored) window.location.assign(href);
      else {
        status.textContent = 'Your browser cannot carry the summary to the next page. Copy or download it first, then paste it into Project details.';
        let continueLink = document.getElementById('plan-contact-fallback');
        if (!continueLink) { continueLink = node('a', 'plan-button', 'Continue to contact form'); continueLink.id = 'plan-contact-fallback'; continueLink.href = href; review.append(continueLink); }
        status.scrollIntoView({ block: 'center' });
      }
    });
    review.append(reviewButton, node('small', '', 'Nothing is sent until you submit the contact form. This is a planning brief, not a quote or a confirmed design.'));
    shell.append(review, node('p', 'plan-method', `Rule-based planning, version ${rules.version}. Results follow your answers; no automated fault diagnosis or product-compatibility guarantee is made.`));
    root.append(shell, sessionNote()); focusHeading(heading);
  }
  showStep(false);
})();
