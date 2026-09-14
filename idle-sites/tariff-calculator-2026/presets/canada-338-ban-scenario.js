/*
 * SECTION 338 CANADA — BAN / SNAP-BACK / EXCLUSION SCENARIO — preset data file
 * kanban t_edae4114 (drafting card) · publisher card t_91970bb1
 * -----------------------------------------------------------------------
 * Single source of truth for a new calculator mode on
 * tariffcalculator2026.com/index.html, in the shape proven by the existing
 * presets (canada-sept8-counter-tariffs.js, canada-trq-canned-vegetables.js,
 * refined-copper-tariff-pending.js). Loaded BEFORE tariff-data.js:
 *
 *     <script src="presets/canada-sept8-counter-tariffs.js"></script>
 *     <script src="presets/canada-trq-canned-vegetables.js"></script>
 *     <script src="presets/refined-copper-tariff-pending.js"></script>
 *     <script src="presets/canada-338-ban-scenario.js"></script>   <-- new
 *     <script src="tariff-data.js"></script>
 *
 * WHY THIS MODE IS NOT THE COPPER MODE
 * ------------------------------------
 * The copper preset models a measure that does not exist (nothing collectible).
 * This one models a measure that DOES exist — the 50% Section 338 duty has been
 * in force since 2026-08-22 — whose *type* changes on 2026-09-29 for named
 * goods, from a duty into an import prohibition. So `in_effect` is TRUE and the
 * mode must never print "not in effect". What is conditional here is one
 * outcome among three:
 *
 *   1. ENTRY BEFORE 2026-09-29  -> the 50% duty is collectible (transition
 *      rule: goods imported but not yet entered before that date stay at 50%).
 *   2. ENTRY ON/AFTER 2026-09-29, covered, not excluded -> the entry CANNOT BE
 *      MADE. No duty is collectible because there is no lawful entry. The cost
 *      is stranded value, not a rate. NEVER render a duty figure here.
 *   3. BAN INVALIDATED (court, WTO or USMCA result) -> Proclamation 11061
 *      § 9(b) reinstates the 50% ad valorem duty on that import. Duty-free
 *      entry is not an outcome of the design.
 *
 * Plus an EXCLUSION switch: if the 8-digit line sits in the annex exclusion
 * headings (Chapter 99 9903.03.15 / .16), no Section 338 duty and no ban apply
 * to it (MFN duty is out of scope for this mode).
 *
 * `compute(opts)` is deliberately shipped INSIDE this data file: the mode's
 * arithmetic and its numbers then cannot drift apart, and node:test can assert
 * the file directly (tests/s338-data.test.js). The tariff-data.js layer is a
 * thin wrapper — see CALCULATOR-UPDATE-SPEC-section-338-ban-scenario.md §3.
 *
 * PROVENANCE: every date, heading and rate below is from the frozen research
 * package (kanban t_d24690e9) — Federal Register 91 FR 58311 / 58319 / 58325 /
 * 58331 / 58339 (all published 2026-09-14), the White House fact sheet of
 * 2026-09-08, and the Chapter 99 heading map compiled from the annexes. The
 * duty rate is the 50% established by Proclamations 11046/11047/11048 on
 * 2026-07-20 and in force since 2026-08-22.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.S338_BAN_PRESET = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DUTY_PCT = 50;
  var BAN_EFFECTIVE = '2026-09-29T00:01:00-04:00';
  var SCOPE_EFFECTIVE = '2026-09-15T00:01:00-04:00';
  var ITC_COMMENTS_DUE = '2026-11-08T17:15:00-04:00';

  var PROGRAMMES = [
    {
      value: 'alcohol',
      label: 'Alcoholic beverages — beer, wine, cider, spirits, non-alcoholic beer',
      heading: '9903.03.12',
      duty_proclamation: '11046',
      ban_proclamation: '11061',
      fr_ban: '91 FR 58311',
      fr_scope: '91 FR 58331',
      note: 'Packaging decides lines inside some subheadings (bulk vs consumer-ready, e.g. containers over 4 litres) — classify at 8 digits against the annex before using this scenario.'
    },
    {
      value: 'dairy',
      label: 'Dairy and related — whey products, molasses, non-alcoholic beer',
      heading: '9903.03.13',
      duty_proclamation: '11047',
      ban_proclamation: '11062',
      fr_ban: '91 FR 58319',
      fr_scope: null,
      note: 'No scope-modification proclamation was issued for dairy; the ban proclamation is the instrument that changed.'
    },
    {
      value: 'motor_vehicles',
      label: 'Motor vehicles — motorcycles, mopeds and cycles, reciprocating ICE over 800 cc',
      heading: '9903.03.14',
      duty_proclamation: '11048',
      ban_proclamation: '11063',
      fr_ban: '91 FR 58325',
      fr_scope: '91 FR 58339',
      note: 'The ban reaches motorcycles/mopeds with reciprocating internal-combustion engines over 800 cc — it is NOT a ban on Canadian cars or auto parts.'
    }
  ];

  var EXCLUSION_HEADINGS = ['9903.03.15', '9903.03.16'];

  var DESTINATIONS = [
    {
      value: 'us',
      label: '\uD83C\uDDFA\uD83C\uDDF8 United States — importing Canadian goods into the US',
      note: 'Section 338 is a US measure on imports of Canadian goods: it is charged on goods entered, or withdrawn from warehouse, into the United States.'
    },
    {
      value: 'canada',
      label: '\uD83C\uDDE8\uD83C\uDDE6 Canada — US or third-country goods imported into Canada',
      note: 'Canada\u2019s own counter-tariffs are a different action and a different list; the Section 338 scenario does not apply and is shown for contrast only.'
    }
  ];

  // The page-copy mirror: tests assert against these numbers, so the prose, the
  // worked example and the calculator cannot drift apart. $250,000 of Canadian
  // distilled spirits, entered after the ban date, covered and not excluded.
  var SCENARIO_REFERENCE = {
    programme: 'alcohol',
    customs_value_usd: 250000,
    entry: 'after',
    excluded: false,
    states: {
      prohibited: { duty_usd: 0, stranded_value_usd: 250000, note: 'no lawful entry — no duty is collectible' },
      snapback_50: { duty_usd: 125000, landed_usd: 375000, delta_usd: 125000, delta_pct: 0.5, note: 'Proclamation 11061 § 9(b): the 50% duty applies to the import whose ban is invalidated' },
      before_ban_entry: { duty_usd: 125000, landed_usd: 375000, delta_usd: 125000, delta_pct: 0.5, note: 'the transition rule — the same 50% the snap-back restores' },
      excluded: { duty_usd: 0, note: 'annex exclusion heading (9903.03.15 / .16) — MFN duty is out of scope' }
    },
    weighting: [
      { pct: 0, expected_snapback_usd: 0 },
      { pct: 25, expected_snapback_usd: 31250 },
      { pct: 50, expected_snapback_usd: 62500 },
      { pct: 75, expected_snapback_usd: 93750 },
      { pct: 100, expected_snapback_usd: 125000 }
    ]
  };

  function fmtMoney(n) {
    if (n == null || !isFinite(n)) return '\u2014';
    var neg = n < 0;
    var parts = Math.abs(n).toFixed(0).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + '$' + parts.join('.');
  }

  function programmeRow(value) {
    for (var i = 0; i < PROGRAMMES.length; i++) {
      if (PROGRAMMES[i].value === value) return PROGRAMMES[i];
    }
    return null;
  }

  /* compute(opts)
   * @param opts { programme: 'alcohol'|'dairy'|'motor_vehicles' (required),
   *              customsValueUsd: number > 0 (required),
   *              entry: 'before'|'after' — relative to 2026-09-29 00:01 ET
   *                     (default 'after'), or pass entryDate: 'YYYY-MM-DD'
   *              excluded: boolean — line falls in an annex exclusion heading
   *                        (default false),
   *              banInvalidatedPct: 0-100 — the USER'S OWN weighting of the ban
   *                        being invalidated as to this import (default 0,
   *                        clamped, see `clamped`),
   *              destination: 'us'|'canada' (default 'us') }
   * Returns null for an unknown programme or a non-positive value.
   */
  function compute(opts) {
    opts = opts || {};
    var row = programmeRow(opts.programme == null ? '' : String(opts.programme));
    if (!row) return null;

    var value = Number(opts.customsValueUsd);
    if (opts.customsValueUsd == null || opts.customsValueUsd === '' || !isFinite(value) || value <= 0) return null;

    // entry timing: explicit 'before'/'after' wins; otherwise derive from a date
    var entry;
    if (opts.entry === 'before' || opts.entry === 'after') {
      entry = opts.entry;
    } else if (opts.entryDate) {
      var d = new Date(String(opts.entryDate) + 'T00:00:00-04:00');
      if (isNaN(d.getTime())) return null;
      entry = d.getTime() < new Date(BAN_EFFECTIVE).getTime() ? 'before' : 'after';
    } else {
      entry = 'after';
    }

    var excluded = !!opts.excluded;

    var band = 100;
    var requestedPct = opts.banInvalidatedPct == null || opts.banInvalidatedPct === ''
      ? 0 : Number(opts.banInvalidatedPct);
    if (!isFinite(requestedPct)) requestedPct = 0;
    var clamped = false;
    var pct = requestedPct;
    if (pct < 0) { pct = 0; clamped = true; }
    if (pct > band) { pct = band; clamped = true; }
    var weight = pct / 100;

    var dest = DESTINATIONS[0];
    for (var i = 0; i < DESTINATIONS.length; i++) {
      if (DESTINATIONS[i].value === String(opts.destination || 'us')) dest = DESTINATIONS[i];
    }

    var duty50 = value * (DUTY_PCT / 100);
    var excludedDuty = 0;
    var snapBackDuty = duty50;

    var state;
    if (excluded) state = 'excluded';
    else if (entry === 'before') state = 'duty_50';
    else state = 'prohibited';

    var prohibited = state === 'prohibited';
    var collectibleDuty = state === 'duty_50' ? duty50 : 0;
    var landed = value + collectibleDuty;
    var stranded = prohibited ? value : 0;
    var expectedSnapBack = snapBackDuty * weight;
    var maxExposure = value + snapBackDuty;

    var flags = [];
    if (state === 'prohibited') {
      flags.push('PROHIBITED — goods in this programme may not be entered for consumption, or withdrawn from warehouse, on or after 2026-09-29. No duty is collectible on this entry, so none is shown: the exposure is the ' + fmtMoney(value) + ' of value you cannot enter.');
      flags.push('SNAP-BACK — if the ban is invalidated as to this import, Proclamation 11061 § 9(b) applies the ' + DUTY_PCT + '% duty (' + fmtMoney(snapBackDuty) + ') to it. Duty-free entry is not an outcome of the measure.');
    } else if (state === 'duty_50') {
      flags.push('IN FORCE — entered before 2026-09-29, so the ' + DUTY_PCT + '% Section 338 duty under Proclamation ' + row.duty_proclamation + ' applies (' + fmtMoney(duty50) + '). This is the position a successful challenge restores, not improves on.');
    } else {
      flags.push('EXCLUDED — this line falls in a Chapter 99 exclusion heading (' + EXCLUSION_HEADINGS.join(' / ') + '), so no Section 338 duty and no ban apply. MFN duty is not modelled here.');
    }
    if (clamped) {
      flags.push('Requested weighting ' + requestedPct + '% was clamped to the 0\u2013100% band.');
    }
    if (dest.value !== 'us') {
      flags.push(dest.note);
    }
    flags.push('Not legal advice. Dates, headings and rates are from the proclamations cited on this page; verify the 8-digit line against each proclamation\u2019s annex before you rely on this scenario.');

    var headline;
    if (state === 'prohibited') {
      headline = 'Entered on or after 2026-09-29, this shipment cannot be made: no duty is collectible, and ' +
        fmtMoney(value) + ' of value cannot be entered. If the ban is invalidated as to this import, the ' +
        DUTY_PCT + '% duty applies instead \u2014 ' + fmtMoney(snapBackDuty) + '.';
      if (pct > 0) {
        headline += ' Weighted at your ' + pct + '% assumption, the expected snap-back duty is ' + fmtMoney(expectedSnapBack) + '.';
      }
    } else if (state === 'duty_50') {
      headline = 'Entered before 2026-09-29, this shipment pays the ' + DUTY_PCT + '% Section 338 duty: ' +
        fmtMoney(duty50) + ' on ' + fmtMoney(value) + ' of customs value, for a landed cost of ' + fmtMoney(landed) + '.';
    } else {
      headline = 'This line is excluded from the Section 338 programme, so neither the ' + DUTY_PCT +
        '% duty nor the import ban applies to it.';
    }

    return {
      presetKey: 'canada-338-ban-scenario',
      presetLabel: 'Section 338 Canada \u2014 ban, snap-back and exclusion scenario',
      programme: row.value,
      programmeLabel: row.label,
      heading: row.heading,
      dutyProclamation: row.duty_proclamation,
      banProclamation: row.ban_proclamation,
      frBan: row.fr_ban,
      frScope: row.fr_scope,
      programmeNote: row.note,
      exclusionHeadings: EXCLUSION_HEADINGS.slice(),
      dutyPct: DUTY_PCT,
      banEffective: BAN_EFFECTIVE,
      scopeEffective: SCOPE_EFFECTIVE,
      itcCommentsDue: ITC_COMMENTS_DUE,
      customsValueUsd: value,
      entry: entry,
      excluded: excluded,
      state: state,
      prohibited: prohibited,
      collectibleDutyUsd: collectibleDuty,
      duty50Usd: duty50,
      excludedDutyUsd: excludedDuty,
      landedUsd: landed,
      deltaUsd: collectibleDuty,
      deltaPct: collectibleDuty / value,
      strandedValueUsd: stranded,
      snapBackDutyUsd: snapBackDuty,
      snapBackLandedUsd: value + snapBackDuty,
      expectedSnapBackUsd: expectedSnapBack,
      maxExposureUsd: maxExposure,
      banInvalidatedPct: pct,
      requestedBanInvalidatedPct: requestedPct,
      clamped: clamped,
      weightBandPct: band,
      destination: dest.value,
      destinationLabel: dest.label,
      destinationNote: dest.note,
      flagLines: flags,
      headline: headline,
      references: {
        duty: 'Proclamations 11046 / 11047 / 11048 (2026-07-20) \u2014 50% ad valorem, in force since 2026-08-22',
        ban: 'Proclamations 11061 / 11062 / 11063 \u2014 import bans, effective 2026-09-29 (91 FR 58311 / 58319 / 58325)',
        scope: 'Proclamations 11064 / 11065 \u2014 scope modifications, effective 2026-09-15 (91 FR 58331 / 58339)',
        snapBack: 'Proclamation 11061 \u00a7 9(b) \u2014 an invalidated ban reverts to the 50% duty, never to duty-free entry',
        itc: 'USITC Section 338(g) comments due 5:15 p.m. ET 2026-11-08'
      }
    };
  }

  return {
    preset_key: 'canada-338-ban-scenario',
    preset_label: 'Section 338 Canada \u2014 ban, snap-back and exclusion scenario',
    status: 'IN FORCE \u2014 50% duty from 2026-08-22; import bans from 2026-09-29',
    status_short: 'In force \u2014 ban date 2026-09-29',
    in_effect: true,
    as_of: '2026-09-14',
    verified: '2026-09-14',

    disclaimer: 'The 50% Section 338 duty on covered Canadian goods is in force, and the import bans on the goods named in Proclamations 11061/11062/11063 take effect on 2026-09-29. A line covered by a ban cannot be entered on or after that date, so no duty is collectible on it: this scenario returns the stranded value and the 50% duty that Proclamation 11061 § 9(b) would reinstate if the ban is invalidated. It is not a rate you can elect.',
    disclaimer_short: 'IN FORCE \u2014 bans from 2026-09-29. A prohibited entry pays no duty; a win restores 50%.',

    basis: 'Section 338 of the Tariff Act of 1930 (19 U.S.C. § 1338). The 50% duty under Proclamations 11046/11047/11048 has been in force since 2026-08-22; Proclamations 11061/11062/11063 convert named products into import prohibitions effective 2026-09-29 (91 FR 58311 / 58319 / 58325), and 11064/11065 re-scope the duty list effective 2026-09-15 (91 FR 58331 / 58339).',

    duty_pct: DUTY_PCT,
    ban_effective: BAN_EFFECTIVE,
    scope_effective: SCOPE_EFFECTIVE,
    itc_comments_due: ITC_COMMENTS_DUE,
    exclusion_headings: EXCLUSION_HEADINGS.slice(),
    programmes: PROGRAMMES,
    default_programme: 'alcohol',
    destinations: DESTINATIONS,
    default_destination: 'us',

    weight_band: {
      min_pct: 0,
      max_pct: 100,
      step_pct: 5,
      default_pct: 0,
      band_note: 'The weighting is the user\u2019s own assumption about the ban being invalidated as to this import, not our forecast. It is deliberately 0 by default so the first number on screen is never a prediction.'
    },

    scenario_reference: SCENARIO_REFERENCE,

    sources: [
      { label: 'Proclamation 11061 (alcohol import ban), 91 FR 58311', url: 'https://www.federalregister.gov/documents/2026/09/14/2026-18835/excluding-certain-products-of-canada-from-importation-into-the-united-states' },
      { label: 'Proclamation 11062 (dairy import ban), 91 FR 58319', url: 'https://www.federalregister.gov/documents/2026/09/14/2026-18836/excluding-certain-products-of-canada-from-importation-into-the-united-states' },
      { label: 'Proclamation 11063 (motor-vehicle import ban), 91 FR 58325', url: 'https://www.federalregister.gov/documents/2026/09/14/2026-18837/excluding-certain-products-of-canada-from-importation-into-the-united-states' },
      { label: 'Proclamation 11064 (scope modification), 91 FR 58331', url: 'https://www.federalregister.gov/documents/2026/09/14/2026-18838/modifying-the-scope-of-products-of-canada-subject-to-the-additional-duties' },
      { label: 'Proclamation 11065 (scope modification), 91 FR 58339', url: 'https://www.federalregister.gov/documents/2026/09/14/2026-18839/modifying-the-scope-of-products-of-canada-subject-to-the-additional-duties' },
      { label: 'White House fact sheet, 2026-09-08', url: 'https://www.whitehouse.gov/fact-sheets/2026/09/fact-sheet-president-donald-j-trump-responds-to-canadas-retaliation/' }
    ],

    compute: compute
  };
}));
