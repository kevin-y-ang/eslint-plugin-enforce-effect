import noDate from "./no-date.js";
import noDateInferred from "./no-date-inferred.js";
import noError from "./no-error.js";
import noExplicitFunctionReturnType from "./no-explicit-function-return-type.js";
import noFor from "./no-for.js";
import noFs from "./no-fs.js";
import noJsonParse from "./no-json-parse.js";
import noNodeChildProcess from "./no-node-child-process.js";
import noNull from "./no-null.js";
import noNullishCoalescing from "./no-nullish-coalescing.js";
import noOptionalChaining from "./no-optional-chaining.js";
import noProcessEnv from "./no-process-env.js";
import noPromise from "./no-promise.js";
import noSwitch from "./no-switch.js";
import noThrow from "./no-throw.js";
import noTry from "./no-try.js";
import noTypeAssertion from "./no-type-assertion.js";
import noUndefined from "./no-undefined.js";
import requireLintDisableJustification from "./require-lint-disable-justification.js";
import noFetch from "./no-fetch.js";

const banVanillaRules = {
  "no-date": noDate,
  "no-date-inferred": noDateInferred,
  "no-error": noError,
  "no-explicit-function-return-type": noExplicitFunctionReturnType,
  "no-for": noFor,
  "no-fs": noFs,
  "no-json-parse": noJsonParse,
  "no-node-child-process": noNodeChildProcess,
  "no-null": noNull,
  "no-nullish-coalescing": noNullishCoalescing,
  "no-optional-chaining": noOptionalChaining,
  "no-process-env": noProcessEnv,
  "no-promise": noPromise,
  "no-switch": noSwitch,
  "no-throw": noThrow,
  "no-try": noTry,
  "no-type-assertion": noTypeAssertion,
  "no-undefined": noUndefined,
  "require-lint-disable-justification": requireLintDisableJustification,
  "no-fetch": noFetch,
};

export default banVanillaRules;
