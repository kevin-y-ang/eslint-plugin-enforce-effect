import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "import-extensions",
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce .ts/.tsx extension for relative imports and no extension for package imports.",
    },
    messages: {
      relativeRequiresTs:
        "Relative imports must use .ts or .tsx extension. Change '{{source}}' to '{{source}}.ts'.",
      relativeNoJs:
        "Relative imports must use .ts or .tsx extension, not .js/.jsx. Change '{{source}}' to '{{fixed}}'.",
      packageNoExtension:
        "Package imports must not have an extension. Change '{{source}}' to '{{fixed}}'.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function checkImportSource(node: any, source: unknown) {
      if (!source || typeof source !== "string") {
        return;
      }

      const isRelative = source.startsWith("./") || source.startsWith("../");

      if (isRelative) {
        if (source.includes("?")) {
          return;
        }

        if (source.endsWith(".js") || source.endsWith(".jsx")) {
          const fixed = source.replace(/\.jsx?$/, ".ts");
          context.report({
            node,
            messageId: "relativeNoJs",
            data: { source, fixed },
          });
          return;
        }

        if (
          !source.endsWith(".ts") &&
          !source.endsWith(".tsx") &&
          !source.endsWith(".json")
        ) {
          context.report({
            node,
            messageId: "relativeRequiresTs",
            data: { source },
          });
        }

        return;
      }

      if (
        source.endsWith(".ts") ||
        source.endsWith(".tsx") ||
        source.endsWith(".js") ||
        source.endsWith(".jsx")
      ) {
        const fixed = source.replace(/\.(tsx?|jsx?)$/, "");
        context.report({
          node,
          messageId: "packageNoExtension",
          data: { source, fixed },
        });
      }
    }

    return {
      ImportDeclaration(node) {
        checkImportSource(node, node.source?.value);
      },
      ImportExpression(node) {
        if (node.source?.type === "Literal") {
          checkImportSource(node, node.source.value);
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          checkImportSource(node, node.source.value);
        }
      },
      ExportAllDeclaration(node) {
        checkImportSource(node, node.source?.value);
      },
    };
  },
});
