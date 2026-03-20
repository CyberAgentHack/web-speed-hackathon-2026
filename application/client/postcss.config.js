const tailwindcss = require("@tailwindcss/postcss");
const trimTailwind = require("./postcss-trim-tailwind");

module.exports = {
  plugins: [
    tailwindcss(),
    trimTailwind(),
  ],
};
