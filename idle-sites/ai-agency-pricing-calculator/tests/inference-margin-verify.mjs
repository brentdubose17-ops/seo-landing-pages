/**
 * Independent verification harness for the "AI inference as a share of gross
 * margin consumed" factor added to aiagencycalculator.com/index.html
 * (kanban card t_9b19d6a2).
 *
 * Runs the page's REAL inline script inside a mock DOM, but takes the preloaded
 * input values out of the shipped HTML itself (not out of this file), so it also
 * proves what the static page ships to a no-JS crawler.
 *
 * Usage: node tests/inference-margin-verify.mjs [index.html]
 * Exit 0 = every assertion passed.
 */
import { readFileSync } from 'fs';
import vm from 'vm';

const htmlPath = process.argv[2] || 'index.html';
const html = readFileSync(htmlPath, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`PASS ${name}`); }
  else { fail++; fails.push(name); console.log(`FAIL ${name}${detail ? ' — ' + detail : ''}`); }
}

// ── mock DOM ──
const elements = {};
function makeEl(id) {
  return {
    id, value: '', checked: false, textContent: '', innerHTML: '', style: {}, dataset: {},
    options: [{ text: 'Option' }], selectedIndex: 0,
    addEventListener() {}, removeEventListener() {}, scrollIntoView() {}, setAttribute() {},
    appendChild() {}, focus() {}, classList: { add() {}, remove() {}, toggle() {} },
  };
}
const alerts = [];
const document = {
  getElementById(id) { if (!elements[id]) elements[id] = makeEl(id); return elements[id]; },
  querySelector() { return null; }, querySelectorAll() { return []; },
  addEventListener() {}, removeEventListener() {},
  createElement() { return makeEl('created'); },
  body: { appendChild() {}, style: {} }, documentElement: { style: {} },
};
const sandbox = {
  document,
  localStorage: { _s: {}, getItem(k) { return this._s[k] ?? null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } },
  alert: (m) => { alerts.push(m); },
  console, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  fetch: () => Promise.reject(new Error('fetch not mocked')),
  addEventListener: () => {}, removeEventListener: () => {},
  Math, Date, JSON, Object, Array, String, Number, Boolean, parseInt, parseFloat, isNaN, RegExp,
};
sandbox.window = sandbox; sandbox.self = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('FATAL: no inline <script> in ' + htmlPath); process.exit(2); }
try { vm.runInContext(m[1], sandbox, { filename: 'inline.js' }); }
catch (e) { console.error('FATAL: inline script threw on load:', e.message); process.exit(2); }

// ── what the shipped HTML preloads (static, no JS) ──
function attrValue(id) {
  const mm = html.match(new RegExp(`id="${id}"[^>]*?value="([^"]*)"`));
  return mm ? mm[1] : null;
}
const preload = { revenue: attrValue('infRevenue'), cogs: attrValue('infCogs'), spend: attrValue('infSpend') };

function setInputs({ revenue, cogs, spend }) {
  const ids = ['im-margin-before', 'im-margin-before-sub', 'im-margin-after', 'im-margin-after-sub',
    'im-delta', 'im-delta-sub', 'im-pct-gm', 'im-pct-gm-sub', 'im-pct-rev', 'im-pct-rev-sub',
    'im-cogs-share', 'im-cogs-share-sub', 'im-note'];
  for (const id of ids) { if (!elements[id]) elements[id] = makeEl(id); elements[id].textContent = ''; }
  for (const [id, v] of Object.entries({ infRevenue: String(revenue), infCogs: String(cogs), infSpend: String(spend) })) {
    if (!elements[id]) elements[id] = makeEl(id);
    elements[id].value = v;
  }
}
function run(vals) {
  setInputs(vals);
  alerts.length = 0;
  sandbox.calculateInferenceMargin();
  return {
    before: elements['im-margin-before'].textContent,
    beforeSub: elements['im-margin-before-sub'].textContent,
    after: elements['im-margin-after'].textContent,
    afterSub: elements['im-margin-after-sub'].textContent,
    delta: elements['im-delta'].textContent,
    deltaSub: elements['im-delta-sub'].textContent,
    pctGm: elements['im-pct-gm'].textContent,
    pctGmSub: elements['im-pct-gm-sub'].textContent,
    pctRev: elements['im-pct-rev'].textContent,
    cogsShare: elements['im-cogs-share'].textContent,
    cogsShareSub: elements['im-cogs-share-sub'].textContent,
    note: elements['im-note'].textContent,
  };
}

