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
  assert.equal(s338.effective, '2026-08-22 12:01 AM ET');
  // Canada S338 is SUSPENDED until Aug 22 (Aug 18, 2026) — not in effect, not cancelled
  assert.equal(s338.status, 'suspended');
  assert.equal(s338.paused_until, '2026-08-21 11:59 PM ET');
  assert.ok(s338.note.includes('SUSPENDED'), 'note should state suspended status');
  assert.ok(s338.note.includes('August 22, 2026'), 'note should state the Aug 22 effective date');
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

test('drone tariff does NOT apply with today\'s date (before Sept 3 2026)', () => {
  // Default (no asOfDate) = today. Aug 2026 < Sept 3, so should NOT apply.
  const res = T.effectiveRate('china', 'drones', { usmcaQualified: false });
  assert.ok(res);
  assert.ok(res.breakdown.drone);
  assert.equal(res.breakdown.drone.applies, false,
    'drone tariff should not apply by default (today < Sept 3)');
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

test('drone tariff — index.html renders the category, tier selector, effective date, and source links', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  // Searchable category language
  assert.ok(/Drones \/ UAS \(Unmanned Aircraft\)/.test(html), 'index.html should mention the Drones / UAS category');
  assert.ok(/Section 232: Drones \/ UAS Tariff/.test(html), 'index.html should have a drone tariff section');
  assert.ok(/September 3, 2026/.test(html), 'index.html should show the Sept 3 2026 effective date');
  assert.ok(/100%/.test(html), 'index.html should show the 100% rate');
  assert.ok(/25%/.test(html), 'index.html should show the 25% rate');
  // Tier selector present
  assert.ok(html.includes('droneTier'), 'index.html should have the drone tier selector');
  // Source link visible
  assert.ok(html.includes('whitehouse.gov/presidential-actions/2026/08/adjusting-imports-of-unmanned-aircraft-systems'),
    'index.html should link to the White House proclamation');
  assert.ok(html.includes('whitehouse.gov/fact-sheets/2026/08/fact-sheet-president-donald-j-trump'),
    'index.html should link to the White House fact sheet');
  // Transshipment caveat — must NOT conflate the 40+ countries claim with the drone proclamation
  assert.ok(/Transshipment note/.test(html), 'index.html should carry the transshipment caveat');
  assert.ok(/The Great Transshipment Scam/.test(html), 'index.html should attribute the 40+ countries claim to the separate report');
});
