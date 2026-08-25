# AI Agency Pricing Calculator — API & Cost Model Spec

**Site:** aiagencycalculator.com
**Source asset:** `~/seo-pages/idle-sites/ai-agency-pricing-calculator/index.html`
**Last updated:** 2026-08-25 (ChatGPT Business Premium seat estimator — verified via research brief t_642ada39, task t_d7ed9100)

---

## 1. Overview

Single-file static calculator (HTML + inline JS, no backend). Exposes five
independent estimators in one page:

| # | Estimator | Function | Section |
|---|-----------|----------|---------|
| 1 | AI Pricing Calculator (setup fee / retainer / margin / ACV / ROI / pitch) | `calculatePricing()` | main form |
| 2 | Agent Failure & Retry Cost Estimator | `calculateFailure()` | `#failure-estimator` |
| 3 | Gemini API Cost & Model Routing Savings | `calculateRouting()` | main form |
| 4 | **Agent Wallet & Spend Cap Estimator** (NEW 2026-08-07) | `calculateWallet()` | `#wallet-estimator` |
| 5 | **ChatGPT Business Seat Cost Estimator** (NEW 2026-08-25) | `calculateChatgptSeats()` | `#chatgpt-seats-estimator` |

All calculators are client-side. No API keys, no server round-trips (except the
optional email-capture worker on result unlock).

---

## 2. Wallet & Spend Cap Estimator (NEW)

Purpose: model monthly AI spend under agent payment rails (Cloudflare Wallets,
x402-style rails) with optional wallet fees and creator-set spending caps, and
show **capped vs uncapped** scenarios.

### 2.1 Inputs (all optional — fallback defaults preserve previous behavior)

| Field ID | Label | Type | Default | Constraint |
|----------|-------|------|---------|------------|
| `walletAgents` | Number of Agents | number | `5` | 1–1000, step 1 |
| `walletPerAgent` | Monthly AI Spend per Agent (uncapped, $) | number | `200` | 0–1,000,000, step 10 |
| `walletFeePct` | Wallet Fee (% of spend) | number | `0` (no wallet fee) | 0–10, step 0.1 |
| `walletCap` | Creator-Set Cap per Agent / Month ($) | number, **optional** | blank = uncapped | 0–1,000,000, step 10 |

Defaults are the fallback model: **no wallet fee, no cap** — identical to the
pre-wallet calculator behavior. Entering nothing changes no prior assumption.

### 2.2 Model

```
uncapped        = agents × perAgent
feeUncapped     = uncapped × feePct / 100
hasCap          = (cap is present AND cap > 0)
cappedPerAgent  = hasCap ? min(perAgent, cap) : perAgent
capped          = agents × cappedPerAgent
feeCapped       = capped × feePct / 100
overage         = max(0, uncapped − capped)
overagePerAgent = hasCap ? max(0, perAgent − cap) : 0
exceeded        = hasCap AND perAgent > cap
```

Money is formatted with `fmt()` (compact: `$1.5K` ≥ 10K, else toLocaleString).

### 2.3 Outputs

| Result ID | Meaning |
|-----------|---------|
| `w-uncapped` | Uncapped monthly spend |
| `w-fee-uncapped` / `w-fee-uncapped-sub` | Wallet fee at uncapped spend (+ label) |
| `w-capped` / `w-capped-sub` | Capped monthly spend (+ clamp state) |
| `w-fee-capped` | Wallet fee on actual (capped) spend |
| `w-overage` / `w-overage-sub` | Spend blocked by cap (+ per-agent overage) |
| `w-note` | Scenario narrative (cap-constrained planning) |

### 2.4 Edge cases

1. **No wallet fee** (`walletFeePct = 0`): fee rows render `$0` /
   "No wallet fee configured". Cloudflare has not disclosed fees, so 0% is the
   honest default; the helper text documents credit-card rails (~1.5–3.5% +
   fixed) vs stablecoin/x402 micropayments (~$0.0001/tx).
2. **Exceeded cap** (`perAgent > cap`): capped spend clamps at `cap × agents`,
   overage is shown and labeled "blocked until manual override" — mirroring
   Cloudflare Wallets' rule that agents cannot self-approve escalations, and
   the cap is enforced at the wallet API layer (prompt-injection immune).
3. **No cap** (blank): capped == uncapped, output labeled "No cap set —
   identical to uncapped", narrative defaults to uncapped baseline.
