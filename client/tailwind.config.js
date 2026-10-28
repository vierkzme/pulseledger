/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        panel: 'var(--bg-panel)',
        subtle: 'var(--border-subtle)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        amber: {
          brand: 'var(--accent-amber)',
          text: 'var(--accent-amber-text)',
        },
        status: {
          up: 'var(--status-up)',
          'up-bg': 'var(--status-up-bg)',
          down: 'var(--status-down)',
          'down-bg': 'var(--status-down-bg)',
          'down-text': 'var(--status-down-text)',
          paused: 'var(--status-paused)',
          'paused-bg': 'var(--status-paused-bg)',
          'paused-text': 'var(--status-paused-text)',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
      },
    },
  },
  plugins: [],
};
