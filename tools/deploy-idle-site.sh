#!/usr/bin/env bash
# deploy-idle-site.sh — THE single entry point for deploying a shared
# ~/seo-pages/idle-sites/<site> directory to Cloudflare Pages.
#
# CONSOLIDATION (card t_b9f85aaa, 2026-09-10)
# ------------------------------------------
# Two independent fixes for the 2026-09-10 shared-directory deploy race had
# landed: this wrapper (card t_c9f00cdb) and ~/.hermes/scripts/publish-idle-site.py
# (card t_f589374f). Two paths meant two answers to "which files may ship".
# This file is now a thin, option-compatible FRONT END for the Python publisher,
# which owns staging, pruning, the consistency gate, the per-project lock, the
# upload and the beacon-aware live verification. There is exactly ONE deploy
# implementation; this front end exists because the daily pipeline
# (all-sites-content.py) and idle-site-content.py call it, and because
# `--files=` is the ownership model those callers use.
#
# ORDER OF OPERATIONS IN THE PUBLISHER
#   1. stage the site tree from **git HEAD** into a clean temp dir
#      (an undeclared in-flight edit is structurally unpublishable),
#   2. overlay the worktree bytes of every file declared here (--files,
#      --allow-dirty) — that is this run's own work,
#   3. prune known dead weight (tests/, full/, deploy_main/, .wrangler/,
#      CHANGELOG.md, node_modules/, editor leftovers) — one prune policy,
#   4. generate the site's llms.txt index from the STAGED tree (additions-only,
#      card t_0521345c) — the entry ships in the SAME upload as the page, so the
#      idle lane needs no writer-side index edit and a HEAD-staged publish can no
#      longer revert one (the publisher's own --no-llms-sync skips it),
#   5. run the consistency gate (site_consistency.py) over the staged artifact;
#      a non-zero gate blocks the deploy and reports REFUSING TO PUBLISH,
#   6. deploy from the staging dir under a per-project flock,
#   7. re-fetch and compare edge-injection-canonicalised sha256 for the whole
#      manifest (--verify-live), skipping CF Pages control files; a file whose URL
#      a _redirects rule rewrites is verified against the file that URL serves and
#      reported as a visible `skip` (card t_040d3b82) instead of failing forever
#
# SEMANTICS CHANGE vs the pre-consolidation wrapper
#   * Undeclared dirty files no longer BLOCK (exit 2). They cannot ship at all:
#     the staged artifact carries their HEAD bytes (tracked) or omits them
#     (untracked). A sibling's in-flight edit is therefore not published *and*
#     does not stop this run — which is what the daily pipeline needs.
#   * --exclude-dirty=GLOB is now the automatic behaviour for undeclared files.
#     Accepted and logged; no additional effect. A tracked file is reset to HEAD,
#     an untracked file is dropped.
#   * --allow-dirty=GLOB still means "also ship the worktree bytes of the files
#     matching these globs"; it is translated to --include and logged loudly.
#   * The "already live byte-for-byte" comparison and --verify-live are
#     EDGE-INJECTION AWARE: CF injects a Web Analytics beacon into HTML responses
#     on custom domains (so a raw sha256 live check only ever matched by accident
#     of curl's default Accept header) and, on pages whose text carries an email
#     address, its Email Address Obfuscation markup whose per-response random key
#     made a beacon-only check impossible to satisfy (card t_d646632b). Both are
#     canonicalised by site_consistency.strip_cf_edge_injection().
#
# USAGE
#   deploy-idle-site.sh <site-key|site-dir> --files=<rel-path[,rel-path]> [options]
#
# OPTIONS
#   --files=a,b            REQUIRED. Files (relative to the site dir) this deploy
#                          owns; repeated flags allowed. New/untracked files fine.
#   --project-name=NAME    CF Pages project (default: the site key)
#   --branch=BRANCH        Default 'main' = PRODUCTION. Anything else is a preview
#                          deployment (production alias untouched; the live
#                          comparison is skipped because it targets production).
#   --base-url=URL         Live origin used for the uncommitted-file live
#                          comparison and --verify-live (default: the registry
#                          domain / https://<project>.pages.dev)
#   --allow-dirty=GLOB[..] Undeclared dirty files matching these globs are also
#                          shipped from the worktree (escape hatch, logged).
#   --exclude-dirty=GLOB[..] Accepted for compatibility; undeclared files are
#                          held at HEAD/dropped automatically now (logged).
#   --strict-include       Abort (rc 2) when --files names an EXCLUDED path
#                          (tests/, full/, deploy_main/, CHANGELOG.md,
#                          .wrangler/, editor leftovers) instead of ignoring it
#                          with a visible note + a publisher-log event (the
#                          default - card t_d5f7f382: "declare every changed
#                          file" made a correct run die silently).
#   --strict-dirty         Refuse to publish (rc 1) when a dirty file is LIVE
#                          byte-for-byte with its uncommitted worktree copy yet
#                          differs from HEAD. The publisher carries such a file
#                          forward, which only holds until a run that cannot
#                          compare live ships HEAD and rolls the page back - so
#                          with this flag it refuses until the file is committed.
#   --no-live-check        Do not compare uncommitted files against the live page.
#   --strict-redirects     Pass through to the publisher: treat an artifact whose
#                          own URL is rewritten by a _redirects rule as a hard
#                          live mismatch, instead of verifying it against the file
#                          that URL actually serves (card t_040d3b82).
#   --dry-run              Stage + gate + report; no upload.
#   --verify-live          After the deploy, re-fetch the whole manifest and
#                          compare edge-injection-canonicalised sha256 (exit 1 on
#                          mismatch). A LONE mismatch after a real content change
#                          is more often CF Pages edge propagation lag than a bad
#                          upload — the 3x5s retry window can be outlasted, so the
#                          publisher prints the pre-patch-sha discriminator with
#                          the FAIL and names the revert path LAST. Do not revert
#                          before running it (card t_616632d8).
#   --keep-stage           Keep the staging dir and print its path.
#   --log=FILE             Audit log of THIS front end
#                          (default ~/.hermes/logs/idle-site-deploys.log)
#   --log-dir=DIR          Passed through to the publisher as --log-dir: the
#                          publisher's own event log and manifest are written into
#                          DIR instead of ~/.hermes/scripts/logs (card t_120d3c85).
#                          For harnesses that drive this REAL front end and must
#                          read the events/manifest of their own run instead of a
#                          line window of the shared production log. Absent = the
#                          default path, and that default is asserted by
#                          tests/t_d5f7f382/test_publisher_regression.py.
#   -h | --help
#
# EXIT CODES  0 ok · 1 gate refusal / deploy failure / live mismatch · 2 usage error
#   (The old exit code 2 for "guard blocked" is gone: nothing blocks any more —
#    undeclared content simply cannot be published. Callers that special-cased
#    rc=2 still print the publisher's output, which carries the real diagnosis.)
#   rc=2 also covers a bad --files entry: a declared path that does not exist,
#   or (with --strict-include) one excluded by policy. A declared-but-EXCLUDED
#   path is otherwise IGNORED with a loud note and a publisher-log event
#   instead of killing the run (card t_d5f7f382).
#   Every non-zero exit is audited below as DELEGATED-FAIL with the publisher's
#   own `ERROR: ...` line, and the publisher logs an `aborted` event.
#
# Docs: ~/seo-pages/idle-sites/DEPLOY.md  (flow) ·
#       ~/.hermes/scripts/PUBLISH-IDLE-SITE.md (internals, gate, beacon, revert)
set -uo pipefail

