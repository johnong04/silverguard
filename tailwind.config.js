/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "rgb(39 39 42)",
        input: "rgb(39 39 42)",
        ring: "rgb(212 212 216)",
        background: "#09090B",
        foreground: "#FAFAF9",
        primary: {
          DEFAULT: "#F59E0B", // Warm Amber
          foreground: "#09090B",
        },
        secondary: {
          DEFAULT: "#1C1917", // Stone-900ish for luxury dark
          foreground: "#FAFAF9",
        },
        destructive: {
          DEFAULT: "#DC2626", // Deep Crimson
          foreground: "#FAFAF9",
        },
        safe: {
          DEFAULT: "#10B981", // Jade Green
          foreground: "#FAFAF9",
        },
        muted: {
          DEFAULT: "#1C1917",
          foreground: "#A8A29E", // Stone Gray
        },
        accent: {
          DEFAULT: "#F59E0B",
          foreground: "#09090B",
        },
        popover: {
          DEFAULT: "#09090B",
          foreground: "#FAFAF9",
        },
        card: {
          DEFAULT: "#09090B",
          foreground: "#FAFAF9",
        },
      },
      fontFamily: {
        serif: ["DMSerifDisplay_400Regular"],
        sans: ["DMSans_400Regular", "DMSans_500Medium", "DMSans_700Bold"],
      },
      borderRadius: {
        lg: "1rem",
        md: "calc(1rem - 2px)",
        sm: "calc(1rem - 4px)",
      },
      keyframes: {
        "status-pulse": {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.5, transform: "scale(1.05)" },
        },
        strobe: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.2 },
        },
      },
      animation: {
        "status-pulse": "status-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        strobe: "strobe 1s steps(2, start) infinite",
      },
    },
  },
  plugins: [],
};
