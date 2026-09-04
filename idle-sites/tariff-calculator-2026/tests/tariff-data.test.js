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

test('Proposed tariff flags present: EU DST only (canada_s338 moved to SECTION_338_CANADA)', () => {
  const keys = T.PROPOSED_FLAGS.map(f => f.key);
  assert.ok(!keys.includes('canada_s338'), 'canada_s338 should no longer be a proposed flag — S338 is now in effect');
  assert.ok(keys.includes('eu_dst'), 'eu_dst flag missing');
  const eu = T.PROPOSED_FLAGS.find(f => f.key === 'eu_dst');
  assert.equal(eu.effective, null);
  assert.equal(eu.rate, 0.25);
});

test('SECTION_338_CANADA entry correct (rate, effective date, authority, scope, sources)', () => {
  const s = T.SECTION_338_CANADA;
  assert.ok(s, 'SECTION_338_CANADA should be present');
  assert.equal(s.rate, 0.50);
  assert.equal(s.effective, '2026-08-22 12:01 AM ET');
  assert.equal(s.effective_gmt, '04:01 GMT');
  assert.ok(s.authority.includes('Section 338'), 'authority should cite Section 338');
  assert.ok(s.value_affected.includes('$20 billion'), 'value_affected should mention ~$20B');
  assert.equal(s.applies_to_cusma_goods, true);
  assert.ok(Array.isArray(s.exceptions) && s.exceptions.includes('energy products'), 'exceptions should list energy/potash/fish/critical minerals/232');
  assert.ok(s.source_citations.length >= 5, `should have >= 5 source citations, got ${s.source_citations.length}`);
});

test('Covered product scope includes hockey sticks and tongue depressors', () => {
  const ps = T.SECTION_338_CANADA.product_scope;
  assert.ok(ps, 'product_scope should be present');
  const groups = Object.keys(ps).filter(k => k !== 'ap_framing');
  const all = groups.reduce((acc, k) => acc.concat(ps[k]), []);
  assert.ok(all.some(x => /hockey/i.test(x)), 'hockey sticks should be in scope');
  assert.ok(all.some(x => /tongue depressor/i.test(x)), 'tongue depressors should be in scope');
  assert.ok(ps.alcohol.includes('wine'), 'wine should be in alcohol scope');
  assert.ok(ps.dairy.some(x => /whey|cream|milk/i.test(x)), 'dairy lines should be in scope');
  // flat PRODUCT_SCOPE keyword list for product-name lookup
  assert.ok(T.PRODUCT_SCOPE.includes('hockey stick'), 'PRODUCT_SCOPE missing hockey stick');
  assert.ok(T.PRODUCT_SCOPE.includes('tongue depressor'), 'PRODUCT_SCOPE missing tongue depressor');
});

test('canada-s338 category available in CATEGORY_MODIFIERS', () => {
  const cat = T.CATEGORY_MODIFIERS['canada-s338'];
  assert.ok(cat, 'canada-s338 category should exist');
  assert.equal(cat.add, 0, 'canada-s338 base add is 0 — rate comes from Section 338');
  assert.ok(cat.name.includes('Section 338'));
});

test('COVERED product returns 50% on/after Aug 22 2026 (effective date)', () => {
  // Canada / canada-s338 on Aug 22: MFN 0.005 + S338 0.50 = 0.505
  const res = T.effectiveRate('canada', 'canada-s338', { asOfDate: '2026-08-22' });
  assert.ok(res.breakdown.s338, 's338 details should be present');
  assert.equal(res.breakdown.s338.applies, true);
  assert.equal(res.breakdown.s338.rate, 0.50);
  assert.equal(res.breakdown.s338.effective, '2026-08-22 12:01 AM ET');
  assert.ok(Math.abs(res.rate - 0.505) < 0.0001, `expected 0.505, got ${res.rate}`);
  // Auto & food categories also covered (original flag scope)
  const auto = T.effectiveRate('canada', 'auto', { asOfDate: '2026-08-22' });
  assert.equal(auto.breakdown.s338.applies, true);
  assert.ok(Math.abs(auto.breakdown.s338.rate - 0.50) < 0.0001);
  const food = T.effectiveRate('canada', 'food', { asOfDate: '2026-08-22' });
  assert.ok(Math.abs(food.breakdown.s338.rate - 0.50) < 0.0001);
});

test('COVERED product does NOT get 50% before Aug 22 2026 (date gating)', () => {
  const res = T.effectiveRate('canada', 'canada-s338', { asOfDate: '2026-08-21' });
  assert.ok(res.breakdown.s338);
  assert.equal(res.breakdown.s338.applies, false);
  assert.equal(res.breakdown.s338.rate, 0);
  assert.ok(Math.abs(res.rate - 0.005) < 0.0001, `expected 0.005 (base only), got ${res.rate}`);
  // auto before Aug 22: base only 0.005 + 0.027 = 0.032
  const auto = T.effectiveRate('canada', 'auto', { asOfDate: '2026-08-21' });
  assert.ok(Math.abs(auto.rate - 0.032) < 0.0001, `expected 0.032, got ${auto.rate}`);
});

test('S338 applies by default (today >= Aug 22) and regardless of USMCA', () => {
  // default (no opts) = today = Aug 22, 2026 → applies
  const res = T.effectiveRate('canada', 'canada-s338');
  assert.equal(res.breakdown.s338.applies, true);
  assert.ok(Math.abs(res.breakdown.s338.rate - 0.50) < 0.0001);
  // USMCA-qualified Canada auto still gets the S338 50% (no USMCA exemption)
  const ca = T.effectiveRate('canada', 'auto', { usmcaQualified: true, asOfDate: '2026-08-22' });
  assert.equal(ca.breakdown.section301, 0, 'S301 still waived for USMCA-qualified');
  assert.equal(ca.breakdown.s338.applies, true, 'S338 applies regardless of USMCA');
  assert.ok(Math.abs(ca.breakdown.s338.rate - 0.50) < 0.0001);
});

test('NON-covered goods unchanged: Canada electronics/steel/pharma keep prior rates', () => {
  // Canada electronics USMCA default: 0.005 + 0.008 = 0.013 (S301 exempt, no S338)
  const el = T.effectiveRate('canada', 'electronics', { asOfDate: '2026-08-22' });
  assert.equal(el.breakdown.s338, null, 'electronics not covered — no s338 details');
  assert.ok(Math.abs(el.rate - 0.013) < 0.0001, `expected 0.013, got ${el.rate}`);
  // steel (Section 232 exemption): unchanged 0.005 + 0.014 = 0.019
  const st = T.effectiveRate('canada', 'steel', { asOfDate: '2026-08-22' });
  assert.ok(Math.abs(st.rate - 0.019) < 0.0001, `expected 0.019, got ${st.rate}`);
  // pharma: 0.005
  const ph = T.effectiveRate('canada', 'pharma', { asOfDate: '2026-08-22' });
  assert.ok(Math.abs(ph.rate - 0.005) < 0.0001);
});

test('NON-covered: other countries unchanged (backward compat)', () => {
  // China electronics stack still 0.403
  const cn = T.effectiveRate('china', 'electronics', { usmcaQualified: false, asOfDate: '2026-08-22' });
  assert.ok(Math.abs(cn.rate - 0.403) < 0.0001, `china/electronics expected 0.403, got ${cn.rate}`);
  // Vietnam electronics still 0.178
  const vn = T.effectiveRate('vietnam', 'electronics', { usmcaQualified: false, asOfDate: '2026-08-22' });
  assert.ok(Math.abs(vn.rate - 0.178) < 0.0001, `vietnam/electronics expected 0.178, got ${vn.rate}`);
  // Mexico USMCA auto unchanged (no S338 for Mexico)
  const mx = T.effectiveRate('mexico', 'auto', { asOfDate: '2026-08-22' });
  assert.equal(mx.breakdown.s338, null);
  assert.ok(Math.abs(mx.rate - (0.008 + 0.027)) < 0.0001, `mexico/auto expected 0.035, got ${mx.rate}`);
});

