#!/bin/bash
set -uo pipefail

file=$(jq -r '.tool_input.path // empty')
[[ "$file" =~ \.(ts|tsx|js|jsx|mjs|cjs)$ ]] || { echo '{}'; exit 0; }

if out=$(npx eslint --no-warn-ignored "$file" 2>&1); then
  echo '{}'
else
  jq -n --arg ctx "ESLint on $file:"$'\n\n'"$out" '{additional_context: $ctx}'
fi
