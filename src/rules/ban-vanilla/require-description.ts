import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";

const DIRECTIVE_KINDS = [
  "eslint",
  "eslint-disable",
  "eslint-disable-line",
  "eslint-disable-next-line",
  "eslint-enable",
  "eslint-env",
  "exported",
  "global",
  "globals",
] as const;

type DirectiveKind = (typeof DIRECTIVE_KINDS)[number];

type Options = [
  {
    ignore?: ReadonlyArray<DirectiveKind>;
    minLength?: number;
    maxLength?: number;
  },
];
type MessageIds =
  | "missingDescription"
  | "descriptionTooShort"
  | "descriptionTooLong";

const DIRECTIVE_PATTERN =
  /^(eslint(?:-env|-enable|-disable(?:(?:-next)?-line)?)?|exported|globals?)(?:\s|$)/u;
const LINE_COMMENT_KIND_PATTERN = /^eslint-disable-(?:next-)?line$/u;
const DESCRIPTION_SEPARATOR = /\s-{2,}\s/u;

interface ParsedDirective {
  kind: string;
  description: string | null;
}

function parseDirectiveText(text: string): ParsedDirective | null {
  const divided = text.split(DESCRIPTION_SEPARATOR);
  const head = divided[0].trim();
  const description =
    divided.length > 1 ? divided.slice(1).join(" -- ").trim() : null;

  const match = DIRECTIVE_PATTERN.exec(head);
  if (!match) {
    return null;
  }

  return { kind: match[1], description };
}

function parseDirectiveComment(
  comment: TSESTree.Comment,
): ParsedDirective | null {
  const parsed = parseDirectiveText(comment.value);
  if (!parsed) {
    return null;
  }

  const lineCommentSupported = LINE_COMMENT_KIND_PATTERN.test(parsed.kind);

  if (comment.type === "Line" && !lineCommentSupported) {
    return null;
  }

  if (
    parsed.kind === "eslint-disable-line" &&
    comment.loc.start.line !== comment.loc.end.line
  ) {
    return null;
  }

  return parsed;
}

export default createRule<Options, MessageIds>({
  name: "require-description",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require descriptions in ESLint directive comments (e.g. `// eslint-disable-next-line foo -- reason`).",
    },
    messages: {
      missingDescription:
        "Unexpected undescribed directive comment. Include descriptions to explain why the comment is necessary.",
      descriptionTooShort:
        "Directive comment description must be at least {{minLength}} characters; got {{actualLength}}.",
      descriptionTooLong:
        "Directive comment description must be at most {{maxLength}} characters; got {{actualLength}}.",
    },
    schema: [
      {
        type: "object",
        description:
          "Options for require-description: which directive kinds to skip and the allowed length range for descriptions.",
        properties: {
          ignore: {
            type: "array",
            description:
              "Directive comment kinds to skip when checking for a description.",
            items: {
              type: "string",
              description: "An ESLint directive comment kind.",
              enum: [...DIRECTIVE_KINDS],
            },
            uniqueItems: true,
          },
          minLength: {
            type: "integer",
            description:
              "Minimum number of characters required in a directive comment description.",
            minimum: 0,
          },
          maxLength: {
            type: "integer",
            description:
              "Maximum number of characters allowed in a directive comment description.",
            minimum: 1,
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{}],
  },
  create(context) {
    const options = context.options[0] ?? {};
    const ignores = new Set<string>(options.ignore ?? []);
    const minLength = options.minLength ?? 0;
    const maxLength = options.maxLength ?? Number.POSITIVE_INFINITY;
    const sourceCode = context.sourceCode;

    if (
      Number.isFinite(maxLength) &&
      Number.isFinite(minLength) &&
      maxLength < minLength
    ) {
      throw new Error(
        `enforce-effect/require-description: maxLength (${maxLength}) must be >= minLength (${minLength}).`,
      );
    }

    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          const directive = parseDirectiveComment(comment);
          if (!directive) {
            continue;
          }
          if (ignores.has(directive.kind)) {
            continue;
          }

          // Report "before" the comment's column so the directive itself
          // can't suppress this report (e.g. a bare `/* eslint-disable */`
          // would otherwise mute every rule including this one).
          const loc = {
            start: { line: comment.loc.start.line, column: -1 },
            end: comment.loc.end,
          };

          if (!directive.description) {
            context.report({ loc, messageId: "missingDescription" });
            continue;
          }

          const actualLength = directive.description.length;

          if (actualLength < minLength) {
            context.report({
              loc,
              messageId: "descriptionTooShort",
              data: { minLength, actualLength },
            });
            continue;
          }

          if (actualLength > maxLength) {
            context.report({
              loc,
              messageId: "descriptionTooLong",
              data: { maxLength, actualLength },
            });
          }
        }
      },
    };
  },
});
