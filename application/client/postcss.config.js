import postcssImport from "postcss-import";
import postcssPresetEnv from "postcss-preset-env";

export const plugins = [
  postcssImport(),
  postcssPresetEnv({
    stage: 3,
  }),
];
