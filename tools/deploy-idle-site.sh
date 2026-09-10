#!/usr/bin/env bash
# deploy-idle-site.sh — guarded, staging deploy wrapper for shared ~/seo-pages/idle-sites/<site> dirs.
#
# WHY: `npx wrangler pages deploy <site-dir>` uploads the WHOLE working tree. Two or more
# workers/cards (and the daily content pipeline) edit the same shared site directory at the
# same time, so a whole-dir deploy ships another worker's uncommitted / in-flight edit to
# production untouched and unverified. On 2026-09-10 that published an intermediate copy of
# canada-september-8-counter-tariffs.html (card t_31dba7b3 leaked card t_88a5cfa3's work).
#
# WHAT IT DOES
#   1. Computes the dirty set of the site dir from git (tracked modified + untracked).
#   2. Any dirty file that is NOT declared with --files (and not explicitly allowed) BLOCKS
#      the deploy (exit 2). Nothing is uploaded.
#   3. Otherwise it stages the site dir into a clean temp directory and deploys FROM THERE:
#        - declared files        -> ship worktree bytes (that is the task's own work)
#        - --allow-dirty globs   -> ship worktree bytes, loudly logged (already-live content)
#        - --exclude-dirty globs -> held back: tracked files reset to HEAD bytes, untracked dropped
#        - undeclared dirty file whose live bytes already equal its worktree bytes -> ship
#          (byte-identical to production, so it cannot ship anything unverified)
#   4. Prints the staged manifest (path, bytes, sha256) and writes an audit line to
#      ~/.hermes/logs/idle-site-deploys.log (+ .jsonl).
#
# USAGE
#   deploy-idle-site.sh <site-key|site-dir> --files <rel-path[,rel-path...]> [options]
#
# OPTIONS
#   --files=a,b            REQUIRED. Files (relative to the site dir) this deploy owns.
#                          Repeatable. New/untracked files are fine.
#   --project-name=NAME    Cloudflare Pages project (default: site key)
#   --branch=BRANCH        Deploy branch. Default 'main' = PRODUCTION. Anything else is a
#                          preview deployment (production alias untouched).
#   --base-url=URL         Live origin for the already-live byte check + --verify-live
#                          (default: https://<project>.pages.dev)
#   --allow-dirty=GLOB[..] Undeclared dirty files matching these globs ship as-is (logged).
#   --exclude-dirty=GLOB[..] Undeclared dirty files matching these globs are held back at
#                          HEAD bytes (tracked) or dropped (untracked).
#   --no-live-check        Do not classify undeclared dirty files against live bytes
#                          (everything undeclared then needs allow/exclude or it blocks).
#   --dry-run              Run guard + staging + manifest, do not call wrangler.
#   --verify-live          After a production deploy, curl every declared file and compare
#                          sha256 with the staged bytes (exit 3 on mismatch).
#   --keep-stage           Do not delete the staging dir; print its path.
#   --log=FILE             Audit log (default ~/.hermes/logs/idle-site-deploys.log).
#   -h | --help
#
# EXIT CODES  0 ok · 2 blocked by guard · 3 deploy/verify failure · 1 usage error
set -uo pipefail

REPO_ROOT_DEFAULT="$HOME/seo-pages"
IDLE_DIR_DEFAULT="$REPO_ROOT_DEFAULT/idle-sites"
LOG_DEFAULT="$HOME/.hermes/logs/idle-site-deploys.log"
ENV_FILE="$HOME/.hermes/scripts/.env"
UA="idle-site-deploy-guard/1.0"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

die() { echo "ERROR: $*" >&2; exit 1; }
usage() { sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'; }

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
    --no-live-check)   LIVE_CHECK=0 ;;
    --dry-run)         DRY_RUN=1 ;;
    --verify-live)     VERIFY_LIVE=1 ;;
    --keep-stage)      KEEP_STAGE=1 ;;
    -h|--help)         usage; exit 0 ;;
    -*)                die "unknown option $1 (try --help)" ;;
    *)                 [ -z "$SITE_ARG" ] && SITE_ARG="$1" || die "unexpected extra argument: $1" ;;
  esac
  shift
done