4. **Cap below spend but fee on capped spend**: feeCapped applies to capped
   total, so blocking spend also blocks fee.
5. **Zero spend** (`perAgent = 0`): valid; all outputs $0.
6. **Cap == spend**: not exceeded; no clamp (min returns spend).

### 2.5 Fact basis (verified via parent research brief t_6e67321b)

Cloudflare Wallets + cloudflare.pay announced Aug 4, 2026 (Agents Week).
Account Wallets (human-owned) → Virtual Wallets (agent-owned, API keys).
Guardrails: spending cap/allowance, merchant allow-list, max transaction size,
manual override required. Payments on x402 (HTTP 402 + price manifest).
Fees/stablecoins/launch date undisclosed ("coming months"). Handle reservation
opened Aug 4–5, 2026. Sources linked in section `#wallet-rails`.

---

## 3. Main Pricing Calculator (unchanged fallback defaults)

### 3.0 ChatGPT Ads (EU) preset (NEW 2026-08-22)

Added as an 8th `serviceType` option: **`chatgpt_ads`** — "📢 ChatGPT Ads
Management (EU)". Selecting it reveals a labeled inputs box (`#chatgptAdsBox`)
with two extra inputs:

| Field ID | Label | Type | Default | Constraint |
|----------|-------|------|---------|------------|
| `adsMonthlySpend` | Monthly Ad Spend (pass-through, $) | number | `5000` | 500–250,000, step 500 |
| `adsMgmtFeePct` | Management Fee (% of ad spend) | number | `20` | 10–30, step 0.5 |

Pricing model (replaces the generic retainer formula for this service only):

```
rawFee     = adsMonthlySpend × adsMgmtFeePct / 100
feeFloor   = BASE_RETAINER.chatgpt_ads.min = 2000   (covers manual review + policy monitoring)
feeCap     = BASE_RETAINER.chatgpt_ads.max = 7500   (typical rollout retainer ceiling)
retainer   = round(clamp(rawFee, 2000, 7500) / 50) × 50
setupFee   = round(setupMid × combined / 500) × 500 (no portability/plugin factors — managed line)
margin     = BASE_MARGIN.chatgpt_ads = 62 (base; EXP_MULT applies, portability bonus zeroed)
```

Constants: `BASE_SETUP.chatgpt_ads = {1500, 5000}` · `BASE_RETAINER.chatgpt_ads =
{2000, 7500}` · `BASE_MARGIN.chatgpt_ads = 62` · `SERVICE_LABELS.chatgpt_ads =
'ChatGPT Ads management'`. ROI text and pitch script branch for this service
(EU-reach framing, not hours-saved). Umami `calculator_run` carries the service
value as before.

Fact basis (research brief t_ff98639f, verified): OpenAI announced Aug 18, 2026
that ChatGPT Ads expands to **31 European markets Aug 24, 2026** (40 markets
total). Ads appear on **Free and Go tiers only** (Go ≈ €8/mo; Plus/Pro/Enterprise
ad-free); buying is **agency-led first** (OpenAI Ads Solutions team + agency/tech
partners; self-serve Ads Manager later this summer); EU targeting is
**GDPR consent-shaped**; health/mental-health/political content ineligible;
under-18 excluded. Agency pricing guidance (chatgpt-ads-agency-pricing-2026.html):
setup $1,500–$5,000 (account structure, conversion tracking/oCPC, creative prep);
management fee 15–25% of ad spend with $2,000–$7,500/mo retainer floor. Ad spend
is pass-through — the client pays OpenAI directly; the management fee is the
agency's revenue.

### 3.1 Inputs

| Field ID | Type | Default |
|----------|------|---------|
| `serviceType` | select (7 services) | — (required) |
| `bizSize` | select (5 sizes) | — (required) |
| `numWorkflows` | select (1/2/4/6/11) | `4` |
| `experience` | select (beginner/intermediate/advanced/expert) | `intermediate` |
| `timeline` | select (rush/standard/extended) | `standard` |
| `modelStrategy` | select (hybrid/deepseek/grok46/gemini37/sonnet5/local/open/sol/frontier) | `hybrid` |
| `deliveryRisk` | select (low/moderate/high/levelsio) | `low` |
| `portability` | select (single/plugin_2/plugin_many) | `single` |
| `hoursSaved` | range 5–300 | `40` |
| `openaiOverhead` | checkbox (NEW 2026-08-20) | `false` (OFF — OpenAI not billing customers; what-if stress only) |

