#!/usr/bin/env python3
"""Horizontal-overflow regression check for aiagencycalculator.com (card t_cc4b7740).

Two modes:

  A. Verify a page has no page-level horizontal scroll on phone viewports and that the
     wide rate tables are still reachable by scrolling INSIDE their wrappers:

       python3 tests/mobile-overflow-390.py index.html
       python3 tests/mobile-overflow-390.py https://aiagencycalculator.com/

  B. Prove a fix is desktop-neutral: render a pre and a post revision at 1280x900 and
     compare geometry — every id-bearing element must keep its box to within 1px, the
     table column widths and document height/scrollWidth must be identical, and the only
     element added may be the declared scroll wrapper:

       python3 tests/mobile-overflow-390.py index.html --compare /tmp/pre.html

Exit 0 only when every assertion passes. Both modes copy local files to a .html name
first: Chromium renders a file:// path without the .html extension as plain text, which
would report a false PASS (no tables, no JS, scrollWidth == innerWidth).
"""
import argparse
import json
import os
import shutil
import sys
import tempfile

from playwright.sync_api import sync_playwright

PHONES = [320, 360, 390, 414]
DESKTOP = (1280, 900)

OVERFLOW_PROBE = """() => {
  const iw = window.innerWidth;
  const clips = el => {
    let p = el.parentElement;
    while (p) {
      const cs = getComputedStyle(p);
      if (cs.overflowX !== 'visible' && cs.overflowX !== 'clip') return p;
      if (cs.position === 'fixed' || cs.position === 'absolute') return p;
      p = p.parentElement;
    }
    return null;
  };
  const pageLevel = [];
  let clippedCount = 0;
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.right - iw > 1) {
      if (clips(el)) { clippedCount += 1; return; }
      pageLevel.push({tag: el.tagName, id: el.id || '', cls: (el.className || '').toString().slice(0, 40),
                      right: Math.round(r.right), over: Math.round(r.right - iw),
                      text: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 50)});
    }
  });
  const wraps = [...document.querySelectorAll('.table-wrap')].map((w, i) => {
    const t = w.querySelector('table');
    return {i, wW: Math.round(w.getBoundingClientRect().width),
            wRight: Math.round(w.getBoundingClientRect().right),
            wOverflowsViewport: w.getBoundingClientRect().right - iw > 1,
            tW: t ? Math.round(t.getBoundingClientRect().width) : null,
            cw: w.clientWidth, sw: w.scrollWidth,
            internallyScrollable: w.scrollWidth > w.clientWidth + 1};
  });
  return {iw, docSW: document.documentElement.scrollWidth, bodySW: document.body.scrollWidth,
          pageLevel, clippedCount, wraps};
}"""

# after scrolling a wrapper fully right, the last cell of its table must be inside the viewport
REACH_PROBE = """() => {
  const iw = window.innerWidth;
  const out = [];
  document.querySelectorAll('.table-wrap').forEach((w, i) => {
    w.scrollLeft = w.scrollWidth;   // go to the far right
    const t = w.querySelector('table');
    if (!t) return;
    const cells = t.querySelectorAll('tr:first-child > *');
    const last = cells[cells.length - 1];
    const r = last.getBoundingClientRect();
    out.push({i, scrollLeft: Math.round(w.scrollLeft), maxScrollLeft: Math.round(w.scrollWidth - w.clientWidth),
              lastHeader: (last.textContent || '').trim().slice(0, 30),
              lastCellLeft: Math.round(r.left), lastCellRight: Math.round(r.right),
              insideViewport: r.left >= -1 && r.right <= iw + 1});
  });
  return out;
}"""

FP_PROBE = """() => {
  const idEls = [];
  let wbr = 0;
  document.querySelectorAll('body *').forEach(el => {
    if (el.tagName === 'WBR') { wbr += 1; return; }   // zero-size break opportunity, no box
    if (!el.id) return;                              // stable identity: ids are unique
    const r = el.getBoundingClientRect();
    idEls.push([el.tagName, el.id, Math.round(r.left), Math.round(r.top),
                Math.round(r.width), Math.round(r.height)].join('|'));
  });
  const tables = [...document.querySelectorAll('table')].map(t =>
    [...t.querySelectorAll('tr:first-child > *')].map(c => Math.round(c.getBoundingClientRect().width)).join(','));
  return {idEls, wbr, tables,
          allCount: document.querySelectorAll('body *').length,
          docH: document.documentElement.scrollHeight,
          docSW: document.documentElement.scrollWidth,
          overflowWrapApplied: getComputedStyle(document.querySelector('code')).overflowWrap};
}"""


def load(path: str, tmp: str, name: str) -> str:
    """Return a file:// URL (copied to a .html name) or the URL unchanged."""
    if path.startswith("http://") or path.startswith("https://"):
        return path
    dst = os.path.join(tmp, name)
    shutil.copy(path, dst)
    return "file://" + dst


