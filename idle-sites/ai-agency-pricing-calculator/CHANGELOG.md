# Changelog — AI Agency Pricing Calculator

All notable changes to the calculator asset (aiagencycalculator.com) are documented here.

## 2026-08-06 — Qwen 3.8 Max open-weight coverage added (verified via parent research brief t_de2f9115)

- **New model in open-weight strategy:** Qwen 3.8 Max added to the Model Strategy selector's "Open-weight first" option and to all open-weight explanatory copy. Verified specs: GA Aug 2–3, 2026; 2.4T-parameter MoE, ~95B active; 1M-token context; API $2/$6 per 1M tokens (input/output) — the cheapest open frontier-class API on the page; open weights promised ~Aug 10 (not yet downloadable as of Aug 6, 2026).
- **Real-world usage section (performance claims refreshed):** New "Real-world agency usage so far" paragraph covers the Aug 6, 2026 field report (45 real projects: games, RPGs, websites, full OS, promo video, autonomous workflows) with explicit caveats — self-reported, no linked artifacts, no independent replication; the tester's own follow-up walked back the "destroyed Fable 5" framing (Qwen strong on fast/multimodal/image-guided builds; Fable 5 on huge long-running projects). "Autonomous coding over 10+ days" flagged as an official marketing claim not yet independently replicated; Fable 5-beating ranking disputed by independent benchmark testing. No stale claim that Qwen "beats" or "destroys" the frontier.
- **Transparent cost-variability note:** New paragraph under the open-weight section explains that published API list prices are real but total cost depends on run method — weights not downloadable until ~Aug 10, self-hosted cost varies by hardware (DGX Spark-class vs cloud GPUs), quantization (MXPF4 vs full precision), context length, and utilization; treat self-hosted cost as a range until you benchmark your own workloads.
- **Copy:** Model Strategy helper note, Pricing Reference Table footnote, margin/tools FAQs, and the open-weight FAQ all updated to include Qwen 3.8 Max at $2/$6. Calculator output (ROI text) names Qwen 3.8 Max in the open-weight stack label and assumption string; assumptions date/source updated to Aug 6, 2026 (Qwen 3.8 Max GA + OpenAI GPT-5.6 Sol/Luna).
- **SEO:** Meta description/keywords extended (Qwen 3.8 Max pricing).
- **Sources added:** Alibaba Qwen 3.8 Max blog, QwenCloud pricing page, and the verified 45-project field report X post.
- **No pricing defaults changed:** MODEL_COMPUTE_FACTOR.open (0.95) and MODEL_MARGIN_BONUS.open (+5) unchanged — Qwen 3.8 Max slots into the existing open-weight compute profile, so default outputs are unchanged.

## 2026-08-06 — GPT-5.6 Sol/Luna model options added (verified via parent research brief t_aaa3397a)

