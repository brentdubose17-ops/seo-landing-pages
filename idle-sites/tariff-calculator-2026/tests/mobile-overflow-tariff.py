#!/usr/bin/env python3
"""Card-local verification for tariffcalculator2026.com phone-width overflow.

  python3 verify_tariff.py <target.html|url> [--compare <pre.html|pre-url>] [--json out.json]

Why this exists next to the copied tests/mobile-overflow-390.py:
  * that script's .table-wrap checks are vacuous on pages that use no wrapper
    (it iterates document.querySelectorAll('.table-wrap') only), and its desktop
    fingerprint is hard-coded to the aiagencycalculator fix (asserts exactly 6
    <wbr>s, exactly one added element, and a <code> element must exist).
  * this harness measures the mechanism actually shipped on this site:
    a table that is its own horizontal scroll container (display:block +
    overflow-x:auto inside a phone media query), and verifies every table's
    far-right header is reachable INSIDE the viewport.

Checks
  phone 320/360/390/414 : documentElement.scrollWidth <= innerWidth+1 and
                          0 page-level offenders (unbreakable text tokens count:
                          they are reported separately)
  reach                 : for every table, scroll fully right; the last header
                          cell of the first row must be within the viewport.
                          Tables that fit report maxScrollLeft == 0 (nothing to
                          reach) and must have all cells in-viewport.
  desktop (with --compare): every id-bearing element box within 1px, identical
                          table column widths, identical docH/docSW, identical
                          element count.
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

PROBE = r"""() => {
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
      pageLevel.push({tag: el.tagName, id: el.id || '',
                      cls: (el.className || '').toString().slice(0, 40),
                      right: Math.round(r.right), over: Math.round(r.right - iw),
                      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)});
    }
  });
  const tokens = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.nodeValue || '';
    if (t.trim().length < 12) continue;
    const re = /\S+/g;
    let m;
    while ((m = re.exec(t))) {
      const rng = document.createRange();
      rng.setStart(node, m.index);
      rng.setEnd(node, m.index + m[0].length);
      const rects = rng.getClientRects();
      if (!rects.length) continue;
      const right = Math.max(...[...rects].map(r => r.right));
      if (right - iw > 1) {
        if (node.parentElement && clips(node.parentElement)) { clippedCount += 1; continue; }
        tokens.push({tok: m[0].slice(0, 70), len: m[0].length, right: Math.round(right),
                     over: Math.round(right - iw),
                     parent: node.parentElement ? node.parentElement.tagName : ''});
      }
    }
  }
  const tables = [...document.querySelectorAll('table')].map((t, i) => {
    const pr = t.getBoundingClientRect();
    return {i, w: Math.round(pr.width), right: Math.round(pr.right),
            cw: t.clientWidth, sw: t.scrollWidth,
            maxScrollLeft: Math.round(t.scrollWidth - t.clientWidth),
            display: getComputedStyle(t).display,
            ownOverflowX: getComputedStyle(t).overflowX,
            parentTag: t.parentElement ? t.parentElement.tagName : '',
            parentCls: t.parentElement ? (t.parentElement.className || '').toString().slice(0, 30) : ''};
  });
  return {iw, docSW: document.documentElement.scrollWidth, pageLevel, clippedCount, tokens, tables};
}
"""

# scroll every table fully right, then measure the last header cell of the first row
REACH = r"""() => {
  const iw = window.innerWidth;
  const out = [];
  document.querySelectorAll('table').forEach((t, i) => {
    const maxSL = t.scrollWidth - t.clientWidth;
    if (maxSL > 1) t.scrollLeft = maxSL;
    const row = t.querySelector('tr');
    const cells = row ? row.children : [];
    const last = cells[cells.length - 1];
    const r = last ? last.getBoundingClientRect() : null;
    const allCells = [...t.querySelectorAll('tr:first-child > *')].map(c => c.getBoundingClientRect());
    out.push({i,
              scrollLeft: Math.round(t.scrollLeft), maxScrollLeft: Math.round(maxSL),
              scrollable: maxSL > 1,
              lastHeader: last ? (last.textContent || '').trim().slice(0, 28) : '',
              lastLeft: r ? Math.round(r.left) : null,
              lastRight: r ? Math.round(r.right) : null,
              lastInside: r ? (r.left >= -1 && r.right <= iw + 1) : null,
              allCellsInside: allCells.every(c => c.left >= -1 && c.right <= iw + 1)});
  });
  return out;
}
"""

FP = r"""() => {
  const idEls = [];
  document.querySelectorAll('body *').forEach(el => {
    if (!el.id) return;
    const r = el.getBoundingClientRect();
    idEls.push([el.tagName, el.id, Math.round(r.left), Math.round(r.top),
                Math.round(r.width), Math.round(r.height)].join('|'));
  });
  const tables = [...document.querySelectorAll('table')].map(t =>
    [...t.querySelectorAll('tr:first-child > *')].map(c => Math.round(c.getBoundingClientRect().width)).join(','));
  return {idEls, tables,
          allCount: document.querySelectorAll('body *').length,
          docH: document.documentElement.scrollHeight,
          docSW: document.documentElement.scrollWidth};
}
"""


def load(path, tmp, name):
    if path.startswith(("http://", "https://")):
        return path
    dst = os.path.join(tmp, name)
    shutil.copy(path, dst)
    return "file://" + dst


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("target")
    ap.add_argument("--compare")
    ap.add_argument("--json")
    ap.add_argument("--widths", default="320,360,390,414")
    args = ap.parse_args()
    phones = [int(x) for x in args.widths.split(",")]

    checks = []
    report = {}
    tmp = tempfile.mkdtemp()
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 390, "height": 844})
        page = await_newpage(ctx)
        post = load(args.target, tmp, "post.html")
        print(f"target: {post}")
        per_width = {}
        for w in phones:
            page.set_viewport_size({"width": w, "height": 844})
            if post.startswith("file://"):
                page.goto(post, wait_until="load", timeout=60000)
            else:
                page.goto(post, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(800)
            r = page.evaluate(PROBE)
            reach = page.evaluate(REACH)
            ok = r["docSW"] <= r["iw"] + 1 and not r["pageLevel"] and not r["tokens"]
            per_width[w] = {"docSW": r["docSW"], "iw": r["iw"],
                            "pageLevel": r["pageLevel"], "tokens": r["tokens"],
                            "tables": r["tables"], "reach": reach}
            print(f"  {w}px docSW={r['docSW']} iw={r['iw']} pageLevel={len(r['pageLevel'])} "
                  f"tokens={len(r['tokens'])} clipped={r['clippedCount']} tables={len(r['tables'])}")
            for o in r["pageLevel"][:3]:
                print("     OFF", o)
            for t in r["tokens"][:3]:
                print("     TOK", t)
            checks.append((f"{w}px: scrollWidth({r['docSW']}) <= innerWidth({r['iw']}) and 0 page-level offenders/tokens",
                           ok, json.dumps(r["pageLevel"][:2] + r["tokens"][:2])))
            scrollable = [x for x in reach if x["scrollable"]]
            fits = [x for x in reach if not x["scrollable"]]
            bad_reach = [x for x in scrollable if not x["lastInside"]]
            bad_fit = [x for x in fits if not x["allCellsInside"]]
            print(f"     tables: {len(reach)} ({len(scrollable)} scroll internally, {len(fits)} fit) "
                  f"worst maxScrollLeft={max([x['maxScrollLeft'] for x in reach], default=0)}")
            for x in scrollable[:4]:
                print(f"       scroll tbl#{x['i']} maxSL={x['maxScrollLeft']} lastHeader={x['lastHeader']!r} "
                      f"lastRight={x['lastRight']} inside={x['lastInside']}")
            checks.append((f"{w}px: every internally-scrollable table's far-right header reachable in-viewport",
                           not bad_reach, json.dumps(bad_reach[:3])))
            checks.append((f"{w}px: every non-scrolling table has all first-row cells in-viewport",
                           not bad_fit, json.dumps(bad_fit[:3])))
        report["phone"] = {str(k): v for k, v in per_width.items()}

        if args.compare:
            pre = load(args.compare, tmp, "pre.html")
            print(f"\ndesktop fingerprint {DESKTOP[0]}x{DESKTOP[1]}: {pre}  vs  {post}")
            fps = {}
            for label, url in (("pre", pre), ("post", post)):
                page.set_viewport_size({"width": DESKTOP[0], "height": DESKTOP[1]})
                page.goto(url, wait_until="load" if url.startswith("file://") else "domcontentloaded", timeout=60000)
                page.wait_for_timeout(800)
                fp = page.evaluate(FP)
                fps[label] = fp
                print(f"  {label}: ids={len(fp['idEls'])} elements={fp['allCount']} "
                      f"tables={len(fp['tables'])} docH={fp['docH']} docSW={fp['docSW']}")
            drifted, gone = [], []
            for e in fps["pre"]["idEls"]:
                parts = e.split("|")
                cand = [x for x in fps["post"]["idEls"] if x.split("|")[:2] == parts[:2]]
                if not cand:
                    gone.append(e)
                    continue
                nums = [int(x) for x in parts[2:]]
                cn = [int(x) for x in cand[0].split("|")[2:]]
                if max(abs(a - b2) for a, b2 in zip(nums, cn)) > 1:
                    drifted.append((e, cand[0]))
            print(f"  id-bearing elements {len(fps['pre']['idEls'])} pre / {len(fps['post']['idEls'])} post; "
                  f"{len(drifted)} drifted >1px; {len(gone)} missing")
            for d in drifted[:5]:
                print("     DRIFT", d)
            checks.append(("desktop: every id-bearing element keeps its box within 1px",
                           not drifted and not gone and
                           len(fps["pre"]["idEls"]) == len(fps["post"]["idEls"]),
                           json.dumps([d[0].split("|")[:2] for d in drifted[:4]] + gone[:2])))
            checks.append(("desktop: table column widths identical",
                           fps["pre"]["tables"] == fps["post"]["tables"],
                           json.dumps({"pre": fps["pre"]["tables"], "post": fps["post"]["tables"]})[:300]))
            checks.append(("desktop: document height and scrollWidth identical",
                           fps["pre"]["docH"] == fps["post"]["docH"] and
                           fps["pre"]["docSW"] == fps["post"]["docSW"],
                           f"h {fps['pre']['docH']}->{fps['post']['docH']} "
                           f"sw {fps['pre']['docSW']}->{fps['post']['docSW']}"))
            checks.append(("desktop: DOM element count identical (CSS-only change)",
                           fps["pre"]["allCount"] == fps["post"]["allCount"],
                           f"{fps['pre']['allCount']} -> {fps['post']['allCount']}"))
            report["desktop"] = {"pre": fps["pre"], "post": fps["post"],
                                 "drifted": drifted[:5], "gone": gone[:5]}
        b.close()

    print()
    ok = 0
    for name, cond, detail in checks:
        print(("PASS " if cond else "FAIL ") + name + ("" if cond else f" — {detail}"))
        ok += bool(cond)
    print(f"\nRESULT: {ok}/{len(checks)}")
    report["checks"] = [{"name": n, "pass": bool(c), "detail": d} for n, c, d in checks]
    report["result"] = f"{ok}/{len(checks)}"
    if args.json:
        with open(args.json, "w") as fh:
            json.dump(report, fh, indent=1)
        print(f"json: {args.json}")
    return 0 if ok == len(checks) else 1


def await_newpage(ctx):
    return ctx.new_page()


if __name__ == "__main__":
    sys.exit(main())