test('S338 product-name QA sample: hockey stick + tongue depressor lookup', () => {
  const q = (name) => T.PRODUCT_SCOPE.some(k => name.toLowerCase().includes(k));
  assert.equal(q('wooden ice hockey stick'), true);
  assert.equal(q('tongue depressors'), true);
  assert.equal(q('bottle of wine'), true);
  assert.equal(q('cheddar cheese'), true, 'cheeses of all types are covered per Proclamation 11047 (datapack row 3, HIGH)');
  assert.equal(q('smartphone'), false);
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
      // Upper bound is 1.50 because drones (100% Annex I) and Canada S338
      // covered goods (base + 10% S301 + 50% S338) legitimately exceed 60%.
      assert.ok(res.rate >= 0 && res.rate <= 1.50, `${k}/${cat} rate out of range: ${res.rate}`);
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

// --- Section 232 Polysilicon tariff tests ---

test('SECTION_232_POLYSILICON is exported with correct values', () => {
  const s = T.SECTION_232_POLYSILICON;
  assert.ok(s, 'SECTION_232_POLYSILICON should be present');
  assert.equal(s.category, 'polysilicon');
  assert.equal(s.rate, 0.15);
  assert.equal(s.effective, '2026-12-04 12:01 AM ET');
  assert.equal(s.signature, '2026-08-06');
  assert.ok(s.mip_floors);
  assert.equal(s.mip_floors.polysilicon.value, 21);
  assert.equal(s.mip_floors.polysilicon.unit, 'USD/kg');
  assert.equal(s.mip_floors.solar_module.value, 0.38);
  assert.equal(s.mip_floors.solar_module.unit, 'USD/W');
  // carve-out arrays
  assert.ok(Array.isArray(s.carve_outs.combined_15));
  assert.ok(Array.isArray(s.carve_outs.uk_10));
  assert.equal(s.carve_outs.uk_10.length, 1);
  assert.equal(s.carve_outs.uk_10[0], 'united-kingdom');
});

test('polysilicon category available in CATEGORY_MODIFIERS', () => {
  const cat = T.CATEGORY_MODIFIERS['polysilicon'];
  assert.ok(cat, 'polysilicon category should exist');
  assert.equal(cat.add, 0, 'polysilicon base add is 0 — rate comes from Section 232');
  assert.ok(cat.name.includes('Section 232'));
});

test('polysilicon tariff applies on Dec 4 2026 (effective date)', () => {
  // China polysilicon: MFN 0.195 + cat 0 + 301 0.125 + chinaExisting 0 + s232 0.15 = 0.47
  const res = T.effectiveRate('china', 'polysilicon', {
    usmcaQualified: false,
    asOfDate: '2026-12-04'
  });
  assert.ok(res);
  assert.ok(res.breakdown.s232, 's232 details should be present');
  assert.equal(res.breakdown.s232.applies, true);
  assert.ok(Math.abs(res.breakdown.s232.rate - 0.15) < 0.0001,
    `s232 rate should be 0.15 for China, got ${res.breakdown.s232.rate}`);
  // 0.195 + 0.125 + 0.15 = 0.47
  assert.ok(Math.abs(res.rate - 0.47) < 0.0001,
    `expected rate 0.47, got ${res.rate}`);
  // MIP floors present
  assert.ok(res.breakdown.s232.mip_floors);
  assert.equal(res.breakdown.s232.mip_floors.polysilicon.value, 21);
  assert.equal(res.breakdown.s232.mip_floors.solar_module.value, 0.38);
});

test('polysilicon tariff does NOT apply before Dec 4 2026', () => {
  const res = T.effectiveRate('china', 'polysilicon', {
    usmcaQualified: false,
    asOfDate: '2026-12-03'
  });
  assert.ok(res);
  assert.ok(res.breakdown.s232, 's232 details should always be present');
  assert.equal(res.breakdown.s232.applies, false);
  assert.equal(res.breakdown.s232.rate, 0);
  // Rate should be only MFN + 301 = 0.195 + 0.125 = 0.32
  assert.ok(Math.abs(res.rate - 0.32) < 0.0001,
    `expected rate 0.32 (no s232), got ${res.rate}`);
});

test('polysilicon tariff does NOT apply with today\'s date (before Dec 4 2026)', () => {
  // Default (no asOfDate) = today. Aug 2026 < Dec 4, so should NOT apply.
  const res = T.effectiveRate('china', 'polysilicon', { usmcaQualified: false });
  assert.ok(res);
  assert.ok(res.breakdown.s232);
  assert.equal(res.breakdown.s232.applies, false,
    's232 should not apply by default (today < Dec 4)');
  assert.equal(res.breakdown.s232.rate, 0);
});

test('polysilicon — EU carve-out: S232 + Column 1 = 15% total', () => {
  // EU: MFN 0.017 → s232 = 0.15 - 0.017 = 0.133 (combined 15%)
  const res = T.effectiveRate('european-union', 'polysilicon', {
    asOfDate: '2026-12-15'
  });
  assert.ok(res);
  assert.equal(res.breakdown.s232.applies, true);
  assert.ok(Math.abs(res.breakdown.s232.rate - (0.15 - 0.017)) < 0.0001,
    `EU s232 should be ${0.15 - 0.017}, got ${res.breakdown.s232.rate}`);
});

test('polysilicon — UK carve-out: 10% additional', () => {
  // UK: 10% additional (not the full 15%)
  const res = T.effectiveRate('united-kingdom', 'polysilicon', {
    asOfDate: '2026-12-15'
  });
  assert.ok(res);
  assert.equal(res.breakdown.s232.applies, true);
  assert.ok(Math.abs(res.breakdown.s232.rate - 0.10) < 0.0001,
    `UK s232 should be 0.10, got ${res.breakdown.s232.rate}`);
});

test('polysilicon — non-carve-out country (Vietnam): full 15%', () => {
  // Vietnam is NOT in combined_15 or uk_10 → full 15%
  const res = T.effectiveRate('vietnam', 'polysilicon', {
    asOfDate: '2027-01-01'
  });
  assert.ok(res);
  assert.equal(res.breakdown.s232.applies, true);
  assert.ok(Math.abs(res.breakdown.s232.rate - 0.15) < 0.0001);
});

test('polysilicon — effective-date edge: Dec 4 2026 date-only comparison', () => {
  // date-only comparison: any time on Dec 4 = effective
  const res = T.effectiveRate('vietnam', 'polysilicon', {
    asOfDate: '2026-12-04T00:00:00Z'
  });
  assert.ok(res);
  assert.equal(res.breakdown.s232.applies, true,
    'Dec 4 in any timezone = effective (date-only comparison)');
});

// --- De Minimis Suspension tests (CIT ruling Aug 13, 2026) ---
// The $800 de minimis duty exemption is suspended. Every package over $0
// must be assessed duty; no parcel value may be treated as 'de minimis exempt'.
// Scenario used for landed-cost assertions: China / electronics (non-USMCA),
// which has a stable known rate stack: MFN 0.195 + cat 0.008 + S301 0.125 +
// China pre-existing 301 0.075 = 0.403.

const LANDED_SCENARIO = { country: 'china', category: 'electronics', opts: { usmcaQualified: false } };
const PARCEL_VALUES = [1, 50, 799, 800, 801];

function landedCost(value, rate) {
  const duty = value * rate;
  return { value: value, rate: rate, duty: duty, total: value + duty };
}

test('de minimis suspended: every parcel value over $0 is assessed duty (no exemption)', () => {
  PARCEL_VALUES.forEach(v => {
    const res = T.effectiveRate(LANDED_SCENARIO.country, LANDED_SCENARIO.category, LANDED_SCENARIO.opts);
    assert.ok(res, `effectiveRate failed for value $${v}`);
    assert.ok(res.rate > 0, `rate should be > 0 for $${v}, got ${res.rate}`);
    const lc = landedCost(v, res.rate);
    assert.ok(lc.duty > 0, `duty should be > 0 for $${v}, got $${lc.duty.toFixed(2)}`);
    assert.ok(lc.total > v, `landed cost should exceed value for $${v}`);
  });
});

test('de minimis suspended: landed-cost results for $1, $50, $799, $800, $801 (China/electronics @ 40.3%)', () => {
  // Expected rate for China/electronics = 0.403 (see test above).
  const res = T.effectiveRate(LANDED_SCENARIO.country, LANDED_SCENARIO.category, LANDED_SCENARIO.opts);
  const expectedRate = 0.403;
  assert.ok(Math.abs(res.rate - expectedRate) < 0.0001, `expected rate ${expectedRate}, got ${res.rate}`);

  const expected = {
    1:   { duty: 0.40, total: 1.40 },
    50:  { duty: 20.15, total: 70.15 },
    799: { duty: 321.997, total: 1120.997 },
    800: { duty: 322.40, total: 1122.40 },
    801: { duty: 322.803, total: 1123.803 }
  };

  PARCEL_VALUES.forEach(v => {
    const lc = landedCost(v, res.rate);
    const exp = expected[v];
    assert.ok(Math.abs(lc.duty - exp.duty) < 0.01, `$${v}: duty ${lc.duty.toFixed(4)} != expected ${exp.duty}`);
    assert.ok(Math.abs(lc.total - exp.total) < 0.01, `$${v}: landed ${lc.total.toFixed(4)} != expected ${exp.total}`);
  });
});

test('de minimis suspended: USMCA-qualified Canada still pays duty on low-value parcels (no $800 exemption)', () => {
  // Even a USMCA-qualified parcel is no longer exempt below $800 — only the
  // Section 301 add is waived, MFN+category still apply.
  const res = T.effectiveRate('canada', 'auto', { usmcaQualified: true });
  assert.ok(res.rate > 0, `Canada USMCA rate should be > 0, got ${res.rate}`);
  PARCEL_VALUES.forEach(v => {
    const lc = landedCost(v, res.rate);
    assert.ok(lc.duty > 0, `Canada USMCA $${v} should still owe duty, got $${lc.duty.toFixed(2)}`);
  });
});

test('de minimis suspended: UI copy no longer claims low-value packages are exempt', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  // Old claim must be gone
  assert.ok(!html.includes('may enter duty-free under Section 321'),
    'index.html must not claim the Section 321 duty-free threshold still exists');
  assert.ok(!/Shipments under \$800 may enter duty-free/i.test(html),
    'index.html must not claim low-value shipments enter duty-free');
  // New copy must be present
  assert.ok(/De Minimis Exemption Suspended/i.test(html),
    'index.html should announce the de minimis suspension');
  assert.ok(html.includes('every package'), 'index.html should state duty applies to every package');
  // Calculator still accepts low values (min=1)
  assert.ok(/min="1"/.test(html), 'calculator input should still accept values as low as $1');
});

test('de minimis suspended: data layer exports no de minimis threshold constant', () => {
  assert.equal(T.DE_MINIMIS_THRESHOLD, undefined, 'no de minimis threshold constant should be exported');
  assert.equal(T.DE_MINIMIS_EXEMPT, undefined, 'no de minimis exempt flag should be exported');
});

// --- Section 232 UAS / Drones tariff tests ---
// Verified 2026-08-15 against White House proclamation (Aug 13 2026),
// Annexes I-IV, fact sheet, KPMG, EY (fact-sheet-drone-tariff-section-232.md).

test('SECTION_232_UAS is exported with correct values', () => {
  const u = T.SECTION_232_UAS;
  assert.ok(u, 'SECTION_232_UAS should be present');
  assert.equal(u.category, 'drones');
  assert.equal(u.signature, '2026-08-13');
  assert.equal(u.effective_main, '2026-09-03 12:01 AM ET');
  assert.equal(u.effective_components, '2027-02-09 12:01 AM ET');
  assert.ok(u.tiers, 'tiers should be present');
  // 100% Annex I tier
  assert.equal(u.tiers.annex_i.rate, 1.00);
  assert.equal(u.tiers.annex_i.applies_from, '2026-09-03');
  // 25% Annex II tier
  assert.equal(u.tiers.annex_ii.rate, 0.25);
  assert.equal(u.tiers.annex_ii.applies_from, '2026-09-03');
  // 25% Annex III components tier (effective 2027)
  assert.equal(u.tiers.annex_iii.rate, 0.25);
  assert.equal(u.tiers.annex_iii.applies_from, '2027-02-09');
  // carve-outs
  assert.deepEqual(u.carve_outs.combined_15, ['japan', 'south-korea', 'taiwan', 'switzerland', 'european-union']);
  assert.deepEqual(u.carve_outs.uk_10, ['united-kingdom']);
  assert.ok(u.source_citations.length >= 5, 'should have source citations');
});

test('drones category available in CATEGORY_MODIFIERS with searchable name', () => {
  const cat = T.CATEGORY_MODIFIERS['drones'];
  assert.ok(cat, 'drones category should exist');
  assert.equal(cat.add, 0, 'drones base add is 0 — rate comes from Section 232');
  assert.ok(cat.name.includes('Section 232'));
  // Importers must be able to find the category by 'drone', 'UAS', 'unmanned aircraft'
  const lower = cat.name.toLowerCase();
  assert.ok(lower.includes('drone'), 'category name should contain "drone"');
  assert.ok(lower.includes('uas'), 'category name should contain "UAS"');
  assert.ok(lower.includes('unmanned aircraft'), 'category name should contain "unmanned aircraft"');
});

test('drone tariff applies on Sept 3 2026 (effective date) — 100% Annex I tier', () => {
  // China drones (Annex I default): MFN 0.195 + drone 1.00 = 1.195 (no S301 stacking — 232 exempt)
  const res = T.effectiveRate('china', 'drones', {
    usmcaQualified: false,
    asOfDate: '2026-09-03'
  });
  assert.ok(res);
  assert.ok(res.breakdown.drone, 'drone details should be present');
  assert.equal(res.breakdown.drone.applies, true);
  assert.equal(res.breakdown.drone.tier, 'annex_i');
  assert.ok(Math.abs(res.breakdown.drone.rate - 1.00) < 0.0001,
    `drone rate should be 1.00 for China, got ${res.breakdown.drone.rate}`);
  assert.equal(res.breakdown.section301, 0, 'Section 301 must NOT stack on Section 232 drones');
  // 0.195 + 1.00 = 1.195
  assert.ok(Math.abs(res.rate - 1.195) < 0.0001,
    `expected rate 1.195, got ${res.rate}`);
  assert.equal(res.breakdown.drone.effective, '2026-09-03');
});

test('drone tariff does NOT apply before Sept 3 2026', () => {
  const res = T.effectiveRate('china', 'drones', {
    usmcaQualified: false,
    asOfDate: '2026-09-02'
  });
  assert.ok(res);
  assert.ok(res.breakdown.drone, 'drone details should always be present');
  assert.equal(res.breakdown.drone.applies, false);
  assert.equal(res.breakdown.drone.rate, 0);
  // Rate should be only MFN = 0.195 (no drone duty yet)
  assert.ok(Math.abs(res.rate - 0.195) < 0.0001,
    `expected rate 0.195 (no drone duty), got ${res.rate}`);
});

test('drone tariff — default date (today) resolves against the effective date', () => {
  // Default (no asOfDate) = today. The tariff is IN FORCE from Sept 3, 2026,
  // so from that date forward the default heavy-exposure tier (Annex I 100%)
  // applies; the assertion is date-relative, not wall-clock-locked.
  const res = T.effectiveRate('china', 'drones', { usmcaQualified: false });
  assert.ok(res);
  assert.ok(res.breakdown.drone);
  const today = new Date().toISOString().slice(0, 10);
  assert.equal(res.breakdown.drone.askedDate, today);
  assert.equal(res.breakdown.drone.applies, today >= '2026-09-03',
    'drone tariff applies from Sept 3, 2026 onward');
  assert.equal(res.breakdown.drone.notSubject, today < '2026-09-03');
  if (today >= '2026-09-03') {
    assert.equal(res.breakdown.drone.tier, 'annex_i');
    assert.ok(Math.abs(res.breakdown.drone.rate - 1.00) < 0.0001,
      'default tier is Annex I (100%) — heavy-exposure default');
  }
});

test('drone tariff — Annex II tier: 25% for UAS <= 25 kg (no thermal imaging)', () => {
  const res = T.effectiveRate('china', 'drones', {
    usmcaQualified: false,
    asOfDate: '2026-10-01',
    droneTier: 'annex_ii'
  });
  assert.ok(res);
  assert.equal(res.breakdown.drone.applies, true);
  assert.equal(res.breakdown.drone.tier, 'annex_ii');
  assert.ok(Math.abs(res.breakdown.drone.rate - 0.25) < 0.0001);
  // 0.195 + 0.25 = 0.445
  assert.ok(Math.abs(res.rate - 0.445) < 0.0001, `expected 0.445, got ${res.rate}`);
});

test('drone tariff — Annex III components: 25% but NOT effective until Feb 9 2027', () => {
  // Before Feb 9 2027: not in effect
  const before = T.effectiveRate('china', 'drones', {
    usmcaQualified: false,
    asOfDate: '2026-12-15',
    droneTier: 'annex_iii'
  });
  assert.equal(before.breakdown.drone.applies, false);
  assert.equal(before.breakdown.drone.rate, 0);
  // On/after Feb 9 2027: 25%
  const after = T.effectiveRate('china', 'drones', {
    usmcaQualified: false,
    asOfDate: '2027-02-09',
    droneTier: 'annex_iii'
  });
  assert.equal(after.breakdown.drone.applies, true);
  assert.ok(Math.abs(after.breakdown.drone.rate - 0.25) < 0.0001);
});

test('drone tariff — EU carve-out: total (incl. Column 1) capped at 15%', () => {
  // EU: MFN 0.017 → drone add = 0.15 - 0.017 = 0.133 (combined 15% total)
  const res = T.effectiveRate('european-union', 'drones', {
    asOfDate: '2026-09-10'
  });
  assert.ok(res);
  assert.equal(res.breakdown.drone.applies, true);
  assert.equal(res.breakdown.drone.carve_out, 'combined_15');
  assert.ok(Math.abs(res.breakdown.drone.rate - (0.15 - 0.017)) < 0.0001,
    `EU drone add should be ${0.15 - 0.017}, got ${res.breakdown.drone.rate}`);
  assert.ok(Math.abs(res.rate - 0.15) < 0.0001,
    `EU total should be capped at 0.15, got ${res.rate}`);
});

test('drone tariff — UK carve-out: total (incl. Column 1) capped at 10%', () => {
  const res = T.effectiveRate('united-kingdom', 'drones', {
    asOfDate: '2026-09-10'
  });
  assert.ok(res);
  assert.equal(res.breakdown.drone.applies, true);
  assert.equal(res.breakdown.drone.carve_out, 'uk_10');
  assert.ok(Math.abs(res.breakdown.drone.rate - (0.10 - 0.016)) < 0.0001,
    `UK drone add should be ${0.10 - 0.016}, got ${res.breakdown.drone.rate}`);
  assert.ok(Math.abs(res.rate - 0.10) < 0.0001,
    `UK total should be capped at 0.10, got ${res.rate}`);
});

test('drone tariff — non-carve-out country (Vietnam): full 100% Annex I', () => {
  const res = T.effectiveRate('vietnam', 'drones', {
    asOfDate: '2026-09-10'
  });
  assert.ok(res);
  assert.equal(res.breakdown.drone.applies, true);
  assert.equal(res.breakdown.drone.carve_out, null);
  assert.ok(Math.abs(res.breakdown.drone.rate - 1.00) < 0.0001,
    `Vietnam should pay full 100%, got ${res.breakdown.drone.rate}`);
});

test('drone tariff — USMCA Canada/Mexico do NOT get a carve-out (full rate applies)', () => {
  const ca = T.effectiveRate('canada', 'drones', { usmcaQualified: true, asOfDate: '2026-09-10' });
  assert.ok(ca);
  assert.equal(ca.breakdown.drone.applies, true);
  assert.equal(ca.breakdown.drone.carve_out, null);
  assert.ok(Math.abs(ca.breakdown.drone.rate - 1.00) < 0.0001,
    'Canada should pay full 100% (no allied carve-out)');
});

// --- Sept 3, 2026 effective-date preset: attribute truth table (t_a836cab0) ---
// Rule spec (drone-tariff-calculator-rule-spec.md, t_1151b7ec): the drone
// tier is DERIVED from thermal-imaging + weight attributes, with a Blue UAS
// deferral window and date-aware not-subject treatment.

test('drone tariff — acceptance T1: China origin + thermal imaging after Sept 3 2026 = 100%', () => {
  const res = T.effectiveRate('china', 'drones', {
    usmcaQualified: false,
    asOfDate: '2026-09-03',
    droneThermal: true,
    droneHeavy: true
  });
  assert.ok(res.breakdown.drone);
  assert.equal(res.breakdown.drone.notSubject, false);
  assert.equal(res.breakdown.drone.deferred, false);
  assert.equal(res.breakdown.drone.thermal, true);
  assert.equal(res.breakdown.drone.tier, 'annex_i');
  assert.ok(Math.abs(res.breakdown.drone.rate - 1.00) < 0.0001,
    `drone Section 232 rate should be 1.00 (100%), got ${res.breakdown.drone.rate}`);
});

test('drone tariff — thermal imaging at ANY weight = 100% (annex_i)', () => {
  const light = T.effectiveRate('china', 'drones', { asOfDate: '2026-09-10', droneThermal: true, droneHeavy: false });
  assert.equal(light.breakdown.drone.tier, 'annex_i');
  assert.ok(Math.abs(light.breakdown.drone.rate - 1.00) < 0.0001);
  const heavy = T.effectiveRate('china', 'drones', { asOfDate: '2026-09-10', droneThermal: true, droneHeavy: true });
  assert.equal(heavy.breakdown.drone.tier, 'annex_i');
  assert.ok(Math.abs(heavy.breakdown.drone.rate - 1.00) < 0.0001);
});

test('drone tariff — non-thermal over 25 kg (~55 lb) = 100%', () => {
  const res = T.effectiveRate('china', 'drones', { asOfDate: '2026-09-10', droneThermal: false, droneHeavy: true });
  assert.equal(res.breakdown.drone.tier, 'annex_i');
  assert.ok(Math.abs(res.breakdown.drone.rate - 1.00) < 0.0001);
});

test('drone tariff — acceptance T2: China + non-thermal + <=55 lb = 25%', () => {
  const res = T.effectiveRate('china', 'drones', {
    usmcaQualified: false,
    asOfDate: '2026-09-03',
    droneThermal: false,
    droneHeavy: false
  });
  assert.equal(res.breakdown.drone.tier, 'annex_ii');
  assert.ok(Math.abs(res.breakdown.drone.rate - 0.25) < 0.0001,
    `drone Section 232 rate should be 0.25 (25%), got ${res.breakdown.drone.rate}`);
});

test('drone tariff — acceptance T3: entry before Sept 3 2026 = not subject (D0)', () => {
  const res = T.effectiveRate('china', 'drones', {
    usmcaQualified: false,
    asOfDate: '2026-08-15',
    droneThermal: true,
    droneHeavy: true
  });
  assert.equal(res.breakdown.drone.notSubject, true);
  assert.equal(res.breakdown.drone.applies, false);
  assert.equal(res.breakdown.drone.rate, 0);
  // Only the base (MFN) estimate applies — no Section 232 drone duty
  assert.ok(Math.abs(res.rate - 0.195) < 0.0001, `expected 0.195, got ${res.rate}`);
});

test('drone tariff — acceptance T4: Blue UAS-listed = deferred 0% until Feb 9 2027', () => {
  const res = T.effectiveRate('china', 'drones', {
    usmcaQualified: false,
    asOfDate: '2026-09-03',
    droneThermal: true,
    droneHeavy: true,
    blueUas: true
  });
  assert.ok(res.breakdown.drone);
  assert.equal(res.breakdown.drone.blueUas, true);
  assert.equal(res.breakdown.drone.deferred, true, 'Blue UAS-listed supplier should be deferred');
  assert.equal(res.breakdown.drone.rate, 0, 'deferred = 0% Section 232 duty');
  assert.equal(res.breakdown.drone.deferralEnds, '2027-02-09');
  // Still in-force, so a later-entry full-rate path exists — check D2 boundary below
});

test('drone tariff — Blue UAS deferral is date-windowed (ends Feb 9 2027, D2)', () => {
  // Last deferred day: Feb 8, 2027
  const d1 = T.effectiveRate('china', 'drones', { asOfDate: '2027-02-08', droneThermal: true, blueUas: true });
  assert.equal(d1.breakdown.drone.deferred, true);
  assert.equal(d1.breakdown.drone.rate, 0);
  // Feb 9, 2027: deferral ended -> full rate (acceptance: exemption no longer applies)
  const d2Thermal = T.effectiveRate('china', 'drones', { asOfDate: '2027-02-09', droneThermal: true, blueUas: true });
  assert.equal(d2Thermal.breakdown.drone.deferred, false);
  assert.ok(Math.abs(d2Thermal.breakdown.drone.rate - 1.00) < 0.0001,
    `after Feb 9 2027 thermal drone should pay 100%, got ${d2Thermal.breakdown.drone.rate}`);
  const d2Light = T.effectiveRate('china', 'drones', { asOfDate: '2027-02-09', droneThermal: false, droneHeavy: false, blueUas: true });
  assert.equal(d2Light.breakdown.drone.deferred, false);
  assert.ok(Math.abs(d2Light.breakdown.drone.rate - 0.25) < 0.0001,
    `after Feb 9 2027 light non-thermal drone should pay 25%, got ${d2Light.breakdown.drone.rate}`);
});

test('drone tariff — acceptance T8: China light non-thermal unchanged after Feb 9 2027 (25%)', () => {
  const res = T.effectiveRate('china', 'drones', { asOfDate: '2027-02-09', droneThermal: false, droneHeavy: false });
  assert.equal(res.breakdown.drone.tier, 'annex_ii');
  assert.ok(Math.abs(res.breakdown.drone.rate - 0.25) < 0.0001);
});

test('drone tariff — allied caps are NOT an exemption and persist past Feb 9 2027', () => {
  const eu = T.effectiveRate('european-union', 'drones', { asOfDate: '2027-03-01', droneThermal: true });
  assert.equal(eu.breakdown.drone.carve_out, 'combined_15');
  assert.ok(Math.abs(eu.rate - 0.15) < 0.0001, `EU total should cap at 0.15, got ${eu.rate}`);
  const uk = T.effectiveRate('united-kingdom', 'drones', { asOfDate: '2027-03-01', droneThermal: true });
  assert.equal(uk.breakdown.drone.carve_out, 'uk_10');
  assert.ok(Math.abs(uk.rate - 0.10) < 0.0001, `UK total should cap at 0.10, got ${uk.rate}`);
});

test('drone tariff — Blue UAS supplier data exported with the Sept 2 2026 list date', () => {
  const u = T.SECTION_232_UAS;
  assert.ok(u.blue_uas_deferral, 'blue_uas_deferral should be present');
  assert.equal(u.blue_uas_deferral.list_reference_date, '2026-09-02');
  assert.equal(u.blue_uas_deferral.deferral_ends, '2027-02-09');
  assert.ok(u.attr_model, 'attr_model should be present');
  assert.equal(u.attr_model.thermal_flag_rate_tier, 'annex_i');
  assert.equal(u.attr_model.heavy_flag_rate_tier, 'annex_i');
  assert.equal(u.attr_model.standard_flag_rate_tier, 'annex_ii');
});

test('drone tariff — index.html renders the category, preset questions, effective date, and source links', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  // Searchable category language
  assert.ok(/Drones \/ UAS \(Unmanned Aircraft\)/.test(html), 'index.html should mention the Drones / UAS category');
  assert.ok(/Section 232: Drones \/ UAS Tariff/.test(html), 'index.html should have a drone tariff section');
  assert.ok(/September 3, 2026/.test(html), 'index.html should show the Sept 3 2026 effective date');
  assert.ok(/100%/.test(html), 'index.html should show the 100% rate');
  assert.ok(/25%/.test(html), 'index.html should show the 25% rate');
  // Drone preset inputs (thermal / weight / supplier-status), NOT the old manual Annex tier select
  assert.ok(html.includes('droneThermal'), 'index.html should have the thermal-imaging question');
  assert.ok(html.includes('droneWeight'), 'index.html should have the weight question');
  assert.ok(html.includes('droneSupplier'), 'index.html should have the supplier-status question');
  assert.ok(html.includes('blue-uas'), 'index.html should offer the Blue UAS-listed supplier option');
  assert.ok(!html.includes('id="droneTier"'), 'manual Annex tier selector should be replaced by the attribute questions');
  // Deferral + framing copy (rule spec s8)
  assert.ok(/deferred until Feb 9, 2027/i.test(html), 'index.html should carry the Blue UAS deferral framing');
  assert.ok(/Blue UAS/i.test(html), 'index.html should mention Blue UAS');
  assert.ok(/Feb 9, 2027/.test(html), 'index.html should show the Feb 9, 2027 deferral end');
  // Corrected example copy — allied capped, NOT "allied exempt" (fact sheet G1)
  assert.ok(/allied-origin drones are capped at 10[-–]15%/.test(html) || /capped at 10[-–]15%/.test(html),
    'index.html should show the corrected allied-capped example copy');
  assert.ok(!/allied.*supplier.*exempt until Feb 9, 2027/i.test(html),
    'index.html must NOT claim allied suppliers are exempt until Feb 9 2027 (G1)');
  // Source link visible
  assert.ok(html.includes('whitehouse.gov/presidential-actions/2026/08/adjusting-imports-of-unmanned-aircraft-systems'),
    'index.html should link to the White House proclamation');
  assert.ok(html.includes('whitehouse.gov/fact-sheets/2026/08/fact-sheet-president-donald-j-trump'),
    'index.html should link to the White House fact sheet');
  // Transshipment caveat — must NOT conflate the 40+ countries claim with the drone proclamation
  assert.ok(/Transshipment note/.test(html), 'index.html should carry the transshipment caveat');
  assert.ok(/The Great Transshipment Scam/.test(html), 'index.html should attribute the 40+ countries claim to the separate report');
});

