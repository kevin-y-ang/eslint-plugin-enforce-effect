import * as ts from "typescript";

import {
  createTypeAwareAnchorRule,
  isDeclaredInTsLib,
} from "../../utils/type-aware-anchors.js";

function isGlobalDateType(type: ts.Type): boolean {
  const symbol = type.getSymbol() ?? type.aliasSymbol;

  if (!symbol || symbol.getName() !== "Date") {
    return false;
  }

  return isDeclaredInTsLib(symbol);
}

export default createTypeAwareAnchorRule({
  name: "no-date-inferred",
  description:
    "Disallow values whose inferred TypeScript type is `Date` in favor of Effect-based date and clock primitives.",
  messageId: "noDateInferred",
  message:
    "The user prefers Effect primitives like `DateTime.DateTime`, `DateTime.Utc`, or `DateTime.Zoned` over values whose TypeScript type is the vanilla `Date`. Convert at the boundary with `DateTime.fromDateUnsafe` or `DateTime.make`. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-date-inferred -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters. See /Users/bytedance/eslint-plugin-enforce-effect/docs/rules/no-date-inferred.md",
  isBannedType: isGlobalDateType,
});
