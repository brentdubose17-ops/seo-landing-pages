/*
 * Tariff Calculator 2026 — canonical tariff data
 * -------------------------------------------------
 * Updated 2026-08-08: Section 232 polysilicon + solar tariff added
 * (15% ad valorem, MIP floors, effective 2026-12-04).
 * Section 301 forced-labor framework (effective 2026-07-24 12:01 AM ET,
 * replacing expired Section 122) verified against USTR FRN, White House,
 * C.H. Robinson Edge Report Aug 2026.
 * Philippines rate RE-VERIFIED at 12.5% on 2026-08-07: relief request
 * pending at USTR, no reduction announced — rate unchanged.
 * Works in browser (window.TARIFF_DATA) and Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TARIFF_DATA = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var EFFECTIVE_DATE = '2026-07-24 12:01 AM ET';
  var IN_TRANSIT_END = '2026-07-28 12:01 AM ET';

  /*
   * Section 301 forced-labor matrix — 60 economies.
   * rate: additional duty on top of normal Column-1/MFN duty.
   * type: 'flat'    -> rate is additive.
   *       'mfn_cap' -> combined MFN + Section 301 equals the cap;
   *                    301 = max(0, cap - mfn). mfn is the product's
   *                    normal Column-1 rate (estimated here).
   * USMCA-qualified goods (Canada/Mexico) are EXEMPT from Section 301.
   * Section 232 goods are exempt (no stacking). Pharmaceuticals,
   * civil aircraft, donations, informational materials exempt.
   * China: 12.5% forced-labor rate is ON TOP of pre-existing China 301.
   */
  var SECTION_301 = {
    algeria:            { rate: 0.125, type: 'flat', name: 'Algeria', heading: '9903.05.20' },
    angola:             { rate: 0.125, type: 'flat', name: 'Angola', heading: '9903.05.21' },
    argentina:          { rate: 0.10,  type: 'flat', name: 'Argentina', heading: '9903.05.22' },
    australia:          { rate: 0.125, type: 'flat', name: 'Australia', heading: '9903.05.23' },
    bahamas:            { rate: 0.125, type: 'flat', name: 'Bahamas', heading: '9903.05.24' },
    bahrain:            { rate: 0.125, type: 'flat', name: 'Bahrain', heading: '9903.05.25' },
    bangladesh:         { rate: 0.10,  type: 'flat', name: 'Bangladesh', heading: '9903.05.26' },
    brazil:             { rate: 0.125, type: 'flat', name: 'Brazil', heading: '9903.05.27' },
    cambodia:           { rate: 0.10,  type: 'flat', name: 'Cambodia', heading: '9903.05.28' },
    canada:             { rate: 0.10,  type: 'flat', name: 'Canada', heading: '9903.05.29', usmca_exempt: true },
    chile:              { rate: 0.125, type: 'flat', name: 'Chile', heading: '9903.05.30' },
    china:              { rate: 0.125, type: 'flat', name: 'China', heading: '9903.05.31', stacks_on_existing: true },
    colombia:           { rate: 0.125, type: 'flat', name: 'Colombia', heading: '9903.05.32' },
    'costa-rica':       { rate: 0.125, type: 'flat', name: 'Costa Rica', heading: '9903.05.33' },
    'dominican-republic': { rate: 0.125, type: 'flat', name: 'Dominican Republic', heading: '9903.05.34' },
    ecuador:            { rate: 0.10,  type: 'flat', name: 'Ecuador', heading: '9903.05.35' },
    egypt:              { rate: 0.125, type: 'flat', name: 'Egypt', heading: '9903.05.36' },
    'el-salvador':      { rate: 0.10,  type: 'flat', name: 'El Salvador', heading: '9903.05.37' },
    'european-union':   { rate: 0.10,  type: 'mfn_cap', name: 'European Union', heading: '9903.05.38/39', cap: 0.10 },
    guatemala:          { rate: 0.10,  type: 'flat', name: 'Guatemala', heading: '9903.05.40' },
    guyana:             { rate: 0.125, type: 'flat', name: 'Guyana', heading: '9903.05.41' },
    honduras:           { rate: 0.10,  type: 'flat', name: 'Honduras', heading: '9903.05.42' },
    'hong-kong':        { rate: 0.125, type: 'flat', name: 'Hong Kong', heading: '9903.05.43' },
    india:              { rate: 0.10,  type: 'flat', name: 'India', heading: '9903.05.44' },
    indonesia:          { rate: 0.10,  type: 'flat', name: 'Indonesia', heading: '9903.05.45' },
    iraq:               { rate: 0.125, type: 'flat', name: 'Iraq', heading: '9903.05.46' },
    israel:             { rate: 0.125, type: 'flat', name: 'Israel', heading: '9903.05.47' },
    japan:              { rate: 0.125, type: 'mfn_cap', name: 'Japan', heading: '9903.05.48/49', cap: 0.125 },
    jordan:             { rate: 0.10,  type: 'flat', name: 'Jordan', heading: '9903.05.50' },
    kazakhstan:         { rate: 0.125, type: 'flat', name: 'Kazakhstan', heading: '9903.05.51' },
    kuwait:             { rate: 0.125, type: 'flat', name: 'Kuwait', heading: '9903.05.52' },
    libya:              { rate: 0.125, type: 'flat', name: 'Libya', heading: '9903.05.53' },
    malaysia:           { rate: 0.10,  type: 'flat', name: 'Malaysia', heading: '9903.05.54' },
    mexico:             { rate: 0.10,  type: 'flat', name: 'Mexico', heading: '9903.05.55', usmca_exempt: true },
    morocco:            { rate: 0.125, type: 'flat', name: 'Morocco', heading: '9903.05.56' },
    'new-zealand':      { rate: 0.125, type: 'flat', name: 'New Zealand', heading: '9903.05.57' },
    nicaragua:          { rate: 0.125, type: 'flat', name: 'Nicaragua', heading: '9903.05.58' },
    nigeria:            { rate: 0.125, type: 'flat', name: 'Nigeria', heading: '9903.05.59' },
    norway:             { rate: 0.125, type: 'flat', name: 'Norway', heading: '9903.05.60' },
    oman:               { rate: 0.125, type: 'flat', name: 'Oman', heading: '9903.05.61' },
    pakistan:           { rate: 0.10,  type: 'flat', name: 'Pakistan', heading: '9903.05.62' },
    peru:               { rate: 0.125, type: 'flat', name: 'Peru', heading: '9903.05.63' },
    philippines:        { rate: 0.125, type: 'flat', name: 'Philippines', heading: '9903.05.64' },
    qatar:              { rate: 0.125, type: 'flat', name: 'Qatar', heading: '9903.05.65' },
    russia:             { rate: 0.125, type: 'flat', name: 'Russia', heading: '9903.05.66' },
    'saudi-arabia':     { rate: 0.125, type: 'flat', name: 'Saudi Arabia', heading: '9903.05.67' },
    singapore:          { rate: 0.125, type: 'flat', name: 'Singapore', heading: '9903.05.68' },
    'south-africa':     { rate: 0.125, type: 'flat', name: 'South Africa', heading: '9903.05.69' },
    'south-korea':      { rate: 0.125, type: 'mfn_cap', name: 'South Korea', heading: '9903.05.70/71', cap: 0.125 },
    'sri-lanka':        { rate: 0.10,  type: 'flat', name: 'Sri Lanka', heading: '9903.05.72' },
    switzerland:        { rate: 0.125, type: 'mfn_cap', name: 'Switzerland', heading: '9903.05.73/74', cap: 0.125 },
    taiwan:             { rate: 0.10,  type: 'mfn_cap', name: 'Taiwan', heading: '9903.05.75/76', cap: 0.10 },
    thailand:           { rate: 0.125, type: 'flat', name: 'Thailand', heading: '9903.05.77' },
    'trinidad-and-tobago': { rate: 0.10, type: 'flat', name: 'Trinidad and Tobago', heading: '9903.05.78' },
    turkiye:            { rate: 0.125, type: 'flat', name: 'Türkiye', heading: '9903.05.79' },
    'united-arab-emirates': { rate: 0.125, type: 'flat', name: 'United Arab Emirates', heading: '9903.05.80' },
    'united-kingdom':   { rate: 0.10,  type: 'flat', name: 'United Kingdom', heading: '9903.05.81' },
    uruguay:            { rate: 0.125, type: 'flat', name: 'Uruguay', heading: '9903.05.82' },
    venezuela:          { rate: 0.125, type: 'flat', name: 'Venezuela', heading: '9903.05.83' },
    vietnam:            { rate: 0.125, type: 'flat', name: 'Vietnam', heading: '9903.05.84' }
  };

  /*
   * Average MFN (Column-1) duty estimate per country — the base rate
   * before category modifier and Section 301. Used for mfn_cap math and
   * as the starting point for flat-rate economies. Estimates where no
   * product-specific rate is available (avg US applied MFN ~3.4%).
   */
  var MFN_EST = {
    algeria: 0.034, angola: 0.034, argentina: 0.034, australia: 0.012,
    bahamas: 0.034, bahrain: 0.034, bangladesh: 0.034, brazil: 0.048,
    cambodia: 0.034, canada: 0.005, chile: 0.034, china: 0.195,
    colombia: 0.034, 'costa-rica': 0.034, 'dominican-republic': 0.034,
    ecuador: 0.034, egypt: 0.034, 'el-salvador': 0.034, 'european-union': 0.017,
    guatemala: 0.034, guyana: 0.034, honduras: 0.034, 'hong-kong': 0.034,
    india: 0.052, indonesia: 0.034, iraq: 0.034, israel: 0.034,
    japan: 0.018, jordan: 0.034, kazakhstan: 0.034, kuwait: 0.034,
    libya: 0.034, malaysia: 0.034, mexico: 0.008, morocco: 0.034,
    'new-zealand': 0.034, nicaragua: 0.034, nigeria: 0.034, norway: 0.034,
    oman: 0.034, pakistan: 0.034, peru: 0.034, philippines: 0.034,
    qatar: 0.034, russia: 0.034, 'saudi-arabia': 0.034, singapore: 0.034,
    'south-africa': 0.034, 'south-korea': 0.015, 'sri-lanka': 0.034,
    switzerland: 0.034, taiwan: 0.032, thailand: 0.042,
    'trinidad-and-tobago': 0.034, turkiye: 0.034, 'united-arab-emirates': 0.034,
    'united-kingdom': 0.016, uruguay: 0.034, venezuela: 0.034, vietnam: 0.045
  };

  /*
   * Category rate modifiers (add to country MFN estimate) — unchanged
   * from the original calculator's average 2026 US tariff by HS group.
   */
  var CATEGORY_MODIFIERS = {
    electronics:  { add: 0.008, name: 'Electronics & Machinery' },
    textiles:     { add: 0.101, name: 'Textiles & Apparel' },
    footwear:     { add: 0.114, name: 'Footwear' },
    auto:         { add: 0.027, name: 'Automotive' },
    furniture:    { add: 0.035, name: 'Furniture' },
    steel:        { add: 0.014, name: 'Steel & Metals' },
    food:         { add: 0.046, name: 'Food & Beverages' },
    chemicals:    { add: 0.020, name: 'Chemicals & Plastics' },
    pharma:       { add: 0,     name: 'Pharmaceuticals' },
    toys:         { add: 0.024, name: 'Toys & Games' },
    paper:        { add: 0.010, name: 'Paper & Wood' },
    ceramics:     { add: 0.040, name: 'Ceramics & Glass' },
    polysilicon:  { add: 0,     name: 'Polysilicon & Solar (Section 232)' }
  };

  /*
   * Pre-existing China-specific Section 301 add-ons by category —
   * STACKS on top of the new 12.5% forced-labor rate for China.
   */
  var CHINA_301 = {
    electronics: 0.075, textiles: 0.075, furniture: 0.075,
    steel: 0.25, auto: 0.25, chemicals: 0.075, toys: 0.075, ceramics: 0.075
  };

  /*
   * Proposed / threatened retaliatory tariff flags (NOT currently
   * in effect — shown as warnings, not added to the rate).
   * canada_s338: Section 338, signed 2026-07-20, effective 2026-08-19,
   *   50% on Canadian motor vehicles / alcoholic beverages / dairy,
   *   applies EVEN to USMCA-qualifying goods.
   * eu_dst: 25% Section 301 threatened over digital-services taxes,
   *   activation uncertain.
   */
  var PROPOSED_FLAGS = [
    {
      key: 'canada_s338',
      country: 'canada',
      label: 'Canada Section 338 (proposed, effective Aug 19 2026)',
      rate: 0.50,
      categories: ['auto', 'food'],
      effective: '2026-08-19 12:01 AM ET',
      note: '50% additional duty on Canadian motor vehicles, alcoholic beverages, and dairy. Applies even to USMCA-qualifying goods. Exempt: energy, potash, Section 232 goods, fish, critical minerals. Not yet in effect.'
    },
    {
      key: 'eu_dst',
      country: 'european-union',
      label: 'EU digital-services-tax response (threatened)',
      rate: 0.25,
      categories: null,
      effective: null,
      note: '25% Section 301 tariffs threatened on selected EU imports in response to digital-services taxes. Activation uncertain — not in effect. The EU is currently in the Section 301 forced-labor matrix at the 10% combined cap.'
    }
  ];

  /*
   * Section 232 — Polysilicon and derivatives tariff
   * -------------------------------------------------
   * Signed: 2026-08-06. Effective: 2026-12-04 12:01 AM ET.
   * 15% ad valorem additional duty on imported polysilicon ingots
   * and derivatives (Annexes I & II), with Minimum Import Price floors.
   * Country carve-outs: JP, KR, TW, CH, LI, EU = S232 + Column 1 = 15% total;
   * UK = 10% additional.
   * Verified 2026-08-08 against White House proclamation, NYT, AAEI,
   * TaiyangNews, KPMG, GHY (7 sources, 26 verbatim quotes, HIGH confidence).
   * Replaces the Section 201 safeguard on solar cells/modules that expired
   * February 2026.
   *   Task body stated "$1/kg polysilicon floor" — CORRECTED to $21/kg per
   *   all 7 sources (proclamation §1(a)(i), KPMG, GHY). Brief typo.
   */
  var SECTION_232_POLYSILICON = {
    category: 'polysilicon',
    rate: 0.15,
    effective: '2026-12-04 12:01 AM ET',
    signature: '2026-08-06',
    authority: 'Section 232, Trade Expansion Act of 1962 (19 U.S.C. 1862)',
    scope: 'Polysilicon ingots and polysilicon derivatives (Annexes I & II)',
    mip_floors: {
      polysilicon:    { value: 21,    unit: 'USD/kg',  label: 'Polysilicon MIP floor: $21/kg' },
      ingot_wafer:    { value: 100,   unit: 'USD/kg',  label: 'Ingot/wafer MIP floor: $100/kg' },
      solar_cell:     { value: 0.22,  unit: 'USD/W',   label: 'Solar cell MIP floor: $0.22/W' },
      solar_module:   { value: 0.38,  unit: 'USD/W',   label: 'Solar module MIP floor: $0.38/W' }
    },
    // carve_outs: countries where the effective Section 232 additional is
    // capped so that Column 1 + Section 232 = 15% total (or 10% for UK).
    // For all OTHER countries: full 15% ad valorem additional.
    carve_outs: {
      combined_15: ['japan', 'south-korea', 'taiwan', 'switzerland', 'european-union'],
      uk_10: ['united-kingdom']
    },
    status: 'Signed August 6, 2026. Effective December 4, 2026, 12:01 a.m. ET. MIP certification required for first arm\'s-length U.S. sale at or above MIP. No MIP documentation → specific tariff equal to applicable MIP. Entered value below MIP → specific tariff equal to the difference. DOC onshoring program available (construction start by Jan 20, 2029).',
    source_citations: [
      'White House proclamation: Adjusting Imports of Polysilicon and its Derivatives (Aug 6, 2026)',
      'NYT: Trump Issues Tariffs on Key Ingredient for Electronics and Solar Panels (Aug 6, 2026)',
      'TaiyangNews: US Announces 15% Tariff On Imported Polysilicon Under Section 232',
      'KPMG TaxNewsFlash: US adopts minimum import prices, duties, and incentives for polysilicon',
      'GHY International: U.S. Imposes 15% Section 232 Tariff on Polysilicon and Its Derivatives',
      'AAEI Tariff Actions Timeline and Customs Service Messages',
      'White House Fact Sheet: Tariffs on Polysilicon and its Derivatives'
    ]
  };

  /*
   * USMCA status and Section 301 exemptions.
   */
  var USMCA = {
    exempt_from_301: ['canada', 'mexico'],
    status: 'Annual review (July 1 2026 renewal deadline passed). Interim arrangements targeted by end of 2026; US–Mexico round 4 in Washington in September. Automotive rules of origin unresolved.',
    notes: {
      canada: 'USMCA-qualified Canadian goods are EXEMPT from Section 301 (0% 301). Canada has a separate 10% Section 301 rate when NOT USMCA-qualified, plus the proposed 50% Section 338 (autos/alcohol/dairy) that applies regardless of USMCA status.',
      mexico: 'USMCA-qualified Mexican goods are EXEMPT from Section 301 (0% 301). Mexico has a separate 10% Section 301 rate when NOT USMCA-qualified.'
    }
  };

  var EXEMPTION_NOTES = {
    '232': 'Section 232-covered articles (steel, aluminum, copper, vehicles, wood, semiconductors) are exempt from Section 301 — no stacking.',
    pharma: 'Pharmaceuticals are exempt from Section 301 (Chapter 99 heading 9903.05.89).',
    aircraft: 'Civil aircraft parts are exempt (9903.05.88).',
    in_transit: 'Goods loaded before ' + EFFECTIVE_DATE + ' and entered before ' + IN_TRANSIT_END + ' are exempt from the new duty (in-transit exception).'
  };

  /*
   * Effective-rate computation used by the calculator AND tests.
   * @param countrySlug  e.g. 'vietnam'
   * @param category     e.g. 'electronics'
   * @param opts { usmcaQualified: bool (default true for CA/MX),
   *              includeProposed: bool (default false),
   *              asOfDate: Date|string (default today) — controls
   *                        Section 232 effective-date gating }
   * Returns { rate, breakdown: {...} } where rate is the estimated
   * effective duty rate (decimal).
   */
  function effectiveRate(countrySlug, category, opts) {
    opts = opts || {};
    var c = SECTION_301[countrySlug];
    var cat = CATEGORY_MODIFIERS[category];
    if (!c || !cat) return null;

    var mfn = MFN_EST[countrySlug] || 0.034;
    var categoryAdd = cat.add;
    var base = mfn + categoryAdd;

    // USMCA-qualified Canada/Mexico: Section 301 = 0
    var usmcaQualified = opts.usmcaQualified !== false &&
      USMCA.exempt_from_301.indexOf(countrySlug) !== -1;

    var s301Add = 0;
    if (!usmcaQualified) {
      if (c.type === 'flat') {
        s301Add = c.rate;
      } else if (c.type === 'mfn_cap') {
        s301Add = Math.max(0, c.cap - mfn);
      }
    }

    // Pre-existing China 301 stacks on top
    var chinaExisting = (countrySlug === 'china' && CHINA_301[category]) ? CHINA_301[category] : 0;

    // Proposed flags (not added unless requested)
    var proposedAdd = 0;
    if (opts.includeProposed) {
      PROPOSED_FLAGS.forEach(function (f) {
        if (f.country === countrySlug && (!f.categories || f.categories.indexOf(category) !== -1)) {
          proposedAdd += f.rate;
        }
      });
    }

    // Section 232 polysilicon — date-gated, effective 2026-12-04 12:01 AM ET
    var s232Add = 0;
    var s232Details = null;
    if (category === 'polysilicon') {
      var s232 = SECTION_232_POLYSILICON;
      var s232EffectiveDay = '2026-12-04';

      // Resolve asOfDate to an ISO date string for date-only comparison.
      // The tariff applies to the ENTIRE day of Dec 4, 2026 (any timezone).
      var qDateStr;
      if (opts.asOfDate) {
        qDateStr = String(opts.asOfDate).slice(0, 10);
      } else {
        qDateStr = new Date().toISOString().slice(0, 10); // today
      }
      var s232Applies = qDateStr >= s232EffectiveDay;

      if (s232Applies) {
        // Carve-out: combined_15 — S232 + Column 1 = 15% total
        if (s232.carve_outs.combined_15.indexOf(countrySlug) !== -1) {
          s232Add = Math.max(0, 0.15 - mfn);
        }
        // Carve-out: UK — 10% additional
        else if (s232.carve_outs.uk_10.indexOf(countrySlug) !== -1) {
          s232Add = 0.10;
        }
        // All other countries: full 15%
        else {
          s232Add = 0.15;
        }
      }

      s232Details = {
        applies: s232Applies,
        rate: s232Add,
        effective: s232.effective,
        askedDate: qDateStr,
        mip_floors: s232.mip_floors,
        scope: s232.scope,
        status: s232.status,
        source_citations: s232.source_citations
      };
    }

    var rate = base + s301Add + chinaExisting + proposedAdd + s232Add;
    rate = Math.min(rate, 0.60);

    return {
      rate: rate,
      breakdown: {
        mfn: mfn,
        categoryAdd: categoryAdd,
        section301: s301Add,
        chinaExisting301: chinaExisting,
        proposed: proposedAdd,
        usmcaQualified: usmcaQualified,
        type: c.type,
        cap: c.type === 'mfn_cap' ? c.cap : null,
        s232: s232Details
      }
    };
  }

  return {
    EFFECTIVE_DATE: EFFECTIVE_DATE,
    IN_TRANSIT_END: IN_TRANSIT_END,
    SECTION_301: SECTION_301,
    MFN_EST: MFN_EST,
    CATEGORY_MODIFIERS: CATEGORY_MODIFIERS,
    CHINA_301: CHINA_301,
    PROPOSED_FLAGS: PROPOSED_FLAGS,
    SECTION_232_POLYSILICON: SECTION_232_POLYSILICON,
    USMCA: USMCA,
    EXEMPTION_NOTES: EXEMPTION_NOTES,
    effectiveRate: effectiveRate
  };
}));