console.log(`\n== ${htmlPath} ==\n`);
check('input element infPreset exists in HTML', html.includes('id="infPreset"'));
check('input element infRevenue exists in HTML', html.includes('id="infRevenue"'));
check('input element infCogs exists in HTML', html.includes('id="infCogs"'));
check('input element infSpend exists in HTML', html.includes('id="infSpend"'));
check('reference case preloaded in HTML as $100,000 revenue', preload.revenue === '100000', `got ${preload.revenue}`);
check('reference case preloaded in HTML as $600 non-inference COGS', preload.cogs === '600', `got ${preload.cogs}`);
check('reference case preloaded in HTML as $6,400 inference spend', preload.spend === '6400', `got ${preload.spend}`);

// ── 1. the preloaded reference case reproduces 99.4% -> 93.0% ──
const ref = run({ revenue: Number(preload.revenue), cogs: Number(preload.cogs), spend: Number(preload.spend) });
check('reference case: gross margin WITHOUT inference = 99.4%', ref.before === '99.4%', `got ${ref.before}`);
check('reference case: gross margin WITH inference = 93.0%', ref.after === '93.0%', `got ${ref.after}`);
check('reference case: margin cost of inference = 6.4 pts', ref.delta === '6.4 pts', `got ${ref.delta}`);
check('reference case: inference = 6.4% of gross margin consumed', ref.pctGm === '6.4%', `got ${ref.pctGm}`);
check('reference case: inference = 6.4% of revenue', ref.pctRev === '6.4%', `got ${ref.pctRev}`);
check('reference case: inference = 91.4% of all COGS', ref.cogsShare === '91.4%', `got ${ref.cogsShare}`);
check('reference case: COGS multiple = 10.7x', ref.cogsShareSub.includes('10.7×'), `got ${ref.cogsShareSub}`);
check('reference case: delta sub shows the pair', ref.deltaSub === '99.4% → 93.0% gross margin', `got ${ref.deltaSub}`);
check('reference case: note shows the arithmetic', ref.note.includes('99.4%') && ref.note.includes('93.0%') && ref.note.includes('6.4-point margin cost'), `got ${ref.note}`);

// ── 2. static (no-JS) HTML ships the reference numbers ──
check('static HTML carries 99.4% (no-JS crawler sees the reference case)', html.includes('id="im-margin-before">99.4%<'));
check('static HTML carries 93.0%', html.includes('id="im-margin-after">93.0%<'));
check('static HTML carries the 6.4-point cost', html.includes('id="im-delta">6.4 pts<'));
check('static HTML carries the % of gross margin line', html.includes('id="im-pct-gm">6.4%<'));
check('static HTML carries 91.4% COGS share', html.includes('id="im-cogs-share">91.4%<'));
check('results block is visible without interaction (no display:none)', /id="inference-results" style="margin-top:20px;"/.test(html));

// ── 3. attribution + date + caveats are on the page ──
check('attribution names @levelsio', html.includes('@levelsio (Pieter Levels)'));
check('attribution carries the UTC timestamp', html.includes('Sept 9, 2026, 15:21:24 UTC'));
check('attribution carries the canonical permalink', html.includes('https://x.com/levelsio/status/2097706947382292964'));
check('caveat: self-reported / unaudited', html.includes('self-reported, unaudited'));
check('caveat: profit margin is not GAAP gross margin', html.includes('not GAAP gross margin'));
check('caveat: card-processing fee limitation', html.includes('2.9% card-processing fees'));
check('caveat: single operator / one workload', html.includes('single operator with one dominant image-generation workload'));

