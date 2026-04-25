import accountabilityRules from "./accountability/index.js";
import banVanillaRules from "./ban-vanilla/index.js";
import catenarycloudRules from "./catenarycloud/index.js";

const rules = {
  ...accountabilityRules,
  ...banVanillaRules,
  ...catenarycloudRules,
};

export default rules;
