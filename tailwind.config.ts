// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/viewmodels/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#01696f",
          hover: "#0c4e54",
          active: "#0f3638",
        },
        base: "#171614",
        surface: {
          DEFAULT: "#1c1b19",
          2: "#201f1d",
          offset: "#2d2c2a",
        },
        text: {
          primary: "#cdccca",
          muted: "#797876",
          faint: "#5a5957",
        },
        border: "#393836",
      },
      fontFamily: {
        inter: ["var(--font-inter)"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