// --- Ground beef 90-day out-of-quota tariff waiver tests (announced Aug 21, 2026) ---

test('GROUND_BEEF_WAIVER is exported with correct waiver mechanics', () => {
  const gw = T.GROUND_BEEF_WAIVER;
  assert.ok(gw, 'GROUND_BEEF_WAIVER should be present');
  assert.equal(gw.category, 'ground-beef');
  assert.equal(gw.volume_mt, 300000, 'cap should be 300,000 metric tons');
  assert.equal(gw.duration_days, 90, 'waiver should last 90 days');
  assert.equal(gw.announced, '2026-08-21');
  assert.equal(gw.window_start, '2026-08-21');
  assert.equal(gw.window_end, '2026-11-19', '90-day window from announcement');
  assert.ok(Math.abs(gw.out_quota_rate - 0.264) < 0.0001, 'out-of-quota rate should be 26.4%');
  assert.ok(Math.abs(gw.in_quota_rate - 0.044) < 0.0001, 'in-quota rate should be 4.4 cents/kg');
  assert.ok(Math.abs(gw.target_discount - 0.25) < 0.0001, 'exporter commitment should be 25% below market');
  // Price context: $5.55 Jan 2025 → $6.89 July 2026
  assert.equal(gw.retail_price.jan_2025, 5.55);
  assert.equal(gw.retail_price.jul_2026, 6.89);
  // HTS precedent from Proclamation 11010
  assert.deepEqual(gw.hts_precedent, ['0201.30.5091', '0201.30.5097', '0202.30.5091', '0202.30.5097']);
  assert.equal(gw.baseline_duty_unanswered, true, 'baseline 4.4c/kg status should be flagged unanswered');
  assert.ok(gw.eo_status.includes('within two weeks'), 'EO status should note the pending two-week signature');
  assert.ok(Array.isArray(gw.source_citations) && gw.source_citations.length >= 5, 'waiver should carry source citations');
});

test('ground-beef category available in CATEGORY_MODIFIERS', () => {
  const cat = T.CATEGORY_MODIFIERS['ground-beef'];
  assert.ok(cat, 'ground-beef category should exist');
  assert.equal(cat.add, 0, 'ground-beef base add is 0 — rate comes from the waiver/out-of-quota logic');
  assert.ok(cat.name.includes('Ground Beef'), 'category name should mention Ground Beef');
  assert.ok(cat.name.includes('90-Day'), 'category name should mention the 90-day window');
});

