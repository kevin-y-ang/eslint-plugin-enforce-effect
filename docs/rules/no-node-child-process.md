# `no-node-child-process`

Disallow imports from `child_process` and `node:child_process`.

## Why?

Effect-oriented codebases often want process execution to be isolated behind
explicit runtime services instead of pulled in directly from Node core APIs.

## Examples

Examples of **incorrect** code for this rule:

```ts
import { spawn } from "child_process";
```

```ts
const childProcess = require("node:child_process");
```

Examples of **correct** code for this rule:

```ts
import { ProcessRunner } from "./services/process-runner";
```

```ts
const childProcess = runtime.processRunner;
```
