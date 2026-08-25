# Changelog — Tariff Calculator 2026

All notable changes to the calculator asset (tariffcalculator2026.com) are documented here.

## 2026-08-24 — Site-wide stale /blog/ canonical sweep (kanban t_180fc246)

- **Fixed stale `/blog/` canonicals on all 9 remaining pages** — canonical, og:url, and JSON-LD `@id` on `china-tariff-rates-2026-explained`, `customs-valuation-methods-for-import-duty-calculation`, `de-minimis-rule-changes-2026-impact-on-ecommerce`, `how-to-apply-for-tariff-exclusion-or-drawback`, `how-to-calculate-import-duties-from-china`, `import-duty-calculation-explained-2026`, `section-301-tariffs-on-china-latest-updates-2026`, `tariff-exemption-list-2026-what-products-are-exempt`, `tariffs-on-electronics-imports-from-asia-2026` pointed at `/blog/<slug>/`, which serves the SPA fallback (homepage, ~93.8KB soft-404) instead of the article. All now point to the extensionless root path (`/tariffcalculator2026.com/<slug>`) that serves the real article and matches the sitemap. Closes the ⚠️ flagged in the t_850be755 entry.
- **Legacy `deploy_main/` copies normalized too** — `china-tariff-rates-2026-explained`, `how-tariffs-affect-small-business-imports`, `tariff-exemption-list-2026-what-products-are-exempt`, `us-tariff-rates-2026-by-country` carried the same stale `/blog/` canonical and are still served live at `/deploy_main/...` (200); canonical now points to the canonical root extensionless URL. (`deploy_main/how-to-calculate-import-duties-from-china.html` had no /blog/ refs.)
- **`tariff-exemption-list-2026-what-products-are-exempt.html`** also picked up the pre-existing uncommitted FAQPage JSON-LD upgrade already live on the page (5 Q&A) — now committed with this sweep.
- **Sitemap/llms.txt:** verified — no `/blog/` entries; all sitemap URLs already extensionless and resolving 200.
- **Tests:** 82/82 pass (unchanged).
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), live verified — all 9 extensionless URLs return 200 with real article content (sizes 4.5–35KB, correct titles), canonical on each live page matches local; `/blog/<slug>/` variants still serve the SPA fallback (unchanged behavior, no longer cited as canonical anywhere).

## 2026-08-24 — Trucking cluster cross-linking + blog post published (kanban t_850be755)

- **Published `canada-tariff-trucking-freight-impact.html`** — "How the 50% Canada Tariffs Hit Freight Volumes and Carriers" (writer artifact from t_ae08aad3) copied into the repo and deployed; live verified (real article content served, not SPA fallback). Stale calculator-slug placeholder comment resolved: the calculator lives at the homepage (tariffcalculator2026.com/); no dedicated /canada-tariff-calculator page shipped, so homepage hrefs are the canonical calculator target.
- **Reciprocal internal links added (guides → blog post):** `us-canada-tariffs-2026.html` (Related guides), `canada-50-percent-tariff-august-19-explainer.html` (Related guides), `tariff-impact-on-us-manufacturing-supply-chains-2026.html` (Related reading), `how-tariffs-affect-small-business-imports.html` (Related reading), `news/index.html` (feed item, Aug 24). Homepage already linked (4x, t_bf150bb5).
- **Fixed stale `/blog/` canonical on `tariff-impact-on-us-manufacturing-supply-chains-2026.html`** — canonical/og:url/JSON-LD @id pointed at /blog/tariff-impact... which serves the SPA fallback (homepage content) instead of the article; corrected to the root path that serves the article and matches the sitemap. ⚠️ 9 other pages still carry the same stale /blog/ canonical pattern (china-tariff-rates-2026-explained, customs-valuation-methods, de-minimis-rule-changes, how-to-apply-for-tariff-exclusion, how-to-calculate-import-duties-from-china, import-duty-calculation-explained, section-301-tariffs-on-china, tariff-exemption-list, tariffs-on-electronics) — flagged for a follow-up sweep, out of cluster scope.
- **AEO/SEO surface updated:** sitemap.xml (added /canada-tariff-trucking-freight-impact, news lastmod → 2026-08-24), llms.txt (article added).
- **Tests:** 82/82 pass (unchanged; no calculator logic touched).
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), live verified — blog 200 with article content, all 22 internal targets resolve, titles/descriptions unique across the 7-page cluster, keyword coverage confirmed (how do tariffs affect trucking ×3, cross-border freight volumes ×6, tariff cost per truckload ×3).

