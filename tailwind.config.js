/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        grotesque: ["BasisGrotesquePro", "sans-serif"],
      },
      boxShadow: {
        'sm': 'none',
        'DEFAULT': 'none',
        'md': 'none',
        'lg': 'none',
        'xl': 'none',
        '2xl': 'none',
        'inner': 'none',
      },
    },
  },
  plugins: [],
}
