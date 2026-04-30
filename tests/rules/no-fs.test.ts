import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-fs.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.itSkip = it.skip;

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
});

ruleTester.run("no-fs", rule, {
  valid: [
    {
      code: "import { FileSystem } from 'effect'",
    },
    {
      code: "import { NodeFileSystem } from '@effect/platform-node'",
    },
    {
      code: "import { NodeServices } from '@effect/platform-node'",
    },
    {
      code: "const helpers = require('./fs-helpers');",
    },
    {
      code: "import path from 'node:path';",
    },
  ],
  invalid: [
    {
      code: "import fs from 'fs';",
      errors: [{ messageId: "noFs" }],
    },
    {
      code: "import fs from 'node:fs';",
      errors: [{ messageId: "noFs" }],
    },
    {
      code: "import { readFile } from 'node:fs/promises';",
      errors: [{ messageId: "noFs" }],
    },
    {
      code: "import { writeFile } from 'fs/promises';",
      errors: [{ messageId: "noFs" }],
    },
    {
      code: "const fs = require('fs');",
      errors: [{ messageId: "noFs" }],
    },
    {
      code: "const fs = require('node:fs');",
      errors: [{ messageId: "noFs" }],
    },
    {
      code: "await import('node:fs');",
      errors: [{ messageId: "noFs" }],
    },
    {
      code: "export * from 'fs';",
      errors: [{ messageId: "noFs" }],
    },
    {
      code: "export { readFile } from 'node:fs/promises';",
      errors: [{ messageId: "noFs" }],
    },
    {
      code: "import fs = require('node:fs');",
      errors: [{ messageId: "noFs" }],
    },
  ],
});
