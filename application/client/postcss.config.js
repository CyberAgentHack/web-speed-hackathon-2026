const postcssImport = require("postcss-import");
const postcssPresetEnv = require("postcss-preset-env");

module.exports = {
  plugins: [
    postcssImport(),
    require("@tailwindcss/postcss"),
    postcssPresetEnv({
      stage: 3,
    }),
  ],
};
