import * as ts from "typescript";

import { createRule } from "../utils/create-rule.js";
import {
  createTypeAwareAnchorVisitors,
  isDeclaredInTsLib,
  mergeRuleListeners,
} from "../utils/type-aware-anchors.js";

import {
  buildNoPromiseMessages,
  createNoPromiseVisitors,
  type NoPromiseMessageId,
} from "./no-promise.js";

const RULE_NAME = "no-promise-type-checked";

type TypeCheckedMessageId = "noPromiseTypeChecked";
type MessageId = NoPromiseMessageId | TypeCheckedMessageId;

const TYPE_CHECKED_MESSAGE = `The user prefers Effect primitives like \`Effect.Effect\`, \`Effect.promise\`, \`Effect.tryPromise\`, \`Effect.callback\`, or \`Effect.runPromise\` over values whose TypeScript type is the vanilla \`Promise\` (or \`PromiseLike\`). Convert at the boundary with \`Effect.promise(() => ...)\` or \`Effect.tryPromise({ try, catch })\` so the rest of the codebase deals in \`Effect.Effect<A, E, R>\`. If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${RULE_NAME} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`;

const PROMISE_TYPE_NAMES = new Set(["Promise", "PromiseLike"]);

function isGlobalPromiseType(type: ts.Type): boolean {
  const symbol = type.getSymbol() ?? type.aliasSymbol;

  if (!symbol || !PROMISE_TYPE_NAMES.has(symbol.getName())) {
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
        "Disallow direct `Promise` APIs (`async`/`await`, `.then`/`.catch`, `Promise.*` statics, `new Promise`), AND additionally flag any value whose inferred TypeScript type is the global `Promise` (or `PromiseLike`). Strict superset of `no-promise`.",
      recommended: false,
      requiresTypeChecking: true,
    },
    schema: [],
    messages: {
      ...buildNoPromiseMessages(RULE_NAME),
      noPromiseTypeChecked: TYPE_CHECKED_MESSAGE,
    },
  },
  defaultOptions: [],
  create(context) {
    return mergeRuleListeners(
      createNoPromiseVisitors<MessageId>(context),
      createTypeAwareAnchorVisitors<MessageId>(context, {
        messageId: "noPromiseTypeChecked",
        isBannedType: isGlobalPromiseType,
      }),
    );
  },
});
