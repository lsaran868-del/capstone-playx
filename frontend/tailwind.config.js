/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        muse: {
          bg: '#0c0514',
          dark: '#08030e',
          card: '#160924',
          hover: '#25103a',
          purple: '#9d4edd',
          pink: '#e02b88',
          subtext: '#9f92b4',
          border: 'rgba(224, 43, 136, 0.18)',
          glow: 'rgba(157, 78, 221, 0.15)'
        },
        spotify: {
          green: '#e02b88',
          dark: '#0c0514',
          black: '#08030e',
          card: '#160924',
          hover: '#25103a',
          subtext: '#9f92b4',
          accent: '#e02b88'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Syne', '"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['Syne', '"Plus Jakarta Sans"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
