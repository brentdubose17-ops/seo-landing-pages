# OpenAI Safety-Monitoring Overhead Toggle — Sample Output & Verification

Feature: aiagencycalculator.com "OpenAI safety-monitoring overhead (~20%)" stress-test toggle (kanban t_72a68f53)
Verified: 2026-08-20 (deploy 568430e8, git 92a7f66)

## What the toggle does

- Visible checkbox in the Model Strategy section, OFF by default (OpenAI is NOT
  billing customers for the overhead — this is a what-if cost stress).
- When ON: applies an exact ×1.20 multiplier to OpenAI-based strategies
  (`sol` = GPT-5.6 Sol, `frontier` = Paid frontier Claude+GPT treated as an
  upper-bound stress test). All other strategies are unaffected.
- Basis (research brief t_b34197c5): OpenAI official post Aug 18, 2026 — "roughly
  20% of the inference compute being monitored"; scope = all RL training/eval
  involving tools for Sol-class+ models + all Astra inference with tools.
  No-billing: OpenAI spokesperson via The Register Aug 19 (corroborated TNW).
  Anthropic: no analogous slowdown required per its 186-page Risk Report (Axios).

## Sample scenario (real inline JS, node harness + browser render test)

Inputs: Service=Chatbot / Website Assistant, Size=Small Business,
Workflows=4–5, Experience=Intermediate, Timeline=Standard, Hours=40,
Delivery Risk=Low, Portability=Single platform.

| Model Strategy | Toggle OFF | Toggle ON | Delta | ROI note |
|---|---|---|---|---|
| GPT-5.6 Sol (`sol`) | $1,000/mo | $1,150/mo | +$150/mo (+15% of OFF; exactly ×1.20 pre-round) | "applied as a +20% multiplier to this OpenAI-based strategy" |
| Paid frontier (`frontier`) | $950/mo | $1,100/mo | +$150/mo (exactly ×1.20 pre-round) | applied note + no-billing + Anthropic note |
| Hybrid (`hybrid`) | $850/mo | $850/mo | $0 | "toggle is ON but does not apply to this strategy" |
| Claude Sonnet 5 (`sonnet5`) | $800/mo | $800/mo | $0 | not-applicable note |
| Open-weight (`open`) | $800/mo | $800/mo | $0 | not-applicable note |
| DeepSeek V4 (`deepseek`) | $800/mo | $800/mo | $0 | not-applicable note |
| Claude Fable 5 (`fable5`) | $1,050/mo | $1,050/mo | $0 | not-applicable note |
| Grok 4.6 (`grok46`) | $850/mo | $850/mo | $0 | not-applicable note |
| Gemini 3.7 Flash (`gemini37`) | $800/mo | $800/mo | $0 | not-applicable note |
| Local (`local`) | $700/mo | $700/mo | $0 | not-applicable note |
| DeepSeek V4 Pro cache-aware (`dsv4pro`) | $750/mo | $750/mo | $0 | not-applicable note |

Raw-multiplier check (harness recomputes pre-round value from the page's own
constants): toggle ON retainer == round(raw × 1.20 / 50) × 50 for both OpenAI
strategies; raw ratio exactly 1.20 (|ratio − 1.2| < 1e-9).

## Regression

All numeric outputs (setup / packaging / retainer / margin / ACV) with toggle
OFF are byte-identical to the prior production deploy (git HEAD) for the 7
scenario matrix on BOTH index.html and index_calculator.html. The only content
delta in the ROI text is the newly appended assumptions clause (Aug 20 sources).

## Where the feature lives

- index.html (homepage) + index_calculator.html: toggle UI + source box in the
  Model Strategy group; `overheadMultiplier` in `calculatePricing()`; output
  note (applied vs not-applicable); FAQ item + FAQPage JSON-LD (15 Qs / 6 Qs);
  meta description + keywords; on-page changelog; assumptions footer.
- CALCULATOR-API-SPEC.md: `openaiOverhead` input, `OVERHEAD_MULT` model, changelog.
- Site CHANGELOG.md + companion ~/aiagencycalculator/CHANGELOG.md: entries.

## Test coverage

- node harness (harness.js): 55 checks on index.html, 55 on index_calculator.html — all pass.
- Old-version sanity: same harness on the pre-change file fails exactly the
  toggle-specific checks (feature detection works).
- regression.js: old vs new numeric outputs — clean on both pages.
- node --check on both inline scripts: clean. FAQPage JSON-LD: valid.
- Browser (Chromium) render/click test: checkbox visible with source links;
  sol $1,000 → $1,150/mo on toggle ON; sonnet5 stays $800/mo with not-applicable
  note; FAQ item present (27 visible FAQ items on homepage).
- Live post-deploy: md5 of https://aiagencycalculator.com/index.html and
  /index_calculator == local source; toggle marker ×10 on both live pages;
  FAQ JSON-LD question live.

Sources: https://openai.com/index/pacing-model-development-cyber-capabilities
(Aug 18, 2026) · The Register (Aug 19) · TNW (Aug 19) · Axios (Aug 19) ·
Anthropic RSP v3 — verified via research brief t_b34197c5.
