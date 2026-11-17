/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        panel: 'var(--bg-panel)',
        card: 'var(--bg-card)',
        subtle: 'var(--border-subtle)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        accent: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          text: 'var(--accent-text)',
        },
        status: {
          up: 'var(--status-up)',
          'up-dot': 'var(--status-up-dot)',
          'up-bg': 'var(--status-up-bg)',
          down: 'var(--status-down)',
          'down-dot': 'var(--status-down-dot)',
          'down-bg': 'var(--status-down-bg)',
          'down-text': 'var(--status-down-text)',
          paused: 'var(--status-paused)',
          'paused-bg': 'var(--status-paused-bg)',
          'paused-text': 'var(--status-paused-text)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
        xs: '0 1px 3px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
