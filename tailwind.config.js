/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0A4370",
        background: "#F3F4F6",
        "secondary-text": "#6A717D",
        "dark-text": "#1A202C",
        border: "#E2E8F0",
        danger: "#E53E3E",
        success: "#38A169",
        overlay: "rgba(10, 67, 112, 0.08)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "28px",
      },
      fontSize: {
        "2xs": "11px",
        "3xs": "10px",
      },
    },
  },
  plugins: [],
};
