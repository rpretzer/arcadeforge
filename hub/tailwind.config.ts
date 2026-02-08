import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        neon: "#00ff41",
        "dark-bg": "#0a0a0a",
        accent: "#00d4ff",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 12px rgba(0, 255, 65, 0.4)",
        "neon-lg": "0 0 24px rgba(0, 255, 65, 0.5)",
        accent: "0 0 12px rgba(0, 212, 255, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
