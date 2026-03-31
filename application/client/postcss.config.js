import tailwindcss from "@tailwindcss/postcss";
import postcssImport from "postcss-import";
import postcssPresetEnv from "postcss-preset-env";

export const plugins = [
  postcssImport(),
  tailwindcss(),
  postcssPresetEnv({
    stage: 3,
  }),
];