## 2026-08-24 — Calculator inputs updated to verified S338 basket schedule + trucking-impact layer (kanban t_bf150bb5)

- **`tariff-data.js` — S338 covered categories now match the three official proclamation baskets** (verified vs research brief t_cb75bfd7 / Chicago Fed / WH Proclamations 11046/47/48): `covered_categories` = `['auto', 'food', 'dairy', 'alcohol', 'canada-s338']`. New **`alcohol`** category ("Alcoholic Beverages") added to `CATEGORY_MODIFIERS`; **`dairy`** ("Dairy Products") added to the covered list. Both now apply the 50% Section 338 duty for Canada on/after Aug 22, 2026 (dairy 55.1%, alcohol 55.1% on default USMCA-qualified base). `hs_note` updated with the verified enumeration: **569 HTSUS subheadings — alcohol HTS 9903.03.12 (61 codes), dairy 9903.03.13 (52 codes), motor vehicles 9903.03.14 (456 codes)**, ~$24B / 5.5% of annual Canadian import value (Chicago Fed).
- **`canada_auto_50` threatened flag extended to steel** — categories `['auto', 'steel']` (Jan 1, 2027 announcement covers all cars, trucks, auto parts AND steel; verified CNBC/CBS/POLITICO Aug 24). Label → "50% tariff on Canadian cars, trucks, auto parts & steel (threatened)". Steel does NOT get S338 (Section 232 exempt) and stays at base 1.9% by default; the threatened scenario adds the 50% for Canada + Steel & Metals (51.9%).
- **New `TRUCKING_IMPACT` data layer** — verified freight-side facts (CTA fewer-loads / equipment-imbalance quotes, CTOA carrier-cost quote, PMTC 72% trade / 60% truck share) + `blog_slug: canada-tariff-trucking-freight-impact` + 50% rate notes (S338 Aug 22, autos/steel Jan 1 2027, retaliation Sept 8).
- **`index.html` — "🚚 Tariff Cost per Truckload" result row** (`#truckloadRow`) shown whenever a Canada tariff layer drives the estimate (S338 covered goods, retaliation, or the threatened autos/steel scenario). The value is the calculator's existing shipment-value input (never invented): $5,510 on $10k at 55.1%, etc. S338 flag block gained a trucking-impact line linking the new blog post.
- **Auto Tariff Scenario toggle → Auto & Steel Tariff Scenario** — now shown for Canada + **Automotive OR Steel & Metals**; option labels updated ("Current — ~25% auto tariff / steel S232 rates" vs "Threatened — 50% autos & steel (proposed, effective Jan 1, 2027)").
- **Homepage links to the trucking-impact blog post** — Canada S338 section (`canada-tariff-trucking-freight-impact.html`, "How the 50% Canada Tariffs Hit Freight Volumes and Carriers"), calculator footnote, and `BLOG_ARTICLES` featured card. Slug is the writer-shipped URL; the post itself is published by its own leg (attachment t_ae08aad3) — link may 404 via SPA fallback until then.
- **Tests:** 82/82 pass (was 80). Added: S338 basket coverage (dairy/alcohol 50%, hs_note 569/HTS), TRUCKING_IMPACT layer, threatened flag steel category + steel includeProposed + steel default unchanged, index.html markers (truckloadRow, autos/steel toggle, blog link).
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), verified live.

## 2026-08-24 — PUBLISHED: US-Canada auto tariff threat layer live (kanban t_cf6e19a4)

