/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}", 
    "./src/**/*.{js,jsx,ts,tsx}",   // <--- This covers everything in src
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"    // Useful if you use Expo Router later
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Your brand palette
        primary: "#E98074",    // Salmon
        "primary-dark": "#D05A4A", // Darker salmon, matches web dark-mode gradient
        secondary: "#8E8D8A",  // Sage/Gray
        background: "#F1F5F9", // Light slate — darker than pure white for better card contrast
        accent: "#E85A4F",     // Darker Salmon for buttons
      },
    },
  },
  plugins: [],
};