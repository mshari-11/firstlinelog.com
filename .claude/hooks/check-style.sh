#!/usr/bin/env bash
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"

run_if_exists() {
  if [ -f package.json ]; then
    if node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['$1'] ? 0 : 1)" 2>/dev/null; then
      npm run "$1" || true
    fi
  fi
}

run_if_exists lint
run_if_exists typecheck
run_if_exists test

if [ -f pyproject.toml ]; then
  command -v ruff >/dev/null 2>&1 && ruff check . || true
  command -v pytest >/dev/null 2>&1 && pytest -q || true
fi

exit 0
