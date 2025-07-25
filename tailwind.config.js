/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ocean-blue': '#028ebf',
        'deep-blue': '#0066cc',
        'cyan-glow': '#00d4ff',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(2, 142, 191, 0.3)',
        'glow-lg': '0 0 40px rgba(2, 142, 191, 0.4)',
      }
    },
  },
  plugins: [],
};
