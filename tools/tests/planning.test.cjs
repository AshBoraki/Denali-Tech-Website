const { test } = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../../assets/js/planning-rules.js');
const session = require('../../assets/js/planning-session.js');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const mockStore = () => { const data = new Map(); return { getItem: k => data.get(k) || null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) }; };

function planningContactEnvironment(search = '?planner=cameras') {
  const storage = mockStore();
  const summary = 'My planning summary: review the driveway views.';
  session.write(storage, session.handoffKey, { tool: 'cameras', text: summary });
  function element(tag) {
    const attributes = new Map();
    return {
      tagName: tag.toUpperCase(), value: '', textContent: '', style: {}, children: [],
      listeners: {}, events: [], required: false, focused: false, removed: false,
      classList: { add() {}, remove() {} },
      setAttribute(name, value) { attributes.set(name, String(value)); },
      getAttribute(name) { return attributes.get(name) ?? null; },
      hasAttribute(name) { return name === 'required' ? this.required : attributes.has(name); },
      removeAttribute(name) { attributes.delete(name); },
      append(...nodes) { this.children.push(...nodes); },
      prepend(node) { this.children.unshift(node); },
      addEventListener(name, listener) { this.listeners[name] = listener; },
      dispatchEvent(event) { this.events.push(event); },
      focus() { this.focused = true; },
      remove() { this.removed = true; }
    };
  }
  const form = element('form'), details = element('textarea'), phone = element('input');
  const service = element('select'), phoneLabel = element('label');
  phone.type = 'tel'; phone.required = true;
  phone.setAttribute('aria-required', 'true');
  service.options = [{ value: '' }, { value: 'Cameras & Security' }];
  const nodes = { 'booking-form': form, 'booking-details': details, 'booking-phone': phone, 'booking-service': service };
  const document = {
    readyState: 'complete',
    getElementById: id => nodes[id],
    querySelector: selector => selector === 'label[for="booking-phone"]' ? phoneLabel : null,
    createElement: element
  };
  const source = fs.readFileSync(path.resolve(__dirname, '../../assets/js/planning-contact.js'), 'utf8');
  vm.runInNewContext(source, {
    window: { location: { search }, sessionStorage: storage, DenaliPlanSession: session },
    document, URLSearchParams, Event
  });
  return { form, details, phone, phoneLabel, storage, summary };
}

function contactValidationSource() {
  const html = fs.readFileSync(path.resolve(__dirname, '../../contact/index.html'), 'utf8');
  const start = html.indexOf('function validateField(');
  assert.notEqual(start, -1);
  const opening = html.indexOf('{', start);
  let depth = 1, end = opening + 1;
  while (depth && end < html.length) {
    if (html[end] === '{') depth++;
    if (html[end] === '}') depth--;
    end++;
  }
  assert.equal(depth, 0);
  const submitStart = html.indexOf("bookingForm.addEventListener('submit',");
  assert.notEqual(submitStart, -1);
  const block = html.slice(submitStart).match(/const requiredFields = bookingForm\.querySelectorAll\([^;]+\);\s*const invalidFields = [^;]+;/);
  assert.ok(block, 'The contact submit handler must run its field validation query');
  return html.slice(start, end) + '\n' + block[0] + '\ninvalidFields;';
}

