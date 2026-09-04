#!/usr/bin/env node
/*
 * DOM-stub harness — drives the drone / UAS Section 232 preset in the
 * calculator (index.html) end-to-end without a browser, mirroring
 * brazil-dom-harness.js. Covers the Sept 3, 2026 attribute truth table:
 * China origin x thermal x weight x supplier (Blue UAS deferral) x entry
 * date, plus regression checks that non-drone flows are unchanged.
 *
 * Run: node tests/drone-dom-harness.js
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
    id, value: '', textContent: '', innerHTML: '', className: '',
    style: { display: 'block' }, checked: true, options: [],
    _children: [],
    appendChild(c) { el._children.push(c); return c; },
    removeChild() {}, addEventListener() {},
    classList: { add() {}, remove() {} },
    scrollIntoView() {},
    querySelector() { return null; },
  };
  return el;
}
const els = {};
const getEl = (id) => { if (!els[id]) els[id] = makeEl(id); return els[id]; };
// flagsContent() = concatenated innerHTML of everything appended to #flags
const flagsContent = () => getEl('flags')._children.map(c => c.innerHTML || '').join('\n');

const documentStub = {
  getElementById: getEl,
  createElement(tag) { return makeEl('created-' + (Math.random() * 1e9 | 0)); },
  querySelector() { return null; },
  querySelectorAll() { return []; },
};

const windowStub = {
  TARIFF_DATA: null,
  document: documentStub,
  addEventListener() {},
};
windowStub.window = windowStub;
windowStub.self = windowStub;

// Load the Canada Sept 8 preset data file (mirrors browser script order)
vm.createContext(windowStub);
vm.runInContext(presetJs, windowStub);

// Load tariff-data.js into window.TARIFF_DATA
vm.runInContext(dataJs, windowStub);
const T = windowStub.TARIFF_DATA;

// Extract calculate() from index.html (brace-matched)
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let calculateFn = null;
for (const s of scripts) {
  if (s.includes('function calculate()')) {
    const start = s.indexOf('function calculate()');
    let depth = 0, i = s.indexOf('{', start);
    for (; i < s.length; i++) {
      if (s[i] === '{') depth++;
      else if (s[i] === '}') { depth--; if (depth === 0) { i++; break; } }
    }
    calculateFn = s.slice(start, i);
  }
}
if (!calculateFn) { console.error('calculate() not found'); process.exit(1); }

const sandbox = {
  T, document: documentStub, window: windowStub, console,
  Math, Date, parseFloat, String, Object,
};
vm.createContext(sandbox);

function set(id, value) { getEl(id).value = value; }
function runCalc() {
  vm.runInContext(calculateFn + '\ncalculate();', sandbox);
}

function check(name, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : ''));
  if (!cond) process.exitCode = 1;
}

// Reset between flows: default drone preset values
function resetDrone() {
  set('direction', 'to-us');
  set('droneSupplier', 'standard');
  set('droneThermal', 'no');
  set('droneWeight', 'over'); // matches old default behavior (Annex I heavy exposure)
  set('value', '10000');
  getEl('usmca').checked = true;
}
resetDrone();

// --- Acceptance T1: China origin + thermal imaging + entry after Sept 3 2026 → 100% ---
set('country', 'china'); set('category', 'drones');
set('droneThermal', 'yes'); set('entryDate', '2026-09-03');
runCalc();
const rate1 = getEl('resultRate').textContent;
const duty1 = getEl('resultDuty').textContent;
const total1 = getEl('resultTotal').textContent;
const base1 = getEl('resultBaseDuty').textContent;
const flags1 = flagsContent();
check('T1 China+thermal rate = 100% Section 232 headline', rate1.startsWith('100% Section 232 drone duty'), rate1);
check('T1 China+thermal duty = $10,000.00', duty1 === '$10,000.00', duty1);
check('T1 China+thermal base duty itemized ($1,950.00 MFN est)', base1 === '$1,950.00', base1);
check('T1 China+thermal total = $21,950.00', total1 === '$21,950.00', total1);
check('T1 rate row label is Section 232 specific', getEl('labelRate').textContent.includes('Section 232 Drone Duty'));
check('T1 flag cites drone tariff', flags1.includes('Section 232 — Drones / UAS Tariff'));
check('T1 flag shows thermal attr', flags1.includes('Thermal imaging: <strong>Yes</strong>'));
check('T1 flag shows heavy attr', flags1.includes('Over ~55 lb'));

// --- Acceptance T2: China + non-thermal + <=55 lb → 25% ---
set('droneThermal', 'no'); set('droneWeight', 'under'); set('entryDate', '2026-09-03');
runCalc();
check('T2 China non-thermal light rate = 25% headline', getEl('resultRate').textContent.startsWith('25% Section 232 drone duty'), getEl('resultRate').textContent);
check('T2 China non-thermal light duty = $2,500.00', getEl('resultDuty').textContent === '$2,500.00', getEl('resultDuty').textContent);

// --- T2b: China + non-thermal + over 55lb → 100% ---
set('droneWeight', 'over');
runCalc();
check('T2b China non-thermal heavy rate = 100%', getEl('resultRate').textContent.startsWith('100% Section 232 drone duty'), getEl('resultRate').textContent);

// --- Acceptance T4: Blue UAS supplier + thermal → deferred 0% until Feb 9 2027 ---
set('droneWeight', 'over'); set('droneSupplier', 'blue-uas'); set('droneThermal', 'yes'); set('entryDate', '2026-09-03');
runCalc();
const rate4 = getEl('resultRate').textContent;
const duty4 = getEl('resultDuty').textContent;
const flags4 = flagsContent();
check('T4 Blue UAS rate = Deferred 0%', rate4.startsWith('Deferred — 0% Section 232 drone duty'), rate4);
check('T4 Blue UAS duty = $0.00', duty4 === '$0.00', duty4);
check('T4 flag says Blue UAS deferral', flags4.includes('Blue UAS deferral — Deferred: 0%'));
check('T4 flag says until Feb 9, 2027', flags4.includes('Feb 9, 2027'));
check('T4 flag corrects allied framing (NOT deferred)', flags4.includes('Allied-nation suppliers are NOT deferred'));

// --- T4b: same Blue UAS drone but entry AFTER Feb 9 2027 → full 100% (deferral ended) ---
set('entryDate', '2027-02-09');
runCalc();
const rate4b = getEl('resultRate').textContent;
const flags4b = flagsContent();
check('T4b Blue UAS after Feb 9 2027 rate = 100%', rate4b.startsWith('100% Section 232 drone duty'), rate4b);
check('T4b flag shows deferral ended', flags4b.includes('deferral ENDED'));
check('T4b duty = $10,000.00', getEl('resultDuty').textContent === '$10,000.00', getEl('resultDuty').textContent);

// --- T3: entry before Sept 3 2026 → not subject (D0) ---
set('droneSupplier', 'standard'); set('entryDate', '2026-08-15');
runCalc();
check('T3 pre-Sept 3 rate = Not subject', getEl('resultRate').textContent.startsWith('Not subject'), getEl('resultRate').textContent);
check('T3 pre-Sept 3 duty = $0.00', getEl('resultDuty').textContent === '$0.00', getEl('resultDuty').textContent);
check('T3 flag warns not subject', flagsContent().includes('Not Subject'));

// --- T7: Allied (EU) origin → total capped at 15% incl Column 1, origin-conditional ---
resetDrone();
set('country', 'european-union'); set('category', 'drones');
set('droneThermal', 'yes'); set('entryDate', '2026-09-10');
runCalc();
const rateEU = getEl('resultRate').textContent;
const flagsEU = flagsContent();
check('EU rate = allied cap 15%', rateEU.startsWith('≤15% total duty incl. Column 1'), rateEU);
check('EU duty at cap = $1,500.00', getEl('resultDuty').textContent === '$1,500.00', getEl('resultDuty').textContent);
check('EU flag = allied carve-out', flagsEU.includes('capped at <strong>15%</strong>'));
check('EU flag = reduction not exemption', flagsEU.includes('reduction, not an exemption'));

// --- T6: UK origin → total capped at 10% ---
set('country', 'united-kingdom');
runCalc();
check('UK rate = allied cap 10%', getEl('resultRate').textContent.startsWith('≤10% total duty incl. Column 1'), getEl('resultRate').textContent);
check('UK duty at cap = $1,000.00', getEl('resultDuty').textContent === '$1,000.00', getEl('resultDuty').textContent);

// --- Regression: non-drone flows unchanged ---
resetDrone();
set('country', 'brazil'); set('category', 'electronics'); set('entryDate', '2026-08-28');
getEl('usmca').checked = false;
runCalc();
check('REGRESSION brazil electronics rate = 43.1% (unchanged)', getEl('resultRate').textContent.startsWith('43.1%'), getEl('resultRate').textContent);
check('REGRESSION brazil electronics duty = $4,310.00 (unchanged)', getEl('resultDuty').textContent === '$4,310.00', getEl('resultDuty').textContent);
check('REGRESSION non-drone labels restored', getEl('labelRate').textContent === 'Estimated Duty Rate');
resetDrone();
set('country', 'vietnam'); set('category', 'electronics'); set('entryDate', '2026-08-28');
getEl('usmca').checked = false;
runCalc();
check('REGRESSION vietnam electronics rate = 17.8% (unchanged)', getEl('resultRate').textContent.startsWith('17.8%'), getEl('resultRate').textContent);
check('REGRESSION vietnam electronics duty = $1,780.00 (unchanged)', getEl('resultDuty').textContent === '$1,780.00', getEl('resultDuty').textContent);

// --- Regression: Canada Sept 8 retaliation direction (to-canada) still works ---
set('direction', 'to-canada'); set('country', 'us'); set('category', 'steel');
set('value', '10000'); set('entryDate', '2026-09-08');
runCalc();
check('REGRESSION canada sept8 steel rate = 50.0%', getEl('resultRate').textContent.startsWith('50.0%'), getEl('resultRate').textContent);
check('REGRESSION canada sept8 steel duty = $5,000.00', getEl('resultDuty').textContent === '$5,000.00', getEl('resultDuty').textContent);

console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED');
