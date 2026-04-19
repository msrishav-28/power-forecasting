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
      },
      boxShadow: {
        panel: '12px 12px 26px rgba(186, 190, 204, 0.9), -10px -10px 24px rgba(255, 255, 255, 0.92)',
        insetSoft: 'inset 6px 6px 12px rgba(186, 190, 204, 0.9), inset -6px -6px 12px rgba(255, 255, 255, 0.9)',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Sora', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        grid: 'radial-gradient(circle at top left, rgba(255,255,255,0.9), transparent 46%), linear-gradient(135deg, rgba(224,229,236,0.94), rgba(209,217,230,0.88))',
      },
    },
  },
  plugins: [],
}
