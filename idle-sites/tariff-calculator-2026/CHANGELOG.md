# Changelog — Tariff Calculator 2026

All notable changes to the calculator asset (tariffcalculator2026.com) are documented here.

## 2026-09-11 — Publish /tariff-refund-status-2026/ (kanban t_bfbab407)

- **New page `tariff-refund-status-2026/index.html`** (38,009 B) — the dated IEEPA tariff-refund status
  log, built from the t_8b64a298 refund fact pack. Shipped as a **directory index** (`<slug>/index.html`)
  rather than a flat file, because the card's canonical slug is the trailing-slash form: `/tariff-refund-status-2026/`
  now serves a **bare 200** and `/tariff-refund-status-2026` 308s to it, matching the site's existing
  `/news/` directory page. (A flat `tariff-refund-status-2026.html` would have made the slash form a 308 hop.)
- **Figure provenance.** Every number on the page was re-derived from the Treasury Fiscal Data API
  (`mts_table_4` filtered to `Customs Duties`, and `mts_table_1`) by a standalone script
  (`fetch_verify_figures.py`, 12/12 checks) on the day of publication. Three fact-pack discrepancies were
  handled explicitly rather than propagated:
  - the "$20–25B for five months" framing is printed as the **six**-consecutive-month gross series
    (Mar–Aug 2026) with the counting basis stated — no bare "five months in a row";
  - the October-2025 **$31.354B peak is labelled NET**, with gross $33.090B given on the same row;
  - the ≈$166B refund total is **attributed** (Yahoo Finance + Davis Wright Tremaine), not asserted —
    no primary document carries the number.
  The page states once, explicitly, that "tariff receipts" = MTS `Customs Duties` = **all** customs duties,
  not IEEPA alone.
- **No portal deadline is published, because none exists in any source.** CBP's CAPE notice (updated
  2026-07-10) and its IEEPA refund FAQ (modified 2026-09-02) carry no deadline language; the page answers
  the "tariff refund portal deadline" query with the per-entry rule instead (unliquidated, or within 80 days
  of liquidation, so CBP can reliquidate by day 90 under 19 U.S.C. § 1501).
- **Separation from the dividend explainer is enforced:** zero occurrences of `dividend`, `rebate`, `$5,000`
  or `tariff-dividend-5000-explained` anywhere in the document (probed on the built bytes).
- `sitemap.xml`: one new `<loc>` at priority 0.9 (36 → 37 locs). `llms.txt`: one new entry.
- **Verified:** local gate `site_consistency.py tariff-refund-status-2026/index.html --expect-date 2026-09-11`
  → 1 checked / 0 errors / 0 warnings; FAQ parity 6 visible `.faq-item` == 6 `FAQPage` `mainEntity` (0 text
  drift); Playwright 320/360/390/414 px all `docSW == bodySW == innerWidth` with 0 offenders.

## 2026-09-11 — Wire the Section 232 metals hub into the homepage + the polysilicon and drone guides (kanban t_a2cf5886)

- **Internal-link wiring only — no copy, rate, date or template change.** The `/section-232-metals-tariffs`
  hub published in t_43b0318b had exactly one inbound internal link (from `/refined-copper-tariff-status`),
  so it was effectively an orphan for crawlers and readers despite being in `sitemap.xml` and `llms.txt`.
  Three pages now each carry exactly one link to it (anchor text: *Section 232 metals status hub*):
  - `index.html` — appended to the existing `<li><strong>Section 232:</strong>` bullet in
    *Exemptions & Proposed Tariffs*, where Section 232 and the metals (steel, aluminum, copper) are described.
  - `polysilicon-section-232-tariff-advisory.html` — appended to the existing "Related guides" line
    (now 4 links).
  - `drone-tariff-section-232-september-3.html` — appended to the existing "Related guides" line (now 6 links).
- **No date stamps touched.** polysilicon (`dateModified` 2026-08-08) and drone (2026-08-15) carry no
  visible "Updated …" byline, so the link was added without introducing one; the gate's
  visible-date/`dateModified` mirror rule is unaffected. `site_consistency.py --domain tariffcalculator2026.com`
  reports **0 errors** for each edited file.
- **Verified:** deploy `3df251ce-0378-4aa3-98c1-5cb69f562308`, **46 live rows compared / 0 mismatches**;
  live `grep -c section-232-metals-tariffs` = 1 on each of the three pages; hub still 200 with **0**
  self-anchors (its 3 metadata hits are canonical / `og:url` / Article JSON-LD — unchanged from before);
  Chromium click-through from all three pages lands on the hub H1 with no JS errors.

## 2026-09-11 — Publish /refined-copper-tariff-status and the /section-232-metals-tariffs hub (kanban t_43b0318b)

- **New page `refined-copper-tariff-status.html`** — the refined-copper Section 232 status log, built
  from the frozen t_19ff73b5 draft (1,315 words of prose + the AEO block = 1,363) with the 8-row
  dated status table, the price-move table, the "how much is priced in" section, the worked
  20-tonne duty scenario, the what-next / don't-over-apply sections and a 2-question FAQ.
  Canonical `https://tariffcalculator2026.com/refined-copper-tariff-status`.
- **AEO answer block** (t_6a894193, 288 characters) inserted as the first prose element, directly
  under the H1 and above the warning banner, as a single plain text node in
  `<p class="answer-block">` — no inner markup, not repeated in the FAQ.
- **`NOT YET IN EFFECT — DO NOT BILL AGAINST IT`** banner rendered as a `.warning-banner` block
  rather than a blockquote, so nothing in the copy can read as current law.
- **Scenario ↔ calculator agreement.** 20 t × $14,230/t = $284,600; 0/10/15/25/30% →
  $284,600 / $313,060 / $327,290 / $355,750 / $369,980; the 15% headline sentence matches
  `presets/refined-copper-tariff-pending.js → scenario_reference` verbatim. CTA
  `/?product=copper#calculator` is live (t_7ecb5089).
- **New hub `section-232-metals-tariffs.html`** — the metals / Section 232 status hub the card
  asked for (the three candidate slugs were 404 before this change). Per-metal status table
  (steel, aluminium, copper semi-finished+derivative IN EFFECT; refined copper PENDING; the BIS
  proposed-derivative row), the refined-copper section, what the calculator models vs. does not,
  the separate Canada Section 338 / counter-tariff track, and the polysilicon + drones actions.
  Reciprocal with the copper page: hub → status page (×7 anchors) and status page → hub.
- **Head/SEO.** Article + FAQPage JSON-LD on both pages; meta descriptions 155c (status) and 153c
  (hub); titles 59c both; `dateModified` 2026-09-11 mirrored in the visible byline on both; both
  URLs added to `sitemap.xml` (priority 0.9, extension-less canonical form) and to `llms.txt`
  (also the extension-less form — the pre-existing entries in that file use a trailing slash that
  308-redirects).
- **Mobile.** `.table-wrap` wrappers plus the site's `<1100px` guard; the 8-row status table and
  the 6-column scenario table scroll inside their own boxes instead of widening the page.

## 2026-09-11 — New calculator mode: PENDING refined-copper Section 232 duty scenario (kanban t_7ecb5089)

- **Feature.** A third mode on the calculator, `Copper — pending duty scenario`, sits alongside
  the ad valorem and TRQ tabs. Inputs: base-price market (**LME 3-month, USD/tonne** — pre-filled
  at the sourced **$14,230/t** of Sept 11, 2026 — or **COMEX front month, USD/lb**, which ships
  **no default** because no COMEX settlement is sourced, only the Sept 10 intraday move of 4%+ to
  ~$6.585/lb), base price, quantity (metric tonnes), **proposed duty rate X% (0–30, default 10)**,
  and destination (US / Canada / other). Outputs: duty base (US transaction value), duty if it
  lands, **landed cost**, **delta vs no tariff** in dollars and percent, duty per tonne, plus a
  0/10/15/25/30% ladder that mirrors the page copy exactly and the scenario sentence
  *"if the duty lands at X%, landed cost on this shipment moves from $A to $B — up $C, or D%."*
- **Status framing — non-negotiable, and it is on screen twice.** The static panel carries
  `⛔ Status: PENDING — NOT IN EFFECT (as of September 11, 2026)` with *"no duty on refined copper
  is currently collectible at the border"* and *"do not quote, bill, invoice or hedge against"*,
  the mode tab is labelled *PENDING — not in effect*, and **every render** prints the pending flag
  plus the Reuters basis (White House "has not yet made a decision on refined copper tariffs";
  "continues to evaluate all options to reshore copper") and the Federal Register absence check
  (no refined-copper instrument; the Apr 9 / Jun 4 proclamations contain no instance of the word
  "refined"). The in-force Section 232 regime on **semi-finished and derivative** copper is stated
  separately so the scenario is never read as current law.
