import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FDFBF4',
          100: '#FBF5DE',
          200: '#F5E6B3',
          300: '#ECCC73',
          400: '#E5C158',
          500: '#D4AF37', // Royal classic gold
          600: '#B8860B', // Burnished deep gold
          700: '#946B08',
          800: '#6E4F06',
          900: '#423004',
          950: '#231902',
        },
        noir: {
          950: '#07080A',
          900: '#0B0C10', // Ultra dark background
          850: '#0F1017',
          800: '#13141F', // Card background
          750: '#181926', // Elevated card / hover
          700: '#1E2030', // Borders / subtle surfaces
          600: '#2B2D40',
        },
        brand: {
          50: '#FDFBF4',
          100: '#F5E6B3',
          200: '#E5C158',
          300: '#D4AF37',
          400: '#B8860B',
          500: '#D4AF37',
          600: '#B8860B',
          700: '#946B08',
          800: '#6E4F06',
          900: '#423004',
          950: '#231902',
        },
        surface: {
          DEFAULT: '#13141F',
          subtle: '#181926',
          muted: '#1E2030',
          border: 'rgba(212, 175, 55, 0.2)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(212, 175, 55, 0.15)',
        'card-hover': '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 15px 1px rgba(212, 175, 55, 0.25)',
        'gold-glow': '0 0 20px -3px rgba(212, 175, 55, 0.35)',
        'gold-sm': '0 2px 10px rgba(212, 175, 55, 0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
