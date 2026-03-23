const tailwindcss = require("@tailwindcss/postcss");
const postcssImport = require("postcss-import");

module.exports = {
  plugins: [
    postcssImport(),
    tailwindcss(),
  ],
};