test('SMOKE TEST: calculator returns the duty-free result (0%) for ground beef under the waiver cap', () => {
  // Inside the 90-day window (announced Aug 21, 2026) → out-of-quota duty waived → 0%
  const res = T.effectiveRate('australia', 'ground-beef', { asOfDate: '2026-08-21' });
  assert.ok(res, 'ground-beef should compute');
  assert.equal(res.breakdown.beef.applies, true, 'waiver should apply on announcement date');
  assert.equal(res.breakdown.beef.waived, true, 'out-of-quota duty should be waived');
  assert.equal(res.rate, 0, `expected duty-free rate 0, got ${res.rate}`);
  // Mid-window date also duty-free
  const mid = T.effectiveRate('brazil', 'ground-beef', { asOfDate: '2026-10-01' });
  assert.equal(mid.rate, 0, `expected duty-free mid-window, got ${mid.rate}`);
  // Last day of window inclusive
  const last = T.effectiveRate('argentina', 'ground-beef', { asOfDate: '2026-11-19' });
  assert.equal(last.breakdown.beef.applies, true);
  assert.equal(last.rate, 0);
  // Default (today, Aug 21 2026) is inside the window → duty-free
  const def = T.effectiveRate('australia', 'ground-beef');
  assert.equal(def.breakdown.beef.applies, true, 'default date should be inside the window');
  assert.equal(def.rate, 0, 'default date should be duty-free');
});

test('ground beef waiver does NOT apply before announcement or after 90 days (26.4% out-of-quota rate)', () => {
  // Before announcement: Aug 20 → not waived
  const before = T.effectiveRate('australia', 'ground-beef', { asOfDate: '2026-08-20' });
  assert.ok(before);
  assert.equal(before.breakdown.beef.applies, false, 'waiver should not apply before announcement');
  assert.ok(Math.abs(before.rate - 0.264) < 0.0001, `expected 26.4% before waiver, got ${before.rate}`);
  // After window: Nov 20 → not waived
  const after = T.effectiveRate('australia', 'ground-beef', { asOfDate: '2026-11-20' });
  assert.equal(after.breakdown.beef.applies, false, 'waiver should not apply after the 90-day window');
  assert.ok(Math.abs(after.rate - 0.264) < 0.0001, `expected 26.4% after window, got ${after.rate}`);
});

test('ground beef waiver details are exposed in the breakdown (cap, duration, HTS, prices)', () => {
  const res = T.effectiveRate('australia', 'ground-beef', { asOfDate: '2026-09-01' });
  const bw = res.breakdown.beef;
  assert.ok(bw, 'breakdown.beef should be present');
  assert.equal(bw.volumeMt, 300000);
  assert.equal(bw.durationDays, 90);
  assert.equal(bw.windowStart, '2026-08-21');
  assert.equal(bw.windowEnd, '2026-11-19');
  assert.equal(bw.outQuotaRate, 0.264);
  assert.equal(bw.inQuotaRate, 0.044);
  assert.equal(bw.targetDiscount, 0.25);
  assert.equal(bw.retailPrice.jan_2025, 5.55);
  assert.equal(bw.retailPrice.jul_2026, 6.89);
  assert.deepEqual(bw.htsPrecedent, ['0201.30.5091', '0201.30.5097', '0202.30.5091', '0202.30.5097']);
  assert.ok(bw.status.length > 50, 'status text should be substantive');
});

test('ground beef waiver does not disturb other categories or the 60-economy loop', () => {
  // The exhaustive loop test above covers all categories incl. ground-beef;
  // verify a couple of non-beef categories are unaffected.
  const china = T.effectiveRate('china', 'electronics', { usmcaQualified: false });
  assert.ok(Math.abs(china.rate - 0.403) < 0.0001, 'china/electronics should be unchanged');
  const ca = T.effectiveRate('canada', 'auto');
  assert.equal(ca.breakdown.section301, 0, 'Canada USMCA exemption should be unchanged');
  assert.equal(T.GROUND_BEEF_WAIVER.category, 'ground-beef');
  assert.ok(Object.keys(T.CATEGORY_MODIFIERS).includes('ground-beef'));
});

test('ground beef waiver — index.html explains the 90-day limitation and links to sources', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  // Category present in the JS-driven dropdown data
  assert.ok(/Ground Beef/.test(html), 'index.html should mention Ground Beef');
  assert.ok(/90-Day Out-of-Quota Waiver/.test(html), 'index.html should name the 90-day out-of-quota waiver');
  assert.ok(/300,000 metric tons/.test(html), 'index.html should state the 300,000 MT cap');
  // 90-day limitation clearly explained
  assert.ok(/90 days/.test(html), 'index.html should explain the 90-day duration');
  assert.ok(/Nov 19, 2026/.test(html), 'index.html should show the modeled window end');
  assert.ok(/26.4%/.test(html), 'index.html should show the normal out-of-quota rate');
  // Price context
  assert.ok(/\$6\.89\/lb/.test(html), 'index.html should show the July 2026 price benchmark');
  assert.ok(/\$5\.55\/lb/.test(html), 'index.html should show the Jan 2025 price benchmark');
  // 25% below market commitment
  assert.ok(/25% below current market prices/.test(html), 'index.html should state the 25% commitment');
  // Sources link
  assert.ok(html.includes('politico.com/news/2026/08/21/trump-ground-beef-import-tariffs'), 'index.html should link Politico');
  assert.ok(html.includes('cnbc.com/2026/08/21/trump-ground-beef-import-tariff'), 'index.html should link CNBC');
  // Explainer page linked
  assert.ok(html.includes('ground-beef-tariff-waiver-2026.html'), 'index.html should link the explainer page');
});

test('ground beef waiver — explainer page exists, mentions the waiver, links sources, and is in the sitemap', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const page = fs.readFileSync(path.join(__dirname, '..', 'ground-beef-tariff-waiver-2026.html'), 'utf8');
  assert.ok(page.length > 5000, 'explainer should be substantive');
  assert.ok(/Ground Beef Tariff Waiver 2026|Beef Tariff Rates 2026: The Ground Beef Tariff Waiver/.test(page), 'explainer should carry the title');
  assert.ok(/90 days/.test(page), 'explainer should explain the 90-day limitation');
  assert.ok(/300,000 metric tons/.test(page), 'explainer should state the cap');
  assert.ok(/26.4%/.test(page), 'explainer should state the normal out-of-quota rate');
  assert.ok(/\$6\.89/.test(page), 'explainer should show the July 2026 price');
  assert.ok(/\$5\.55/.test(page), 'explainer should show the Jan 2025 price');
  assert.ok(/25% below current market prices/.test(page), 'explainer should state the exporter commitment');
  assert.ok(htmlLinksSources(page), 'explainer should link to source outlets');
  assert.ok(page.includes('https://www.politico.com/news/2026/08/21/trump-ground-beef-import-tariffs-01045353'), 'explainer should cite Politico URL');
  assert.ok(page.includes('https://www.cnbc.com/2026/08/21/trump-ground-beef-import-tariff.html'), 'explainer should cite CNBC URL');
  assert.ok(page.includes('https://www.aljazeera.com/news/2026/8/21/trump-waives-out-of-quota-beef-tariffs-for-90-days-to-lower-prices'), 'explainer should cite Al Jazeera URL');
  // Sitemap includes the new page
  const sitemap = fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8');
  assert.ok(sitemap.includes('ground-beef-tariff-waiver-2026'), 'sitemap should include the explainer page');
});

function htmlLinksSources(html) {
  return /href="https:\/\/www\.(politico|cnbc|aljazeera|nypost|axios|agri-pulse)\.com/.test(html);
}

// --- Canada Section 338 — UI display tests (effective date + sources) ---

test('S338 UI: index.html banner says IN EFFECT with Aug 22 date + source links', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  // Banner must no longer claim SUSPENDED as current status
  assert.ok(!/SUSPENDED until Aug 22, 2026/.test(html), 'index.html must not claim the tariff is still suspended');
  assert.ok(!/SUSPENDED until Aug 22/.test(html), 'index.html must not claim the tariff is still suspended');
  // Must state IN EFFECT + effective date + time
  assert.ok(/IN EFFECT/.test(html), 'index.html banner should state IN EFFECT');
  assert.ok(/12:01 a\.m\. EDT/.test(html), 'index.html should show the 12:01 a.m. EDT effective time');
  assert.ok(/Aug 22, 2026/.test(html), 'index.html should show the Aug 22, 2026 effective date');
  // ~$20B and ~5% approximations
  assert.ok(/\$20 billion/.test(html), 'index.html should show the ~$20B scope');
  assert.ok(/hockey sticks to tongue depressors/.test(html), 'index.html should use the hockey sticks → tongue depressors framing');
  // Source citations for the in-effect event (parent datapack t_89767bbd — official instruments + press)
  assert.ok(html.includes('ustr.gov/about/policy-offices/press-office/press-releases/2026/july'), 'index.html should link the official USTR statement');
  assert.ok(html.includes('whitehouse.gov/fact-sheets/2026/07/fact-sheet-president-donald-j-trump-imposes-additional-tariffs-on-canada'), 'index.html should link the WH Fact Sheet');
  assert.ok(html.includes('Proclamations 11046/47/48'), 'index.html should cite Proclamations 11046/47/48');
  assert.ok(html.includes('aljazeera.com/news/2026/8/22/us-imposes-50-tariffs-on-20bn-worth-of-canadian-goods'), 'index.html should link Al Jazeera');
  assert.ok(html.includes('jpost.com/international/article-906250'), 'index.html should link Reuters/JPost');
  assert.ok(html.includes('npr.org/2026/08/22/nx-s1-5941584'), 'index.html should link NPR');
  assert.ok(html.includes('cbc.ca/news/canada/canada-us-tariffs'), 'index.html should link CBC');
  assert.ok(html.includes('theguardian.com/world/2026/aug/22/canada-tariffs-trump-trade-deal-talks-fail'), 'index.html should link The Guardian');
  // Calculator category present
  assert.ok(/Canada Section 338 Covered Goods/.test(html), 'index.html should offer the Canada Section 338 Covered Goods category');
});

test('S338 UI: index.html calculator footnote says the 50% is included for covered categories', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(!/not included in the default rate/.test(html), 'footnote must not claim S338 is excluded from the default rate');
  assert.ok(/IS included in the default rate/.test(html), 'footnote should say S338 IS included for covered categories');
});

test('S338 UI: news advisory page reflects in-effect status with sources', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const news = fs.readFileSync(path.join(__dirname, '..', 'news', 'index.html'), 'utf8');
  assert.ok(/IN EFFECT/.test(news), 'news page should state IN EFFECT');
  assert.ok(!/STATUS: SUSPENDED/.test(news), 'news page must not show SUSPENDED status');
  assert.ok(/hockey sticks to tongue depressors/.test(news), 'news page should use the AP framing');
  assert.ok(news.includes('ustr.gov/about/policy-offices/press-office/press-releases/2026/july'), 'news page should link the official USTR statement');
  assert.ok(news.includes('aljazeera.com/news/2026/8/22/us-imposes-50-tariffs-on-20bn-worth-of-canadian-goods'), 'news page should link Al Jazeera');
  assert.ok(news.includes('jpost.com/international/article-906250'), 'news page should link JPost/Reuters');
  assert.ok(news.includes('zerohedge.com/political/canada-us-trade-war-erupts'), 'news page should link ZeroHedge');
  assert.ok(news.includes('npr.org/2026/08/22/nx-s1-5941584'), 'news page should link NPR');
  assert.ok(news.includes('cbc.ca/news/canada/canada-us-tariffs'), 'news page should link CBC');
  assert.ok(news.includes('theguardian.com/world/2026/aug/22/canada-tariffs-trump-trade-deal-talks-fail'), 'news page should link The Guardian');
  assert.ok(news.includes('Proclamations 11046'), 'news page should cite Proclamations 11046/47/48');
});

// --- Canada Section 338 — parent-datapack re-verification (t_89767bbd) ---

test('S338 citations include official instruments from parent datapack (Proclamations 11046/47/48 + suspension)', () => {
  const cites = T.SECTION_338_CANADA.source_citations.join(' ');
  assert.ok(cites.includes('11046'), 'should cite Proclamation 11046 (alcohol)');
  assert.ok(cites.includes('11047'), 'should cite Proclamation 11047 (dairy)');
  assert.ok(cites.includes('11048'), 'should cite Proclamation 11048 (motor vehicles)');
  assert.ok(cites.includes('Temporary Suspension'), 'should cite the Aug 18 suspension proclamation');
  assert.ok(cites.includes('ustr.gov'), 'should cite the official USTR statement');
  assert.ok(cites.includes('whitehouse.gov'), 'should cite the WH Fact Sheet');
  assert.ok(cites.length >= 10, `expected >= 10 citations (12-source datapack), got ${cites.length}`);
});

test('REJECTED_DEAL_PRESET exists with the verified offer rates, flagged NOT enacted', () => {
  const p = T.REJECTED_DEAL_PRESET;
  assert.ok(p, 'REJECTED_DEAL_PRESET should be present');
  assert.equal(p.not_enacted, true, 'preset must be flagged NOT enacted');
  assert.equal(p.rejected_date, '2026-08-21');
  assert.ok(p.label.includes('NOT enacted'), 'label should say NOT enacted');
  const byMeasure = Object.fromEntries(p.changes.map(c => [c.measure, c]));
  assert.equal(byMeasure['Steel & aluminum'].proposed_rate, 0.25, 'steel/aluminum offer = 25%');
  assert.equal(byMeasure['Automotive duties'].proposed_rate, 0.15, 'autos offer = 15%');
  assert.equal(byMeasure['Lumber levy'].proposed_rate, 0.00, 'lumber 10% levy would have been eliminated');
  assert.ok(p.source_citations.length >= 3, 'should cite ZeroHedge + Guardian + USTR');
});

