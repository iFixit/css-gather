#!/bin/bash
set -euo pipefail
if [[ -z "${1:-}" ]]
then
  echo "Usage: run.sh <url>"
  exit 1
fi

root="$(dirname "$0")"

"$root/css-gather" "$1" | "$root/critical-css.js" "$1" | npx --no-install prettier --parser=css
