#!/usr/bin/env bash
set -euo pipefail
[[ "${VERIFY_RESULT:-}" == success ]] || { echo 'Required verification did not succeed' >&2; exit 1; }
case "${PUBLISH_RELEASE:-}" in
  true)
    [[ "${DEPLOY_RESULT:-}" == success ]] || { echo 'Pages deployment did not succeed' >&2; exit 1; }
    [[ "${HOSTED_RESULT:-}" == success ]] || { echo 'Hosted acceptance did not succeed' >&2; exit 1; }
    ;;
  false) ;;
  *) echo 'Missing release mode' >&2; exit 1 ;;
esac
