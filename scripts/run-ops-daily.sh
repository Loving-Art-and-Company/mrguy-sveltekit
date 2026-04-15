#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p output/ops

echo "[mrguy-ops] $(date -u +"%Y-%m-%dT%H:%M:%SZ") starting marketing agents"
node scripts/ops/marketing/review-harvester.mjs >> output/ops/daily-run.log 2>&1 || true
node scripts/ops/marketing/gbp-bot.mjs >> output/ops/daily-run.log 2>&1 || true

echo "[mrguy-ops] $(date -u +"%Y-%m-%dT%H:%M:%SZ") starting daily digest"
node scripts/mrguy-ops-digest.mjs "$@" | tee -a output/ops/daily-run.log
echo "[mrguy-ops] $(date -u +"%Y-%m-%dT%H:%M:%SZ") finished daily digest"
