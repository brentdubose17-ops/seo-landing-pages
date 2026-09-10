#!/usr/bin/env node
/*
 * Verification harness for the GPT-Live-1 voice + backend cost calculator.
 *
 * It does NOT re-implement the model. It extracts the real inline script from
 * the shipped HTML file, runs it inside a node `vm` with a DOM stub built from
 * the page's own markup (so the defaults under test are the page's defaults),
 * then asserts:
 *   A. the executable contract checkpoints from the verified facts sheet (C)
 *   B. the card's acceptance criteria
 *   C. the live DOM wiring (real output element ids, real rendered text)
 *   D. the machine-readable export round-trips
 *   E. preset switching visibly changes totals
 *   F. every id the script writes to exists in the shipped HTML
 *
 * Usage:
 *   node gpt-live-1-verify.mjs [path/to/page.html] [--emit path/to/model.js]
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const args = process.argv.slice(2);
const emitIdx = args.indexOf('--emit');
const emitPath = emitIdx >= 0 ? args[emitIdx + 1] : null;
const htmlPath = args.find((a) => !a.startsWith('--') && a !== emitPath) ||
  path.join(path.dirname(new URL(import.meta.url).pathname), 'gpt-live-1-cost-calculator.html');

const html = fs.readFileSync(htmlPath, 'utf8');

/* ---------------------------------------------------------------- assertions */
let passed = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) { passed++; return; }
  failures.push(`${name}${detail ? ' :: ' + detail : ''}`);
}
function near(name, actual, expected, tol = 1e-9, detail = '') {
  const c = typeof actual === 'number' && isFinite(actual) && Math.abs(actual - expected) <= tol;
  ok(name, c, `expected ${expected}, got ${actual}${detail ? ' (' + detail + ')' : ''}`);
}
function eq(name, actual, expected) {
  ok(name, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

/* ------------------------------------------------------- DOM stub from HTML */
const inputRe = /<input\b[^>]*>/gi;
const selectRe = /<select\b[^>]*>[\s\S]*?<\/select>/gi;
const buttonRe = /<button\b[^>]*data-preset="[^"]*"[^>]*>/gi;

const seed = new Map();
const present = new Set();

function attr(tag, name) {
  const m = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag);
  return m ? m[1] : null;
}

for (const m of html.matchAll(/\bid\s*=\s*"([^"]+)"/gi)) { present.add(m[1]); }

for (const tag of html.match(inputRe) || []) {
  const id = attr(tag, 'id');
  if (!id) continue;
  const type = (attr(tag, 'type') || 'text').toLowerCase();
  if (type === 'radio' || type === 'checkbox') {
    seed.set(id, { value: attr(tag, 'value') || 'on', checked: /\bchecked\b/i.test(tag) });
  } else {
    seed.set(id, { value: attr(tag, 'value') || '' });
  }
}
for (const block of html.match(selectRe) || []) {
  const id = attr(block, 'id');
  if (!id) continue;
  present.add(id);
  const opts = [...block.matchAll(/<option\b[^>]*>/gi)].map((m) => m[0]);
  const sel = opts.find((o) => /\bselected\b/i.test(o)) || opts[0];
  seed.set(id, { value: sel ? (attr(sel, 'value') || '') : '' });
}
const presetButtons = [...(html.match(buttonRe) || [])].map((tag) => ({
  id: attr(tag, 'id') || attr(tag, 'data-preset'),
  preset: attr(tag, 'data-preset')
}));
presetButtons.forEach((b) => { if (b.id) present.add(b.id); });

const missingIds = new Set();
const writes = new Map();

function makeEl(id) {
  const s = seed.get(id) || { value: '' };
  const node = {
    id,
    value: s.value,
    checked: !!s.checked,
    _text: '',
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    get textContent() { return this._text; },
    set textContent(v) { this._text = String(v); if (writes.has(id)) writes.set(id, String(v)); },
    addEventListener() {},
    removeEventListener() {},
    appendChild() {},
    removeChild() {},
    click() {},
    getAttribute(n) { return n === 'data-preset' ? (presetButtons.find((b) => b.id === id) || {}).preset : null; },
    setAttribute() {},
    focus() {}
  };
  return node;
}

