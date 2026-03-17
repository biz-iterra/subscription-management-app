import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          50: "#EEEEFF",
          100: "#D8D7FF",
          200: "#B8B5FF",
          300: "#9794FF",
          400: "#7773FF",
          500: "#4F46E5",
          600: "#3730BD",
          700: "#2B2494",
          800: "#1E196B",
          900: "#110F42",
        },
        secondary: {
          DEFAULT: "#10B981",
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        accent: {
          DEFAULT: "#F59E0B",
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
        base: {
          DEFAULT: "#F8FAFC",
        },
        ink: {
          DEFAULT: "#1E293B",
          light: "#475569",
          lighter: "#94A3B8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
