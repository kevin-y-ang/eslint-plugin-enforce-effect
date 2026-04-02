import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-location-href-redirect",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow window.location.href redirects and require router navigation instead.",
    },
    messages: {
      noLocationHref:
        "Do not use {{expression}} for navigation. Use TanStack Router's navigate() or useNavigate() hook instead. Direct location manipulation breaks SPA routing and loses all app state.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      AssignmentExpression(node) {
        const left = node.left;
        if (
          left.type !== "MemberExpression" ||
          left.property.type !== "Identifier" ||
          left.property.name !== "href"
        ) {
          return;
        }

        const object = left.object;
        const isLocationHref =
          (object.type === "Identifier" && object.name === "location") ||
          (object.type === "MemberExpression" &&
            object.property.type === "Identifier" &&
            object.property.name === "location" &&
            object.object.type === "Identifier" &&
            (object.object.name === "window" ||
              object.object.name === "document"));

        if (!isLocationHref) {
          return;
        }

        context.report({
          node,
          messageId: "noLocationHref",
          data: { expression: context.sourceCode.getText(left) },
        });
      },
    };
  },
});