`openaiOverhead` is a visible toggle in the Model Strategy section. It applies a
**+20% multiplier (×1.20) to OpenAI-based strategies only** — `sol` (GPT-5.6 Sol,
pure OpenAI) and `frontier` (Paid frontier Claude+GPT — full 20% is an
upper-bound stress test since the split is undisclosed). All other strategies
(Anthropic, Google, DeepSeek, open-weight, local, hybrid, Grok) are unaffected.
Default OFF preserves every prior output byte-for-byte.

### 3.2 Key constants

```
BASE_SETUP / BASE_RETAINER / BASE_MARGIN   per service (2026 market ranges)
SIZE_MULT     0.65 / 0.85 / 1.0 / 1.35 / 1.8
WORKFLOW_MULT 0.7 / 0.9 / 1.0 / 1.3 / 1.6
EXP_MULT      0.7 / 1.0 / 1.3 / 1.6
TIMELINE_MULT 1.35 / 1.0 / 0.9
MODEL_COMPUTE_FACTOR  open 0.95 · deepseek 0.92 (PROVISIONAL — hike announced) · local 0.85 (Meta Muse Glimmer self-host, cheapest — hardware-amortized, per-workload) · grok46 1.0 (Grok 4.6 SpaceXAI, $2/$6 verified — neutral, matches open-weight tier price but hosted frontier) · gemini37 0.93 (Gemini 3.7 Flash Google, intro $0.75/$3.75 verified through 2026-12-31 then $1.50/$7.50 — slightly below open because intro undercuts it, conservative due to expiry + hosted) · sonnet5 0.97 (Claude Sonnet 5 Anthropic, $2/$10 verified PERMANENT Aug 10 2026 — Sept 1 $3/$15 increase CANCELLED; input at open-weight parity, output above open but below premium frontier; hosted frontier no self-host upside) · hybrid 1.0 · frontier 1.1 · sol 1.15 (verified official $4/$20 promo Aug 21 – Nov 21, 2026, down from $5/$30 estimate; cached input $0.40 — factor unchanged, still premium tier above generic frontier for reasoning-effort dial)
MODEL_MARGIN_BONUS    open +5 · deepseek +6 · local +8 · grok46 +2 · gemini37 +4 · sonnet5 +3 · hybrid 0 · frontier −2 · sol −3
DELIVERY_RISK_FACTOR  low 1.0 · moderate 1.15 · high 1.35 · levelsio 2.0
PORTABILITY_SETUP_FACTOR   single 1.0 · plugin_2 0.85 · plugin_many 0.70
PORTABILITY_RETAINER_FACTOR single 1.0 · plugin_2 0.97 · plugin_many 0.94
PORTABILITY_MARGIN_BONUS   single 0 · plugin_2 +1 · plugin_many +3
PORTABILITY_PACKAGING_FEE  single $0 · plugin_2 $750 · plugin_many $1,500
```

### 3.3 Model

```
combined        = SIZE_MULT × WORKFLOW_MULT × EXP_MULT × TIMELINE_MULT
setupFee        = round(setupMid × combined × PORTABILITY_SETUP_FACTOR / 500) × 500
                + PORTABILITY_PACKAGING_FEE
OVERHEAD_MULT   = (openaiOverhead && strategy ∈ {sol, frontier}) ? 1.20 : 1.0
monthlyRetainer = round(retainerMid × combined × MODEL_COMPUTE_FACTOR × OVERHEAD_MULT
                × DELIVERY_RISK_FACTOR × PORTABILITY_RETAINER_FACTOR / 50) × 50
margin          = clamp(40..82, BASE_MARGIN + (EXP_MULT−1)×10 + MODEL_MARGIN_BONUS
                + PORTABILITY_MARGIN_BONUS)
acv             = setupFee + monthlyRetainer × 12
monthlySavings  = hoursSaved × laborRate(25/35/45/65 by bizSize)
roi             = annualSavings / acv
paybackMonths   = ceil(setupFee / max(netMonthly, tiny)) fallback 12
```

