#!/usr/bin/env python3
"""Page gate for the ~/seo-pages repo — the check behind the pre-commit hook.

Card t_34e42066. The writers gate themselves now (`seo_page_gate.gate_or_quarantine`
in all-sites-content.py / idle-site-content.py / rent-site-city-content.py, and
seo-pipeline.py before them), but nothing stopped a *commit* of bytes no writer
produced: a hand-written deploy script, an agent editing a page with write_file,
a future generator that forgets the gate. On 2026-09-10 eleven committed, live
pages were 2-5 KB of truncated model output; three rendered as browser defaults.

WHAT THIS CHECKS (and why it is not the writers' rule set)
----------------------------------------------------------
  * `finish_reason`            n/a here — a file on disk has no finish_reason
  * ends with </body></html>   yes  (the actual truncation symptom)
  * a <title>                  yes
  * a <style>/stylesheet       yes  (house rule, t_911c6a0b; measured clean in scope)
  * minimum size               yes, but at 1000 B, not the writers' 4000 B
  * <!DOCTYPE html>            NO — warned only. 37 legitimate pages in this repo
                               open with `<html lang="en">` (measured 2026-09-11).
  * exactly one <h1>           NO — warned only. Pre-existing pages legitimately
                               carry two (8 such pages exist under rent sites).
Requiring either would block commits of pages that are fine, and a check that
cries wolf gets bypassed with --no-verify and then protects nothing.

SCOPE: staged .html files under all-sites/, findaiagency.com/, peptidesbeat.com/,
sparkdoc.app/ — the model-written root/blog trees, which have no publish-time gate
at all (they ship via wrangler in seo-pipeline.py / all-sites-content.py, not via
~/seo-pages/tools/deploy-idle-site.sh). idle-sites/ is deliberately OUT: measured
2026-09-11, 11 legitimate files there (redirect stubs in deploy-*/ and full/,
3 of them < 1 KB) would be blocked, and that tree already has two gates — the
writer gate and publish-idle-site.py's site_consistency gate at deploy time.

USAGE
    tools/check-staged-pages.py --staged        # what the pre-commit hook runs
    tools/check-staged-pages.py --all           # dry-run the whole scope
    tools/check-staged-pages.py PATH [PATH...]  # check worktree files
    tools/check-staged-pages.py --docs <file>   # check one file, print the rule set

EXIT: 0 = clean, 1 = at least one staged page failed (commit blocked),
      2 = usage. If the gate module itself cannot be imported the check is
      FAIL-OPEN (exit 0 with a loud warning): the writers still gate at
      generation time, and a broken interpreter must not freeze every agent
      working in this clone. Bypass a single commit with `git commit --no-verify`.
"""
from __future__ import annotations

import os
import subprocess
import sys

TREES = ("all-sites", "findaiagency.com", "peptidesbeat.com", "sparkdoc.app")
GATE_MODULE = os.path.expanduser("~/.hermes/scripts/seo_page_gate.py")
# 1000, not the writers' 4000: this check sees pages that already exist, and the
# smaller floor still catches a stub of mangled output while leaving room for a
# legitimate small page written by hand later.
MIN_BYTES = 1000


def repo_root() -> str:
    return subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True,
                          text=True, check=True).stdout.strip()


def load_gate():
    import importlib.util
    if not os.path.exists(GATE_MODULE):
        return None
    spec = importlib.util.spec_from_file_location("seo_page_gate", GATE_MODULE)
    if spec is None or spec.loader is None:
        return None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def in_scope(rel: str) -> bool:
    rel = rel.lstrip("./")
    return rel.endswith(".html") and rel.split("/", 1)[0] in TREES


def staged_paths(root: str) -> list[str]:
    out = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM", "-z", "--"]
        + [f"{t}/" for t in TREES],
        cwd=root, capture_output=True, text=True).stdout
    return [p for p in out.split("\0") if p and in_scope(p)]


def staged_text(root: str, rel: str) -> str:
    """The bytes being committed — the INDEX blob, never the worktree copy."""
    out = subprocess.run(["git", "show", f":{rel}"], cwd=root, capture_output=True)
    return out.stdout.decode("utf-8", "replace")


def main(argv: list[str]) -> int:
    args = argv[1:]
    gate = load_gate()
    if gate is None:
        print(f"  !! page gate SKIPPED (fail-open): {GATE_MODULE} not found. "
              f"The writers still gate at generation time; see PUBLISH-IDLE-SITE.md.")
        return 0

    try:
        root = repo_root()
    except Exception as exc:
        print(f"  !! page gate SKIPPED (fail-open): not in a git repo ({exc})")
        return 0

    if "--docs" in args:
        print(f"scope trees : {', '.join(TREES)}")
        print(f"min_bytes   : {MIN_BYTES}")
        print("required    : </body>, </html>, <title>, a <style> or stylesheet link")
        print("warn-only   : <!DOCTYPE html>, exactly one <h1>")
        return 0

    pairs: list[tuple[str, str]] = []          # (label, text)
    if "--all" in args:
        for tree in TREES:
            base = os.path.join(root, tree)
            for dirpath, dirnames, names in os.walk(base):
                dirnames[:] = [d for d in dirnames if not d.startswith(".")]
                for n in sorted(names):
                    if n.endswith(".html"):
                        p = os.path.join(dirpath, n)
                        with open(p, encoding="utf-8", errors="replace") as fh:
                            pairs.append((os.path.relpath(p, root), fh.read()))
    elif "--staged" in args or not args:
        pairs = [(rel, staged_text(root, rel)) for rel in staged_paths(root)]
    else:
        for a in args:
            if a.startswith("-"):
                continue
            rel = os.path.relpath(os.path.abspath(a), root)
            if not in_scope(rel):
                print(f"  - {rel}: out of scope ({'/'.join(TREES)}) — skipped")
                continue
            with open(a, encoding="utf-8", errors="replace") as fh:
                pairs.append((rel, fh.read()))

    if not pairs:
        print("  page gate: no in-scope .html staged — nothing to check")
        return 0

    failures = 0
    for label, text in pairs:
        res = gate.gate_html(text, path=label, min_bytes=MIN_BYTES,
                             require_doctype=False, require_single_h1=False)
        if res["ok"]:
            if res["warnings"]:
                for w in res["warnings"]:
                    print(f"  warn {label}: {w}")
            continue
        failures += 1
        print(f"  FAIL {label} ({res['bytes']} B)")
        for r in res["reasons"]:
            print(f"        - {r}")

    if failures:
        print(f"\n{failures} staged page(s) failed the page gate — commit refused.")
        print("This is the t_847b1e04 failure class: bytes that are not a complete, styled page.")
        print("Fix the file, or for a deliberate work-in-progress run: git commit --no-verify")
        print("Rule set + scope: python3 ~/seo-pages/tools/check-staged-pages.py --docs")
        print("Docs: ~/.hermes/scripts/PUBLISH-IDLE-SITE.md (pre-commit page gate)")
        return 1
    print(f"  page gate: {len(pairs)} file(s) checked, 0 failures")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
