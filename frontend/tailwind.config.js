/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd6ff',
          300: '#8fbaff',
          400: '#5b92ff',
          500: '#2f6bff',
          600: '#1b4df5',
          700: '#163dd0',
          800: '#1736a6',
          900: '#1a3283'
        }
      },
      maxWidth: {
        '8xl': '88rem'
      }
    }
  },
  plugins: []
}
