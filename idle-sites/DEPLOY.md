# Deploying a shared `~/seo-pages/idle-sites/<site>` directory

**Rule: never run `npx wrangler pages deploy <site-dir>` in a shared idle-sites
directory.** Use the one deploy path:

```
~/seo-pages/tools/deploy-idle-site.sh <site-key|site-dir> --files=<file[,file...]> [options]
```

That script is a thin front end: it translates its options and delegates to
`~/.hermes/scripts/publish-idle-site.py`, which owns staging, pruning, the
consistency gate, the per-project lock, the upload and the live verification.
There is exactly **one** implementation. Internals, the gate and the revert path
are documented in `~/.hermes/scripts/PUBLISH-IDLE-SITE.md`.

## Decision record (card `t_b9f85aaa`, 2026-09-10)

Two cards fixed the 2026-09-10 shared-directory deploy race independently and
both landed:

| card | what it landed |
|---|---|
| `t_c9f00cdb` | this front end (`tools/deploy-idle-site.sh`, worktree staging + dirty-file guard) and this doc; migrated the daily pipeline to it |
| `t_f589374f` | `publish-idle-site.py` (git-HEAD staging + prune + gate + flock + beacon-aware verify), `site_consistency.py`, `cf-beacon-strip.py`, `publish-baselines/`, `PUBLISH-IDLE-SITE.md` |

Two paths meant two answers to "which files may ship", and the docs disagreed.
**Decision taken by `t_b9f85aaa`: keep `deploy-idle-site.sh` as the single entry
point (it is what the cron and both pipeline scripts call) and make it delegate
to `publish-idle-site.py`, so the stronger semantics win and there is one
implementation.** The pre-consolidation wrapper (worktree staging, `--files`
only, no gate, no pruning, raw-sha live check) was deleted, not kept in parallel.

Decisions taken with it:

1. **Staging is from `git HEAD`** (+ the worktree bytes of the files this run
   declares). An undeclared in-flight edit is structurally unpublishable.
2. **Undeclared dirty files no longer block.** The staged artifact carries their
   `HEAD` bytes (tracked) or omits them (untracked). The deploy proceeds with
   this run's own files — a sibling's half-written page can neither ship nor
   stop the daily pipeline.
3. **One prune policy** (`publish-idle-site.py`'s exclude lists, below). The old
   front end shipped the whole staged tree, so the two paths used to flip
   production's `tests/`, `full/`, `deploy_main/`, `.wrangler/` and
   `CHANGELOG.md` back and forth on alternate runs. Both directions are now the
   same direction: those paths stay out of the artifact.
4. **The consistency gate runs before every upload** and a non-zero gate refuses
   the deploy. Per-site baselines hold only pre-existing defects of other
   owners' pages; see "The consistency gate" below.
5. **Live comparison is beacon-aware**: CF injects a Web Analytics beacon into
   HTML responses on custom domains, so only beacon-stripped hashes are compared.

## Why this rule exists

`wrangler pages deploy <dir>` uploads the **whole working tree**. Several
idle-sites directories are shared: kanban cards edit pages in them while the
daily content pipeline writes new articles into the same directories, and both
deploy from the same tree. A whole-dir deploy therefore ships another worker's
uncommitted, in-flight edit to production, untouched and unverified.

Incident, 2026-09-10 (cards `t_31dba7b3` / `t_88a5cfa3`, follow-ups `t_c9f00cdb`,
`t_f589374f`, `t_b9f85aaa`): `wrangler pages deploy .` from
`idle-sites/tariff-calculator-2026` published `canada-september-8-counter-tariffs.html`
as it existed on disk at 12:11Z — an intermediate state of another card's
still-running rewrite. The live page was left internally inconsistent (new banner
+ "Updated September 10, 2026" meta, but JSON-LD `dateModified` and parts of the
body still the older copy) and had to be re-deployed by its owner.

## What the path does

1. **Stage from `git HEAD`.** `git archive HEAD:idle-sites/<site>` into a clean
   temp dir. Bytes that are not committed cannot reach the upload.
2. **Overlay this run's files.** Every path in `--files` (and every path matched
   by `--allow-dirty`) is copied from the working tree over the staged snapshot —
   that is the work this run owns, including brand-new untracked articles.
3. **Reconcile with what is live.** An uncommitted file whose worktree bytes are
   byte-identical to the live page is carried forward (so an already-published
   but uncommitted change is not rolled back); one that differs is a genuine
   in-flight edit and stays at `HEAD`.
4. **Prune** the excluded paths (see "Prune policy").
5. **Gate.** `site_consistency.py` over the staged artifact + sitemap; non-zero ⇒
   `REFUSING TO PUBLISH`, nothing is uploaded, exit 1.
6. **Deploy** from the staging dir under a per-project `flock` (so two workers
   cannot deploy the same project at the same time).
7. **Verify** (with `--verify-live`): re-fetch every staged asset and compare
   **beacon-stripped** sha256; CF Pages control files are skipped.

