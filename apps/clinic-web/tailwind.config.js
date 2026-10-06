const plugin = require('tailwindcss/plugin');

const { brandStatic, buildVars, ref, rolePalette, semanticColors } = require('./theme/tokens');

const vars = buildVars();
const fg = rolePalette('fg');
const bg = { ...rolePalette('bg'), white: ref('bg-white') };
const line = rolePalette('line');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ...semanticColors,
        primary: brandStatic.primary,
        secondary: brandStatic.secondary,
        /** Translucent white for overlays on coloured/dark surfaces — never theme-flipped. */
        frost: '#FFFFFF',
        sidebar: {
          DEFAULT: ref('sidebar'),
          muted: '#A5B4FC',
          item: '#EEF2FF',
          active: 'rgba(8, 145, 178, 0.22)',
          accent: '#22D3EE',
          tooltip: '#020617',
        },
      },
      textColor: fg,
      placeholderColor: fg,
      fill: fg,
      stroke: fg,
      caretColor: fg,
      textDecorationColor: fg,
      accentColor: fg,
      backgroundColor: bg,
      gradientColorStops: bg,
      ringOffsetColor: bg,
      borderColor: line,
      ringColor: line,
      divideColor: line,
      outlineColor: line,
      boxShadow: {
        card: '0 1px 2px 0 rgb(var(--shadow) / 0.04), 0 1px 3px 0 rgb(var(--shadow) / 0.05)',
        popover:
          '0 16px 40px -12px rgb(var(--shadow) / 0.22), 0 4px 12px -4px rgb(var(--shadow) / 0.10)',
        nav: '0 1px 0 0 rgb(var(--line) / 0.6), 0 8px 24px -16px rgb(var(--shadow) / 0.18)',
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
        'header-title': ['1.25rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.012em' }],
      },
      maxWidth: {
        content: '1280px',
      },
      screens: {
        tablet: '768px',
        laptop: '1280px',
        desktop: '1440px',
        wide: '1600px',
        ultra: '1800px',
      },
      keyframes: {
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(-4px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 140ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...vars.light, colorScheme: 'light' },
        '.dark': { ...vars.dark, colorScheme: 'dark' },
      });
    }),
  ],
};
