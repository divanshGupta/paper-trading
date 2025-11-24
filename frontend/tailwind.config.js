export default {
  darkMode: "class",

  content: [
    "./app/**/*.{ts,tsx,jsx,js,mdx}",
    "./components/**/*.{ts,tsx,jsx,js,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        // brand
        brand: "var(--color-brand)",
        "brand-dark": "var(--color-brand-dark)",
        "brand-light": "var(--color-brand-light)",
        "brand-glow": "var(--color-brand-glow)",

        // backgrounds
        "bg-main": "var(--color-bg)",
        "bg-surface": "var(--color-bg-surface)",
        "bg-elevated": "var(--color-bg-elevated)",

        // text
        text: "var(--color-text)",
        "text-secondary": "var(--color-text-secondary)",

        // positive / negative
        positive: "var(--color-positive)",
        "positive-soft": "var(--color-positive-soft)",

        negative: "var(--color-negative)",
        "negative-soft": "var(--color-negative-soft)",

        // borders
        border: "var(--color-border)",

        // accents
        blue: "var(--color-blue)",
        yellow: "var(--color-yellow)",
        purple: "var(--color-purple)",
      },
    },
  },
};