- **Rate band 0–30%, not 0–25%.** The reported (recommended, NOT adopted) schedule is 15% from
  January 1, 2027 rising to **30% in 2028** (Reuters wire, Sept 10, 2026), so a 25% cap would make
  the reported 2028 step unmodelable — and the page copy prints a 30% row. 15% is labelled the
  reference case; 10% is the default input. Out-of-band input is clamped and says so.
- **Page-copy agreement (acceptance).** 20 t at $14,230/t = **$284,600**; 0/10/15/25/30% →
  **$284,600 / $313,060 / $327,290 / $355,750 / $369,980** (duty per tonne $0 / $1,423.00 /
  $2,134.50 / $3,557.50 / $4,269.00). The 15% rendering produces the status page's headline
  sentence verbatim. The numbers live in `presets/refined-copper-tariff-pending.js`
  (`scenario_reference`) and are asserted by tests, so copy drift fails the suite.
- **Files.** `presets/refined-copper-tariff-pending.js` (new data file, 14,018 B, sha256
  `d30abdc61ae3e0b8…`; loaded before `tariff-data.js` so an actual instrument is a data-file edit:
  `in_effect`, price, band, reference cases), `tariff-data.js` (`COPPER_PENDING` +
  `copperLandedCost()`, pure and UMD, 111,439 B, sha256 `8b0e4bd3ebe7b35b…`), `index.html` (mode
  tab, panel, `.cu-*` styles, wiring block `copper-wiring-t_7ecb5089` that **wraps** the TRQ
  block's `setCalcMode`, 224,349 B, sha256 `3195da7c0e373b37…`). Deep links:
  `/?mode=copper&market=lme&price=14230&qty=20&rate=15&dest=us#copper-calculator` and
  **`/?product=copper#calculator`** — the status page's CTA, which now resolves.
- **Defect fixed in passing (pre-existing, live since t_e2d32b63).** The deep-link `<code>` tokens
  are single unbreakable strings: `?mode=trq…` pushed the document to **532px at a 320px viewport**
  (8/12 on the site's own phone harness), and the new copper hint would have done the same (478px).
  `.hint code { word-break: break-all; overflow-wrap: anywhere; }` fixes both. Live now **12/12** at
  320/360/390/414px on `/`, `/?mode=copper`, `/?product=copper` and `/?mode=trq`.
  `dateModified` (meta + `WebApplication` JSON-LD) moved 2026-09-10 → **2026-09-11**; the JSON-LD
  description now names the pending copper scenario.
- **Verification.** `node --test` **157/157 pass** (127 pre-existing + 30 new in
  `tests/copper-data.test.js`); new `tests/copper-dom-harness.js` **88/88**, driving the real wiring
  in a vm sandbox at 10%, 15% and 25% and through both deep-link shapes; existing harnesses
  unchanged (`trq` 57, `drone` 35, `canada-line` 31, `brazil` 31, `deep-link-smoke` 6 — all 0 FAIL);
  `tests/run-harnesses.sh` runs all six. Live end-to-end in a real browser: `?product=copper` renders
  $313,060 at the 10% default, `rate=15` renders **$327,290** with the page headline, a real click at
  25% renders $355,750, a market switch to COMEX clears the price then converts $6.585/lb to
  $290,349 of base on 20 t, and the ad valorem mode still returns 40.3% / $40,300 on China
  electronics (the drones deep link still preselects its category). Deployed declared-files-only
  (`--files=index.html,tariff-data.js,presets/refined-copper-tariff-pending.js --verify-live`),
  deployment `36eff9f9-c300-4bc3-8b15-cb5afa16cddd`, 44 manifest rows compared / 0 mismatches; live
  bytes equal the worktree for all three files.

## 2026-09-11 — Preset `status` mis-attributed the Sept 29, 2026 import bans to Proclamations 11046/11047/11048 (kanban t_5e5baa16)

- **Defect (live, verified by bytes).** `presets/canada-sept8-counter-tariffs.js` shipped this clause
  inside its `status` string: `The import bans and added duties take effect 12:01 a.m. ET on Tuesday,
  September 29, 2026 (Proclamations 11046, 11047 and 11048);` — wrong attribution. **11046 (alcohol),
  11047 (dairy) and 11048 (motor vehicles) are the July 20, 2026 proclamations** that imposed the 50%
  duties effective Aug 19 → Aug 22, 2026 (they are *cited inside* the Sept 8 texts, not authored by
  them). The Sept 29 bans are the **five proclamations signed Sept 8, 2026** (alcohol exclusion, dairy
  exclusion, motor-vehicle exclusion, alcohol scope modification, motor-vehicle scope modification),
  still **unnumbered in the Federal Register** as of 2026-09-11 (FR API, proclamations published
  Sept 1–30, returns only 11060 — Labor Day, signed Sept 4). Pre-fix live sha256
  `7b70e80e…91831f` (12,549 B), shipped by t_b3e29762.
- **Fix — text only, one substring.** `(Proclamations 11046, 11047 and 11048)` →
  `(five Section 338 proclamations signed Sept 8, 2026; not yet numbered in the Federal Register)`.
  +56 bytes, 136 lines before and after, and `before.replace(old, new, 1) == after` holds on the full
  file bytes. No other site reference to 11046/11047/11048 was touched — those are all correct
  (index.html / news / us-canada-tariffs-2026 / canada-tariff-trucking-freight-impact /
  canada-retaliatory-tariffs-september-2026 / tariff-data.js `SECTION_338_CANADA`), and the counter-
  tariffs page's in-transit sentence (`…the existing 50% duty under Proclamations 11046 (alcohol),
  11047 (dairy) and 11048 (motor vehicles)`) is preserved verbatim.
- **Verification.** `node --test tests/` **127/127 pass** (before and after, normalised output
  identical); `tests/canada-line-dom-harness.js` output **byte-identical** (32/32 PASS, all rates and
  duties unchanged: dairy 25% / milk powder 50% / cheese 25% / steel 50% / farming-equipment 15%);
  per-field digest of all 18 non-`status` fields **identical** (`non_status_sha256` c83424a0…), with
  the 48 category-row + 56 line-row + 4 headline-row duty numbers identical
  (`numbers_sha256` cc84e372…) — so the calculator output is numerically unchanged.
  Deployed declared-files-only (`--files=presets/canada-sept8-counter-tariffs.js --verify-live`,
  deployment `6346223b-1960-4147-bd6b-9394f4c4f032`), gate 34 checked / 0 errors. Live now: 12,605 B,
  sha256 `7563eabed5e9aa019b547379573498cf689b964fd4bc8836a85091525768ff2c`; `Proclamations 11046,
  11047 and 11048` = **0** occurrences live, `11046` = **0** in the preset. The counter-tariffs page is
  unchanged by this card (live 60,364 B, sha256 `67f3c4f2…d74b`, canon `cd5043d4…07c8`, identical
  before and after the deploy) and still carries `11046` once, in the correct in-transit sentence.

## 2026-09-11 — Site-wide phone/tablet horizontal-overflow fix: 23 of 33 pages scrolled sideways (kanban t_88c62f1c)

- **Defect (measured before the change, live + local agree).** `documentElement.scrollWidth` exceeded
  `innerWidth` on **23 of the 33 sitemap URLs** at 320/360/390/414px. The card had measured only the
  homepage; the homepage was not representative. Worst: `/us-tariff-rates-2026-by-country` — an
  **850px page at a 320px viewport**, and still 1006px at a 1000px viewport (the site was only clean
  from **1024px** up, i.e. phones *and* tablets were affected). Homepage `/`: **349px at 320px** (the
  card's reported defect), caused by one bare 3-column `<table>` (`Measure | Rejected offer (NOT
  enacted) | What actually applies`) inside a `.notice-banner`, which the page's existing
  `.info table { display:block; overflow-x:auto }` rule did not reach. Root class: **bare `<table>`
  with no scroll container and no `overflow-wrap` guard anywhere in the site's CSS** (0 `.table-wrap`,
  0 `.tw`, 0 `overflow-wrap` rules before this change); one page (`/drone-tariff-section-232-september-3`,
  426px) had **no table in its offender list at all** — a 48-character unbreakable token
  (`EU/Japan/Korea/Taiwan/Switzerland/Liechtenstein,`) in a `<p>`.
- **Fix — one 5-line media query per page, inserted before `</head>` on the 23 offending pages:**
  ```css
  @media (max-width: 1100px) {
      table { display: block; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; max-width: 100%; }
      th, td, a, p, li { overflow-wrap: anywhere; }
  }
  ```
  `overflow-wrap: anywhere` (not `break-word`) lowers each cell's min-content width so the tables
  **compress to the container and the reader sees the whole table with no sideways scroll at all**;
  the `display:block; overflow-x:auto` table remains as a genuine scroll backstop for content that
  cannot be wrapped. Everything is inside the media query, so the 1280px desktop rendering is
  untouched. The breakpoint is 1100px, not 600/900px, because the measured overflow persisted all the
  way up to 1006px on the widest page. Deliberately **no** page-wide
  `p, li, td, th, code { overflow-wrap: break-word; }` rule (that class of rule hangs Chromium's
  `captureBeyondViewport` screenshots — recorded on card t_cc4b7740).
- **Variants measured, not assumed** (worst page, 4 phone widths + 1280x900 fingerprint): A
  `display:block`+`overflow-x:auto` only = 16/16 but tables need **464-558px of inner scroll**;
  E/F `overflow-x:auto` without `display:block` = **no clamping at all** (page stayed 850px), so an
  `overflow-x` on a `display:table` is not a backstop; C `overflow-wrap` alone = 16/16 but leaves no
  backstop; **B/G = 16/16 with 0px inner scroll** and was shipped.
- **Verification.** Per-page harness `tests/mobile-overflow-tariff.py` (new, this card) = **16/16 on
  all 23 pages** (320/360/390/414px: `scrollWidth == innerWidth` and 0 page-level offenders, 0
  page-level tokens; every table's far-right header reachable in-viewport; desktop fingerprint: all
  id-bearing element boxes within 1px, identical table column widths, identical `docH`/`docSW`,
  identical DOM element count). The copied `tests/mobile-overflow-390.py` mode A = **6/6** on the
  homepage. Site-wide re-sweep after the change: **33/33 pages clean at 320/360/390/414px** and
  **33/33 clean at 600/768/1000px**. Existing harnesses unchanged: **127/127 unit**
  (`node --test tests/tariff-data.test.js`), `trq-dom-harness.js` 57/57, `canada-line-dom-harness.js`,
  `drone-dom-harness.js`, `brazil-dom-harness.js` all pass, `deep-link-smoke.js` 6/6 — the change is
  CSS-only, no rate data, no markup, no JS touched.
- **Consistency gate: baseline 0 errors / 1 warning -> 0 errors / 0 warnings** over the 34-file
  staged artifact. The single baseline warning was `how-to-calculate-import-duties-from-china.html`
  carrying Article JSON-LD with **no `dateModified`**.
- **`how-to-calculate-import-duties-from-china.html` — repo/live drift resolved.** Its **worktree
  bytes were byte-identical to the live page** (sha256 `f1e2ddf4…`) while `HEAD` held different bytes
  (`2c6d9c8e…`): an earlier publish of that page never got committed. The guard was applied to the
  live bytes (not a rollback to `HEAD`, which would have reverted live content) and the file was
  committed so the deploy model — which holds *undeclared* dirty files at `HEAD` — cannot roll the
  live page back. Two JSON-LD date-hygiene lines were added in the same edit (`datePublished` to ISO
  `2026-09-10`, `dateModified` `2026-09-10`), which is what clears the gate warning. No prose, rate,
  FAQ or link content in that page was authored or altered here.
- **Deploy:** `~/seo-pages/tools/deploy-idle-site.sh tariff-calculator-2026 --files=<23 html + 2 test files> --verify-live`
  (no full-directory `wrangler pages deploy`; shared directory).
- **Deliberately NOT done:** no visible "Updated"/byline or `sitemap.xml` `lastmod` bump (the change is
  presentation-only — the gate agrees, 0 warnings), and the 10 pages that were already clean at all
  four phone widths were left untouched.

## 2026-09-10 — Sept 8 preset `status` synced to the confirmed Sept 8–9 U.S. escalation (kanban t_b3e29762)

- **`presets/canada-sept8-counter-tariffs.js` — `status` text only.** The stale closing paragraph ("Escalation risk (Sept 7–8, 2026) … President Trump has **threatened** additional measures … **possible** US product bans per USTR") is replaced by the **CONFIRMED** position already live on `/canada-september-8-counter-tariffs`: five proclamations under **Section 338** (Tariff Act of 1930) signed **Sept 8–9, 2026** banning imports of most Canadian **alcoholic beverages**, certain **dairy (incl. whey)** and **motorcycles**, with **mattresses / lamps / motorboats** added to the 50% duty list — effective **12:01 a.m. ET Sept 29, 2026** (Proclamations **11046 / 11047 / 11048**) — plus the **GSA** directive barring Canadian products from large long-term U.S. government contracts. Adds the no-deal statement (talks collapsed Aug 21, 2026; USTR Greer: Canada walked away from a near-final deal) and the **Sept 10** position (PM Carney called the bans "modest"; Canada will not retaliate further; the 629-item list is unchanged, no new Canadian countermeasures announced). Sept 6–7 threat items are retained only as dated background that the proclamations overtook. `revised` → `2026-09-10` (data-file revision stamp; the Finance Canada list itself was revised Aug 26).
- **Nothing numeric changed.** `preset_key`, `effective`, `effective_label`, `rate`, `tiers`, `category_tiers`, `list_size` (629 = 413@50% / 195@25% / 21@15%), `sectors`, `sector_categories`, `representative_products` and `source_citations` are untouched. The Canada-side measure still took effect 2026-09-08.
- **Tests: 127/127 unit** (`OPENSSL_CONF=/dev/null node --test tests/tariff-data.test.js`), `tests/canada-line-dom-harness.js`, `tests/trq-dom-harness.js` (57/57), `tests/drone-dom-harness.js`, `tests/brazil-dom-harness.js` and `tests/deep-link-smoke.js` (6/6) all pass. A 250-case before/after engine snapshot (`effectiveRate` over all 12 targeted categories × 14 representative HS lines × 5 dates straddling both effective dates, plus the off-direction controls) is byte-identical apart from the stripped `status` prose: 0 rate diffs, 0 breakdown diffs.
- **Deploy:** declared-files path only — `~/seo-pages/tools/deploy-idle-site.sh tariff-calculator-2026 --files=presets/canada-sept8-counter-tariffs.js --verify-live` (no full-directory `wrangler pages deploy`). The counter-tariffs page was **not** modified.

## 2026-09-10 — NEW 'TRQ surtax' calculator mode: Canada's recommended canned-vegetable tariff-rate quota (kanban t_e2d32b63)

- **`presets/canada-trq-canned-vegetables.js` (NEW)** — the single source of truth for the mode, loaded by `index.html` BEFORE `tariff-data.js` (same pattern as the Sept 8 preset). Carries the CITT's own figures from **GC-2025-001, report submitted to the Governor in Council September 9, 2026** (`decisions.citt-tcce.gc.ca/citt-tcce/s/en/521601/1/document.do`, ¶301–302): three-year TRQ with in-quota **13,000,000 kg** year 1 ≈ **28,660,094 lb**, rising 2%/yr to 13,260,000 kg (29,233,296 lb) and 13,525,200 kg (29,817,962 lb), above-quota surtax **50% → 45% → 40%**, in-quota **duty-free**. Product scope (CBSA Customs Notice 26-14), the global-minus-exclusions country construction (US included; Mexico/Israel-CIFTA/Chile/Panama/Peru/Colombia/Korea/Honduras/GPT out), the verbatim "TRQ is not a quota" quotes (¶306, ¶318, ¶326), and the in-force 10% provisional measure (June 19, 2026, up to 200 days, last full day Jan 4, 2027, US/Mexico/Chile/Israel/developing-country exempt). **The card's wire-rounding figures were NOT shipped**: 30M lb is a rounding of 13.0M kg and is labelled as such; the surtax is a declining schedule, not a flat "40–50%".
- **`tariff-data.js`** — new `TRQ_CANNED_VEG` (resolved from that preset file via `window.CANADA_TRQ_PRESET` / `require()`, with a safe no-rates fallback) and `trqCannedVegSurtax(opts)`, the pure arithmetic behind the mode: volume in lb or kg, year (drives threshold AND rate), `quotaExhausted` (whole volume priced above the line), an editable `inQuotaLb` threshold override, and an optional declared value so duty is apportioned to the above-quota share of it. Both are exported on `TARIFF_DATA`. **No existing rate data touched** — the 629-item Sept 8 tiering, Section 338, Brazil 301 and drone/Section 232 layers are unchanged.
- **`index.html`** — new **mode switcher** inside `#calculator` ("Standard duty (ad valorem)" / "TRQ surtax — canned vegetables"); the existing form is wrapped in `#avModeWrap` and is what loads by default, so every existing flow is behaviourally unchanged. The TRQ panel adds: product dropdown (11 in-scope canned goods), annual volume with an lb/kg/metric-tonne unit helper, TRQ-year selector (drives the in-quota threshold and the rate), quota status (not exhausted / exhausted or projected), an **editable in-quota threshold prefilled at 13,000,000 kg = 28,660,094 lb** with the kg source figure and "assumption, not current law" language in the hint, and an optional declared value. Results render three outcome boxes (duty-free within quota / the year's surtax / effective rate on the whole volume), a **three-year outcome table** (duty-free, then 50% / 45% / 40%), an explicit **"above-quota imports remain legal"** note with the Tribunal's verbatim wording, and a permalink field. **Deep-linkable**: `?mode=trq&volume=&unit=&year=&category=&quota=&value=#trq-calculator`; `?mode=trq` alone pre-fills the 30,000,000 lb worked example, and the URL + permalink rewrite as you change inputs.
- **`index.html` — new `#trq-canned-vegetables` info section**: the current-status caveat (the **10% provisional surtax is in force** with its US/Mexico/Chile/Israel/developing-country exemptions; the **TRQ is recommended, not adopted**, Minister reviewing, no implementing order as of Sept 10) with links to **CBSA Customs Notice 26-14**, the **Finance Canada June 2026 announcement** and the **Minister's September 9, 2026 statement**; the recommended-remedy table; four worked examples (exactly at the line / the 30M lb case showing the within-quota vs above-quota delta / just over the line demonstrating the cliff edge / quota already filled); the country-coverage construction; product scope incl. glass-jar exclusion and frozen exclusion; and 2 FAQ Q&As mirrored 1:1 in the homepage FAQPage JSON-LD (now 11 visible = 11 schema). Reciprocal link out to the explainer `/canada-canned-vegetable-surtax` (published the same day under t_dbc1d508, whose CTA deep-links into this mode).
- **`index.html` metadata** — `meta dateModified` + WebApplication `dateModified` → 2026-09-10. No `sitemap.xml` change needed: `/` and `/canada-canned-vegetable-surtax` were already at lastmod 2026-09-10 (commit 37cb053).
- **Tests: 127/127 unit** (`OPENSSL_CONF=/dev/null node --test tests/tariff-data.test.js` — was 110). NEW `tests/trq-dom-harness.js`: **57/57 DOM-stub checks** driving the real page wiring (mode switch, option population, default prefill, threshold edit + year reset, unit conversion, empty/negative input, and four deep links incl. the sibling article's exact CTA URL). Existing harnesses still pass: `tests/drone-dom-harness.js`, `tests/brazil-dom-harness.js`, `tests/canada-line-dom-harness.js`, `tests/deep-link-smoke.js` (6/6).
- **Deploy:** Cloudflare Pages (tariff-calculator-2026, branch main, production) via the shared-dir guard `~/seo-pages/tools/deploy-idle-site.sh tariff-calculator-2026 --files=...`. Pre-deploy consistency gate over the 34-file staged artifact: 0 errors / 0 warnings. Live byte-verification of `index.html`, `tariff-data.js` and `presets/canada-trq-canned-vegetables.js` — see the run's evidence.
- **Deliberately NOT done here:** the 40/45/50 percentages are never presented as current law; no positive "US, China, EU" country list; frozen vegetables are never described as covered.

## 2026-09-10 — DEPLOY FLOW CHANGE: shared-dir deploys now go through a staging guard (kanban t_c9f00cdb)

- **Do not run `npx wrangler pages deploy <this dir>` anymore.** This directory is shared: cards edit pages in it while the daily content pipeline writes new articles into the same tree, and `wrangler pages deploy <dir>` uploads the WHOLE working tree — on 2026-09-10 that published `canada-september-8-counter-tariffs.html` as it existed on disk mid-edit (an in-flight copy owned by card t_88a5cfa3, shipped by card t_31dba7b3's deploy).
- **Use the guard/staging wrapper for every deploy of this directory:**
  `~/seo-pages/tools/deploy-idle-site.sh tariff-calculator-2026 --files=<the pages you changed> --verify-live`
  It stages the dir into a clean temp dir, ships only the files the run declares (plus files whose bytes already match live production), and **blocks (exit 2, nothing uploaded)** when any other dirty file in the dir is not verifiably live. `--exclude-dirty='glob'` holds an in-flight file back at HEAD bytes; `--dry-run` prints the exact staged file list; every run is logged to `~/.hermes/logs/idle-site-deploys.log`.
- **This replaces the whole-dir command recorded in earlier entries** (e.g. the `npx wrangler pages deploy ~/seo-pages/idle-sites/tariff-calculator-2026 …` line in the 2026-09-08 entry).
- **Also wired in:** `~/.hermes/scripts/all-sites-content.py` and `~/.hermes/scripts/idle-site-content.py` now deploy through the same wrapper (`deploy_guarded()`), so the daily pipeline cannot ship a card's in-flight file either. Full flow + options: `~/seo-pages/idle-sites/DEPLOY.md`.
- **No page content changed by this entry.** The 2026-09-10 escalation rewrite of `canada-september-8-counter-tariffs.html` (t_88a5cfa3) is untouched — this entry is deploy tooling documentation only.
- **Verified:** with a sentinel in-flight file in this dir, an undeclared deploy attempt is BLOCKED (exit 2) and a declared/`--exclude-dirty` deploy proceeds with the sentinel held back (staged manifest in the card's evidence); production aliases untouched by the verification (preview-branch deploys only, since removed).


## 2026-09-10 — Escalation-risk note on the Canada Sept 8 page refreshed to CONFIRMED escalation (kanban t_88a5cfa3)

- **Monitoring result:** a confirmed U.S. escalation tied to these tariffs DID occur on Sept 8, 2026 — so the "escalation risk" note was updated with date-stamped copy and source URLs (not the no-escalation fallback). On **Sept 8, 2026** President Trump signed proclamations (White House Presidential Actions, dated Sept 8–9) **excluding from importation** most Canadian alcoholic beverages, certain dairy products (incl. whey) and motorcycles/motor vehicles, and **modifying the scope** of the products subject to the additional 50% duties (media report mattresses and motorboats added). The import bans apply to goods imported **on or after 12:01 a.m. ET Sept 29, 2026**; covered goods imported but not yet entered for consumption before that date remain subject to the existing 50% duty under Proclamations 11046 (alcohol), 11047 (dairy) and 11048 (motor vehicles). Trump also directed the GSA to declare Canadian products ineligible for large, long-term U.S. government contracts until Canada allows "full and fair reciprocity"; USTR Greer called the measures "a natural consequence" of Canada's "senseless retaliation." A further proclamation of **Sept 9, 2026** modified the scope of Canadian motor-vehicle products subject to the additional duties. No further Canadian countermeasures were announced as of Sept 10 (Carney: not seeking escalation; cabinet retreat in Banff Sept 10–11 weighing options reportedly including an electricity export tax; Canada exploring deeper EU ties).
- **`canada-september-8-counter-tariffs.html`** — escalation copy rewritten from "threats / risk" to the confirmed-escalation state:
  - New **"🔺 ESCALATION CONFIRMED — U.S. RETALIATED WITH IMPORT BANS AND NEW DUTIES (Sept 8–9, 2026)"** box at the top of the escalation section, with a date-stamped sentence (**"September 8, 2026 — the U.S. escalated."**), the Sept 29 effective date, the GSA government-contracts directive, USTR Greer's statement, and the Sept 9 scope proclamation — plus **source URLs** (White House Presidential Actions + the specific dairy-ban proclamation, CBC, Guardian/AP, Reuters, Fortune/AP, NYT Sept 10).
  - Section heading retitled `Escalation risk — updated September 10, 2026` (anchor `id="escalation-risk"`); the old Sept 7–8 threat list retained as dated **background** with "USTR warning — carried out" and a rewritten "What this means (as of September 10, 2026)".
  - In-effect banner, "Are Canada's counter-tariffs on US goods in effect?" direct-answer box, "At a glance" escalation bullet, and the "Escalation risk: what happens next" section (now led by "Escalation is no longer just a risk — it happened on September 8, 2026") all updated; timeline gains **Sept 8 (evening)**, **Sept 9** and **Sept 10** rows; importer guidance now covers the Sept 29 U.S. side and CBP as well as CBSA.
  - **FAQ kept 1:1** (9 visible Q&A / 9 FAQPage entries): the escalation Q&A rewritten in both mirrors. **Article JSON-LD `dateModified` → 2026-09-10** (datePublished 2026-08-31 preserved); visible byline → "Updated September 10, 2026". `datePublished`/slug/canonical unchanged — update only, no new page.
  - Sources block re-dated to "verified Sept 8–10, 2026" and 8 new sources prepended (White House proclamations, CBC, Guardian/AP, Reuters, Fortune/AP, NYT Sept 10, NYT Sept 8, Axios).
- **`sitemap.xml`** — `canada-september-8-counter-tariffs` lastmod 2026-09-08 → 2026-09-10.
- **Integrity checks:** both JSON-LD blocks parse; 1 `<h1>`, 9 visible FAQ Q&A = 9 FAQPage entries; zero stale "stalled talks" in rendered body (2 hits remain inside the non-rendered publisher comment describing the earlier removal); `dateModified` = 2026-09-10; no rate/list data changed (`tariff-data.js` untouched, `index.html` untouched) — the calculator's 629-item tiering and the Sept 8 effective date are unchanged.
- **NOT deployed by this task's file edits alone** — see deploy line below.

## 2026-09-10 — Canada direction now applies line-level rates: "Specific product" select (kanban t_31dba7b3, closes the t_30ee2ce6 QA gap)

- **Gap closed:** the t_30ee2ce6 acceptance criterion "calculator applies 50% for at least one steel product and one dairy product" was only half met — `effectiveRate('us','dairy',{direction:'to-canada'})` returned 25% and the milk-powder 50% line existed only as documented representative-line copy, so the parent card's "milk powder $5,000 / $10k" sample calc was not reproducible through the app. It now is.
- **`tariff-data.js` — `canadaRetaliationRate()` accepts an optional explicit line override (`opts.lineHs`).** An 8-digit HS code matching a `CANADA_RETALIATION.representative_products` entry for the selected category applies THAT line's verified `tier`; the breakdown echoes the new additive fields `lineRequested` / `lineMatched` / `lineTier` / `matchedProduct` / `matchedHs` / `appliedSource`, and `tierLabel` / `tierItemCount` / `tierReleaseNote` follow the APPLIED tier. HS codes are normalized to digits (`0402.10.10` === `04021010`); a 6+ digit subheading resolves only when it maps to exactly one line for the category; a line from another category can never override the selected category. **No `lineHs` → byte-for-byte the previous behaviour** (asserted for all 12 targeted categories). **No rate DATA changed** — the 629-item tiering, 25% cheese headline and 15% farm equipment are untouched.
- **`index.html` — new optional "Specific product (optional)" select** (`#canadaLine` inside `#canadaLineRow`), Canada direction only (hidden for the default to-us flow), populated from `T.CANADA_RETALIATION.representative_products` scoped to the selected category with `product (HS — tier)` labels, default `— Category rate —`, passed through as `opts.lineHs`. The notice banner, the result rate label and the result card now name the APPLIED line ("Applied specific line: Milk powder … HS 0402.10.10, 50% tier") instead of the category representative lines, so no contradictory rate is displayed; the no-selection path keeps the representative-lines copy and now points users at the new select.
- **Impact:** Dairy + Milk powder (HS 0402.10.10) → **50.0% / $5,000 on $10,000** through the app (was 25%). Cheese 0406.20.11 stays 25%; category defaults unchanged (steel 50%, electronics 25%, appliances 25%, farm equipment 15%, pulp & paper 50%); pre-Sept-8 entries stay PENDING 0%.
- **Tests: 110/110** (`OPENSSL_CONF=/dev/null node --test tests/tariff-data.test.js` — was 106/106). New coverage: line-tier application (milk powder 50%, cheese 25%, smartphone 50% vs 25% category, AC 15% vs 25%, toilet paper 25% vs 50%), fallback for unknown/mismatched lines plus every representative line asserting its own tier, date-gating with a line selected, unchanged no-line defaults across all targeted categories, and the index.html wiring markers. New `tests/canada-line-dom-harness.js` (31/31 DOM-stub checks driving the real page wiring: row visibility, option population + category scoping, banner copy, calculate() end-to-end incl. to-us isolation). Existing harnesses still pass: `tests/drone-dom-harness.js`, `tests/brazil-dom-harness.js`, `tests/deep-link-smoke.js`.
- **Deployed:** Cloudflare Pages (tariff-calculator-2026, branch main, production deploy `268eaa03`); live bytes byte-identical to local for `index.html` (sha256 0cecbff7…), `tariff-data.js` (5f4dcd5e…) and `presets/canada-sept8-counter-tariffs.js` (f33fb7d0…). Live browser verification (Playwright/Chromium against https://tariffcalculator2026.com/): the select renders for the Canada direction (hidden for to-us), milk powder → 50.0% / $5,000.00, cheese → 25.0% / $2,500.00, no line selected → 25.0% / $2,500.00 with representative-lines copy, pre-Sept-8 → 0.0% / $0.00, and steel 50% / electronics 25% / appliances 25% / farm equipment 15% / pulp & paper 50% unchanged.

## 2026-09-08 — Canada Sept 8 counter-tariffs page flipped to live IN EFFECT state (kanban t_e36c875a; draft prepared Sept 7 evening, publish via t_30ee2ce6)

- **`canada-september-8-counter-tariffs.html`** (final URL `/canada-september-8-counter-tariffs`, canonical unchanged) — status flipped from the Sept 3 "stalled talks" state to **IN EFFECT as of 12:01 a.m. ET, Tuesday, September 8, 2026**. Scope copy now states ~US$20 billion (C$27.6B) of US goods face duties **up to 50%**, dollar-for-dollar/rate-for-rate matching of the US 50% Section 338/232 tariffs, with the product categories steel/aluminum, dairy, appliances, farm equipment, furniture and clothing called out. Title/H1/meta/og rewritten around 'Canada tariff list 2026' + 'in effect Sept 8' (title 63c, meta 148c); AI-readable intro sentence added ("Canada's retaliatory tariffs on U.S. goods are in effect as of September 8, 2026."). Date-stamped **Escalation risk — September 7–8, 2026** section replaces the Sept 3 negotiation-status section (PMO confirms no new talks Sept 7; Trump Sept 6-7 threats incl. Bombardier sales-block + currency post; 50% US auto tariffs announced for Jan 1, 2027; USTR Greer bans warning; Carney Labour Day statement) with "this page will be updated if conditions change." All future-tense/'talks stalled' language removed (banner, takeaways, timeline, FAQ, sources); FAQPage JSON-LD + visible FAQ mirrors rewritten to 9/9 sync (Q: Are Canada's counter-tariffs on U.S. goods in effect? etc.); dateModified → 2026-09-08 (datePublished 2026-08-31 preserved); timeline gains Sept 7 row; sources updated to Sept 7–8 coverage (NYT/UPI/CBC/PMO/Al Jazeera/Forbes/CTV) ahead of the official Finance Canada list; CBSA implementing-notice caveat refreshed to Sept 7.
- **`presets/canada-sept8-counter-tariffs.js`** (single source of truth for the calculator preset) — `status` updated CONFIRMED → **IN EFFECT** with the escalation-risk sentence; no rate/category changes (verified 629-item tiering retained: steel 50%, furniture 50%, textiles/clothing 50%; dairy 25% cheese-headline with milk/whey powders at 50% line-level; household-appliances 25%; farming-equipment 15%; per-product rate matching per fact pack t_fa71e783 — do NOT flatten to 50%).
- **`index.html`** — Canada Sept 8 notice banner status CONFIRMED → **IN EFFECT since Sept 8, 2026** + escalation-risk sentence; "In the calculator" copy now says the tiered duty is applied (IN EFFECT) to entry dates on/after Sept 8 (earlier dates PENDING/0); representative-rate table date footnote + intro paragraph/footnote + BLOG_ARTICLES card blurbs refreshed (in-effect framing, no "starts Sept 8"/"deal lands" copy).
- **`sitemap.xml`** — `canada-september-8-counter-tariffs` lastmod 2026-09-03 → 2026-09-08.
- **NOT DEPLOYED** — draft staged for the QA/publish task t_30ee2ce6 (target: Sept 8 morning, post-12:01 a.m. ET activation). Deploy: `npx wrangler pages deploy ~/seo-pages/idle-sites/tariff-calculator-2026 --project-name tariff-calculator-2026 --branch main` (CLOUDFLARE_API_TOKEN from ~/.hermes/scripts/deploy-idle-blogs.py or all-sites-pipeline.sh line 6).
- **Tests: 106/106 pass** (`node --test tests/tariff-data.test.js`). Sample calc verified through `effectiveRate('us', <cat>, {direction:'to-canada', asOfDate:'2026-09-08'})`: steel 50% ($5,000/$10k), furniture 50%, textiles 50%, dairy 25% (cheese headline) with milk powder HS 0402.10.10 representative at 50% ($5,000/$10k), household-appliances 25%, farming-equipment 15%; pre-Sept-8 dates return 0/PENDING.

## 2026-09-03 — SEO/AEO finalization + reciprocal internal-link cluster (kanban t_00f21208)

- **`drone-tariffs-100-percent-2026.html`** — on-page finalization: added `og:image` / `twitter:image` (site og-image.png; og:title/desc/url/type/site_name + canonical were already set); CTA now deep-links to the calculator drone preset (`https://tariffcalculator2026.com/?product=drones#calculator`); added a "Related guides" line out to the by-country hub, Section 301-China updates, and China-transshipment pages. FAQPage + Article JSON-LD unchanged (already 1:1 with the 6 visible FAQs).
- **`index.html`** — added `id="calculator"` to the calculator section and a small deep-link handler: `?product=drones` preselects the Drones / UAS (Section 232) category, reveals the drone preset questions, and (with `#calculator`) scrolls to the tool. No core logic touched — 106/106 unit + 35/35 DOM-harness checks still pass.
- **`drone-tariff-section-232-september-3.html`** (pre-effective explainer) — added a dated **Update (Sept 3, 2026)** alert at top pointing to the new same-day post; CTA + FAQ (visible and FAQPage JSON-LD, kept 1:1) re-pointed to the deep-linked drone preset and reworded to the new supplier-status/thermal/weight UI (removed stale "choose your tier / enter the HTS code" instructions); new-post link added to Related guides.
- **Reciprocal links to `/drone-tariffs-100-percent-2026` added from** `china-transshipment-tariffs-2026.html` (Related guides), `us-tariff-rates-2026-by-country.html` (Related line before close), `section-301-tariffs-on-china-latest-updates-2026.html` (Related line before close). Homepage BLOG_ARTICLES + news feed already linked the post (t_c9b025e6).
- **Known site issue surfaced (not fixed here):** `china-tariff-rates-2026-explained.html` and `how-to-calculate-import-duties-from-china.html` are live but body-copy stubs ("Article generation failed.") and still receive 4-5 internal links each — cleanup recommendation sent to content owner.
- **Tests:** 106/106 (`node --test tests/tariff-data.test.js`), 35/35 (`tests/drone-dom-harness.js`), 6/6 new `tests/deep-link-smoke.js` (deep-link param preselect + no-op negative cases), post-patch integrity script PASS (JSON-LD parses, FAQ visible/schema counts match, no dead `#drone-uas-tariff` anchors remain).
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), production byte-identical to local for edited files.

## 2026-09-03 — Drone / UAS preset upgraded to the effective-date model (kanban t_a836cab0, rule spec t_1151b7ec)

- **`tariff-data.js` — drone tier is now DERIVED from product attributes.** `effectiveRate(..., 'drones', ...)` accepts `droneThermal` (bool), `droneHeavy` (bool: MTOW > 25 kg / ~55 lb) and `blueUas` (bool: DoD Blue UAS Cleared List / Blue UAS Framework / FCC Conditional Approval List as of Sept 2, 2026). Truth table per the Task 0 rule spec: thermal imaging OR over 25 kg → Annex I **100%**; non-thermal ≤25 kg → Annex II **25%** (both from Sept 3, 2026); **Blue UAS-listed → deferred 0% through Feb 8, 2027, full rate from Feb 9, 2027**; entries **before Sept 3, 2026 → not subject**; allied origin caps (≤15% incl Column 1 EU/JP/KR/TW/CH/LI, ≤10% UK) unchanged and origin-conditional. Legacy `opts.droneTier` ('annex_i'/'annex_ii'/'annex_iii') kept for old callers/tests. `SECTION_232_UAS` gains `blue_uas_deferral` (list date 2026-09-02, deferral_ends 2027-02-09) and `attr_model`; drone breakdown adds `notSubject`, `deferred`, `deferralEnds`, `blueUas`, `thermal`, `heavy`.
- **`index.html` — the manual "UAS / Drone Tier" select is replaced by the drone preset questions**: Supplier Status (standard vs Blue UAS-listed, with the DJI-not-listed note), Thermal-Imaging Capability, and Maximum Takeoff Weight, plus a framing box ("Tariffs took effect Sept 3, 2026"; corrected example copy — allied-origin drones capped 10–15%, NOT exempt — per guardrail G1). Defaults reproduce the old heavy-exposure Annex I default. Result card now labels the **Section 232 drone duty** headline (100% / 25% / Deferred 0% / allied cap / Not subject) with the base-duty estimate itemized in its own row so the total ties out; drone status flags added for D0 not-subject, Blue UAS deferral (D1), deferral-ended (D2), and allied certification caveats. Drone explainer section table gains the Blue UAS deferral row + "how to read your estimate" box; FAQPage JSON-LD updated to the new flow and a new Q added on the Blue UAS vs allied distinction (no allied-exemption overclaim). Non-drone calculator flows untouched.
- **Tests: 106/106 pass** (`node --test tests/tariff-data.test.js` — was 95/96 with one pre-existing date-rollover failure now fixed to be date-relative). New coverage: acceptance T1 (China+thermal Sept 3 → 100%), T2 (China light → 25%), T3 (pre-Sept-3 not subject), T4 (Blue UAS deferred 0%), T4-D2 (Feb 9 2027 deferral ends → full), T8 (China light unchanged Feb 2027), allied caps persist past Feb 2027, legacy annex_ii/iii compat, and the index.html render markers. New `tests/drone-dom-harness.js`: 35/35 checks (DOM-stub end-to-end drone flows + Brazil/Vietnam/Canada-Sept-8 regression).
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), live smoke-tested (desktop + mobile viewport) — drone preset flows produce 100% / deferred-0% / allied-cap correctly; non-drone flows unchanged.

## 2026-09-03 — Drone tariff 100% post published (kanban t_c9b025e6, fact sheet t_1151b7ec)

- **NEW `drone-tariffs-100-percent-2026.html`** — "Drone Tariffs Up to 100% Take Effect: What Importers Pay Now" (title 60c, meta 131c, canonical extensionless, pubDate 2026-09-03). Same-day explainer of the Section 232 drone tariffs that took effect 12:01 a.m. ET Sept 3, 2026 under Proclamation 11055 (signed Aug 13, 2026). Built strictly on the Task 0 verified fact sheet t_1151b7ec: 100% tier (>25 kg / thermal any weight / docking stations / Annex I critical components) vs 25% tier (≤25 kg non-thermal from Sept 3) vs Annex III components (25% from Feb 9, 2027); 25 kg metric boundary note (55 lb is rounding); **corrected framing per guardrail G1** — Blue UAS/FCC-listed suppliers (as of Sept 2, 2026) are deferred to Feb 9, 2027, while allied-origin products are capped at 15% total incl Column 1 (UK 10%), NOT exempt; stacking note (CBP stacking with 301 not yet defined — no invented totals); China/DJI dominance (70%+ world commercial), DJI-not-Blue-UAS bucket, public-safety/LE/fire impact with verified Mlakar + NYT quotes. AEO direct-answer box (what/when/who), key-takeaways block, rate-tier table, 6-item FAQ mirrored exactly in FAQPage JSON-LD (0 text mismatches), Article JSON-LD, meta/og/canonical set, ~1,195 visible words, targets: drone tariff 100% / Chinese drone tariff 2026 / how much are drone import tariffs / DJI tariff cost. Sources: NYT, Quartz, AeroTime (+ WH Proclamation 11055, Ars Technica). No claims beyond fact sheet A1-A5; no HTS code enumeration; no false allied-exemption statement.
- **`index.html`** — BLOG_ARTICLES card added (featured, top of grid).
- **`news/index.html`** — feed item added (Sept 3, 2026, tag Tariffs); meta description/og:description lead with the drone tariff; dateModified + visible Updated line bumped to 2026-09-03.
- **`sitemap.xml`** — URL entry added (lastmod 2026-09-03, priority 0.9); `/` and `/news` lastmod bumped to 2026-09-03.
- **`llms.txt`** — article link added.
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), verified live — extensionless URL 200, canonical live matches local, homepage card + news feed live, JSON-LD parses, local == production byte check.

## 2026-09-03 — Sept 8 counter-tariffs page refreshed with Sept 3 negotiation status (kanban t_b789b58a)

- **`canada-september-8-counter-tariffs.html` — same page/URL updated, no new page.** Added a dated **"Negotiation status — September 3, 2026"** H2 section near the top (directly after the direct-answer box): as of Sept 3 no US-Canada deal has been reached and talks remain stalled; PM Carney is open to a pact only if terms keep Canadian auto and steel operations competitive; Canada pushed back on Commerce Secretary Lutnick and said talks can resume when the US is ready; talks are stalled because the US has not given assurances on tariff levels; the 15/25/50% counter-tariffs on C$27.6B of US goods remain scheduled for 12:01 a.m. ET, Sept 8. **No "deal reached" framing** — wording uses "As of September 3" and "Unless a deal changes the timeline, … take effect September 8."
- **Source:** Bloomberg (Sept 3, 2026) — Carney says he's open to US pact if auto, steel terms are competitive — linked inline in the new section, in the talks-stalled body section, and added to the source note (source note re-labeled "negotiation status verified Sept 3, 2026").
- **Consistency updates on the same page:** header meta now shows "Published August 31, 2026 · Updated September 3, 2026"; Article JSON-LD dateModified → 2026-09-03; takeaways Talks bullet, timeline (new Sept 3 row), "Why the US-Canada trade talks are stalled" body, and visible FAQ + FAQPage JSON-LD mirrors (stalled-talks + could-change answers) refreshed to the Sept 3 status. Slug, canonical, og:url, title and meta description unchanged.
- **Sitemap:** lastmod for the URL → 2026-09-03.
- **Tests:** 95/96 pass — the 1 failure ("drone tariff does NOT apply with today's date (before Sept 3 2026)") is a pre-existing date-rollover expectation that flipped on Sept 3, 2026 (the Section 232 UAS tariff's effective date = today); unrelated to this content-only change. No tariff-data.js/preset logic touched.
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), live verified byte-identical (local == production sha256 f2ca4841…).

## 2026-08-31 — Canada Sept 8 Counter-Tariffs preset added (kanban t_6d585b6a)

- **NEW preset data file `presets/canada-sept8-counter-tariffs.js`** — the 'Canada Sept 8 Counter-Tariffs' preset (effective 2026-09-08, 12:01 a.m. ET) now lives in its own configurable data file, loaded by index.html BEFORE tariff-data.js. A future trade deal can be reflected by editing this one file (rates/category tiers/list size/sources) with zero calculator-logic changes and no risky deployment. `tariff-data.js` resolves `CANADA_RETALIATION` from it (window.CANADA_SEPT8_PRESET in browser, require() in Node) with a safe PENDING fallback.
- **Data corrected to the VERIFIED 629-item list (dataset t_d98a84da, revised Aug 26 from 874):** list size 629 (413 at 50%, 195 at 25%, 21 at 15%); tier item counts updated; category→tier map corrected (food resolves to 50% — fish/seafood removed Aug 26; **auto REMOVED — US autos are NOT on the Sept 8 list**, separate existing 25% order); representative products re-verified against the official 629-item CSV (added milk powder 0402.10.10, smartphone 8517.13.00, toilet paper 4818.10.00, tissue stock 4803.00.00; removed fish fillets and auto-category products). Status text + source citations updated (Finance Canada list, Gowling 874→629, Baker McKenzie, Norton Rose, KPMG, CBSA).
- **UI: preset label + effective-date labels** — static banner H2 renamed to "Canada Sept 8 Counter-Tariffs"; in-calculator banner and results breakdown now render the preset label ("Canada Sept 8 Counter-Tariffs") and the effective-date label (Tuesday, September 8, 2026, 12:01 a.m. ET). Fixed a pre-existing string-interpolation bug in the results flag (effective label was rendering literally).
- **Tests:** 96/96 pass (node --test tests/tariff-data.test.js); DOM harness 27/27 (added Flow 8: Sept 8 steel 50%/$5,000, dairy 25%/$2,500, farming 15%/$1,500, auto 0% not-on-list, PENDING before Sept 8). Aug 22 / canada-50-percent-tariff preset (SECTION_338_CANADA) and Brazil 301 preset unchanged and still passing their prior smoke tests.
- **Deployed:** Cloudflare Pages (tariff-calculator-2026).

## 2026-08-31 — Sept 8 counter-tariffs explainer published + site-wide 629-item correction (kanban t_19f8aef9)

- **NEW `canada-september-8-counter-tariffs.html`** — full explainer for Canada's Sept 8, 2026 retaliatory tariffs (15/25/50% tiers on C$27.6B of US imports), built on the verified research dataset t_d98a84da: **629 tariff items** (revised Aug 26 from 874; 413 at 50%, 195 at 25%, 21 at 15%), complete category/tier table with HS codes (50% tier: steel/aluminum/dairy powders/furniture/clothing/pulp & paper/plywood/cosmetics/plastics/smartphones/sporting goods/motorcycles >800cc/wood charcoal/printed matter/gypsum board/glass containers/copper wire; 25% tier: cheese/appliances/stoves/cookware/carpets/household paper/sawn wood/kitchen furniture/power tools/railway/electronics/cutlery/hinges/pumps/cranes/lawn mowers/drying machines; 15% tier: lift trucks/lifting machinery/ag machinery parts/machine tools/moulds/AC+heat pumps). **CRITICAL corrections applied: autos NOT on the list (separate existing 25% order); fish/seafood removed in Aug 26 revision; C$27.6B not re-baselined; no CBSA notice yet.** At-a-glance summary, timeline, talks-stalled context (Carney dollar-for-dollar; Greer no-resume), "rates may change if a deal lands" note, 8-Q FAQPage JSON-LD + Article JSON-LD, meta title 54c/desc 148c, canonical extensionless, target keywords (Canada counter-tariffs September 2026 / what products get more expensive September 8 / US-Canada tariff list). Internal links to calculator + Aug 22 card + us-canada + trucking + news.
- **Reciprocal internal links added** — homepage Sept 8 banner + BLOG_ARTICLES card, news page advisory + feed entry, Aug 22 explainer (canada-50-percent-tariff-august-19-explainer), us-canada-tariffs-2026 related guides, and an update banner on the older canada-retaliatory-tariffs-september-2026 post — all pointing to the new verified post.
- **Site-wide data correction to 629 items** — removed superseded 874-item claims and fish/seafood references from homepage banner + JS strings (tierTxt, breakdown, focus sectors), us-canada-tariffs-2026 (banner/table/FAQ/JSON-LD/source note), canada-retaliatory-tariffs-september-2026 (meta/og/JSON-LD/table/FAQ), news page sources + feed descriptions. All remaining "874" mentions are revision-context only ("revised Aug 26 from 874").
- **Sitemap + llms.txt updated** with the new URL (lastmod 2026-08-31).
- **Tests:** 92/92 pass; inline JS syntax clean.
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), deploys cdb6137a + c01acd35, verified live byte-identical (local == production for all 6 pages; deployment alias confirmed).

## 2026-08-28 — Brazil 25% Section 301 duty added to calculator + scenario toggle (kanban t_60875ef4)

- **`tariff-data.js` — new `BRAZIL_301` layer** (verified research brief t_c288793e, 16 sources / 52 quotes): the **25% Section 301 additional duty on most Brazilian goods** (HTS 9903.05.01) effective **12:01 a.m. ET July 22, 2026** (Notice of Action July 15; FRN published July 20, 91 FR 137; Section 301(b)/304(a) Trade Act). Applies on top of MFN for non-exempt goods; **1,600+ exempt HTSUS subheadings** (~1,200 standard + ~430 civil-aircraft lines) with confirmed exempt categories (coffee, beef, orange juice, cocoa, Brazil nuts/tropical fruit, iron ore, petroleum/coal, pharmaceuticals 9903.05.06, civil aircraft 9903.05.05, pig iron, organic honey, seafood, wood, hides/leather, iron & steel scrap, used clothing, antiques/art, aluminum hydroxide); **Section 232 non-stacking** (steel/aluminum/copper/autos/wood/semiconductors 9903.05.07 pay the 232 rate only); **12.5% forced-labor stack** (Brazil's existing 9903.05.27 rate unchanged) → up to **37.5% combined per PIIE**. Calculator exempt categories: pharma, steel, auto, polysilicon, drones, ground-beef; everything else subject by default ("all imports of Brazil, with certain exemptions").
- **Post-consultation what-if scenarios** (`opts.brazilScenario`): `current` (25%, in effect) / `reduced_20` / `reduced_15` / `reduced_10` / `removed` (0%) — all what-if rates labeled **NOT in effect** (Brazil's Aug 31 Rosa–Greer agenda: expand exemptions, reduce rates, reassess merits; no agreement as of Aug 28, 2026). Default `current` keeps existing estimates unchanged.
- **`index.html`** — new **Brazil Section 301 Scenario** toggle (`brazilScenarioRow`/`brazilScenario`, shown when Country of Origin = Brazil, US direction), Brazil 301 line in the rate breakdown (+ what-if label on the rate), in-results **Brazil flag with HTS/coverage note + source attribution** (USTR FRN, PIIE, CNBC, TariffStool, USTR Brazil) and exempt-category messaging, new **#brazil-301-tariff info section** (HTS 9903.05.01-09 table, 1,600+/430 counts, 232 non-stacking, 37.5% stack, trade context $14.4B surplus, Aug 31 talks) with **2 visible Q&A blocks mirrored in FAQPage JSON-LD** (now 8 questions), Exemptions list bullet, footnote, meta description/og:description/dateModified (2026-08-28), **Brazil blog card at top of BLOG_ARTICLES** (discoverable from homepage).
- **`brazil-section-301-tariff-2026.html`** — CTA corrected: "set **Country of Origin: Brazil**" (was "Shipping To: Brazil" — that control only offers US/Canada; the writer's card t_ec483e8b drafted the post, this fix makes the calculator instruction accurate).
- **Tests:** 92/92 pass (was 84). Added 8 Brazil tests (structure/rate math/exempt categories/scenarios/date gating/breakdown isolation/index.html markers + FAQ parity/blog CTA) plus `tests/brazil-dom-harness.js` — a DOM-stub end-to-end harness that runs the page's live `calculate()` against `tariff-data.js` (18 checks: 43.1% electronics, $4,310 duty, removed 18.1%, reduced_15 33.1%, pharma/steel exempt flags, pre-7/22 date gating, china isolation — ALL PASS).
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), verified live.

## 2026-08-28 — Brazil post QA + publish (kanban t_aaec99c3)

- **`brazil-section-301-tariff-2026.html`** — QA fix: FAQPage JSON-LD question wording aligned to the visible FAQ (Q2 → "Is the Brazil tariff effective July 20 or July 22, 2026?", Q3 → "What's on the Section 301 Brazil goods list?") — 6/6 visible↔schema parity confirmed. Blog + calculator + sitemap/llms/news verified live together (all URLs 200, internal links resolve, 15/16 external sources 200; eurasiareview.com 403 is the known Cloudflare bot-gate, corroborated by Agência Brasil and cited with provenance).
- **QA pass:** slug `brazil-section-301-tariff-2026` 200 (extensionless canonical; `.html` → 308 clean URL; `/full/*` → 301); Article + FAQPage JSON-LD parse clean; meta desc 149c (≤155); title 56c; tests 92/92 node + 18/18 DOM harness; live files byte-identical to local after re-deploy (deploy c61a28ac).

## 2026-08-25 — China 7.5% overcapacity tariff post published (kanban t_eb32fdbf)

- **New post `china-overcapacity-tariff-7-5-percent.html`** — "China Tariff 2026: 7.5% Overcapacity Tariff Coming?" (title 51c, meta 148c, canonical extensionless, pubDate 2026-08-25). Breaking-news explainer per SEO/AEO brief t_87fa2218, fact base research brief t_7f248947 (12 sources / 31 evidence quotes). Lead: Bloomberg Aug 24 report that the US is set to impose a 7.5% Section 301 overcapacity tariff on Chinese goods before the Sept. 24 Xi-Trump summit. **Critical framing: REPORTED plan from anonymous sources, NOT official** — Reuters could not verify; White House called it "baseless speculation"; no USTR/FRN action as of Aug 25. Covers: what happened, why before the summit (Sept. 24 meeting + 20% ceiling + Nov. 10 truce), Section 301 rate stack (legacy 7.5%–100% on ~$360B, July 12.5% forced-labor on China, 7.5%-on-top = ~20%), affected importers (overcapacity sectors; no HTS list yet), what happens next (pre-summit findings → Sept 24 summit → Nov 10 truce; 25-state CIT suit; drone tariff Sept 3), AEO direct-answer box ("Will the US add more China tariffs?" verbatim, first 100 words), 4-question FAQ mirrored in FAQPage JSON-LD (0 text mismatches), Article JSON-LD, calculator CTA, 6 internal links (all HTTP 200), 10-source note. ~1,500 visible words.
- **`index.html`** — BLOG_ARTICLES card added (featured, top of grid).
- **`news/index.html`** — new feed item (Aug 25, tag Tariffs) linking the post; meta description updated to lead with the China advisory.
- **`sitemap.xml`** — URL entry added (lastmod 2026-08-25, priority 0.9).
- **`llms.txt`** — article link added.
- **`china-tariff-rates-2026-explained.html`** — reciprocal link added (breaking update note → new post), per SEO brief mandatory reciprocal requirement.
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), verified live.

## 2026-08-25 — Canada retaliation blog post published (kanban t_80cc4bfd)

- **New post `canada-retaliatory-tariffs-september-2026.html`** — "Canada Retaliatory Tariffs 2026: 15/25/50% Rates on Sept 8" (title 58c, meta 152c, canonical extensionless, pubDate 2026-08-25). Structure per SEO/AEO brief: H1, direct-answer box ("What is the current US-Canada tariff rate?" → Sept 8, 2026 12:01 a.m. ET), key takeaways, timeline table, what-changed, three-tier affected-categories table (874 items: 404@50%, 449@25%, 21@15%), trucking/freight impact (55% of freight value by truck, ~15,000 trucks/day, CTA quotes, in-transit exemption), 9-item FAQ mirrored in FAQPage JSON-LD, Article JSON-LD, calculator CTA, internal links to the updated calculator (homepage), /us-canada-tariffs-2026 explainer, /canada-50-percent-tariff-august-19-explainer, trucking post, supply-chain + small-business guides, /news. Sources: the 8 verified Aug 25 sources (Finance Canada release + 874-item list, FreightWaves, Truck News, Guardian, Euronews, CTA, CNBC — research brief t_8153278d). ~1,300 visible words.
- **`index.html`** — BLOG_ARTICLES card added (featured, top of grid).
- **`news/index.html`** — new feed item (Aug 25, tag Tariffs) linking the post.
- **`sitemap.xml`** — URL entry added (lastmod 2026-08-25, priority 0.9).
- **`llms.txt`** — article link added.
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), verified live.

## 2026-08-25 — Canada retaliation upgraded to CONFIRMED 15/25/50% tiers + explainer refresh (kanban t_ceb6a59f)

- **`tariff-data.js` — `CANADA_RETALIATION` now carries the verified Finance Canada measures** (research brief t_8153278d, 9 sources / 44 evidence quotes): counter-tariffs of **15/25/50% on C$27.6 billion of US imports** effective **Sept 8, 2026 12:01 a.m. ET**; official **874-item list** (404 at 50%, 449 at 25%, 21 at 15%); each product rate **matches the corresponding US rate** (S338/S232 products); **origin rule** (US-origin only, CUSMA marking) + **in-transit carve-out** (US goods in transit on Sept 8 exempt); C$7.5B support package context; `announced: 2026-08-25`. Supersedes the Aug 23 flat-50% six-sector pre-announcement estimate.
- **New tier structure**: `tiers` (per-tier item counts, release notes, HS chapter coverage), `category_tiers` (per-calculator-category default tier: steel 50%, electronics 25%, dairy 25%, household-appliances 25%, farming-equipment 15%, pulp-paper 50%, auto 25%, furniture 50%, textiles 50%, food 25%, chemicals 50%, toys 50%, paper 50%), and **13 representative products** with 8-digit HS codes drawn from the official list (steel coil 7208.25.00, aluminum sheet 7606.12.00, motorcycle 8711.50.00, trailer 8716.39.30, cheddar 0406.20.11, fish fillets 0304.31.00, refrigerator 8418.21.00, AC 8415.10.00, mower 8433.20.00, metal furniture 9403.20.00, t-shirt 6109.10.00, video game console 9504.50.00).
- **`canadaRetaliationRate()` is tier-aware** — `to-canada` mode returns the category's verified tier on/after Sept 8 (PENDING 0% before), with `tierLabel`/`tierItemCount`/`tierReleaseNote`/`listSize`/`originRule`/`inTransit`/`representativeProducts` in the breakdown. Tier-key lookup normalized (`0.50` vs `String(0.5)`).
- **`sector_categories` expanded 6 → 13** — the six official focus sectors (steel, electronics, dairy, household appliances, farming equipment, pulp/paper) plus furniture, textiles, food, auto, chemicals, toys, paper verified in the 874-item list. Non-targeted categories (footwear, pharma, polysilicon, drones, ground-beef, canada-s338) stay 0%.
- **`index.html`** — retaliation banner rewritten to CONFIRMED (tiers, 874 items, C$27.6B, 12:01 a.m. ET, origin + in-transit rules, support package) with a **10-row representative-product table**; `updateCanadaBanner()` tier-aware; in-calculator retaliation flag shows tier label/item count, official list size, origin rule, in-transit exemption, and representative HS lines; breakdown part shows the tier; footnote + header intro + BLOG_ARTICLES card + dateModified updated.
- **`us-canada-tariffs-2026.html`** — explainer refreshed: Aug 24 announcement (Truth Social: cars/trucks/parts/steel to 50% Jan 1, 2027, announcement-only), collapsed talks context, confirmed Aug 25 retaliation with a **three-tier rate table** (rates, item counts, coverage, HS examples, effective dates), FAQ + FAQPage JSON-LD retaliation answer updated (874 items, C$27.6B, origin/in-transit, C$7.5B), meta description → 150c (confirmed 15/25/50% retaliation), dateModified → 2026-08-25, source note leads with the 8 new Aug 25 sources.
- **`news/index.html`** — new top advisory (Aug 25): confirmed tiers, 874 items, origin + in-transit, support package breakdown, key dates, sources; meta description + header date updated.
- **Sitemap** lastmod → 2026-08-25 for `/`, `/news`, `/us-canada-tariffs-2026`.
- **Tests:** 84/84 pass (was 82). Added/updated: retaliation structure (tiers/list/announced/origin/in-transit/reps), PENDING-before-Sept-8 across all 13 targeted categories, tier rates on/after Sept 8 (steel 50%, electronics/dairy/appliances 25%, farm 15%, etc.), representative products with effective dates, non-targeted categories stay 0%, index.html + explainer content markers.
- **Deployed:** Cloudflare Pages (tariff-calculator-2026), verified live.

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
