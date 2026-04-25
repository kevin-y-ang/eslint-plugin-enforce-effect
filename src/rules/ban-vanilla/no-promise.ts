import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";

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

export default createRule({
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
    messages: {
      noAsync:
        "The user prefers `Effect.gen` over vanilla `async` functions. If this logic cannot be implemented with `Effect.gen`, use `// eslint-disable-next-line no-promise -- <justification>` as a LAST RESORT. The justification MUST explain why `Effect.gen` doesn't accomplish your goal, and MUST be no less than 40 characters.",
      noAwait:
        "The user prefers `Effect.gen` (with `yield*`) over vanilla `await`. If this logic cannot be implemented with `Effect.gen`, use `// eslint-disable-next-line no-promise -- <justification>` as a LAST RESORT. The justification MUST explain why `Effect.gen` doesn't accomplish your goal, and MUST be no less than 40 characters.",
      noPromiseConstructor:
        "The user prefers `Effect.promise` / `Effect.tryPromise` (or `Effect.callback` for callback-style APIs) over vanilla `new Promise(...)`. If this logic cannot be implemented with those primitives, use `// eslint-disable-next-line no-promise -- <justification>` as a LAST RESORT. The justification MUST explain why those primitives don't accomplish your goal, and MUST be no less than 40 characters.",
      noPromiseChainThen:
        "The user prefers `Effect.andThen` over vanilla `.then(...)` promise chaining. If this logic cannot be implemented with `Effect.andThen`, use `// eslint-disable-next-line no-promise -- <justification>` as a LAST RESORT. The justification MUST explain why `Effect.andThen` doesn't accomplish your goal, and MUST be no less than 40 characters.",
      noPromiseChainCatch:
        "The user prefers `Effect.catchAll` over vanilla `.catch(...)` promise chaining. If this logic cannot be implemented with `Effect.catchAll`, use `// eslint-disable-next-line no-promise -- <justification>` as a LAST RESORT. The justification MUST explain why `Effect.catchAll` doesn't accomplish your goal, and MUST be no less than 40 characters.",
      noPromiseStatic:
        "The user prefers `Effect` over vanilla `Promise.{{ method }}(...)`. If this logic cannot be implemented with `Effect`, use `// eslint-disable-next-line no-promise -- <justification>` as a LAST RESORT. The justification MUST explain why `Effect` doesn't accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ArrowFunctionExpression(node) {
        if (!node.async) {
          return;
        }

        context.report({
          node,
          messageId: "noAsync",
        });
      },
      AwaitExpression(node) {
        context.report({
          node,
          messageId: "noAwait",
        });
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
          context.report({
            node,
            messageId: "noPromiseStatic",
            data: {
              method: property.name,
            },
          });
        }

        if (
          !computed &&
          property.type === AST_NODE_TYPES.Identifier &&
          isPromiseChainMethod(property.name)
        ) {
          context.report({
            node,
            messageId: PROMISE_CHAIN_MESSAGE_IDS[property.name],
          });
        }

        if (
          computed &&
          property.type === AST_NODE_TYPES.Literal &&
          typeof property.value === "string" &&
          isPromiseChainMethod(property.value)
        ) {
          context.report({
            node,
            messageId: PROMISE_CHAIN_MESSAGE_IDS[property.value],
          });
        }
      },
      FunctionDeclaration(node) {
        if (!node.async) {
          return;
        }

        context.report({
          node,
          messageId: "noAsync",
        });
      },
      FunctionExpression(node) {
        if (!node.async) {
          return;
        }

        context.report({
          node,
          messageId: "noAsync",
        });
      },
      NewExpression(node) {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === "Promise"
        ) {
          context.report({
            node,
            messageId: "noPromiseConstructor",
          });
        }
      },
    };
  },
});
