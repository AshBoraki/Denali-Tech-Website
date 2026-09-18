(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DenaliPlanning = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const version = '2026-09-17.1';
  const choice = (name, label, options, help) => ({ name, label, type: 'select', options, help });
  const number = (name, label, min, max, value, help, step = 1) => ({ name, label, type: 'number', min, max, value, help, step });
  const unknown = ['unknown', 'Not sure yet'];
  const profile = [
    choice('home', 'What kind of home is it?', [unknown, ['house', 'Single-family home'], ['townhome', 'Townhome'], ['condo', 'Condo / apartment']]),
    choice('stage', 'Where are you in the project?', [unknown, ['planning', 'Planning a build or remodel'], ['building', 'Construction is underway'], ['living', 'Living in the home'], ['moving', 'Just bought / moving in']]),
    choice('access', 'Can new wiring still be installed?', [unknown, ['open', 'Walls or ceilings are open'], ['partial', 'Some areas are accessible'], ['closed', 'Walls and ceilings are finished']]),
    choice('floors', 'How many levels need service?', [unknown, ['one', 'One'], ['two', 'Two'], ['three', 'Three or more']])
  ];
  const features = [
    ['wifi', 'Wi-Fi & wired networking', 'Review access-point locations and wired connections for TVs, desks, and equipment.', 'Coverage depends on layout and building materials; floor area alone does not determine access-point count.'],
    ['tv', 'TVs & home theater', 'Confirm screens, seating, speaker positions, equipment access, and cable routes.', 'Furniture, screen height, and equipment location affect the infrastructure before equipment is purchased.'],
    ['audio', 'Music around the home', 'Choose listening rooms and coordinate speaker locations and cable routes.', 'Speaker placement and ceiling construction are easier to coordinate before finishes.'],
    ['lighting', 'Lighting & keypads', 'Have Denali and the electrician agree on the lighting system, loads, keypads, and wiring layout.', 'Panelized and local lighting systems can require different infrastructure. The system choice may need to happen now.'],
    ['shades', 'Motorized shades', 'Review window sizes, shade type, pockets, power, and service access before trim or ceilings close.', 'Power and mounting requirements vary by shade system; a generic cable plan cannot confirm compatibility.'],
    ['cameras', 'Cameras & doorbell', 'Mark the views that matter and coordinate cable routes, mounting surfaces, and entry equipment.', 'The lens, mounting height, lighting, and distance must suit the actual view.'],
    ['outdoor', 'Patio & outdoor spaces', 'Review outdoor Wi-Fi, audio, cameras, equipment locations, and routes before landscaping.', 'Exterior routing, weather exposure, and service access need coordination.'],
    ['control', 'One system to control it all', 'Review Control4 or other chosen controls, equipment location, and normal wall controls.', 'Controller, keypad, and touchscreen requirements depend on the chosen system.']
  ];
  const intent = [['skip', 'Not part of this project'], ['now', 'I want this now'], ['later', 'Maybe later — prepare for it'], ['unknown', 'Help me decide']];
  const roomOptions = [['living', 'Living / family room'], ['kitchen', 'Kitchen'], ['bedrooms', 'Bedrooms'], ['office', 'Home office'], ['theater', 'Theater / media room'], ['entry', 'Entry / driveway'], ['outdoor', 'Patio / yard'], ['unknown', 'Rooms are not decided']];
  const zones = [['front', 'Front entrances'], ['rear', 'Back / side entrances'], ['drive', 'Driveway / garage views'], ['yard', 'Yard / patio views']];
  const configs = {
    prewire: { title: 'Pre-wire planner', service: 'Control4 / Smart Home', steps: [
      { title: 'A little about your home', intro: 'These answers can carry over to the other planners in this tab.', fields: profile },
      { title: 'What would you like your home to do?', intro: 'Choose what matters now, what can wait, and where you would like advice.', fields: features.map(f => choice(f[0], f[1], intent)) },
      { title: 'Decisions before the walls close', intro: 'A few details help separate what to coordinate now from what can wait.', fields: [
        { name: 'rooms', label: 'Which spaces are part of the project?', type: 'checks', options: roomOptions },
        choice('system', 'Have you chosen a control or lighting system?', [unknown, ['control4', 'Control4'], ['lutron', 'Lutron'], ['both', 'Control4 and Lutron'], ['other', 'Another professional system'], ['none', 'No system chosen']]),
        choice('deadline', 'When do wiring decisions need to be settled?', [unknown, ['soon', 'Within two weeks'], ['month', 'Within a month'], ['later', 'More than a month away'], ['finished', 'The walls are already finished']]),
        choice('reliability', 'What matters most in daily use?', [unknown, ['manual', 'Keep familiar wall and room controls'], ['local', 'Understand what works during an internet outage'], ['both', 'Both']])
      ] }
    ]},
    cameras: { title: 'Camera & storage planner', service: 'Cameras & Security', steps: [
      { title: 'A little about your home', intro: 'Use your existing home profile, or adjust it for this project.', fields: profile },
      { title: 'Which views matter?', intro: 'Count the separate views you want to review. A view is a planning need, not a guaranteed camera count.', fields: [
        ...zones.map(z => choice(z[0], z[1], [unknown, ['0', 'None'], ['1', '1 view'], ['2', '2 views'], ['3', '3 views'], ['4', '4 views']])),
        choice('night', 'What is the lighting like after dark?', [unknown, ['lit', 'Usually well lit'], ['dark', 'Mostly dark'], ['mixed', 'Mixed / changing light']]),
        choice('recording', 'What matters most about recordings?', [unknown, ['history', 'Review what happened later'], ['alerts', 'Useful alerts and recorded events'], ['backup', 'Keep evidence if a recorder is damaged or taken']])
      ]},
      { title: 'Explore recording storage', intro: 'Start with an example, then change the numbers. These settings model storage; they do not select cameras or a recorder.', fields: [
        number('cameraCount', 'Cameras in this example', 1, 64, 4, 'An editable scenario, not a recommendation based on your home.'),
        choice('bitrateMode', 'Do you know the average recorded bitrate?', [['example', 'No — use a 4 Mbps example'], ['known', 'Yes — I will enter it']]),
        number('bitrate', 'Average recorded bitrate per camera (Mbps)', 0.1, 100, 4, 'Use the average for the recorded stream, not internet speed or resolution.', 0.1),
        number('days', 'Days of recordings to model', 1, 365, 14),
        choice('schedule', 'Recording schedule', [['continuous', 'Continuous — 24 hours a day'], ['event', 'Events only — estimated share of the day']]),
        number('duty', 'Estimated recording time (% of each day)', 1, 100, 25, 'Event duration is an assumption. Pre/post-event recording and a busy scene can increase it.')
      ]}
    ]},
    existing: { title: 'Existing-system assessment', service: 'Existing System Help / Not Sure', steps: [
      { title: 'A little about your home', intro: 'Start with the home, then tell us what you would like help with.', fields: profile },
      { title: 'What is already there?', intro: 'It is fine if you do not know the brand or model. You can add details when you send your request.', fields: [
        { name: 'systems', label: 'Which systems are involved?', type: 'checks', options: [['control4', 'Control4'], ['urc', 'URC'], ['sonos', 'Sonos / audio'], ['lutron', 'Lutron / lighting'], ['wifi', 'Wi-Fi / network'], ['cameras', 'Cameras / doorbell'], ['unknown', 'Not sure']] },
        choice('goal', 'What do you need?', [unknown, ['takeover', 'Learn and service a system in a home I bought'], ['repair', 'Fix something that stopped working'], ['upgrade', 'Improve or expand a working system']]),
        choice('scope', 'How much of the system is affected?', [unknown, ['one', 'One device or room'], ['several', 'Several rooms or functions'], ['all', 'Most or all of the system'], ['working', 'Everything works — I want advice']])
      ]},
      { title: 'What changed?', intro: 'You do not need to reset equipment or open the rack to finish this assessment.', fields: [
        choice('change', 'Did anything change around the same time?', [unknown, ['router', 'Internet provider, router, or Wi-Fi'], ['power', 'Power outage'], ['equipment', 'TV, streaming player, or another device'], ['none', 'No known change']]),
        choice('internet', 'Does ordinary internet access work?', [unknown, ['yes', 'Yes, my phone or laptop works'], ['no', 'No, internet is also down']]),
        choice('timing', 'When did the issue start?', [unknown, ['today', 'Today / recently'], ['weeks', 'A few weeks ago'], ['long', 'It has been this way for a while'], ['noissue', 'No issue — planning a change']]),
        choice('safety', 'Is there an immediate safety problem?', [unknown, ['no', 'No'], ['yes', 'Yes — an active alarm, hazard, or unsafe access']])
      ]}
    ]}
  };
  function fields(tool) { return configs[tool] ? configs[tool].steps.flatMap(s => s.fields) : []; }
  function defaults(tool) {
    return Object.fromEntries(fields(tool).map(f => [f.name, f.type === 'number' ? String(f.value) : f.type === 'checks' ? [] : f.options[0][0]]));
  }
  function sanitize(tool, source) {
    const result = defaults(tool);
    if (!source || typeof source !== 'object') return result;
    for (const f of fields(tool)) {
      const v = source[f.name];
      if (f.type === 'checks' && Array.isArray(v)) result[f.name] = [...new Set(v.filter(x => f.options.some(o => o[0] === x)))];
      else if (f.type === 'select' && f.options.some(o => o[0] === v)) result[f.name] = v;
      else if (f.type === 'number' && typeof v === 'string' && v.length <= 10) result[f.name] = v;
    }
    return result;
  }
  function active(f, a) { return !(f.name === 'bitrate' && a.bitrateMode !== 'known') && !(f.name === 'duty' && a.schedule !== 'event'); }
  function validate(tool, answers, step) {
    const list = step === undefined ? fields(tool) : configs[tool].steps[step].fields;
    return list.filter(f => f.type === 'number' && active(f, answers)).flatMap(f => {
      const raw = answers[f.name];
      const value = Number(raw);
      if (raw == null || String(raw).trim() === '' || !Number.isFinite(value) || value < f.min || value > f.max || (f.step === 1 && !Number.isInteger(value))) {
        return [{ name: f.name, message: `Enter ${f.step === 1 ? 'a whole number' : 'a number'} from ${f.min} to ${f.max}.` }];
      }
      return [];
    });
  }
  function storageTB(count, mbps, days, duty = 100) {
    if (![count, mbps, days, duty].every(n => typeof n === 'number' && Number.isFinite(n) && n > 0) || duty > 100 || !Number.isInteger(count)) throw new RangeError('Invalid recording scenario');
    return count * mbps * 1000000 / 8 * 86400 * days * (duty / 100) / 1e12;
  }
  function label(tool, name, value) {
    const f = fields(tool).find(f => f.name === name);
    if (!f) return '';
    if (Array.isArray(value)) return value.length ? value.map(v => f.options.find(o => o[0] === v)?.[1]).filter(Boolean).join(', ') : 'Not selected';
    return f.options ? (f.options.find(o => o[0] === value)?.[1] || 'Not sure yet') : String(value);
  }
  function report(tool, input) {
    if (!configs[tool]) throw new RangeError('Unknown planner');
    const a = sanitize(tool, input);
    const errors = validate(tool, a);
    if (errors.length) throw new RangeError(errors.map(e => e.message).join(' '));
    const result = { title: configs[tool].title, version, groups: [], metrics: [], facts: [], service: configs[tool].service };
    const group = (title, items) => { if (items.length) result.groups.push({ title, items }); };
    const item = (title, detail, why) => ({ title, detail, why });
    result.facts = fields(tool).filter(f => active(f, a)).map(f => ({ label: f.label, value: label(tool, f.name, a[f.name]) }));
    if (tool === 'prewire') {
      result.intro = 'Your starting brief for a conversation with Denali and your builder. Confirm the wiring design before installation.';
      const now = [], later = [], questions = [];
      if (a.access === 'closed' || a.deadline === 'finished') now.push(item('Review accessible routes first', 'Plan around finished surfaces, usable pathways, and the work involved in opening and repairing walls.', 'Your answers indicate the home is finished or the wiring window has closed.'));
      else now.push(item('Coordinate the wiring window', a.deadline === 'soon' ? 'Contact Denali and your builder before the next close-in milestone.' : 'Confirm when wiring, equipment locations, and trade decisions must be approved.', a.access === 'unknown' ? 'Wiring access is not confirmed yet.' : 'Changes are easier to plan while accessible areas are still open.'));
      if (['control4', 'lutron', 'both', 'other'].includes(a.system)) now.push(item('Review the chosen system before rough-in', 'Bring the selected platform into the design review now, including lighting, shade, keypad, and controller requirements.', 'You have already chosen a professional system. Some infrastructure choices cannot be deferred.'));
      for (const f of features) {
        if (a[f[0]] === 'now') now.push(item(f[1], f[2], f[3]));
        if (a[f[0]] === 'later') later.push(item(f[1], `Reserve practical routes, space, and access for ${f[1].toLowerCase()}. ${f[2]}`, 'Preparing for later still requires review of any system-specific power, wiring, and mounting decisions.'));
        if (a[f[0]] === 'unknown') questions.push(item(f[1], 'Discuss the desired result and whether it affects the current construction work.', f[3]));
      }
      if (!features.some(f => ['now', 'later', 'unknown'].includes(a[f[0]]))) questions.push(item('Choose the rooms and outcomes first', 'No systems were selected. Use this as a starting conversation before deciding what to wire.', 'The planner cannot infer what you want from the home profile alone.'));
      now.push(item('Agree on the equipment home', 'Coordinate a dry, accessible equipment location with power, ventilation, cable routes, and room to service it.', 'Good service access matters after the house is finished.'));
      if (a.reliability !== 'unknown') now.push(item('Agree on everyday fallback controls', 'Ask what works locally during an internet outage and how each room is operated normally.', 'Outage behavior depends on the actual system and integrations.'));
      group('Coordinate before construction moves on', now); group('Prepare now, decide equipment later', later); group('Decisions to talk through', questions);
      const rooms = a.rooms.filter(r => r !== 'unknown');
      group('Room-by-room handoff', rooms.length ? rooms.map(r => item(label(tool, 'rooms', [r]), 'Mark device and furniture locations, accessible routes, power needs, and finish constraints on the room plan.', 'Have the builder, electrician, and Denali agree on responsibilities before work begins.')) : [item('Room list still needed', 'Bring a room list or a marked-up plan to the design conversation.', 'No individual rooms have been selected yet.')]);
      result.next = 'Have Denali review the plan before walls close.';
    } else if (tool === 'cameras') {
      const known = zones.reduce((sum, z) => sum + (a[z[0]] === 'unknown' ? 0 : Number(a[z[0]])), 0);
      const uncertain = zones.filter(z => a[z[0]] === 'unknown').length;
      const bitrate = a.bitrateMode === 'known' ? Number(a.bitrate) : 4;
      const duty = a.schedule === 'event' ? Number(a.duty) : 100;
      const tb = storageTB(Number(a.cameraCount), bitrate, Number(a.days), duty);
      const fmt = n => n < .01 ? n.toFixed(4) : n.toFixed(2);
      result.intro = 'A coverage discussion and a transparent storage example. Camera count, lenses, recorder compatibility, and usable disk capacity still need a site-specific design.';
      result.metrics = [{ value: String(known), label: 'Views you identified' }, { value: `${fmt(tb)} TB`, label: 'Estimated video data' }, { value: `${fmt(tb * 1.25)} TB`, label: 'With 25% planning allowance' }];
      group('Coverage to review', [item('Views are not camera positions', `${known} views identified${uncertain ? `; ${uncertain} area categories remain undecided` : ''}. One camera may cover overlapping views, while one view may need separate cameras for different tasks.`, 'Lens, distance, obstructions, lighting, mounting, and the detail you need determine the design.'), item('Check the scene after dark', a.night === 'dark' ? 'Review lighting and night-time image detail at the actual locations.' : 'Check headlights, reflections, glass, shadows, and changing light at proposed locations.', 'Infrared through glass and bright reflections can make a useful daytime view poor at night.'), item('Plan camera and recording infrastructure', 'Review cable routes, PoE requirements, recording channels, network capacity, and installation access.', 'This planner does not verify a camera, switch, drive, or recorder model.')]);
      group('Your recording assumptions', [item(`${a.cameraCount} cameras × ${bitrate} Mbps × ${a.days} days`, `Recording for ${duty}% of each day. Decimal units: 1 TB = 1,000,000,000,000 bytes. ${a.bitrateMode === 'example' ? 'The 4 Mbps figure is an illustrative assumption, not a product specification.' : 'Uses your supplied average recorded bitrate.'}`, 'Video TB = cameras × Mbps × 1,000,000 ÷ 8 × 86,400 × days × recording fraction ÷ 1,000,000,000,000.'), item('The allowance is not a retention guarantee', 'A fixed 25% allowance is shown separately for planning. Confirm usable recorder capacity, formatting, reserve space, extra streams, and any redundancy.', 'Busy scenes and variable bitrate change storage use. No automatic codec saving is assumed.'), ...(a.schedule === 'event' ? [item('Events can last longer than expected', 'Compare this estimate with continuous recording before deciding on disks.', 'Movement, detection settings, and pre/post-event recording can increase the recorded share of each day.')] : [])]);
      group('Recording resilience and useful alerts', [item('Protect the evidence that matters', 'Discuss power backup, recorder placement, secure access, and whether separate backup is needed.', a.recording === 'backup' ? 'A local recorder alone cannot preserve evidence if it is taken or destroyed.' : 'A recorder and its power supply are separate failure points.'), item('Define useful notifications', 'Agree which events deserve an alert and which views should remain private.', 'Detection zones, lighting, and sensitivity need to be checked on the installed system.')]);
      result.next = 'Have Denali review the views and recording plan.';
    } else {
      result.intro = 'A service brief to help Denali understand your system. These answers do not identify a confirmed fault.';
      if (a.safety === 'yes') {
        group('Address the immediate safety issue first', [item('Use the appropriate emergency or monitoring support', 'For an active danger, contact emergency services or the relevant safety provider. Do not wait for this website inquiry to be read.', 'Denali’s project form is not an emergency service.')]);
        result.next = 'Once the immediate issue is addressed, arrange a system review.';
      } else {
        const onsite = a.goal === 'takeover' || a.internet === 'no' || a.scope === 'all' || a.change === 'power';
        group('A practical next step', [item(onsite ? 'Start with a service assessment' : 'Ask about an initial diagnostic', onsite ? 'An in-home visit may be useful to identify equipment, check physical connections, and understand the existing installation.' : 'Denali can first review the symptoms and decide whether remote access or an in-home visit is appropriate.', 'Reachability, ownership, permissions, and the condition of the equipment determine what can be done remotely.')]);
        result.next = 'Send the summary so Denali can recommend the right service visit.';
      group('Useful details to bring', [item('Describe one example', 'Note the room, what you tried using normally, the exact on-screen message, and what still works.', 'Specific symptoms help separate a room problem from a shared system issue.'), item('Identify the equipment safely', 'Take a photo of visible product names or your normal control interface if you can do so without moving equipment. Hide passwords, access codes, addresses, and private camera views.', 'You do not need to know every model before asking for help.'), ...(a.goal === 'takeover' ? [item('Gather the handover information', 'Bring any equipment list, installation paperwork, and previous service contact you have. Arrange account ownership and access through the proper provider process.', 'A takeover requires permission and available project information; this assessment cannot confirm access.')] : [])]);
      if (a.change === 'router') group('After an internet or router change', [item('Separate internet access from smart-home control', 'Note whether a phone can browse normally and whether a familiar keypad or remote still works.', 'A new network can affect integrated devices even when general internet access works.')]);
      if (a.goal === 'upgrade') group('Plan the improvement', [item('Keep the working system documented', 'Describe what you want to add and which existing functions you want to keep.', 'Compatibility and upgrade requirements depend on the installed models and software.')]);
      group('While you wait for service', [item('Use normal controls and keep the clues', 'Avoid factory resets, firmware updates, changing network settings, or unplugging the rack. Keep a note of symptoms and timing.', 'Unplanned changes can hide the original problem or interrupt other systems.')]);
      }
    }
    return result;
  }
  function asText(r) {
    return [`DENALI TECH — ${r.title}`, `Planning rules: ${r.version}`, '', r.intro, '', 'YOUR ANSWERS', ...r.facts.map(f => `${f.label}: ${f.value}`), '', ...r.metrics.map(m => `${m.label}: ${m.value}`), ...r.groups.flatMap(g => ['', g.title.toUpperCase(), ...g.items.map(i => `• ${i.title}\n  ${i.detail}\n  Why: ${i.why}`)]), '', r.next, '', 'Planning guidance; final design and equipment selection require professional review.', 'denalitechs.com | (312) 439-7500'].join('\n');
  }
  return { version, profile, configs, fields, defaults, sanitize, active, validate, storageTB, report, asText };
});
