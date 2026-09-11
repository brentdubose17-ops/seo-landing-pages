#!/usr/bin/env node
/*
 * tests/trq-dom-harness.js — DOM-stub harness for the TRQ surtax calculator
 * mode on index.html (kanban t_e2d32b63), mirroring drone-dom-harness.js /
 * canada-line-dom-harness.js.
 *
 * It boots the real page's TRQ wiring inside a vm sandbox (preset file ->
 * tariff-data.js -> the page's own TRQ script block) and drives it the way a
 * visitor does: switch modes, type a volume, change the TRQ year, flip the
 * quota status, edit the threshold, and arrive from a shared deep link.
 *
 * Acceptance covered:
 *   - the mode returns duty-free / 50% / 45% / 40% outcomes by year
 *   - the in-quota threshold is shown with its kg source figure and editable
 *   - the 30,000,000 lb worked example and the cliff-edge case render
 *   - the "recommended, not adopted" caveat is on screen
 *   - ?mode=trq deep links pre-fill the state, and the ad valorem mode survives
 *
 * Run: node tests/trq-dom-harness.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dataJs = fs.readFileSync(path.join(root, 'tariff-data.js'), 'utf8');
const trqPresetJs = fs.readFileSync(path.join(root, 'presets', 'canada-trq-canned-vegetables.js'), 'utf8');
const canadaPresetJs = fs.readFileSync(path.join(root, 'presets', 'canada-sept8-counter-tariffs.js'), 'utf8');

// ---- minimal DOM stub -----------------------------------------------------
// Elements are seeded from the real static markup (class / style) so the stub
// reflects what a browser renders before any script runs, and appendChild()
// keeps `select.options` in sync the way a real DOM does.
const STATIC_TAGS = (function () {
  const map = {};
  for (const m of html.matchAll(/<([a-z0-9]+)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)) {
    const attrs = m[2];
    const cls = /class="([^"]*)"/i.exec(attrs);
    const sty = /style="([^"]*)"/i.exec(attrs);
    const display = sty ? (/display\s*:\s*none/i.test(sty[1]) ? 'none' : 'block') : null;
    map[m[3]] = { cls: cls ? cls[1] : null, display: display };
  }
  return map;
})();

function makeEl(id, tag) {
  const seed = STATIC_TAGS[id] || {};
  const el = {
    id, _tag: tag || null, value: '', textContent: '',
    className: seed.cls || '',
    style: { display: seed.display || 'block' },
    checked: true, options: [], _children: [],
    appendChild(c) {
      el._children.push(c);
      if (c && c._tag === 'option') { el.options.push({ value: c.value, textContent: c.textContent }); }
      return c;
    },
    removeChild() {}, addEventListener() {},
    classList: { add() {}, remove() {} },
    scrollIntoView() {},
    setAttribute(k, v) { el['attr_' + k] = v; },
    getAttribute(k) { return el['attr_' + k]; },
    querySelector() { return null; },
  };
  let _html = '';
  Object.defineProperty(el, 'innerHTML', {
    get() { return _html; },
    set(v) { _html = v; if (v === '') el._children = []; },
  });
  return el;
}

// What the user can actually read in this element: its own innerHTML plus the
// rendered text/innerHTML of anything appended to it.
function readEl(el) {
  if (!el) return '';
  let out = String(el.innerHTML || '');
  (el._children || []).forEach(c => { out += ' ' + readEl(c) + ' ' + String(c.textContent || ''); });
  return out;
}

const TRQ_SRC = (function () {
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const found = blocks.find(s => s.includes('TRQ surtax mode — calculator wiring'));
  if (!found) throw new Error('TRQ wiring script block not found in index.html');
  return found;
})();

function boot(search) {
  const els = {};
  const getEl = (id) => { if (!els[id]) els[id] = makeEl(id); return els[id]; };
  const documentStub = {
    getElementById: getEl,
    createElement(tag) { return makeEl(null, tag); },
    querySelector(sel) { return sel && sel.includes('tbody') ? getEl('rateMatrixTbody') : null; },
    querySelectorAll() { return []; },
  };
  const windowStub = {
    location: { search: search || '', pathname: '/', origin: 'https://tariffcalculator2026.com' },
    history: { replaceState(url) { windowStub.location.url = url; } },
    document: documentStub,
    addEventListener() {},
  };
  windowStub.window = windowStub;
  windowStub.self = windowStub;

  vm.createContext(windowStub);
  vm.runInContext(canadaPresetJs, windowStub);   // browser script order
  vm.runInContext(trqPresetJs, windowStub);
  vm.runInContext(dataJs, windowStub);

  const sandbox = {
    window: windowStub,
    document: documentStub,
    URLSearchParams,
    console,
    Math, Date, Number, String, Object, Array, isFinite, parseFloat, encodeURIComponent,
    setTimeout(fn) { try { fn(); } catch (e) { /* scroll stub */ } },
  };
  vm.createContext(sandbox);
  vm.runInContext(TRQ_SRC, sandbox);

  return { win: windowStub, getEl, els, sandbox };
}

