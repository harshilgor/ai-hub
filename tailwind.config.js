/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'light-bg': '#FAFBFC',
        'light-card': '#FFFFFF',
        'light-text': '#1A1A1A',
        'light-text-secondary': '#6B7280',
        'light-border': '#E5E7EB',
        'dark-bg': '#0F1419',
        'dark-card': '#1A1F2E',
        'dark-text': '#F9FAFB',
        'dark-text-secondary': '#9CA3AF',
        'dark-border': '#2D3748',
        'primary-light': '#2563EB',
        'primary-dark': '#3B82F6',
        'success-light': '#10B981',
        'success-dark': '#34D399',
        'insight-light': '#8B5CF6',
        'insight-dark': '#A78BFA',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 16px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

