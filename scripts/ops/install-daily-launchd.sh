#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PLIST_PATH="$HOME/Library/LaunchAgents/com.lovingart.mrguy-ops-daily.plist"
RUN_HOUR="${OPS_RUN_HOUR:-7}"
RUN_MINUTE="${OPS_RUN_MINUTE:-0}"

mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$ROOT_DIR/output/ops"

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.lovingart.mrguy-ops-daily</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$ROOT_DIR/scripts/run-ops-daily.sh</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$ROOT_DIR</string>
  <key>StandardOutPath</key>
  <string>$ROOT_DIR/output/ops/launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>$ROOT_DIR/output/ops/launchd.err.log</string>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>$RUN_HOUR</integer>
    <key>Minute</key>
    <integer>$RUN_MINUTE</integer>
  </dict>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
PLIST

launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl load "$PLIST_PATH"

echo "Installed MrGuy daily ops launchd job at $PLIST_PATH"
echo "Runs daily at ${RUN_HOUR}:$(printf '%02d' "$RUN_MINUTE") local time."