PUBLISHER="$HOME/.hermes/scripts/publish-idle-site.py"
IDLE_DIR="$HOME/seo-pages/idle-sites"
LOG_DEFAULT="$HOME/.hermes/logs/idle-site-deploys.log"
# Where the PUBLISHER keeps its event log + manifests. Overridable with --log-dir
# for a harness (card t_120d3c85); the default is what production uses and is
# byte-identical to before that card.
PUB_LOG_DIR_DEFAULT="$HOME/.hermes/scripts/logs"
PUB_LOG_DIR="$PUB_LOG_DIR_DEFAULT"
PUB_LOG_DIR_SET=0
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

die() { echo "ERROR: $*" >&2; exit 2; }
usage() {
  # print the header comment block (everything before `set -uo pipefail`)
  sed -n "2,$(( $(grep -n '^set -uo pipefail' "$0" | head -1 | cut -d: -f1) - 1 ))p" "$0" \
    | sed 's/^# \{0,1\}//'
}

SITE_ARG=""
declare -a DECLARED=()
ALLOW_GLOBS=""
EXCLUDE_GLOBS=""
PROJECT=""
BRANCH="main"
BASE_URL=""
LIVE_CHECK=1
DRY_RUN=0
VERIFY_LIVE=0
STRICT_REDIRECTS=0
STRICT_INCLUDE=0
STRICT_DIRTY=0
KEEP_STAGE=0
LOG="$LOG_DEFAULT"

