/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#d9f0ff",
          500: "#0f766e",
          600: "#0b5f59",
          700: "#0b4f4c"
        },
        accent: "#f59e0b"
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};
