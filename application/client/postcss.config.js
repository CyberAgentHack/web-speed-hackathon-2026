const postcssImport = require("postcss-import");
const tailwindcss = require("@tailwindcss/postcss");
const postcssPresetEnv = require("postcss-preset-env");

module.exports = {
  plugins: [
    tailwindcss(),
    postcssImport(),
    postcssPresetEnv({
      stage: 3,
    }),
  ],
};
