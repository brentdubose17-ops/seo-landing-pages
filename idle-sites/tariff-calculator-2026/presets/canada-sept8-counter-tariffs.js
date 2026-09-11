/*
 * CANADA SEPT 8 COUNTER-TARIFFS — preset data file (t_6d585b6a)
 * -------------------------------------------------------------
 * Single source of truth for the 'Canada Sept 8 Counter-Tariffs'
 * calculator preset. Loaded by index.html BEFORE tariff-data.js:
 *
 *     <script src="presets/canada-sept8-counter-tariffs.js"></script>
 *     <script src="tariff-data.js"></script>
 *
 * tariff-data.js resolves CANADA_RETALIATION from this file
 * (window.CANADA_SEPT8_PRESET in browser, require() in Node), so a
 * future trade deal can be reflected by EDITING THIS FILE ONLY —
 * no calculator logic changes, no risky deployment.
 *
 * DATA SOURCE: verified research dataset t_d98a84da (2026-08-31):
 * Finance Canada official list snapshot (Wayback 20260827212727) —
 * 629 tariff items (revised Aug 26 from 874): 413 at 50%, 195 at
 * 25%, 21 at 15%. CRITICAL CORRECTIONS APPLIED: autos are NOT on
 * the Sept 8 list (separate existing 25% order); fish/seafood was
 * REMOVED in the Aug 26 revision (no HS ch. 03 items remain).
 *
 * The Aug 22 / canada-50-percent-tariff preset (SECTION_338_CANADA)
 * is a SEPARATE measure and is NOT defined here.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CANADA_SEPT8_PRESET = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    preset_key: 'canada-sept8-counter-tariffs',
    preset_label: 'Canada Sept 8 Counter-Tariffs',
    effective: '2026-09-08',
    effective_label: 'Tuesday, September 8, 2026, 12:01 a.m. ET',
    framework: 'dollar-for-dollar',
    announced: '2026-08-25',
    revised: '2026-09-10', // data-file revision: Sept 8–9 US escalation sync (t_b3e29762). The official 629-item Finance Canada list itself was revised 2026-08-26.
    rate: 0.50, // headline MAXIMUM tier; per-category rates via category_tiers
    value_affected: 'C$27.6 billion in US imports (~US$20B) — about 8% of total US exports to Canada (2025 Census Bureau data)',
    list_size: { total: 629, rate_50: 413, rate_25: 195, rate_15: 21 },
    origin_rule: 'Tariffs apply only to goods originating from the US (as marked under the CUSMA marking regulations).',
    in_transit: 'Countermeasures do NOT apply to US goods already in transit to Canada on Sept 8, 2026 (the day they come into force).',
    // Verified three-tier structure (official Finance Canada list,
    // revised Aug 26, 2026 — parsed from the 629-item official list,
    // dataset t_d98a84da).
    tiers: {
      '0.50': {
        rate: 0.50,
        label: '50%',
        item_count: 413,
        release_note: 'steel and aluminum products (raised from the existing 25% counter-tariff), furniture, clothing and apparel, dairy powders, pulp and paper, plywood, cosmetics, plastics, smartphones, sporting goods, motorcycles >800cc, and new Aug 26 additions (wood charcoal, printed matter, gypsum board, glass containers, copper wire)',
        chapters: 'ch. 72 steel (134), 73 iron/steel articles (111), 76 aluminum (27), 94 furniture (18), 61-62 apparel (24), 04 dairy powders (17), 44 wood/plywood (15), 48 paper (13), 19 bakery/malt (11), 39 plastics (6), 33 cosmetics (5), 95 sporting goods (5), 35 casein/albumin (5), 85 electrical (3), 82 tools (3), 47 pulp (1), 84 machinery (1), 87 vehicles - motorcycles >800cc (1), 44 wood charcoal (2), 49 printed matter (1), 68 gypsum board (1), 70 glass containers (1), 74 copper wire (4)'
      },
      '0.25': {
        rate: 0.25,
        label: '25%',
        item_count: 195,
        release_note: 'cheese and dairy products, major appliances, carpets and textile floor coverings, household paper products, sawn wood, kitchen furniture, power tools, railway and transport equipment, electronics parts, cutlery, and certain steel and aluminum derivative products',
        chapters: 'ch. 04 cheese (34), 57 carpets (30), 84 machinery/appliances (30), 73 steel derivatives (29), 82 cutlery (20), 86 railway (16), 85 electrical (13), 44 sawn wood (5), 48 household paper (4), 94 kitchen furniture (4), 87 transport (4), 83 base-metal hardware (4), 76 aluminum (2)'
      },
      '0.15': {
        rate: 0.15,
        label: '15%',
        item_count: 21,
        release_note: 'air conditioning units/heat pumps (8415), fork-lift and works trucks (8427), lifts/conveyors/industrial robots (8428, 8431), mowers (8433), moulds (8480), metal-working dies/tools (8207)',
        chapters: 'ch. 84 machinery (19), ch. 82 tools (2)'
      }
    },
    // Default tier applied per calculator category (dominant verified
    // tier for that category's HS chapters — individual HTS lines vary;
    // e.g. dairy cheese is 25% while milk powder lines are 50%).
    // NOTE: 'auto' is intentionally ABSENT — US autos are NOT on the
    // Sept 8 list (separate existing 25% counter-tariff order).
    category_tiers: {
      steel: 0.50,                  // ch. 72/73/76 — steel, iron/steel articles, aluminum
      electronics: 0.25,            // ch. 84/85 machinery + electrical (13 of 16 ch. 85 items; smartphones 50%)
      dairy: 0.25,                  // ch. 04 — cheese/dairy (25% dominant; milk powder 50%)
      'household-appliances': 0.25, // ch. 84 — refrigerators, appliances (AC units 15%)
      'farming-equipment': 0.15,    // ch. 8433 — mowers, cutter bars (15% tier)
      'pulp-paper': 0.50,           // ch. 44/47/48 — wood, pulp, paper
      furniture: 0.50,              // ch. 94 — furniture (wooden kitchen 25%)
      textiles: 0.50,               // ch. 61/62 — apparel/clothing (carpets ch. 57 at 25%)
      food: 0.50,                   // ch. 19 bakery/malt + honey/molasses/candles (fish/seafood REMOVED Aug 26)
      chemicals: 0.50,              // ch. 39 plastics, ch. 33 cosmetics
      toys: 0.50,                   // ch. 95 sporting goods / video game consoles
      paper: 0.50                   // ch. 44/48 wood & paper (Paper & Wood category)
    },
    sectors: [
      { category: 'steel', label: 'Steel' },
      { category: 'electronics', label: 'Electronics' },
      { category: 'dairy', label: 'Dairy' },
      { category: 'household-appliances', label: 'Household Appliances' },
      { category: 'farming-equipment', label: 'Farming Equipment' },
      { category: 'pulp-paper', label: 'Pulp & Paper' }
    ],
    // Calculator categories covered by the verified 629-item list.
    // 'auto' EXCLUDED (autos not on the Sept 8 list; separate existing
    // 25% order). Fish/seafood (ch. 03) REMOVED in Aug 26 revision.
    sector_categories: ['steel', 'electronics', 'dairy', 'household-appliances', 'farming-equipment', 'pulp-paper', 'furniture', 'textiles', 'food', 'chemicals', 'toys', 'paper'],
    // Representative products drawn directly from the official 629-item
    // list (dataset t_d98a84da official-items-629.csv — every HS code
    // verified present). rate = Canada-side duty tier.
    representative_products: [
      { product: 'Flat-rolled steel coil (hot-rolled, pickled)', hs: '7208.25.00', category: 'steel', tier: 0.50 },
      { product: 'Aluminum alloy sheet / plate', hs: '7606.12.00', category: 'steel', tier: 0.50 },
      { product: 'Unwrought aluminum', hs: '7601.10.00', category: 'steel', tier: 0.50 },
      { product: 'Milk powder (fat content ≤ 1.5%)', hs: '0402.10.10', category: 'dairy', tier: 0.50 },
      { product: 'Cheese — cheddar / grated', hs: '0406.20.11', category: 'dairy', tier: 0.25 },
      { product: 'Smartphone', hs: '8517.13.00', category: 'electronics', tier: 0.50 },
      { product: 'Household refrigerator', hs: '8418.21.00', category: 'household-appliances', tier: 0.25 },
      { product: 'Air conditioner (window/wall unit)', hs: '8415.10.00', category: 'household-appliances', tier: 0.15 },
      { product: 'Mower / tractor-mounted cutter bar', hs: '8433.20.00', category: 'farming-equipment', tier: 0.15 },
      { product: 'Metal furniture', hs: '9403.20.00', category: 'furniture', tier: 0.50 },
      { product: 'Cotton t-shirt (knitted)', hs: '6109.10.00', category: 'textiles', tier: 0.50 },
      { product: 'Toilet paper (household paper)', hs: '4818.10.00', category: 'paper', tier: 0.25 },
      { product: 'Tissue / towel stock', hs: '4803.00.00', category: 'pulp-paper', tier: 0.50 },
      { product: 'Video game console', hs: '9504.50.00', category: 'toys', tier: 0.50 }
    ],
    status: 'IN EFFECT — Canada\'s counter-tariffs of 15%, 25% and 50% on C$27.6 billion (~US$20 billion) of US imports took effect 12:01 a.m. ET on Tuesday, September 8, 2026, with each product rate matching the corresponding US rate (products drawn from those targeted by US Section 338 and Section 232 tariffs; dollar for dollar, rate for rate). Official list: 629 tariff items (413 at 50%, 195 at 25%, 21 at 15%) — revised Aug 26 from the original 874-item list. CRITICAL: US automobiles are NOT on this list (they remain under the separate existing 25% counter-tariff order), and fish/seafood was REMOVED in the Aug 26 revision. Applies only to US-origin goods; US goods already in transit to Canada on Sept 8 are exempt. A C$7.5 billion support package for workers and businesses accompanies the measures. CONFIRMED ESCALATION (Sept 8–9, 2026): the U.S. escalated on Sept 8 with five proclamations signed under Section 338 of the Tariff Act of 1930 (Sept 8–9, 2026) banning imports of most Canadian alcoholic beverages, certain dairy products (including whey) and motorcycles, and adding mattresses, lamps and motorboats to the 50% duty list. The import bans and added duties take effect 12:01 a.m. ET on Tuesday, September 29, 2026 (Proclamations 11046, 11047 and 11048); a General Services Administration directive also bars Canadian products from large, long-term U.S. government contracts. There is still NO US-Canada trade deal — talks collapsed Aug 21, 2026, and USTR Greer says Canada walked away from a near-final deal. Background (Sept 6–7, 2026): no new US-Canada talks were scheduled (PMO), PM Carney called the US tariffs unjustified and unprovoked, and President Trump threatened a Bombardier US-sales block and said US auto tariffs would rise to 50% from Jan 1, 2027 — those threats were overtaken by the proclamations above. As of Sept 10, 2026, PM Carney called the US import bans "modest" and signalled Canada will not retaliate further: this 629-item list is unchanged and no new Canadian countermeasures have been announced. This data file and the page will be updated if conditions change.',
    source_citations: [
      'Finance Canada release: Canada announces targeted countermeasures and substantive support (Aug 25, 2026) — https://www.canada.ca/en/department-finance/news/2026/08/canada-announces-targeted-countermeasures-and-substantive-support-for-workers-and-businesses-in-response-to-us-tariffs.html',
      'Finance Canada list: List of products from the United States subject to counter-tariffs effective September 8, 2026 (629 items, revised Aug 26) — https://www.canada.ca/en/department-finance/news/2026/08/list-of-products-from-the-united-states-subject-to-counter-tariffs-effective-september-8-2026.html',
      'Gowling WLG: Ottawa unveils calibrated retaliatory tariffs (updated Aug 27; 874 → 629 item revision, autos excluded, seafood removed) — https://gowlingwlg.com/en/insights-resources/articles/2026/ottawa-calibrated-retaliatory-tariffs',
      'Baker McKenzie: Canada Announces New Counter-Tariffs (Aug 26) — https://globalimportblog.bakermckenzie.com/2026/08/26/canada-announces-new-counter-tariffs-following-suspension-of-canada-u-s-trade-negotiations',
      'FreightFigures: Canada\'s Counterpunch (Aug 23, upd. Aug 27) — https://www.freightfigures.com/articles/canada-retaliation-tariffs-september-8-2026',
      'Financial Post: Canada hit hundreds of US-made items with tariffs (Aug 28) — https://financialpost.com/news/economy/canada-hundreds-us-items-tariffs-list',
      'Norton Rose Fulbright: Canada announces counter-tariffs on US goods effective Sept 8 — https://www.nortonrosefulbright.com/en/knowledge/publications/98be0106/canada-announces-counter-tariffs-on-us-goods-effective--september-8',
      'KPMG: Canada announces counter-tariffs on US goods (Aug 25) — https://kpmg.com/us/en/taxnewsflash/news/2026/08/canada-counter-tariffs-us-goods.html',
      'CBSA Customs Notices index (no implementing notice yet as of Aug 31) — https://www.cbsa-asfc.gc.ca/publications/cn-ad/menu-eng.html'
    ]
  };
}));
