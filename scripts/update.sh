#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Intended for the SERVER's clean, dedicated clone of this repository.
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo 'Refusing to overwrite locally modified tracked files.' >&2
  exit 1
fi
branch="$(git symbolic-ref --short HEAD)"
if [[ "$branch" != "main" ]]; then
  echo "Expected main branch, found: $branch" >&2
  exit 1
fi
git pull --ff-only origin main
# Static files are bind-mounted and reload automatically. Start container if missing.
docker compose up -d --no-deps
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:8090/ >/dev/null
echo "Website deployed: $(git rev-parse --short HEAD)"