test('REJECTED_DEAL_PRESET is an alternate preset only — live calculator must NOT apply 25/15/10', () => {
  // Steel: live rate stays at pre-existing (0.005 MFN + 0.014 cat = 0.019), NOT 25%
  const st = T.effectiveRate('canada', 'steel', { asOfDate: '2026-08-22' });
  assert.ok(Math.abs(st.rate - 0.019) < 0.0001, `steel live rate must NOT be 25%, got ${st.rate}`);
  // Auto: live rate is 0.005 + 0.027 + 0.50 S338 = 0.532, NOT 15%
  const au = T.effectiveRate('canada', 'auto', { asOfDate: '2026-08-22' });
  assert.ok(Math.abs(au.rate - 0.532) < 0.0001, `auto live rate must be 0.532 (incl. S338), got ${au.rate}`);
  assert.ok(Math.abs(au.breakdown.s338.rate - 0.50) < 0.0001, 'S338 50% stacks on autos — the enacted outcome');
});

test('REJECTED_DEAL_PRESET what-if helper models the offer without touching live rates', () => {
  const p = T.REJECTED_DEAL_PRESET;
  const steel = p.effectiveRateIfEnacted('canada', 'steel', { asOfDate: '2026-08-22' });
  assert.equal(steel.preset, 0.25, 'what-if steel = 25%');
  assert.equal(steel.not_enacted, true);
  assert.ok(Math.abs(steel.liveRate - 0.019) < 0.0001, 'liveRate still the real pre-existing rate');
  const auto = p.effectiveRateIfEnacted('canada', 'auto', { asOfDate: '2026-08-22' });
  assert.equal(auto.preset, 0.15, 'what-if auto = 15%');
  const lumber = p.effectiveRateIfEnacted('canada', 'paper', { asOfDate: '2026-08-22' });
  assert.equal(lumber.preset, 0.00, 'what-if lumber = eliminated (0%)');
  assert.equal(p.effectiveRateIfEnacted('china', 'steel', { asOfDate: '2026-08-22' }), null, 'what-if only applies to Canada');
});

// --- Example products across affected categories: duty totals ---

const DUTY_TOTAL_CASES = [
  // product, category, country, value, expected duty, expected rate (0.005 MFN + stack)
  { product: 'bottle of wine',      category: 'food',         country: 'canada', value: 10000, duty: 5510, rate: 0.551 }, // 0.005 + 0.046 + 0.50
  { product: 'cheddar cheese',      category: 'food',         country: 'canada', value: 25000, duty: 13775, rate: 0.551 },
  { product: 'wooden hockey stick', category: 'canada-s338',  country: 'canada', value: 5000,  duty: 2525, rate: 0.505 },  // 0.005 + 0 + 0.50
  { product: 'auto parts',          category: 'auto',         country: 'canada', value: 100000, duty: 53200, rate: 0.532 }, // 0.005 + 0.027 + 0.50
  { product: 'tongue depressors',   category: 'canada-s338',  country: 'canada', value: 2000,  duty: 1010, rate: 0.505 },
];

test('S338 example products (5) return correct duty totals across affected categories', () => {
  DUTY_TOTAL_CASES.forEach(c => {
    const res = T.effectiveRate(c.country, c.category, { asOfDate: '2026-08-22' });
    assert.ok(res, `${c.product}: effectiveRate failed`);
    assert.ok(Math.abs(res.rate - c.rate) < 0.0001, `${c.product}: expected rate ${c.rate}, got ${res.rate}`);
    const duty = Math.round(c.value * res.rate * 100) / 100;
    assert.ok(Math.abs(duty - c.duty) < 0.01, `${c.product}: expected duty $${c.duty}, got $${duty}`);
    const total = c.value + duty;
    assert.ok(total > c.value, `${c.product}: landed cost must exceed value`);
  });
});

test('S338 example products: duty totals BEFORE Aug 22 exclude the 50% (date gating)', () => {
  const pre = T.effectiveRate('canada', 'food', { asOfDate: '2026-08-21' });
  // 0.005 + 0.046 = 0.051 — no S338
  assert.ok(Math.abs(pre.rate - 0.051) < 0.0001, `expected 0.051 before Aug 22, got ${pre.rate}`);
  assert.equal(pre.breakdown.s338.applies, false);
});

test('S338 example products: excluded goods (steel, energy, potash) do NOT stack the 50%', () => {
  // Section 232 goods (steel) are exempt from S338
  const steel = T.effectiveRate('canada', 'steel', { asOfDate: '2026-08-22' });
  assert.equal(steel.breakdown.s338, null, 'steel is Section 232 — exempt from S338');
  // 'chemicals' is not in the covered set for Canada — no S338
  const chem = T.effectiveRate('canada', 'chemicals', { asOfDate: '2026-08-22' });
  assert.equal(chem.breakdown.s338, null);
});

test('REJECTED_DEAL_PRESET surfaced in index.html as NOT-enacted alternate preset (no outdated rate live)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  // The deal offer must be labeled NOT enacted / rejected wherever it appears.
  assert.ok(/rejected US–Canada deal/i.test(html), 'index.html should carry the rejected-deal callout heading');
  assert.ok(/NOT enacted/.test(html), 'index.html should label the deal offer as not enacted');
  // The callout must show the three offer rates framed as the rejected deal.
  const calloutStart = html.indexOf('rejected US–Canada deal');
  assert.ok(calloutStart > -1, 'rejected-deal callout should exist');
  const callout = html.slice(calloutStart, calloutStart + 3000);
  assert.ok(/<strong>25%<\/strong>/.test(callout), 'callout should show steel/aluminum 25% offer');
  assert.ok(/<strong>15%<\/strong>/.test(callout), 'callout should show autos 15% offer');
  assert.ok(/Eliminated/.test(callout), 'callout should show lumber levy eliminated');
  assert.ok(/NOT enacted|rejected|would have/i.test(callout), 'offer rates must be framed as rejected, never as live rates');
  // The IN-EFFECT banner (before the callout) must not present 25/15/10 as current Canada rates.
  const bannerStart = html.indexOf('Canada 50% Section 338 Tariff');
  // Bound the slice at the Canada retaliation banner (which legitimately carries the 15/25/50% tiers)
  const retStart = html.indexOf('Canada Sept 8 Counter-Tariffs');
  const sliceEnd = retStart > bannerStart ? retStart : calloutStart;
  const banner = html.slice(bannerStart, sliceEnd);
  assert.ok(/IN EFFECT/.test(banner), 'banner should state IN EFFECT');
  assert.ok(!/25%|15%|10%/.test(banner.replace(/<[^>]+>/g, ' ')),
    'IN-EFFECT banner must not show the rejected 25/15/10 figures as live rates');
});

// ── Canada retaliation (Sept 8, 2026 dollar-for-dollar) ─────────────

test('CANADA_RETALIATION structure matches verified 629-item dataset (t_d98a84da — revised Aug 26, 2026)', () => {
  const R = T.CANADA_RETALIATION;
  assert.ok(R, 'CANADA_RETALIATION missing from exports');
  assert.equal(R.preset_key, 'canada-sept8-counter-tariffs');
  assert.equal(R.preset_label, 'Canada Sept 8 Counter-Tariffs');
  assert.equal(R.effective, '2026-09-08');
  assert.match(R.effective_label, /September 8, 2026/);
  assert.match(R.effective_label, /12:01 a\.m\. ET/, 'effective_label must carry the 12:01 a.m. ET time');
  assert.equal(R.framework, 'dollar-for-dollar');
  assert.equal(R.announced, '2026-08-25');
  assert.equal(R.rate, 0.50, 'headline rate stays 0.50 (max tier)');
  // Three verified tiers with item counts from the official 629-item list
  // (revised Aug 26: 413 at 50%, 195 at 25%, 21 at 15%)
  assert.equal(R.list_size.total, 629);
  assert.equal(R.list_size.rate_50, 413);
  assert.equal(R.list_size.rate_25, 195);
  assert.equal(R.list_size.rate_15, 21);
  assert.equal(R.tiers['0.50'].item_count, 413);
  assert.equal(R.tiers['0.25'].item_count, 195);
  assert.equal(R.tiers['0.15'].item_count, 21);
  assert.ok(R.tiers['0.15'].release_note.includes('8415'), '15% tier should cite AC/heat-pump headings');
  // Origin + in-transit rules from the Finance Canada backgrounder
  assert.ok(/originating from the US/.test(R.origin_rule), 'origin rule must be US-origin only');
  assert.ok(/in transit/.test(R.in_transit), 'in-transit carve-out must be present');
  // Category -> tier map covers the six focus sectors + expanded 629-item scope.
  // CRITICAL: auto is NOT in the map (autos not on the Sept 8 list).
  assert.equal(R.category_tiers.steel, 0.50);
  assert.equal(R.category_tiers.electronics, 0.25);
  assert.equal(R.category_tiers.dairy, 0.25);
  assert.equal(R.category_tiers['household-appliances'], 0.25);
  assert.equal(R.category_tiers['farming-equipment'], 0.15);
  assert.equal(R.category_tiers['pulp-paper'], 0.50);
  assert.equal(R.category_tiers.auto, undefined, 'auto must NOT be on the Sept 8 list (separate existing 25% order)');
  assert.equal(R.category_tiers.furniture, 0.50);
  assert.equal(R.category_tiers.textiles, 0.50);
  assert.equal(R.category_tiers.food, 0.50, 'food resolves to 50% (bakery/malt + honey; fish/seafood removed Aug 26)');
  assert.equal(R.category_tiers.chemicals, 0.50);
  assert.equal(R.category_tiers.toys, 0.50);
  // Six official focus sectors still listed
  const labels = R.sectors.map(s => s.label);
  ['Steel', 'Electronics', 'Dairy', 'Household Appliances', 'Farming Equipment', 'Pulp & Paper']
    .forEach(l => assert.ok(labels.includes(l), `missing sector label ${l}`));
  // Representative products present for the acceptance set — ALL on the
  // official 629-item list (no fish/seafood, no autos)
  const reps = R.representative_products;
  assert.ok(reps.some(p => /steel coil/i.test(p.product) && p.tier === 0.50), 'steel representative product missing');
  assert.ok(reps.some(p => /aluminum/i.test(p.product) && p.tier === 0.50), 'aluminum representative product missing');
  assert.ok(reps.some(p => p.category === 'dairy' && p.tier === 0.25), 'dairy/cheese representative product missing');
  assert.ok(reps.some(p => p.category === 'dairy' && p.tier === 0.50), 'dairy/milk-powder representative product missing');
  assert.ok(reps.some(p => p.category === 'farming-equipment' && p.tier === 0.15), 'farming-equipment representative product missing');
  assert.ok(reps.some(p => p.category === 'electronics' && p.tier === 0.50), 'electronics/smartphone representative product missing');
  assert.ok(reps.some(p => p.category === 'paper' && p.tier === 0.25), 'paper/toilet-paper representative product missing');
  assert.ok(reps.every(p => !/fish/i.test(p.product) && !/seafood/i.test(p.product)), 'no fish/seafood representative products (removed Aug 26)');
  assert.ok(reps.every(p => p.category !== 'auto'), 'no auto representative products (autos not on Sept 8 list)');
  assert.ok(reps.every(p => /^\d{4}\.\d{2}\.\d{2}$/.test(p.hs)), 'representative products must carry 8-digit HS codes');
  assert.ok(R.source_citations.length >= 8, `expected >= 8 source citations, got ${R.source_citations.length}`);
  assert.ok(R.source_citations.some(c => c.includes('canada.ca')), 'should cite the official Finance Canada release');
  assert.ok(R.source_citations.some(c => c.includes('gowlingwlg.com')), 'should cite Gowling (874→629 revision)');
});

test('Canada retaliation: PENDING before Sept 8 — 0% duty, applies false, for all targeted categories', () => {
  for (const cat of T.CANADA_RETALIATION.sector_categories) {
    const res = T.effectiveRate('us', cat, { direction: 'to-canada', asOfDate: '2026-08-23' });
    assert.ok(res, `to-canada ${cat} should resolve`);
    assert.equal(res.rate, 0, `${cat} before Sept 8 must be 0%`);
    const cr = res.breakdown.canadaRetaliation;
    assert.equal(cr.applies, false, `${cat} should be pending`);
    assert.equal(cr.targeted, true);
    assert.equal(cr.askedDate, '2026-08-23');
    assert.equal(cr.effective, '2026-09-08');
  }
});