- **New model option:** "GPT-5.6 Sol (frontier, Instant + deep reasoning)" added to the Model Strategy selector. OpenAI's Aug 6, 2026 announcement confirms Sol now powers both Instant and deep reasoning for ChatGPT Plus/Pro (one consistent model + reasoning-effort slider); GPT-5.6 Luna becomes the default for Free/Go users with unlimited text chats rolling out this week/next week.
- **Estimate flag (no official pricing):** OpenAI has NOT published per-token API pricing for Sol/Luna — the option is clearly marked ESTIMATE, `MODEL_COMPUTE_FACTOR.sol = 1.15` / `MODEL_MARGIN_BONUS.sol = -3` (premium tier, slightly above generic frontier to reflect the reasoning-effort dial), with a link to OpenAI's pricing page (https://openai.com/api/pricing/).
- **Assumption sourcing:** Calculator output (ROI justification text) now includes the assumptions date/source: "Assumptions verified Aug 6, 2026 (OpenAI GPT-5.6 Sol/Luna announcement…)". Sol-specific estimate note appended when the Sol option is selected.
- **Copy:** Pricing Reference Table footnote and a new FAQ item ("Do the new GPT-5.6 Sol / GPT-5.6 Luna models change what I should charge?") explain the update; meta description/keywords extended (GPT-5.6 Sol pricing, GPT-5.6 Luna). No deprecated model versions referenced anywhere in user-facing copy.
- **Sources:** OpenAI announcement page (https://openai.com/index/improving-gpt-5-6-sol-in-chatgpt/) + @OpenAI X thread (https://x.com/OpenAI/status/2085434712429052386), both Aug 6, 2026, via fact sheet t_aaa3397a.

## 2026-08-05 — Agent failure / retry cost model added (levelsio Gauntlet Loop data)

- **New section:** "Agent Failure & Retry Cost Estimator" — models the real cost of failed/retried agent loops. Scenario presets: levelsio Gauntlet Loop (real-world, Aug 5 2026), typical agentic build (subagent fan-out + retries), simple automation, custom.
- **Model:** total = base cost per loop attempt × (1 + failed attempts) + cleanup/rework. Outputs naive estimate (no retries), retry loops burned, cleanup/rework, and **total including retries** with a multiplier vs the naive estimate.
- **Preset reproduces the reported blowup:** levelsio's Gauntlet Loop — $500 per loop attempt, $400 cleanup → **$900 total, 1.8× the naive $500**. Matches his public numbers: "$500 per Gauntlet Loop run" corrected to "$900 total… remove 95% of what it made" (Aug 5, 2026).
- **New input on main calculator:** "Delivery Risk (Failure / Retry)" select — Low 1.0× (default, outputs unchanged), Moderate 1.15×, High 1.35×, levelsio-style 2.0×. Retainer scales by `DELIVERY_RISK_FACTOR`; ROI output names the risk profile so agencies price failed loops into the quote instead of eating them in margin.
- **Sources (inline citations):** levelsio X post https://x.com/levelsio/status/2084997902632390981 · Systima token-overhead analysis (4.2× fan-out) · HN Cursor usage analytics ($0.06/req avg) · AgentGuard infinite-loop tooling (~$2,000 overnight). Estimates labeled directional; verified via parent research brief t_410274f4.

## 2026-08-05 — Open-weight model economics added (Kimi K3 / GLM-5.2)

- **New input:** "Model Strategy (API Cost Profile)" select — Hybrid (default), Open-weight first (Kimi K3, GLM-5.2), Paid frontier only (Claude, GPT). Default is Hybrid, so existing outputs are unchanged.
- **Logic:** Retainer now scales with model strategy (`MODEL_COMPUTE_FACTOR`: open 0.95, hybrid 1.0, frontier 1.1) and margins get a model-strategy adjustment (open +5 pts, hybrid 0, frontier −2). Open-weight retainers run ~5% lower and margins ~5 pts higher; frontier-only stacks carry a ~10% premium. ROI output names the assumed stack.
- **Bug fix:** Sales pitch previously produced "Infinity months" when monthly savings ≈ retainer (e.g. email automation + 40 hrs/mo) — payback now falls back to 12 months when net monthly savings aren't positive.
- **Copy:** New "Open-Weight Models: The New Cost Lever for Agencies" section (preserves the Gemini routing calculator and explainer). Verified facts added: Kimi K3 (2.8T-param open-weight MoE, ~104B active, 1M-token context, HF weights live 2026-07-27, API $3/$15 per 1M tokens input/output, vendor-run coding scores within a few points of Claude Fable 5 / GPT-5.6 Sol); GLM-5.2 (open weights, MIT license, 1M-token context, 81.0 Terminal-Bench 2.1). GLM 5.3 is explicitly flagged as unconfirmed — copy does not assert it as fact.
- **FAQ:** New Q&A on open-weight models and pricing ("changes margin, not list price"); margin and tools FAQs updated with the open-weight counter-lever.
- **SEO:** Meta description/keywords extended to cover open-weight options (Kimi K3, GLM-5.2).
- **Sources:** Moonshot Kimi K3 blog + API pricing, HF model card (moonshotai/Kimi-K3), zai-org/GLM-5. Verified via parent research brief t_15876aa7.

## 2026-08-05 — AI compute cost benchmark added (Volta / Anthropic deal)

- **Benchmark:** Added 2026 AI compute cost trend data to the pricing page: Anthropic's $10B, six-year cloud-compute agreement with Volta Infra Holdings implies ~$1.67B/year in committed compute. Volta is valued at $2.4B, raised ~$300M, and is backed by Nvidia and Michael Dell.
- **Cost-trend assumption:** Retainers now include a ~5% compute-cost pass-through factor (`COMPUTE_COST_FACTOR = 1.05`) so rising API/infrastructure costs are reflected in monthly pricing.
- **Margin model:** Service margins adjusted down 3–7 points across the board (e.g., chatbot 70→65, content automation 72→65, full office 55→50) to reflect rising compute costs. Hero stat updated from 68% to 61% avg net margin.
- **Pass-through guidance:** FAQ updated — agencies should cap variable compute costs in client contracts or pass through with transparent markup; recommended pass-through 8–12% of retainer.
- **Tool/budget line items:** Typical tool-stack budget raised from $200–$500/mo to $300–$800+/mo; OpenAI API line raised from $5–$200+/mo to $20–$400+/mo.
- **Source:** TechCrunch, "Anthropic signs $10B deal with AI cloud startup Volta" (Aug 4, 2026) — https://techcrunch.com/2026/08/04/anthropic-signs-10-billion-deal-with-ai-cloud-startup-volta

## 2026-08-05 — Google Cloud model routing savings added

- **New section:** "Gemini API Cost & Model Routing Savings" interactive estimator — inputs (monthly input/output tokens in millions, current model Flash or 2.5 Pro, % routed to Flash-Lite) and outputs (current cost, routed cost, monthly savings, % lower bill).
- **Explainer:** static section covering Google Cloud managed model routing in API Gateway (Public Preview Aug 3, 2026), how name-based routing works, illustrative scenarios (~61% and ~53% token-cost savings), caveats (pricing gap: no routing-specific fee published; one-way gateway mode; single-host constraint), source links, and changelog.
- **Pricing:** all token rates from Google's published list prices (global tier): Flash-Lite $0.30/1M in / $2.50/1M out; Flash $1.50/1M in / $9.00/1M out; 2.5 Pro $1.25/1M in (≤200K) / $10/1M out (≤200K). Estimates labeled directional.
- **Sources:** Google Cloud API Gateway docs (overview, configure), Google Dev Blog, Vertex AI pricing, API Gateway pricing, release notes, TLDR AI Aug 5 2026.
