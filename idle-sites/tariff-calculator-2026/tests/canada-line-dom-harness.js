#!/usr/bin/env node
/*
 * DOM-stub harness — drives the Canada "Specific product (optional)"
 * line select on the calculator (index.html) end-to-end without a
 * browser, mirroring drone-dom-harness.js / brazil-dom-harness.js.
 *
 * Covers the t_31dba7b3 fix: the exact HTS line governs the real rate,
 * so a US milk-powder exporter selecting Dairy + Milk powder 0402.10.10
 * must be shown 50% (not the 25% dairy category headline), while cheese
 * 0406.20.11 stays 25% and the no-line category defaults are unchanged.
 *
 * Run: OPENSSL_CONF=/dev/null node tests/canada-line-dom-harness.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const dataJs = fs.readFileSync(path.join(__dirname, '..', 'tariff-data.js'), 'utf8');
const presetJs = fs.readFileSync(path.join(__dirname, '..', 'presets', 'canada-sept8-counter-tariffs.js'), 'utf8');

// --- minimal DOM stub ---
function makeEl(id) {
  const el = {
    id, value: '', textContent: '', className: '',
    style: { display: 'block' }, checked: true, options: [],
    _children: [],
    appendChild(c) { el._children.push(c); return c; },
    removeChild() {}, addEventListener() {},
    classList: { add() {}, remove() {} },
    scrollIntoView() {},
    querySelector() { return null; },
  };
  // Mirrors the browser: assigning innerHTML = '' drops the existing children,
  // so option/flag assertions only ever see the current run's content.
  let _html = '';
  Object.defineProperty(el, 'innerHTML', {
    get() { return _html; },
    set(v) { _html = v; if (v === '') el._children = []; },
  });
  return el;
}
const els = {};
const getEl = (id) => { if (!els[id]) els[id] = makeEl(id); return els[id]; };
const flagsContent = () => getEl('flags')._children.map(c => c.innerHTML || '').join('\n');
const optionLabels = (id) => getEl(id)._children.map(c => c.textContent);

const documentStub = {
  getElementById: getEl,
  createElement(tag) { return makeEl('created-' + (Math.random() * 1e9 | 0)); },
  // The controls IIFE also fills the static #rateMatrix table; give it a stub
  // tbody so the page's own wiring can run (calculate() itself uses only ids).
  querySelector(sel) { return sel && sel.includes('tbody') ? getEl('rateMatrixTbody') : null; },
  querySelectorAll() { return []; },
};

const windowStub = {
  TARIFF_DATA: null,
  document: documentStub,
  addEventListener() {},
};
windowStub.window = windowStub;
windowStub.self = windowStub;

// Load the Canada Sept 8 preset data file first (mirrors browser script order)
vm.createContext(windowStub);
vm.runInContext(presetJs, windowStub);
vm.runInContext(dataJs, windowStub);
const T = windowStub.TARIFF_DATA;

const sandbox = {
  T, document: documentStub, window: windowStub, console,
  Math, Date, parseFloat, String, Object,
};
vm.createContext(sandbox);

// --- Part A: the page's own wiring (controls IIFE + recalc of the line select) ---
const scriptBlock = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1])
  .find(s => s.includes('function calculate()'));
if (!scriptBlock) { console.error('calculator script block not found'); process.exit(1); }
// Everything before calculate() is the (syntactically complete) controls IIFE,
// which defines onDirectionChange / updateCanadaBanner / populateCanadaLines.
vm.runInContext(scriptBlock.slice(0, scriptBlock.indexOf('function calculate()')), sandbox);

function check(name, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : ''));
  if (!cond) process.exitCode = 1;
}
function set(id, value) { getEl(id).value = value; }
function rate() { return getEl('resultRate').textContent; }
function duty() { return getEl('resultDuty').textContent; }

// --- A1: the line row is hidden for the default (to-us) direction ---
sandbox.window.onDirectionChange();
check('A1 line row hidden for to-us direction',
  getEl('canadaLineRow').style.display === 'none', getEl('canadaLineRow').style.display);

// --- A2: selecting the Canada direction shows the row and populates it ---
set('direction', 'to-canada');
sandbox.window.onDirectionChange();
check('A2 line row visible for to-canada direction',
  getEl('canadaLineRow').style.display === 'block', getEl('canadaLineRow').style.display);
const dairyOptions = optionLabels('canadaLine');
check('A2a milk powder 0402.10.10 selectable at 50%',
  dairyOptions.some(l => l.includes('Milk powder') && l.includes('0402.10.10') && l.includes('50%')),
  dairyOptions.filter(l => l.includes('Milk powder')).join(' / '));
check('A2b cheese 0406.20.11 selectable at 25%',
  dairyOptions.some(l => l.includes('Cheese') && l.includes('0406.20.11') && l.includes('25%')),
  dairyOptions.filter(l => l.includes('Cheese')).join(' / '));
check('A2c default option is the category rate',
  dairyOptions[0] === '— Category rate —', dairyOptions[0]);
check('A2d country force-set to US for the Canada direction',
  getEl('country').value === 'us', getEl('country').value);
check('A2e category list is the Canada sector list (no avg suffix)',
  optionLabels('category').some(l => l.startsWith('Dairy')) &&
  optionLabels('category').every(l => !l.includes('(avg')),
  optionLabels('category').join(' / '));
// Category change re-scopes the line options (dairy first)
set('category', 'dairy');
sandbox.window.populateCanadaLines();
check('A2f dairy scoping keeps milk powder + cheese',
  optionLabels('canadaLine').filter(l => l !== '— Category rate —').length === 2,
  optionLabels('canadaLine').join(' / '));
set('category', 'farming-equipment');
sandbox.window.populateCanadaLines();
check('A2g farming-equipment scoping offers only the mower line (15%)',
  optionLabels('canadaLine').filter(l => l !== '— Category rate —').length === 1 &&
  optionLabels('canadaLine')[1].includes('8433.20.00'),
  optionLabels('canadaLine').join(' / '));
// Banner reflects the picked line rate
set('canadaLine', '8433.20.00');
set('entryDate', '2026-09-08');
sandbox.window.updateCanadaBanner();
check('A2h banner quotes the selected line and its 15% tier',
  getEl('canadaBanner').innerHTML.includes('8433.20.00') && getEl('canadaBanner').innerHTML.includes('15% tier'));

// --- Part B: full calculate() flow ---
let calculateFn = null;
{
  const start = scriptBlock.indexOf('function calculate()');
  let depth = 0, i = scriptBlock.indexOf('{', start);
  for (; i < scriptBlock.length; i++) {
    if (scriptBlock[i] === '{') depth++;
    else if (scriptBlock[i] === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  calculateFn = scriptBlock.slice(start, i);
}
function runCalc() { vm.runInContext(calculateFn + '\ncalculate();', sandbox); }

function resetCanada() {
  set('direction', 'to-canada');
  set('country', 'us');
  set('category', 'dairy');
  set('value', '10000');
  set('entryDate', '2026-09-08');
  set('canadaLine', '');
  getEl('usmca').checked = true;
}
resetCanada();

// --- B1: no specific product -> dairy category default 25% (unchanged) ---
runCalc();
check('B1 dairy, no line, Sept 8 -> 25.0%', rate().startsWith('25.0%'), rate());
check('B1a duty = $2,500.00', duty() === '$2,500.00', duty());
check('B1b copy offers the per-line option',
  flagsContent().includes('Representative lines:') && flagsContent().includes('pick a Specific product'),
  flagsContent().slice(0, 120));

// --- B2: milk powder 0402.10.10 -> 50% (the parent-card acceptance calc) ---
set('canadaLine', '0402.10.10');
runCalc();
check('B2 milk powder Sept 8 -> 50.0% headline', rate().startsWith('50.0%'), rate());
check('B2a headline names the applied line',
  rate().includes('Milk powder') && rate().includes('0402.10.10'), rate());
check('B2b duty on $10,000 = $5,000.00', duty() === '$5,000.00', duty());
check('B2c result card shows the APPLIED line (no contradictory 25% copy)',
  flagsContent().includes('Applied specific line') && flagsContent().includes('0402.10.10') &&
  !flagsContent().includes('Representative lines:'),
  flagsContent().includes('Applied specific line') ? 'Applied specific line present' : 'missing');

// --- B3: cheese 0406.20.11 -> 25% ---
set('canadaLine', '0406.20.11');
runCalc();
check('B3 cheese Sept 8 -> 25.0%', rate().startsWith('25.0%'), rate());
check('B3a duty = $2,500.00', duty() === '$2,500.00', duty());
check('B3b result card names the cheese line',
  flagsContent().includes('Cheese') && flagsContent().includes('0406.20.11'));

// --- B4: pre-Sept 8 with a line selected -> still PENDING (0%) ---
set('canadaLine', '0402.10.10');
set('entryDate', '2026-09-07');
runCalc();
check('B4 pre-Sept 8 milk powder -> 0.0% (PENDING)', rate().startsWith('0.0%'), rate());
check('B4a duty = $0.00', duty() === '$0.00', duty());
check('B4b pending flag present', flagsContent().includes('Not Yet In Effect For This Entry Date'));

// --- B5: category defaults unchanged for the other Canada sectors ---
const defaults = [
  ['steel', '50.0%', '$5,000.00'],
  ['electronics', '25.0%', '$2,500.00'],
  ['household-appliances', '25.0%', '$2,500.00'],
  ['farming-equipment', '15.0%', '$1,500.00'],
  ['pulp-paper', '50.0%', '$5,000.00'],
];
for (const [cat, wantRate, wantDuty] of defaults) {
  resetCanada();
  set('category', cat);
  runCalc();
  check(`B5 ${cat} category default unchanged -> ${wantRate}`,
    rate().startsWith(wantRate) && duty() === wantDuty, rate() + ' / ' + duty());
}

// --- B6: the line select must be ignored outside the Canada direction ---
resetCanada();
set('direction', 'to-us');
set('country', 'china');
set('category', 'electronics');
set('canadaLine', '0402.10.10');
runCalc();
const withLine = rate() + '|' + duty();
set('canadaLine', '');
runCalc();
const withoutLine = rate() + '|' + duty();
check('B6 line select has no effect for to-us direction', withLine === withoutLine, withLine);

// --- B7: US steel line still 50% via the select (no regression) ---
resetCanada();
set('category', 'steel');
set('canadaLine', '7208.25.00');
runCalc();
check('B7 steel line 7208.25.00 -> 50.0% / $5,000.00',
  rate().startsWith('50.0%') && duty() === '$5,000.00', rate() + ' / ' + duty());
check('B7a result card names the steel line', flagsContent().includes('7208.25.00'));

console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED');