test('Canada retaliation: tier rates apply ON Sept 8 and after (verified 15/25/50% tiers)', () => {
  // steel (ch. 72/73/76) -> 50% tier
  const steel = T.effectiveRate('us', 'steel', { direction: 'to-canada', asOfDate: '2026-09-08' });
  assert.equal(steel.rate, 0.50);
  assert.equal(steel.breakdown.canadaRetaliation.applies, true);
  assert.equal(steel.breakdown.canadaRetaliation.tierRate, 0.50);
  assert.equal(steel.breakdown.canadaRetaliation.tierLabel, '50%');
  assert.equal(steel.breakdown.canadaRetaliation.tierItemCount, 413);
  // electronics (ch. 84/85) -> 25% tier
  const el = T.effectiveRate('us', 'electronics', { direction: 'to-canada', asOfDate: '2026-09-09' });
  assert.equal(el.rate, 0.25);
  assert.equal(el.breakdown.canadaRetaliation.tierLabel, '25%');
  // dairy (cheese headline) -> 25% tier
  const dairy = T.effectiveRate('us', 'dairy', { direction: 'to-canada', asOfDate: '2026-09-09' });
  assert.equal(dairy.rate, 0.25);
  // household appliances -> 25% tier
  const app = T.effectiveRate('us', 'household-appliances', { direction: 'to-canada', asOfDate: '2026-09-09' });
  assert.equal(app.rate, 0.25);
  // farming equipment (mowers) -> 15% tier
  const farm = T.effectiveRate('us', 'farming-equipment', { direction: 'to-canada', asOfDate: '2026-09-09' });
  assert.equal(farm.rate, 0.15);
  assert.equal(farm.breakdown.canadaRetaliation.tierLabel, '15%');
  assert.equal(farm.breakdown.canadaRetaliation.tierItemCount, 21);
  // pulp & paper -> 50% tier
  const pulp = T.effectiveRate('us', 'pulp-paper', { direction: 'to-canada', asOfDate: '2026-09-09' });
  assert.equal(pulp.rate, 0.50);
  // expanded 629-item scope: furniture 50%, textiles 50%, food 50%, chemicals 50%, toys 50%
  // CRITICAL: auto is NOT a retaliation sector — 0% and targeted=false
  const auto = T.effectiveRate('us', 'auto', { direction: 'to-canada', asOfDate: '2026-09-09' });
  assert.equal(auto.rate, 0, 'auto must stay 0% (autos not on the Sept 8 list; separate existing 25% order)');
  assert.equal(auto.breakdown.canadaRetaliation.targeted, false);
  assert.equal(T.effectiveRate('us', 'furniture', { direction: 'to-canada', asOfDate: '2026-09-09' }).rate, 0.50);
  assert.equal(T.effectiveRate('us', 'textiles', { direction: 'to-canada', asOfDate: '2026-09-09' }).rate, 0.50);
  assert.equal(T.effectiveRate('us', 'food', { direction: 'to-canada', asOfDate: '2026-09-09' }).rate, 0.50);
  assert.equal(T.effectiveRate('us', 'chemicals', { direction: 'to-canada', asOfDate: '2026-09-09' }).rate, 0.50);
  assert.equal(T.effectiveRate('us', 'toys', { direction: 'to-canada', asOfDate: '2026-09-09' }).rate, 0.50);
});

test('Canada retaliation: representative products return the verified tier rates with effective dates', () => {
  const reps = T.CANADA_RETALIATION.representative_products;
  assert.ok(reps.length >= 10, `expected >= 10 representative products, got ${reps.length}`);
  reps.forEach(p => {
    // Each representative product carries its verified line-level tier and the
    // Sept 8 effective date (the category default may differ for mixed-tier
    // categories — e.g. motorcycle 50% vs auto default 25%).
    assert.equal(p.tier, reps.find(r => r.hs === p.hs).tier);
    assert.ok([0.15, 0.25, 0.50].includes(p.tier), `${p.product} tier must be a verified tier`);
    const res = T.effectiveRate('us', p.category, { direction: 'to-canada', asOfDate: '2026-09-08' });
    const cr = res.breakdown.canadaRetaliation;
    assert.equal(cr.effective, '2026-09-08', `${p.product} must carry the Sept 8 effective date`);
    assert.equal(cr.rate, T.CANADA_RETALIATION.category_tiers[p.category],
      `${p.product} category default should match category_tiers`);
    assert.ok(cr.representativeProducts.some(rp => rp.hs === p.hs && rp.tier === p.tier),
      `${p.hs} should be listed as a representative product for ${p.category} with tier ${p.tier}`);
  });
  // Steel (uniform 50% tier): category default == product tier
  const steel = T.effectiveRate('us', 'steel', { direction: 'to-canada', asOfDate: '2026-09-08' });
  assert.equal(steel.breakdown.canadaRetaliation.rate, 0.50);
  // Before Sept 8 the same products are PENDING (0%)
  const before = T.effectiveRate('us', 'steel', { direction: 'to-canada', asOfDate: '2026-09-07' });
  assert.equal(before.rate, 0);
  assert.equal(before.breakdown.canadaRetaliation.applies, false);
  assert.ok(/PENDING|CONFIRMED|September 8/.test(before.breakdown.canadaRetaliation.status) ||
    before.breakdown.canadaRetaliation.effectiveLabel.includes('September 8'));
});

test('ACCEPTANCE: sample values for at least two categories produce the expected tier percentage (Sept 8 preset)', () => {
  // Steel $10,000 → 50% tier → $5,000 duty
  const steel = T.effectiveRate('us', 'steel', { direction: 'to-canada', asOfDate: '2026-09-08' });
  assert.equal(steel.rate, 0.50, 'steel must resolve to the 50% tier');
  assert.equal(10000 * steel.rate, 5000, 'steel $10,000 must produce $5,000 estimated tariff');
  // Dairy $10,000 → 25% tier → $2,500 duty
  const dairy = T.effectiveRate('us', 'dairy', { direction: 'to-canada', asOfDate: '2026-09-08' });
  assert.equal(dairy.rate, 0.25, 'dairy must resolve to the 25% tier');
  assert.equal(10000 * dairy.rate, 2500, 'dairy $10,000 must produce $2,500 estimated tariff');
  // Farming equipment $10,000 → 15% tier → $1,500 duty
  const farm = T.effectiveRate('us', 'farming-equipment', { direction: 'to-canada', asOfDate: '2026-09-08' });
  assert.equal(farm.rate, 0.15, 'farming-equipment must resolve to the 15% tier');
  assert.equal(10000 * farm.rate, 1500, 'farming-equipment $10,000 must produce $1,500 estimated tariff');
  // Electronics $10,000 → 25% tier → $2,500 duty
  const el = T.effectiveRate('us', 'electronics', { direction: 'to-canada', asOfDate: '2026-09-08' });
  assert.equal(el.rate, 0.25);
  assert.equal(10000 * el.rate, 2500);
});

test('ACCEPTANCE: Sept 8 preset is visible and labeled with effective date in the calculator UI', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  // Visible preset label
  assert.ok(html.includes('Canada Sept 8 Counter-Tariffs'), 'preset label must be visible in the calculator page');
  // Effective-date labels (static banner + JS strings)
  assert.ok(/Effective 12:01 a\.m\. ET, Tuesday, Sept 8, 2026/.test(html) || /Effective September 8, 2026/.test(html),
    'effective-date label must be visible in the static banner');
  assert.ok(html.includes('retPresetLabel'), 'banner JS must render the preset label');
  assert.ok(html.includes('cr2PresetLabel') || html.includes('crPresetLabel'), 'results JS must render the preset label');
  // The data layer carries preset identity + effective date
  const R = T.CANADA_RETALIATION;
  assert.equal(R.preset_label, 'Canada Sept 8 Counter-Tariffs');
  assert.equal(R.effective, '2026-09-08');
  assert.match(R.effective_label, /September 8, 2026/);
  // Breakdown exposes preset identity
  const res = T.effectiveRate('us', 'steel', { direction: 'to-canada', asOfDate: '2026-09-08' });
  assert.equal(res.breakdown.canadaRetaliation.presetLabel, 'Canada Sept 8 Counter-Tariffs');
  assert.equal(res.breakdown.canadaRetaliation.presetKey, 'canada-sept8-counter-tariffs');
});

test('ACCEPTANCE: preset rates/categories are configurable via the data file (t_6d585b6a)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  // The preset lives in its own data file, not hardcoded in tariff-data.js
  const presetFile = path.join(__dirname, '..', 'presets', 'canada-sept8-counter-tariffs.js');
  assert.ok(fs.existsSync(presetFile), 'preset data file must exist');
  const presetSrc = fs.readFileSync(presetFile, 'utf8');
  assert.ok(presetSrc.includes('preset_key: \'canada-sept8-counter-tariffs\''), 'data file must carry the preset key');
  assert.ok(presetSrc.includes('category_tiers:'), 'data file must carry the category→tier map');
  assert.ok(presetSrc.includes('list_size: { total: 629'), 'data file must carry the 629-item list size');
  // index.html loads the data file before tariff-data.js
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const ps = html.indexOf('presets/canada-sept8-counter-tariffs.js');
  const td = html.indexOf('src="tariff-data.js"');
  assert.ok(ps !== -1 && td !== -1 && ps < td, 'preset data file must load before tariff-data.js');
  // tariff-data.js resolves CANADA_RETALIATION from the data file (window/require),
  // so editing the data file changes rates without touching calculator logic.
  const dataSrc = fs.readFileSync(path.join(__dirname, '..', 'tariff-data.js'), 'utf8');
  assert.ok(dataSrc.includes('CANADA_SEPT8_PRESET'), 'tariff-data.js must resolve the external preset');
  assert.ok(dataSrc.includes("require('./presets/canada-sept8-counter-tariffs.js')"), 'tariff-data.js must require the preset data file');
  // Loaded preset deep-equals the data file export (single source of truth)
  const presetExport = require(path.join(__dirname, '..', 'presets', 'canada-sept8-counter-tariffs.js'));
  assert.equal(T.CANADA_RETALIATION.preset_key, presetExport.preset_key);
  assert.equal(T.CANADA_RETALIATION.list_size.total, presetExport.list_size.total);
  assert.deepEqual(T.CANADA_RETALIATION.category_tiers, presetExport.category_tiers);
});

test('ACCEPTANCE: existing calculator presets still pass their previous smoke tests (Aug 22 / canada-50-percent-tariff unchanged)', () => {
  // Section 338 (Aug 22, 2026) preset is byte-for-byte the same measure — still 50%,
  // still covered categories auto/food/dairy/alcohol/canada-s338, still stacks.
  const S = T.SECTION_338_CANADA;
  assert.equal(S.rate, 0.50);
  assert.equal(S.effective, '2026-08-22 12:01 AM ET');
  assert.deepEqual(S.covered_categories, ['auto', 'food', 'dairy', 'alcohol', 'canada-s338']);
  // Canada auto (to-us) still stacks the 50% S338 on/after Aug 22
  const ca = T.effectiveRate('canada', 'auto', { asOfDate: '2026-08-24', usmcaQualified: true });
  assert.ok(Math.abs(ca.rate - 0.532) < 0.0001, `S338 canada auto must stay 0.532, got ${ca.rate}`);
  assert.ok(ca.breakdown.s338.applies);
  // Rejected-deal preset still present and NOT enacted
  assert.ok(T.REJECTED_DEAL_PRESET, 'REJECTED_DEAL_PRESET must still be exported');
  assert.ok(/NOT enacted|not enacted|rejected/i.test(T.REJECTED_DEAL_PRESET.outcome || ''),
    'rejected-deal preset must be marked not enacted');
  // Brazil preset untouched (25% Section 301, July 22, 2026)
  assert.equal(T.BRAZIL_301.rate, 0.25);
  assert.equal(T.BRAZIL_301.effective, '2026-07-22 12:01 AM ET');
});

test('Canada retaliation: non-targeted sectors get 0% even after Sept 8', () => {
  // textiles/toys/food/etc are now targeted (629-item list); these remain outside it.
  // auto is NOT targeted either — autos are not on the Sept 8 list.
  for (const cat of ['footwear', 'pharma', 'polysilicon', 'drones', 'ground-beef', 'canada-s338', 'auto']) {
    const res = T.effectiveRate('us', cat, { direction: 'to-canada', asOfDate: '2026-09-09' });
    assert.ok(res, `to-canada ${cat} should resolve`);
    assert.equal(res.rate, 0, `${cat} is not a retaliation sector and must stay 0%`);
    assert.equal(res.breakdown.canadaRetaliation.targeted, false);
  }
});

test('Canada retaliation: to-canada only valid for US-origin goods (other origins null)', () => {
  assert.equal(T.effectiveRate('china', 'steel', { direction: 'to-canada', asOfDate: '2026-09-09' }), null);
  assert.equal(T.effectiveRate('canada', 'dairy', { direction: 'to-canada', asOfDate: '2026-09-09' }), null);
  // 'us' is not a US-import origin; without the direction flag it stays null
  assert.equal(T.effectiveRate('us', 'steel', { asOfDate: '2026-09-09' }), null);
});

test('REGRESSION: default US-import flows unchanged by retaliation layer', () => {
  // china electronics: mfn 0.195 + cat 0.008 + s301 0.125 + china existing 0.075 = 0.403
  const cn = T.effectiveRate('china', 'electronics', { usmcaQualified: false });
  assert.ok(Math.abs(cn.rate - 0.403) < 0.0001);
  // canada covered goods still stack the 50% Section 338 (Aug 22 onward)
  const ca = T.effectiveRate('canada', 'food', { asOfDate: '2026-08-22' });
  assert.ok(ca.breakdown.s338 && ca.breakdown.s338.applies);
  assert.ok(ca.rate > 0.50);
  // USMCA default for canada still exempts Section 301
  const mx = T.effectiveRate('mexico', 'auto', { asOfDate: '2026-08-22' });
  assert.equal(mx.breakdown.section301, 0);
  // no canadaRetaliation key in the default direction
  assert.equal(cn.breakdown.canadaRetaliation, undefined);
  assert.equal(ca.breakdown.canadaRetaliation, undefined);
});

