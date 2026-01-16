/** @type {import('tailwindcss').Config} */
export default {
  // Force rebuild timestamp: 2024-01-16
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#007AFF', // Apple Blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Keeping sage for backward compatibility if any, but will migrate
        sage: {
          50: '#f4f7f4',
          100: '#e7ede7',
          200: '#cfdccf',
          300: '#b7cbb7',
          400: '#9caf88', // Old sage color
          500: '#849b6d',
          600: '#667954',
          700: '#4c5a3f',
          800: '#333c2a',
          900: '#191e15',
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'zoom-in': 'zoom-in 0.5s ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'zoom-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}