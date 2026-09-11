#!/usr/bin/env python3
"""Live browser verification of the "inference as a share of gross margin consumed"
factor on production (card t_9b19d6a2, deployed 2026-09-10, deployment 6ae0aa38).

Desktop 1280x900 + mobile 390x844 against https://aiagencycalculator.com/:
  - the preloaded reference case renders 99.4% -> 93.0% / 6.4 pts / 6.4% consumed
  - changing an input recomputes, and flips the preset to Custom
  - re-selecting the reference case restores the reference outputs
  - the pre-existing main pricing calculator still returns a retainer + margin
  - no uncaught JS errors and no failed same-origin requests

Usage: python3 tests/inference-margin-browser-verify.py [url]
Exit 0 = every assertion passed. Screenshots land in /tmp/t_9b19d6a2/.
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "https://aiagencycalculator.com/"
OUT = "/tmp/t_9b19d6a2"
os.makedirs(OUT, exist_ok=True)
IDS = ["im-margin-before", "im-margin-after", "im-delta", "im-pct-gm", "im-pct-rev", "im-cogs-share"]
state = {"pass": 0, "fail": 0, "detail": []}


def check(name, cond, detail=""):
    state["pass" if cond else "fail"] += 1
    print(("PASS " if cond else "FAIL ") + name + ("" if cond else f" — {detail}"))
    state["detail"].append({"name": name, "ok": bool(cond), "detail": str(detail)[:300]})


with sync_playwright() as p:
    browser = p.chromium.launch()

    page = browser.new_page(viewport={"width": 1280, "height": 900})
    errors, failed = [], []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("requestfailed", lambda r: failed.append(f"{r.url} {r.failure}"))
    page.goto(URL, wait_until="load", timeout=60000)
    page.wait_for_selector("#inference-margin-estimator", timeout=30000)

    got = {i: page.inner_text("#" + i) for i in IDS}
    check("desktop: reference case margin without inference = 99.4%", got["im-margin-before"] == "99.4%", got["im-margin-before"])
    check("desktop: reference case margin with inference = 93.0%", got["im-margin-after"] == "93.0%", got["im-margin-after"])
    check("desktop: margin cost = 6.4 pts", got["im-delta"] == "6.4 pts", got["im-delta"])
    check("desktop: % of gross margin consumed = 6.4%", got["im-pct-gm"] == "6.4%", got["im-pct-gm"])
    check("desktop: % of revenue = 6.4%", got["im-pct-rev"] == "6.4%", got["im-pct-rev"])
    check("desktop: inference share of COGS = 91.4%", got["im-cogs-share"] == "91.4%", got["im-cogs-share"])

    page.fill("#infSpend", "12800")
    page.click("button:has-text('Convert Inference Into a Margin Figure')")
    page.wait_for_timeout(400)
    got2 = {i: page.inner_text("#" + i) for i in IDS}
    check("desktop: input change flips the preset to custom", page.input_value("#infPreset") == "custom", page.input_value("#infPreset"))
    check("desktop: 2x inference -> 86.6% margin after", got2["im-margin-after"] == "86.6%", got2["im-margin-after"])
    check("desktop: 2x inference -> 12.8 pts cost", got2["im-delta"] == "12.8 pts", got2["im-delta"])

    page.select_option("#infPreset", "levelsio")
    page.wait_for_timeout(500)
    got3 = {i: page.inner_text("#" + i) for i in IDS}
    check("desktop: re-selecting the reference case restores 99.4% -> 93.0%",
          got3["im-margin-before"] == "99.4%" and got3["im-margin-after"] == "93.0%", json.dumps(got3))

    page.select_option("#serviceType", "chatbot")
    page.select_option("#bizSize", "medium")
    page.click("button:has-text('Calculate My Pricing')")
    page.wait_for_timeout(400)
    retainer, margin = page.inner_text("#res-retainer"), page.inner_text("#res-margin")
    check("desktop: pre-existing main calculator still returns a retainer", retainer.strip() not in ("", "—"), retainer)
    check("desktop: pre-existing main calculator still returns a margin", margin.strip() not in ("", "—"), margin)
    check("desktop: new FAQ question renders (>=43 faq-items)",
          page.eval_on_selector_all("div.faq-item", "els => els.length") >= 43)
    page.locator("#inference-margin-estimator").screenshot(path=f"{OUT}/inference-margin-section-desktop.png")

    m = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1, has_touch=True)
    m_errors = []
    m.on("pageerror", lambda e: m_errors.append(str(e)))
    m.goto(URL, wait_until="load", timeout=60000)
    m.wait_for_selector("#inference-margin-estimator", timeout=30000)
    mgot = {i: m.inner_text("#" + i) for i in IDS}
    check("mobile: reference case renders 99.4% -> 93.0%",
          mgot["im-margin-before"] == "99.4%" and mgot["im-margin-after"] == "93.0%", json.dumps(mgot))

    own = m.evaluate("""() => {
      const bad = [];
      document.querySelectorAll('#inference-margin-estimator *').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right - window.innerWidth > 1 || r.width > window.innerWidth + 1) bad.push(el.id || el.className || el.tagName);
      });
      return bad;
    }""")
    check("mobile: nothing inside the estimator overflows the viewport", not own, json.dumps(own))

    clipped = m.evaluate("""() => {
      const bad = [];
      document.querySelectorAll('#inference-margin-estimator .result-label, #inference-margin-estimator .result-value, #inference-margin-estimator .result-sub, #inference-margin-estimator .box-text').forEach(el => {
        if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) bad.push((el.textContent || '').trim().slice(0, 40));
      });
      return bad;
    }""")
    check("mobile: no clipped text inside the estimator cards", not clipped, json.dumps(clipped))

    m.evaluate("document.getElementById('inference-results').scrollIntoView({block:'start'})")
    m.wait_for_timeout(500)
    m.screenshot(path=f"{OUT}/live-mobile-results.png")

    check("no uncaught JS errors (desktop)", not errors, json.dumps(errors))
    check("no uncaught JS errors (mobile)", not m_errors, json.dumps(m_errors))
    check("no failed same-origin requests", not [f for f in failed if "aiagencycalculator.com" in f], json.dumps(failed[:5]))
    browser.close()

print(f"\nRESULT: {state['pass']}/{state['pass'] + state['fail']}")
json.dump(state, open(f"{OUT}/live-browser-verify.json", "w"), indent=2)
sys.exit(1 if state["fail"] else 0)