test('planner links/resources resolve locally and structured data parses', () => {
  const root = path.resolve(__dirname, '../..');
  for (const file of ['planning/index.html','planning/prewire/index.html','planning/cameras/index.html','planning/existing-system/index.html']) {
    const html = fs.readFileSync(path.join(root,file), 'utf8');
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (!match[1].startsWith('/')) continue;
      const target = decodeURIComponent(match[1].split(/[?#]/)[0]);
      assert.ok(fs.existsSync(path.join(root,target)), `${file}: missing ${target}`);
    }
    for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) assert.doesNotThrow(() => JSON.parse(match[1]));
  }
});

test('continuous storage uses decimal TB without invented compression savings', () => {
  assert.equal(rules.storageTB(4, 4, 14), 2.4192);
  assert.equal(rules.storageTB(4, 4, 14, 25), 0.6048);
  const r = rules.report('cameras', rules.defaults('cameras'));
  assert.equal(r.metrics[1].value, '2.42 TB');
  assert.equal(r.metrics[2].value, '3.02 TB');
  assert.match(rules.asText(r), /illustrative assumption/);
});
test('invalid camera scenarios are rejected; inactive assumptions do not block', () => {
  for (const value of ['', '0', '-1', '65', '2.5', 'NaN', 'Infinity']) {
    assert.ok(rules.validate('cameras', { ...rules.defaults('cameras'), cameraCount: value }).some(e => e.name === 'cameraCount'));
  }
  const a = { ...rules.defaults('cameras'), bitrate: '', duty: '' };
  assert.equal(rules.validate('cameras', a).length, 0);
  assert.equal(rules.validate('cameras', { ...a, bitrateMode: 'known', schedule: 'event' }).length, 2);
  assert.throws(() => rules.storageTB(2, NaN, 14));
  assert.throws(() => rules.storageTB(2, 4, 14, 101));
});
test('all default plans work and camera unknowns are explicitly undecided', () => {
  for (const tool of Object.keys(rules.configs)) assert.ok(rules.report(tool, rules.defaults(tool)).groups.length);
  const text = rules.asText(rules.report('cameras', rules.defaults('cameras')));
  assert.match(text, /4 area categories remain undecided/);
  assert.match(text, /not camera positions/);
});
test('prewire flags chosen professional system and future preparation', () => {
  const a = { ...rules.defaults('prewire'), system: 'control4', shades: 'later', deadline: 'soon', rooms: ['office'] };
  const text = rules.asText(rules.report('prewire', a));
  assert.match(text, /Review the chosen system before rough-in/);
  assert.match(text, /PREPARE NOW, DECIDE EQUIPMENT LATER/);
  assert.match(text, /Home office/);
  assert.match(text, /before the next close-in milestone/);
});
test('finished surfaces and safety issues receive appropriate limits', () => {
  assert.match(rules.asText(rules.report('prewire', { access: 'closed' })), /Review accessible routes first/);
  const text = rules.asText(rules.report('existing', { safety: 'yes' }));
  assert.match(text, /Do not wait for this website inquiry/);
  assert.doesNotMatch(text, /Ask about an initial diagnostic/);
  assert.doesNotMatch(text, /Use normal controls|Identify the equipment safely/);
  assert.match(rules.asText(rules.report('existing', { safety: 'no' })), /Avoid factory resets/);
});
test('foreign fields and invalid enum values cannot influence results', () => {
  const a = rules.sanitize('existing', { home: '<script>', systems: ['control4','control4','fake'], password: 'do-not-store' });
  assert.equal(a.home, 'unknown');
  assert.deepEqual(a.systems, ['control4']);
  assert.equal(a.password, undefined);
});
test('shared saved state has a bounded lifetime; corrupt storage is harmless', () => {
  const storage = mockStore();
  assert.equal(session.write(storage, session.key, { profile: { home: 'house' } }), true);
  const data = session.read(storage, session.key);
  assert.equal(data.profile.home, 'house');
  assert.equal(session.read(storage, session.key, data.savedAt + session.maxAge + 1), null);
  assert.equal(session.read(storage, session.key, data.savedAt - 120000), null);
  storage.setItem(session.key, 'bad json'); assert.equal(session.read(storage, session.key), null);
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(session.read(blocked, session.key), null); assert.equal(session.write(blocked, session.key, {}), false);
});
test('contact handoff is scoped to a known tool and allowlisted service', () => {
  const storage = mockStore();
  session.write(storage, session.handoffKey, { tool: 'cameras', text: 'My planning summary', service: 'malicious choice' });
  assert.equal(session.handoff(storage, 'cameras').service, 'Cameras & Security');
  assert.equal(session.handoff(storage, 'existing'), null);
  assert.equal(session.handoff(storage, 'constructor'), null);
  session.write(storage, session.handoffKey, { tool: 'cameras', text: 'x'.repeat(25001) });
  assert.equal(session.handoff(storage, 'cameras'), null);
});

test('removing an edited planning summary preserves all edits and announces manual removal', () => {
  const env = planningContactEnvironment();
  assert.equal(env.details.value, env.summary);
  const banner = env.form.children[0], message = banner.children[0], remove = banner.children[1];
  const edited = env.summary.replace('driveway views', 'front entrances') + '\nMy own project notes.';
  env.details.value = edited;
  remove.listeners.click();
  assert.equal(env.details.value, edited);
  assert.equal(env.details.focused, true);
  assert.equal(env.details.events.length, 0, 'No input change should be signaled when text was preserved');
  assert.equal(remove.removed, false);
  assert.equal(session.handoff(env.storage, 'cameras').text, env.summary);
  assert.equal(message.getAttribute('role'), 'status');
  assert.match(message.textContent, /edited.*kept your changes/);
  assert.doesNotMatch(message.textContent, /was removed/);
});

test('removing an unchanged planning summary keeps added notes and clears the handoff', () => {
  const env = planningContactEnvironment();
  const banner = env.form.children[0], message = banner.children[0], remove = banner.children[1];
  env.details.value += '\n\nMy own project notes.';
  remove.listeners.click();
  assert.equal(env.details.value, 'My own project notes.');
  assert.equal(remove.removed, true);
  assert.equal(session.handoff(env.storage, 'cameras'), null);
  assert.equal(env.details.events.length, 1);
  assert.equal(env.details.events[0].type, 'input');
  assert.equal(env.details.events[0].bubbles, true);
  assert.match(message.textContent, /summary was removed/);
});

test('optional phone marker is restricted to allowlisted planner arrivals', () => {
  for (const tool of ['prewire', 'cameras', 'existing']) {
    const env = planningContactEnvironment('?planner=' + tool);
    assert.equal(env.phone.required, false, tool);
    assert.equal(env.phone.getAttribute('aria-required'), 'false', tool);
    assert.equal(env.phone.getAttribute('data-planner-optional-phone'), 'true', tool);
    assert.match(env.phoneLabel.textContent, /optional/);
  }
  for (const search of ['', '?planner=unknown', '?planner=constructor']) {
    const env = planningContactEnvironment(search);
    assert.equal(env.phone.required, true, search);
    assert.equal(env.phone.getAttribute('aria-required'), 'true', search);
    assert.equal(env.phone.getAttribute('data-planner-optional-phone'), null, search);
    assert.equal(env.form.children.length, 0, search);
  }
});

test('actual contact submit query validates populated optional planner phone but permits blank', () => {
  const { phone } = planningContactEnvironment();
  const source = contactValidationSource();
  const queried = [];
  const bookingForm = {
    querySelectorAll(selector) {
      queried.push(selector);
      const matches = selector.split(',').some(part => {
        const input = part.trim().match(/^input\[([\w-]+)\]$/);
        return input && phone.hasAttribute(input[1]);
      });
      return matches ? [phone] : [];
    }
  };
  for (const [value, invalid] of [['', false], ['123', true], ['(312) 555-1212', false]]) {
    phone.value = value;
    const result = vm.runInNewContext(source, {
      bookingForm, validationTimeouts: new Map(), clearTimeout, setTimeout,
      getFieldErrorElement: () => null
    });
    assert.equal(result.length, invalid ? 1 : 0, 'Phone value: ' + JSON.stringify(value));
    if (invalid) assert.equal(result[0], phone);
  }
  assert.ok(queried.every(selector => selector.includes('input[data-planner-optional-phone]')));
});

test('immediate safety issues suppress normal-use advice across router and upgrade answers', () => {
  for (const goal of ['takeover', 'repair', 'upgrade']) {
    for (const change of ['router', 'power']) {
      const report = rules.report('existing', { safety: 'yes', goal, change });
      assert.equal(report.groups.length, 1);
      assert.equal(report.groups[0].title, 'Address the immediate safety issue first');
      assert.doesNotMatch(rules.asText(report), /Use normal controls|familiar keypad or remote|Take a photo/);
    }
  }
});
