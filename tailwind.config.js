module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html'
  ],
  theme: {
    extend: {
      colors: {
        'warm-white': '#faf9f7',
        'warm-gray': '#f5f4f2',
        'indigo': {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        'cream': {
          50: '#fdfbf7',
          100: '#faf6ed',
          200: '#f5ebd6',
          300: '#eddbb8',
          400: '#e3c694',
          500: '#d9b06f',
          600: '#c99a52',
          700: '#a67d3f',
          800: '#856535',
          900: '#6d532d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    }
  },
  plugins: []
};
