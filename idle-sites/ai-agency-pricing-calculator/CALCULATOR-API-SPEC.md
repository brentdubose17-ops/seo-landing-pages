# AI Agency Pricing Calculator — API & Cost Model Spec

**Site:** aiagencycalculator.com
**Source asset:** `~/seo-pages/idle-sites/ai-agency-pricing-calculator/index.html`
**Last updated:** 2026-09-10 (AI inference as a share of gross margin consumed — task t_9b19d6a2)

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
| 6 | **Compute Supply Scenario** (NEW 2026-08-29) | `calculateSupply()` | `#compute-supply-estimator` |
| 7 | **Claude Code Usage Limit Cost Impact Estimator** (NEW 2026-08-30; **index rebased 2026-09-14**) | `calculateClaudeCodeLimits()` | `#claude-code-limits-estimator` |
| 8 | **AI Inference as a Margin Line Estimator** (NEW 2026-09-10) | `calculateInferenceMargin()` | `#inference-margin-estimator` |

All calculators are client-side. No API keys, no server round-trips (except the
optional email-capture worker on result unlock).

---

## 8. Outcome-based pricing mode (NEW 2026-08-31)

**Location:** `~/seo-pages/idle-sites/ai-agency-pricing-calculator/ai-agent-api-cost-calculator.html`
(separate page — the Agent API Cost Estimator, per-token model). This is the
calculator that got the outcome-mode selector; the homepage index.html main
calculator is unchanged.

Purpose: compare paying per-token (or per-call) for the same AI workload vs
paying per completed task/outcome — the pricing model OpenAI began piloting
with select enterprise customers Aug 30–31, 2026 (research brief t_9974fbbc).

### 8.1 Mode selector

Radio `name="mode"` at the top of the calculator: `usage` (default, existing
behavior preserved) | `outcome`. Switching modes toggles visibility of the
outcome inputs and the side-by-side results block; **input values are never
cleared**, so switching modes does not lose inputs.

### 8.2 Inputs (outcome mode)

| Field ID | Label | Type | Default | Constraint |
|----------|-------|------|---------|------------|
| `tasksPerMonth` | Expected completed tasks per month | number | `1320` | 1–10,000,000, step 1 |
| `pricePerOutcome` | Price per completed outcome ($) | number | `0.99` | 0.01–50, step 0.01 |

The existing per-token inputs (agents, callsPerDay, daysPerMonth, complexity,
tokIn/tokOut, inPrice/outPrice, cacheHit, cachePrice, overhead, markup) remain
visible in outcome mode and drive the per-token side of the comparison.

### 8.3 Model

```
monthlyCalls   = agents × callsPerDay × daysPerMonth × complexity   (existing)
outcomeMonth   = tasksPerMonth × pricePerOutcome
outcomeYear    = outcomeMonth × 12
tokenMonth     = loaded (existing fully-loaded per-token cost)
tokenYear      = tokenMonth × 12
delta          = outcomeMonth − tokenMonth   (negative = outcome cheaper)
deltaPct       = delta / tokenMonth × 100
```

### 8.4 Outputs (rounded to 2 decimals via `fmt2()`)

| Result ID | Meaning |
|-----------|---------|
| `rOutcomeMonth` / `rOutcomeYear` | Outcome-based monthly/yearly cost |
| `rTokenMonth` / `rTokenYear` | Same work per-token (loaded) monthly/yearly |
| `rDelta` / `rDeltaLabel` | Delta $ + % (break-even when |delta| < $0.005) |
| `rOutcomePerTask` | Price per completed outcome |
| `outcomeNote` | Required availability note: OpenAI's outcome-based pricing is currently limited to select enterprise customers and is not generally available; risk-transfer copy (cheaper when success rate low, riskier at high volume when per-outcome price > effective per-token cost); market references (Intercom $0.99, Zendesk ~$1.20–1.50, HubSpot $0.50, Salesforce $2) |

### 8.5 Verified

- Mock-DOM node harness (test-aac-outcome.mjs) PASS: default math ($1,306.80/mo
  outcome vs $1,834.80/mo token at defaults), input preservation across mode
  switches, 2-decimal rounding on all $ figures.
- index.html regression harness still 10/10 (main calculator untouched).
- JSON-LD valid; FAQ parity 7/7 visible = schema; all 42 JS-referenced element
  ids exist in HTML (no null getElementById / console-error risk).


## 2. Wallet & Spend Cap Estimator (NEW)

Purpose: model monthly AI spend under agent payment rails (Cloudflare Wallets,
x402-style rails) with optional wallet fees and creator-set spending caps, and
show **capped vs uncapped** scenarios.

### 2.1 Inputs (all optional — fallback defaults preserve previous behavior)

| Field ID | Label | Type | Default | Constraint |
|----------|-------|------|---------|------------|
| `walletAgents` | Number of Agents | number | `5` | 1–1000, step 1 |
| `walletPerAgent` | Monthly AI Spend per Agent (uncapped, $) | number | `200` | 0–1,000,000, step 10 |
| `walletFeePct` | Wallet Fee (% of spend) — **ESTIMATE** | number | `0` (no wallet fee) | 0–10, step 0.1 |
| `walletCap` | Creator-Set Cap per Agent / Month ($) | number, **optional** | blank = uncapped | 0–1,000,000, step 10 |

