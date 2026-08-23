# Changelog — Tariff Calculator 2026

All notable changes to the calculator asset (tariffcalculator2026.com) are documented here.

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
