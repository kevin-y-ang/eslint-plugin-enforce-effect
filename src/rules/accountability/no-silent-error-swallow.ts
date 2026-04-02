import { createRule } from "../../utils/create-rule.js";

function isEffectVoidOrUnit(node: any): boolean {
  return (
    node &&
    node.type === "MemberExpression" &&
    node.object.type === "Identifier" &&
    node.object.name === "Effect" &&
    node.property.type === "Identifier" &&
    (node.property.name === "void" || node.property.name === "unit")
  );
}

function isVoidReturningHandler(node: any): boolean {
  if (!node) {
    return false;
  }

  if (node.type === "ArrowFunctionExpression") {
    if (isEffectVoidOrUnit(node.body)) {
      return true;
    }

    if (node.body.type === "BlockStatement") {
      const body = node.body.body;
      if (body.length === 1 && body[0].type === "ReturnStatement") {
        return isEffectVoidOrUnit(body[0].argument);
      }
    }
  }

  if (node.type === "FunctionExpression") {
    const body = node.body.body;
    if (body.length === 1 && body[0].type === "ReturnStatement") {
      return isEffectVoidOrUnit(body[0].argument);
    }
  }

  return false;
}

function getCatchType(node: any): "catchAll" | "catchTag" | "catchTags" | null {
  if (node.type !== "CallExpression") {
    return null;
  }

  const callee = node.callee;
  if (callee.type !== "MemberExpression") {
    return null;
  }

  const propertyName =
    callee.property.type === "Identifier" ? callee.property.name : null;
  if (
    (propertyName === "catchTag" ||
      propertyName === "catchAll" ||
      propertyName === "catchTags") &&
    callee.object.type === "Identifier" &&
    callee.object.name === "Effect"
  ) {
    return propertyName;
  }

  return null;
}

export default createRule({
  name: "no-silent-error-swallow",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow catch handlers that silently swallow errors by returning Effect.void.",
    },
    messages: {
      noSilentSwallow:
        "Do not silently swallow errors with '() => Effect.void'. Errors should be represented in the type system, not ignored. Either: (1) let the error propagate to the caller, (2) transform it with mapError to a different error type, or (3) handle it with meaningful recovery logic. Silent error swallowing hides bugs and breaks type safety.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const catchType = getCatchType(node);
        if (!catchType) {
          return;
        }

        if (catchType === "catchTags" && node.arguments.length >= 1) {
          const object = node.arguments[0];
          if (object.type === "ObjectExpression") {
            for (const property of object.properties) {
              if (
                property.type === "Property" &&
                isVoidReturningHandler(property.value)
              ) {
                context.report({
                  node: property.value,
                  messageId: "noSilentSwallow",
                });
              }
            }
          }
          return;
        }

        let handler: any = null;
        if (catchType === "catchTag" && node.arguments.length >= 2) {
          handler = node.arguments[1];
        } else if (catchType === "catchAll" && node.arguments.length >= 1) {
          handler = node.arguments[0];
        }

        if (handler && isVoidReturningHandler(handler)) {
          context.report({
            node: handler,
            messageId: "noSilentSwallow",
          });
        }
      },
    };
  },
});