- **Deployed to Cloudflare Pages (tariff-calculator-2026)** — the combined content (t_cef2f560), calculator (t_3bf0ad31), and SEO/AEO (t_ee50cffc) changes are now live.
- **QA passed (browser + curl):** live title/meta `Canadian Car Tariff: 50% Auto Tariff Threat — Will Car Prices Go Up?`; 11-item FAQPage JSON-LD; `#canadian-car-tariff` direct-answer block; THREATENED — NOT IN EFFECT callout with Jan 1, 2027; all 20 source links HTTP 200; calculator verified in both modes — Canada+Automotive default 53.2% ($5,320 duty on $10k, threatened 50% NOT included) vs Threatened scenario 103.2% ($10,320, +50% breakdown, "INCLUDED in the estimate above" flag); toggle shows only for Canada+Automotive; no console errors; no horizontal overflow on desktop, mobile breakpoints present (640px/600px).
- **Content calendar updated** with the publish note.

## 2026-08-24 — SEO/AEO refresh: Canadian car tariff queries on /us-canada-tariffs-2026 (kanban t_ee50cffc)

- **Title/meta retargeted to the auto-tariff spike queries** (Canadian car tariff, will car prices go up, 50% tariff cars, what is the tariff on Canadian cars, when do Canadian auto tariffs take effect):
  - Title → `Canadian Car Tariff: 50% Auto Tariff Threat — Will Car Prices Go Up?` (68 chars, "Canadian Car Tariff" + "Will Car Prices Go Up" exact).
  - Meta description → 148 chars: `Canadian car tariff: 25% today, with a 50% auto tariff threatened for Jan 1, 2027. The 50% duty on ~$20B of Canadian goods took effect Aug 22, 2026.`
  - og:title/og:description and Article JSON-LD headline/description synced; dateModified stays 2026-08-24.
- **New AEO direct-answer block** (`#canadian-car-tariff`, placed right after the in-effect banner, top of the auto section): H2 `Canadian car tariff — direct answers` with three exact-query H3s and one-sentence answers — "What is the tariff on Canadian cars?" (25% today; 50% threatened Jan 1, 2027, not in effect), "When do Canadian auto tariffs take effect?" (Jan 1, 2027 if enacted; the separate 50% Section 338 duty took effect Aug 22, 2026), and "Will car prices go up?" (likely for some models — CNN Aug 24).
- **FAQPage JSON-LD expanded 6 → 11 questions** with exact-query phrasing: What is the tariff on Canadian cars?, When do Canadian auto tariffs take effect?, Will car prices go up?, Is the 50% tariff on cars in effect?, What is the Canadian car tariff in 2026? — mirrored as visible `.faq-item` Q&As in the FAQ section.
- **Facts verified vs live sources (all HTTP 200 Aug 24, 2026):** CNBC (current top-line tariff on Canadian auto imports = 25%; threat to 50% Jan 1, 2027; "On January First, 2027, Tariffs on all Cars, Trucks, both large and small, Automotive Parts, and Steel, will be increased to 50%"), CNN (double duties on Canadian cars/car parts to 50% come January 1; S338 $20B took effect early Saturday; "chances that at least some of the tariff costs ultimately land on consumers"), CP24 (threat "will not take effect until Jan. 1", cars/trucks/parts/steel; $28B vs $20B figure discrepancy noted — page keeps verified $20B).
- **Title syncs:** llms.txt entry, homepage BLOG_ARTICLES card, news feed item updated to the new title/desc (news item date bumped to Aug 24).
- **Rank tracking:** added 5 queries to ~/.hermes/seo-data/keywords.json for tariffcalculator2026.com (backup keywords.json.bak-canada-car-tariff-t_ee50cffc).
- **Tests:** 80/80 pass (no tariff-data.js change by this task).
- **Not deployed** — publish/QA leg is child task t_cf6e19a4 (waits on t_ee50cffc + t_3bf0ad31 + t_cef2f560). Verify live after deploy: title/meta, 11-item FAQPage JSON-LD, #canadian-car-tariff block.

## 2026-08-24 — Calculator: threatened 50% auto tariff flag + scenario toggle (kanban t_3bf0ad31)

