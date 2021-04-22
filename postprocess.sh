#!/bin/bash
set -xeuo pipefail

if [[ -z "${1:-}" ]]
then
    echo 'Usage: postprocess.sh <file.css>'
    exit 1
fi

file="$(readlink -e "$1")"
cd "$(dirname "$0")"
npx --no-install postcss -r "$file"
npx --no-install prettier --write "$file"
