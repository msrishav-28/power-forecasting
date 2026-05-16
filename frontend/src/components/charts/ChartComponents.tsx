import { areaGradientIds, chartPalette } from './ChartTheme'

/**
 * <ChartGradients /> — drop once near the top of a chart's <ResponsiveContainer>
 * tree (e.g. inside <ComposedChart>/<AreaChart>) to make gradient fill ids
 * available for Area/Bar fills.
 */
export function ChartGradients() {
  return (
    <defs>
      <linearGradient id={areaGradientIds.primary} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={chartPalette.primary} stopOpacity={0.35} />
        <stop offset="100%" stopColor={chartPalette.primary} stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id={areaGradientIds.secondary} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={chartPalette.secondary} stopOpacity={0.32} />
        <stop offset="100%" stopColor={chartPalette.secondary} stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id={areaGradientIds.accent} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={chartPalette.accent} stopOpacity={0.32} />
        <stop offset="100%" stopColor={chartPalette.accent} stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id={areaGradientIds.warn} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={chartPalette.warn} stopOpacity={0.35} />
        <stop offset="100%" stopColor={chartPalette.warn} stopOpacity={0.02} />
      </linearGradient>
    </defs>
  )
}

interface TooltipPayloadEntry {
  dataKey?: string | number
  name?: string
  value?: number | string
  color?: string
}

interface GlassTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string | number
  /** Optional unit suffix appended to values (e.g. " MW", " %"). */
  unit?: string
  /** Optional label override formatter. */
  labelFormatter?: (label: unknown) => string
}

/**
 * GlassTooltip — drop-in replacement for Recharts default tooltip.
 * Frosted surface, brand-tinted accents, formatted number values.
 */
export function GlassTooltip({ active, payload, label, unit = '', labelFormatter }: GlassTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const renderedLabel = labelFormatter ? labelFormatter(label) : (label ?? '')

  return (
    <div className="rounded-card border border-glassEdge bg-panel/80 px-3 py-2 text-small text-ink shadow-glass backdrop-blur-glass">
      {renderedLabel !== '' && (
        <p className="mb-1 font-mono text-eyebrow uppercase text-muted">{String(renderedLabel)}</p>
      )}
      <ul className="space-y-1">
        {payload.map((item: TooltipPayloadEntry, idx: number) => {
          const value =
            typeof item.value === 'number'
              ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(item.value)
              : String(item.value ?? '')
          return (
            <li key={`${String(item.dataKey ?? idx)}-${idx}`} className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ background: item.color ?? chartPalette.primary }}
              />
              <span className="text-muted">{item.name ?? String(item.dataKey ?? '')}</span>
              <span className="ml-2 font-medium text-ink">
                {value}
                {unit}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
