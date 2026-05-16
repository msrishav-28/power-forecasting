import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartGradients, GlassTooltip } from '../components/charts/ChartComponents'
import { areaGradientIds, chartAxis, chartGrid, chartPalette } from '../components/charts/ChartTheme'
import { BentoCell } from '../components/layout/BentoCell'
import { BentoGrid } from '../components/layout/BentoGrid'
import { PageHeader } from '../components/layout/PageHeader'
import { RightRail } from '../components/layout/RightRail'
import { LiveGridModelPanel } from '../components/module2/LiveGridModelPanel'
import { OutageFeed } from '../components/module2/OutageFeed'
import { KpiCard } from '../components/shared/KpiCard'
import { LLMInsightPanel } from '../components/shared/LLMInsightPanel'
import { SectionCard } from '../components/shared/SectionCard'
import { useDashboardFilters } from '../hooks/use-dashboard-filters'
import { useGridSnapshot, useMetaSnapshot } from '../hooks/use-snapshots'
import { formatNumber, toDateInputValue } from '../lib/format'

const generationColors = [chartPalette.warn, chartPalette.primary, chartPalette.secondary]

export function GridPage() {
  const { filters } = useDashboardFilters()
  const gridQuery = useGridSnapshot()
  const metaQuery = useMetaSnapshot()
  const grid = gridQuery.data

  if (!grid) {
    return null
  }

  const loadSeries = [...grid.loadHistory, ...grid.loadForecast].filter((item) => {
    const date = toDateInputValue(item.date)
    return date >= filters.startDate && date <= filters.endDate
  })
  const filteredOutages = grid.outageFeed.filter((item) => {
    const date = toDateInputValue(item.timestamp)
    const matchesState = filters.states.length === 0 || filters.states.includes(item.state)
    const matchesVoltage = filters.voltageLevel === 'All' || item.voltageKv === filters.voltageLevel
    return matchesState && matchesVoltage && date >= filters.startDate && date <= filters.endDate
  })

  return (
    <div className="space-y-gutter">
      <PageHeader
        eyebrow="Module 02 · System operations"
        title="Grid Operations"
        subtitle="Eastern Region load envelope, frequency, outage causes, and weather-conditioned stress."
        lastUpdated={metaQuery.data?.generatedAt}
      />

      <BentoGrid columns={{ base: 1, sm: 2, lg: 4 }}>
        <KpiCard
          label="Current Demand"
          value={`${formatNumber(grid.currentDemandMw)} MW`}
          delta={`${grid.demandDeltaMw} MW vs last interval`}
          tone="signal"
        />
        <KpiCard label="Grid Frequency" value={`${grid.gridFrequencyHz.toFixed(2)} Hz`} delta="ER-I live average" />
        <KpiCard label="Outages Today" value={String(grid.outagesToday)} delta={`${filteredOutages.length} visible in filter`} />
        <KpiCard
          label="Peak DLL"
          value={`${grid.peakDllPct}%`}
          delta={`${grid.weather.windSpeedMs} m/s wind`}
          tone={grid.peakDllPct > 85 ? 'signal' : 'stable'}
        />
      </BentoGrid>

      <BentoGrid columns={{ base: 1, xl: 12 }}>
        <BentoCell colSpan={{ base: 1, xl: 9 }}>
          <SectionCard title="ER-I load envelope" eyebrow="History + forecast">
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={loadSeries}>
                  <ChartGradients />
                  <CartesianGrid {...chartGrid} />
                  <XAxis dataKey="date" {...chartAxis} />
                  <YAxis {...chartAxis} />
                  <Tooltip content={<GlassTooltip unit=" MW" />} />
                  <Area type="monotone" dataKey="upperMw" fill={`url(#${areaGradientIds.warn})`} stroke="none" />
                  <Area type="monotone" dataKey="lowerMw" fill={`url(#${areaGradientIds.secondary})`} stroke="none" />
                  <Bar dataKey="actualMw" fill={chartPalette.secondary} radius={[10, 10, 0, 0]} />
                  <Line type="monotone" dataKey="forecastMw" stroke={chartPalette.warn} strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </BentoCell>

        <BentoCell colSpan={{ base: 1, xl: 3 }}>
          <RightRail
            predictions={<LiveGridModelPanel grid={grid} />}
            copilot={
              <LLMInsightPanel
                scope="grid"
                title="Grid operations brief"
                prompt="Summarize the load forecast, outage pattern, and DLL context for ER-I operations planning."
                context={{
                  currentDemandMw: grid.currentDemandMw,
                  demandDeltaMw: grid.demandDeltaMw,
                  gridFrequencyHz: grid.gridFrequencyHz,
                  peakDllPct: grid.peakDllPct,
                  outageFeed: filteredOutages,
                  weather: grid.weather,
                }}
              />
            }
          />
        </BentoCell>
      </BentoGrid>

      <BentoGrid columns={{ base: 1, xl: 2 }}>
        <SectionCard title="Recent outage root causes" eyebrow="Filtered feed">
          <OutageFeed items={filteredOutages} />
        </SectionCard>

        <SectionCard title="Generation mix" eyebrow="Current dispatch">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grid.generationMix} layout="vertical">
                <CartesianGrid {...chartGrid} />
                <XAxis type="number" {...chartAxis} />
                <YAxis type="category" dataKey="source" {...chartAxis} width={90} />
                <Tooltip content={<GlassTooltip unit=" MW" />} />
                <Bar dataKey="mw" radius={[0, 12, 12, 0]}>
                  {grid.generationMix.map((entry, index) => (
                    <Cell key={entry.source} fill={generationColors[index % generationColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </BentoGrid>

      <SectionCard title="Failure pattern heatmap" eyebrow="Root cause vs age group">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {grid.failureHeatmap.map((cell) => (
            <div
              key={`${cell.rootCause}-${cell.ageGroup}`}
              className="rounded-card p-4 text-small shadow-insetSoft"
              style={{ backgroundColor: `rgba(255, 107, 53, ${0.12 + cell.ratio * 0.65})` }}
            >
              <p className="font-medium text-ink">{cell.rootCause}</p>
              <p className="mt-1 text-muted">{cell.ageGroup}</p>
              <p className="mt-4 text-h2 font-semibold text-ink">{cell.count}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Weather-conditioned stress signals" eyebrow="Ambient context">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-card bg-recessed/70 p-4 shadow-insetSoft">
            <p className="text-small text-muted">Temperature</p>
            <p className="mt-2 font-semibold text-ink">{grid.weather.temperatureC} deg C</p>
          </div>
          <div className="rounded-card bg-recessed/70 p-4 shadow-insetSoft">
            <p className="text-small text-muted">Wind speed</p>
            <p className="mt-2 font-semibold text-ink">{grid.weather.windSpeedMs} m/s</p>
          </div>
          <div className="rounded-card bg-recessed/70 p-4 shadow-insetSoft">
            <p className="text-small text-muted">Solar radiation</p>
            <p className="mt-2 font-semibold text-ink">{grid.weather.solarRadiationWm2} W/m2</p>
          </div>
          <div className="rounded-card bg-recessed/70 p-4 shadow-insetSoft">
            <p className="text-small text-muted">Rainfall</p>
            <p className="mt-2 font-semibold text-ink">{grid.weather.rainfallMm} mm</p>
          </div>
        </div>
        <div className="mt-5 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={grid.causeDistribution}>
              <ChartGradients />
              <CartesianGrid {...chartGrid} />
              <XAxis dataKey="cause" {...chartAxis} />
              <YAxis {...chartAxis} />
              <Tooltip content={<GlassTooltip />} />
              <Area type="monotone" dataKey="count" stroke={chartPalette.primary} fill={`url(#${areaGradientIds.primary})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  )
}
