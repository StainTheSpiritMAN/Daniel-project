import type { Config } from 'tailwindcss';

const shades = (name: string, steps: number[], base: number) => ({
  DEFAULT: `rgb(var(--${name}-${base}) / <alpha-value>)`,
  ...Object.fromEntries(steps.map((n) => [n, `rgb(var(--${name}-${n}) / <alpha-value>)`])),
});

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette as CSS variables so admins can switch themes at runtime.
        // Defaults (gold + charcoal from the corporate profile) live in
        // globals.css; the active theme is injected by app/layout.tsx.
        gold: shades('gold', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900], 500),
        charcoal: shades('charcoal', [50, 100, 700, 800, 900], 800),
        /** Text colour that stays readable on top of the brand colour. */
        'on-gold': 'rgb(var(--on-gold) / <alpha-value>)',
        /** Section-tone text colours (see globals.css). */
        't-strong': 'rgb(var(--t-strong) / <alpha-value>)',
        't-body': 'rgb(var(--t-body) / <alpha-value>)',
        't-accent': 'rgb(var(--t-accent) / <alpha-value>)',
        't-link': 'rgb(var(--t-link) / <alpha-value>)',
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
