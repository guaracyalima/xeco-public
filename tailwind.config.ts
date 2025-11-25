import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Xeco Brand Colors - FONTE ÚNICA DA VERDADE 🎯
        primary: 'var(--primary)',
        coral: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ff5a5f', // COR PRINCIPAL DA PLATAFORMA
          600: '#e54b50', // Hover
          700: '#dc2626',
          800: '#b91c1c',
          900: '#991b1b',
        },
        
        // System colors
        secondary: '#666666',
        success: '#67981a',
        info: '#3f93f3',
        warning: '#ffba00',
        danger: '#ff0000',
        
        // Neutrals
        dark: '#000000',
        white: '#ffffff',
        light: '#f0f0f0',
        gray: {
          DEFAULT: '#999999',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        
        // Legacy support (manter por compatibilidade)
        'darker-light': '#cccccc',
        'lighter-dark': '#262626',
        blue: '#01b3ed',
        cyan: '#0583c5',
        teal: '#67981a',
        orange: '#ffba00',
        green: '#74b100',
        'dark-red': '#cc0000',
        
        // Theme colors
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      fontFamily: {
        'sans': ['var(--font-work-sans)', 'Work Sans', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'DEFAULT': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'primary': '0 8px 24px rgba(var(--primary-rgb), 0.3)',
      },
    },
  },
  plugins: [],
}

export default config