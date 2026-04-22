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
          parchment:  '#f0e4c6',
          vellum:     '#faf3e4',
          oilDark:    '#190f07',
          oilMid:     '#2e1e0d',
          oilWarm:    '#4a3018',
          ink:        '#2c1a0a',
          sepia:      '#7a5535',
          inkFaint:   '#a07850',
          gold:       '#c4953a',
          goldLight:  '#e8c870',
          goldDark:   '#9a7020',
          umber:      '#8b5e30',
          error:      '#7a3010',
          success:    '#4a5c28',
        },
      },
      fontFamily: {
        heading: ['Cormorant Garamond', 'Georgia', 'serif'],
        label:   ['Cinzel', 'Georgia', 'serif'],
        body:    ['EB Garamond', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card:  '14px',
        btn:   '8px',
        input: '10px',
      },
      backdropBlur: {
        glass:       '40px',
        'glass-card': '48px',
      },
    },
  },
  plugins: [],
}