while [ $# -gt 0 ]; do
  case "$1" in
    --files=*)      IFS=',' read -r -a _f <<< "${1#--files=}"; DECLARED+=("${_f[@]}") ;;
    --files)        shift; IFS=',' read -r -a _f <<< "${1:-}"; DECLARED+=("${_f[@]}") ;;
    --allow-dirty=*)   ALLOW_GLOBS="${ALLOW_GLOBS}${ALLOW_GLOBS:+,}${1#--allow-dirty=}" ;;
    --exclude-dirty=*) EXCLUDE_GLOBS="${EXCLUDE_GLOBS}${EXCLUDE_GLOBS:+,}${1#--exclude-dirty=}" ;;
    --project-name=*)  PROJECT="${1#--project-name=}" ;;
    --branch=*)        BRANCH="${1#--branch=}" ;;
    --base-url=*)      BASE_URL="${1#--base-url=}" ;;
    --log=*)           LOG="${1#--log=}" ;;
    --log-dir=*)       PUB_LOG_DIR="${1#--log-dir=}"; PUB_LOG_DIR_SET=1
                       [ -n "$PUB_LOG_DIR" ] || die "--log-dir= needs a directory" ;;
    --log-dir)         shift; PUB_LOG_DIR="${1:-}"; PUB_LOG_DIR_SET=1
                       [ -n "$PUB_LOG_DIR" ] || die "--log-dir needs a directory" ;;
    --no-live-check)   LIVE_CHECK=0 ;;
    --strict-redirects) STRICT_REDIRECTS=1 ;;
    --strict-include)  STRICT_INCLUDE=1 ;;
    --strict-dirty)    STRICT_DIRTY=1 ;;
    --dry-run)         DRY_RUN=1 ;;
    --verify-live)     VERIFY_LIVE=1 ;;
    --keep-stage)      KEEP_STAGE=1 ;;
    -h|--help)         usage; exit 0 ;;
    -*)                die "unknown option $1 (try --help)" ;;
    *)                 [ -z "$SITE_ARG" ] && SITE_ARG="$1" || die "unexpected extra argument: $1" ;;
  esac
  shift
done

