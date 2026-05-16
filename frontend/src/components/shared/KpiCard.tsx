import { Badge, Card, Metric, Text } from '@tremor/react'

interface KpiCardProps {
  label: string
  value: string
  delta?: string
  tone?: 'default' | 'signal' | 'stable'
}

/**
 * KpiCard — premium tactile KPI tile. Glass surface, subtle top-sheen overlay,
 * gentle lift on hover. Metric uses the bespoke `text-metric` token for a
 * tighter, more scannable display.
 */
export function KpiCard({ label, value, delta, tone = 'default' }: KpiCardProps) {
  const badgeClass =
    tone === 'signal'
      ? 'bg-orange-100 text-orange-700'
      : tone === 'stable'
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-slate-100 text-slate-700'

  return (
    <Card className="group relative overflow-hidden rounded-card border border-glassEdge bg-panel/70 p-pane shadow-glass backdrop-blur-glass transition hover:-translate-y-0.5 hover:shadow-cardHover">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-kpi-sheen" />
      <div className="relative">
        <Text className="font-mono text-eyebrow uppercase text-muted">{label}</Text>
        <Metric className="mt-3 text-metric text-ink">{value}</Metric>
        {delta ? (
          <Badge className={`mt-4 border-0 rounded-pill px-3 py-1 text-eyebrow font-medium ${badgeClass}`}>{delta}</Badge>
        ) : null}
      </div>
    </Card>
  )
}
