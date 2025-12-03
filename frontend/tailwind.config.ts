import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",

  content: [
    "./app/**/*.{ts,tsx,jsx,js,mdx}",
    "./components/**/*.{ts,tsx,jsx,js,mdx}",
    "./utils/**/*.{ts,tsx,js}",
  ],

  theme: {
    extend: {
      colors: {
        brand: "var(--color-brand)",
        "brand-dark": "var(--color-brand-dark)",
        "brand-light": "var(--color-brand-light)",
        "brand-glow": "var(--color-brand-glow)",

        "bg-main": "var(--color-bg)",
        "bg-surface": "var(--color-bg-surface)",
        "bg-elevated": "var(--color-bg-elevated)",

        text: "var(--color-text)",
        "text-secondary": "var(--color-text-secondary)",

        positive: "var(--color-positive)",
        "positive-soft": "var(--color-positive-soft)",

        negative: "var(--color-negative)",
        "negative-soft": "var(--color-negative-soft)",

        border: "var(--color-border)",

        blue: "var(--color-blue)",
        yellow: "var(--color-yellow)",
        purple: "var(--color-purple)",
      },
    },
  },
  plugins: [],
};

export default config;