- **`tariff-data.js` — new `PROPOSED_FLAGS` entry `canada_auto_50`:** the threatened 50% tariff on Canadian cars, trucks & auto parts (threatened by President Trump Aug 24, 2026, proposed effective **2027-01-01**) is now in the canonical data layer with `status: 'threatened'`, `rate: 0.50`, `categories: ['auto']`, `effective: '2027-01-01'`. Modeled as a proposed flag — **NOT added to any default calculation** unless the user opts in. Sources: CNN, CNBC, CP24 (Aug 24, 2026).
- **`index.html` — new Auto Tariff Scenario toggle** (`#autoScenarioRow` / `#autoScenario`), shown only for **🇨🇦 Canada + Automotive**: **Current — ~25% auto tariff (in effect)** vs **Threatened — 50% auto tariff (proposed, effective Jan 1, 2027)**.
- **Calculation default unchanged:** the threatened 50% is excluded unless the user selects the Threatened scenario (`opts.includeProposed`), so all existing estimates are bit-for-bit identical. Result label, rate breakdown ("Threatened auto tariff (proposed): +50.0%"), and the warning flag ("⚠️ … THREATENED, proposed effective 2027-01-01 (NOT in effect)") update when the scenario is active.
- **Homepage metadata:** dateModified (meta + JSON-LD) → 2026-08-24; sitemap lastmod for `/` → 2026-08-24.
- **Tests:** 80/80 pass (was 76). Added 4: flag structure (50%, 2027-01-01, threatened), default calc unchanged (0.532 USMCA / 0.032 pre-S338), includeProposed adds 50% only for Canada+auto, index.html marker checks (toggle, labels, date, wiring).
- **Not deployed** — publish/QA leg is sibling task t_cf6e19a4 (waits on t_3bf0ad31 + t_ee50cffc).

## 2026-08-24 — US-Canada auto section: threatened 50% tariff layer added (kanban t_cef2f560)

- **`/us-canada-tariffs-2026` auto section:** new clearly-marked THREATENED layer (`.threatened` callout, purple border, "⚠️ THREATENED — NOT IN EFFECT"): on **Aug 24, 2026** Trump threatened to raise US tariffs on Canadian cars, trucks & auto parts from the current **~25% to 50%** effective **January 1, 2027**. Explicitly marked as a proposal, NOT an enacted tariff — current effective auto rate remains ~25%.
- **Context included:** 50% tariffs on ~$20B of Canadian goods took effect **Aug 22, 2026**; Canada announced **dollar-for-dollar retaliation starting Sept 8, 2026**; Trump leverage quote **"We don't need Canada, they need us."**
- **Sources linked (verified HTTP 200 Aug 24, 2026):** CNN (2026/08/24/business/us-canada-cost-more), CNBC (trump-canada-auto-tariffs-trade-war.html), CP24 (we-dont-need-canada-they-need-us...). Added to source-note, which now leads with the Aug 24 auto-threat set (CNN, CNBC, CP24) ahead of the existing Aug 23/Jul 20 instruments.
- **JSON-LD dateModified → 2026-08-24; sitemap lastmod → 2026-08-24.** Existing effective 50% Section 338 info and NOT-enacted rejected-deal callout left intact. Calculator flag/scenario handled by sibling task t_3bf0ad31; SEO/AEO schema + meta handled by t_ee50cffc; deploy/QA by t_cf6e19a4.
- **No tariff-data.js change** (calculator unaffected by this task).

## 2026-08-23 — Canada Sept 8 retaliation date flag added to calculator (kanban t_2dad0fe7)

