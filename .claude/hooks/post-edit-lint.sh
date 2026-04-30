#!/bin/bash
# Claude Code PostToolUse hook: lint edited JS/TS files and inject any output
# as additionalContext so the agent can fix issues.
#
# Configurable via env vars (defaults match this repo's lint setup):
#   LINT_RUNTIME  package runner (default: npx). Examples: npx, bunx, "pnpm exec"
#   LINT_CMD      linter command + args (default: "eslint --no-warn-ignored")
#                 Examples: "eslint --no-warn-ignored", oxlint, "biome check"
#
# Override per-hook in .claude/settings.json by prefixing the command, e.g.:
#   "command": "LINT_RUNTIME=bunx LINT_CMD=oxlint .claude/hooks/post-edit-lint.sh"

set -uo pipefail

LINT_RUNTIME="${LINT_RUNTIME:-npx}"
LINT_CMD="${LINT_CMD:-eslint --no-warn-ignored}"

INPUT=$(cat)
file=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

[[ -n "$file" ]] || exit 0
[[ "$file" =~ \.(ts|tsx|js|jsx|mjs|cjs)$ ]] || exit 0

if out=$($LINT_RUNTIME $LINT_CMD "$file" 2>&1); then
  exit 0
fi

jq -n --arg ctx "Lint failures on $file:"$'\n\n'"$out" \
  '{hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $ctx}}'
