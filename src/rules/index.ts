import accountabilityRules from "./accountability/index.js";
import noError from "./no-error.js";
import noExplicitFunctionReturnType from "./no-explicit-function-return-type.js";
import noFor from "./no-for.js";
import noJsonParse from "./no-json-parse.js";
import noNull from "./no-null.js";
import noNullishCoalescing from "./no-nullish-coalescing.js";
import noNodeChildProcess from "./no-node-child-process.js";
import noOptionalChaining from "./no-optional-chaining.js";
import noPromise from "./no-promise.js";
import noProcessEnv from "./no-process-env.js";
import noSwitch from "./no-switch.js";
import noThrow from "./no-throw.js";
import noTypeAssertion from "./no-type-assertion.js";
import noTry from "./no-try.js";
import noUndefined from "./no-undefined.js";

const rules = {
  ...accountabilityRules,
  "no-error": noError,
  "no-explicit-function-return-type": noExplicitFunctionReturnType,
  "no-for": noFor,
  "no-json-parse": noJsonParse,
  "no-null": noNull,
  "no-nullish-coalescing": noNullishCoalescing,
  "no-node-child-process": noNodeChildProcess,
  "no-optional-chaining": noOptionalChaining,
  "no-promise": noPromise,
  "no-process-env": noProcessEnv,
  "no-switch": noSwitch,
  "no-throw": noThrow,
  "no-type-assertion": noTypeAssertion,
  "no-try": noTry,
  "no-undefined": noUndefined,
};

export default rules;
