/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: ["./entrypoints/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  plugins: [require("@tailwindcss/forms")],
}

export default config
