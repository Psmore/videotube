import globals from "globals";
import pluginJs from "@eslint/js";

// when you get preconfig this file it has configurations
// globals.browser so change it to globals.node
// otherwise it gives error of process not defined
export default [
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
];