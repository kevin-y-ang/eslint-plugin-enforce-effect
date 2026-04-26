import * as ts from "typescript";

import {
  createTypeAwareAnchorRule,
  isDeclaredInTsLib,
} from "../../utils/type-aware-anchors.js";

const PROMISE_TYPE_NAMES = new Set(["Promise", "PromiseLike"]);

function isGlobalPromiseType(type: ts.Type): boolean {
  const symbol = type.getSymbol() ?? type.aliasSymbol;

  if (!symbol || !PROMISE_TYPE_NAMES.has(symbol.getName())) {
    return false;
  }

  return isDeclaredInTsLib(symbol);
}

export default createTypeAwareAnchorRule({
  name: "no-promise-inferred",
  description:
    "Disallow values whose inferred TypeScript type is `Promise` (or `PromiseLike`) in favor of Effect-based asynchronous primitives.",
  messageId: "noPromiseInferred",
  message:
    "The user prefers Effect primitives like `Effect.Effect`, `Effect.promise`, `Effect.tryPromise`, `Effect.callback`, or `Effect.runPromise` over values whose TypeScript type is the vanilla `Promise` (or `PromiseLike`). Convert at the boundary with `Effect.promise(() => ...)` or `Effect.tryPromise({ try, catch })` so the rest of the codebase deals in `Effect.Effect<A, E, R>`. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-promise-inferred -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters. See /Users/bytedance/eslint-plugin-enforce-effect/docs/rules/no-promise-inferred.md",
  isBannedType: isGlobalPromiseType,
});
