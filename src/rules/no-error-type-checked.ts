import * as ts from "typescript";

import { createRule } from "../utils/create-rule.js";
import {
  createTypeAwareAnchorVisitors,
  isDeclaredInTsLib,
  mergeRuleListeners,
} from "../utils/type-aware-anchors.js";

import {
  buildNoErrorMessages,
  createNoErrorVisitors,
  type NoErrorMessageId,
} from "./no-error.js";

const RULE_NAME = "no-error-type-checked";

type TypeCheckedMessageId = "noErrorTypeChecked";
type MessageId = NoErrorMessageId | TypeCheckedMessageId;

const TYPE_CHECKED_MESSAGE = `The user prefers Effect primitives like \`Cause.YieldableError\`, \`Data.TaggedError\`, \`Data.Error\`, \`Schema.TaggedErrorClass\`, \`Schema.ErrorClass\`, \`Cause.NoSuchElementError\`, \`Cause.TimeoutError\`, \`Cause.IllegalArgumentError\`, \`Cause.ExceededCapacityError\`, \`Cause.UnknownError\`, or \`Effect.fail\` over values whose TypeScript type is the vanilla \`Error\` (or a standard \`Error\` subclass like \`TypeError\`, \`RangeError\`, etc.). If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${RULE_NAME} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`;

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

export default createRule<[], MessageId>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `Error` constructor calls and `Error` type references, AND additionally flag any value whose inferred TypeScript type is the global `Error` (or a standard subclass like `TypeError`, `RangeError`, etc.). Strict superset of `no-error`.",
      recommended: false,
      requiresTypeChecking: true,
    },
    schema: [],
    messages: {
      ...buildNoErrorMessages(RULE_NAME),
      noErrorTypeChecked: TYPE_CHECKED_MESSAGE,
    },
  },
  defaultOptions: [],
  create(context) {
    return mergeRuleListeners(
      createNoErrorVisitors<MessageId>(context),
      createTypeAwareAnchorVisitors<MessageId>(context, {
        messageId: "noErrorTypeChecked",
        isBannedType: isGlobalErrorType,
      }),
    );
  },
});
