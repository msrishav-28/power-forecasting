import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { GlassTooltip } from '../components/charts/ChartComponents'
import { chartAxis } from '../components/charts/ChartTheme'
import { BentoCell } from '../components/layout/BentoCell'
import { BentoGrid } from '../components/layout/BentoGrid'
import { PageHeader } from '../components/layout/PageHeader'
import { KpiCard } from '../components/shared/KpiCard'
import { SectionCard } from '../components/shared/SectionCard'
import { useCorridorsSnapshot, useGridSnapshot, useMetaSnapshot } from '../hooks/use-snapshots'
import { formatNumber, riskTone } from '../lib/format'



export function OverviewPage() {
  const metaQuery = useMetaSnapshot()
  const gridQuery = useGridSnapshot()
  const corridorsQuery = useCorridorsSnapshot()

  if (!metaQuery.data) return null

  const meta = metaQuery.data
  const grid = gridQuery.data
  const corridors = corridorsQuery.data

  const loadPreview = grid
    ? [...grid.loadHistory.slice(-14), ...grid.loadForecast.slice(0, 5)]
    : []

  const combinedAlerts = [
    ...(grid?.outageFeed.slice(0, 3) ?? []).map((item) => ({
      kind: 'Grid' as const,
      id: item.lineId,
      label: `${item.lineId} · ${item.state}`,
      detail: `${item.rootCause} · ${item.durationHours}h`,
      severity: item.confidence > 0.8 ? 'critical' : 'warning',
      timestamp: item.timestamp,
    })),
    ...(corridors?.alerts.slice(0, 3) ?? []).map((alert) => ({
      kind: 'Corridor' as const,
      id: alert.segmentId,
      label: `${alert.segmentId} · ${alert.states}`,
      detail: alert.recommendedAction,
      severity: alert.riskLabel,
      timestamp: meta.generatedAt,
    })),
  ]

  return (
    <div className="space-y-gutter">
      <PageHeader
        eyebrow="Mission Overview"
        title={meta.app.title}
        subtitle="Snapshot-first dashboard with live API for predictions and AI insights. Navigate via the sidebar."
        lastUpdated={meta.generatedAt}
      />

      {/* Cross-domain KPIs (Promoted to Top) */}
      <BentoGrid columns={{ base: 1, sm: 2, lg: 4 }}>
        <KpiCard
          label="Current Demand"
          value={grid ? `${formatNumber(grid.currentDemandMw)} MW` : '—'}
          delta={grid ? `${grid.demandDeltaMw} MW vs last interval` : undefined}
          tone="signal"
        />
        <KpiCard
          label="Grid Frequency"
          value={grid ? `${grid.gridFrequencyHz.toFixed(2)} Hz` : '—'}
          delta="ER-I live average"
          tone="stable"
        />
        <KpiCard
          label="Active Outages"
          value={grid ? String(grid.outagesToday) : '—'}
          delta="Today"
        />
        <KpiCard
          label="Corridor Alerts"
          value={corridors ? String(corridors.alerts.length) : '—'}
          delta="High + critical risk"
          tone={corridors && corridors.alerts.length > 5 ? 'signal' : 'stable'}
        />
      </BentoGrid>

      {/* Load forecast preview + recent alerts */}
      <BentoGrid columns={{ base: 1, xl: 5 }}>
        <BentoCell colSpan={{ base: 1, xl: 3 }}>
          <SectionCard
            title="Load forecast preview"
            eyebrow="ER-I · next two weeks"
            action={
              <Link
                to="/dashboard/grid"
                className="inline-flex items-center gap-1 rounded-pill border border-slate-200 bg-white px-3 py-1.5 text-small font-medium text-ink hover:bg-slate-50 transition"
              >
                Open Grid <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          >
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={loadPreview}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" {...chartAxis} />
                  <YAxis {...chartAxis} />
                  <Tooltip content={<GlassTooltip unit=" MW" />} />
                  <Area type="monotone" dataKey="actualMw" stroke="#0f766e" fill="#0f766e" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="forecastMw" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </BentoCell>

        <BentoCell colSpan={{ base: 1, xl: 2 }}>
          <SectionCard title="Recent alerts" eyebrow="Cross-domain feed">
            {combinedAlerts.length === 0 ? (
              <p className="text-small text-muted">No alerts in the current snapshot.</p>
            ) : (
              <ul className="space-y-3">
                {combinedAlerts.map((alert) => (
                  <li
                    key={`${alert.kind}-${alert.id}-${alert.timestamp}`}
                    className="rounded-card border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-eyebrow uppercase text-muted">{alert.kind}</p>
                        <p className="mt-1 truncate font-semibold text-ink">{alert.label}</p>
                        <p className="mt-1 truncate text-small text-muted">{alert.detail}</p>
                      </div>
                      <span className={`shrink-0 rounded-pill px-3 py-1 text-eyebrow font-medium ${riskTone(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </BentoCell>
      </BentoGrid>
    </div>
  )
}
