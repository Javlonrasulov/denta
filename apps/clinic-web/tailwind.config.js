/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4338CA',
          muted: '#EEF2FF',
          pressed: '#3730A3',
        },
        secondary: {
          DEFAULT: '#0891B2',
          muted: '#ECFEFF',
        },
        sidebar: {
          DEFAULT: '#1E1B4B',
          muted: '#A5B4FC',
          item: '#EEF2FF',
          active: 'rgba(8, 145, 178, 0.22)',
          accent: '#22D3EE',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['var(--font-onest)', 'sans-serif'],
        display: ['var(--font-onest)', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['1.75rem', { lineHeight: '1.25', fontWeight: '700', letterSpacing: '-0.01em' }],
        'section-title': ['1.125rem', { lineHeight: '1.35', fontWeight: '600', letterSpacing: '-0.005em' }],
        'nav-item': ['0.875rem', { lineHeight: '1.35', letterSpacing: '0' }],
        'table-head': ['0.75rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.02em' }],
        'table-cell': ['0.8125rem', { lineHeight: '1.4', fontWeight: '400' }],
        kpi: ['1.75rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.015em' }],
        caption: ['0.75rem', { lineHeight: '1.35', fontWeight: '400' }],
      },
      maxWidth: {
        content: '1280px',
      },
      screens: {
        tablet: '768px',
        laptop: '1280px',
        desktop: '1440px',
      },
    },
  },
  plugins: [],
};
