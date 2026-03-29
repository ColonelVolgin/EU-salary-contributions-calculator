/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#8D969E',
          secondary: '#191C1F',
          error: '#D93025',
          success: '#1E8E3E',
          bg: '#05080f',
        },
      },
      fontFamily: {
        heading: ['Aeonik Pro', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '24px',
        btn: '12px',
        input: '8px',
      },
      backdropBlur: {
        glass: '48px',
        'glass-card': '72px',
        'glass-login': '60px',
      },
    },
  },
  plugins: [],
}
