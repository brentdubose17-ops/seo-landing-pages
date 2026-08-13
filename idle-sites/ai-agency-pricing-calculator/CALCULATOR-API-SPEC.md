# AI Agency Pricing Calculator — API & Cost Model Spec

**Site:** aiagencycalculator.com
**Source asset:** `~/seo-pages/idle-sites/ai-agency-pricing-calculator/index.html`
**Last updated:** 2026-08-12 (Grok 4.6 model strategy — verified $2/$6 per 1M API pricing + 500k context, task t_c7e3e912)

---

## 1. Overview

Single-file static calculator (HTML + inline JS, no backend). Exposes four
independent estimators in one page:

| # | Estimator | Function | Section |
|---|-----------|----------|---------|
| 1 | AI Pricing Calculator (setup fee / retainer / margin / ACV / ROI / pitch) | `calculatePricing()` | main form |
| 2 | Agent Failure & Retry Cost Estimator | `calculateFailure()` | `#failure-estimator` |
| 3 | Gemini API Cost & Model Routing Savings | `calculateRouting()` | main form |
| 4 | **Agent Wallet & Spend Cap Estimator** (NEW 2026-08-07) | `calculateWallet()` | `#wallet-estimator` |

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

### 3.1 Inputs

| Field ID | Type | Default |
|----------|------|---------|
| `serviceType` | select (7 services) | — (required) |
| `bizSize` | select (5 sizes) | — (required) |
| `numWorkflows` | select (1/2/4/6/11) | `4` |
| `experience` | select (beginner/intermediate/advanced/expert) | `intermediate` |
| `timeline` | select (rush/standard/extended) | `standard` |
| `modelStrategy` | select (hybrid/deepseek/local/open/sol/frontier) | `hybrid` |
| `deliveryRisk` | select (low/moderate/high/levelsio) | `low` |
| `portability` | select (single/plugin_2/plugin_many) | `single` |
| `hoursSaved` | range 5–300 | `40` |

### 3.2 Key constants

```
BASE_SETUP / BASE_RETAINER / BASE_MARGIN   per service (2026 market ranges)
SIZE_MULT     0.65 / 0.85 / 1.0 / 1.35 / 1.8
WORKFLOW_MULT 0.7 / 0.9 / 1.0 / 1.3 / 1.6
EXP_MULT      0.7 / 1.0 / 1.3 / 1.6
TIMELINE_MULT 1.35 / 1.0 / 0.9
MODEL_COMPUTE_FACTOR  open 0.95 · deepseek 0.92 (PROVISIONAL — hike announced) · local 0.85 (Meta Muse Glimmer self-host, cheapest — hardware-amortized, per-workload) · grok46 1.0 (Grok 4.6 SpaceXAI, $2/$6 verified — neutral, matches open-weight tier price but hosted frontier) · hybrid 1.0 · frontier 1.1 · sol 1.15 (estimate)
MODEL_MARGIN_BONUS    open +5 · deepseek +6 · local +8 · grok46 +2 · hybrid 0 · frontier −2 · sol −3
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
monthlyRetainer = round(retainerMid × combined × MODEL_COMPUTE_FACTOR
                × DELIVERY_RISK_FACTOR × PORTABILITY_RETAINER_FACTOR / 50) × 50
margin          = clamp(40..82, BASE_MARGIN + (EXP_MULT−1)×10 + MODEL_MARGIN_BONUS
                + PORTABILITY_MARGIN_BONUS)
acv             = setupFee + monthlyRetainer × 12
monthlySavings  = hoursSaved × laborRate(25/35/45/65 by bizSize)
roi             = annualSavings / acv
paybackMonths   = ceil(setupFee / max(netMonthly, tiny)) fallback 12
```

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

Prices (per 1M tokens): Flash-Lite $0.30/$2.50 · Flash $1.50/$9.00 · 2.5 Pro $1.25/$10.00.

---

## Changelog

- **2026-08-12** — Grok 4.6 model strategy added (SpaceXAI, released Aug 12, 2026; API
  $2/$6 per 1M input/output, fast variant 2x, cache hit $0.50 (−75%); 500k context window
  and Intelligence Index 61 = GPT-5.6 Sol max per Artificial Analysis — x.ai announcement
  silent on context). Conservative modeling: `MODEL_COMPUTE_FACTOR.grok46 = 1.0`,
  `MODEL_MARGIN_BONUS.grok46 = +2` (verified price matches open-weight tier but hosted
  frontier, so no discount/premium over the hybrid baseline). Selector option + helper,
  model label/assumption note/ROI text branches, FAQ + FAQPage JSON-LD, Pricing Reference
  Table footnote, meta tags, assumptions note. No other strategy factors changed; default
  (hybrid) outputs unchanged. Sanity check: 50k input / 2k output run = $0.112 (vs
  GPT-5.6 Sol $0.31 → 64% cheaper, consistent with AA "60%+ below"). Sources: x.ai, 9to5Mac,
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
