import { Badge, Card, Metric, Text } from '@tremor/react'

interface KpiCardProps {
  label: string
  value: string
  delta?: string
  tone?: 'default' | 'signal' | 'stable'
}

export function KpiCard({ label, value, delta, tone = 'default' }: KpiCardProps) {
  const badgeClass =
    tone === 'signal'
      ? 'bg-orange-100 text-orange-700'
      : tone === 'stable'
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-slate-100 text-slate-700'

  return (
    <Card className="rounded-[24px] border-0 bg-panel/90 shadow-panel">
      <Text className="font-mono uppercase tracking-[0.22em] text-muted">{label}</Text>
      <Metric className="mt-3 text-ink">{value}</Metric>
      {delta ? <Badge className={`mt-4 border-0 px-3 py-1 ${badgeClass}`}>{delta}</Badge> : null}
    </Card>
  )
}
