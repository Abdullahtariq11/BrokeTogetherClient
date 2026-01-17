/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Your brand palette
        primary: "#E98074",    // Salmon
        secondary: "#8E8D8A",  // Sage/Gray
        background: "#F9FAFB", // Off-white
        accent: "#E85A4F",     // Darker Salmon for buttons
      },
    },
  },
  plugins: [],
};