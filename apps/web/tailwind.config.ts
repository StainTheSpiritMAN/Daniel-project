import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette taken from the corporate profile (gold + charcoal)
        gold: {
          DEFAULT: '#E0A500',
          50: '#FDF8E7',
          100: '#FBEFC2',
          200: '#F6DE84',
          300: '#F1CB46',
          400: '#EBBA1A',
          500: '#E0A500',
          600: '#B98700',
          700: '#8F6800',
          800: '#664A00',
          900: '#3D2D00',
        },
        charcoal: {
          DEFAULT: '#2A2A2A',
          50: '#F5F5F5',
          100: '#E8E8E8',
          700: '#383838',
          800: '#2A2A2A',
          900: '#1C1C1C',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      container: {
        center: true,
        padding: '1.25rem',
        screens: {
          '2xl': '1200px',
        },
      },
    },
  },
  plugins: [],
};

export default config;