const registry = new Map();
function getById(id) {
  if (!present.has(id)) { missingIds.add(id); return null; }
  if (!registry.has(id)) { registry.set(id, makeEl(id)); }
  return registry.get(id);
}

const documentStub = {
  getElementById: getById,
  querySelectorAll(sel) {
    if (/data-preset/.test(sel)) { return presetButtons.map((b) => getById(b.id)); }
    const m = /name="([^"]+)"/.exec(sel);
    if (m) {
      const name = m[1];
      return [...seed.keys()]
        .filter((id) => new RegExp(`name="${name}"`, 'i').test(
          (html.match(inputRe) || []).find((t) => attr(t, 'id') === id) || ''))
        .map((id) => getById(id));
    }
    return [];
  },
  addEventListener(type, fn) { if (type === 'DOMContentLoaded') { documentStub._ready = fn; } },
  createElement() { return makeEl('_created'); },
  body: { appendChild() {}, removeChild() {} }
};

const sandbox = {
  console,
  Math,
  JSON,
  Date,
  Number,
  String,
  isFinite,
  parseInt,
  parseFloat,
  escape,
  unescape,
  encodeURIComponent,
  decodeURIComponent,
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  navigator: { clipboard: { writeText() {} } },
  location: { href: 'https://aiagencycalculator.com/gpt-live-1-cost-calculator', hash: '' },
  document: documentStub,
  setTimeout
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

/* ------------------------------------------------- extract + run real script */
const scriptMatch = /<script id="gpt-live-cost-model">([\s\S]*?)<\/script>/.exec(html);
ok('inline script found in shipped HTML', !!scriptMatch);
if (!scriptMatch) { report(); process.exit(1); }
const inlineJs = scriptMatch[1];

let runError = null;
try { vm.runInContext(inlineJs, sandbox, { filename: 'gpt-live-cost-calculator-inline.js' }); }
catch (e) { runError = e; }
ok('inline script executes without throwing', !runError, runError && runError.stack);
if (runError) { report(); process.exit(1); }

const API = sandbox.window.GPT_LIVE;
ok('window.GPT_LIVE exposed', !!API);
if (!API) { report(); process.exit(1); }

/* -------------------------------------------------------- A. contract checks */
const { billedVoiceSeconds, voiceCostUsd, computeModel, exportModel, defaults } = API;
near("billed_voice_seconds(90,'webrtc') == 90", billedVoiceSeconds(90, 'webrtc'), 90, 0);
near("billed_voice_seconds(5,'webrtc') == 15", billedVoiceSeconds(5, 'webrtc'), 15, 0);
near("billed_voice_seconds(240,'webrtc') == 240", billedVoiceSeconds(240, 'webrtc'), 240, 0);
near("voice_cost_usd(40,'webrtc') == 0.03333333333333333", voiceCostUsd(40, 'webrtc'), 0.03333333333333333, 1e-15);
near("voice_cost_usd(240,'webrtc') == 0.2", voiceCostUsd(240, 'webrtc'), 0.2, 1e-15);
near("voice_cost_usd(90,'webrtc') == 0.075", voiceCostUsd(90, 'webrtc'), 0.075, 1e-15);
near("billed_voice_seconds(5,'websocket') == 5 (no documented init charge)",
  billedVoiceSeconds(5, 'websocket'), 5, 0);
ok('sub-15s WebRTC session never bills more than 15 s',
  Math.max(...[1, 5, 14, 15].map((s) => billedVoiceSeconds(s, 'webrtc'))) === 15);
ok('15 s floor is a floor, not an adder (90 s == 90 s)',
  billedVoiceSeconds(90, 'webrtc') === 90 && billedVoiceSeconds(90, 'webrtc') !== 105);

/* ----------------------------------------------------------- B. acceptance */
const dflt = computeModel(defaults);
near('default voice cost/call == $0.2000 (4:00)', dflt.voice.perCall, 0.2, 1e-12);
near('default voice cost/day == $200.00 (1,000 calls)', dflt.voice.day, 200, 1e-9);
near('default voice cost/month == $6,000 (30-day)', dflt.voice.month, 6000, 1e-9);
near('default voice cost at 31 days == $6,200', dflt.voice.monthAlt31, 6200, 1e-9);
near('default voice cost at 365/12 == $6,083.33', dflt.voice.monthAltAvg, 6083.333333333, 1e-6);
near('40-second call voice cost == $0.0333 (3.33 cents)', voiceCostUsd(40, 'webrtc'), 0.0333333, 1e-6);
near('5-second WebRTC call voice cost == $0.0125', voiceCostUsd(5, 'webrtc'), 0.0125, 1e-12);
ok('5-second WebSocket call bills less than the 15 s floor',
  voiceCostUsd(5, 'websocket') < voiceCostUsd(15, 'webrtc'));

const terra = computeModel({ ...defaults, backendModel: 'gpt-5.6-terra' });
const luna = computeModel({ ...defaults, backendModel: 'gpt-5.6-luna' });
const astra = computeModel({ ...defaults, backendModel: 'gpt-6-astra' });
const sol = computeModel({ ...defaults, backendModel: 'gpt-5.6-sol' });
near('backend Terra 6 turns x (1,500 in / 300 out) == $0.0396/call', terra.backend.perCall, 0.0396, 1e-12);
near('backend Luna same shape == $0.00396/call', luna.backend.perCall, 0.00396, 1e-12);
near('backend Astra same shape == $0.1800/call', astra.backend.perCall, 0.18, 1e-12);
near('backend Sol same shape == $0.0720/call', sol.backend.perCall, 0.072, 1e-12);
near('Terra backend/day == $39.60', terra.backend.day, 39.6, 1e-9);
near('Astra backend/day == $180.00', astra.backend.day, 180, 1e-9);
ok('totals change when the backend model changes',
  terra.total.perCall !== luna.total.perCall &&
  terra.total.perCall !== astra.total.perCall &&
  Math.abs(astra.backend.shareOfTotal - 0.47368) < 5e-4,
  `terra=${terra.total.perCall} luna=${luna.total.perCall} astra=${astra.total.perCall}`);

const noTools = computeModel({ ...defaults, toolSharePct: 0, toolCostPerInvocation: 0.01 });
const withTools = computeModel({ ...defaults, toolSharePct: 100, toolCostPerInvocation: 0.01 });
near('tool-call share drives tool spend (100% of 6 turns x $0.01)', withTools.backend.toolPerCall, 0.06, 1e-12);
near('tool spend is zero when the share is zero', noTools.backend.toolPerCall, 0, 1e-12);
ok('totals visibly change when the tool-call share changes',
  withTools.total.perCall - noTools.total.perCall > 0.059 && withTools.total.perCall !== noTools.total.perCall,
  `${noTools.total.perCall} -> ${withTools.total.perCall}`);
const toolExtra = computeModel({ ...defaults, toolSharePct: 100, toolExtraInTokens: 1000 });
near('tool-injected context tokens bill at the backend input rate',
  toolExtra.backend.perCall - computeModel({ ...defaults, toolSharePct: 100 }).backend.perCall,
  6 * 1000 * 2.0 / 1e6, 1e-12);
const cached = computeModel({ ...defaults, cachedSharePct: 80 });
near('cached input share lowers the backend bill',
  computeModel(defaults).backend.modelPerCall - cached.backend.modelPerCall,
  6 * 1500 * 0.8 * (2.0 - 0.20) / 1e6, 1e-12);
near('data-residency toggle applies the +10% uplift',
  computeModel({ ...defaults, dataResidency: true }).backend.perCall / terra.backend.perCall, 1.1, 1e-9);
near('long-context rate column switches Terra to $4/$18',
  computeModel({ ...defaults, longContext: true }).backend.perCall,
  6 * (1500 * 4.0 + 300 * 18.0) / 1e6, 1e-12);

/* ------------------------------------------------------------ concurrency */
const concDflt = computeModel(defaults).capacity;
near('calls/hour == 125 for 1,000 calls over 8 h', concDflt.callsPerHour, 125, 1e-9);
near('average concurrency == 8.33 sessions (1,000/day, 8 h, 240 s)', concDflt.average, 8.333333333, 1e-6);
near('peak concurrency formula multiplies by the peak factor',
  computeModel({ ...defaults, peakFactor: 2.5 }).capacity.required, 20.833333333, 1e-6);
eq('auto tier picks Tier 1 (25) for the default case', computeModel(defaults).capacity.tier, 1);
ok('default case fits its tier', computeModel(defaults).capacity.fits === true);
ok('default case is NOT flagged capacity-limited',
  computeModel(defaults).capacity.capacityLimited === false);
const stress = computeModel({ ...defaults, callsPerDay: 5000, callMm: 5, callSs: 0, operatingHoursPerDay: 8, peakFactor: 1 });
near('stress case: 5,000 calls/day, 5:00 calls, 8 h == 52.08 sessions', stress.capacity.required, 52.083333333, 1e-6);
eq('auto tier escalates to Tier 3 (200) for the stress case', stress.capacity.tier, 3);
const forced = computeModel({ ...defaults, callsPerDay: 5000, callMm: 5, callSs: 0, peakFactor: 1, tier: '1' });
ok('capacity-limited-before-budget-limited is flagged when the forced tier is too small',
  forced.capacity.capacityLimited === true && forced.capacity.fits === false,
  `required=${forced.capacity.required} ceiling=${forced.capacity.ceiling}`);
const freeTier = computeModel({ ...defaults, tier: 'free' });
ok('Free tier is reported unsupported, not silently priced',
  freeTier.capacity.freeSelected === true && freeTier.capacity.fits === false && freeTier.capacity.ceiling === 0);
eq('tier ceilings are 25/50/200/300/500',
  JSON.stringify(computeModel(defaults).capacity.tiers.map((t) => t.ceiling)),
  JSON.stringify([25, 50, 200, 300, 500]));

/* ------------------------------------------------- idle / realtime / share */
near('idle share is priced at the voice rate (30% of $0.2000)',
  computeModel(defaults).voice.idlePerCall, 0.06, 1e-12);
const rt = computeModel(defaults).realtime;
near('Realtime audio rows at 600/600 tokens per minute == $0.0576/min', rt.perMinute, 0.0576, 1e-12);
near('flat-rate break-even == 1,041.67 audio tokens/min at 1:1 in:out',
  rt.breakevenTotalPerMin, 1041.666666667, 1e-6);
ok('Realtime verdict flips when token rates fall',
  rt.tokenMeteringCheaper === false &&
  computeModel({ ...defaults, realtimeAudioInPerMin: 200, realtimeAudioOutPerMin: 200 }).realtime.tokenMeteringCheaper === true);

/* ------------------------------------------------------- C. live DOM wiring */
const initFn = documentStub._ready;
ok('script registers a DOMContentLoaded initialiser', typeof initFn === 'function');
if (typeof initFn === 'function') { initFn(); }
const text = (id) => (getById(id) ? getById(id).textContent : null);
const results = API.update();

eq('rendered: total per call', text('rTotalPerCall'), '$0.2396 (23.96\u00A2)');
eq('rendered: voice per day', text('rVoiceDay'), '$200.00');
eq('rendered: voice per month (30-day)', text('rVoiceMonth'), '$6,000.00');
eq('rendered: voice month alternatives', text('rVoiceMonthAlt'), '31-day $6,200.00 \u00b7 365/12 $6,083.33');
eq('rendered: backend per call', text('rBackendPerCall'), '$0.0396 (3.96\u00A2)');
eq('rendered: backend per day', text('rBackendDay'), '$39.60');
eq('rendered: total per day', text('rTotalDay'), '$239.60');
eq('rendered: backend share', text('rBackendShare'), '16.5% of the total bill');
eq('rendered: 0:40 quick reference in cents', text('rRef40'), '$0.0333 (3.33\u00A2)');
eq('rendered: 4:00 quick reference', text('rRef240'), '$0.2000 (20.00\u00A2)');
eq('rendered: 1:30 quick reference (OpenAI example)', text('rRef90'), '$0.0750 (7.50\u00A2)');
eq('rendered: 0:05 WebRTC quick reference', text('rRef5w'), '$0.0125 (1.25\u00A2)');
eq('rendered: 0:05 WebSocket quick reference', text('rRef5s'), '$0.0042 (0.42\u00A2)');
eq('rendered: peak concurrency', text('rReqConcurrent'), '8.33 sessions');
eq('rendered: average concurrency', text('rAvgConcurrent'), '8.33 sessions');
eq('rendered: tier checked', text('rTierChecked'), 'Tier 1 (ceiling 25) \u2014 auto-selected as the smallest tier that fits');
eq('rendered: headroom', text('rHeadroom'), '16.67 sessions spare (33.3% used)');
ok('rendered: verdict says capacity is not binding',
  /Capacity is not the binding constraint/.test(text('rTierVerdict')), text('rTierVerdict'));
eq('rendered: tier 1 utilisation', text('rTier1Util'), '33.3%');
eq('rendered: tier 1 fits and is smallest', text('rTier1Fit'), 'Fits (smallest)');
eq('rendered: tier 4 fits', text('rTier4Fit'), 'Fits');
ok('rendered: derivation shows the formula inputs',
  /1,000 calls\/day \u00f7 8\.0 h\) \u00d7 240 s \u00f7 3600 \u00d7 1\.00 peak = 8\.33/.test(text('rConcDerivation')),
  text('rConcDerivation'));
