/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        magenta: {
          400: '#f472b6',
          500: '#ec4899',
        },
      },
    },
  },
  plugins: [],
}
