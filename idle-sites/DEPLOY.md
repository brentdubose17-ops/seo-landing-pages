# Deploying a shared `~/seo-pages/idle-sites/<site>` directory

**Rule: never run `npx wrangler pages deploy <site-dir>` in a shared idle-sites directory.**
Use the guard/staging wrapper:

```
~/seo-pages/tools/deploy-idle-site.sh <site-key|site-dir> --files=<file[,file...]> [options]
```

## Why this rule exists

`wrangler pages deploy <dir>` uploads the **whole working tree**. Several idle-sites
directories are shared: kanban cards edit pages in them while the daily content pipeline
writes new articles into the same directories, and both deploy from the same tree. A
whole-dir deploy therefore ships another worker's uncommitted, in-flight edit to production,
untouched and unverified.

Incident, 2026-09-10 (cards `t_31dba7b3` / `t_88a5cfa3`, follow-up `t_c9f00cdb`):
`wrangler pages deploy .` from `idle-sites/tariff-calculator-2026` published
`canada-september-8-counter-tariffs.html` as it existed on disk at 12:11Z — an intermediate
state of another card's still-running rewrite. The live page was left internally inconsistent
(new banner + "Updated September 10, 2026" meta, but JSON-LD `dateModified` and parts of the
body still the older copy) and had to be re-deployed by its owner.

## What the wrapper does

1. **Guard.** Reads the site dir's git dirty set (tracked modified + untracked). Any dirty file
   that is not declared with `--files` **blocks the deploy (exit 2)** — nothing is uploaded —
   unless it is explicitly allowed, or its worktree bytes are already byte-identical to the
   live page (in which case shipping it cannot change production).
2. **Stage.** Copies the site dir into a clean temp dir and deploys *from there*, so what ships
   is exactly what the manifest shows:
   | file state | what ships |
   |---|---|
   | `--files` declared | worktree bytes (that is this task's own work) |
   | `--allow-dirty` glob | worktree bytes, logged loudly as `[undeclared, SHIPPED …]` |
   | `--exclude-dirty` glob | held back — tracked files reset to HEAD bytes, untracked files dropped |
   | undeclared dirty, live bytes == worktree bytes | worktree bytes (no live change) |
   | anything else | deploy blocked |
3. **Manifest + audit.** Prints the staged changes and the full staged file list
   (path, bytes, sha256) and appends a line to `~/.hermes/logs/idle-site-deploys.log`.

## Options

```
--files=a,b              (required, repeatable) files this deploy owns, relative to the site dir
--project-name=NAME      CF Pages project (default: site key)
--branch=BRANCH          default main = PRODUCTION; anything else is a preview deployment
--base-url=URL           live origin used for the "already live byte-for-byte" check and
                         --verify-live (default https://<project>.pages.dev)
--allow-dirty=GLOB[..]   undeclared dirty files matching these globs ship as-is (escape hatch)
--exclude-dirty=GLOB[..] undeclared dirty files matching these globs are held back
--no-live-check          do not classify undeclared dirty files against live bytes (strict)
--dry-run                guard + stage + manifest, no upload
--verify-live            after a production deploy, curl the declared files and compare sha256
--keep-stage             keep the staging dir and print its path
--log=FILE               audit log (default ~/.hermes/logs/idle-site-deploys.log)
```

Exit codes: `0` ok · `2` blocked by the guard (nothing deployed) · `3` deploy/verify failure.

## Examples

```
# deploy only the page this card owns (blocks if anything else in the dir is dirty)
~/seo-pages/tools/deploy-idle-site.sh tariff-calculator-2026 \
  --files=canada-september-8-counter-tariffs.html --verify-live

# dry run: see exactly what would ship
~/seo-pages/tools/deploy-idle-site.sh findaiagency --files=index.html --dry-run

# hold a genuinely in-flight file back instead of shipping it
~/seo-pages/tools/deploy-idle-site.sh tariff-calculator-2026 --files=index.html \
  --exclude-dirty='canada-*.html'
```

`--allow-dirty` and `--exclude-dirty` are explicit, per-run escape hatches and are logged in the
audit trail with the list of files they affected. Prefer declaring the files you own; a block is
the guard working, not a failure.

## Who calls it

* `~/.hermes/scripts/all-sites-content.py` — daily ALL-SITES pipeline (content sites:
  `findaiagency`, `ai-agency-pricing-calculator`, `mybusiness-ai-audit`,
  `tariff-calculator-2026`). `deploy_guarded()` wraps this tool and reports
  `BLOCKED BY DEPLOY GUARD` in the pipeline log instead of deploying. (Rent sites under
  `~/digital-landlord/sites` are a different tree and are not covered by this guard.)
* `~/.hermes/scripts/idle-site-content.py` — `deploy_to_cloudflare()` uses the same wrapper.
* Anyone deploying an idle-sites directory by hand.

## Verifying

```
tail -20 ~/.hermes/logs/idle-site-deploys.log      # audit trail
```

A production deployment must show `DEPLOYED … branch=main`; a blocked run shows `BLOCKED …` and
changed nothing. `--verify-live` re-fetches each declared page after the upload and compares
sha256 with the staged bytes.

## Known remaining gaps

* `~/digital-landlord/sites/*` (rent fleet) deploys are still whole-dir (`all-sites-content.py`,
  rent branch). Same hazard class, different tree — migrate when those dirs become shared.
* Legacy one-off scripts (`~/.hermes/scripts/deploy-claude-opus46.sh`,
  `deploy-backlink-run-20260821.sh`) still deploy whole dirs; route them through this wrapper
  before reusing them.
* The wrapper stages the full site dir (same file set production already serves, minus held-back
  files). It does not yet prune known dead weight (`full/`, `deploy_main/`, `tests/`,
  `.wrangler/`) from the upload — that would change live URLs and is a separate change.