eq('rendered: init note is the credited (floor) wording, not an adder',
  text('rInitNote'), 'WebRTC: 15 s init credited \u2014 240 s session bills 240 s, not 255 s');
eq('rendered: realtime per minute', text('rRtPerMin'), '$0.0576 (5.76\u00A2)');
ok('rendered: realtime break-even tokens', /1,042 audio tokens\/min total/.test(text('rRtBreakEven')), text('rRtBreakEven'));
ok('rendered: export block is populated JSON',
  (() => { try { return !!JSON.parse(text('rExportJSON')); } catch (e) { return false; } })());

/* DOM interaction: a shorter call must move the rendered voice number */
const callMm = getById('callMm'); const callSs = getById('callSs');
callMm.value = '0'; callSs.value = '40';
const shortRun = API.update();
eq('rendered after 0:40 call: billed seconds', text('rBilledSeconds'), '40 s');
eq('rendered after 0:40 call: voice per call', text('rVoicePerCall'), '$0.0333 (3.33\u00A2)');
eq('rendered after 0:40 call: voice per day', text('rVoiceDay'), '$33.33');
near('DOM run matches the pure model for the 0:40 case', shortRun.voice.perCall, voiceCostUsd(40, 'webrtc'), 1e-15);

callMm.value = '0'; callSs.value = '5';
API.update();
eq('rendered after 0:05 WebRTC call: billed seconds is the 15 s floor', text('rBilledSeconds'), '15 s');
eq('rendered after 0:05 WebRTC call: voice per call', text('rVoicePerCall'), '$0.0125 (1.25\u00A2)');
eq('rendered after 0:05 call: init floor note', text('rInitNote'), 'WebRTC: 15 s init floor applied (session shorter than 15 s)');

