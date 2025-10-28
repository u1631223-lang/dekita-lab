import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#ff7b54',
        secondary: '#5f6cff',
        surface: '#fff7f0',
        success: '#7fd957',
        warning: '#ffc857'
      },
      fontFamily: {
        display: ['"Noto Sans JP"', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
