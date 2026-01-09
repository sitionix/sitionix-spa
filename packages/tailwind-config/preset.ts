import type { Config } from "tailwindcss";

const preset: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7ff",
          100: "#ebeefe",
          500: "#4f46e5",
          600: "#4338ca"
        }
      }
    }
  },
  plugins: []
};

export default preset;