`OVERHEAD_MULT` is the OpenAI safety-monitoring overhead stress multiplier
(2026-08-20). When the toggle is ON and the strategy is OpenAI-based, the
retainer scales by exactly ×1.20 (matching OpenAI's "roughly 20% of the
inference compute being monitored" estimate); the margin and setup fee are
unchanged. Output text carries an explanatory note when the toggle is ON —
either "applied +20% to this OpenAI-based strategy" or "toggle ON but not
applicable to this strategy" (non-OpenAI strategies). Fact basis (research brief
t_b34197c5): OpenAI official post Aug 18, 2026 (openai.com/index/pacing-model-
development-cyber-capabilities) — ~20% overhead estimate, scope = Sol-class+
tool-enabled RL training/eval + all Astra inference with tools; NOT billed to
customers (OpenAI spokesperson via The Register, Aug 19, 2026; corroborated TNW);
Anthropic: pause "would not be required" if 186-page Risk Report safeguards
followed (Axios, Aug 19, 2026). Umami `calculator_run` event gains
`openai_overhead: true|false`.

---

## 4. Failure & Retry Estimator (unchanged)

```
total = base × (1 + retries) + cleanup
multiple = total / base
```

Presets: levelsio (500/0/400 → $900, 1.8×), fanout (120/2/150), simple (20/1/15), custom.

---

## 5. Routing Estimator (unchanged)

```
currentCost = inTok×cur.in + outTok×cur.out
routedCost  = (inTok×(1−r)×cur.in + inTok×r×flashLite.in)
            + (outTok×(1−r)×cur.out + outTok×r×flashLite.out)
savings     = currentCost − routedCost
```

Prices (per 1M tokens): Gemini 3.7 Flash intro $0.75/$3.75 (through 2026-12-31, then
$1.50/$7.50) · Flash-Lite $0.30/$2.50 · Flash $1.50/$9.00 · 2.5 Pro $1.25/$10.00.

---

## 6. ChatGPT Business Seat Cost Estimator (NEW 2026-08-25)

Purpose: model ChatGPT Business subscription seat costs (Standard vs Premium)
for a client's workspace, with billing cadence (monthly vs annual) and the
verified usage-multiplier assumptions. This reverses the earlier Aug 10/12
"seat costs are not a calculator input — budget separately" stance.

### 6.1 Inputs

| Field ID | Label | Type | Default | Constraint |
|----------|-------|------|---------|------------|
| `chatgptSeatType` | Seat Type | select | `premium` | `standard` \| `premium` |
| `chatgptSeats` | Number of Seats (Users) | number | `10` | 2–200, step 1 |
| `chatgptBilling` | Billing Cadence | select | `annual` | `monthly` \| `annual` |

### 6.2 Price table (USD list prices, verified Aug 25, 2026)

| Seat type | Monthly billing | Annual billing (effective /mo) | Annual discount |
|-----------|-----------------|-------------------------------|-----------------|
| Standard  | $25/user/mo     | $20/user/mo                   | 20%             |
| Premium   | $125/user/mo    | $100/user/mo                  | 20%             |

### 6.3 Model

```
perUser      = billing === 'annual' ? price.annual : price.monthly
monthlyCost  = seats × perUser
annualCost   = monthlyCost × 12
savings      = billing === 'annual' ? (seats × price.monthly × 12) − annualCost : 0
```

Validation: `seats < 2` → alert (2-seat minimum, any mix of Standard + Premium);
`seats > 200` → alert (200-seat cap per subscription since Aug 24, 2026; larger
deployments move to ChatGPT Enterprise).

### 6.4 Outputs

| Element ID | Label |
|------------|-------|
| `cs-peruser` / `cs-peruser-sub` | Per-user price at chosen cadence (both cadences listed) |
| `cs-monthly` / `cs-monthly-sub` | Monthly cost (seats × per-user effective rate) |
| `cs-annual` / `cs-annual-sub` | Annual cost (seats × per-user × 12) |
| `cs-savings` / `cs-savings-sub` | Annual-billing savings vs monthly (20%) or switch CTA |
| `cs-usage` / `cs-usage-sub` | Premium = "5x more usage", no 5-hour limit, weekly resets; Standard = baseline, 5-hour limit applies |
| `cs-note` | How-to-read text incl. usage-multiplier framing and billing mechanics |

### 6.5 Usage-multiplier assumptions (from verified facts)

- Premium's official benefit is **"5x more usage than Standard seats"** — there is
  **no fixed credit/dollar equivalent** (consumption depends on model and task);
  included usage is separate from the workspace credit pool; the five-hour usage
  limit does not apply to Premium; usage resets weekly (predictable cadence).
- 2-seat minimum (any mix); 200-seat cap since Aug 24, 2026; >200 → Enterprise
  (sales-led, contracted).
