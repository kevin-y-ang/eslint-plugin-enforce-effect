import * as ts from "typescript";

import {
  createTypeAwareAnchorRule,
  isDeclaredInTsLib,
} from "../../utils/type-aware-anchors.js";

const ERROR_TYPE_NAMES = new Set([
  "Error",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "ReferenceError",
  "EvalError",
  "URIError",
  "AggregateError",
]);

function isGlobalErrorType(type: ts.Type): boolean {
  const symbol = type.getSymbol() ?? type.aliasSymbol;

  if (!symbol || !ERROR_TYPE_NAMES.has(symbol.getName())) {
    return false;
  }

  return isDeclaredInTsLib(symbol);
}

export default createTypeAwareAnchorRule({
  name: "no-error-inferred",
  description:
    "Disallow values whose inferred TypeScript type is the global `Error` (or a standard `Error` subclass) in favor of Effect-based failure primitives.",
  messageId: "noErrorInferred",
  message:
    "The user prefers Effect primitives like `Cause.YieldableError`, `Data.TaggedError`, `Data.Error`, `Schema.TaggedErrorClass`, `Schema.ErrorClass`, `Cause.NoSuchElementError`, `Cause.TimeoutError`, `Cause.IllegalArgumentError`, `Cause.ExceededCapacityError`, `Cause.UnknownError`, or `Effect.fail` over values whose TypeScript type is the vanilla `Error` (or a standard `Error` subclass like `TypeError`, `RangeError`, etc.). If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-error-inferred -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters. See /Users/bytedance/eslint-plugin-enforce-effect/docs/rules/no-error-inferred.md",
  isBannedType: isGlobalErrorType,
});
