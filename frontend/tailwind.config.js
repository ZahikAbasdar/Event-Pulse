/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#fbeef0',
          100: '#f4d2d7',
          200: '#e5a3ac',
          300: '#d57480',
          400: '#b8465a',
          500: '#7A1F2B', // PCTE primary maroon
          600: '#6b1a25',
          700: '#59151e',
          800: '#471117',
          900: '#360d11',
        },
        gold: {
          50: '#fdf8ec',
          100: '#faedc6',
          200: '#f3da8d',
          300: '#e9c359',
          400: '#d9ae37',
          500: '#C9A227', // PCTE accent gold
          600: '#a3811f',
          700: '#7c621a',
          800: '#584613',
          900: '#3a2f0d',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        fadeInUp: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s ease-out both',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