// ---- assertions -----------------------------------------------------------
let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS |', name); }
  else { fail++; console.log('FAIL |', name, detail != null ? '| ' + detail : ''); }
}
function set(el, v) { el.value = v; }
function has(el, needle) { return readEl(el).includes(needle); }

/* =========================================================================
 * 1. Default state — the ad valorem mode is what you land on
 * ========================================================================= */
const d = boot('');
check('1a ad valorem form visible by default', d.getEl('avModeWrap').style.display === 'block');
check('1b TRQ panel hidden by default', d.getEl('trqPanel').style.display === 'none');
check('1c ad valorem button is the active tab', d.getEl('modeBtnAv').className === 'calc-mode active');
check('1d TRQ button is not active', d.getEl('modeBtnTrq').className === 'calc-mode');

/* =========================================================================
 * 2. Switching to the TRQ mode populates the control surface
 * ========================================================================= */
d.sandbox.window.setCalcMode('trq');
check('2a TRQ panel shown', d.getEl('trqPanel').style.display === 'block');
check('2b ad valorem form hidden', d.getEl('avModeWrap').style.display === 'none');
check('2c TRQ button becomes the active tab', d.getEl('modeBtnTrq').className === 'calc-mode active');
check('2d aria-selected flips on the buttons',
  d.getEl('modeBtnTrq')['attr_aria-selected'] === 'true' && d.getEl('modeBtnAv')['attr_aria-selected'] === 'false',
  d.getEl('modeBtnTrq')['attr_aria-selected']);

const prodLabels = d.getEl('trqProduct').options.map(c => c.textContent);
check('2e 11 canned-vegetable product options', prodLabels.length === 11, prodLabels.length);
check('2f scope names present (corn, wax beans, chickpeas)',
  prodLabels.some(l => l === 'Canned corn') &&
  prodLabels.some(l => l === 'Canned wax beans') &&
  prodLabels.some(l => l === 'Canned chickpeas'),
  prodLabels.join(' / '));

const yearLabels = d.getEl('trqYear').options.map(c => c.textContent);
check('2g three TRQ years offered', yearLabels.length === 3, yearLabels.length);
check('2h year option labels carry the in-quota volume and the rate',
  yearLabels[0].includes('13,000,000 kg') && yearLabels[0].includes('28,660,094 lb') && yearLabels[0].includes('50%') &&
  yearLabels[1].includes('13,260,000 kg') && yearLabels[1].includes('45%') &&
  yearLabels[2].includes('13,525,200 kg') && yearLabels[2].includes('40%'),
  yearLabels.join(' || '));

check('2i the mode pre-fills the 30,000,000 lb worked example', d.getEl('trqVolume').value === '30000000', d.getEl('trqVolume').value);
check('2j threshold pre-filled with the year-1 recommended line', d.getEl('trqQuotaLb').value === '28660094', d.getEl('trqQuotaLb').value);
check('2k threshold hint names the kg source figure and calls it an assumption',
  has(d.getEl('trqQuotaHint'), '13,000,000 kg = 28,660,094 lb') && has(d.getEl('trqQuotaHint'), 'not current law'),
  d.getEl('trqQuotaHint').innerHTML);

/* =========================================================================
 * 3. The headline calculation (30M lb, year 1)
 * ========================================================================= */
check('3a within-quota volume is duty-free',
  String(d.getEl('trqOutWithin').textContent).includes('28,660,094 lb') && String(d.getEl('trqOutWithin').textContent).includes('duty-free'));
check('3b above-quota volume carries the 50% rate',
  String(d.getEl('trqOutAbove').textContent).includes('1,339,906 lb') && String(d.getEl('trqOutAbove').textContent).includes('50%'),
  d.getEl('trqOutAbove').textContent);
