/*
 * CANADA TRQ — CANNED VEGETABLES — preset data file (t_e2d32b63)
 * -----------------------------------------------------------------
 * Single source of truth for the 'TRQ surtax' calculator mode. Loaded by
 * index.html BEFORE tariff-data.js:
 *
 *     <script src="presets/canada-sept8-counter-tariffs.js"></script>
 *     <script src="presets/canada-trq-canned-vegetables.js"></script>
 *     <script src="tariff-data.js"></script>
 *
 * tariff-data.js resolves TRQ_CANNED_VEG from this file
 * (window.CANADA_TRQ_PRESET in browser, require() in Node), so if the
 * Governor in Council adopts, amends or rejects the recommendation the
 * rates/thresholds can be updated by EDITING THIS FILE ONLY — no
 * calculator logic changes.
 *
 * DATA SOURCE: CITT, Safeguard Inquiry into the Importation of Certain
 * Vegetable Goods, GC-2025-001, report submitted to the Governor in
 * Council September 9, 2026 — https://decisions.citt-tcce.gc.ca/citt-tcce/s/en/521601/1/document.do
 * (¶301–302 for the remedy figures; ¶255 for US inclusion; ¶306, ¶318,
 * ¶326 for the "TRQ is not a quota" quotes). Nothing here is taken from
 * the WSJ/Dow Jones wire rounding ("about 30 million pounds",
 * "40% to 50%"): the wire is accurate in substance but rounds the
 * in-quota volume into pounds and flattens the declining surtax schedule.
 *
 * STATUS: RECOMMENDED, NOT ADOPTED (as of 2026-09-10). The measure that is
 * IN FORCE is the 10% provisional safeguard surtax (CBSA Customs Notice
 * 26-14 / Finance Canada), effective June 19, 2026 for up to 200 days,
 * which EXEMPTS US, Mexican, Chilean, Israeli and developing-country
 * goods. The CITT recommendation would replace it with a three-year TRQ
 * that includes the US. Do NOT present the TRQ rates as current law.
 *
 * PRODUCT SCOPE: canned (metal-can) goods only, per CBSA Customs Notice
 * 26-14 — corn; peas; green beans; wax beans; mixes of peas and carrots;
 * mixed vegetables; white, black, red and pinto beans; chickpeas.
 * Glass-jarred vegetables are excluded; frozen vegetables are NOT covered
 * by either the injury finding or the recommended remedy.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CANADA_TRQ_PRESET = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // International avoirdupois pound. The kg figures are the source's own
  // numbers (CITT ¶302); the lb figures are this file's arithmetic on them.
  var KG_TO_LB = 2.2046226218;

  function lb(kg) { return Math.round(kg * KG_TO_LB); }

  var YEARS = [
    { year: 1, in_quota_kg: 13000000, in_quota_lb: lb(13000000), above_quota_surtax: 0.50 },
    { year: 2, in_quota_kg: 13260000, in_quota_lb: lb(13260000), above_quota_surtax: 0.45 },
    { year: 3, in_quota_kg: 13525200, in_quota_lb: lb(13525200), above_quota_surtax: 0.40 }
  ];

  return {
    preset_key: 'canada-trq-canned-vegetables',
    preset_label: 'Canada TRQ — Canned Vegetables',
    status: 'RECOMMENDED — NOT ADOPTED',
    status_short: 'Recommended, awaiting adoption',
    recommendation: 'CITT, Safeguard Inquiry into the Importation of Certain Vegetable Goods, GC-2025-001',
    recommendation_date: '2026-09-09',
    recommendation_url: 'https://decisions.citt-tcce.gc.ca/citt-tcce/s/en/521601/1/document.do',
    instrument: 'Three-year tariff-rate quota (TRQ) recommended to the Governor in Council',
    adoption_basis: 'The report is a recommendation to the Governor in Council; only Cabinet decides (¶281). No implementing Order in Council existed as of 2026-09-10.',
    kg_to_lb: KG_TO_LB,
    years: YEARS,
    default_year: 1,
    default_volume_lb: 30000000, // the card's worked example (above the year-1 line)
    escalation_basis: 'The in-quota volume rises 2% a year: "it is reasonable to expect that the total domestic market will increase by 2% each year during the period of application of the TRQ" (¶309).',
    administration: 'Recommended administration: "a quarterly allocation model on a first-come, first-served basis, without any allocation by countries" (¶302).',
    baseline_note: 'The year-1 in-quota volume is set "at around the total volume of imports for calendar year 2024" (¶301) — so 13,000,000 kg is the recommended figure, not a published 2024 import total.',

    // What is actually in force while the recommendation sits with Cabinet.
    in_force: {
      measure: 'Provisional safeguard surtax — 10% of the value for duty',
      rate: 0.10,
      effective: '2026-06-19',
      duration: 'up to 200 days beginning on June 19, 2026 (day 200 = Jan 5, 2027; last full day Jan 4, 2027), or earlier if replaced by final measures',
      exemptions: 'Does NOT apply to goods originating in Canada, the United States, Mexico, Chile, or Israel / another CIFTA beneficiary, or in a developing country or territory listed in Schedule 2 to the Order',
      scope: 'Canned (metal-can) vegetables only — see product_scope',
      cbsa_notice: 'https://www.cbsa-asfc.gc.ca/publications/cn-ad/cn26-14-eng.html',
      finance_url: 'https://www.canada.ca/en/department-finance/news/2026/06/canada-announces-provisional-safeguard-tariff-on-imports-of-canned-vegetables-to-protect-canadian-producers.html',
      minister_url: 'https://www.canada.ca/en/department-finance/news/2026/09/statement-by-the-minister-of-finance-on-the-canadian-international-trade-tribunal-s-report-on-global-imports-of-canned-and-frozen-vegetables.html'
    },

    // Country coverage of the recommendation: a global measure MINUS named
    // exclusions (¶255, ¶257–275). Never print a positive "US, China, EU"
    // list as if the Tribunal enumerated it.
    coverage: {
      construction: 'Applies to canned vegetable goods from all sources EXCEPT the countries listed below — and therefore includes the US, China and EU members.',
      included_examples: ['United States', 'China', 'European Union members'],
      excluded: [
        'Mexico', 'Israel and other CIFTA beneficiaries', 'Chile',
        'Panama', 'Peru', 'Colombia', 'South Korea', 'Honduras',
        'GPT (General Preferential Tariff / developing-country) beneficiaries'
      ],
      rejected_requests: ['European Union (exclusion request expressly rejected)', 'Türkiye', 'Thailand', 'Indonesia', 'Ecuador', 'India'],
      us_inclusion: 'US imports are included because they "do account for a substantial share of imports and contribute importantly to the serious injury" (¶255) — US volumes rose 151% in 2025 after falling 17% in 2024.',
      us_inclusion_note: 'Adopting the recommendation would end the US exemption from the safeguard measure for the first time.'
    },

    // Canned (metal-can) products in scope, per CBSA Customs Notice 26-14 ¶8–10, 25–28.
    product_scope: [
      { value: 'corn', label: 'Canned corn' },
      { value: 'peas', label: 'Canned peas' },
      { value: 'green-beans', label: 'Canned green beans' },
      { value: 'wax-beans', label: 'Canned wax beans' },
      { value: 'peas-carrots', label: 'Canned mixes of peas and carrots' },
      { value: 'mixed-vegetables', label: 'Canned mixed vegetables' },
      { value: 'white-beans', label: 'Canned white beans' },
      { value: 'black-beans', label: 'Canned black beans' },
      { value: 'red-beans', label: 'Canned red beans' },
      { value: 'pinto-beans', label: 'Canned pinto beans' },
      { value: 'chickpeas', label: 'Canned chickpeas' }
    ],
    scope_exclusions: [
      'Vegetables packaged in glass jars are NOT subject to the Order — only the listed canned vegetables packaged in metal cans.',
      'Frozen vegetables are not covered: the Tribunal found no serious injury for frozen goods and recommends no remedy for them.',
      'Chapter 98 classifications, fresh/dried/frozen vegetables, ready-to-eat meals where vegetables are not primary, and purées, powders, juices, spreads, dips and pastes are outside the scope.'
    ],
    scope_hs_numbers: [
      '2005.40.00.00', '2005.51.90.19', '2005.51.90.90', '2005.59.00.00',
      '2005.80.00.00', '2005.99.11.00', '2005.99.19.00', '2005.99.20.19',
      '2005.99.20.99', '2005.99.90.15', '2005.99.90.18', '2005.99.90.19',
      '2005.99.90.98', '2005.99.90.99'
    ],
    scope_hs_note: 'The 14 tariff classification numbers listed in Appendix A to the Order (CBSA Customs Notice 26-14). Product names above appear in the notice; the notice, not this tool, governs classification.',

    // Verbatim quotes used for the on-screen "above-quota imports stay legal" note.
    legal_note: 'Above-quota imports remain legal. A TRQ is a tariff, not a ban: it does not cap how much may be imported, it only changes the price of the volume above the line.',
    legal_quotes: [
      { text: 'the recommended TRQ does not preclude additional imports. It would only affect their prices.', cite: 'CITT GC-2025-001 ¶306' },
      { text: 'a TRQ does not restrict sourcing availability or limits the quantities of canned vegetable goods that can be imported.', cite: 'CITT GC-2025-001 ¶326' },
      { text: 'TRQs have the least impact on food availability because they do not impose limits on the volume of imported goods', cite: 'CITT GC-2025-001 ¶318' }
    ],

    sources: [
      { label: 'CITT GC-2025-001 report (September 9, 2026)', url: 'https://decisions.citt-tcce.gc.ca/citt-tcce/s/en/521601/1/document.do' },
      { label: 'CITT news release — Tribunal submits report concerning certain vegetable goods', url: 'https://citt-tcce.gc.ca/en/news/tribunal-submits-report-concerning-certain-vegetable-goods' },
      { label: 'CBSA Customs Notice 26-14 (10% provisional surtax, in force)', url: 'https://www.cbsa-asfc.gc.ca/publications/cn-ad/cn26-14-eng.html' },
      { label: 'Finance Canada — provisional safeguard tariff announcement (June 2026)', url: 'https://www.canada.ca/en/department-finance/news/2026/06/canada-announces-provisional-safeguard-tariff-on-imports-of-canned-vegetables-to-protect-canadian-producers.html' },
      { label: 'Finance Canada — Minister\u2019s statement on the CITT report (September 9, 2026)', url: 'https://www.canada.ca/en/department-finance/news/2026/09/statement-by-the-minister-of-finance-on-the-canadian-international-trade-tribunal-s-report-on-global-imports-of-canned-and-frozen-vegetables.html' },
      { label: 'Baker McKenzie — Canada implements provisional safeguard measure on imports of canned vegetables', url: 'https://globalimportblog.bakermckenzie.com/2026/06/30/canada-implements-provisional-safeguard-measure-on-imports-of-canned-vegetables/' }
    ],

    verified: '2026-09-10'
  };
}));
