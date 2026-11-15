/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand palette — matches web redesign exactly
        primary: "#fb7185",
        "primary-dark": "#e94e6a",
        "primary-soft": "#fff0f2",
        canvas: "#f8f9fb",
        surface: "#ffffff",
        "surface-soft": "#f2f3f8",
        ink: "#111827",
        muted: "#6b7280",
        line: "#e9ebf0",
        positive: "#047857",
        "positive-soft": "#ecfdf5",
        negative: "#dc2626",
        "negative-soft": "#fef2f2",
        // Dark mode
        "canvas-dark": "#11151f",
        "surface-dark": "#1a2030",
        "surface-soft-dark": "#232b3d",
        "ink-dark": "#f2f4f8",
        "muted-dark": "#a4aec1",
        "line-dark": "#2e374a",
      },
    },
  },
  plugins: [],
};
