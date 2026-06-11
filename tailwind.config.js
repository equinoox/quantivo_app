/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#eef8ff", 500: "#1f8fff", 700: "#0c5fb3" },
        ink: "#172033",
        muted: "#697386",
        surface: "#ffffff",
        background: "#f4f7fb",
      },
    },
  },
  plugins: [],
};
