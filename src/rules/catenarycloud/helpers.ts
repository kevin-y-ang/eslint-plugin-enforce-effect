/* eslint-disable no-unused-vars */
import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

export const EFFECT_FILE_PATTERN =
  /\b(?:Effect|Option|Match|Either|Layer|Runtime|Stream|Ref|Atom|SubscriptionRef|Reactivity|Fiber)\b|["']effect(?:\/[^"']*)?["']|["']@effect-atom\/atom-react["']/;

export function isEffectFile(text: string): boolean {
  return EFFECT_FILE_PATTERN.test(text);
}

export function getMemberPropertyName(
  node: { computed: boolean; property: TSESTree.Node },
): string | null {
  if (!node.computed && node.property.type === AST_NODE_TYPES.Identifier) {
    return node.property.name;
  }

  if (
    node.computed &&
    node.property.type === AST_NODE_TYPES.Literal &&
    typeof node.property.value === "string"
  ) {
    return node.property.value;
  }

  return null;
}

export function isIdentifierNamed(
  node: TSESTree.Node | null | undefined,
  name: string,
): node is TSESTree.Identifier {
  return node?.type === AST_NODE_TYPES.Identifier && node.name === name;
}

export function isEffectCall(
  node: TSESTree.Node | null | undefined,
  methodName?: string,
): node is TSESTree.CallExpression {
  if (!node || node.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  if (!isIdentifierNamed(node.callee.object, "Effect")) {
    return false;
  }

  if (!methodName) {
    return true;
  }

  return getMemberPropertyName(node.callee) === methodName;
}

export function isNamespacedCall(
  node: TSESTree.Node | null | undefined,
  objectName: string,
  propertyName: string,
): node is TSESTree.CallExpression {
  return (
    node?.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    isIdentifierNamed(node.callee.object, objectName) &&
    getMemberPropertyName(node.callee) === propertyName
  );
}

export function isNamespacedMember(
  node: TSESTree.Node | null | undefined,
  objectName: string,
  propertyName: string,
): node is TSESTree.MemberExpression {
  return (
    node?.type === AST_NODE_TYPES.MemberExpression &&
    isIdentifierNamed(node.object, objectName) &&
    getMemberPropertyName(node) === propertyName
  );
}

export function isPipeCall(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.CallExpression {
  if (!node || node.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    return node.callee.name === "pipe";
  }

  if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
    return getMemberPropertyName(node.callee) === "pipe";
  }

  return false;
}

export function isBooleanLiteral(
  node: TSESTree.Node | null | undefined,
  value: boolean,
): boolean {
  return node?.type === AST_NODE_TYPES.Literal && node.value === value;
}

export function isNullLiteral(node: TSESTree.Node | null | undefined): boolean {
  return node?.type === AST_NODE_TYPES.Literal && node.value === null;
}

export function isStringLiteral(
  node: TSESTree.Node | null | undefined,
  value?: string,
): node is TSESTree.StringLiteral {
  if (node?.type !== AST_NODE_TYPES.Literal || typeof node.value !== "string") {
    return false;
  }

  return value === undefined ? true : node.value === value;
}

export function subtreeHas(
  node: unknown,
  predicate: (...args: [TSESTree.Node]) => boolean,
): boolean {
  function visit(value: unknown): boolean {
    if (!value || typeof value !== "object") {
      return false;
    }

    if (
      "type" in (value as Record<string, unknown>) &&
      typeof (value as Record<string, unknown>).type === "string"
    ) {
      const candidate = value as TSESTree.Node;

      if (predicate(candidate)) {
        return true;
      }
    }

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (
        key === "parent" ||
        key === "loc" ||
        key === "range" ||
        key === "tokens" ||
        key === "comments"
      ) {
        continue;
      }

      if (Array.isArray(child)) {
        for (const item of child) {
          if (visit(item)) {
            return true;
          }
        }
        continue;
      }

      if (visit(child)) {
        return true;
      }
    }

    return false;
  }

  return visit(node);
}

export function textIncludesAny(text: string, fragments: readonly string[]): boolean {
  return fragments.some((fragment) => text.includes(fragment));
}

export function objectPropertyByName(
  node: TSESTree.ObjectExpression,
  name: string,
): TSESTree.Property | null {
  for (const property of node.properties) {
    if (property.type !== AST_NODE_TYPES.Property) {
      continue;
    }

    if (
      (property.key.type === AST_NODE_TYPES.Identifier &&
        property.key.name === name) ||
      (property.key.type === AST_NODE_TYPES.Literal && property.key.value === name)
    ) {
      return property;
    }
  }

  return null;
}

export function isInlineFunction(
  node: TSESTree.Node | null | undefined,
): node is
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionExpression
  | TSESTree.FunctionDeclaration {
  return (
    node?.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node?.type === AST_NODE_TYPES.FunctionExpression ||
    node?.type === AST_NODE_TYPES.FunctionDeclaration
  );
}
