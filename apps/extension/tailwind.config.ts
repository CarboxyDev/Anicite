import type { Config } from 'tailwindcss';

export default {
  darkMode: 'media',
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#b9d4ff',
          300: '#8cb6ff',
          400: '#5a92ff',
          500: '#2f6bff',
          600: '#1f52f2',
          700: '#1a3fbe',
          800: '#1a3794',
          900: '#1b3176',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 25px -12px rgba(20, 34, 90, 0.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;
