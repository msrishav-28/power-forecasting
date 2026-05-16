/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core Palette
        chassis: '#f8fafc', // Light slate
        panel: '#ffffff',
        recessed: '#f1f5f9',
        outline: '#e2e8f0',
        highlight: '#ffffff',
        signal: '#ef4444', // Tailwind red-500
        signalDeep: '#b91c1c', // Tailwind red-700
        ink: '#0f172a', // Tailwind slate-900
        muted: '#64748b', // Tailwind slate-500
        sea: '#0f766e', // Teal-700
        radar: '#1d4ed8', // Blue-700
        brandTeal: '#0f766e',
        brandBlue: '#1d4ed8',
      },
      fontSize: {
        display:  ['2.25rem',  { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        h2:       ['1.5rem',   { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        h3:       ['1.125rem', { lineHeight: '1.35' }],
        metric:   ['2rem',     { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        body:     ['0.9375rem',{ lineHeight: '1.55' }],
        small:    ['0.8125rem',{ lineHeight: '1.5' }],
        eyebrow:  ['0.6875rem',{ lineHeight: '1',    letterSpacing: '0.18em' }],
      },
      borderRadius: {
        panel: '12px',
        card: '8px',
        chip: '6px',
        rail: '16px',
        pill: '999px',
      },
      spacing: {
        gutter: '1.5rem',
        'gutter-lg': '2rem',
        pane: '1.5rem',
        'pane-lg': '2rem',
      },
      screens: {
        '3xl': '1800px',
      },
      maxWidth: {
        content: '1760px',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 200ms ease-out both',
      },
    },
  },
  plugins: [],
}
