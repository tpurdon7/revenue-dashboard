import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        muted: '#6b7280',
        line: '#e5e7eb',
        brand: '#1f2937',
        accent: '#0ea5e9',
        panel: '#ffffff'
      },
      boxShadow: {
        panel: '0 10px 30px rgba(17, 24, 39, 0.08)'
      },
      fontFamily: {
        sans: ['"Satoshi"', '"Avenir Next"', 'Avenir', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