/* transport toggle */
callSs.value = '5';
getById('trWs').checked = true; getById('trWebrtc').checked = false;
API.update();
eq('rendered after WebSocket switch: billed seconds has no floor', text('rBilledSeconds'), '5 s');
eq('rendered after WebSocket switch: voice per call', text('rVoicePerCall'), '$0.0042 (0.42\u00A2)');
getById('trWebrtc').checked = true; getById('trWs').checked = false;

/* preset switching through the real bindings */
API.applyPreset('default');
eq('preset default restores $200.00/day voice', text('rVoiceDay'), '$200.00');
API.applyPreset('blowout');
ok('preset blowout makes the backend the dominant meter',
  /^[0-9]+\.[0-9]% of the total bill$/.test(text('rBackendShare')) &&
  parseFloat(text('rBackendShare')) > 50,
  text('rBackendShare'));
ok('preset blowout raises the total above the default',
  (() => { try { return JSON.parse(text('rExportJSON')).results.total_usd_per_call > 0.2396; } catch (e) { return false; } })());
API.applyPreset('astra');
eq('preset astra switches the backend model', text('rBackendDay'), '$180.00');
API.applyPreset('luna');
eq('preset luna switches the backend model', text('rBackendDay'), '$3.96');
API.applyPreset('shortcall');
eq('preset short-call sets 0:40', text('rBilledSeconds'), '40 s');
API.applyPreset('default');

