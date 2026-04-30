import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

const PROMISE_STATIC_METHODS = new Set([
  "all",
  "allSettled",
  "any",
  "race",
  "reject",
  "resolve",
  "try",
  "withResolvers",
]);

const PROMISE_CHAIN_MESSAGE_IDS = {
  then: "noPromiseChainThen",
  catch: "noPromiseChainCatch",
} as const;

type PromiseChainMethod = keyof typeof PROMISE_CHAIN_MESSAGE_IDS;

function isPromiseChainMethod(name: string): name is PromiseChainMethod {
  return name === "then" || name === "catch";
}

export type NoPromiseMessageId =
  | "noAsync"
  | "noAwait"
  | "noPromiseConstructor"
  | "noPromiseChainThen"
  | "noPromiseChainCatch"
  | "noPromiseStatic";

export function buildNoPromiseMessages(
  ruleName: string,
): Record<NoPromiseMessageId, string> {
  return {
    noAsync: `The user prefers Effect primitives like \`Effect.fn\`, \`Effect.gen\`, \`Effect.fnUntraced\`, \`Effect.suspend\`, or \`Effect.callback\` over vanilla \`async\` functions. If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${ruleName} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`,
    noAwait: `The user prefers Effect primitives like \`yield*\` inside \`Effect.gen\`, \`Effect.flatMap\`, \`Effect.andThen\`, or \`Effect.fromYieldable\` over vanilla \`await\`. If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${ruleName} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`,
    noPromiseConstructor: `The user prefers Effect primitives like \`Effect.promise\`, \`Effect.tryPromise\`, \`Effect.callback\`, or \`Deferred.make\` over vanilla \`new Promise(...)\`. If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${ruleName} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`,
    noPromiseChainThen: `The user prefers Effect primitives like \`Effect.flatMap\`, \`Effect.map\`, \`Effect.andThen\`, or \`Effect.tap\` over vanilla \`.then(...)\` promise chaining. If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${ruleName} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`,
    noPromiseChainCatch: `The user prefers Effect primitives like \`Effect.catch\`, \`Effect.catchTag\`, \`Effect.catchTags\`, \`Effect.match\`, \`Effect.matchEffect\`, \`Effect.matchCause\`, \`Effect.mapError\`, \`Effect.tapError\`, \`Effect.catchCause\`, \`Effect.catchIf\`, or \`Effect.catchDefect\` over vanilla \`.catch(...)\` promise chaining. If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${ruleName} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`,
    noPromiseStatic: `The user prefers Effect primitives like \`Effect.all\`, \`Effect.partition\`, \`Effect.race\`, \`Effect.raceFirst\`, \`Effect.raceAll\`, \`Effect.succeed\`, \`Effect.fail\`, \`Effect.try\`, or \`Deferred.make\` over vanilla \`Promise.{{ method }}(...)\`. If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${ruleName} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`,
  };
}

export function createNoPromiseVisitors<MessageId extends string>(
  context: TSESLint.RuleContext<MessageId, []>,
): TSESLint.RuleListener {
  const report = (
    node: TSESTree.Node,
    messageId: NoPromiseMessageId,
    data?: Record<string, string>,
  ): void => {
    context.report({ node, messageId: messageId as MessageId, data });
  };

  return {
    ArrowFunctionExpression(node) {
      if (!node.async) {
        return;
      }

      report(node, "noAsync");
    },
    AwaitExpression(node) {
      report(node, "noAwait");
    },
    CallExpression(node) {
      if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
        return;
      }

      const { object, property, computed } = node.callee;

      if (
        !computed &&
        property.type === AST_NODE_TYPES.Identifier &&
        object.type === AST_NODE_TYPES.Identifier &&
        object.name === "Promise" &&
        PROMISE_STATIC_METHODS.has(property.name)
      ) {
        report(node, "noPromiseStatic", { method: property.name });
      }

      // `Effect.then` / `Effect.catch` are legitimate Effect namespace APIs, not
      // Promise chain methods, so skip the chain check when the receiver is the
      // `Effect` identifier.
      if (
        object.type === AST_NODE_TYPES.Identifier &&
        object.name === "Effect"
      ) {
        return;
      }

      if (
        !computed &&
        property.type === AST_NODE_TYPES.Identifier &&
        isPromiseChainMethod(property.name)
      ) {
        report(node, PROMISE_CHAIN_MESSAGE_IDS[property.name]);
      }

      if (
        computed &&
        property.type === AST_NODE_TYPES.Literal &&
        typeof property.value === "string" &&
        isPromiseChainMethod(property.value)
      ) {
        report(node, PROMISE_CHAIN_MESSAGE_IDS[property.value]);
      }
    },
    FunctionDeclaration(node) {
      if (!node.async) {
        return;
      }

      report(node, "noAsync");
    },
    FunctionExpression(node) {
      if (!node.async) {
        return;
      }

      report(node, "noAsync");
    },
    NewExpression(node) {
      if (
        node.callee.type === AST_NODE_TYPES.Identifier &&
        node.callee.name === "Promise"
      ) {
        report(node, "noPromiseConstructor");
      }
    },
  };
}

export default createRule<[], NoPromiseMessageId>({
  name: "no-promise",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow direct Promise APIs in favor of Effect-based abstractions.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: buildNoPromiseMessages("no-promise"),
  },
  defaultOptions: [],
  create(context) {
    return createNoPromiseVisitors(context);
  },
});
