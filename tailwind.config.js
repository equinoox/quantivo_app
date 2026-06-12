/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#D6E0F0",
        secondary: "#393B44",
        secondary_dark: "#22313f",
        orange: "#FFA001",
        text_color_1: "#393B44",
        text_color_2: "#F1F3F8",
        brand: { 50: "#F1F3F8", 500: "#393B44", 700: "#22313f" },
        ink: "#393B44",
        muted: "#6f7480",
        surface: "#ffffff",
        background: "#F1F3F8",
      },
    },
  },
  plugins: [],
};
