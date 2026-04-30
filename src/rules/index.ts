import noConsole from "./no-console.js";
import noCrypto from "./no-crypto.js";
import noDate from "./no-date.js";
import noDateTypeChecked from "./no-date-type-checked.js";
import noError from "./no-error.js";
import noErrorTypeChecked from "./no-error-type-checked.js";
import noExplicitFunctionReturnType from "./no-explicit-function-return-type.js";
import noFetch from "./no-fetch.js";
import noFor from "./no-for.js";
import noFs from "./no-fs.js";
import noJsonParse from "./no-json-parse.js";
import noJsonStringify from "./no-json-stringify.js";
import noMathRandom from "./no-math-random.js";
import noNodeChildProcess from "./no-node-child-process.js";
import noNull from "./no-null.js";
import noNullTypeChecked from "./no-null-type-checked.js";
import noNullishCoalescing from "./no-nullish-coalescing.js";
import noOptionalChaining from "./no-optional-chaining.js";
import noPerformanceNow from "./no-performance-now.js";
import noProcessEnv from "./no-process-env.js";
import noPromise from "./no-promise.js";
import noPromiseTypeChecked from "./no-promise-type-checked.js";
import noSwitch from "./no-switch.js";
import noThrow from "./no-throw.js";
import noTimers from "./no-timers.js";
import noTry from "./no-try.js";
import noTypeAssertion from "./no-type-assertion.js";
import noUndefined from "./no-undefined.js";
import noUndefinedTypeChecked from "./no-undefined-type-checked.js";
import requireEslintDisableJustification from "./require-eslint-disable-justification.js";

const rules = {
  "no-console": noConsole,
  "no-crypto": noCrypto,
  "no-date": noDate,
  "no-date-type-checked": noDateTypeChecked,
  "no-error": noError,
  "no-error-type-checked": noErrorTypeChecked,
  "no-explicit-function-return-type": noExplicitFunctionReturnType,
  "no-fetch": noFetch,
  "no-for": noFor,
  "no-fs": noFs,
  "no-json-parse": noJsonParse,
  "no-json-stringify": noJsonStringify,
  "no-math-random": noMathRandom,
  "no-node-child-process": noNodeChildProcess,
  "no-null": noNull,
  "no-null-type-checked": noNullTypeChecked,
  "no-nullish-coalescing": noNullishCoalescing,
  "no-optional-chaining": noOptionalChaining,
  "no-performance-now": noPerformanceNow,
  "no-process-env": noProcessEnv,
  "no-promise": noPromise,
  "no-promise-type-checked": noPromiseTypeChecked,
  "no-switch": noSwitch,
  "no-throw": noThrow,
  "no-timers": noTimers,
  "no-try": noTry,
  "no-type-assertion": noTypeAssertion,
  "no-undefined": noUndefined,
  "no-undefined-type-checked": noUndefinedTypeChecked,
  "require-eslint-disable-justification": requireEslintDisableJustification,
};

export default rules;