check('3c surtax in dollars = $2,233.18 (50% of the above-quota share of $100,000)',
  String(d.getEl('trqOutDuty').textContent).includes('$2,233.18'), d.getEl('trqOutDuty').textContent);
check('3d outcome boxes show duty-free AND the 50% surtax',
  has(d.getEl('trqOutcome'), 'Duty-free (0%)') && has(d.getEl('trqOutcome'), '50% surtax'),
  d.getEl('trqOutcome').innerHTML.slice(0, 200));
check('3e status flag says proposed / not in force and names the in-force 10%',
  has(d.getEl('trqFlags'), 'not in force') && has(d.getEl('trqFlags'), '10% provisional safeguard surtax'));
check('3f above-quota imports are stated to remain legal',
  has(d.getEl('trqFlags'), 'remain <strong>legal</strong>') || has(d.getEl('trqFlags'), 'legal'),
  d.getEl('trqFlags').innerHTML.slice(0, 300));
check('3g the three-year schedule renders with 50% / 45% / 40%',
  has(d.getEl('trqScheduleWrap'), '50%') && has(d.getEl('trqScheduleWrap'), '45%') && has(d.getEl('trqScheduleWrap'), '40%'),
  d.getEl('trqScheduleWrap').innerHTML.slice(0, 200));
check('3h year-1 row is marked selected', has(d.getEl('trqScheduleWrap'), 'selected'));
check('3i shareable permalink carries the state',
  String(d.getEl('trqPermalink').value).includes('mode=trq') &&
  String(d.getEl('trqPermalink').value).includes('volume=30000000') &&
  String(d.getEl('trqPermalink').value).includes('year=1'),
  d.getEl('trqPermalink').value);

/* =========================================================================
 * 4. Year selector drives BOTH the threshold and the rate
 * ========================================================================= */
set(d.getEl('trqYear'), '2');
d.sandbox.window.trqSyncThreshold();
check('4a year 2 resets the threshold to 29,233,296 lb', d.getEl('trqQuotaLb').value === '29233296', d.getEl('trqQuotaLb').value);
d.sandbox.window.runTrq();
check('4b year 2 above-quota rate = 45%', String(d.getEl('trqOutAbove').textContent).includes('45%'), d.getEl('trqOutAbove').textContent);
check('4c year 2 duty = $1,150.06', String(d.getEl('trqOutDuty').textContent).includes('$1,150.06'), d.getEl('trqOutDuty').textContent);

set(d.getEl('trqYear'), '3');
d.sandbox.window.trqSyncThreshold();
check('4d year 3 resets the threshold to 29,817,962 lb', d.getEl('trqQuotaLb').value === '29817962', d.getEl('trqQuotaLb').value);
d.sandbox.window.runTrq();
check('4e year 3 above-quota rate = 40%', String(d.getEl('trqOutAbove').textContent).includes('40%'), d.getEl('trqOutAbove').textContent);
check('4f year 3 duty = $242.72', String(d.getEl('trqOutDuty').textContent).includes('$242.72'), d.getEl('trqOutDuty').textContent);

// back to year 1 for the remaining cases
set(d.getEl('trqYear'), '1');
d.sandbox.window.trqSyncThreshold();

/* =========================================================================
 * 5. Quota-unexhausted vs exhausted
 * ========================================================================= */
set(d.getEl('trqQuota'), 'exhausted');
d.sandbox.window.runTrq();
check('5a exhausted quota -> nothing is in quota',
  String(d.getEl('trqOutWithin').textContent).startsWith('0 lb'), d.getEl('trqOutWithin').textContent);
check('5b exhausted quota -> whole 30M lb pays 50%', String(d.getEl('trqOutAbove').textContent).includes('30,000,000 lb') &&
  String(d.getEl('trqOutAbove').textContent).includes('50%'), d.getEl('trqOutAbove').textContent);
check('5c exhausted quota duty = $50,000', String(d.getEl('trqOutDuty').textContent).includes('$50,000'),
  d.getEl('trqOutDuty').textContent);
check('5d exhausted flag explains first-come-first-served', has(d.getEl('trqFlags'), 'first-come, first-served'));

set(d.getEl('trqQuota'), 'not-exhausted');
set(d.getEl('trqVolume'), '25000000');
d.sandbox.window.runTrq();
check('5e fully in-quota volume pays nothing',
  String(d.getEl('trqOutDuty').textContent).includes('$0.00') &&
  String(d.getEl('trqOutDuty').textContent).includes('50%'),
  d.getEl('trqOutDuty').textContent);
