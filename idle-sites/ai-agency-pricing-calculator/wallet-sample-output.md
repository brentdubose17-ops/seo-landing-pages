# Agent Wallet & Spend Cap Estimator — Sample Output

**Generated:** 2026-08-07 from the live calculator JS (`calculateWallet()` in index.html, task t_1a96f10a).

Demonstrates capped vs uncapped monthly AI spend, wallet fees, and the no-fee / exceeded-cap edge cases.

## A. Uncapped baseline (no wallet fee, no cap)

| Metric | Value |
|---|---|
| Uncapped monthly spend | $1,000 |
| Wallet fee (uncapped) | $0 — No wallet fee configured |
| **Capped monthly spend** | **$1,000** — No cap set — identical to uncapped |
| Wallet fee (capped) | $0 |
| Overage blocked by cap | — — No cap set |

**Narrative:** No creator-set cap: this scenario models 5 agent(s) spending $200/month each with no wallet ceiling — worst-case spend is unbounded at $1,000/month (no wallet fee). This is the default assumption on this calculator — previous cost assumptions are preserved as fallback defaults. The cost-blowup record (retry storms, subagent fan-out, cache misses) shows the risk is tail spend; a wallet cap is the only way to cut the tail at the payment layer. Cloudflare Wallets (Aug 4, 2026) would make this scenario the uncapped baseline: set a creator-set cap above to see the capped comparison.

---

## B. Capped below spend — cap exceeded (no wallet fee)

| Metric | Value |
|---|---|
| Uncapped monthly spend | $1,000 |
| Wallet fee (uncapped) | $0 — No wallet fee configured |
| **Capped monthly spend** | **$750** — Cap reached — spend clamped at $150/agent |
| Wallet fee (capped) | $0 |
| Overage blocked by cap | $250 — $50 over cap per agent — blocked until manual override |

**Narrative:** Cap exceeded: each agent spends $200/month, $50 over the $150 creator-set cap. Capped spend is $750/month vs $1,000 uncapped — the cap blocks $250/month (25% of uncapped spend). Over-cap requests are NOT auto-approved: the agent must request a manual override from an authorized human, and the cap is enforced at the wallet’s API layer (x402 / Cloudflare Wallets), so prompt injection cannot lift it. Wallet fee on actual spend: $0/month (0% (no wallet fee)). Agency takeaway: worst-case spend per agent is now a known number ($150/mo), which makes client billing caps programmable and cost forecasts cap-constrained.

---

## C. Capped with wallet fee (2%) — cap exceeded

| Metric | Value |
|---|---|
| Uncapped monthly spend | $1,000 |
| Wallet fee (uncapped) | $20 — 2% fee on $1,000 |
| **Capped monthly spend** | **$500** — Cap reached — spend clamped at $100/agent |
| Wallet fee (capped) | $10 |
| Overage blocked by cap | $500 — $100 over cap per agent — blocked until manual override |

**Narrative:** Cap exceeded: each agent spends $200/month, $100 over the $100 creator-set cap. Capped spend is $500/month vs $1,000 uncapped — the cap blocks $500/month (50% of uncapped spend). Over-cap requests are NOT auto-approved: the agent must request a manual override from an authorized human, and the cap is enforced at the wallet’s API layer (x402 / Cloudflare Wallets), so prompt injection cannot lift it. Wallet fee on actual spend: $10/month (2%). Agency takeaway: worst-case spend per agent is now a known number ($100/mo), which makes client billing caps programmable and cost forecasts cap-constrained.

---

## D. Wallet fee only, no cap (2%)

| Metric | Value |
|---|---|
| Uncapped monthly spend | $1,000 |
| Wallet fee (uncapped) | $20 — 2% fee on $1,000 |
| **Capped monthly spend** | **$1,000** — No cap set — identical to uncapped |
| Wallet fee (capped) | $20 |
| Overage blocked by cap | — — No cap set |

**Narrative:** No creator-set cap: this scenario models 5 agent(s) spending $200/month each with no wallet ceiling — worst-case spend is unbounded at $1,000/month (2% wallet fee = $20/mo). This is the default assumption on this calculator — previous cost assumptions are preserved as fallback defaults. The cost-blowup record (retry storms, subagent fan-out, cache misses) shows the risk is tail spend; a wallet cap is the only way to cut the tail at the payment layer. Cloudflare Wallets (Aug 4, 2026) would make this scenario the uncapped baseline: set a creator-set cap above to see the capped comparison.

---

## E. Cap above spend — cap does not bind (1% fee)

| Metric | Value |
|---|---|
| Uncapped monthly spend | $1,000 |
| Wallet fee (uncapped) | $10 — 1% fee on $1,000 |
| **Capped monthly spend** | **$1,000** — Below cap — no clamp applied |
| Wallet fee (capped) | $10 |
| Overage blocked by cap | $0 — No spend exceeds the cap |

**Narrative:** Capped scenario, below the cap: 5 agent(s) × $200/month = $1,000/month, and since $200 ≤ cap ($300/agent), the wallet cap does not bind — capped spend equals uncapped spend ($1,000/month). The wallet fee (1%) is identical in both scenarios. A cap only changes the forecast once per-agent spend exceeds it — set the cap below $200 to see the clamp.

---

## F. Cloudflare weekly example — $100/wk ≈ $433/mo cap, 10 agents at $500/mo

| Metric | Value |
|---|---|
| Uncapped monthly spend | $5,000 |
| Wallet fee (uncapped) | $0 — No wallet fee configured |
| **Capped monthly spend** | **$4,330** — Cap reached — spend clamped at $433/agent |
| Wallet fee (capped) | $0 |
| Overage blocked by cap | $670 — $67 over cap per agent — blocked until manual override |

**Narrative:** Cap exceeded: each agent spends $500/month, $67 over the $433 creator-set cap. Capped spend is $4,330/month vs $5,000 uncapped — the cap blocks $670/month (13% of uncapped spend). Over-cap requests are NOT auto-approved: the agent must request a manual override from an authorized human, and the cap is enforced at the wallet’s API layer (x402 / Cloudflare Wallets), so prompt injection cannot lift it. Wallet fee on actual spend: $0/month (0% (no wallet fee)). Agency takeaway: worst-case spend per agent is now a known number ($433/mo), which makes client billing caps programmable and cost forecasts cap-constrained.

---

## Acceptance check

- [x] Capped vs uncapped spend demonstrated (A vs B/C/F)
- [x] No-wallet-fee edge case (A: fee rows show $0 / "No wallet fee configured")
- [x] Exceeded-cap edge case (B/C/F: overage shown, blocked until manual override)
- [x] Cap-does-not-bind edge case (E)
- [x] Wallet fee applied to actual (capped) spend (C: fee drops $20 → $10 when cap blocks half)
- [x] Previous cost assumptions preserved as fallback defaults (A: 0% fee, uncapped = pre-wallet behavior)
