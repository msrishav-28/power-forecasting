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

import { LiveGridModelPanel } from '../components/module2/LiveGridModelPanel'
import { OutageFeed } from '../components/module2/OutageFeed'
import { KpiCard } from '../components/shared/KpiCard'
import { LLMInsightPanel } from '../components/shared/LLMInsightPanel'
import { SectionCard } from '../components/shared/SectionCard'
import { useDashboardFilters } from '../hooks/use-dashboard-filters'
import { useGridSnapshot } from '../hooks/use-snapshots'
import { formatNumber, toDateInputValue } from '../lib/format'

const generationColors = ['#ff6b35', '#1d4ed8', '#0f766e']

export function GridPage() {
  const { filters } = useDashboardFilters()
  const gridQuery = useGridSnapshot()
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
    <div className="grid gap-5 2xl:grid-cols-[1.6fr,0.95fr]">
      <div className="space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        </section>

        <SectionCard title="ER-I load envelope" eyebrow="History + forecast">
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={loadSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="upperMw" fill="#ffedd5" stroke="none" />
                <Area type="monotone" dataKey="lowerMw" fill="#f8fafc" stroke="none" />
                <Bar dataKey="actualMw" fill="#0f766e" radius={[10, 10, 0, 0]} />
                <Line type="monotone" dataKey="forecastMw" stroke="#ff6b35" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <div className="grid gap-5 xl:grid-cols-2">
          <SectionCard title="Recent outage root causes" eyebrow="Filtered feed">
            <OutageFeed items={filteredOutages} />
          </SectionCard>

          <SectionCard title="Generation mix" eyebrow="Current dispatch">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grid.generationMix} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="source" tick={{ fontSize: 12 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="mw" radius={[0, 12, 12, 0]}>
                    {grid.generationMix.map((entry, index) => (
                      <Cell key={entry.source} fill={generationColors[index % generationColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Failure pattern heatmap" eyebrow="Root cause vs age group">
          <div className="grid gap-3 md:grid-cols-5">
            {grid.failureHeatmap.map((cell) => (
              <div
                key={`${cell.rootCause}-${cell.ageGroup}`}
                className="rounded-[22px] p-4 text-sm shadow-insetSoft"
                style={{ backgroundColor: `rgba(255, 107, 53, ${0.12 + cell.ratio * 0.65})` }}
              >
                <p className="font-medium text-ink">{cell.rootCause}</p>
                <p className="mt-1 text-muted">{cell.ageGroup}</p>
                <p className="mt-4 text-xl font-semibold text-ink">{cell.count}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Weather-conditioned stress signals" eyebrow="Ambient context">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[22px] bg-recessed/70 p-4 shadow-insetSoft">
              <p className="text-sm text-muted">Temperature</p>
              <p className="mt-2 font-semibold text-ink">{grid.weather.temperatureC} deg C</p>
            </div>
            <div className="rounded-[22px] bg-recessed/70 p-4 shadow-insetSoft">
              <p className="text-sm text-muted">Wind speed</p>
              <p className="mt-2 font-semibold text-ink">{grid.weather.windSpeedMs} m/s</p>
            </div>
            <div className="rounded-[22px] bg-recessed/70 p-4 shadow-insetSoft">
              <p className="text-sm text-muted">Solar radiation</p>
              <p className="mt-2 font-semibold text-ink">{grid.weather.solarRadiationWm2} W/m2</p>
            </div>
            <div className="rounded-[22px] bg-recessed/70 p-4 shadow-insetSoft">
              <p className="text-sm text-muted">Rainfall</p>
              <p className="mt-2 font-semibold text-ink">{grid.weather.rainfallMm} mm</p>
            </div>
          </div>
          <div className="mt-5 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={grid.causeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="cause" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" fill="#1d4ed8" stroke="#1d4ed8" fillOpacity={0.22} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="space-y-4">
        <LiveGridModelPanel grid={grid} />
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
      </div>
    </div>
  )
}
