/*
 * Tariff Calculator 2026 — canonical tariff data
 * -------------------------------------------------
 * Updated 2026-08-22: Canada Section 338 50% duty now IN EFFECT
 * (effective 12:01 a.m. EDT Sat Aug 22, 2026 on ~$20B of Canadian goods;
 * re-verified against parent datapack t_89767bbd — 12 sources incl.
 * official instruments: USTR statement, WH Fact Sheet, Proclamations
 * 11046/47/48, Aug 18 suspension proclamation, plus Al Jazeera, JPost/
 * Reuters, ZeroHedge, NPR, CBC, Guardian. Replaces the suspended
 * canada_s338 proposed flag with SECTION_338_CANADA + product scope
 * (hockey sticks, tongue depressors, cheeses, etc.) applied to covered
 * categories in the default rate. The rejected deal offer
 * (steel/aluminum 25%, autos 15%, lumber 10% eliminated) is NOT enacted
 * and lives in REJECTED_DEAL_PRESET as an alternate preset only.
 * Updated 2026-08-15: Section 232 UAS / drone tariff added
 * (100% Annex I / 25% Annex II + Annex III, effective 2026-09-03,
 * Annex III components 2027-02-09, allied 15%/10% carve-outs,
 * verified vs fact-sheet-drone-tariff-section-232.md, t_65e08fc6).
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
    polysilicon:  { add: 0,     name: 'Polysilicon & Solar (Section 232)' },
    drones:       { add: 0,     name: 'Drones / UAS (Unmanned Aircraft) — Section 232' },
    'ground-beef':{ add: 0,     name: 'Ground Beef — 90-Day Out-of-Quota Waiver (Aug 21, 2026)' },
    'canada-s338':{ add: 0,     name: 'Canada Section 338 Covered Goods — 50% Duty (effective Aug 22, 2026)' }
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
   * Proposed / threatened tariff flags (NOT in effect — shown as
   * warnings, not added to the rate).
   * NOTE: canada_s338 was REMOVED from this list on 2026-08-22 — the
   * Section 338 50% duty is now IN EFFECT and lives in SECTION_338_CANADA.
   * eu_dst: 25% Section 301 threatened over digital-services taxes,
   *   activation uncertain.
   */
  var PROPOSED_FLAGS = [
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
   * Section 232 — UAS / Drones tariff
   * -------------------------------------------------
   * Signed: 2026-08-13. Effective: 2026-09-03 12:01 AM ET (Annexes I & II),
   * 2027-02-09 12:01 AM ET (Annex III components).
   * 100% ad valorem on UAS > 25 kg MTOW, thermal-imaging UAS, UAS docking
   * stations, and Annex I critical components (HTS 9903.08.21).
   * 25% ad valorem on UAS <= 25 kg (no thermal imaging) (Annex II, 9903.08.22).
   * 25% ad valorem on certain additional UAS components (Annex III, 2027).
   * Allied carve-outs (origin-conditional): EU, JP, KR, TW, CH, LI total
   * (incl. Column 1) <= 15% (9903.08.24); UK <= 10% (9903.08.23).
   * Annex IV chapter 99 headings 9903.08.20-9903.08.26.
   * Verified 2026-08-15 against White House proclamation + 4 annex PDFs +
   * fact sheet, Bloomberg (swissinfo syndication), indoneo, KPMG, EY, BBC
   * (14 sources, fact-sheet-drone-tariff-section-232.md, t_65e08fc6).
   * NOTE: the "40+ transshipment countries" claim is NOT part of this
   * proclamation — it comes from the separate same-day White House report
   * "The Great Transshipment Scam" (Aug 13, 2026). Do not conflate.
   */
  var SECTION_232_UAS = {
    category: 'drones',
    authority: 'Section 232, Trade Expansion Act of 1962 (19 U.S.C. 1862)',
    effective_main: '2026-09-03 12:01 AM ET',
    effective_components: '2027-02-09 12:01 AM ET',
    signature: '2026-08-13',
    scope: 'Unmanned aircraft systems (UAS / drones) and UAS components',
    tiers: {
      annex_i:  { rate: 1.00, label: 'UAS >25 kg, thermal-imaging UAS, docking stations, Annex I critical components', heading: '9903.08.21', effective: '2026-09-03', applies_from: '2026-09-03' },
      annex_ii: { rate: 0.25, label: 'UAS <=25 kg (no thermal imaging)', heading: '9903.08.22', effective: '2026-09-03', applies_from: '2026-09-03' },
      annex_iii:{ rate: 0.25, label: 'Additional UAS components (Annex III)', heading: '9903.08.2x', effective: '2027-02-09', applies_from: '2027-02-09' }
    },
    // default tier used by the calculator when the importer does not
    // specify; heaviest exposure (100%) — Annex I.
    default_tier: 'annex_i',
    carve_outs: {
      // "substantially all" hardware/software/technology must originate in
      // these countries (or the US): total (incl. Column 1) <= 15%
      combined_15: ['japan', 'south-korea', 'taiwan', 'switzerland', 'european-union'],
      // UK: total (incl. Column 1) <= 10%
      uk_10: ['united-kingdom']
    },
    status: 'Signed August 13, 2026. Main duties (Annex I 100%, Annex II 25%) effective September 3, 2026 12:01 a.m. ET (21 days after signing). Annex III component duties (25%) effective February 9, 2027 (180 days after signing). Duties apply in addition to other duties, taxes, fees, exactions, and charges. Onshoring program available (construction committed before Jan 20, 2029); Blue UAS / FCC Conditional Approval products get the 180-day effective date; FTZ admissions must be privileged foreign status; drawback limited to Trade Agreement Partners with >=85% content.',
    source_citations: [
      'White House Proclamation: Adjusting Imports of Unmanned Aircraft Systems and UAS Components (Aug 13, 2026)',
      'White House Fact Sheet: Bolstering National Security and Strengthening U.S. Supply Chains by Imposing Tariffs on Drones and Their Parts and Components',
      'Proclamation Annex I (100% list) — HTS 8504.40.9580, 8537.10.9170, 8806.21-8806.99, 8807 parts',
      'Proclamation Annex II (25% UAS list) — HTS 8806.21.00-8806.93.00',
      'Proclamation Annex III (25% components, effective Feb 9 2027) — HTS 8807 series',
      'Proclamation Annex IV — HTS chapter 99 headings 9903.08.20-9903.08.26',
      'KPMG TaxNewsFlash: Section 232 tariffs on drones and components (Aug 14, 2026)',
      'EY Tax News 2026-1756: New Section 232 proclamation on drones and drone components',
      'Bloomberg via swissinfo.ch: Trump\'s 100% Tariff on Drones Deepens US-China Tech Decoupling'
    ]
  };

  /*
   * Ground beef — 90-day out-of-quota tariff waiver
   * -------------------------------------------------
   * Announced Friday morning, Aug 21, 2026 (Truth Social post, confirmed
   * by White House official): for the next 90 days the United States will
   * allow up to 300,000 metric tons of product for ground beef (lean beef
   * trimmings) to be imported with NO out-of-quota tariff, in exchange
   * for an exporter commitment to sell at 25% below current market prices.
   * Baseline TRQ mechanics (Additional US Note 3, Ch. 2 HTSUS): in-quota
   * imports face 4.4 cents/kg; imports above quota face a 26.4% tariff.
   * The out-of-quota duty is WAIVED under the deal (duty-free result);
   * whether the baseline 4.4-cent in-quota duty still applies was NOT
   * answered by officials (NY Post, Aug 21, 2026) — flagged as ambiguity.
   * Executive order to be signed within two weeks of announcement; no EO
   * text, HTS scope, country list, or claiming mechanics published as of
   * Aug 21, 2026. 90-day clock start (announcement vs. EO signature) not
   * yet specified — this model uses announcement date (Aug 21) as the
   * operative start and computes the window through Nov 19, 2026.
   * HTS precedent (Proclamation 11010, Feb 6, 2026): 0201.30.5091,
   * 0201.30.5097, 0202.30.5091, 0202.30.5097.
   * Price benchmarks (BLS via Al Jazeera; FRED via NY Post): ground beef
   * $5.55/lb Jan 2025 -> $6.89/lb July 2026 (+24% since Jan 2025, +10% YoY);
   * White House Feb 2026 fact sheet: $6.69/lb Dec 2025 (record since 1980s).
   * Verified 2026-08-21 against beef-tariff-waiver-brief.md (t_0d630218):
   * Politico, Al Jazeera, NY Post, CNBC, Bloomberg Tax wire, NYT,
   * Agri-Pulse, Axios, WH fact sheet, USTR TRQ notice, USDA AMS wk33, USMEF.
   */
  var GROUND_BEEF_WAIVER = {
    category: 'ground-beef',
    announced: '2026-08-21',
    duration_days: 90,
    window_start: '2026-08-21',
    window_end: '2026-11-19', // 90 days from announcement (Aug 21 + 90)
    volume_mt: 300000,
    volume_lb_approx: 661400000, // 300,000 MT x 2,204.62 lb/MT
    in_quota_rate: 0.044,        // USD/kg — 4.4 cents/kg (specific duty)
    out_quota_rate: 0.264,       // 26.4% ad valorem above quota
    target_discount: 0.25,       // exporter commitment: 25% below market
    retail_price: {
      jan_2025: 5.55,            // USD/lb — when Trump took office
      dec_2025: 6.69,            // USD/lb — record since 1980s (WH fact sheet)
      jul_2026: 6.89             // USD/lb — July 2026 avg (BLS via Al Jazeera / FRED via NY Post)
    },
    hts_precedent: ['0201.30.5091', '0201.30.5097', '0202.30.5091', '0202.30.5097'],
    eo_status: 'Executive order to be signed within two weeks of the Aug 21, 2026 announcement. No EO text, HTS scope, country list, or claiming mechanics published as of Aug 21, 2026.',
    baseline_duty_unanswered: true,
    status: 'Announced August 21, 2026. For the next 90 days, up to 300,000 metric tons of product for ground beef (lean beef trimmings) may be imported with NO out-of-quota tariff (normally 26.4%), in exchange for an exporter commitment that the beef is sold at 25% below current market prices. EO pending within two weeks; claiming mechanics unpublished. Whether the baseline 4.4-cent/kg in-quota duty still applies has not been answered.',
    source_citations: [
      'Politico: Trump pauses quota tariff on 300,000 tons of beef ahead of midterms (Aug 21, 2026)',
      'CNBC: Trump to allow import of 300,000 MT ground beef without tariff (Aug 21, 2026)',
      'Al Jazeera: Trump waives out-of-quota beef tariffs for 90 days to lower prices (Aug 21, 2026)',
      'NY Post: Trump lifts tariffs on 300K tons of ground beef, commits to 25% price drop (Aug 21, 2026)',
      'Bloomberg News wire via Bloomberg Tax: Tariff Relief for Some Ground Beef Imports (Aug 21, 2026)',
      'NYT: Trump Announces Move to Lift Ground Beef Tariffs in Bid to Lower Prices (Aug 21, 2026)',
      'Agri-Pulse: Trump to lift beef tariffs within two weeks (Aug 21, 2026)',
      'Axios: Trump authorizes more beef imports in effort to lower prices (Aug 21, 2026)',
      'White House fact sheet: Ensuring Affordable Beef for the American Consumer (Feb 6, 2026)',
      'USTR: Modification of the Allocation of the WTO TRQ Volumes for Beef (Dec 31, 2025, 90 FR 61497)',
      'Proclamation 11010: Ensuring Affordable Beef for the American Consumer (Feb 6, 2026, FR 2026-03050)',
      'USDA AMS: Imported Meat Passed for Entry in the U.S. by Country, Week 33 2026'
    ]
  };

  /*
   * Canada — Section 338 50% additional duty (IN EFFECT Aug 22, 2026)
   * -------------------------------------------------
   * First-ever use of Section 338 of the Tariff Act of 1930 (Smoot-Hawley).
   * Three presidential proclamations signed July 20, 2026; the original
   * Aug 19 start was suspended Aug 18 for 3 days while U.S.–Canada deal
   * talks ran; talks failed Aug 19–21 and the 50% additional duty took
   * effect Saturday, Aug 22, 2026 at 12:01 a.m. EDT (04:01 GMT) on roughly
   * $20B of Canadian goods (~5% of Canada's annual exports to the US).
   * Applies regardless of USMCA/CUSMA origin. Exceptions: energy products,
   * potash, fish, critical minerals, items already under Section 232.
   * Pre-existing steel/lumber/auto tariffs remain in force and stack.
   * Canada's response: dollar-for-dollar retaliation starting Sept 8, 2026
   * (US steel, dairy, appliances, ag machinery, paper, electronics).
   * Re-verified 2026-08-22 against parent datapack t_89767bbd (12 sources,
   * 26 verbatim quotes, 6 official instruments; verify --strict GREEN 56%).
   * The rejected deal offer (steel/aluminum 25%, autos 15%, lumber 10%
   * eliminated) is NOT enacted — see REJECTED_DEAL_PRESET below.
   */
  var SECTION_338_CANADA = {
    category: 'canada-s338',
    rate: 0.50,
    effective: '2026-08-22 12:01 AM ET',
    effective_gmt: '04:01 GMT',
    authority: 'Section 338, Tariff Act of 1930 (19 U.S.C. 1338) — first-ever use',
    instrument: '3 presidential proclamations signed July 20, 2026 (11046 alcohol, 11047 dairy, 11048 motor vehicles); original Aug 19 start suspended 3 days by Aug 18 proclamation → effective Aug 22',
    value_affected: '~$20 billion of Canadian goods (~5% of Canada\'s annual exports to the US)',
    applies_to_cusma_goods: true,
    // Calculator categories treated as covered for Canada. 'auto' and
    // 'food' preserve the original proposed-flag scope (motor vehicles,
    // alcoholic beverages, dairy); 'canada-s338' is the dedicated
    // product-level covered-goods category (hockey sticks, tongue
    // depressors, and the full Guardian/USTR inventory below).
    covered_categories: ['auto', 'food', 'canada-s338'],
    exceptions: ['energy products', 'potash', 'fish', 'critical minerals', 'items already under Section 232'],
    pre_existing_stack: ['steel', 'lumber', 'autos'],
    // Granular product scope — compiled from The Guardian's full category
    // inventory (Aug 22, 2026) + AP's "hockey sticks to tongue depressors"
    // framing + USTR statement shorthand (wine, hockey sticks, cement,
    // dairy, swimming pools, furniture, fishing rods, seeds, clothing, wigs).
    product_scope: {
      ap_framing: 'products ranging from hockey sticks to tongue depressors',
      dairy: ['cheeses of all types', 'milk and cream', 'whey and milk protein concentrates', 'bones and horn-cones', 'lactose', 'glucose', 'fructose and blended syrups', 'sugars', 'cane molasses', 'non-alcoholic beer', 'essential oils of peppermint'],
      alcohol: ['beer', 'wine', 'liquor', 'cider', 'other fermented beverages'],
      wood_hockey: ['essential oils of grapefruit', 'densified wood blocks', 'plates', 'strips', 'skewers', 'ice cream sticks', 'bamboo products', 'basketwork', 'grease-proof paper', 'ice hockey equipment', 'field hockey equipment', 'wooden ice hockey sticks'],
      natural_plant: ['natural honey', 'down feathers', 'tortoise shell', 'whalebone', 'horns', 'antlers', 'tulips and dormant flower buds', 'live orchids', 'mushroom spawn', 'tubers', 'mosses', 'lichen', 'vegetable/tree/shrub seeds'],
      misc_consumer: ['cements', 'candles', 'plastic furniture fittings', 'dog leashes', 'saddles', 'T-shirts', 'sweaters', 'trousers', 'dresses', 'wigs', 'false beards', 'eyebrows of synthetic material', 'floating docks', 'vessels', 'rafts', 'chandeliers', 'Christmas and festival decorations', 'ice skates', 'swimming pools', 'wading pools', 'fishing rods'],
      medical_wood: ['tongue depressors']
    },
    hs_note: 'No HS/HTS codes enumerated in Reuters, Al Jazeera, DW, or The Guardian coverage. Official line-level HTS list lives in the three July 20, 2026 Section 338 proclamations / USTR statement PDF.',
    status: 'IN EFFECT — the 50% additional duty took effect Saturday, Aug 22, 2026 at 12:01 a.m. EDT (04:01 GMT) after U.S.–Canada talks failed to finalize a deal. USTR Jamieson Greer: "Tonight, Canada declined to finalize the trade deal under the terms agreed earlier this week." Canada said it will match tariffs dollar for dollar starting Sept 8, 2026 (US steel, dairy, appliances, agricultural machinery, paper, electronics).',
    source_citations: [
      'USTR: Ambassador Greer Issues Statement on President Trump Imposing Section 338 Tariffs on Canada (Jul 20, 2026) — https://ustr.gov/about/policy-offices/press-office/press-releases/2026/july/ambassador-greer-issues-statement-president-trump-imposing-section-338-tariffs-canada',
      'White House Fact Sheet: Trump Imposes Additional Tariffs on Canada (Jul 20, 2026) — https://www.whitehouse.gov/fact-sheets/2026/07/fact-sheet-president-donald-j-trump-imposes-additional-tariffs-on-canada/',
      'WH Proclamation 11048 (motor vehicles, Annex II) — https://www.whitehouse.gov/presidential-actions/2026/07/imposing-additional-duties-to-offset-canadian-discrimination-against-the-commerce-of-the-united-states-with-respect-to-motor-vehicles/',
      'WH Proclamation 11046 (alcoholic beverages) — https://www.whitehouse.gov/presidential-actions/2026/07/imposing-additional-duties-to-offset-canadian-discrimination-against-the-commerce-of-the-united-states-with-respect-to-alcoholic-beverages/',
      'WH Proclamation 11047 (dairy) — https://www.whitehouse.gov/presidential-actions/2026/07/imposing-additional-duties-to-offset-canadian-discrimination-against-the-commerce-of-the-united-states-with-respect-to-dairy/',
      'WH Proclamation: Temporary Suspension of Additional Duties (Aug 18, 2026) — effective date moved to Aug 22 — https://www.whitehouse.gov/presidential-actions/2026/08/temporary-suspension-of-additional-duties-to-offset-canadian-discrimination-against-the-commerce-of-the-united-states-with-respect-to-alcoholic-beverages-dairy-and-motor-vehicles/',
      'Al Jazeera: US imposes 50% tariffs on $20bn worth of Canadian goods after talks fail (Aug 22, 2026) — https://www.aljazeera.com/news/2026/8/22/us-imposes-50-tariffs-on-20bn-worth-of-canadian-goods-after-talks-fail',
      'Jerusalem Post / Reuters: US imposes 50% tariffs on Canadian goods after deal fails (Aug 22, 2026) — https://www.jpost.com/international/article-906250',
      'ZeroHedge: Canada-US Trade War Erupts, Setting New 50% Tariffs On Canadian Goods (Aug 22, 2026) — rejected-offer rates 25/15/10 — https://www.zerohedge.com/political/canada-us-trade-war-erupts-setting-new-50-tariffs-canadian-goods',
      'NPR: U.S.-Canada trade talks collapse (Aug 22, 2026) — https://www.npr.org/2026/08/22/nx-s1-5941584/us-canada-tariffs',
      'CBC: American tariffs on Canadian goods take effect after trade talks fall apart (Aug 22, 2026) — https://www.cbc.ca/news/canada/canada-us-tariffs-trump-imposes-new-50-per-cent-levy-on-canadian-goods-august-22-9.7311417',
      'The Guardian: Canada vows dollar for dollar response as US puts 50% tariffs on some goods (Aug 22, 2026) — https://www.theguardian.com/world/2026/aug/22/canada-tariffs-trump-trade-deal-talks-fail'
    ]
  };

  /*
   * REJECTED_DEAL_PRESET — alternate preset, NOT enacted.
   * -------------------------------------------------
   * The deal Canada declined on Aug 21, 2026 would have REDUCED US tariffs:
   *   - Steel & aluminum: cut to 25% (from pre-existing Section 232 duties)
   *   - Automotive duties: lowered to 15%
   *   - Lumber 10% levy: ELIMINATED
   * These figures appear in the parent datapack (t_89767bbd) table 2 as the
   * REJECTED offer — Guardian: Greer offered "significant tariff reductions
   * on steel, aluminum, autos, and lumber"; ZeroHedge gives the exact
   * 25%/15%/eliminated figures. The enacted outcome is the 50% Section 338
   * levy (SECTION_338_CANADA) — the deal rates are NOT in force, were NEVER
   * in force, and must not be presented as enacted. They are exposed here
   * as an alternate "what-if" preset for modeling only.
   */
  var REJECTED_DEAL_PRESET = {
    key: 'us_canada_deal_offer_2026',
    label: 'Rejected US–Canada deal offer (Aug 2026) — what-if, NOT enacted',
    not_enacted: true,
    rejected_date: '2026-08-21',
    rejected_by: 'Canada (Carney: terms "unfair, uneconomic"; talks suspended; negotiators recalled to Ottawa)',
    outcome: 'Deal rejected → Section 338 50% additional duty took effect Aug 22, 2026 instead (see SECTION_338_CANADA)',
    changes: [
      { measure: 'Steel & aluminum', proposed_rate: 0.25, baseline: 'Pre-existing Section 232 duties (CBC: 50% steel/aluminum)', note: 'Would have been REDUCED to 25%' },
      { measure: 'Automotive duties', proposed_rate: 0.15, baseline: 'Pre-existing Section 232 auto duties', note: 'Would have been lowered to 15%' },
      { measure: 'Lumber levy', proposed_rate: 0.00, baseline: '10% pre-existing levy (Section 232)', note: 'Would have been ELIMINATED' }
    ],
    effectiveRateIfEnacted: function (countrySlug, category, opts) {
      // What-if helper: returns the rate the calculator would compute with
      // the deal offer applied (steel/aluminum 25%, autos 15%, lumber 0%)
      // INSTEAD of the pre-existing Section 232 baselines. Pure modeling —
      // never used by the live calculator.
      if (countrySlug !== 'canada') return null;
      var base = effectiveRate(countrySlug, category, opts);
      if (!base) return null;
      var presetRate = null;
      if (category === 'steel' || category === 'ceramics') presetRate = 0.25;
      else if (category === 'auto') presetRate = 0.15;
      else if (category === 'paper') presetRate = 0.00;
      return {
        preset: presetRate,
        liveRate: base.rate,
        not_enacted: true,
        note: 'Modeled rate if the rejected deal had been accepted — NOT in force'
      };
    },
    source_citations: [
      'ZeroHedge: "The proposed US-Canada trade deal would have reduced US tariffs on Canadian steel and aluminum to 25%, lowered automotive duties to 15%, and eliminated a 10% levy on lumber." — https://www.zerohedge.com/political/canada-us-trade-war-erupts-setting-new-50-tariffs-canadian-goods',
      'The Guardian: Greer offering "significant tariff reductions on steel, aluminum, autos, and lumber" — https://www.theguardian.com/world/2026/aug/22/canada-tariffs-trump-trade-deal-talks-fail',
      'USTR statement (Greer): "Canada declined to finalize the trade deal under the terms agreed earlier this week" — https://ustr.gov/about/policy-offices/press-office/press-releases/2026/july/ambassador-greer-issues-statement-president-trump-imposing-section-338-tariffs-canada'
    ]
  };

  /*
   * Covered product keywords (lowercase) for the Canada Section 338 duty —
   * used for product-name lookup and QA sample checks. Compiled from the
   * Guardian category inventory + AP "hockey sticks to tongue depressors"
   * framing + USTR statement shorthand.
   */
  var PRODUCT_SCOPE = [
    'hockey stick', 'hockey sticks', 'wooden ice hockey stick', 'ice hockey', 'field hockey',
    'tongue depressor', 'tongue depressors',
    'milk', 'cream', 'cheese', 'cheeses', 'whey', 'milk protein concentrate', 'lactose', 'glucose', 'fructose',
    'blended syrup', 'sugar', 'cane molasses', 'non-alcoholic beer', 'essential oil of peppermint',
    'beer', 'wine', 'liquor', 'whisky', 'whiskey', 'cider', 'fermented beverage',
    'essential oil of grapefruit', 'densified wood', 'wood block', 'wood strip', 'skewer',
    'ice cream stick', 'bamboo', 'basketwork', 'grease-proof paper',
    'honey', 'down feather', 'tortoise shell', 'whalebone', 'horn', 'antler',
    'tulip', 'flower bud', 'orchid', 'mushroom spawn', 'tuber', 'moss', 'lichen', 'seed',
    'cement', 'candle', 'plastic furniture fitting', 'dog leash', 'saddle',
    't-shirt', 'sweater', 'trouser', 'dress', 'wig', 'false beard', 'eyebrow of synthetic material',
    'floating dock', 'vessel', 'raft', 'chandelier', 'christmas decoration', 'festival decoration',
    'ice skate', 'swimming pool', 'wading pool', 'fishing rod'
  ];

  /*
   * USMCA status and Section 301 exemptions.
   */
  var USMCA = {
    exempt_from_301: ['canada', 'mexico'],
    status: 'Annual review (July 1 2026 renewal deadline passed). Interim arrangements targeted by end of 2026; US–Mexico round 4 in Washington in September. Automotive rules of origin unresolved.',
    notes: {
      canada: 'USMCA-qualified Canadian goods are EXEMPT from Section 301 (0% 301). Canada has a separate 10% Section 301 rate when NOT USMCA-qualified, plus the 50% Section 338 (autos/alcohol/dairy) — IN EFFECT since Aug 22, 2026 — that applies regardless of USMCA status.',
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
    // Section 232-covered articles (incl. UAS/drones) are exempt from
    // Section 301 — no stacking (EXEMPTION_NOTES['232']).
    if (!usmcaQualified && category !== 'drones') {
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

    // Section 232 UAS / drones — date-gated, effective 2026-09-03 (main)
    // and 2027-02-09 (Annex III components). Tier is selectable via
    // opts.droneTier ('annex_i' | 'annex_ii' | 'annex_iii'), default Annex I.
    // Allied carve-outs cap the TOTAL rate (incl. Column 1): EU/JP/KR/TW/CH
    // <= 15%, UK <= 10% — origin-conditional ("substantially all" components
    // and tech certified to originate there or in the US).
    var droneAdd = 0;
    var droneDetails = null;
    if (category === 'drones') {
      var uas = SECTION_232_UAS;
      var tierKey = opts.droneTier && uas.tiers[opts.droneTier] ? opts.droneTier : uas.default_tier;
      var tier = uas.tiers[tierKey];

      var droneQDateStr;
      if (opts.asOfDate) {
        droneQDateStr = String(opts.asOfDate).slice(0, 10);
      } else {
        droneQDateStr = new Date().toISOString().slice(0, 10);
      }
      var droneApplies = droneQDateStr >= tier.applies_from;

      if (droneApplies) {
        if (uas.carve_outs.combined_15.indexOf(countrySlug) !== -1) {
          // total (incl. Column 1) <= 15%
          droneAdd = Math.max(0, 0.15 - mfn - categoryAdd);
        } else if (uas.carve_outs.uk_10.indexOf(countrySlug) !== -1) {
          // total (incl. Column 1) <= 10%
          droneAdd = Math.max(0, 0.10 - mfn - categoryAdd);
        } else {
          droneAdd = tier.rate;
        }
      }

      droneDetails = {
        applies: droneApplies,
        tier: tierKey,
        tierLabel: tier.label,
        rate: droneAdd,
        baseRate: tier.rate,
        heading: tier.heading,
        effective: tier.effective,
        askedDate: droneQDateStr,
        scope: uas.scope,
        authority: uas.authority,
        status: uas.status,
        source_citations: uas.source_citations,
        carve_out: uas.carve_outs.combined_15.indexOf(countrySlug) !== -1 ? 'combined_15'
          : (uas.carve_outs.uk_10.indexOf(countrySlug) !== -1 ? 'uk_10' : null)
      };
    }

    // Ground beef — 90-day out-of-quota tariff waiver (announced Aug 21, 2026).
    // Date-gated on the 90-day window. Under the cap and inside the window
    // the out-of-quota duty (normally 26.4%) is WAIVED -> duty-free rate 0.
    // Outside the window the out-of-quota rate applies.
    var beefAdd = 0;
    var beefDetails = null;
    if (category === 'ground-beef') {
      var gw = GROUND_BEEF_WAIVER;

      var beefQDateStr;
      if (opts.asOfDate) {
        beefQDateStr = String(opts.asOfDate).slice(0, 10);
      } else {
        beefQDateStr = new Date().toISOString().slice(0, 10); // today
      }
      var beefApplies = beefQDateStr >= gw.window_start && beefQDateStr <= gw.window_end;

      if (beefApplies) {
        beefAdd = 0; // out-of-quota tariff waived — duty-free under the cap
      } else {
        beefAdd = gw.out_quota_rate; // 26.4% out-of-quota rate applies
      }

      beefDetails = {
        applies: beefApplies,
        rate: beefAdd,
        waived: beefApplies,
        askedDate: beefQDateStr,
        windowStart: gw.window_start,
        windowEnd: gw.window_end,
        durationDays: gw.duration_days,
        announced: gw.announced,
        volumeMt: gw.volume_mt,
        volumeLbApprox: gw.volume_lb_approx,
        inQuotaRate: gw.in_quota_rate,
        outQuotaRate: gw.out_quota_rate,
        targetDiscount: gw.target_discount,
        retailPrice: gw.retail_price,
        htsPrecedent: gw.hts_precedent,
        eoStatus: gw.eo_status,
        baselineDutyUnanswered: gw.baseline_duty_unanswered,
        status: gw.status,
        source_citations: gw.source_citations
      };
    }

    // Canada Section 338 — 50% additional duty on covered goods.
    // Effective 2026-08-22 12:01 AM ET (04:01 GMT). Applies regardless of
    // USMCA/CUSMA origin (no USMCA exemption). Date-gated: before Aug 22
    // the duty is not in effect. Covered categories: auto, food, and the
    // dedicated 'canada-s338' product-level category.
    var s338Add = 0;
    var s338Details = null;
    if (countrySlug === 'canada' && SECTION_338_CANADA.covered_categories.indexOf(category) !== -1) {
      var s338QDateStr;
      if (opts.asOfDate) {
        s338QDateStr = String(opts.asOfDate).slice(0, 10);
      } else {
        s338QDateStr = new Date().toISOString().slice(0, 10); // today
      }
      var s338Applies = s338QDateStr >= '2026-08-22';
      if (s338Applies) {
        s338Add = SECTION_338_CANADA.rate;
      }
      s338Details = {
        applies: s338Applies,
        rate: s338Add,
        baseRate: SECTION_338_CANADA.rate,
        effective: SECTION_338_CANADA.effective,
        effectiveGmt: SECTION_338_CANADA.effective_gmt,
        askedDate: s338QDateStr,
        authority: SECTION_338_CANADA.authority,
        valueAffected: SECTION_338_CANADA.value_affected,
        appliesToCusmaGoods: SECTION_338_CANADA.applies_to_cusma_goods,
        exceptions: SECTION_338_CANADA.exceptions,
        preExistingStack: SECTION_338_CANADA.pre_existing_stack,
        productScope: SECTION_338_CANADA.product_scope,
        status: SECTION_338_CANADA.status,
        source_citations: SECTION_338_CANADA.source_citations
      };
    }

    var rate;
    if (category === 'ground-beef') {
      // TRQ-governed product: generic MFN/category base does not apply.
      // The effective rate IS the beef component: 0 under the 90-day waiver
      // (out-of-quota tariff waived), else the 26.4% out-of-quota rate.
      rate = beefAdd;
    } else {
      rate = base + s301Add + chinaExisting + proposedAdd + s232Add + droneAdd + beefAdd + s338Add;
    }
    // Section 232 drone tariffs legitimately exceed 60% (100% Annex I tier),
    // and Canada Section 338 covered goods stack +50% on top of base duties
    // (e.g. non-USMCA Canada: base + 10% S301 + 50% S338 can exceed 60%),
    // so the safety clamp is raised for those categories only.
    var highCap = category === 'drones' ||
      (countrySlug === 'canada' && SECTION_338_CANADA.covered_categories.indexOf(category) !== -1);
    rate = Math.min(rate, highCap ? 1.50 : 0.60);

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
        s232: s232Details,
        drone: droneDetails,
        beef: beefDetails,
        s338: s338Details
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
    SECTION_232_UAS: SECTION_232_UAS,
    GROUND_BEEF_WAIVER: GROUND_BEEF_WAIVER,
    SECTION_338_CANADA: SECTION_338_CANADA,
    REJECTED_DEAL_PRESET: REJECTED_DEAL_PRESET,
    PRODUCT_SCOPE: PRODUCT_SCOPE,
    USMCA: USMCA,
    EXEMPTION_NOTES: EXEMPTION_NOTES,
    effectiveRate: effectiveRate
  };
}));
