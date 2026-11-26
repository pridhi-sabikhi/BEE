/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
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
        docblue: {
          50: '#e8f0fe',
          100: '#d2e3fc',
          500: '#1a73e8',
          600: '#1557b0',
          700: '#174ea6',
        },
        sidebar: '#0f172a',
        'sidebar-light': '#1e293b',
        accent: '#4f46e5',
        'ai-bg': '#f5f3ff',
      },
      boxShadow: {
        paper: '0 1px 3px 1px rgba(60,64,67,0.15), 0 1px 2px 0 rgba(60,64,67,0.3)',
        'paper-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.05)',
        float: '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