test('index.html carries the confirmed Sept 8 retaliation preset (tiers, 629 items, C$27.6B, origin + in-transit rules)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(/September 8, 2026/.test(html), 'index.html must name September 8, 2026');
  assert.ok(/12:01 a\.m\. ET/.test(html), 'index.html must show the 12:01 a.m. ET effective time');
  assert.ok(/dollar-for-dollar/.test(html), 'index.html must use dollar-for-dollar framing');
  assert.ok(/id="direction"/.test(html), 'index.html must have the Shipping To direction control');
  assert.ok(/to-canada/.test(html), 'index.html must have the to-canada option');
  assert.ok(/household appliances/.test(html), 'index.html must list household appliances sector');
  assert.ok(/farming equipment|agricultural equipment/.test(html), 'index.html must list farming equipment sector');
  assert.ok(/pulp (&amp;|&) paper|pulp and paper/i.test(html), 'index.html must list pulp/paper sector');
  // The Sept 8 preset label must be visible on the page
  assert.ok(/Canada Sept 8 Counter-Tariffs/.test(html), 'index.html must show the "Canada Sept 8 Counter-Tariffs" preset label');
  // Verified announcement details (dataset t_d98a84da — 629-item list, revised Aug 26)
  assert.ok(/629/.test(html), 'index.html must state the 629-item official list');
  assert.ok(/C\$27\.6 billion/.test(html), 'index.html must state C$27.6 billion coverage');
  assert.ok(/15%|25%|50%/.test(html), 'index.html must show the 15/25/50 tier rates');
  assert.ok(/in transit/.test(html), 'index.html must mention the in-transit carve-out');
  assert.ok(/originating from the US|US-origin/i.test(html), 'index.html must state the US-origin rule');
  assert.ok(/autos are <strong>not<\/strong>|not on the list|NOT on the Sept 8/.test(html), 'index.html must state autos are NOT on the Sept 8 list');
  // The banner should clearly mark the pending status before the effective date
  assert.ok(/PENDING/.test(html), 'index.html must show pending/upcoming status');
  // Representative products table (acceptance set) present
  assert.ok(/Flat-rolled steel coil/.test(html), 'index.html must show the steel representative product');
  assert.ok(/Aluminum/.test(html), 'index.html must show the aluminum representative product');
  assert.ok(/Motorcycle/.test(html), 'index.html must show the motorcycle representative product');
  assert.ok(/Cheese/.test(html), 'index.html must show the dairy/cheese representative product');
  assert.ok(/Mower/.test(html), 'index.html must show the farming representative product');
  // Preset data file loaded before tariff-data.js (configurable rates/categories)
  assert.ok(/presets\/canada-sept8-counter-tariffs\.js/.test(html), 'index.html must load the preset data file');
  const scriptIdx = html.indexOf('presets/canada-sept8-counter-tariffs.js');
  const dataIdx = html.indexOf('src="tariff-data.js"');
  assert.ok(scriptIdx !== -1 && dataIdx !== -1 && scriptIdx < dataIdx, 'preset data file must load BEFORE tariff-data.js');
  // New sector categories exist in data for the calculator dropdown — now sourced
  // from the preset data file (presets/canada-sept8-counter-tariffs.js), which
  // tariff-data.js loads via window/require.
  const fs2 = require('node:fs');
  const presetData = fs2.readFileSync(path.join(__dirname, '..', 'presets', 'canada-sept8-counter-tariffs.js'), 'utf8');
  ['dairy', 'household-appliances', 'farming-equipment', 'pulp-paper', 'furniture', 'textiles'].forEach(k => {
    assert.ok(presetData.includes("'" + k + "'"), `preset data file must define category ${k}`);
  });
  // Preset data file exists and exports the verified 629-item list
  const presetFile = fs2.readFileSync(path.join(__dirname, '..', 'presets', 'canada-sept8-counter-tariffs.js'), 'utf8');
  assert.ok(presetFile.includes('629'), 'preset data file must carry the 629-item total');
  assert.ok(presetFile.includes('Canada Sept 8 Counter-Tariffs'), 'preset data file must carry the preset label');
});

test('US-Canada explainer page is current: Aug 24 announcement, collapsed talks, Sept 8 tiers, 874 items', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const page = fs.readFileSync(path.join(__dirname, '..', 'us-canada-tariffs-2026.html'), 'utf8');
  assert.ok(page.length > 20000, 'explainer should be substantive');
  // Aug 24 announcement (Trump Truth Social: autos/trucks/parts/steel to 50% Jan 1, 2027)
  assert.ok(/August 24, 2026/.test(page), 'explainer must mention the Aug 24 announcement');
  assert.ok(/January 1, 2027/.test(page), 'explainer must keep the Jan 1, 2027 threatened date');
  // Collapsed trade talks context
  assert.ok(/collapsed|collapse/i.test(page), 'explainer must mention the collapsed trade talks');
  // Confirmed Sept 8 retaliation: three tiers, 874 items, C$27.6B, origin + in-transit
  assert.ok(/September 8, 2026/.test(page), 'explainer must name the September 8 effective date');
  assert.ok(/12:01 a\.m\. ET/.test(page), 'explainer must show the 12:01 a.m. ET effective time');
  assert.ok(/874/.test(page), 'explainer must state the 874-item official list');
  assert.ok(/C\$27\.6 billion/.test(page), 'explainer must state C$27.6 billion coverage');
  assert.ok(/15%/.test(page) && /25%/.test(page) && /50%/.test(page), 'explainer must show 15/25/50% tiers');
  assert.ok(/in transit/.test(page), 'explainer must mention the in-transit carve-out');
  assert.ok(/C\$7\.5 billion/.test(page), 'explainer must mention the C$7.5B support package');
  // Representative products from the official list
  assert.ok(/steel coil|Flat-rolled|7208/i.test(page), 'explainer must show steel line examples');
  assert.ok(/7606|aluminum/i.test(page), 'explainer must show aluminum line examples');
  assert.ok(/8415|air condition/i.test(page), 'explainer must show the 15% tier examples (AC units)');
  assert.ok(/8433|mower/i.test(page), 'explainer must show farming/mower examples');
  assert.ok(/6109|t-shirt/i.test(page), 'explainer must show apparel examples');
  // Sources: official Finance Canada + press verified Aug 25
  assert.ok(page.includes('canada.ca/en/department-finance/news/2026/08'), 'explainer should cite the Finance Canada release');
  assert.ok(page.includes('freightwaves.com') || page.includes('trucknews.com') || page.includes('theguardian.com/world/2026/aug/25'), 'explainer should cite Aug 25 press coverage');
  // dateModified bumped
  assert.ok(/dateModified/.test(page));
});

test('Threatened autos/steel tariff flag: canada_auto_50 present (50%, effective 2027-01-01, NOT in effect)', () => {
  const f = T.PROPOSED_FLAGS.find(x => x.key === 'canada_auto_50');
  assert.ok(f, 'canada_auto_50 flag missing from PROPOSED_FLAGS');
  assert.equal(f.country, 'canada');
  assert.equal(f.rate, 0.50, 'threatened autos/steel rate should be 50%');
  assert.deepEqual(f.categories, ['auto', 'steel'], 'flag should apply to auto and steel categories (Jan 1, 2027: cars, trucks, auto parts AND steel)');
  assert.equal(f.effective, '2027-01-01', 'proposed effective date should be 2027-01-01');
  assert.equal(f.status, 'threatened', 'flag must be marked threatened');
  assert.ok(/NOT in effect/i.test(f.note), 'note must state the rate is not in effect');
  // eu_dst still present (no regression)
  assert.ok(T.PROPOSED_FLAGS.some(x => x.key === 'eu_dst'), 'eu_dst flag should still be present');
});

test('Threatened autos/steel tariff: default canada auto calculation UNCHANGED (proposed NOT added)', () => {
  // Pre-change default: MFN 0.005 + auto modifier 0.027 + S338 0.50 = 0.532 (USMCA-qualified, on/after Aug 22)
  const def = T.effectiveRate('canada', 'auto', { asOfDate: '2026-08-24', usmcaQualified: true });
  assert.ok(Math.abs(def.rate - 0.532) < 0.0001, `default canada auto should stay 0.532, got ${def.rate}`);
  assert.equal(def.breakdown.proposed, 0, 'proposed flag must NOT be added by default');
  // Before the S338 effective date the proposed flag still does not leak in
  const early = T.effectiveRate('canada', 'auto', { asOfDate: '2026-08-21', usmcaQualified: true });
  assert.ok(Math.abs(early.rate - 0.032) < 0.0001, `pre-S338 canada auto should stay 0.032, got ${early.rate}`);
  assert.equal(early.breakdown.proposed, 0);
});

test('Threatened autos/steel tariff: includeProposed adds the 50% only for Canada + auto or steel', () => {
  const thr = T.effectiveRate('canada', 'auto', { asOfDate: '2026-08-24', usmcaQualified: true, includeProposed: true });
  assert.equal(thr.breakdown.proposed, 0.50, 'includeProposed should add the 50% threatened rate');
  assert.ok(Math.abs(thr.rate - (0.532 + 0.50)) < 0.0001, `threatened auto scenario rate wrong: ${thr.rate}`);
  // Steel is also covered by the Jan 1, 2027 announcement (cars, trucks, parts AND steel)
  const steel = T.effectiveRate('canada', 'steel', { asOfDate: '2026-08-24', includeProposed: true });
  assert.equal(steel.breakdown.proposed, 0.50, 'includeProposed should add the 50% threatened rate to steel');
  // Steel without includeProposed stays at base (S338 does NOT cover steel — Section 232 exempt)
  const steelBase = T.effectiveRate('canada', 'steel', { asOfDate: '2026-08-24' });
  assert.equal(steelBase.breakdown.proposed, 0, 'steel must NOT get the threatened rate by default');
  assert.ok(Math.abs(steelBase.rate - 0.019) < 0.0001, `base canada steel should stay 0.019, got ${steelBase.rate}`);
  // Not applied to other countries/categories
  const mx = T.effectiveRate('mexico', 'auto', { asOfDate: '2026-08-24', includeProposed: true });
  assert.equal(mx.breakdown.proposed, 0, 'threatened flag must not apply to Mexico');
  const food = T.effectiveRate('canada', 'food', { asOfDate: '2026-08-24', includeProposed: true });
  assert.equal(food.breakdown.proposed, 0, 'threatened flag must not apply to non-auto/steel Canada categories');
});

test('S338 covered categories match the three official proclamation baskets (alcohol, dairy, motor vehicles)', () => {
  const covered = T.SECTION_338_CANADA.covered_categories;
  ['auto', 'food', 'dairy', 'alcohol', 'canada-s338'].forEach(k => {
    assert.ok(covered.includes(k), `covered_categories must include ${k}`);
  });
  // alcohol + dairy categories exist in the calculator dropdown
  assert.equal(T.CATEGORY_MODIFIERS.alcohol.name, 'Alcoholic Beverages');
  assert.equal(T.CATEGORY_MODIFIERS.dairy.name, 'Dairy Products');
  // 50% applied for dairy and alcohol (on/after Aug 22, 2026)
  const dairy = T.effectiveRate('canada', 'dairy', { asOfDate: '2026-08-24' });
  assert.ok(Math.abs(dairy.rate - (0.005 + 0.046 + 0.50)) < 0.0001, `dairy should get 50% S338, got ${dairy.rate}`);
  const alcohol = T.effectiveRate('canada', 'alcohol', { asOfDate: '2026-08-24' });
  assert.ok(Math.abs(alcohol.rate - (0.005 + 0.046 + 0.50)) < 0.0001, `alcohol should get 50% S338, got ${alcohol.rate}`);
  // hs_note carries the verified enumeration (569 subheadings, 3 HTS headings)
  assert.ok(/569/.test(T.SECTION_338_CANADA.hs_note), 'hs_note must state the 569-subheading verified scope');
  assert.ok(/9903\.03\.1[234]/.test(T.SECTION_338_CANADA.hs_note), 'hs_note must cite HTS headings 9903.03.12/13/14');
});

test('TRUCKING_IMPACT layer: blog slug, stats, and 50% rate notes present', () => {
  assert.ok(T.TRUCKING_IMPACT, 'TRUCKING_IMPACT must be exported');
  assert.equal(T.TRUCKING_IMPACT.blog_slug, 'canada-tariff-trucking-freight-impact');
  assert.equal(T.TRUCKING_IMPACT.stats.canada_trade_with_us_pct, 72);
  assert.equal(T.TRUCKING_IMPACT.stats.truck_share_pct, 60);
  assert.ok(/50%/.test(T.TRUCKING_IMPACT.rate_notes.s338), 's338 rate note must name the 50% duty');
  assert.ok(T.TRUCKING_IMPACT.impact.length >= 3, 'trucking impact must include the verified impact statements');
});

test('index.html: Auto & Steel Tariff Scenario toggle (current rates vs threatened 50% effective Jan 1, 2027)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(/id="autoScenarioRow"/.test(html), 'index.html must have the autoScenarioRow');
  assert.ok(/id="autoScenario"/.test(html), 'index.html must have the autoScenario select');
  assert.ok(/~25% auto tariff/.test(html), 'index.html scenario toggle must show the current ~25% rate');
  assert.ok(/Threatened/.test(html), 'index.html must label the 50% scenario as Threatened');
  assert.ok(/50% autos &amp; steel/.test(html), 'index.html must show the threatened 50% autos/steel rate');
  assert.ok(/Jan 1, 2027/.test(html), 'index.html must show the Jan 1, 2027 proposed effective date');
  assert.ok(/NOT included by default/.test(html), 'index.html must state the threatened rate is not included by default');
  // updateAutoScenarioRow wiring exists (Canada + Automotive OR Steel & Metals)
  assert.ok(/updateAutoScenarioRow/.test(html), 'index.html must wire updateAutoScenarioRow visibility');
  assert.ok(/catSel\.value === 'auto' \|\| catSel\.value === 'steel'/.test(html), 'index.html must show the scenario row for auto OR steel');
  // includeProposed wiring exists in calculate()
  assert.ok(/includeProposed/.test(html), 'index.html must pass includeProposed for the threatened scenario');
  // Trucking cost-per-truckload row + blog post link
  assert.ok(/id="truckloadRow"/.test(html), 'index.html must have the truckloadRow result item');
  assert.ok(/Tariff Cost per Truckload/.test(html), 'index.html must label the truckload cost row');
  assert.ok(/canada-tariff-trucking-freight-impact\.html/.test(html), 'index.html must link the trucking-impact blog post');
  assert.ok(/How the 50% Canada Tariffs Hit Freight Volumes and Carriers/.test(html), 'index.html must show the trucking post title');
});

