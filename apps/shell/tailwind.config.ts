import type { Config } from "tailwindcss";
import preset from "../../packages/tailwind-config/preset";

const config: Config = {
  presets: [preset],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  plugins: [],
};

export default config;
