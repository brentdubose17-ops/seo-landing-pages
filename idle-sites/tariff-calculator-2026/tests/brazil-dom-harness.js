#!/usr/bin/env node
/*
 * DOM-stub harness to run the calculator's inline calculate() logic
 * (index.html) end-to-end without a browser. Loads tariff-data.js as
 * window.TARIFF_DATA, stubs document, and drives the Brazil flows.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const dataJs = fs.readFileSync(path.join(__dirname, '..', 'tariff-data.js'), 'utf8');

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
  createElement(tag) { return makeEl('created-' + (Math.random()*1e9|0)); },
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

// Load tariff-data.js into window.TARIFF_DATA
vm.createContext(windowStub);
vm.runInContext(dataJs, windowStub);
const T = windowStub.TARIFF_DATA;

// Extract the inline scripts from index.html and run them in order
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let calculateFn = null;
for (const s of scripts) {
  if (s.includes('function calculate()')) {
    // Brace-matched extraction (the body contains inner closing braces)
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
  T: T, document: documentStub, window: windowStub, console,
  Math, Date, parseFloat, String, Object,
};
vm.createContext(sandbox);

// Pre-set values + run
function set(id, value) { getEl(id).value = value; }
function runCalc() {
  vm.runInContext(calculateFn + '\ncalculate();', sandbox);
}

function check(name, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : ''));
  if (!cond) process.exitCode = 1;
}

// --- Flow 1: Brazil + electronics, current scenario ---
set('country', 'brazil'); set('category', 'electronics');
set('value', '10000'); set('entryDate', '2026-08-28');
getEl('usmca').checked = false;
getEl('direction').value = 'to-us';
getEl('brazilScenario').value = 'current';
runCalc();
const rate1 = getEl('resultRate').textContent;
const duty1 = getEl('resultDuty').textContent;
const flags1 = flagsContent();
check('brazil electronics rate = 43.1%', rate1.startsWith('43.1%'), rate1);
check('brazil electronics duty = $4,310.00', duty1 === '$4,310.00', duty1);
check('Brazil flag shows IN EFFECT', flags1.includes('Brazil Section 301 — 25% Additional Duty (IN EFFECT)'));
check('Brazil flag cites HTS 9903.05.01', flags1.includes('9903.05.01'));
check('Brazil flag cites 37.5% stack', flags1.includes('37.5%'));
check('Brazil flag cites USTR FRN source', flags1.includes('ustr.gov'));
check('breakdown shows Brazil 301 line', flags1.includes('Brazil Section 301 (HTS 9903.05.01): +25.0%'));

// --- Flow 2: Brazil + electronics, removed scenario ---
set('brazilScenario', 'removed');
runCalc();
const rate2 = getEl('resultRate').textContent;
const duty2 = getEl('resultDuty').textContent;
const flags2 = flagsContent();
check('removed scenario rate = 18.1%', rate2.startsWith('18.1%'), rate2);
check('removed scenario duty = $1,810.00', duty2 === '$1,810.00', duty2);
check('removed scenario labeled what-if', rate2.includes('What-if: removed / 0%'));
check('removed flag shows NOT in effect', flags2.includes('NOT in effect'));

// --- Flow 3: Brazil + reduced_15 ---
set('brazilScenario', 'reduced_15');
runCalc();
check('reduced_15 rate = 33.1%', getEl('resultRate').textContent.startsWith('33.1%'), getEl('resultRate').textContent);

// --- Flow 4: Brazil + pharma (exempt) ---
set('category', 'pharma'); set('brazilScenario', 'current');
runCalc();
const flags4 = flagsContent();
check('pharma exempt flag', flags4.includes('EXEMPT from the 25%'));
check('pharma cites 9903.05.06', flags4.includes('9903.05.06'));

// --- Flow 5: Brazil + steel (S232 exempt) ---
set('category', 'steel');
runCalc();
const flags5 = flagsContent();
check('steel exempt flag cites 9903.05.07', flags5.includes('9903.05.07'));

// --- Flow 6: date gating ---
set('category', 'electronics'); set('entryDate', '2026-07-21');
runCalc();
check('pre-7/22 no Brazil 25% (18.1%)', getEl('resultRate').textContent.startsWith('18.1%'), getEl('resultRate').textContent);
set('entryDate', '2026-07-22');
runCalc();
check('on 7/22 Brazil 25% applies (43.1%)', getEl('resultRate').textContent.startsWith('43.1%'), getEl('resultRate').textContent);

// --- Flow 7: other country unaffected ---
set('country', 'china'); set('entryDate', '2026-08-28');
runCalc();
check('china has no Brazil flag', !getEl('flags').innerHTML.includes('Brazil Section 301'));

console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED');