/* --------------------------------------------------- D. export round-trip */
const exp = exportModel(defaults);
ok('export names the model and the as-of date', exp.model === 'gpt-live-1-two-meter-cost-v1' && exp.as_of === '2026-09-10');
ok('export carries the month definition', exp.month_definition.primary_days === 30 && exp.month_definition.alternatives.alt_31_days === 31);
ok('export separates published constants from modelling assumptions',
  exp.provenance['voice.ratePerMinute'] === 'openai-published' &&
  exp.provenance.callsPerDay === 'our-assumption' &&
  exp.published_constants.voice_rate_per_minute_usd === 0.05 &&
  typeof exp.assumptions_note === 'string' && exp.assumptions_note.length > 20);
ok('export carries all 11 primary sources', Object.keys(exp.sources).length === 11);
ok('export carries the formulas', /max\(session_seconds, 15\)/.test(exp.formulas.billed_voice_seconds));
const roundTrip = computeModel(exp.parameters);
near('export parameters round-trip to identical results',
  roundTrip.total.perCall, exp.results.total_usd_per_call, 1e-15);
near('export total per month matches', exp.results.total_usd_per_month, 239.6 * 30, 1e-9);
near('export concurrency matches', exp.results.peak_concurrent_sessions_required, 8.333333333, 1e-6);
ok('every acceptance figure is present in the export',
  exp.results.voice_usd_per_day === 200 &&
  exp.results.total_usd_per_call === 0.2396 &&
  exp.results.capacity_limited_before_budget_limited === false);

