/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "rgb(var(--brand-50))",
          100: "rgb(var(--brand-100))",
          200: "rgb(var(--brand-200))",
          300: "rgb(var(--brand-300))",
          400: "rgb(var(--brand-400))",
          500: "rgb(var(--brand-500))",
          600: "rgb(var(--brand-600))",
          700: "rgb(var(--brand-700))",
          800: "rgb(var(--brand-800))",
          900: "rgb(var(--brand-900))",
          950: "rgb(var(--brand-950))",
        },
      },
      screens: {
        "3xl": "1920px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        shimmer: "shimmer 1.5s infinite",
        float: "float 4s ease-in-out infinite",
        "spin-slow": "spin-slow 3s linear infinite",
      },
    },
  },
  plugins: [],
};