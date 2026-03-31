const postcssImport = require("postcss-import");
const tailwindcss = require("@tailwindcss/postcss");

module.exports = {
  plugins: [
    postcssImport(),
    tailwindcss(),
  ],
};