| file state | what ships |
|---|---|
| `--files` declared | worktree bytes (this run's own work) |
| `--allow-dirty` glob | worktree bytes, logged loudly as `[undeclared, SHIPPED …]` |
| `--exclude-dirty` glob | held back — tracked file reset to `HEAD` bytes, untracked dropped (now automatic for undeclared files) |
| undeclared dirty, already live byte-for-byte | worktree bytes (no live change) |
| undeclared dirty, not live | **the `HEAD` bytes ship; the in-flight edit does not** (no block, no leak) |
| committed, unchanged | committed bytes |

## Options

```
--files=a,b              (required, repeatable) files this deploy owns, relative to the site dir
--project-name=NAME      CF Pages project (default: site key)
--branch=BRANCH          default main = PRODUCTION; anything else is a preview deployment
--base-url=URL           live origin for the uncommitted-file comparison and --verify-live
--allow-dirty=GLOB[..]   undeclared dirty files matching these globs ALSO ship from the worktree
--exclude-dirty=GLOB[..] accepted for compatibility; undeclared files are already held at HEAD
--no-live-check          do not compare uncommitted files against live bytes
--dry-run                stage + gate + report, no upload
--verify-live            after deploy, re-fetch the whole manifest and compare beacon-stripped sha256
--keep-stage             keep the staging dir and print its path
--log=FILE               audit log (default ~/.hermes/logs/idle-site-deploys.log)
```

Exit codes: `0` ok · `1` gate refusal / deploy failure / live mismatch · `2` usage
error. (`2` used to mean "guard blocked"; nothing blocks any more — undeclared
content simply cannot ship.)

## Examples

```
# deploy only the page this card owns, and verify it live
~/seo-pages/tools/deploy-idle-site.sh tariff-calculator-2026 \
  --files=canada-september-8-counter-tariffs.html --verify-live \
  --base-url=https://tariffcalculator2026.com

# see exactly what would ship, upload nothing
~/seo-pages/tools/deploy-idle-site.sh findaiagency --files=index.html --dry-run

# upload a throwaway preview deployment (production alias untouched)
~/seo-pages/tools/deploy-idle-site.sh findaiagency --files=index.html \
  --branch=guard-test-$(date -u +%Y%m%d%H%M%S)
```

## Prune policy (one policy, both callers)

Excluded from the artifact by `publish-idle-site.py`:

* dead weight: `tests/`, `full/`, `deploy_main/`, `.wrangler/`, `node_modules/`,
  `__pycache__/`, `.venv/`, `.idea/`, `.git/`
* internal files: `CHANGELOG.md`, `.DS_Store`, `*.bak*`, `*.orig`, `*.rej`,
  `*.tmp`, `*.swp`, `*~`

Evidence and the reasoning are in `PUBLISH-IDLE-SITE.md` (`/tests/` and
`/CHANGELOG.md` were publicly served and are not part of the public contract;
`/full/*` is already a `301` in `_redirects`). Per-site overrides:
`~/.hermes/scripts/publish-registry.json` → `extra_exclude` (add paths) and
`keep` (rescue a path from the global list).

Consequences to be aware of:

* Removed paths stop being served by the new deployment. Verified 2026-09-10 on
  a preview deployment: `/CHANGELOG.md`, `/tests/*`, `/deploy_main/*`,
  `/.wrangler/*` return the CF Pages single-page fallback (the homepage with a
  `200`) and `/full/*` returns `308`.
* Because there is no `404.html`, **an unknown path 200s with the homepage** —
  never judge "is this file served?" by the status code, compare content hashes
  against `/`.
* A path that was served before the prune can still be reachable **from the
  custom domain** for up to the asset's edge cache TTL (`s-maxage=604800` =
  7 days) even though the deployment no longer contains it. Verified 2026-09-10:
  `https://tariffcalculator2026.com/CHANGELOG.md` served a stale cached copy
  (`cf-cache-status: DYNAMIC`) while the deployment's own origin
  (`https://<deployment>/CHANGELOG.md`) already returned the fallback. When
  checking removed paths, use the deployment URL, not the custom domain.

## The consistency gate

Runs on the staged artifact before the upload:

| check | catches |
|---|---|
| `json-ld` | a page with no/unparseable JSON-LD |
| `h1` | not exactly one `<h1>` |
| `faq` | visible FAQ questions ≠ `FAQPage` `mainEntity` questions |
| `dates` | invalid/absent `dateModified`, `dateModified < datePublished`, visible "Updated …" byline ≠ `dateModified` |
| `sitemap` | a `<loc>` with no file in the publish set |

The `dates` mirror-pair check and the `faq` check are the ones that catch the
2026-09-10 incident shape (new copy + stale `dateModified`; schema advertising
Q&As the page does not show).

