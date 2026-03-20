const path = require("path");

const tailwindcss = require("@tailwindcss/postcss");
const postcssPresetEnv = require("postcss-preset-env");

module.exports = {
  plugins: [
    tailwindcss({
      base: path.resolve(__dirname),
    }),
    postcssPresetEnv({
      stage: 3,
    }),
  ],
};
