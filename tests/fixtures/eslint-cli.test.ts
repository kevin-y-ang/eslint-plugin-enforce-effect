import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../..");
const nodeExecutable = process.execPath;
const tscCli = path.join(repoRoot, "node_modules/typescript/bin/tsc");
const eslintCli = path.join(repoRoot, "node_modules/eslint/bin/eslint.js");
const fixtureConfig = path.join(repoRoot, "fixtures/eslint.config.mjs");
const validFixturesDir = path.join(repoRoot, "fixtures/valid");
const invalidFixturesDir = path.join(repoRoot, "fixtures/invalid");

function runNodeScript(args: string[]) {
  const result = spawnSync(nodeExecutable, args, {
    cwd: repoRoot,
    encoding: "utf8",
  });

  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
  };
}

function runEslint(target: string) {
  return runNodeScript([eslintCli, "--config", fixtureConfig, target]);
}

beforeAll(() => {
  const buildResult = runNodeScript([tscCli, "-p", "tsconfig.build.json"]);

  expect(buildResult.status, buildResult.output).toBe(0);
});

describe("eslint cli fixtures", () => {
  it("accepts the valid fixture suite", { timeout: 20000 }, () => {
    const result = runEslint(validFixturesDir);

    expect(result.status, result.output).toBe(0);
    expect(result.output).toBe("");
  });

  it(
    "reports the expected violations for the invalid fixture suite",
    { timeout: 20000 },
    () => {
    const result = runEslint(invalidFixturesDir);

    expect(result.status).toBe(1);
    expect(result.output).toContain("enforce-effect/no-error");
    expect(result.output).toContain(
      "enforce-effect/no-explicit-function-return-type",
    );
    expect(result.output).toContain("enforce-effect/no-for");
    expect(result.output).toContain("enforce-effect/no-json-parse");
    expect(result.output).toContain("enforce-effect/no-null");
    expect(result.output).toContain("enforce-effect/no-nullish-coalescing");
    expect(result.output).toContain("enforce-effect/no-node-child-process");
    expect(result.output).toContain("enforce-effect/no-optional-chaining");
    expect(result.output).toContain("enforce-effect/no-promise");
    expect(result.output).toContain("enforce-effect/no-process-env");
    expect(result.output).toContain("enforce-effect/no-switch");
    expect(result.output).toContain("enforce-effect/no-throw");
    expect(result.output).toContain("enforce-effect/no-type-assertion");
    expect(result.output).toContain("enforce-effect/no-try");
    expect(result.output).toContain("enforce-effect/no-undefined");
    expect(result.output).toContain("28 problems");
    },
  );
});
