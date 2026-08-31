/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f8f7f5',
        surface: '#ffffff',
        ink: '#1a1a1a',
        accent: {
          DEFAULT: '#0d7a5c',
          light: '#0f9b74',
          soft: '#5ab89a',
          wash: '#edf7f3',
          deep: '#0c1924',
          mid: '#1a2937',
        },
        tbs: {
          dark: '#0c1f19',
          mid: '#0a3025',
          green: '#0d7a5c',
          'green-hover': '#0f9b74',
          light: '#f6faf8',
        },
      },
    },
  },
  plugins: [],
};
