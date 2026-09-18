(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DenaliPlanSession = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const key = 'denali-planning-v1';
  const handoffKey = 'denali-planning-handoff-v1';
  const maxAge = 24 * 60 * 60 * 1000;
  function read(storage, name, now = Date.now()) {
    try {
      const data = JSON.parse(storage.getItem(name));
      if (!data || data.schema !== 1 || !Number.isFinite(data.savedAt) || now - data.savedAt > maxAge || data.savedAt > now + 60000) return null;
      return data;
    } catch (_) { return null; }
  }
  function write(storage, name, data) {
    try { storage.setItem(name, JSON.stringify({ ...data, schema: 1, savedAt: Date.now() })); return true; }
    catch (_) { return false; }
  }
  function handoff(storage, tool) {
    const value = read(storage, handoffKey);
    if (!['prewire', 'cameras', 'existing'].includes(tool) || !value || value.tool !== tool || typeof value.text !== 'string' || value.text.length < 10 || value.text.length > 25000) return null;
    const services = { prewire: 'Control4 / Smart Home', cameras: 'Cameras & Security', existing: 'Existing System Help / Not Sure' };
    return { tool, text: value.text, service: services[tool] };
  }
  return { key, handoffKey, maxAge, read, write, handoff };
});
