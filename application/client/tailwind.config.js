/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        cax: {
          canvas: "rgb(245 245 244)", // stone-100
          surface: "rgb(255 255 255)", // white
          "surface-raised": "rgb(255 255 255)", // white
          "surface-subtle": "rgb(250 250 249)", // stone-50
          overlay: "rgb(2 6 23)", // slate-950
          border: "rgb(214 211 209)", // stone-300
          "border-strong": "rgb(168 162 158)", // stone-400
          text: "rgb(4 47 46)", // teal-950
          "text-muted": "rgb(15 118 110)", // teal-700
          "text-subtle": "rgb(100 116 139)", // slate-500
          brand: "rgb(15 118 110)", // teal-700
          "brand-strong": "rgb(17 94 89)", // teal-800
          "brand-soft": "rgb(204 251 241)", // teal-100
          accent: "rgb(194 65 12)", // orange-700
          "accent-soft": "rgb(255 237 213)", // orange-100
          danger: "rgb(220 38 38)", // red-600
          "danger-soft": "rgb(254 226 226)", // red-100
          highlight: "rgb(252 211 77)", // amber-200
          "highlight-ink": "rgb(69 26 3)", // amber-950
        },
      },
    },
  },
  plugins: [],
};
