/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./en/*.html"],
  theme: {
    extend: {
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}

