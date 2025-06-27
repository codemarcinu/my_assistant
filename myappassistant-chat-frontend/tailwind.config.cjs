/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        green: {
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981', // Primary
          600: '#059669', // Success
          700: '#047857',
        },
        orange: {
          400: '#FDBA74',
          500: '#F59E0B', // Primary
          600: '#DC2626', // Warning
        },
        blue: {
          400: '#60A5FA',
          500: '#3B82F6', // Primary
          600: '#0EA5E9', // Info
        },
        success: '#059669',
        warning: '#DC2626',
        info: '#0EA5E9',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        h1: ['32px', '40px'],
        h2: ['24px', '32px'],
        h3: ['20px', '28px'],
        base: ['16px', '24px'],
        sm: ['14px', '20px'],
        xs: ['12px', '16px'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
      },
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 