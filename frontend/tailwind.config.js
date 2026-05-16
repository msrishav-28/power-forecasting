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
        // Existing palette (untouched)
        chassis: '#e0e5ec',
        panel: '#f0f2f5',
        recessed: '#d1d9e6',
        outline: '#babecc',
        highlight: '#ffffff',
        signal: '#ff6b35',
        signalDeep: '#d9480f',
        ink: '#213547',
        muted: '#5b6577',
        sea: '#0f766e',
        radar: '#1d4ed8',
        // Signature gradient stops (additive)
        brandTeal: '#0f766e',     // matches existing `sea`
        brandBlue: '#1d4ed8',     // matches existing `radar`
        brandIndigo: '#6366f1',   // new — final stop
        glassEdge: 'rgba(255,255,255,0.45)',
        glassDeep: 'rgba(33,53,71,0.06)',
      },
      fontSize: {
        // Semantic scale: [size, { lineHeight, letterSpacing? }]
        display:  ['2.25rem',  { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        h2:       ['1.5rem',   { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        h3:       ['1.125rem', { lineHeight: '1.35' }],
        metric:   ['2rem',     { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        body:     ['0.9375rem',{ lineHeight: '1.55' }],
        small:    ['0.8125rem',{ lineHeight: '1.5' }],
        eyebrow:  ['0.6875rem',{ lineHeight: '1',    letterSpacing: '0.18em' }],
      },
      borderRadius: {
        panel: '28px',
        card: '24px',
        chip: '14px',
        rail: '34px',
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
      backdropBlur: {
        glass: '14px',
      },
      boxShadow: {
        // Existing (untouched)
        panel: '12px 12px 26px rgba(186, 190, 204, 0.9), -10px -10px 24px rgba(255, 255, 255, 0.92)',
        insetSoft: 'inset 6px 6px 12px rgba(186, 190, 204, 0.9), inset -6px -6px 12px rgba(255, 255, 255, 0.9)',
        // New
        glass: '0 1px 0 rgba(255,255,255,0.6) inset, 0 12px 32px -16px rgba(33,53,71,0.18)',
        cardHover: '0 18px 40px -22px rgba(33,53,71,0.28)',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Sora', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        // Existing (untouched)
        grid: 'radial-gradient(circle at top left, rgba(255,255,255,0.9), transparent 46%), linear-gradient(135deg, rgba(224,229,236,0.94), rgba(209,217,230,0.88))',
        // New signature gradients
        brand: 'linear-gradient(135deg, #0f766e 0%, #1d4ed8 55%, #6366f1 100%)',
        'brand-soft': 'linear-gradient(135deg, rgba(15,118,110,0.18) 0%, rgba(29,78,216,0.18) 55%, rgba(99,102,241,0.20) 100%)',
        'kpi-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        crossFade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
        'fade-up': 'fadeUp 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'cross-fade': 'crossFade 220ms ease-out both',
      },
    },
  },
  plugins: [],
}