[ -n "$SITE_ARG" ] || { usage; exit 2; }
[ ${#DECLARED[@]} -gt 0 ] || die "--files=<rel-path[,rel-path]> is required (the files this deploy owns)"
[ -x "$PUBLISHER" ] || [ -f "$PUBLISHER" ] || die "publisher not found: $PUBLISHER"

# --- resolve + fence the site dir -------------------------------------------------------
case "$SITE_ARG" in
  /*) SITE_DIR="$SITE_ARG" ;;
  *)  SITE_DIR="$IDLE_DIR/$SITE_ARG" ;;
esac
[ -d "$SITE_DIR" ] || die "site dir not found: $SITE_DIR"
SITE_DIR="$(cd "$SITE_DIR" && pwd -P)"
IDLE_REAL="$(cd "$IDLE_DIR" && pwd -P)"
case "$SITE_DIR" in
  "$IDLE_REAL"/*) SITE_KEY="$(basename "$SITE_DIR")" ;;
  *) die "refusing to deploy a dir outside $IDLE_REAL (got $SITE_DIR)" ;;
esac
REPO="$(git -C "$SITE_DIR" rev-parse --show-toplevel 2>/dev/null)" || die "not inside a git repo: $SITE_DIR"
SITE_REL="${SITE_DIR#$REPO/}"

mkdir -p "$(dirname "$LOG")"
log_line() { echo "$TS $*" >> "$LOG"; }

# --- translate to the publisher's argv --------------------------------------------------
declare -a ARGS=("$SITE_DIR")
for f in "${DECLARED[@]}"; do
  case "$f" in /*|*..*) die "--files entry must be a path relative to the site dir: $f" ;; esac
  ARGS+=(--include "$f")
done
[ -n "$PROJECT" ] && ARGS+=(--project "$PROJECT")
[ -n "$BRANCH" ]  && ARGS+=(--branch "$BRANCH")
[ -n "$BASE_URL" ] && ARGS+=(--domain "$(echo "$BASE_URL" | sed -E 's#^https?://##; s#/+$##')")
[ "$DRY_RUN" = 1 ] && ARGS+=(--dry-run)
[ "$VERIFY_LIVE" != 1 ] && ARGS+=(--no-verify-live)
[ "$LIVE_CHECK" != 1 ] && ARGS+=(--no-live-dirty-check)
[ "$STRICT_REDIRECTS" = 1 ] && ARGS+=(--strict-redirects)
[ "$STRICT_INCLUDE" = 1 ] && ARGS+=(--strict-include)
[ "$STRICT_DIRTY" = 1 ]   && ARGS+=(--strict-dirty)
[ "$KEEP_STAGE" = 1 ] && ARGS+=(--keep-staging)
# card t_120d3c85: only forwarded when the caller asked for it, so an ordinary
# production invocation's argv is byte-identical to what it was before the seam.
[ "$PUB_LOG_DIR_SET" = 1 ] && ARGS+=(--log-dir "$PUB_LOG_DIR")

# --- undeclared dirty files: allow-dirty ships, everything else is held at HEAD ---------
dirty_rows="$(git -C "$REPO" status --porcelain -uall -- "$SITE_REL" 2>/dev/null)"
declare -a DIRTY=()
if [ -n "$dirty_rows" ]; then
  while IFS= read -r row; do
    [ -z "$row" ] && continue
    xy="${row:0:2}"; p="${row:3}"
    case "$p" in *" -> "*) p="${p##* -> }" ;; esac
    case "$p" in \"*) p="${p#\"}"; p="${p%\"}" ;; esac
    rel="${p#$SITE_REL/}"
    [ "$rel" = "$p" ] && continue
    DIRTY+=("$rel|$xy")
  done <<< "$dirty_rows"
fi

matches_any() { # $1 = path relative to the site dir, $2 = comma list of globs
  local p="$1" g
  [ -z "$2" ] && return 1
  IFS=',' read -r -a _globs <<< "$2"
  for g in "${_globs[@]}"; do
    [ -z "$g" ] && continue
    case "$p" in $g) return 0 ;; esac
    case "$(basename "$p")" in $g) return 0 ;; esac
  done
  return 1
}
is_declared() { local x; for x in "${DECLARED[@]}"; do [ "$x" = "$1" ] && return 0; done; return 1; }

declare -a ALLOWED=() EXCLUDED=() HELD=()
for row in "${DIRTY[@]:-}"; do
  [ -z "$row" ] && continue
  rel="${row%%|*}"; xy="${row##*|}"
  if is_declared "$rel"; then continue; fi          # this run's own file -> ships via --include
  if matches_any "$rel" "$EXCLUDE_GLOBS"; then EXCLUDED+=("$rel"); continue; fi
  if matches_any "$rel" "$ALLOW_GLOBS"; then ALLOWED+=("$rel"); ARGS+=(--include "$rel"); continue; fi
  HELD+=("$rel|$xy")
done

echo "== deploy-idle-site (front end) -> publish-idle-site.py   $TS"
echo "   site:     $SITE_KEY   ($SITE_DIR)"
echo "   declared: $(printf '%s ' "${DECLARED[@]}")"
[ -n "$ALLOW_GLOBS" ]   && echo "   --allow-dirty=$ALLOW_GLOBS"
[ -n "$EXCLUDE_GLOBS" ] && echo "   --exclude-dirty=$EXCLUDE_GLOBS"
if [ ${#ALLOWED[@]} -gt 0 ]; then
  echo
  echo "   [undeclared, SHIPPED via --allow-dirty]"
  for a in "${ALLOWED[@]}"; do echo "     - $a  (worktree bytes overlaid onto the staged HEAD snapshot)"; done
fi
if [ ${#EXCLUDED[@]} -gt 0 ]; then
  echo
  echo "   [--exclude-dirty: held back]"
  for e in "${EXCLUDED[@]}"; do echo "     - $e"; done
fi
if [ ${#HELD[@]} -gt 0 ]; then
  echo
  echo "   [undeclared dirty: NOT published — the committed HEAD bytes ship instead]"
  for h in "${HELD[@]}"; do
    if [ "${h%%|*}" = "llms.txt" ]; then
      echo "     - llms.txt  [${h##*|}]  (the publisher GENERATES this from the staged tree"
      echo "                 before the upload — card t_0521345c; nothing to declare)"
    else
      echo "     - ${h%%|*}  [${h##*|}]"
    fi
  done
  echo "   (this is the anti-race rule: another worker's in-flight edit cannot ship,"
  echo "    and it no longer blocks this deploy either)"
fi
echo

# --- delegate ---------------------------------------------------------------------------
out="$(python3 "$PUBLISHER" "${ARGS[@]}" 2>&1)"; rc=$?
printf '%s\n' "$out"

case "$rc" in
  0) if [ "$DRY_RUN" = 1 ]; then
       log_line "DELEGATED-DRYRUN site=$SITE_KEY branch=$BRANCH declared=$(printf '%s,' "${DECLARED[@]}") allowed=$(printf '%s,' "${ALLOWED[@]:-}") held=$(printf '%s,' "${HELD[@]:-}") rc=$rc"
     else
       log_line "DELEGATED-OK site=$SITE_KEY branch=$BRANCH project=${PROJECT:-$SITE_KEY} declared=$(printf '%s,' "${DECLARED[@]}") allowed=$(printf '%s,' "${ALLOWED[@]:-}") held=$(printf '%s,' "${HELD[@]:-}") rc=$rc"
     fi ;;
  *) err="$(grep -m1 '^ERROR:' <<< "$out" || true)"
     log_line "DELEGATED-FAIL site=$SITE_KEY branch=$BRANCH project=${PROJECT:-$SITE_KEY} declared=$(printf '%s,' "${DECLARED[@]}") rc=$rc err=${err:-$(tail -2 <<< "$out" | tr '\n' ' ')}" ;;
esac
echo
echo "   audit: $LOG   |   publisher log: $PUB_LOG_DIR/publish-idle-site.log"
echo "          manifest: $PUB_LOG_DIR/publish-manifest-$SITE_KEY.json"
exit "$rc"
