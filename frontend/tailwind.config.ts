import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#eef1f8',
          100: '#d5ddef',
          200: '#aabbdf',
          300: '#7d98cf',
          400: '#5076bf',
          500: '#2354af',
          600: '#1b408c',
          700: '#152f69',
          800: '#0f1e47',
          900: '#0a1224',
          950: '#060c17',
        },
        gold: {
          50:  '#fdf9ed',
          100: '#faf0cc',
          200: '#f4df99',
          300: '#edcc66',
          400: '#e6b833',
          500: '#c9a227',
          600: '#a07f1f',
          700: '#785f17',
          800: '#503f0f',
          900: '#282007',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;