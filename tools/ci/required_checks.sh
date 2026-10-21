#!/usr/bin/env bash
set -euo pipefail

for result in "$CHECKS_RESULT" "$CHROMIUM_RESULT" "$COMPATIBILITY_RESULT"; do
  if [[ "$result" != success ]]; then
    echo "Required regression job did not succeed: $result" >&2
    exit 1
  fi
done