- Billing cadence is per-subscription (all seats share monthly or annual);
  changing cadence takes effect at renewal. Mid-cycle seat additions trigger an
  immediate prorated charge; reductions take effect next cycle.
- ChatGPT API usage is billed separately from Business seats. OpenAI does not
  train on workspace data. Prices in USD; may vary by country/currency.
- Fact basis: research brief t_642ada39 (7 sources, 34 evidence quotes;
  openai.com/index/premium-seats-chatgpt-business + OpenAI Help Center).

### 6.6 Analytics

`chatgpt_seats_estimated` on every estimate click (payload: seat_type, seats,
billing); `chatgpt_seat_type_selected` on seat-type change (index.html only —
index_calculator.html tracks via the estimate click).

## Changelog

- **2026-08-25** — ChatGPT Business Premium seat estimator added (task
  t_d7ed9100; fact basis research brief t_642ada39, 7 sources / 34 evidence
  quotes). New section `#chatgpt-seats-estimator` (`calculateChatgptSeats()`)
  with seat-type selector (Standard $25/$20 / Premium $125/$100), seat count
  (2–200), billing cadence (monthly / annual). Premium = official "5x more
  usage than Standard", no 5-hour limit, weekly resets (usage-multiplier
  assumption, no credit/dollar equivalent — flagged). 2-seat minimum, 200-seat
  cap, cadence per-subscription, API billed separately. Verified: node harness
  16/16 scenarios on both index.html and index_calculator.html (10 Premium
  annual = $1,000/mo / $12,000/yr; 10 Premium monthly = $1,250/mo). FAQ +
  FAQPage JSON-LD rewritten (supersedes "budget separately" note), meta
  description/keywords, assumptions footer (date → Aug 25), on-page changelog,
  Umami events `chatgpt_seats_estimated` + `chatgpt_seat_type_selected`, link
  to new explainer /chatgpt-business-premium-seats-pricing. Also fixed a
  pre-existing malformed keywords meta (unterminated attribute swallowing the
  robots meta).
- **2026-08-22** — ChatGPT Ads (EU) pricing preset added (task t_f07e1052; fact
  basis research brief t_ff98639f). New `serviceType` option `chatgpt_ads`
  ("📢 ChatGPT Ads Management (EU)") with a labeled inputs box (`#chatgptAdsBox`,
  shown only when selected) for monthly ad spend + management fee %. Retainer =
  clamp(ad spend × fee %, $2,000, $7,500) rounded to $50; setup $1,500–$5,000
  range; margin base 62%. Portability/plugin factors intentionally skipped for
  this managed-service line. ROI/pitch text branches to EU-reach framing
  (31 markets Aug 24, 2026; Free+Go only; agency-led buying first). FAQ +
  FAQPage JSON-LD, Pricing Reference Table row, meta description/keywords,
  assumptions footer (date → Aug 22), changelog entries on both pages.
  Verified: node harness (15 scenarios on index_calculator.html, 13 on
  index.html incl. portability regression) + browser render/click test +
  JSON-LD valid. Sources: openai.com/index/chatgpt-ads-expands-across-europe ·
  searchengineland.com · dataconomy.com · euronews.com (research brief
  t_ff98639f, 7 sources, 16 verbatim quotes).
- **2026-08-20** — OpenAI safety-monitoring overhead stress-test toggle added
  (task t_72a68f53; fact basis research brief t_b34197c5). New visible checkbox
  `openaiOverhead` in the Model Strategy section (OFF by default). When ON, a
  ×1.20 `OVERHEAD_MULT` applies to OpenAI-based strategies only (`sol`, `frontier`);
  all other strategies unchanged and the output note explains either the applied
  +20% or the not-applicable case. OpenAI estimates safety monitoring adds roughly
  20% overhead to the inference compute it monitors (official post Aug 18, 2026 —
  Sol-class+ tool-enabled RL training/eval, plus all Astra inference with tools);
  OpenAI is NOT billing customers for it (spokesperson via The Register, Aug 19,
  2026; corroborated TNW); Anthropic says a pause would not be required if its
  186-page Risk Report safeguards are followed (Axios, Aug 19, 2026). FAQ +
  FAQPage JSON-LD, meta description/keywords, assumptions footer, page changelog,
  Umami `openai_overhead` flag on `calculator_run`. Default (OFF) outputs
  byte-identical to prior deploy. Sources: openai.com/index/pacing-model-
  development-cyber-capabilities · theregister.com (Aug 19) · thenextweb.com
  (Aug 19) · axios.com (Aug 19).
