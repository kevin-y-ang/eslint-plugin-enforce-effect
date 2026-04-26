import * as ts from "typescript";

import { createTypeAwareAnchorRule } from "../../utils/type-aware-anchors.js";

function isNullType(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.Null) !== 0;
}

export default createTypeAwareAnchorRule({
  name: "no-null-inferred",
  description:
    "Disallow values whose inferred TypeScript type contains `null` in favor of Effect-friendly absence models.",
  messageId: "noNullInferred",
  message:
    "The user prefers Effect primitives like `Option`, `Option.fromNullOr`, `Option.fromNullishOr`, `Schema.NullOr`, `Schema.NullishOr`, `Schema.Option`, `Result`, or `Effect` over values whose TypeScript type contains `null`. Convert at the boundary with `Option.fromNullOr` (or `Option.fromNullishOr` if both `null` and `undefined` are missing sentinels). If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-null-inferred -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters. See /Users/bytedance/eslint-plugin-enforce-effect/docs/rules/no-null-inferred.md",
  isBannedType: isNullType,
});
