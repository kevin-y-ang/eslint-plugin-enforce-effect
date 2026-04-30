import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-crypto.js";

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

ruleTester.run("no-crypto", rule, {
  valid: [
    {
      code: "import { Crypto } from 'effect/unstable/crypto';",
    },
    {
      code: "import { NodeCrypto } from '@effect/platform-node';",
    },
    {
      code: "import path from 'node:path';",
    },
    {
      code: "const helper = { crypto: { randomUUID: () => '' } }; helper.crypto.randomUUID();",
    },
    {
      code: "const value = obj.crypto.randomUUID();",
    },
  ],
  invalid: [
    {
      code: "import * as crypto from 'crypto';",
      errors: [{ messageId: "noCrypto" }],
    },
    {
      code: "import { randomBytes } from 'node:crypto';",
      errors: [{ messageId: "noCrypto" }],
    },
    {
      code: "const crypto = require('crypto');",
      errors: [{ messageId: "noCrypto" }],
    },
    {
      code: "await import('node:crypto');",
      errors: [{ messageId: "noCrypto" }],
    },
    {
      code: "export * from 'crypto';",
      errors: [{ messageId: "noCrypto" }],
    },
    {
      code: "import crypto = require('node:crypto');",
      errors: [{ messageId: "noCrypto" }],
    },
    {
      code: "const id = crypto.randomUUID();",
      errors: [{ messageId: "noCrypto" }],
    },
    {
      code: "globalThis.crypto.getRandomValues(buffer);",
      errors: [{ messageId: "noCrypto" }],
    },
    {
      code: "window.crypto.subtle.digest('SHA-256', data);",
      errors: [{ messageId: "noCrypto" }],
    },
  ],
});