def run_probe(page, url, width, height, probe, settle=800):
    page.set_viewport_size({"width": width, "height": height})
    if url.startswith("file://"):
        page.goto(url, wait_until="load", timeout=60000)
    else:
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(settle)
    return page.evaluate(probe)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("target", help="local html path or https URL")
    ap.add_argument("--compare", metavar="PRE", help="second mode: compare PRE against target at 1280x900")
    args = ap.parse_args()

    tmp = tempfile.mkdtemp()
    checks = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page(viewport={"width": 390, "height": 844})

        post = load(args.target, tmp, "post.html")
        print(f"target: {post}")
        for w in PHONES:
            r = run_probe(page, post, w, 844, OVERFLOW_PROBE)
            ok = r["docSW"] <= r["iw"] + 1 and not r["pageLevel"]
            checks.append((f"{w}px: scrollWidth({r['docSW']}) <= innerWidth({r['iw']}) and 0 page-level offenders", ok,
                           json.dumps(r["pageLevel"][:4])))
            print(f"  {w}px  docSW={r['docSW']} iw={r['iw']} pageLevelOffenders={len(r['pageLevel'])} "
                  f"clippedByWrapper={r['clippedCount']}")
            for o in r["pageLevel"][:4]:
                print("      OFFENDER", o)

            if w == 390:
                reach = page.evaluate(REACH_PROBE)
                wide = [x for x in r["wraps"] if x["tW"] and x["tW"] > x["cw"] + 1]
                print(f"  table wraps: {len(r['wraps'])} total, {len(wide)} wider than their wrapper")
                for x in r["wraps"]:
                    print(f"      wrap[{x['i']}] wrapper {x['wW']}px (right {x['wRight']}, over={x['wOverflowsViewport']}) "
                          f"table {x['tW']}px clientW {x['cw']} scrollW {x['sw']} scrollable={x['internallyScrollable']}")
                checks.append(("390px: every wrapper whose table is wider scrolls internally",
                               all(x["internallyScrollable"] for x in wide), f"{len(wide)} wide wraps"))
                checks.append(("390px: no wrapper itself overflows the viewport",
                               all(not x["wOverflowsViewport"] for x in r["wraps"]), ""))
                for rr in reach:
                    checks.append((f"390px: wrap[{rr['i']}] far-right header {rr['lastHeader']!r} reachable in-viewport",
                                   rr["insideViewport"],
                                   f"scrollLeft={rr['scrollLeft']}/{rr['maxScrollLeft']} right={rr['lastCellRight']}"))

        if args.compare:
            pre = load(args.compare, tmp, "pre.html")
            print(f"\ndesktop-neutrality comparison {pre} vs {post} at {DESKTOP[0]}x{DESKTOP[1]}")
            fps = {}
            for label, url in (("pre", pre), ("post", post)):
                fp = run_probe(page, url, DESKTOP[0], DESKTOP[1], FP_PROBE)
                fps[label] = fp
                print(f"  {label}: id-elements={len(fp['idEls'])} all-elements={fp['allCount']} wbr={fp['wbr']} "
                      f"docH={fp['docH']} docSW={fp['docSW']} tables={len(fp['tables'])} "
                      f"computedOverflowWrap={fp['overflowWrapApplied']}")

            pre_ids = {e: None for e in fps["pre"]["idEls"]}
            post_ids = {e: None for e in fps["post"]["idEls"]}
            drifted, gone = [], []
            for e in fps["pre"]["idEls"]:
                parts = e.split("|")
                # match on tag|id, compare the four geometry numbers with a 1px tolerance
                cand = [x for x in fps["post"]["idEls"] if x.split("|")[:2] == parts[:2]]
                if not cand:
                    gone.append(e)
                    continue
                nums = [int(x) for x in parts[2:]]
                cn = [int(x) for x in cand[0].split("|")[2:]]
                if max(abs(a - b2) for a, b2 in zip(nums, cn)) > 1:
                    drifted.append((e, cand[0]))
            print(f"  id-bearing elements: {len(fps['pre']['idEls'])} pre / {len(fps['post']['idEls'])} post; "
                  f"{len(drifted)} drifted >1px; {len(gone)} missing")
            for d in drifted[:5]:
                print("      DRIFT", d)
            checks.append(("desktop: every id-bearing element keeps its box to within 1px",
                           not drifted and not gone and len(fps["pre"]["idEls"]) == len(fps["post"]["idEls"]),
                           json.dumps([d[0].split('|')[:2] for d in drifted[:4]] + gone[:2])))
            checks.append(("desktop: exactly one element added to the DOM besides the <wbr> break points",
                           fps["post"]["allCount"] - fps["pre"]["allCount"] == 1 + fps["post"]["wbr"],
                           f"all-elements {fps['pre']['allCount']} -> {fps['post']['allCount']} with {fps['post']['wbr']} wbr"))
            checks.append(("desktop: <wbr> break points excluded from the element fingerprint",
                           fps["post"]["wbr"] == 6 and fps["pre"]["wbr"] == 0,
                           f"pre {fps['pre']['wbr']} post {fps['post']['wbr']}"))
            checks.append(("desktop table column widths identical",
                           fps["pre"]["tables"] == fps["post"]["tables"], ""))
            checks.append(("desktop document height and scrollWidth identical",
                           fps["pre"]["docH"] == fps["post"]["docH"] and fps["pre"]["docSW"] == fps["post"]["docSW"],
                           f"h {fps['pre']['docH']}->{fps['post']['docH']} sw {fps['pre']['docSW']}->{fps['post']['docSW']}"))
            checks.append(("desktop: the new overflow-wrap rule is actually in effect",
                           fps["post"]["overflowWrapApplied"] == "break-word", fps["post"]["overflowWrapApplied"]))
        b.close()

    print()
    ok = 0
    for name, cond, detail in checks:
        print(("PASS " if cond else "FAIL ") + name + ("" if cond else f" — {detail}"))
        ok += bool(cond)
    print(f"\nRESULT: {ok}/{len(checks)}")
    return 0 if ok == len(checks) else 1


if __name__ == "__main__":
    sys.exit(main())
