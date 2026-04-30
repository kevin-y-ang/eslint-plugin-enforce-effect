---
name: ask-effect-init
description: Add the Effect API reference via shallow clone so AI agents can look up Effect APIs from source code. Use when user wants to initialize the Effect API reference, set up the Effect API reference, or run /ask-effect-init.
---

# Effect Reference Setup

Add the Effect API reference as a shallow clone so AI coding agents can look up accurate Effect APIs directly from source code.

Effect lives at `github.com/effect-ts/effect` — shallow clone pulls a single commit to keep the download small.

**If the skill was invoked explicitly by the user:** consider that as permission to just go ahead and execute.

## If `.reference/effect/` does NOT exist

Clone with shallow depth:

```bash
git clone --depth 1 --filter=blob:none \
  https://github.com/effect-ts/effect.git .reference/effect
```

Then ensure `.reference` is in the **project root** `.gitignore` (not inside the clone):

```bash
grep -qxF '.reference' .gitignore 2>/dev/null || printf '\n.reference\n' >> .gitignore
```

Do NOT `cd` into `.reference/effect/` — use `git -C` to avoid running subsequent commands from the wrong directory.

## If `.reference/effect/` already exists

Update to latest:

```bash
git -C .reference/effect pull --depth 1 origin main
```

## Checklist

- [ ] `.reference/effect/` exists with source files
- [ ] `.reference/` is in `.gitignore`
