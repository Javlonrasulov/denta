/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './features/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#153E75',
          muted: '#E8F0FA',
          pressed: '#0F2D56',
        },
        secondary: {
          DEFAULT: '#0891B2',
          muted: '#E0F7FA',
        },
        success: {
          DEFAULT: '#059669',
          muted: '#ECFDF5',
        },
        warning: {
          DEFAULT: '#D97706',
          muted: '#FFFBEB',
        },
        error: {
          DEFAULT: '#DC2626',
          muted: '#FEF2F2',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#EEF2F6',
          elevated: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
        },
        canvas: '#F5F7FA',
        line: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Onest_400Regular'],
        medium: ['Onest_500Medium'],
        semibold: ['Manrope_600SemiBold'],
        bold: ['Manrope_700Bold'],
        display: ['Manrope_700Bold'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      spacing: {
        '4.5': '18px',
        '13': '52px',
        '15': '60px',
      },
    },
  },
  plugins: [],
};
