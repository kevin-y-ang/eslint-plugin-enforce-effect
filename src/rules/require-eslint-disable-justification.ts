import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

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

type RuleMatcher = ReadonlyArray<string> | string;

type Options = [
  {
    ignore?: ReadonlyArray<DirectiveKind>;
    minLength?: number;
    maxLength?: number;
    ignoreRules?: RuleMatcher;
    requireRules?: RuleMatcher;
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
  body: string;
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

  return {
    kind: match[1],
    body: head.slice(match[0].length).trim(),
    description,
  };
}

function escapeForRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

// Build a body matcher. Array form matches each name with a non-rule-name
// boundary (so "no-console" doesn't match "no-console-log") but allows any
// surrounding punctuation that appears in real directive comments
// (whitespace, commas, colons, quotes, brackets, etc.). Regex form is tested
// against the body verbatim.
function compileRuleMatcher(
  matcher: RuleMatcher | undefined,
  optionName: string,
): ((body: string) => boolean) | null {
  if (matcher === undefined) {
    return null;
  }
  if (typeof matcher === "string") {
    let regex: RegExp;
    try {
      regex = new RegExp(matcher, "u");
    } catch (cause) {
      throw new Error(
        `enforce-effect/require-eslint-disable-justification: ${optionName} regex is invalid: ${(cause as Error).message}`,
        { cause },
      );
    }
    return (body) => regex.test(body);
  }
  if (matcher.length === 0) {
    return null;
  }
  const alternation = matcher.map(escapeForRegex).join("|");
  const regex = new RegExp(
    `(?<![@\\w/-])(?:${alternation})(?![@\\w/-])`,
    "u",
  );
  return (body) => regex.test(body);
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
  name: "require-eslint-disable-justification",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require justifications in ESLint disable directive comments using the `-- <justification>` pattern.",
    },
    messages: {
      missingDescription:
        "ESLint disable directive comments MUST include a justification using the `-- <justification>` pattern.",
      descriptionTooShort:
        "ESLint disable directive comments justifications MUST be at least {{minLength}} characters (detected: {{actualLength}} characters).",
      descriptionTooLong:
        "ESLint disable directive comments justifications MUST be at most {{maxLength}} characters (detected: {{actualLength}} characters).",
    },
    schema: [
      {
        type: "object",
        description: "Options for `require-eslint-disable-justification`.",
        properties: {
          ignore: {
            type: "array",
            description: "Directive comment kinds to skip.",
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
              "Minimum length, in characters, of a directive comment justification.",
            minimum: 0,
          },
          maxLength: {
            type: "integer",
            description:
              "Maximum length, in characters, of a directive comment justification.",
            minimum: 1,
          },
          ignoreRules: {
            description:
              "Lint rule names exempt from the justification requirement when named in a directive. Array of exact rule names or a regex pattern string.",
            oneOf: [
              {
                type: "array",
                description:
                  "Exact lint rule names whose directive comments are exempt.",
                items: {
                  type: "string",
                  description: "An exact lint rule name.",
                },
                uniqueItems: true,
              },
              {
                type: "string",
                description:
                  "Regex pattern string; rule names matching this pattern are exempt.",
              },
            ],
          },
          requireRules: {
            description:
              "When set, justifications are required only for directives naming at least one matching rule (or for bare directives that target every rule). Array of exact rule names or a regex pattern string.",
            oneOf: [
              {
                type: "array",
                description:
                  "Exact lint rule names whose directive comments MUST include a justification.",
                items: {
                  type: "string",
                  description: "An exact lint rule name.",
                },
                uniqueItems: true,
              },
              {
                type: "string",
                description:
                  "Regex pattern string; justifications are required when at least one named rule matches.",
              },
            ],
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
    const matchesIgnoreRule = compileRuleMatcher(
      options.ignoreRules,
      "ignoreRules",
    );
    const matchesRequireRule = compileRuleMatcher(
      options.requireRules,
      "requireRules",
    );
    const sourceCode = context.sourceCode;

    if (
      Number.isFinite(maxLength) &&
      Number.isFinite(minLength) &&
      maxLength < minLength
    ) {
      throw new Error(
        `enforce-effect/require-eslint-disable-justification: maxLength (${maxLength}) must be >= minLength (${minLength}).`,
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

          // Bare directives (e.g. `/* eslint-disable */`) target every rule,
          // so they can never be filtered out by ignoreRules/requireRules.
          // Directives with a body get matched against the body text.
          if (directive.body !== "") {
            if (matchesIgnoreRule && matchesIgnoreRule(directive.body)) {
              continue;
            }
            if (matchesRequireRule && !matchesRequireRule(directive.body)) {
              continue;
            }
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
