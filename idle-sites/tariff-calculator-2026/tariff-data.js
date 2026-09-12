/*
 * Tariff Calculator 2026 — canonical tariff data
 * -------------------------------------------------
 * Updated 2026-09-03 (t_a836cab0): Drone / UAS preset upgraded to the
 * Sept 3, 2026 effective-date model from the Task 0 rule spec
 * (drone-tariff-calculator-rule-spec.md, t_1151b7ec): the drone tier is
 * now DERIVED from product attributes instead of a manual Annex tier pick.
 * New opts for effectiveRate('…', 'drones', …):
 *   droneThermal (true/false) — thermal-imaging capability flag
 *   droneHeavy   (true/false) — MTOW > 25 kg (~55 lb) flag
 *   blueUas      (true/false) — supplier on DoD Blue UAS Cleared List /
 *                               Blue UAS Framework / FCC Conditional
 *                               Approval List as of Sept 2, 2026
 * Truth table (finished drone, Section 232 ad valorem):
 *   China/other + thermal OR >25 kg            = 100% from Sept 3, 2026
 *   China/other + non-thermal AND <=25 kg      = 25%  from Sept 3, 2026
 *   Blue UAS-listed (as of Sept 2, 2026)       = 0% deferred until
 *                                                Feb 9, 2027, then full
 *   Allied (EU/JP/KR/TW/CH/LI)                 = total duty cap <=15%
 *                                                incl Column 1 (origin-
 *                                                conditional); UK <=10%
 *   Entry before Sept 3, 2026                  = not subject
 * Legacy opts.droneTier ('annex_i'|'annex_ii'|'annex_iii') still works
 * for callers that pass it explicitly (tests, older article pages).
 * Updated 2026-08-31 (t_6d585b6a): CANADA_RETALIATION now resolves from
 * the configurable preset data file presets/canada-sept8-counter-tariffs.js
 * (window.CANADA_SEPT8_PRESET / require()) — a future trade deal is a
 * data-file edit, no logic changes. Data corrected to the VERIFIED
 * 629-item list (dataset t_d98a84da, revised Aug 26 from 874; 413 at
 * 50%, 195 at 25%, 21 at 15%). CRITICAL: autos are NOT on the Sept 8
 * list (separate existing 25% order) — 'auto' removed from the
 * retaliation category map; fish/seafood removed in the Aug 26 revision
 * — 'food' now resolves to 50% (bakery/malt + honey). Representative
 * products re-verified against the official 629-item CSV. Aug 22 S338
 * preset unchanged.
 * Updated 2026-08-28 (t_60875ef4): BRAZIL_301 layer added — the 25%
 * Section 301 additional duty on most Brazilian goods (HTS 9903.05.01,
 * effective July 22, 2026; verified research brief t_c288793e), with the
 * 1,600+ exempt HTS subheadings (~1,200 standard + ~430 civil-aircraft
 * lines), Section 232 non-stacking (9903.05.07), pharma (9903.05.06) and
 * aircraft (9903.05.05) carve-outs, the 12.5% forced-labor stack (up to
 * 37.5% combined per PIIE), and post-consultation what-if scenarios
 * (opts.brazilScenario: current / reduced_20 / reduced_15 / reduced_10 /
 * removed — modeling only, NOT in effect). Brazil's existing 12.5%
 * forced-labor rate (9903.05.27) is unchanged.
 * Updated 2026-08-25 (t_ceb6a59f): CANADA_RETALIATION upgraded to the
 * CONFIRMED Finance Canada measures (announced Aug 25, 2026) — three
 * counter-tariff tiers (15/25/50%, rate for rate matching the US rate)
 * on C$27.6B of US imports, effective Sept 8, 2026 12:01 a.m. ET;
 * official 874-item list (404 at 50%, 449 at 25%, 21 at 15%); origin
 * rule (US-origin only) + in-transit carve-out; per-category tier map
 * and representative HS-level products for the calculator. Supersedes
 * the Aug 23 flat-50% six-sector estimate (research brief t_8153278d).
 * Updated 2026-08-24 (t_bf150bb5): S338 covered-categories now match the
 * three official proclamation baskets — alcohol (HTS 9903.03.12, 61 codes),
 * dairy (9903.03.13, 52 codes), motor vehicles (9903.03.14, 456 codes) =
 * 569 HTSUS subheadings (Chicago Fed verified). New 'alcohol' category;
 * 'dairy' added to covered list. canada_auto_50 threatened flag extended
 * to steel (Jan 1, 2027: cars, trucks, auto parts AND steel to 50%).
 * New TRUCKING_IMPACT layer for the 'tariff cost per truckload' angle.
 * Updated 2026-08-24: canada_auto_50 THREATENED flag added — President
 * Trump threatened (Mon Aug 24, 2026) to raise US tariffs on Canadian
 * cars, trucks & auto parts from the current ~25% to 50%, proposed
 * effective 2027-01-01. NOT in effect — modeled as a PROPOSED_FLAGS
 * entry (category 'auto', country 'canada') so default calculations
 * stay unchanged unless the user selects the threatened scenario.
 * Sources: CNN, CNBC, CP24 (Aug 24, 2026 — all verified HTTP 200).
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
    'ground-beef':{ add: 0,     name: 'Ground Beef — Proclamation 11059 Beef TRQ Increase (Sept–Nov 2026)' },
    'canada-s338':{ add: 0,     name: 'Canada Section 338 Covered Goods — 50% Duty (in effect Aug 22, 2026; scope change Sept 15, 2026; import bans Sept 29, 2026)' },
    dairy:        { add: 0.046, name: 'Dairy Products' },
    alcohol:      { add: 0.046, name: 'Alcoholic Beverages' },
    'household-appliances': { add: 0.027, name: 'Household Appliances' },
    'farming-equipment': { add: 0.014, name: 'Farming & Agricultural Equipment' },
    'pulp-paper':  { add: 0.010, name: 'Pulp & Paper' }
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
   * canada_auto_50 ADDED 2026-08-24 — President Trump threatened to
   * raise the US auto tariff on Canadian cars, trucks & auto parts from
   * the current ~25% to 50%, proposed effective 2027-01-01 (NOT in
   * effect). Sources: CNN, CNBC, CP24 (Aug 24, 2026).
   * eu_dst: 25% Section 301 threatened over digital-services taxes,
   *   activation uncertain.
   */
  var PROPOSED_FLAGS = [
    {
      key: 'canada_auto_50',
      country: 'canada',
      label: '50% tariff on Canadian cars, trucks, auto parts & steel (threatened)',
      rate: 0.50,
      categories: ['auto', 'steel'],
      effective: '2027-01-01',
      status: 'threatened',
      note: 'Threatened by President Trump on Aug 24, 2026 — NOT in effect. Would raise the current ~25% auto tariff on Canadian-built vehicles and auto parts to 50% and lock steel at 50%, proposed effective January 1, 2027. Sources: CNBC (trump-canada-auto-tariffs-trade-war.html), CBS News (trump-canadian-automotive-steel-tariffs), POLITICO — Aug 24, 2026.'
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
    // Blue UAS / FCC Conditional Approval deferral (Proclamation §7) —
    // companies listed AS OF Sept 2, 2026 get the effective date moved to
    // Feb 9, 2027 for the listed covered products and components; the full
    // rate applies after that date. Allies are NOT deferred (see carve_outs).
    blue_uas_deferral: {
      list_reference_date: '2026-09-02',
      deferral_ends: '2027-02-09',
      label: 'DoD Blue UAS Cleared List / Blue UAS Framework / FCC Conditional Approval List (as of Sept 2, 2026)'
    },
    // Finished-drone tier derivation from product attributes (thermal
    // imaging + MTOW), matching Proclamation §1(a)/§1(b).
    attr_model: {
      thermal_flag_rate_tier: 'annex_i',   // thermal imaging at ANY weight → 100%
      heavy_flag_rate_tier: 'annex_i',     // MTOW > 25 kg (~55 lb) → 100%
      standard_flag_rate_tier: 'annex_ii'  // non-thermal, <=25 kg → 25%
    },
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
   * Ground beef — Proclamation 11059 beef TRQ increase (IN FORCE)
   * -------------------------------------------------------------
   * Announced Friday morning, Aug 21, 2026 (Truth Social post, confirmed
   * by a White House official): up to 300,000 metric tons of product for
   * ground beef (lean beef trimmings) would enter without the out-of-quota
   * tariff, with a 25% below-market price expectation.
   * What actually issued is the instrument of record: PROCLAMATION 11059
   * of August 26, 2026 ("Further Ensuring Affordable Beef for the American
   * Consumer"), published in the Federal Register 2026-08-31 at 91 FR 55989
   * (FR Doc. 2026-17842). It is a proclamation, NOT the executive order the
   * Aug 21 announcement described.
   * Mechanism: for calendar year 2026 the aggregate IN-QUOTA quantity for
   * lean beef trimmings (Additional U.S. Note 3, Ch. 2 HTSUS) is increased
   * by 300,000 mt, administered first come, first served in three 30-day
   * tranches — 100,000 mt Sept 1-30, 100,000 mt Oct 1-30, and 100,000 mt
   * Oct 31-Nov 30, 2026 or until filled, whichever is earlier.
   * Duty treatment (clause 5): the added tonnage enters subject to the
   * IN-QUOTA RATE OF DUTY (4.4 cents/kg for HTSUS 0201.30.50/0202.30.50,
   * Col. 1 general — verified against the USITC HTS API 2026-09-10), so the
   * relief is NOT duty-free: what the covered entries avoid is the 26.4%
   * out-of-quota rate. The Aug 21 "does the 4.4c/kg still apply?" question
   * is therefore ANSWERED (yes).
   * Allocation (clause 4): the entire additional quantity goes to "other
   * countries or areas"; the Proclamation 11010 Argentina increase of
   * 80,000 mt is unaffected (clause 8).
   * 25% discount (clause 6(b)): USDA + USTR must monitor whether imports
   * entered under the added in-quota quantity are sold at 25% below the
   * market price for lean beef trimmings; if not, they notify the President,
   * who may eliminate what remains. Benchmark = trimmings, not retail.
   * Covered HTS lines (clause 2 — scope, not precedent): 0201.30.5091,
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
    announced: '2026-08-21',     // Truth Social post (history; superseded by the proclamation)
    instrument: 'Proclamation 11059 of August 26, 2026 — "Further Ensuring Affordable Beef for the American Consumer"',
    instrument_type: 'Presidential proclamation (not an executive order)',
    signed: '2026-08-26',
    published: '2026-08-31',
    federal_register: '91 FR 55989 (FR Doc. 2026-17842)',
    authority: 'Section 404(b) of the Uruguay Round Agreements Act (19 U.S.C. 3601(b)); 19 U.S.C. 3601(a) and (d)(3); Section 604 of the Trade Act of 1974 (19 U.S.C. 2483); 3 U.S.C. 301. HTSUS modified per the Annex; USTR may make further technical/ministerial corrections by Federal Register notice (clause 5(b)).',
    duration_days: 91,           // Sept 1 - Nov 30, 2026 inclusive (three 30-day tranches)
    window_start: '2026-09-01',
    window_end: '2026-11-30',
    // Clause 3: 300,000 mt, first come first served, three 30-day tranches.
    tranches: [
      { n: 1, mt: 100000, opens: '2026-09-01', closes: '2026-09-30' },
      { n: 2, mt: 100000, opens: '2026-10-01', closes: '2026-10-30' },
      { n: 3, mt: 100000, opens: '2026-10-31', closes: '2026-11-30', note: 'open until the added quantity is filled or Nov 30, 2026, whichever is earlier' }
    ],
    administration: 'first come, first served; CBP administers the added in-quota quantity and must ensure all eligible countries have full access (clause 5(c))',
    allocation: 'the entire additional 300,000 mt is allocated to "other countries or areas" (clause 4); the Proclamation 11010 Argentina increase of 80,000 mt is unaffected (clause 8)',
    volume_mt: 300000,
    volume_lb_approx: 661400000, // 300,000 MT x 2,204.62 lb/MT
    in_quota_rate: 0.044,        // USD/kg — 4.4 cents/kg (specific duty; HTSUS 0201.30.50 / 0202.30.50 Col. 1 general)
    out_quota_rate: 0.264,       // 26.4% ad valorem above quota
    in_quota_rate_applies: true, // clause 5: the added tonnage is subject to the IN-QUOTA rate of duty
    duty_free: false,            // the relief avoids the 26.4% out-of-quota rate; it is not duty-free
    target_discount: 0.25,       // monitored condition (clause 6(b)) — not an exporter price guarantee
    discount_mechanism: 'The Secretary of Agriculture and the USTR shall monitor whether imports entered under the added in-quota quantity are sold at a price 25% below the market price for lean beef trimmings; if they are not, they must notify the President, who may eliminate what remains of the increase (clause 6(b)). The benchmark is lean beef trimmings prices, not retail.',
    retail_price: {
      jan_2025: 5.55,            // USD/lb — when Trump took office
      dec_2025: 6.69,            // USD/lb — record since 1980s (WH fact sheet)
      jul_2026: 6.89             // USD/lb — July 2026 avg (BLS via Al Jazeera / FRED via NY Post)
    },
    hts_scope: ['0201.30.5091', '0201.30.5097', '0202.30.5091', '0202.30.5097'],
    hts_precedent: ['0201.30.5091', '0201.30.5097', '0202.30.5091', '0202.30.5097'],
    proclamation_status: 'IN FORCE — Proclamation 11059 signed Aug 26, 2026 and published Aug 31, 2026 (91 FR 55989, FR Doc. 2026-17842). The 2026 in-quota quantity is increased by 300,000 mt for lean beef trimmings under HTSUS 0201.30.5091/5097 and 0202.30.5091/5097, released first come, first served in three 100,000 mt tranches (Sept 1-30; Oct 1-30; Oct 31-Nov 30, 2026 or until filled). Entries are subject to the in-quota rate of duty (4.4 cents/kg) instead of the 26.4% out-of-quota rate.',
    status: 'IN FORCE. Proclamation 11059 (Aug 26, 2026; published Aug 31, 2026 — 91 FR 55989) increases the 2026 in-quota quantity of the beef TRQ by 300,000 mt for lean beef trimmings (HTSUS 0201.30.5091, 0201.30.5097, 0202.30.5091, 0202.30.5097), administered first come, first served in three 30-day tranches from Sept 1 to Nov 30, 2026, or until the added quantity is filled. The entire additional quantity is allocated to "other countries or areas"; the Proclamation 11010 Argentina increase (80,000 mt) is unaffected. Entries pay the in-quota rate of duty (4.4 cents/kg) — this is NOT a duty-free entry; what is avoided is the 26.4% out-of-quota rate. The proclamation anticipates discounted sale prices and directs USDA and USTR to monitor whether the imports sell at 25% below the market price for lean beef trimmings; if not, the President may eliminate what remains of the increase.',
    source_citations: [
      'Federal Register: Proclamation 11059 — Further Ensuring Affordable Beef for the American Consumer (Aug 31, 2026, 91 FR 55989, FR Doc. 2026-17842) — https://www.federalregister.gov/documents/2026/08/31/2026-17842/further-ensuring-affordable-beef-for-the-american-consumer',
      'Federal Register API: document 2026-17842 (signing date 2026-08-26; publication 2026-08-31; pages 55989-55994; subtype Proclamation)',
      'USITC HTSUS Chapter 2 (0201.30.50 / 0202.30.50, Col. 1 general 4.4¢/kg) — verified 2026-09-10 via hts.usitc.gov reststop export',
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
    // Calculator categories treated as covered for Canada. The three
    // official proclamation baskets (per research brief t_cb75bfd7,
    // verified vs Chicago Fed / WH proclamations): alcohol (HTS
    // 9903.03.12, 61 codes), dairy (9903.03.13, 52 codes), motor
    // vehicles (9903.03.14, 456 codes) = 569 HTSUS subheadings total.
    // 'auto' = motor-vehicles basket; 'alcohol' + 'dairy' = the two
    // ag/food baskets (explicit categories added 2026-08-24); 'food'
    // (Food & Beverages) covers alcohol/dairy broadly; 'canada-s338'
    // is the dedicated product-level covered-goods category (hockey
    // sticks, tongue depressors, and the full Guardian/USTR inventory).
    covered_categories: ['auto', 'food', 'dairy', 'alcohol', 'canada-s338'],
    exceptions: ['energy products', 'potash', 'fish', 'critical minerals', 'items already under Section 232'],
    pre_existing_stack: ['steel', 'lumber', 'autos'],

    // --- September 8, 2026 Section 338 modification (card t_c39d6c22, 2026-09-11) ---
    // TWO FORWARD EFFECTIVE DATES. Primary source, White House fact sheet of
    // Sept 8, 2026: "The import bans will take effect on September 29, 2026, and
    // the product additions and removals will take effect on September 15, 2026."
    // The motor-vehicle scope proclamation runs the same clock: the changes are
    // effective for goods entered or withdrawn from warehouse "on or after
    // 12:01 a.m. eastern time on September 15, 2026."
    scope_change: {
      effective: '2026-09-15 12:01 AM ET',
      effective_label: 'September 15, 2026, 12:01 a.m. ET',
      added: [
        'specialty cheeses', 'modified fats and oils', 'bovine hides and upholstery leather',
        'certain raw and dressed furskins', 'recreational motorboats', 'specialty paper',
        'some steel and aluminum items', 'metal fittings and welding inputs', 'golf carts',
        'furniture and lamps', 'all-terrain vehicles (ATVs)', 'additional dairy products'
      ],
      removed: [
        'rock salt', 'cement', 'toilet paper', 'fishing-rod parts',
        'whiskies, liqueurs and cordials in containers over 4 litres'
      ],
      authority: 'Section 338 proclamations signed Sept 8, 2026 — scope modification of the July 20, 2026 actions',
      note: 'Entry-date rule: a removal is relief only for goods entered for consumption, or withdrawn from warehouse, on or after Sept 15, 2026. Entries dated earlier in September keep the duty that applied on the entry date.'
    },
    import_bans: {
      effective: '2026-09-29',
      effective_label: 'September 29, 2026',
      products: [
        'beer, wines, cider and other fermented drinks (incl. malt beer, certain grape wines)',
        'high-proof beverage alcohol and many major spirits categories (incl. certain rye whiskies and other liquors)',
        'non-alcoholic beer',
        'whey products and molasses',
        'motorcycles, mopeds and cycles fitted with internal-combustion piston engines over 800 cc',
        'certain dairy products'
      ],
      value_affected: 'banned products total under $1 billion in trade value',
      unentered_rule: 'Goods subject to a ban that were imported but not yet entered for consumption, or withdrawn from warehouse for consumption, prior to Sept 29, 2026 remain subject to the 50 percent duty rate established by Proclamation 11048 (motor-vehicle ban proclamation, Sept 8, 2026).',
      note: 'Unlike the 50% duty, a ban is not a rate — the named goods may not be imported for consumption on or after Sept 29, 2026.'
    },
    usmca_note: 'Section 338 applies to all covered goods regardless of whether a good originates under the U.S.-Mexico-Canada Agreement (USMCA) — a USMCA certificate of origin does not remove the duty or a ban (White House fact sheet, Sept 8, 2026).',
    stacking_note: 'Section 338 duties apply IN ADDITION TO tariffs imposed under Section 232 of the Trade Expansion Act of 1962 (White House fact sheet, Sept 8, 2026) — the two layer, they do not substitute for one another.',
    gsa_directive: 'The President directed USTR and GSA to remove Canadian-origin products from GSA Multiple Award Schedules, which the fact sheet says manage over $50 billion in federal procurement; AP reported the effect as Canadian products becoming ineligible for large, long-term federal contracts until Canada allows what the President called full and fair reciprocity.',
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
    hs_note: 'Verified official enumeration (research brief t_cb75bfd7, Chicago Fed Jul 2026, WH Proclamations 11046/47/48): 569 eight-digit HTSUS subheadings across three proclamations — alcoholic beverages (HTS heading 9903.03.12, 61 codes), dairy (9903.03.13, 52 codes), motor vehicles (9903.03.14, 456 codes), capturing ~$24B / 5.5% of annual Canadian import value. USMCA does NOT shield covered goods. Excluded: energy, potash, Section 232 goods, fish, critical minerals. Official line-level HTS list lives in the three July 20, 2026 Section 338 proclamations / USTR statement PDF (Federal Register d/2026-14997, 91 FR 46663).',
    status: 'IN EFFECT — the 50% additional duty took effect Saturday, Aug 22, 2026 at 12:01 a.m. EDT (04:01 GMT) after U.S.–Canada talks failed to finalize a deal. USTR Jamieson Greer: Tonight, Canada declined to finalize the trade deal under the terms agreed earlier this week. TWO FORWARD DATES (proclamations signed Sept 8, 2026, hours after Canada\'s C$27.6B counter-tariffs took effect at 12:01 a.m. ET that day): (1) the product additions and removals to this 50% list take effect September 15, 2026 at 12:01 a.m. ET — ADDED specialty cheeses, modified fats and oils, bovine hides and upholstery leather, certain raw and dressed furskins, recreational motorboats, specialty paper, some steel and aluminum items, metal fittings and welding inputs, golf carts, furniture and lamps, ATVs and additional dairy; REMOVED rock salt, cement, toilet paper, fishing-rod parts and whiskies, liqueurs and cordials in containers over 4 litres; and (2) IMPORT BANS take effect September 29, 2026 on Canadian beer, wines, cider and other fermented drinks, high-proof beverage alcohol and many major spirits categories, non-alcoholic beer, whey products and molasses, motorcycles/mopeds/cycles with internal-combustion piston engines over 800 cc, and certain dairy products (banned products total under $1B in trade value; goods imported but not entered before Sept 29 remain at the 50% rate under Proclamation 11048). The Sept 8 fact sheet states these Section 338 tariffs apply to all covered goods REGARDLESS of USMCA origin and IN ADDITION TO Section 232 duties. USTR and GSA were directed to remove Canadian-origin products from GSA Multiple Award Schedules (over $50B in federal procurement). Canada\'s side is unchanged: the C$27.6B counter-tariff package (629 items; fish and seafood removed Aug 26; copper wire, wood charcoal, glass containers, printed images and gypsum tiles added at 50%) has been in effect since Sept 8, 2026 with no further instrument, and PM Carney said Sept 11 that Ottawa is still studying whether to adjust. The announced 50% increase on Canadian autos, auto parts and steel from January 1, 2027 is a stated intention, NOT law in force.',
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
      'The Guardian: Canada vows dollar for dollar response as US puts 50% tariffs on some goods (Aug 22, 2026) — https://www.theguardian.com/world/2026/aug/22/canada-tariffs-trump-trade-deal-talks-fail',
      // Sept 8, 2026 modification — primary sources first (t_c39d6c22, 2026-09-11)
      'White House Fact Sheet: President Donald J. Trump Responds to Canada\'s Retaliation (Sept 8, 2026) — https://www.whitehouse.gov/fact-sheets/2026/09/fact-sheet-president-donald-j-trump-responds-to-canadas-retaliation',
      'USTR: Ambassador Greer Issues Statement on President Trump\'s Response to Canada\'s Continued Retaliation (Sept 8, 2026) — https://ustr.gov/about/policy-offices/press-office/press-releases/2026/september/ambassador-greer-issues-statement-president-trumps-response-canadas-continued-retaliation-against',
      'WH Proclamation: Modifying the Scope of Products of Canada Subject to the Additional Duties (motor vehicles, Sept 8, 2026) — effective 12:01 a.m. ET Sept 15, 2026 — https://www.whitehouse.gov/presidential-actions/2026/09/modifying-the-scope-of-products-of-canada-subject-to-the-additional-duties-imposed-to-offset-canadian-discrimination-against-the-united-states-with-respect-to-motor-vehicles',
      'WH Proclamation: Excluding Certain Canadian Products from Importation into the United States (motor vehicles, Sept 8, 2026) — ban effective Sept 29, 2026 — https://www.whitehouse.gov/presidential-actions/2026/09/excluding-certain-canadian-products-from-importation-into-the-united-states-in-response-to-continued-discrimination-against-the-commerce-of-the-united-states-with-respect-to-motor-vehicles',
      'White House Presidential Actions index — Canada proclamations of Sept 8-9, 2026 (checked 2026-09-11) — https://www.whitehouse.gov/presidential-actions',
      'WardsAuto: Trump escalates Canada trade war with new tariffs, import bans (Sept 9, 2026) — https://www.wardsauto.com/news/trump-escalates-canada-trade-war-with-new-tariffs-import-bans/829929',
      'Bloomberg via Business Standard: US widens Canada trade war with import bans, new tariffs (Sept 9, 2026) — https://www.business-standard.com/world-news/us-widens-canada-trade-war-with-import-bans-new-tariffs-on-key-products-126090900171_1.html',
      'AP via CityNews Toronto: Trump widens trade war with Canada beyond tariffs (Sept 9, 2026) — https://toronto.citynews.ca/2026/09/09/donald-trump-us-canada-trade-war-tariffs-response',
      'Reason/Volokh (Ilya Somin): Trump Expands Illegal Section 338 Tariffs (Sept 9, 2026) — https://reason.com/volokh/2026/09/09/trump-expands-illegal-section-338-tariffs-against-canadian-imports-and-bans-some-entirely',
      'Reuters: Mexico, Washington sprint toward bilateral trade deal before US elections (Sept 11, 2026) — https://kfgo.com/2026/09/11/mexico-washington-sprint-toward-bilateral-trade-deal-before-us-elections',
      'Canada\'s National Observer: Canada is still studying Trump\'s latest trade attack — Carney (Sept 11, 2026) — https://www.nationalobserver.com/2026/09/11/news/canada-still-studying-trumps-latest-trade-attack-carney',
      'C.H. Robinson Edge Report September 2026 — customs page (published Sept 3, 2026) — https://www.chrobinson.com/en-us/resources/insights-and-advisories/north-america-freight-insights/sep-2026-freight-market-update/customs'
    ]
  };

  /*
   * Canada's dollar-for-dollar retaliation (effective Sept 8, 2026)
   * -------------------------------------------------------------
   * CONFIRMED Aug 25, 2026 — Finance Canada announced counter-tariffs of
   * 15%, 25% and 50% on C$27.6 billion of US imports, effective
   * 12:01 a.m. ET, Tuesday, September 8, 2026. The rates match the
   * corresponding US rate (products drawn from those targeted by US
   * Section 338 and Section 232 tariffs). Official list: 629 tariff
   * items (revised Aug 26 from 874; 413 at 50%, 195 at 25%, 21 at 15%).
   * Origin rule: applies only to goods originating from the US (CUSMA
   * marking regulations); in-transit carve-out: US goods already in
   * transit to Canada on Sept 8 are not covered. Focus sectors: steel,
   * dairy, appliances, agricultural equipment, pulp and paper,
   * electronics; the list also covers furniture, apparel/clothing,
   * cosmetics, tools, sporting goods, and more.
   * CRITICAL (dataset t_d98a84da): US autos are NOT on this list
   * (separate existing 25% counter-tariff order); fish/seafood was
   * REMOVED in the Aug 26 revision (629 items, not 874).
   * DATA FILE: the preset rates/categories live in
   * presets/canada-sept8-counter-tariffs.js (window.CANADA_SEPT8_PRESET
   * in the browser, require() in Node) so a future trade deal can be
   * reflected by editing the data file only — no calculator logic
   * changes, no risky deployment.
   * Verified 2026-08-31 against dataset t_d98a84da (13 sources; official
   * list parsed from Wayback snapshot 20260827212727). Supersedes the
   * Aug 23 pre-announcement estimate (flat 50% across six sectors).
   */
  var CANADA_RETALIATION = (function () {
    var preset = null;
    if (typeof window !== 'undefined' && window.CANADA_SEPT8_PRESET) {
      preset = window.CANADA_SEPT8_PRESET;
    } else if (typeof require === 'function') {
      try { preset = require('./presets/canada-sept8-counter-tariffs.js'); } catch (e) { preset = null; }
    }
    if (preset && preset.preset_key === 'canada-sept8-counter-tariffs') {
      return preset;
    }
    // Safe fallback (data file missing in an unusual runtime): expose
    // the preset identity and a PENDING state rather than wrong rates.
    return {
      preset_key: 'canada-sept8-counter-tariffs',
      preset_label: 'Canada Sept 8 Counter-Tariffs',
      effective: '2026-09-08',
      effective_label: 'Tuesday, September 8, 2026, 12:01 a.m. ET',
      framework: 'dollar-for-dollar',
      announced: '2026-08-25',
      revised: '2026-08-26',
      rate: 0,
      value_affected: 'C$27.6 billion in US imports (~US$20B)',
      list_size: { total: 629, rate_50: 413, rate_25: 195, rate_15: 21 },
      origin_rule: 'Tariffs apply only to goods originating from the US (as marked under the CUSMA marking regulations).',
      in_transit: 'Countermeasures do NOT apply to US goods already in transit to Canada on Sept 8, 2026.',
      tiers: {},
      category_tiers: {},
      sectors: [],
      sector_categories: [],
      representative_products: [],
      status: 'PENDING — preset data file not loaded (presets/canada-sept8-counter-tariffs.js).'
    };
  })();

  /*
   * Canada TRQ — canned vegetables (CITT GC-2025-001 recommendation, NOT adopted)
   * --------------------------------------------------------------------------
   * The CITT's September 9, 2026 report recommends a THREE-YEAR TARIFF-RATE
   * QUOTA on canned vegetable goods, including imports from the US:
   *   Year 1: in-quota 13,000,000 kg (28,660,094 lb), above-quota surtax 50%
   *   Year 2: in-quota 13,260,000 kg (29,233,296 lb), above-quota surtax 45%
   *   Year 3: in-quota 13,525,200 kg (29,817,962 lb), above-quota surtax 40%
   *   In-quota imports: no surtax (duty-free).
   * (CITT GC-2025-001 ¶301–302; the in-quota volume rises 2%/yr, ¶309.)
   *
   * A TRQ is NOT a quota: above-quota imports remain legal and the quantity
   * that may be imported is not limited — only the price changes
   * (¶306 "the recommended TRQ does not preclude additional imports. It
   * would only affect their prices."; ¶326; ¶318).
   *
   * STATUS: RECOMMENDED, NOT ADOPTED. The measure in force is the 10%
   * provisional safeguard surtax (CBSA Customs Notice 26-14), effective
   * June 19, 2026 for up to 200 days, which EXEMPTS US, Mexican, Chilean,
   * Israeli and developing-country goods. Adoption would end the US
   * exemption. Never present these TRQ rates as current law.
   *
   * DATA FILE: rates/thresholds live in
   * presets/canada-trq-canned-vegetables.js (window.CANADA_TRQ_PRESET in
   * the browser, require() in Node) so adoption or amendment is a
   * data-file edit with no calculator-logic change.
   */
  var TRQ_CANNED_VEG = (function () {
    var preset = null;
    if (typeof window !== 'undefined' && window.CANADA_TRQ_PRESET) {
      preset = window.CANADA_TRQ_PRESET;
    } else if (typeof require === 'function') {
      try { preset = require('./presets/canada-trq-canned-vegetables.js'); } catch (e) { preset = null; }
    }
    if (preset && preset.preset_key === 'canada-trq-canned-vegetables') {
      return preset;
    }
    // Safe fallback: expose the preset identity and no rates rather than
    // wrong rates. The calculator renders a "data file not loaded" notice.
    return {
      preset_key: 'canada-trq-canned-vegetables',
      preset_label: 'Canada TRQ — Canned Vegetables',
      status: 'PENDING — preset data file not loaded (presets/canada-trq-canned-vegetables.js).',
      status_short: 'Data unavailable',
      recommendation_date: '2026-09-09',
      kg_to_lb: 2.2046226218,
      years: [],
      default_year: 1,
      default_volume_lb: 0,
      in_force: { rate: 0.10, effective: '2026-06-19' },
      product_scope: [],
      legal_quotes: [],
      sources: [],
      verified: null
    };
  })();

  /*
   * trqCannedVegSurtax(opts) — the TRQ arithmetic behind the calculator's
   * 'TRQ surtax' mode.
   *
   * @param opts { volumeLb: number  — annual import volume in POUNDS,
   *              volumeKg: number  — alternative: volume in KILOGRAMS
   *                                  (one of the two is required),
   *              year: 1|2|3       — TRQ year (default 1); drives BOTH the
   *                                  in-quota threshold and the surtax rate,
   *              quotaExhausted: bool (default false) — when true the whole
   *                                  volume is treated as above-quota, because
   *                                  a filled quota means later imports cannot
   *                                  draw on it regardless of their own size,
   *              valueUsd: number  — optional declared value of the whole
   *                                  annual volume; duty is apportioned to the
   *                                  above-quota share of it }
   * Returns {
   *   year, inQuotaKg, inQuotaLb, surtaxRate, surtaxPct,
   *   volumeKg, volumeLb, withinQuotaLb, aboveQuotaLb, aboveQuotaShare,
   *   quotaExhausted, valueUsd, aboveQuotaValueUsd, dutyUsd,
   *   dutyPer1000AboveQuotaValue, status, presetLabel, verified }
   * or null when the year is unknown / volume is not a positive number.
   */
  function trqCannedVegSurtax(opts) {
    opts = opts || {};
    var rows = TRQ_CANNED_VEG.years || [];
    if (!rows.length) return null;

    var wantYear = opts.year == null ? TRQ_CANNED_VEG.default_year : Number(opts.year);
    var row = null;
    for (var i = 0; i < rows.length; i++) {
      if (Number(rows[i].year) === wantYear) { row = rows[i]; break; }
    }
    if (!row) return null;

    var volumeLb = null;
    if (opts.volumeLb != null && opts.volumeLb !== '') volumeLb = Number(opts.volumeLb);
    else if (opts.volumeKg != null && opts.volumeKg !== '') volumeLb = Math.round(Number(opts.volumeKg) * TRQ_CANNED_VEG.kg_to_lb);
    if (volumeLb == null || !isFinite(volumeLb) || volumeLb <= 0) return null;

    var inQuotaLb = row.in_quota_lb;
    var inQuotaSourceKg = row.in_quota_kg;
    if (opts.inQuotaLb != null && opts.inQuotaLb !== '' && isFinite(Number(opts.inQuotaLb)) && Number(opts.inQuotaLb) > 0) {
      inQuotaLb = Number(opts.inQuotaLb); // user-edited assumption
    }
    var exhausted = !!opts.quotaExhausted;
    var withinQuotaLb = exhausted ? 0 : Math.min(volumeLb, inQuotaLb);
    var aboveQuotaLb = volumeLb - withinQuotaLb;

    var valueUsd = null;
    if (opts.valueUsd != null && opts.valueUsd !== '') {
      var v = Number(opts.valueUsd);
      if (isFinite(v) && v > 0) valueUsd = v;
    }
    var aboveQuotaValueUsd = null;
    var dutyUsd = null;
    if (valueUsd != null) {
      aboveQuotaValueUsd = volumeLb > 0 ? valueUsd * (aboveQuotaLb / volumeLb) : 0;
      dutyUsd = aboveQuotaValueUsd * row.above_quota_surtax;
    }

    return {
      year: Number(row.year),
      presetLabel: TRQ_CANNED_VEG.preset_label,
      status: TRQ_CANNED_VEG.status,
      statusShort: TRQ_CANNED_VEG.status_short,
      verified: TRQ_CANNED_VEG.verified,
      inForce: TRQ_CANNED_VEG.in_force,
      inQuotaKg: inQuotaLb / TRQ_CANNED_VEG.kg_to_lb,
      inQuotaSourceKg: inQuotaSourceKg,
      inQuotaOverridden: inQuotaLb !== row.in_quota_lb,
      inQuotaLb: inQuotaLb,
      surtaxRate: row.above_quota_surtax,
      surtaxPct: Math.round(row.above_quota_surtax * 100),
      volumeKg: volumeLb / TRQ_CANNED_VEG.kg_to_lb,
      volumeLb: volumeLb,
      withinQuotaLb: withinQuotaLb,
      aboveQuotaLb: aboveQuotaLb,
      aboveQuotaShare: volumeLb > 0 ? aboveQuotaLb / volumeLb : 0,
      quotaExhausted: exhausted,
      valueUsd: valueUsd,
      aboveQuotaValueUsd: aboveQuotaValueUsd,
      dutyUsd: dutyUsd,
      dutyPer1000AboveQuotaValue: row.above_quota_surtax * 1000
    };
  }

  /*
   * Refined copper — PENDING Section 232 duty scenario (kanban t_7ecb5089)
   * --------------------------------------------------------------------
   * The White House had not decided on a refined-copper tariff as of
   * 2026-09-11: the Reuters wire of Sept 10, 2026 ("has not yet made a
   * decision on refined copper tariffs") plus a primary absence check
   * (no refined-copper instrument in the Federal Register; the Apr 9 and
   * Jun 4, 2026 copper proclamations cover semi-finished and derivative
   * articles only and contain no instance of the word "refined").
   *
   * NOTHING IS COLLECTIBLE on refined copper. This layer models a
   * proposal, never law — every result it produces carries
   * `pending: true` / `inEffect: false` and the disclaimer.
   *
   * DATA FILE: prices, rate band, reference cases and the page-copy
   * mirror live in presets/refined-copper-tariff-pending.js
   * (window.COPPER_TARIFF_PRESET in the browser, require() in Node), so an
   * actual instrument is a data-file edit with no calculator-logic change.
   */
  var COPPER_PENDING = (function () {
    var preset = null;
    if (typeof window !== 'undefined' && window.COPPER_TARIFF_PRESET) {
      preset = window.COPPER_TARIFF_PRESET;
    } else if (typeof require === 'function') {
      try { preset = require('./presets/refined-copper-tariff-pending.js'); } catch (e) { preset = null; }
    }
    if (preset && preset.preset_key === 'refined-copper-tariff-pending') {
      return preset;
    }
    // Safe fallback: expose the preset identity and no prices/rates rather
    // than wrong numbers. The calculator renders a "data file not loaded"
    // notice and refuses to produce a scenario.
    return {
      preset_key: 'refined-copper-tariff-pending',
      preset_label: 'Refined copper \u2014 pending Section 232 duty scenario',
      status: 'PENDING \u2014 NOT IN EFFECT',
      status_short: 'Data unavailable',
      in_effect: false,
      as_of: null,
      disclaimer: 'No refined-copper tariff is in effect, and this mode\u2019s preset data file did not load, so no scenario can be modelled.',
      disclaimer_short: 'PENDING \u2014 not in effect. No duty is currently collectible.',
      lb_per_tonne: 2204.6226218,
      markets: [],
      default_market: null,
      quantity: { unit: 'metric tonnes (t)', unit_short: 't', default_t: null },
      rate: { default_pct: 10, min_pct: 0, max_pct: 30, step_pct: 0.5, reference_pct: 15 },
      reference_cases: [],
      destinations: [],
      default_destination: 'us',
      value_basis_note: '',
      scenario_reference: null,
      sources: [],
      verified: null
    };
  })();

  // Thousands separators without depending on ICU/locale data.
  function cuFmt(n, dp) {
    if (n == null || !isFinite(n)) return '\u2014';
    var digits = dp || 0;
    var neg = n < 0;
    var s = Math.abs(n).toFixed(digits);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + parts.join('.');
  }
  function cuMoney(n, dp) {
    if (n == null || !isFinite(n)) return '\u2014';
    return '$' + cuFmt(n, dp == null ? 0 : dp);
  }
  function cuPctLabel(rate) {
    return (Math.round(rate * 1000) / 10).toFixed(1) + '%';
  }

  /*
   * copperLandedCost(opts) — the arithmetic behind the calculator's
   * 'Copper — pending duty scenario' mode.
   *
   * @param opts { market: 'lme'|'comex'   — sets the price unit
   *                                  (per tonne / per pound, default 'lme'),
   *              price: number        — base price in the MARKET's own unit
   *                                  (required; USD/t for LME, USD/lb for
   *                                  COMEX — the conversion is done here),
   *              quantityT: number    — quantity in metric tonnes (required),
   *              ratePct: number      — proposed ad valorem duty in PERCENT
   *                                  (0–30; clamped, see `clamped`),
   *              rate: number         — alternative: a fraction (0.15 = 15%);
   *                                  ratePct wins when both are passed,
   *              destination: 'us'|'canada'|'other' (default 'us') }
   * Returns {
   *   market, marketLabel, priceBasis, priceInput, priceUnit, pricePerTonne,
   *   quantityT, quantityLb,
   *   dutyBaseUsd, noTariffLandedUsd, dutyUsd, landedUsd, deltaUsd, deltaPct,
   *   dutyPerTonne, dutyPerLb,
   *   rate, ratePct, ratePctLabel, requestedRatePct, clamped, clampNote,
   *   rateIsReference,
   *   destination, destinationLabel, destinationNote,
   *   pending: true, inEffect: false, status, statusShort, asOf, verified,
   *   disclaimer, valueBasisNote, headline, scenarioTable }
   * or null when the price / quantity is not a positive number, when the
   * market is unknown, or when the preset carries no prices.
   *
   * `headline` is the page-copy sentence: "if the duty lands at X%, landed
   * cost on this shipment moves from $A to $B — up $C, or D%".
   */
  function copperLandedCost(opts) {
    opts = opts || {};
    var markets = COPPER_PENDING.markets || [];
    if (!markets.length) return null;

    var wantMarket = opts.market == null ? COPPER_PENDING.default_market : String(opts.market);
    var market = null;
    for (var i = 0; i < markets.length; i++) {
      if (markets[i].value === wantMarket) { market = markets[i]; break; }
    }
    if (!market) return null;

    var price = Number(opts.price);
    if (opts.price == null || opts.price === '' || !isFinite(price) || price <= 0) return null;

    var qty = Number(opts.quantityT);
    if (opts.quantityT == null || opts.quantityT === '' || !isFinite(qty) || qty <= 0) return null;

    var lbPerTonne = COPPER_PENDING.lb_per_tonne || 2204.6226218;
    var perPound = market.price_basis === 'per_pound';
    var pricePerTonne = perPound ? price * lbPerTonne : price;
    var quantityLb = qty * lbPerTonne;
    var dutyBaseUsd = pricePerTonne * qty;

    // Rate: percent wins, fraction accepted for callers that prefer it.
    var band = COPPER_PENDING.rate || {};
    var minPct = band.min_pct == null ? 0 : band.min_pct;
    var maxPct = band.max_pct == null ? 30 : band.max_pct;
    var requestedPct = null;
    if (opts.ratePct != null && opts.ratePct !== '') requestedPct = Number(opts.ratePct);
    else if (opts.rate != null && opts.rate !== '') requestedPct = Number(opts.rate) <= 1 ? Number(opts.rate) * 100 : Number(opts.rate);
    if (requestedPct == null || !isFinite(requestedPct)) requestedPct = band.default_pct;
    var clamped = false;
    var pct = requestedPct;
    if (pct < minPct) { pct = minPct; clamped = true; }
    if (pct > maxPct) { pct = maxPct; clamped = true; }
    var rate = pct / 100;

    // Destination: labels and notes only — the pending duty itself is a US
    // measure, and nothing here is collectible in any destination.
    var dests = COPPER_PENDING.destinations || [];
    var wantDest = opts.destination == null ? COPPER_PENDING.default_destination : String(opts.destination);
    var dest = null;
    for (var d = 0; d < dests.length; d++) {
      if (dests[d].value === wantDest) { dest = dests[d]; break; }
    }
    if (!dest) { dest = dests.length ? dests[0] : { value: wantDest, label: wantDest, note: '' }; }

    var dutyUsd = dutyBaseUsd * rate;
    var landedUsd = dutyBaseUsd + dutyUsd;

    var headline;
    if (pct === 0) {
      headline = 'if the duty lands at 0% (today\u2019s state), landed cost on this shipment stays at ' +
        cuMoney(dutyBaseUsd) + ' \u2014 no duty is currently collectible on refined copper.';
    } else {
      headline = 'if the duty lands at ' + cuFmt(pct, pct % 1 === 0 ? 0 : 1) + '%, landed cost on this shipment moves from ' +
        cuMoney(dutyBaseUsd) + ' to ' + cuMoney(landedUsd) + ' \u2014 up ' + cuMoney(dutyUsd) + ', or ' +
        cuPctLabel(rate) + '.';
    }

    var cases = COPPER_PENDING.reference_cases || [];
    var scenarioTable = cases.map(function (c) {
      var r = Number(c.pct) / 100;
      var duty = dutyBaseUsd * r;
      return {
        pct: Number(c.pct),
        label: c.label,
        note: c.note,
        dutyUsd: duty,
        landedUsd: dutyBaseUsd + duty,
        deltaUsd: duty,
        deltaPct: r,
        dutyPerTonne: pricePerTonne * r
      };
    });

    return {
      presetLabel: COPPER_PENDING.preset_label,
      status: COPPER_PENDING.status,
      statusShort: COPPER_PENDING.status_short,
      asOf: COPPER_PENDING.as_of,
      verified: COPPER_PENDING.verified,
      pending: true,
      inEffect: false,
      disclaimer: COPPER_PENDING.disclaimer,
      disclaimerShort: COPPER_PENDING.disclaimer_short,
      basis: COPPER_PENDING.basis,
      inForce: COPPER_PENDING.in_force,
      market: market.value,
      marketLabel: market.label,
      priceBasis: market.price_basis,
      priceUnit: market.unit_label,
      priceInput: price,
      pricePerTonne: pricePerTonne,
      lbPerTonne: lbPerTonne,
      quantityT: qty,
      quantityLb: quantityLb,
      dutyBaseUsd: dutyBaseUsd,
      noTariffLandedUsd: dutyBaseUsd,
      dutyUsd: dutyUsd,
      landedUsd: landedUsd,
      deltaUsd: dutyUsd,
      deltaPct: rate,
      dutyPerTonne: pricePerTonne * rate,
      dutyPerLb: (pricePerTonne * rate) / lbPerTonne,
      rate: rate,
      ratePct: pct,
      ratePctLabel: cuPctLabel(rate),
      requestedRatePct: requestedPct,
      clamped: clamped,
      clampNote: clamped
        ? 'Requested ' + cuFmt(requestedPct, requestedPct % 1 === 0 ? 0 : 1) + '% was clamped to the scenario band ' +
          cuFmt(minPct) + '\u2013' + cuFmt(maxPct) + '%.'
        : null,
      rateMinPct: minPct,
      rateMaxPct: maxPct,
      rateIsReference: band.reference_pct != null && Number(band.reference_pct) === pct,
      rateBandNote: band.band_note,
      destination: dest.value,
      destinationLabel: dest.label,
      destinationNote: dest.note,
      valueBasisNote: COPPER_PENDING.value_basis_note,
      headline: headline,
      scenarioTable: scenarioTable
    };
  }

  /*
   * Brazil — Section 301 25% additional duty (IN EFFECT July 22, 2026)
   * ----------------------------------------------------------------
   * Separate USTR action: investigation initiated July 15, 2025 under
   * Section 301(b); determination June 1, 2026 (proposed 25% on all goods
   * of Brazil with exemptions); Notice of Action July 15, 2026; FRN
   * published July 20, 2026 (91 FR 137); duty effective 12:01 a.m. ET
   * July 22, 2026 for entries on/after that time. Imposes +25% ad valorem
   * on top of MFN for non-exempt Brazilian goods (HTS 9903.05.01).
   * DISTINCT from Brazil's 12.5% forced-labor Section 301 rate
   * (9903.05.27, in SECTION_301) — per PIIE the two stack, up to 37.5%
   * combined for non-exempt, non-232 goods.
   * Exemptions: 1,600+ HTSUS subheadings in the FRN annex (~1,200
   * standard + ~430 civil-aircraft lines; final action kept the proposal
   * exemptions and added ~12 categories). Confirmed exempt: coffee, beef,
   * orange juice, cocoa, Brazil nuts & tropical fruit, iron ore,
   * petroleum & coal products, pharmaceuticals (9903.05.06), civil
   * aircraft & parts (~430 lines, 9903.05.05), pig iron, organic honey,
   * seafood, certain wood products, hides/furskins/leather, iron & steel
   * waste/scrap, used clothing, antiques/collectibles/art, aluminum
   * hydroxide. Donations (9903.05.08) and informational materials
   * (9903.05.09) excluded; personal-use baggage excluded.
   * Section 232: NO stacking — steel, aluminum, copper, autos, wood
   * products, semiconductors (9903.05.07) are excluded from the 25% and
   * pay the Section 232 rate only.
   * Post-consultation what-if scenarios (modeling only, NOT in effect):
   * Brazil's stated agenda (Minister Rosa, Jul 30) is to expand the
   * exemption list, reduce tariff rates, and reassess the merits; USTR
   * may modify/terminate under Trade Act Sec. 307(c). The Aug 31 event is
   * bilateral virtual Rosa-Greer tariff talks; WTO consultations are the
   * separate DS646 track (Brazil requested Jul 28, circulated Jul 30, US
   * accepted Aug 10; China joined). No agreement announced as of
   * 2026-08-28 — scenarios are selectable in the calculator UI for
   * modeling only.
   * Verified 2026-08-28 against research brief t_c288793e (16 sources,
   * 52 verbatim quotes: USTR FRN/press release/Brazil page, WTO DS646,
   * PIIE, CNBC, Valor x3, EY, Green Worldwide, TariffStool, BDO,
   * Economic Times (Reuters), Agência Brasil, Eurasia Review).
   */
  var BRAZIL_301 = {
    category: 'brazil-301',
    rate: 0.25,
    effective: '2026-07-22 12:01 AM ET',
    notice_date: '2026-07-15',
    frn_published: '2026-07-20',
    frn_cite: '91 FR 137',
    authority: 'Section 301(b)/304(a), Trade Act of 1974',
    heading: '9903.05.01',
    headings: {
      general: '9903.05.01',
      in_transit: '9903.05.02',
      special_carveouts: '9903.05.03-04',
      aircraft: '9903.05.05',
      pharma: '9903.05.06',
      s232_covered: '9903.05.07',
      donations: '9903.05.08',
      informational: '9903.05.09'
    },
    // The action covers ALL imports of Brazil "with certain exemptions"
    // (USTR FRN) — the calculator treats every category as subject unless
    // it is in exempt_categories. subject_highlights documents the
    // confirmed subject concentration (PIIE, Jul 17): machinery,
    // electrical equipment, granite, gold, tires, sugar, apparel.
    subject_highlights: ['machinery', 'electrical equipment', 'granite', 'gold', 'tires', 'sugar', 'apparel'],
    // Calculator categories EXEMPT from the +25%: pharma (9903.05.06),
    // Section 232-covered articles (9903.05.07 — steel/aluminum/copper/
    // autos/wood/semiconductors incl. polysilicon + drones/UAS), civil
    // aircraft (9903.05.05 — no dedicated calculator category), and beef
    // (exempt product + 'ground-beef' has its own TRQ/waiver logic).
    exempt_categories: ['pharma', 'steel', 'auto', 'polysilicon', 'drones', 'ground-beef'],
    exempt_subheadings: '1,600+ HTSUS subheadings (~1,200 standard + ~430 civil-aircraft lines; final action kept + expanded)',
    standard_exempt_lines: 1200,
    aircraft_carveout_lines: 430,
    exempt_categories_list: ['coffee', 'beef', 'orange juice', 'cocoa', 'Brazil nuts & tropical fruit', 'iron ore', 'petroleum & coal products', 'pharmaceuticals', 'civil aircraft & parts', 'pig iron', 'organic honey', 'seafood', 'certain wood products', 'hides/furskins/leather', 'iron & steel waste/scrap', 'used clothing', 'antiques/collectibles/art', 'aluminum hydroxide'],
    s232_excluded: ['steel', 'aluminum', 'copper', 'autos', 'wood products', 'semiconductors'],
    stacking: {
      forced_labor_301: 'Brazil is also in the 60-economy forced-labor Section 301 matrix at 12.5% (HTS 9903.05.27) — per PIIE the 25% and 12.5% duties stack, up to 37.5% combined for non-exempt, non-232 goods.',
      s232: 'Articles already under Section 232 (steel, aluminum, copper, autos, wood, semiconductors — HTS 9903.05.07) are NOT subject to the 25%; the two duties do not stack.'
    },
    // Post-consultation what-if scenarios (modeling only — NOT in effect).
    scenarios: {
      current:    { label: 'Current law — 25% in effect', rate: 0.25, in_effect: true },
      reduced_20: { label: 'What-if: 20% after talks (NOT in effect)', rate: 0.20, in_effect: false },
      reduced_15: { label: 'What-if: 15% after talks (NOT in effect)', rate: 0.15, in_effect: false },
      reduced_10: { label: 'What-if: 10% after talks (NOT in effect)', rate: 0.10, in_effect: false },
      removed:    { label: 'What-if: removed / 0% after talks (NOT in effect)', rate: 0, in_effect: false }
    },
    trade_context: {
      exports_2025: 'US goods exports to Brazil $54.3B (2025)',
      imports_2025: 'US goods imports from Brazil $39.9B (2025)',
      goods_surplus: 'US goods surplus $14.4B (+115.7% YoY)',
      services_surplus: 'US services surplus $27.4B',
      lula_cumulative: 'Lula: cumulative $424.5B US goods+services surplus over 15 years'
    },
    affected_share: '18% (Brazilian minister) vs ~34% (PIIE) of Brazil\'s exports to the US — conflicting; use range with attribution',
    status: 'IN EFFECT — +25% additional duty on non-exempt Brazilian goods since July 22, 2026 (12:01 a.m. ET). Talks: bilateral virtual Rosa-Greer tariff talks Aug 31, 2026 (WTO consultations are the separate DS646 track — Brazil requested Jul 28, circulated Jul 30, US accepted Aug 10; China joined). Brazil\'s agenda: expand exemptions, reduce rates, reassess merits.',
    source_citations: [
      'USTR Notice of Action / Federal Register notice (Brazil Section 301 final action, July 15 2026, published July 20, 91 FR 137) — https://ustr.gov/sites/default/files/files/Issue_Areas/Enforcement/Section%20301/Brazil%20301%20Final%20Action%20FRN%207-15-2026%20final.pdf',
      'USTR press release: Section 301 Action on Brazil\'s Unreasonable Acts, Policies, and Practices (Jul 15, 2026)',
      'USTR Brazil trade summary (2025: US exports $54.3B, imports $39.9B, goods surplus $14.4B) — https://ustr.gov/countries-regions/americas/brazil',
      'WTO DS646 news item — https://www.wto.org/english/news_e/news26_e/ds646rfc_30jul26_468_e.htm',
      'PIIE Realtime Economics: Trump\'s new tariffs on Brazil (Jul 17, 2026) — 37.5% stack, ~34% affected share, subject categories — https://www.piie.com/blogs/realtime-economics/2026/trumps-new-tariffs-brazil-reflect-weakness-us-trade-strategy',
      'CNBC: U.S. slaps 25% tariff on most Brazilian goods (Jul 16, 2026)',
      'Valor International: Brazil will remain in talks (Jul 31, 2026); U.S. agrees to WTO talks (Aug 11, 2026); Lula calls Trump (Aug 21, 2026)',
      'Green Worldwide: USTR proposes 25% Section 301 tariff on Brazilian goods — 1,200+ HTS exemptions and 430 aircraft carve-outs',
      'TariffStool: New 25% Tariff on Brazil Takes Effect July 22, 2026',
      'EY Tax News 2026-1530; BDO insights; Economic Times (Reuters); Agência Brasil',
      'Eurasia Review / Agência Brasil: Brazil, US To Discuss Tariff Hikes Next Monday (Aug 27, 2026) — Aug 31 Rosa-Greer virtual talks'
    ]
  };

  /*
   * Trucking / freight-impact layer (added 2026-08-24, research brief
   * t_cb75bfd7 — verified vs Truck News Aug 24, CTA statement, CTOA,
   * PMTC). Surfaced in the calculator as the "tariff cost per truckload"
   * angle: 50% duty (S338 in effect Aug 22, 2026; autos/steel to 50%
   * Jan 1, 2027; Canada retaliation Sept 8, 2026) applied to the load
   * value the user enters. We never invent per-load values — the load
   * value IS the calculator's existing shipment-value input.
   */
  var TRUCKING_IMPACT = {
    blog_slug: 'canada-tariff-trucking-freight-impact',
    blog_title: 'How the 50% Canada Tariffs Hit Freight Volumes and Carriers',
    rate_notes: {
      s338: '50% Section 338 duty (effective Aug 22, 2026)',
      threatened: 'autos/steel to 50% announced for Jan 1, 2027 (NOT in effect)',
      retaliation: 'Canada counter-tariffs 15/25/50% tiers (effective Sept 8, 2026)'
    },
    stats: {
      canada_trade_with_us_pct: 72,
      truck_share_pct: 60
    },
    impact: [
      'Weaker Canadian exports translate directly into fewer loads for trucking companies (CTA).',
      'Fewer Canadian trucks operating in the US means less Canadian equipment available to haul American goods northbound — a severe, structural equipment imbalance (CTA).',
      'On cancelled/rejected/delayed shipments the truck still has operating costs: driver pay, fuel already purchased, plus detention, storage, redelivery and empty-mile expenses (CTOA).',
      '72% of Canada\'s trade is with the US, and roughly 60% of the total trade is moved by truck (PMTC).'
    ],
    source_citations: [
      'Truck News: Trucking groups warn tariff fallout will hit freight volumes, carriers (Aug 24, 2026) — https://www.trucknews.com/transportation/trucking-groups-warn-tariff-fallout-will-hit-freight-volumes-carriers/1003220384',
      'CTA statement on conclusion of Canada-U.S. trade negotiations — https://cantruck.ca/cta-statement-on-conclusion-of-canada-u-s-trade-negotiations-and-impact-on-supply-chain',
      'CBS News: Trump announces 50% tariffs on Canadian auto and steel (Aug 24, 2026) — https://www.cbsnews.com/news/trump-canadian-automotive-steel-tariffs'
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
   * Canada retaliation helper — US-origin goods shipped TO Canada.
   * Canada's counter-tariffs (15/25/50% tiers, rate for rate matching the
   * corresponding US rate) apply on/after 2026-09-08 12:01 a.m. ET to the
   * categories covered by the official 874-item list; before that date the
   * measure is PENDING (0 duty). Each category resolves to its verified
   * dominant tier (category_tiers); the exact HTS line governs the real
   * rate — see representative_products for HS-level examples.
   *
   * opts.lineHs (optional): an explicit HTS line (e.g. '0402.10.10').
   * When it matches a representative_products entry for the category, the
   * applied rate becomes THAT line's verified tier (milk powder 50%,
   * cheese 25%); otherwise the category default stands. Omit it for the
   * unchanged category behaviour.
   */
  // Normalize an HS/HTS code for line matching: digits only, so
  // '0402.10.10' and '04021010' both match the same representative line.
  function normalizeHsLine(v) {
    if (v === undefined || v === null) return '';
    return String(v).replace(/[^0-9]/g, '');
  }

  function canadaRetaliationRate(category, opts) {
    opts = opts || {};
    var ret = CANADA_RETALIATION;
    var qDateStr;
    if (opts.asOfDate) {
      qDateStr = String(opts.asOfDate).slice(0, 10);
    } else {
      qDateStr = new Date().toISOString().slice(0, 10); // today
    }
    var targeted = ret.sector_categories.indexOf(category) !== -1;
    var applies = targeted && qDateStr >= ret.effective;
    var tierRate = targeted ? (ret.category_tiers[category] || 0) : 0;
    // Optional explicit HS-line override (opts.lineHs): the exact HTS line
    // governs the real rate, and tiers vary WITHIN a category — e.g. ch. 04
    // cheese lines are 25% while the milk-powder lines are 50%. When the
    // caller passes a line that matches an entry in representative_products
    // for this category, that entry's verified `tier` is the applied rate.
    // Otherwise (and when no lineHs is passed at all) the category_tiers
    // default above is used, exactly as before.
    var lineHs = normalizeHsLine(opts.lineHs);
    var lineMatch = null;
    if (lineHs && targeted) {
      var repsAll = ret.representative_products || [];
      lineMatch = repsAll.filter(function (p) {
        return p.category === category && normalizeHsLine(p.hs) === lineHs;
      })[0] || null;
      if (!lineMatch && lineHs.length >= 6) {
        // Subheading-level input (e.g. '040210'): accept it only when it
        // resolves to exactly one representative line for this category.
        var prefixed = repsAll.filter(function (p) {
          return p.category === category && normalizeHsLine(p.hs).indexOf(lineHs) === 0;
        });
        if (prefixed.length === 1) lineMatch = prefixed[0];
      }
    }
    var appliedTierRate = lineMatch ? lineMatch.tier : tierRate;
    var rate = applies ? appliedTierRate : 0;
    // Normalize the numeric tier to the object key ('0.50' — String(0.5) is '0.5')
    var tierKey = appliedTierRate === 0.5 ? '0.50' : String(appliedTierRate);
    var tierInfo = appliedTierRate ? ret.tiers[tierKey] : null;
    var reps = targeted
      ? ret.representative_products.filter(function (p) { return p.category === category; })
      : [];
    return {
      rate: rate,
      breakdown: {
        mfn: 0,
        categoryAdd: 0,
        section301: 0,
        chinaExisting301: 0,
        proposed: 0,
        usmcaQualified: false,
        type: 'retaliation',
        cap: null,
        s232: null,
        drone: null,
        beef: null,
        s338: null,
        canadaRetaliation: {
          applies: applies,
          targeted: targeted,
          rate: rate,
          presetKey: ret.preset_key || 'canada-sept8-counter-tariffs',
          presetLabel: ret.preset_label || 'Canada Sept 8 Counter-Tariffs',
          tierRate: tierRate,
          tierLabel: tierInfo ? tierInfo.label : null,
          tierItemCount: tierInfo ? tierInfo.item_count : null,
          tierReleaseNote: tierInfo ? tierInfo.release_note : null,
          // Explicit HS-line override state (additive): when a specific
          // product line was requested and matched a verified
          // representative_products entry, `rate`/`tierLabel` above are that
          // line's tier and `appliedSource` is 'line'. Otherwise
          // 'category' and the category_tiers default is used.
          lineRequested: lineHs || null,
          lineMatched: !!lineMatch,
          lineTier: lineMatch ? lineMatch.tier : null,
          matchedProduct: lineMatch ? lineMatch.product : null,
          matchedHs: lineMatch ? lineMatch.hs : null,
          appliedSource: lineMatch ? 'line' : 'category',
          baseRate: ret.rate,
          effective: ret.effective,
          effectiveLabel: ret.effective_label,
          framework: ret.framework,
          announced: ret.announced,
          valueAffected: ret.value_affected,
          listSize: ret.list_size,
          originRule: ret.origin_rule,
          inTransit: ret.in_transit,
          sectors: ret.sectors,
          sectorCategories: ret.sector_categories,
          categoryTiers: ret.category_tiers,
          tiers: ret.tiers,
          representativeProducts: reps,
          askedDate: qDateStr,
          status: ret.status,
          source_citations: ret.source_citations
        }
      }
    };
  }

  /*
   * Effective-rate computation used by the calculator AND tests.
   * @param countrySlug  e.g. 'vietnam'
   * @param category     e.g. 'electronics'
   * @param opts { usmcaQualified: bool (default true for CA/MX),
   *              includeProposed: bool (default false),
   *              asOfDate: Date|string (default today) — controls
   *                        Section 232 effective-date gating,
   *              direction: 'to-canada' — US-origin goods imported into
   *                        Canada; applies CANADA_RETALIATION to the six
   *                        targeted sectors on/after 2026-09-08,
   *              lineHs: string — optional explicit HTS line for the
   *                        to-canada direction; when it matches a
   *                        representative_products entry for the category,
   *                        that line's verified tier is applied instead of
   *                        the category default (milk powder 0402.10.10 ->
   *                        50%, cheese 0406.20.11 -> 25%) }
   * Returns { rate, breakdown: {...} } where rate is the estimated
   * effective duty rate (decimal).
   */
  function effectiveRate(countrySlug, category, opts) {
    opts = opts || {};

    // Canada retaliation direction: US goods entering Canada. The US is
    // not in the Section 301 matrix; the relevant duty is Canada's
    // dollar-for-dollar retaliation (or PENDING, before Sept 8, 2026).
    if (opts.direction === 'to-canada') {
      if (countrySlug === 'us') {
        return canadaRetaliationRate(category, opts);
      }
      return null; // to-canada is only defined for US-origin goods
    }

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
    // and 2027-02-09 (Annex III components + end of the Blue UAS deferral).
    //
    // Tier resolution (t_a836cab0, Sept 3, 2026 preset):
    //   - Legacy callers may still pass opts.droneTier
    //     ('annex_i' | 'annex_ii' | 'annex_iii') and get the manual-tier
    //     behavior unchanged (tests, older article pages).
    //   - The calculator UI now passes product ATTRIBUTES instead:
    //     opts.droneThermal (bool), opts.droneHeavy (bool: MTOW > 25 kg /
    //     ~55 lb), opts.blueUas (bool: supplier listed on DoD Blue UAS
    //     Cleared List / Blue UAS Framework / FCC Conditional Approval List
    //     as of Sept 2, 2026). Finished-drone truth table per rule spec:
    //       thermal OR >25 kg            -> Annex I  (100%)
    //       non-thermal AND <=25 kg      -> Annex II (25%)
    //       Blue UAS-listed, D1 (Sept 3 2026 - Feb 8 2027) -> deferred 0%
    //       Blue UAS-listed, D2 (Feb 9 2027+) -> full rate (deferral ended)
    //       entry before Sept 3, 2026   -> not subject
    //   Allied carve-outs cap the TOTAL rate (incl. Column 1): EU/JP/KR/TW/
    //   CH/LI <= 15%, UK <= 10% — origin-conditional ("substantially all"
    //   components and tech certified to originate there or in the US).
    var droneAdd = 0;
    var droneDetails = null;
    if (category === 'drones') {
      var uas = SECTION_232_UAS;
      var droneQDateStr;
      if (opts.asOfDate) {
        droneQDateStr = String(opts.asOfDate).slice(0, 10);
      } else {
        droneQDateStr = new Date().toISOString().slice(0, 10); // today
      }
      var attrMode = opts.droneThermal !== undefined ||
        opts.droneHeavy !== undefined ||
        opts.blueUas !== undefined;
      var thermalFlag = opts.droneThermal === true || opts.droneThermal === 'yes' || opts.droneThermal === 1;
      var heavyFlag = opts.droneHeavy === true || opts.droneHeavy === 'over' || opts.droneHeavy === 1;
      var blueUasFlag = opts.blueUas === true || opts.blueUas === 'yes' || opts.blueUas === 'blue-uas' || opts.blueUas === 1;

      var tierKey;
      if (!attrMode && opts.droneTier && uas.tiers[opts.droneTier]) {
        tierKey = opts.droneTier; // legacy explicit tier (annex_i/ii/iii)
      } else if (attrMode) {
        // Truth table: thermal imaging OR MTOW > 25 kg -> 100% Annex I;
        // non-thermal AND <=25 kg -> 25% Annex II.
        tierKey = (thermalFlag || heavyFlag)
          ? uas.attr_model.thermal_flag_rate_tier
          : uas.attr_model.standard_flag_rate_tier;
      } else {
        tierKey = uas.default_tier; // backward-compatible heavy-exposure default
      }
      var tier = uas.tiers[tierKey];

      // Finished-drone not-subject window: entries before 12:01 a.m. ET
      // Sept 3, 2026 are NOT subject to the Section 232 drone duty (D0).
      var droneNotSubject = droneQDateStr < '2026-09-03';
      var droneApplies = droneQDateStr >= tier.applies_from;
      // Blue UAS deferral (Proclamation §7): listed suppliers' covered
      // products pay 0% Section 232 until Feb 9, 2027, then the full rate.
      var deferralEnds = (uas.blue_uas_deferral && uas.blue_uas_deferral.deferral_ends) || '2027-02-09';
      var droneDeferred = blueUasFlag && droneApplies &&
        droneQDateStr < deferralEnds && tierKey !== 'annex_iii';

      if (droneApplies && !droneDeferred) {
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
        notSubject: droneNotSubject,
        deferred: droneDeferred,
        deferralEnds: deferralEnds,
        blueUas: blueUasFlag,
        thermal: thermalFlag,
        heavy: heavyFlag,
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

    // Ground beef — Proclamation 11059 beef TRQ increase (IN FORCE).
    // Date-gated on the tranche window (Sept 1 - Nov 30, 2026). Inside the
    // window the added in-quota quantity avoids the 26.4% out-of-quota rate,
    // so the ad valorem add modelled here is 0; the entry is NOT duty-free —
    // the 4.4¢/kg in-quota rate of duty applies (flagged in the result UI).
    // Outside the window the 26.4% out-of-quota rate applies.
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
        beefAdd = 0; // 26.4% out-of-quota rate avoided under the added in-quota quantity
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
        instrument: gw.instrument,
        instrumentType: gw.instrument_type,
        signed: gw.signed,
        published: gw.published,
        federalRegister: gw.federal_register,
        authority: gw.authority,
        tranches: gw.tranches,
        administration: gw.administration,
        allocation: gw.allocation,
        volumeMt: gw.volume_mt,
        volumeLbApprox: gw.volume_lb_approx,
        inQuotaRate: gw.in_quota_rate,
        outQuotaRate: gw.out_quota_rate,
        inQuotaApplies: gw.in_quota_rate_applies,
        dutyFree: gw.duty_free,
        targetDiscount: gw.target_discount,
        discountMechanism: gw.discount_mechanism,
        retailPrice: gw.retail_price,
        htsScope: gw.hts_scope,
        htsPrecedent: gw.hts_precedent,
        proclamationStatus: gw.proclamation_status,
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
        scopeChange: SECTION_338_CANADA.scope_change,
        importBans: SECTION_338_CANADA.import_bans,
        stackingNote: SECTION_338_CANADA.stacking_note,
        usmcaNote: SECTION_338_CANADA.usmca_note,
        gsaDirective: SECTION_338_CANADA.gsa_directive,
        source_citations: SECTION_338_CANADA.source_citations
      };
    }

    // Brazil Section 301 — 25% additional duty (IN EFFECT July 22, 2026).
    // Applies to non-exempt Brazilian goods (HTS 9903.05.01); stacks with
    // the 12.5% forced-labor Section 301 rate (SECTION_301.brazil,
    // 9903.05.27) per PIIE (up to 37.5% combined). Exempt: pharma
    // (9903.05.06), Section 232-covered articles (9903.05.07), civil
    // aircraft (9903.05.05), beef, and the ~1,200 standard annex lines;
    // donations/informational materials excluded. Post-consultation
    // what-if scenarios selectable via opts.brazilScenario
    // ('current' | 'reduced_20' | 'reduced_15' | 'reduced_10' | 'removed')
    // — default 'current' (25%). What-if rates are NOT in effect.
    var brazil301Add = 0;
    var brazil301Details = null;
    if (countrySlug === 'brazil') {
      var br = BRAZIL_301;
      var brQDateStr;
      if (opts.asOfDate) {
        brQDateStr = String(opts.asOfDate).slice(0, 10);
      } else {
        brQDateStr = new Date().toISOString().slice(0, 10); // today
      }
      var brApplies = brQDateStr >= '2026-07-22';
      var brExempt = br.exempt_categories.indexOf(category) !== -1;
      // The action covers ALL imports of Brazil "with certain exemptions"
      // (USTR FRN) — subject unless in exempt_categories.
      var brSubject = !brExempt;
      var brScenarioKey = (opts.brazilScenario && br.scenarios[opts.brazilScenario]) ? opts.brazilScenario : 'current';
      var brScenario = br.scenarios[brScenarioKey];
      if (brApplies && brSubject) {
        brazil301Add = brScenario.rate;
      }
      brazil301Details = {
        applies: brApplies && brSubject,
        rate: brazil301Add,
        baseRate: br.rate,
        scenario: brScenarioKey,
        scenarioLabel: brScenario.label,
        scenarioInEffect: brScenario.in_effect,
        effective: br.effective,
        noticeDate: br.notice_date,
        frnPublished: br.frn_published,
        frnCite: br.frn_cite,
        authority: br.authority,
        heading: br.heading,
        headings: br.headings,
        exempt: brExempt,
        subject: brSubject,
        subjectHighlights: br.subject_highlights,
        exemptSubheadings: br.exempt_subheadings,
        standardExemptLines: br.standard_exempt_lines,
        aircraftCarveoutLines: br.aircraft_carveout_lines,
        exemptCategoriesList: br.exempt_categories_list,
        s232Excluded: br.s232_excluded,
        stacking: br.stacking,
        tradeContext: br.trade_context,
        affectedShare: br.affected_share,
        askedDate: brQDateStr,
        status: br.status,
        source_citations: br.source_citations
      };
    }

    var rate;
    if (category === 'ground-beef') {
      // TRQ-governed product: generic MFN/category base does not apply.
      // The effective rate IS the beef component: 0 under the 90-day waiver
      // (out-of-quota tariff waived), else the 26.4% out-of-quota rate.
      rate = beefAdd;
    } else {
      rate = base + s301Add + chinaExisting + proposedAdd + s232Add + droneAdd + beefAdd + s338Add + brazil301Add;
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
        s338: s338Details,
        brazil301: brazil301Details
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
    CANADA_RETALIATION: CANADA_RETALIATION,
    TRQ_CANNED_VEG: TRQ_CANNED_VEG,
    trqCannedVegSurtax: trqCannedVegSurtax,
    COPPER_PENDING: COPPER_PENDING,
    copperLandedCost: copperLandedCost,
    BRAZIL_301: BRAZIL_301,
    TRUCKING_IMPACT: TRUCKING_IMPACT,
    REJECTED_DEAL_PRESET: REJECTED_DEAL_PRESET,
    PRODUCT_SCOPE: PRODUCT_SCOPE,
    USMCA: USMCA,
    EXEMPTION_NOTES: EXEMPTION_NOTES,
    effectiveRate: effectiveRate
  };
}));
