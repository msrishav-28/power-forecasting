/**
 * Shared Recharts styling — constants only.
 * For React components (GlassTooltip, ChartGradients) see ./ChartComponents.tsx.
 */

export const chartPalette = {
  primary: '#1d4ed8', // brandBlue / radar
  secondary: '#0f766e', // brandTeal / sea
  accent: '#6366f1', // brandIndigo
  warn: '#ff6b35', // signal
  ink: '#213547',
  muted: '#5b6577',
} as const

export const chartGrid = {
  stroke: 'rgba(91, 101, 119, 0.10)',
  strokeWidth: 1,
  strokeDasharray: '0',
  vertical: false,
} as const

export const chartAxis = {
  axisLine: false as const,
  tickLine: false as const,
  tick: {
    fill: chartPalette.muted,
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 11,
    letterSpacing: 0.5,
  },
}

/** Defs IDs that pages can reference by string. */
export const areaGradientIds = {
  primary: 'chart-area-primary',
  secondary: 'chart-area-secondary',
  accent: 'chart-area-accent',
  warn: 'chart-area-warn',
}
