#!/usr/bin/env python3
"""
Independent cross-check of the numbers printed in prose on
gpt-live-1-cost-calculator.html (the backend comparison table and the ledger
paragraphs). Deliberately re-derived from OpenAI's published rates here in
Python, NOT from the page's JavaScript, so a shared bug cannot hide.

Rates are $ per 1M tokens, Standard tier, short-context column, transcribed from
the verified facts sheet (t_1c163248 section B8 / P3):

    model            in     cached  out
    gpt-6-astra      10.00   1.00   50.00
    gpt-5.6-terra     2.00   0.20   12.00
    gpt-5.6-luna      0.20   0.02    1.20
    gpt-5.6-sol       4.00   0.40   20.00
    gpt-5.6-cyber    12.50   1.25   75.00

Voice: $0.05/min, billed per second, no round-up; WebRTC init floor 15 s.
Tiers: 25/50/200/300/500; Free not supported.

Exit 0 only if every prose figure on the page matches an independent derivation.
"""
import re
import sys
from pathlib import Path

PAGE = Path(__file__).resolve().parent.parent / "gpt-live-1-cost-calculator.html"

RATES = {
    "gpt-6-astra": (10.00, 1.00, 50.00),
    "gpt-5.6-terra": (2.00, 0.20, 12.00),
    "gpt-5.6-luna": (0.20, 0.02, 1.20),
    "gpt-5.6-sol": (4.00, 0.40, 20.00),
    "gpt-5.6-cyber": (12.50, 1.25, 75.00),
}
VOICE_PER_MIN = 0.05
INIT_SECONDS = 15
TIER_CEILINGS = [25, 50, 200, 300, 500]
REALTIME_AUDIO_IN, REALTIME_AUDIO_OUT = 32.00, 64.00

TURNS, TOK_IN, TOK_OUT = 6, 1500, 300
CALLS_PER_DAY, CALL_SECONDS, OPERATING_HOURS = 1000, 240, 8
MONTH_DAYS = 30

fails = []
checks = 0


def check(name, actual, expected, tol=1e-9):
    global checks
    checks += 1
    if abs(actual - expected) > tol:
        fails.append(f"{name}: derived {actual!r}, page says {expected!r}")


def billed_seconds(seconds, transport="webrtc"):
    if transport == "webrtc":
        return max(seconds, INIT_SECONDS)
    return seconds


def voice_cost(seconds, transport="webrtc"):
    return billed_seconds(seconds, transport) / 60 * VOICE_PER_MIN


def backend_per_call(model, turns=TURNS, tok_in=TOK_IN, tok_out=TOK_OUT):
    r_in, _r_cached, r_out = RATES[model]
    return turns * (tok_in * r_in + tok_out * r_out) / 1e6


def concurrent(calls_per_day, seconds, hours, peak):
    return calls_per_day / hours * seconds / 3600 * peak


# --- voice ---------------------------------------------------------------
check("voice 4:00 call", voice_cost(240), 0.20)
check("voice 0:40 call", voice_cost(40), 0.0333333333333, 1e-12)
check("voice 0:05 webrtc (floor)", voice_cost(5), 0.0125, 1e-15)
check("voice 0:05 websocket", voice_cost(5, "websocket"), 0.0041666666667, 1e-12)
check("voice 1:30 webrtc", voice_cost(90), 0.075, 1e-15)
check("voice 1,000 calls/day", voice_cost(240) * CALLS_PER_DAY, 200.00, 1e-9)
check("voice month 30-day", voice_cost(240) * CALLS_PER_DAY * 30, 6000.00, 1e-9)
check("voice month 31-day", voice_cost(240) * CALLS_PER_DAY * 31, 6200.00, 1e-9)
check("voice month 365/12", voice_cost(240) * CALLS_PER_DAY * (365 / 12), 6083.3333333333, 1e-6)

