#!/usr/bin/env bash
set -euo pipefail

INPUT="$(cat)"

if echo "$INPUT" | grep -Eqi 'rm -rf /|terraform destroy|aws .* delete-|kubectl delete|DROP DATABASE|TRUNCATE .*|DELETE FROM .*wallet_ledger|DELETE FROM .*driver_wallet'; then
  cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Blocked destructive command. Additive-only project policy is enforced."
  }
}
JSON
  exit 0
fi

cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "Command allowed"
  }
}
JSON
