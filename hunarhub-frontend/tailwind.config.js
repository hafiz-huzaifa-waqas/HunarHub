/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: { 50: '#FAF9F6', 100: '#F5F3EF', 200: '#EAE6DF', 300: '#DDD7CD' },
        maroon: { DEFAULT: '#701C28', hover: '#58141F', light: '#F8EFF1', dark: '#4A111A' },
        brown: { DEFAULT: '#3B2219', dark: '#2C1810', hover: '#26140D', light: '#F5EFEA' },
        gold: { DEFAULT: '#D4AF37', soft: '#C5A059', bg: '#FAF6ED' },
        charcoal: '#1A1A1A',
        muted: '#666666',
      },
      fontFamily: {
       serif: ['"Fraunces"', 'Georgia', 'serif'],
       sans: ['"Manrope"', 'sans-serif'],
      },
      boxShadow: {
        warm: '0 10px 30px -5px rgba(112, 28, 40, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
        'warm-hover': '0 20px 40px -10px rgba(112, 28, 40, 0.1), 0 8px 20px -4px rgba(0, 0, 0, 0.06)',
        card: '0 2px 10px rgba(0,0,0,0.03), 0 10px 25px -5px rgba(0,0,0,0.04)',
        drawer: '-10px 0 30px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