The wallet-fee input is labeled **ESTIMATE** with the UI flag "Cloudflare has not
published wallet fees; this default is an estimate." — Cloudflare has published no
fee schedule as of 2026-08-29; update the default and drop the flag when Cloudflare
ships fees (tracked in the code comment + CHANGELOG).

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
MODEL_COMPUTE_FACTOR  open 0.95 · deepseek 0.92 (PROVISIONAL — hike announced) · dsv4pro 0.86 (DeepSeek V4 Pro cache-aware, off-peak $0.66/$1.98 per 1M + $0.022 cache read — lowest cache-read stack for agent runs; 92% hit-rate assumption flagged) · local 0.85 (Meta Muse Glimmer self-host, cheapest — hardware-amortized, per-workload) · grok46 1.0 (Grok 4.6 SpaceXAI, $2/$6 verified — neutral, matches open-weight tier price but hosted frontier) · gemini37 0.93 (Gemini 3.7 Flash Google, intro $0.75/$3.75 verified through 2026-12-31 then $1.50/$7.50 — slightly below open because intro undercuts it, conservative due to expiry + hosted) · sonnet5 0.97 (Claude Sonnet 5 Anthropic, $2/$10 verified PERMANENT Aug 10 2026 — Sept 1 $3/$15 increase CANCELLED; input at open-weight parity, output above open but below premium frontier; hosted frontier no self-host upside) · hybrid 1.0 · frontier 1.1 · sol 1.15 (verified official $4/$20 promo Aug 21 – Nov 21, 2026, down from $5/$30 estimate; cached input $0.40 — factor unchanged, still premium tier above generic frontier for reasoning-effort dial) · fable5 1.25 (Claude Fable 5.1 Anthropic, $10/$50 verified Sept 1, 2026 + $0.25 cache read — cache reads down 75% from Fable 5's $1.00; most expensive per-token stack; 1M ctx, 128K max out; Mythos 5.1 same model, trusted-access-only/not GA; Ramp AI Index Aug 2026 measured the predecessor Fable 5: ~6% of Anthropic business tokens / 11.4% of Anthropic spend) · opus5 1.18 (Claude Opus 5 Anthropic, $5/$25 verified — exactly half of Fable 5, launched late July 2026; between Sol 1.15 and Fable 5 1.25; FT-cited Ramp data reports Opus 5 overtook Fable 5 in enterprise spend)
MODEL_MARGIN_BONUS    open +5 · deepseek +6 · dsv4pro +7 · local +8 · grok46 +2 · gemini37 +4 · sonnet5 +3 · hybrid 0 · frontier −2 · sol −3 · fable5 −6 · opus5 −5
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

## 4. Failure & Retry Estimator (unchanged core)

```
total = base × (1 + retries) + cleanup
multiple = total / base
```

Presets: levelsio (500/0/400 → $900, 1.8×), fanout (120/2/150), simple (20/1/15),
custom.

### 4.1 capbreach preset (NEW 2026-08-29 — Cloudflare agent wallets chain)

Scenario Preset dropdown option **"Wallet allowance-cap breach — manual override
approvals (billable minutes)"**. Models Cloudflare Wallets' manual-override rule:
when an agent hits its creator-set allowance, over-limit requests are blocked at the
wallet API layer and routed to a human for a manual override; the approval is
billable human time. Shows a conditional inputs box (`#capbreachBox`) with:

| Field ID | Label | Type | Default | Constraint |
|----------|-------|------|---------|------------|
| `capReqCount` | Over-Cap Requests / Month | number | `10` | 1–1000, step 1 |
| `capMinPer` | Billable Minutes per Override | number | `10` | 1–240, step 1 |
| `capRateHr` | Billable Rate ($/hr) | number | `150` | 1–1000, step 5 |

```
overrideCost = capReqCount × (capMinPer ÷ 60) × capRateHr
total        = base × (1 + retries) + cleanup + overrideCost
```

Adds a "Manual Override Approval" result card (visible only in capbreach mode).
Cloudflare has NOT published wallet fees or override pricing — defaults are
estimates; update when Cloudflare ships fees (code comment + CHANGELOG track this).
Fact basis: Cloudflare blog (Aug 4, 2026) + Help Net Security (Aug 5, 2026) via
research brief t_6e67321b / t_7746aecf.

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

## 7. Compute Supply Scenario (NEW 2026-08-29)

Purpose: model **supply-side risk** on per-token costs for 2026–2027 —
power-constrained vs baseline. The calculator previously priced today's inputs
only; nothing modeled power caps, dedicated-capacity deals, or grid-upgrade
pass-throughs. This module closes that gap for agency owners pricing client
AI spend. All adjustment percentages are **ESTIMATES** (projections, not
published prices) — defaults are derived from verified signals, and the UI
labels them accordingly.

### 7.1 Inputs

| Field ID | Label | Type | Default | Constraint |
|----------|-------|------|---------|------------|
| `supplyTokens` | Monthly Token Volume (millions) | number | `100` | 1–100,000, step 1 |
| `supplyBasePerM` | Baseline Cost per 1M Tokens ($) | number | `3.00` | 0.01–200, step 0.05 |
| `supplyHorizon` | Horizon | select | `2026` | `2026` \| `2027` |
| `supplyGridPass` | Grid / Power Pass-Through (% add-on) — **ESTIMATE** | number | `8` (2026) / `12` (2027) | 0–50, step 0.5 |
| `supplyLockedRelief` | Locked-In Capacity Relief (% discount) — **ESTIMATE** | number | `0` (2026) / `5` (2027) | 0–50, step 0.5 |

Horizon select calls `applySupplyHorizon()`, which loads `SUPPLY_PRESETS`
(`'2026': {grid: 8, relief: 0}`, `'2027': {grid: 12, relief: 5}`) into the two
ESTIMATE fields, then recalculates.

### 7.2 Model

```
baselineCost      = tokens × basePerM
constrainedPerM   = basePerM × (1 + gridPass/100) × (1 − relief/100)
constrainedCost   = tokens × constrainedPerM
delta             = constrainedCost − baselineCost
deltaPct          = (constrainedPerM / basePerM − 1) × 100
annualDelta       = delta × 12
```

Money is formatted with `fmt()` (compact `$1.5K` ≥ 10K, else toLocaleString).

### 7.3 Outputs

| Element ID | Meaning |
|------------|---------|
| `s-baseline` | Baseline monthly cost at user's blended rate |
| `s-constrained` / `s-constrained-sub` | Power-constrained monthly cost (EST.) + horizon/preset label |
| `s-delta` / `s-delta-sub` | Delta per month ($, sign-prefixed) + % vs baseline |
| `s-perm` / `s-perm-sub` | Effective per-1M under scenario (EST.) vs baseline per-1M |
| `s-annual` | 12-month outlook delta if the scenario holds |
| `s-note` | Narrative: no-adjustment / constrained / net-relief branches with fact basis |

### 7.4 Fact basis (verified via research brief t_395ea2fa / fact sheet t_6abde9f4)

- Gartner **FORECASTS**: datacenter power +26% YoY to 565 TWh 2026, passing
  1,200 TWh by 2030 where grid supply may be insufficient — the power-constrained
  driver. Labeled as forecast everywhere.
- Locked capacity: up to 5GW AWS Trainium (Anthropic >$100B/10yr commitment,
  Amazon $5B now + up to $20B) + ~3.5GW Google TPU via Broadcom from 2027.
- Theseus Infrastructure (Anthropic + Macquarie AM + GIC, announced Aug 10,
  2026): Macquarie/GIC own the platform and fund the majority of each project's
  equity; Anthropic anchor tenant under long-term leases. **No capital
  commitment, capacity, site count, or lease terms disclosed — the module says
  so.**
- The 100% grid-upgrade pledge is an **Anthropic commitment** (its own newsroom
  page), not the venture's — module says so.
- Amodei's $10–15B/GW buildout math and "hundreds of billions, not trillions"
  = his framing on the Dwarkesh podcast, not a published cost schedule.
- The 8%/12% pass-through and 0%/5% relief presets are **directional estimates**
  for stress-testing, not published prices.

### 7.5 Edge cases

1. `tokens <= 0` or `basePerM <= 0` → alert, no calculation.
2. Zero adjustment (both 0): constrained == baseline, delta 0.0%, narrative
   says "No supply adjustment".
3. Relief exceeds pass-through: net-negative delta, narrative "Net relief"
   branch.
4. Large volumes: `fmt()` compact (≥ 10K → `$30K`).

### 7.6 Analytics

`compute_supply_estimated` on every estimate click (payload: horizon,
grid_pass, relief, tokens_m).

## 9. Model Switching Cost / Cost-of-Keeping-Up Estimator (NEW 2026-09-07)

**Location:** `~/seo-pages/idle-sites/ai-agency-pricing-calculator/model-selection-muse-spark.html`
(companion module on the model-selection page, `#cost-of-keeping-up` section;
kanban t_6a685c3e, evidence brief t_6fb0e633). This estimator prices the
re-decision cost of chasing model releases (Sep 1–3, 2026 week: Fable/Mythos
5.1, Muse Spark 1.3, Gemini 3.8 Flash, GPT-6 Astra) so buyers can compare an
upgrade cadence before migrating. Companion narrative lives at
/blog/ai-model-fatigue-switching-costs/.

### 9.1 Purpose

Answer "should my business upgrade to the newest AI model?" with math: the
per-migration cost does not shrink when release cadence speeds up, so switching
every release is not a sound strategy. Outputs compare 1×/2×/4×/12× migrations
per year at the same per-migration operating cost.

### 9.2 Inputs (all client-side, live on `input`)

| Field ID | Label | Type | Default | Constraint |
|----------|-------|------|---------|------------|
| `scCadence` | Upgrade cadence (migrations per year) | select | `4` | 1 \| 2 \| 4 \| 12 |
| `scEvalHours` | Evaluation cycle time (person-hours per candidate set) | number | `80` | ≥ 0, step 4 |
| `scMigrationHours` | Migration effort (person-hours per migration) | number | `40` | ≥ 0, step 4 |
| `scLaborRate` | Loaded labor rate ($ per person-hour) | number | `85` | ≥ 0, step 5 |
| `scRegressionRisk` | Prompt-regression risk (chance ≥1 workflow degrades) | range | `25` | 0–100%, step 5 |
| `scRegressionHours` | Regression remediation (person-hours if it happens) | number | `16` | ≥ 0, step 2 |
| `scLicenseDelta` | Licensing / commitment delta ($ per year; negative = savings) | number | `0` | −1,000,000–1,000,000, step 500 |
| `scStabilizeWeeks` | Support / stabilization delay (weeks) | number | `2` | 0–52, step 0.5 |
| `scStabilizeCost` | Stabilization cost ($ per week) | number | `1500` | ≥ 0, step 100 |
| `scDowntimeHours` | Estimated business downtime (hours per migration) | number | `4` | ≥ 0, step 1 |
| `scRevenuePerHour` | Revenue at risk ($ per downtime hour) | number | `1000` | ≥ 0, step 100 |

### 9.3 Model

```
evalLab    = (evalHours + migrationHours) × laborRate
regExp     = regressionRisk% × regressionHours × laborRate     (risk-weighted)
stab       = stabilizationWeeks × stabilizationCostPerWeek
downtime   = downtimeHours × revenuePerHour
perMig     = evalLab + regExp + stab + downtime                (per-migration operating cost)

annualCost(n) = n × perMig + licenseDelta                      (license applies once per year)
```

### 9.4 Outputs

| Result ID | Meaning |
|-----------|---------|
| `rEvalLab` | Evaluation + migration labor per migration |
| `rRegExp` | Expected prompt-regression remediation (risk-weighted) |
| `rStab` | Support / stabilization per migration |
| `rDowntime` | Business downtime opportunity cost per migration |
| `rLicense` | Licensing / commitment delta (annual) |
| `rAnnual` | Annual switching cost at selected cadence |
| `rPerUpgrade` | Annual ÷ cadence (all-in per migration, license amortized) |
| `lad1`/`lad2`/`lad4`/`lad12` | Annual switching cost at 1×/2×/4×/12× cadence (ladder) |
| `lrow1`…`lrow12` | Ladder rows; selected cadence row gets `.sel` highlight |
| `scVerdict` | Plain-language comparison of the selected cadence vs 1× and 12× |

Defaults reproduce: $10,540 labor (80h + 40h + 25%×16h @ $85) + $3,000
stabilization (2wk × $1,500) + $4,000 downtime (4h × $1,000) = **$17,540 per
migration** → **$70,160/yr at 4×**, $17,540/yr at 1×, $210,480/yr at 12×.
Verified by executing the real inline script under a node DOM stub (default,
12×, 1×, license +$6,000, and zero-risk scenarios all match the formulas).

### 9.5 Edge cases

1. Any negative numeric input except `scLicenseDelta` clamps to 0.
2. `scLicenseDelta` may be negative (savings); annual figure can go negative
   only if license savings exceed operating cost.
3. Cadence forced to ≥ 1; non-numeric input treated as 0.
4. Currency formatting rounds to whole dollars (`usd()`); values display with
   `$`/`,` and a leading `-` for negatives.
5. Regression slider shows live `%` via `scRegressionRiskVal`.

## 10. GPT-Live-1 voice + backend two-meter calculator (NEW 2026-09-10)

**Location:** `~/seo-pages/idle-sites/ai-agency-pricing-calculator/gpt-live-1-cost-calculator.html`
— standalone page (single file, inline JS, no backend), kanban **t_5e4b91ac**,
fact basis the verified source pack from t_1c163248 (`gpt-live-1-billing-facts.md`,
attached to that task). The canonical model is a marked block inside the page's
inline script and is also shipped as two deployable assets:
`gpt-live-1-cost-model.js` (same code as a CommonJS/browser module) and
`gpt-live-1-cost-model.json` (default parameter set + results + provenance).

Purpose: price the **full** GPT-Live-1 bill — voice duration *plus* delegated
backend reasoning — and size the concurrent sessions a call volume actually
needs. Existing third-party coverage of the release stops at $0.05/min, which is
only the voice half.

### 10.1 Interfaces (exact names are the contract)

```
billedVoiceSeconds(sessionSeconds, transport, initSeconds = 15)
    -> max(sessionSeconds, 15) when transport === 'webrtc'
    -> sessionSeconds          otherwise (no init charge documented for WebSocket)
voiceCostUsd(sessionSeconds, transport, ratePerSecond = 0.05 / 60)
computeModel(params) -> results
exportModel(params)  -> machine-readable payload (also rendered in #rExportJSON)
```

### 10.2 Inputs (all client-side, live on `input` / `change`)

| Field ID | Label | Type | Default | Constraint |
|----------|-------|------|---------|------------|
| `trWebrtc` / `trWs` (name `transport`) | Transport | radio | `webrtc` | webrtc \| websocket |
| `callsPerDay` | Calls per day | number | `1000` | ≥ 0, step 10 |
| `callMm` / `callSs` | Average call length mm:ss | number | `4` / `0` | mm ≥ 0, ss 0–59 |
| `operatingHoursPerDay` | Operating hours per day | number | `8` | 0.5–24, step 0.5 |
| `peakFactor` | Peak factor (busy hour) | number | `1` | 1–10, step 0.1 |
| `backendModel` | Backend model | select | `gpt-5.6-terra` | terra \| luna \| astra \| sol \| cyber \| custom |
| `inRate` / `cachedRate` / `outRate` | Backend token rates ($/1M) | number | from `backendModel` | ≥ 0 |
| `cachedSharePct` | Share of input tokens cached | number | `0` | 0–100 |
| `longContext` | Use long-context rate column | checkbox | off | boolean |
| `dataResidency` | Data-residency +10% uplift | checkbox | off | boolean |
| `turnsPerCall` | Reasoning turns per call | number | `6` | ≥ 0 |
| `inTokensPerTurn` / `outTokensPerTurn` | Tokens per turn | number | `1500` / `300` | ≥ 0 |
| `toolSharePct` | Share of turns triggering tool/search | range | `35` | 0–100, step 5 |
| `toolCostPerInvocation` | $ per tool/search invocation | number | `0.00` | ≥ 0 |
| `toolExtraInTokens` | Extra input tokens per tool turn | number | `0` | ≥ 0 |
| `idleSharePct` | Share of call that is billed silence/backend work | number | `30` | 0–100 |
| `tier` | Tier for the concurrency check | select | `auto` | auto \| 1–5 \| free |
| `monthDays` | Month definition | select | `30` | 30 \| 31 \| 30.4167 |
| `realtimeAudioInPerMin` / `OutPerMin` | Realtime comparison token rates | number | `600` / `600` | ≥ 0 |

A rate field is treated as an override only when it differs from the selected
model's published rate, so switching `backendModel` moves the backend line by
default while an edited rate still wins. Presets: `default`, `luna`, `astra`,
`blowout`, `shortcall` (buttons carry `data-preset`).

#### 10.2.1 Shareable `#p=` deep links (contract)

`#btnCopyLink` puts `#p=<base64url(JSON of readParams())>` on the page URL. The
hash always carries `backendModel` but writes a rate as `null` whenever the rate
input equals that model's published rate (a rate becomes a number only when the
reader edited it). Restoring therefore re-seeds the three rate inputs from the
restored model: `init()` calls `fillRatesFromModel()` after `writeParams(restored)`
and only then applies a non-null `inRate` / `cachedRate` / `outRate` from the hash.
A link is equivalent to the page that produced it — what "Copy shareable link"
saves after selecting a backend or clicking a preset reopens on the same model,
the same rates and the same totals. (Fixed 2026-09-10, t_d76a69db: previously
`writeParams()` never touched the rate inputs, so an Astra/Luna link reopened with
the rates the HTML shipped — Terra's — and `rateOverride()` read that mismatch as
a user override, pricing the call at Terra's rates.)

### 10.3 Model

```
billed_voice_seconds = max(session_seconds, 15) if webrtc else session_seconds
voice_cost           = billed_voice_seconds / 60 * 0.05
per_turn_model_cost  = (uncached_in * in_rate + cached_in * cached_rate + out_tokens * out_rate) / 1e6
backend_model_cost   = turns * per_turn_model_cost + (turns * tool_share) * extra_tool_tokens * in_rate / 1e6
backend_tool_cost    = (turns * tool_share) * tool_cost_per_invocation
backend_cost         = backend_model_cost + backend_tool_cost
total_cost           = voice_cost + backend_cost
calls_per_hour       = calls_per_day / operating_hours
avg_concurrent       = calls_per_hour * session_seconds / 3600
required_concurrent  = avg_concurrent * peak_factor        # Little's Law, peak-scaled
tier                 = smallest tier with ceiling >= required_concurrent (auto)
capacity_limited_before_budget_limited = required_concurrent > tier_ceiling
```

Published constants (all OpenAI, `$ per 1M tokens`, Standard, short/long context
columns): Terra 2.00/0.20/12.00 (long 4.00/0.40/18.00); Luna 0.20/0.02/1.20 (long
0.40/0.04/1.80); Astra 10.00/1.00/50.00 (long 20.00/2.00/75.00); Sol
4.00/0.40/20.00 (long 8.00/0.80/30.00); Cyber 12.50/1.25/75.00 (no long column);
data-residency uplift ×1.10; tier ceilings 25/50/200/300/500 with Free not
supported; Realtime comparison `gpt-realtime-2.1` audio rows $32/$64 per 1M.
Everything else in the model (volumes, token shapes, cache share, tool share,
idle share, peak factor, month length, Realtime tokens/min) is a labelled
assumption and is editable.

### 10.4 Outputs

Voice: `rSessionDur`, `rBilledSeconds`, `rInitNote`, `rVoicePerCall`,
`rIdlePerCall`, `rVoiceDay`, `rVoiceMonth`, `rVoiceMonthAlt`. Backend:
`rBackendModelPerCall`, `rBackendToolPerCall`, `rBackendPerCall`,
`rBackendShare`, `rBackendDay`, `rBackendMonth`, `rBackendPerVoiceMin`. Totals:
`rTotalPerCall`, `rTotalPerCallBig`, `rTotalDay`, `rTotalMonth`,
`rTotalMonthAlt`, `rVoiceShare`. Capacity: `rCallsPerHour`, `rAvgConcurrent`,
`rReqConcurrent`, `rConcDerivation`, `rTierChecked`, `rHeadroom`, `rTierVerdict`,
`rTierQual`, `rTier1Util`…`rTier5Util` / `rTier1Fit`…`rTier5Fit`. Realtime:
`rRtPerMin`, `rRtPerCall`, `rRtBreakEven`, `rRtVerdict`. Quick reference:
`rRef240`, `rRef90`, `rRef40`, `rRef5w`, `rRef5s`. Export: `rExportJSON`,
plus `#btnCopyLink` (shareable `#p=<base64url params>` URL) and `#btnDownload`.

Defaults reproduce: voice $0.2000/call → **$200.00/day → $6,000.00/month
(30-day)**; Terra backend 6 × (1,500/300) = $0.0396/call → $39.60/day; total
$0.2396/call → $239.60/day → $7,188.00/month; concurrency 8.33 average / 20.83
at a 2.5× peak → Tier 1 (25) fits. Astra backend on the same shape = $0.1800/call
(47.4% of the two-meter total). 0:40 call = $0.0333 (3.33¢). 0:05 WebRTC call =
the 15 s floor = $0.0125; 0:05 WebSocket call = $0.0042. Realtime audio rows at
600/600 tokens per minute = $0.0576/min; flat-rate break-even = 1,041.67 audio
tokens/min at a 1:1 in:out mix.

### 10.5 Verified

`node tests/gpt-live-1-verify.mjs gpt-live-1-cost-calculator.html` — **176/176**.
The harness does not re-implement anything: it extracts the page's real inline
script, runs it in a `node:vm` sandbox with a DOM stub built from the page's own
markup (so the defaults under test are the page's defaults), and asserts (a) the
facts-sheet checkpoints `billed(90,'webrtc')==90`, `billed(5,'webrtc')==15`,
`billed(240,'webrtc')==240`, `cost(40,'webrtc')==0.0333333`,
`cost(240,'webrtc')==0.2`, `cost(90,'webrtc')==0.075`; (b) every acceptance
figure above; (c) the rendered text of the real output elements; (d) the export
round-trips to identical results; (e) each preset visibly moves the totals;
(f) every output id the script writes exists in the shipped HTML; (g) the
shareable `#p=` deep-link round-trip — for each of the `default`, `luna`, `astra`,
`blowout`, `shortcall` scenarios and an Astra link with an edited input rate, the
link produced by `shareableUrl()` reopens (fresh DOM reset, hash applied, `init()`
re-run) on the identical model, rates, rate-source labels, rendered totals, share
and export payload as the page that produced it, with the published rate and the
reader's edited rate asserted by name. Section (g) fails on the pre-fix page
(Astra reopens at $0.0396 instead of $0.1800, blowout at $0.2552 / 56.1% instead
of $0.8760 / 81.4%), so it is a real regression guard. Add `--emit
<path>` to regenerate `gpt-live-1-cost-model.js` from the page (single source of
truth). `site_consistency.py` on the page: **0 errors, 0 warnings**. Headless
Chrome render check: see §10.7.

### 10.6 Honesty constraints carried from the fact sheet

1. The 15 s init floor is **WebRTC-scoped**; the WebSocket path has no
   documented init charge, so transport is a toggle, not an assumption.
2. Billable time ≠ talk time (silence and backend work are billed; muting does
   not close the session) — exposed as `idleSharePct`, not hidden.
3. Backend rates must travel with the backend model: switching the selector is
   what changes the bill.
4. Every monthly row prints its month convention; OpenAI defines no month.
5. The Realtime comparison is a **floor** (audio rows only; text and image rows
   exist) and its tokens-per-minute rates are ours — which is why a break-even
   token rate is printed next to the cost.
6. `session.usage.updated` replaces a cumulative snapshot; record final
   `usage.seconds` from `session.closed` once. Documented in the page's
   "How the two meters work" section.
7. No benchmark figure is presented as independently reproduced, and custom
   voices (sales-gated, no published rate) are deliberately not modelled.

### 10.7 Deploy

```bash
~/seo-pages/tools/deploy-idle-site.sh ai-agency-pricing-calculator \
  --files=gpt-live-1-cost-calculator.html \
  --files=gpt-live-1-cost-model.js,gpt-live-1-cost-model.json --verify-live
```

Live: `https://aiagencycalculator.com/gpt-live-1-cost-calculator` (plus
`/gpt-live-1-cost-model.json` for the machine-readable export). The page is the
calculator companion to the GPT-Live-1 pricing angle page published by
t_000de443; it is internal-linked from `/ai-agent-api-cost-calculator`,
`/ai-model-cost-per-task-2026`, `/astra-model-cost-outlook` and
`/ai-agent-cost-blowups` **once those pages are re-deployed with the links** —
until then the links are one-directional (this page → those pages).

## 11. AI Inference as a Margin Line Estimator (NEW 2026-09-10)

**Location:** `index.html`, section `#inference-margin-estimator`, immediately after
the main rate-table section (function `calculateInferenceMargin()`).

Purpose: express AI inference as a **share of gross margin consumed** instead of a
tool-cost line, so the reader sees what inference does to the margin they keep.
Reference case: @levelsio (Pieter Levels), Sept 9, 2026 15:21:24 UTC — self-reported
margin of 99.4% without AI inference and 93% with it (mostly Photo AI), i.e. a
6.4-point gross-margin cost.

### 11.1 Inputs

| Field ID | Label | Type | Default | Constraint |
|----------|-------|------|---------|------------|
| `infPreset` | Reference Case | select | `levelsio` (preloaded) \| `custom` | — |
| `infRevenue` | Monthly Revenue ($) | number | `100000` | 1–100,000,000, step 1000 |
| `infCogs` | Monthly Cost of Goods EXCLUDING AI Inference ($) | number | `600` | 0–100,000,000, step 100 |
| `infSpend` | Monthly AI Inference Spend ($) | number | `6400` | 0–100,000,000, step 100 |

The reference case is entered **per $100,000 of monthly revenue**: the operator never
disclosed revenue and the 6.4-point drop is a ratio, so any revenue base reproduces
99.4% → 93.0% exactly. Editing any input flips the select to `custom`
(`markInferenceCustom()`); re-selecting the preset restores the reference values and
recomputes.

### 11.2 Model

```
cogsTotal      = cogs + spend                      // COGS with inference
gmDollars      = revenue - cogs                    // gross margin before inference
gmBefore       = gmDollars / revenue * 100         // 99.4% on the reference case
gmAfter        = (revenue - cogsTotal) / revenue * 100   // 93.0% on the reference case
deltaPts       = gmBefore - gmAfter                // 6.4 points (the margin cost)
pctOfGrossMargin = spend / gmDollars * 100         // 6.44% -> "6.4%" (null if gmDollars <= 0)
pctOfRevenue   = spend / revenue * 100             // 6.4%
cogsShare      = spend / cogsTotal * 100           // 91.4% (null if cogsTotal == 0)
multiple       = cogs > 0 ? spend / cogs : null    // 10.7x
```

There is **no** dependency on `calculatePricing()` or any other estimator in the file:
the factor is additive, and every existing input/output pair is untouched.

### 11.3 Outputs

| Result ID | Meaning | Reference case |
|-----------|---------|----------------|
| `im-margin-before` | Gross margin without inference | `99.4%` |
| `im-margin-after` | Gross margin with inference | `93.0%` |
| `im-delta` | Margin cost of inference (points, 1 dp) | `6.4 pts` |
| `im-pct-gm` | Inference as % of gross margin consumed | `6.4%` |
| `im-pct-rev` | Inference as % of revenue | `6.4%` |
| `im-cogs-share` | Inference share of all COGS | `91.4%` |
| `im-note` | Step-by-step arithmetic for the current inputs | — |

All money sub-lines use `imMoney()` (negative-safe). The section's intro, the result
cards and the note are **shipped pre-rendered** with the reference numbers, so a client
that does not execute JavaScript still reads 99.4% → 93.0%; `DOMContentLoaded` calls
`calculateInferenceMargin(true)` (silent = no alert, no scroll) to keep the DOM and the
maths in sync, and the button/`onchange` handlers recompute visibly.

### 11.4 Verified

- `node tests/inference-margin-verify.mjs index.html` → **46/46** (reference case
  99.4% → 93.0% / 6.4 pts / 6.4% consumed / 91.4% COGS; static no-JS values;
  scale-invariance at a $212,000/mo revenue proxy; zero-inference; 60% COGS with
  non-inference COGS; zero COGS; inference overrunning the margin; invalid/negative
  guards).
- `node ~/.hermes/scripts/calc-regression-harness.mjs verify index.html
  tests/calc-regression-baseline-t_9b19d6a2.json` → **10/10** against a baseline
  captured from the pre-change file.
- `python3 ~/.hermes/scripts/site_consistency.py index.html` → 0 errors / 0 warnings
  (FAQ visible 43 == FAQPage mainEntity 43; one `<h1>`; both JSON-LD blocks parse).

### 11.5 Deploy

```bash
~/seo-pages/tools/deploy-idle-site.sh ai-agency-pricing-calculator \
  --files=index.html --verify-live
```

## 12. Token Waste / Context Governance factor (NEW 2026-09-11)

Section id `#token-governance-estimator` on `index.html`, immediately after
`#inference-margin-estimator`. Model file: `token-governance-model.js` (UMD, loaded by
`<script src="/token-governance-model.js">`; exposes `window.TokenGovernance`).
Spec: `SPEC-token-waste-context-governance-factor.md` (kanban t_8813edb2);
shipped by kanban t_1cb93770 with the page `/why-ai-bills-rise-when-prices-fall/`.

**One-line purpose:** price the bill, not the token — given a fixed business workload,
compute the monthly token bill after context re-reads and wasted tokens, and show that the
unit price fell 20-33% while the bill rose anyway.

### Inputs (12)

| id | meaning | default | range |
|---|---|---|---|
| `twTasks` | agent tasks completed per month | 10000 | 1 - 10,000,000 |
| `twContext` | context tokens per model call | 150000 | 1 - 2,000,000 |
| `twOutput` | output tokens per call | 8000 | 1 - 500,000 |
| `twCalls` | calls per task (context re-read multiplier) | 3.0 | 1 - 20, step 0.1 |
| `twWaste` | wasted-token rate, % of paid tokens with no accepted output | 25 | 0 - 60 |
| `twPrune` | context pruning / compaction on | off | — |
| `twSurcharge` | apply the >272K long-context pricing | on | — |
| `twInPrice` / `twOutPrice` | $ per 1M (promo sheet) | 4.00 / 20.00 | 0 - 100 / 0 - 200 |
| `twCacheShare` | share of re-reads served from cache | 0 | 0 - 95 |
| `twAgents` | agents running the workload | 5 | 1 - 1,000 |
| `twCap` | monthly spend cap per agent ($, 0 = uncapped) | 1000 | 0 - 1,000,000 |

Constants (not UI inputs): `longThreshold = 272000`, surcharge 2x input / 1.5x output,
cached input 10% of input, cache write 1.25x, prior (pre-cut / post-promo) sheet $5.00/$30.00,
`promoEndsOn = 2026-11-21`.

### Formula

```
growth           = prune ? 1 : (calls + 1) / 2
per-call input   = context * growth
cliff active     = applySurcharge && per-call input > 272000     -> 2x in / 1.5x out for the FULL request
billed input     = tasks * context * growth * calls / (1 - waste)
billed output    = tasks * output * calls / (1 - waste)
monthly cost     = billed in * effective in rate / 1e6 + billed out * effective out rate / 1e6
```

`waste` is the share of **paid** tokens, so the overhead multiplier is `1 / (1 - W)` — at
25% waste you pay **1.33x**, not 1.25x. Do not flip this convention without changing the label.

### Outputs (17)

`monthlyCost`, `costPerTask`, `floorCostBase` (per-token estimate), `floorCostTriggered`,
`governancePremium`, `governanceMultiple`, `reReadCost`, `wasteCost`, `surchargeCost`,
`monthlyCostNoSurcharge`, `billedInputTokens` / `billedOutputTokens`, `reReadInputTokens`,
`wasteTokensTotal`, `sensitivityPerPct`, `marginalCallCost`, `promoDelta` / `promoDeltaPct`,
`breachDay`, plus the day-1.4/15.8 budget-breach inputs. DOM ids: `tw-cost`, `tw-cost-sub`,
`tw-floor`, `tw-floor-sub`, `tw-premium`, `tw-reread`, `tw-waste`, `tw-surcharge`,
`tw-in-tokens`, `tw-out-tokens`, `tw-multiplier`, `tw-sensitivity`, `tw-promo`, `tw-breach`,
`tw-prior`, `tw-price-effect`, `tw-volume-effect`, `tw-net-change`, `tw-note`.

### API surface

| surface | contract |
|---|---|
| `TokenGovernance.compute(inputs)` | pure; returns the 17 outputs; call `validate` first |
| `TokenGovernance.compare(baselineInputs, actualInputs)` | `{priceEffect, volumeEffect, totalChange, check}` with `check === 0` |
| `TokenGovernance.PRESETS.governed` / `.ungoverned` | 1.2 calls / 5% / prune, and 3 calls / 25% / no prune |
| `TokenGovernance.MODEL` | the verified rate table incl. `promoEndsOn` |
| `?tw=governed` / `?tw=ungoverned` | applies a preset on load (deep-linkable from the article) |
| `window.__twLastResult` | last computed result object (read by tests) |

Umami event `token_governance_estimated` fires on the non-silent path only. Never `alert()`
on first paint: `calculateTokenGovernance(true)` runs silent on `DOMContentLoaded`.

### Tests

`node tests/token-governance-verify.mjs` → **123 assertions, exit 0** (the three
decompositions sum exactly: `floorCostTriggered + reReadCost + wasteCost = monthlyCost`,
`minimum + re-read + waste tokens = billed tokens`, `priceEffect + volumeEffect = totalChange`).
Local headless check: defaults render `$105,600.00` ungoverned and `$9,600.00` governed, no
overflow at 320/360/390/414 px.

## 13. Claude Code Weekly-Limit Cost Impact Estimator — index basis (NEW 2026-08-30, rebased 2026-09-14)

**Location:** `index.html` § `#claude-code-limits-estimator` (kanban t_8f20add6, then
t_e03f5d47). **Basis:** Anthropic Help Center article 15910845 (update stamp
`2026-09-14T06:59:42Z`) via the verified fact pack, research brief t_19294d02.

**Why the rebase:** the estimator shipped on 2026-08-30 with the promotion still
running, so its inputs read as a future-tense event and its usage input was
expressed as a percentage of *today's boosted cap*. The promotion ended
**2026-09-13 23:59 PT** and the permanent level took effect **2026-09-14**, so
"today's boosted cap" no longer existed and no input may be planned against it.

**The index — the only sourced formulation.** No Anthropic surface publishes a
per-plan weekly hour or message count, so every figure is a ratio:

```
pre-promotion baseline   100   (before May 13, 2026)
promotion allowance      150   (May 13 - Sept 13, 2026, 11:59 PM PT - ENDED)
permanent allowance      125   (from Sept 14, 2026 - in force today)
```

`125/100 = +25.0000%` (the vendor's own headline) · `125/150 = 0.833333 -> -16.6667%`
(the vendor's own rounded "17%") · `150/125 = 1.2` (+20% headroom to re-hold the
promotion-era capacity) · returning 125 -> 150 would need **+20%**, not +25%.

### 13.1 Inputs

| Field ID | Label | Type | Default | Constraint |
|----------|-------|------|---------|------------|
| `ccPlan` | Plan | select | `pro` | Pro / Max / Team / Seat-based Enterprise |
| `ccBasis` | Weekly allowance you are measuring against | select | **`permanent` (index 125)** | `permanent` 125 (in force since Sept 14, 2026) · `promo` 150 (May 13 – Sept 13, 2026, ended 11:59 PM PT) · `baseline` 100 (before May 13, 2026) |
| `ccUsageToday` | Your weekly Claude Code usage (% of the selected index basis) | number | `100` | 1–200, step 1 |
| `ccSeatPrice` | Seat price ($/month) | number | `100` | 1–10,000, step 1 |
| `ccSeats` | Number of seats | number | `5` | 1–500, step 1 |

Constants (JS): `const CC_INDEX = { baseline: 100, promo: 150, permanent: 125 }`,
`const CC_BASIS_LABEL = {...}`, `const RATIO = 125 / 150`, `const MULT = 150 / 125`.

### 13.2 Model

```
usageIdx          = CC_INDEX[basis] x usagePct / 100   // the workload in index units
usageOnPermanent  = usageIdx / 125 x 100               // same workload, % of the permanent index
headroom          = 100 - usageOnPermanent             // pp of the 125 index (negative = over)
eqCost            = seats x seatPrice x MULT           // seat line to hold promotion-era capacity
costDelta         = eqCost - seats x seatPrice         // +20%
```

Outputs: `cc-newcap` (125/150 = 83.3%), `cc-usage-new` (workload on the 125 index),
`cc-capacity-cut` (headroom, or `N% over`), `cc-eq-cost` (seat line x 1.2), `cc-note`.
Umami event `claude_code_limits_estimated` fires on submit with
`{plan, basis, usage_pct, seats, seat_price}` (the `basis` key replaced `usage_today`).

**Worked cases** (seats 5, seat price $100/mo):

| Basis | Usage | On the 125 index | Headroom | Cost to hold promo capacity |
|-------|-------|------------------|----------|------------------------------|
| `permanent` 125 | 100% | 100% | 0% (exactly at the cap) | $600/mo (+$100) |
| `promo` 150 | 60% | **72%** | 28% | $600/mo (+$100) |
| `promo` 150 | 100% | **120%** | 20% over | $600/mo (+$100) |
| `baseline` 100 | 100% | 80% | 20% | $600/mo (+$100) |

### 13.3 Tests

- `node tests/claude-code-limits-verify.mjs` -> **59 assertions, exit 0**. Extracts the
  shipped `calculateClaudeCodeLimits()` source out of `index.html` and runs it against a
  mock DOM, so the assertions are made against the bytes that ship. Covers all four
  table rows above, the four ratio constants, the retired strings (`today's boosted`,
  `% of today's cap`, `Front-load spike work before Sept 13`), the three bases, the
  default `selected` option, id uniqueness and the Umami payload.
- `python3 tests/claude-code-limits-browser-verify.py [url]` -> **50 assertions, exit 0**
  at 1280x900 and 390x844 in Chromium: default basis, option labels, both worked cases,
  no promo-current language in the rendered section, no horizontal overflow, no uncaught
  JS errors.

## 14. Parallel Agent Compute Cost Estimator (NEW 2026-09-15)

**Location:** `index.html` § `#parallel-agent-compute` (kanban t_5de39b46).
**Fact basis:** research brief t_6687dbf2 / `DOSSIER-cursor-projects-agency-pattern.md`
(24 sources, 51/51 verbatim quotes, gate exit 0). Primary vendor sources: `cursor.com/blog/projects`,
`cursor.com/changelog/projects` (both Sept 10, 2026), `cursor.com/docs/account/pricing` (fetched 2026-09-15).

**Why two lines.** Cursor Projects (beta, Sept 10, 2026) puts a coordinator agent over parallel
subagents that "run as many in parallel as the work needs" on the Project's own cloud computer.
The vendor bills that agent layer as **API-priced tokens for the selected model, with a required
spend limit** (over-limit usage on-demand at the same rates). It publishes **no Projects price, no
compute-minute metric and no credits currency** on the Cursor side — so the honest field is not
"compute minutes", it is **concurrent cloud agents x token spend**, with the rate user-editable and
defaulted to a labelled placeholder. The seat layer is the published one and is shown separately.
There is **no published concurrent-agent ceiling**: do not publish a concurrency cap.

### 14.1 Inputs

| Field ID | Label | Type | Default | Constraint |
|----------|-------|------|---------|------------|
| `paSeats` | Coding-agent seats (licences) | number | `5` | 0–500, step 1 |
| `paSeatPrice` | Seat licence price ($ per seat / month) | number | `40` | 0–1000, step 1 |
| `paAgents` | Concurrent cloud agents (parallel subagents) | number | `4` | 0–500, step 1 |
| `paComputePerAgent` | Token spend per active agent ($ / agent / month) — **PLACEHOLDER** | number | `60` | 0–5000, step 5 |

Published anchors carried in the copy: **Cursor Teams Standard $40/user/mo, Teams Premium
$120/user/mo (5x Agent limits)**; individual plans Pro $20 / Pro+ $60 / Ultra $200. The
placeholder default sits at the low end of Cursor's published **individual-plan** usage guidance
($60–$100/mo for daily agent users; $200+/mo for multiple agents or automation), presented as
plan guidance, never as a vendor compute rate.

### 14.2 Model

```
seatLine     = seats x seatPrice            // published per-seat licence line
computeLine  = agents x perAgent            // parallel agent compute (API-priced tokens)
total        = seatLine + computeLine       // seat + compute, kept separate
computeShare = total > 0 ? computeLine / total x 100 : 0
perSeat      = seats > 0 ? total / seats : 0
seatMultiple = (seats > 0 && seatPrice > 0 && computeLine > 0) ? perSeat / seatPrice : 1
```

### 14.3 Outputs

| Field ID | Label | Notes |
|----------|-------|-------|
| `pa-seat-line` / `pa-seat-line-sub` | Per-seat licence line | `seats x seatPrice`, sub names the published line |
| `pa-compute-line` / `pa-compute-line-sub` | Parallel agent compute | **card `pa-compute-card` is `display:none` while `computeLine === 0`**; sub flags the rate as the user's input |
| `pa-total` / `pa-total-sub` | Total monthly (seat + compute) | sub shows `$seat licence + $compute` — at zero compute it reads `(seat-only total — unchanged from the licence line)` |
| `pa-compute-share` / `pa-compute-share-sub` | Compute share of the bill | 1 dp % |
| `pa-per-seat` / `pa-per-seat-sub` | Effective cost per seat | `n/a` when `seats === 0`; sub shows `N.NNx the $P/seat sticker price` |
| `pa-note` | How to read this | four branches: nothing modelled / seat-only / compute-only / both lines |

**Invariants (asserted in `tests/parallel-agent-compute-verify.mjs`):** zero-valued inputs
reproduce the seat-only total exactly and hide the compute card; the compute line appears only
when `agents x perAgent > 0`; no `NaN`/`Infinity` at any input combination.

### 14.4 Worked examples (shipped function, mock DOM)

| # | Seats x $/seat | Agents x $/agent | Seat line | Compute line | Total | Compute share | Effective $/seat |
|---|----------------|------------------|-----------|--------------|-------|---------------|------------------|
| A (defaults) | 5 x $40 | 4 x $60 | $200.00/mo | $240.00/mo | **$440.00/mo** | 54.5% | $88.00 (2.20x) |
| Z | 0 x $0 | 0 x $0 | $0.00/mo | hidden ($0.00) | $0.00/mo | 0.0% | n/a |
| S | 10 x $120 | 0 x $500 | $1,200.00/mo | hidden | $1,200.00/mo | 0.0% | $120.00 (1.00x) |
| D | 3 x $40 | 20 x $200 | $120.00/mo | $4,000.00/mo | $4,120.00/mo | 97.1% | $1,373.33 (34.33x) |
| O | 2 x $40 | 1 x $60 | $80.00/mo | $60.00/mo | $140.00/mo | 42.9% | $70.00 (1.75x) |
| C | 0 x $0 | 6 x $100 | $0.00/mo | $600.00/mo | $600.00/mo | 100.0% | n/a |

### 14.5 Analytics

Umami event `parallel_agents_estimated` with `{seats, seat_price, agents, per_agent}`.

### 14.6 Tests

- `node tests/parallel-agent-compute-verify.mjs` -> **86 assertions, exit 0**. Extracts the shipped
  `calculateParallelAgents()` source out of `index.html` and runs it against a mock DOM (so the
  assertions are made against the bytes that ship), covering the six rows above, a zero-input
  invariance sweep (six seat configs), the singular/plural copy paths, the hidden-card rule, the
  Umami payload and the honesty guards (the copy must not state an unpublished rate as a price).
- `python3 tests/parallel-agent-compute-browser-verify.py <url>` -> **116 assertions, exit 0** in
  Chromium at 1280x900 / 390x844 / 320x800 / 414x896: the input defaults, the worked cases in a real
  browser, the hidden compute card, no `NaN`/`Infinity`, no horizontal overflow, no uncaught JS errors.

### 14.7 Change control

The changelog entry in §HTML (`#routing-sources` Update log) needed `overflow-wrap:anywhere` on its
own `<p>`: the `tests/parallel-agent-compute-verify.mjs` token is unbreakable and pushed 30px of
horizontal overflow at a 320px viewport (measured before/after: 30px -> 0px).

## Changelog

- **2026-09-15** — **Parallel Agent Compute Cost Estimator added** (kanban t_5de39b46; fact basis
  research brief t_6687dbf2 / `DOSSIER-cursor-projects-agency-pattern.md`, 24 sources, 51/51 verbatim
  quotes). New section `#parallel-agent-compute` + `calculateParallelAgents()` pricing the two lines
  a coding-agent bill has, separately: the published **per-seat licence** (Teams Standard
  $40/user/mo, Teams Premium $120/user/mo) and the **parallel agent compute** the coordinator's
  subagents burn (API-priced tokens for the selected model, required spend limit), entered as
  **concurrent cloud agents x token spend per agent** with the rate **user-editable and defaulted to
  a labelled placeholder** ($60 — the low end of Cursor's published individual-plan band of
  $60–$100/mo for daily agent users). Cursor publishes no Projects price, no compute-minute metric
  and no credits currency, so no vendor compute rate is asserted anywhere in the copy. Outputs: seat
  line, compute line, total (seat + compute), compute share, effective cost per seat. Zero-valued
  inputs reproduce the seat-only total exactly and hide the compute card. Also: FAQ item + FAQPage
  twin (44 -> 45 Q, `faq-parity-sweep.py` 43 MATCH + 2 CITE, 0 drift), WebApplication `featureList`,
  meta keywords (+10 terms), on-page Update-log entry, Umami `parallel_agents_estimated`. Verified:
  `node tests/parallel-agent-compute-verify.mjs` **86/86**, browser harness **116/116** at four
  viewports, `node --check` on the inline script, JSON-LD parse on both blocks, id uniqueness
  (282 ids, 0 duplicates), house `site_consistency.py` **0 errors / 0 warnings** with the sitemap
  cross-check.

- **2026-09-14** — **Claude Code estimator rebased on the permanent 125 index** (kanban
  t_e03f5d47; fact basis research brief t_19294d02, primary = Anthropic Help Center
  article 15910845 with update stamp `2026-09-14T06:59:42Z`). The promotion ended
  Sept 13, 2026 at 11:59 PM PT and the permanent +25%-over-baseline level took effect
  Sept 14, 2026, so no input may be expressed as a percentage of "today's boosted cap"
  any more. Added the `ccBasis` index-basis selector (default **permanent 125**;
  `promo` 150 and `baseline` 100 available for comparison), relabelled `ccUsageToday`
  to **% of the selected index basis**, rewrote the seat-price tooltip, the four result
  cards, the estimator intro/footnote, both FAQ answers (visible + FAQPage) and the
  assumptions footer; the retired advice "front-load spike work before Sept 13" is gone.
  The canonical **100 -> 150 -> 125** math, `125/150 = 0.8333` and `150/125 = 1.2` are
  unchanged and still shown. Dated changelog rows that described the old inputs are
  kept and marked **SUPERSEDED 2026-09-14**. `index_calculator.html`'s
  "is the boost still active" FAQ (answer: *Yes — through August 31, 2026*) was the
  same defect on the second calculator surface: question rephrased, answer rewritten to
  the promotion's end state, assumptions footer rebased. Verified: `node --check` on
  every inline script, JSON-LD parse on all blocks, house `site_consistency.py` **0
  errors / 0 warnings** on both files, `faq-parity-sweep.py` **42 MATCH + 2 CITE**
  (index.html, unchanged class profile) and **20 MATCH** (index_calculator.html, clean),
  `node tests/claude-code-limits-verify.mjs` **59/59**, live-browser harness **50/50**,
  plus the pre-existing `token-governance-verify.mjs` **123/123** and
  `inference-margin-verify.mjs` **46/46** re-run green.

- **2026-09-10** — GPT-Live-1 calculator **shareable `#p=` deep links fixed**
  (task t_d76a69db). A link produced by "Copy shareable link" lost the backend
  rate overrides on restore, so every non-Terra link mispriced the call
  (measured live: Astra reopened at $0.0396 instead of $0.1800; the blowout
  scenario at $0.2552 / 56.1% instead of $0.8760 / 81.4%). `init()` now calls
  `fillRatesFromModel()` after `writeParams(restored)` and applies a non-null
  `inRate` / `cachedRate` / `outRate` from the hash only as a real user override
  (contract in §10.2.1); the page's export note states that the model travels
  with the link. `tests/gpt-live-1-verify.mjs` gained a deep-link section: a
  fresh DOM reset, the hash from `shareableUrl()`, then `init()` re-run for the
  default / Luna / Astra / blowout / shortcall scenarios plus an Astra link with
  an edited input rate, asserting the identical model, rate inputs, rate-source
  labels, rendered totals, backend share and export payload. Harness **176/176**
  (was 106) and the new section fails on the pre-fix page, so it is a real
  regression guard. `site_consistency.py` on the page: 0 errors / 0 warnings.
  Deployed with `--files=gpt-live-1-cost-calculator.html,
  tests/gpt-live-1-verify.mjs,CALCULATOR-API-SPEC.md`.

- **2026-09-10** — AI inference as a **share of gross margin consumed** added as
  an additive estimator on the homepage calculator (`#inference-margin-estimator`,
  section 11 above; task t_9b19d6a2). Inputs: monthly revenue, monthly COGS
  excluding inference, monthly inference spend. Outputs: gross margin without vs
  with inference, the margin cost in points, inference as % of gross margin
  consumed, as % of revenue, and as a share of all COGS. Reference case preloaded
  and selectable — @levelsio, Sept 9 2026 15:21:24 UTC, "Without AI inference my
  profit margin is now 99.4%… With AI inference (mostly Photo AI) it goes down to
  93%!" — entered per $100,000 of monthly revenue because revenue was never
  disclosed and the 6.4-point drop is a scale-free ratio. Uses the verified fact
  pack from t_43f34fc4 (and its C3 correction: no claim that inference exceeds the
  $25,000/mo eliminated SaaS stack). New FAQ + FAQPage schema entry
  ("What percentage of revenue does AI inference cost?" — visible 42→43 = schema
  42→43). Main pricing calculator untouched: regression harness 10/10 against a
  pre-change baseline; new factor harness 46/46; consistency gate clean.

Live verification for section 11 (deployment 6ae0aa38-3da9-4829-9e72-083cfa736c01):
`tests/inference-margin-browser-verify.py` 19/19 (desktop + mobile 390px),
`tests/inference-margin-mobile-audit.py` 7/7 (zero overflow contributed by the new
section; card font sizes identical to the existing estimator), `tests/inference-margin-verify.mjs`
46/46, existing-calculator regression 10/10, consistency gate 0 errors / 0 warnings.

- **2026-09-10** — GPT-Live-1 voice + backend **two-meter** cost calculator added
  (task t_5e4b91ac; fact basis the verified source pack from t_1c163248,
  `gpt-live-1-billing-facts.md`). New standalone page
  `gpt-live-1-cost-calculator.html`: voice cost at $0.05/min billed by the second
  with the WebRTC 15 s init **floor** (`max(d,15)`, transport toggle because the
  init charge is WebRTC-scoped), backend reasoning as a separate editable-rate
  line with tool/search spend and cached-input support, totals per call/day/month
  with the month convention printed on every monthly row (30 / 31 / 365÷12), a
  Little's-Law concurrency planner against the 25/50/200/300/500 concurrent-
  session ceilings with the Free-tier exclusion and a
  "capacity-limited-before-budget-limited" verdict, a GPT-Realtime-2.1 audio
  token-metering comparison with a printed break-even token rate, and a
  machine-readable JSON export (in-page + `gpt-live-1-cost-model.json` +
  `gpt-live-1-cost-model.js`). Verified: `node tests/gpt-live-1-verify.mjs` — 102
  checks (facts-sheet checkpoints, acceptance figures, DOM rendering, export
  round-trip, preset switching, output-id integrity) all pass;
  `site_consistency.py` 0 errors / 0 warnings; headless-Chrome render check.
  Defaults: $0.2000 voice + $0.0396 Terra backend per 4-minute call → $200.00/day
  voice, $239.60/day two-meter, $6,000.00/month voice (30-day), 8.33 concurrent
  (20.83 at 2.5× peak) → Tier 1 fits. Internal links to the four cost pages;
  companion angle page published separately by t_000de443.

- **2026-08-29** — Compute Supply Scenario added (task t_1cecd86a, Theseus
  Infrastructure chain t_a54f7304 → t_6abde9f4 → t_395ea2fa → t_c4c2693f
  APPROVED). New §7 module `#compute-supply-estimator` + `calculateSupply()` /
  `applySupplyHorizon()` on index.html: power-constrained vs baseline per-token
  cost outlooks for 2026–2027 with grid pass-through (ESTIMATE) and locked-in
  capacity relief (ESTIMATE) presets. FAQ + FAQPage JSON-LD entry (parity
  verified), meta keywords extended, WebApplication featureList entry, Print /
  Save PDF button in results. Companion post published at
  /compute-supply-scenario-2026 (Article + FAQPage, 4 Q&A parity, wordCount
  1715, accuracy flags honored). Newsletter copy (Angle 2) saved to
  theseus-newsletter-angle2.md for Brent's manual post. Verified: node --check,
  24/24 mock-DOM math harness, 10/10 estimator regression, JSON-LD parse, no
  duplicate IDs, single H1, internal links resolve. Deployed full dir; live ==
  local byte-identical. Keywords +registered in keywords.json
  (aiagencycalculator.com).
- **2026-08-30** — Claude Code Usage Limit Cost Impact Estimator added
  (task t_8f20add6; fact basis research brief t_6a2f4dd0, 13 sources / 31
  verbatim quotes, Anthropic-confirmed). New section `#claude-code-limits-estimator`
  (`calculateClaudeCodeLimits()`) modeling the Sept 14, 2026 weekly-limit change:
  permanent +25% over baseline replaces the temporary +50% boost → net −16.7%
  (≈ −17%) vs today for Pro/Max/Team/seat-based Enterprise. Inputs: plan
  selector (`ccPlan`), current weekly usage % of today's boosted cap
  (`ccUsageToday`, default 100), seat price $/mo (`ccSeatPrice`, default $100),
  seat count (`ccSeats`, default 5). Math: `new_cap = today_cap × (125/150) =
  0.8333`; `baseline = today_cap / 1.5`; `new_cap = baseline × 1.25`; workload
  at 100% of today's cap = 120% of new cap (150/125 = 1.2); cost to hold
  capacity = seat line × 1.2. Outputs: new cap % of today (`cc-newcap`), usage
  after Sept 14 (`cc-usage-new`), capacity cut (`cc-capacity-cut`), dollar cost
  to hold capacity (`cc-eq-cost`), narrative note (`cc-note`). Umami event
  `claude_code_limits_estimated` fires on submit. Ratio-based only (Anthropic
  does not publish absolute weekly counts). FAQ + FAQPage JSON-LD (28→29 Q on
  homepage) updated; new standalone page
  /claude-code-usage-limit-cost-impact. Verified: node --check + mock-DOM math
  harness (83.3% / 120% / $600 cases) + regression 10/10 + FAQ parity + JSON-LD
  parse.
- **2026-08-29** — Wallet-fee ESTIMATE flag + `capbreach` failScenario preset
  (task t_da2044f8, Cloudflare agent wallets chain t_967d9cb2 / brief t_85e664a9).
  Wallet Fee input now labeled **ESTIMATE** with the UI flag "Cloudflare has not
  published wallet fees; this default is an estimate." (see §2.1). New Scenario
  Preset `capbreach` — "Wallet allowance-cap breach — manual override approvals
  (billable minutes)" — in the Agent Failure & Retry Cost Estimator (§4.1):
  conditional inputs box `#capbreachBox` (Over-Cap Requests/Month, Billable
  Minutes per Override, Billable Rate $/hr), `overrideCost = reqs × (min/60) ×
  rate` added to the total, new "Manual Override Approval" result card shown
  only in capbreach mode. No published fee schedule → estimates, tracked in code
  comments + CHANGELOG for the update-when-fees-ship trigger. FAQ addendum on
  /ai-agent-cost-blowups (3 Q&As, HTML-identical to FAQPage JSON-LD, internal
  link → /cloudflare-wallets, dateModified → 2026-08-29). Verified: node
  harness + JSON-LD parity + no NaN.
- **2026-08-26** — Claude Opus 5 model strategy added + Ramp AI Index adoption
  stats (task t_18e43426; fact basis research brief t_06f1cfb2, Ramp AI Index
  Aug 12, 2026 + WinBuzzer/BreezyScroll/Superpower Daily (FT) + Anthropic
  official pricing). Opus 5 (Anthropic, launched late July 2026): $5/$25 per
  1M input/output — exactly half of Fable 5.1; `MODEL_COMPUTE_FACTOR.opus5 =
  1.18`, `MODEL_MARGIN_BONUS.opus5 = -5` (between Sol 1.15/-3 and Fable 5.1
  1.25/-6). Adoption stats added to Fable 5 (predecessor) / Opus 5 / GPT-5.6 Sol entries:
  Fable 5 ~6% of Anthropic business tokens / 11.4% of Anthropic spend;
  GPT-5.6 Sol ~25% of OpenAI tokens / 23% of OpenAI spend; Opus 5 overtook
  Fable 5 (the predecessor) in enterprise spend per FT-cited Ramp data (attribution caveat
  documented — Ramp's own report does not state the overtake). Selector option
  (inserted after fable5, Anthropic cluster preserved) + helper, model
  label/assumption note/ROI text branches, FAQ + FAQPage JSON-LD (19→20 Q),
  meta description/keywords, Pricing Reference Table footnote, assumptions
  footer (date → Aug 26), on-page changelog. No other strategy factors
  changed; default (hybrid) outputs unchanged. Sanity check: chatbot/small/
  intermediate/standard/low/single → opus5 retainer $1,200/mo (1.18 factor vs
  hybrid $1,000 — rounds to nearest $50), margin 65% (70 − 5 bonus); sol and
  fable5 outputs unchanged.
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
