const postcssImport = require("postcss-import");
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");
const postcssPresetEnv = require("postcss-preset-env");

module.exports = {
  plugins: [
    postcssImport(),
    tailwindcss(),
    autoprefixer(),
    postcssPresetEnv({
      stage: 3,
    }),
  ],
};
