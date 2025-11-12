module.exports = {
  darkMode: 'class',
  content: [
    './views/**/*.ejs',
    './public/**/*.js',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#f97316',
          dark: '#ea580c',
          muted: '#fed7aa',
        },
        surface: {
          DEFAULT: '#0f172a',
          light: '#f8fafc',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
      },
      boxShadow: {
        soft: '0 10px 50px rgba(15, 23, 42, 0.15)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
