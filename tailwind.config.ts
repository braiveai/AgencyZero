import type { Config } from "tailwindcss";

// Palette mirrors the Sunny "sunnyrev" editorial system so Agency Zero reads as a
// sibling of the budget tool — warm paper, ink text, Sunny gold accent — but leans
// a touch more confidential/executive (deeper inks, restrained accent use).
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F2",
        surface: "#FFFFFF",
        ink: {
          900: "#1A1814",
          700: "#3A352D",
          500: "#5C5750",
          300: "#8B8478",
          200: "#B5AE9F",
        },
        rule: "#E8E2D7",
        rule_soft: "#F1ECDF",
        accent: {
          DEFAULT: "#FDB600", // Sunny brand gold
          dark: "#9A7100",
          soft: "#FFE6A1",
          wash: "#FFF7E0",
        },
        positive: "#3E5C3A",
        negative: "#A33D2E",
        flag: "#B8842A",
        // Automation-ladder scale L0 (human) -> L4 (hands-off)
        ladder: {
          l0: "#8B8478",
          l1: "#B8842A",
          l2: "#9A7100",
          l3: "#3E5C3A",
          l4: "#4977B4",
        },
      },
      fontFamily: {
        display: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(26, 24, 20, 0.04), 0 1px 1px rgba(26, 24, 20, 0.02)",
        card: "0 1px 0 rgba(26, 24, 20, 0.04), 0 4px 12px rgba(26, 24, 20, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