[ -n "$SITE_ARG" ] || { usage; exit 1; }
[ ${#DECLARED[@]} -gt 0 ] || die "--files=<rel-path[,rel-path]> is required (the files this deploy owns)"

# --- resolve the site dir (absolute path, or key under idle-sites/) -----------------------
case "$SITE_ARG" in
  /*) SITE_DIR="$SITE_ARG" ;;
  *)  SITE_DIR="$IDLE_DIR_DEFAULT/$SITE_ARG" ;;
esac
[ -d "$SITE_DIR" ] || die "site dir not found: $SITE_DIR"
SITE_DIR="$(cd "$SITE_DIR" && pwd -P)"
IDLE_DIR="$(cd "$IDLE_DIR_DEFAULT" && pwd -P)"
case "$SITE_DIR" in
  "$IDLE_DIR"/*) SITE_KEY="$(basename "$SITE_DIR")" ;;
  *) die "refusing to deploy a dir outside $IDLE_DIR (got $SITE_DIR)" ;;
esac
REPO="$(git -C "$SITE_DIR" rev-parse --show-toplevel 2>/dev/null)" || die "not inside a git repo: $SITE_DIR"
SITE_REL="${SITE_DIR#$REPO/}"
[ -n "$PROJECT" ] || PROJECT="$SITE_KEY"
[ -n "$BASE_URL" ] || BASE_URL="https://$PROJECT.pages.dev"

mkdir -p "$(dirname "$LOG")"

# --- helpers ------------------------------------------------------------------------------
matches_any() { # $1 = path relative to site dir, $2 = comma list of globs
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
sha_of_file() { shasum -a 256 "$1" 2>/dev/null | awk '{print $1}'; }
live_path_for() { # CF Pages serves /x.html at /x and index.html at its directory
  case "$1" in
    index.html)   echo "/" ;;
    */index.html) echo "/${1%index.html}" ;;
    *.html)       echo "/${1%.html}" ;;
    *)            echo "/$1" ;;
  esac
}
live_sha() { # $1 = site-relative path -> "<code> <sha>"
  local url="$BASE_URL$(live_path_for "$1")" tmp code
  tmp="$(mktemp)"
  code="$(curl -sSL --max-time 25 -A "$UA" -o "$tmp" -w '%{http_code}' "$url" 2>/dev/null || echo 000)"
  echo "$code $(sha_of_file "$tmp")"
  rm -f "$tmp"
}
root_sha() { # live bytes of "/" — used to detect the CF Pages catch-all (unknown paths serve index.html)
  if [ -z "${ROOT_SHA_CACHE:-}" ]; then
    ROOT_SHA_CACHE="$(curl -sSL --max-time 25 -A "$UA" "$BASE_URL/" 2>/dev/null | shasum -a 256 | awk '{print $1}')"
  fi
  echo "$ROOT_SHA_CACHE"
}

log_line() { echo "$TS $*" >> "$LOG"; }

