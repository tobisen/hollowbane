#!/usr/bin/env bash
set -euo pipefail
[[ "${FAST_RESULT:-}" == success ]] || { echo 'Fast failed, skipped or cancelled' >&2; exit 1; }
[[ "${INTEGRATION_RESULT:-skipped}" == skipped || "${INTEGRATION_RESULT:-}" == success ]] || { echo 'Integration failed or cancelled' >&2; exit 1; }
case "${REQUIRED_TIER:-}" in
  full) [[ "${FULL_RESULT:-}" == success ]] || { echo 'Required Full did not succeed' >&2; exit 1; } ;;
  integration) [[ "${INTEGRATION_RESULT:-}" == success && "${FULL_RESULT:-}" == skipped ]] || { echo 'Required Integration did not succeed' >&2; exit 1; } ;;
  fast) [[ "${FULL_RESULT:-}" == skipped || "${FULL_RESULT:-}" == success ]] || { echo 'Unexpected Full failure' >&2; exit 1; } ;;
  *) echo 'Missing or invalid release tier' >&2; exit 1 ;;
esac
