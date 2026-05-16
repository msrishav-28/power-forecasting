import { Activity, ArrowUpRight, BrainCircuit, Satellite, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartGradients, GlassTooltip } from '../components/charts/ChartComponents'
import { areaGradientIds, chartAxis, chartGrid, chartPalette } from '../components/charts/ChartTheme'
import { BentoCell } from '../components/layout/BentoCell'
import { BentoGrid } from '../components/layout/BentoGrid'
import { PageHeader } from '../components/layout/PageHeader'
import { KpiCard } from '../components/shared/KpiCard'
import { SectionCard } from '../components/shared/SectionCard'
import { useCorridorsSnapshot, useGridSnapshot, useMetaSnapshot } from '../hooks/use-snapshots'
import { formatCompact, formatDateTime, formatNumber, riskTone } from '../lib/format'

const modules = [
  {
    to: '/dashboard/assets',
    eyebrow: 'Module 01',
    title: 'Asset Health',
    description: 'Transformer condition, RUL forecasts, anomaly drivers, and field advisories.',
    icon: BrainCircuit,
  },
  {
    to: '/dashboard/grid',
    eyebrow: 'Module 02',
    title: 'Grid Operations',
    description: 'Load envelope, frequency, outage causes, generation mix, weather context.',
    icon: Zap,
  },
  {
    to: '/dashboard/corridors',
    eyebrow: 'Module 03',
    title: 'Corridor Monitor',
    description: 'NDVI vegetation surveillance, encroachment alerts, and Prophet forecasts.',
    icon: Satellite,
  },
]

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
        subtitle="Snapshot-first dashboard with live API for predictions and AI insights. Pick a module to dive in."
        lastUpdated={meta.generatedAt}
      />

      {/* Hero band: landscape image + situational summary */}
      <BentoGrid columns={{ base: 1, xl: 5 }}>
        <BentoCell colSpan={{ base: 1, xl: 3 }}>
          <div className="relative h-full min-h-[280px] overflow-hidden rounded-panel border border-glassEdge shadow-glass">
            <img
              src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1600&q=80"
              alt="Transmission infrastructure landscape at dusk"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-slate-900/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-pane-lg text-white">
              <p className="font-mono text-eyebrow uppercase text-white/70">Snapshot ready</p>
              <p className="mt-2 text-h2 font-semibold leading-tight">{meta.app.region}</p>
              <p className="mt-2 max-w-md text-small leading-6 text-white/85">{meta.app.deployment}</p>
              <p className="mt-3 text-small text-white/70">Last refresh: {formatDateTime(meta.generatedAt)}</p>
            </div>
          </div>
        </BentoCell>

        <BentoCell colSpan={{ base: 1, xl: 2 }}>
          <SectionCard title="Mission status" eyebrow="Situation board">
            <ul className="space-y-3 text-small text-ink">
              <li className="flex items-center justify-between gap-3 rounded-card bg-recessed/60 px-4 py-3 shadow-insetSoft">
                <span className="text-muted">Assets monitored</span>
                <strong className="text-h3">{formatCompact(meta.overview.assetCount)}</strong>
              </li>
              <li className="flex items-center justify-between gap-3 rounded-card bg-recessed/60 px-4 py-3 shadow-insetSoft">
                <span className="text-muted">Critical assets</span>
                <strong className="text-h3">{meta.overview.criticalAssets}</strong>
              </li>
              <li className="flex items-center justify-between gap-3 rounded-card bg-recessed/60 px-4 py-3 shadow-insetSoft">
                <span className="text-muted">High-risk corridors</span>
                <strong className="text-h3">{meta.overview.highRiskCorridors}</strong>
              </li>
              <li className="flex items-center justify-between gap-3 rounded-card bg-recessed/60 px-4 py-3 shadow-insetSoft">
                <span className="text-muted">Sensor readings</span>
                <strong className="text-h3">{formatCompact(meta.overview.sensorReadingCount)}</strong>
              </li>
            </ul>
          </SectionCard>
        </BentoCell>
      </BentoGrid>

      {/* Cross-domain KPIs */}
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
                className="inline-flex items-center gap-1 rounded-pill border border-glassEdge bg-white/60 px-3 py-1.5 text-small font-medium text-ink hover:bg-white/80"
              >
                Open Grid <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          >
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={loadPreview}>
                  <ChartGradients />
                  <CartesianGrid {...chartGrid} />
                  <XAxis dataKey="date" {...chartAxis} />
                  <YAxis {...chartAxis} />
                  <Tooltip content={<GlassTooltip unit=" MW" />} />
                  <Area type="monotone" dataKey="actualMw" stroke={chartPalette.secondary} fill={`url(#${areaGradientIds.secondary})`} />
                  <Area type="monotone" dataKey="forecastMw" stroke={chartPalette.warn} fill={`url(#${areaGradientIds.warn})`} />
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
                    className="rounded-card bg-recessed/60 p-4 shadow-insetSoft"
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

      {/* Module drill-in cards */}
      <BentoGrid columns={{ base: 1, md: 3 }}>
        {modules.map(({ to, eyebrow, title, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group relative overflow-hidden rounded-panel border border-glassEdge bg-panel/70 p-pane shadow-glass backdrop-blur-glass transition hover:-translate-y-0.5 hover:shadow-cardHover"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-white shadow-glass">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-mono text-eyebrow uppercase text-muted">{eyebrow}</p>
                <p className="text-h3 font-semibold text-ink">{title}</p>
              </div>
            </div>
            <p className="mt-4 text-small leading-6 text-muted">{description}</p>
            <p className="mt-5 inline-flex items-center gap-1 text-small font-medium text-ink">
              Open module
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
            </p>
            <Activity className="absolute right-5 top-5 h-4 w-4 text-muted opacity-70" aria-hidden />
          </Link>
        ))}
      </BentoGrid>
    </div>
  )
}
