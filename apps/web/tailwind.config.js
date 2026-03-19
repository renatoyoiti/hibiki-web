/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        // Dark mode — tokens usados como bg-base, bg-surface, etc.
        'base':           '#0f0f1a',
        'surface':        '#1a1a2e',
        'surface-muted':  '#13132280',
        'elevated':       '#22223b',
        'primary':        '#6c63ff',
        'primary-hover':  '#574fd6',
        'secondary':      '#4a4080',
        'accent':         '#9b8fef',
        'border':         '#2e2b45',
        'danger':         '#e05c7a',
        'warning':        '#f0a857',
        'success':        '#56cfaa',
        // text-* tokens — usados como text-text-primary, text-text-muted, etc.
        'text-primary':   '#e8e6f0',
        'text-secondary': '#a09bbf',
        'text-muted':     '#6b6585',
        // Light mode overrides
        'light-base':           '#f4f3ff',
        'light-surface':        '#ffffff',
        'light-elevated':       '#ebebff',
        'light-primary':        '#5a52d5',
        'light-primary-hover':  '#4840b8',
        'light-text-primary':   '#1a1a2e',
        'light-text-secondary': '#4a4080',
        'light-border':         '#d0cdf0',
      },
      fontSize: {
        'h1': ['2rem', { fontWeight: '700' }],
        'h2': ['1.5rem', { fontWeight: '600' }],
        'h3': ['1.125rem', { fontWeight: '600' }],
        'body': ['1rem', { fontWeight: '400' }],
        'label': ['0.875rem', { fontWeight: '500' }],
        'btn': ['0.875rem', { fontWeight: '600' }],
      },
    },
  },
  plugins: [],
};