- **2026-08-13** — Claude Sonnet 5 model strategy added (Anthropic; API pricing made
  PERMANENT Aug 10, 2026: $2.00/$10.00 per 1M input/output tokens; the previously
  scheduled Sept 1, 2026 increase to $3/$15 is CANCELLED — no scheduled change pending;
  cache hit $0.20 per 1M input, cache write $2.50 (5m) / $4 (1h) per 1M; API-only
  change, subscription prices unchanged). Conservative modeling:
  `MODEL_COMPUTE_FACTOR.sonnet5 = 0.97`, `MODEL_MARGIN_BONUS.sonnet5 = +3` — input at
  open-weight parity ($2 vs Qwen 3.8 Max), output above open-weight ($10 vs $6) but
  well below premium frontier (GPT-5.6 Sol $4/$20 promo through Nov 21, 2026), hosted frontier API with
  no open-weight/self-host upside. Selector option + helper, model label/assumption
  note/ROI text branches, FAQ + FAQPage JSON-LD, Pricing Reference Table footnote, meta
  tags, assumptions note. No other strategy factors changed; default (hybrid) outputs
  unchanged. Sanity check: chatbot/small/intermediate/standard/low/single → sonnet5
  retainer $600/mo (0.97 factor applied vs hybrid $600 — rounds to nearest $50), margin
  73% (70 + 3 bonus). Sources: anthropic.com/news/claude-sonnet-5 +
  platform.claude.com/docs/en/about-claude/pricing (research brief t_735f2ef6).
  Task t_f62457f5.
- **2026-08-13** — Gemini 3.7 Flash model strategy added (Google, released Aug 13, 2026;
  based on Gemini 3.6 Flash). INTRO pricing $0.75/$3.75 per 1M input/output tokens
  (output includes thinking tokens) valid through 2026-12-31, then $1.50/$7.50 from
  Jan 1, 2027 (post-intro equals 3.6 Flash launch price; intro exactly half). 1M-token
  context, 64K max output; free tier, 5,000 free search requests/mo shared across
  Gemini 3.x, 50% batch discount. Benchmarks vs 3.6 Flash: FrontierCode 1.1 Main 43.6%
  (vs 34.4%), DeepSWE v1.1 65.3% (vs 49.0%), WebDev Arena Elo 1588 (vs 1538).
  Conservative modeling: `MODEL_COMPUTE_FACTOR.gemini37 = 0.93`,
  `MODEL_MARGIN_BONUS.gemini37 = +4` — intro pricing undercuts the open-weight tier
  (Qwen 3.8 Max / Grok 4.6 $2/$6) on both axes, but the rate expires 2026-12-31 and
  post-intro output ($7.50) is above open-weight ($6), and it is a hosted frontier API
  with no open-weight/self-host upside. Also added to the Routing Estimator as a
  routable current model (`gemini-3-7-flash`; ROUTE_PRICES.gemini37 = {in: 0.75,
  out: 3.75}). Selector option + helper, model label/assumption note/ROI text branches,
  FAQ + FAQPage JSON-LD, Pricing Reference Table footnote, meta tags, assumptions note
  (date → Aug 13, 2026). No other strategy factors changed; default (hybrid) outputs
  unchanged. Sanity check: 1M input / 500K output on gemini37 = $2.625 → displays
  $2.63/mo. Sources: blog.google, ai.google.dev/gemini-api/docs/pricing, DeepMind model
  card (primary); 9to5Google + MarkTechPost (secondary) — research brief t_7ea3f430.
  Task t_b531e770.
- **2026-08-12** — Grok 4.6 model strategy added (SpaceXAI, released Aug 12, 2026; API
  $2/$6 per 1M input/output, fast variant 2x, cache hit $0.50 (−75%); 500k context window
  and Intelligence Index 61 = GPT-5.6 Sol max per Artificial Analysis — x.ai announcement
  silent on context). Conservative modeling: `MODEL_COMPUTE_FACTOR.grok46 = 1.0`,
  `MODEL_MARGIN_BONUS.grok46 = +2` (verified price matches open-weight tier but hosted
  frontier, so no discount/premium over the hybrid baseline). Selector option + helper,
  model label/assumption note/ROI text branches, FAQ + FAQPage JSON-LD, Pricing Reference
  Table footnote, meta tags, assumptions note. No other strategy factors changed; default
  (hybrid) outputs unchanged. Sanity check: 50k input / 2k output run = $0.112 (vs
  GPT-5.6 Sol $0.31 → 64% cheaper at Sol's then-estimate $5/$30; at Sol's verified Aug 21,
  2026 promo $4/$20 the same run is ~$0.24, so Grok 4.6 is ~53% cheaper — still the 
  lower-cost stack for this workload). Sources: x.ai, 9to5Mac,
  Artificial Analysis (research brief t_a87cfcc9). Task t_c7e3e912.