- **New `CANADA_RETALIATION` data layer (`tariff-data.js`):** dollar-for-dollar retaliation effective **Tuesday, September 8, 2026** (50% rate mirroring the US Section 338 duty), targeting six US sectors: **steel, electronics, dairy, household appliances, farming equipment, pulp & paper**. Verified against fact sheet t_160b34b4 (Al Jazeera, India Today, CNBC — Aug 23, 2026). Exported for tests + UI.
- **New calculator direction ("Shipping To"):** default **🇺🇸 United States** (existing US-import flows unchanged); new **🇨🇦 Canada (US goods imported into Canada)** mode forces country of origin = United States and filters the product category list to the six targeted sectors.
- **Date-gated flag (`effectiveRate` opts.direction='to-canada'):** before 2026-09-08 the retaliation shows **PENDING** (0% duty + warn flag naming September 8, 2026); on/after 2026-09-08 the **50% dollar-for-dollar duty is applied** (info flag with effective date, targeted sectors, ~$20B dollar-for-dollar scope, and Al Jazeera/India Today/CNBC sources). Date gating follows the calculator's existing entry-date convention (defaults to today).
- **New product categories** for sector coverage: Dairy Products, Household Appliances, Farming & Agricultural Equipment, Pulp & Paper (added to `CATEGORY_MODIFIERS` with standard modifiers; available in both directions).
- **Homepage:** new notice-banner "Canada Retaliation: Dollar-for-Dollar Tariffs on US Imports — Effective September 8, 2026" (PENDING status, sector list, links to the US-Canada explainer); calculator footnote updated; in-calculator banner + result flags added.
- **Tests:** 76/76 pass (was 69). Added 7: retaliation structure vs fact sheet, PENDING before Sept 8 (all six sectors 0%), 50% on/after Sept 8 (all sectors), non-targeted sectors stay 0%, to-canada only for US origin, regression (China 301, Canada S338, USMCA), index.html markers (Sept 8, dollar-for-dollar, direction control, sectors).
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), verified live.

## 2026-08-23 — SEO/AEO refresh on US-Canada Tariffs FAQ for Sept 8 retaliation (kanban t_012d1339)

- **`/us-canada-tariffs-2026` on-page SEO refreshed for the new retaliation queries:**
  - Title → `Canada Retaliatory Tariffs Sept 8, 2026: US-Canada Tariffs 2026` (63 chars, targets "Canada tariffs September 8 2026" / "US Canada tariff retaliation").
  - Meta description → 149 chars: `US-Canada retaliation: Canada's dollar-for-dollar tariffs start Sept 8, 2026 on steel, electronics, dairy, appliances, farming equipment, pulp/paper.`
  - H1 → `US-Canada Tariffs 2026: 50% Section 338 Duty on ~$20B + Canada's Sept 8 Retaliation`.
  - New H2 answer block `Canada's retaliation: dollar-for-dollar tariffs start September 8, 2026` with bulleted sector list (steel, electronics, dairy, household appliances, farming equipment, pulp/paper) and Canada-side landed-cost note — featured-snippet/AEO-ready direct answer.
  - Article JSON-LD headline + description synced to new title/meta; FAQPage (6 Qs) already carries Sept 8 + dollar-for-dollar + sectors; dateModified stays 2026-08-23.
  - No conflicting stale dates: only historical "original August 19 effective date" context remains (accurate, not stale).
- **Internal links:** `canada-50-percent-tariff-august-19-explainer.html` + `section-301-tariff-expansion-60-countries.html` now link to /us-canada-tariffs-2026 (were missing); news feed item + homepage BLOG_ARTICLES card title/desc refreshed with Sept 8 retaliation; llms.txt entry retitled.
- **Rank tracking:** added 3 queries to ~/.hermes/seo-data/keywords.json for tariffcalculator2026.com: "canada tariffs september 8 2026", "canada retaliatory tariffs september 8 2026", "us canada tariff retaliation".
- **Tests:** 69/69 pass (no tariff-data.js change by this task).
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), preview 9e75b8fd, verified live — title/meta/H2/schema all present; sha256 matches local modulo CF beacon injection.

## 2026-08-23 — US-Canada Tariffs FAQ retaliation section updated to Sept 8, 2026 dollar-for-dollar tariffs (kanban t_7a79c021)

