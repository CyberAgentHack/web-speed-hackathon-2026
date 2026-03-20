const tailwindcss = require("@tailwindcss/postcss");
const postcssPresetEnv = require("postcss-preset-env");

module.exports = {
  plugins: [
    tailwindcss(),
    postcssPresetEnv({
      stage: 3,
    }),
  ],
};