/* --------------------------------------------------------- F. id integrity */
ok('no output id written by the script is missing from the HTML',
  missingIds.size === 0, [...missingIds].join(', '));

/* ------------------------------------------------------------- emit module */
if (emitPath) {
  const m = /\/\* == GPT-LIVE-MODEL:BEGIN == \*\/([\s\S]*?)\/\* == GPT-LIVE-MODEL:END == \*\//.exec(inlineJs);
  if (!m) { failures.push('model block markers not found in inline script'); }
  else {
    const header = `/*\n * GPT-Live-1 voice + backend cost model (canonical implementation).\n *\n * GENERATED from gpt-live-1-cost-calculator.html — do not edit by hand.\n * Regenerate with: node tests/gpt-live-1-verify.mjs --emit gpt-live-1-cost-model.js\n *\n * Interface: billedVoiceSeconds(sessionSeconds, transport, initSeconds)\n *            voiceCostUsd(sessionSeconds, transport, ratePerSecond)\n *            computeModel(params) -> results\n *            exportModel(params)  -> machine-readable JSON payload\n */\n`;
    const footer = `\nvar GPT_LIVE_MODEL_EXPORTS = {\n    GPT_LIVE_MODEL: GPT_LIVE_MODEL,\n    GPT_LIVE_DEFAULTS: GPT_LIVE_DEFAULTS,\n    GPT_LIVE_PROVENANCE: GPT_LIVE_PROVENANCE,\n    GPT_LIVE_SOURCES: GPT_LIVE_SOURCES,\n    billedVoiceSeconds: billedVoiceSeconds,\n    voiceCostUsd: voiceCostUsd,\n    computeModel: computeModel,\n    exportModel: exportModel\n};\nif (typeof module !== 'undefined' && module.exports) { module.exports = GPT_LIVE_MODEL_EXPORTS; }\nif (typeof window !== 'undefined') { window.GPT_LIVE_MODEL_JS = GPT_LIVE_MODEL_EXPORTS; }\n`;
    fs.writeFileSync(emitPath, header + m[1].trim() + '\n' + footer);
    passed++;
  }
}

report();

function report() {
  const total = passed + failures.length;
  console.log(`GPT-Live-1 calculator verification: ${passed}/${total} checks passed`);
  if (failures.length) {
    console.log('\nFAILURES:');
    failures.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('All checks passed.');
}
