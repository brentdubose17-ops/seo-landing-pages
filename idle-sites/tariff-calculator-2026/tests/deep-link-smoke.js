#!/usr/bin/env node
/*
 * deep-link-smoke.js — unit-test the `?product=drones` deep-link handler that
 * was appended to index.html (kanban t_00f21208). Verifies the snippet
 * (a) preselects the Drones / UAS category and dispatches a `change` event
 * when `?product=drones` is present, and (b) does nothing otherwise.
 *
 * The `change` listener that reveals #dronePanel/#droneAttrRow is exercised
 * separately by drone-dom-harness.js / the t_a836cab0 live smoke — here we
 * only prove our injected snippet wires the select correctly.
 *
 * Run: node tests/deep-link-smoke.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extractDeepLinkScript(htmlText) {
  const scripts = [...htmlText.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const found = scripts.find(s => s.includes('product=drones'));
  if (!found) throw new Error('deep-link script block not found in index.html');
  return found;
}

function runWithQuery(search) {
  let dispatched = [];
  const categoryEl = {
    value: '',
    options: [{ value: 'china' }, { value: 'drones' }, { value: 'steel' }],
    dispatchEvent(ev) { dispatched.push(ev.type); },
  };
  const documentStub = { getElementById: (id) => (id === 'category' ? categoryEl : null) };
  const sandbox = {
    window: { location: { search } },
    document: documentStub,
    URLSearchParams,
    Event: function (type) { this.type = type; },
    console,
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(extractDeepLinkScript(html), sandbox);
  return { value: categoryEl.value, dispatched };
}

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('PASS |', name); }
  else { fail++; console.log('FAIL |', name); }
}

// Positive: query param present → category preselected + change dispatched
let r = runWithQuery('?product=drones');
check('preselects category to drones', r.value === 'drones');
check('dispatches change event once', r.dispatched.length === 1 && r.dispatched[0] === 'change');

// Negative: no param → untouched
r = runWithQuery('');
check('no param → category untouched', r.value === '');
check('no param → no event dispatched', r.dispatched.length === 0);

// Negative: other product value → untouched
r = runWithQuery('?product=autos');
check('other param value → category untouched', r.value === '');
check('other param value → no event dispatched', r.dispatched.length === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
