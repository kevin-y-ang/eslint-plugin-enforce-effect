import * as ts from "typescript";

import { createTypeAwareAnchorRule } from "../../utils/type-aware-anchors.js";

function isUndefinedType(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.Undefined) !== 0;
}

export default createTypeAwareAnchorRule({
  name: "no-undefined-inferred",
  description:
    "Disallow values whose inferred TypeScript type contains `undefined` in favor of Effect-friendly absence models. Does not flag `void` function returns.",
  messageId: "noUndefinedInferred",
  message:
    "The user prefers Effect primitives like `Option`, `Option.fromUndefinedOr`, `Option.fromNullishOr`, `Schema.UndefinedOr`, `Schema.NullishOr`, `Schema.Option`, `Result`, or `Effect` over values whose TypeScript type contains `undefined`. Convert at the boundary with `Option.fromUndefinedOr` (or `Option.fromNullishOr` if both `null` and `undefined` are missing sentinels). If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-undefined-inferred -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters. See /Users/bytedance/eslint-plugin-enforce-effect/docs/rules/no-undefined-inferred.md",
  isBannedType: isUndefinedType,
});
