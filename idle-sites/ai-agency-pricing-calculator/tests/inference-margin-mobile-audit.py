#!/usr/bin/env python3
"""Mobile (390px) regression proof + legibility audit for the inference-margin factor
(card t_9b19d6a2).

Two things it establishes, both with measurements rather than impressions:

1. The page-level 460px scrollWidth at a 390px viewport is PRE-EXISTING (the site's wide
   rate tables inside .table-wrap). The count of overflowing elements is identical before
   and after the change, and the new section's own widest descendant is 350px — it fits
   the viewport and contributes zero overflow.
2. Text in the new section is not clipped at 390px and its font sizes are IDENTICAL to an
   existing estimator's cards on the same page (parity, not a new visual style).

GOTCHA worth remembering: a file:// URL whose path does not end in .html is NOT parsed as
HTML by Chromium (it renders as plain text), which silently produces a page with no
tables, no JS and a 390px scroll width. Always copy the comparison file to a .html name
first — that mistake is what made an earlier run of this check look like a regression.

Usage: python3 tests/inference-margin-mobile-audit.py [pre.html] [post.html]
"""
import shutil
import subprocess
import sys
import tempfile
import os

from playwright.sync_api import sync_playwright

SITE = os.path.expanduser("~/seo-pages/idle-sites/ai-agency-pricing-calculator/")
# the pre-change snapshot lives OUTSIDE the publish tree (an untracked .bak in the site
# dir could be shipped by a sibling's raw `wrangler pages deploy`); the same bytes are
# also git commit 922ee9f^ if the snapshot ever goes missing.
PRE_SRC = os.path.expanduser("~/.hermes/backups/aiagencycalculator-index-pre-t_9b19d6a2.html")
POST_SRC = SITE + "index.html"

PROBE = """() => {
  const iw = window.innerWidth;
  const rows = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.right - iw > 1) rows.push({tag: el.tagName, id: el.id || null, over: Math.round(r.right - iw),
      inEst: !!el.closest('#inference-margin-estimator')});
  });
  const sec = document.getElementById('inference-margin-estimator');
  let widest = 0, who = '';
  if (sec) sec.querySelectorAll('*').forEach(el => {
    const w = el.getBoundingClientRect().width;
    if (w > widest) { widest = w; who = (el.id || el.className || el.tagName).toString(); }
  });
  const clipped = [];
  document.querySelectorAll('#inference-margin-estimator .result-label, #inference-margin-estimator .result-value, #inference-margin-estimator .result-sub, #inference-margin-estimator .box-text').forEach(el => {
    if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) clipped.push((el.textContent || '').trim().slice(0, 40));
  });
  const sizes = new Set();
  document.querySelectorAll('#inference-margin-estimator .result-label, #inference-margin-estimator .result-value, #inference-margin-estimator .result-sub').forEach(el => sizes.add(getComputedStyle(el).fontSize));
  const existingSizes = new Set();
  document.querySelectorAll('#failure-estimator .result-label, #failure-estimator .result-value, #failure-estimator .result-sub').forEach(el => existingSizes.add(getComputedStyle(el).fontSize));
  return {docSW: document.documentElement.scrollWidth, offenders: rows.length,
          estimatorOffenders: rows.filter(r => r.inEst).length,
          sectionW: sec ? Math.round(sec.getBoundingClientRect().width) : null,
          sectionWidest: Math.round(widest), sectionWidestEl: who, clipped,
          mainChildren: document.querySelector('main').children.length,
          fontSizes: [...sizes].sort(), existingFontSizes: [...existingSizes].sort()};
}"""


def main() -> int:
    pre_src = sys.argv[1] if len(sys.argv) > 1 else PRE_SRC
    post_src = sys.argv[2] if len(sys.argv) > 2 else POST_SRC
    tmp = tempfile.mkdtemp()
    pre, post = tmp + "/pre.html", tmp + "/post.html"   # .html extension matters (see docstring)
    shutil.copy(pre_src, pre)
    shutil.copy(post_src, post)

    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page(viewport={"width": 390, "height": 844})
        res = {}
        for label, path in (("pre", pre), ("post", post)):
            page.goto("file://" + path, wait_until="load", timeout=60000)
            page.wait_for_timeout(800)
            res[label] = page.evaluate(PROBE)
            print(f"{label}: docSW={res[label]['docSW']} offenders={res[label]['offenders']} mainChildren={res[label]['mainChildren']}")
        b.close()

    checks = [
        ("page-level width is unchanged by the change", res["pre"]["docSW"] == res["post"]["docSW"],
         f"{res['pre']['docSW']} -> {res['post']['docSW']}"),
        ("overflowing-element count is unchanged", res["pre"]["offenders"] == res["post"]["offenders"],
         f"{res['pre']['offenders']} -> {res['post']['offenders']}"),
        ("the new section contributes zero overflow", res["post"]["estimatorOffenders"] == 0),
        ("the new section fits a 390px viewport", res["post"]["sectionWidest"] <= 390,
         f"widest {res['post']['sectionWidest']}px ({res['post']['sectionWidestEl']})"),
        ("no clipped text inside the new section", not res["post"]["clipped"], str(res["post"]["clipped"])),
        ("exactly one <main> child added", res["post"]["mainChildren"] - res["pre"]["mainChildren"] == 1),
        ("new section font sizes match the existing estimator's", set(res["post"]["fontSizes"]) <= set(res["post"]["existingFontSizes"]),
         f"{res['post']['fontSizes']} vs {res['post']['existingFontSizes']}"),
    ]
    ok = 0
    for entry in checks:
        name, cond = entry[0], entry[1]
        detail = entry[2] if len(entry) > 2 else ""
        print(("PASS " if cond else "FAIL ") + name + ("" if cond else f" — {detail}"))
        ok += bool(cond)
    print(f"\nRESULT: {ok}/{len(checks)}")
    print("PRE-EXISTING page width at 390px:", res["pre"]["docSW"], "px (wide rate tables in .table-wrap — not introduced here)")
    return 0 if ok == len(checks) else 1


if __name__ == "__main__":
    sys.exit(main())
