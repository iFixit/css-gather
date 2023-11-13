#!/bin/bash
set -xeuo pipefail

if [[ -z "${1:-}" ]]
then
    echo 'Usage: postprocess.sh <file.css>'
    exit 1
fi

echo "$1"
file="$(readlink -f "$1")"
gather_dir="$(readlink -f "$(dirname "$0")")"
cd "$gather_dir"
npx --no-install postcss --config="$gather_dir" -r "$file"
npx --no-install prettier --write "$file"