# --- backend table -------------------------------------------------------
table = {
    "gpt-5.6-luna": (0.00396, 0.019),
    "gpt-5.6-terra": (0.0396, 0.165),
    "gpt-5.6-sol": (0.0720, 0.265),
    "gpt-6-astra": (0.1800, 0.474),
}
for model, (want_cost, want_share) in table.items():
    derived = backend_per_call(model)
    check(f"backend {model} $/call", derived, want_cost, 1e-9)
    share = derived / (derived + 0.20)
    check(f"backend {model} share", share, want_share, 5e-4)

check("Terra backend/day", backend_per_call("gpt-5.6-terra") * 1000, 39.60, 1e-9)
check("Astra backend/day", backend_per_call("gpt-6-astra") * 1000, 180.00, 1e-9)
check("two-meter total/call", 0.20 + backend_per_call("gpt-5.6-terra"), 0.2396, 1e-12)
check("two-meter total/day", (0.20 + backend_per_call("gpt-5.6-terra")) * 1000, 239.60, 1e-9)
check("two-meter total/month 30-day", (0.20 + backend_per_call("gpt-5.6-terra")) * 1000 * 30, 7188.00, 1e-9)
check("idle share 30% of voice", voice_cost(240) * 0.30, 0.06, 1e-12)

# --- concurrency ---------------------------------------------------------
check("avg concurrency", concurrent(1000, 240, 8, 1.0), 8.3333333333333, 1e-9)
check("peak 2.5x concurrency", concurrent(1000, 240, 8, 2.5), 20.8333333333333, 1e-9)
check("calls/hour", 1000 / 8, 125.0, 1e-9)
check("stress 5,000 calls / 5:00 / 8h", concurrent(5000, 300, 8, 1.0), 52.0833333333333, 1e-9)

# --- realtime comparison -------------------------------------------------
rt_per_min = (600 * REALTIME_AUDIO_IN + 600 * REALTIME_AUDIO_OUT) / 1e6
check("realtime audio per minute at 600/600", rt_per_min, 0.0576, 1e-12)
breakeven_in = 0.05 * 1e6 / (REALTIME_AUDIO_IN + REALTIME_AUDIO_OUT)
check("flat-rate break-even tokens/min (1:1 mix)", breakeven_in * 2, 1041.6666666667, 1e-6)

# --- the page must not contain a figure that disagrees --------------------
html = PAGE.read_text(encoding="utf-8")
prose_required = [
    "$0.05 per minute",
    "$0.2000",
    "$0.0333",
    "$0.0125",
    "$6,000",
    "$6,200",
    "$6,083.33",
    "$200.00",
    "$0.0396",
    "$0.00396",
    "$0.0720",
    "$0.1800",
    "47.4%",
    "16.5%",
    "26.5%",
    "1.9%",
    "8.33 concurrent",
    "20.8",
    "25 / 50 / 200 / 300 / 500",
    "$39.60",
    "$180.00",
]
# Note: $0.0576/min, $239.60/day and the 1,041.67 break-even are rendered at
# runtime by the page's JavaScript, not printed statically, so they are asserted
# instead by gpt-live-1-verify.mjs (which checks the rendered text of
# #rRtPerMin, #rTotalDay and #rRtBreakEven against independently derived
# expectations) and by the derivations above.
for token in prose_required:
    if token not in html:
        fails.append(f"prose token missing from the page: {token!r}")

# every rate the page prints in its table must equal the published rate
for model, (r_in, r_cached, r_out) in RATES.items():
    m = re.search(r"'%s': \{ label: '[^']+', inRate: ([\d.]+), cachedRate: ([\d.]+), cacheWriteRate: ([\d.]+), outRate: ([\d.]+)" % re.escape(model), html)
    if not m:
        fails.append(f"page model registry missing {model}")
        continue
    got = tuple(float(x) for x in m.groups())
    checks += 1
    if (got[0], got[1], got[3]) != (r_in, r_cached, r_out):
        fails.append(f"page rate for {model} {got} != verified {r_in}/{r_cached}/{r_out}")

print(f"independent python cross-check: {checks - len(fails)}/{checks} figures agree")
if fails:
    print("\nDISAGREEMENTS:")
    for f in fails:
        print("  - " + f)
    sys.exit(1)
print("Every prose figure on the page matches an independent derivation.")
