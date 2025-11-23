/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: "var(--color-brand)",
        brandLight: "var(--color-brand-light)",
        brandDark: "var(--color-brand-dark)",

        // Backgrounds
        bgMain: "var(--color-bg)",
        bgSurface: "var(--color-bg-surface)",

        // Text
        textMain: "var(--color-text)",
        textSecondary: "var(--color-text-secondary)",

        // Alerts
        positive: "var(--color-positive)",
        negative: "var(--color-negative)",

        // Border
        borderMain: "var(--color-border)",
      },
    },
  },
  plugins: [],
};
