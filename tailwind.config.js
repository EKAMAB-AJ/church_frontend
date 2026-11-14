/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 50: '#f3f6f9', 100: '#e3eaf1', 200: '#c4d2e0', 300: '#93abc4', 400: '#5f81a3', 500: '#3e6287', 600: '#2c4b6c', 700: '#213a55', 800: '#182b40', 900: '#101e2e', 950: '#0a1420' },
        brass: { 100: '#f6efdc', 300: '#e2cd96', 500: '#b8954a', 600: '#9a7a35', 700: '#7a5f28' },
        paper: '#fbfaf7',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
      boxShadow: { card: '0 1px 2px rgba(16,30,46,.06), 0 1px 1px rgba(16,30,46,.04)' },
    },
  },
  plugins: [],
}
