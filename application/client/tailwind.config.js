/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        cax: {
          canvas: "var(--color-stone-100)",
          surface: "var(--color-white)",
          "surface-raised": "var(--color-white)",
          "surface-subtle": "var(--color-stone-50)",
          overlay: "var(--color-slate-950)",
          border: "var(--color-stone-300)",
          "border-strong": "var(--color-stone-400)",
          text: "var(--color-teal-950)",
          "text-muted": "var(--color-teal-700)",
          "text-subtle": "var(--color-slate-500)",
          brand: "var(--color-teal-700)",
          "brand-strong": "var(--color-teal-800)",
          "brand-soft": "var(--color-teal-100)",
          accent: "var(--color-orange-700)",
          "accent-soft": "var(--color-orange-100)",
          danger: "var(--color-red-600)",
          "danger-soft": "var(--color-red-100)",
          highlight: "var(--color-amber-200)",
          "highlight-ink": "var(--color-amber-950)",
        },
      },
    },
  },
  plugins: [],
};