check('5f in-quota flag still explains above-quota legality',
  has(d.getEl('trqFlags'), 'inside the quota') && has(d.getEl('trqFlags'), 'legal'));

/* =========================================================================
 * 6. Unit helper, editable threshold, bad input
 * ========================================================================= */
set(d.getEl('trqVolume'), '13000000');
set(d.getEl('trqUnit'), 'kg');
d.sandbox.window.runTrq();
check('6a 13,000,000 kg is exactly at the year-1 line (duty-free)',
  String(d.getEl('trqOutWithin').textContent).startsWith('28,660,094 lb'), d.getEl('trqOutWithin').textContent);
check('6b volume hint shows the lb conversion', has(d.getEl('trqVolumeHint'), 'lb'));

set(d.getEl('trqUnit'), 'lb');
set(d.getEl('trqVolume'), '30000000');
set(d.getEl('trqQuotaLb'), '40000000');
d.sandbox.window.runTrq();
check('6c edited threshold is honoured (nothing above quota)', String(d.getEl('trqOutAbove').textContent).startsWith('0 lb'),
  d.getEl('trqOutAbove').textContent);
check('6d edited threshold is disclosed in a flag', has(d.getEl('trqFlags'), 'Edited threshold'));
d.sandbox.window.trqSyncThreshold();
check('6e changing the year restores the recommendation threshold', d.getEl('trqQuotaLb').value === '28660094', d.getEl('trqQuotaLb').value);

set(d.getEl('trqVolume'), '');
d.sandbox.window.runTrq();
check('6f empty volume warns instead of inventing a result',
  has(d.getEl('trqFlags'), 'Enter a volume'), d.getEl('trqFlags').innerHTML.slice(0, 120));
check('6g empty volume clears the schedule', d.getEl('trqScheduleWrap').innerHTML === '');

set(d.getEl('trqVolume'), '-500');
d.sandbox.window.runTrq();
check('6h negative volume warns too', has(d.getEl('trqFlags'), 'Enter a volume'));

/* =========================================================================
 * 7. Deep links
 * ========================================================================= */
const link = boot('?mode=trq');
check('7a ?mode=trq opens the TRQ mode', link.getEl('trqPanel').style.display === 'block' &&
  link.getEl('avModeWrap').style.display === 'none');
check('7b ?mode=trq pre-fills the 30M lb worked example', link.getEl('trqVolume').value === '30000000', link.getEl('trqVolume').value);
check('7c ?mode=trq renders the result on arrival',
  String(link.getEl('trqOutDuty').textContent).includes('$2,233.18'), link.getEl('trqOutDuty').textContent);
check('7d deep-linked page keeps the caveat visible', has(link.getEl('trqFlags'), 'not in force'));

const full = boot('?mode=trq&volume=29000000&unit=lb&year=1&category=peas&quota=exhausted&value=200000');
check('7e category param selects the product', full.getEl('trqProduct').value === 'peas', full.getEl('trqProduct').value);
check('7f product label renders in the result', String(full.getEl('trqOutProduct').textContent) === 'Canned peas',
  full.getEl('trqOutProduct').textContent);
check('7g quota param selects the exhausted assumption', full.getEl('trqQuota').value === 'exhausted');
check('7h prefilled volume/year respected', full.getEl('trqVolume').value === '29000000' && full.getEl('trqYear').value === '1');
check('7i exhausted + $200,000 value -> $100,000 surtax',
  String(full.getEl('trqOutDuty').textContent).includes('$100,000.00'), full.getEl('trqOutDuty').textContent);

const kgLink = boot('?mode=trq&volume=13000000&unit=kg&year=1&category=corn');
check('7j kg deep link round-trips to the exact threshold (duty-free)',
  String(kgLink.getEl('trqOutWithin').textContent).startsWith('28,660,094 lb'), kgLink.getEl('trqOutWithin').textContent);

const plain = boot('?product=drones');
check('7k an unrelated deep link does not disturb the TRQ mode',
  plain.getEl('avModeWrap').style.display === 'block' && plain.getEl('trqPanel').style.display === 'none');
check('7l unrelated deep link leaves the TRQ inputs empty', plain.getEl('trqVolume').value === '');

const legacy = boot('?mode=trq&year=3&volume=30000000');
check('7m year param drives the rate in a deep link', String(legacy.getEl('trqOutAbove').textContent).includes('40%'),
  legacy.getEl('trqOutAbove').textContent);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