// ============================================================
// Brazil Section 301 25% duty (t_60875ef4) — verified vs research
// brief t_c288793e (16 sources / 52 quotes)
// ============================================================

test('BRAZIL_301 entry correct (25%, effective July 22 2026, HTS 9903.05.01, exemptions, sources)', () => {
  const b = T.BRAZIL_301;
  assert.ok(b, 'BRAZIL_301 should be exported');
  assert.equal(b.rate, 0.25, 'Brazil 301 rate should be 25%');
  assert.equal(b.effective, '2026-07-22 12:01 AM ET', 'effective date must be July 22 2026 12:01 AM ET (NOT July 20 = FRN publication)');
  assert.equal(b.notice_date, '2026-07-15');
  assert.equal(b.frn_published, '2026-07-20');
  assert.equal(b.heading, '9903.05.01', 'general heading must be 9903.05.01');
  assert.equal(b.headings.aircraft, '9903.05.05', 'aircraft carve-out heading must be 9903.05.05');
  assert.equal(b.headings.pharma, '9903.05.06', 'pharma carve-out heading must be 9903.05.06');
  assert.equal(b.headings.s232_covered, '9903.05.07', '232-covered heading must be 9903.05.07');
  // Exemption count reconciliation (research brief §4): ~1,200 standard + ~430 aircraft = 1,600+
  assert.equal(b.standard_exempt_lines, 1200);
  assert.equal(b.aircraft_carveout_lines, 430);
  assert.ok(/1,600\+/.test(b.exempt_subheadings), 'exempt_subheadings must state the 1,600+ figure');
  // Exempt category coverage (research brief §3)
  ['pharma', 'steel', 'auto', 'polysilicon', 'drones', 'ground-beef'].forEach(k => {
    assert.ok(b.exempt_categories.includes(k), `exempt_categories must include ${k}`);
  });
  ['coffee', 'beef', 'orange juice', 'cocoa', 'iron ore', 'pharmaceuticals', 'civil aircraft'].forEach(k => {
    assert.ok(b.exempt_categories_list.some(x => x.toLowerCase().includes(k)), `exempt list must mention ${k}`);
  });
  // Section 232 non-stacking
  assert.ok(b.s232_excluded.includes('steel') && b.s232_excluded.includes('semiconductors'), 's232_excluded must list steel/semiconductors');
  assert.ok(/37\.5%/.test(b.stacking.forced_labor_301), 'stacking note must mention the 37.5% combined (PIIE)');
  // Post-consultation what-if scenarios (modeling only)
  assert.deepEqual(Object.keys(b.scenarios), ['current', 'reduced_20', 'reduced_15', 'reduced_10', 'removed']);
  assert.equal(b.scenarios.current.rate, 0.25);
  assert.equal(b.scenarios.current.in_effect, true);
  assert.equal(b.scenarios.removed.rate, 0);
  assert.equal(b.scenarios.removed.in_effect, false);
  assert.ok(/NOT in effect/.test(b.scenarios.reduced_15.label), 'what-if labels must state NOT in effect');
  // Sources from the verified research pack
  assert.ok(b.source_citations.length >= 8, `should have >= 8 source citations, got ${b.source_citations.length}`);
  assert.ok(b.source_citations.some(s => s.includes('ustr.gov')), 'sources must cite USTR');
  assert.ok(b.source_citations.some(s => s.includes('piie.com')), 'sources must cite PIIE');
  // Trade context
  assert.equal(b.trade_context.goods_surplus, 'US goods surplus $14.4B (+115.7% YoY)');
});

test('Brazil 301: non-exempt goods pay MFN + 25% + 12.5% forced-labor (37.5% stack)', () => {
  // electronics: MFN 0.048 + cat 0.008 + forced-labor 0.125 + Brazil 0.25 = 0.431
  const res = T.effectiveRate('brazil', 'electronics', { asOfDate: '2026-07-22', usmcaQualified: false });
  assert.ok(Math.abs(res.rate - 0.431) < 0.0001, `expected 0.431, got ${res.rate}`);
  assert.equal(res.breakdown.brazil301.rate, 0.25);
  assert.equal(res.breakdown.brazil301.applies, true);
  assert.equal(res.breakdown.brazil301.exempt, false);
  assert.equal(res.breakdown.section301, 0.125, 'forced-labor 12.5% must still apply (PIIE stack)');
  // textiles: MFN 0.048 + cat 0.101 + 0.125 + 0.25 = 0.524
  const tex = T.effectiveRate('brazil', 'textiles', { asOfDate: '2026-07-22', usmcaQualified: false });
  assert.ok(Math.abs(tex.rate - 0.524) < 0.0001, `textiles expected 0.524, got ${tex.rate}`);
});

test('Brazil 301: exempt categories pay 0% on the 25% action (pharma 9903.05.06, S232 9903.05.07, beef)', () => {
  const pharma = T.effectiveRate('brazil', 'pharma', { asOfDate: '2026-07-22', usmcaQualified: false });
  assert.equal(pharma.breakdown.brazil301.rate, 0, 'pharma must be exempt from the 25%');
  assert.equal(pharma.breakdown.brazil301.exempt, true);
  // steel: Section 232 exclusion — no 25%, no stacking
  const steel = T.effectiveRate('brazil', 'steel', { asOfDate: '2026-07-22', usmcaQualified: false });
  assert.equal(steel.breakdown.brazil301.rate, 0, 'steel (S232) must be exempt from the 25%');
  assert.equal(steel.breakdown.brazil301.exempt, true);
  const auto = T.effectiveRate('brazil', 'auto', { asOfDate: '2026-07-22', usmcaQualified: false });
  assert.equal(auto.breakdown.brazil301.rate, 0, 'autos (S232) must be exempt from the 25%');
  const poly = T.effectiveRate('brazil', 'polysilicon', { asOfDate: '2026-07-22', usmcaQualified: false });
  assert.equal(poly.breakdown.brazil301.rate, 0, 'polysilicon/semiconductors (S232) must be exempt');
  const drones = T.effectiveRate('brazil', 'drones', { asOfDate: '2026-09-03', usmcaQualified: false });
  assert.equal(drones.breakdown.brazil301.rate, 0, 'drones/UAS (S232) must be exempt from the 25%');
});

test('Brazil 301: post-talks what-if scenarios model reduction or removal (NOT in effect)', () => {
  const base = T.effectiveRate('brazil', 'electronics', { asOfDate: '2026-08-28', usmcaQualified: false });
  assert.equal(base.breakdown.brazil301.scenario, 'current', 'default scenario must be current (25%)');
  assert.equal(base.breakdown.brazil301.scenarioInEffect, true);
  // removed -> 0% Brazil layer; base MFN 0.048 + cat 0.008 + FL 0.125 = 0.181
  const removed = T.effectiveRate('brazil', 'electronics', { asOfDate: '2026-08-28', usmcaQualified: false, brazilScenario: 'removed' });
  assert.equal(removed.breakdown.brazil301.rate, 0, 'removed scenario must zero the 25%');
  assert.equal(removed.breakdown.brazil301.scenarioInEffect, false);
  assert.ok(Math.abs(removed.rate - 0.181) < 0.0001, `removed scenario expected 0.181, got ${removed.rate}`);
  // reduced_15 -> 15% Brazil layer
  const r15 = T.effectiveRate('brazil', 'electronics', { asOfDate: '2026-08-28', usmcaQualified: false, brazilScenario: 'reduced_15' });
  assert.equal(r15.breakdown.brazil301.rate, 0.15);
  assert.ok(Math.abs(r15.rate - 0.331) < 0.0001, `reduced_15 expected 0.331, got ${r15.rate}`);
  assert.ok(/NOT in effect/.test(r15.breakdown.brazil301.scenarioLabel), 'scenario label must flag NOT in effect');
  // reduced_10 / reduced_20 sanity
  assert.equal(T.effectiveRate('brazil', 'electronics', { asOfDate: '2026-08-28', brazilScenario: 'reduced_10' }).breakdown.brazil301.rate, 0.10);
  assert.equal(T.effectiveRate('brazil', 'electronics', { asOfDate: '2026-08-28', brazilScenario: 'reduced_20' }).breakdown.brazil301.rate, 0.20);
  // unknown scenario falls back to current
  const unknown = T.effectiveRate('brazil', 'electronics', { asOfDate: '2026-08-28', brazilScenario: 'nonsense' });
  assert.equal(unknown.breakdown.brazil301.scenario, 'current');
});

test('Brazil 301: date-gated — no 25% before July 22 2026, applies on/after', () => {
  const before = T.effectiveRate('brazil', 'electronics', { asOfDate: '2026-07-21', usmcaQualified: false });
  assert.equal(before.breakdown.brazil301.applies, false);
  assert.equal(before.breakdown.brazil301.rate, 0, 'no Brazil 25% before the effective date');
  assert.ok(Math.abs(before.rate - 0.181) < 0.0001, `pre-effective expected 0.181, got ${before.rate}`);
  const onDay = T.effectiveRate('brazil', 'electronics', { asOfDate: '2026-07-22', usmcaQualified: false });
  assert.equal(onDay.breakdown.brazil301.applies, true);
  assert.equal(onDay.breakdown.brazil301.rate, 0.25);
});

test('Brazil 301: only applies to Brazil (no brazil301 breakdown elsewhere)', () => {
  const cn = T.effectiveRate('china', 'electronics', { asOfDate: '2026-08-28' });
  assert.equal(cn.breakdown.brazil301, null, 'china must not get a brazil301 layer');
  const ca = T.effectiveRate('canada', 'auto', { asOfDate: '2026-08-28' });
  assert.equal(ca.breakdown.brazil301, null, 'canada must not get a brazil301 layer');
  // Brazil forced-labor rate (9903.05.27) unchanged at 12.5% in the 60-economy matrix
  assert.equal(T.SECTION_301.brazil.rate, 0.125);
  assert.equal(T.SECTION_301.brazil.heading, '9903.05.27');
});

test('index.html: Brazil 25% Section 301 scenario toggle + HTS/coverage note + sources + blog card', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const data = fs.readFileSync(path.join(__dirname, '..', 'tariff-data.js'), 'utf8');
  // Scenario toggle present and wired
  assert.ok(/id="brazilScenarioRow"/.test(html), 'index.html must have the brazilScenarioRow');
  assert.ok(/id="brazilScenario"/.test(html), 'index.html must have the brazilScenario select');
  assert.ok(/updateBrazilScenarioRow/.test(html), 'index.html must wire updateBrazilScenarioRow');
  assert.ok(/opts\.brazilScenario/.test(html), 'index.html must pass brazilScenario into effectiveRate');
  // Current + what-if options, defaults to current
  assert.ok(/Current — 25% Section 301/.test(html), 'index.html must default to the current 25%');
  assert.ok(/NOT in effect/.test(html), 'index.html must flag what-if rates as NOT in effect');
  assert.ok(/removed \/ 0%/.test(html), 'index.html must offer the removed/0% scenario');
  // HTS/coverage note in the UI
  assert.ok(/9903\.05\.01/.test(html), 'index.html must cite HTS 9903.05.01');
  assert.ok(/1,600\+ exempt HTSUS subheadings|1,600\+ HTSUS subheadings/.test(html), 'index.html must state the 1,600+ exemption count');
  assert.ok(/9903\.05\.07/.test(html), 'index.html must cite the Section 232 heading 9903.05.07');
  assert.ok(/July 22, 2026/.test(html), 'index.html must state the July 22, 2026 effective date');
  assert.ok(/37\.5%/.test(html), 'index.html must state the 37.5% combined stack');
  assert.ok(/Rosa/.test(html), 'index.html must mention the Rosa-Greer talks');
  // Source attribution in the UI
  assert.ok(html.includes('ustr.gov/sites/default/files/files/Issue_Areas/Enforcement/Section%20301'), 'index.html must link the USTR FRN');
  assert.ok(html.includes('piie.com/blogs/realtime-economics/2026/trumps-new-tariffs-brazil'), 'index.html must link PIIE');
  // Data layer exports BRAZIL_301
  assert.ok(data.includes('BRAZIL_301: BRAZIL_301'), 'tariff-data.js must export BRAZIL_301');
  // Blog card discoverable from homepage
  assert.ok(/brazil-section-301-tariff-2026\.html/.test(html), 'index.html must feature the Brazil blog card');
  // FAQ parity: the two Brazil FAQPage items have matching visible Q&A blocks
  const faqCount = (html.match(/"name": "What is the Brazil tariff in 2026\?"/g) || []).length;
  const visCount = (html.match(/Q: What is the Brazil tariff in 2026\?/g) || []).length;
  assert.equal(faqCount, 1, 'FAQPage must contain the Brazil tariff question');
  assert.equal(visCount, 1, 'visible Q&A must mirror the FAQPage Brazil question');
});

test('Brazil blog post: CTA points to Country of Origin: Brazil (discoverable from the post)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const post = fs.readFileSync(path.join(__dirname, '..', 'brazil-section-301-tariff-2026.html'), 'utf8');
  assert.ok(/Country of Origin: Brazil/.test(post), 'blog CTA must instruct Country of Origin: Brazil');
  assert.ok(!/Shipping To: Brazil/.test(post), 'blog CTA must NOT say Shipping To: Brazil (that control is US/Canada only)');
  assert.ok(/Tariff Calculator 2026/.test(post), 'blog CTA must link the calculator');
  assert.ok(/scenario toggle/.test(post), 'blog CTA must reference the post-talks scenario toggle');
});