// ── 4. recompute on input change ──
const doubled = run({ revenue: 100000, cogs: 600, spend: 12800 });
check('recompute: 2x inference -> 86.6% margin after', doubled.after === '86.6%', `got ${doubled.after}`);
check('recompute: 2x inference -> 12.8 pt margin cost', doubled.delta === '12.8 pts', `got ${doubled.delta}`);
check('recompute: 2x inference -> 12.9% of gross margin consumed', doubled.pctGm === '12.9%', `got ${doubled.pctGm}`);

// the ratio property: the 6.4-point drop must reproduce at any revenue scale
const scaled = run({ revenue: 212000, cogs: 1272, spend: 13568 });
check('scale-invariance: 99.4% -> 93.0% at the $212K/mo mirror-scraped revenue proxy',
  scaled.before === '99.4%' && scaled.after === '93.0%', `got ${scaled.before} -> ${scaled.after}`);

const noInference = run({ revenue: 100000, cogs: 1500, spend: 0 });
check('no inference: margins are identical', noInference.before === noInference.after, `${noInference.before} vs ${noInference.after}`);
check('no inference: zero margin cost', noInference.delta === '0.0 pts', `got ${noInference.delta}`);
check('no inference: 0.0% of all COGS', noInference.cogsShare === '0.0%', `got ${noInference.cogsShare}`);

const thinCogs = run({ revenue: 100000, cogs: 60000, spend: 10000 });
check('recompute: 60% non-inference COGS -> 40.0% before / 30.0% after', thinCogs.before === '40.0%' && thinCogs.after === '30.0%', `got ${thinCogs.before} -> ${thinCogs.after}`);
check('recompute: 10,000 / 40,000 gross margin = 25.0% consumed', thinCogs.pctGm === '25.0%', `got ${thinCogs.pctGm}`);

const zeroCogs = run({ revenue: 100000, cogs: 0, spend: 5000 });
check('zero non-inference COGS: 95.0% margin after, no "×" multiple', zeroCogs.after === '95.0%' && !zeroCogs.cogsShareSub.includes('×'), `got ${zeroCogs.after} / ${zeroCogs.cogsShareSub}`);

const overrun = run({ revenue: 100000, cogs: 600, spend: 120000 });
check('inference above the non-inference margin: 120.7% of gross margin, negative margin shown with a sign',
  overrun.pctGm === '120.7%' && overrun.after === '-20.6%' && overrun.afterSub.includes('-$20,600') && !JSON.stringify(overrun).includes('NaN'),
  JSON.stringify(overrun).slice(0, 200));

const noMargin = run({ revenue: 100000, cogs: 100000, spend: 5000 });
check('zero gross margin before inference: reports "—" for the consumed-margin ratio, no NaN',
  noMargin.pctGm === '—' && noMargin.pctGmSub === 'Inference exceeds gross margin before inference' && !JSON.stringify(noMargin).includes('NaN'),
  JSON.stringify(noMargin).slice(0, 200));

// ── 5. guard rails ──
run({ revenue: 0, cogs: 600, spend: 6400 });
check('invalid revenue alerts and does not render NaN', alerts.length === 1 && !elements['im-note'].textContent.includes('NaN'));
run({ revenue: 100000, cogs: -5, spend: 6400 });
check('negative COGS alerts', alerts.length === 1);
run({ revenue: 100000, cogs: 600, spend: -1 });
check('negative inference spend alerts', alerts.length === 1);

// ── 6. the main pricing calculator is untouched by this factor ──
check('additive only: the estimator reads no inputs of calculatePricing()',
  !/calculateInferenceMargin[\s\S]{0,4000}?calculatePricing\(/.test(m[1]) && !/baseCost|res-margin/.test(m[1].slice(m[1].indexOf('function calculateInferenceMargin'), m[1].indexOf('document.addEventListener(\'DOMContentLoaded\', function () { calculateInferenceMargin'))));
check('reference-case preset is selectable', html.includes('<option value="levelsio" selected>') && html.includes('applyInferencePreset()'));

console.log(`\nRESULT: ${pass}/${pass + fail}${fail ? ' — FAIL: ' + fails.join(', ') : ''}`);
process.exit(fail ? 1 : 0);
