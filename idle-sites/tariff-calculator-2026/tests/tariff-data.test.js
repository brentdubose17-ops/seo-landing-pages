#!/usr/bin/env node
/*
 * Tariff Calculator 2026 — data + logic tests (Node built-in test runner).
 * Run: node --test tests/
 * Covers: 60-economy Section 301 matrix, new + existing country rates,
 * USMCA defaults intact, proposed-tariff flags, exemptions.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../tariff-data.js');

test('Section 301 matrix contains all 60 economies', () => {
  const keys = Object.keys(T.SECTION_301);
  assert.equal(keys.length, 60, `expected 60 economies, got ${keys.length}`);
});

test('rate split matches verified dataset (17 flat 10%, 38 flat 12.5%, 5 mfn-capped)', () => {
  const flat10 = Object.values(T.SECTION_301).filter(c => c.type === 'flat' && c.rate === 0.10);
  const flat125 = Object.values(T.SECTION_301).filter(c => c.type === 'flat' && c.rate === 0.125);
  const capped = Object.values(T.SECTION_301).filter(c => c.type === 'mfn_cap');
  assert.equal(flat10.length, 17, `expected 17 flat 10%, got ${flat10.length}`);
  assert.equal(flat125.length, 38, `expected 38 flat 12.5%, got ${flat125.length}`);
  assert.equal(capped.length, 5, `expected 5 mfn-capped, got ${capped.length}`);
  // caps: EU/TW 10%, JP/KR/CH 12.5%
  const cap10 = capped.filter(c => c.cap === 0.10).map(c => c.name).sort();
  assert.deepEqual(cap10, ['European Union', 'Taiwan']);
  const cap125 = capped.filter(c => c.cap === 0.125).map(c => c.name).sort();
  assert.deepEqual(cap125, ['Japan', 'South Korea', 'Switzerland']);
});

test('NEW country: Algeria has 12.5% flat Section 301 rate', () => {
  const c = T.SECTION_301['algeria'];
  assert.ok(c, 'algeria missing from matrix');
  assert.equal(c.rate, 0.125);
  assert.equal(c.type, 'flat');
  assert.equal(c.heading, '9903.05.20');
});

test('NEW country: Bangladesh has 10% flat Section 301 rate (newly added)', () => {
  const c = T.SECTION_301['bangladesh'];
  assert.ok(c, 'bangladesh missing from matrix');
  assert.equal(c.rate, 0.10);
  assert.equal(c.type, 'flat');
});

test('EXISTING country: Vietnam still present with updated 12.5% rate', () => {
  const c = T.SECTION_301['vietnam'];
  assert.ok(c, 'vietnam missing from matrix');
  assert.equal(c.rate, 0.125);
  assert.equal(c.type, 'flat');
});

test('EXISTING country: China keeps 12.5% + stacks on pre-existing 301', () => {
  const c = T.SECTION_301['china'];
  assert.ok(c, 'china missing from matrix');
  assert.equal(c.rate, 0.125);
  assert.equal(c.stacks_on_existing, true);
  const res = T.effectiveRate('china', 'electronics', { usmcaQualified: false });
  // mfn 0.195 + cat 0.008 + s301 0.125 + china existing 0.075 = 0.403
  assert.ok(Math.abs(res.rate - 0.403) < 0.0001, `expected 0.403, got ${res.rate}`);
  assert.equal(res.breakdown.chinaExisting301, 0.075);
});

test('USMCA defaults intact: Canada & Mexico exempt from Section 301 when qualified', () => {
  assert.deepEqual(T.USMCA.exempt_from_301, ['canada', 'mexico']);
  // default (no opts) = usmcaQualified true for CA/MX
  const ca = T.effectiveRate('canada', 'auto');
  assert.equal(ca.breakdown.section301, 0, 'Canada USMCA-qualified should have 0 Section 301');
  assert.equal(ca.breakdown.usmcaQualified, true);
  const mx = T.effectiveRate('mexico', 'auto');
  assert.equal(mx.breakdown.section301, 0);
  // When NOT qualified, they get their 10% Section 301 rate
  const caNo = T.effectiveRate('canada', 'auto', { usmcaQualified: false });
  assert.equal(caNo.breakdown.section301, 0.10);
  const mxNo = T.effectiveRate('mexico', 'auto', { usmcaQualified: false });
  assert.equal(mxNo.breakdown.section301, 0.10);
});

test('MFN-cap logic: EU tops up to 10% cap, Japan to 12.5%', () => {
  // EU mfn est 0.017 -> s301 = 0.10 - 0.017 = 0.083 (cap applies to MFN+301 combined)
  const eu = T.effectiveRate('european-union', 'electronics', { usmcaQualified: false });
  assert.ok(Math.abs(eu.breakdown.section301 - (0.10 - 0.017)) < 0.0001, `EU s301 add wrong: ${eu.breakdown.section301}`);
  // combined MFN + s301 hits the 10% cap; category modifier stacks on top
  assert.ok(Math.abs((eu.breakdown.mfn + eu.breakdown.section301) - 0.10) < 0.0001, `EU MFN+s301 should hit cap 0.10, got ${eu.breakdown.mfn + eu.breakdown.section301}`);
  // Japan mfn est 0.018 -> s301 = 0.125 - 0.018 = 0.107
  const jp = T.effectiveRate('japan', 'electronics', { usmcaQualified: false });
  assert.ok(Math.abs(jp.breakdown.section301 - (0.125 - 0.018)) < 0.0001);
  assert.ok(Math.abs((jp.breakdown.mfn + jp.breakdown.section301) - 0.125) < 0.0001);
});

test('Proposed tariff flags present: Canada S338 + EU DST', () => {
  const keys = T.PROPOSED_FLAGS.map(f => f.key);
  assert.ok(keys.includes('canada_s338'), 'canada_s338 flag missing');
  assert.ok(keys.includes('eu_dst'), 'eu_dst flag missing');
  const s338 = T.PROPOSED_FLAGS.find(f => f.key === 'canada_s338');
  assert.equal(s338.rate, 0.50);
  assert.equal(s338.country, 'canada');
  assert.deepEqual(s338.categories, ['auto', 'food']);
  assert.equal(s338.effective, '2026-08-19 12:01 AM ET');
  // EU DST is threatened, not in effect
  const eu = T.PROPOSED_FLAGS.find(f => f.key === 'eu_dst');
  assert.equal(eu.effective, null);
  assert.equal(eu.rate, 0.25);
});

test('Proposed flags are NOT included in default rate calculation', () => {
  const ca = T.effectiveRate('canada', 'auto', { usmcaQualified: false });
  assert.equal(ca.breakdown.proposed, 0, 'proposed S338 should not be in default rate');
  // But included when opted in
  const ca2 = T.effectiveRate('canada', 'auto', { usmcaQualified: false, includeProposed: true });
  assert.equal(ca2.breakdown.proposed, 0.50);
});

test('Section 232 exemption note present (no stacking)', () => {
  assert.ok(T.EXEMPTION_NOTES['232'].includes('exempt from Section 301'));
});

test('Effective dates correct', () => {
  assert.equal(T.EFFECTIVE_DATE, '2026-07-24 12:01 AM ET');
  assert.equal(T.IN_TRANSIT_END, '2026-07-28 12:01 AM ET');
});

test('Brazil uses 12.5% forced-labor rate (separate from 25% action)', () => {
  const c = T.SECTION_301['brazil'];
  assert.equal(c.rate, 0.125);
  assert.equal(c.type, 'flat');
  const res = T.effectiveRate('brazil', 'electronics', { usmcaQualified: false });
  assert.equal(res.breakdown.section301, 0.125);
});

test('All 60 economies have MFN estimates and valid categories', () => {
  Object.keys(T.SECTION_301).forEach(k => {
    assert.ok(typeof T.MFN_EST[k] === 'number', `${k} missing MFN estimate`);
    assert.ok(T.MFN_EST[k] >= 0, `${k} MFN estimate negative`);
    // every country computes a rate for every category
    Object.keys(T.CATEGORY_MODIFIERS).forEach(cat => {
      const res = T.effectiveRate(k, cat, { usmcaQualified: false });
      assert.ok(res, `${k}/${cat} returned null`);
      assert.ok(res.rate >= 0 && res.rate <= 0.60, `${k}/${cat} rate out of range: ${res.rate}`);
    });
  });
});

test('No duplicate country names in matrix', () => {
  const names = Object.values(T.SECTION_301).map(c => c.name);
  assert.equal(new Set(names).size, names.length, 'duplicate country names found');
});

test('Calculator page links to the published tariff expansion article', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.includes('section-301-tariff-expansion-60-countries.html'),
    'index.html must link to the Section 301 expansion article');
  const article = fs.readFileSync(path.join(__dirname, '..', 'section-301-tariff-expansion-60-countries.html'), 'utf8');
  assert.ok(article.length > 5000, 'expansion article should be substantive');
  assert.ok(article.includes('Section 301'), 'article should mention Section 301');
});
