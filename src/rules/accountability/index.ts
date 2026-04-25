import noDisableValidation from "./no-disable-validation.js";
import noEffectAsVoid from "./no-effect-asvoid.js";
import noEffectCatchAllCause from "./no-effect-catchallcause.js";
import noEffectIgnore from "./no-effect-ignore.js";
import noLocalStorage from "./no-localstorage.js";
import noLocationHrefRedirect from "./no-location-href-redirect.js";
import noNestedLayerProvide from "./no-nested-layer-provide.js";
import noServiceOption from "./no-service-option.js";
import noSilentErrorSwallow from "./no-silent-error-swallow.js";
import noSqlTypeParameter from "./no-sql-type-parameter.js";
import pipeMaxArguments from "./pipe-max-arguments.js";
import preferOptionFromNullable from "./prefer-option-from-nullable.js";
import noVoidExpression from "./no-void-expression.js";

const accountabilityRules = {
  "no-disable-validation": noDisableValidation,
  "no-effect-asvoid": noEffectAsVoid,
  "no-effect-catchallcause": noEffectCatchAllCause,
  "no-effect-ignore": noEffectIgnore,
  "no-localstorage": noLocalStorage,
  "no-location-href-redirect": noLocationHrefRedirect,
  "no-nested-layer-provide": noNestedLayerProvide,
  "no-service-option": noServiceOption,
  "no-silent-error-swallow": noSilentErrorSwallow,
  "no-sql-type-parameter": noSqlTypeParameter,
  "pipe-max-arguments": pipeMaxArguments,
  "prefer-option-from-nullable": preferOptionFromNullable,
  "no-void-expression": noVoidExpression,
};

export default accountabilityRules;