- **`/us-canada-tariffs-2026` FAQ updated (same slug, same URL):** retaliation language revised from "pledged" to confirmed — Canada will impose dollar-for-dollar retaliatory tariffs on US imports starting Tuesday, September 8, 2026, following the US 50% tariffs on ~$20B of Canadian goods that took effect Aug 22, 2026. Full targeted-sector list per verified fact sheet t_160b34b4: steel, electronics, dairy, household appliances, farming equipment, pulp/paper. Added Carney's "at war" quote ("You're at war when you get attacked. We got attacked.") with reporter-question context; "Why the talks failed" section updated to note talks collapsed Friday Aug 21 before the deadline, Carney recalled negotiators to Ottawa. Meta description updated (<160c), dateModified bumped to 2026-08-23, new FAQPage JSON-LD entry for the retaliation question, source note updated (verified Aug 23 vs datapack t_89767bbd + fact sheet t_160b34b4: Al Jazeera Carney piece, India Today, CNBC).
- **Sitemap:** lastmod for /us-canada-tariffs-2026 bumped to 2026-08-23.
- **No new page created, slug unchanged.** (Note: task body URL /us-canada-tariffs/ is a CF Pages catch-all that serves index.html — the real page is and remains /us-canada-tariffs-2026.)
- **Tests:** 69/69 pass (no tariff-data.js logic change).
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), verified live.

## 2026-08-22 — US-Canada Tariffs 2026 FAQ page published for calculator users (kanban t_94938224)

- **New page `/us-canada-tariffs-2026`:** concise SEO FAQ explaining the 50% Section 338 duty on ~$20B of Canadian goods for calculator users. Title starts "US-Canada Tariffs 2026", 7 H2 sections, meta description 144 chars (<160). Content includes: short "What happened" section, affected-category & rate table (motor vehicles 50%, alcohol 50%, dairy 50%, other Annex II 50%, pre-existing steel/lumber rows), links to the updated calculator, and a NOT-enacted callout for the rejected deal (steel/aluminum 25%, autos 15%, lumber 10% eliminated). All facts drawn from parent datapack t_89767bbd (12 sources / 6 official instruments); no contradictions with the datapack.
- **News feed (`news/index.html`):** new feed item at top of "Earlier advisories" + CTA cross-link from the Canada Section 338 advisory.
- **Homepage (`index.html`):** new BLOG_ARTICLES entry (featured: true) so the FAQ card appears in the blog grid.
- **Sitemap + llms.txt:** new URL registered (`/us-canada-tariffs-2026`, lastmod 2026-08-22).
- **Tests:** unchanged (69/69 pass — no tariff-data.js logic change).
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), verified live.

## 2026-08-22 — Canada Section 338 50% levy re-verified vs official datapack; rejected-deal offer added as alternate preset (kanban t_3798c106, verified via parent datapack t_89767bbd — 12 sources, 6 official instruments)