**Baselines.** Genuine pre-existing defects on pages owned by other profiles
(content, not infra) are recorded per site in
`~/.hermes/scripts/publish-baselines/<site>.json` and printed as `[BASE]`
instead of blocking. A baselined *file* is not blanketed: a **new** failure of a
different check on it still blocks, a **new file** can never be baselined, and a
fixed entry is reported as stale so it can be deleted. Current state
(2026-09-10):

| site | baseline | content |
|---|---|---|
| `tariff-calculator-2026` | 0 entries (deliberately empty) | the three defects found when the gate landed were fixed by `t_a52f170c` |
| `findaiagency` | 27 files, 32 issues | `dates` + `faq` + `json-ld`/`h1` on old articles — filed to content-ops by `t_b9f85aaa` |
| `ai-agency-pricing-calculator` | 12 files, 13 issues | same |
| `mybusiness-ai-audit` | 7 files, 7 issues | same |

A gate failure is never ignored: it prints the failing files, refuses the
upload, exits 1, and lands in `logs/publish-idle-site.log`.

## Live verification and the Cloudflare beacon

The CF edge injects a Web Analytics beacon into HTML responses **on custom
domains**, so raw live bytes never equal the uploaded bytes. Measured
2026-09-10 on `tariffcalculator2026.com` (see `cf-beacon-strip.py`):

| fetch shape | beacon |
|---|---|
| `Accept: */*` (curl's default) | absent — a raw comparison *appears* to work |
| no `Accept` header (python `urllib`, the publisher's verifier) | **present, +367 B** |
| `*.pages.dev` (deployment origin) | absent |

So the live comparison — the "already live byte-for-byte" classification *and*
`--verify-live` — always compares **beacon-stripped** sha256. Evidence from this
card: against production, the publisher's verifier reported 39 checked / 0
mismatches with `_redirects` skipped, while the same fetches compared raw
reported **32 of 39 DIFFERENT**.

Two further verifier details:

* **CF Pages control files are skipped** (`_redirects`, `_headers`,
  `_routes.json`, `_worker.js`, `_middleware.js`, `functions/`, `.wrangler/`):
  the platform consumes them, they are never served as assets, and comparing
  them is a guaranteed false mismatch.
* **A mismatch is re-fetched** (up to 3 attempts, 5s apart) because the edge can
  still serve the previous deployment's copy of an asset for a few seconds after
  a deploy. Observed live on 2026-09-10: `og-image.png` mismatched immediately
  after a preview deploy and matched 30s later; three pages also needed a retry
  against production. Without the retry these are reported as verification
  failures.

## Who calls it

* `~/.hermes/scripts/all-sites-content.py` — daily ALL-SITES pipeline (content
  sites: `findaiagency`, `ai-agency-pricing-calculator`, `mybusiness-ai-audit`,
  `tariff-calculator-2026`) via `deploy_guarded()`, which passes
  `--files=<slug>.html --project-name=<cf_project> --branch=main --base-url=<domain>`.
  Cron: `content-all-sites-morning-v2` / `content-all-sites-evening` through
  `all-sites-pipeline.sh`.
* `~/.hermes/scripts/idle-site-content.py` — `deploy_to_cloudflare()`.
* Anyone deploying an idle-sites directory by hand.

Never re-introduce a bare `wrangler pages deploy <shared-site-dir>` in these
scripts.

## Audit trail

| path | content |
|---|---|
| `~/.hermes/logs/idle-site-deploys.log` | one line per front-end run (`DELEGATED-OK` / `DELEGATED-DRYRUN` / `DELEGATED-FAIL`) |
| `~/.hermes/scripts/logs/publish-idle-site.log` | structured JSONL from the publisher (published / blocked-by-gate / live-mismatch / dry-run) |
| `~/.hermes/scripts/logs/publish-manifest-<site>.json` | the last run's full manifest: staged files, sha256, gate result, deployment id, live verification |

Both logs are append-only, and everything that goes through either path is
recorded (verified 2026-09-10: every production deployment of the tariff project
that day appears in `publish-idle-site.log`, including the two made by
content-ops). A deploy that bypasses both paths — a hand-run `wrangler pages
deploy` from a copy of the tree — would be invisible. If you deploy by hand, go
through this front end so the audit trail stays complete.

## Known remaining gaps

* `~/digital-landlord/sites/*` (rent fleet) deploys are still whole-dir
  (`all-sites-content.py`, rent branch) and ungated. Same hazard class, different
  tree — migrate when those dirs become shared.
* Legacy one-off scripts (`~/.hermes/scripts/deploy-claude-opus46.sh`,
  `deploy-backlink-run-20260821.sh`) still deploy whole dirs; route them through
  this front end before reusing them.
* A site directory that is **not committed at all** cannot be staged from `HEAD`;
  the publisher falls back to worktree staging and says so (this is how the
  `--dry-run` gate-refusal test above behaves). All four shared sites are
  committed, so this does not affect them.
* `--verify-live` re-fetches the whole manifest (~40 requests for the tariff
  site). It is opt-in, so the pipeline never pays for it; use it for hand
  releases.
