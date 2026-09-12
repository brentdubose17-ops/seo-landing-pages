/*
 * REFINED COPPER — PENDING SECTION 232 DUTY SCENARIO — preset data file
 * kanban t_7ecb5089
 * -----------------------------------------------------------------------
 * Single source of truth for the 'Copper — pending duty scenario'
 * calculator mode on index.html. Loaded BEFORE tariff-data.js:
 *
 *     <script src="presets/canada-sept8-counter-tariffs.js"></script>
 *     <script src="presets/canada-trq-canned-vegetables.js"></script>
 *     <script src="presets/refined-copper-tariff-pending.js"></script>
 *     <script src="tariff-data.js"></script>
 *
 * tariff-data.js resolves COPPER_PENDING from this file
 * (window.COPPER_TARIFF_PRESET in the browser, require() in Node), so the
 * day the White House publishes an instrument the scenario becomes a real
 * rate by EDITING THIS FILE (or flipping `in_effect`) — no calculator-logic
 * change.
 *
 * STATUS: PENDING — NOT IN EFFECT (as of 2026-09-11). Reuters reported on
 * Sept 10, 2026 that the White House "has not yet made a decision on
 * refined copper tariffs"; a White House official said the administration
 * "continues to evaluate all options to reshore copper and other critical
 * manufacturing back to the United States" and confirmed Commerce supplied
 * its update by the June 30 deadline. The pending state is corroborated by
 * ABSENCE of an instrument: a Federal Register check finds no refined-copper
 * instrument, and the two 2026 copper proclamations (Apr 9 / Jun 4) cover
 * semi-finished and derivative articles only — neither contains the word
 * "refined". NOTHING IS COLLECTIBLE on refined copper. Never present this
 * scenario as current law.
 *
 * RATE BAND: the reported (recommended, NOT adopted) schedule is 15% from
 * January 1, 2027, rising to 30% in 2028 ("Trump tasked Commerce Secretary
 * Howard Lutnick with updating him by June on copper markets and
 * recommending whether to impose a 15% tariff starting on January 1, 2027,
 * that would rise to 30% in 2028" — Reuters wire, Sept 10, 2026). The
 * scenario band is therefore 0–30%, not 0–25%: a 25% cap would make the
 * reported 2028 step unmodelable. 15% is the reference case; the default
 * input is 10% so the first number on screen is not the recommendation.
 *
 * PRICE BASIS: US transaction value of the copper (the page's worked
 * example assumes 20 t at the LME 3-month level, excluding international
 * freight and insurance). LME and COMEX quote different units — USD per
 * tonne and USD per pound — so the market choice sets the input unit and
 * the conversion is done here, at 2,204.6226218 lb per metric tonne.
 *
 * SOURCE PACK: SOURCE-PACK-refined-copper-tariff.md (kanban t_7c0ca1de),
 * 21 sources / 30 verbatim quotes, sources.py verify --evidence --strict
 * exit 0. Every figure in this file is either taken from that pack or is
 * arithmetic on it.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.COPPER_TARIFF_PRESET = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // International avoirdupois pound: 1 metric tonne = 1000 kg.
  var LB_PER_TONNE = 2204.6226218;

  var MARKETS = [
    {
      value: 'lme',
      label: 'LME 3-month — USD per metric tonne',
      unit_label: 'USD per metric tonne',
      price_basis: 'per_tonne',
      default_price: 14230,
      default_price_label: 'LME 3-month ~$14,230/t (Sept 11, 2026)',
      default_price_source: 'LME three-month copper was unchanged at $14,230 per metric tonne during the official open outcry on September 11, 2026 — the metal\u2019s first weekly decline since June, week \u2248 -1.6%.',
      default_price_confidence: 'Medium \u2014 Reuters syndication via Energy News (OEDigital), Sept 11, 2026; corroborated by Scrap Monster\u2019s Sept 4\u201310 weekly close of $14,233.50/t.'
    },
    {
      value: 'comex',
      label: 'COMEX front month — USD per pound',
      unit_label: 'USD per pound',
      price_basis: 'per_pound',
      default_price: null,
      default_price_label: null,
      default_price_source: null,
      default_price_confidence: null,
      hint: 'No COMEX settlement is reproduced here \u2014 only the intraday move is sourced: COMEX October futures fell more than 4% intraday to about $6.585/lb on September 10, 2026 and traded near $6.85/lb on September 8. Enter the COMEX level you are working from, in USD per pound; it is converted to USD per tonne at 2,204.6226218 lb/t.'
    }
  ];

  // What the report says, and what the model will and will not do with it.
  var RATE_DEFAULT_PCT = 10;
  var RATE_MIN_PCT = 0;
  var RATE_MAX_PCT = 30;
  var RATE_REFERENCE_PCT = 15;

  return {
    preset_key: 'refined-copper-tariff-pending',
    preset_label: 'Refined copper \u2014 pending Section 232 duty scenario',
    status: 'PENDING \u2014 NOT IN EFFECT (as of September 11, 2026)',
    status_short: 'Pending \u2014 not in effect',
    in_effect: false,
    as_of: '2026-09-11',

    // The single sentence every render must carry somewhere on screen.
    disclaimer: 'No refined-copper tariff is in effect. No proclamation, Federal Register notice or Commerce determination creates one, so no duty on refined copper (cathode, anode or concentrate) is currently collectible at the border. This is a scenario, not a rate you can bill against.',
    disclaimer_short: 'PENDING \u2014 not in effect. No duty is currently collectible.',

    // Why the state is "pending" rather than "unknown".
    basis: 'Reuters (Sept 10, 2026): the White House "has not yet made a decision on refined copper tariffs"; a White House official said the administration "continues to evaluate all options to reshore copper and other critical manufacturing back to the United States". Absence check: the Federal Register carries no refined-copper instrument, and the Apr 9 and Jun 4, 2026 copper proclamations cover semi-finished and derivative articles only \u2014 neither contains the word "refined".',

    // What is actually in force on copper today (so the scenario is not
    // mistaken for the existing Section 232 regime).
    in_force: {
      measure: 'Section 232 on semi-finished and derivative copper articles',
      detail: 'The pre-existing Section 232 copper regime applies to articles made of the metal (50%) and derivative products (25%), with a temporarily-reduced 15% on a subset (fixed industrial machinery, power equipment, agricultural equipment, certain residential HVAC). The open question is whether REFINED cathode joins that schedule \u2014 nothing in the 2026 proclamations reaches refined copper.',
      sources: [
        { label: 'White House \u2014 Further Adjusting the Tariff Regimes for Imports of Aluminum, Steel, and Copper (Jun 2026)', url: 'https://www.whitehouse.gov/presidential-actions/2026/06/further-adjusting-the-tariff-regimes-for-imports-of-aluminum-steel-and-copper-into-the-united-states' },
        { label: 'Federal Register \u2014 Presidential Document (published Jun 4, 2026)', url: 'https://www.federalregister.gov/documents/2026/06/04/2026-11314/further-adjusting-the-tariff-regimes-for-imports-of-aluminum-steel-and-copper-into-the-united-states' },
        { label: 'Federal Register \u2014 Proclamation 11021 (published Apr 9, 2026)', url: 'https://www.federalregister.gov/documents/2026/04/09/2026-06960/strengthening-actions-taken-to-adjust-imports-of-aluminum-steel-and-copper-into-the-united-states' },
        { label: 'Federal Register / BIS \u2014 proposed duties on additional derivative articles (published Aug 6, 2026)', url: 'https://www.federalregister.gov/documents/2026/08/06/2026-15961/request-for-public-comments-on-the-proposed-implementation-of-duties-on-additional-aluminum-steel' }
      ]
    },

    lb_per_tonne: LB_PER_TONNE,
    markets: MARKETS,
    default_market: 'lme',

    quantity: {
      unit: 'metric tonnes (t)',
      unit_short: 't',
      default_t: 20,
      note: 'The page\u2019s worked example is 20 tonnes of refined copper cathode.'
    },

    rate: {
      default_pct: RATE_DEFAULT_PCT,
      min_pct: RATE_MIN_PCT,
      max_pct: RATE_MAX_PCT,
      step_pct: 0.5,
      reference_pct: RATE_REFERENCE_PCT,
      band_note: 'Scenario band 0\u201330%. The reported (recommended, not adopted) schedule is 15% from January 1, 2027 rising to 30% in 2028, so a 25% cap would make the reported 2028 step unmodelable. 15% is the reference case; the default input is 10%.',
      reference_label: '15% \u2014 recommended phase-in (NOT adopted)',
      basis: 'Reuters wire, Sept 10, 2026: "Trump tasked Commerce Secretary Howard Lutnick with updating him by June on copper markets and recommending whether to impose a 15% tariff starting on January 1, 2027, that would rise to 30% in 2028."'
    },

    // The reference cases the page copy tabulates, in order.
    reference_cases: [
      { pct: 0, label: '0% \u2014 today', note: 'What is actually in force: nothing, on refined copper.' },
      { pct: 10, label: '10% \u2014 default input', note: 'A round scenario rate, used as this mode\u2019s default.' },
      { pct: 15, label: '15% \u2014 recommended phase-in (NOT adopted)', note: 'The rate the reported recommendation would start at on January 1, 2027.' },
      { pct: 25, label: '25%', note: 'Inside the reported schedule\u2019s range, but not a published step.' },
      { pct: 30, label: '30% \u2014 2028 phase-in step (NOT adopted)', note: 'The second step of the reported recommendation.' }
    ],

    destinations: [
      {
        value: 'us',
        label: '\U0001F1FA\U0001F1F8 United States \u2014 importing into the US (where the pending measure would apply)',
        note: 'The pending refined-copper measure is a US import duty: the hypothetical rate is charged on the customs value of copper entered into the United States.'
      },
      {
        value: 'canada',
        label: '\U0001F1E8\U0001F1E6 Canada \u2014 US or third-country copper imported into Canada',
        note: 'Canada has no pending refined-copper tariff, but its September 8, 2026 counter-tariff list (629 tariff items) does include certain US-made refined copper products \u2014 reported at 50%. That measure IS in force and is a different action: it is NOT modelled by this scenario. Model it with the standard mode plus Shipping To = Canada.'
      },
      {
        value: 'other',
        label: '\U0001F30D Other destination',
        note: 'The scenario is a US measure. For any other destination the duty shown is illustrative only \u2014 check that jurisdiction\u2019s own tariff schedule before using it.'
      }
    ],
    default_destination: 'us',

    value_basis_note: 'Base = the US transaction value of the copper (the page\u2019s worked example excludes international freight and insurance), one ad valorem rate applied to it, no stacking, no change in FX, brokerage or financing.',

    // ---------------------------------------------------------------------
    // Page-copy mirror. `refined-copper-tariff-status.md` (kanban
    // t_19ff73b5) prints the table below and the headline sentence; the
    // calculator must reproduce both exactly, or the page fails its own
    // acceptance criterion. Tests assert against these numbers.
    // ---------------------------------------------------------------------
    scenario_reference: {
      market: 'lme',
      price_per_tonne: 14230,
      quantity_t: 20,
      duty_base_usd: 284600,
      cases: [
        { pct: 0, duty_usd: 0, landed_usd: 284600, duty_per_tonne: 0 },
        { pct: 10, duty_usd: 28460, landed_usd: 313060, duty_per_tonne: 1423 },
        { pct: 15, duty_usd: 42690, landed_usd: 327290, duty_per_tonne: 2134.5 },
        { pct: 25, duty_usd: 71150, landed_usd: 355750, duty_per_tonne: 3557.5 },
        { pct: 30, duty_usd: 85380, landed_usd: 369980, duty_per_tonne: 4269 }
      ],
      headline_rate_pct: 15,
      headline: 'if the duty lands at 15%, landed cost on this shipment moves from $284,600 to $327,290 \u2014 up $42,690, or 15.0%.'
    },

    sources: [
      { label: 'Reuters wire copy via Kitco News \u2014 "White House copper tariff plan stalls amid affordability concerns, sources say" (September 10, 2026)', url: 'https://www.kitco.com/news/off-the-wire/2026-09-10/white-house-copper-tariff-plan-stalls-amid-affordability-concerns' },
      { label: 'Reuters (canonical URL of the September 10, 2026 exclusive)', url: 'https://www.reuters.com/world/us/white-house-copper-tariff-plan-stalls-amid-affordability-concerns-sources-say-2026-09-10' },
      { label: 'TradingKey \u2014 White House Refined Copper Tariffs Remain Undecided; COMEX Copper Futures Fall Over 4% (September 10, 2026)', url: 'https://www.tradingkey.com/analysis/commodities/metal/262160992-white-house-refined-copper-tariff-still-undecided-comex-copper-tradingkey' },
      { label: 'Reuters syndication via Energy News (OEDigital) \u2014 Copper to experience first weekly decline since June (September 11, 2026)', url: 'https://energynews.oedigital.com/mineral-resources/2026/09/11/copper-to-experience-first-weekly-decline-since-june-due-to-us-tariff-concerns' },
      { label: 'Scrap Monster \u2014 Scrap Metal Prices: Weekly Market Report, September 4-10, 2026', url: 'https://www.scrapmonster.com/news/weekly-metal-price-report/scrap-metal-prices-weekly-market-report-september-4-10-2026-2026-9-11/99995' },
      { label: 'Federal Register \u2014 no refined-copper instrument; Jun 4, 2026 proclamation', url: 'https://www.federalregister.gov/documents/2026/06/04/2026-11314/further-adjusting-the-tariff-regimes-for-imports-of-aluminum-steel-and-copper-into-the-united-states' },
      { label: 'Federal Register \u2014 Apr 9, 2026 proclamation (Proclamation 11021)', url: 'https://www.federalregister.gov/documents/2026/04/09/2026-06960/strengthening-actions-taken-to-adjust-imports-of-aluminum-steel-and-copper-into-the-united-states' }
    ],

    verified: '2026-09-11'
  };
}));
