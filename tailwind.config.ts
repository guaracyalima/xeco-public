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
        // TheDir inspired colors
        primary: '#ff5a5f',
        secondary: '#666666',
        dark: '#000000',
        white: '#ffffff',
        // System colors
        success: '#67981a',
        info: '#3f93f3',
        warning: '#ffba00',
        danger: '#ff0000',
        light: '#f0f0f0',
        // Gray scale
        gray: {
          DEFAULT: '#999999',
          '01': '#e8edef',
          '02': '#f5f5f5',
          '03': '#eeeeee',
          '04': '#eef1f2',
          '05': '#ecf0f1',
          '06': '#f0f2f3',
        },
        'darker-light': '#cccccc',
        'lighter-dark': '#262626',
        // Complementary colors
        blue: '#01b3ed',
        cyan: '#0583c5',
        teal: '#67981a',
        orange: '#ffba00',
        green: '#74b100',
        'dark-red': '#cc0000',
        // Default colors
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
        'primary': '0 8px 24px rgba(255, 90, 95, 0.3)',
      },
    },
  },
  plugins: [],
}

export default config