const postcssImport = require("postcss-import");
const tailwindPostcss = require("@tailwindcss/postcss");
const postcssPresetEnv = require("postcss-preset-env");

module.exports = {
  plugins: [
    postcssImport(),
    tailwindPostcss(),
    postcssPresetEnv({
      stage: 3,
    }),
  ],
};
