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
          primary: '#edf0fa',
          secondary: '#6a6d7e',
          muted: '#34374a',
          error: 'oklch(0.65 0.18 25)',
          success: 'oklch(0.72 0.10 160)',
          warning: 'oklch(0.80 0.12 85)',
          bg: '#090b10',
          accent: 'oklch(0.88 0.04 240)',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '8px',
        btn: '5px',
        input: '5px',
      },
      backdropBlur: {
        glass:       '40px',
        'glass-card': '48px',
      },
    },
  },
  plugins: [],
}
