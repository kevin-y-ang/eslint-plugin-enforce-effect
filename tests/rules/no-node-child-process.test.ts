import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/ban-vanilla/no-node-child-process.js";

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

ruleTester.run("no-node-child-process", rule, {
  valid: [
    {
      code: "import fs from 'node:fs';",
    },
    {
      code: "const fs = require('fs');",
    },
    {
      code: "export { readFile } from 'node:fs';",
    },
  ],
  invalid: [
    {
      code: "import { spawn } from 'child_process';",
      errors: [{ messageId: "noNodeChildProcess" }],
    },
    {
      code: "import { exec } from 'node:child_process';",
      errors: [{ messageId: "noNodeChildProcess" }],
    },
    {
      code: "const childProcess = require('child_process');",
      errors: [{ messageId: "noNodeChildProcess" }],
    },
    {
      code: "await import('node:child_process');",
      errors: [{ messageId: "noNodeChildProcess" }],
    },
    {
      code: "export * from 'child_process';",
      errors: [{ messageId: "noNodeChildProcess" }],
    },
    {
      code: "import childProcess = require('node:child_process');",
      errors: [{ messageId: "noNodeChildProcess" }],
    },
  ],
});