- **2026-08-12** — Grok Bot added as a fourth coding-agent billing model
  (subscription-bundled agent access) in the cost-transparency comparison on the
  homepage (`#coding-agent-transparency`). No standalone price announced —
  recorded as "unknown / contact sales" placeholder per task brief; bundled with
  SuperGrok Heavy, Cursor Ultra, Cursor Teams Premium (beta); desktop (macOS) +
  iOS; always-on agents run 24/7 on their own cloud computer; no usage caps
  disclosed; enterprise waitlist. Grok Bot is NOT usage-metered, so it is not a
  calculator input (no per-token model, no seat/credit selectors added). Agent
  metadata block, FAQ item + FAQPage JSON-LD, meta description/keywords, and
  assumptions footer note added; no calculator logic or constants changed.
  Sources: x.ai/news/introducing-grok-bot (primary), MacRumors, Oflight —
  verified via research brief t_e203f6d1. Task t_03977e01.
- **2026-08-11** — Local / self-hosted (Meta Muse Glimmer) strategy added:
  Meta released Muse Glimmer Aug 10, 2026 — 30B dense (~29.6B total), Apache
  2.0, 131,072+ context, official 4-bit K-Quant-17GB GGUF = 16,756,681,056 bytes
  (~15.6 GiB, under 20 GB), single consumer GPU (24 GB VRAM class), >200 tok/s on
  RTX 5090 with DFlash (233.4 vs 74.9 baseline). `MODEL_COMPUTE_FACTOR.local =
  0.85` (cheapest on page), `MODEL_MARGIN_BONUS.local = +8`. New
  `#muse-glimmer-local` cost-scenario section (specs table, local-vs-API
  break-even framing, caveats: 1.0% quant degradation, 24–32 GB envelope, not
  frontier on HLE 22.0 / GPQA 83.5, no audio, own ops/security; sources: Meta
  model card, GGUF repo, HF blog, NVIDIA blog, TechStartups, AMD, explainx).
  Selector helper, open-weight narrative, Pricing Reference Table footnote, FAQ +
  FAQPage schema entry, meta tags, assumptions date (Aug 11) updated. Framing:
  "cheapest per workload," not blanket "cheapest model." Parent brief t_df8c39e4.
- **2026-08-08** — DeepSeek V4 strategy added (V4-Flash $0.14/$0.28, V4-Pro
  $0.435/$0.87 per 1M tokens) flagged **PROVISIONAL**: DeepSeek announced a
  significant API price increase (Aug 6, 2026) with no new rates/percentage/
  effective date disclosed (verified live 2026-08-08, footnote 2 of the official
  pricing page). Compute factor intentionally conservative (0.92, margin +6) so
  the calculator does not over-state "DeepSeek is cheapest"; output carries an
  explicit verify-before-quoting note; red warning banner in the open-weight
  section; new FAQ + FAQPage schema entry; meta tags extended. Sources: DeepSeek
  pricing page (live), TNW, SCMP, Dataconomy/Bloomberg, TechNode. Parent brief
  t_05a34bf3.
- **2026-08-07** — Wallet & Spend Cap Estimator added (Cloudflare Wallets /
  x402 agent payment rails): optional wallet fee %, per-agent spend, creator-set
  cap; capped vs uncapped output; edge cases (no fee, exceeded cap, no cap).
  New `#wallet-rails` explainer section, new FAQ item, meta description/keywords
  extended. Fallback defaults (0% fee, uncapped) preserve all prior assumptions.
  Verified against parent research brief t_6e67321b.
- **2026-08-06** — Qwen 3.8 Max open-weight refresh; GPT-5.6 Sol/Luna options.
- **2026-08-05** — Agent Failure & Retry estimator; open-weight model economics;
  Volta compute-cost benchmark; Gemini routing estimator.
