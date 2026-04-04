const postcssImport = require("postcss-import");
const postcssPresetEnv = require("postcss-preset-env");
const tailwindPostcss = require("@tailwindcss/postcss");

module.exports = {
  plugins: [
    postcssImport(),
    tailwindPostcss(),
    postcssPresetEnv({
      stage: 3,
    }),
  ],
};
