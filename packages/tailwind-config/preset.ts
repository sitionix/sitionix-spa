import type { Config } from "tailwindcss";

const brand = {
  50: "var(--color-brand-50)",
  100: "var(--color-brand-100)",
  200: "var(--color-brand-200)",
  300: "var(--color-brand-300)",
  400: "var(--color-brand-400)",
  500: "var(--color-brand-500)",
  600: "var(--color-brand-600)",
  700: "var(--color-brand-700)",
};

const accent = {
  50: "var(--color-accent-50)",
  200: "var(--color-accent-200)",
  300: "var(--color-accent-300)",
  400: "var(--color-accent-400)",
  500: "var(--color-accent-500)",
  600: "var(--color-accent-600)",
  700: "var(--color-accent-700)",
};

const preset: Config = {
  theme: {
    extend: {
      colors: {
        brand,
        accent,
      },
    },
  },
  plugins: [],
};

export default preset;
