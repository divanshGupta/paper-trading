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
       boxShadow: {
        'brand-glow': '0 0 20px var(--color-brand-glow)',
        'purple-glow': '0 0 20px rgba(139, 92, 246, 0.25)',
        'positive-glow': '0 0 15px rgba(16, 185, 129, 0.2)',
        'negative-glow': '0 0 15px rgba(255, 59, 98, 0.2)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-purple) 100%)',
      },
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
