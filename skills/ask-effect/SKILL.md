---
name: ask-effect
description: Answer questions about Effect by searching the Effect API reference. Use when user asks about Effect modules, Effect APIs, Effect patterns, how to use an Effect module, or runs /ask-effect with a question.
---

# Ask Effect

Answer questions about the Effect TypeScript library by searching the Effect API reference.

**Required argument:** a question about Effect (e.g., "how does Effect.retry work?")

## Check the Effect API reference

cd to the repo root and run `test -d .reference/effect || echo "missing"` to see if the reference exists in the repo root.

**If exists:** proceed to the next section.

**If missing:** ask the user the following question:

> The Effect API reference is not available. Would you like me to run the `/ask-effect-init` skill? This will download the Effect API reference under `<repo-root>/.reference/` and add `.reference` to .gitignore.

- **If you have an ask-question tool available (e.g. `AskQuestion` tool in Cursor, `AskUserQuestion` tool in Claude Code, `request_user_input` tool in Codex):** use it with the options "Yes" and "No".
- **Otherwise:** ask the user directly.

**If the user agrees:** run the `/ask-effect-init` skill.
**If the user declines:** stop — tell the user you cannot answer Effect questions without the Effect API reference.

### Search the Effect API reference to answer the question

**If you have a subagent tool available (e.g. `Task` tool in Cursor, `Agent` tool in Claude Code, `spawn_agent` tool in Codex):** delegate the search to a subagent using the prompt template below.
  - **If the question is broad or ambiguous:** launch multiple subagents in parallel to explore different candidates, then synthesize results.
  - **If the question is specific:** use a single subagent and return its answer verbatim — do not summarize or rewrite it.

````
Answer this question about the Effect TypeScript library by searching the Effect API reference.
Do NOT guess — only answer from what you find in the API reference.
Always cite file paths and line numbers. Show relevant code snippets.

**Question:** {{USER_QUESTION}}

**API reference:** `.reference/effect/`

**Directory structure:**

```
.reference/effect/
├── packages/effect/              # Core Effect library
│   ├── src/                      #   module source files (Effect.ts, Stream.ts, etc.)
│   ├── src/internal/             #   internal implementation details
│   └── test/                     #   colocated tests
├── packages/schema/              # Schema (validation, serialization)
│   ├── src/                      #   module source
│   └── test/                     #   tests
├── packages/platform/            # Platform-agnostic abstractions (HTTP, FileSystem, etc.)
├── packages/platform-node/       # Node.js platform implementation
├── packages/platform-browser/    # Browser platform implementation
├── packages/platform-bun/        # Bun platform implementation
├── packages/cli/                 # CLI framework
├── packages/cluster/             # Distributed computing
├── packages/sql/                 # SQL base package
├── packages/sql-pg/              # PostgreSQL client
├── packages/sql-mysql2/          # MySQL client
├── packages/sql-sqlite-*/        # SQLite variants (node, bun, wasm, etc.)
├── packages/sql-drizzle/         # Drizzle ORM integration
├── packages/sql-kysely/          # Kysely integration
├── packages/rpc/                 # RPC framework
├── packages/ai/                  # AI integrations
├── packages/experimental/        # Experimental APIs
├── packages/opentelemetry/       # OpenTelemetry integration
├── packages/vitest/              # Vitest testing utilities
├── packages/printer-ansi/        # ANSI terminal printer
├── packages/typeclass/           # Typeclass definitions
└── packages/workflow/            # Workflow engine
```

**Where to look:**
1. Module source — `packages/<package>/src/` contains public API modules (one file per module, e.g. `Effect.ts`, `Stream.ts`)
2. Types — exported interfaces and type aliases are defined in the module source files
3. Internal implementation — `packages/<package>/src/internal/` contains the actual implementations
4. Tests — `packages/<package>/test/` contains tests showing usage patterns
````

**If you do NOT have subagent functionality:** Search the Effect API reference directly using Grep, Glob, and Read tools. Use the directory structure in the prompt template above to navigate.

### Answer from the API reference

- Always cite the file path and line numbers where you found the answer
- Show relevant code snippets from the actual source
- Do NOT guess or rely on training data — if you cannot find the answer in the API reference, say so
- If the question is ambiguous, list what you found and ask the user to clarify
