export default {
  darkMode: "class",

  content: [
    "./app/**/*.{ts,tsx,jsx,js,mdx}",
    "./components/**/*.{ts,tsx,jsx,js,mdx}",
    "./src/**/*.{ts,tsx,jsx,js,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        "brand-light": "var(--brand-light)",
        "brand-dark": "var(--brand-dark)",
        "brand-gradient-1": "var(--brand-gradient-1)",
        "brand-gradient-2": "var(--brand-gradient-2)",

        "light-bg": "var(--light-bg)",
        "light-surface": "var(--light-surface)",
        "light-text": "var(--light-text)",
        "light-text-secondary": "var(--light-text-secondary)",

        "dark-bg": "var(--dark-bg)",
        "dark-surface": "var(--dark-surface)",
        "dark-text": "var(--dark-text)",
        "dark-text-secondary": "var(--dark-text-secondary)",

        positive: "var(--positive)",
        negative: "var(--negative)",
        border: "var(--border)",
      },
    },
  },
};