- **Canada Section 338 50% duty — source citations upgraded to the verified datapack.** `tariff-data.js` `SECTION_338_CANADA` now cites the official instruments (USTR Greer statement Jul 20; White House Fact Sheet Jul 20; Proclamations **11046** alcohol, **11047** dairy, **11048** motor vehicles; Aug 18 Temporary Suspension proclamation) plus Al Jazeera, JPost/Reuters, ZeroHedge, NPR, CBC, and The Guardian (12 sources). Authority string updated to the statutory cite (19 U.S.C. 1338). Header + instrument notes re-verified. **No rate change** — the 50% additional ad valorem (effective 12:01 a.m. ET Aug 22, 2026, ~$20B scope, no USMCA exemption) was already live from the prior release and remains in the default rate for Canada on covered categories (`auto`, `food`, `canada-s338`).
- **New product scope entries: dairy basket now includes cheeses of all types** (per Proclamation 11047 / datapack row 3, HIGH confidence) — `product_scope.dairy` and the `PRODUCT_SCOPE` keyword list gain `cheese`/`cheeses`. Product-name QA lookup (`cheddar cheese`) updated from NOT-covered → covered. Hockey sticks, tongue depressors, wine, and the full Annex II inventory remain covered.
- **New `REJECTED_DEAL_PRESET` (alternate preset, NOT enacted):** the deal Canada declined Aug 21, 2026 would have *reduced* US tariffs — steel & aluminum to **25%**, automotive duties to **15%**, lumber 10% levy **eliminated**. Exported from `tariff-data.js` with `not_enacted: true`, rejected-date, outcome, and a `effectiveRateIfEnacted()` what-if helper (Canada-only modeling; never used by the live calculator). Live `effectiveRate()` is unchanged: steel/aluminum, autos, and lumber keep their pre-existing Section 232 treatment, and autos stack the enacted 50% Section 338 duty.
- **index.html:** new callout banner "What the rejected US–Canada deal would have meant — NOT enacted" with the 25%/15%/eliminated table vs what actually applies; S338 banner sources upgraded to the official instruments. News advisory (`news/index.html`) sources list upgraded to the 10-entry verified set.
- **Deprecations:** no outdated rates remain live for affected categories — the old `canada_s338` proposed flag stays removed from `PROPOSED_FLAGS` (test-enforced), the S338 banner no longer claims SUSPENDED, and the rejected 25/15/10 figures appear only inside the NOT-enacted callout.
- **Tests:** 69 total pass (`node --test tests/tariff-data.test.js`). Added: official-instrument citation checks, REJECTED_DEAL_PRESET structure + what-if helper + live-calculator isolation, and **5 example-product duty totals** across affected categories — wine $10,000 → $5,510 duty (55.1%), cheddar cheese $25,000 → $13,775 (55.1%), wooden hockey stick $5,000 → $2,525 (50.5%), auto parts $100,000 → $53,200 (53.2%), tongue depressors $2,000 → $1,010 (50.5%) — plus date-gating (before Aug 22 no 50%) and exclusion checks (steel/chemicals no S338 stacking).
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), verified live.

## 2026-08-22 — Canada Section 338 50% duty IN EFFECT (kanban t_e2050fe0, verified via tariff-trigger spec t_d87d9da9)

- **50% Section 338 additional duty on ~$20B of Canadian goods took effect 12:01 a.m. EDT Sat Aug 22, 2026** after U.S.–Canada talks failed. New `SECTION_338_CANADA` entry (rate 0.50, effective date, authority, ~$20B scope, USMCA-non-exempt, exceptions: energy/potash/fish/critical minerals/Section 232), product scope (hockey sticks → tongue depressors), `PRODUCT_SCOPE` keyword list, and date-gated stacking in `effectiveRate()` for Canada on `auto`, `food`, and the new `canada-s338` category. Old `canada_s338` proposed flag removed from `PROPOSED_FLAGS` (was "SUSPENDED until Aug 22").
- **index.html:** IN-EFFECT banner, calculator footnote, breakdown display, and source links; news advisory; explainer refreshed to the in-effect date. Pre-existing steel/lumber/auto tariffs noted as remaining in force and stacking.
- **Tests:** S338 entry, covered/uncovered categories, date gating, USMCA interaction, product-name QA.

## 2026-08-15 — Section 232 UAS / drone tariff added (kanban t_65e08fc6)

- 100% Annex I / 25% Annex II + Annex III, effective 2026-09-03 (Annex III components 2027-02-09), allied 15%/10% carve-outs, verified vs fact-sheet-drone-tariff-section-232.md (14 sources).

## 2026-08-08 — Section 232 polysilicon + solar tariff added (kanban t_83f7a5a1)

- 15% ad valorem, MIP floors ($21/kg polysilicon, $100/kg ingot/wafer, $0.22/W cell, $0.38/W module), effective 2026-12-04, country carve-outs (EU/JP/KR/TW/CH combined 15%, UK 10%), verified against 7 sources.

## 2026-07-24 — Section 301 forced-labor matrix (60 economies) + de minimis suspension (kanban t_8f2b1c4d)

- 12.5% / 10% flat + 5 mfn-capped rates, China stacks on pre-existing 301, USMCA exemption for qualified CA/MX goods, in-transit exception. $800 de minimis duty exemption suspended (CIT ruling upheld Aug 13, 2026) — every parcel over $0 assessed duty.
