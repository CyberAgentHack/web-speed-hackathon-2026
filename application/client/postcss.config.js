const postcssImport = require("postcss-import");
const postcssPresetEnv = require("postcss-preset-env");

module.exports = {
  plugins: [
    postcssImport(),
    "@tailwindcss/postcss",
    postcssPresetEnv({
      stage: 3,
    }),
  ],
};
