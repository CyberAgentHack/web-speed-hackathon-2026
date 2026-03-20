const postcssImport = require("postcss-import");
const postcssPresetEnv = require("postcss-preset-env");
const tailwindcss = require("@tailwindcss/postcss");

module.exports = {
  plugins: [
    postcssImport(),
    tailwindcss(),
    postcssPresetEnv({
      stage: 3,
    }),
  ],
};
