import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'sv-sky': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          300: '#7dd3fc',
          500: '#0ea5e9',
        },
        'sv-navy': {
          500: '#0f1724',
          700: '#0b1220',
          900: '#071025',
        },
        primary: {
          light: '#0ea5e9',
          dark: '#08203a',
        },
      },
      spacing: {
        'container-gutter': '24px',
      },
      boxShadow: {
        'glass-md': '0 6px 24px rgba(12,18,30,0.12), inset 0 1px 0 rgba(255,255,255,0.03)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        'lg-2': '14px',
      },
    },
  },
  plugins: [],
}
export default config
