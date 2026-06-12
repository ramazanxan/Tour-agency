import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Природа КР: глубокий синий озёр, белый вершин, тёплый оранжевый закатов
        lake: {
          50: '#eef6fb',
          100: '#d4e8f5',
          200: '#a9d1ea',
          300: '#73b3da',
          400: '#4192c5',
          500: '#2b76ab',
          600: '#235e8c',
          700: '#1f4d71',
          800: '#1d415e',
          900: '#0f2a40',
          950: '#081826',
        },
        sunset: {
          50: '#fff5ed',
          100: '#ffe7d3',
          200: '#ffcaa6',
          300: '#ffa46d',
          400: '#fe7332',
          500: '#fc5212',
          600: '#ed3808',
          700: '#c52709',
          800: '#9c2010',
          900: '#7e1e10',
        },
        peak: '#f7fafc',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        'fill-up': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--fill-target)' },
        },
        'heart-pop': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.35)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fill-up': 'fill-up 0.9s ease-out forwards',
        'heart-pop': 'heart-pop 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
