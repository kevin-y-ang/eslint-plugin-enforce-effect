import { AST_NODE_TYPES } from "@typescript-eslint/utils";

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

const PROMISE_CHAIN_METHODS = new Set(["then", "catch"]);

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
        "Prefer Effect primitives over JavaScript `async` functions.",
      noAwait: "Prefer Effect primitives over JavaScript `await`.",
      noPromiseConstructor: "Prefer Effect primitives over `new Promise(...)`.",
      noPromiseChain:
        "Prefer Effect primitives over `.{{ method }}(...)` promise chaining.",
      noPromiseStatic:
        "Prefer Effect primitives over `Promise.{{ method }}(...)`.",
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
          PROMISE_CHAIN_METHODS.has(property.name)
        ) {
          context.report({
            node,
            messageId: "noPromiseChain",
            data: {
              method: property.name,
            },
          });
        }

        if (
          computed &&
          property.type === AST_NODE_TYPES.Literal &&
          typeof property.value === "string" &&
          PROMISE_CHAIN_METHODS.has(property.value)
        ) {
          context.report({
            node,
            messageId: "noPromiseChain",
            data: {
              method: property.value,
            },
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
