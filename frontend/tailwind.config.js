/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        card: '0 10px 30px -12px rgba(15, 23, 42, 0.18)',
      },
      colors: {
        brand: {
          50: '#ecf6ff',
          100: '#d9ecff',
          200: '#b7dcff',
          300: '#8cc8ff',
          400: '#59adff',
          500: '#358eff',
          600: '#1f6de2',
          700: '#1b57b8',
          800: '#1d4b94',
          900: '#1f4278',
        },
      },
    },
  },
  plugins: [],
}

