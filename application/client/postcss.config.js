const postcssPresetEnv = require("postcss-preset-env");

module.exports = {
  plugins: [
    require("@tailwindcss/postcss"),
    postcssPresetEnv({
      stage: 3,
    }),
  ],
};