# --- 1. dirty set from git ---------------------------------------------------------------
dirty_rows="$(git -C "$REPO" status --porcelain -uall -- "$SITE_REL" 2>/dev/null)"
declare -a DIRTY=()
if [ -n "$dirty_rows" ]; then
  while IFS= read -r row; do
    [ -z "$row" ] && continue
    xy="${row:0:2}"
    p="${row:3}"
    case "$p" in *" -> "*) p="${p##* -> }" ;; esac
    case "$p" in \"*) p="${p#\"}"; p="${p%\"}" ;; esac
    rel="${p#$SITE_REL/}"
    [ "$rel" = "$p" ] && continue      # outside the site dir
    DIRTY+=("$rel|$xy")
  done <<< "$dirty_rows"
fi

echo "== deploy-idle-site: $SITE_KEY (project=$PROJECT branch=$BRANCH) $TS"
echo "   site dir:   $SITE_DIR"
echo "   declared:   $(printf '%s ' "${DECLARED[@]}")"
[ "$DRY_RUN" = 1 ] && echo "   MODE:       DRY RUN (no upload)"
[ "$BRANCH" != "main" ] && echo "   NOTE:       branch != main => preview deployment, production alias untouched"

# verify declared files are inside the site dir
for f in "${DECLARED[@]}"; do
  case "$f" in /*|*..*) die "--files entry must be a path relative to the site dir: $f" ;; esac
  [ -e "$SITE_DIR/$f" ] || die "declared file does not exist: $SITE_DIR/$f"
done

# --- 2. classify every dirty file --------------------------------------------------------
if [ "$LIVE_CHECK" = 1 ] && [ ${#DIRTY[@]} -gt 0 ]; then ROOT_SHA_CACHE="$(curl -sSL --max-time 25 -A "$UA" "$BASE_URL/" 2>/dev/null | shasum -a 256 | awk '{print $1}')"; fi
declare -a BLOCKED=() SHIP=() EXCLUDE=() LIVEOK=()
for row in "${DIRTY[@]:-}"; do
  [ -z "$row" ] && continue
  rel="${row%%|*}"; xy="${row##*|}"
  if is_declared "$rel"; then continue; fi
  if matches_any "$rel" "$ALLOW_GLOBS"; then SHIP+=("$rel|--allow-dirty"); continue; fi
  if matches_any "$rel" "$EXCLUDE_GLOBS"; then EXCLUDE+=("$rel|--exclude-dirty"); continue; fi
  if [ "$LIVE_CHECK" = 1 ]; then
    read -r code lsha <<< "$(live_sha "$rel")"
    wsha="$(sha_of_file "$SITE_DIR/$rel")"
    if [ "$code" = "200" ] && [ "$lsha" = "$wsha" ]; then
      LIVEOK+=("$rel|live bytes == worktree bytes"); continue
    fi
    if [ "$code" = "200" ] && [ "$lsha" = "$(root_sha)" ]; then
      BLOCKED+=("$rel|status=$xy no live copy — CF Pages catch-all served index.html for this path; worktree=${wsha:0:12}")
      continue
    fi
    BLOCKED+=("$rel|status=$xy live_http=$code live=${lsha:0:12} worktree=${wsha:0:12}/${xy}")
  else
    BLOCKED+=("$rel|status=$xy (live check disabled)")
  fi
done

if [ ${#BLOCKED[@]} -gt 0 ]; then
  echo
  echo "BLOCKED: shared idle-sites dir has ${#BLOCKED[@]} undeclared modified file(s) — refusing to deploy $SITE_KEY"
  for b in "${BLOCKED[@]}"; do echo "  - $SITE_REL/${b%%|*}   [${b##*|}]"; done
  echo
  echo "Diagnosis: a whole-dir deploy would ship bytes that are NOT part of this task and are not"
  echo "           verifiably live (another card's uncommitted/in-flight edit)."
  echo "Impact:    production page served with unverified, internally inconsistent content."
  echo "Fix (pick one):"
  echo "  * declare the files you own:      --files='your_file.html[,another.html]'"
  echo "  * ship known-already-live bytes:  --allow-dirty='glob'   (logged loudly)"
  echo "  * hold a file back at HEAD:       --exclude-dirty='glob' (tracked reset to HEAD, untracked dropped)"
  echo "Nothing was deployed."
  log_line "BLOCKED site=$SITE_KEY branch=$BRANCH blocked=$(printf '%s;' "${BLOCKED[@]}")"
  exit 2
fi

# --- 3. stage ----------------------------------------------------------------------------
STAGE="${STAGE_DIR_OVERRIDE:-$(mktemp -d "${TMPDIR:-/tmp}/idle-site-stage.XXXXXX")}/$SITE_KEY"
mkdir -p "$STAGE"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --exclude '.git' --exclude '.DS_Store' "$SITE_DIR/" "$STAGE/"
else
  (cd "$SITE_DIR" && tar cf - --exclude='.git' --exclude='.DS_Store' .) | (cd "$STAGE" && tar xf -)
fi

for e in "${EXCLUDE[@]:-}"; do
  [ -z "$e" ] && continue
  rel="${e%%|*}"
  if git -C "$REPO" cat-file -e "HEAD:$SITE_REL/$rel" 2>/dev/null; then
    git -C "$REPO" show "HEAD:$SITE_REL/$rel" > "$STAGE/$rel"
    echo "   held back: $rel (reset to HEAD bytes)"
  else
    rm -f "$STAGE/$rel"
    echo "   held back: $rel (untracked — dropped from the deployment)"
  fi
done

# --- 4. manifest -------------------------------------------------------------------------
MANIFEST="$(mktemp)"
( cd "$STAGE" && find . -type f | sed 's|^\./||' | sort | while IFS= read -r f; do
    printf '%s  %8d  %s\n' "$(sha_of_file "$STAGE/$f")" "$(wc -c < "$STAGE/$f" | tr -d ' ')" "$f"
  done ) > "$MANIFEST"

echo
echo "STAGED CHANGES relative to HEAD (what this deployment actually changes):"
any=0
for f in "${DECLARED[@]}"; do
  ws="$(sha_of_file "$STAGE/$f")"
  if git -C "$REPO" cat-file -e "HEAD:$SITE_REL/$f" 2>/dev/null; then
    hs="$(git -C "$REPO" show "HEAD:$SITE_REL/$f" | shasum -a 256 | awk '{print $1}')"
    d="modified"; [ "$ws" = "$hs" ] && d="unchanged-vs-HEAD"
  else
    d="new (untracked)"
  fi
  echo "  [declared, $d] $f  $(wc -c < "$STAGE/$f" | tr -d ' ')B  sha256=${ws:0:16}…"
  any=1
done
for s in "${SHIP[@]:-}"; do
  [ -z "$s" ] && continue
  rel="${s%%|*}"
  echo "  [undeclared, SHIPPED ${s##*|}] $rel  $(wc -c < "$STAGE/$rel" | tr -d ' ')B  sha256=$(sha_of_file "$STAGE/$rel" | cut -c1-16)…"
  any=1
done
for l in "${LIVEOK[@]:-}"; do
  [ -z "$l" ] && continue
  rel="${l%%|*}"
  echo "  [undeclared, already live byte-for-byte] $rel  (no live change from this deploy)"
  any=1
done
[ "$any" = 0 ] && echo "  (none — deployment content equals HEAD)"
echo
echo "FULL STAGED FILE LIST: $(wc -l < "$MANIFEST" | tr -d ' ') files from $STAGE"
awk '{printf "  %s  %8s  %s\n", substr($1,1,16)"…", $2, $3}' "$MANIFEST"
echo "  (full manifest with complete sha256: see audit log)"

# --- 5. deploy ---------------------------------------------------------------------------
if [ "$DRY_RUN" = 1 ]; then
  echo "DRY RUN: skipped wrangler upload. Staged dir: $STAGE"
  log_line "DRYRUN site=$SITE_KEY branch=$BRANCH declared=$(printf '%s,' "${DECLARED[@]}") staged_files=$(wc -l < "$MANIFEST" | tr -d ' ')"
  [ "$KEEP_STAGE" = 0 ] && rm -rf "$(dirname "$STAGE")" "$MANIFEST"
  exit 0
fi

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] && [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a; . "$ENV_FILE"; set +a
fi
[ -n "${CLOUDFLARE_API_TOKEN:-}" ] || die "CLOUDFLARE_API_TOKEN not set and not found in $ENV_FILE"
export CLOUDFLARE_API_TOKEN
export OPENSSL_CONF="${OPENSSL_CONF:-/dev/null}"

echo
echo "DEPLOY: npx wrangler pages deploy $STAGE --project-name=$PROJECT --branch=$BRANCH --no-bundle"
out="$( cd "$STAGE" && npx wrangler pages deploy . --project-name="$PROJECT" --branch="$BRANCH" --no-bundle 2>&1 )"
rc=$?
tail -25 <<< "$out"
if [ $rc -ne 0 ] || ! grep -qi "Success" <<< "$out"; then
  echo "DEPLOY FAILED (rc=$rc) — staged dir kept at $STAGE"
  log_line "FAIL site=$SITE_KEY branch=$BRANCH rc=$rc out=$(tail -3 <<< "$out" | tr '\n' ' ')"
  exit 3
fi
DEPLOY_URL="$(grep -Eo 'https://[^ ]+' <<< "$out" | head -1)"
log_line "DEPLOYED site=$SITE_KEY branch=$BRANCH project=$PROJECT declared=$(printf '%s,' "${DECLARED[@]}") staged_files=$(wc -l < "$MANIFEST" | tr -d ' ') $DEPLOY_URL"

# --- 6. optional live verification -------------------------------------------------------
if [ "$VERIFY_LIVE" = 1 ]; then
  sleep 3
  for f in "${DECLARED[@]}"; do
    staged_sha="$(sha_of_file "$STAGE/$f")"
    read -r code lsha <<< "$(live_sha "$f")"
    if [ "$code" = "200" ] && [ "$lsha" = "$staged_sha" ]; then
      echo "   verify-live OK   $f  (live sha256=${lsha:0:16}…)"
    else
      echo "   verify-live FAIL $f  http=$code live=${lsha:0:16}… staged=${staged_sha:0:16}…"
      log_line "VERIFY-FAIL site=$SITE_KEY file=$f http=$code"
      [ "$KEEP_STAGE" = 0 ] && rm -rf "$(dirname "$STAGE")" "$MANIFEST"
      exit 3
    fi
  done
fi

if [ "$KEEP_STAGE" = 1 ]; then echo "staging dir kept: $STAGE"; else rm -rf "$(dirname "$STAGE")"; fi
rm -f "$MANIFEST"
echo "OK: $SITE_KEY deployed from staged dir ($(date -u +%H:%M:%SZ))."
exit 0
